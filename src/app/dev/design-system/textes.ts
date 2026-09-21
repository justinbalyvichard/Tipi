import uiEnfant from "@content/ui-enfant.json";
import uiParent from "@content/ui-parent.json";

/**
 * Lecteur de textes **réservé à la page de contrôle visuel**.
 *
 * Il existe pour une seule raison : aucun composant, pas même une page de
 * démonstration, n'a le droit d'écrire un texte utilisateur
 * (`30-copy-enfant.mdc`). Tous les libellés montrés sur `/dev/design-system`
 * viennent donc de `content/ui-enfant.json` et `content/ui-parent.json`.
 *
 * Ce n'est pas le chargeur de l'application : `src/content/loader.ts`, validé
 * par Zod au démarrage, est livré par la verticale V1 (architecture P2,
 * section 2). Celui-ci ne valide rien et ne sert que cette page.
 */
interface EntreeTexte {
  readonly texte: string;
}

const ENFANT: Readonly<Record<string, EntreeTexte>> = uiEnfant.textes;
const PARENT: Readonly<Record<string, EntreeTexte>> = uiParent.textes;

/**
 * Renvoie le texte d'une clé d'interface. Une clé absente lève : une démo qui
 * affiche silencieusement une clé technique à la place d'un texte est
 * exactement l'instrument de mesure qui « affiche le défaut sans le voir »
 * (`40-protocole-agents.mdc`).
 */
export function t(cle: string): string {
  const entree = ENFANT[cle] ?? PARENT[cle];
  if (entree === undefined) {
    throw new Error(`Clé de contenu absente de content/ : ${cle}`);
  }
  return entree.texte;
}
