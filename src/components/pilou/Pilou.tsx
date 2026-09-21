import type { ReactElement } from "react";
import { cx } from "../ui/cx";
import {
  mascotConfig,
  type CosmetiqueId,
  type TaillePilou,
} from "@/config/mascot.config";

/**
 * DES-09 — **un seul** SVG de Pilou pour toute l'application.
 *
 * Tout ce qui varie est un paramètre : la taille (héros, moyenne, icône), la
 * variante cosmétique, et l'état silhouette d'un cosmétique encore verrouillé.
 * Aucune couleur n'est écrite ici : chaque remplissage pointe vers un jeton
 * déclaré dans `mascot.config.ts` et résolu par le thème actif — c'est ainsi
 * que le trait devient fin dans le thème Apple (`--pilou-trait` vaut 2,5 côté
 * Pilou et 1,5 côté Apple) sans qu'un second dessin existe.
 *
 * Accessibilité : Pilou est décorative par défaut. Les écrans où elle porte
 * seule une information lui passent `etiquette`, issue de `content/`.
 *
 * DES-08 : `anime` active une respiration de 4 s, lente et continue. Aucune
 * variation d'opacité, aucun clignotement ; la préférence système
 * `prefers-reduced-motion` l'annule entièrement (`themes.css`).
 */
const jeton = (nom: string): string => `var(${nom})`;

const P = mascotConfig.palette;

interface PilouProps {
  readonly taille?: TaillePilou;
  readonly cosmetique?: CosmetiqueId;
  /** Rendu en aplat neutre, pour un cosmétique encore verrouillé (ETH-01). */
  readonly silhouette?: boolean;
  readonly anime?: boolean;
  readonly etiquette?: string;
  readonly className?: string;
}

function Cosmetique({ id }: { readonly id: CosmetiqueId }): ReactElement | null {
  const couleur = jeton(P.cosmetique);
  const couleur2 = jeton(P.cosmetiqueSecondaire);

  switch (id) {
    case "aucun":
      return null;
    case "echarpe":
      return (
        <g>
          <path
            d="M52 98c9 7 19 10 28 10s19-3 28-10c2 5 2 9 1 13-10 7-19 10-29 10s-19-3-29-10c-1-4-1-8 1-13z"
            fill={couleur}
          />
          <path d="M104 111c5 6 7 13 7 21l-12 2c0-8-1-15-4-20z" fill={couleur} />
        </g>
      );
    case "bonnet":
      return (
        <g>
          <path d="M44 38c6-19 20-29 36-29s30 10 36 29c-11-6-23-9-36-9s-25 3-36 9z" fill={couleur} />
          <path d="M42 38h76v11H42z" fill={couleur2} />
          <circle cx="80" cy="6" r="7" fill={couleur2} />
        </g>
      );
    case "noeud":
      return (
        <g>
          <path d="M100 26c-6-5-13-6-15-2s2 10 9 12z" fill={couleur} />
          <path d="M124 26c6-5 13-6 15-2s-2 10-9 12z" fill={couleur} />
          <circle cx="112" cy="31" r="5" fill={couleur2} />
        </g>
      );
    case "lunettes":
      return (
        <g fill="none" stroke={couleur} strokeLinecap="round">
          <circle cx="66" cy="58" r="13" />
          <circle cx="94" cy="58" r="13" />
          <path d="M79 58h2" />
          <path d="M53 55 44 51M107 55l9-4" />
        </g>
      );
    default:
      return null;
  }
}

export function Pilou({
  taille = "moyenne",
  cosmetique = mascotConfig.cosmetiqueParDefaut,
  silhouette = false,
  anime = false,
  etiquette,
  className,
}: PilouProps): ReactElement {
  const px = mascotConfig.tailles[taille];

  const corps = silhouette ? jeton(P.silhouette) : jeton(P.corps);
  const ventre = silhouette ? jeton(P.silhouette) : jeton(P.ventre);
  const joue = silhouette ? "none" : jeton(P.joue);
  const museau = silhouette ? jeton(P.silhouette) : jeton(P.museau);
  const trait = silhouette ? jeton(P.silhouette) : jeton(P.trait);

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 160 160"
      className={cx(anime ? "animate-respire" : "", className)}
      style={{ strokeWidth: "var(--pilou-trait)" }}
      {...(etiquette === undefined
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": etiquette })}
    >
      <g stroke={trait} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Queue : une forme pleine qui s'affine, attachée au corps */}
        <path d="M52 120c-14 3-27 11-34 22-2 4 2 8 6 6 13-6 24-15 32-24z" fill={corps} />

        {/* Corps */}
        <path
          d="M80 74c22 0 39 16 39 36s-17 36-39 36-39-16-39-36 17-36 39-36z"
          fill={corps}
        />
        <path d="M80 92c13 0 23 10 23 23s-10 23-23 23-23-10-23-23 10-23 23-23z" fill={ventre} />

        {/* Pattes */}
        <ellipse cx="66" cy="145" rx="10" ry="6" fill={corps} />
        <ellipse cx="94" cy="145" rx="10" ry="6" fill={corps} />

        {/* Oreilles */}
        <circle cx="48" cy="32" r="12" fill={corps} />
        <circle cx="112" cy="32" r="12" fill={corps} />
        <circle cx="48" cy="32" r="5" fill={ventre} />
        <circle cx="112" cy="32" r="5" fill={ventre} />

        {/* Tête */}
        <circle cx="80" cy="60" r="39" fill={corps} />

        {/* Joues */}
        <circle cx="50" cy="76" r="8" fill={joue} stroke="none" />
        <circle cx="110" cy="76" r="8" fill={joue} stroke="none" />

        {/* Yeux */}
        <circle cx="66" cy="56" r="4.5" fill={museau} stroke="none" />
        <circle cx="94" cy="56" r="4.5" fill={museau} stroke="none" />

        {/* Museau */}
        <path d="M80 66c11 0 20 6 20 13s-9 12-20 12-20-5-20-12 9-13 20-13z" fill={ventre} />
        <path d="M80 70c3 0 5 2 5 4s-2 4-5 4-5-2-5-4 2-4 5-4z" fill={museau} stroke="none" />
        <path d="M80 78v4M80 82c-3 3-7 3-9 1M80 82c3 3 7 3 9 1" />


        <Cosmetique id={silhouette ? "aucun" : cosmetique} />
      </g>
    </svg>
  );
}
