"use client";

import type { ReactElement } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

/**
 * Clavier numérique du code parent (PRD-15, SEC-01, SEC-02, SEC-08).
 *
 * - Chaque touche est un `<button>`. Toutes font au moins `--tipi-cible-min`.
 * - La saisie n'est **jamais** affichée en clair : le bandeau montre autant de
 *   points que de chiffres saisis (SEC-08). Le composant ne journalise rien et
 *   ne conserve rien — il remonte la valeur à son appelant, qui décide.
 * - Les chiffres `0` à `9` sont générés, pas rédigés : ce ne sont pas des
 *   textes éditoriaux. Tous les libellés rédigés — « Effacer », le nom
 *   accessible du bandeau — sont **des propriétés**, alimentées depuis
 *   `content/ui-parent.json`.
 * - La touche d'effacement est désactivée tant que rien n'est saisi, donc dès
 *   l'ouverture de l'écran. Son opacité est celle de `Button` (60 %), et non
 *   40 % : WCAG exempte les composants inactifs, mais une touche qu'on ne voit
 *   pas à l'ouverture n'est pas une bonne façon d'accueillir un parent.
 * - Le bouton de validation n'appartient pas au clavier : DES-06 veut une
 *   seule action principale par écran, placée en bas, donc composée par
 *   l'écran lui-même.
 */
interface KeypadProps {
  /** La valeur courante, chiffres seulement. */
  readonly valeur: string;
  readonly onChange: (valeur: string) => void;
  /** Longueur attendue du code. 10 pour Tipi (PRD-15). */
  readonly longueur: number;
  /** Libellé de la touche d'effacement, issu de `content/`. */
  readonly etiquetteEffacer: string;
  /** Nom accessible du bandeau de saisie, issu de `content/`. */
  readonly etiquetteSaisie: string;
  readonly className?: string;
}

const CHIFFRES: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Keypad({
  valeur,
  onChange,
  longueur,
  etiquetteEffacer,
  etiquetteSaisie,
  className,
}: KeypadProps): ReactElement {
  const ajouter = (chiffre: number): void => {
    if (valeur.length >= longueur) return;
    onChange(valeur + String(chiffre));
  };

  const effacer = (): void => {
    onChange(valeur.slice(0, -1));
  };

  const cases = Array.from({ length: Math.max(longueur, 0) }, (_, i) => i);

  const toucheClasses = cx(
    "flex min-h-cible-large min-w-cible items-center justify-center",
    "rounded-carte bg-surface font-titre text-titre text-encre",
    "border-hairline border-ligne shadow-douce",
    "transition-colors duration-douce ease-douce"
  );

  return (
    <div className={cx("flex flex-col items-center gap-6", className)}>
      <div className="flex items-center gap-2" role="img" aria-label={etiquetteSaisie}>
        {cases.map((i) => (
          <span
            key={i}
            className={cx(
              "block h-3.5 w-3.5 rounded-pilule border-hairline border-texte-secondaire",
              i < valeur.length ? "bg-encre" : "bg-transparent"
            )}
          />
        ))}
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {CHIFFRES.map((c) => (
          <button key={c} type="button" onClick={() => ajouter(c)} className={toucheClasses}>
            {c}
          </button>
        ))}
        <span aria-hidden className="min-h-cible-large" />
        <button type="button" onClick={() => ajouter(0)} className={toucheClasses}>
          {0}
        </button>
        <button
          type="button"
          onClick={effacer}
          disabled={valeur.length === 0}
          className={cx(toucheClasses, "disabled:opacity-60")}
        >
          <Icon nom="effacer" etiquette={etiquetteEffacer} taille={28} />
        </button>
      </div>
    </div>
  );
}
