/**
 * Épreuve de bout en bout du pipeline de V2, **contre une vraie base**.
 *
 * `pnpm epreuve:pipeline`
 *
 * ------------------------------------------------------------------------
 * POURQUOI CE SCRIPT EXISTE
 * ------------------------------------------------------------------------
 * `verifier-confinement.ts` lit du code ; les tests unitaires éprouvent des
 * fonctions. Ni l'un ni l'autre ne montre **ce qui arrive réellement en base**.
 * Or c'est exactement là que P2 §6 place la preuve de SEC-04 : « le test n'a pas
 * besoin de faire confiance au code, il lit en base ce qui est réellement
 * parti ». Ce script le fait : il sème un devoir dont le texte porte le prénom
 * de l'enfant — le cas le plus ordinaire du produit, un cahier avec le prénom
 * écrit en haut de la page — puis il relit `calibration_log.payload_ia` et
 * vérifie que le prénom n'y est pas.
 *
 * ------------------------------------------------------------------------
 * CE QU'IL EXIGE, ET CE QU'IL REFUSE
 * ------------------------------------------------------------------------
 * Il exige une base PostgreSQL migrée et semée, et les **bouchons** : aucun
 * compte externe n'existe (ESC-000). Il **refuse de tourner** contre un vrai
 * fournisseur, parce qu'il écrit et efface des lignes de devoirs.
 *
 * Il ne remplace ni P5 ni P6 : c'est une épreuve de producteur, publiée pour
 * que le contrôleur la rejoue plutôt que de me croire.
 */
import { analyserDevoirs, type ProgrammeRendu } from "@/lib/devoirs/analyse";
import { ajouterSaisieManuelle } from "@/lib/devoirs/upload";
import { programmeCourant } from "@/lib/devoirs/programme";
import { getOcrProvider } from "@/lib/ocr";
import { corpusBouchon } from "@/lib/ocr/providers/bouchon";
import { prisma } from "@/lib/db/prisma";
import { enfantCourant, interditsDe } from "@/lib/enfant/courant";
import { estAppError } from "@/lib/errors/app-error";
import { IndicesExercice } from "@/lib/validation/json";
import { env } from "@/config/env";
import { seuils } from "@/config/seuils.config";

function titre(texte: string): void {
  console.info(`\n=== ${texte} ===`);
}

function replier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

async function nettoyer(childId: string): Promise<void> {
  await prisma.homework.deleteMany({ where: { childId } });
  await prisma.family.updateMany({ data: { calibrationActive: true } });
}

async function main(): Promise<void> {
  const secours = process.argv.includes("--secours");
  const e = env();
  if (!secours && (e.AI_PROVIDER !== "bouchon" || e.OCR_PROVIDER !== "bouchon")) {
    throw new Error(
      `Épreuve refusée : AI_PROVIDER=${e.AI_PROVIDER}, OCR_PROVIDER=${e.OCR_PROVIDER}. Ce script écrit et efface des devoirs ; il ne tourne que sur les bouchons.`,
    );
  }

  const enfant = await enfantCourant();
  const interdits = interditsDe(enfant);
  await nettoyer(enfant.id);

  console.info(
    `fournisseurs : AI_PROVIDER=${e.AI_PROVIDER} · OCR_PROVIDER=${e.OCR_PROVIDER}`,
  );
  console.info(
    `seuils en vigueur : ocrConfianceMin=${seuils().ocrConfianceMin} · calibrationNbPhotos=${seuils().calibrationNbPhotos} · dureeSecoursEtapeMin=${seuils().dureeSecoursEtapeMin}`,
  );
  console.info(
    `identifiants interdits : ${interdits.valeurs.length} valeurs (prénom, id enfant, id foyer, nom du foyer) — aucune n'est imprimée ici`,
  );

  if (secours) {
    await epreuveSecours(enfant.id);
    await prisma.$disconnect();
    return;
  }

  // ---------------------------------------------------------------------
  titre("ÉTAPE 2 — OCR : ce que le bouchon rend, et ce que le seuil en fait");
  for (const photo of corpusBouchon()) {
    const verdict =
      photo.texte.trim() === ""
        ? "TIPI_OCR_VIDE"
        : photo.confiance < seuils().ocrConfianceMin
          ? "TIPI_OCR_CONFIANCE_BASSE"
          : "lisible";
    console.info(
      `  ${photo.confiance.toFixed(2)} · ${String(photo.texte.length).padStart(3)} signes · ${verdict.padEnd(24)} ${photo.quoi}`,
    );
  }
  const essai = await getOcrProvider().extraire(Buffer.from("photo-d-epreuve"));
  console.info(
    `  appel réel extraire() : confiance=${essai.confiance} · ${essai.texte.length} signes`,
  );

  // ---------------------------------------------------------------------
  titre("ÉTAPES 3 et 4 — un devoir dont la page porte le prénom de l'enfant");
  const texteAvecPrenom = [
    `${enfant.prenom} — CE1`,
    "Lis le texte à voix haute.",
    "Le petit renard sort du bois.",
    "Calcule : 7 + 5 =",
    "Calcule : 12 - 4 =",
  ].join("\n");
  console.info(`  texte OCR simulé : ${texteAvecPrenom.split("\n").length} lignes, prénom présent en tête`);

  const devoir = await prisma.homework.create({
    data: { childId: enfant.id, texteOcr: texteAvecPrenom, confianceOcr: 0.93 },
  });

  const programme = await analyserDevoirs([devoir.id]);
  imprimerProgramme("programme rendu par l'analyse", programme);

  // ---------------------------------------------------------------------
  titre("SEC-04 — CE QUI EST RÉELLEMENT PARTI, RELU EN BASE");
  const journal = await prisma.calibrationLog.findMany();
  console.info(`  lignes calibration_log : ${journal.length}`);
  for (const ligne of journal) {
    const serialise = JSON.stringify(ligne.payloadIa);
    const platPayload = replier(serialise);
    const platBrut = replier(ligne.texteOcrBrut);
    console.info(`  payload_ia : ${serialise.length} signes · seuil journalisé ${ligne.seuilConfianceApplique} · ${ligne.dureeMs} ms · erreur ${ligne.erreurCode ?? "aucune"}`);
    console.info(`  le texte OCR BRUT journalisé contient le prénom : ${platBrut.includes(replier(enfant.prenom))}  (attendu : true — c'est la photo, elle n'est jamais envoyée)`);
    console.info(`  le PAYLOAD ENVOYÉ contient le prénom            : ${platPayload.includes(replier(enfant.prenom))}  (attendu : FALSE — SEC-04)`);
    for (const valeur of interdits.valeurs) {
      if (platPayload.includes(replier(valeur))) {
        throw new Error("SEC-04 VIOLÉE : un identifiant du foyer est dans le payload journalisé.");
      }
    }
    console.info(`  aucun des ${interdits.valeurs.length} identifiants du foyer n'est dans le payload.`);
    console.info(`  extrait du payload : ${serialise.slice(0, 180)}…`);
  }

  // ---------------------------------------------------------------------
  titre("TEC-07 — les quatre indices, PRÉ-GÉNÉRÉS À L'ANALYSE");
  const exercices = await prisma.exercise.findMany({
    where: { homeworkId: devoir.id },
    orderBy: { ordre: "asc" },
  });
  for (const exercice of exercices) {
    if (exercice.indices === null) {
      console.info(`  « ${exercice.consigne} » → aucun indice (secours à la demande, V5)`);
      continue;
    }
    const lus = IndicesExercice.parse(exercice.indices);
    console.info(`  « ${exercice.consigne} » → ${lus.niveaux.length} indices, source « ${lus.source} »`);
    for (const [rang, niveau] of lus.niveaux.entries()) {
      console.info(`      ${rang + 1}. ${niveau}`);
    }
  }

  // ---------------------------------------------------------------------
  titre("RELECTURE — GET /api/devoirs/programme rend-il EXACTEMENT la même chose ?");
  const relu = await programmeCourant();
  imprimerProgramme("programme relu", relu);
  const identiques =
    JSON.stringify(programme.etapes) === JSON.stringify(relu.etapes) &&
    programme.langueDetectee === relu.langueDetectee;
  console.info(`  identique à l'analyse : ${identiques}  (attendu : true)`);
  if (!identiques) throw new Error("la relecture diverge de l'analyse");

  // ---------------------------------------------------------------------
  titre("PRD-16 — une photo illisible arrête l'analyse, avec le bon code");
  const vide = await prisma.homework.create({
    data: { childId: enfant.id, texteOcr: "", confianceOcr: 0.1 },
  });
  await attendreErreur(() => analyserDevoirs([vide.id]), "TIPI_OCR_VIDE");
  await prisma.homework.delete({ where: { id: vide.id } });

  titre("PRD-16 — un devoir sans aucun exercice exploitable");
  const creux = await prisma.homework.create({
    data: { childId: enfant.id, texteOcr: "…", confianceOcr: 0.9 },
  });
  await attendreErreur(() => analyserDevoirs([creux.id]), "TIPI_AUCUN_EXERCICE");
  await prisma.homework.delete({ where: { id: creux.id } });

  titre("IDEMPOTENCE — deux analyses de suite ne doublent pas les exercices");
  const avant = await prisma.exercise.count({ where: { homeworkId: devoir.id } });
  await analyserDevoirs([devoir.id]);
  const apres = await prisma.exercise.count({ where: { homeworkId: devoir.id } });
  console.info(`  exercices avant : ${avant} · après une seconde analyse : ${apres}  (attendu : égal)`);
  if (avant !== apres) throw new Error("la seconde analyse a doublé les exercices");

  await nettoyer(enfant.id);
  await prisma.$disconnect();
  console.info("\nÉpreuve terminée, base nettoyée.");
}

async function epreuveSecours(childId: string): Promise<void> {
  titre("P2 §11 — SAISIE MANUELLE SANS FOURNISSEUR : « une soirée reste possible »");
  console.info(
    "  AI_PROVIDER pointe un fournisseur injoignable : l'appel doit échouer, et la saisie manuelle passer quand même.",
  );
  const { homeworkId } = await ajouterSaisieManuelle({
    matiere: "maths",
    consigne: "Calcule les additions de la fiche.",
    contenu: "7 + 5 =\n12 - 4 =",
  });
  const programme = await analyserDevoirs([homeworkId]);
  imprimerProgramme("programme obtenu SANS modèle", programme);
  await prisma.homework.deleteMany({ where: { childId } });
}

function imprimerProgramme(quoi: string, programme: ProgrammeRendu): void {
  console.info(`  ${quoi} : langue « ${programme.langueDetectee} », reportés ${JSON.stringify(programme.reportes)}`);
  for (const etape of programme.etapes) {
    console.info(`    étape ${etape.matiere} · ${etape.dureeEstimeeMin} min · ${etape.exercices.length} exercices`);
    for (const exercice of etape.exercices) {
      console.info(`      - ${exercice.consigne}  [${exercice.type}]`);
    }
  }
}

async function attendreErreur(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action();
    throw new Error(`attendu ${code}, rien n'a été levé`);
  } catch (brute) {
    const obtenu = estAppError(brute) ? brute.code : "(pas une AppError)";
    console.info(`  code obtenu : ${obtenu}  (attendu : ${code})`);
    if (obtenu !== code) throw brute;
  }
}

main().catch((brute: unknown) => {
  console.error(brute);
  process.exitCode = 1;
});
