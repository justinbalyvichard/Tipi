VERDICT: FAIL

# Contrôle de `ui-enfant.json`, `ui-parent.json` et du retrait ARB-12 — tour 2

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Objets contrôlés : `content/ui-enfant.json`, `content/ui-parent.json`,
`docs/agents/P1/ui-content.out.md`, et l'état des quatre fichiers de `content/`.

Références : `docs/agents/GATES.md` (ARB-01 à **ARB-14**),
`docs/agents/P1/produit-marketing.out.md`, `TIPI-PROMPT-CURSOR.md` §1 à §3,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

## Position

**Le [MAJEUR] 1 est réparé, et bien réparé.** La voie (a) a été suivie :
`condition` est renseignée sur 133 entrées, chacune avec son origine déclarée
dans un champ `condition_source` neuf. J'ai vérifié le point qui comptait — **les
71 conditions `intertitre` reprennent mot pour mot un intertitre réel de la
source, 26 sur 26 retrouvés dans le document** — et les 15 entrées de mon
échantillon du tour 1 sont toutes traitées. Les trois autres [MINEUR] repris le
sont proprement, et le refus du quatrième est fondé.

**Le FAIL tient à un défaut neuf, introduit par la correction elle-même.** Le
générateur qui déduit une condition du segment de clé fonctionne par
correspondance de sous-chaîne, sans préférence pour le segment le plus
spécifique, et sur une table dont l'ordre est déterminant mais non documenté.
Conséquence aujourd'hui : **une entrée porte une condition fausse**, qui
appartient à un autre écran et à un autre mécanisme. Le champ `condition` est
précisément celui que le tour 1 a fait naître ; y livrer une valeur fausse est
pire qu'y livrer un trou, parce qu'un trou pose une question et une valeur fausse
n'en pose aucune.

Portée du jour : **une entrée sur 288**. Je le dis d'emblée pour que
l'Orchestrateur pèse le constat pour ce qu'il est — c'est le mécanisme que je
sanctionne, pas le volume.

**Les chiffres : un seul écart sur vingt-deux grandeurs**, et il est bénin
(« 27 intertitres distincts » annoncés, 26 dans les fichiers).

---

# CONSTATS DU TOUR 2

## [MAJEUR] 6 — Une condition fausse, produite par une collision de sous-chaîne dans le générateur de segments

`content/ui-enfant.json` :

```json
"coffre.cosmetiques.debloque": {
  "ecran": "/enfant/coffre",
  "texte": "Celui-là est à toi.",
  "condition": "la saisie est bloquée après cinq essais (SEC-02)",
  "condition_source": "segment_de_cle"
}
```

La condition annoncée pour « Celui-là est à toi. », texte qui s'affiche sur le
coffre quand un cosmétique de Pilou est débloqué, est **celle du blocage du
clavier du code parent après cinq essais**, qui vit sur `/reglages/code` et relève
de SEC-02. Les deux n'ont aucun rapport.

**La cause est mécanique et reproductible.** La table `conditions_par_segment`,
publiée dans les deux fichiers, contient 25 segments, dont :

```
{ "segment": "bloque",               "condition": "la saisie est bloquée après cinq essais (SEC-02)" }
{ "segment": "cosmetiques.debloque", "condition": "le cosmétique est débloqué" }
```

Le segment `bloque` est une sous-chaîne de `debloque`. Le générateur retient la
première correspondance dans l'ordre de la table, et `bloque` y précède
`cosmetiques.debloque` : la clé `coffre.cosmetiques.debloque` reçoit donc la
condition du verrouillage de code. J'ai passé les 41 entrées `segment_de_cle` au
test « la condition assignée est-elle celle du segment le **plus spécifique** qui
correspond ? » :

```
entrees segment_de_cle : 41
INCOHERENTES           : 1
   coffre.cosmetiques.debloque
      condition assignee : 'la saisie est bloquée après cinq essais (SEC-02)'
      segment le plus specifique = 'cosmetiques.debloque' -> 'le cosmétique est débloqué'
```

**La preuve que le défaut vient du générateur et non d'une faute de frappe** :
`cosmetiques.debloque` est le **seul** des 25 segments publiés qui ne serve
jamais. Il est présent, correct, et masqué par un segment plus court. Le
producteur a écrit la bonne valeur, sa table la contient, et son code ne l'atteint
pas.

**Il l'a imprimée sans la voir.** Son propre contrôle 5 bis publie, sous le titre
« exemples de conditions tirées du segment de clé » :

```
   coffre.cosmetiques.verrouille            le cosmétique n'est pas encore débloqué
   coffre.cosmetiques.debloque              la saisie est bloquée après cinq essais (SEC-02)
   coffre.cosmetiques.vide                  aucun cosmétique n'est disponible
```

Deux lignes correctes encadrent une ligne absurde, et le contrôle conclut
« AUCUN PROBLEME ». C'est le même schéma que j'avais relevé au tour 2 de la
banque : l'instrument publie la mesure qui le met en défaut, et ne la lit pas.

**Pourquoi [MAJEUR], en connaissance de la portée.** Une seule entrée est
touchée aujourd'hui, et 287 sur 288 sont justes. Je retiens malgré tout la
gravité haute pour trois raisons :

1. **Le champ est le contrat.** `condition` est la seule information
   d'aiguillage lisible par une machine dans ces fichiers, et c'est le champ que
   le tour 1 a fait exister. Une valeur fausse y est plus dangereuse qu'une
   valeur absente : l'absence provoque une question, la fausseté non.
2. **Ce n'est pas une donnée, c'est une règle.** La correction ne consiste pas à
   réécrire une ligne mais à réparer un appariement. Toute clé future contenant
   un segment plus court en sous-chaîne recevra la même condition étrangère, et
   la table est destinée à grandir.
3. **L'ordre de la table est porteur de sens et n'est pas documenté.** `refuse`
   et `refuse_reste` cohabitent sans dommage uniquement parce que `refuse_reste`
   précède `refuse` dans la table. Cette précaution tacite n'est écrite nulle
   part : le prochain agent qui ajoutera un segment en fin de table ignorera
   qu'il doit y penser.

**Correction attendue** :
- remplacer la correspondance « première sous-chaîne trouvée » par **« segment le
  plus long qui correspond »**, ce qui répare l'entrée et immunise la table contre
  l'ordre ;
- inscrire cette règle dans `regles.conditions_par_segment`, à côté de la table,
  dans les deux fichiers ;
- ajouter au contrôle l'assertion que **tout segment publié est employé au moins
  une fois** : elle aurait suffi à lever ce défaut, puisque le segment masqué est
  resté inutilisé.

Après correction, `coffre.cosmetiques.debloque` doit porter « le cosmétique est
débloqué ».

---

## [MINEUR] 7 — Quatre entrées non nominales restent sans condition, et la liste de marqueurs qui fonde le « 0 » n'est pas publiée

Le rapport annonce, et son contrôle 5 bis imprime :

```
entrees a marqueur d'etat SANS condition : 0
```

J'ai rejoué la mesure avec **ma** liste de marqueurs, élargie de trois entrées
que la sienne ne contient pas (`attente`, `epuise`, `indispo`) :

```
entrees portant un marqueur d'etat dans la cle : 113
   -> SANS condition : 4
      [enfant] enfant.attente.pilou
      [enfant] maths.indice.epuise
      [parent] parent.resume.indispo.titre
      [parent] parent.resume.indispo.corps
```

Les quatre sont, sur le fond, non nominales :

| Clé | Texte | Quand elle s'affiche |
| --- | --- | --- |
| `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | pendant une attente IA de plus de 400 ms (TEC-12) |
| `maths.indice.epuise` | « Je t'ai tout dit. À toi de chercher. » | quand les quatre indices ont été donnés |
| `parent.resume.indispo.titre` | « Le résumé n'est pas encore prêt. » | quand le résumé n'est pas calculé |
| `parent.resume.indispo.corps` | « Il apparaîtra ici dans quelques instants. […] » | idem |

**La première est la plus gênante, parce que l'information était là où sa méthode
la cherche.** Le marketing porte, juste au-dessus de la table qui contient cette
clé :

```
  **Attente IA supérieure à 400 ms** (TEC-12) : animation « Pilou réfléchit » plus
  `son_pilou_reflechit`, avec le texte suivant.
  | `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | les_deux |
```

C'est un intertitre, exactement comme les 26 qu'il a moissonnés. Il n'a pas été
repris. Les deux `parent.resume.indispo.*` sont sous l'intertitre générique
« **États d'erreur** », cas pour lequel il bascule sur `segment_de_cle` — mais
`indispo` ne figure pas dans sa table de 25 segments. `maths.indice.epuise` n'a
pas d'intertitre : elle relève de `definie_ici`.

Le « 0 » publié est donc vrai sous sa liste de marqueurs et faux sous la mienne.
Or **cette liste n'est pas publiée**, alors que la table des 25 segments l'est :
je peux rejouer son appariement, je ne peux pas rejouer son dénombrement. C'est
la seule des mesures de ce livrable que je ne puisse pas reproduire, et c'est
celle qui porte le chiffre le plus fort du rapport.

Gravité mineure : 4 entrées sur 288, 109 des 113 entrées à marqueur sont
couvertes, le contrat ne dit rien de faux à leur sujet — il est seulement muet, et
leur clé porte l'information.

**Correction attendue** :
- `enfant.attente.pilou` → condition `intertitre` : « Attente IA supérieure à
  400 ms (TEC-12) » ;
- `parent.resume.indispo.titre` et `.corps` → ajouter le segment `indispo` à la
  table : « le résumé n'est pas encore calculé » ;
- `maths.indice.epuise` → `definie_ici` : « les quatre indices ont été donnés
  (PED-02) » ;
- **publier la liste des marqueurs d'état** à côté du chiffre, comme la table des
  segments l'est déjà.

## [MINEUR] 8 — « 27 intertitres distincts » annoncés, 26 dans les fichiers

Le rapport écrit, dans le tableau des origines : « **27 intertitres distincts**,
recollés quand ils courent sur plusieurs lignes ».

```
entrees a condition_source=intertitre : 71     (conforme)
conditions distinctes                 : 26     (annonce : 27)
```

Les 71 entrées portent 26 valeurs distinctes. L'explication bénigne est probable
— 27 intertitres moissonnés dans le document, 26 effectivement employés — mais
alors le chiffre publié décrit la moisson et non le contenu du fichier, et rien ne
le dit. C'est le seul écart entre une grandeur annoncée et sa valeur réelle sur ce
tour.

**Correction attendue** : publier « 26 intertitres distincts employés », ou
préciser « 27 moissonnés, 26 employés » et dire lequel ne sert pas — auquel cas
la question rejoint le [MINEUR] 7.

## [MINEUR] 9 — `exclusif_avec` n'est réciproque que dans les deux fichiers neufs, et ignore deux familles d'exclusivité réelles

La réciprocité **à l'intérieur des deux fichiers UI est parfaite** : 15 entrées,
15 liens, 7 paires symétriques, aucune clé pointée inexistante. Vérifié.

```
liens : 15   entrees : 15   PROBLEMES : 1
   - enfant.programme.une.titre -> enfant.programme.titre : NON RECIPROQUE
     (la soeur est portee par ['encouragements'])
fichiers portant un champ exclusif_avec : ui-enfant, ui-parent
   encouragements.json : non      gwenn-scripts.json : non
```

Ce seul cas non réciproque est **déclaré** dans `regles.exclusif_avec` (« Une clé
sœur peut vivre dans un autre fichier de content/ »), donc je ne le compte pas
comme une omission. Mais l'affirmation faite à l'Orchestrateur — « généré depuis
une liste de groupes **donc réciproque par construction** » — ne vaut que pour les
deux fichiers neufs : les deux autres fichiers de `content/` n'ont pas le champ,
et la construction ne peut donc rien y garantir.

Deux familles d'exclusivité réelle ne sont déclarées nulle part :

1. **Le corps de `/enfant/programme` a quatre candidats, pas deux.** Les deux
   clés à deux étapes sont liées entre elles ; les deux clés à une étape, portées
   par la banque, ne le sont à rien :

```
enfant.programme.corps.lecture_maths   (ui-enfant)      exclusif_avec .maths_lecture
enfant.programme.corps.maths_lecture   (ui-enfant)      exclusif_avec .lecture_maths
enfant.programme.une.corps.lecture     (encouragements) declare nulle part
enfant.programme.une.corps.maths       (encouragements) declare nulle part
```

   Les quatre remplissent le même emplacement et s'excluent quatre à quatre.

2. **Les familles de boutons d'un même emplacement.** Sur `/enfant`, quatre
   boutons se disputent la même place — `enfant.accueil.bouton` (nominal),
   `.reprise.bouton`, `.vide.bouton`, `.souci.bouton` — et aucun ne déclare les
   autres. Même chose pour `enfant.programme.bouton` et
   `enfant.programme.une.bouton`, qui portent d'ailleurs le même texte
   « Je commence ».

Gravité mineure, et c'est délibéré de ma part : dans les deux cas les
**conditions** désambiguïsent (« la lecture est programmée avant les maths » est
incompatible avec une soirée à une étape ; les trois boutons non nominaux portent
chacun leur état). `exclusif_avec` est ici un confort, non le mécanisme primaire,
et le mécanisme primaire est correct depuis la correction du tour 1. Rien de faux
n'est publié — c'est une couverture incomplète au regard de la définition que le
champ se donne, « clés qui décrivent le même emplacement d'écran ».

**Correction attendue** : soit compléter les groupes pour ces deux familles, soit
restreindre la définition publiée de `exclusif_avec` à ce qu'il couvre réellement
— « variantes d'un même texte qui se distinguent par un suffixe » — et renvoyer
le reste à `condition`.

---

# JUGEMENTS DEMANDÉS

## La mécanique d'extraction des 9 observations : réellement automatique pour les corrections, muette pour les ajouts

Vous demandez si l'extraction est réelle ou si c'est une recopie déguisée, et si
une correction faite demain arrivera dans les fichiers. Je réponds en séparant ce
que j'ai pu établir de ce que je ne peux pas établir.

**Ce que j'établis : la propagation a eu lieu, sur exactement les lignes qui ont
changé.** Cinq textes ont été corrigés à la source depuis mon tour 1 — les quatre
accords de genre et la reformulation ARB-14. Les cinq sont aujourd'hui
**identiques au caractère près** entre la table 7.12 du marketing et
`ui-parent.json` :

```
marketing 1505 : « {prenom} a demandé de l'aide sur les maths. Pilou a donné des indices, jamais les réponses. »
content/       : identique
marketing 1506 : « {prenom} a fait les maths sans demander d'indice. »          -> identique
marketing 1507 : « {prenom} a fait une pause, puis a repris la séance. »        -> identique
marketing 1510 : « {prenom} a lu le texte en breton sans aide. Pilou ne corrige pas le breton. »  -> identique
marketing 1492 : | `parent.resume.etape_faite` | « {matiere} : c'est fait » |   -> identique
marketing 1493 : | `parent.resume.etape_passee` | « {matiere} : pas ce soir » | -> identique
```

Les neuf observations sont retrouvées mot pour mot dans le document, aux lignes
1503 à 1511. Aucune divergence. Une recopie manuelle aurait, sur six textes
corrigés en parallèle, de bonnes chances de laisser au moins un écart ; il n'y en
a aucun. **Le lien est réel, et c'est un progrès net sur le tour 1** : ces neuf
textes vivaient auparavant en dur dans son générateur, et c'est pour cela que mes
trois accords manqués n'étaient pas remontés.

**Ce que je ne peux pas établir, et qu'il ne faut pas lui prêter** : je n'ai que
les sorties, pas le script. Une extraction et une recopie soignée produisent le
même fichier. Je valide donc la **cohérence**, pas la **méthode**.

**Ce que j'établis en revanche par construction, c'est la limite de la chaîne.**
La table 7.12 du marketing est une table à deux colonnes *libellé / texte* :

```
| Situation | Texte |
| Pause prise | « {prenom} a fait une pause, puis a repris la séance. » |
```

Elle ne contient **aucune clé**. L'appariement « Pause prise » →
`parent.resume.observation.pause` ne peut donc pas être déduit du document : il
est nécessairement tenu à la main quelque part dans son générateur. L'extraction
est donc **semi-automatique** : le texte suit la source, l'identifiant ne la suit
pas. Trois conséquences, et c'est la réponse à votre question :

| Événement demain dans le marketing | Arrive dans les fichiers ? |
| --- | --- |
| Un texte d'observation est **corrigé** | **Oui**, par régénération — démontré ci-dessus sur cinq textes |
| Un **libellé de ligne** est renommé (« Pause prise » → « Pause ») | **Non**. L'appariement casse en silence, ou la ligne disparaît sans bruit |
| Une **dixième observation** est ajoutée | **Non**. Aucune clé ne l'attend, et rien ne signale l'absence |

Le contrôle actuel ne rattrape pas ces deux cas : il compare 288 entrées connues à
leurs textes, donc il verrait un texte modifié non répercuté, mais **pas** une
ligne ajoutée à la source. Le compte 288 est fermé sur lui-même.

**Recommandation, une ligne de contrôle** : comparer le **nombre de lignes de la
table 7.12** au nombre de clés `parent.resume.observation.*` et échouer si les
deux diffèrent. C'est exactement le garde-fou qui manque, il est de la même nature
que « tout segment publié est employé au moins une fois » que je demande au
[MAJEUR] 6, et il ferme la seule porte par laquelle la source peut diverger
silencieusement des fichiers.

**Verdict : la chaîne tient pour les corrections, ce qui était le sujet du
[MINEUR] 2, et le [MINEUR] 2 est donc corrigé au bon niveau — la mécanique, pas
les quatre textes. Elle ne tient pas pour les ajouts, et rien ne le dit.**

## Le refus du [MINEUR] 3 : fondé, et mieux que fondé — mais son aiguillage doit être tranché

Le refus est **fondé**, pour trois raisons que je vérifie plutôt que de les
accepter :

1. **Le texte n'est pas à lui.** `parent.apercu.resume` est verbatim dans le
   marketing, ligne 1378, et mon propre tour 1 l'avait établi en même temps que
   je formulais le constat. Un agent qui réécrirait ici un texte dont un autre
   livrable est propriétaire créerait exactement la divergence silencieuse
   source/fichier que ce livrable existe pour empêcher — et que j'ai vérifiée
   absente sur 279 textes. Le corriger ici aurait été une faute.
2. **Son mandat de ce tour était les deux fichiers `ui-*.json`.** Il s'y est
   tenu.
3. **Il n'a pas seulement refusé, il a mitigé.** C'est ce qui distingue un renvoi
   commode d'un refus responsable. La paire porte désormais :

```
parent.apercu.resume      condition « deux étapes sont programmées »    exclusif_avec .resume_une
parent.apercu.resume_une  condition « une seule étape est programmée »  exclusif_avec .resume
```

   Le défaut de fond subsiste — le texte fige toujours l'ordre « lecture, maths »
   et la durée « 12 minutes » — mais il ne peut plus produire un écran faux **en
   silence** : le développeur qui câble lit une condition et une exclusivité
   explicites, et verra que le texte fixe ne respecte pas sa propre condition.
   C'est précisément la partie du problème qui relevait de lui.

**Ma seule réserve porte sur l'aiguillage, pas sur le refus.** Le rapport écrit
« Pour `BACKLOG-V2.md` si `produit-marketing` ne le reprend pas ». Une réserve
conditionnelle, sans destinataire ferme, est la façon habituelle dont un défaut
disparaît : personne ne sait qui a la main. Le constat est réel — PRD-04 autorise
le parent à réordonner, et le résumé annoncera « lecture, maths » quelle que soit
la décision du parent, avec une durée qui ne varie jamais alors que
`parent.apercu.duree` = « environ {n} min » existe deux lignes plus bas.

**Recommandation** : trancher maintenant, et pas « si ». Soit
`produit-marketing` éclate la paire par ordre et tokenise la durée, soit
l'Orchestrateur inscrit explicitement le report au backlog. Les deux sont
acceptables ; l'ambiguïté ne l'est pas.

## L'instrument ARB-14 : le resserrement n'a rien masqué

Vérification habituelle, faite avec ma propre mesure sur les **767 textes des
quatre fichiers** et non sur les 288 seuls.

ARB-14 interdit qu'un texte s'accorde avec un jeton. Le resserrement qu'il
annonce repose sur deux affirmations grammaticales, que je teste séparément.

**Affirmation 1 — « à {prenom} » et « d'{prenom} » sont corrects, un prénom ne
porte pas d'article.** Exacte. La contraction n'existe qu'avec un article défini ;
un nom propre n'en a pas. Le cas dangereux est celui d'un jeton **qui porte son
article** — `{matiere}` vaut « la lecture » ou « les maths » — et c'est là que le
défaut « On s'occupe de les maths » était né au tour 2 de la banque. Mesure :

```
(a) preposition contractante a gauche d'un jeton PORTEUR D'ARTICLE ({matiere}, {liste}) : 0
(b) preposition contractante devant TOUT jeton (version large) : 6, toutes devant {prenom}
      « Ouvrir Tipi à {prenom} »
      « Passez le téléphone à {prenom}. Pilou prend le relais. »
      « Il n'est pas demandé à {prenom}. »
      « Pierres de {prenom} aujourd'hui : {n} »
      « Ce texte reste ici. Il n'est pas affiché à {prenom}. »
      « Le code protège les réglages. Il n'est jamais montré à {prenom}. »
```

Les six sont correctes. Le resserrement est justifié, et **ce qu'il protège est
intact** : zéro occurrence du cas réellement fautif.

**Affirmation 2 — « a buté », « a demandé » sont invariables.** Exacte : le
participe passé avec `avoir` ne s'accorde qu'avec un COD antéposé. J'ai donc
cherché les deux configurations où l'accord se produit vraiment — attribut du
sujet, et participe avec COD antéposé :

```
(c) mot accorde suivant un jeton : 2
      reglages.donnees.ia    « Le prénom d'{prenom} et les photos ne lui sont jamais envoyés. »
                             -> « envoyés » s'accorde avec « prénom + photos », pas avec le jeton. Correct.
      notif.resume.titre     « La séance d'{prenom} est terminée. »
                             -> « terminée » s'accorde avec « la séance ». Correct.
```

La seconde est exactement la seule entrée que sa règle retenue signale, et dont il
imprime le verdict manuel. Je trouve la même, plus une qu'il ne signale pas
(`reglages.donnees.ia`) et qui est correcte elle aussi.

**L'exception inscrite à ARB-14 est respectée et n'a pas été « réparée »** :

```
(d) enc.accueil.01  « Bonsoir {prenom}. Je suis contente de te voir. »
```

« contente » est le féminin de Pilou, que TEC-08 fige. L'arbitrage prévoyait
qu'aucun agent ne le corrige par zèle ; il ne l'a pas fait.

**Conclusion : le resserrement n'a rien masqué.** Il écarte deux familles de faux
positifs pour des raisons grammaticales exactes, et ma mesure indépendante trouve
le même ensemble résiduel, entièrement correct.

## Ce qui était acquis n'a pas été cassé

C'était le risque de ce tour : 133 conditions ajoutées, un champ neuf, un rôle
renommé, cinq textes changés à la source. Vérifié pièce par pièce.

| Acquis du tour 1 | État au tour 2 |
| --- | --- |
| Les 279 textes identiques au caractère près | **279 identiques, 0 divergence** — revérifié sans normalisation |
| 333 clés, 0 orpheline, 0 doublon de propriété | **333 / 0 / 0** sur les quatre fichiers |
| Les 9 clés créées, verbatim | **9 verbatim**, y compris après les corrections de la source |
| `arret_avant_fin` : texte intact, condition élargie | **tenu**, texte et condition inchangés |
| Six clés mortes retirées (ARB-12) | **0 clé, 0 texte** dans les quatre fichiers ; 3 traces en prose, volontaires |
| 101 / 187 entrées, 6 / 6 écrans | **101 / 187, 6 / 6** |
| Parent intégralement en `affiche` | **187 / 187** |
| Aucun barème sur les 767 textes (ARB-13) | **0** — 5 déclenchements, tous bénins, identiques au tour 1 |
| Charte enfant : 12 mots, interdits, emoji, prénom | **121 phrases, max 10 mots, 0 dépassement, 0 interdit, 0 emoji, 0 prénom en dur** |
| Schéma régulier, jetons déclarés = présents | **0 problème sur 288** |

---

# AVIS gardien-charte — tour 2

Grille des 7 points de `.cursor/agents/gardien-charte.md`, repassée sur les **101
textes enfant** de `ui-enfant.json`, seuls textes de ce livrable destinés à
l'enfant.

Aucun texte enfant n'a changé depuis le tour 1 : la fidélité à la source est
vérifiée identique, et les modifications de ce tour portent sur `condition`,
`condition_source`, `exclusif_avec`, `role` et `jetons_connus` — des champs de
contrat, jamais du texte. Je reprends néanmoins la grille en entier.

| # | Point | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Conforme.** Aucune formulation lisible comme un reproche. |
| 2 | Interdits absolus | **Conforme.** 0 occurrence sur 18 motifs. Aucune comparaison, aucune ironie. |
| 3 | Charge : une idée par phrase, 12 mots, CE1 | **Conforme.** 121 phrases, maximum **10 mots**, 0 dépassement sous mes deux règles. |
| 4 | Pression : ni chrono, ni décompte, ni compteur, ni série | **Conforme.** Aucun chiffre en dur ; le seul nombre affiché est `coffre.solde.valeur` = `{n}`, inventaire du coffre et non score du soir (PED-07). |
| 5 | Récompense : aucune promesse réelle, aucune perte de pierres | **Conforme** (ETH-04, ETH-05). `coffre.palier.maison` : « Je garde tes pierres. Le reste se décide à la maison. » |
| 6 | Maths : rien ne conduit au résultat | **Conforme** (PED-01). Les quatre `maths.demande_resultat.*` refusent sans reprocher ; `maths.indice.epuise` clôt l'échelle sans la franchir. |
| 7 | Autonomie : la pause accessible, gratuite | **Conforme.** `session.pause.bouton`, `lecture.blocage.bouton`, `maths.blocage.bouton`, et `pause.rassurance` « Tu reviens quand tu veux. » |

Un point positif à noter, parce qu'il touche l'enfant : le rôle `action` sépare
désormais les commandes du corps de texte, et il couvre côté enfant
`lecture.modele.relire` (« Réécouter »), `lecture.question.passer` (« Je ne sais
pas ») et `session.sortie_parent.annuler`. Ce sont des cibles tactiles d'écrans
enfant, soumises au minimum de 56 px de DES-04 : les typer correctement rend cette
exigence câblable en P3. Le repli renommé `indetermine` empêche par ailleurs
qu'une valeur non classée soit rendue en corps de texte par défaut. Les deux
corrections vont au-delà de la lettre de mon constat.

Le [MAJEUR] 6 ne relève pas de cette grille : il porte sur un champ de contrat,
et le texte concerné — « Celui-là est à toi. » — est irréprochable.

AVIS: CONFORME

Motif : aucun des 101 textes enfant ne met un enfant fatigué en difficulté, ne lui
adresse un reproche, ne le compare, ne le met sous pression, ne lui promet une
récompense réelle, ne lui donne un résultat de maths, ni ne lui ferme la pause.
Aucun texte enfant n'a été modifié depuis l'avis CONFORME du tour 1, et les
changements de ce tour améliorent la typage des cibles tactiles.

---

# CHIFFRES ANNONCÉS CONTRE CHIFFRES RÉELS

Recomptés par mes propres commandes, sans lire les sorties du rapport.

| Grandeur | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- |
| Les 4 fichiers JSON valides, 0 clé dupliquée | valides, 0 | **valides, 0** | — |
| Entrées `ui-enfant.json` | 101 | **101** | — |
| Entrées `ui-parent.json` | 187 | **187** | — |
| Écrans enfant / parent | 6 / 6 | **6 / 6** | — |
| Parent intégralement en `affiche` | 187 | **187 / 187** | — |
| Textes recomparés à la source | 288 | **288** (279 par clé, 9 par texte) | — |
| Écarts de fidélité | 0 | **0** | — |
| Clés UI du marketing | 333 | **333** | — |
| Clés orphelines | 0 | **0** | — |
| Doublons de propriété (4 fichiers) | 0 | **0** | — |
| Clés hors source | 9 | **9** | — |
| Entrées avec une condition | 133 / 288 | **133 / 288** | — |
| dont `intertitre` | 71 | **71** | — |
| dont `segment_de_cle` | 41 | **41** | — |
| dont `definie_ici` | 21 | **21** | — |
| Conditions `intertitre` retrouvées mot pour mot dans la source | toutes | **26 / 26 distinctes, 71 entrées** | — |
| **Intertitres distincts** | **27** | **26** | **−1** |
| Segments publiés dans la table | 25 | **25** (dont **1 jamais employé**) | — |
| Entrées à marqueur d'état sans condition | 0 | **0** sous sa liste, **4** sous la mienne | voir [MINEUR] 7 |
| Les 15 entrées de mon échantillon traitées | 15 | **15 / 15** | — |
| Entrées portant `exclusif_avec` | 15 | **15**, 15 liens, 1 non réciproque (déclaré) | — |
| Rôle `action` | 23 | **23** | — |
| Répartition des rôles | 62/111/42/39/23/9/2 | **bouton 62, indetermine 111, corps 42, titre 39, action 23, aide 9, valeur 2** | — |
| `jetons_connus` enfant | `{n}` seul | **`{n}` seul**, et les 7 du parent tous employés | — |
| Textes enfant sous 12 mots | 101 | **121 phrases, 0 dépassement, max 10** | — |
| Emoji / prénom en dur (4 fichiers) | 0 / 0 | **0 / 0** | — |
| Textes liant le travail aux pierres (ARB-13) | 0 | **0** sur 767 | — |
| Total des textes des 4 fichiers | 767 | **767** | — |

**Vingt-deux grandeurs exactes, un écart de −1** sur « intertitres distincts »
([MINEUR] 8), et une grandeur non reproductible faute de règle publiée
([MINEUR] 7).

## Ma règle de comptage des mots

Inchangée depuis le premier tour : phrases découpées sur `.`, `!`, `?`, `…` ;
**règle souple**, l'élision reste dans le mot (« je t'aide » = 2 mots) ; **règle
stricte**, on coupe aussi sur l'apostrophe et le trait d'union (= 3 mots). Les
deux donnent ici le même résultat : maximum 10 mots, 0 dépassement.

---

# SORTIES RÉELLES DES COMMANDES

Exécutées dans `/home/user/Tipi`, sorties collées telles quelles.

## 1. Validité JSON des quatre fichiers

```
$ node -e "... JSON.parse des quatre fichiers ..."
content/ui-enfant.json      : VALIDE, version=1.0.0, cles racine=8
content/ui-parent.json      : VALIDE, version=1.0.0, cles racine=7
content/encouragements.json : VALIDE, version=2.2.0, cles racine=12
content/gwenn-scripts.json  : VALIDE, version=2.0.0, cles racine=8
---exit:0---

$ python3   # object_pairs_hook
ui-enfant        cles dupliquees : aucune
ui-parent        cles dupliquees : aucune
encouragements   cles dupliquees : aucune
gwenn-scripts    cles dupliquees : aucune
```

## 2. Comptage indépendant et schéma

```
$ python3
ENTREES: 288 | enfant 101 | parent 187
ecrans enfant : 6   parent : 6
canaux parent : {'affiche': 187}
canaux enfant : {'affiche': 47, 'les_deux': 54}
roles enfant  : {'bouton': 38, 'indetermine': 33, 'titre': 7, 'corps': 19, 'action': 3, 'valeur': 1}
roles parent  : {'indetermine': 78, 'titre': 32, 'corps': 23, 'bouton': 24, 'action': 20, 'aide': 9, 'valeur': 1}
   -> total : bouton 62, indetermine 111, corps 42, titre 39, action 23, aide 9, valeur 2

conditions non nulles : 133 / 288
condition_source : {None: 155, 'intertitre': 71, 'definie_ici': 21, 'segment_de_cle': 41}
```

Le contrôle de schéma vérifie sans anomalie, sur les 288 entrées : clé identique
à `id` ; exactement les neuf champs `id`, `ecran`, `texte`, `canal`, `role`,
`jetons`, `condition`, `condition_source`, `exclusif_avec` ; `canal` dans
l'énumération d'ARB-02 ; jetons déclarés identiques aux jetons présents ; et
**`condition` et `condition_source` toujours renseignés ou nuls ensemble, 288
fois sur 288**.

## 3. Les 71 conditions `intertitre` contre les intertitres réels de la source

Méthode : le document est reconstitué en une chaîne unique, lignes recollées,
`**` et backticks retirés des deux côtés ; chaque condition distincte est
cherchée telle quelle.

```
$ python3
entrees a condition_source=intertitre : 71
conditions distinctes : 26

  OK  ( 2)  Aucun palier défini — état vide
  OK  ( 2)  Blocage détecté (PED-08, après 3 sollicitations sans réponse exploitable)
  OK  ( 5)  Cas breton (PED-13) — texte affiché, consigne expliquée en français, pas de TTS ni de STT
  OK  ( 2)  Hésitation détectée sur un mot — situation `hesitation`
  OK  ( 4)  L'enfant demande le résultat (PED-01) — refus constant, chaleureux, sans reproche, quel que soit le nombre de demandes
  OK  ( 3)  Mode basse énergie (PRD-04)
  OK  ( 2)  Pendant l'analyse
  OK  ( 2)  Plus de 2 étapes détectées (PED-06)
  OK  ( 2)  Progression vers le palier suivant (PRD-14, ETH-05)
  OK  ( 4)  Reprise d'étape après fermeture (PRD-18)
  OK  ( 4)  Sortie anticipée, parent uniquement (PRD-13)
  OK  ( 6)  Transcription non exploitable (PED-09) — jamais une sanction
  OK  ( 1)  Variante de reprise (l'app a été fermée en cours de soirée, PRD-18)
  OK  ( 2)  Variante à une seule étape (une seule matière reconnue, matière retirée par le parent, ou mode basse énergie, PRD-04)
  OK  ( 1)  État d'erreur (état applicatif illisible, base injoignable)
  OK  ( 4)  État d'erreur — indices indisponibles (secours de TEC-07 en échec)
  OK  ( 3)  État d'erreur — le programme n'a pas pu être lu
  OK  ( 1)  État d'erreur — les devoirs n'ont pas pu être chargés
  OK  ( 3)  État d'erreur — micro refusé ou indisponible
  OK  ( 3)  État d'erreur — solde non récupérable
  OK  ( 2)  État d'erreur — voix de Pilou indisponible
  OK  ( 1)  État vide — aucun devoir préparé ce soir (PRD-16)
  OK  ( 3)  État vide — aucune photo ajoutée
  OK  ( 3)  État vide — pas de devoirs ce soir (PRD-16)
  OK  ( 4)  État vide — rien d'exploitable dans les photos
  OK  ( 2)  État vide — séance sans devoir

conditions 'intertitre' INTROUVABLES dans la source : 0
```

## 4. Les 15 entrées de mon échantillon du tour 1

```
$ python3
  OK  enfant.accueil.vide.bouton           [intertitre]      État vide — aucun devoir préparé ce soir (PRD-16)
  OK  enfant.programme.souci.titre         [intertitre]      État d'erreur — le programme n'a pas pu être lu
  OK  lecture.micro_absent.corps           [intertitre]      État d'erreur — micro refusé ou indisponible
  OK  lecture.sans_voix.corps              [intertitre]      État d'erreur — voix de Pilou indisponible
  OK  lecture.pas_entendu.corps            [intertitre]      Transcription non exploitable (PED-09) — jamais une sanction
  OK  lecture.breton.intro                 [intertitre]      Cas breton (PED-13) — texte affiché, consigne expliquée en français…
  OK  lecture.reprise.corps                [intertitre]      Reprise d'étape après fermeture (PRD-18)
  OK  maths.sans_indice.corps              [intertitre]      État d'erreur — indices indisponibles (secours de TEC-07 en échec)
  OK  coffre.souci.corps                   [intertitre]      État d'erreur — solde non récupérable
  OK  parent.apercu.echec.titre            [segment_de_cle]  la préparation du programme a échoué
  OK  parent.apercu.lancement_echec.titre  [segment_de_cle]  le lancement de la session a échoué
  OK  parent.apercu.basse_energie.actif    [intertitre]      Mode basse énergie (PRD-04)
  OK  parent.apercu.regroupe               [intertitre]      Plus de 2 étapes détectées (PED-06)
  OK  parent.apercu.reporte                [intertitre]      Plus de 2 étapes détectées (PED-06)
  OK  notif.resume.sans_devoir.titre       [segment_de_cle]  la soirée s'est déroulée sans aucun devoir

   traitees : 15 / 15
```

## 5. Entrées non nominales encore sans condition — origine du [MINEUR] 7

```
$ python3   # ma liste de marqueurs, elargie de attente / epuise / indispo
entrees portant un marqueur d'etat dans la cle : 113
   -> SANS condition : 4
      [enfant] enfant.attente.pilou            "Je regarde tes devoirs. J'arrive."
      [enfant] maths.indice.epuise             "Je t'ai tout dit. À toi de chercher."
      [parent] parent.resume.indispo.titre     "Le résumé n'est pas encore prêt."
      [parent] parent.resume.indispo.corps     'Il apparaîtra ici dans quelques instants. La séance est bien enregistrée.'

$ sed -n '...' docs/agents/P1/produit-marketing.out.md   # contexte de enfant.attente.pilou
**Attente IA supérieure à 400 ms** (TEC-12) : animation « Pilou réfléchit » plus
`son_pilou_reflechit`, avec le texte suivant.
| Clé | Texte | Mode |
| `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | les_deux |
   -> un intertitre existe, il n'a pas ete moissonne

$ sed -n '...'   # contexte de parent.resume.indispo.*
**États d'erreur**
| `parent.resume.indispo.titre` | « Le résumé n'est pas encore prêt. » |
| `parent.resume.indispo.corps` | « Il apparaîtra ici dans quelques instants. La séance est bien enregistrée. » |
   -> intertitre generique ; le segment `indispo` manque a la table des 25
```

## 6. Collision de segments — origine du [MAJEUR] 6

```
$ python3   # pour chaque entree segment_de_cle : la condition est-elle celle du segment le plus specifique ?
entrees segment_de_cle : 41
INCOHERENTES           : 1
   [enfant] coffre.cosmetiques.debloque
        condition assignee : 'la saisie est bloquée après cinq essais (SEC-02)'
        segment le plus specifique = 'cosmetiques.debloque' -> 'le cosmétique est débloqué'
        texte              : 'Celui-là est à toi.'

$ python3   # lecture directe des quatre entrees voisines
   coffre.cosmetiques.debloque    cond='la saisie est bloquée après cinq essais (SEC-02)'   src='segment_de_cle'
   coffre.cosmetiques.verrouille  cond="le cosmétique n'est pas encore débloqué"            src='segment_de_cle'
   coffre.cosmetiques.vide        cond="aucun cosmétique n'est disponible"                   src='segment_de_cle'
   reglages.code.bloque.titre     cond='la saisie est bloquée après cinq essais (SEC-02)'   src='segment_de_cle'

$ python3   # segments publies employes ou non
   segments publies : 25   conditions distinctes employees : 23
      NON EMPLOYE : cosmetiques.debloque -> 'le cosmétique est débloqué'
```

Et la même ligne, telle que son propre contrôle 5 bis l'imprime :

```
exemples de conditions tirees du segment de cle :
   coffre.cosmetiques.verrouille            le cosmétique n'est pas encore débloqué
   coffre.cosmetiques.debloque              la saisie est bloquée après cinq essais (SEC-02)
   coffre.cosmetiques.vide                  aucun cosmétique n'est disponible
```

## 7. Réciprocité de `exclusif_avec` sur les quatre fichiers

```
$ python3
liens : 15   entrees : 15
PROBLEMES : 1
   - enfant.programme.une.titre -> enfant.programme.titre : NON RECIPROQUE (porte par ['encouragements'])
fichiers portant un champ exclusif_avec : ui-enfant, ui-parent
   encouragements.json : False      gwenn-scripts.json : False

   les 15 liens, tous vers des cles existantes :
   coffre.cosmetiques.debloque          <-> coffre.cosmetiques.verrouille
   coffre.palier.atteint                <-> coffre.palier.reste
   enfant.programme.corps.lecture_maths <-> enfant.programme.corps.maths_lecture
   enfant.programme.une.titre            -> enfant.programme.titre        (cross-fichier)
   lecture.intro.titre.premier          <-> lecture.intro.titre.apres
   maths.intro.titre.premier            <-> maths.intro.titre.apres
   parent.apercu.resume                 <-> parent.apercu.resume_une
   parent.resume.etape_faite            <-> parent.resume.etape_passee
```

## 8. Fidélité : les 288 textes contre la source, sans normalisation

```
$ python3
cles dans les tables du marketing : 333
  identiques au caractere pres : 279
  DIVERGENTES                  : 0
  absentes des tables          : 9   (les 9 observations, dont le marketing donne le texte sans cle)
```

## 9. Les 9 observations contre la table 7.12 d'aujourd'hui

```
$ python3
  EXACT  parent.resume.observation.lecture_fluide     ligne 1503
  EXACT  parent.resume.observation.hesitations        ligne 1504
  EXACT  parent.resume.observation.maths_indices      ligne 1505   « Pilou a donné des indices, jamais les réponses. »
  EXACT  parent.resume.observation.maths_sans_indice  ligne 1506   « a fait les maths sans demander d'indice. »
  EXACT  parent.resume.observation.pause              ligne 1507   « a fait une pause, puis a repris la séance. »
  EXACT  parent.resume.observation.blocage            ligne 1508
  EXACT  parent.resume.observation.soir_leger         ligne 1509
  EXACT  parent.resume.observation.breton             ligne 1510   « a lu le texte en breton sans aide. »
  EXACT  parent.resume.observation.arret_avant_fin    ligne 1511

$ python3   # les deux cles ARB-14 du resume
  parent.resume.etape_faite   = "{matiere} : c'est fait"   marketing ligne 1492 : identique
  parent.resume.etape_passee  = '{matiere} : pas ce soir'  marketing ligne 1493 : identique

$ sed -n '1499,1512p'   # la table 7.12 est a deux colonnes libelle / texte, sans cle
**Observations types**, générées à partir de faits de session :
| Situation | Texte |
| --- | --- |
| Lecture fluide | « {prenom} a lu le texte en entier, sans s'arrêter longtemps. » |
| Pause prise | « {prenom} a fait une pause, puis a repris la séance. » |
   -> l'appariement libelle -> cle n'est pas dans le document : il est tenu a la main
```

## 10. ARB-14, mesure indépendante sur les 767 textes

```
$ python3
(a) preposition contractante a gauche d'un jeton PORTEUR D'ARTICLE ({matiere}, {liste}) : 0
(b) preposition contractante devant TOUT jeton (version large) : 6, toutes devant {prenom} :
      parent.scan.sans_devoir.valider     'Ouvrir Tipi à {prenom}'
      parent.apercu.passage_enfant        'Passez le téléphone à {prenom}. Pilou prend le relais.'
      reglages.code.creation.corps        "Il n'est pas demandé à {prenom}."
      reglages.paliers.solde              "Pierres de {prenom} aujourd'hui : {n}"
      reglages.paliers.description_aide   "Il n'est pas affiché à {prenom}."
      reglages.codeparent.corps           "Il n'est jamais montré à {prenom}."
(c) mot accorde suivant un jeton (attribut ou participe avec COD anteposé) : 2
      reglages.donnees.ia   '{prenom} et les photos ne lui sont jamais envoyés'  -> accord sur « prénom + photos »
      notif.resume.titre    "La séance d'{prenom} est terminée."                 -> accord sur « la séance »
(d) exception ARB-14 (feminin de Pilou) :
      enc.accueil.01        'Bonsoir {prenom}. Je suis contente de te voir.'     -> preservee
```

## 11. ARB-13, emoji, prénom en dur — les 767 textes

```
$ python3
TOTAL textes : 767 {'ui-enfant': 101, 'ui-parent': 187, 'encouragements': 460, 'gwenn-scripts': 19}

=== ARB-13 : bareme ? (23 motifs) — 5 declenchements, aucun bareme ===
   [recompense]        reglages.menu.paliers / reglages.paliers.titre  'Paliers de récompense'
                       reglages.paliers.corps  'Vous définissez le palier et vous donnez la récompense.
                                                Tipi compte seulement les pierres.'   -> enonce exact d'ETH-05
   [nombre de pierres] reglages.paliers.gems   'Nombre de pierres'                    -> libelle de saisie parent
   [par etape]         enc.indice_demande_4.04 "On déroule l'exercice ensemble, étape par étape."
   [chaque etape]      enc.indice_demande_4.09 "Je t'explique chaque étape. Tu comptes."
   [tu gagnes .. pierre] bienvenue.3.corps_2   'Tu gagnes des pierres. Elles restent à toi.'  -> aucune quantite

emoji : 0        Evan/Gwenn en dur : []
```

## 12. Couverture des 333 clés et charte enfant

```
$ python3
cles marketing : 333 | porteurs : 342
ORPHELINES (marketing sans porteur)  : 0
HORS SOURCE (content sans marketing) : 9   (les 9 observations)
DOUBLONS DE PROPRIETE                : aucun

=== CHARTE ENFANT : 101 textes ===
  phrases : 121 | >12 strict : 0 | >12 souple : 0
  max strict : 10 | max souple : 10
     10/10 lecture.sans_voix.corps        Je ne peux pas lire à voix haute ce soir
     10/ 8 coffre.cosmetiques.vide        Il n'y a rien à mettre pour l'instant
      9/ 6 maths.sans_indice.corps        Je n'ai pas d'indice pour celui-là
      8/ 7 enfant.programme.souci.titre   Je n'arrive pas à ouvrir le programme
  interdits : 0
  {prenom} cote enfant : []

$ python3   # jetons declares contre jetons employes
ui-enfant : declares = {n}                 employes = {'{n}': 3}     -> exact
ui-parent : declares = 7 jetons            employes = les 7          -> exact
```

---

# HISTORIQUE — TOUR 1

Verdict du tour 1 : **FAIL**, 0 [BLOQUANT], 1 [MAJEUR], 4 [MINEUR],
`AVIS gardien-charte : CONFORME`. Vingt grandeurs annoncées, vingt exactes.

| # | Gravité | Constat | Sort au tour 2 |
| --- | --- | --- | --- |
| 1 | [MAJEUR] | `condition` à `null` sur 85 entrées non nominales, contre la règle publiée par le fichier ; `parent.apercu.resume` et `.resume_une` tous deux déclarés nominaux | **CORRIGÉ**, par la voie (a) : 133 conditions renseignées, origine déclarée dans `condition_source`, 71 reprises d'intertitres que j'ai toutes retrouvées dans la source, 15/15 de mon échantillon traitées, la paire `resume` / `resume_une` séparée par condition et par exclusivité. Un défaut neuf est né de la correction : [MAJEUR] 6 |
| 2 | [MINEUR] | Trois accords de genre manqués en plus de celui qu'il signalait | **CORRIGÉ au bon niveau.** Les quatre textes ont été repris par `produit-marketing`, et surtout la mécanique a changé : les 9 observations ne sont plus en dur dans le générateur. Les cinq textes corrigés à la source sont byte-identiques dans les fichiers. Limite nommée plus haut : la chaîne ne couvre pas les ajouts de ligne |
| 3 | [MINEUR] | `parent.apercu.resume` fige le nombre d'étapes, l'ordre des matières et la durée | **NON REPRIS, et le refus est fondé** : le texte appartient au marketing, et il a fait ce qui relevait de lui — condition explicite et exclusivité déclarée, donc plus d'écran faux en silence. Réserve sur l'aiguillage, non sur le refus |
| 4 | [MINEUR] | `ui-enfant.jetons_connus` déclarait 6 jetons jamais employés, dont un « jamais montré à l'enfant » | **CORRIGÉ.** `jetons_connus` est calculé à partir des jetons réellement employés : `{n}` seul côté enfant, 7 employés sur 7 côté parent. Vérifié |
| 5 | [MINEUR] | Le rôle `texte` attribué à des commandes, dont « Tout supprimer » | **CORRIGÉ par les deux voies proposées** : rôle `action` sur 23 entrées, et repli renommé `indetermine`. Vérifié : 23 `action`, dont « Tout supprimer », « Supprimer ce palier », « Réécouter », « Je ne sais pas » |

---

# SYNTHÈSE DU TOUR 2

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | — |
| **[MAJEUR]** | **1** | 6 — condition fausse sur `coffre.cosmetiques.debloque`, par collision de sous-chaîne dans le générateur de segments |
| **[MINEUR]** | **3** | 7 (4 entrées non nominales sans condition, liste de marqueurs non publiée), 8 (« 27 intertitres » annoncés, 26 réels), 9 (`exclusif_avec` incomplet) |

**VERDICT: FAIL**, mécaniquement : un seul [MAJEUR] impose FAIL.

## Ce que coûte la reprise

Le [MAJEUR] est une ligne de code et une ligne de règle. Les trois [MINEUR] sont
quatre conditions, un chiffre et un choix de périmètre. C'est le tour le plus
court des cinq que j'ai contrôlés sur ce projet.

| Constat | Action | Ampleur |
| --- | --- | --- |
| 6 | Apparier au **segment le plus long**, inscrire la règle à côté de la table, ajouter l'assertion « tout segment publié est employé » | 1 règle de code + 1 phrase + 1 contrôle |
| 7 | Ajouter 4 conditions (1 intertitre, 1 segment neuf `indispo`, 1 `definie_ici`) et **publier la liste des marqueurs** | 4 entrées + 1 liste |
| 8 | Publier « 26 employés », ou « 27 moissonnés, 26 employés » | 1 chiffre |
| 9 | Compléter les deux familles, ou restreindre la définition publiée de `exclusif_avec` | au choix |
| — | Garde-fou recommandé : comparer le nombre de lignes de la table 7.12 au nombre de clés `observation.*` | 1 contrôle |

## Ce qui est acquis et ne sera pas recontrôlé

- **Les vingt-deux grandeurs exactes**, dont les 279 textes identiques au
  caractère près, les 333 clés sans orpheline ni doublon, les 101/187 entrées,
  les 6/6 écrans, les 187 `affiche`, et 0 barème sur 767 textes.
- **Les 71 conditions `intertitre`**, dont les 26 valeurs distinctes sont
  retrouvées mot pour mot dans la source.
- **Les 15 entrées de mon échantillon du tour 1**, toutes traitées.
- **La réciprocité de `exclusif_avec`** à l'intérieur des deux fichiers UI, et
  l'absence de lien vers une clé inexistante.
- **ARB-14**, vérifiée indépendamment : 0 préposition contractante devant un
  jeton porteur d'article, 0 accord avec un jeton, exception de Pilou préservée.
- **ARB-12**, toujours tenu : 0 clé, 0 texte, 3 traces volontaires.
- **La mécanique d'extraction des observations**, pour les corrections.
- L'`AVIS gardien-charte`, **CONFORME**.
