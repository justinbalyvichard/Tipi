/**
 * Tirage d'une variante dans une situation (ARB-04, PED-11).
 *
 * Règle `selection` de `content/encouragements.json`, reprise mot pour mot :
 * « Tirage aleatoire sans repetition immediate dans la liste variantes de la
 * situation concernee. »
 *
 * Deux décisions d'implémentation, et leurs motifs :
 *  - **La source d'aléa est un paramètre.** Un tirage non injectable ne se
 *    teste qu'en statistique, et un test statistique ne dit rien d'un défaut
 *    de raccordement. Ici, un contrôleur passe une suite déterministe et
 *    constate l'ordre exact.
 *  - **L'historique est porté par l'appelant**, jamais par un état global. Deux
 *    situations jouées dans la même soirée ne doivent pas s'influencer, et un
 *    rendu serveur concurrent n'a pas d'état partagé à corrompre.
 *
 * Ce module ne substitue aucun jeton : voir `src/content/jetons.ts`.
 */
import type { Situation, Variante } from "@/content/schema";

/** Source d'aléa : rend un nombre dans `[0, 1[`. `Math.random` par défaut. */
export type SourceAlea = () => number;

/**
 * Mémoire anti-répétition d'une situation. Opaque et immuable : chaque tirage
 * rend une nouvelle mémoire, ce qui interdit une mutation accidentelle.
 */
export interface MemoireTirage {
  readonly derniersIds: readonly string[];
}

export const MEMOIRE_VIDE: MemoireTirage = Object.freeze({ derniersIds: [] });

export interface Tirage {
  readonly variante: Variante;
  readonly memoire: MemoireTirage;
}

/**
 * Tire une variante de `situation`, en évitant les `profondeur` dernières.
 *
 * `profondeur` vaut 1 par défaut — « jamais la même deux fois de suite », ce
 * que demande la règle du fichier. La valeur vit dans
 * `src/config/ui.config.ts` (`VARIANTES_SANS_REPETITION`) ; elle est passée en
 * paramètre pour que ce module reste testable sans configuration.
 *
 * Garde de sûreté : si l'exclusion ne laisse aucun candidat — cas impossible
 * avec 20 variantes et une profondeur de 1, mais pas impossible si un jour la
 * profondeur montait —, on tire dans l'ensemble complet plutôt que de lever.
 * Un enfant qui attend son encouragement ne doit jamais voir un écran tomber
 * pour une règle de variété.
 */
export function tirerVariante(
  situation: Situation,
  memoire: MemoireTirage = MEMOIRE_VIDE,
  alea: SourceAlea = Math.random,
  profondeur = 1,
): Tirage {
  const toutes = situation.variantes;
  if (toutes.length === 0) {
    throw new Error(`Situation sans variante : ${situation.id}`);
  }

  const exclus = new Set(memoire.derniersIds.slice(-profondeur));
  const candidats = toutes.filter((v) => !exclus.has(v.id));
  const pool = candidats.length > 0 ? candidats : toutes;

  const index = Math.min(pool.length - 1, Math.floor(alea() * pool.length));
  const variante = pool[index];
  if (variante === undefined) {
    throw new Error(`Tirage hors bornes dans la situation ${situation.id}.`);
  }

  return {
    variante,
    memoire: Object.freeze({
      derniersIds: Object.freeze(
        [...memoire.derniersIds, variante.id].slice(-Math.max(profondeur, 1)),
      ),
    }),
  };
}

/**
 * Éclate une variante en couples « clé d'écran → texte », selon ses `parties`.
 *
 * Règle `raccordement` du fichier : une partie écrit son `texte` dans chacune
 * des clés de son `cles_ui`. Le champ `texte` de la variante est la jointure
 * des parties dans l'ordre — c'est lui que lit le TTS, jamais cette table.
 */
export function partiesParCle(variante: Variante): ReadonlyMap<string, string> {
  const table = new Map<string, string>();
  for (const partie of variante.parties) {
    for (const cle of partie.cles_ui) {
      table.set(cle, partie.texte);
    }
  }
  return table;
}
