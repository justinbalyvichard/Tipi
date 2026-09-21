/**
 * Épreuve du moteur de session **contre une vraie base** (V3).
 *
 * `pnpm epreuve:session`
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE PROUVE, ET POURQUOI ELLE NE REMPLACE PAS LES TESTS D'UNITÉ
 * ---------------------------------------------------------------------------
 * `machine.test.ts` parcourt les 1 350 triplets de la fonction pure : il
 * prouve ce que la machine **décide**. Il ne peut rien dire de ce que la base
 * **accepte** — l'unique `(session_id, raison)`, le `CHECK` de borne
 * `gem_ledger_delta_borne`, le `CHECK` de cohérence `etat`/`etape_courante`,
 * l'unique partiel « une seule session active par enfant », et l'invariant
 * `gem_balance == SUM(delta)`.
 *
 * Or c'est exactement là que le projet s'est fait prendre : le défaut du
 * constat 26 était invisible à la lecture du code et visible en données. Le
 * contrôle d'architecture l'a démontré **en base**, pas sur le papier.
 *
 * Cette épreuve joue donc les sept chemins d'ARB-13 en données réelles, et
 * vérifie à chaque fois **l'invariant du forfait** : une session finale dont
 * toutes les étapes programmées sont créditées vaut exactement 3 pierres.
 * L'invariant n'est jamais un recalcul de `3 − n` — il compare un décompte de
 * lignes à un total.
 *
 * Prérequis : `DATABASE_URL` pointant sur une base où `prisma migrate deploy`
 * et `supabase/policies.sql` ont été joués. Sans compte externe (ESC-000), une
 * instance PostgreSQL locale suffit — c'est ce qui a été fait, et la sortie est
 * collée dans `docs/agents/P4/V3.out.md`.
 */
import { PrismaClient } from "@prisma/client";

import { TOTAL_SOIREE_COMPLETE } from "@/lib/pierres/bareme";

const prisma = new PrismaClient();

let echecs = 0;
let controles = 0;

function verifier(nom: string, condition: boolean, detail: string): void {
  controles += 1;
  if (!condition) echecs += 1;
  console.info(`[${condition ? "OK    " : "ÉCHEC "}] ${nom}`);
  console.info(`          ${detail}`);
}

interface Contexte {
  readonly childId: string;
  readonly exercices: readonly string[];
}

async function preparer(): Promise<Contexte> {
  const enfant = await prisma.child.findFirst({ orderBy: { createdAt: "asc" } });
  if (enfant === null) throw new Error("Aucun enfant : jouer `pnpm db:seed`.");

  // Remise à zéro des données d'épreuve seulement. Le foyer et l'enfant du
  // seed sont conservés : c'est PRD-02 qui les pose.
  await prisma.gemLedger.deleteMany({ where: { childId: enfant.id } });
  await prisma.session.deleteMany({ where: { childId: enfant.id } });
  await prisma.homework.deleteMany({ where: { childId: enfant.id } });
  await prisma.child.update({ where: { id: enfant.id }, data: { gemBalance: 0 } });

  const devoir = await prisma.homework.create({
    data: { childId: enfant.id, texteOcr: "épreuve", saisieManuelle: true },
  });
  const exercices: string[] = [];
  for (const [rang, matiere] of (["lecture", "maths"] as const).entries()) {
    const exercice = await prisma.exercise.create({
      data: {
        homeworkId: devoir.id,
        consigne: `épreuve ${matiere}`,
        type: "épreuve",
        contenu: "—",
        ordre: rang,
        matiere,
        dureeEstimeeMin: 5,
      },
    });
    exercices.push(exercice.id);
  }
  return { childId: enfant.id, exercices };
}

/** Somme des pierres d'une session, lue en base. */
async function pierres(sessionId: string): Promise<number> {
  const somme = await prisma.gemLedger.aggregate({
    where: { sessionId },
    _sum: { delta: true },
  });
  return somme._sum.delta ?? 0;
}

async function soldeEtSomme(childId: string): Promise<{ solde: number; somme: number }> {
  const enfant = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  const somme = await prisma.gemLedger.aggregate({
    where: { childId },
    _sum: { delta: true },
  });
  return { solde: enfant.gemBalance, somme: somme._sum.delta ?? 0 };
}

async function main(): Promise<void> {
  const contexte = await preparer();
  const { appliquerEvenement, creerSession, colonneDateSoiree } = await import(
    "@/lib/session/service"
  );
  const { cloreSessionsPerimees } = await import("@/lib/session/cloture-automatique");
  const { enregistrerTentative } = await import("@/lib/session/tentatives");

  const lecture = contexte.exercices[0] ?? "";
  const maths = contexte.exercices[1] ?? "";
  const hier = new Date(Date.now() - 36 * 60 * 60 * 1000);

  const deuxEtapes = [
    { matiere: "lecture" as const, exerciseIds: [lecture], dureeEstimeeMin: 5 },
    { matiere: "maths" as const, exerciseIds: [maths], dureeEstimeeMin: 5 },
  ];
  const uneEtape = [{ matiere: "maths" as const, exerciseIds: [maths], dureeEstimeeMin: 5 }];

  let n = 0;
  const id = (): string => {
    n += 1;
    return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  };

  // -------------------------------------------------------------------------
  // CAS 1 — deux étapes, tout terminé (T4 puis T5)
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
    const fin = await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "CLOTURE_VUE", etatAttendu: "cloture" });
    const total = await pierres(session.id);
    verifier(
      "CAS 1 — deux étapes, tout terminé (T4 puis T5)",
      total === TOTAL_SOIREE_COMPLETE && fin.ok,
      `total en base = ${total}, attendu ${TOTAL_SOIREE_COMPLETE} (invariant du forfait, jamais 3 − n recalculé)`,
    );
  }

  // -------------------------------------------------------------------------
  // CAS 2 — Soir léger, une seule étape (T5 d'emblée)
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: uneEtape, soirLeger: true });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "CLOTURE_VUE", etatAttendu: "cloture" });
    const total = await pierres(session.id);
    verifier(
      "CAS 2 — Soir léger, une seule étape terminée",
      total === TOTAL_SOIREE_COMPLETE,
      `total en base = ${total} — ARB-06 : le Soir léger est INDÉTECTABLE dans le coffre`,
    );
  }

  // -------------------------------------------------------------------------
  // CAS 3 — deux étapes, une seule terminée : 1 pierre, aucun bonus
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    await prisma.session.update({ where: { id: session.id }, data: { etat: "termine", endedAt: new Date() } });
    const total = await pierres(session.id);
    verifier("CAS 3 — deux étapes, une seule terminée", total === 1, `total en base = ${total}, attendu 1`);
  }

  // -------------------------------------------------------------------------
  // CAS 4 — `sansDevoir` : aucune étape, aucune pierre, aucun rituel
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: [], soirLeger: false, sansDevoir: true });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    const fin = await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    const total = await pierres(session.id);
    const etat = fin.ok ? fin.session.etat : "—";
    verifier(
      "CAS 4 — sansDevoir (T3)",
      total === 0 && etat === "termine",
      `total = ${total}, état = ${etat} — le forfait ne se verse pas par vacuité`,
    );
  }

  // -------------------------------------------------------------------------
  // CAS 5 — LE CAS DU CONSTAT 26 : tout terminé, dernier `attempt` en_cours
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await enregistrerTentative({ sessionId: session.id, exerciseId: lecture, statut: "terminee" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
    // La tentative de maths RESTE `en_cours` : la route `tentative` n'a jamais
    // été rejouée. Le bonus ne doit pas en dépendre.
    await enregistrerTentative({ sessionId: session.id, exerciseId: maths, statut: "en_cours" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "CLOTURE_VUE", etatAttendu: "cloture" });
    const total = await pierres(session.id);
    verifier(
      "CAS 5 — constat 26 : dernier attempt resté `en_cours`",
      total === TOTAL_SOIREE_COMPLETE,
      `total = ${total} — le bonus lit le LEDGER, jamais les attempt`,
    );
  }

  // -------------------------------------------------------------------------
  // CAS 6 — T12 : tout achevé en base la veille, le dernier appui n'est jamais arrivé
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
    await enregistrerTentative({ sessionId: session.id, exerciseId: lecture, statut: "terminee" });
    await enregistrerTentative({ sessionId: session.id, exerciseId: maths, statut: "terminee" });
    // La soirée est datée d'hier, l'appareil s'est éteint.
    await prisma.session.update({ where: { id: session.id }, data: { date: colonneDateSoiree(hier) } });
    const avant = await pierres(session.id);
    const closes = await cloreSessionsPerimees(contexte.childId);
    const apres = await pierres(session.id);
    const relue = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    verifier(
      "CAS 6 — clôture automatique T12 (ARB-09) : rattrapage PUIS bonus",
      apres === TOTAL_SOIREE_COMPLETE && relue.etat === "termine" && closes.length === 1,
      `avant = ${avant}, après = ${apres}, état = ${relue.etat} — sans ce troisième créditeur, l'enfant perdait une pierre`,
    );
  }

  // -------------------------------------------------------------------------
  // CAS 7 — reprise le soir même : l'unique empêche tout doublon
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    const evenementRejoue = id();
    await appliquerEvenement({ sessionId: session.id, evenementId: evenementRejoue, evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    // Le même appui, rejoué : idempotence (double appui, reprise réseau).
    const rejeu = await appliquerEvenement({ sessionId: session.id, evenementId: evenementRejoue, evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    const apresRejeu = await pierres(session.id);
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "CLOTURE_VUE", etatAttendu: "cloture" });
    const total = await pierres(session.id);
    verifier(
      "CAS 7 — double appui rejoué, puis soirée finie",
      apresRejeu === 1 && total === TOTAL_SOIREE_COMPLETE && rejeu.ok,
      `après rejeu = ${apresRejeu} (et non 2), total final = ${total}`,
    );
  }

  // -------------------------------------------------------------------------
  // PRD-12 — la pause ne retire aucune pierre, et revient sur la même étape
  // -------------------------------------------------------------------------
  {
    const session = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "DEMARRER", etatAttendu: "idle" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
    await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
    const avant = await pierres(session.id);
    const enPause = await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PAUSE_DEMANDEE", etatAttendu: "etape_maths" });
    const pendant = await pierres(session.id);
    const retour = await appliquerEvenement({ sessionId: session.id, evenementId: id(), evenement: "PAUSE_TERMINEE", etatAttendu: "pause" });
    const apres = await pierres(session.id);
    verifier(
      "PRD-12 — pause : aucune pierre retirée, retour sur la MÊME étape",
      avant === pendant &&
        pendant === apres &&
        enPause.ok &&
        enPause.session.etat === "pause" &&
        retour.ok &&
        retour.session.etat === "etape_maths" &&
        retour.session.etapeCourante === 1,
      `pierres ${avant} → ${pendant} → ${apres} · retour sur ${retour.ok ? retour.session.etat : "—"} (index ${retour.ok ? String(retour.session.etapeCourante) : "—"}), sans colonne etat_avant_pause`,
    );
    await prisma.session.update({ where: { id: session.id }, data: { etat: "termine", endedAt: new Date() } });
  }

  // -------------------------------------------------------------------------
  // PRD-18 — une session orpheline de la veille ne bloque JAMAIS la soirée
  // -------------------------------------------------------------------------
  {
    const orpheline = await creerSession(contexte.childId, { etapes: uneEtape, soirLeger: false });
    await prisma.session.update({
      where: { id: orpheline.id },
      data: { date: colonneDateSoiree(hier) },
    });
    // Sans T12 avant la création, l'unique partiel « une seule session active
    // par enfant » refuserait la soirée du jour. C'est l'impasse d'ARB-09.
    await cloreSessionsPerimees(contexte.childId);
    const dujour = await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    const relue = await prisma.session.findUniqueOrThrow({ where: { id: orpheline.id } });
    verifier(
      "ARB-09 — la session de la veille est close, la soirée du jour démarre",
      relue.etat === "termine" && dujour.etat === "idle",
      `veille = ${relue.etat}, soirée du jour = ${dujour.etat}`,
    );
    await prisma.session.update({ where: { id: dujour.id }, data: { etat: "termine", endedAt: new Date() } });
  }

  // -------------------------------------------------------------------------
  // TIPI_SESSION_DEJA_ACTIVE — la garde de la soirée courante
  // -------------------------------------------------------------------------
  {
    const active = await creerSession(contexte.childId, { etapes: uneEtape, soirLeger: false });
    let code = "aucune erreur";
    try {
      await creerSession(contexte.childId, { etapes: deuxEtapes, soirLeger: false });
    } catch (erreur) {
      code = erreur instanceof Error ? (Reflect.get(erreur, "code") ?? erreur.message) : "?";
    }
    verifier(
      "TEC-06 — une seconde session du même soir est refusée proprement",
      code === "TIPI_SESSION_DEJA_ACTIVE",
      `code = ${String(code)} (et non une violation d'unique brute)`,
    );
    await prisma.session.update({ where: { id: active.id }, data: { etat: "termine", endedAt: new Date() } });
  }

  // -------------------------------------------------------------------------
  // SEC-06 — l'invariant du solde, après toute la série
  // -------------------------------------------------------------------------
  {
    const { solde, somme } = await soldeEtSomme(contexte.childId);
    verifier(
      "SEC-06 — gem_balance == SUM(gem_ledger.delta)",
      solde === somme,
      `child.gem_balance = ${solde}, SUM(delta) = ${somme}`,
    );
  }

  // -------------------------------------------------------------------------
  // ARB-13 — le corollaire, sur TOUTES les sessions finales écrites ci-dessus
  // -------------------------------------------------------------------------
  {
    const sessions = await prisma.session.findMany({
      where: { childId: contexte.childId },
      include: { gemLedger: true },
    });
    const fautives: string[] = [];
    for (const session of sessions) {
      const total = session.gemLedger.reduce((somme, ligne) => somme + ligne.delta, 0);
      if (![0, 1, TOTAL_SOIREE_COMPLETE].includes(total)) {
        fautives.push(`${session.id} = ${total}`);
      }
    }
    verifier(
      "ARB-13 — la somme d'une session appartient à {0, 1, 3}, jamais 2",
      fautives.length === 0,
      `${sessions.length} sessions examinées · fautives : ${fautives.join(", ") || "aucune"} — « une session à 2 est une soirée complète dont le bonus manque »`,
    );
  }

  console.info(`\n${controles} contrôles : ${controles - echecs} verts, ${echecs} en échec.`);
  process.exitCode = echecs > 0 ? 1 : 0;
}

main()
  .catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
