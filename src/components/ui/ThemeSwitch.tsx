"use client";

import type { ReactElement } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import { THEMES, type Theme } from "./theme";

/**
 * PRD-17 — bascule entre les deux thèmes, depuis Réglages.
 *
 * - Chaque option est un `<button>` réel, dans un `role="radiogroup"` :
 *   navigable au clavier, annoncé correctement, et jamais un `div` cliquable.
 * - Hauteur minimale `--tipi-cible-min`.
 * - L'option retenue n'est pas signalée par la seule couleur : elle porte une
 *   coche et `aria-checked`.
 * - Tous les libellés — noms des deux thèmes, phrases d'aide, nom du groupe —
 *   sont des propriétés, alimentées par `content/ui-parent.json`
 *   (`reglages.theme.*`). Le composant ne rédige rien.
 *
 * Le composant est **contrôlé** : il ne décide ni de la persistance, ni du
 * moment où le thème est appliqué. Son appelant fait les deux (voir
 * `appliquerTheme`).
 */
export interface OptionTheme {
  readonly theme: Theme;
  /** Nom affiché du thème, issu de `content/`. */
  readonly libelle: string;
  /** Phrase d'aide, issue de `content/`. */
  readonly aide?: string;
}

interface ThemeSwitchProps {
  readonly valeur: Theme;
  readonly onChange: (theme: Theme) => void;
  /** Les deux options, dans l'ordre d'affichage. */
  readonly options: readonly OptionTheme[];
  /** Nom accessible du groupe, issu de `content/`. */
  readonly etiquetteGroupe: string;
  readonly className?: string;
}

export function ThemeSwitch({
  valeur,
  onChange,
  options,
  etiquetteGroupe,
  className,
}: ThemeSwitchProps): ReactElement {
  const connues = options.filter((o) => (THEMES as readonly string[]).includes(o.theme));

  return (
    <div
      role="radiogroup"
      aria-label={etiquetteGroupe}
      className={cx("flex flex-col gap-3", className)}
    >
      {connues.map((option) => {
        const actif = option.theme === valeur;
        return (
          <button
            key={option.theme}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(option.theme)}
            className={cx(
              "flex min-h-cible w-full items-center gap-3 rounded-liste px-4 py-3 text-left",
              "border-hairline transition-colors duration-douce ease-douce",
              actif ? "border-encre bg-teinte-bleu" : "border-ligne bg-surface"
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-texte text-corps font-semibold text-encre">
                {option.libelle}
              </span>
              {option.aide === undefined ? null : (
                <span className="font-texte text-appui text-texte-appui">{option.aide}</span>
              )}
            </span>
            {actif ? <Icon nom="coche" decorative taille={24} className="text-encre" /> : null}
          </button>
        );
      })}
    </div>
  );
}
