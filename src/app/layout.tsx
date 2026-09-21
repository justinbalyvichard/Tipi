import type { Metadata, Viewport } from "next";
import { Baloo_2, Quicksand } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import { THEME_PAR_DEFAUT } from "@/components/ui/theme";
import "@/styles/themes.css";

/**
 * Layout racine minimal, livré par P3 pour que les thèmes soient applicables.
 * La verticale V1 y ajoutera les fournisseurs (TanStack Query, Zustand) et la
 * lecture du thème mémorisé — l'architecte l'a décrit ainsi (P2, section 2).
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
      <body>{children}</body>
    </html>
  );
}
