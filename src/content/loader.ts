/**
 * Chargeur des quatre fichiers de `content/` (P2, §2).
 *
 * Trois garanties, et c'est tout ce que fait ce module :
 *  1. **Import statique**, donc aucune lecture de disque à l'exécution : les
 *     JSON sont empaquetés par le compilateur, ce qui les rend disponibles
 *     dans un composant serveur comme dans un script.
 *  2. **Parse Zod une fois**, au premier accès. Une forme changée arrête le
 *     démarrage avec le fichier et le chemin fautifs.
 *  3. **Gel récursif**. `content/` est en lecture seule pour le code : un
 *     module qui muterait un texte par mégarde casse au lieu de propager.
 *
 * Ce module NE rend PAS un texte prêt à afficher : les jetons `{prenom}` et
 * `{matiere}` sont substitués par `src/content/jetons.ts`, qui est serveur
 * (SEC-04). Le chargeur, lui, est neutre.
 */
import type { z } from "zod";

import encouragementsBrut from "@content/encouragements.json";
import rituelsBrut from "@content/pilou-scripts.json";
import uiEnfantBrut from "@content/ui-enfant.json";
import uiParentBrut from "@content/ui-parent.json";

import {
  FichierEncouragements,
  FichierRituels,
  FichierUi,
  type EntreeUi,
  type FichierEncouragements as TypeEncouragements,
  type FichierRituels as TypeRituels,
  type FichierUi as TypeUi,
  type Situation,
} from "@/content/schema";

interface Contenu {
  readonly uiEnfant: TypeUi;
  readonly uiParent: TypeUi;
  readonly encouragements: TypeEncouragements;
  readonly rituels: TypeRituels;
}

function geler<T>(valeur: T): T {
  if (valeur === null || typeof valeur !== "object") return valeur;
  for (const membre of Object.values(valeur as Record<string, unknown>)) {
    geler(membre);
  }
  return Object.freeze(valeur);
}

function valider<T>(schema: z.ZodType<T>, fichier: string, brut: unknown): T {
  const parse = schema.safeParse(brut);
  if (!parse.success) {
    const details = parse.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")} — ${i.message}`)
      .join(" ; ");
    throw new Error(`content/${fichier} non conforme : ${details}`);
  }
  return geler(parse.data);
}

let cache: Contenu | undefined;

function charger(): Contenu {
  if (cache !== undefined) return cache;
  cache = Object.freeze({
    uiEnfant: valider(FichierUi, "ui-enfant.json", uiEnfantBrut),
    uiParent: valider(FichierUi, "ui-parent.json", uiParentBrut),
    encouragements: valider(
      FichierEncouragements,
      "encouragements.json",
      encouragementsBrut,
    ),
    rituels: valider(FichierRituels, "pilou-scripts.json", rituelsBrut),
  });
  return cache;
}

export function contenu(): Contenu {
  return charger();
}

/**
 * L'entrée d'interface portant cette clé, ou `undefined`.
 *
 * Les deux fichiers d'interface ont des clés disjointes : une clé d'écran a
 * exactement un fichier propriétaire (règle `propriete_des_cles`). Chercher
 * dans les deux est donc sans ambiguïté.
 */
export function entreeUi(cle: string): EntreeUi | undefined {
  const c = charger();
  return c.uiEnfant.textes[cle] ?? c.uiParent.textes[cle];
}

/**
 * Le texte BRUT d'une clé d'interface, jetons non substitués.
 *
 * Une clé absente LÈVE, et c'est volontaire : rendre l'identifiant technique
 * à la place du texte afficherait le défaut sans le voir
 * (`40-protocole-agents.mdc`). Un écran qui tombe se répare ; un écran qui
 * montre `coffre.cosmetiques.echarpe` à un enfant ne se voit pas en recette.
 */
export function texteUi(cle: string): string {
  const entree = entreeUi(cle);
  if (entree === undefined) {
    throw new Error(`Clé de contenu absente de content/ : ${cle}`);
  }
  return entree.texte;
}

/** Vrai si la clé existe dans l'un des deux fichiers d'interface. */
export function cleUiExiste(cle: string): boolean {
  return entreeUi(cle) !== undefined;
}

/** Toutes les clés d'interface déclarées, enfant et parent confondus. */
export function clesUi(): readonly string[] {
  const c = charger();
  return Object.freeze([
    ...Object.keys(c.uiEnfant.textes),
    ...Object.keys(c.uiParent.textes),
  ]);
}

/** La situation de la banque de phrases portant cet identifiant. */
export function situation(id: string): Situation {
  const trouvee = charger().encouragements.situations[id];
  if (trouvee === undefined) {
    throw new Error(`Situation absente de content/encouragements.json : ${id}`);
  }
  return trouvee;
}

/** Les identifiants des 23 situations (ARB-04). */
export function idsSituations(): readonly string[] {
  return Object.freeze(Object.keys(charger().encouragements.situations));
}

/** Remet le cache à zéro. Réservé aux tests. */
export function reinitialiserContenuPourTest(): void {
  cache = undefined;
}
