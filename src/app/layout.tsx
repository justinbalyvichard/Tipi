import type { Metadata, Viewport } from "next";
import { Baloo_2, Quicksand } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import { Providers } from "@/app/providers";
import { THEME_PAR_DEFAUT } from "@/components/ui/theme";
import "@/styles/themes.css";

/**
 * Layout racine, posé par P3 pour les thèmes et complété par V1.
 *
 * Ce que V1 ajoute (TEC-04) : le fournisseur TanStack Query, dans
 * `src/app/providers.tsx`. Zustand n'a pas de fournisseur — son store est un
 * module (`src/stores/session-ui.ts`) — donc rien à câbler ici pour lui.
 *
 * Ce que V1 n'ajoute PAS, et pourquoi : la lecture du thème mémorisé. Le thème
 * retenu vit dans `child.theme_prefere` (3.7), qu'il faut aller lire en base ;
 * le commuter à chaud est PRD-17, porté par Réglages (V7) et le polish (V9).
 * `data-theme` reste donc sur la valeur par défaut, exactement comme P3 l'a
 * laissé. Poser ici une lecture de base ferait dépendre chaque page d'une
 * requête que l'aiguillage (V3) fait déjà.
 *
 * DES-03 : Baloo 2 (titres) et Quicksand (texte) sont téléchargées à la
 * construction et servies depuis le domaine de l'application. Aucun appel à un
 * tiers n'a lieu au chargement d'une page : c'est ce qu'exige ETH-03 (aucun
 * traceur tiers), et c'est aussi ce qui évite le saut de texte au premier
 * rendu. Les deux polices sont exposées comme variables CSS, consommées par
 * les piles de `themes.css` ; le thème Apple, lui, n'en télécharge aucune :
 * sa pile est la pile système.
 *
 * DES-10 : aucun texte marketing. Le titre du document est le nom du produit,
 * rien d'autre.
 */
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--police-baloo",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--police-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tipi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `themeColor` n'est volontairement pas posé ici : ce champ n'accepte qu'une
  // valeur littérale, ce qui introduirait la seule couleur en dur du dépôt hors
  // de `themes.css`. Il sera servi par la route qui connaît le thème mémorisé,
  // avec l'écran de lancement (DES-10), en verticale V9.
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <html
      lang="fr"
      data-theme={THEME_PAR_DEFAUT}
      className={`${baloo.variable} ${quicksand.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
