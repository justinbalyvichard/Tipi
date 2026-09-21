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

# 0. Reprise après verdict du tour 1

Verdict reçu : `FAIL`, **2 [MAJEUR]**, **10 [MINEUR]**, aller-retour 1 sur 3
(`docs/agents/P3/design-system.review.md`). Les deux majeurs portent sur Pilou,
et tous deux sur le même point aveugle, que le contrôleur a nommé mieux que je
ne l'avais vu : **mon instrument de contraste mesurait ce que je déclarais
dessiner, jamais ce que la page dessine.**

Ce qui suit dit ce que j'ai changé, ce que j'ai mesuré, et ce que je n'ai pas
réussi à corriger.

## 0.1 [MAJEUR] 1 — `lunettes` annulait le trait d'encre

Le constat est exact et la citation est juste. `src/components/pilou/Pilou.tsx`
ouvrait son groupe par `<g fill="none" stroke={couleur}>`, ce qui écrasait le
`stroke` d'encre du groupe parent. La monture était donc tracée en
`--pilou-cosmetique` : **2,05:1 sur le fond, 1,92:1 sur le corps** en thème
Pilou. Ma phrase de la décision DS-4 — « les formes cosmétiques sont cernées
par le trait d'encre » — était vraie pour quatre variantes sur cinq, et fausse
pour la cinquième. Une affirmation vraie à 80 % est une affirmation fausse.

**Correction du tracé.** La monture est désormais un **anneau plein** :
`fill={couleur}` avec `fillRule="evenodd"` pour le trou de la lentille, et le
trait d'encre du groupe parent qui la cerne — exactement la construction des
quatre autres variantes. Aucune variante ne redéfinit plus `stroke`.

**La règle est inscrite en tête du composant**, en toutes lettres, parce qu'une
règle qui ne vit que dans un rapport ne survit pas à la sixième variante :

> Toute forme colorée est *cernée* par le trait d'encre du groupe parent. Une
> variante ne redéfinit jamais `stroke`.

**Correction de l'instrument** — c'est la partie qui compte, voir 0.3.

## 0.2 [MAJEUR] 2 — `silhouette` écrasait le cosmétique

Le constat est exact. `<Cosmetique id={silhouette ? "aucun" : cosmetique} />`
forçait le cosmétique à `aucun` : les quatre paliers verrouillés rendaient le
même dessin, et l'API livrée **ne pouvait pas** écrire l'écran validé en G1.
J'avais lu « silhouette neutre » comme portant sur la mascotte ; le livrable
marketing dit « un **cosmétique verrouillé** est affiché en silhouette
neutre ». C'est le cosmétique, pas la mascotte.

**Deux états dissociés**, comme demandé :

| Propriété | Effet |
| --- | --- |
| `silhouette` | La **mascotte entière** en aplat neutre, cosmétique compris. |
| `cosmetiqueVerrouille` | Pilou **normale**, le **cosmétique seul** en aplat neutre. |

`<Pilou cosmetique="bonnet" cosmetiqueVerrouille />` produit désormais « Pilou
normale + bonnet en silhouette ». Les deux propriétés se composent sans se
contredire. Le rendu du cosmétique en silhouette est à **3,67:1** (Pilou) et
**3,32:1** (Apple) contre le fond, ratios déjà mesurés et conformes.

**La page `/dev/design-system` porte les quatre vignettes verrouillées**, sous
la clé `coffre.cosmetiques.verrouille`. Sans elles, le prochain contrôle visuel
n'aurait pas vu davantage que le précédent — c'est le point que le contrôleur
soulève, et il a raison : un défaut d'API invisible sur la page de contrôle est
un défaut qui revient.

## 0.3 L'invariant qui manquait, et ce qu'il trouve tout seul

Le contrôleur écrit que mon instrument avait « coupé le cordon avec les
couleurs, mais pas avec l'intention du producteur sur ce que la page dessine ».
C'est exact, et c'est la bonne formulation du défaut : une re-dérivation
déplacée d'un cran, pas supprimée.

**Nouvel instrument : `scripts/verifier-contraste-rendu.mjs`.** Il n'a aucune
liste. Il ouvre la page dans un navigateur, énumère le DOM rendu, et mesure :

> **Toute couleur calculée par le navigateur pour un texte ou un tracé, contre
> son fond effectif, est mesurée.**

Règle appliquée aux tracés SVG : une forme est perceptible si **son trait OU
son remplissage** atteint 3:1. C'est la règle du dessin de Pilou rendue
mesurable — un remplissage peu contrasté est acceptable *parce qu'il est cerné
par le trait d'encre*, et cesse de l'être dès que ce trait disparaît.

**La seule porte de sortie est explicite** : un élément n'échappe à la mesure
que s'il porte `data-tipi-decor`, ou est sous un ancêtre qui le porte. Ces
éléments sont **mesurés et publiés quand même**, avec leur ratio et leur motif.
Par défaut, tout est mesuré : une forme nouvelle est couverte par construction,
sans que personne pense à l'inscrire. Les deux seules exemptions du dépôt sont
les joues de Pilou et le chevron de `ListRow`.

### La preuve : le nouvel instrument, rejoué sur le code du TOUR 1

Conformément à la règle 1 de « Corriger un instrument de mesure », j'ai remis
`Pilou.tsx` et la page du tour 1 (depuis le commit `dad1524`), reconstruit, et
lancé le **nouvel** instrument dessus. Il trouve le [MAJEUR] 1 seul, sans que
rien ne le lui indique :

```
## Empreinte de la page mesurée

URL : http://127.0.0.1:3220/dev/design-system
Éléments : 981 · SVG Pilou : 22 · SVG icône : 59 · marqués `data-tipi-decor` : 6
Textes relevés : 127 · formes relevées : 537

| 10 | pilou | Pilou | 20× circle | none | — | rgb(255, 139, 123) | 2.15 | rgb(255, 248, 238) | 2.15:1 | *** SOUS SEUIL *** |
| 17 | pilou | Pilou | 4× circle | rgb(111, 184, 232) | 2.05 | none | — | rgb(255, 248, 238) | 2.05:1 | *** SOUS SEUIL *** |
| 27 | apple | Pilou | 20× circle | none | — | rgb(255, 149, 0) | 2.01 | rgb(245, 245, 247) | 2.01:1 | *** SOUS SEUIL *** |

Textes mesurés : 123. Groupes de tracés mesurés : 36 (537 formes).
Sous leur seuil : 3.
Exemptions : 2 par `data-tipi-decor` (6 éléments marqués dans le DOM), 6 par WCAG 1.4.3 (désactivés).
=== VERDICT DE L INSTRUMENT : ECHEC ===
```

La ligne `2.05` est la monture des lunettes : `stroke rgb(111, 184, 232)`,
aucun remplissage, fond crème. C'est le défaut que le contrôleur a trouvé à la
main, retrouvé par la mesure. Les deux autres lignes sont les joues, que le
tour 1 ne marquait pas comme décoratives — elles le sont désormais, donc
mesurées **et publiées** en exemption plutôt que passées sous silence.

**Honnêteté sur la portée : cet instrument n'attrape pas le [MAJEUR] 2.** Une
silhouette qui écrase son cosmétique n'est pas un défaut de contraste ; c'est
un défaut d'API. Rien d'automatique ne l'aurait vu. Ce sont les quatre
vignettes verrouillées de la page de contrôle, et un œil, qui le voient. Je le
dis plutôt que de laisser croire que l'instrument couvre les deux.

### Un incident de l'instrument, publié parce qu'il est instructif

Au premier lancement sur le code du tour 2, l'instrument a imprimé
`Textes mesurés : 0 ... VERDICT DE L INSTRUMENT : OK` et est sorti en **0**.
Un serveur d'une version antérieure était resté lié au port ; le nouveau n'a
pas pu s'y lier. L'instrument a d'abord mesuré une page vide, puis — au
lancement suivant — la **mauvaise version**, sans rien signaler.

C'est la règle 4 du protocole (« un détecteur qui ne trouve plus rien est
suspect ») et la règle 5 (une preuve verte sans rien voir), dans mon propre
instrument, au tour même où je corrigeais ce défaut ailleurs. J'ai failli
publier des mesures du tour 1 comme preuve du tour 2.

Deux corrections :

1. **Une garde de vraisemblance.** En dessous de 60 textes, 300 formes ou
   20 SVG de Pilou, l'instrument **refuse de conclure** et sort en 3 avec le
   motif. Elle répond à « a-t-on mesuré une vraie page ? », et à rien d'autre :
   la gater aussi sur la version empêcherait de rejouer l'instrument sur une
   version antérieure, ce que la règle 1 demande précisément.
2. **Une empreinte imprimée à chaque passage**, qui dit *quelle* page a été
   mesurée et pas seulement combien de couples s'y trouvaient. C'est elle qui
   m'aurait évité l'erreur : `SVG Pilou : 22 · marqués : 6` pour le tour 1
   contre `SVG Pilou : 30 · marqués : 66` pour le tour 2.

## 0.4 ARB-16 — les seuils de pierres sortent du code

Arbitrage appliqué tel que rendu : **la structure reste, les valeurs partent.**
Le champ `pierresRequises` existe toujours, un seuil constant et unique par
cosmétique, sans aucun reverrouillage possible (ETH-04) ; son type devient
`number | null` et les cinq entrées valent `null`. Le commentaire du fichier
cite ARB-16 et nomme ce qui manque : une décision produit, avant V6.

J'ai également **retiré `cosmetiquesDebloques(solde)`**. Le contrôleur note
qu'il s'agit de logique de déverrouillage dans un fichier que DES-09 réserve au
« nom, aux couleurs et aux variantes cosmétiques ». Il a raison, et cette
fonction n'a de sens qu'une fois les seuils fixés : elle appartient à V6, avec
le service des pierres. Aucun appelant n'existait.

## 0.5 Les dix [MINEUR], un par un

| # | Constat | Traitement |
| --- | --- | --- |
| 3 | Un couple rendu absent de la liste des 68 — le sous-titre de l'option retenue de `ThemeSwitch` sur teinte bleue | **Corrigé.** Couple ajouté à `verifier-contraste.mjs` : **5,22:1** (Pilou) et **15,03:1** (Apple) — le 5,22 recoupe au centième la mesure navigateur du contrôleur. Et surtout, c'est l'instrument de rendu qui supprime la cause : il n'y a plus de liste à tenir. |
| 4 | Les états désactivés ne sont mesurés par aucun instrument | **Corrigé et dépassé.** L'instrument de rendu compose l'alpha et mesure les six états désactivés, publiés en section C avec le motif « exempté par WCAG 2.1 SC 1.4.3 ». Sur la remarque de fond concernant la touche « Effacer », désactivée **dès l'ouverture** : son opacité passe de 40 % à 60 %, comme `Button`. Mesurée, elle passe de **2,32:1 à 4,44:1**. La norme l'exemptait ; un parent qui ne voit pas une touche à l'ouverture, non. |
| 5 | `#6E6E73` annoncé à 5,15:1 | **Corrigé** en 5,07:1 (§9 point 1). Chiffre faux de ma part, recalculé : 5,0713 tronqué. |
| 6 | « Seul fichier du dépôt contenant une couleur » est inexact | **Corrigé dans les deux endroits** (§1.1 du rapport et en-tête de `themes.css`) : le périmètre réel est *`src/` et `tailwind.config.ts`*. Et le contrôle 1 **balaie désormais le dépôt entier, y compris les valeurs sans dièse**, nomme ses trois porteurs légitimes et échoue sur tout porteur inattendu. Il n'est plus aveugle à sa propre table. |
| 7 | Cinq clés de contenu pendantes, dans un lecteur qui lève | **Hors de mon périmètre**, l'Orchestrateur l'a confié à `contenu-enfant` (ARB-10). Les cinq `cleLibelle` restent déclarées : elles disent ce qui manque. Le commentaire du fichier le nomme désormais. |
| 8 | Les seuils 0/15/30/45/60 sans source | **Corrigé**, voir 0.4 (ARB-16). |
| 9 | Défauts de dessin au rendu | Traités en 0.6. |
| 10 | Deux jetons de 3.8 déclarés et reliés à aucun rôle ; I2 ne les couvre pas | **Corrigé.** Nouvel invariant **I3** dans `verifier-contraste.mjs` : toute entrée de palette est soit reliée à un rôle, soit inscrite dans une liste explicite. Sortie : `entrées de palette : 27 ; sans rôle : 2 (--palette-apple-accent-rouge, --palette-apple-accent-gris) ; sans rôle ET non déclarées : 0`. La limite que le contrôleur demandait d'écrire est désormais mesurée. |
| 11 | Deux fragilités de `verifier-contraste.mjs` | **Corrigées.** Branche morte retirée. `var(--x, repli)` **rejeté bruyamment** au lieu de produire un `NaN:1` affiché. Précision : le rejet ne vise que la forme `var(...)` **seule** — une pile de polices `var(--police-baloo), "Baloo 2", system-ui` n'en est pas une, et ma première version, trop large, faisait échouer l'instrument sur les jetons de police. Défaut trouvé en rejouant, corrigé, publié ici. |
| 12 | Le §8.2 du rapport (« aucun commit git ») est devenu faux | **Corrigé** en §8.2. Le commit `dad1524` a été fait par l'Orchestrateur après ma dernière écriture. Je n'ai toujours effectué aucun commit. |

## 0.6 Les défauts de dessin du constat 9

| Défaut | Traitement |
| --- | --- |
| L'icône `engrenage` se lit comme un pictogramme de luminosité | **Corrigé.** Le cercle et ses huit rayons droits sont remplacés par une **couronne crénelée** — des dents, pas des rayons. |
| Le pompon du bonnet est rogné de 1 px | **Corrigé.** `cy` passe de 6 à 9 et `r` de 7 à 6,5 : la forme entre dans le `viewBox`. |
| **Pilou se lit comme un ours en peluche, pas comme une loutre** | **Amélioré, pas résolu — et je le dis plutôt que de le déclarer corrigé.** Les oreilles passent de `r=12` à `r=9` (31 % à 23 % de la tête) et sont posées **sur** le cercle de la tête au lieu d'être entièrement dehors ; la queue est allongée et effilée ; le museau est élargi et abaissé. Au rendu, elle est moins « ours ». Elle n'est pas pour autant une loutre reconnaissable. Aucune exigence ne chiffre la géométrie de la mascotte, et §1.3 est respecté sur ce qu'il énonce (« contours très arrondis, petites oreilles rondes, joues colorées, museau doux »). Je porte la question à l'Orchestrateur (§9, point 7) plutôt que de la refermer moi-même : c'est une décision d'identité, et elle doit être prise avant DES-10 et les neuf verticales. |
| En thème Apple, `--pilou-corps` vaut exactement `--tipi-fond` | **Non corrigé, désormais écrit.** La palette Apple de 3.8 ne contient aucune teinte de corps : ses douze valeurs sont deux fonds, une encre, deux gris, un chevron, cinq accents saturés et une teinte bleue. Donner un corps à Pilou en thème Apple demanderait une 13ᵉ valeur, donc un amendement de 3.8. Le corps est à **1,00:1** avec la page et seul le trait d'encre (15,45:1) la dessine — ce qui est cohérent avec le trait fin et la sobriété annoncés, et mesuré conforme. L'asymétrie entre les deux thèmes est réelle et elle est maintenant inscrite ici et en §5. |

## 0.7 Les deux conflits DES-02 contre DES-05

Le contrôleur valide DS-1 et DS-2, et tranche le point que je posais : **ni
DES-02 ni DES-05 n'a à céder, le conflit n'était qu'apparent** — DES-02 impose
une palette, DES-05 porte sur les couples rendus, et la séparation des rôles
satisfait les deux à la lettre. Ajouter `#6E6E73` aurait violé DES-02. La
question DS-1 du §9 est donc **close** : l'encre est conservée, et je retire
l'alternative que je proposais.

Sa réserve sur `Button variante="texte"` en thème Apple (3,32:1) est traitée au
§9, point 8 : je ne l'ai pas changée, et j'explique pourquoi.

## 0.8 Sorties réelles, tour 2

Toutes reproduites ci-dessous depuis un `.next` supprimé au préalable, aucune
recomposée. Les trois instruments sortent en **0**.

### `pnpm typecheck && pnpm lint && pnpm build`

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
└ ○ /dev/design-system                   15.6 kB         103 kB
+ First Load JS shared by all            87.2 kB
  ├ chunks/2200cc46-b77c45fb78a8b134.js  53.6 kB
  ├ chunks/945-ad046e1cc90e557b.js       31.7 kB
  └ other shared chunks (total)          1.86 kB


○  (Static)  prerendered as static content
```

### `bash scripts/verifier-design-system.sh`

```

=== 1. Couleurs en dur (DES-01, DES-02) ===
Motif : #hex (avec ou sans dièse pour la table de référence), rgb(), rgba(), hsl(), hsla()
-- occurrences DANS themes.css (attendu : > 0, c'est le seul fichier de code autorisé) --
32
-- occurrences dans le CODE APPLICATIF, ailleurs (attendu : 0) --
(aucune)
compte : 0
-- BALAYAGE DU DÉPÔT ENTIER, y compris sans dièse : les porteurs de couleur
   hors themes.css doivent être des TABLES DE RÉFÉRENCE nommées ci-dessous,
   jamais du code rendu. Le tour 1 annonçait un périmètre trop large et ce
   contrôle était aveugle à sa propre table (constat 6) --
   porteurs légitimes déclarés : scripts/verifier-design-system.sh .cursor/rules/20-themes.mdc src/styles/themes.css
   porteurs trouvés :
     .cursor/rules/20-themes.mdc
     scripts/verifier-design-system.sh
     src/styles/themes.css
   aucun porteur inattendu

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
src/components/ui/Keypad.tsx:83:          <button key={c} type="button" onClick={() => ajouter(c)} className={toucheClasses}>
src/components/ui/Keypad.tsx:88:        <button type="button" onClick={() => ajouter(0)} className={toucheClasses}>
src/components/ui/Keypad.tsx:93:          onClick={effacer}
src/components/ui/Chip.tsx:9: * porteur d'un `onClick`, ce que le design system interdit. Quand une pastille
src/components/ui/ListRow.tsx:62:  | { readonly href: string; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:63:  | { readonly onClick: () => void; readonly href?: undefined }
src/components/ui/ListRow.tsx:64:  | { readonly href?: undefined; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:69:  const cliquable = props.href !== undefined || props.onClick !== undefined;
src/components/ui/ListRow.tsx:115:      ) : props.onClick !== undefined ? (
src/components/ui/ListRow.tsx:116:        <button type="button" onClick={props.onClick} className={classes}>
src/components/ui/ThemeSwitch.tsx:65:            onClick={() => onChange(option.theme)}
src/app/dev/design-system/page.tsx:128:          <Button variante="texte" onClick={() => setEtape((e) => (e + 1) % 3)}>
src/app/dev/design-system/page.tsx:148:            onClick={() => undefined}
-- div/span portant directement un onClick (attendu : 0) --
(aucun)

=== 5. Cible tactile 56 px (DES-04) ===
-- valeur du jeton --
69:  --tipi-cible-min: 56px; /* DES-04 */
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
src/components/pilou/Pilou.tsx:37: * variation d'opacité, aucun clignotement ; la préférence système
src/styles/themes.css:84:  --pile-apple: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
src/styles/themes.css:238:  /* DES-08 : la commutation de thème ne doit pas produire de flash. On anime
tailwind.config.ts:109:        // extrêmes ni ne se répète en clignotant. `respire` est une échelle
-- motifs interdits, RÈGLE RETENUE : utilitaires d'animation et noms d'images-clés
   seulement, parce que « flash » et « clignotement » ci-dessus sont des mots de
   commentaire qui DISENT l'interdit, jamais du code qui le produit --
règle retenue -> 0 occurrence(s)
-- durées déclarées --
src/styles/themes.css:76:  --tipi-duree-douce: 160ms;
src/styles/themes.css:77:  --tipi-duree-posee: 260ms;
tailwind.config.ts:123:        respire: "respire 4s var(--tipi-courbe-douce) infinite",
tailwind.config.ts:124:        "pense-1": "pense-1 1.8s var(--tipi-courbe-douce) infinite",
-- prise en compte de prefers-reduced-motion --
250:@media (prefers-reduced-motion: reduce) {

=== VERDICT DE L INSTRUMENT : OK ===
```

### `node scripts/verifier-contraste.mjs` — le jeu de jetons

```
| Thème | Usage | Avant-plan | Fond | Ratio | Seuil | Verdict | Porté par |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pilou | texte de page | --tipi-encre #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 4.5:1 (petit) | OK | toutes les pages |
| pilou | texte sur carte | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 4.5:1 (petit) | OK | Card, SpeechBubble, ListRow |
| pilou | sous-titre de liste | --tipi-texte-appui #6b6459 | --tipi-surface #ffffff | 5.84:1 | 4.5:1 (petit) | OK | ListRow, ThemeSwitch |
| pilou | sous-titre ThemeSwitch, option retenue | --tipi-texte-appui #6b6459 | --tipi-teinte-bleu #e8f4fc | 5.22:1 | 4.5:1 (petit) | OK | ThemeSwitch |
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
| apple | sous-titre ThemeSwitch, option retenue | --tipi-texte-appui #1d1d1f | --tipi-teinte-bleu #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | ThemeSwitch |
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

Couples mesurés : 70 (35 par thème, 2 thèmes).
Couples sous leur seuil : 0.
I1 — rôles déclarés côté Pilou : 27 ; non résolus côté Apple : 0
I2 — rôles de couleur : 25 ; jamais mesurés : 0
I3 — entrées de palette : 27 ; sans rôle : 2 (--palette-apple-accent-rouge, --palette-apple-accent-gris) ; sans rôle ET non déclarées : 0
     Les entrées sans rôle sont présentes parce que DES-01/DES-02 exigent les tokens EXACTS de 3.8 ; aucun composant ne peut les atteindre, et c'est écrit plutôt que subi.

=== VERDICT DE L INSTRUMENT : OK ===
```

### `node scripts/verifier-contraste-rendu.mjs` — ce que la page dessine

Commandes, reproductibles :

```
pnpm build && pnpm start -p 3221 &
npm install --no-save --prefix /tmp/tipi-pw playwright@1.50.1
NODE_PATH=/tmp/tipi-pw/node_modules TIPI_URL=http://127.0.0.1:3221/dev/design-system \
  node scripts/verifier-contraste-rendu.mjs
```

Playwright n'entre **pas** dans `package.json` : l'architecture §15.1 le
réserve à P6. Il est résolu depuis une installation externe, par `NODE_PATH`.

```
## Empreinte de la page mesurée

URL : http://127.0.0.1:3221/dev/design-system
Éléments : 1185 · SVG Pilou : 30 · SVG icône : 59 · marqués `data-tipi-decor` : 66
Textes relevés : 137 · formes relevées : 697

## A. Texte — couleur calculée contre fond effectif

| # | Thème | Extrait | px | poids | Seuil | Avant-plan | Fond | Ratio | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | pilou | Pilou | 36 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 248, 238) | 13.49:1 | OK |
| 2 | pilou | Apparence | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 3 | pilou | Pilou | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(232, 244, 252) | 12.72:1 | OK |
| 4 | pilou | Coloré, arrondi, chaleureux. | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(232, 244, 252) | 5.22:1 | OK |
| 5 | pilou | Apple | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 6 | pilou | Sobre, proche des réglages du télé | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 7 | pilou | Le changement est immédiat. Les te | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 8 | pilou | pilou | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 248, 238) | 13.49:1 | OK |
| 9 | pilou | Button | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 10 | pilou | On commence | 20 | 700 | 3:1 | rgb(46, 42, 38) | rgb(111, 184, 232) | 6.57:1 | OK |
| 11 | pilou | Réécouter | 20 | 700 | 3:1 | rgb(46, 42, 38) | rgb(232, 244, 252) | 12.72:1 | OK |
| 12 | pilou | Je ne sais pas | 20 | 700 | 3:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 13 | pilou | Parler | 20 | 700 | 3:1 | rgb(46, 42, 38) | rgb(111, 184, 232) | 6.57:1 | OK |
| 14 | pilou | Card | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 15 | pilou | Ton coffre à trésors | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 16 | pilou | Tes pierres restent là. Elles ne p | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 17 | pilou | La lecture | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(232, 244, 252) | 12.72:1 | OK |
| 18 | pilou | Les maths | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 239, 224) | 12.65:1 | OK |
| 19 | pilou | D'abord la lecture. Après, les mat | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(233, 249, 240) | 13.06:1 | OK |
| 20 | pilou | Chip | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 21 | pilou | La lecture | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(232, 244, 252) | 12.72:1 | OK |
| 22 | pilou | Les maths | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 239, 224) | 12.65:1 | OK |
| 23 | pilou | Tes pierres | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 243, 214) | 12.90:1 | OK |
| 24 | pilou | Celui-là est à toi. | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(233, 249, 240) | 13.06:1 | OK |
| 25 | pilou | Apparence | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 26 | pilou | ProgressDots | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 27 | pilou | Continuer | 20 | 700 | 3:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 28 | pilou | ListRow | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 29 | pilou | Apparence | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 30 | pilou | Coloré, arrondi, chaleureux. | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 31 | pilou | Pilou | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 32 | pilou | Paliers de récompense | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 33 | pilou | Sons | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 34 | pilou | Code parent | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 35 | pilou | 10 chiffres | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 255, 255) | 5.84:1 | OK |
| 36 | pilou | Keypad | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 37 | pilou | 1 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 38 | pilou | 2 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 39 | pilou | 3 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 40 | pilou | 4 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 41 | pilou | 5 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 42 | pilou | 6 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 43 | pilou | 7 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 44 | pilou | 8 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 45 | pilou | 9 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 46 | pilou | 0 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 47 | pilou | SpeechBubble | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 48 | pilou | Je regarde tes devoirs. J'arrive. | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 49 | pilou | Voilà. Maintenant, c'est ton tour. | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 255, 255) | 14.23:1 | OK |
| 50 | pilou | GemCounter | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 51 | pilou | Tes pierres | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 209, 102) | 9.87:1 | OK |
| 52 | pilou | 12 | 24 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 209, 102) | 9.87:1 | OK |
| 53 | pilou | Tes pierres | 17 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 209, 102) | 9.87:1 | OK |
| 54 | pilou | 147 | 28 | 700 | 3:1 | rgb(46, 42, 38) | rgb(255, 209, 102) | 9.87:1 | OK |
| 55 | pilou | Icon | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 56 | pilou | Pilou | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 57 | pilou | Habiller Pilou | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 248, 238) | 13.49:1 | OK |
| 58 | pilou | aucun | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 59 | pilou | echarpe | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 60 | pilou | bonnet | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 61 | pilou | noeud | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 62 | pilou | lunettes | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 63 | pilou | silhouette | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 64 | pilou | Il en faut {n} pour celui-là. | 17 | 600 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 248, 238) | 13.49:1 | OK |
| 65 | pilou | echarpe | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 66 | pilou | bonnet | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 67 | pilou | noeud | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 68 | pilou | lunettes | 15 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 69 | pilou | PilouReflechit | 17 | 400 | 4.5:1 | rgb(107, 100, 89) | rgb(255, 248, 238) | 5.54:1 | OK |
| 70 | pilou | Je regarde tes devoirs. J'arrive. | 16 | 400 | 4.5:1 | rgb(46, 42, 38) | rgb(255, 248, 238) | 13.49:1 | OK |
| 71 | apple | apple | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 72 | apple | Button | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 73 | apple | On commence | 20 | 700 | 3:1 | rgb(255, 255, 255) | rgb(0, 122, 255) | 4.01:1 | OK |
| 74 | apple | Réécouter | 20 | 700 | 3:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 75 | apple | Je ne sais pas | 20 | 700 | 3:1 | rgb(134, 134, 139) | rgb(245, 245, 247) | 3.32:1 | OK |
| 76 | apple | Parler | 20 | 700 | 3:1 | rgb(255, 255, 255) | rgb(0, 122, 255) | 4.01:1 | OK |
| 77 | apple | Card | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 78 | apple | Ton coffre à trésors | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 79 | apple | Tes pierres restent là. Elles ne p | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 80 | apple | La lecture | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 81 | apple | Les maths | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 82 | apple | D'abord la lecture. Après, les mat | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 83 | apple | Chip | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 84 | apple | La lecture | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 85 | apple | Les maths | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 86 | apple | Tes pierres | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 87 | apple | Celui-là est à toi. | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(234, 243, 255) | 15.03:1 | OK |
| 88 | apple | Apparence | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 89 | apple | ProgressDots | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 90 | apple | Continuer | 20 | 700 | 3:1 | rgb(134, 134, 139) | rgb(245, 245, 247) | 3.32:1 | OK |
| 91 | apple | ListRow | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 92 | apple | Apparence | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 93 | apple | Coloré, arrondi, chaleureux. | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 94 | apple | Pilou | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 95 | apple | Paliers de récompense | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 96 | apple | Sons | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 97 | apple | Code parent | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 98 | apple | 10 chiffres | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 99 | apple | Keypad | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 100 | apple | 1 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 101 | apple | 2 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 102 | apple | 3 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 103 | apple | 4 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 104 | apple | 5 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 105 | apple | 6 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 106 | apple | 7 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 107 | apple | 8 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 108 | apple | 9 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 109 | apple | 0 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 110 | apple | SpeechBubble | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 111 | apple | Je regarde tes devoirs. J'arrive. | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 112 | apple | Voilà. Maintenant, c'est ton tour. | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 255, 255) | 16.82:1 | OK |
| 113 | apple | GemCounter | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 114 | apple | Tes pierres | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 149, 0) | 7.65:1 | OK |
| 115 | apple | 12 | 24 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 149, 0) | 7.65:1 | OK |
| 116 | apple | Tes pierres | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(255, 149, 0) | 7.65:1 | OK |
| 117 | apple | 147 | 28 | 700 | 3:1 | rgb(29, 29, 31) | rgb(255, 149, 0) | 7.65:1 | OK |
| 118 | apple | Icon | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 119 | apple | Pilou | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 120 | apple | Habiller Pilou | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 121 | apple | aucun | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 122 | apple | echarpe | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 123 | apple | bonnet | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 124 | apple | noeud | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 125 | apple | lunettes | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 126 | apple | silhouette | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 127 | apple | Il en faut {n} pour celui-là. | 17 | 600 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 128 | apple | echarpe | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 129 | apple | bonnet | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 130 | apple | noeud | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 131 | apple | lunettes | 15 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 132 | apple | PilouReflechit | 17 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |
| 133 | apple | Je regarde tes devoirs. J'arrive. | 16 | 400 | 4.5:1 | rgb(29, 29, 31) | rgb(245, 245, 247) | 15.45:1 | OK |

## B. Tracés SVG — trait OU remplissage doit atteindre 3:1

| # | Thème | SVG | Balise | Trait | r(trait) | Remplissage | r(rempl.) | Fond | Meilleur | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | pilou | Icon | 8× path | rgb(46, 42, 38) | 12.72 | none | — | rgb(232, 244, 252) | 12.72:1 | OK |
| 2 | pilou | Icon | 5× rect | rgb(46, 42, 38) | 6.57 | none | — | rgb(111, 184, 232) | 6.57:1 | OK |
| 3 | pilou | Icon | 4× path | rgb(46, 42, 38) | 12.65 | none | — | rgb(255, 239, 224) | 12.65:1 | OK |
| 4 | pilou | Icon | 4× path | rgb(46, 42, 38) | 12.90 | none | — | rgb(255, 243, 214) | 12.90:1 | OK |
| 5 | pilou | Icon | 1× path | rgb(46, 42, 38) | 13.06 | none | — | rgb(233, 249, 240) | 13.06:1 | OK |
| 6 | pilou | Icon | 4× path | rgb(46, 42, 38) | 6.25 | none | — | rgb(255, 139, 123) | 6.25:1 | OK |
| 7 | pilou | Icon | 3× path | rgb(46, 42, 38) | 9.43 | none | — | rgb(143, 227, 192) | 9.43:1 | OK |
| 8 | pilou | Pilou | 98× path | rgb(46, 42, 38) | 13.49 | rgb(255, 239, 224) | 1.06 | rgb(255, 248, 238) | 13.49:1 | OK |
| 9 | pilou | Pilou | 56× path | rgb(46, 42, 38) | 13.49 | rgb(255, 255, 255) | 1.05 | rgb(255, 248, 238) | 13.49:1 | OK |
| 10 | pilou | Pilou | 42× circle | none | — | rgb(46, 42, 38) | 13.49 | rgb(255, 248, 238) | 13.49:1 | OK |
| 11 | pilou | Pilou | 16× path | rgb(46, 42, 38) | 13.49 | none | — | rgb(255, 248, 238) | 13.49:1 | OK |
| 12 | pilou | Icon | 8× path | rgb(46, 42, 38) | 9.87 | none | — | rgb(255, 209, 102) | 9.87:1 | OK |
| 13 | pilou | Icon | 30× rect | rgb(46, 42, 38) | 13.49 | none | — | rgb(255, 248, 238) | 13.49:1 | OK |
| 14 | pilou | Pilou | 7× path | rgb(46, 42, 38) | 13.49 | rgb(111, 184, 232) | 2.05 | rgb(255, 248, 238) | 13.49:1 | OK |
| 15 | pilou | Pilou | 4× path | rgb(46, 42, 38) | 13.49 | rgb(143, 227, 192) | 1.43 | rgb(255, 248, 238) | 13.49:1 | OK |
| 16 | pilou | Pilou | 11× path | rgb(138, 128, 116) | 3.67 | rgb(138, 128, 116) | 3.67 | rgb(255, 248, 238) | 3.67:1 | OK |
| 17 | pilou | Pilou | 3× circle | none | — | rgb(138, 128, 116) | 3.67 | rgb(255, 248, 238) | 3.67:1 | OK |
| 18 | pilou | Pilou | 1× path | rgb(138, 128, 116) | 3.67 | none | — | rgb(255, 248, 238) | 3.67:1 | OK |
| 19 | pilou | Pilou | 11× path | rgb(46, 42, 38) | 13.49 | rgb(138, 128, 116) | 3.67 | rgb(255, 248, 238) | 13.49:1 | OK |
| 20 | apple | Icon | 16× path | rgb(29, 29, 31) | 15.03 | none | — | rgb(234, 243, 255) | 15.03:1 | OK |
| 21 | apple | Icon | 5× rect | rgb(255, 255, 255) | 4.01 | none | — | rgb(0, 122, 255) | 4.01:1 | OK |
| 22 | apple | Icon | 12× path | rgb(29, 29, 31) | 7.65 | none | — | rgb(255, 149, 0) | 7.65:1 | OK |
| 23 | apple | Icon | 3× path | rgb(29, 29, 31) | 7.58 | none | — | rgb(52, 199, 89) | 7.58:1 | OK |
| 24 | apple | Pilou | 98× path | rgb(29, 29, 31) | 15.45 | rgb(245, 245, 247) | 1.00 | rgb(245, 245, 247) | 15.45:1 | OK |
| 25 | apple | Pilou | 56× path | rgb(29, 29, 31) | 15.45 | rgb(255, 255, 255) | 1.08 | rgb(245, 245, 247) | 15.45:1 | OK |
| 26 | apple | Pilou | 42× circle | none | — | rgb(29, 29, 31) | 15.45 | rgb(245, 245, 247) | 15.45:1 | OK |
| 27 | apple | Pilou | 16× path | rgb(29, 29, 31) | 15.45 | none | — | rgb(245, 245, 247) | 15.45:1 | OK |
| 28 | apple | Icon | 30× rect | rgb(29, 29, 31) | 15.45 | none | — | rgb(245, 245, 247) | 15.45:1 | OK |
| 29 | apple | Pilou | 7× path | rgb(29, 29, 31) | 15.45 | rgb(0, 122, 255) | 3.68 | rgb(245, 245, 247) | 15.45:1 | OK |
| 30 | apple | Pilou | 4× path | rgb(29, 29, 31) | 15.45 | rgb(52, 199, 89) | 2.03 | rgb(245, 245, 247) | 15.45:1 | OK |
| 31 | apple | Pilou | 11× path | rgb(134, 134, 139) | 3.32 | rgb(134, 134, 139) | 3.32 | rgb(245, 245, 247) | 3.32:1 | OK |
| 32 | apple | Pilou | 3× circle | none | — | rgb(134, 134, 139) | 3.32 | rgb(245, 245, 247) | 3.32:1 | OK |
| 33 | apple | Pilou | 1× path | rgb(134, 134, 139) | 3.32 | none | — | rgb(245, 245, 247) | 3.32:1 | OK |
| 34 | apple | Pilou | 11× path | rgb(29, 29, 31) | 15.45 | rgb(134, 134, 139) | 3.32 | rgb(245, 245, 247) | 15.45:1 | OK |

## C. Exemptions — mesurées et publiées, jamais tues

| Thème | Élément | Ratio mesuré | Motif |
| --- | --- | --- | --- |
| pilou | texte « Je commence » | 2.93:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | texte « Valider » | 2.93:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | texte « Je commence » | 2.33:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | texte « Valider » | 2.33:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | 3× path de Icon | 1.58:1 | data-tipi-decor="chevron" |
| pilou | 2× path de Icon | 3.97:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | 28× circle de Pilou | 2.15:1 | data-tipi-decor="joue" |
| apple | 3× path de Icon | 1.68:1 | data-tipi-decor="chevron" |
| apple | 2× path de Icon | 4.44:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | 28× circle de Pilou | 2.01:1 | data-tipi-decor="joue" |

Textes mesurés : 133. Groupes de tracés mesurés : 34 (697 formes).
Sous leur seuil : 0.
Exemptions : 4 par `data-tipi-decor` (66 éléments marqués dans le DOM), 6 par WCAG 1.4.3 (désactivés).
Invariant tenu : aucune liste de couples n'existe dans cet instrument — les couples sont énumérés depuis le DOM rendu.
Limites déclarées : les bordures CSS (filets de liste, contours des ProgressDots et du Keypad) ne sont ni du texte ni un tracé SVG et ne sont pas couvertes ici — elles le sont par `verifier-contraste.mjs`. Le fond effectif d'une forme SVG est le fond CSS de son conteneur, jamais la forme voisine dessinée dessous.

=== VERDICT DE L INSTRUMENT : OK ===
```

## 0.9 Les deux instruments de contraste, et pourquoi les deux restent

Ils ne mesurent pas la même chose, et aucun ne remplace l'autre :

| Instrument | Ce qu'il mesure | Ce qu'il ne peut pas voir |
| --- | --- | --- |
| `verifier-contraste.mjs` | Le **jeu de jetons** : les deux thèmes résolus depuis `themes.css`, les invariants I1, I2, I3. Ne demande aucun navigateur, tourne en une seconde. | Ce que la page dessine réellement. C'est le défaut du tour 1. |
| `verifier-contraste-rendu.mjs` | Ce que **la page dessine** : couleur calculée de chaque texte et de chaque tracé contre son fond effectif, alpha composé. Aucune liste. | Les bordures CSS ; les jetons qu'aucun écran n'emploie encore ; un thème qu'aucune page ne monte. Demande un navigateur. |

Le second couvre le point aveugle du premier ; le premier couvre les jetons que
le second ne voit pas parce qu'aucun écran ne les emploie encore — et il n'y a
qu'un écran. Les deux sont exécutés, et leurs deux sorties sont publiées.

---

## Sommaire

0. Reprise après verdict du tour 1 *(ci-dessus)*
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
| `src/styles/themes.css` | **Seul fichier de `src/` et de `tailwind.config.ts` contenant une valeur de couleur.** Le périmètre est énoncé exactement : `scripts/verifier-design-system.sh` et `.cursor/rules/20-themes.mdc` portent aussi les 26 valeurs de 3.8, comme tables de référence et non comme code rendu (constat 6 du tour 1). Palettes littérales, jetons de rôle par thème, base, `prefers-reduced-motion`. |
| `src/config/mascot.config.ts` | DES-09. Nom, palette (noms de variables CSS), tailles, cosmétiques, **voix figée** (TEC-08, ARB-14). Les seuils de pierres y sont `null` depuis ARB-16. |
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
| `src/components/pilou/Pilou.tsx` | DES-09, le SVG unique paramétré. Deux états de silhouette distincts depuis le tour 2 (§0.2). |
| `src/components/pilou/SpeechBubble.tsx` | Ce que Pilou dit, écrit. |
| `src/components/pilou/PilouReflechit.tsx` | Habillage d'attente (TEC-12). |
| `src/app/dev/design-system/page.tsx` | Contrôle visuel, les deux thèmes côte à côte. |
| `src/app/dev/design-system/textes.ts` | Lecteur de `content/` réservé à cette page. |
| `src/app/layout.tsx` | Layout racine minimal : `<html data-theme>`, polices. |
| `scripts/verifier-design-system.sh` | 9 contrôles de structure. |
| `scripts/verifier-contraste.mjs` | DES-05, **jeu de jetons** : lit `themes.css`, calcule 70 couples, invariants I1, I2, I3. |
| `scripts/verifier-contraste-rendu.mjs` | DES-05, **rendu** : énumère le DOM d'un navigateur, mesure chaque texte et chaque tracé contre son fond effectif. Aucune liste (§0.3). |

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

Le pendant : les **joues** de Pilou restent classées décoratives (2,15:1 et
2,01:1 mesurés au rendu). Elles n'ont pas de contour et ne portent aucune
information ; les retirer ne change rien à ce que l'écran dit. Elles portent
désormais `data-tipi-decor="joue"` : l'exemption est déclarée dans le DOM,
mesurée et publiée, jamais implicite.

Les **formes cosmétiques** sont cernées par le trait d'encre du groupe SVG :
c'est le trait, mesuré à 13,49:1 (Pilou) et 15,45:1 (Apple), qui rend la forme
perceptible, et non le remplissage. **Au tour 1, cette phrase était fausse pour
`lunettes`**, qui redéfinissait `stroke` et tombait à 2,05:1 ; c'est le
[MAJEUR] 1, corrigé en §0.1. La règle est maintenant inscrite dans le composant
et tenue par un instrument qui mesure le rendu.

**Décision DS-4 bis (tour 2)** : `silhouette` et `cosmetiqueVerrouille` sont
deux états distincts. Le premier met la mascotte entière en aplat neutre ; le
second laisse Pilou normale et met le cosmétique seul en aplat neutre. C'est ce
second état qu'emploie `/enfant/coffre` pour un palier non atteint — voir
§0.2.

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

*(Sortie du **tour 2**,
contrôle 1 élargi au dépôt entier après le constat 6.)*

```

=== 1. Couleurs en dur (DES-01, DES-02) ===
Motif : #hex (avec ou sans dièse pour la table de référence), rgb(), rgba(), hsl(), hsla()
-- occurrences DANS themes.css (attendu : > 0, c'est le seul fichier de code autorisé) --
32
-- occurrences dans le CODE APPLICATIF, ailleurs (attendu : 0) --
(aucune)
compte : 0
-- BALAYAGE DU DÉPÔT ENTIER, y compris sans dièse : les porteurs de couleur
   hors themes.css doivent être des TABLES DE RÉFÉRENCE nommées ci-dessous,
   jamais du code rendu. Le tour 1 annonçait un périmètre trop large et ce
   contrôle était aveugle à sa propre table (constat 6) --
   porteurs légitimes déclarés : scripts/verifier-design-system.sh .cursor/rules/20-themes.mdc src/styles/themes.css
   porteurs trouvés :
     .cursor/rules/20-themes.mdc
     scripts/verifier-design-system.sh
     src/styles/themes.css
   aucun porteur inattendu

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
src/components/ui/Keypad.tsx:83:          <button key={c} type="button" onClick={() => ajouter(c)} className={toucheClasses}>
src/components/ui/Keypad.tsx:88:        <button type="button" onClick={() => ajouter(0)} className={toucheClasses}>
src/components/ui/Keypad.tsx:93:          onClick={effacer}
src/components/ui/Chip.tsx:9: * porteur d'un `onClick`, ce que le design system interdit. Quand une pastille
src/components/ui/ListRow.tsx:62:  | { readonly href: string; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:63:  | { readonly onClick: () => void; readonly href?: undefined }
src/components/ui/ListRow.tsx:64:  | { readonly href?: undefined; readonly onClick?: undefined }
src/components/ui/ListRow.tsx:69:  const cliquable = props.href !== undefined || props.onClick !== undefined;
src/components/ui/ListRow.tsx:115:      ) : props.onClick !== undefined ? (
src/components/ui/ListRow.tsx:116:        <button type="button" onClick={props.onClick} className={classes}>
src/components/ui/ThemeSwitch.tsx:65:            onClick={() => onChange(option.theme)}
src/app/dev/design-system/page.tsx:128:          <Button variante="texte" onClick={() => setEtape((e) => (e + 1) % 3)}>
src/app/dev/design-system/page.tsx:148:            onClick={() => undefined}
-- div/span portant directement un onClick (attendu : 0) --
(aucun)

=== 5. Cible tactile 56 px (DES-04) ===
-- valeur du jeton --
69:  --tipi-cible-min: 56px; /* DES-04 */
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
src/components/pilou/Pilou.tsx:37: * variation d'opacité, aucun clignotement ; la préférence système
src/styles/themes.css:84:  --pile-apple: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
src/styles/themes.css:238:  /* DES-08 : la commutation de thème ne doit pas produire de flash. On anime
tailwind.config.ts:109:        // extrêmes ni ne se répète en clignotant. `respire` est une échelle
-- motifs interdits, RÈGLE RETENUE : utilitaires d'animation et noms d'images-clés
   seulement, parce que « flash » et « clignotement » ci-dessus sont des mots de
   commentaire qui DISENT l'interdit, jamais du code qui le produit --
règle retenue -> 0 occurrence(s)
-- durées déclarées --
src/styles/themes.css:76:  --tipi-duree-douce: 160ms;
src/styles/themes.css:77:  --tipi-duree-posee: 260ms;
tailwind.config.ts:123:        respire: "respire 4s var(--tipi-courbe-douce) infinite",
tailwind.config.ts:124:        "pense-1": "pense-1 1.8s var(--tipi-courbe-douce) infinite",
-- prise en compte de prefers-reduced-motion --
250:@media (prefers-reduced-motion: reduce) {

=== VERDICT DE L INSTRUMENT : OK ===
```

Code de sortie : **0**.

## 7.3 `node scripts/verifier-contraste.mjs`

*(Sortie du **tour 2**. Elle diffère de celle du tour 1 par le couple
`sous-titre ThemeSwitch, option retenue` ajouté au titre du constat 3, et par
l'invariant I3 du constat 10.)*

```
| Thème | Usage | Avant-plan | Fond | Ratio | Seuil | Verdict | Porté par |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pilou | texte de page | --tipi-encre #2e2a26 | --tipi-fond #fff8ee | 13.49:1 | 4.5:1 (petit) | OK | toutes les pages |
| pilou | texte sur carte | --tipi-encre #2e2a26 | --tipi-surface #ffffff | 14.23:1 | 4.5:1 (petit) | OK | Card, SpeechBubble, ListRow |
| pilou | sous-titre de liste | --tipi-texte-appui #6b6459 | --tipi-surface #ffffff | 5.84:1 | 4.5:1 (petit) | OK | ListRow, ThemeSwitch |
| pilou | sous-titre ThemeSwitch, option retenue | --tipi-texte-appui #6b6459 | --tipi-teinte-bleu #e8f4fc | 5.22:1 | 4.5:1 (petit) | OK | ThemeSwitch |
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
| apple | sous-titre ThemeSwitch, option retenue | --tipi-texte-appui #1d1d1f | --tipi-teinte-bleu #eaf3ff | 15.03:1 | 4.5:1 (petit) | OK | ThemeSwitch |
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

Couples mesurés : 70 (35 par thème, 2 thèmes).
Couples sous leur seuil : 0.
I1 — rôles déclarés côté Pilou : 27 ; non résolus côté Apple : 0
I2 — rôles de couleur : 25 ; jamais mesurés : 0
I3 — entrées de palette : 27 ; sans rôle : 2 (--palette-apple-accent-rouge, --palette-apple-accent-gris) ; sans rôle ET non déclarées : 0
     Les entrées sans rôle sont présentes parce que DES-01/DES-02 exigent les tokens EXACTS de 3.8 ; aucun composant ne peut les atteindre, et c'est écrit plutôt que subi.

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
2. **Je n'ai effectué aucun commit git.** Un commit `dad1524` existe pourtant
   sur mon travail du tour 1 : il a été fait par l'Orchestrateur après ma
   dernière écriture, et le contrôleur l'a relevé (constat 12) pour qu'on ne
   lise pas ma phrase comme une affirmation fausse. Elle est ici exacte : je
   n'ai commité ni au tour 1, ni au tour 2.
3. **Les cibles tactiles sont désormais mesurées au navigateur — par le
   contrôleur, pas par moi.** Son verdict publie 46 contrôles mesurés à 390 px
   et à 1500 px, aucun sous 56 px, aucun débordement horizontal. Ma limite du
   tour 1 est levée ; je n'ai pas refait la mesure, je m'appuie sur la sienne
   et je le dis.
4. **Je n'ai pas testé sur un appareil tactile réel**, ni avec un lecteur
   d'écran. Les rôles ARIA posés (`radiogroup`/`radio` sur `ThemeSwitch`,
   `status`/`aria-live` sur `SpeechBubble` et `PilouReflechit`, `role="img"`
   sur les icônes porteuses de sens) sont conformes aux spécifications mais
   n'ont pas été entendus.
5. **Les libellés des cinq cosmétiques n'existent toujours pas dans
   `content/`.** `mascot.config.ts` déclare pour chacun une `cleLibelle`
   (`coffre.cosmetiques.aucun`, `.echarpe`, `.bonnet`, `.noeud`, `.lunettes`),
   absentes de `content/ui-enfant.json`. Je ne les ai pas écrites : ARB-10
   réserve ces textes à `contenu-enfant`, et l'Orchestrateur les lui a confiées
   au tour 2. Le risque nommé par le contrôleur (constat 7) reste réel tant
   qu'elles manquent : `textes.ts` **lève** sur une clé absente, donc la
   première verticale qui câble `cleLibelle` sur le lecteur fait tomber l'écran
   du coffre. La page de contrôle affiche l'identifiant technique (`echarpe`),
   jamais un libellé inventé.
6. **Les seuils de pierres sont retirés (ARB-16).** Les valeurs 0/15/30/45/60
   étaient de moi, sans source. Le champ `pierresRequises` subsiste, typé
   `number | null`, avec cinq `null` et le motif écrit dans le fichier. Une
   décision produit est attendue avant V6.
7. **`--tipi-texte-discret` n'est employé par aucun texte.** C'est voulu
   (3,67:1 / 3,32:1). Le jeton existe parce que 3.8 le nomme et que DES-01
   demande les tokens exacts, et il sert de source à `--pilou-silhouette`.

8. **Deux entrées de palette ne sont reliées à aucun rôle** :
   `--palette-apple-accent-rouge` et `--palette-apple-accent-gris`. Aucun
   composant ne peut les atteindre. Elles sont déclarées parce que DES-02 exige
   les tokens exacts de 3.8, et l'invariant I3 les nomme désormais au lieu de
   les laisser hors champ (constat 10).

9. **L'instrument de rendu ne couvre ni les bordures CSS, ni le recouvrement
   des formes SVG.** Les filets de liste et les contours des `ProgressDots` et
   du `Keypad` sont des bordures, pas des tracés : ils relèvent de
   `verifier-contraste.mjs`. Et le fond effectif d'une forme SVG y est le fond
   CSS de son conteneur, jamais la forme voisine dessinée dessous. Les deux
   limites sont imprimées par l'instrument à chaque passage.

---

# 9. Points que je veux voir tranchés

Cinq des six points du tour 1 ont été tranchés — par le contrôleur, par
l'Orchestrateur, ou par ARB-16. Ils sont repris ici avec leur réponse, pour que
personne ne les rouvre. Trois points restent ouverts : les **7**, **8** et
**9**.

## Tranchés au tour 1, clos

**1. DS-1 — CLOS.** Le contrôleur établit que le conflit n'était qu'apparent :
DES-02 impose une palette, DES-05 porte sur les couples rendus, et la
séparation des rôles satisfait les deux à la lettre. **L'encre est conservée en
thème Apple.** `#6E6E73` n'est pas ajouté — ce serait une 27ᵉ valeur absente de
3.8, donc une violation de DES-02. *(Mon chiffre de 5,15:1 pour `#6E6E73` était
faux ; la valeur exacte est **5,07:1**. Corrigé, constat 5.)*

**2. DS-2 — CLOS.** Accepté : ce n'est pas un contournement mais WCAG appliqué
tel qu'écrit. Le contrôleur a vérifié au navigateur que **tous** les libellés
de `Button` sortent en 20 px / 700, sans exception.

**3. Les cinq libellés de cosmétiques — CLOS.** Confiés à `contenu-enfant` par
l'Orchestrateur (ARB-10), à produire avant l'ouverture de V6.

**4. Les seuils de pierres — CLOS par ARB-16.** Structure conservée, valeurs
retirées. Voir §0.4.

**6. Le socle minimal — CLOS.** Conservé ; V1 l'étend et ne le refait pas. Les
deux règles ESLint de TEC-15, `strict` et `noUncheckedIndexedAccess` doivent
être préservées — le contrôleur a vérifié que les deux règles **mordent
réellement**.

## Toujours ouverts

**5. Les joues de Pilou dans le thème Apple — ouvert, avis convergent.**
Le contrôleur recommande de **les faire disparaître dans le thème Apple** :
`#FF9500` pur sur un corps qui vaut le fond de page donne deux disques orange
saturés, l'élément le plus criard des deux panneaux, sur un thème dont la
phrase d'aide dit « Sobre, proche des réglages du téléphone ». Mesuré à
2,01:1, classé décoratif à juste titre — le retrait ne coûte rien et ne change
rien à ce que l'écran dit. **Je ne l'ai pas fait**, parce qu'il note lui-même
que la décision touche l'identité de la mascotte et revient à l'Orchestrateur.
Le geste tient en une ligne : faire pointer `--pilou-joue` vers `none` dans le
bloc `[data-theme="apple"]`, sans toucher à un composant.
**Question fermée : les joues disparaissent-elles dans le thème Apple ?**

**7. Pilou ressemble à un ours en peluche, pas à une loutre — ouvert, et c'est
le plus important des trois.** J'ai amélioré la silhouette au tour 2 (oreilles
de 31 % à 23 % de la tête et posées dessus, queue allongée et effilée, museau
élargi et abaissé) et le rendu est moins « ours ». Elle n'est toujours pas une
loutre reconnaissable, et je préfère l'écrire que le laisser découvrir. §1.3 du
prompt maître et le livrable marketing disent « une petite loutre » ; aucune
exigence ne chiffre la géométrie, et les quatre traits que §1.3 énonce
explicitement sont respectés. La mascotte va entrer dans neuf verticales et
dans l'icône d'application (DES-10, V9) : c'est maintenant qu'il faut décider.
**Question fermée : la silhouette actuelle est-elle acceptée telle quelle, ou
faut-il une passe de dessin dédiée avant V9 ?**

**8. `Button variante="texte"` en thème Apple, à 3,32:1 — ouvert, réserve du
contrôleur que je n'ai pas levée.** Il propose de rattacher cette variante à
`--tipi-texte-appui`, ce qui la porterait de 3,32:1 à 15,45:1 sans toucher à
3.8. **Je ne l'ai pas fait, et voici pourquoi** : en thème Apple ce rôle vaut
l'encre, donc « Je ne sais pas » ou « Passer » s'afficheraient en 20 px / 700
dans la même encre que le titre et que l'action principale. DES-06 veut une
seule action principale par écran, visuellement identifiable ; une action
tertiaire aussi noire que la principale la concurrence. Le couple actuel est
conforme (3,32 ≥ 3:1 en grand texte), mais avec seulement 0,32 de marge, sur un
libellé lu par un enfant fatigué. Les deux lectures se défendent et
l'arbitrage n'est pas le mien. **Question fermée : garde-t-on le gris à
3,32:1, ou passe-t-on à l'encre au risque d'affaiblir DES-06 ?** Le contrôleur
proposait de l'arbitrer avec V4/V5 ; je préfère que ce soit tranché avant, pour
que les deux verticales lisent la même règle.

**9. Le corps de Pilou en thème Apple vaut exactement le fond de page —
ouvert.** `--pilou-corps` pointe vers `#F5F5F7`, soit `--tipi-fond` : le corps
est à 1,00:1 avec la page, et seul le trait d'encre (15,45:1) la dessine. C'est
mesuré conforme et cohérent avec le trait fin, mais c'est une asymétrie forte
entre les deux thèmes, que le tour 1 ne mentionnait nulle part. Lui donner un
corps demanderait une 13ᵉ valeur dans la palette Apple de 3.8 — donc un
amendement tracé, que seul l'Orchestrateur peut rendre. **Question fermée :
laisse-t-on Pilou « en trait seul » dans le thème Apple, ou amende-t-on 3.8
d'une teinte de corps ?**
