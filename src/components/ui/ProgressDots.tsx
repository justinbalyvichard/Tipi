import type { ReactElement } from "react";
import { cx } from "./cx";

/**
 * Repère de position, sans aucun chiffre (PED-07, et la règle du marketing
 * selon laquelle aucun nombre n'apparaît hors du coffre).
 *
 * Deux précautions :
 * 1. L'état actif n'est pas porté par la seule couleur. Le point actif est
 *    **plein et plus large** ; les autres sont creux. Le composant reste donc
 *    lisible sans distinguer les couleurs.
 * 2. Chaque point porte un contour `border-texte-secondaire`, mesuré à 5,54:1
 *    (Pilou) et 3,32:1 (Apple) sur le fond d'écran : le repère franchit le
 *    seuil de 3:1 des éléments non textuels dans les deux thèmes, alors que
 *    l'aplat de l'accent secondaire seul n'est qu'à 2,15:1 en thème Pilou.
 *
 * Par défaut le composant est décoratif pour les technologies d'assistance.
 * `etiquette` (issue de `content/`) permet à un écran de lui donner un nom.
 */
interface ProgressDotsProps {
  readonly total: number;
  /** Index de l'étape courante, à partir de 0. */
  readonly courant: number;
  readonly etiquette?: string;
  readonly className?: string;
}

export function ProgressDots({
  total,
  courant,
  etiquette,
  className,
}: ProgressDotsProps): ReactElement {
  const points = Array.from({ length: Math.max(total, 0) }, (_, i) => i);

  return (
    <div
      className={cx("flex items-center gap-2.5", className)}
      {...(etiquette === undefined
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": etiquette })}
    >
      {points.map((i) => {
        const actif = i === courant;
        return (
          <span
            key={i}
            className={cx(
              "block h-3 rounded-pilule border-hairline border-texte-secondaire",
              "transition-all duration-douce ease-douce",
              actif ? "w-8 bg-accent-secondaire" : "w-3 bg-transparent"
            )}
          />
        );
      })}
    </div>
  );
}
