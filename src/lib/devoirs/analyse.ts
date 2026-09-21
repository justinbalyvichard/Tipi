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

import {
  assertTexteAnonyme,
  caviarder,
  type IdentifiantsInterdits,
} from "@/lib/ai/anonymisation";
import { ErreurAppelIa } from "@/lib/ai/execution";
import { getAiProvider } from "@/lib/ai";
import type { AiProvider } from "@/lib/ai/provider";
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
 * P2 §11 le pose noir sur blanc : `DEEPSEEK_API_KEY` absente ⇒ « l'analyse
 * renvoie `TIPI_IA_INDISPONIBLE` et le parent bascule sur la saisie manuelle.
 * **Une soirée reste possible.** » Sans ce repli, la phrase serait fausse : la
 * saisie manuelle repasserait par le modèle absent et échouerait pareil.
 *
 * Le repli ne s'applique **qu'**à une saisie manuelle, et pour une raison :
 * le parent y a déjà déclaré la matière et écrit la consigne. Sur une photo, il
 * n'y a rien à structurer sans modèle — inventer une étape à partir d'un texte
 * d'OCR non découpé mettrait l'enfant devant un exercice fabriqué.
 */
function structurationDeSecours(devoir: DevoirLu): AnalysePhoto | null {
  if (!devoir.saisieManuelle || devoir.matiereDeclaree === null) return null;
  const lignes = devoir.texteNormalise.split("\n");
  const consigne = lignes[0] ?? devoir.texteNormalise;
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

async function structurer(
  ia: AiProvider,
  devoir: DevoirLu,
  enfant: EnfantCourant,
  interdits: IdentifiantsInterdits,
): Promise<{ analyse: AnalysePhoto; langue: LangueIa }> {
  // (B) de SEC-04, à l'endroit qui connaît le prénom : une photo de cahier
  // porte très souvent le prénom écrit en haut de la page, et l'OCR le lit.
  const texteAnonyme = caviarder(devoir.texteNormalise, interdits);
  assertTexteAnonyme(texteAnonyme, interdits, `devoir ${devoir.id}`);

  try {
    const { valeur, trace } = await ia.structurerDevoir(texteAnonyme);
    if (!devoir.saisieManuelle) {
      await journaliserCalibration(
        {
          homeworkId: devoir.id,
          familyId: enfant.familyId,
          texteOcrBrut: devoir.texteBrut,
          confianceOcr: devoir.confiance ?? 0,
          payload: trace.payload,
          reponseBrute: trace.reponseBrute,
          erreurCode: null,
          dureeMs: trace.dureeMs,
        },
        interdits,
      );
    }
    return {
      analyse: { homeworkId: devoir.id, etapes: valeur.etapes },
      langue: valeur.langueDetectee,
    };
  } catch (brute) {
    if (brute instanceof ErreurAppelIa) {
      if (!devoir.saisieManuelle) {
        await journaliserCalibration(
          {
            homeworkId: devoir.id,
            familyId: enfant.familyId,
            texteOcrBrut: devoir.texteBrut,
            confianceOcr: devoir.confiance ?? 0,
            payload: brute.trace.payload,
            reponseBrute: brute.trace.reponseBrute,
            erreurCode: brute.code,
            dureeMs: brute.trace.dureeMs,
          },
          interdits,
        );
      }
      const secours = structurationDeSecours(devoir);
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
  exercices: readonly { id: string; consigne: string; type: string; contenu: string }[],
): Promise<number> {
  let pregeneres = 0;
  for (const exercice of exercices) {
    try {
      const { valeur } = await ia.genererIndices({
        consigne: exercice.consigne,
        contenu: exercice.contenu,
        type: exercice.type,
      });
      const indices = IndicesExercice.parse({
        niveaux: valeur.indices,
        source: "pregenere",
      });
      await prisma.exercise.update({
        where: { id: exercice.id },
        data: { indices: indices as unknown as Prisma.InputJsonValue },
      });
      pregeneres += 1;
    } catch {
      // Secours assumé (TEC-07) : `indices` reste nul.
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

  // Étape 4.
  const ia = getAiProvider();
  const structures = await Promise.all(
    lus.map((devoir) => structurer(ia, devoir, enfant, interdits)),
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
    for (const etape of etapes) {
      const exercices: ExerciceRendu[] = [];
      for (const [rang, candidat] of etape.exercices.entries()) {
        const cree = await tx.exercise.create({
          data: {
            homeworkId: candidat.homeworkId,
            consigne: candidat.consigne,
            type: candidat.type,
            contenu: candidat.contenu,
            ordre: rang,
            dureeEstimeeMin: candidat.dureeEstimeeMin,
          },
        });
        exercices.push({ id: cree.id, consigne: cree.consigne, type: cree.type });
      }
      rendues.push({
        matiere: etape.matiere,
        dureeEstimeeMin: etape.dureeEstimeeMin,
        exercices,
      });
      for (const candidat of etape.exercices) {
        await tx.homework.update({
          where: { id: candidat.homeworkId },
          data: { matiere: etape.matiere },
        });
      }
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
            consigne: candidat.consigne,
            type: candidat.type,
            contenu: candidat.contenu,
          }))
        : [],
    )
    .filter((e) => e.id !== "");
  await pregenererIndices(ia, maths);

  return {
    etapes: creees,
    langueDetectee: langueGlobale(structures.map((s) => s.langue)),
    reportes,
  };
}
