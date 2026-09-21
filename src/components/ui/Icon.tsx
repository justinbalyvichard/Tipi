import type { ReactElement } from "react";
import { cx } from "./cx";

/**
 * DES-07 — jeu d'icônes SVG **au trait uniquement**. Aucun emoji, aucun aplat,
 * aucun dégradé. Chaque tracé hérite de `currentColor`, donc d'un jeton de
 * thème, et l'épaisseur vient de `--tipi-icone-trait` : le trait s'affine dans
 * le thème Apple sans qu'un second jeu d'icônes existe.
 *
 * Accessibilité : une icône est décorative par défaut (`aria-hidden`). Dès
 * qu'elle porte seule le sens d'une commande, l'appelant passe `etiquette`,
 * qui produit `role="img"` + `aria-label`. Les boutons sans libellé exigent
 * cette étiquette par leur type (voir `Button.tsx`).
 */
export type IconeNom =
  | "micro"
  | "pause"
  | "pierre"
  | "chevron"
  | "engrenage"
  | "retour"
  | "son"
  | "livre"
  | "calcul"
  | "coche"
  | "photo"
  | "effacer"
  | "tipi";

const tracés: Readonly<Record<IconeNom, ReactElement>> = {
  micro: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  pause: (
    <>
      <path d="M9.5 5v14" />
      <path d="M14.5 5v14" />
    </>
  ),
  pierre: (
    <>
      <path d="M8 3h8l4 6-8 12L4 9z" />
      <path d="M4 9h16" />
      <path d="M12 21 8 9l2-6" />
      <path d="m12 21 4-12-2-6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  engrenage: (
    <>
      <circle cx="12" cy="12" r="3.3" />
      {/* Des DENTS, pas des rayons : une couronne crénelée, sinon le tracé se
          lit comme un pictogramme de luminosité (constat 9 du tour 1). */}
      <path d="M10.3 2.8h3.4l.4 2.3 2 1.2 2.1-1 1.7 2.9-1.7 1.6v2.4l1.7 1.6-1.7 2.9-2.1-1-2 1.2-.4 2.3h-3.4l-.4-2.3-2-1.2-2.1 1-1.7-2.9L5.8 12V9.6L4.1 8l1.7-2.9 2.1 1 2-1.2z" />
    </>
  ),
  retour: (
    <>
      <path d="M15 5 8 12l7 7" />
    </>
  ),
  son: (
    <>
      <path d="M5 9.5h3l4-3.5v12l-4-3.5H5z" />
      <path d="M16.5 9a4 4 0 0 1 0 6" />
      <path d="M19 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  livre: (
    <>
      <path d="M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1.6z" />
      <path d="M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1.6z" />
    </>
  ),
  calcul: (
    <>
      <path d="M4.5 8.5h6M7.5 5.5v6" />
      <path d="M13.5 8.5h6" />
      <path d="M4.5 16.5h6" />
      <path d="M14 14.5l4.5 4.5M18.5 14.5 14 19" />
    </>
  ),
  coche: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  photo: (
    <>
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.3-2h6.4l1.3 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  effacer: (
    <>
      <path d="M9 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H9l-5.5-7z" />
      <path d="m12.5 9.5 4 5M16.5 9.5l-4 5" />
    </>
  ),
  tipi: (
    <>
      <path d="M12 4.5 4.5 20h15z" />
      <path d="M10.4 7.8 8.2 3.2M13.6 7.8l2.2-4.6" />
      <path d="M12 12.5c1.4 1.7 2 4.3 2 7.5h-4c0-3.2.6-5.8 2-7.5z" />
    </>
  ),
};

type IconeProps = {
  readonly nom: IconeNom;
  /** Taille du carré, en pixels. Par défaut 24. */
  readonly taille?: number;
  readonly className?: string;
} & (
  | { readonly etiquette: string }
  | { readonly etiquette?: undefined; readonly decorative: true }
);

export function Icon(props: IconeProps): ReactElement {
  const { nom, taille = 24, className } = props;
  const etiquette = props.etiquette;

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      style={{ strokeWidth: "var(--tipi-icone-trait)" }}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", className)}
      {...(etiquette === undefined
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": etiquette })}
    >
      {tracés[nom]}
    </svg>
  );
}
