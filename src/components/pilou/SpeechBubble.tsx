import type { ReactElement, ReactNode } from "react";
import { cx } from "../ui/cx";

/**
 * Ce que Pilou dit, écrit.
 *
 * PED-10 impose que toute information importante soit **aussi** dite à l'oral.
 * La bulle porte donc `role="status"` et `aria-live="polite"` : le texte
 * affiché et la réplique entendue arrivent ensemble, sans se couper.
 *
 * Le texte n'est jamais écrit ici : il arrive par `children`, depuis
 * `content/encouragements.json`, `content/gwenn-scripts.json` ou
 * `content/ui-enfant.json`.
 *
 * La pointe de la bulle est un carré pivoté de la même couleur que la surface :
 * aucun dégradé, aucune image (DES-07, 3.8).
 */
interface SpeechBubbleProps {
  readonly children: ReactNode;
  /** Côté où pointe la bulle, vers Pilou. */
  readonly pointe?: "bas" | "gauche" | "aucune";
  /** Annonce le texte aux technologies d'assistance dès qu'il change. */
  readonly vivant?: boolean;
  readonly className?: string;
}

export function SpeechBubble({
  children,
  pointe = "bas",
  vivant = true,
  className,
}: SpeechBubbleProps): ReactElement {
  return (
    <div
      {...(vivant ? { role: "status", "aria-live": "polite" } : {})}
      className={cx("relative inline-block max-w-prose animate-apparait", className)}
    >
      <div
        className={cx(
          "rounded-carte bg-surface px-5 py-4 shadow-douce",
          "font-texte text-corps text-encre"
        )}
      >
        {children}
      </div>
      {pointe === "aucune" ? null : (
        <span
          aria-hidden
          className={cx(
            "absolute block h-4 w-4 rotate-45 bg-surface",
            pointe === "bas"
              ? "bottom-[-6px] left-10"
              : "left-[-6px] top-8"
          )}
        />
      )}
    </div>
  );
}
