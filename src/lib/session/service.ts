/**
 * Service de session — **SERVEUR UNIQUEMENT** (TEC-10, TEC-18, PRD-18).
 *
 * La machine décide, ce module exécute. Une transition = **une transaction**,
 * et la persistance est écrite **à chaque transition**, jamais seulement en fin
 * de soirée : c'est PRD-18, et c'est ce qui fait qu'une coupure laisse soit
 * l'ancien état complet, soit le nouvel état complet.
 *
 * Les sept étapes de P2 §9.3, dans l'ordre, et toutes ici :
 *  1. `SELECT … FOR UPDATE` sur la session — le verrou, qui protège du double
 *     appui autant que de deux onglets ouverts ;
 *  2. `evenementId` déjà dans `session.evenements` → snapshot, fin ;
 *  3. `etatAttendu` différent de l'état persisté → `409`, sans écriture ;
 *  4. la machine calcule la transition (fonction pure, sans base) ;
 *  5. les effets de bord, **dont les crédits de pierres** ;
 *  6. `UPDATE session` : état, étape courante, horodatages, journal augmenté ;
 *  7. commit.
 *
 * **Le crédit est dans la transaction** (P2 §9.4, constat 4). S'il échoue, la
 * transition est annulée : l'état n'avance pas, aucune pierre n'est écrite à
 * moitié, et l'invariant `gem_balance == SUM(delta)` n'est jamais violé, même
 * transitoirement. Il n'existe aucune réponse `creditDiffere`.
 */
import { Prisma, type Session } from "@prisma/client";

import { seuils } from "@/config/seuils.config";
import { dateSoiree } from "@/lib/dates/soiree";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import {
  crediterBonusSiSoireeComplete,
  crediterEtape,
  pierresDeLaSession,
  type ContexteCredit,
} from "@/lib/pierres/service";
import { etapeAchevee } from "@/lib/session/etapes";
import { appliquer } from "@/lib/session/machine";
import {
  ETATS_FINAUX,
  type Effet,
  type EtatSession,
  type Evenement,
  type Snapshot,
} from "@/lib/session/types";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import {
  EtapesPrevues,
  JournalEvenements,
  lireJson,
  type EtapePrevue,
  type EvenementJournal,
} from "@/lib/validation/json";

garderServeur("src/lib/session/service.ts");

type Tx = Prisma.TransactionClient;

/**
 * Le verrou de l'étape 1. C'est le seul SQL brut du périmètre de V3, et il est
 * irréductible : ni Prisma ni une contrainte ne savent exprimer un
 * `SELECT … FOR UPDATE`. Le paramètre est lié par le gabarit `Prisma.sql`,
 * jamais concaténé.
 */
async function verrouiller(tx: Tx, sessionId: string): Promise<void> {
  await tx.$queryRaw<readonly { readonly id: string }[]>`
    SELECT id FROM "session" WHERE id = ${sessionId}::uuid FOR UPDATE
  `;
}

function etapesDe(session: Session): readonly EtapePrevue[] {
  return lireJson(EtapesPrevues, "session.etapes_prevues", session.etapesPrevues);
}

function journalDe(session: Session): readonly EvenementJournal[] {
  return lireJson(JournalEvenements, "session.evenements", session.evenements);
}

/**
 * Le cliché de P2 §8.3. `indicesDejaVus` vient de `attempt.nb_indices_utilises`
 * — c'est lui qui fait tenir la reprise de PRD-18 : les indices déjà déroulés
 * restent déroulés. Aucune information de reprise n'est lue dans le navigateur.
 */
async function snapshotDe(tx: Tx, session: Session): Promise<Snapshot> {
  const etapes = etapesDe(session);
  const index = session.etapeCourante;
  const etape = index === null ? undefined : etapes[index];
  const exerciceCourant = await exerciceEnCours(tx, session.id, etape);
  const indices =
    exerciceCourant === null
      ? 0
      : ((
          await tx.attempt.findUnique({
            where: { sessionId_exerciseId: { sessionId: session.id, exerciseId: exerciceCourant } },
            select: { nbIndicesUtilises: true },
          })
        )?.nbIndicesUtilises ?? 0);

  return {
    id: session.id,
    etat: session.etat,
    etapeCourante: index,
    etapes,
    matiereCourante: etape?.matiere ?? null,
    exerciceCourant,
    indicesDejaVus: indices,
    soirLeger: session.soirLeger,
    arretParent: session.arretParent,
    pierresDuSoir: await pierresDeLaSession(tx, session.id),
  };
}

/**
 * Le premier exercice de l'étape courante qui n'a pas de statut final : c'est
 * là que l'enfant s'était arrêté (PRD-18). Aucun exercice restant → le dernier,
 * pour que l'écran ait toujours quelque chose à montrer plutôt qu'un vide.
 */
async function exerciceEnCours(
  tx: Tx,
  sessionId: string,
  etape: EtapePrevue | undefined,
): Promise<string | null> {
  if (etape === undefined) return null;
  const tentatives = await tx.attempt.findMany({
    where: { sessionId, exerciseId: { in: [...etape.exerciseIds] } },
    select: { exerciseId: true, statut: true },
  });
  const finis = new Set(tentatives.filter((t) => t.statut !== "en_cours").map((t) => t.exerciseId));
  return etape.exerciseIds.find((id) => !finis.has(id)) ?? etape.exerciseIds.at(-1) ?? null;
}

export interface DemandeTransition {
  readonly sessionId: string;
  readonly evenementId: string;
  readonly evenement: Evenement;
  readonly etatAttendu: EtatSession;
}

export type ResultatAppel =
  | { readonly ok: true; readonly session: Snapshot; readonly pierresCreditees: number }
  | {
      readonly ok: false;
      readonly code: "TIPI_TRANSITION_INVALIDE";
      readonly session: Snapshot;
      readonly motif: string;
    };

/**
 * Applique un événement à une session, en une transaction.
 *
 * Le refus n'est pas une exception : le contrat de P2 §8.3 exige que le `409`
 * porte **le snapshot courant**, pour que le client se recale sans rien perdre.
 * Une `AppError` ne transporte qu'un code ; le refus est donc une valeur.
 */
export async function appliquerEvenement(demande: DemandeTransition): Promise<ResultatAppel> {
  garderServeur("src/lib/session/service.ts");
  return prisma.$transaction(async (tx) => {
    await verrouiller(tx, demande.sessionId);

    const session = await tx.session.findUnique({ where: { id: demande.sessionId } });
    if (session === null) {
      throw new AppError("TIPI_SESSION_INTROUVABLE", `session ${demande.sessionId}`);
    }

    // Étape 2 — idempotence. Un double appui, ou une reprise réseau avec le
    // même `evenementId`, rend le snapshot SANS aucun effet de bord.
    const journal = journalDe(session);
    if (journal.some((ligne) => ligne.evenementId === demande.evenementId)) {
      return { ok: true, session: await snapshotDe(tx, session), pierresCreditees: 0 };
    }

    // Étape 3 — le client dit de quel état il croit partir.
    if (demande.etatAttendu !== session.etat) {
      return {
        ok: false,
        code: "TIPI_TRANSITION_INVALIDE",
        session: await snapshotDe(tx, session),
        motif: `état attendu ${demande.etatAttendu}, état persisté ${session.etat}.`,
      };
    }

    const etapes = etapesDe(session);

    // PED-08 — le seuil de blocage est une valeur de configuration (TEC-16),
    // donc serveur. La machine ne le connaît pas : elle n'a pas à connaître un
    // réglage. Il est évalué ici, avant elle.
    if (demande.evenement === "BLOCAGE") {
      const refus = await refusDeBlocage(tx, session, etapes);
      if (refus !== null) {
        return {
          ok: false,
          code: "TIPI_TRANSITION_INVALIDE",
          session: await snapshotDe(tx, session),
          motif: refus,
        };
      }
    }

    // Étape 4 — la fonction pure.
    const resultat = appliquer(session.etat, demande.evenement, {
      etapes,
      etapeCourante: session.etapeCourante,
    });
    if (!resultat.ok) {
      return {
        ok: false,
        code: "TIPI_TRANSITION_INVALIDE",
        session: await snapshotDe(tx, session),
        motif: resultat.motif,
      };
    }

    // Étape 5 — les effets, dans l'ordre où la machine les a posés.
    const maintenant = new Date();
    const contexte: ContexteCredit = { sessionId: session.id, childId: session.childId };
    const champs: Prisma.SessionUpdateInput = {};
    let pierres = 0;

    for (const effet of resultat.transition.effets) {
      pierres += await executerEffet(tx, effet, {
        session,
        etapes,
        contexte,
        maintenant,
        champs,
      });
    }

    // Étapes 6 et 7 — un seul UPDATE, puis commit.
    const ligne: EvenementJournal = {
      evenementId: demande.evenementId,
      evenement: demande.evenement,
      de: session.etat,
      vers: resultat.transition.vers,
      at: maintenant.toISOString(),
    };
    const apres = await tx.session.update({
      where: { id: session.id },
      data: {
        ...champs,
        etat: resultat.transition.vers,
        etapeCourante: resultat.transition.etapeCourante,
        evenements: [...journal, ligne],
      },
    });

    return { ok: true, session: await snapshotDe(tx, apres), pierresCreditees: pierres };
  });
}

interface ContexteEffet {
  readonly session: Session;
  readonly etapes: readonly EtapePrevue[];
  readonly contexte: ContexteCredit;
  readonly maintenant: Date;
  readonly champs: Prisma.SessionUpdateInput;
}

/**
 * Exécute un effet et rend les pierres créditées.
 *
 * Le `switch` est **exhaustif sur `Effet["type"]`** : ajouter un effet à la
 * machine sans l'exécuter ici casse la compilation. C'est la quantification
 * que le compilateur sait faire et qu'une liste de `if` ne fait pas.
 */
async function executerEffet(tx: Tx, effet: Effet, c: ContexteEffet): Promise<number> {
  switch (effet.type) {
    case "demarrer":
      c.champs.startedAt = c.maintenant;
      return 0;
    case "crediter_etape":
      return crediterEtape(tx, c.contexte, effet.matiere);
    case "rattraper_etapes_achevees":
      return rattraperEtapesAchevees(tx, c.session, c.etapes, c.contexte);
    case "crediter_bonus_si_complete":
      return crediterBonusSiSoireeComplete(tx, c.contexte, c.etapes.length);
    case "terminer":
      c.champs.endedAt = c.maintenant;
      return 0;
    case "arret_parent":
      c.champs.arretParent = true;
      return 0;
    case "fait":
      // Le fait est déjà porté par la ligne de journal écrite à l'étape 6 :
      // `session.evenements` EST la source des observations du résumé (PRD-06).
      // Aucune pierre, dans aucun sens — la pause n'est pas un abandon (PRD-12).
      return 0;
  }
}

/**
 * Crédite les étapes **achevées et non encore créditées** (T10, T12).
 *
 * Fondé sur `etapeAchevee()`, donc sur les `attempt`. C'est le seul usage
 * légitime des `attempt` dans le crédit : décider **quelles étapes rattraper**.
 * Le bonus, lui, ne les lit jamais (P2 §9.5).
 *
 * L'ordre importe et il est interne à la transaction : ces lignes s'écrivent
 * AVANT l'appel au bonus, parce que la machine a posé les effets dans cet
 * ordre. `crediter()` est idempotent, donc une étape déjà créditée rend 0.
 */
async function rattraperEtapesAchevees(
  tx: Tx,
  session: Session,
  etapes: readonly EtapePrevue[],
  contexte: ContexteCredit,
): Promise<number> {
  if (etapes.length === 0) return 0;
  const tentatives = await tx.attempt.findMany({
    where: { sessionId: session.id },
    select: { exerciseId: true, statut: true },
  });
  let total = 0;
  for (const etape of etapes) {
    if (!etapeAchevee(etape, tentatives)) continue;
    total += await crediterEtape(tx, contexte, etape.matiere);
  }
  return total;
}

/**
 * PED-08 — « après 3 sollicitations sans réponse exploitable ». Rend le motif
 * du refus, ou `null` si le seuil est atteint.
 */
async function refusDeBlocage(
  tx: Tx,
  session: Session,
  etapes: readonly EtapePrevue[],
): Promise<string | null> {
  const index = session.etapeCourante;
  const etape = index === null ? undefined : etapes[index];
  if (etape === undefined) return "aucune étape courante : le blocage n'a pas de sujet.";
  const pire = await tx.attempt.aggregate({
    where: { sessionId: session.id, exerciseId: { in: [...etape.exerciseIds] } },
    _max: { nbSollicitations: true },
  });
  const atteint = pire._max.nbSollicitations ?? 0;
  const requis = seuils().blocageNbSollicitations;
  if (atteint >= requis) return null;
  return `blocage demandé après ${atteint} sollicitation(s), seuil PED-08 à ${requis}.`;
}

// ---------------------------------------------------------------------------
// Lecture et création
// ---------------------------------------------------------------------------

/** `GET /api/session/{id}` — la reprise (PRD-18). */
export async function lireSession(sessionId: string): Promise<Snapshot> {
  garderServeur("src/lib/session/service.ts");
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { id: sessionId } });
    if (session === null) {
      throw new AppError("TIPI_SESSION_INTROUVABLE", `session ${sessionId}`);
    }
    return snapshotDe(tx, session);
  });
}

export interface DemandeCreation {
  readonly etapes: readonly {
    readonly matiere: EtapePrevue["matiere"];
    readonly exerciseIds: readonly string[];
    readonly dureeEstimeeMin: number;
  }[];
  readonly soirLeger: boolean;
  readonly sansDevoir?: boolean;
}

/**
 * `POST /api/session` — TEC-06 : la seule porte d'entrée vers `/enfant`.
 *
 * Les gardes de P2 §8.3, chacune avec son exigence :
 *  - plus de `ETAPES_MAX_PAR_SOIREE` étapes → `TIPI_VALIDATION` (PED-06) ;
 *  - une étape sans exercice → `TIPI_ETAPE_SANS_EXERCICE` (ARB-08) ;
 *  - deux étapes de même matière → `TIPI_ETAPES_MEME_MATIERE`, sans quoi le
 *    second crédit échouerait sur l'unique `(session_id, raison)` et l'enfant
 *    perdrait une pierre (constat 9, réserve P5-03) ;
 *  - une session active **de la soirée courante** → `TIPI_SESSION_DEJA_ACTIVE`,
 *    avec son identifiant pour que l'interface propose de reprendre (PRD-18) ;
 *  - un programme vide sans le drapeau `sansDevoir` → refusé : un programme
 *    vide accidentel reste une erreur.
 */
export async function creerSession(
  childId: string,
  demande: DemandeCreation,
  maintenant: Date = new Date(),
): Promise<Snapshot> {
  garderServeur("src/lib/session/service.ts");

  if (demande.etapes.length === 0 && demande.sansDevoir !== true) {
    throw new AppError(
      "TIPI_ETAPE_SANS_EXERCICE",
      "programme vide sans le drapeau sansDevoir (P2 §8.3).",
    );
  }
  for (const etape of demande.etapes) {
    if (etape.exerciseIds.length === 0) {
      throw new AppError("TIPI_ETAPE_SANS_EXERCICE", `étape ${etape.matiere} sans exercice.`);
    }
  }
  const matieres = demande.etapes.map((e) => e.matiere);
  if (new Set(matieres).size !== matieres.length) {
    throw new AppError(
      "TIPI_ETAPES_MEME_MATIERE",
      "deux étapes de la même matière : le second crédit échouerait sur l'unique (session_id, raison).",
    );
  }

  const etapesPrevues: EtapePrevue[] = demande.etapes.map((etape, ordre) => ({
    matiere: etape.matiere,
    ordre,
    dureeEstimeeMin: etape.dureeEstimeeMin,
    exerciseIds: [...etape.exerciseIds],
  }));
  // Le schéma porte PED-06 (`.max(2)`) et ARB-08 (`exerciseIds` non vide) :
  // la validation finale passe par lui, et non par une seconde liste de `if`.
  const valide = EtapesPrevues.safeParse(etapesPrevues);
  if (!valide.success) {
    throw new AppError("TIPI_VALIDATION", `etapes: ${valide.error.issues[0]?.message ?? ""}`);
  }

  const soiree = colonneDateSoiree(maintenant);

  return prisma.$transaction(async (tx) => {
    // « Session active de la soirée courante » : la garde est bornée par la
    // DATE (ARB-09). Une session orpheline de la veille ne doit jamais
    // empêcher le parent de lancer la soirée — elle est close par T12, jamais
    // opposée au parent.
    const active = await tx.session.findFirst({
      where: { childId, etat: { notIn: [...ETATS_FINAUX] }, date: soiree },
      select: { id: true },
    });
    if (active !== null) {
      throw new AppError("TIPI_SESSION_DEJA_ACTIVE", active.id);
    }
    const creee = await tx.session.create({
      data: {
        childId,
        date: soiree,
        etat: "idle",
        etapesPrevues: valide.data,
        soirLeger: demande.soirLeger,
      },
    });
    return snapshotDe(tx, creee);
  });
}

/**
 * La soirée courante, sous la forme d'une colonne `@db.Date` : minuit **UTC**,
 * comme Prisma la rend et comme `partiesDateSeule()` la relit. Une date sans
 * heure se lit en UTC, toujours (`src/lib/dates/soiree.ts`).
 */
export function colonneDateSoiree(instant: Date): Date {
  return new Date(`${dateSoiree(instant)}T00:00:00.000Z`);
}
