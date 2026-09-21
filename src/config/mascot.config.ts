/**
 * DES-09 — Pilou est décrite ici, et nulle part ailleurs.
 *
 * Un seul SVG paramétré (`src/components/pilou/Pilou.tsx`) lit ce fichier. Nom,
 * palette et variantes cosmétiques y sont centralisés ; aucun composant ne
 * redéclare une partie du corps de Pilou ni une couleur.
 *
 * Aucune valeur de couleur n'est écrite ici : chaque entrée de palette est le
 * NOM d'une variable CSS définie par thème dans `src/styles/themes.css`. Pilou
 * change donc d'habillage avec le thème sans qu'un second arbre de composants
 * existe (3.8).
 */

/** Une partie dessinée de Pilou, et la variable CSS qui la peint. */
export type PartiePilou =
  | "corps"
  | "ventre"
  | "joue"
  | "museau"
  | "trait"
  | "cosmetique"
  | "cosmetiqueSecondaire"
  | "silhouette";

/** Tailles publiées de la mascotte, en pixels. */
export type TaillePilou = "hero" | "moyenne" | "icone";

/** Identifiant technique d'une variante cosmétique. Jamais affiché à l'enfant. */
export type CosmetiqueId = "aucun" | "bonnet" | "echarpe" | "noeud" | "lunettes";

export interface Cosmetique {
  /** Identifiant technique, stocké dans `child.cosmetique_active` (3.7). */
  readonly id: CosmetiqueId;
  /**
   * Clé de contenu portant le libellé montré à l'enfant. Le libellé lui-même
   * vit dans `content/`, jamais ici : ce fichier ne contient aucun texte
   * utilisateur (`30-copy-enfant.mdc`).
   */
  readonly cleLibelle: string;
  /**
   * Seuil fixe, en pierres, au-delà duquel la variante est débloquée. Alimente
   * `coffre.cosmetiques.verrouille` — « Il en faut {n} pour celui-là. » Un
   * seuil est constant : il ne monte jamais, et rien ne se reverrouille
   * (ETH-04).
   */
  readonly pierresRequises: number;
}

export interface VoixPilou {
  readonly fournisseur: "google-chirp3";
  readonly langue: "fr-FR";
  readonly nom: string;
  /**
   * Le genre de Pilou. FIGÉ — voir TEC-08 et ARB-14 : « Je suis contente de te
   * voir » reste au féminin, le genre y étant celui de la mascotte. Aucun agent
   * ne « répare » ce féminin, et rien dans le code ne dérive une forme
   * grammaticale de ce champ.
   */
  readonly genre: "feminin";
}

export interface MascotConfig {
  readonly nom: string;
  readonly palette: Readonly<Record<PartiePilou, string>>;
  readonly tailles: Readonly<Record<TaillePilou, number>>;
  readonly cosmetiques: readonly Cosmetique[];
  readonly cosmetiqueParDefaut: CosmetiqueId;
  readonly voix: VoixPilou;
}

export const mascotConfig = {
  /**
   * Le nom de la mascotte. `content/ui-enfant.json` porte le même nom dans son
   * champ `personnage` : un test d'invariant doit vérifier l'égalité des deux
   * en P5, plutôt que de laisser deux sources diverger en silence.
   */
  nom: "Pilou",

  /** Noms de variables CSS, résolus par le thème actif. */
  palette: {
    corps: "--pilou-corps",
    ventre: "--pilou-ventre",
    joue: "--pilou-joue",
    museau: "--pilou-museau",
    trait: "--pilou-trait-couleur",
    cosmetique: "--pilou-cosmetique",
    cosmetiqueSecondaire: "--pilou-cosmetique-2",
    silhouette: "--pilou-silhouette",
  },

  /**
   * `icone` vaut exactement la cible tactile minimale de DES-04 : une Pilou en
   * taille icône posée dans un bouton ne rétrécit jamais la cible.
   */
  tailles: {
    hero: 208,
    moyenne: 120,
    icone: 56,
  },

  cosmetiques: [
    { id: "aucun", cleLibelle: "coffre.cosmetiques.aucun", pierresRequises: 0 },
    { id: "echarpe", cleLibelle: "coffre.cosmetiques.echarpe", pierresRequises: 15 },
    { id: "bonnet", cleLibelle: "coffre.cosmetiques.bonnet", pierresRequises: 30 },
    { id: "noeud", cleLibelle: "coffre.cosmetiques.noeud", pierresRequises: 45 },
    { id: "lunettes", cleLibelle: "coffre.cosmetiques.lunettes", pierresRequises: 60 },
  ],

  cosmetiqueParDefaut: "aucun",

  /**
   * TEC-08 — VOIX FIGÉE POUR TOUTE LA DURÉE DE VIE DE L'APPLICATION.
   * Elle n'est pas une variable d'environnement (architecture P2, 5.2) : une
   * voix qui change au déploiement serait une rupture pour l'enfant.
   */
  voix: {
    fournisseur: "google-chirp3",
    langue: "fr-FR",
    nom: "fr-FR-Chirp3-HD-Aoede",
    genre: "feminin",
  },
} as const satisfies MascotConfig;

/** Les cosmétiques débloqués par un solde de pierres donné. */
export function cosmetiquesDebloques(solde: number): readonly Cosmetique[] {
  return mascotConfig.cosmetiques.filter((c) => solde >= c.pierresRequises);
}
