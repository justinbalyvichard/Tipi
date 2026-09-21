/**
 * Substitution des jetons de contenu — **SERVEUR UNIQUEMENT** (P2, §2, SEC-04).
 *
 * Pourquoi serveur : le prénom de l'enfant est une donnée identifiante. Il est
 * lu depuis `child.prenom` et injecté au rendu, côté serveur. Il n'existe
 * aucun chemin par lequel il puisse partir vers un fournisseur d'IA : le
 * payload d'IA est construit à partir d'un autre type, qui ne connaît pas
 * l'enfant (P2, D4).
 *
 * ARB-01 : le prénom est un jeton `{prenom}` dans TOUTE chaîne de contenu,
 * écrans parent compris. « Evan » ne subsiste que dans la prose qui parle de
 * lui comme personne réelle.
 *
 * ARB-14, et c'est la règle qui coûte le plus cher si on l'oublie : **un jeton
 * emporte son genre, son nombre et son article.** `{matiere}` vaut « la
 * lecture » ou « les maths », article compris. Un texte de contenu ne doit
 * s'accorder avec aucun jeton. Ce module ne fait donc AUCUNE grammaire : il
 * remplace, littéralement. Il n'y aura jamais ici de « le/la » calculé.
 *
 * Exception inscrite par ARB-14, pour que personne ne la « répare » plus tard :
 * « Je suis contente de te voir » reste au féminin — le genre y est celui de
 * Pilou, dont TEC-08 fige la voix pour toute la durée de vie de l'application.
 */
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/content/jetons.ts");

/** Les jetons connus des quatre fichiers de `content/`, et rien d'autre. */
export const JETONS_CONNUS = [
  "{prenom}",
  "{matiere}",
  "{matieres}",
  "{n}",
  "{date}",
  "{duree}",
  "{liste}",
  "{version}",
] as const;

export type Jeton = (typeof JETONS_CONNUS)[number];

export type ValeursJetons = Partial<Record<Jeton, string>>;

const MOTIF_JETON = /\{[a-z_]+\}/gu;

/** Les jetons réellement présents dans un texte, dans l'ordre d'apparition. */
export function jetonsPresents(texte: string): readonly string[] {
  return texte.match(MOTIF_JETON) ?? [];
}

/**
 * Rend un texte de contenu en substituant ses jetons.
 *
 * Deux refus explicites, parce qu'un texte à moitié rendu est pire qu'un
 * écran qui tombe — il se lit comme du texte et passe la recette :
 *  - un jeton présent dans le texte et absent de `valeurs` LÈVE ;
 *  - un jeton inconnu de `JETONS_CONNUS` LÈVE, même si une valeur est fournie.
 *
 * Aucune valeur n'est échappée ni transformée : ce sont des textes, pas du
 * HTML, et React les rend comme du texte.
 */
export function rendre(texte: string, valeurs: ValeursJetons = {}): string {
  let rendu = texte;
  for (const jeton of jetonsPresents(texte)) {
    if (!(JETONS_CONNUS as readonly string[]).includes(jeton)) {
      throw new Error(
        `Jeton inconnu dans un texte de content/ : ${jeton}. Les jetons connus sont ${JETONS_CONNUS.join(", ")}.`,
      );
    }
    const valeur = valeurs[jeton as Jeton];
    if (valeur === undefined) {
      throw new Error(
        `Jeton ${jeton} sans valeur au rendu. Un texte à moitié rendu ne doit jamais atteindre un écran.`,
      );
    }
    rendu = rendu.split(jeton).join(valeur);
  }
  return rendu;
}

/**
 * Vrai si le texte ne contient plus aucun jeton. Garde de dernière ligne,
 * à poser devant un TTS : Pilou ne doit jamais prononcer « accolade prénom ».
 */
export function estEntierementRendu(texte: string): boolean {
  return jetonsPresents(texte).length === 0;
}
