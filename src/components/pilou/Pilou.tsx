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
 * variante cosmétique, l'état silhouette de la mascotte, et — depuis le tour 2
 * — l'état silhouette du **cosmétique seul**. Aucune couleur n'est écrite ici :
 * chaque remplissage pointe vers un jeton déclaré dans `mascot.config.ts` et
 * résolu par le thème actif — c'est ainsi que le trait devient fin dans le
 * thème Apple (`--pilou-trait` vaut 2,5 côté Pilou et 1,5 côté Apple) sans
 * qu'un second dessin existe.
 *
 * **Règle de tracé, opposable à toute variante future** : toute forme colorée
 * est *cernée* par le trait d'encre du groupe parent. Une variante ne redéfinit
 * jamais `stroke` : c'est le trait, et non le remplissage, qui rend la forme
 * perceptible sur le fond. Le tour 1 a livré `lunettes` en violation de cette
 * règle — la monture était tracée en `--pilou-cosmetique`, mesurée à 2,05:1 —
 * et l'instrument de couples écrits à la main ne l'a pas vu. C'est
 * `scripts/verifier-contraste-rendu.mjs` qui tient désormais cette règle, en
 * mesurant la couleur calculée de chaque tracé contre son fond effectif.
 *
 * Exception unique et marquée : les joues, qui portent `data-tipi-decor`.
 * L'instrument de rendu n'exempte que ce qui porte cet attribut ; toute forme
 * nouvelle est mesurée par défaut.
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
  /** La **mascotte entière** en aplat neutre. */
  readonly silhouette?: boolean;
  /**
   * Le **cosmétique seul** en aplat neutre, Pilou restant normale : c'est le
   * « cosmétique verrouillé affiché en silhouette neutre » du livrable
   * marketing (§7.9), employé par `/enfant/coffre` (PRD-14). Chaque palier
   * verrouillé montre ainsi la *forme* de ce qui l'attend, et non quatre fois
   * la même ombre.
   */
  readonly cosmetiqueVerrouille?: boolean;
  readonly anime?: boolean;
  readonly etiquette?: string;
  readonly className?: string;
}

interface CouleursCosmetique {
  readonly principale: string;
  readonly secondaire: string;
}

function Cosmetique({
  id,
  couleurs,
}: {
  readonly id: CosmetiqueId;
  readonly couleurs: CouleursCosmetique;
}): ReactElement | null {
  const couleur = couleurs.principale;
  const couleur2 = couleurs.secondaire;

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
          <path d="M46 34c6-18 19-27 34-27s28 9 34 27c-10-6-21-9-34-9s-24 3-34 9z" fill={couleur} />
          <path d="M44 34h72v11H44z" fill={couleur2} />
          <circle cx="80" cy="9" r="6.5" fill={couleur2} />
        </g>
      );
    case "noeud":
      return (
        <g>
          <path d="M96 24c-6-5-13-6-15-2s2 10 9 12z" fill={couleur} />
          <path d="M118 24c6-5 13-6 15-2s-2 10-9 12z" fill={couleur} />
          <circle cx="106" cy="29" r="5" fill={couleur2} />
        </g>
      );
    case "lunettes":
      // Monture dessinée comme un ANNEAU PLEIN en `fill`, cerné par le trait
      // d'encre du groupe parent — jamais un `stroke` de la couleur du
      // cosmétique. Le `fill-rule` évidé laisse les yeux visibles.
      return (
        <g>
          <path
            fillRule="evenodd"
            fill={couleur}
            d="M53 58a13 13 0 1 0 26 0 13 13 0 1 0-26 0zM56.5 58a9.5 9.5 0 1 0 19 0 9.5 9.5 0 1 0-19 0z"
          />
          <path
            fillRule="evenodd"
            fill={couleur}
            d="M81 58a13 13 0 1 0 26 0 13 13 0 1 0-26 0zM84.5 58a9.5 9.5 0 1 0 19 0 9.5 9.5 0 1 0-19 0z"
          />
          <path d="M75.5 56h9v4h-9z" fill={couleur2} />
          <path d="M53.5 54 45 50M106.5 54l8.5-4" />
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
  cosmetiqueVerrouille = false,
  anime = false,
  etiquette,
  className,
}: PilouProps): ReactElement {
  const px = mascotConfig.tailles[taille];
  const neutre = jeton(P.silhouette);

  const corps = silhouette ? neutre : jeton(P.corps);
  const ventre = silhouette ? neutre : jeton(P.ventre);
  const joue = silhouette ? "none" : jeton(P.joue);
  const museau = silhouette ? neutre : jeton(P.museau);
  const trait = silhouette ? neutre : jeton(P.trait);

  // Le cosmétique passe en neutre soit parce que toute la mascotte l'est, soit
  // parce que ce palier n'est pas encore atteint.
  const cosmetiqueNeutre = silhouette || cosmetiqueVerrouille;
  const couleursCosmetique: CouleursCosmetique = cosmetiqueNeutre
    ? { principale: neutre, secondaire: neutre }
    : { principale: jeton(P.cosmetique), secondaire: jeton(P.cosmetiqueSecondaire) };

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
        {/* Queue : longue et effilée, attachée au corps */}
        <path d="M54 116c-16 5-31 15-40 28-3 4 1 9 6 7 16-7 29-18 38-29z" fill={corps} />

        {/* Corps */}
        <path
          d="M80 74c22 0 39 16 39 36s-17 36-39 36-39-16-39-36 17-36 39-36z"
          fill={corps}
        />
        <path d="M80 92c13 0 23 10 23 23s-10 23-23 23-23-10-23-23 10-23 23-23z" fill={ventre} />

        {/* Pattes */}
        <ellipse cx="66" cy="145" rx="10" ry="6" fill={corps} />
        <ellipse cx="94" cy="145" rx="10" ry="6" fill={corps} />

        {/* Oreilles : petites et posées sur la tête, comme chez une loutre */}
        <circle cx="55" cy="29" r="9" fill={corps} />
        <circle cx="105" cy="29" r="9" fill={corps} />
        <circle cx="55" cy="29" r="3.5" fill={ventre} />
        <circle cx="105" cy="29" r="3.5" fill={ventre} />

        {/* Tête */}
        <circle cx="80" cy="60" r="39" fill={corps} />

        {/* Joues — SEULE forme décorative de la mascotte : aucun contour,
            aucune information portée. L'attribut ci-dessous est ce qui
            l'exempte de la mesure de contraste ; rien d'autre ne l'exempte. */}
        <circle cx="50" cy="76" r="8" fill={joue} stroke="none" data-tipi-decor="joue" />
        <circle cx="110" cy="76" r="8" fill={joue} stroke="none" data-tipi-decor="joue" />

        {/* Yeux */}
        <circle cx="66" cy="56" r="4.5" fill={museau} stroke="none" />
        <circle cx="94" cy="56" r="4.5" fill={museau} stroke="none" />

        {/* Museau large et bas */}
        <path d="M80 66c12 0 21 6 21 13s-9 13-21 13-21-6-21-13 9-13 21-13z" fill={ventre} />
        <path d="M80 70c3.5 0 6 2 6 4.5s-2.5 4.5-6 4.5-6-2-6-4.5 2.5-4.5 6-4.5z" fill={museau} stroke="none" />
        <path d="M80 79v4M80 83c-3 3-7 3-9 1M80 83c3 3 7 3 9 1" />

        <Cosmetique id={cosmetique} couleurs={couleursCosmetique} />
      </g>
    </svg>
  );
}
