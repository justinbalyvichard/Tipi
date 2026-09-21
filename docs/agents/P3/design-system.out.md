# P3 — Design system Tipi

Producteur : `design-system`. Porte : G3. Contrôleur : `controle-design`.
Date : 2026-09-21. Porte amont G2 : verte.

Sources lues avant d'écrire une ligne de code : `TIPI-PROMPT-CURSOR.md` en
entier, **bloc AMENDEMENTS en premier** (§1.3, §2.5, §3.1, §3.8) ;
`docs/agents/P2/architecture.out.md` (arborescence §2, `VoiceProvider` §5.2,
dépendances §15) ; `docs/agents/P1/produit-marketing.out.md` (§2 personnalité,
§4 brief icône et écran de lancement, §5 identité sonore, §7.9 coffre) ;
`content/ui-enfant.json` et `content/ui-parent.json` ; `docs/agents/GATES.md`
(ARB-01 à ARB-15) ; les cinq règles de `.cursor/rules/`.

---

## Sommaire

1. Ce qui est livré
2. Les deux thèmes : mécanique et jetons
3. Couverture DES-01 à DES-09, élément nommé par exigence
4. Contrastes mesurés (DES-05)
5. Les quatre décisions de design qui engagent la suite
6. Instruments de mesure et ce qu'ils ont trouvé
7. Sorties réelles des commandes
8. Ce que je n'ai pas fait, et ce que je n'ai pas pu vérifier
9. Points que je veux voir tranchés

---

# 1. Ce qui est livré

## 1.1 Fichiers du design system

| Fichier | Rôle |
| --- | --- |
| `tailwind.config.ts` | Jetons exposés en utilitaires. **Aucune valeur de couleur** : chaque entrée pointe vers une variable CSS. La palette par défaut de Tailwind est entièrement remplacée, donc `bg-red-500` n'existe pas et une couleur en dur n'est pas atteignable. |
| `src/styles/themes.css` | **Seul fichier du dépôt contenant une valeur de couleur.** Palettes littérales de 3.8, jetons de rôle par thème, base, `prefers-reduced-motion`. |
| `src/config/mascot.config.ts` | DES-09. Nom, palette (noms de variables CSS), tailles, cosmétiques, **voix figée** (TEC-08, ARB-14). |
| `src/components/ui/Button.tsx` | 3 variantes, `<button>` ou `<a>`, jamais autre chose. |
| `src/components/ui/Card.tsx` | Surface posée, 5 tons. |
| `src/components/ui/Chip.tsx` | Pastille d'information, jamais cliquable. |
| `src/components/ui/ProgressDots.tsx` | Repère de position sans aucun chiffre. |
| `src/components/ui/ListRow.tsx` | `ListGroup` + `ListRow`, listes groupées à filets. |
| `src/components/ui/Keypad.tsx` | Clavier 10 chiffres, saisie jamais en clair. |
| `src/components/ui/GemCounter.tsx` | Le seul composant autorisé à montrer un nombre à l'enfant. |
| `src/components/ui/ThemeSwitch.tsx` | Bascule PRD-17, contrôlée. |
| `src/components/ui/Icon.tsx` | 13 icônes SVG au trait. |
| `src/components/ui/theme.ts` | Type `Theme`, `appliquerTheme`. |
| `src/components/ui/cx.ts` | Concaténation de classes, sans dépendance. |
| `src/components/pilou/Pilou.tsx` | DES-09, le SVG unique paramétré. |
| `src/components/pilou/SpeechBubble.tsx` | Ce que Pilou dit, écrit. |
| `src/components/pilou/PilouReflechit.tsx` | Habillage d'attente (TEC-12). |
| `src/app/dev/design-system/page.tsx` | Contrôle visuel, les deux thèmes côte à côte. |
| `src/app/dev/design-system/textes.ts` | Lecteur de `content/` réservé à cette page. |
| `src/app/layout.tsx` | Layout racine minimal : `<html data-theme>`, polices. |
| `scripts/verifier-design-system.sh` | 9 contrôles de structure. |
| `scripts/verifier-contraste.mjs` | DES-05 : lit `themes.css`, calcule 68 couples. |

`SpeechBubble` et `PilouReflechit` sont dans `src/components/pilou/`, et non
dans `ui/`, parce que l'arborescence validée en G2 les y place nommément
(architecture §2, ligne `pilou/ — P3 — mascotte SVG, PilouReflechit,
SpeechBubble`). Ma fiche de mission disait `src/components/ui/**` ; j'ai suivi
l'architecture validée, qui est plus précise et postérieure.

## 1.2 Le socle minimal, et pourquoi il est ici

`package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`,
`.eslintrc.json` n'existaient pas : le dépôt ne contenait aucun fichier de
code. Or ma *definition of done* exige la sortie réelle de
`pnpm typecheck && pnpm lint && pnpm build`.

**Ce que j'ai fait, dit franchement** : j'ai créé le socle strictement
nécessaire à l'exécution de ces trois commandes, et rien de plus. Aucune
dépendance nouvelle n'est introduite : les dix paquets installés figurent tous
dans le tableau §15.1 de l'architecture, avec leur exigence
(`next`/`react`/`react-dom` → TEC-01 ; `typescript`/`@types/*` → TEC-01,
TEC-15 ; `tailwindcss`/`postcss`/`autoprefixer` → TEC-01, DES-01/02 ;
`eslint`/`eslint-config-next` → TEC-14, TEC-15). Prisma, Supabase, Zustand,
TanStack Query, Zod, Vitest, Playwright **ne sont pas installés** : ils
appartiennent à V1 et aux phases suivantes.

**Ce que la verticale V1 devra compléter, et non refaire** : les fournisseurs
dans `layout.tsx` (TanStack Query, Zustand), la lecture de
`child.theme_prefere` pour appliquer le thème mémorisé, `src/app/page.tsx`
(aiguillage), le chargeur `src/content/loader.ts` validé par Zod, et
`viewport.themeColor` avec l'écran de lancement (V9). Je n'ai posé aucune de
ces pièces pour ne pas préempter une décision qui n'est pas la mienne.

`.eslintrc.json` ajoute deux règles opposables à TEC-15 : `no-console: error`
et un `no-restricted-syntax` qui rejette le mot-clé `any` à la racine du
linter, pour que l'interdit soit tenu par l'outil et non par la vigilance.

---

# 2. Les deux thèmes : mécanique et jetons

## 2.1 La mécanique, en une phrase

`<html data-theme="pilou">` ou `data-theme="apple"`. `themes.css` déclare les
mêmes **jetons de rôle** dans les deux blocs, avec des valeurs différentes.
Commuter le thème ne remonte aucun composant React : le navigateur ré-résout
les variables. `appliquerTheme()` ne fait qu'écrire l'attribut.

Trois couches, dans cet ordre :

1. **Palettes littérales** — `--palette-pilou-*` (15 valeurs) et
   `--palette-apple-*` (12 valeurs) : la recopie exacte de 3.8, rien de plus.
   Aucun composant ne les consomme. Elles existent pour qu'un contrôleur
   vérifie la conformité à 3.8 sans lire le reste du fichier. Le contrôle 7 de
   `verifier-design-system.sh` vérifie que les 26 valeurs distinctes de 3.8
   sont présentes : **0 manquante**.
2. **Jetons de rôle** — `--tipi-*` et `--pilou-*`, définis deux fois, une fois
   par thème, chacun pointant vers une palette. C'est la seule couche que les
   composants voient.
3. **Utilitaires Tailwind** — `bg-surface`, `text-encre`, `rounded-carte`,
   `min-h-cible`… tous définis comme `var(--tipi-…)`.

L'invariant I1 de `verifier-contraste.mjs` vérifie que **tout rôle déclaré côté
Pilou est résolvable côté Apple** : 27 rôles, 0 non résolu. Un thème
incomplet serait invisible autrement — un `var()` non défini rend simplement
la propriété invalide, sans erreur.

## 2.2 Rayons, ombres, durées

| Jeton | Pilou | Apple | Source |
| --- | --- | --- | --- |
| `--tipi-rayon-liste` | 18 px | 14 px | 3.8 |
| `--tipi-rayon-carte` | 20 px | 20 px | 3.8 (Pilou : 18–22) |
| `--tipi-rayon-ecran` | 32 px | 32 px | 3.8 |
| `--tipi-rayon-badge` | 14 px | **8 px** | 3.8, « badges d'icônes en carrés arrondis 8 px » |
| `--tipi-rayon-pilule` | 999 px | 999 px | 3.8 |
| `--tipi-ombre-douce` | ombre portée douce, 2 couches | 1 couche à 4 % | 3.8 |
| `--tipi-cible-min` | 56 px | 56 px | DES-04 |
| `--tipi-duree-douce` | 160 ms | 160 ms | DES-08 |
| `--tipi-duree-posee` | 260 ms | 260 ms | DES-08 |
| `--pilou-trait` | 2,5 | **1,5** | trait fin demandé en thème Apple |
| `--tipi-icone-trait` | 2 | 1,6 | DES-07 |

**Aucun dégradé nulle part.** Le contrôle 3 mesure 0 occurrence dans les
sources. Dans le CSS construit, `grep gradient` renvoie exactement trois
lignes — `--tw-gradient-from-position`, `--tw-gradient-to-position`,
`--tw-gradient-via-position` — qui sont des propriétés vides du *reset*
Tailwind, jamais consommées : aucune fonction `linear-gradient(` ni
`radial-gradient(` n'existe dans le bundle. Je le signale plutôt que de le
taire, parce qu'un contrôleur qui lance ce grep le trouvera.

---

# 3. Couverture DES-01 à DES-09, élément nommé par exigence

| ID | Exigence | L'élément nommé qui la porte | Comment on le vérifie |
| --- | --- | --- | --- |
| **DES-01** | Thème « Pilou » avec les tokens exacts de 3.8 | `src/styles/themes.css`, bloc `--palette-pilou-*` (15 valeurs) + bloc de rôles `:root, [data-theme="pilou"]` | `verifier-design-system.sh` contrôle 7 : 26 jetons attendus, 0 manquant. Contrôle 1 : 0 couleur en dur hors de ce fichier. |
| **DES-02** | Thème « Apple » avec les tokens exacts de 3.8 | `src/styles/themes.css`, bloc `--palette-apple-*` (12 valeurs) + bloc `[data-theme="apple"]` | idem. Invariant I1 de `verifier-contraste.mjs` : 27 rôles, 0 non résolu côté Apple. |
| **DES-03** | Baloo 2 + Quicksand (Pilou), pile système (Apple) | `src/app/layout.tsx` (`next/font/google`, variables `--police-baloo` et `--police-quicksand`) et `themes.css` (`--pile-pilou-titre`, `--pile-pilou-texte`, `--pile-apple`, repris par `--tipi-police-titre` / `--tipi-police-texte`) ; `fontFamily.titre` / `fontFamily.texte` dans `tailwind.config.ts` | La pile Apple est recopiée mot pour mot de DES-03. Les deux polices sont téléchargées **à la construction** et servies depuis le domaine de l'application : aucun appel tiers au chargement (ETH-03). |
| **DES-04** | Cibles tactiles ≥ 56 px sur les écrans enfant | `--tipi-cible-min: 56px` dans `themes.css`, exposé en `min-h-cible` / `min-w-cible`. Porté par `Button`, `ListRow`, `ThemeSwitch`, `GemCounter` ; `Keypad` emploie `min-h-cible-large` (72 px) | `verifier-design-system.sh` contrôle 5 : les cinq composants interactifs listés, chacun avec sa contrainte. La valeur 56 n'est écrite **qu'une fois**, dans le jeton. |
| **DES-05** | Contraste WCAG AA sur chaque couple texte/fond, dans les deux thèmes | `scripts/verifier-contraste.mjs` + les rôles `--tipi-texte-appui`, `--tipi-accent-primaire-encre` et la taille `text-action` de `tailwind.config.ts` | **68 couples mesurés, 0 sous son seuil.** Tableau complet en section 4. |
| **DES-06** | Une seule action principale par écran, en bas | `Button` avec `pleineLargeur` ; `Keypad` **ne contient pas** son bouton de validation, qui est composé par l'écran pour rester en bas | Contrôle par lecture : `Keypad.tsx` n'exporte aucun bouton de validation. L'application de la règle écran par écran appartient aux verticales. |
| **DES-07** | Aucun emoji, icônes SVG au trait uniquement | `src/components/ui/Icon.tsx` — 13 tracés, `fill="none"`, `stroke="currentColor"`, épaisseur `--tipi-icone-trait` | `verifier-design-system.sh` contrôle 3 : 0 emoji dans les sources ; le HTML rendu de `/dev/design-system` a été analysé : 0 emoji, 81 `<svg>`. |
| **DES-08** | Animations courtes et douces, aucun clignotement, aucun flash | `tailwind.config.ts` : trois images-clés seulement — `apparait` (fondu entrant, `both`, ne se rejoue pas), `respire` (échelle 1 → 1,035 sur 4 s), `pense-1` (translation de 3 px). `themes.css` : bloc `@media (prefers-reduced-motion: reduce)` | Contrôle 9 : 0 `animate-ping` / `animate-pulse` / `animate-bounce`, 0 image-clé nommée `blink` ou `flash`. Aucune animation ne fait varier l'opacité en boucle. |
| **DES-09** | Mascotte SVG unique, paramétrée dans un seul fichier | `src/components/pilou/Pilou.tsx` (un seul `<svg>`) piloté par `src/config/mascot.config.ts` (nom, palette, tailles `hero`/`moyenne`/`icone`, 5 cosmétiques) | Un seul fichier dessine Pilou. La palette du fichier de config ne contient **aucune couleur** : uniquement des noms de variables CSS, ce qui fait que la même mascotte s'habille des deux thèmes. |

**DES-10** (icône d'application et écran de lancement) n'est pas dans mon
périmètre : le tableau §4.3 du prompt maître l'affecte à la verticale **V9**.
Le brief du marketing (§4.1 et §4.2) est intégralement lisible ; j'ai
seulement livré l'icône `tipi` du jeu d'icônes, au trait, qui n'est pas
l'icône d'application (celle-ci est une forme pleine sur aplat bleu). Et j'ai
volontairement **laissé `viewport.themeColor` vide** dans `layout.tsx` : ce
champ n'accepte qu'un littéral, et le renseigner aurait introduit la seule
couleur en dur du dépôt hors de `themes.css`. C'est à V9 de le servir depuis
la route qui connaît le thème mémorisé.

---

# 4. Contrastes mesurés (DES-05)

## 4.1 Méthode

`scripts/verifier-contraste.mjs` **ne recopie aucun hexadécimal**. Il lit
`src/styles/themes.css`, en extrait les blocs, résout les chaînes de `var()`
thème par thème, puis calcule la luminance relative WCAG 2.1. Le ratio est
**tronqué vers le bas** à deux décimales : un arrondi ne fait jamais passer un
couple.

C'est un choix délibéré contre la re-dérivation
(`40-protocole-agents.mdc`). Un script qui redéclarerait les couleurs serait
une seconde copie de la même table : les deux seraient d'accord même si la
table était fausse. Ici, si quelqu'un modifie `themes.css`, la mesure suit.

Seuils appliqués : **4,5:1** pour le petit texte, **3:1** pour le grand texte
(≥ 24 px, ou ≥ 18,66 px en graisse ≥ 700), **3:1** pour le non textuel
(WCAG 1.4.11), et aucun seuil pour le purement décoratif, chaque classement
étant justifié dans le script.

## 4.2 Résultat

**68 couples mesurés (34 par thème). 0 couple sous son seuil.**

Les chiffres saillants, thème par thème :

| Usage | Pilou | Apple |
| --- | --- | --- |
| texte de page sur fond | **13,49:1** | **15,45:1** |
| texte sur carte | **14,23:1** | **16,82:1** |
| sous-titre de liste (`--tipi-texte-appui`) | **5,84:1** | **16,82:1** |
| Button primaire | **6,57:1** | **4,01:1** (grand texte) |
| Button secondaire | **12,72:1** | **15,03:1** |
| Button texte sur fond | **5,54:1** | **3,32:1** (grand texte) |
| Chip (quatre tons) | 12,65 à **13,06:1** | **15,03:1** |
| GemCounter | **9,87:1** | **7,65:1** |
| badge d'icône, trois tons | 6,25 à **9,43:1** | 4,01 à **7,65:1** |
| contour ProgressDots | **5,54:1** | **3,32:1** |
| anneau de focus | **13,49:1** | **15,45:1** |
| silhouette de cosmétique verrouillé | **3,67:1** | **3,32:1** |
| trait de Pilou sur le fond | **13,49:1** | **15,45:1** |

Le tableau intégral, ligne par ligne, avec les valeurs résolues et le composant
porteur, est la sortie de la commande, reproduite en section 7.3.

## 4.3 Les cinq mesures de référence, publiées bien que non livrées

Elles ne comptent pas dans le verdict, parce qu'aucun composant ne les produit.
Elles sont publiées pour qu'aucun choix de couple ne serve à effacer un chiffre
gênant, et parce que ce sont elles qui **motivent** trois décisions de la
section 5.

| Couple | Pilou | Apple | Ce qu'il motive |
| --- | --- | --- | --- |
| `--tipi-texte-discret` sur fond | 3,67:1 | 3,32:1 | Aucun composant ne l'emploie en texte (contrôle 8 : 0 occurrence). |
| `--tipi-texte-secondaire` en **petit** texte sur surface | 5,84:1 | **3,62:1** | C'est ce 3,62 qui impose la décision DS-1. |
| blanc sur accent primaire en **petit** texte | 6,57:1 | **4,01:1** | C'est ce 4,01 qui impose `text-action` en graisse 700 (décision DS-2). |
| remplissage du cosmétique sur le corps | 1,92:1 | 3,68:1 | Mesure d'origine, avant de mesurer le trait qui cerne la forme (décision DS-4). |
| remplissage du cosmétique 2 sur le corps | 1,34:1 | 2,03:1 | idem. |

---

# 5. Les quatre décisions de design qui engagent la suite

## DS-1 — Le sous-titre du thème Apple est rendu en encre, pas en gris

**Le problème.** `#86868B`, le « texte secondaire » de 3.8 côté Apple, mesure
**3,62:1** sur la surface blanche et **3,32:1** sur le fond. En petit texte —
un sous-titre de `ListRow`, une légende — il est **sous AA**. Il n'existe dans
la palette Apple de 3.8 **aucun gris qui atteigne 4,5:1** : `#8E8E93` mesure
3,26:1, `#C7C7CC` 1,68:1. DES-02 (tokens exacts) et DES-05 (AA sur chaque
couple) ne peuvent pas être satisfaites ensemble par ce gris.

**Ce que j'ai fait.** J'ai séparé deux rôles qui étaient confondus :

- `--tipi-texte-secondaire` garde la valeur exacte de 3.8 dans chaque thème.
  Elle n'est employée que là où **3:1 suffit** : grand texte (la variante
  `texte` de `Button`, rendue en 20 px graisse 700) et éléments non textuels
  (contour des `ProgressDots`, du `Keypad`, points de `PilouReflechit`).
- `--tipi-texte-appui` est le rôle du **petit texte secondaire**. Il vaut
  `#6B6459` en thème Pilou (5,84:1) et **l'encre `#1D1D1F`** en thème Apple
  (16,82:1). La hiérarchie y est portée par la taille (15 px contre 17 px) et
  la graisse (400 contre 600), pas par un contraste insuffisant.

**Aucune couleur hors de 3.8 n'est introduite.** Les 26 valeurs de 3.8 sont
toutes déclarées, et le contrôle 7 le vérifie.

**La conséquence visible, dite franchement** : dans le thème Apple, les
sous-titres de liste sont aussi foncés que les titres. C'est visible sur le
rendu. C'est moins « Apple » qu'un gris, et c'est accessible. Je propose en
section 9 l'alternative qui rendrait le gris, et le coût qu'elle a.

## DS-2 — Tous les libellés d'action sont en 20 px graisse 700

`#007AFF` sur blanc mesure **4,01:1** : sous AA en petit texte, au-dessus du
seuil en grand texte. Plutôt que de renoncer au bleu d'Apple ou de le
falsifier, `Button` rend **tous** ses libellés en `text-action` — 1,25 rem
(20 px), graisse 700 — ce qui les fait franchir le seuil « grand texte » de
WCAG (≥ 18,66 px en gras) et ramène l'exigence à 3:1. Les trois couples
concernés passent : 4,01 (primaire), 3,32 (texte sur fond), 3,62 (texte sur
carte).

Ce n'est pas un contournement : c'est la règle WCAG appliquée telle qu'elle
est écrite, et le ratio de petit texte reste publié en mesure de référence pour
que personne ne découvre le chiffre plus tard. Effet de bord souhaitable : un
enfant de six ans et demi lit des libellés d'action plus gros.

## DS-3 — Dans le thème Apple, les quatre tons de teinte convergent

3.8 ne donne qu'**une** teinte au thème Apple (`#EAF3FF`). Les quatre rôles
`--tipi-teinte-*` y pointent donc tous vers elle. Les quatre tons de `Chip` et
de `Card` deviennent visuellement identiques dans ce thème.

C'est assumé, et c'est aussi la bonne règle d'accessibilité : une information
ne doit jamais tenir à la seule couleur. `Chip` porte une icône et un libellé ;
la lecture et les maths se distinguent par eux, dans les deux thèmes.

## DS-4 — La silhouette d'un cosmétique verrouillé doit se voir

`--pilou-silhouette` valait d'abord la couleur de ligne (`#EDE6D8` / `#E5E5EA`)
— **1,15:1 sur le fond**. Au rendu, le cosmétique verrouillé était
pratiquement invisible : l'enfant n'aurait pas su qu'il existe. Le marketing
(§7.9) demande « une silhouette neutre », pas une absence.

Le jeton pointe désormais vers `--palette-pilou-texte-discret` (`#8A8074`,
**3,67:1**) et `--palette-apple-texte-secondaire` (`#86868B`, **3,32:1**) : une
forme franchement perceptible, toujours neutre, toujours dans 3.8. Le couple a
été reclassé de « décoratif » en « non textuel », et non l'inverse.

Le pendant : les **joues** de Pilou restent classées décoratives (2,02:1 et
2,01:1). Elles n'ont pas de contour et ne portent aucune information ; les
retirer ne change rien à ce que l'écran dit. Les **formes cosmétiques**, elles,
sont cernées par le trait d'encre du groupe SVG : c'est le trait, mesuré à
6,57:1 et 4,18:1, qui rend la forme perceptible, et non le remplissage. Les
deux mesures — trait et remplissage — sont publiées.

---

# 6. Instruments de mesure et ce qu'ils ont trouvé

Les deux instruments sont dans `scripts/`, exécutables par le contrôleur.
Ils **impriment ce qu'ils trouvent avant de conclure** : un contrôle qui
n'affiche que « aucun problème » produit une preuve verte sans rien voir
(`40-protocole-agents.mdc`, règle 5).

## 6.1 Ce que les instruments ont réellement attrapé

Quatre défauts réels, trouvés par la mesure et non par relecture :

1. **`--tipi-surface-douce` déclaré et employé nulle part.** L'invariant I2
   (« tout rôle de couleur est employé par au moins un couple mesuré ») l'a
   signalé. C'était une couleur qui n'aurait jamais été mesurée. **Retiré** de
   `themes.css` et de `tailwind.config.ts`.
2. **`--pilou-joue` jamais mesuré.** Même invariant. Ajouté au tableau, classé
   décoratif avec son motif.
3. **La silhouette de cosmétique à 1,15:1** — voir DS-4. Trouvée par
   l'instrument, confirmée par le rendu.
4. **Trois hexadécimaux dans des commentaires de composants.** Le contrôle 1
   les a signalés. Je n'ai **pas** élargi le filtre pour ignorer les
   commentaires : j'ai réécrit les commentaires. Un filtre qui ignore les
   commentaires aurait laissé passer une vraie couleur mise en commentaire
   puis décommentée.

Le rendu visuel, lui, a attrapé trois défauts de dessin que rien d'automatique
n'aurait vus : les moustaches de Pilou traversaient ses joues, la queue se
lisait comme une spirale détachée, et les pattes étaient deux crochets sous le
corps. Corrigés — queue en forme pleine qui s'affine, pattes en deux ellipses,
moustaches supprimées (le brief du marketing n'en demande pas). L'icône `tipi`
se lisait comme un panneau de danger : deux perches croisées ont été ajoutées.

## 6.2 Un instrument corrigé, et l'ancienne version publiée

Le contrôle 9 cherchait d'abord les mots nus `blink|flash|clignot|animate-ping|
animate-pulse|animate-bounce`. Il signalait **5 occurrences**, que le script
imprime encore intégralement : quatre sont des commentaires qui *énoncent*
l'interdit, la cinquième est `BlinkMacSystemFont` dans la pile système d'Apple
— exigée mot pour mot par DES-03.

La règle retenue ne cherche plus que les utilitaires d'animation et les noms
d'images-clés : `animate-(ping|pulse|bounce)`, `@keyframes …(blink|flash)`,
`animation: …(blink|flash)`. Elle trouve **0 occurrence**.

Conformément à la règle « corriger un instrument de mesure », le script
**exécute et publie les deux versions** à chaque passage. Un contrôleur voit
ce que l'ancienne signalait et peut juger si le resserrage était légitime.

---

# 7. Sorties réelles des commandes

Toutes les sorties ci-dessous sont copiées telles quelles, depuis un `.next`
supprimé au préalable. Aucune n'est reconstituée.

## 7.1 `pnpm typecheck && pnpm lint && pnpm build`

```
> tipi@0.1.0 typecheck /home/user/Tipi
> tsc --noEmit


> tipi@0.1.0 lint /home/user/Tipi
> next lint

✔ No ESLint warnings or errors

> tipi@0.1.0 build /home/user/Tipi
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4) 
   Generating static pages (2/4) 
   Generating static pages (3/4) 
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /_not-found                          873 B          88.1 kB
└ ○ /dev/design-system                   15.4 kB         103 kB
+ First Load JS shared by all            87.2 kB
  ├ chunks/2200cc46-b77c45fb78a8b134.js  53.6 kB
  ├ chunks/945-ad046e1cc90e557b.js       31.7 kB
  └ other shared chunks (total)          1.86 kB


○  (Static)  prerendered as static content
```

Code de sortie de la chaîne : **0**.

`pnpm test` n'existe pas encore : Vitest appartient à P5, et l'architecture ne
l'installe pas avant. Je ne prétends donc rien sur les tests.

## 7.2 `bash scripts/verifier-design-system.sh`

```
=== 1. Couleurs en dur hors de src/styles/themes.css (DES-01, DES-02) ===
Motif : #hex, rgb(), rgba(), hsl(), hsla()
-- occurrences DANS themes.css (attendu : > 0, c'est le seul fichier autorisé) --
32
-- occurrences AILLEURS (attendu : 0) --
(aucune)
compte : 0

=== 2. Interdits de code TEC-15 (any, @ts-ignore, console.log) ===
: any\b|<any>|as any     -> 0 occurrence(s)
@ts-ignore               -> 0 occurrence(s)
console\.log             -> 0 occurrence(s)

=== 3. Emoji et dégradés (DES-07, 3.8) ===
emoji          -> 0
dégradés       -> 0

=== 4. Éléments cliquables : jamais un div ni un span ===
-- toutes les lignes portant onClick, avec la balise ouvrante la plus proche --
src/components/ui/Button.tsx:9: *   ni un `span` porteur d'un `onClick`. Le choix est dicté par la présence de
src/components/ui/Button.tsx:33:  readonly onClick?: () => void;
src/components/ui/Button.tsx:66:    onClick,
src/components/ui/Button.tsx:114:      onClick={onClick}
src/components/ui/Keypad.tsx:79:          <button key={c} type="button" onClick={() => ajouter(c)} className={toucheClasses}>
src/components/ui/Keypad.tsx:84:        <button type="button" onClick={() => ajouter(0)} className={toucheClasses}>
src/components/ui/Keypad.tsx:89:          onClick={effacer}
src/components/ui/Chip.tsx:9: * porteur d'un `onClick`, ce que le design system interdit. Quand une pastille
src/components/ui/ListRow.tsx:62:  | { readonly href: string; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:63:  | { readonly onClick: () => void; readonly href?: undefined }
src/components/ui/ListRow.tsx:64:  | { readonly href?: undefined; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:69:  const cliquable = props.href !== undefined || props.onClick !== undefined;
src/components/ui/ListRow.tsx:110:      ) : props.onClick !== undefined ? (
src/components/ui/ListRow.tsx:111:        <button type="button" onClick={props.onClick} className={classes}>
src/components/ui/ThemeSwitch.tsx:65:            onClick={() => onChange(option.theme)}
src/app/dev/design-system/page.tsx:128:          <Button variante="texte" onClick={() => setEtape((e) => (e + 1) % 3)}>
src/app/dev/design-system/page.tsx:148:            onClick={() => undefined}
-- div/span portant directement un onClick (attendu : 0) --
(aucun)

=== 5. Cible tactile 56 px (DES-04) ===
-- valeur du jeton --
60:  --tipi-cible-min: 56px; /* DES-04 */
-- composants interactifs et leur contrainte de hauteur --
src/components/ui/Button.tsx             min-h-cible 
src/components/ui/Keypad.tsx             min-h-cible-large 
src/components/ui/ListRow.tsx            min-h-cible 
src/components/ui/ThemeSwitch.tsx        min-h-cible 
src/components/ui/GemCounter.tsx         min-h-cible 

=== 6. Texte utilisateur en dur dans un composant ===
-- chaînes littérales rendues entre balises JSX, hors expressions --
(aucune)

=== 7. Jetons de 3.8 réellement déclarés ===
jetons 3.8 attendus : 26 — manquants : 0

=== 8. Règle d'emploi des deux jetons gris (DES-05) ===
-- text-texte-discret : ATTENDU 0 emploi (ratio 3,67:1 / 3,32:1) --
(aucun)
-- text-texte-secondaire : chaque emploi, avec la taille de texte de la même classe --
src/components/ui/Button.tsx:56:  texte: "bg-transparent text-texte-secondaire",
   (attendu : uniquement la variante « texte » de Button, rendue en text-action,
    soit 20 px graisse 700 — donc « grand texte » au sens de WCAG)

=== 9. Animations (DES-08) ===
-- toutes les images-clés déclarées --
111:        apparait: {
115:        respire: {
119:        "pense-1": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-3px)" } },
122:        apparait: "apparait var(--tipi-duree-posee) var(--tipi-courbe-douce) both",
123:        respire: "respire 4s var(--tipi-courbe-douce) infinite",
124:        "pense-1": "pense-1 1.8s var(--tipi-courbe-douce) infinite",
-- motifs interdits, ANCIENNE règle (mots nus) : elle signalait aussi la prose --
ancienne règle -> 5 occurrence(s), toutes listées :
src/components/pilou/PilouReflechit.tsx:12: * douce. Aucune opacité qui s'éteint, aucun clignotement, aucun flash, et rien
src/components/pilou/Pilou.tsx:23: * variation d'opacité, aucun clignotement ; la préférence système
src/styles/themes.css:75:  --pile-apple: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
src/styles/themes.css:229:  /* DES-08 : la commutation de thème ne doit pas produire de flash. On anime
tailwind.config.ts:109:        // extrêmes ni ne se répète en clignotant. `respire` est une échelle
-- motifs interdits, RÈGLE RETENUE : utilitaires d'animation et noms d'images-clés
   seulement, parce que « flash » et « clignotement » ci-dessus sont des mots de
   commentaire qui DISENT l'interdit, jamais du code qui le produit --
règle retenue -> 0 occurrence(s)
-- durées déclarées --
src/styles/themes.css:67:  --tipi-duree-douce: 160ms;
src/styles/themes.css:68:  --tipi-duree-posee: 260ms;
tailwind.config.ts:123:        respire: "respire 4s var(--tipi-courbe-douce) infinite",
tailwind.config.ts:124:        "pense-1": "pense-1 1.8s var(--tipi-courbe-douce) infinite",
-- prise en compte de prefers-reduced-motion --
241:@media (prefers-reduced-motion: reduce) {

=== VERDICT DE L INSTRUMENT : OK ===
```

Code de sortie : **0**.

## 7.3 `node scripts/verifier-contraste.mjs`

```
| Thème | Usage | Avant-plan | Fond | Ratio | Seuil | Verdict | Porté par |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pilou | texte de page | --tipi-encre #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 4.5:1 (petit) | OK | toutes les pages |
| pilou | texte sur carte | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 4.5:1 (petit) | OK | Card, SpeechBubble, ListRow |
| pilou | sous-titre de liste | --tipi-texte-appui #6b6459 | --tipi-surface #ffffff | 5.84:1 | 4.5:1 (petit) | OK | ListRow, ThemeSwitch |
| pilou | légende sur fond | --tipi-texte-appui #6b6459 | --tipi-fond #fff8ee | 5.54:1 | 4.5:1 (petit) | OK | Bloc de /dev/design-system |
| pilou | Button primaire | --tipi-accent-primaire-encre #2e2a26 | --tipi-accent-primaire #6fb8e8 | 6.57:1 | 3:1 (grand) | OK | Button |
| pilou | Button secondaire | --tipi-encre #2e2a26 | --tipi-teinte-bleu #e8f4fc | 12.72:1 | 4.5:1 (petit) | OK | Button |
| pilou | Button texte sur fond | --tipi-texte-secondaire #6b6459 | --tipi-fond #fff8ee | 5.54:1 | 3:1 (grand) | OK | Button |
| pilou | Button texte sur carte | --tipi-texte-secondaire #6b6459 | --tipi-surface #ffffff | 5.84:1 | 3:1 (grand) | OK | Button |
| pilou | Chip bleu | --tipi-encre #2e2a26 | --tipi-teinte-bleu #e8f4fc | 12.72:1 | 4.5:1 (petit) | OK | Chip, Card |
| pilou | Chip corail | --tipi-encre #2e2a26 | --tipi-teinte-corail #ffefe0 | 12.65:1 | 4.5:1 (petit) | OK | Chip, Card |
| pilou | Chip jaune | --tipi-encre #2e2a26 | --tipi-teinte-jaune #fff3d6 | 12.90:1 | 4.5:1 (petit) | OK | Chip, Card |
| pilou | Chip menthe | --tipi-encre #2e2a26 | --tipi-teinte-menthe #e9f9f0 | 13.06:1 | 4.5:1 (petit) | OK | Chip, Card |
| pilou | Chip neutre | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 4.5:1 (petit) | OK | Chip |
| pilou | GemCounter | --tipi-encre #2e2a26 | --tipi-accent-pierre #ffd166 | 9.87:1 | 4.5:1 (petit) | OK | GemCounter |
| pilou | Keypad, chiffre | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 4.5:1 (petit) | OK | Keypad |
| pilou | badge ListRow primaire | --tipi-accent-primaire-encre #2e2a26 | --tipi-accent-primaire #6fb8e8 | 6.57:1 | 3:1 (nonTexte) | OK | ListRow |
| pilou | badge ListRow secondaire | --tipi-encre #2e2a26 | --tipi-accent-secondaire #ff8b7b | 6.25:1 | 3:1 (nonTexte) | OK | ListRow |
| pilou | badge ListRow tertiaire | --tipi-encre #2e2a26 | --tipi-accent-tertiaire #8fe3c0 | 9.43:1 | 3:1 (nonTexte) | OK | ListRow |
| pilou | icône au trait sur carte | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 3:1 (nonTexte) | OK | Icon |
| pilou | icône au trait sur fond | --tipi-encre #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 3:1 (nonTexte) | OK | Icon |
| pilou | contour ProgressDots | --tipi-texte-secondaire #6b6459 | --tipi-fond #fff8ee | 5.54:1 | 3:1 (nonTexte) | OK | ProgressDots |
| pilou | contour Keypad | --tipi-texte-secondaire #6b6459 | --tipi-surface #ffffff | 5.84:1 | 3:1 (nonTexte) | OK | Keypad |
| pilou | points PilouReflechit | --tipi-texte-secondaire #6b6459 | --tipi-fond #fff8ee | 5.54:1 | 3:1 (nonTexte) | OK | PilouReflechit |
| pilou | anneau de focus | --tipi-encre #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 3:1 (nonTexte) | OK | themes.css, :focus-visible |
| pilou | option retenue ThemeSwitch | --tipi-encre #2e2a26 | --tipi-teinte-bleu #e8f4fc | 12.72:1 | 3:1 (nonTexte) | OK | ThemeSwitch |
| pilou | trait de Pilou sur fond | --pilou-trait-couleur #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 3:1 (nonTexte) | OK | Pilou |
| pilou | trait de Pilou sur son corps | --pilou-trait-couleur #2e2a26 | --pilou-corps #ffefe0 | 12.65:1 | 3:1 (nonTexte) | OK | Pilou |
| pilou | museau de Pilou | --pilou-museau #2e2a26 | --pilou-ventre #ffffff | 14.23:1 | 3:1 (nonTexte) | OK | Pilou |
| pilou | trait autour du cosmétique | --pilou-trait-couleur #2e2a26 | --pilou-cosmetique #6fb8e8 | 6.57:1 | 3:1 (nonTexte) | OK | Pilou |
| pilou | trait autour du cosmétique 2 | --pilou-trait-couleur #2e2a26 | --pilou-cosmetique-2 #8fe3c0 | 9.43:1 | 3:1 (nonTexte) | OK | Pilou |
| pilou | joues de Pilou | --pilou-joue #ff8b7b | --pilou-corps #ffefe0 | 2.02:1 | décoratif | OK | Pilou |
| pilou | filet de séparation | --tipi-ligne #ede6d8 | --tipi-surface #ffffff | 1.24:1 | décoratif | OK | ListGroup, Chip |
| pilou | chevron de ListRow | --tipi-pointille #d8ccb8 | --tipi-surface #ffffff | 1.58:1 | décoratif | OK | ListRow |
| pilou | silhouette de cosmétique | --pilou-silhouette #8a8074 | --tipi-fond #fff8ee | 3.67:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | texte de page | --tipi-encre #1d1d1f | --tipi-fond #f5f5f7 | 15.45:1 | 4.5:1 (petit) | OK | toutes les pages |
| apple | texte sur carte | --tipi-encre #1d1d1f | --tipi-surface #ffffff | 16.82:1 | 4.5:1 (petit) | OK | Card, SpeechBubble, ListRow |
| apple | sous-titre de liste | --tipi-texte-appui #1d1d1f | --tipi-surface #ffffff | 16.82:1 | 4.5:1 (petit) | OK | ListRow, ThemeSwitch |
| apple | légende sur fond | --tipi-texte-appui #1d1d1f | --tipi-fond #f5f5f7 | 15.45:1 | 4.5:1 (petit) | OK | Bloc de /dev/design-system |
| apple | Button primaire | --tipi-accent-primaire-encre #ffffff | --tipi-accent-primaire #007aff | 4.01:1 | 3:1 (grand) | OK | Button |
| apple | Button secondaire | --tipi-encre #1d1d1f | --tipi-teinte-bleu #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | Button |
| apple | Button texte sur fond | --tipi-texte-secondaire #86868b | --tipi-fond #f5f5f7 | 3.32:1 | 3:1 (grand) | OK | Button |
| apple | Button texte sur carte | --tipi-texte-secondaire #86868b | --tipi-surface #ffffff | 3.62:1 | 3:1 (grand) | OK | Button |
| apple | Chip bleu | --tipi-encre #1d1d1f | --tipi-teinte-bleu #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | Chip, Card |
| apple | Chip corail | --tipi-encre #1d1d1f | --tipi-teinte-corail #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | Chip, Card |
| apple | Chip jaune | --tipi-encre #1d1d1f | --tipi-teinte-jaune #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | Chip, Card |
| apple | Chip menthe | --tipi-encre #1d1d1f | --tipi-teinte-menthe #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | Chip, Card |
| apple | Chip neutre | --tipi-encre #1d1d1f | --tipi-surface #ffffff | 16.82:1 | 4.5:1 (petit) | OK | Chip |
| apple | GemCounter | --tipi-encre #1d1d1f | --tipi-accent-pierre #ff9500 | 7.65:1 | 4.5:1 (petit) | OK | GemCounter |
| apple | Keypad, chiffre | --tipi-encre #1d1d1f | --tipi-surface #ffffff | 16.82:1 | 4.5:1 (petit) | OK | Keypad |
| apple | badge ListRow primaire | --tipi-accent-primaire-encre #ffffff | --tipi-accent-primaire #007aff | 4.01:1 | 3:1 (nonTexte) | OK | ListRow |
| apple | badge ListRow secondaire | --tipi-encre #1d1d1f | --tipi-accent-secondaire #ff9500 | 7.65:1 | 3:1 (nonTexte) | OK | ListRow |
| apple | badge ListRow tertiaire | --tipi-encre #1d1d1f | --tipi-accent-tertiaire #34c759 | 7.58:1 | 3:1 (nonTexte) | OK | ListRow |
| apple | icône au trait sur carte | --tipi-encre #1d1d1f | --tipi-surface #ffffff | 16.82:1 | 3:1 (nonTexte) | OK | Icon |
| apple | icône au trait sur fond | --tipi-encre #1d1d1f | --tipi-fond #f5f5f7 | 15.45:1 | 3:1 (nonTexte) | OK | Icon |
| apple | contour ProgressDots | --tipi-texte-secondaire #86868b | --tipi-fond #f5f5f7 | 3.32:1 | 3:1 (nonTexte) | OK | ProgressDots |
| apple | contour Keypad | --tipi-texte-secondaire #86868b | --tipi-surface #ffffff | 3.62:1 | 3:1 (nonTexte) | OK | Keypad |
| apple | points PilouReflechit | --tipi-texte-secondaire #86868b | --tipi-fond #f5f5f7 | 3.32:1 | 3:1 (nonTexte) | OK | PilouReflechit |
| apple | anneau de focus | --tipi-encre #1d1d1f | --tipi-fond #f5f5f7 | 15.45:1 | 3:1 (nonTexte) | OK | themes.css, :focus-visible |
| apple | option retenue ThemeSwitch | --tipi-encre #1d1d1f | --tipi-teinte-bleu #eaf3ff | 15.03:1 | 3:1 (nonTexte) | OK | ThemeSwitch |
| apple | trait de Pilou sur fond | --pilou-trait-couleur #1d1d1f | --tipi-fond #f5f5f7 | 15.45:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | trait de Pilou sur son corps | --pilou-trait-couleur #1d1d1f | --pilou-corps #f5f5f7 | 15.45:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | museau de Pilou | --pilou-museau #1d1d1f | --pilou-ventre #ffffff | 16.82:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | trait autour du cosmétique | --pilou-trait-couleur #1d1d1f | --pilou-cosmetique #007aff | 4.18:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | trait autour du cosmétique 2 | --pilou-trait-couleur #1d1d1f | --pilou-cosmetique-2 #34c759 | 7.58:1 | 3:1 (nonTexte) | OK | Pilou |
| apple | joues de Pilou | --pilou-joue #ff9500 | --pilou-corps #f5f5f7 | 2.01:1 | décoratif | OK | Pilou |
| apple | filet de séparation | --tipi-ligne #e5e5ea | --tipi-surface #ffffff | 1.25:1 | décoratif | OK | ListGroup, Chip |
| apple | chevron de ListRow | --tipi-pointille #c7c7cc | --tipi-surface #ffffff | 1.68:1 | décoratif | OK | ListRow |
| apple | silhouette de cosmétique | --pilou-silhouette #86868b | --tipi-fond #f5f5f7 | 3.32:1 | 3:1 (nonTexte) | OK | Pilou |

| Thème | MESURE DE RÉFÉRENCE (non livrée) | Avant-plan | Fond | Ratio | Repère | Motif |
| --- | --- | --- | --- | --- | --- | --- |
| pilou | texte discret sur fond | --tipi-texte-discret | --tipi-fond | 3.67:1 | 4.5:1 | réservé au grand texte ; aucun composant livré ne l'emploie |
| pilou | texte secondaire en petit texte | --tipi-texte-secondaire | --tipi-surface | 5.84:1 | 4.5:1 | interdit en petit texte ; c'est ce chiffre qui motive la décision DS-1 |
| pilou | remplissage du cosmétique sur le corps | --pilou-cosmetique | --pilou-corps | 1.92:1 | 3:1 | mesure d'origine, avant de mesurer le trait qui cerne la forme |
| pilou | remplissage du cosmétique 2 sur le corps | --pilou-cosmetique-2 | --pilou-corps | 1.34:1 | 3:1 | mesure d'origine, avant de mesurer le trait qui cerne la forme |
| pilou | blanc sur accent primaire, en petit texte | --tipi-accent-primaire-encre | --tipi-accent-primaire | 6.57:1 | 4.5:1 | c'est ce chiffre qui impose text-action en graisse 700 |
| apple | texte discret sur fond | --tipi-texte-discret | --tipi-fond | 3.32:1 | 4.5:1 | réservé au grand texte ; aucun composant livré ne l'emploie |
| apple | texte secondaire en petit texte | --tipi-texte-secondaire | --tipi-surface | 3.62:1 | 4.5:1 | interdit en petit texte ; c'est ce chiffre qui motive la décision DS-1 |
| apple | remplissage du cosmétique sur le corps | --pilou-cosmetique | --pilou-corps | 3.68:1 | 3:1 | mesure d'origine, avant de mesurer le trait qui cerne la forme |
| apple | remplissage du cosmétique 2 sur le corps | --pilou-cosmetique-2 | --pilou-corps | 2.03:1 | 3:1 | mesure d'origine, avant de mesurer le trait qui cerne la forme |
| apple | blanc sur accent primaire, en petit texte | --tipi-accent-primaire-encre | --tipi-accent-primaire | 4.01:1 | 4.5:1 | c'est ce chiffre qui impose text-action en graisse 700 |

Couples mesurés : 68 (34 par thème, 2 thèmes).
Couples sous leur seuil : 0.
I1 — rôles déclarés côté Pilou : 27 ; non résolus côté Apple : 0
I2 — rôles de couleur : 25 ; jamais mesurés : 0

=== VERDICT DE L INSTRUMENT : OK ===
```

Code de sortie : **0**.

## 7.4 Analyse du HTML réellement rendu par `/dev/design-system`

Serveur de production démarré (`pnpm start`), page récupérée par `curl`,
HTTP 200, 94 601 octets, puis analysée :

```
panneaux data-theme : ['pilou', 'pilou', 'apple']
  texte présent « On commence » : True
  texte présent « Tes pierres » : True
  texte présent « Apparence » : True
  texte présent « Réécouter » : True
  texte présent « Code parent » : True
  texte présent « Je regarde tes devoirs » : True
clé technique visible (enfant.accueil) : False
emoji dans le HTML : False
aria-label count : 7
<button : 42  <a : 4
div|span avec onclick : 0
svg : 81
gradient : False
```

La ligne `clé technique visible : False` est la preuve que `t()` n'a pas rendu
d'identifiant à la place d'un texte : le lecteur **lève** sur une clé absente
plutôt que d'afficher la clé, précisément pour éviter un instrument qui montre
le défaut sans le voir.

## 7.5 Inspection du CSS construit

```
fichier: .next/static/css/944da87f30e79dd2.css
  ':root' présent : True
  '[data-theme=pilou]' présent : True
  '[data-theme=apple]' présent : True
  --tipi-cible-min:56px : True
  --pilou-trait:2.5 : True
  --pilou-trait:1.5 : True
  --tipi-rayon-liste:14px : True
  --tipi-rayon-liste:18px : True
  --tipi-rayon-badge:8px : True
  min-height:var(--tipi-cible-min) : True
  prefers-reduced-motion : True
```

## 7.6 Contrôle visuel réel

Un Chromium sans interface (Playwright 1.50.1, invoqué par `pnpm dlx` pour ne
**pas** l'inscrire dans `package.json` — il appartient à P6) a rendu
`/dev/design-system` en 1400 × 3377 px, pleine page, dans les deux panneaux.
J'ai regardé le rendu. C'est ce qui a permis de trouver les trois défauts de
dessin de Pilou, l'icône `tipi` qui se lisait comme un panneau de danger, et la
silhouette invisible de la décision DS-4.

Procédure reproductible par le contrôleur :

```
pnpm build && pnpm start -p 3114 &
pnpm dlx playwright@1.50.1 screenshot --full-page --viewport-size=1400,1000 \
  --wait-for-timeout=2000 http://127.0.0.1:3114/dev/design-system sortie.png
```

---

# 8. Ce que je n'ai pas fait, et ce que je n'ai pas pu vérifier

1. **`pnpm test` n'existe pas.** Vitest est une dépendance de P5. Je
   n'affirme rien sur des tests.
2. **Aucun commit git.** Interdit par ma fiche de mission ; l'arbre de travail
   porte les fichiers.
3. **Je n'ai pas mesuré les cibles tactiles dans un navigateur.** J'ai vérifié
   que la valeur 56 px est déclarée une seule fois, que `min-height:
   var(--tipi-cible-min)` est présent dans le CSS construit, et que les cinq
   composants interactifs portent la contrainte. Je n'ai pas lu de
   `getBoundingClientRect()` : le contrôleur devrait le faire, c'est la seule
   mesure qui prouve DES-04 sur le rendu et non sur la déclaration.
4. **Je n'ai pas testé sur un appareil tactile réel**, ni avec un lecteur
   d'écran. Les rôles ARIA posés (`radiogroup`/`radio` sur `ThemeSwitch`,
   `status`/`aria-live` sur `SpeechBubble` et `PilouReflechit`, `role="img"`
   sur les icônes porteuses de sens) sont conformes aux spécifications mais
   n'ont pas été entendus.
5. **Les libellés des cinq cosmétiques n'existent pas dans `content/`.**
   `mascot.config.ts` déclare pour chacun une `cleLibelle`
   (`coffre.cosmetiques.aucun`, `.echarpe`, `.bonnet`, `.noeud`, `.lunettes`),
   mais ces clés **ne sont pas** dans `content/ui-enfant.json`. Je ne les ai
   pas écrites : ARB-10 réserve les textes d'interface à `contenu-enfant`, et
   `30-copy-enfant.mdc` exige le visa de `gardien-charte`. Voir le point 3 de
   la section 9. La page de contrôle affiche l'identifiant technique
   (`echarpe`), jamais un libellé inventé.
6. **Les cinq seuils de pierres des cosmétiques (15, 30, 45, 60) sont de moi.**
   Aucune source ne les fixe. Ils sont dans `mascot.config.ts`, en un seul
   endroit, et V6 peut les changer sans toucher à un composant. Voir le
   point 4 de la section 9.
7. **`--tipi-texte-discret` n'est employé par aucun texte.** C'est voulu
   (3,67:1 / 3,32:1). Le jeton existe parce que 3.8 le nomme et que DES-01
   demande les tokens exacts, et il sert désormais de source à
   `--pilou-silhouette`. Si le contrôleur estime qu'un jeton non employé en
   texte est un défaut, c'est un point de désaccord légitime.

---

# 9. Points que je veux voir tranchés

**1. La décision DS-1 est-elle acceptée, ou faut-il amender 3.8 ?**
Le gris secondaire d'Apple, `#86868B`, est à 3,62:1 : il ne peut pas porter du
petit texte sans violer DES-05, et aucun gris de la palette Apple n'atteint
4,5:1. J'ai choisi de rendre les sous-titres du thème Apple en encre, avec une
hiérarchie par taille et graisse. Conséquence visible : le thème Apple perd ses
sous-titres gris.
*Alternative*, si l'Orchestrateur préfère garder l'aspect : ajouter à 3.8 une
seule valeur, `#6E6E73`, qui mesure **5,15:1** sur blanc. C'est un amendement
de la section 3.8 du prompt maître, donc une décision qui n'est pas la mienne.
**Question fermée : conserve-t-on DS-1, ou ajoute-t-on `#6E6E73` à 3.8 ?**

**2. La décision DS-2 est-elle acceptée ?**
Tous les libellés d'action font 20 px en graisse 700, dans les deux thèmes,
parce que c'est ce qui rend le bleu `#007AFF` conforme à AA. Le thème Apple en
devient plus gras que le vrai iOS. **Question fermée : accepte-t-on des
libellés d'action en graisse 700 dans le thème Apple ?**

**3. Qui écrit les cinq libellés de cosmétiques, et quand ?**
`coffre.cosmetiques.verrouille` existe (« Il en faut {n} pour celui-là. ») mais
aucune clé ne nomme les cosmétiques eux-mêmes. ARB-10 dit que ces textes
appartiennent à `contenu-enfant`. **Question fermée : fait-on produire ces cinq
clés par `contenu-enfant` avant l'ouverture de V6, ou l'écran du coffre
n'affiche-t-il jamais le nom d'un cosmétique ?** (La seconde option se tient :
l'enfant voit la silhouette et Pilou habillée, ce qui suffit.)

**4. Les seuils de pierres des cosmétiques.**
J'ai posé 0 / 15 / 30 / 45 / 60, sans source. Une soirée complète vaut 3
pierres (ARB-13), donc le premier cosmétique arrive au bout de 5 soirées et le
dernier au bout de 20. **Question fermée : cette échelle convient-elle, ou V6
la refixe-t-elle avec les paliers du parent ?**

**5. Les joues de Pilou dans le thème Apple.**
Elles sont peintes en `#FF9500`, seul accent de 3.8 qui ressemble à un fard.
Au rendu, elles sont plus vives que dans le thème Pilou, ce qui jure un peu
avec la sobriété annoncée par `reglages.theme.apple_aide` (« Sobre, proche des
réglages du téléphone »). **Question fermée : garde-t-on l'orange, ou les joues
disparaissent-elles dans le thème Apple ?**

**6. Le socle minimal de la section 1.2 doit-il rester, ou être refait par V1 ?**
J'ai créé `package.json`, `tsconfig.json`, `next.config.mjs`,
`postcss.config.mjs` et `.eslintrc.json` pour pouvoir exécuter les commandes
exigées par ma *definition of done*. C'est, à la lettre, du périmètre de V1.
**Question fermée : V1 part-elle de ce socle, ou le remplace-t-elle ?** S'il
est remplacé, il faut préserver les deux règles ESLint de TEC-15 et les
options `strict` + `noUncheckedIndexedAccess` du `tsconfig.json`.
