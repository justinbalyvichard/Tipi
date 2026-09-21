/**
 * Constantes de PRÉSENTATION, lisibles côté client (P2, §2 et §13, constat 16).
 *
 * Partage net avec `seuils.config.ts` : un seuil **réglable sur du réel** (une
 * confiance OCR, une tolérance de lecture) va dans `seuils.config.ts`, qui est
 * serveur parce qu'il lit `env.ts`. Une constante **de présentation** va ici.
 *
 * Aucune valeur de ce fichier n'est un secret, et aucune n'est une couleur :
 * les couleurs sont des jetons de `src/styles/themes.css` (DES-01, DES-02).
 */

/**
 * TEC-12 — au-delà de ce délai, une attente IA est habillée par l'animation
 * « Pilou réfléchit ». En deçà, rien ne s'affiche : un habillage qui
 * clignoterait pour 80 ms serait un effet flash, contre DES-08.
 */
export const SEUIL_ATTENTE_PILOU_MS = 400;

/**
 * PRD-13 — durée d'appui long ouvrant la sortie parent. Deux secondes : assez
 * long pour qu'un enfant de six ans ne l'atteigne pas par hasard, assez court
 * pour qu'un parent ne doute pas du geste.
 */
export const APPUI_LONG_MS = 2000;

/**
 * DES-08 — durées d'animation. Ces deux nombres RECOPIENT
 * `--tipi-duree-douce` et `--tipi-duree-posee` de `src/styles/themes.css`, qui
 * reste la source. Ils servent aux minuteries JavaScript qui doivent
 * s'accorder avec une transition CSS ; ce fichier n'écrit jamais un style.
 *
 * Duplication assumée, et sa raison : une minuterie `setTimeout` ne sait pas
 * lire une variable CSS sans un aller-retour au DOM, que le rendu serveur
 * n'a pas.
 *
 * GARDE-FOU, et il existe réellement depuis le tour 2 de G4.V1 : le contrôle 9
 * de `scripts/verifier-design-system.sh` **compare** ces constantes à **toutes
 * les déclarations** du jeton dans `themes.css`, et fait échouer l'instrument
 * sur tout écart, dans les deux sens — y compris quand un thème redéclare le
 * jeton avec une autre valeur. Ce dernier cas venait de `controle-code` au
 * tour 2 : `[data-theme="apple"] { --tipi-cible-min: 44px }` violait DES-04
 * sur un seul thème et passait vert, parce que le contrôle ne lisait que la
 * première déclaration (`[MINEUR] T2-3`). Au tour 1, ce commentaire annonçait une surveillance qui n'existait
 * pas — le contrôle n'ouvrait jamais ce fichier —, et `controle-code` l'a
 * démontré en faisant diverger 160 ms en 999 ms sans faire rougir quoi que ce
 * soit (V1.review.md, MAJEUR 1). La preuve du garde-fou corrigé, rougi sur
 * cette mutation exacte, est en §0.2 de `docs/agents/P4/V1.out.md`.
 */
export const DUREE_DOUCE_MS = 160;
export const DUREE_POSEE_MS = 260;

/**
 * DES-04 — cible tactile minimale, en pixels. Valeur de référence pour les
 * mesures au navigateur. Les composants n'écrivent pas ce nombre : ils
 * consomment le jeton Tailwind `min-h-cible`, adossé à `--tipi-cible-min`.
 *
 * Même duplication que les durées ci-dessus, donc même garde-fou : le contrôle
 * 9 compare cette constante à `--tipi-cible-min`. `controle-code` n'avait pas
 * relevé ce cas-ci ; il est de la même famille, je l'ai trouvé en corrigeant
 * l'autre, et il est couvert par le même mécanisme.
 */
export const CIBLE_TACTILE_MIN_PX = 56;

/**
 * PED-11, ARB-04 — profondeur de l'historique anti-répétition du tirage de
 * variantes. 1 = « jamais la même deux fois de suite », ce que la règle
 * `selection` de `content/encouragements.json` demande mot pour mot.
 */
export const VARIANTES_SANS_REPETITION = 1;

export const UI = Object.freeze({
  seuilAttentePilouMs: SEUIL_ATTENTE_PILOU_MS,
  appuiLongMs: APPUI_LONG_MS,
  dureeDouceMs: DUREE_DOUCE_MS,
  dureePoseeMs: DUREE_POSEE_MS,
  cibleTactileMinPx: CIBLE_TACTILE_MIN_PX,
  variantesSansRepetition: VARIANTES_SANS_REPETITION,
});
