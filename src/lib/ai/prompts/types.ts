/**
 * Forme d'un prompt versionné (P2, §5.1).
 *
 * Trois champs et pas un de plus. En particulier **aucun emplacement pour une
 * donnée du foyer** : un prompt est une constante du produit, la même pour tous
 * les enfants. C'est ce qui rend vraie la moitié « prompt » de l'invariant de
 * dérivabilité de SEC-04 (`src/lib/ai/anonymisation.ts`) : le payload émis est
 * la réunion d'un texte constant et du texte de l'exercice, et rien d'autre.
 */
export interface PromptVersionne {
  /** Identifiant stable, journalisé avec chaque appel (TEC-16). */
  readonly id: "structuration" | "indices" | "questions";
  /** Change dès que `texte` change. Voyage jusqu'à `calibration_log`. */
  readonly version: string;
  /** Le texte exact de la section 3.6 du prompt maître. */
  readonly texte: string;
}
