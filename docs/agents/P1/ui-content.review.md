VERDICT: FAIL

# Contrôle de `ui-enfant.json`, `ui-parent.json` et du retrait ARB-12

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Objets contrôlés : `content/ui-enfant.json` (`tipi.ui-enfant.v1`, 1.0.0),
`content/ui-parent.json` (`tipi.ui-parent.v1`, 1.0.0),
`docs/agents/P1/ui-content.out.md`, et le retrait des six clés mortes dans
`content/encouragements.json` et `docs/agents/P1/produit-marketing.out.md`.

Références : `docs/agents/GATES.md` (ARB-01 à ARB-13),
`docs/agents/P1/produit-marketing.out.md`, `TIPI-PROMPT-CURSOR.md` §1 à §3,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

## Position

**Tous les chiffres annoncés sont exacts, et l'affirmation la plus forte du
rapport tient.** J'ai recomparé les 288 textes à la source, caractère pour
caractère : **0 divergence**. Les 333 clés du marketing ont chacune un fichier
propriétaire, il n'y a **aucune orpheline dans les deux sens** et **aucun
doublon de propriété** sur les quatre fichiers de `content/`. Les 9 clés créées
sont verbatim, y compris `parent.resume.observation.arret_avant_fin` dont la
consigne était explicite. Les six clés mortes ont disparu partout. Aucun des 767
textes n'énonce de barème, et je l'ai contre-testé avec des motifs que son
détecteur n'emploie pas.

**Le FAIL tient à un seul constat**, mais il touche le seul champ du fichier qui
porte une information d'aiguillage : `condition` est `null` sur **85 entrées qui
ne sont manifestement pas le cas nominal de leur écran**, en contradiction avec
la règle que le fichier publie lui-même — et rempli sur exactement les 9 clés que
le producteur a écrites de sa main. Deux textes mutuellement exclusifs du même
écran sont tous deux déclarés nominaux.

Quatre [MINEUR] s'y ajoutent, dont trois accords de genre du même type que celui
qu'il signale, et qu'il n'a pas vus.

---

# CONSTATS

## [MAJEUR] 1 — `condition` est `null` sur 85 entrées qui ne sont pas le cas nominal, contre la règle que le fichier publie

Les deux fichiers déclarent, dans `regles.condition`, mot pour mot :

> « `null` quand le texte s'affiche dans **le cas nominal de son écran**. Sinon,
> **la condition d'affichage en clair**. »

Mesure indépendante sur les 288 entrées :

```
entrees avec une condition NON nulle : 9 / 288
   -> ce sont exactement les 9 cles que le producteur a creees lui-meme
entrees a l'evidence CONDITIONNELLES mais condition = null : 85
   -> ui-enfant : 34      ui-parent : 51
```

Les 279 entrées extraites du marketing portent **toutes** `condition: null`, y
compris les états vides, les états d'erreur, les modes dégradés et les variantes
mutuellement exclusives. Échantillon, tiré des 85 :

```
[enfant] enfant.accueil.vide.bouton        etat vide           condition: null
[enfant] enfant.programme.souci.titre      etat d'erreur       condition: null
[enfant] lecture.micro_absent.corps        micro indisponible  condition: null
[enfant] lecture.sans_voix.corps           TTS indisponible    condition: null
[enfant] lecture.pas_entendu.corps         STT sans resultat   condition: null
[enfant] lecture.breton.intro              mode degrade PED-13 condition: null
[enfant] lecture.reprise.corps             reprise PRD-18      condition: null
[enfant] maths.sans_indice.corps           secours TEC-07      condition: null
[enfant] coffre.souci.corps                etat d'erreur       condition: null
[parent] parent.apercu.echec.titre         etat d'erreur       condition: null
[parent] parent.apercu.lancement_echec.*   etat d'erreur       condition: null
[parent] parent.apercu.basse_energie.actif Soir leger actif    condition: null
[parent] parent.apercu.regroupe            regroupement        condition: null
[parent] parent.apercu.reporte             report              condition: null
[parent] notif.resume.sans_devoir.titre    soiree sans devoir  condition: null
```

**Le cas qui rend le défaut indiscutable.** Sur `/parent/programme`, deux entrées
décrivent la même ligne d'écran et s'excluent :

```
parent.apercu.resume      « 2 étapes ce soir : lecture, maths. Environ 12 minutes. »   condition: null
parent.apercu.resume_une  « 1 étape ce soir : lecture. Environ 6 minutes. »            condition: null
```

Les deux sont déclarées « cas nominal de leur écran ». Elles ne peuvent pas
l'être toutes les deux. Et contrairement aux états limites, **aucune convention
de nommage ne les distingue** : ni `.vide`, ni `.souci`, ni `.echec`. Un
développeur qui câble cet écran en suivant le contrat publié affiche les deux
lignes, ou en choisit une au hasard.

**L'objection du producteur ne couvre pas ce défaut.** Sa section 2 écrit :

> « **Aucun champ dérivé pour l'état.** Les états limites se lisent dans la clé
> elle-même (`*.vide.*`, `*.souci.*`, `*.illisible.*`), qui est la convention du
> marketing. Ajouter un champ `etat` calculé par heuristique aurait créé une
> seconde source de vérité. »

Je suis d'accord avec ce raisonnement, et il est bon : ne pas deviner vaut mieux
que deviner. Mais il répond à une autre question. Il justifie de **ne pas ajouter
un champ `etat`** ; il ne justifie pas de **laisser `condition` à `null` tout en
publiant que `null` signifie « cas nominal »**. Le champ existe, sa sémantique
est écrite, et 85 entrées la démentent. Le fichier dit quelque chose de faux sur
lui-même.

**L'information n'a pas manqué, elle a été perdue à l'extraction.** Le marketing
la porte explicitement, en intertitres au-dessus de chaque table :

```
823: **État vide** : sans objet, et sans texte. [...]
829: **État d'erreur — micro refusé ou indisponible** :
839: **État d'erreur — voix de Pilou indisponible** : [...]
1024: **État d'erreur — indices indisponibles** (secours de TEC-07 en échec) :
1316: **État vide — aucune photo ajoutée** :
1420: **État vide — rien d'exploitable dans les photos** :
```

L'extraction a repris la colonne « Texte » et abandonné l'intertitre, c'est-à-dire
exactement ce que `condition` est fait pour porter. Le producteur sait d'ailleurs
remplir le champ : ses 9 clés créées portent des conditions précises et
opposables (« blocage détecté selon PED-08 », « au moins un indice a été
demandé »). La compétence est là ; elle n'a pas été appliquée aux 279 autres.

**Pourquoi [MAJEUR] et non [MINEUR].** C'est le même défaut de classe que le
[MAJEUR] 3 du tour 1 de la banque, où rien ne disait quelle clé une variante
remplissait : un livrable qui ne peut pas être câblé sans une décision que le
producteur n'a pas prise. Ici le livrable peut être câblé, mais seulement en
**ignorant** ce qu'il publie, et il produit un écran faux si on le suit.
`content/` est la source que liront le design system (P3) et les neuf
verticales ; un contrat inexact à cet endroit se propage en code.

**Correction attendue** — deux voies, et il faut en choisir une explicitement :

- **(a) Renseigner `condition`** sur les 85 entrées, en reprenant l'intertitre du
  marketing. C'est mécanique pour la grande majorité : `*.vide.*` →
  « aucun contenu à afficher », `*.souci.*` / `*.echec.*` → l'état d'erreur nommé
  par l'intertitre, `lecture.breton.*` → « l'exercice est en breton (PED-13) »,
  `*.reprise.*` → « la session reprend après interruption (PRD-18) ».
- **(b) Changer la règle** pour dire la vérité : « `condition` n'est renseignée
  que lorsque la clé ne porte pas elle-même son état. La convention de nommage
  du marketing (`*.vide.*`, `*.souci.*`, `*.echec.*`, `*.sans_*`,
  `*.micro_absent.*`, `*.reprise.*`, `*.breton.*`) fait foi pour les autres. »

**Dans les deux cas**, `parent.apercu.resume` et `parent.apercu.resume_une`
doivent recevoir une condition explicite (« deux étapes programmées » / « une
seule étape programmée »), car aucune convention de nommage ne les sépare. Même
remarque pour `enfant.programme.corps.lecture_maths` et `.maths_lecture`.

---

## [MINEUR] 2 — Trois accords de genre du même type que celui qu'il signale, et qu'il n'a pas vus

Sa réserve n°1 est juste et bien posée : `parent.resume.observation.pause` dit
« {prenom} a fait une pause. **Il est revenu** ensuite. », accord masculin hérité
du marketing, faux avec une deuxième enfant (PRD-02, ARB-01).

Mais il n'en signale qu'un. J'ai passé les 187 textes parent au crible des
participes et adjectifs à genre variable, en distinguant ceux qui s'accordent sur
`{prenom}` de ceux qui s'accordent sur un nom du texte. **Quatre entrées sont
concernées, pas une** :

```
parent.resume.observation.pause
   « {prenom} a fait une pause. Il est revenu ensuite. »          -> signalee par lui
parent.resume.observation.maths_sans_indice
   « {prenom} a fait les maths seul, sans demander d'indice. »    -> NON SIGNALEE
parent.resume.observation.breton
   « Le texte en breton a été lu par {prenom} seul. [...] »       -> NON SIGNALEE
parent.resume.observation.maths_indices
   « {prenom} a demandé de l'aide sur les maths. Pilou l'a guidé
     sans donner les réponses. »                                   -> NON SIGNALEE
```

Dans la dernière, l'accord porte sur le participe passé avec le complément
d'objet direct antéposé (`l'` = l'enfant) : avec une fille, « Pilou l'a
**guidée** ». Les trois autres occurrences de mon scan (`une seule étape`,
`saisie bloquée`, `le résumé n'est pas encore prêt`) s'accordent sur un nom du
texte et sont correctes.

Aucune conséquence en V1, où l'enfant est un garçon, et les quatre textes sont
des extractions fidèles : la responsabilité est chez `produit-marketing`. Mais la
correction parallèle que l'Orchestrateur a lancée ne portera que sur une entrée
sur quatre si le périmètre n'est pas élargi maintenant.

**Correction attendue**, à transmettre à `produit-marketing` avec les quatre
clés :
- `pause` → « {prenom} a fait une pause, puis a repris. » (sa propre suggestion,
  que j'approuve) ;
- `maths_sans_indice` → « {prenom} a fait les maths sans demander d'indice. » ;
- `breton` → « Le texte en breton a été lu par {prenom}, sans correction de
  Pilou. » ;
- `maths_indices` → « {prenom} a demandé de l'aide sur les maths. Pilou a guidé
  sans donner les réponses. »

## [MINEUR] 3 — `parent.apercu.resume` fige le nombre d'étapes, l'ordre des matières et la durée

```
parent.apercu.resume      « 2 étapes ce soir : lecture, maths. Environ 12 minutes. »
parent.apercu.resume_une  « 1 étape ce soir : lecture. Environ 6 minutes. »
```

Trois valeurs sont écrites en dur dans un texte fixe : le nombre d'étapes,
l'ordre des matières, et la durée estimée. Or :

- PRD-04 autorise le parent à **réordonner** les étapes ; le livrable marketing a
  d'ailleurs été corrigé pour éclater la clé enfant en
  `enfant.programme.corps.lecture_maths` et `.maths_lecture`. Le pendant parent
  n'a jamais été éclaté : `resume` annonce « lecture, maths » même si le parent a
  mis les maths devant ;
- `resume_une` annonce « lecture » même quand l'étape unique est les maths ;
- « Environ 12 minutes » et « Environ 6 minutes » ne varient jamais, alors que la
  durée est estimée par l'analyse et que **la clé tokenisée existe deux lignes
  plus bas** : `parent.apercu.duree` = « environ {n} min ».

Le texte est une extraction fidèle — il est verbatim dans le marketing, ligne
1378 — et l'exemple vient à l'origine de la section 1.4 du prompt maître, où il
illustrait un aperçu. Un exemple illustratif est devenu une chaîne d'interface
fixe. Le parent dispose par ailleurs des cartes par étape
(`parent.apercu.etape_lecture`, `.etape_maths`) et de `parent.apercu.duree`, qui
sont justes : la ligne fautive est un résumé redondant, d'où la gravité mineure.

C'est exactement le même type de réserve que celle qu'il signale sur
`observation.pause` : un défaut hérité, hors de son mandat d'écriture, mais qui
entre aujourd'hui dans `content/`. Il en a signalé un et manqué celui-ci, qui a
plus de conséquences.

**Correction attendue**, côté `produit-marketing` puis répercutée ici : éclater
en `parent.apercu.resume.lecture_maths` / `.maths_lecture` /
`.une.lecture` / `.une.maths`, et remplacer la durée figée par le jeton :
« 2 étapes ce soir : lecture, maths. Environ {n} minutes. »

## [MINEUR] 4 — `ui-enfant.jetons_connus` déclare six jetons jamais employés, dont un que sa propre définition interdit côté enfant

```
ui-enfant : declares  = {prenom}, {n}, {date}, {matiere}, {liste}, {duree}, {version}
            employes  = {n} (3 fois)
            DECLARES MAIS JAMAIS EMPLOYES : {prenom}, {date}, {matiere}, {liste}, {duree}, {version}

ui-parent : declares = les memes 7 — employes = les 7
```

Le bloc `jetons_connus` est identique dans les deux fichiers, manifestement
recopié. Côté parent il décrit la réalité ; côté enfant il annonce six jetons que
les 101 textes n'emploient pas. Deux sont contradictoires avec leur propre
définition :

```
"{duree}"   : « Durée estimée, côté parent uniquement. Jamais montrée à l'enfant. »
"{version}" : « Numéro de version de l'application, sous-page À propos. »
```

Un jeton déclaré « jamais montré à l'enfant » n'a rien à faire dans le contrat du
fichier enfant, et la sous-page « À propos » est un écran `/reglages`. Un
développeur qui lit `ui-enfant.jetons_connus` comme le contrat du fichier — ce
que sa place dans le fichier invite à faire — en conclut qu'un écran enfant peut
porter une durée ou un numéro de version.

Ce n'est pas un défaut de texte, c'est un défaut de contrat, dans un fichier dont
tout l'intérêt est d'être consommé sans interprétation.

**Correction attendue** : réduire `ui-enfant.jetons_connus` aux jetons que le
fichier emploie réellement, soit `{n}` — ou, si un glossaire commun est voulu, le
sortir des deux fichiers et le nommer pour ce qu'il est.

## [MINEUR] 5 — Le rôle `texte` est attribué à des commandes, y compris destructives

La règle de dérivation du `role` est mécanique, publiée dans le fichier, et je
l'ai vérifiée : elle est appliquée sans exception sur les 288 entrées. Le
producteur la défend ainsi, et l'argument est bon :

> « Un rôle deviné serait pire qu'un rôle absent : le design system câblerait un
> libellé de bouton comme un titre sans que rien ne proteste. »

Mais `texte` n'est pas un rôle absent : c'est un rôle, et le design system le
rendra en corps de texte. Quinze entrées au moins sont des commandes ou des
valeurs typées `texte` :

```
[enfant] lecture.modele.relire              « Réécouter »
[enfant] lecture.question.passer            « Je ne sais pas »
[enfant] session.sortie_parent.annuler      « Revenir à la session »
[enfant] coffre.solde.valeur                « {n} »                        (une valeur, pas un texte)
[parent] parent.scan.saisie_manuelle        « Saisir le devoir à la main »
[parent] parent.scan.reglages_aria          « Réglages »                   (un libelle ARIA)
[parent] reglages.code.saisie.annuler       « Annuler »
[parent] reglages.paliers.ajouter           « Ajouter un palier »
[parent] reglages.paliers.supprimer         « Supprimer ce palier »
[parent] reglages.donnees.supprimer         « Tout supprimer »
[parent] reglages.audio.option_7 / _30 / _0 « 7 jours » / « 30 jours » / « Ne rien conserver »
```

« Tout supprimer » et « Supprimer ce palier » sont des actions destructives ;
« Je ne sais pas » et « Réécouter » sont des cibles tactiles d'un écran enfant,
soumises au minimum de 56 px de DES-04. Rendues en corps de texte, elles ne le
sont pas.

La conséquence tombe en P3, la porte suivante, donc le moment de la régler est
maintenant.

**Correction attendue** — au choix, mais tranché dans le livrable :
- ajouter au `role` la valeur `action`, et l'attribuer aux entrées dont la clé
  finit par un verbe d'action (`relire`, `passer`, `annuler`, `ajouter`,
  `supprimer`, `effacer`, `saisie_manuelle`) ; ou
- remplacer la valeur de repli `texte` par `indetermine`, qui dit ce qu'elle est
  et empêche le design system de la rendre comme du corps de texte par défaut.

---

# JUGEMENTS DEMANDÉS

## Point 2 — « 288 entrées extraites, pas ressaisies » : l'affirmation tient

C'est l'affirmation la plus forte du rapport, et elle est vraie.

Méthode : j'ai extrait mécaniquement les paires clé → texte des tables du
livrable marketing (333 clés), retiré les guillemets français, et comparé
**chaîne contre chaîne, sans normalisation** — ni casse, ni accents, ni
ponctuation, ni apostrophes — aux 288 entrées des deux fichiers.

```
identiques au caractere pres : 279
DIVERGENTES                  : 0
absentes du marketing        : 9   (= les 9 cles creees, section suivante)
```

Zéro divergence sur 279 comparaisons strictes. J'ai ensuite cherché les 9 textes
restants dans le document entier : les neuf sont présents **mot pour mot**, aux
lignes 1478 à 1486, dans une table dont la première colonne est un libellé
(« Pause prise », « Blocage », « Exercice breton ») et non une clé. Autrement
dit, **les 288 textes sont bien tous dans le marketing** ; son chiffre de
« 288 entrées comparées, 0 écart » est exact si l'on compare par texte, et il
imprime par ailleurs les 9 comme « HORS SOURCE » dans son contrôle 2. Rien à
redire.

C'est la vérification que je redoutais le plus de voir échouer, parce qu'une
divergence silencieuse entre la source éditoriale et le fichier consommé par le
code est invisible jusqu'à la production. Elle n'existe pas ici.

## Point 4 — Les 9 clés créées : les neuf sont verbatim, et la consigne a été tenue

Pour chacune, j'ai cherché le texte dans le marketing avec le jeton `{prenom}`
traité comme joker. **Les neuf remontent en correspondance exacte** :

| Clé créée | Source | Fidélité |
| --- | --- | --- |
| `...lecture_fluide` | ligne 1478, « Lecture fluide » | exacte |
| `...hesitations` | ligne 1479, « Hésitations en lecture » | exacte |
| `...maths_indices` | ligne 1480, « Maths avec indices » | exacte |
| `...maths_sans_indice` | ligne 1481, « Maths sans indice » | exacte |
| `...pause` | ligne 1482, « Pause prise » | exacte |
| `...blocage` | ligne 1483, « Blocage » | exacte |
| `...soir_leger` | ligne 1484, « Soir léger » | exacte |
| `...breton` | ligne 1485, « Exercice breton » | exacte |
| `...arret_avant_fin` | ligne 1486, « Session arrêtée par le parent » | exacte |

Aucun texte n'a été réécrit au passage. Le travail a consisté à **nommer** des
textes que le marketing donnait sans identifiant, ce qui est précisément ce que
« créer une clé » doit vouloir dire, et la nomenclature retenue
(`parent.resume.observation.<cas>`) est régulière et se lit.

**Sur `parent.resume.observation.arret_avant_fin`, la consigne est tenue à la
lettre.** Le texte est celui du marketing, inchangé :

> « La séance a été arrêtée avant la fin. Les pierres acquises sont conservées. »

et seule la condition est élargie, en le disant explicitement :

> « la séance s'est terminée avant la dernière étape, **que l'arrêt vienne du
> parent (PRD-13) ou d'une clôture automatique** : la phrase est exacte dans les
> deux cas »

La justification est de surcroît la bonne : la phrase ne nomme pas l'auteur de
l'arrêt, donc elle reste vraie dans les deux cas — c'est ce qui permet d'élargir
la condition sans toucher au texte. C'est exactement ce qui était demandé.

Je relève seulement que trois de ces neuf clés portent un accord de genre hérité
([MINEUR] 2), ce qui ne met pas en cause la fidélité de l'extraction.

## Point 5 — Le retrait des six clés mortes : bonne façon de laisser une trace, et la couverture est réelle

**Je valide le choix, sans réserve.**

D'abord le fait. Les six clés ont disparu partout, et je l'ai vérifié
indépendamment :

```
lecture.vide.corps, lecture.vide.corps_2.suite, lecture.vide.corps_2.fin,
maths.vide.corps,   maths.vide.corps_2.suite,   maths.vide.corps_2.fin

ui-enfant.json      : 0 occurrence
ui-parent.json      : 0 occurrence
gwenn-scripts.json  : 0 occurrence
encouragements.json : 0 cle — 1 mention en prose, dans le champ `motif`
marketing           : 0 cle — 2 mentions en prose
```

Aucune de ces clés n'existe plus comme clé, et **aucun texte ne subsiste** : ni
table, ni chaîne entre guillemets. Ce qui reste, ce sont trois phrases qui
expliquent pourquoi elles ont disparu.

Ce n'est donc pas « du texte mort déguisé en documentation » : c'est l'inverse
exact. Du texte mort déguisé en documentation, ce serait conserver les tables en
les marquant « obsolète » — et ces chaînes finiraient recâblées un jour. Ici le
texte est supprimé et la trace est un **raisonnement**, qui répond à la seule
question qu'un futur lecteur se posera : « pourquoi n'y a-t-il pas d'état vide
pour l'étape lecture, alors que tous les autres écrans en ont un ? » Sans la
trace, le prochain agent recrée les clés en croyant réparer un oubli. C'est le
motif même d'ARB-12 : « un écart assumé et tracé n'est pas un écart ; un écart
silencieux est un piège pour le dernier agent de la chaîne. »

Les trois traces sont datées et référencées, ce qui est le bon niveau :

```
marketing 823 : « État vide : sans objet, et sans texte. ARB-08 pose qu'une étape
                 sans exercice exploitable n'est jamais créée [...] Les clés
                 lecture.vide.* sont retirées (ARB-12) : un texte sans déclencheur
                 finit toujours par être recâblé sur un écran. »
encouragements : « Les six cles lecture.vide.* et maths.vide.* ont ete retirees de
                 ce groupe le 2026-09-20 : ARB-08 interdit la creation d'une etape
                 vide, donc elles n'avaient plus de declencheur (ARB-12). »
```

**Et la couverture du cas « pas de maths ce soir » est réelle.** Le marketing
l'énonce en trois lignes (1020-1022) ; j'ai vérifié que chaque maillon de la
chaîne existe et a un propriétaire :

| Maillon annoncé | Vérification |
| --- | --- |
| la soirée compte une seule étape | `enfant.programme.une.titre` → porté par `ui-enfant.json` |
| et emprunte `enfant.programme.une.corps.*` | `...corps.lecture` et `...corps.maths` → portés par `encouragements.json`, banque `annonce_programme_une_etape`, 20 variantes |
| puis passe directement à la clôture par `session.fin_travail.corps` | porté par `encouragements.json`, banque `cloture`, 20 variantes |

La chaîne est complète : l'enfant dont la soirée n'a pas de maths voit une
annonce à une étape, fait sa lecture, et entre dans la clôture. Il ne rencontre
jamais d'écran maths vide, parce qu'ARB-08 garantit qu'aucune étape maths n'est
créée. Le cas est couvert par construction, pas par un texte de repli — ce qui
est mieux.

## Points 1, 3, 6, 7, 8 — vérifications

**Point 1, les comptes.** Recomptés entrée par entrée et écran par écran :
101 / 6 côté enfant, 187 / 6 côté parent, 288 au total, 187/187 en `affiche`.
Aucun écart. Détail dans le tableau plus bas.

**Point 3, la couverture des 333 clés, dans les deux sens et sur les quatre
fichiers.**

```
cles UI declarees par le marketing ............................ 333
cles du marketing SANS fichier proprietaire (orphelines) ......   0
cles dans content/ absentes du marketing ......................   9  (les 9 creees)
cles portees par PLUS D'UN fichier (doublon de propriete) .....   0

decomposition : 279 (ui-enfant + ui-parent) + 19 (gwenn-scripts) + 35 (encouragements) = 333
```

Sa règle « une clé a exactement un fichier qui porte son texte » tient sur les
quatre fichiers. J'ai vérifié en outre que `cles_fixes_non_variees` de
`encouragements.json` ne porte aucun texte et ne crée donc pas de seconde
propriété : ses 32 clés sont toutes portées ailleurs (26 par `ui-enfant.json`,
5 par `gwenn-scripts.json`, plus l'entrée générique « tous les libellés de
bouton »), et l'intersection avec les clés alimentées par la banque est vide.
C'est propre, et c'est le point où un livrable de cette nature se casse le plus
facilement.

**Point 6, la charte de ton sur les 101 textes enfant.**

```
phrases controlees ............... 121
depassements de 12 mots .......... 0   (regle stricte ET regle souple)
phrase la plus longue ............ 10 mots — lecture.sans_voix.corps
vocabulaire interdit (35 motifs) .. 0
emoji ............................ 0
chiffres en dur .................. 0
prenom en dur .................... 0
accords de genre portant sur l'enfant : 0
```

Aucune entrée enfant n'emploie `{prenom}` : les textes d'interface sont des
libellés et des titres, et la salutation nominative vit dans la banque. La
contrainte « jamais le prénom en dur » est donc satisfaite, et satisfaite pour la
bonne raison. Lecture intégrale des 101 : le registre tient partout, et les
quatre `maths.demande_resultat.*` sont des refus de donner le résultat
exemplaires (« Je garde la réponse pour toi. Tu vas trouver. »).

**Côté parent** : aucun chiffrage de performance, aucune comparaison d'une
soirée à une autre. Les seuls chiffres sont opérationnels — nombre d'étapes,
durée, longueur du code, jours de rétention audio — et aucun ne porte sur ce que
l'enfant a réussi. `reglages.enfant.niveau` = « Niveau » est le niveau scolaire
du profil, pas un niveau de performance. Les motifs `hier`, `la dernière fois`,
`par rapport à`, `moins bien`, `mieux qu'hier`, `moyenne`, `score`, `sur 10`
remontent **zéro** occurrence.

**Point 7, ARB-13 et le Soir léger.** Vérifié sur les **767** textes des quatre
fichiers (101 + 187 + 460 + 19), avec 23 motifs de barème. Quatre déclenchements,
aucun n'est un barème :

```
[ui-parent]      reglages.paliers.gems      « Nombre de pierres »
                 -> libelle d'un champ de saisie parent pour definir un palier
[encouragements] indice_demande_4.04/.09    « étape par étape » / « chaque étape »
                 -> amorces d'indice, aucun rapport avec les pierres
[gwenn-scripts]  bienvenue.3.corps_2        « Tu gagnes des pierres. Elles restent à toi. »
                 -> aucune quantite enoncee : c'est exactement ce qu'ARB-13 exige
```

Et sur la question qui compte vraiment — **l'enfant peut-il déduire qu'il a gagné
moins un soir qu'un autre ?** — j'ai passé les 580 textes qu'il voit au crible de
15 motifs de comparaison temporelle et de quantité (`hier`, `l'autre soir`,
`d'habitude`, `seulement`, `une seule pierre`, `Soir léger`, `basse énergie`…).
**Zéro occurrence.** Les deux seuls `moins` du corpus enfant sont
`indice_demande_3.06` et `.20`, qui parlent d'objets à compter en maths. Les
trois mentions de « Soir léger » sont toutes côté parent, ce qui est le dessin
attendu. Aucun texte ne nomme une quantité de pierres autre que par le jeton
`{n}` du coffre, qui est un inventaire et non un gain du soir.

L'affirmation « aucun des 767 textes n'énonce de barème » est donc vraie, et sa
justification l'est aussi : **taire le barème est la bonne façon de respecter
ARB-13**, parce qu'un enfant à qui l'on n'annonce aucune règle de calcul ne peut
pas constater qu'elle varie.

**Point 8, son détecteur.** Les deux versions sont bien publiées, dans le rapport
(§7.3) et dans la sortie du contrôle 8 elle-même :

```
regle LARGE (premiere version) : 1 texte signale
   << par étape >> : On déroule l'exercice ensemble, étape par étape.
   verifie a la main : parle des indices, pas des pierres. Faux positif.
regle RETENUE (quantite ET le mot pierre) : 0 texte signale
```

C'est la forme que j'avais demandée au tour 2 de la banque, et elle est
respectée : un lecteur voit ce que l'ancienne version trouvait et pourquoi elle
se trompait, sans avoir à le croire.

**Le resserrement n'a rien masqué, et je l'ai contre-testé autrement que lui.**
La faiblesse possible de sa règle retenue est d'exiger le mot « pierre » : un
barème pourrait s'énoncer sans ce mot. J'ai donc passé les 767 textes au crible
de 17 motifs qui ne contiennent jamais « pierre » — `de plus`, `en plus`,
`si tu finis`, `si tu termines`, `si tu fais tout`, `gagnes un/une/deux/trois`,
`crédit`, `double`, `fois plus`, `chaque fois`, `toutes les étapes`,
`soirée complète`, `récompense`… Sept déclenchements, **aucun barème** :

```
« C'est tout pour ce soir. Rien de plus. »              (annonce du programme)
« On le regarde de plus près, tous les deux. »          (hesitation)
« Je te montre la même chose en plus petit. »           (indice niveau 3)
« Voilà la même idée, en plus court. »                  (indice niveau 3)
« Paliers de récompense » x2                            (menu parent)
« Vous définissez le palier et vous donnez la récompense.
  Tipi compte seulement les pierres. »                  (parent — formulation ETH-05)
```

Le dernier mérite d'être relevé pour la bonne raison : c'est l'énoncé exact
d'ETH-05 — l'application compte, le parent donne. Le resserrement est validé.

---

# AVIS gardien-charte

Grille des 7 points de `.cursor/agents/gardien-charte.md`, appliquée aux **101
textes enfant** de `ui-enfant.json`, seuls textes de ce livrable destinés à
l'enfant. Les 187 textes parent ne relèvent pas de cette grille et sont traités
au point 6 ci-dessus.

| # | Point | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Conforme.** Aucune formulation ne peut se lire comme un reproche. `lecture.question.retour_autre` répond à une réponse inattendue par « Tu veux relire le début, pour voir ? » — une relance, jamais un constat. |
| 2 | Interdits absolus | **Conforme.** 0 occurrence sur 35 motifs. Aucune comparaison, aucune ironie. |
| 3 | Charge : une idée par phrase, 12 mots, CE1 | **Conforme.** 121 phrases, maximum **10 mots**, 0 dépassement sous mes deux règles de comptage. Vocabulaire concret de bout en bout. |
| 4 | Pression : ni chrono, ni décompte, ni compteur, ni série | **Conforme.** 0 chiffre en dur. Le seul nombre affiché est `coffre.solde.valeur` = `{n}`, le solde du coffre : un inventaire, jamais un score du soir (PED-07). |
| 5 | Récompense : aucune promesse réelle, aucune perte de pierres | **Conforme** (ETH-04, ETH-05). `coffre.rassurance` : « Tes pierres restent là. Elles ne partent jamais. » `coffre.palier.maison` : « Je garde tes pierres. Le reste se décide à la maison. » — l'application ne promet rien, le parent décide. `session.sortie_parent.corps` : « Les pierres déjà gagnées sont conservées. » |
| 6 | Maths : rien ne conduit au résultat | **Conforme** (PED-01). Les quatre `maths.demande_resultat.*` refusent sans jamais reprocher la demande : « Je ne donne pas les réponses. Je t'aide à chercher. », « Je garde la réponse pour toi. Tu vas trouver. », « C'est toi qui trouves. Moi, je t'aide. », « Non, je ne la dis pas. Veux-tu un indice ? » `maths.indice.epuise` clôt l'échelle sans jamais la franchir. |
| 7 | Autonomie : la pause accessible, gratuite | **Conforme.** `session.pause.bouton` = « Pause » est présent sur l'écran de session ; `lecture.blocage.bouton` et `maths.blocage.bouton` = « Faire une pause » ; `pause.rassurance` = « Tu reviens quand tu veux. » Aucun texte ne conditionne ni ne facture la pause. |

Deux points que je relève sans qu'ils entament l'avis, parce qu'ils sont bien
traités :

- `lecture.sans_voix.corps` et `corps_2` sont en canal **`affiche`** et non
  `les_deux` : ce sont les textes de l'état où la voix de Pilou est
  indisponible. Les faire lire par un TTS en panne aurait été absurde. Le choix
  est cohérent et vérifiable dans le fichier ;
- `lecture.breton.corps` dit « Je ne sais pas le lire. Toi, oui. » — Pilou avoue
  sa limite et valorise l'enfant dans la même phrase. C'est exactement ce que
  PED-13 demande : un mode dégradé assumé, sans promesse.

AVIS: CONFORME

Motif : aucun des 101 textes enfant ne met un enfant fatigué en difficulté, ne
lui adresse un reproche, ne le compare, ne le met sous pression, ne lui promet
une récompense réelle, ne lui donne un résultat de maths, ni ne lui ferme la
pause. Les cinq constats de ce contrôle portent sur le contrat du fichier et sur
des textes parent ; aucun ne relève de la grille du gardien.

---

# CHIFFRES ANNONCÉS CONTRE CHIFFRES RÉELS

Recomptés par mes propres commandes, sans lire les sorties du rapport.

| Grandeur | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- |
| JSON valide, clés dupliquées | valide, 0 | **valide, 0** | — |
| Entrées `ui-enfant.json` | 101 | **101** | — |
| Écrans côté enfant | 6 | **6** | — |
| Entrées `ui-parent.json` | 187 | **187** | — |
| Écrans côté parent | 6 | **6** | — |
| Entrées totales des deux fichiers | 288 | **288** | — |
| Côté parent, canal `affiche` | toutes | **187 / 187** | — |
| Entrées recomparées à la source | 288 | **288** (279 par clé + 9 par texte) | — |
| Écarts de fidélité | 0 | **0** | — |
| Clés UI du marketing | 333 | **333** | — |
| Clés sans fichier propriétaire | 0 | **0** | — |
| Clés portées par plus d'un fichier | 0 | **0** | — |
| Clés dans `content/` absentes du marketing | 9 | **9** | — |
| Clés créées | 9 | **9**, les 9 verbatim | — |
| Clés mortes présentes dans les 3 fichiers | 0 | **0** | — |
| Textes énonçant un barème (sur 767) | 0 | **0** | — |
| Total des textes des 4 fichiers | 767 | **767** (101+187+460+19) | — |
| Emoji, prénom en dur (4 fichiers) | 0, 0 | **0, 0** | — |
| Dépassements de 12 mots côté enfant | 0 | **0** | — |
| Phrase enfant la plus longue | 10 mots | **10 mots**, `lecture.sans_voix.corps` | — |
| Entrées avec `condition` non nulle | 9 (parent), 0 (enfant) | **9 / 0** | — |

**Vingt grandeurs annoncées, vingt exactes. Aucun écart.** Je note que le chiffre
« 0 entrée avec condition » côté enfant figure dans sa propre sortie de contrôle :
il est exact, et c'est lui qui fonde mon [MAJEUR] 1. Le producteur publie la
mesure qui le met en défaut sans la commenter.

## Ma règle de comptage des mots

Inchangée : phrases découpées sur `.`, `!`, `?`, `…`. **Règle souple**, l'élision
reste dans le mot (« je t'aide » = 2 mots) ; **règle stricte**, on coupe aussi sur
l'apostrophe et le trait d'union (= 3 mots). Les deux donnent le même résultat
ici : maximum 10 mots, 0 dépassement.

---

# SORTIES RÉELLES DES COMMANDES

Exécutées dans `/home/user/Tipi`, sorties collées telles quelles.

## 1. Validité JSON et clés dupliquées

```
$ node -e "... JSON.parse des deux fichiers ..."
content/ui-enfant.json : JSON VALIDE, cles racine=8 -> schema,version,public,personnage,canaux,jetons_connus,regles,textes
content/ui-parent.json : JSON VALIDE, cles racine=7 -> schema,version,public,canaux,jetons_connus,regles,textes
---exit:0---

$ python3   # object_pairs_hook : detecte ce qu'un JSON.parse masque
ui-enfant.json cles dupliquees : aucune
ui-parent.json cles dupliquees : aucune
```

## 2. Comptage indépendant : entrées, écrans, canaux, rôles, schéma

```
$ python3
===== ENFANT : 101 entrees
  ecrans : 6
     /enfant                            5
     /enfant/coffre                    19
     /enfant/pause                      4
     /enfant/programme                 10
     /enfant/session/lecture           40
     /enfant/session/maths             23
  canaux : {'affiche': 47, 'les_deux': 54}
  roles  : {'bouton': 38, 'texte': 56, 'titre': 7}
  PROBLEMES : 0
  ids uniques : 101 / 101   textes distincts : 91 / 101

===== PARENT : 187 entrees
  ecrans : 6
     /parent                           31
     /parent/programme                 28
     /parent/resume                    23
     /reglages                         82
     /reglages/code                    19
     notification                       4
  canaux : {'affiche': 187}
  roles  : {'texte': 122, 'titre': 32, 'bouton': 24, 'aide': 9}
  PROBLEMES : 0
  ids uniques : 187 / 187   textes distincts : 167 / 187
```

Le contrôle de schéma vérifie sans anomalie, sur les 288 entrées : clé identique
à `id` ; exactement les champs `id`, `ecran`, `texte`, `canal`, `role`, `jetons`,
`condition` ; `canal` dans l'énumération d'ARB-02 ; `role` dans les quatre
valeurs ; jetons déclarés identiques aux jetons présents ; texte non vide ; et
**la règle mécanique du `role` rejouée, vérifiée 288 fois sur 288**.

Les textes répétés (10 côté enfant, 20 côté parent) sont des libellés de bouton
réemployés sur plusieurs écrans sous des clés distinctes — « Voir mon coffre »,
« Continuer », « Faire une pause » — ce qui est correct et voulu.

## 3. Fidélité : comparaison caractère pour caractère avec la source

```
$ python3   # extraction des paires cle -> texte des tables du marketing
cles trouvees dans les tables du marketing : 333
cles declarees plusieurs fois : 3
   coffre.solde.valeur           -> ['{n}', '{n}']                                    (identiques)
   coffre.palier.reste           -> ['Encore {n} pierres.', 'Encore {n} pierres.']     (identiques)
   coffre.cosmetiques.verrouille -> ['Il faut {n} pierres pour celui-là.', idem]        (identiques)

$ python3   # comparaison stricte, sans aucune normalisation
entrees UI : 288
  identiques au caractere pres : 279
  DIVERGENTES                  : 0
  ABSENTES du marketing (= cles creees) : 9
     [ui-parent] parent.resume.observation.arret_avant_fin
     [ui-parent] parent.resume.observation.blocage
     [ui-parent] parent.resume.observation.breton
     [ui-parent] parent.resume.observation.hesitations
     [ui-parent] parent.resume.observation.lecture_fluide
     [ui-parent] parent.resume.observation.maths_indices
     [ui-parent] parent.resume.observation.maths_sans_indice
     [ui-parent] parent.resume.observation.pause
     [ui-parent] parent.resume.observation.soir_leger
```

Les trois clés déclarées deux fois dans le marketing portent le même texte aux
deux endroits : aucune ambiguïté de source.

## 4. Les 9 clés créées, retrouvées dans le marketing

```
$ python3   # recherche du texte, {prenom} traite comme joker
parent.resume.observation.arret_avant_fin  EXACT ligne 1486
   | Session arrêtée par le parent | « La séance a été arrêtée avant la fin. Les pierres acquises sont conservées. » |
   condition : "la séance s'est terminée avant la dernière étape, que l'arrêt vienne
                du parent (PRD-13) ou d'une clôture automatique : la phrase est
                exacte dans les deux cas"
parent.resume.observation.blocage           EXACT ligne 1483
parent.resume.observation.breton            EXACT ligne 1485
parent.resume.observation.hesitations       EXACT ligne 1479
parent.resume.observation.lecture_fluide    EXACT ligne 1478
parent.resume.observation.maths_indices     EXACT ligne 1480
parent.resume.observation.maths_sans_indice EXACT ligne 1481
parent.resume.observation.pause             EXACT ligne 1482
parent.resume.observation.soir_leger        EXACT ligne 1484
```

## 5. Couverture des 333 clés, propriété unique, sur les quatre fichiers

```
$ python3
cles marketing            : 333
porteurs de texte, total  : 342
  ui-enfant : 101 | ui-parent : 187 | gwenn-scripts : 19 | encouragements : 35

>>> A. CLES DU MARKETING SANS FICHIER PROPRIETAIRE (orphelines) : 0
>>> B. CLES DANS content/ QUI N'EXISTENT PAS DANS LE MARKETING  : 9   (les 9 creees)
>>> C. CLES PORTEES PAR PLUSIEURS FICHIERS (doublons)           : 0   []
>>> D. cles_fixes_non_variees : 9 groupes, 32 cles
       cles fixes SANS porteur : 0
       cles fixes portees par  : {'ui-enfant': 26, 'gwenn-scripts': 5}
       intersection banques / cles fixes : aucune
>>> E. 279 (ui, issues du marketing) + 19 (gwenn) + 35 (encouragements) = 333
       intersection ui / marketing : 279
```

## 6. ARB-12 : les six clés mortes

```
$ grep -c "lecture\.vide\|maths\.vide" content/*.json
content/encouragements.json:1      <- une mention en prose, dans un champ `motif`
content/gwenn-scripts.json:0
content/ui-enfant.json:0
content/ui-parent.json:0

$ grep -n "lecture\.vide\|maths\.vide" docs/agents/P1/produit-marketing.out.md
826:Les clés `lecture.vide.*` sont retirées (ARB-12) : un texte sans déclencheur
1018:n'existe pas. Les clés `maths.vide.*` sont retirées (ARB-12).

$ sed -n '823,827p;1016,1022p' docs/agents/P1/produit-marketing.out.md
**État vide** : **sans objet, et sans texte.** ARB-08 pose qu'une étape sans
exercice exploitable n'est jamais créée : l'analyse l'écarte et la soirée en
compte une de moins. L'enfant n'entre donc jamais dans une étape lecture vide.
Les clés `lecture.vide.*` sont retirées (ARB-12) : un texte sans déclencheur
finit toujours par être recâblé sur un écran.
...
**État vide** : **sans objet, et sans texte.** Même règle qu'en 7.5 : ARB-08
interdit la création d'une étape vide, donc une étape maths sans exercice
n'existe pas. Les clés `maths.vide.*` sont retirées (ARB-12).

Le cas « pas de maths ce soir » reste couvert : la soirée compte une seule étape
et emprunte `enfant.programme.une.corps.*`, puis passe directement à la clôture
par `session.fin_travail.corps`.

$ python3   # chaine de couverture du cas « pas de maths ce soir »
enfant.programme.une.titre          -> ui-enfant.json
enfant.programme.une.corps.lecture  -> encouragements.json (annonce_programme_une_etape, 20 variantes)
enfant.programme.une.corps.maths    -> encouragements.json (idem)
session.fin_travail.corps           -> encouragements.json (cloture, 20 variantes)
```

## 7. Le champ `condition` — origine du [MAJEUR] 1

```
$ python3
entrees avec condition NON nulle : 9 / 288
   [parent] parent.resume.observation.lecture_fluide     la lecture s'est faite sans hésitation marquée
   [parent] parent.resume.observation.hesitations        au moins un mot a demandé une reprise
   [parent] parent.resume.observation.maths_indices      au moins un indice a été demandé
   [parent] parent.resume.observation.maths_sans_indice  aucun indice demandé
   [parent] parent.resume.observation.pause              au moins une pause prise, et la session a repris
   [parent] parent.resume.observation.blocage            blocage détecté selon PED-08
   [parent] parent.resume.observation.soir_leger         Soir léger activé par le parent
   [parent] parent.resume.observation.breton             un exercice en breton était au programme
   [parent] parent.resume.observation.arret_avant_fin    la séance s'est terminée avant la dernière étape [...]

entrees a l'evidence CONDITIONNELLES mais condition = null : 85
   {'enfant': 34, 'parent': 51}
   [enfant] coffre.cosmetiques.vide        [enfant] coffre.palier.vide
   [enfant] coffre.souci.corps             [enfant] enfant.accueil.vide.bouton
   [enfant] enfant.accueil.souci.bouton    [enfant] enfant.programme.souci.titre
   [enfant] lecture.breton.intro           [enfant] lecture.micro_absent.corps
   [enfant] lecture.pas_entendu.corps      [enfant] lecture.reprise.corps
   [enfant] lecture.sans_voix.corps        [enfant] maths.reprise.corps
   [enfant] maths.sans_indice.corps        [parent] notif.resume.sans_devoir.titre
   [parent] parent.apercu.basse_energie.actif   [parent] parent.apercu.echec.titre
   [parent] parent.apercu.lancement_echec.corps [parent] parent.apercu.regroupe
   [parent] parent.apercu.reporte               ... (85 au total)

$ python3   # l'ecran /parent/programme, integralement
  parent.apercu.resume        cond=None   '2 étapes ce soir : lecture, maths. Environ 12 minutes.'
  parent.apercu.resume_une    cond=None   '1 étape ce soir : lecture. Environ 6 minutes.'
  parent.apercu.vide.titre    cond=None   "Aucun exercice n'a été reconnu."
  parent.apercu.echec.titre   cond=None   "Le programme n'a pas pu être préparé."
  parent.apercu.lancement_echec.titre cond=None "La session n'a pas pu démarrer."
  parent.apercu.basse_energie.actif   cond=None 'Soir léger activé : une seule étape ce soir.'
  parent.apercu.regroupe      cond=None   'Tout a été regroupé en 2 étapes. Le reste attendra demain.'
  parent.apercu.reporte       cond=None   'Reporté à demain : {liste}'
  (28 entrees sur cet ecran, 28 avec condition = null)

$ grep -n "^\*\*État" docs/agents/P1/produit-marketing.out.md | head
494:**État d'attente** : ...
564:**État vide** : sans objet, l'onboarding n'affiche aucune donnée.
598:**État vide — aucun devoir préparé ce soir** (PRD-16) :
610:**État d'erreur — les devoirs n'ont pas pu être chargés** :
829:**État d'erreur — micro refusé ou indisponible** :
1024:**État d'erreur — indices indisponibles** (secours de TEC-07 en échec) :
1316:**État vide — aucune photo ajoutée** :
1420:**État vide — rien d'exploitable dans les photos** :
1496:**État vide — séance sans devoir** :
   -> l'information de condition existe dans la source, en intertitre,
      et n'a pas ete transferee dans le champ prevu pour elle
```

## 8. Accords de genre côté parent — origine du [MINEUR] 2

```
$ python3   # participes et adjectifs a genre variable, sur les 187 textes parent
parent.resume.observation.pause              'Il est'  '{prenom} a fait une pause. Il est revenu ensuite.'
parent.resume.observation.pause              'revenu'  (idem)
parent.resume.observation.maths_sans_indice  'seul'    "{prenom} a fait les maths seul, sans demander d'indice."
parent.resume.observation.breton             'seul'    'Le texte en breton a été lu par {prenom} seul. [...]'
parent.resume.observation.maths_indices      'guidé'   "{prenom} a demandé de l'aide sur les maths. Pilou l'a guidé [...]"
   -- accords portant sur l'enfant : 4 entrees

parent.apercu.basse_energie.aide   'seule'    accord sur « étape »      correct
parent.apercu.basse_energie.actif  'seule'    accord sur « étape »      correct
parent.resume.observation.soir_leger 'seule'  accord sur « étape »      correct
parent.resume.indispo.titre        'prêt'     accord sur « résumé »     correct
notif.resume.corps                 'prêt'     accord sur « résumé »     correct
reglages.code.bloque.titre         'bloquée'  accord sur « saisie »     correct
reglages.code.bloque.aide          'seul'     accord sur « blocage »    correct
parent.resume.observation.blocage  'bloqué'   accord sur « exercice »   correct
```

## 9. Jetons déclarés contre jetons employés — origine du [MINEUR] 4

```
$ python3
ui-enfant: declares = {prenom},{n},{date},{matiere},{liste},{duree},{version}
           employes = {'{n}': 3}
           DECLARES MAIS JAMAIS EMPLOYES : {prenom},{date},{matiere},{liste},{duree},{version}
ui-parent: declares = les memes 7
           employes = {'{n}':9, '{prenom}':22, '{liste}':1, '{date}':2, '{matiere}':2, '{duree}':1, '{version}':1}
           DECLARES MAIS JAMAIS EMPLOYES : []

   definition de {duree}   : « Duree estimee, cote parent uniquement. Jamais montree a l'enfant. »
   definition de {version} : « Numero de version de l'application, sous-page A propos. »
```

## 10. Charte de ton sur les 101 textes enfant

```
$ python3
rendus enfant : 101
phrases : 121
Depassements >12 STRICT: 0   SOUPLE: 0
Max strict: 10   Max souple: 10
   10/10 lecture.sans_voix.corps       Je ne peux pas lire à voix haute ce soir
   10/ 8 coffre.cosmetiques.vide       Il n'y a rien à mettre pour l'instant
    9/ 6 maths.sans_indice.corps       Je n'ai pas d'indice pour celui-là
    8/ 7 enfant.programme.souci.titre  Je n'arrive pas à ouvrir le programme

=== INTERDITS enfant (35 motifs) : motifs declenches 0
EMOJI: 0     CHIFFRES en dur : []     PRENOM EN DUR : []
entrees avec {prenom} : []
=== ACCORD DE GENRE sur les rendus enfant ===
   enfant.programme.une.titre  'seule'  'Ce soir, on fait une seule chose.'   (accord sur « chose », correct)

=== GARDIEN — les 7 points, mecanises ===
  2 interdits absolus                            : 0
  4 pression (chrono/decompte/compteur/serie)    : 0
  5 recompense reelle / perte de pierres         : 0
  6 maths : donner le resultat                   : 0
  7 autonomie : pause payante ou fermee          : 0
```

## 11. ARB-13, Soir léger, et contre-test du détecteur

```
$ python3
TOTAL TEXTES des 4 fichiers : 767
   {'ui-enfant': 101, 'ui-parent': 187, 'encouragements': 460, 'gwenn-scripts': 19}

=== ARB-13 : bareme ? (23 motifs) — 4 declenchements, aucun bareme ===
   [nombre de pierres]  [ui-parent] reglages.paliers.gems       'Nombre de pierres'
   [par etape]          [encouragements] indice_demande_4.04    "On déroule l'exercice ensemble, étape par étape."
   [chaque etape]       [encouragements] indice_demande_4.09    "Je t'explique chaque étape. Tu comptes."
   [tu gagnes .. pierre][gwenn-scripts] bienvenue.3.corps_2     'Tu gagnes des pierres. Elles restent à toi.'

=== SOIR LEGER : l'enfant peut-il deduire qu'il a gagne moins ? (15 motifs, 580 textes vus par l'enfant) ===
   [moins] 2  -> indice_demande_3.06 et .20, il s'agit d'objets a compter en maths
   tous les autres motifs : 0
   « Soir leger » : 3 occurrences, TOUTES cote parent

=== PARENT : chiffrage d'une performance ou comparaison de soirees ? (16 motifs) ===
   [niveau] 1 -> reglages.enfant.niveau 'Niveau'   (niveau scolaire du profil)
   hier / la derniere fois / par rapport a / moins bien / moyenne / score / sur N : 0

=== CONTRE-TEST du resserrement : bareme SANS le mot « pierre » (17 motifs) ===
   7 declenchements, aucun bareme :
     "C'est tout pour ce soir. Rien de plus."          (annonce_programme)
     "On le regarde de plus près, tous les deux."      (hesitation)
     "Je te montre la même chose en plus petit."       (indice niveau 3)
     "Voilà la même idée, en plus court."              (indice niveau 3)
     'Paliers de récompense' x2                        (menu parent)
     'Vous définissez le palier et vous donnez la récompense. Tipi compte seulement les pierres.'
```

## 12. Entrées typées `texte` qui sont des commandes — origine du [MINEUR] 5

```
$ python3
   [enfant] lecture.modele.relire          role=texte  « Réécouter »
   [enfant] lecture.question.passer        role=texte  « Je ne sais pas »
   [enfant] session.sortie_parent.annuler  role=texte  « Revenir à la session »
   [enfant] coffre.solde.valeur            role=texte  « {n} »
   [parent] parent.scan.saisie_manuelle    role=texte  « Saisir le devoir à la main »
   [parent] parent.scan.reglages_aria      role=texte  « Réglages »
   [parent] reglages.code.saisie.annuler   role=texte  « Annuler »
   [parent] reglages.paliers.ajouter       role=texte  « Ajouter un palier »
   [parent] reglages.paliers.supprimer     role=texte  « Supprimer ce palier »
   [parent] reglages.donnees.supprimer     role=texte  « Tout supprimer »
   [parent] reglages.audio.option_7/_30/_0 role=texte  « 7 jours » / « 30 jours » / « Ne rien conserver »
```

---

# SYNTHÈSE

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | JSON valide, 0 clé dupliquée, 288 entrées, 333 clés couvertes, 0 orpheline, 0 doublon, 0 écart de fidélité, 0 barème, charte enfant tenue. |
| **[MAJEUR]** | **1** | 1 — `condition` à `null` sur 85 entrées non nominales, contre la règle publiée par le fichier ; deux textes exclusifs du même écran tous deux déclarés nominaux |
| **[MINEUR]** | **4** | 2 (3 accords de genre manqués), 3 (`parent.apercu.resume` fige ordre et durée), 4 (`jetons_connus` enfant inexact), 5 (rôle `texte` sur des commandes) |

**VERDICT: FAIL**, mécaniquement : un seul [MAJEUR] impose FAIL.

## Ce que coûte la reprise

Le [MAJEUR] se corrige soit en renseignant 85 champs à partir des intertitres du
marketing, soit en réécrivant **une phrase** de `regles.condition` plus deux
conditions explicites sur `parent.apercu.resume` / `resume_une`. La seconde voie
est la moins coûteuse et la plus honnête vis-à-vis du raisonnement que le
producteur a déjà publié en section 2 ; c'est celle que je recommande. Les quatre
[MINEUR] sont de l'ordre de la ligne, sauf le [MINEUR] 3 qui appelle un éclatement
de clé côté marketing.

| Constat | Action | Ampleur |
| --- | --- | --- |
| 1 | Réécrire `regles.condition` pour dire la vérité **et** renseigner la condition de `parent.apercu.resume` / `resume_une` (et des deux clés `enfant.programme.corps.*`) | 1 règle + 4 conditions |
| 2 | Transmettre les **quatre** clés à `produit-marketing`, pas une | 4 textes, hors périmètre |
| 3 | Éclater `parent.apercu.resume` par ordre et tokeniser la durée | côté marketing, puis report |
| 4 | Réduire `ui-enfant.jetons_connus` aux jetons employés | 1 bloc |
| 5 | Ajouter une valeur de rôle pour les commandes, ou renommer le repli en `indetermine` | 1 règle + ~15 entrées |

## Ce qui est acquis et ne sera pas recontrôlé

- **Les vingt grandeurs annoncées, toutes exactes.**
- **La fidélité des 288 textes à la source**, vérifiée caractère pour caractère :
  c'est la vérification la plus importante de ce livrable et elle est sans faute.
- **La couverture des 333 clés** dans les deux sens, et la propriété unique sur
  les quatre fichiers de `content/`.
- **Les 9 clés créées**, verbatim, dont `arret_avant_fin` qui tient la consigne à
  la lettre.
- **Le retrait ARB-12**, et la couverture réelle du cas « pas de maths ce soir ».
- **ARB-13 et le Soir léger**, y compris sous mon contre-test sans le mot
  « pierre ».
- **La publication des deux versions de l'instrument**, dans la forme demandée,
  avec un resserrement que j'ai vérifié n'avoir rien masqué.
- L'`AVIS gardien-charte`, **CONFORME**.
