/**
 * OCR **bouchonné** — `OCR_PROVIDER="bouchon"`.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE BOUCHON EST
 * ---------------------------------------------------------------------------
 * Il tient la place du service de lecture, et rien d'autre. Les textes qu'il
 * rend jouent le rôle de **la photo** : ce sont des entrées du produit, comme
 * une feuille d'exercice posée sur la table, et non des textes que Tipi écrit.
 * C'est pourquoi ils ne vivent pas dans `content/`, qui porte les textes
 * destinés à l'utilisateur — la même raison qui fait que la sortie d'un modèle
 * n'y vit pas non plus.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE CORPUS CONTIENT DES CAS QUI ÉCHOUENT
 * ---------------------------------------------------------------------------
 * Un bouchon qui réussit toujours ne bouchonne que la moitié du produit. Les
 * quatre états limites de PRD-16 qui dépendent de l'OCR — texte vide, confiance
 * basse — seraient injouables sans compte externe, et personne ne verrait
 * jamais l'écran `parent.scan.illisible.*` avant la recette. Le corpus porte
 * donc **une photo vide et une photo de mauvaise qualité**, et le choix est
 * déterministe : la même photo donne toujours le même résultat, ce qui rend une
 * session de mise au point rejouable.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL NE FAIT PAS
 * ---------------------------------------------------------------------------
 * Il ne regarde pas l'image. Il n'y a rien à regarder sans service de lecture,
 * et prétendre le contraire serait un instrument qui affiche un résultat sans
 * l'avoir mesuré.
 *
 * **Aucun de ces textes ne contient de prénom**, et c'est délibéré : le
 * caviardage de SEC-04 doit être éprouvé par un test qui en pose un
 * explicitement, jamais par un corpus qui en contiendrait par hasard.
 */
import { createHash } from "node:crypto";

import type { OcrProvider, ResultatOcr } from "@/lib/ocr/provider";

export const NOM_OCR_BOUCHON = "bouchon";

interface PhotoSimulee {
  readonly quoi: string;
  readonly texte: string;
  readonly confiance: number;
}

/**
 * Six photos simulées. L'ordre est stable : y insérer une entrée change le
 * résultat de toutes les photos déjà prises en développement.
 */
const CORPUS: readonly PhotoSimulee[] = Object.freeze([
  {
    quoi: "consigne de lecture, français, photo nette",
    texte: [
      "Lecture du soir",
      "Lis le texte à voix haute deux fois.",
      "Le petit renard sort du bois. Il regarde la rivière. L'eau brille au soleil.",
    ].join("\n"),
    confiance: 0.94,
  },
  {
    quoi: "exercices de calcul, photo nette",
    texte: [
      "Calcule.",
      "7 + 5 =",
      "12 - 4 =",
      "6 + 6 =",
      "Combien de billes reste-t-il ?",
    ].join("\n"),
    confiance: 0.91,
  },
  {
    quoi: "page mixte : une consigne en breton et des calculs",
    texte: [
      "Lenn ar pennad-skrid.",
      "Pelec'h emañ al louarn ?",
      "Calcule : 8 + 3 =",
    ].join("\n"),
    confiance: 0.88,
  },
  {
    quoi: "consigne de lecture, français, cahier manuscrit",
    texte: [
      "Relis la poésie.",
      "Apprends les deux premières lignes pour demain.",
      "Le vent souffle sur la colline et fait danser les herbes.",
    ].join("\n"),
    confiance: 0.83,
  },
  {
    quoi: "photo floue — doit tomber sous OCR_CONFIANCE_MIN (PRD-16)",
    texte: "Lis le te... a v... haute",
    confiance: 0.41,
  },
  {
    quoi: "photo ratée — aucun texte lu (PRD-16)",
    texte: "",
    confiance: 0,
  },
]);

/** Choix déterministe : même image, même résultat, indéfiniment. */
function choisir(image: Buffer): PhotoSimulee {
  const empreinte = createHash("sha256").update(image).digest();
  const rang = (empreinte[0] ?? 0) % CORPUS.length;
  return CORPUS[rang] ?? CORPUS[0] ?? { quoi: "vide", texte: "", confiance: 0 };
}

export function ocrBouchon(): OcrProvider {
  return {
    nom: NOM_OCR_BOUCHON,
    extraire(image: Buffer): Promise<ResultatOcr> {
      const photo = choisir(image);
      return Promise.resolve({ texte: photo.texte, confiance: photo.confiance });
    },
  };
}

/** Le corpus, pour qu'un test nomme ce qu'il éprouve plutôt que de le deviner. */
export function corpusBouchon(): readonly PhotoSimulee[] {
  return CORPUS;
}
