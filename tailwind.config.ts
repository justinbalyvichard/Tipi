import type { Config } from "tailwindcss";

/**
 * Tailwind Tipi — DES-01, DES-02, DES-03, DES-04, DES-07, DES-08.
 *
 * Règle structurante : **aucune valeur de couleur n'apparaît ici**. Chaque
 * entrée pointe vers une variable CSS définie dans `src/styles/themes.css`,
 * seul fichier du dépôt qui contient des hexadécimaux. Les deux thèmes sont
 * donc bien deux jeux de variables, jamais deux arborescences de composants
 * (3.8 du prompt maître, `20-themes.mdc`).
 *
 * Conséquence vérifiable : `grep -rE '#[0-9a-fA-F]{3,8}' src tailwind.config.ts`
 * ne doit rien retourner hors de `src/styles/themes.css`.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // La palette par défaut de Tailwind est entièrement remplacée : aucun
    // `bg-red-500` n'existe, donc aucune couleur en dur n'est atteignable.
    colors: {
      transparent: "transparent",
      current: "currentColor",

      fond: "var(--tipi-fond)",
      surface: "var(--tipi-surface)",
      encre: "var(--tipi-encre)",
      "texte-secondaire": "var(--tipi-texte-secondaire)",
      "texte-appui": "var(--tipi-texte-appui)",
      "texte-discret": "var(--tipi-texte-discret)",
      ligne: "var(--tipi-ligne)",
      pointille: "var(--tipi-pointille)",

      "accent-primaire": "var(--tipi-accent-primaire)",
      "accent-primaire-encre": "var(--tipi-accent-primaire-encre)",
      "accent-secondaire": "var(--tipi-accent-secondaire)",
      "accent-tertiaire": "var(--tipi-accent-tertiaire)",
      "accent-pierre": "var(--tipi-accent-pierre)",

      "teinte-bleu": "var(--tipi-teinte-bleu)",
      "teinte-corail": "var(--tipi-teinte-corail)",
      "teinte-jaune": "var(--tipi-teinte-jaune)",
      "teinte-menthe": "var(--tipi-teinte-menthe)",

      "pilou-corps": "var(--pilou-corps)",
      "pilou-ventre": "var(--pilou-ventre)",
      "pilou-joue": "var(--pilou-joue)",
      "pilou-trait": "var(--pilou-trait-couleur)",
      "pilou-museau": "var(--pilou-museau)",
      "pilou-cosmetique": "var(--pilou-cosmetique)",
      "pilou-cosmetique-2": "var(--pilou-cosmetique-2)",
      "pilou-silhouette": "var(--pilou-silhouette)",
    },
    borderRadius: {
      none: "0",
      liste: "var(--tipi-rayon-liste)",
      carte: "var(--tipi-rayon-carte)",
      ecran: "var(--tipi-rayon-ecran)",
      badge: "var(--tipi-rayon-badge)",
      pilule: "var(--tipi-rayon-pilule)",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      douce: "var(--tipi-ombre-douce)",
      posee: "var(--tipi-ombre-posee)",
    },
    fontFamily: {
      titre: "var(--tipi-police-titre)",
      texte: "var(--tipi-police-texte)",
    },
    extend: {
      fontSize: {
        // DES-05 : `action` et `titre` franchissent le seuil « grand texte » de
        // WCAG (≥ 18,66 px en gras), ce qui ramène le seuil de contraste exigé
        // à 3:1 pour les libellés d'action du thème Apple. Voir le rapport P3.
        action: ["1.25rem", { lineHeight: "1.5rem", fontWeight: "700" }],
        titre: ["1.75rem", { lineHeight: "2.125rem", fontWeight: "700" }],
        "titre-hero": ["2.25rem", { lineHeight: "2.625rem", fontWeight: "700" }],
        corps: ["1.0625rem", { lineHeight: "1.5rem" }],
        appui: ["0.9375rem", { lineHeight: "1.25rem" }],
        pierre: ["1.5rem", { lineHeight: "1.75rem", fontWeight: "700" }],
      },
      spacing: {
        // DES-04 : la cible tactile minimale est un jeton, pas un nombre
        // recopié dans chaque composant.
        cible: "var(--tipi-cible-min)",
        "cible-large": "var(--tipi-cible-large)",
      },
      minHeight: {
        cible: "var(--tipi-cible-min)",
        "cible-large": "var(--tipi-cible-large)",
      },
      minWidth: {
        cible: "var(--tipi-cible-min)",
        "cible-large": "var(--tipi-cible-large)",
      },
      borderWidth: {
        hairline: "var(--tipi-hairline)",
      },
      transitionDuration: {
        douce: "var(--tipi-duree-douce)",
        posee: "var(--tipi-duree-posee)",
      },
      transitionTimingFunction: {
        douce: "var(--tipi-courbe-douce)",
      },
      keyframes: {
        // DES-08 : aucune animation ne fait varier l'opacité entre deux
        // extrêmes ni ne se répète en clignotant. `respire` est une échelle
        // lente et continue, `apparait` un fondu entrant qui ne se rejoue pas.
        apparait: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        respire: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.035)" },
        },
        "pense-1": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-3px)" } },
      },
      animation: {
        apparait: "apparait var(--tipi-duree-posee) var(--tipi-courbe-douce) both",
        respire: "respire 4s var(--tipi-courbe-douce) infinite",
        "pense-1": "pense-1 1.8s var(--tipi-courbe-douce) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
