/**
 * Le pipeline d'analyse — étapes 2 à 4 de la section 3.2, **SERVEUR UNIQUEMENT**.
 *
 * ---------------------------------------------------------------------------
 * LES CINQ ÉTAPES, ET OÙ CHACUNE VIT
 * ---------------------------------------------------------------------------
 *  1. **Upload** — `src/lib/devoirs/upload.ts` (+ compression client).
 *  2. **OCR** — `src/lib/ocr/**`, appelé ici. Texte vide ou confiance sous
 *     `SEUILS.ocrConfianceMin` ⇒ état « illisible ».
 *  3. **Structuration** — `src/lib/ocr/normalisation.ts`, appelée ici.
 *  4. **Analyse pédagogique** — `src/lib/ai/**`, appelée ici, en **mode texte
 *     uniquement**, sortie validée par Zod, rejouée une fois, puis « illisible ».
 *  5. **Validation parent** — n'est pas ici, et c'est tout le sujet de TEC-06 :
 *     ce module rend un **aperçu**, il ne démarre aucune session. La seule
 *     porte vers `/enfant` est `POST /api/session` (V3), qui exige le programme
 *     validé. Aucune ligne de V2 ne peut créer une session : `src/lib/devoirs/**`
 *     n'écrit dans aucune table `session`, et c'est vérifiable à l'œil comme au
 *     grep.
 *
 * ---------------------------------------------------------------------------
 * UNE PHOTO ILLISIBLE ARRÊTE L'ANALYSE — DÉCISION, ET SON MOTIF
 * ---------------------------------------------------------------------------
 * Le parent prend **une photo par consigne** (PRD-03) : chaque photo est un
 * devoir qu'il a voulu. En écarter une en silence ferait disparaître un devoir
 * sans que personne le voie — et le contrat de sortie n'a aucun champ pour le
 * dire au parent (`reportes` porte le débordement de PED-06, pas l'illisible).
 * Toute photo illisible rend donc `TIPI_OCR_VIDE` ou
 * `TIPI_OCR_CONFIANCE_BASSE`, qui mènent à `parent.scan.illisible.*` : reprendre
 * la photo, ou saisir à la main.
 *
 * Ce choix ne coûte pas le travail déjà fait : **le texte OCR est mémorisé sur
 * la ligne `homework`**, donc relancer l'analyse après avoir repris une seule
 * photo ne refait pas l'OCR des autres — ni la dépense, ni l'attente.
 */
import { Prisma } from "@prisma/client";

import { TexteAnonymise, type IdentifiantsInterdits } from "@/lib/ai/anonymisation";
import { ErreurAppelIa } from "@/lib/ai/execution";
import { getAiProvider, texteDePrompt } from "@/lib/ai";
import type { AiProvider, TraceAppelIa } from "@/lib/ai/provider";
import type { LangueIa, MatiereIa } from "@/lib/ai/schemas";
import { journaliserCalibration } from "@/lib/devoirs/calibration";
import { regrouper, type AnalysePhoto } from "@/lib/devoirs/regroupement";
import { getOcrProvider } from "@/lib/ocr";
import { detecterLangue, normaliserTexteOcr, texteVide } from "@/lib/ocr/normalisation";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { enfantCourant, interditsDe, type EnfantCourant } from "@/lib/enfant/courant";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { telechargerPhoto } from "@/lib/storage/devoirs";
import { IndicesExercice } from "@/lib/validation/json";
import { seuils } from "@/config/seuils.config";

garderServeur("src/lib/devoirs/analyse.ts");

export interface ExerciceRendu {
  readonly id: string;
  readonly consigne: string;
  readonly type: string;
}

export interface EtapeRendue {
  readonly matiere: MatiereIa;
  readonly dureeEstimeeMin: number;
  readonly exercices: readonly ExerciceRendu[];
}

export interface ProgrammeRendu {
  readonly etapes: readonly EtapeRendue[];
  readonly langueDetectee: LangueIa;
  readonly reportes: readonly string[];
}

interface DevoirLu {
  readonly id: string;
  readonly texteBrut: string;
  readonly texteNormalise: string;
  readonly langueLocale: LangueIa;
  readonly confiance: number | null;
  readonly saisieManuelle: boolean;
  readonly matiereDeclaree: MatiereIa | null;
}

// ---------------------------------------------------------------------------
// Étapes 2 et 3 — OCR et normalisation
// ---------------------------------------------------------------------------

async function lireDevoir(
  devoir: {
    id: string;
    photoUrl: string | null;
    texteOcr: string | null;
    confianceOcr: number | null;
    saisieManuelle: boolean;
    matiere: MatiereIa | null;
  },
): Promise<DevoirLu> {
  // Texte déjà connu : saisie manuelle, ou OCR d'une analyse précédente. On ne
  // relit pas une photo déjà lue — c'est ce qui rend une reprise après photo
  // illisible indolore.
  if (devoir.texteOcr !== null && devoir.texteOcr !== "") {
    return {
      id: devoir.id,
      texteBrut: devoir.texteOcr,
      texteNormalise: devoir.texteOcr,
      langueLocale: detecterLangue(devoir.texteOcr).langue,
      confiance: devoir.confianceOcr,
      saisieManuelle: devoir.saisieManuelle,
      matiereDeclaree: devoir.matiere,
    };
  }

  if (devoir.photoUrl === null) {
    throw new AppError("TIPI_OCR_VIDE", "devoir sans photo ni texte");
  }

  const octets = await telechargerPhoto(devoir.photoUrl);
  const { texte, confiance } = await getOcrProvider().extraire(octets);

  if (texteVide(texte)) {
    await prisma.homework.update({
      where: { id: devoir.id },
      data: { confianceOcr: confiance },
    });
    throw new AppError("TIPI_OCR_VIDE", "aucun texte lu sur la photo");
  }
  if (confiance < seuils().ocrConfianceMin) {
    await prisma.homework.update({
      where: { id: devoir.id },
      data: { confianceOcr: confiance },
    });
    throw new AppError(
      "TIPI_OCR_CONFIANCE_BASSE",
      `confiance ${confiance} sous le seuil ${seuils().ocrConfianceMin}`,
    );
  }

  const normalise = normaliserTexteOcr(texte);
  const langue = detecterLangue(normalise).langue;

  await prisma.homework.update({
    where: { id: devoir.id },
    data: { texteOcr: normalise, confianceOcr: confiance, langueDetectee: langue },
  });

  return {
    id: devoir.id,
    texteBrut: texte,
    texteNormalise: normalise,
    langueLocale: langue,
    confiance,
    saisieManuelle: devoir.saisieManuelle,
    matiereDeclaree: devoir.matiere,
  };
}

// ---------------------------------------------------------------------------
// Étape 4 — analyse pédagogique
// ---------------------------------------------------------------------------

/**
 * Structuration **sans modèle**, pour la seule saisie manuelle.
 *
 * P2 §11 le pose noir sur blanc : la clé du fournisseur absente ⇒ « l'analyse
 * renvoie `TIPI_IA_INDISPONIBLE` et le parent bascule sur la saisie manuelle.
 * **Une soirée reste possible.** » Sans ce repli, la phrase serait fausse : la
 * saisie manuelle repasserait par le modèle absent et échouerait pareil.
 *
 * Le repli ne s'applique **qu'**à une saisie manuelle, et pour une raison :
 * le parent y a déjà déclaré la matière et écrit la consigne. Sur une photo, il
 * n'y a rien à structurer sans modèle — inventer une étape à partir d'un texte
 * d'OCR non découpé mettrait l'enfant devant un exercice fabriqué.
 */
function structurationDeSecours(
  devoir: DevoirLu,
  texteAnonyme: TexteAnonymise,
): AnalysePhoto | null {
  if (!devoir.saisieManuelle || devoir.matiereDeclaree === null) return null;
  // CORRIGÉ AU TOUR 2 — [BLOQUANT] B1, point subsidiaire. Le tour 1 découpait
  // `devoir.texteNormalise`, le texte BRUT, là où `structurer()` avait pris
  // soin d'anonymiser vingt lignes plus haut. L'exercice fabriqué portait donc
  // le prénom — en base, à l'écran d'aperçu, et de là dans le prompt 2.
  const lignes = texteAnonyme.valeur.split("\n");
  const consigne = lignes[0] ?? texteAnonyme.valeur;
  const contenu = lignes.slice(1).join("\n");
  return {
    homeworkId: devoir.id,
    etapes: [
      {
        matiere: devoir.matiereDeclaree,
        dureeEstimeeMin: seuils().dureeSecoursEtapeMin,
        exercices: [{ consigne, type: "saisi par le parent", contenu }],
      },
    ],
  };
}

/**
 * Journal des corps réellement émis, par devoir.
 *
 * AJOUTÉ AU TOUR 2 — [MAJEUR] M2. Le tour 1 journalisait **un corps sur
 * trois** : celui du prompt 1, et c'était le seul qui passait par (B). La
 * preuve de SEC-04 nommée par P2 §6 — « le test lit en base ce qui est
 * réellement parti » — ne couvrait donc qu'un tiers de ce qui partait, et c'est
 * la raison mécanique pour laquelle l'épreuve de §6 ne pouvait pas voir B1.
 *
 * Chaque trace est rattachée au devoir dont elle est issue, y compris celles
 * des appels de prompt 2, qui naissent d'un exercice et donc d'une photo.
 */
type JournalTraces = Map<string, TraceAppelIa[]>;

function noter(journal: JournalTraces, homeworkId: string, trace: TraceAppelIa): void {
  const existantes = journal.get(homeworkId) ?? [];
  existantes.push(trace);
  journal.set(homeworkId, existantes);
}

async function structurer(
  ia: AiProvider,
  devoir: DevoirLu,
  interdits: IdentifiantsInterdits,
  journal: JournalTraces,
): Promise<{ analyse: AnalysePhoto; langue: LangueIa }> {
  // (B) de SEC-04, à l'endroit qui connaît le prénom : une photo de cahier
  // porte très souvent le prénom écrit en haut de la page, et l'OCR le lit.
  //
  // CORRIGÉ AU TOUR 2 — [BLOQUANT] B1 : le résultat n'est plus une `string`
  // mais un `TexteAnonymise`, type nominal exigé par `executerPrompt`. Ce
  // n'est donc plus à ce site d'appel de penser à caviarder : c'est au
  // compilateur de refuser qu'on ne l'ait pas fait.
  const texteAnonyme = TexteAnonymise.depuis(
    devoir.texteNormalise,
    interdits,
    `devoir ${devoir.id}`,
  );

  try {
    const { valeur, trace } = await ia.structurerDevoir(texteAnonyme);
    noter(journal, devoir.id, trace);
    return {
      analyse: { homeworkId: devoir.id, etapes: valeur.etapes },
      langue: valeur.langueDetectee,
    };
  } catch (brute) {
    if (brute instanceof ErreurAppelIa) {
      noter(journal, devoir.id, brute.trace);
      const secours = structurationDeSecours(devoir, texteAnonyme);
      if (secours !== null) {
        return { analyse: secours, langue: devoir.langueLocale };
      }
    }
    throw brute;
  }
}

// ---------------------------------------------------------------------------
// TEC-07 — les quatre indices, PRÉ-GÉNÉRÉS À L'ANALYSE
// ---------------------------------------------------------------------------

/**
 * « Les 4 indices de chaque exercice de maths sont pré-générés à l'analyse ;
 * génération dynamique uniquement en secours. »
 *
 * Deux conséquences tenues ici :
 *  - la pré-génération a lieu **maintenant**, pendant que le parent regarde son
 *    aperçu, et jamais pendant que l'enfant attend devant l'écran ;
 *  - un échec de pré-génération **n'arrête pas l'analyse**. `exercise.indices`
 *    reste nul, et `POST /api/indices` (V5) prendra le relais — c'est
 *    exactement le « secours » que TEC-07 prévoit. Faire échouer la soirée
 *    entière parce qu'un indice manque inverserait la règle.
 */
async function pregenererIndices(
  ia: AiProvider,
  exercices: readonly {
    id: string;
    homeworkId: string;
    consigne: string;
    type: string;
    contenu: string;
  }[],
  interdits: IdentifiantsInterdits,
  journal: JournalTraces,
): Promise<number> {
  let pregeneres = 0;
  for (const exercice of exercices) {
    // [BLOQUANT] B1 — LE SITE D'APPEL QUI MANQUAIT AU TOUR 1.
    //
    // La composition a lieu AVANT le caviardage, et le caviardage produit un
    // `TexteAnonymise` : c'est ce type, et non ce commentaire, qui garantit
    // que rien d'autre ne peut être remis à `genererIndices`.
    const texteAnonyme = TexteAnonymise.depuis(
      texteDePrompt({
        consigne: exercice.consigne,
        contenu: exercice.contenu,
        type: exercice.type,
      }),
      interdits,
      `exercice ${exercice.id}`,
    );
    try {
      const { valeur, trace } = await ia.genererIndices(texteAnonyme);
      noter(journal, exercice.homeworkId, trace);
      const indices = IndicesExercice.parse({
        niveaux: valeur.indices,
        source: "pregenere",
      });
      // Même geste que dans `calibration.ts` : on passe par une valeur JSON
      // pure plutôt que par une double assertion de type. Le contenu vient
      // d'être validé par `IndicesExercice`, donc la sérialisation ne peut
      // rien perdre — et aucune ligne du produit ne contourne le typage.
      const valeurJson: Prisma.InputJsonValue = JSON.parse(JSON.stringify(indices));
      await prisma.exercise.update({
        where: { id: exercice.id },
        data: { indices: valeurJson },
      });
      pregeneres += 1;
    } catch (brute) {
      // Secours assumé (TEC-07) : `indices` reste nul. Mais la trace est
      // notée, car TEC-16 veut journaliser ce qui est parti **et** ce qui a
      // échoué : c'est sur les échecs que la calibration est instructive.
      if (brute instanceof ErreurAppelIa) noter(journal, exercice.homeworkId, brute.trace);
      continue;
    }
  }
  return pregeneres;
}

// ---------------------------------------------------------------------------
// Le pipeline
// ---------------------------------------------------------------------------

function langueGlobale(langues: readonly LangueIa[]): LangueIa {
  const distinctes = new Set(langues);
  if (distinctes.size === 0) return "fr";
  if (distinctes.size === 1) return langues[0] ?? "fr";
  return "mixte";
}

export async function analyserDevoirs(
  homeworkIds: readonly string[],
): Promise<ProgrammeRendu> {
  garderServeur("src/lib/devoirs/analyse.ts");
  const enfant = await enfantCourant();
  const interdits = interditsDe(enfant);

  const devoirs = await prisma.homework.findMany({
    where: { id: { in: [...homeworkIds] }, childId: enfant.id },
    orderBy: { createdAt: "asc" },
  });
  if (devoirs.length !== new Set(homeworkIds).size) {
    throw new AppError("TIPI_INTROUVABLE", "un devoir demandé n'appartient pas à cet enfant");
  }

  // Étapes 2 et 3, en parallèle : le budget de latence de P2 §12.1 compte sur
  // des OCR simultanés, et chaque lecture écrit sa propre ligne.
  const lus = await Promise.all(devoirs.map((d) => lireDevoir(d)));

  // Étape 4. `journal` recueille **tous** les corps émis, prompt 2 compris
  // ([MAJEUR] M2), et il est vidé en base quoi qu'il arrive ensuite — succès,
  // OCR illisible, sortie invalide, aucun exercice.
  const ia = getAiProvider();
  const journal: JournalTraces = new Map();
  try {
    return await executerAnalyse(ia, lus, devoirs, interdits, journal);
  } finally {
    await journaliserTout(lus, enfant, interdits, journal);
  }
}

/**
 * Écrit en base **tout** ce qui est parti, un enregistrement par devoir.
 *
 * Appelée depuis un `finally` : une analyse qui échoue est justement celle dont
 * la calibration a le plus à dire. TEC-16 mesure, elle ne gouverne pas — une
 * écriture de journal ne fait jamais échouer une soirée, sauf si le payload
 * n'est pas anonyme, seul cas que `journaliserCalibration` laisse remonter.
 */
async function journaliserTout(
  lus: readonly DevoirLu[],
  enfant: EnfantCourant,
  interdits: IdentifiantsInterdits,
  journal: JournalTraces,
): Promise<void> {
  for (const devoir of lus) {
    if (devoir.saisieManuelle) continue; // TEC-16 parle des photos
    const traces = journal.get(devoir.id) ?? [];
    if (traces.length === 0) continue;
    await journaliserCalibration(
      {
        homeworkId: devoir.id,
        familyId: enfant.familyId,
        texteOcrBrut: devoir.texteBrut,
        confianceOcr: devoir.confiance ?? 0,
        traces,
      },
      interdits,
    );
  }
}

async function executerAnalyse(
  ia: AiProvider,
  lus: readonly DevoirLu[],
  devoirs: readonly { id: string }[],
  interdits: IdentifiantsInterdits,
  journal: JournalTraces,
): Promise<ProgrammeRendu> {
  const structures = await Promise.all(
    lus.map((devoir) => structurer(ia, devoir, interdits, journal)),
  );

  const { etapes, reportes } = regrouper(structures.map((s) => s.analyse));
  if (etapes.length === 0) {
    throw new AppError("TIPI_AUCUN_EXERCICE", "aucun exercice exploitable après regroupement");
  }

  // Persistance, en une transaction : une analyse rejouée remplace la
  // précédente au lieu de s'y ajouter. Sans cela, deux clics sur « Analyser »
  // doubleraient les exercices du soir.
  const ids = devoirs.map((d) => d.id);
  const creees = await prisma.$transaction(async (tx) => {
    await tx.exercise.deleteMany({ where: { homeworkId: { in: ids } } });
    const rendues: { matiere: MatiereIa; dureeEstimeeMin: number; exercices: ExerciceRendu[] }[] =
      [];
    // `ordre` est GLOBAL au programme, pas local à l'étape. C'est lui qui porte
    // l'ordre des étapes entre elles à la relecture : un rang remis à zéro à
    // chaque étape rendrait les deux étapes indiscernables une fois relues.
    let rang = 0;
    const matiereDuDevoir = new Map<string, MatiereIa>();
    for (const etape of etapes) {
      const exercices: ExerciceRendu[] = [];
      for (const candidat of etape.exercices) {
        const cree = await tx.exercise.create({
          data: {
            homeworkId: candidat.homeworkId,
            consigne: candidat.consigne,
            type: candidat.type,
            contenu: candidat.contenu,
            matiere: etape.matiere,
            ordre: rang,
            dureeEstimeeMin: candidat.dureeEstimeeMin,
          },
        });
        rang += 1;
        exercices.push({ id: cree.id, consigne: cree.consigne, type: cree.type });
        // `homework.matiere` reste renseignée — la section 3.7 la déclare —
        // mais elle ne sert plus à ranger : la PREMIÈRE matière rencontrée
        // sur ce devoir est conservée, et l'exercice porte la sienne.
        if (!matiereDuDevoir.has(candidat.homeworkId)) {
          matiereDuDevoir.set(candidat.homeworkId, etape.matiere);
        }
      }
      rendues.push({
        matiere: etape.matiere,
        dureeEstimeeMin: etape.dureeEstimeeMin,
        exercices,
      });
    }
    for (const [homeworkId, matiere] of matiereDuDevoir) {
      await tx.homework.update({ where: { id: homeworkId }, data: { matiere } });
    }
    return rendues;
  });

  // TEC-07 — hors transaction : une pré-génération lente ne doit pas tenir un
  // verrou sur les tables pendant huit secondes.
  const maths = etapes
    .flatMap((etape, index) =>
      etape.matiere === "maths"
        ? etape.exercices.map((candidat, rang) => ({
            id: creees[index]?.exercices[rang]?.id ?? "",
            homeworkId: candidat.homeworkId,
            consigne: candidat.consigne,
            type: candidat.type,
            contenu: candidat.contenu,
          }))
        : [],
    )
    .filter((e) => e.id !== "");
  await pregenererIndices(ia, maths, interdits, journal);

  return {
    etapes: creees,
    langueDetectee: langueGlobale(structures.map((s) => s.langue)),
    reportes,
  };
}
