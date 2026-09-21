VERDICT: PASS_AVEC_RESERVES

# P3 — Contrôle du design system — TOUR 2

Contrôleur : `controle-design` (lecture seule). Producteur : `design-system`.
Porte : G3. Tour 2 sur 3. Date : 2026-09-21.

**Les deux [MAJEUR] du tour 1 sont levés. Aucun [BLOQUANT], aucun [MAJEUR] au
tour 2. Huit [MINEUR], dont aucun n'empêche la porte de s'ouvrir.**

J'ai tout rejoué : la chaîne de construction, les trois instruments, la mesure
navigateur des cibles tactiles, l'arbre d'accessibilité, et surtout **ma propre
mesure de contraste, indépendante de la sienne**. J'ai refait moi-même la
manipulation qui compte — son nouvel instrument relancé sur le code du tour 1 —
et je la reproduis exactement.

Le point aveugle que j'avais nommé au tour 1 est réellement comblé : l'invariant
« toute couleur calculée contre son fond effectif est mesurée » est implémenté,
sans liste, et il trouve tout seul le défaut qu'il était censé trouver sur du
code qui lui est antérieur. C'est la bonne façon de prouver un instrument, et
c'est rare.

---

# TOUR 2

## 1. Sort des douze constats du tour 1

| # | Gravité T1 | Constat | Sort, vérifié par moi |
| --- | --- | --- | --- |
| 1 | [MAJEUR] | `lunettes` à 2,05:1, instrument aveugle | **LEVÉ** — §2.1 |
| 2 | [MAJEUR] | `silhouette` écrase le cosmétique | **LEVÉ** — §2.2 |
| 3 | [MINEUR] | Couple `texte-appui` / `teinte-bleu` absent de la liste | **Corrigé** — couple ajouté (70 au lieu de 68), **5,22:1** publié, identique au centième à ma mesure navigateur du tour 1. La cause est surtout supprimée : il n'y a plus de liste à tenir. |
| 4 | [MINEUR] | États désactivés non mesurés | **Corrigé et dépassé** — l'instrument de rendu compose l'alpha ; les 6 états désactivés sont mesurés et publiés. La touche « Effacer », désactivée dès l'ouverture, passe de 40 % à 60 % d'opacité : **2,32 → 4,44:1** en thème Apple *(et 3,97:1 en thème Pilou, chiffre que le rapport ne donne pas)*. |
| 5 | [MINEUR] | `#6E6E73` annoncé à 5,15:1 | **Corrigé** en 5,07:1. Recalculé par moi : 5,0713. |
| 6 | [MINEUR] | « Seul fichier du dépôt » inexact | **Corrigé aux deux endroits**, et le contrôle 1 balaie désormais le dépôt entier, valeurs sans dièse comprises, nomme ses trois porteurs légitimes et échoue sur tout porteur inattendu. Rejoué : 3 porteurs trouvés, 3 déclarés, 0 inattendu. |
| 7 | [MINEUR] | Cinq clés de contenu pendantes | **Hors périmètre** par ARB-10. Le manque est inscrit dans `mascot.config.ts`. Reste à produire avant V6 — voir §5. |
| 8 | [MINEUR] | Seuils 0/15/30/45/60 sans source | **Corrigé par ARB-16** — §2.4 |
| 9 | [MINEUR] | Défauts de dessin | **2 corrigés sur 4**, 2 portés en question ouverte — §2.5 |
| 10 | [MINEUR] | Deux jetons de palette sans rôle, invisibles d'I2 | **Corrigé** — invariant **I3** ajouté. Rejoué : `entrées de palette : 27 ; sans rôle : 2 ; sans rôle ET non déclarées : 0`. |
| 11 | [MINEUR] | Branche morte + `var(--x, repli)` silencieux | **Corrigés.** Il publie en plus une régression qu'il s'est infligée en corrigeant — un rejet trop large qui faisait échouer l'instrument sur les piles de polices — trouvée en rejouant, corrigée. Vérifié : `var(--x, repli)` lève, `var(--police-baloo), "Baloo 2", …` passe. |
| 12 | [MINEUR] | §8.2 « aucun commit git » devenu faux | **Corrigé.** |

**Douze constats sur douze traités.** Aucun n'est resté sans réponse, aucun
n'a été refermé en silence.

---

## 2. Vérification des deux [MAJEUR]

### 2.1 [MAJEUR] 1 — LEVÉ

Le code, d'abord. `src/components/pilou/Pilou.tsx` :

```tsx
    case "lunettes":
      // Monture dessinée comme un ANNEAU PLEIN en `fill`, cerné par le trait
      // d'encre du groupe parent — jamais un `stroke` de la couleur du
      // cosmétique. Le `fill-rule` évidé laisse les yeux visibles.
      return (
        <g>
          <path fillRule="evenodd" fill={couleur} d="M53 58a13 13 0 1 0 26 0 13 13 0 1 0-26 0zM56.5 58a9.5 9.5 0 1 0 19 0 9.5 9.5 0 1 0-19 0z" />
```

Le `<g fill="none" stroke={couleur}>` qui annulait le trait d'encre a disparu.

**Ma mesure, indépendante de son instrument** (styles calculés du navigateur,
implémentation WCAG recodée par moi) :

| Thème | Forme | Trait | r(trait) | Remplissage | r(rempl.) | Meilleur |
| --- | --- | --- | --- | --- | --- | --- |
| pilou | monture `lunettes` | `rgb(46,42,38)` | **13,49** | `rgb(111,184,232)` | 2,05 | **13,49:1** |
| apple | monture `lunettes` | `rgb(29,29,31)` | **15,45** | `rgb(0,122,255)` | 3,68 | **15,45:1** |

Plus aucun `<g>` ne porte un `stroke` de couleur cosmétique. Contrôlé au rendu :
2,05:1 → 13,49:1. **Les chiffres annoncés sont exacts.**

**J'ai cherché une autre variante qui échapperait à la règle**, sur les trois
axes demandés :

```
=== toute redéfinition de stroke / fill / opacity dans Pilou.tsx ===
  stroke=  : ligne 167 (le groupe parent, qui le POSE) ;
             lignes 194, 195 (joues), 198, 199 (yeux), 203 (truffe) → stroke="none"
  opacity  : aucune occurrence
  fill=    : 27 occurrences, toutes des remplissages sous le trait du groupe parent
```

Les trois formes à `stroke="none"` sans `data-tipi-decor` sont les **yeux** et
la **truffe** : elles ne s'appuient que sur leur remplissage, qui vaut l'encre —
13,49:1 et 15,45:1 mesurés. Aucune ne s'échappe. Les deux seules formes
exemptées sont les joues, marquées.

**La règle est-elle inscrite dans le composant ?** Oui, `Pilou.tsx` lignes
20-31, en toutes lettres : « toute forme colorée est *cernée* par le trait
d'encre du groupe parent. Une variante ne redéfinit jamais `stroke` ». Mais je
dois être exact sur la nature de cette garantie : **c'est de la prose, aucun
contrôle statique ne la fait respecter.** Ce qui la fait respecter, c'est
l'instrument de rendu, qui en mesure la *conséquence* — et c'est la garantie la
plus forte des deux, puisqu'elle attrape aussi les violations que personne
n'avait prévu de nommer. La preuve en est faite au §3. Sa limite est au §4,
constat 13.

### 2.2 [MAJEUR] 2 — LEVÉ

`silhouette` et `cosmetiqueVerrouille` sont deux propriétés distinctes, et le
forçage `silhouette ? "aucun" : cosmetique` a disparu :

```tsx
  const cosmetiqueNeutre = silhouette || cosmetiqueVerrouille;
  const couleursCosmetique: CouleursCosmetique = cosmetiqueNeutre
    ? { principale: neutre, secondaire: neutre }
    : { principale: jeton(P.cosmetique), secondaire: jeton(P.cosmetiqueSecondaire) };
  …
        <Cosmetique id={cosmetique} couleurs={couleursCosmetique} />
```

**J'ai regardé le rendu, dans les deux thèmes.** Les quatre vignettes
verrouillées sont là et elles sont **franchement distinctes** : l'écharpe
grise autour du cou, le bonnet gris avec son bandeau et son pompon, le nœud
gris sur l'oreille, les lunettes grises sur les yeux. Un enfant voit la
*forme* de ce qui l'attend, et les quatre ne se confondent pas. C'est
exactement ce que demande le livrable marketing §7.9 et ce que le tour 1 ne
rendait pas.

Mesuré, le cosmétique verrouillé porte **deux** contrastes et non un :

| Thème | Cosmétique verrouillé | Trait d'encre | Remplissage neutre |
| --- | --- | --- | --- |
| pilou | `--pilou-silhouette` cerné | **13,49:1** | **3,67:1** |
| apple | idem | **15,45:1** | **3,32:1** |

Les deux dépassent 3:1. Les chiffres annoncés (3,67 / 3,32) sont les
remplissages : annonce conservatrice, le trait est bien meilleur.

Je note au crédit du producteur qu'il a **ajouté les vignettes à la page pour
que le contrôle visuel puisse les voir**, et l'a écrit dans le code. C'est la
bonne leçon du tour 1 : un défaut que seul l'œil attrape n'est attrapé que si
quelque chose est rendu à l'écran.

---

## 3. L'instrument de rendu : conception, et sa preuve refaite par moi

### 3.1 Ce que je valide dans la conception

`scripts/verifier-contraste-rendu.mjs` tient l'invariant que j'avais nommé, et
le tient vraiment. J'ai lu les 359 lignes :

- **Aucune liste.** `document.querySelectorAll("body *")` pour le texte,
  `svg path, svg circle, svg rect, svg ellipse, svg line, svg polygon, svg polyline`
  pour les tracés. Une forme nouvelle est couverte sans que personne y pense.
- **Le fond est calculé**, en remontant les ancêtres jusqu'au premier fond non
  transparent, et l'alpha est composé, opacité des ancêtres comprise
  (`opaciteCumulee`). C'est ce qui lui permet de voir les états désactivés que
  l'instrument de couples ne pouvait pas voir.
- **La règle « trait OU remplissage ≥ 3:1 »** est la bonne traduction mesurable
  du dessin de Pilou : un remplissage faible est acceptable *parce qu'il est
  cerné*, et cesse de l'être quand le trait disparaît. C'est précisément ce qui
  attrape `lunettes` sans qu'on la nomme.
- **Une seule porte de sortie, `data-tipi-decor`**, et les exemptés sont
  **mesurés et publiés quand même**, avec leur ratio et leur motif. L'exemption
  est visible, jamais silencieuse. Vérifié dans la sortie : section C, 10
  lignes, chacune avec son chiffre.
- **Les limites sont déclarées dans la sortie elle-même**, pas seulement dans
  le rapport : bordures CSS non couvertes, et fond d'une forme SVG = fond CSS
  du conteneur, jamais la forme dessinée dessous.

### 3.2 La preuve, refaite intégralement par moi

C'est le point que l'Orchestrateur me demandait de ne pas croire. Je l'ai refait
de bout en bout, sans réutiliser quoi que ce soit du producteur :

```
$ git archive dad1524 | tar -x -C <scratch>/tour1     # le code du TOUR 1
$ sed -n '73,82p' <scratch>/tour1/src/components/pilou/Pilou.tsx
    case "lunettes":
      return (
        <g fill="none" stroke={couleur} strokeLinecap="round">
          <circle cx="66" cy="58" r="13" />
          …
$ cd <scratch>/tour1 && npx next build && npx next start -p 3219
$ cd /home/user/Tipi && TIPI_URL=http://127.0.0.1:3219/dev/design-system \
    node scripts/verifier-contraste-rendu.mjs
```

Sortie réelle, instrument du **tour 2** sur le code du **tour 1** :

```
URL : http://127.0.0.1:3219/dev/design-system
Éléments : 975 · SVG Pilou : 22 · SVG icône : 59 · marqués `data-tipi-decor` : 0
Textes relevés : 127 · formes relevées : 537

| 6  | pilou | Icon  | 3× path   | rgb(216, 204, 184) | 1.58 | none               | —    | 1.58:1 | *** SOUS SEUIL *** |
| 11 | pilou | Pilou | 20× circle| none               | —    | rgb(255, 139, 123) | 2.15 | 2.15:1 | *** SOUS SEUIL *** |
| 18 | pilou | Pilou | 4× circle | rgb(111, 184, 232) | 2.05 | none               | —    | 2.05:1 | *** SOUS SEUIL *** |
| 24 | apple | Icon  | 3× path   | rgb(199, 199, 204) | 1.68 | none               | —    | 1.68:1 | *** SOUS SEUIL *** |
| 29 | apple | Pilou | 20× circle| none               | —    | rgb(255, 149, 0)   | 2.01 | 2.01:1 | *** SOUS SEUIL *** |

Textes mesurés : 123. Groupes de tracés mesurés : 38 (537 formes).
Sous leur seuil : 5.
=== VERDICT DE L INSTRUMENT : ECHEC ===
EXIT=1
```

**Reproduit.** Ligne 18 : `4× circle` avec `stroke: rgb(111,184,232)` à
**2,05:1** — la monture des `lunettes` du tour 1, trouvée par l'instrument
seul, sur du code qu'il n'a jamais vu, sans que rien ne la lui désigne. C'est
la règle 1 de « Corriger un instrument de mesure » appliquée dans le bon sens,
et c'est la meilleure preuve qu'un instrument puisse produire.

Cette manipulation prouve du même coup les **trois** échappatoires que
l'Orchestrateur me demandait de tester, sans que j'aie à modifier un fichier de
production :

| Échappatoire | Cas du tour 1 qui le démontre | Attrapé ? |
| --- | --- | --- |
| une variante redéfinit `stroke` | `lunettes`, stroke cosmétique, `fill="none"` | **oui**, 2,05:1 |
| une variante n'a qu'un `fill` faible, `stroke="none"` | les joues, 2,15 / 2,01:1 | **oui** |
| une opacité réduit le contraste | boutons désactivés, 2,93 / 2,33:1 | **oui**, alpha composé |

### 3.3 Ce que la preuve montre aussi, et qui doit être dit

L'instrument signale **5 groupes** sur le code du tour 1, pas un. Or le tour 2
en sort à zéro. Le compte mérite d'être décomposé, parce que « 5 → 0 » se lit
comme cinq réparations :

| Groupe signalé sur le tour 1 | Ratio T1 | Ratio T2 | Traitement réel |
| --- | --- | --- | --- |
| monture `lunettes`, pilou | 2,05:1 | **13,49:1** | **réparé** |
| chevron `ListRow`, pilou | 1,58:1 | 1,58:1 | **exempté** `data-tipi-decor="chevron"` |
| chevron `ListRow`, apple | 1,68:1 | 1,68:1 | **exempté** |
| joues de Pilou, pilou | 2,15:1 | 2,15:1 | **exempté** `data-tipi-decor="joue"` |
| joues de Pilou, apple | 2,01:1 | 2,01:1 | **exempté** |

**Une réparation, quatre exemptions déclarées.** Les quatre exemptions sont
légitimes et je ne peux pas dire le contraire : j'ai moi-même accepté ces deux
classements au tour 1, nommément — « les chevrons… : accepté », « les joues… :
accepté également ». Elles sont explicites, marquées dans le code, et publiées
avec leur ratio. Mais le rapport présente le passage à zéro sans cette
décomposition, et un lecteur pressé y verra cinq défauts corrigés. Voir constat
14.

### 3.4 Son honnêteté sur ce que l'instrument n'attrape pas

Il écrit que l'instrument **ne trouve pas** le [MAJEUR] 2, parce que c'est un
défaut d'API et non de contraste. C'est exact, et c'est vérifiable : sur le code
du tour 1, aucune ligne ne signale que les quatre paliers verrouillés sont
identiques — l'instrument mesurait quatre silhouettes grises parfaitement
conformes à 3,67:1. Le déclarer plutôt que de laisser croire que l'instrument
couvre tout est exactement ce que le protocole demande, et c'est ce qui
distingue un instrument honnête d'une preuve verte. **Je valide.**

Cela dit, l'invariant qui aurait attrapé le [MAJEUR] 2 existe et le protocole le
nomme : « un ensemble déclaré dont aucun élément ne doit rester inemployé ».
Voir constat 13.

---

## 4. Les garde-fous de l'incident du serveur resté lié au port

C'est la classe de défaut la plus dangereuse du projet, et l'Orchestrateur a
raison de me demander de la sonder plutôt que de la lire.

### 4.1 La garde de vraisemblance mord — vérifié

```
$ TIPI_URL=http://127.0.0.1:3218/page-inexistante node scripts/verifier-contraste-rendu.mjs

URL : http://127.0.0.1:3218/page-inexistante
Éléments : 13 · SVG Pilou : 0 · SVG icône : 0 · marqués `data-tipi-decor` : 0
Textes relevés : 2 · formes relevées : 0

=== RELEVÉ INVRAISEMBLABLE — L INSTRUMENT REFUSE DE CONCLURE ===
  textes 2 < 60
  formes 0 < 300
  SVG Pilou 0 < 20

La page mesurée n'est pas celle attendue : serveur d'une version
antérieure resté lié au port, page non hydratée, ou mauvaise URL.
EXIT=3
```

Elle refuse de conclure, sort en **3**, nomme les trois planchers franchis, et
imprime l'empreinte **avant** de refuser — donc un humain voit ce qui a été
mesuré. Le scénario « textes 0, VERDICT OK » ne peut plus se produire.

### 4.2 L'empreinte discrimine les deux versions — vérifié

```
tour 2   {"elements":1185,"marques":66,"parMotif":{"chevron":6,"joue":60},"css":["733c0eba765c5569.css"]}
tour 1   {"elements":975, "marques":0, "parMotif":{},                      "css":["1abceefbb8828677.css"]}
```

Quatre des six nombres de l'empreinte diffèrent, et `marqués : 0` contre `66`
est un discriminant net. Un humain qui lit l'empreinte voit immédiatement qu'il
a mesuré la mauvaise version.

### 4.3 Mais la garde seule n'aurait pas attrapé l'incident — vérifié

C'est la nuance que je dois publier. Sur la page du **tour 1** :
127 textes ≥ 60, 537 formes ≥ 300, 22 SVG Pilou ≥ 20. **Les trois planchers
sont franchis : la garde ne se déclenche pas.** Or c'est exactement le scénario
de l'incident — un serveur d'une version antérieure resté lié au port.

La garde couvre donc le cas catastrophique (page vide, mauvaise URL), pas le cas
qui a réellement eu lieu. Ce qui couvre celui-là, c'est l'empreinte — et elle
est **imprimée, pas assertée** : rien n'échoue, il faut qu'un humain lise.

Le producteur le dit lui-même, et sa justification est juste : confondre « a-t-on
mesuré une vraie page ? » et « est-ce la bonne version ? » empêcherait de
rejouer l'instrument sur une version antérieure, ce que la règle 1 du protocole
exige — et ce que j'ai fait au §3.2. **Il n'a donc rien sur-annoncé.** Le
durcissement reste possible sans sacrifier le rejeu : voir constat 15, où je
donne le mécanisme exact, vérifié.

---

## 5. ARB-16 et les orphelins

Appliqué tel que rendu. `pierresRequises: number | null`, cinq `null`, motif
écrit dans le fichier et citant ARB-16 ; `cosmetiquesDebloques()` retirée avec
son motif.

**Aucun appelant orphelin**, vérifié :

```
$ grep -rn "cosmetiquesDebloques" src/ scripts/
src/config/mascot.config.ts:137:// `cosmetiquesDebloques(solde)` a été RETIRÉE au tour 2. …
(aucune autre occurrence)

$ grep -rn "pierresRequises" src/
  → la déclaration du type, le commentaire ARB-16, et les cinq entrées à `null`.
     Aucun lecteur, aucune comparaison, aucun calcul.
```

`pnpm typecheck` passe, donc le passage à `number | null` n'a laissé aucun site
d'appel non gardé. Les cinq `cleLibelle` restent déclarées : elles **nomment ce
qui manque** plutôt que de le combler, ce qui est la bonne conduite — mais elles
restent une panne d'écran en attente pour V6, puisque `textes.ts` lève sur une
clé absente. À produire par `contenu-enfant` avant l'ouverture de V6, comme
ARB-10 l'a réglé.

---

## 6. Constats du tour 2

Aucun [BLOQUANT], aucun [MAJEUR]. Huit [MINEUR].

### [MINEUR] 13 — Rien n'assure que toute variante déclarée est rendue sur la page mesurée

L'instrument de rendu ne voit que ce que `/dev/design-system` dessine. C'est sa
force et c'est sa seule dépendance. Or rien ne garantit qu'une variante future
ajoutée à `mascotConfig.cosmetiques` apparaîtra sur cette page : aujourd'hui
elle y sera, parce que la galerie fait `mascotConfig.cosmetiques.map(...)` — mais
ce lien n'est affirmé nulle part, et c'est lui qui porte toute la couverture.

C'est aussi l'invariant qui aurait attrapé le [MAJEUR] 2, et le protocole le
nomme mot pour mot : « un ensemble déclaré dont aucun élément ne doit rester
inemployé ».

**Correction attendue.** Ajouter à l'instrument de rendu, ou au contrôle
structurel, l'assertion : *le nombre de variantes cosmétiques distinctes rendues
sur la page mesurée égale `mascotConfig.cosmetiques.length`, et il en existe une
version verrouillée pour chacune sauf `aucun`.* Aujourd'hui : 5 et 4. Cela
transforme « la galerie est à jour » d'une habitude en une mesure.

### [MINEUR] 14 — « 5 sous seuil → 0 » est une réparation et quatre exemptions

Voir §3.3. Le rapport publie la sortie complète et les exemptions sont
explicites, donc rien n'est caché ; mais la décomposition n'est écrite nulle
part, et c'est elle qui dit ce qui a changé de *valeur* et ce qui a changé de
*classement*. Un détecteur qui ne trouve plus rien après qu'on a élargi ses
exemptions est précisément ce que la règle 4 du protocole demande de traiter
comme suspect jusqu'à preuve du contraire.

**Correction attendue.** Inscrire le tableau de §3.3 dans le rapport : pour
chacun des cinq groupes, ratio avant, ratio après, et *réparé* ou *exempté*.

### [MINEUR] 15 — L'empreinte est imprimée et non assertée, alors que le mécanisme existe

Voir §4.3. La garde ne se déclenche pas sur la page du tour 1 ; seule la lecture
humaine de l'empreinte distingue les deux versions.

**Correction attendue, vérifiée par moi avant de la proposer.** `buildId` est
absent de `__NEXT_DATA__` sur l'App Router — je l'ai vérifié, il ne faut pas le
recommander. En revanche le **nom du fichier de styles servi** est lisible depuis
le DOM et diffère bien d'une version à l'autre :
`1abceefbb8828677.css` (tour 1) contre `733c0eba765c5569.css` (tour 2).
L'ajouter à l'empreinte, et permettre de l'asserter par une variable
d'environnement facultative (`TIPI_CSS_ATTENDU`), donnerait la vérification de
version sans jamais empêcher le rejeu sur une version antérieure.

### [MINEUR] 16 — `data-tipi-decor` n'a pas de liste de motifs déclarée, alors qu'I3 a inventé le bon patron

La porte de sortie est unique et publiée, et c'est bien. Mais n'importe quel
motif nouveau passe : l'instrument imprime une ligne d'exemption de plus et
conclut `OK`. Rien ne cloisonne l'ensemble des motifs admis.

Le producteur a pourtant écrit exactement le bon patron ailleurs, au tour 2 :
`PALETTE_SANS_ROLE_ASSUMEE` dans l'invariant I3, une liste explicite qui fait
échouer l'instrument sur tout élément non déclaré. Ne pas l'appliquer à la seule
porte de sortie de son meilleur instrument est une incohérence.

Relevé aujourd'hui, par moi : `{"chevron": 6, "joue": 60}` = 66 éléments marqués,
soit 2 joues × 30 Pilou et 3 chevrons × 2 panneaux. Cohérent, rien d'inattendu.

**Correction attendue.** Déclarer `DECOR_ADMIS = ["joue", "chevron"]` et faire
échouer l'instrument sur tout autre motif, exactement comme I3.

### [MINEUR] 17 — Le motif donné au point ouvert 9 est factuellement faux

Le rapport écrit, §0.6 et §9 point 9 :

> « Lui donner un corps demanderait une 13ᵉ valeur dans la palette Apple de 3.8
> — donc un amendement tracé, que seul l'Orchestrateur peut rendre. »

C'est inexact. `--palette-apple-teinte-bleu` (`#EAF3FF`) **existe** dans 3.8 et
n'est pas une valeur de texte : c'est la teinte du thème. Faire pointer
`--pilou-corps` vers elle donnerait à Pilou un corps bleu pâle visiblement
distinct du fond gris neutre, **sans amender 3.8**. Mesuré par moi :

| Corps envisagé | Sur le fond Apple `#F5F5F7` | Trait d'encre dessus | Ventre blanc dessus |
| --- | --- | --- | --- |
| `#F5F5F7` (livré) | 1,00:1 | 15,45:1 | 1,08:1 |
| `#EAF3FF` (existe dans 3.8) | 1,02:1 | 15,03:1 | 1,11:1 |
| *rappel thème Pilou* : `#FFEFE0` sur `#FFF8EE` | **1,06:1** | 13,49:1 | 1,05:1 |

Deux choses en découlent, et elles vont en sens contraire de ce que le rapport
suggère. D'abord l'option existe. Ensuite **l'« asymétrie forte entre les deux
thèmes » n'existe pas en contraste** : le corps de Pilou est à 1,06:1 de son
fond dans le thème Pilou et à 1,00:1 dans le thème Apple. Dans les deux, c'est
le trait d'encre qui dessine la mascotte. Ce qui diffère est une **teinte**, pas
un rapport de luminance. Mon avis est au §7.

**Correction attendue.** Rectifier le motif. La décision, elle, reste à
l'Orchestrateur.

### [MINEUR] 18 — Le rejet de `var()` ne couvre pas la forme imbriquée

`if (/^var\([^)]*\)$/.test(t)) throw` attrape `var(--x, repli)` et laisse passer
les piles de polices — vérifié, c'est correct et la précision publiée est juste.
Mais `var(--a, var(--b))` n'est pas attrapé : `[^)]*` s'arrête à la première
parenthèse fermante, la chaîne continue, la regex échoue, et la valeur repart
comme littérale vers le calcul de luminance. Aucune occurrence aujourd'hui.

**Correction attendue.** Tester `t.startsWith("var(")` plutôt que la forme
complète, après avoir écarté le cas `var(--x)` seul déjà résolu au-dessus.

### [MINEUR] 19 — Le fond d'une forme SVG est celui du conteneur, jamais la forme dessinée dessous

Limite **déclarée par l'instrument lui-même**, dans sa sortie. Je la confirme et
je chiffre ce qu'elle coûte : la monture des `lunettes` est mesurée contre le
fond de page (`#FFF8EE`, 13,49:1) alors qu'elle repose sur la tête
(`--pilou-corps #FFEFE0`, **12,65:1**). Même chose pour les yeux et la truffe.
L'écart est ici sans conséquence — toutes les formes concernées restent très
au-dessus des seuils — mais une forme future posée sur un cosmétique saturé
serait mesurée contre le mauvais fond, et dans le sens indulgent.

**Correction attendue.** Aucune dans l'immédiat. À inscrire dans le rapport
comme une limite chiffrée et non seulement nommée, et à rouvrir si une variante
future empile deux formes colorées.

### [MINEUR] 20 — Le jeton `{n}` s'affiche non rendu sur la galerie

`Il en faut {n} pour celui-là.` apparaît tel quel comme titre du bloc des
paliers verrouillés. Le producteur l'explique dans le code : le rendu des jetons
est serveur et appartient à V1. L'explication est bonne et la galerie montre
légitimement la chaîne telle qu'elle est stockée. Je le relève seulement pour
qu'aucun agent aval ne le recopie en croyant que c'est l'affichage attendu.

---

## 7. Avis sur les trois points ouverts

### Point 7 — Pilou se lit comme un ours et non comme une loutre

**Ce n'est ni un [MAJEUR] ni un [MINEUR] : c'est une décision qui doit remonter
au produit, et je recommande une escalade à l'humain avant V9.**

Je motive, parce que la tentation de le classer [MAJEUR] est réelle et qu'il
faut dire pourquoi j'y résiste.

*Ce que le référentiel permet de constater.* §1.3 énonce quatre traits
opérables — « corps clair aux contours très arrondis, petites oreilles rondes,
joues colorées, museau doux ». **Les quatre sont respectés**, et le tour 2 les
a rapprochés encore : oreilles de 31 % à 23 % du rayon de la tête et désormais
posées sur son cercle, queue allongée et effilée, museau élargi et abaissé.
DES-09, seule exigence de design portant sur la mascotte, demande un SVG unique
réutilisable paramétré dans un fichier de config : tenu, vérifié. **Aucune
exigence n'est violée.** Un contrôleur qui prononcerait un [MAJEUR] ici
fabriquerait l'exigence qui lui manque pour le prononcer — c'est ce que la
troisième règle absolue interdit, et elle vaut dans les deux sens.

*Ce que le référentiel ne permet pas de trancher.* Le mot « loutre » figure en
§1.3, en §1.2 du livrable marketing et dans sa prose. Il n'est traduit nulle
part en géométrie. Décider s'il engage le dessin ou s'il n'est qu'une image,
c'est décider ce que §1.3 veut dire — et cela n'appartient ni au producteur ni
à moi. C'est le même type de question qu'ESC-001, que l'humain a tranchée en
une ligne.

*Pourquoi cela ne peut pas simplement aller au backlog.* Le coût de la décision
croît vite et de façon irréversible : la mascotte entre dans neuf verticales,
elle fournit l'icône d'application et l'écran de lancement (DES-10, V9), et
767 textes la nomment. Aujourd'hui elle tient dans **un fichier, un composant,
un fichier de config** — c'est le moment le moins cher de toute la vie du
projet pour en changer. Repoussée, elle deviendra une reprise transverse.

*Mon avis de fond, puisqu'il m'est demandé franchement.* J'ai regardé les deux
thèmes au rendu. La silhouette, et surtout la vignette « silhouette » grise qui
ne garde que le contour, est un **ours en peluche** : tête ronde, deux oreilles
rondes aux angles supérieurs, corps rond. C'est charmant, c'est chaleureux, un
enfant de six ans et demi l'aimera. Ce n'est pas une loutre, et aucun adulte à
qui on demanderait « quel animal est-ce ? » ne répondrait loutre.

*Si l'humain veut une loutre*, voici les critères mesurables qui feraient
basculer la lecture, pour que la décision soit actionnable et non une
appréciation : oreilles de rayon ≤ 6 et **entièrement contenues** dans le cercle
de la tête ; tête plus large que haute ; museau posé bas et large, avec des
bajoues marquées ; queue **prolongeant la ligne du corps** au lieu de démarrer à
côté. Une passe de dessin dédiée, sur un seul fichier.

*Si l'humain veut fermer le sujet*, la formulation qui le ferme proprement est :
« les quatre traits énoncés en §1.3 sont la spécification opposable ; le nom de
l'espèce ne l'est pas » — inscrite comme arbitrage, elle empêche que la question
soit rouverte à chaque tour par chaque agent qui regardera le dessin.

**Recommandation : ouvrir une escalade, question fermée, avant l'ouverture de
V9.** Dans ma liste de constats je ne le compte pas, précisément pour qu'il ne
soit pas traité comme un défaut de livrable.

### Point 8 — `Button variante="texte"` en thème Apple, à 3,32:1

**Je retire ma proposition du tour 1 et je me range à son refus.** Son argument
est meilleur que le mien.

J'avais proposé de rattacher cette variante à `--tipi-texte-appui`, ce qui la
porterait de 3,32:1 à 15,45:1. Il répond qu'en thème Apple ce rôle vaut
l'encre, donc « Je ne sais pas » et « Passer » s'afficheraient en 20 px / 700
**dans la même encre que l'action principale**, et que DES-06 veut une action
principale identifiable au premier regard. Il a raison : ma correction achetait
12 points de contraste sur un couple **déjà conforme** en les payant avec la
hiérarchie d'action — et c'est la hiérarchie qui compte pour un enfant fatigué
qui cherche le bouton à presser. Un ratio conforme n'a pas à être amélioré au
prix d'une exigence qui, elle, serait affaiblie.

La marge de 0,32 reste mince et mon inquiétude d'origine n'était pas nulle. La
bonne sortie, s'il en faut une un jour, n'est ni le gris ni l'encre mais une
**troisième valeur de 3.8 déjà présente** — rien n'oblige une action tertiaire à
être neutre. **Mon avis : garder le gris à 3,32:1, fermer le point**, et ne le
rouvrir que si V4 ou V5 observe qu'un enfant hésite. Je suis d'accord avec lui
pour que ce soit tranché maintenant et non renvoyé aux verticales : deux
verticales doivent lire la même règle.

### Point 9 — Le corps de Pilou vaut le fond en thème Apple

**Mon avis : fermer le point sans amender 3.8.** Deux raisons, mesurées.

D'abord, le motif invoqué est faux (constat 17) : `#EAF3FF` existe dans la
palette Apple de 3.8 et pourrait servir de corps. **Aucun amendement n'est
nécessaire**, et il ne faut pas que l'Orchestrateur tranche en croyant qu'on lui
demande d'ajouter une valeur.

Ensuite, l'« asymétrie » est bien moindre qu'annoncée. Le corps de Pilou est à
**1,06:1** de son fond dans le thème Pilou et à **1,00:1** dans le thème Apple.
Dans les deux thèmes, c'est le trait d'encre qui dessine la mascotte — 13,49:1
et 15,45:1 — et le ventre blanc qui lui donne son volume. Le thème Pilou n'a
jamais eu de corps contrasté non plus : il a un corps *teinté*. La différence
est une affaire de teinte, pas de perceptibilité, et aucune exigence ne porte
sur la teinte du corps de la mascotte.

Si l'Orchestrateur veut néanmoins un corps visible en thème Apple, l'option
existe et coûte une ligne — `--pilou-corps: var(--palette-apple-teinte-bleu)` —
avec une réserve à peser : ce bleu pâle est déjà celui des `Chip`, des `Card`
teintées et de l'option retenue du `ThemeSwitch`. Une mascotte de la même
couleur que les pastilles d'information n'est pas forcément un gain.

### Le point 5 du tour 1, resté ouvert : les joues en thème Apple

Il ne l'a pas fait, en disant que la décision touche l'identité et revient à
l'Orchestrateur. C'est cohérent avec ce que j'avais écrit et je ne le lui
reproche pas. **Je maintiens mon avis et je le renforce après un second
regard** : au rendu du tour 2, les deux disques `#FF9500` restent l'élément le
plus criard des deux panneaux, et l'effet a empiré, parce que le corps de Pilou
en thème Apple est désormais un simple contour — les joues flottent donc sur du
blanc. Mesurées 2,01:1, classées décoratives à juste titre, aucune information
portée. Le geste tient en une ligne, `--pilou-joue` vers une teinte ou vers
`none` dans le bloc Apple. **À trancher en même temps que le point 7 : c'est la
même décision d'identité.**

---

## 8. Chiffres annoncés contre chiffres réels — tour 2

| # | Grandeur annoncée | Annoncé | Mesuré par moi | Écart |
| --- | --- | --- | --- | --- |
| 1 | `typecheck && lint && build` | code 0 | **0** | — |
| 2 | ESLint | `✔ No ESLint warnings or errors` | identique | — |
| 3 | Pages statiques | 4 / 4 | **4 / 4** | — |
| 4 | Taille de `/dev/design-system` | — | 15,6 kB (15,4 au tour 1 : les vignettes ajoutées) | — |
| 5 | Couples de l'instrument de calcul | 70 | **70** (35 × 2) | — |
| 6 | Couples sous seuil | 0 | **0** | — |
| 7 | I1 / I2 | 27 / 0 et 25 / 0 | **identiques** | — |
| 8 | I3 — entrées de palette | 27 ; sans rôle 2 ; non déclarées 0 | **identique** | — |
| 9 | Textes mesurés au rendu | 133 | **133** | — |
| 10 | Formes mesurées au rendu | 697 | **697** | — |
| 11 | Groupes de tracés | — | **34** | — |
| 12 | Sous seuil au rendu | 0 | **0** | — |
| 13 | Exemptions publiées | 10 | **10** (4 `data-tipi-decor` + 6 WCAG 1.4.3) | — |
| 14 | Éléments marqués `data-tipi-decor` | 66 | **66** = 60 joues + 6 chevrons, 2 motifs, aucun inattendu | — |
| 15 | `lunettes` après correction | 13,49 / 15,45:1 | **13,49 / 15,45:1** | — |
| 16 | `lunettes` avant correction | 2,05:1 | **2,05:1** (rejoué sur `dad1524`) | — |
| 17 | Rejeu sur le tour 1 : code de sortie | 1 | **1** | — |
| 18 | Rejeu sur le tour 1 : groupes sous seuil | « trouve le MAJEUR 1 seul » | **5 groupes**, dont 1 réparé et 4 exemptés au tour 2 | **décomposition absente** (constat 14) |
| 19 | Cosmétique verrouillé | 3,67 / 3,32:1 | **3,67 / 3,32:1** en remplissage ; **13,49 / 15,45:1** en trait | annonce conservatrice |
| 20 | Touche « Effacer » désactivée | 2,32 → 4,44:1 | **4,44:1** (apple) et **3,97:1** (pilou, non annoncé) | chiffre Pilou manquant |
| 21 | Couple `ThemeSwitch` ajouté | 5,22 / 15,03:1 | **5,22 / 15,03:1** | — |
| 22 | `#6E6E73` | 5,07:1 | **5,0713 → 5,07:1** | — |
| 23 | Jetons de 3.8 | 26, 0 manquant | **26 / 26**, et **aucune ligne de jeton modifiée** depuis le tour 1 | — |
| 24 | Couleurs en dur, code applicatif | 0 | **0** ; balayage du dépôt : 3 porteurs, 3 déclarés, 0 inattendu | — |
| 25 | Cibles tactiles | non chiffré | **46 contrôles, 0 sous 56 px**, à 390 px et 1500 px, 0 débordement | — |
| 26 | `div`/`span` cliquables | 0 | **0** | — |
| 27 | Contrôles sans nom accessible | — | **0** sur 46 (arbre d'accessibilité réel) | — |
| 28 | `<svg>` rendus | — | **89** (85 `aria-hidden`, 4 `role="img"`+label, **0** sans l'un ou l'autre) | — |
| 29 | Emoji / dégradés | 0 / 0 | **0 / 0** | — |
| 30 | Fichiers dessinant Pilou | 1 | **1** — DES-09 tenue | — |
| 31 | Appelants de `cosmetiquesDebloques` | 0 | **0** | — |
| 32 | `pierresRequises` lecteurs restants | 0 | **0** | — |
| 33 | `prefers-reduced-motion` | — | **toutes animations à 1 ms, 1 itération** | — |
| 34 | Commutation de thème | — | `pilou → apple`, fond et `aria-checked` suivent | — |
| 35 | Motif du point ouvert 9 | « demanderait une 13ᵉ valeur » | **faux** : `#EAF3FF` existe dans 3.8 | **écart** (constat 17) |
| 36 | « asymétrie forte entre les deux thèmes » | qualitatif | **1,00:1 contre 1,06:1** — quasi identique | **écart de qualification** |

Sur 36 grandeurs recontrôlées : **32 exactes, 4 en écart**, dont deux écarts de
qualification (nº 35, 36), un de décomposition (nº 18) et un chiffre manquant
(nº 20). **Aucune sortie de commande inventée** : les deux sorties d'instrument
publiées en §0.8 sont identiques aux miennes, aux délimiteurs Markdown et au
numéro de port près.

---

## 9. Acquis du tour 1 : rien n'est cassé

Recontrôlé intégralement, parce qu'une correction est le meilleur moment pour
casser autre chose.

| Acquis | État au tour 2 |
| --- | --- |
| 26 jetons de 3.8 exacts et bien affectés | **intact** — `git diff` ne montre aucune ligne de jeton modifiée, seulement des commentaires |
| 0 couleur en dur dans le code applicatif | **intact**, et le balayage est désormais étendu au dépôt entier |
| 0 `div`/`span` cliquable | **intact** (source et rendu) |
| Toute icône seule étiquetée | **intact** — 0 svg sans `aria-hidden` ni `role="img"`+label sur 89 |
| 46 cibles ≥ 56 px, 0 débordement | **intact** à 390 px et 1500 px |
| DES-09 : un seul SVG de Pilou | **intact** — 2 fichiers portent un `<path>`, `Icon.tsx` et `Pilou.tsx` |
| 0 emoji, 0 dégradé | **intact** |
| DES-08 : `prefers-reduced-motion`, aucun clignotement | **intact** |
| PRD-17 : commutation à chaud | **intact** |
| Règles ESLint de TEC-15 | **intactes** — `.eslintrc.json` inchangé |
| Aucune dépendance ajoutée | **intact** — `package.json` inchangé ; Playwright résolu hors projet par `NODE_PATH`, comme l'architecture §15.1 l'impose |

---

## 10. Sorties réelles de mes commandes — tour 2

### 10.1 `rm -rf .next && pnpm typecheck && pnpm lint && pnpm build`

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
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /_not-found                          873 B          88.1 kB
└ ○ /dev/design-system                   15.6 kB         103 kB
+ First Load JS shared by all            87.2 kB

○  (Static)  prerendered as static content

EXIT_CHAIN=0
```

### 10.2 Les trois instruments, rejoués

```
$ bash scripts/verifier-design-system.sh
=== 1. Couleurs en dur (DES-01, DES-02) ===
-- occurrences DANS themes.css --                     32
-- occurrences dans le CODE APPLICATIF, ailleurs --   (aucune)   compte : 0
-- BALAYAGE DU DÉPÔT ENTIER, y compris sans dièse --
   porteurs légitimes déclarés : scripts/verifier-design-system.sh .cursor/rules/20-themes.mdc src/styles/themes.css
   porteurs trouvés :
     .cursor/rules/20-themes.mdc
     scripts/verifier-design-system.sh
     src/styles/themes.css
   aucun porteur inattendu
…
=== VERDICT DE L INSTRUMENT : OK ===
EXIT=0

$ node scripts/verifier-contraste.mjs
Couples mesurés : 70 (35 par thème, 2 thèmes).
Couples sous leur seuil : 0.
I1 — rôles déclarés côté Pilou : 27 ; non résolus côté Apple : 0
I2 — rôles de couleur : 25 ; jamais mesurés : 0
I3 — entrées de palette : 27 ; sans rôle : 2 (--palette-apple-accent-rouge, --palette-apple-accent-gris) ; sans rôle ET non déclarées : 0
=== VERDICT DE L INSTRUMENT : OK ===
EXIT=0

$ TIPI_URL=…:3218/dev/design-system node scripts/verifier-contraste-rendu.mjs
URL : http://127.0.0.1:3218/dev/design-system
Éléments : 1185 · SVG Pilou : 30 · SVG icône : 59 · marqués `data-tipi-decor` : 66
Textes relevés : 137 · formes relevées : 697
…
| pilou | texte « Je commence » | 2.93:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | texte « Valider »     | 2.93:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | texte « Je commence » | 2.33:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | texte « Valider »     | 2.33:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | 3× path de Icon       | 1.58:1 | data-tipi-decor="chevron" |
| pilou | 2× path de Icon       | 3.97:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| pilou | 28× circle de Pilou   | 2.15:1 | data-tipi-decor="joue" |
| apple | 3× path de Icon       | 1.68:1 | data-tipi-decor="chevron" |
| apple | 2× path de Icon       | 4.44:1 | composant désactivé — exempté par WCAG 2.1 SC 1.4.3 |
| apple | 28× circle de Pilou   | 2.01:1 | data-tipi-decor="joue" |

Textes mesurés : 133. Groupes de tracés mesurés : 34 (697 formes).
Sous leur seuil : 0.
Exemptions : 4 par `data-tipi-decor` (66 éléments marqués dans le DOM), 6 par WCAG 1.4.3 (désactivés).
=== VERDICT DE L INSTRUMENT : OK ===
EXIT=0
```

Comparaison avec les sorties publiées en §0.8 du rapport : **identiques**, aux
délimiteurs Markdown et au numéro de port près.

### 10.3 Ma propre mesure de contraste, indépendante de la sienne

Même méthode qu'au tour 1 : styles calculés du navigateur, fond effectif obtenu
en remontant les ancêtres, composition alpha, luminance WCAG 2.1 recodée par
moi. Aucun de ses scripts n'est lu.

```
Couples texte distincts mesurés sur le rendu : 42. Sous seuil : 2
  (les deux boutons désactivés — 2,93:1 pilou et 2,33:1 apple, exemptés par WCAG 1.4.3)

Tracés dont NI le trait NI le remplissage n'atteint 3:1 :
  pilou | Icon  | 3× chevron     | stroke rgb(216,204,184) | 1.58  -> data-tipi-decor
  pilou | Pilou | 28× joue       | fill   rgb(255,139,123) | 2.15  -> data-tipi-decor
  apple | Icon  | 3× chevron     | stroke rgb(199,199,204) | 1.68  -> data-tipi-decor
  apple | Pilou | 28× joue       | fill   rgb(255,149,0)   | 2.01  -> data-tipi-decor
  (+ les joues en mode silhouette pleine : fill="none", invisibles, sans objet)

Aucune forme NON exemptée sous 3:1, dans aucun des deux thèmes.

div/span porteurs d'un onclick : 0
emoji dans un texte rendu : 0 · emoji dans tout le HTML : false
dégradés dans les styles calculés : 0
aria : {"ariaLabels":7,"buttons":42,"links":4,"svg":89,"svgRoleImg":4,"svgAriaHidden":85,"svgNi":0}
panneaux data-theme : ["pilou","pilou","apple"] · html : pilou
```

**Ma mesure et la sienne concordent sur l'ensemble du rendu.**

### 10.4 Cibles tactiles, accessibilité, animations, thèmes

```
--- téléphone 390 px ---        --- bureau 1500 px ---
cibles < 56 px : 0              cibles < 56 px : 0
débordement horizontal : 0      débordement horizontal : 0
svg sans étiquette ni aria-hidden : 0

arbre d'accessibilité réel : 46 contrôles nommés, boutons/liens sans nom : 0

prefers-reduced-motion: no-preference -> {"apparait 0.26s ×1":4,"respire 4s ×∞":4,"pense-1 1.8s ×∞":6}
prefers-reduced-motion: reduce        -> {"apparait 0.001s ×1":4,"respire 0.001s ×1":4,"pense-1 0.001s ×1":6}

html[data-theme] initial : pilou → après clic « Apple » : apple
fond body : rgb(255,248,238) -> rgb(245,245,247)
aria-checked des deux options : ["false","true"]
```

### 10.5 Vérification des orphelins et des jetons

```
$ grep -rn "cosmetiquesDebloques" src/ scripts/
src/config/mascot.config.ts:137:// `cosmetiquesDebloques(solde)` a été RETIRÉE au tour 2. …
(aucun appelant)

$ les 26 jetons de 3.8, cherchés un par un dans themes.css
(rien — 26/26 présents)

$ git diff dad1524 HEAD -- src/styles/themes.css | grep -E '^[+-] *--'
(aucune ligne de jeton modifiée)
```

---

## 11. Ce que je n'ai pas pu contrôler — tour 2

Inchangé depuis le tour 1, et toujours opposable :

1. **Aucun appareil tactile réel, aucun lecteur d'écran.** J'ai lu l'arbre
   d'accessibilité de Chromium ; je n'ai rien entendu.
2. **Un seul écran.** `/dev/design-system` reste la seule page. DES-04 et DES-06
   s'énoncent « dans tous les écrans enfant » ; ces écrans n'existent pas. C'est
   aussi la portée exacte de l'instrument de rendu — voir constat 13.
3. **Un seul moteur de rendu**, Chromium 1.56.1, une seule densité.
4. **La silhouette de Pilou.** Je peux dire ce que je vois et donner des
   critères ; je ne peux pas décider ce que « loutre » engage. Voir §7.

---

## 12. Conclusion du tour 2

`VERDICT: PASS_AVEC_RESERVES` — **0 [BLOQUANT], 0 [MAJEUR], 8 [MINEUR]** (13 à
20). La porte G3 peut s'ouvrir.

Les deux [MAJEUR] sont levés, vérifiés au code, à la mesure et à l'œil. Les
douze constats du tour 1 sont tous traités. Aucun acquis n'est cassé. Aucune
sortie n'est inventée.

Ce qui distingue ce tour : le producteur n'a pas corrigé deux défauts, il a
corrigé **la raison pour laquelle il ne les voyait pas**, puis il a prouvé
l'instrument dans le seul sens qui vaille — en le lançant sur le code qui
contenait le défaut, et en publiant qu'il le retrouve seul. J'ai refait cette
manipulation intégralement et elle tient. Il a également déclaré ce que son
instrument **n'attrape pas**, ce qui vaut mieux qu'un instrument qui prétendrait
tout couvrir.

Mes huit réserves portent presque toutes sur le même endroit : les garde-fous de
l'instrument sont imprimés plutôt qu'assertés (14, 15, 16), et sa couverture
dépend d'un lien entre la config et la galerie que rien n'affirme (13). Aucune
n'empêche la porte de s'ouvrir ; toutes se ferment en quelques lignes, et le
producteur a déjà écrit le bon patron ailleurs, dans l'invariant I3.

À verser dans `BACKLOG-V2.md` : 18, 19, 20. À traiter avant l'ouverture de V6 :
13, 14, 15, 16, 17, et les cinq clés de contenu confiées à `contenu-enfant`.
À remonter à l'humain avant V9 : la silhouette de la mascotte et les joues du
thème Apple, qui sont une seule et même décision d'identité.

---
---

# TOUR 1 — verdict du 2026-09-21, conservé

`VERDICT: FAIL` — 2 [MAJEUR], 10 [MINEUR]. Le sort de chacun des douze constats
est tracé dans le tableau du §1 ci-dessus. Le texte intégral suit, inchangé.

## Rappel du périmètre contrôlé

Livrable contrôlé :
`docs/agents/P3/design-system.out.md` + `tailwind.config.ts`,
`src/styles/themes.css`, `src/components/ui/**`, `src/components/pilou/**`,
`src/config/mascot.config.ts`, `src/app/dev/design-system/page.tsx`, `scripts/`.

Sources lues avant de contrôler : `TIPI-PROMPT-CURSOR.md` (bloc **AMENDEMENTS**
en premier, puis §1.3, §2.5 REQ-DES, §2.6 REQ-ETH, §3.8) ;
`docs/agents/P2/architecture.out.md` (§2 arborescence, §15.1 dépendances) ;
`docs/agents/P1/produit-marketing.out.md` (§7.9 coffre, §4 brief mascotte) ;
`docs/agents/GATES.md` (ARB-01 à ARB-15) ; `.cursor/rules/20-themes.mdc` et
`40-protocole-agents.mdc`.

**Deux [MAJEUR] imposent le FAIL.** Ils portent tous les deux sur le même point
aveugle : l'instrument de contraste mesure la liste de couples que le
producteur a écrite à la main, jamais ce que la page dessine. Le reste du
livrable est solide et je le dis : les 26 jetons de 3.8 sont exacts et
correctement affectés, zéro couleur en dur dans `src/`, zéro `div` cliquable,
zéro emoji, zéro dégradé, les cibles tactiles tiennent réellement 56 px au
navigateur, les deux thèmes commutent à chaud sans casser un composant, et
**toutes les sorties de commande publiées sont reproduites, dont une à l'octet
près**.

---

# 1. Constats

## [MAJEUR] 1 — Le cosmétique `lunettes` est à 2,05:1 dans le thème Pilou, et l'instrument imprime « OK » pour un couple que la page ne dessine pas

Le rapport affirme, décision DS-4 (§5, lignes 306-309) :

> « Les **formes cosmétiques**, elles, sont cernées par le trait d'encre du
> groupe SVG : c'est le trait, mesuré à 6,57:1 et 4,18:1, qui rend la forme
> perceptible, et non le remplissage. »

C'est faux pour un cosmétique sur cinq. `src/components/pilou/Pilou.tsx`,
lignes 73-81 :

```tsx
    case "lunettes":
      return (
        <g fill="none" stroke={couleur} strokeLinecap="round">
```

Ce `<g>` **redéfinit `stroke`** et annule le trait d'encre du groupe parent
(ligne 114, `<g stroke={trait} … fill="none">`). Les lunettes ne sont donc pas
cernées : elles sont entièrement tracées en `--pilou-cosmetique`. Les quatre
autres variantes (`echarpe`, `bonnet`, `noeud`) héritent bien du trait d'encre
et sont conformes — c'est ce qui rend le défaut invisible à la relecture.

Mesures relevées sur le rendu (styles calculés du navigateur, section 6.4) :

| Thème | Élément | Trait | Fond | Ratio mesuré | Seuil (non textuel) |
| --- | --- | --- | --- | --- | --- |
| pilou | `g` + 2 `circle` + 1 `path` des lunettes | `#6fb8e8` | `--tipi-fond #fff8ee` | **2,05:1** | 3:1 — **ÉCHEC** |
| pilou | idem, posé sur la tête | `#6fb8e8` | `--pilou-corps #ffefe0` | **1,92:1** | 3:1 — **ÉCHEC** |
| apple | idem | `#007aff` | `--tipi-fond #f5f5f7` | 3,68:1 | 3:1 — OK |

Le 1,92 est **déjà publié par le producteur**, en mesure de référence (§4.3,
ligne « remplissage du cosmétique sur le corps | 1,92:1 »), avec le motif
« mesure d'origine, avant de mesurer le trait qui cerne la forme ». Or pour les
lunettes il n'y a pas de trait qui cerne la forme : la mesure de référence
*est* la mesure livrée. Le couple déclaré dans `scripts/verifier-contraste.mjs`
ligne 134 —

```js
  ["trait autour du cosmétique", "--pilou-trait-couleur", "--pilou-cosmetique", "nonTexte", "Pilou"],
```

— n'existe dans aucun pixel de cette variante. L'instrument imprime pour elle
une ligne verte à 6,57:1. C'est exactement le cas nommé par
`40-protocole-agents.mdc`, règle 5 : « **Un instrument qui affiche le défaut
sans le voir est pire qu'un instrument muet** : il produit une preuve verte. »

Le cosmétique n'est pas décoratif : sur `/enfant/coffre` (PRD-14) c'est **lui**
l'information — c'est ce que l'enfant a gagné. Le producteur l'a lui-même
classé `nonTexte` (seuil 3:1) pour les quatre autres variantes.

**Correction attendue.** Retirer `stroke={couleur}` du `<g>` des lunettes et
laisser la monture hériter du trait d'encre du groupe parent, la couleur du
cosmétique passant en `fill` de la monture comme pour les autres variantes ; ou
à défaut ajouter un second tracé d'encre. Puis, et surtout, **corriger
l'instrument** : le couple mesuré doit être dérivé du rendu (couleur calculée
du tracé contre son fond) et non d'une liste écrite à la main, sinon le même
défaut reviendra à la prochaine variante. Publier les deux mesures, ancienne et
nouvelle, conformément à la règle 1 de « Corriger un instrument de mesure ».

## [MAJEUR] 2 — `silhouette` n'affiche jamais le cosmétique : les quatre paliers verrouillés sont un seul et même dessin

`src/components/pilou/Pilou.tsx`, ligne 152 :

```tsx
        <Cosmetique id={silhouette ? "aucun" : cosmetique} />
```

Quand `silhouette` vaut `true`, le cosmétique est forcé à `"aucun"` et le
composant `Cosmetique` renvoie `null`. Le composant rend donc une Pilou grise
**sans rien dessus**, identique pour `echarpe`, `bonnet`, `noeud` et
`lunettes`. Je l'ai vérifié au rendu : la vignette « silhouette » de
`/dev/design-system` est une masse grise sans visage ni accessoire, dans les
deux thèmes.

Le livrable marketing validé en G1 (`produit-marketing.out.md`, ligne 1293)
dit :

> « Un **cosmétique verrouillé** est affiché en silhouette neutre »

C'est le *cosmétique* qui doit être en silhouette, pas la mascotte entière.
PRD-14 exige « progression vers le palier suivant » : un enfant qui voit quatre
fois la même forme grise ne sait pas vers quoi il avance, et le texte associé
— `coffre.cosmetiques.verrouille`, « Il en faut {n} pour celui-là. » — désigne
un « celui-là » que l'écran ne montre pas.

Le rapport décrit pourtant l'inverse, décision DS-4 (§5, lignes 295-297) :

> « Au rendu, le cosmétique verrouillé était pratiquement invisible : l'enfant
> n'aurait pas su qu'il existe. »

La correction apportée (`--pilou-silhouette` passé de la couleur de ligne au
texte discret) a bien remonté le contraste du **corps** de 1,15:1 à 3,67:1,
mais elle a traité la mascotte, pas le cosmétique. Le défaut visé reste entier.

La conséquence dépasse l'esthétique : l'API livrée **ne permet pas** d'écrire
l'écran spécifié. `<Pilou silhouette cosmetique="bonnet" />` ne peut pas
produire « Pilou normale + bonnet en silhouette ». V6 devrait donc rouvrir
`Pilou.tsx`, alors que DES-09 veut un SVG unique paramétré et que le paramètre
nécessaire n'existe pas.

**Correction attendue.** Dissocier les deux états : un paramètre qui met la
**mascotte** en silhouette et un paramètre qui met le **cosmétique** en
silhouette, le second laissant `Cosmetique` rendre son tracé avec
`--pilou-silhouette` en `fill` et en `stroke`. Le contraste de ce rendu est déjà
mesuré et conforme (3,67:1 / 3,32:1). Puis ajouter la vignette correspondante à
`/dev/design-system`, faute de quoi le prochain contrôle visuel ne verra pas
davantage.

---

## [MINEUR] 3 — Un couple réellement rendu est absent de la liste des 68

Le sous-titre de l'option retenue de `ThemeSwitch` rend `text-texte-appui` sur
`bg-teinte-bleu` (`src/components/ui/ThemeSwitch.tsx` lignes 69 et 77). Ce
couple n'est dans aucune des 34 entrées de `COUPLES`. Mesuré au navigateur :

| Thème | Avant-plan | Fond | px / poids | Ratio | Seuil | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| pilou | `#6b6459` | `#e8f4fc` | 15 / 400 | **5,22:1** | 4,5:1 | OK |
| apple | `#1d1d1f` | `#eaf3ff` | 15 / 400 | **15,03:1** | 4,5:1 | OK |

Aucun échec, mais la démonstration que la liste est tenue à la main et qu'elle
dérive du rendu. **Correction attendue** : ajouter le couple, ou dériver la
liste du rendu (voir constat 1).

## [MINEUR] 4 — Les états désactivés ne sont mesurés par aucun instrument

`Button` porte `disabled:opacity-60` et `Keypad` `disabled:opacity-40`. Ce sont
les deux seuls couples composés du design system, et le modèle de
`verifier-contraste.mjs` — `(hex, hex)` — ne peut structurellement pas les
voir. Mesuré au navigateur, après composition alpha :

| Thème | Élément | Avant-plan | Fond | Ratio composé |
| --- | --- | --- | --- | --- |
| pilou | `Button` désactivé, 20 px / 700 | `#2e2a26` à 60 % | `#6fb8e8` | **2,93:1** |
| apple | `Button` désactivé, 20 px / 700 | `#ffffff` à 60 % | `#007aff` | **2,33:1** |

WCAG 2.1 SC 1.4.3 exempte explicitement les composants d'interface inactifs :
**ce n'est pas une violation de DES-05**, et je ne le compte pas comme tel. Mais
la phrase « 68 couples mesurés, 0 sous son seuil » énonce une propriété du
*jeu de jetons*, pas du rendu. Le cas de la touche « Effacer » du `Keypad`
mérite une mention : `disabled:opacity-40` est son **état initial**, et c'est un
écran d'adulte. **Correction attendue** : dire dans le rapport que les états
composés ne sont pas couverts, ou les couvrir.

## [MINEUR] 5 — `#6E6E73` n'est pas à 5,15:1

Rapport §9, point 1 :

> « ajouter à 3.8 une seule valeur, `#6E6E73`, qui mesure **5,15:1** sur
> blanc. »

Recalculé : `#6E6E73` sur `#FFFFFF` = **5,0713** → **5,07:1** tronqué. Sur
`#F5F5F7` : 4,65:1. Le chiffre reste au-dessus de 4,5 et la conclusion ne
change pas, mais c'est une grandeur annoncée fausse dans un rapport dont toutes
les autres sont exactes. **Correction attendue** : corriger la valeur.

## [MINEUR] 6 — « Seul fichier du dépôt contenant une valeur de couleur » est inexact

Rapport §1.1 et en-tête de `themes.css` :

> « `src/styles/themes.css` | **Seul fichier du dépôt contenant une valeur de
> couleur.** »

`scripts/verifier-design-system.sh`, lignes 68-70, contient **les 26 valeurs de
3.8**, écrites sans `#` :

```bash
jetons="fff8ee ffffff 2e2a26 6b6459 8a8074 ede6d8 d8ccb8 6fb8e8 ff8b7b 8fe3c0 ffd166
e8f4fc ffefe0 fff3d6 e9f9f0 f5f5f7 1d1d1f 86868b e5e5ea c7c7cc 007aff ff9500
34c759 ff3b30 8e8e93 eaf3ff"
```

Le motif de son propre contrôle 1 (`#[0-9a-fA-F]{3,8}\b`) ne les voit pas, et
sa portée (`src tailwind.config.ts`) ne couvre pas `scripts/`. L'invariant
réellement tenu — et il l'est, je l'ai vérifié sur tout le dépôt — est : *aucune
couleur en dur dans `src/` ni dans `tailwind.config.ts`, hors `themes.css`*.
C'est déjà l'essentiel : `scripts/` n'est pas un composant, et une table de
référence recopiée depuis 3.8 est ici **légitime** — c'est la seule façon de
contrôler la conformité à une spécification écrite en prose. **Correction
attendue** : énoncer la portée réelle, dans le rapport comme dans l'en-tête de
`themes.css`.

## [MINEUR] 7 — Cinq références de contenu pendantes, dans un lecteur qui lève

`src/config/mascot.config.ts` déclare `cleLibelle: "coffre.cosmetiques.aucun"`,
`.echarpe`, `.bonnet`, `.noeud`, `.lunettes`. Vérifié : **aucune des cinq
n'existe** dans `content/`, qui ne porte que `titre`,
`bouton_appliquer`, `verrouille`, `debloque`, `vide`. Le producteur le signale
franchement (§8.5) et a eu raison de ne pas écrire ces textes (ARB-10). Mais
`textes.ts` **lève** sur une clé absente — choix par ailleurs excellent — donc
la première verticale qui câble `cleLibelle` sur le lecteur fait tomber l'écran
du coffre. **Correction attendue** : faire produire les cinq clés par
`contenu-enfant` avant l'ouverture de V6 (voir avis § 2, point 3).

## [MINEUR] 8 — Les seuils 0/15/30/45/60 n'ont pas de source

Traité en détail en section 3.

## [MINEUR] 9 — Défauts de dessin visibles au rendu, qu'aucun grep ne voit

Relevés en regardant les captures (section 6.5) :

- **L'icône `engrenage`** (`Icon.tsx` lignes 53-58 : un cercle et huit rayons
  droits) se lit comme un pictogramme de **luminosité**, pas comme un engrenage.
  Elle porte la ligne « Apparence » des Réglages, où l'ambiguïté passe ; elle
  porterait mal un menu Réglages. Un engrenage demande des dents, pas des rayons.
- **Pilou se lit comme un ours en peluche, pas comme une loutre.** §1.3 du
  prompt maître et le livrable marketing (lignes 90, 177, 204) disent « une
  petite loutre ». Le dessin : oreilles `r=12` sur une tête `r=39`, soit 31 %,
  posées **entièrement hors** du cercle de la tête ; museau en ovale large ;
  queue en palette plate le long du corps, sans effilement. Aucune exigence ne
  chiffre la géométrie de la mascotte, et §1.3 est par ailleurs respecté
  (« contours très arrondis, joues colorées, museau doux ») — je le classe
  donc mineur, mais il est à trancher avant que la mascotte n'entre dans neuf
  verticales et dans l'icône d'application (DES-10, V9).
- **Le pompon du bonnet est rogné** : `<circle cx="80" cy="6" r="7">` déborde
  de 1 px au-dessus du `viewBox="0 0 160 160"`.
- **Thème Apple : `--pilou-corps` vaut `--palette-apple-fond` (`#f5f5f7`)**,
  c'est-à-dire exactement `--tipi-fond`. Le corps de Pilou est à **1,00:1** avec
  la page et son ventre à 1,08:1 ; seul le trait d'encre (15,45:1) la dessine.
  C'est lisible et conforme, mais c'est une asymétrie forte entre les deux
  thèmes que le rapport ne mentionne nulle part.

## [MINEUR] 10 — Deux jetons de 3.8 déclarés et reliés à aucun rôle

`--palette-apple-accent-rouge` (`#FF3B30`) et `--palette-apple-accent-gris`
(`#8E8E93`) sont présents dans `themes.css` — ce que DES-02 exige — mais aucun
jeton de rôle ne pointe vers eux, donc aucun composant ne peut les atteindre.
L'invariant I2 ne les couvre pas : il porte sur les 25 **rôles**, jamais sur les
27 entrées de palette. Ce n'est pas un défaut de conformité ; c'est une limite
d'I2 à écrire, puisque le rapport présente I2 comme la garantie qu'« aucune
couleur n'est jamais mesurée ».

## [MINEUR] 11 — Deux fragilités de `verifier-contraste.mjs`

- `resoudre()` (ligne 72) ne reconnaît que `^var\((--x)\)$`. Un
  `var(--x, repli)` renverrait la chaîne brute, `composantes()` produirait `NaN`
  et le ratio s'afficherait `NaN:1` sans faire échouer la comparaison
  `r >= seuil`… qui vaudrait `false` — donc ici le script échouerait bruyamment.
  Acceptable, mais à durcir par un rejet explicite.
- La branche `theme === "pilou" && s.includes(':root,\n[data-theme="pilou"]')`
  (ligne 57) est morte : `s.includes(":root")` l'a déjà satisfaite ligne 55.
  Sans effet, à retirer.

## [MINEUR] 12 — Le rapport §8.2 est désormais faux

> « **Aucun commit git.** Interdit par ma fiche de mission ; l'arbre de travail
> porte les fichiers. »

Le commit `dad1524 feat(design): design system… [agent:design-system]` existe.
Il a été fait par `Claude (Orchestrateur Tipi)` le 2026-09-21 à 10:10:52, après
la dernière écriture du producteur (10:06). **Ce n'est donc pas une faute du
producteur** — je le note pour que la phrase ne soit pas lue comme une
affirmation fausse au prochain tour.

---

# 2. Avis sur les six points ouverts du §9

### Point 1 — DS-1 est-elle acceptée, ou faut-il amender 3.8 ?

**Conserver DS-1. Ne pas ajouter `#6E6E73`.**

D'abord les chiffres, recalculés par moi :

| Couple | Ratio calculé | Tronqué | Verdict AA petit texte |
| --- | --- | --- | --- |
| `#86868B` sur `#FFFFFF` | 3,6229 | **3,62:1** | échec |
| `#86868B` sur `#F5F5F7` | 3,3273 | **3,32:1** | échec |
| `#8E8E93` sur `#FFFFFF` | 3,2605 | **3,26:1** | échec |
| `#8E8E93` sur `#F5F5F7` | 2,9945 | **2,99:1** | échec |
| `#C7C7CC` sur `#FFFFFF` | 1,6841 | **1,68:1** | échec |
| `#6E6E73` sur `#FFFFFF` | 5,0713 | **5,07:1** | (hors 3.8) |

Le producteur a raison sur les deux affirmations : `#86868B` est bien à
**3,62:1**, et **aucun gris de la palette Apple de 3.8 n'atteint 4,5:1**.

**Sa solution est correcte et ne contourne aucune règle.** Il n'a pas modifié
un jeton : il a séparé deux *rôles* qui étaient confondus. `--tipi-texte-secondaire`
garde `#86868B` et ne sert qu'où 3:1 suffit ; `--tipi-texte-appui` prend l'encre
en thème Apple. Les 26 valeurs de 3.8 restent déclarées, exactes et
correctement affectées — je l'ai vérifié jeton par jeton sur `themes.css`.

**Laquelle doit céder, DES-02 ou DES-05 ?** **Aucune des deux, parce que le
conflit n'était qu'apparent.** DES-02 impose une *palette* — que ces 26 valeurs
soient les couleurs du thème. Elle ne dit pas quel jeton joue quel rôle, à
quelle taille, dans quel composant. DES-05 porte sur les *couples rendus*. Le
producteur a trouvé la seule affectation qui satisfait les deux littéralement.
C'est la bonne réponse, et elle est meilleure que son alternative : ajouter
`#6E6E73` **violerait DES-02**, en introduisant une 27ᵉ valeur absente de 3.8.

Si un jour un conflit réel forçait le choix, **DES-05 l'emporte** : un
hexadécimal exact est une préférence de marque, la lisibilité par un enfant de
six ans et demi est un plancher ; et 3.8 est amendable par l'Orchestrateur — le
bloc AMENDEMENTS existe pour ça — alors que WCAG ne l'est pas. Un amendement
tracé de 3.8 serait recevable ; une valeur ajoutée en silence ne l'est pas.

Le coût visuel est réel et je le confirme au rendu : dans le thème Apple, titre,
sous-titre et valeur de `ListRow` sont tous à 16,82:1, donc de la même encre. La
hiérarchie tient par 17 px / 600 contre 15 px / 400. C'est lisible et c'est
hiérarchisé. C'est moins « Apple ». C'est accessible.

### Point 2 — DS-2 est-elle acceptée ?

**Oui. Ce n'est pas un contournement.**

`#007AFF` sur `#FFFFFF` = **4,0170 → 4,01:1**, confirmé. Sous 4,5:1 en petit
texte, au-dessus de 3:1 en grand texte. WCAG 2.1 définit le grand texte comme
≥ 18 pt, ou ≥ 14 pt en gras, soit **≥ 18,66 px en graisse ≥ 700**. J'ai mesuré
au navigateur : **tous** les libellés de `Button` sortent en 20 px / 700, dans
les deux thèmes, sans exception. Le seuil applicable est donc bien 3:1, et le
couple passe. C'est la règle appliquée telle qu'elle est écrite, pas détournée —
et le fait que le producteur publie quand même le 4,01 en mesure de référence
est exactement la bonne conduite.

Une réserve à verser au dossier, pas une objection : la variante
`Button variante="texte"` du thème Apple roule à **3,32:1**, soit 0,32 au-dessus
du plancher, sur un libellé que l'enfant lit en fin de soirée (« Je ne sais
pas », « Passer »). La rattacher à `--tipi-texte-appui` comme DS-1 l'a fait pour
les sous-titres la porterait à 15,45:1 sans toucher à 3.8. À arbitrer avec
V4/V5.

### Point 3 — Qui écrit les cinq libellés de cosmétiques ?

**Les faire produire par `contenu-enfant` avant l'ouverture de V6.** La seconde
option — ne jamais nommer un cosmétique — ne tient pas telle que le composant
est écrit : d'après le constat 2, la silhouette ne montre **aucun** cosmétique,
donc un palier verrouillé sans nom ne communique strictement rien. Et parce que
`t()` lève sur une clé absente, les cinq `cleLibelle` pendantes sont une panne
d'écran en attente (constat 7). Cinq clés à écrire et à faire viser par
`gardien-charte`, c'est peu ; l'ARB-10 désigne déjà le producteur.

### Point 4 — Les seuils de pierres

Ma qualification est en section 3.

### Point 5 — Les joues de Pilou dans le thème Apple

**Les faire disparaître dans le thème Apple.** Je confirme l'observation du
producteur au rendu, et elle est plus marquée qu'il ne le dit : `#FF9500` pur
sur un corps qui vaut le fond de page donne deux **disques orange saturés** qui
sont l'élément le plus criard des deux panneaux, sur un thème dont la propre
phrase d'aide dit « Sobre, proche des réglages du téléphone »
(`reglages.theme.apple_aide`). Mesuré : 2,01:1 sur le corps.

Le coût du retrait est nul : les joues sont classées décoratives à juste titre
— `fill` sans contour, aucune information portée, `stroke="none"` — et les
retirer ne change rien à ce que l'écran dit ; c'est l'argument du producteur
lui-même en DS-4. Il suffit de faire pointer `--pilou-joue` vers `none` ou vers
`--palette-apple-teinte-bleu` dans le bloc `[data-theme="apple"]`, sans toucher
à un composant. Décision d'Orchestrateur, puisqu'elle touche l'identité.

### Point 6 — Le socle minimal doit-il rester ?

**Le conserver. V1 l'étend, ne le refait pas.** Deux raisons.

*Aucune dépendance non autorisée n'a été introduite.* Vérifié entrée par entrée
contre le tableau §15.1 de l'architecture :

| Entrée de `package.json` | Ligne de §15.1 qui l'autorise |
| --- | --- |
| `next`, `react`, `react-dom` | `next, react, react-dom` — TEC-01 |
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom` | `typescript, @types/*` — TEC-01, TEC-15 |
| `tailwindcss`, `postcss`, `autoprefixer` | `tailwindcss, postcss, autoprefixer` — TEC-01, DES-01/02 |
| `eslint`, `eslint-config-next` | `eslint, eslint-config-next, prettier` — TEC-14, TEC-15 |

Rien d'autre n'est installé. Prisma, Supabase, Zustand, TanStack Query, Zod,
Vitest, Playwright sont bien absents. Playwright a été invoqué par `pnpm dlx`
sans entrer dans `package.json` — procédure correcte, j'ai fait de même.

*Le débordement était nécessaire.* Le dépôt ne contenait aucun fichier de code.
Sans `package.json`, `tsconfig` ni `postcss.config`, aucune des trois commandes
exigées n'existe, et la règle absolue nº 2 — « aucune affirmation sans preuve »
— aurait rendu le livrable irrecevable. Le producteur ne pouvait pas s'en
passer, il a livré le strict minimum, il l'a dit franchement, et il a listé en
§1.2 ce que V1 doit ajouter sans rien préempter. C'est la bonne conduite.

Une raison de plus de conserver, et je l'ai vérifiée plutôt que de la croire :
les deux règles ESLint de `.eslintrc.json` **fonctionnent réellement** (sortie
en 6.6). Un `any` et un `console.log` sont rejetés, avec le message citant
TEC-15. Les refaire à partir de zéro en V1, c'est risquer de les perdre. Il
faut préserver ces deux règles, `strict` et `noUncheckedIndexedAccess`.

---

# 3. Les seuils de 15/30/45/60 pierres : ma qualification

**Ni une violation de ETH-05, ni une valeur de démonstration acceptable : un cas
à renvoyer au produit.**

*Pourquoi ce n'est pas une violation de ETH-05.* ETH-05 dit : « L'application
n'octroie **jamais elle-même une récompense réelle** : elle affiche une
progression, le parent décide et donne. » L'objet visé est la récompense du
monde réel, et le schéma le confirme : `reward_threshold` porte `gems_requis`,
`description` et `atteint_le` — une description saisie par le parent, et le
marketing précise même qu'elle n'est pas montrée à l'enfant. Un cosmétique de
Pilou n'est pas de cette nature : rien ne sort de l'application, le parent n'a
rien à donner, aucun achat n'existe (ETH-03). PRD-14 énumère d'ailleurs
**deux choses distinctes** : « cosmétiques de Pilou » **et** « progression vers
le palier suivant ». Le producteur n'a pas confondu les deux.

*Pourquoi l'existence même d'un seuil fixe est, elle, tracée.* Le livrable
marketing validé en G1, ligne 1210, décrit `coffre.cosmetiques.verrouille`
(« Il en faut {n} pour celui-là. ») comme portant « **le seuil fixe d'un
cosmétique. Constant** ». Le mécanisme est donc couvert. Ce n'est pas du hors
périmètre.

*Pourquoi les valeurs, elles, ne passent pas.* `0 / 15 / 30 / 45 / 60` ne
figurent dans aucune exigence, aucun arbitrage, aucun livrable amont — le
producteur le dit lui-même : « sans source ». Ce ne sont pas des valeurs de
démonstration : elles sont exportées depuis `src/config/mascot.config.ts`, dans
un objet `as const satisfies MascotConfig`, consommé par une fonction de
production, `cosmetiquesDebloques(solde)`, qui décide un déverrouillage. Rien
ne les distingue d'une décision produit livrée. Or, combinées à ARB-13 (une
soirée complète vaut toujours 3 pierres), elles fixent le rythme de récompense
d'un enfant de six ans et demi : 5 soirées pour le premier cosmétique,
**20 pour le dernier**. C'est un choix qui touche ETH-01 (aucune rareté
artificielle) et la charte de ton. La règle absolue nº 3 est explicite :
« Aucun agent ne code une idée non tracée, même bonne. »

*Ce que je demande.* Conserver la **structure** — le champ `pierresRequises`,
un seuil constant et unique par cosmétique, l'absence de tout reverrouillage
(ETH-04) — et retirer les **valeurs** du périmètre de P3 : soit versées dans
`BACKLOG-V2.md` avec la ligne de justification qu'exige la règle 6.7, soit
inscrites en clair comme provisoires et à fixer par le produit avant
l'ouverture de V6. Le bon endroit pour trancher est le même que pour les cinq
libellés (point 3 du §9) : une décision produit, prise une fois, avant V6.

*Remarque connexe.* `cosmetiquesDebloques()` est de la logique de
déverrouillage, pas du design. Elle vit dans un fichier de configuration de
mascotte que DES-09 réserve au « nom, couleurs, variantes cosmétiques ».
À réexaminer à l'ouverture de V6.

---

# 4. Jugement sur les deux instruments

**`scripts/verifier-contraste.mjs` — conception à moitié juste.**

Ce qu'il fait bien, et c'est réel : il **ne recopie effectivement aucun
hexadécimal**. J'ai lu les 231 lignes, il n'y en a pas un seul. Il lit
`themes.css`, découpe les blocs, résout les chaînes de `var()` thème par thème,
et tronque vers le bas. Modifier `themes.css` déplace la mesure. Sur cet axe le
producteur a raison contre la re-dérivation : un script qui redéclarerait les
couleurs serait une seconde copie de la même table, et deux copies d'une table
fausse sont d'accord entre elles. I1 (tout rôle Pilou résolvable côté Apple) et
I2 (tout rôle de couleur employé par au moins un couple) sont de vrais
invariants, et I2 a réellement attrapé deux défauts que le producteur publie.

**Ce qu'il ne fait pas, et c'est ce qui le met en défaut :** la moitié qui
compte, la **liste des couples**, est écrite à la main. Le script a bien coupé
le cordon avec les couleurs ; il ne l'a pas coupé avec **l'intention du
producteur sur ce que la page dessine**. Il ne vérifie donc pas les contrastes
du rendu : il vérifie l'arithmétique de 34 affirmations. Le constat 1 le
démontre par l'exemple — il imprime une ligne verte à 6,57:1 pour un trait
d'encre que la variante `lunettes` ne trace pas, et le constat 3 montre qu'un
couple réellement rendu manque à l'appel. C'est la re-dérivation déplacée d'un
cran, pas supprimée. **L'invariant qui manquait est disponible et facile** :
« toute couleur calculée par le navigateur pour un texte ou un tracé, contre
son fond effectif, est mesurée » — c'est ce que j'ai écrit en section 6.4, et
c'est ce qui a trouvé les deux [MAJEUR].

**Les trois hexadécimaux en commentaire : son choix ne masque rien, vérifié.**
Le producteur dit avoir réécrit les commentaires plutôt qu'élargi le filtre. J'ai
relu le contrôle 1 : c'est un `grep -rEn` nu, sans exclusion de commentaire.
Un hexadécimal remis en commentaire dans `src/` serait donc signalé. Le
raisonnement publié — « un filtre qui ignore les commentaires aurait laissé
passer une vraie couleur mise en commentaire puis décommentée » — est le bon, et
il est tenu par le code. Un reste : `#86868B` subsiste en commentaire ligne 93
de `themes.css`, fichier autorisé, et c'est lui la 32ᵉ ligne du compte publié.

**Le contrôle 9 et sa version ancienne : conduite exemplaire.** Le script
exécute et imprime **les deux règles** à chaque passage, l'ancienne avec ses
5 occurrences nommées. Un contrôleur peut juger le resserrage sans reconstituer
quoi que ce soit. C'est la règle 2 de « Corriger un instrument de mesure »
appliquée à la lettre, et les 5 occurrences sont bien de la prose et une pile
système exigée mot pour mot par DES-03. Resserrage légitime.

**Limites de `verifier-design-system.sh` à inscrire :**

- Le contrôle 7 est une **re-dérivation assumée** — les 26 valeurs y sont
  recopiées. C'est inévitable pour contrôler une spécification en prose, et
  c'est donc acceptable. Mais il ne vérifie que la **présence** : deux rôles
  intervertis (ligne et chevron, par exemple) laisseraient les 26 hexadécimaux
  présents et le contrôle vert. J'ai donc vérifié l'**affectation** moi-même,
  jeton par jeton (section 6.2) : elle est exacte.
- Le contrôle 4 ne cherche que `onClick`. Un `onPointerDown` ou un
  `role="button"` sur un `div` passerait. J'ai cherché les deux : il n'y en a
  pas (section 6.3).
- Le contrôle 5 constate qu'une classe est écrite dans un fichier ; il ne peut
  rien dire du pixel. C'est exactement ce que le producteur reconnaît en §8.3,
  et c'est ce que j'ai comblé en section 6.1.
- Le contrôle 6 ne repère qu'une chaîne commençant par une capitale et d'au
  moins 4 caractères ; un texte en minuscules passerait.

---

# 5. Chiffres annoncés contre chiffres réels

| # | Grandeur annoncée par le producteur | Annoncé | Mesuré par moi | Écart |
| --- | --- | --- | --- | --- |
| 1 | Code de sortie de `typecheck && lint && build` | 0 | **0** | — |
| 2 | Sortie ESLint | `✔ No ESLint warnings or errors` | identique | — |
| 3 | Compilation | `✓ Compiled successfully` | identique | — |
| 4 | Pages statiques générées | 4 / 4 | **4 / 4** | — |
| 5 | Routes construites | `/_not-found`, `/dev/design-system` | identiques, mêmes tailles | — |
| 6 | Couples de contraste mesurés par son script | 68 (34 × 2) | **68**, sortie **identique à l'octet près** | — |
| 7 | Couples sous leur seuil (son script) | 0 | **0** | — |
| 8 | Couples de texte **réellement rendus** | non mesuré | **42 distincts**, dont 1 absent de sa liste et 2 non mesurables par son modèle | **écart de portée** |
| 9 | Tracés SVG sous 3:1 au rendu | 0 implicite | **1** (lunettes, thème Pilou) | **écart** |
| 10 | `#86868B` sur surface | 3,62:1 | **3,6229 → 3,62:1** | — |
| 11 | `#007AFF` sur surface | 4,01:1 | **4,0170 → 4,01:1** | — |
| 12 | `#8E8E93` sur surface | 3,26:1 | **3,26:1** | — |
| 13 | `#C7C7CC` sur surface | 1,68:1 | **1,68:1** | — |
| 14 | « aucun gris Apple n'atteint 4,5:1 » | vrai | **vrai** (3,62 / 3,26 / 1,68) | — |
| 15 | `#6E6E73` sur blanc | **5,15:1** | **5,07:1** | **écart** |
| 16 | Jetons de 3.8 déclarés | 26, 0 manquant | **26 / 26**, valeurs exactes, rôles exacts | — |
| 17 | Palette Pilou / Apple | 15 / 12 valeurs | **15 / 12** | — |
| 18 | Lignes colorées dans `themes.css` | 32 | **32** (27 palette + 4 `rgba` + 1 commentaire) | — |
| 19 | Couleurs en dur hors `themes.css` | 0 | **0** dans `src/` et `tailwind.config.ts` ; **26** dans `scripts/verifier-design-system.sh` | **écart de portée** |
| 20 | I1 — rôles déclarés / non résolus | 27 / 0 | **27 / 0** (dont 2 piles de polices, pas des couleurs) | — |
| 21 | I2 — rôles de couleur / jamais mesurés | 25 / 0 | **25 / 0** (ne couvre pas les 27 entrées de palette) | — |
| 22 | Cibles tactiles ≥ 56 px | non mesuré au navigateur | **46 contrôles mesurés, 0 sous 56 px**, à 390 px et à 1500 px | — |
| 23 | `aria-label` dans le HTML rendu | 7 | **7** | — |
| 24 | `<button>` / `<a>` rendus | 42 / 4 | **42 / 4** | — |
| 25 | `<svg>` rendus | 81 | **81** (77 `aria-hidden`, 4 `role="img"`+label, **0 sans l'un ou l'autre**) | — |
| 26 | `div`/`span` cliquables | 0 | **0** (source et rendu, tous gestionnaires) | — |
| 27 | Emoji | 0 | **0** (source et HTML rendu) | — |
| 28 | Fonctions de dégradé dans le CSS construit | 0 | **0** ; le mot « gradient » apparaît 6 fois (3 noms × 2), pas 3 | écart négligeable |
| 29 | Panneaux `data-theme` | `['pilou','pilou','apple']` | **identique** | — |
| 30 | Contrôles sans nom accessible | non mesuré | **0** sur 46 | — |
| 31 | Icônes du jeu | 13 | **13** | — |
| 32 | Fichiers dessinant Pilou | 1 | **1** (`Pilou.tsx`, un seul `<svg>`) | — |
| 33 | Paquets installés | « les dix paquets » | **13 entrées** (3 + 10), **toutes autorisées par §15.1** | écart de comptage |
| 34 | Commits git | 0 | **1** (`dad1524`, par l'Orchestrateur, après coup) | hors responsabilité du producteur |

Sur 34 grandeurs recontrôlées : **29 exactes, 5 en écart**, dont deux écarts de
portée (nº 8, nº 19), un écart de calcul (nº 15), un écart de comptage (nº 33),
et un constat de fond (nº 9). Aucune sortie de commande inventée : la sortie de
`verifier-contraste.mjs` publiée en 7.3 est reproduite **à l'octet près**.

---

# 6. Sorties réelles de mes commandes

## 6.1 `rm -rf .next && pnpm typecheck && pnpm lint && pnpm build`

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

EXIT_CHAIN=0
```

**Reproduit à l'identique**, tailles de route comprises.

## 6.2 Conformité de `themes.css` à la section 3.8

```
=== hex distincts trouvés dans themes.css ===
#007aff #1d1d1f #2e2a26 #34c759 #6b6459 #6fb8e8 #86868B #86868b #8a8074 #8e8e93
#8fe3c0 #c7c7cc #d8ccb8 #e5e5ea #e8f4fc #e9f9f0 #eaf3ff #ede6d8 #f5f5f7 #ff3b30
#ff8b7b #ff9500 #ffd166 #ffefe0 #fff3d6 #fff8ee #ffffff

=== les 26 valeurs de 3.8, cherchées une par une ===
(fin — rien au-dessus = 26/26 présents)

=== comptes ===
lignes contenant une couleur : 32
hex distincts : 27   (le 27e est #86868B, en commentaire ligne 93)
occurrences rgba() : 6   (les deux ombres portées de chaque thème)
```

Affectation des rôles relue jeton par jeton dans `themes.css` : les 15 valeurs
Pilou et les 12 valeurs Apple de 3.8 sont chacune sur le bon rôle
(fond, surface, encre, texte secondaire, texte discret, ligne, pointillé,
chevron, quatre accents Pilou, cinq accents Apple, quatre teintes Pilou, teinte
Apple). **Aucune substitution, aucune approximation.** Les six `rgba()` sont
l'encre de chaque thème à 4-9 % d'opacité, employée pour l'ombre portée douce
que 3.8 demande sans en fixer la valeur.

```
=== couleurs en dur, dépôt entier (hors docs/, prompt, lock) ===
.cursor/rules/20-themes.mdc        : 27   (règle de projet, pas du code)
scripts/verifier-design-system.sh  :  5   (les 26 valeurs, lignes 68-70, sans '#')
src/styles/themes.css              : 32
```

Aucune autre. **Zéro couleur en dur dans un composant.**

## 6.3 Sémantique

```
=== fichiers contenant un <svg>/<path>/<circle> ===
src/components/ui/Icon.tsx
src/components/pilou/Pilou.tsx

=== viewBox déclarés ===
src/components/ui/Icon.tsx:125:      viewBox="0 0 24 24"
src/components/pilou/Pilou.tsx:107:      viewBox="0 0 160 160"

=== div/span portant un onClick/onPointerDown/onMouseDown/onKeyDown/onTouchStart ===
(fin)   -> 0

=== role="button" sur un non-bouton ===
(fin)   -> 0
```

**DES-09 vérifié : un seul fichier dessine Pilou, un seul `<svg>`, piloté par
`src/config/mascot.config.ts`. Aucun second tracé ailleurs.**

Arbre d'accessibilité réel, relevé par Playwright à 390 px :

```
1× radio : "Pilou Coloré, arrondi, chaleureux."
1× radio : "Apple Sobre, proche des réglages du téléphone."
2× button : "On commence"      2× button : "Réécouter"
2× button : "Je ne sais pas"   2× button : "Pause"
2× button : "Je commence"      2× button : "Parler"
2× button : "Continuer"        2× button : "Paliers de récompense"
2× link   : "Apparence Coloré, arrondi, chaleureux. Pilou"
2× link   : "Sons"
2× button : "1" … "9", "0"     2× button : "Effacer"
2× button : "Valider"

boutons/liens sans nom : 0
svg sans aria-hidden ni role="img"+aria-label : 0
```

Les deux boutons sans libellé visible (« Pause », « Effacer ») tirent bien leur
nom de l'icône `role="img"` + `aria-label`, comme `Button.tsx` l'annonce. **Toute
icône seule porte une étiquette.**

## 6.4 Contraste mesuré sur le rendu — implémentation WCAG indépendante

Méthode : Chromium 1.56.1, styles **calculés** de chaque élément, fond effectif
obtenu en remontant les ancêtres jusqu'au premier fond non transparent,
composition alpha appliquée, luminance relative WCAG 2.1 recodée par moi,
troncature à deux décimales. Aucun script du producteur n'est lu.

```
| # | thème | texte | px | poids | seuil | avant-plan | fond | ratio | verdict |
| 1 | pilou | Pilou | 36 | 700 | 3:1 | rgb(46,42,38) | rgb(255,248,238) | 13.49:1 | OK |
| 2 | pilou | Apparence | 17 | 600 | 4.5:1 | rgb(46,42,38) | rgb(255,255,255) | 14.23:1 | OK |
| 3 | pilou | Pilou | 17 | 600 | 4.5:1 | rgb(46,42,38) | rgb(232,244,252) | 12.72:1 | OK |
| 4 | pilou | Coloré, arrondi, chaleureux. | 15 | 400 | 4.5:1 | rgb(107,100,89) | rgb(232,244,252) | 5.22:1 | OK |
| 5 | pilou | Sobre, proche des réglages… | 15 | 400 | 4.5:1 | rgb(107,100,89) | rgb(255,255,255) | 5.84:1 | OK |
| 6 | pilou | pilou | 28 | 700 | 3:1 | rgb(46,42,38) | rgb(255,248,238) | 13.49:1 | OK |
| 7 | pilou | Button | 17 | 400 | 4.5:1 | rgb(107,100,89) | rgb(255,248,238) | 5.54:1 | OK |
| 8 | pilou | On commence | 20 | 700 | 3:1 | rgb(46,42,38) | rgb(111,184,232) | 6.57:1 | OK |
| 9 | pilou | Réécouter | 20 | 700 | 3:1 | rgb(46,42,38) | rgb(232,244,252) | 12.72:1 | OK |
| 10 | pilou | Je ne sais pas | 20 | 700 | 3:1 | rgb(107,100,89) | rgb(255,248,238) | 5.54:1 | OK |
| 11 | pilou | Je commence (désactivé) | 20 | 700 | 3:1 | rgb(46,42,38) @op0.6 | rgb(111,184,232) | 2.93:1 | *** SOUS SEUIL *** |
| 12 | pilou | Les maths | 17 | 600 | 4.5:1 | rgb(46,42,38) | rgb(255,239,224) | 12.65:1 | OK |
| 13 | pilou | D'abord la lecture… | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(233,249,240) | 13.06:1 | OK |
| 14 | pilou | La lecture | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(232,244,252) | 12.72:1 | OK |
| 15 | pilou | Les maths | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(255,239,224) | 12.65:1 | OK |
| 16 | pilou | Tes pierres | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(255,243,214) | 12.90:1 | OK |
| 17 | pilou | Apparence | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(255,255,255) | 14.23:1 | OK |
| 18 | pilou | 1 (Keypad) | 28 | 700 | 3:1 | rgb(46,42,38) | rgb(255,255,255) | 14.23:1 | OK |
| 19 | pilou | Tes pierres | 17 | 400 | 4.5:1 | rgb(46,42,38) | rgb(255,209,102) | 9.87:1 | OK |
| 20 | pilou | 12 | 24 | 700 | 3:1 | rgb(46,42,38) | rgb(255,209,102) | 9.87:1 | OK |
| 21 | pilou | 147 | 28 | 700 | 3:1 | rgb(46,42,38) | rgb(255,209,102) | 9.87:1 | OK |
| 22 | pilou | Habiller Pilou | 17 | 600 | 4.5:1 | rgb(46,42,38) | rgb(255,248,238) | 13.49:1 | OK |
| 23 | pilou | aucun | 15 | 400 | 4.5:1 | rgb(107,100,89) | rgb(255,248,238) | 5.54:1 | OK |
| 24 | pilou | Je regarde tes devoirs… | 16 | 400 | 4.5:1 | rgb(46,42,38) | rgb(255,248,238) | 13.49:1 | OK |
| 25 | apple | apple | 28 | 700 | 3:1 | rgb(29,29,31) | rgb(245,245,247) | 15.45:1 | OK |
| 26 | apple | Button | 17 | 400 | 4.5:1 | rgb(29,29,31) | rgb(245,245,247) | 15.45:1 | OK |
| 27 | apple | On commence | 20 | 700 | 3:1 | rgb(255,255,255) | rgb(0,122,255) | 4.01:1 | OK |
| 28 | apple | Réécouter | 20 | 700 | 3:1 | rgb(29,29,31) | rgb(234,243,255) | 15.03:1 | OK |
| 29 | apple | Je ne sais pas | 20 | 700 | 3:1 | rgb(134,134,139) | rgb(245,245,247) | 3.32:1 | OK |
| 30 | apple | Je commence (désactivé) | 20 | 700 | 3:1 | rgb(255,255,255) @op0.6 | rgb(0,122,255) | 2.33:1 | *** SOUS SEUIL *** |
| 31 | apple | Ton coffre à trésors | 17 | 600 | 4.5:1 | rgb(29,29,31) | rgb(255,255,255) | 16.82:1 | OK |
| 32 | apple | Tes pierres restent là… | 15 | 400 | 4.5:1 | rgb(29,29,31) | rgb(255,255,255) | 16.82:1 | OK |
| 33 | apple | La lecture | 17 | 600 | 4.5:1 | rgb(29,29,31) | rgb(234,243,255) | 15.03:1 | OK |
| 34 | apple | D'abord la lecture… | 17 | 400 | 4.5:1 | rgb(29,29,31) | rgb(234,243,255) | 15.03:1 | OK |
| 35 | apple | Apparence | 17 | 400 | 4.5:1 | rgb(29,29,31) | rgb(255,255,255) | 16.82:1 | OK |
| 36 | apple | 1 (Keypad) | 28 | 700 | 3:1 | rgb(29,29,31) | rgb(255,255,255) | 16.82:1 | OK |
| 37 | apple | Tes pierres | 17 | 400 | 4.5:1 | rgb(29,29,31) | rgb(255,149,0) | 7.65:1 | OK |
| 38 | apple | 12 | 24 | 700 | 3:1 | rgb(29,29,31) | rgb(255,149,0) | 7.65:1 | OK |
| 39 | apple | 147 | 28 | 700 | 3:1 | rgb(29,29,31) | rgb(255,149,0) | 7.65:1 | OK |
| 40 | apple | Habiller Pilou | 17 | 600 | 4.5:1 | rgb(29,29,31) | rgb(245,245,247) | 15.45:1 | OK |
| 41 | apple | aucun | 15 | 400 | 4.5:1 | rgb(29,29,31) | rgb(245,245,247) | 15.45:1 | OK |
| 42 | apple | Je regarde tes devoirs… | 16 | 400 | 4.5:1 | rgb(29,29,31) | rgb(245,245,247) | 15.45:1 | OK |

Couples texte distincts mesurés sur le rendu : 42. Sous seuil : 2
(les deux boutons désactivés — exemptés par WCAG 1.4.3, voir constat 4).
```

Tracés SVG, extrait des lignes qui décident (tableau complet obtenu de la même
façon, couleur calculée du tracé contre son fond effectif) :

```
| thème | svg   | élément            | stroke            | fill              | fond              | r(stroke) | r(fill) |
| pilou | Pilou | g lunettes + 2 circle + path | rgb(111,184,232) | none        | rgb(255,248,238) |   2.05    |   —     |  <-- ÉCHEC 3:1
| apple | Pilou | g lunettes + 2 circle + path | rgb(0,122,255)   | none        | rgb(245,245,247) |   3.68    |   —     |
| pilou | Pilou | echarpe (path ×5)  | rgb(46,42,38)     | rgb(111,184,232)  | rgb(255,248,238) |  13.49    |  2.05   |
| pilou | Pilou | bonnet (bandeau)   | rgb(46,42,38)     | rgb(143,227,192)  | rgb(255,248,238) |  13.49    |  1.43   |
| pilou | Pilou | silhouette (tout)  | rgb(138,128,116)  | rgb(138,128,116)  | rgb(255,248,238) |   3.67    |  3.67   |
| apple | Pilou | silhouette (tout)  | rgb(134,134,139)  | rgb(134,134,139)  | rgb(245,245,247) |   3.32    |  3.32   |
| pilou | Pilou | joues              | none              | rgb(255,139,123)  | rgb(255,248,238) |    —      |  2.15   |
| apple | Pilou | joues              | none              | rgb(255,149,0)    | rgb(245,245,247) |    —      |  2.01   |
| apple | Pilou | corps              | rgb(29,29,31)     | rgb(245,245,247)  | rgb(245,245,247) |  15.45    |  1.00   |
| pilou | Icon  | chevron            | rgb(216,204,184)  | none              | rgb(255,255,255) |   1.58    |   —     |
| apple | Icon  | chevron            | rgb(199,199,204)  | none              | rgb(255,255,255) |   1.68    |   —     |
```

`echarpe` et `bonnet` : le remplissage est faible (2,05 / 1,43) **mais le tracé
d'encre à 13,49:1 cerne la forme**, exactement comme le rapport l'affirme. C'est
vrai pour ces deux-là, et pour `noeud`. Ce n'est pas vrai pour `lunettes`
(constat 1).

Les chevrons à 1,58:1 / 1,68:1 sont classés décoratifs par le producteur. Je
l'accepte : ils sont `aria-hidden`, et l'affordance qu'ils signalent est déjà
portée par le fait que la ligne entière est un `<button>` ou un `<a>` doté d'un
nom accessible. Rien ne repose sur eux seuls.

Les joues à 2,15:1 / 2,01:1, classées décoratives : accepté également — aucun
contour, aucune information, `stroke="none"`.

Recalculs à la main des deux conflits tranchés :

```
=== DS-1 : le gris secondaire d'Apple ===
#86868B sur #FFFFFF : 3.6229 -> tronqué 3.62:1
#86868B sur #F5F5F7 : 3.3273 -> tronqué 3.32:1
=== les autres gris de la palette Apple ===
#8E8E93 sur #FFFFFF : 3.2605 -> tronqué 3.26:1
#8E8E93 sur #F5F5F7 : 2.9945 -> tronqué 2.99:1
#C7C7CC sur #FFFFFF : 1.6841 -> tronqué 1.68:1
#1D1D1F sur #FFFFFF : 16.8300 -> tronqué 16.82:1
=== DS-2 : le bleu d'Apple ===
#007AFF sur #FFFFFF : 4.0170 -> tronqué 4.01:1
#007AFF sur #F5F5F7 : 3.6892 -> tronqué 3.68:1
=== alternative proposée en §9 ===
#6E6E73 sur #FFFFFF : 5.0713 -> tronqué 5.07:1   (le rapport annonce 5,15:1)
#6E6E73 sur #F5F5F7 : 4.6575 -> tronqué 4.65:1
=== lunettes : #6FB8E8 sans trait d'encre ===
#6FB8E8 sur #FFF8EE : 2.0535 -> tronqué 2.05:1
#6FB8E8 sur #FFEFE0 : 1.9258 -> tronqué 1.92:1
```

## 6.5 Cibles tactiles mesurées au navigateur (ce que le producteur n'a pas pu faire)

`getBoundingClientRect()` sur tout `button`, `a` et `[role="radio"]`, aux deux
largeurs :

```
--- téléphone 390 px ---
cibles < 56 px : 0
contrôles sans nom accessible : 0
svg sans aria-hidden ni role=img+label : 0
débordement horizontal (px) : 0

--- bureau 1500 px ---
cibles < 56 px : 0
contrôles sans nom accessible : 0
svg sans aria-hidden ni role=img+label : 0
débordement horizontal (px) : 0

Éléments interactifs mesurés : 46 (23 par thème).
Extrait des hauteurs relevées :
  ThemeSwitch (radio)      408 × 70     Button primaire       188 × 56
  Button icône seule        56 × 56     Button pleine largeur 552 × 56
  ListRow lien             552 × 68     ListRow bouton        552 × 60
  Keypad, chaque touche   98.7 × 72     Button Valider        552 × 56
```

**DES-04 est vérifiée sur le rendu, pas seulement sur la déclaration : aucune
cible sous 56 px, ni en largeur ni en hauteur, dans aucun des deux thèmes, à
390 px comme à 1500 px, et sans débordement horizontal.** C'est la limite que le
producteur signalait honnêtement en §8.3 ; elle est levée.

## 6.6 Les deux thèmes, les animations, les règles ESLint

```
prefers-reduced-motion: no-preference -> {"apparait 0.26s ×1":4,"respire 4s ×infinite":4,"pense-1 1.8s ×infinite":6}
prefers-reduced-motion: reduce        -> {"apparait 0.001s ×1":4,"respire 0.001s ×1":4,"pense-1 0.001s ×1":6}

html[data-theme] initial : pilou
après clic « Apple »     : apple
fond body : rgb(255, 248, 238) -> rgb(245, 245, 247)
aria-checked des deux options : ["false","true"]

div/span porteurs d'un onclick : 0
emoji dans un texte rendu : 0
emoji dans tout le HTML : false
dégradés dans les styles calculés : 0
aria : {"ariaLabels":7,"buttons":42,"links":4,"svg":81,"svgRoleImg":4,"svgAriaHidden":77,"svgNi":0}
panneaux data-theme : {"panneaux":["pilou","pilou","apple"],"html":"pilou"}
```

Aucune animation ne fait varier l'opacité, aucune ne se répète en clignotant :
`apparait` est un fondu entrant joué une fois, `respire` une échelle 1 → 1,035
sur 4 s, `pense-1` une translation de 3 px. `prefers-reduced-motion` les réduit
toutes à 1 ms et une itération. **DES-08 tenue.**

La commutation change l'attribut sur `<html>` et le navigateur ré-résout les
variables : **aucun composant n'est cassé dans l'un des deux thèmes**, vérifié
panneau par panneau au rendu et sur les 42 couples de texte.

CSS construit :

```
--tipi-cible-min:56px          présent
--pilou-trait:2.5 / 1.5        les deux présents
--tipi-rayon-liste:18px / 14px les deux présents
--tipi-rayon-badge:14px / 8px  les deux présents
min-height:var(--tipi-cible-min) présent
prefers-reduced-motion         présent
fonctions (linear|radial|conic)-gradient( : 0
mot « gradient » : 6 occurrences, toutes des propriétés vides du reset Tailwind
```

Les deux règles ESLint de TEC-15, sondées par `eslint --stdin` (l'arbre de
travail est resté propre, `git status` vide après) :

```
/home/user/Tipi/src/__sonde.ts
  1:22  error  TEC-15 : aucun `any` dans le code livré  no-restricted-syntax
  1:28  error  TEC-15 : aucun `any` dans le code livré  no-restricted-syntax
  2:1   error  Unexpected console statement             no-console

✖ 3 problems (3 errors, 0 warnings)
EXIT=1
```

Elles mordent réellement. Ce n'est pas une règle décorative.

## 6.7 Les deux instruments du producteur, rejoués

`bash scripts/verifier-design-system.sh` → `=== VERDICT DE L INSTRUMENT : OK ===`,
code de sortie **0**. Les neuf blocs reproduisent la sortie publiée en 7.2.

`node scripts/verifier-contraste.mjs` → code de sortie **0** :

```
Couples mesurés : 68 (34 par thème, 2 thèmes).
Couples sous leur seuil : 0.
I1 — rôles déclarés côté Pilou : 27 ; non résolus côté Apple : 0
I2 — rôles de couleur : 25 ; jamais mesurés : 0

=== VERDICT DE L INSTRUMENT : OK ===
```

```
$ diff <(sed -n '516,605p' docs/agents/P3/design-system.out.md) <(node scripts/verifier-contraste.mjs)
IDENTIQUE — la sortie publiée est reproduite à l'octet près
```

**Aucune sortie de commande n'est inventée dans ce livrable.** Je le dis
explicitement, parce que la règle de preuve de travail demande au contrôleur de
se prononcer sur ce point.

---

# 7. Ce que je n'ai pas pu contrôler

1. **Aucun appareil tactile réel, aucun lecteur d'écran.** J'ai mesuré les
   cibles et lu l'arbre d'accessibilité de Chromium ; je n'ai rien *entendu*.
   Les rôles `radiogroup`/`radio`, `status`/`aria-live` et `role="img"` sont
   conformes aux spécifications et correctement nommés, mais leur restitution
   par VoiceOver ou TalkBack reste à vérifier en P6.
2. **Un seul écran contrôlé.** `/dev/design-system` est la seule page qui
   existe. DES-04 et DES-06 s'énoncent « dans tous les écrans enfant » ; ces
   écrans n'existent pas encore. Mes mesures prouvent que les composants
   tiennent 56 px, pas qu'un écran futur les emploiera bien. À revérifier à
   chaque verticale.
3. **Un seul moteur de rendu** (Chromium 1.56.1) et une seule densité de pixels.
4. **Les polices Baloo 2 et Quicksand** sont servies depuis le domaine de
   l'application ; je n'ai pas vérifié le comportement du repli réseau coupé.

---

# 8. Conclusion

`VERDICT: FAIL`, sur **2 [MAJEUR]** et **10 [MINEUR]**. Un seul [MAJEUR] suffit
à fermer la porte ; il y en a deux, et ils sont précis, localisés et corrigibles
en peu de lignes.

Ce n'est pas un livrable faible — c'est un livrable rigoureux qui a un point
aveugle, et le point aveugle est au même endroit dans les deux [MAJEUR] : le
contrôle porte sur ce que le producteur **déclare** dessiner, jamais sur ce que
la page **dessine**. Le producteur a lui-même écrit la bonne phrase en §8.3
(« le contrôleur devrait le faire, c'est la seule mesure qui prouve DES-04 sur
le rendu et non sur la déclaration ») ; elle vaut aussi pour DES-05, et c'est
en l'appliquant que les deux défauts sont sortis.

Ce que je retiens au crédit du livrable, et qui doit survivre au tour suivant :
les 26 jetons de 3.8 exacts et correctement affectés, zéro couleur en dur dans
un composant, zéro `div` cliquable, zéro icône sans étiquette, zéro emoji, zéro
dégradé, 56 px tenus au pixel près, les deux thèmes qui commutent sans casser un
composant, la publication des deux versions du contrôle 9, la publication des
mesures de référence gênantes, et la franchise du §8 — c'est cette franchise qui
m'a orienté vers les mesures qui ont trouvé le reste.

Réserves [MINEUR] à verser dans `BACKLOG-V2.md` si l'Orchestrateur ouvre la
porte au tour suivant : 5, 6, 9 (pompon, engrenage), 10, 11, 12. Les mineurs 3,
4, 7 et 8 devraient être traités avant G3, parce qu'ils touchent respectivement
l'exhaustivité de l'instrument, la franchise du rapport, une panne d'écran en
attente pour V6, et une décision produit non tracée.
