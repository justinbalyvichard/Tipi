VERDICT: FAIL

# Contrôle de `contenu-enfant` — `content/encouragements.json`, `content/gwenn-scripts.json`

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Sources du contrôle : `TIPI-PROMPT-CURSOR.md` §1, §2, §3 et §5.1 (fiche
`contenu-enfant`), `.cursor/rules/00-charte-tipi.mdc`,
`.cursor/rules/30-copy-enfant.mdc`, `docs/agents/P1/produit-marketing.out.md`,
`docs/agents/P1/produit-marketing.review.md`, `docs/agents/P1/contenu-enfant.out.md`.

## Résumé de la position

**Les compteurs annoncés sont vrais.** Recomptés indépendamment : 16 situations,
20 variantes chacune, 320 variantes, 339 entrées, 591 phrases, 0 dépassement de
12 mots, 0 mot interdit, 0 emoji, 0 chiffre, 0 prénom en dur, 339 identifiants
et 339 textes uniques. **Aucun écart.** Sur les onze chiffres annoncés, les onze
se vérifient à l'unité près, y compris la phrase la plus longue nommée
(`enc.blocage.02`, 10 mots). Le producteur n'a inventé aucune sortie de commande.
C'est acquis, et c'est dit d'emblée.

Le FAIL ne porte pas sur les compteurs. Il porte sur le **raccordement des
textes au produit** : le champ `cles_ui`, que le rapport présente comme la preuve
de traçabilité avec le marketing, désigne pour cinq clés des clés **retirées**
par la correction du livrable marketing, pour une clé la **ligne invariante du
rituel de fermeture** (ce qui casse PED-12 dans le fichier lui-même), et pour
quatre clés les **quatre niveaux d'indices** alimentés par un seul tirage
aléatoire (ce qui casse PED-02). Par ailleurs `photo_illisible` dit à l'enfant
exactement ce que le marketing a décidé de ne jamais lui dire, et le rapport
affirme le contraire.

---

# CONSTATS

## [MAJEUR] 1 — `cloture` déclare alimenter `bravo.titre`, la ligne invariante du rituel de fermeture (PED-12)

`content/encouragements.json`, situation `cloture` :

```json
"cles_ui": ["transition.felicitation", "bravo.titre"]
```

`bravo.titre` est la **première ligne du rituel invariant**, définie dans
`content/gwenn-scripts.json` sous `rituels.rituel_fermeture`, dont la `note` dit
mot pour mot : « Aucune variante n'est autorisée ici ». Le fichier de banque
déclare donc ses 20 variantes comme source d'une clé que l'autre fichier déclare
non variable. Les deux fichiers se contredisent.

Le rapport §5.4 écrit : « La banque `cloture` **précède** le rituel et ne le
remplace jamais. Cette règle est inscrite dans le champ `note` de la situation
`cloture`, pour qu'un développeur ou un contrôleur la lise dans le fichier
lui-même. » La `note` dit effectivement cela. Le champ `cles_ui`, lu par la même
personne dans le même objet, dit l'inverse. Un développeur qui câble la banque
sur ses `cles_ui` déclarées fait varier `bravo.titre` chaque soir et viole PED-12
sans jamais avoir lu la `note`.

**Correction attendue** : retirer `"bravo.titre"` de
`situations.cloture.cles_ui`. La banque `cloture` n'alimente aucune clé de
l'écran `/enfant/bravo`. Si une clé UI est nécessaire pour la phrase dite à la
fin de la dernière étape, elle doit être créée côté marketing sous un nom
distinct du rituel (par exemple `transition.cloture.corps`) et déclarée à la
place.

## [MAJEUR] 2 — Cinq clés déclarées dans `cles_ui` n'existent plus dans le livrable marketing corrigé

`docs/agents/P1/produit-marketing.out.md` a été repris après son `VERDICT: FAIL`.
Son [MAJEUR] n°1 (ligne 25 du livrable) énonce : « Les clés
`enfant.programme.corps`, `enfant.programme.une.corps`, `lecture.intro.titre`,
`maths.intro.titre`, `transition.felicitation` et `transition.annonce` sont
éclatées en variantes par ordre et par matière ». Les clés d'origine ont donc
disparu des tables de clés.

`content/encouragements.json` déclare toujours les clés d'avant la correction :

| Clé déclarée par `contenu-enfant` | Situation | Ce qui existe réellement dans le marketing |
| --- | --- | --- |
| `enfant.programme.corps` | `annonce_programme` | `enfant.programme.corps.lecture_maths`, `enfant.programme.corps.maths_lecture` |
| `lecture.intro.titre` | `avant_lecture` | `lecture.intro.titre.premier`, `lecture.intro.titre.apres` |
| `maths.intro.titre` | `avant_maths` | `maths.intro.titre.premier`, `maths.intro.titre.apres` |
| `transition.annonce` | `transition_etapes` | `transition.annonce.lecture`, `transition.annonce.maths` |
| `transition.felicitation` | `transition_etapes`, `cloture` | `transition.felicitation.lecture`, `transition.felicitation.maths` |

Le rapport §9 présente `cles_ui` comme la garantie de cohérence : « Chaque
situation déclare les clés du marketing qu'elle alimente, dans `cles_ui` ». Cinq
de ces déclarations pointent dans le vide. Le rapport §10.6 signale la
dépendance (« Les clés déclarées dans `cles_ui` doivent être re-vérifiées après
la correction ») mais livre quand même les anciennes clés : la réserve est
posée, le défaut n'est pas corrigé.

**Correction attendue** : remplacer les cinq clés par les clés éclatées
correspondantes. `transition_etapes` déclare
`transition.felicitation.lecture`, `transition.felicitation.maths`,
`transition.annonce.lecture`, `transition.annonce.maths` ;
`avant_lecture` déclare `lecture.intro.titre.premier`,
`lecture.intro.titre.apres` ; `avant_maths` déclare
`maths.intro.titre.premier`, `maths.intro.titre.apres` ;
`annonce_programme` déclare `enfant.programme.corps.lecture_maths`,
`enfant.programme.corps.maths_lecture`.

## [MAJEUR] 3 — Aucune variante ne dit quelle clé elle remplit, alors que 14 situations sur 16 en déclarent de 2 à 4

`cles_ui` est porté par la **situation**, jamais par la **variante**. Une
`variante` n'a que quatre champs : `id`, `texte`, `canal`, `jetons`. Aucun ne dit
à laquelle des clés déclarées la phrase est destinée.

Le cas le plus net est `accueil`, qui déclare `enfant.accueil.titre` et
`enfant.accueil.corps`. Le marketing les définit séparément :
`enfant.accueil.titre` = « Bonsoir Evan. », `enfant.accueil.corps` = « Je suis
contente de te voir. » La banque livre la réunion des deux en une seule chaîne :

```
enc.accueil.01 : "Bonsoir {prenom}. Je suis contente de te voir."
```

Il n'existe aucune règle, dans le fichier ni dans le rapport, pour remplir deux
emplacements distincts à partir d'une chaîne unique. Même situation pour
`avant_maths` (3 clés), `demande_pause` (3 clés), `photo_illisible` (3 clés),
`reprise_session` (4 clés), `indice_demande` (4 clés). Seules `hesitation` et
`retour_de_pause` déclarent une clé unique et sont donc réellement câblables.

Le rapport §1.4 affirme : « Le fichier se type sans transformation ». C'est vrai
du typage TypeScript, et faux de la consommation : le type compile, le câblage à
l'écran reste indécidable.

**Correction attendue** : au choix, et le choix doit être tranché dans le
livrable, pas laissé au développeur —
(a) ajouter à `Variante` un champ `cle_ui: string` désignant la clé exacte que
la variante remplit, et porter chaque situation à 20 variantes **par clé
déclarée** ; ou
(b) remplacer `texte: string` par `parties: { cle_ui: string; texte: string }[]`,
une variante fournissant alors le titre et le corps d'un même écran ; ou
(c) ramener chaque situation à une seule `cles_ui` et déclarer explicitement que
les autres clés de l'écran sont fixes et vivent dans `gwenn-scripts.json`.

## [MAJEUR] 4 — `indice_demande` : un seul tirage aléatoire pour les quatre niveaux d'indices (PED-02)

`situations.indice_demande.cles_ui` déclare les quatre clés
`maths.indice.1.amorce`, `maths.indice.2.amorce`, `maths.indice.3.amorce`,
`maths.indice.4.amorce`. La règle de sélection du fichier est :

```json
"selection": "Tirage aléatoire sans répétition immédiate dans la liste variantes de la situation."
```

Le marketing définit quatre amorces distinctes, une par niveau, et elles ne sont
pas interchangeables :

| Clé | Texte marketing |
| --- | --- |
| `maths.indice.1.amorce` | « Je te pose une question, pour t'aider. » |
| `maths.indice.2.amorce` | « On peut faire autrement. Écoute. » |
| `maths.indice.3.amorce` | « Je te montre un exemple plus facile. » |
| `maths.indice.4.amorce` | « On le fait ensemble, tout doucement. » |

Plusieurs variantes de la banque décrivent le contenu d'un niveau précis et
seraient tirées au hasard pour n'importe lequel des quatre :

- `enc.indice_demande.05` : « Je te pose une question, pour t'aider. » — c'est
  l'amorce de **niveau 1**, mot pour mot.
- `enc.indice_demande.18` : « Voilà un exemple plus facile. Regarde-le bien. » —
  c'est le **niveau 3** (PED-02 : « un exemple analogue avec des nombres plus
  simples »).
- `enc.indice_demande.17` : « Je t'aide autrement. On change de méthode. » et
  `enc.indice_demande.09` : « Je t'explique une façon de faire. » — c'est le
  **niveau 2** (« une suggestion de méthode concrète »).
- `enc.indice_demande.19` : « On refait le chemin ensemble, tout doucement. » —
  c'est le **niveau 4** (« une résolution guidée pas à pas »).

Conséquence concrète pour l'enfant : au premier appui sur « un petit indice ? »,
Pilou peut annoncer « Voilà un exemple plus facile. Regarde-le bien. » puis
poser une question ouverte sans aucun exemple. Au quatrième appui, elle peut
annoncer « Je te pose une question, pour t'aider. » puis dérouler la résolution
guidée. L'annonce décrit autre chose que ce qui suit. PED-02 décrit une échelle
**progressive** ; le tirage aléatoire l'aplatit.

La `note` de la situation dit : « Aucune amorce ne dit le rang de l'indice ».
C'est exact et hors sujet : le problème n'est pas le rang énoncé, c'est le
contenu annoncé.

**Correction attendue** : éclater `indice_demande` en quatre sous-banques
explicites — `indice_demande_1`, `indice_demande_2`, `indice_demande_3`,
`indice_demande_4` — de 20 variantes chacune, chaque sous-banque déclarant sa
clé unique, et chaque variante restant neutre à l'intérieur de son niveau.
PED-11 impose alors 80 variantes sur cet écran. Si l'Orchestrateur juge ce
volume disproportionné, l'alternative acceptable est une seule banque de 20
amorces **strictement neutres quant au contenu de l'indice** (du type
« Écoute bien. », « Voilà de quoi réfléchir. Prends ton temps. »), en retirant
les six variantes 05, 07, 09, 17, 18, 19 et en les remplaçant.

## [MAJEUR] 5 — `photo_illisible` dit à l'enfant ce que le marketing a décidé de ne jamais lui dire, et le rapport affirme le contraire

`docs/agents/P1/produit-marketing.out.md`, table des états limites (ligne 1719) :

```
| **OCR illisible** | `parent.scan.illisible.*` (7.10) | jamais montré à l'enfant | Reprendre la photo ou saisir à la main |
```

Les deux clés enfant de cet état sont, côté marketing :
`enfant.accueil.souci.titre` = « Je cherche encore tes devoirs. »,
`enfant.accueil.souci.corps` = « Tu peux aller voir ton coffre. »,
`enfant.accueil.souci.bouton` = « Voir mon coffre ». Pilou **cherche encore**, et
l'enfant a une porte de sortie.

Le rapport §8, arbitrage 2, affirme : « **Les 20 variantes ne parlent jamais
d'OCR, de photo ratée ni du parent.** » Dix variantes sur vingt nomment le
support et son défaut :

```
enc.photo_illisible.01  "Je n'arrive pas à lire la feuille."
enc.photo_illisible.02  "L'image est un peu floue pour moi."
enc.photo_illisible.05  "La photo est sombre. Je ne vois pas les mots."
enc.photo_illisible.06  "Je n'ai pas réussi à lire le cahier."
enc.photo_illisible.08  "L'écriture se cache. Je la cherche encore."
enc.photo_illisible.10  "La feuille est difficile à lire pour moi."
enc.photo_illisible.13  "La photo ne me dit pas grand-chose."
enc.photo_illisible.14  "Je relis la feuille, tout doucement."
enc.photo_illisible.16  "Je n'ai pas tout compris sur l'image."
enc.photo_illisible.19  "L'image reste floue. Je continue à chercher."
```

« La photo est sombre. » nomme la photo et son défaut. « Je n'ai pas réussi à
lire le cahier. » est un constat d'échec au passé composé, sans suite. L'affirmation
du rapport est fausse, et elle est fausse sur le point précis que l'arbitrage
prétendait traiter.

Second volet : **17 variantes sur 20 ne proposent aucune action**. Seules `03`
(« Patiente un peu. »), `17` (« Tu peux voir ton coffre. ») et `18`
(« Patience. ») donnent une suite ; une seule, `17`, donne une action réelle.
PRD-16 exige un texte bienveillant **et une sortie** ; la traçabilité du
marketing (ligne 1854) l'écrit : « Les quatre états limites ont un texte
bienveillant et **au moins une action de sortie** ». Un enfant fatigué qui
tombe sur `enc.photo_illisible.05` lit « La photo est sombre. Je ne vois pas les
mots. » et n'a rien à faire.

**Correction attendue** : réécrire les dix variantes citées pour que Pilou soit
**en train de chercher** et non en train d'échouer, sans jamais nommer la photo,
l'image, la feuille ni le cahier — sur le modèle de la clé marketing
« Je cherche encore tes devoirs. » Ajouter à chacune des 20 variantes, ou à la
clé `enfant.accueil.souci.corps` qu'elles alimentent, la sortie « Tu peux aller
voir ton coffre. » Exemples de réécriture directement applicables :
`01` → « Je cherche encore tes devoirs. Va voir ton coffre. » ;
`05` → « Je regarde encore. Tu peux aller voir ton coffre. » ;
`06` → « Je n'ai pas fini de chercher. Le coffre t'attend. » ;
`13` → « Je cherche toujours. Ça peut prendre un moment. »

## [MAJEUR] 6 — `blocage` déclare alimenter `lecture.blocage.corps`, dont aucune variante ne porte le sens

`situations.blocage.cles_ui` déclare `maths.blocage.corps` **et**
`lecture.blocage.corps`. Les deux clés n'ont pas le même sens dans le marketing :

| Clé | Texte marketing | Cause réelle |
| --- | --- | --- |
| `maths.blocage.corps` | « Celui-là est difficile. C'est normal. » | l'exercice résiste |
| `lecture.blocage.corps` | « Le micro n'entend pas bien ce soir. » | **le microphone** n'a rien capté (PED-09) |

`enc.blocage.01` reprend mot pour mot `maths.blocage.corps`. Aucune des 20
variantes ne parle du micro, de la voix ni de l'écoute. Le tirage aléatoire
enverrait donc sur un échec de reconnaissance vocale des phrases comme
`enc.blocage.03` « Cet exercice résiste. Ça arrive souvent. » ou
`enc.blocage.10` « Cet exercice est costaud. » : l'application attribue à
l'enfant et à la difficulté du texte une panne qui est la sienne. PED-09 exige
l'inverse — « jamais de sanction automatique sur une transcription, toujours
"je n'ai pas bien entendu, tu peux répéter ?" ».

**Correction attendue** : séparer la situation en `blocage_maths` et
`blocage_lecture`, chacune avec 20 variantes et sa clé propre. Les 20 variantes
de `blocage_lecture` doivent mettre la panne du côté de Pilou et du micro
(« Je n'ai pas bien entendu. », « Le micro n'entend pas bien ce soir. »,
« Ma voix t'écoute mal. On recommence ? ») et jamais du côté de la difficulté de
l'exercice.

## [MAJEUR] 7 — Le rituel de fermeture inverse l'arbitrage DES-06 du marketing, et le rapport le présente comme repris mot pour mot

Le rapport §9 : « L'onboarding (7.2) et le rituel de clôture (7.8) sont repris
**mot pour mot** dans `gwenn-scripts.json`. »

Séquence du marketing (7.8), avec sa décision datée :

```
| 6 | `bravo.bouton_principal`  | « Aller jouer »    | affiche |
| 7 | `bravo.bouton_secondaire` | « Voir mon coffre » | affiche |
```

> **Décision DES-06 sur la hiérarchie des deux boutons** (reprise du 2026-09-20) :
> l'action principale de la clôture est **« Aller jouer »**. [...] Motif : le
> rituel du soir doit se terminer sur la sortie de l'application, pas sur
> l'inventaire des pierres. Terminer sur le coffre reviendrait à clore la soirée
> sur le décompte de ce qui a été obtenu, ce que PRD-11 et PED-05 refusent.

Ce qui est livré dans `content/gwenn-scripts.json` :

```json
{ "id": "bravo.bouton",   "ordre": 8, "role": "bouton", "texte": "Voir mon coffre" }
{ "id": "bravo.bouton_2", "ordre": 9, "role": "bouton", "texte": "Aller jouer"     }
```

Trois écarts, tous sur la même ligne du rapport :
1. les identifiants `bravo.bouton` et `bravo.bouton_2` **n'existent pas** dans le
   marketing, qui définit `bravo.bouton_principal` et `bravo.bouton_secondaire` ;
2. l'**ordre est inversé** : le fichier place « Voir mon coffre » avant
   « Aller jouer », alors que sa propre règle
   `"Elles sont jouées telles quelles, dans l'ordre du champ ordre"` fait de
   `ordre` le pilote du rendu ;
3. le champ `role` vaut `"bouton"` pour les deux : **rien dans le fichier ne
   distingue l'action principale de l'action secondaire**, donc rien ne porte
   l'arbitrage PRD-11 / PED-05 que le marketing a explicitement motivé.

Le rituel de fermeture est la séquence que l'enfant entend tous les soirs de
l'année. Une inversion silencieuse à cet endroit est précisément ce que le
contrôle croisé doit arrêter.

**Correction attendue** : renommer `bravo.bouton` → `bravo.bouton_secondaire`
(« Voir mon coffre ») et `bravo.bouton_2` → `bravo.bouton_principal`
(« Aller jouer »), et fixer `ordre: 8` sur `bravo.bouton_principal`,
`ordre: 9` sur `bravo.bouton_secondaire`. Ajouter un champ
`role: "bouton_principal" | "bouton_secondaire"` ou, à défaut, un champ
`hierarchie` explicite, pour que l'arbitrage survive au fichier.

## [MAJEUR] 8 — Deux vocabulaires normatifs pour l'énumération « canal », dans deux livrables de la même phase, laissés non résolus

Qualification demandée. Voici la mienne.

`produit-marketing.out.md` §3 (lignes 359-364) définit l'énumération
`dit` / `affiche` / `dit_affiche` et la porte sur **330 clés** de ses tables.
`encouragements.json` et `gwenn-scripts.json` définissent `tts` / `affiche` /
`les_deux` et la portent sur **339 entrées**. Même notion, deux énumérations, un
seul recouvrement (`affiche`), zéro mapping exécutable — la correspondance
n'existe que dans une phrase du rapport (arbitrage 3).

Le rapport renvoie la décision à plus tard : « À harmoniser dans un seul sens
avant le développement de V1 », et §10.1 « Décision attendue de l'Orchestrateur ».

Je ne l'accepte pas comme une réserve, pour trois raisons :

1. **Ce n'est pas un arbitrage difficile.** Il n'oppose aucune exigence
   pédagogique à aucune contrainte technique. C'est un choix de nom, il coûte
   une passe de renommage, et le producteur était en position de le trancher
   puisqu'il était le second des deux livrables et connaissait le premier.
2. **Le coût croît avec l'attente.** Aujourd'hui, 669 entrées dans deux fichiers
   de contenu. Après P2 et P3, l'énumération sera figée dans un type TypeScript,
   dans le schéma Prisma et dans la clé du cache TTS (TEC-09b).
3. **Le prompt maître ne l'impose pas.** §5.1, fiche `contenu-enfant`, dit
   seulement : « Indiquer pour chaque entrée si elle est lue par TTS, affichée,
   ou les deux. » Le rapport écrit « Les fichiers portent `tts`, `affiche`,
   `les_deux`, **comme demandé** » : aucune source ne demande ces trois chaînes
   précises. C'est une invention de convention, présentée comme une contrainte
   reçue, en travers d'une convention déjà posée par le livrable amont.

Ce n'est pas un [BLOQUANT] : rien n'atteint l'enfant. C'est un [MAJEUR] : c'est
une divergence de schéma entre deux livrables d'une même phase, que la porte G1
a précisément pour fonction de ne pas laisser passer.

**Correction attendue** : trancher dans ce livrable. Ma recommandation, si
l'Orchestrateur veut un sens par défaut : garder `tts` / `affiche` / `les_deux`
dans les fichiers de contenu — `tts` nomme le mécanisme réel et se raccorde à
TEC-08 et TEC-09b — et faire porter le renommage par le livrable marketing, dont
les modes ne sont que la colonne d'un tableau et non un schéma de données.
Quel que soit le sens retenu, la décision doit être écrite dans les deux
livrables et une seule énumération doit survivre à la fermeture de G1.

---

## [MINEUR] 9 — `pas_de_devoirs` est la seule banque dont les variantes se recouvrent

Mesure indépendante, indice de Jaccard sur les mots pleins (mots-outils retirés),
à l'intérieur de chaque situation. Sur les 16 situations, 11 paires dépassent
0,50, dont **5 dans la seule `pas_de_devoirs`** :

```
0.67  enc.pas_de_devoirs.09 «Ce soir, c'est tranquille. Il n'y a rien.»
      enc.pas_de_devoirs.18 «Le soir est à toi. Il n'y a rien.»
0.67  enc.pas_de_devoirs.04 «Il n'y a rien à faire ce soir.»
      enc.pas_de_devoirs.18 «Le soir est à toi. Il n'y a rien.»
0.50  enc.pas_de_devoirs.04 / enc.pas_de_devoirs.11 / enc.pas_de_devoirs.09
0.50  enc.pas_de_devoirs.03 «Le cahier est vide ce soir. Bonne soirée.»
      enc.pas_de_devoirs.05 «Ce soir, on ne travaille pas. Bonne soirée.»
```

Six variantes sur vingt ouvrent sur « Ce soir », quatre sur « Pas de ». Le champ
sémantique est étroit et je ne le reproche pas en soi. Je constate seulement que
l'affirmation du rapport §3 — « chaque variante porte une image ou une
proposition différente » — ne tient pas pour cette banque, alors qu'elle tient
remarquablement bien pour les quinze autres : `accueil`, `avant_lecture`,
`hesitation`, `blocage`, `demande_pause`, `retour_de_pause`, `cloture`,
`reprise_session`, `avant_maths` et `indice_demande` ne produisent **aucune**
paire au-dessus de 0,50. Le travail d'écriture est réel ; il manque sur une
banque.

**Correction attendue** : réécrire `04`, `09`, `11` et `18` en variant l'angle
plutôt que la tournure — la soirée libre, le cahier refermé, le rendez-vous de
demain, le coffre accessible — sans réemployer « il n'y a rien ».

## [MINEUR] 10 — Répétition immédiate entre la banque `cloture` et le rituel de fermeture

`enc.cloture.16` : « Fin du travail. **Tu peux aller jouer.** » est dite à la fin
de la dernière étape. Quelques secondes plus tard, `bravo.fin` dit :
« C'est fini. **Tu peux aller jouer.** » Même cas pour `enc.cloture.18` « **C'est
fini.** On se retrouve un autre soir. » suivi de « **C'est fini.** Tu peux aller
jouer. »

Le découpage en deux moments est le bon (voir mon jugement sur l'arbitrage,
plus bas), mais deux des vingt variantes empiètent sur les mots exacts du rituel
et produisent un bégaiement au moment le plus ritualisé de la soirée.

**Correction attendue** : réécrire `enc.cloture.16` et `enc.cloture.18` sans
reprendre « Tu peux aller jouer » ni « C'est fini », réservés au rituel. Par
exemple `16` → « Fin du travail. Le soir est à toi. » et `18` → « On s'arrête
là. On se retrouve un autre soir. »

## [MINEUR] 11 — Un participe accordé au genre, contre l'arbitrage 5 annoncé

Rapport §8, arbitrage 5 : « **Aucune** variante ne contient d'adjectif ou de
participe accordé au genre de l'enfant (pas de "tu es prêt", pas de "tu es
allé"). Les textes restent justes pour un deuxième enfant, quel que soit son
genre. »

```
enc.reprise_session.01 : "Te revoilà. On reprend là où on s'était arrêtés."
```

« arrêtés » est accordé au masculin pluriel. Pilou est féminine (« Je suis
contente », `enc.accueil.01`) ; avec une enfant, l'accord correct serait
« arrêtées ». L'affirmation « aucune variante » est donc fausse, sur une seule
occurrence. La phrase est reprise mot pour mot de `enfant.accueil.reprise.corps`
du marketing : le défaut est hérité, pas inventé — mais il est annoncé comme
absent.

Les autres formes relevées sont saines : « on est tranquilles », « tu es
tranquille », « tes pierres sont bien rangées », « Contente de te revoir »
(Pilou) ne dépendent pas du genre de l'enfant.

**Correction attendue** : `enc.reprise_session.01` → « Te revoilà. On reprend
là où on en était. » Signaler l'équivalent sur
`enfant.accueil.reprise.corps` au producteur du marketing.

## [MINEUR] 12 — La répartition des canaux du rapport §1.3 n'explique que 15 des 20 entrées non-`les_deux`

Le rapport §1.3 écrit : « Les **15 entrées `affiche`** et les 5 entrées `tts`
sont concentrées dans **deux situations** », puis cite `encouragement_lecture`
(10 `affiche`) et `transition_etapes` (5 `tts`).

Répartition réelle, recomptée :

```
encouragement_lecture   affiche  10
onboarding              affiche   3   (boutons)
rituel_fermeture        affiche   2   (boutons)
transition_etapes       tts       5
```

Les deux situations citées portent 10 `affiche` et 5 `tts`, soit 15 entrées — et
non « les 15 entrées `affiche` ». Les 5 `affiche` restantes sont les boutons de
`gwenn-scripts.json`, légitimement non lus (la règle `lecture_tts` du fichier le
prévoit), mais non couverts par la justification annoncée. Le total (5 / 15 /
319) est juste ; la phrase qui l'explique ne l'est pas.

**Correction attendue** : corriger la phrase du rapport en « Les 10 entrées
`affiche` de la banque et les 5 entrées `tts` sont concentrées dans deux
situations ; les 5 autres entrées `affiche` sont les boutons des rituels, jamais
lus par construction. »

## [MINEUR] 13 — Quelques tournures au-dessus du vocabulaire CE1

Toutes tiennent les 12 mots et l'idée unique. Je relève des images abstraites
qu'un CE1 fatigué peut prendre au pied de la lettre, ce que la charte de ton
(§1.3, « un enfant de 6 ans prend tout au premier degré ») demande d'éviter :

```
enc.blocage.03          "Cet exercice résiste. Ça arrive souvent."
enc.blocage.10          "Cet exercice est costaud. On y revient plus tard ?"
enc.blocage.16          "On laisse cet exercice dormir un peu."
enc.photo_illisible.08  "L'écriture se cache. Je la cherche encore."
enc.pas_de_devoirs.08   "Le tipi est ouvert, mais le travail dort."
enc.accueil.03          "Salut {prenom}. Ton tipi est allumé."
```

Un exercice qui « résiste », une écriture qui « se cache », un travail qui
« dort », un tipi « allumé » : ce sont des personnifications, non des ironies, et
elles ne violent aucun interdit absolu. Elles sont néanmoins le point le plus
faible du registre, et `enc.pas_de_devoirs.08` cumule la personnification et une
subordonnée en « mais », que `30-copy-enfant.mdc` demande d'éviter (« pas de
subordonnées complexes »).

**Correction attendue** : reformuler au concret.
`blocage.03` → « Cet exercice est difficile. Ça arrive souvent. » ;
`blocage.16` → « On laisse cet exercice de côté un moment. » ;
`photo_illisible.08` → « Je cherche encore. Les mots sont petits. » ;
`pas_de_devoirs.08` → « Le tipi est ouvert. Il n'y a pas de travail. » ;
`accueil.03` → « Salut {prenom}. Ton tipi est prêt. »

---

# JUGEMENTS DEMANDÉS

## Sur l'arbitrage PED-11 contre PED-12 (point 7 de ma mission)

**L'arbitrage tient. Ce n'est pas un contournement.** Je le motive.

PED-12 dit : « Rituel de fermeture identique chaque soir : **même enchaînement,
même ton**. » PED-11 dit : « Banque d'au moins 20 variantes de phrases par
situation (réussite, effort, hésitation, pause, reprise, **clôture**) ».

Les deux exigences ne portent pas sur le même objet. PED-12 nomme un **rituel** :
une séquence d'écran, à une route identifiée (`/enfant/bravo`, §3.1), et ce que
l'exigence protège est l'enchaînement et le ton, pas la totalité des mots
prononcés dans les dernières minutes de la soirée. PED-11 nomme une **situation**
de la banque de phrases. Placer la banque `cloture` à la fin de la dernière
étape et le rituel fixe sur `/enfant/bravo` satisfait littéralement les deux, et
c'est la seule lecture qui n'annule pas une exigence par l'autre. La lecture
alternative — faire varier le rituel — violerait PED-12 frontalement ; la
lecture inverse — supprimer la banque `cloture` — violerait PED-11, qui nomme
« clôture » explicitement.

Trois éléments confirment que la décision est tenue et non habillée :
`invariant: true` est réellement présent sur `rituel_fermeture` ; les 9 lignes
du rituel sont réellement sans variante ; et la `note` de `cloture` inscrit la
règle dans le fichier lui-même. Le marketing, de son côté, avait pris la même
décision (« l'enchaînement, les phrases et le son sont exactement les mêmes
chaque soir »).

**Mais l'arbitrage est démenti par le fichier sur un point** : `cloture` déclare
`bravo.titre` dans ses `cles_ui` (constat 1). Tant que cette ligne est là, la
démonstration de §5.4 est contredite par l'objet qu'elle décrit. L'arbitrage est
juste ; son exécution est fausse d'une ligne. Cette ligne retirée, je valide
l'arbitrage sans réserve.

Je note aussi, sans en faire un constat contre le producteur, que le rituel dit
« Tu as fait tes devoirs ce soir. » y compris quand le parent a arrêté la
session après une étape. C'est assumé par la `note` du fichier, c'est la
décision du marketing (« Aucune phrase ne mentionne ce qui n'a pas été fait »,
ETH-02), et je la trouve préférable à l'alternative. Rien à corriger.

## Sur la couverture réelle de PED-04, PED-05, PED-11, PED-12 (point 8)

| Exigence | Couverte ? | Ce que j'ai vérifié moi-même |
| --- | --- | --- |
| **PED-04** — jamais « c'est faux » ni équivalent | **Oui, réellement** | Scan de chacun des 339 champs `texte` contre « c'est faux », « faux », « fausse », « erreur », « trompé », « incorrect », « nul », « bête », « essaie de faire mieux », en frontière de mot : **0 occurrence**. Aucune entrée ne porte de jugement d'exactitude. La règle « le sujet est je ou ça, jamais tu » est vérifiée sur les 20 variantes de `photo_illisible` et tient. Les seules occurrences de ces mots dans les fichiers sont dans `regles.interdits`, c'est-à-dire la liste des interdits elle-même. |
| **PED-05** — éloge de l'effort, jamais de l'intelligence ni du résultat seul | **Oui, réellement** | « intelligent », « doué », « meilleur », « champion », « score », « note » : 0 occurrence. Les 20 variantes de `reussite_etape` portent toutes sur l'acte, la durée de l'effort ou la stratégie ; aucune ne qualifie l'enfant. `indice_demande` présente la demande d'aide comme une bonne stratégie (`10`, `16`). Aucune variante ne relie une pierre à une bonne réponse : les pierres n'apparaissent que dans `reprise_session.06`, le rituel de fermeture et `bienvenue.3.corps_2`. |
| **PED-11** — ≥ 20 variantes par situation, dans un fichier de contenu | **Oui sur le compte, entamée sur le fond** | 16/16 situations présentes, 20/20 variantes chacune, 320 au total, hors du code : compté moi-même, aucun écart. Mais deux situations portent en réalité **deux rôles distincts** dans une banque unique : `indice_demande` couvre 4 niveaux (constat 4) et `blocage` couvre deux causes opposées (constat 6). Sur ces deux écrans, le seuil de 20 variantes **par situation réelle** n'est pas atteint : il est atteint par regroupement. |
| **PED-12** — rituel de fermeture identique chaque soir | **Oui dans `gwenn-scripts.json`, contredite par `encouragements.json`** | `invariant: true`, `rejoue: "chaque soir, à l'identique"`, 9 lignes sans variante, ordre stable, aménagement conditionnel limité à un état technique : tout cela est réellement livré et je le valide. Mais `situations.cloture.cles_ui` contient `bravo.titre` (constat 1), et l'ordre des deux boutons inverse l'arbitrage du marketing (constat 7). PED-12 est couverte par un fichier et rouverte par l'autre. |

Aucune des quatre n'est seulement citée. Les quatre sont travaillées, argumentées
et, pour PED-04 et PED-05, tenues sans réserve. PED-11 et PED-12 sont tenues sur
la lettre et entamées sur l'exécution.

---

# AVIS gardien-charte

Grille appliquée : les 7 points de `.cursor/agents/gardien-charte.md`, sur les
339 textes destinés à l'enfant, lus un par un.

| # | Point de contrôle | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Réserve** — voir passages fautifs |
| 2 | Interdits absolus : « c'est faux », « erreur », « tu t'es trompé », « essaie de faire mieux », comparaison, ironie | **Conforme** — 0 occurrence, aucune comparaison à un autre enfant, aucun second degré |
| 3 | Charge : une idée par phrase, 12 mots max, vocabulaire CE1 | **Conforme sur la mesure** (max 10 mots sur 591 phrases), réserve de registre sur 6 tournures |
| 4 | Pression : aucun chrono, décompte, compteur d'erreurs, série | **Conforme** — 0 chiffre, 0 durée, 0 compteur ; `demande_pause` interdit explicitement la durée dans sa `note` |
| 5 | Récompense : aucune promesse de récompense réelle, aucune perte de pierres | **Conforme** (ETH-05, ETH-04) — les pierres sont toujours virtuelles et toujours acquises : « Elles sont à toi. Elles ne se perdent pas. » |
| 6 | Maths : aucun contenu ne peut conduire à donner le résultat | **Conforme sur le contenu, réserve sur le mécanisme** |
| 7 | Autonomie : la pause reste accessible et ne coûte jamais rien | **Conforme** sur la pause, **non conforme** sur l'état « photo illisible » |

Le travail est, sur l'essentiel, d'une qualité que je tiens à nommer : 339 textes
sans un emoji, sans un chiffre, sans un prénom gravé, sans une comparaison, sans
une phrase au-dessus de 10 mots, avec un « je » systématique quand quelque chose
ne marche pas. Les points 2, 4 et 5 sont tenus sans la moindre faiblesse. Trois
passages, pourtant, mettent un enfant fatigué en difficulté, et la charte ne
connaît qu'un seul objectif : que cela n'arrive jamais.

## Passages fautifs, cités mot à mot

### A. `photo_illisible` — l'enfant est laissé devant un échec sans issue (points 1 et 7)

```
enc.photo_illisible.05 : "La photo est sombre. Je ne vois pas les mots."
enc.photo_illisible.06 : "Je n'ai pas réussi à lire le cahier."
enc.photo_illisible.01 : "Je n'arrive pas à lire la feuille."
enc.photo_illisible.10 : "La feuille est difficile à lire pour moi."
enc.photo_illisible.13 : "La photo ne me dit pas grand-chose."
```

Ces cinq phrases sont des constats d'échec clos, sans suite et sans action. Un
enfant de six ans et demi, seul devant l'écran en début de soirée, entend que
Pilou a renoncé et n'a rien à faire ensuite. Dix-sept des vingt variantes de
cette banque ne proposent aucune sortie. C'est l'unique endroit du contenu où
l'application place l'enfant dans une impasse.

**Reformulations proposées** — Pilou cherche toujours, et l'enfant a toujours où
aller :

```
05 → "Je regarde encore. Tu peux aller voir ton coffre."
06 → "Je n'ai pas fini de chercher. Le coffre t'attend."
01 → "Je cherche encore tes devoirs. Va voir ton coffre."
10 → "Je prends un peu plus de temps. Ton coffre est ouvert."
13 → "Je cherche toujours. Ça peut prendre un moment."
```

### B. `blocage` sur l'étape de lecture — une panne du micro présentée comme la difficulté de l'enfant (point 1)

La situation `blocage` déclare alimenter `lecture.blocage.corps`, dont le sens
marketing est « Le micro n'entend pas bien ce soir. » Les variantes disponibles
sont :

```
enc.blocage.03 : "Cet exercice résiste. Ça arrive souvent."
enc.blocage.10 : "Cet exercice est costaud. On y revient plus tard ?"
enc.blocage.13 : "Ça bloque un peu. Ce n'est pas grave."
```

Quand c'est le microphone qui n'a rien capté, dire à l'enfant que l'exercice
résiste lui attribue une difficulté qui n'est pas la sienne. C'est le cas exact
que PED-09 interdit. La formulation n'est pas un reproche explicite ; elle se
lit comme un reproche, ce que le point 1 de la grille suffit à écarter.

**Reformulations proposées**, à placer dans une banque `blocage_lecture` distincte :

```
"Je n'ai pas bien entendu. Tu veux redire ?"
"Le micro n'entend pas bien ce soir."
"Ma faute, j'écoute mal. On recommence ?"
"Je t'entends mal. Ce n'est pas toi."
```

### C. `indice_demande` — l'annonce ne correspond pas à l'indice qui suit (points 3 et 6)

```
enc.indice_demande.18 : "Voilà un exemple plus facile. Regarde-le bien."
enc.indice_demande.05 : "Je te pose une question, pour t'aider."
enc.indice_demande.19 : "On refait le chemin ensemble, tout doucement."
```

Tirées au hasard pour n'importe lequel des quatre niveaux, ces amorces annoncent
un contenu différent de celui qui arrive. Pour un enfant fatigué qui vient de
demander de l'aide, la phrase qui annonce et la phrase qui aide ne racontent pas
la même chose : c'est une charge inutile, au moment exact où il en a le moins.
Le point 6 n'est pas violé — aucun texte ne conduit au résultat, et
`enc.avant_maths.13` « Je ne donne pas les réponses. Je t'aide à chercher. » est
exemplaire — mais l'échelle progressive que PED-02 protège est aplatie.

**Reformulation proposée** : soit quatre sous-banques par niveau, soit 20
amorces strictement neutres. Les six variantes qui décrivent un niveau précis
(`05`, `07`, `09`, `17`, `18`, `19`) sont à déplacer ou à réécrire au neutre, par
exemple `18` → « Voilà de quoi t'aider. Regarde bien. »

## Ce que je valide sans réserve

- **Point 2** : aucun interdit absolu, sur aucune des 339 entrées. Aucune
  comparaison. Aucune ironie. Le contrôle du producteur avait levé un faux
  positif sur « sérieusement » qui contient « série » ; je confirme que
  `enc.reussite_etape.04` « Bravo. Tu as travaillé sérieusement. » est une phrase
  saine et que le durcissement du contrôle était le bon geste.
- **Point 4** : aucun chiffre, aucune durée, aucun cycle de respiration compté,
  aucune série. `demande_pause` interdit explicitement le décompte dans sa
  `note`, et les 20 variantes le tiennent.
- **Point 5** : ETH-05 est tenue. Aucune entrée ne promet un objet, une sortie ou
  un avantage réel. `bravo.pierres_plus_tard_2` « Elles sont à toi. Elles ne se
  perdent pas. » est la bonne formulation d'ETH-04 : la perte n'est jamais
  présentée comme possible, elle est niée.
- **Point 7 sur la pause** : la pause est proposée par Pilou (`blocage.04`,
  `blocage.15`, `blocage.17`), elle est toujours gratuite
  (`demande_pause.10` « La pause ne coûte rien. Elle est à toi. »), le retour est
  immédiat (`demande_pause.13` « Tu reviens quand tu veux. Rien ne presse. »), et
  `retour_de_pause` ne commente jamais le fait d'avoir fait une pause. C'est
  exactement ce que la charte demande.

AVIS: NON CONFORME

Motif : les trois passages A, B et C. Le point 7 de la grille est mis en défaut
par `photo_illisible`, qui est le seul écran du contenu où un enfant fatigué se
retrouve sans action possible, et le point 1 par la banque `blocage` appliquée à
une panne de micro. Les quatre interdits durs (points 2, 4, 5, et le point 6 sur
le résultat en maths) sont tenus sans exception. L'avis redevient CONFORME dès
que A, B et C sont corrigés ; aucune autre reprise n'est demandée par le gardien.

---

# TABLEAU DES COMPTAGES — ANNONCÉ CONTRE RÉEL

Comptage refait par moi, avec mes propres commandes, sans lire les sorties du
rapport. Sorties réelles en fin de document.

## Variantes par situation

| # | Situation | Clé | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- | --- | --- |
| 1 | Accueil | `accueil` | 20 | **20** | — |
| 2 | Annonce du programme | `annonce_programme` | 20 | **20** | — |
| 3 | Avant lecture | `avant_lecture` | 20 | **20** | — |
| 4 | Encouragement en cours de lecture | `encouragement_lecture` | 20 | **20** | — |
| 5 | Hésitation sur un mot | `hesitation` | 20 | **20** | — |
| 6 | Réussite d'étape | `reussite_etape` | 20 | **20** | — |
| 7 | Transition entre étapes | `transition_etapes` | 20 | **20** | — |
| 8 | Avant maths | `avant_maths` | 20 | **20** | — |
| 9 | Indice demandé | `indice_demande` | 20 | **20** | — |
| 10 | Blocage | `blocage` | 20 | **20** | — |
| 11 | Demande de pause | `demande_pause` | 20 | **20** | — |
| 12 | Retour de pause | `retour_de_pause` | 20 | **20** | — |
| 13 | Clôture | `cloture` | 20 | **20** | — |
| 14 | Pas de devoirs ce soir | `pas_de_devoirs` | 20 | **20** | — |
| 15 | Photo illisible | `photo_illisible` | 20 | **20** | — |
| 16 | Reprise d'une session interrompue | `reprise_session` | 20 | **20** | — |
| | **Total** | | **320** | **320** | **—** |

Les 16 situations exigées par la mission sont toutes présentes, aucune situation
en trop, aucune clé différente d'un `id`, aucune sous 20. Aucune clé dupliquée
dans le JSON (contrôle par `object_pairs_hook`, qui détecte ce qu'un
`JSON.parse` masque en gardant la dernière occurrence).

## Autres compteurs

| Grandeur | Annoncé par le rapport | **Recompté** | Écart |
| --- | --- | --- | --- |
| Situations | 16 | **16** | — |
| Variantes | 320 | **320** | — |
| Lignes fixes `gwenn-scripts.json` | 19 | **19** (10 onboarding + 9 rituel) | — |
| Écrans d'onboarding | 3 | **3** | — |
| Écrans du rituel de fermeture | 1 | **1**, `invariant: true` | — |
| Entrées totales | 339 | **339** | — |
| Phrases contrôlées | 591 | **591** | — |
| Dépassements de 12 mots | 0 | **0** | — |
| Phrase la plus longue | `enc.blocage.02`, 10 mots | **`enc.blocage.02`, 10 mots** | — |
| Mots interdits dans un `texte` | 0 | **0** | — |
| Emoji | 0 | **0** | — |
| Chiffres | 0 | **0** | — |
| Prénom `Evan` en dur | 0 | **0** | — |
| Occurrences de « Gwenn » dans un `texte` | 0 | **0** | — |
| Identifiants uniques | 339 | **339 / 339** | — |
| Textes uniques (stricts) | 339 | **339 / 339** | — |
| Textes uniques (normalisés) | 339 | **339 / 339** | — |
| Canal `tts` | 5 | **5** | — |
| Canal `affiche` | 15 | **15** | — |
| Canal `les_deux` | 319 | **319** | — |
| Entrées portant `{prenom}` | 11 (8 + 2 + 1) | **11** (accueil 8, reprise_session 2, bravo.titre 1) | — |
| Entrées sans `canal` | — | **0** | — |
| Entrées sans `id` ou sans `texte` | — | **0** | — |

**Écart entre chiffre annoncé et chiffre réel : aucun, sur vingt-trois
grandeurs.** Le producteur a compté ce qu'il dit avoir compté. Je l'inscris ici
parce que c'est la question que ma fiche de rôle me demande de poser en premier,
et parce que la réponse est bonne.

## Ma règle de comptage des mots, et la différence avec celle du producteur

Le producteur annonce un découpage des phrases sur `.`, `!`, `?` et un
« comptage strict où une élision compte pour deux mots (« je t'aide » = 3 mots) ».

J'ai mesuré avec **les deux règles**, sur les 591 phrases :

- **Règle souple** (la mienne par défaut, et la lecture naturelle de
  `30-copy-enfant.mdc`) : une phrase est une suite terminée par `.`, `!`, `?` ou
  `…` ; un mot est une suite de lettres, l'élision et le trait d'union restent
  **dans** le mot, donc « je t'aide » = **2 mots**.
- **Règle stricte du producteur** : on coupe aussi sur l'apostrophe et sur le
  trait d'union, donc « je t'aide » = **3 mots**.

| Règle | Phrase la plus longue | Longueur | Dépassements de 12 mots |
| --- | --- | --- | --- |
| Stricte (producteur) | `enc.blocage.02` — « On souffle un peu, ou on passe à la suite » | **10 mots** | **0** |
| Souple (la mienne) | `enc.blocage.02` — même phrase | **10 mots** | **0** |

Les deux règles donnent le même maximum et le même résultat, parce que la phrase
la plus longue ne contient aucune élision. La règle stricte est bien plus sévère
que la règle écrite, elle est déclarée, et elle ne masque rien : la marge de deux
mots annoncée à l'arbitrage 8 est réelle. Mesuré aussi sur les **entrées
entières** (toutes phrases confondues, pour le cas où une limite serait lue par
entrée et non par phrase) : le maximum est de **11 mots stricts / 10 souples**
(`enc.indice_demande.03`, `enc.avant_maths.13`, `enc.annonce_programme.06`),
donc sous la limite même dans cette lecture la plus défavorable.

## Schéma : régularité et consommation TypeScript

| Contrôle | Résultat |
| --- | --- |
| Les deux fichiers parsent | **Oui**, `node` et `python3`, exit 0 |
| Clés dupliquées dans un objet JSON | **0** |
| Chaque variante porte `id`, `texte`, `canal`, `jetons` | **339 / 339**, aucun champ manquant |
| Chaque variante porte **exactement** ces 4 champs, sans champ surnuméraire | **Oui** |
| Chaque ligne de rituel porte `id`, `ordre`, `role`, `texte`, `canal`, `condition`, `jetons` | **Oui**, exactement ces 7 |
| Chaque `canal` ∈ {`tts`, `affiche`, `les_deux`} | **339 / 339 valides**, aucune entrée sans canal |
| Chaque situation porte `id`, `libelle`, `ecran`, `cles_ui`, `req`, `note`, `variantes` | **16 / 16** |
| `id` de situation identique à sa clé d'indexation | **16 / 16** |
| Caractères non-ASCII | **12 caractères distincts, tous des lettres françaises accentuées** — aucune apostrophe typographique, aucune espace insécable, aucun emoji |

Le schéma est **régulier et stable** : indexation par identifiant de situation
(pas de recherche dans un tableau), types homogènes, aucune variation de forme
entre les 339 entrées, aucun champ optionnel implicite. Le type TypeScript donné
en §1.4 du rapport décrit exactement ce que contient le fichier. Sur ce point le
livrable est bon et je le dis.

Ce qui manque n'est pas la régularité, c'est le **raccordement** : rien dans une
variante ne dit quelle clé d'écran elle remplit (constat 3). Le fichier est
directement typable ; il n'est pas directement câblable.

---

# SORTIES RÉELLES DES COMMANDES

Toutes les commandes ci-dessous ont été exécutées dans `/home/user/Tipi`. Les
sorties sont collées telles quelles.

## 1. Validité JSON

```
$ node -e "const fs=require('fs');
for (const f of ['content/encouragements.json','content/gwenn-scripts.json']) {
  try { const d=JSON.parse(fs.readFileSync(f,'utf8'));
  console.log(f+' : JSON VALIDE, schema='+d.schema+', cles racine='+Object.keys(d).length+' -> '+Object.keys(d).join(','));
  } catch(e){ console.log(f+' : JSON INVALIDE -> '+e.message); } }"

content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v1, cles racine=7 -> schema,version,personnage,jeton_prenom,canaux,regles,situations
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v1, cles racine=8 -> schema,version,personnage,note_nom_de_fichier,jeton_prenom,canaux,regles,rituels
---exit:0---

$ python3 -c "import json; [print(f,'OK, top-level keys:',list(json.load(open(f,encoding='utf-8')).keys())) for f in [...]]"

/home/user/Tipi/content/encouragements.json OK, top-level keys: ['schema', 'version', 'personnage', 'jeton_prenom', 'canaux', 'regles', 'situations']
/home/user/Tipi/content/gwenn-scripts.json OK, top-level keys: ['schema', 'version', 'personnage', 'note_nom_de_fichier', 'jeton_prenom', 'canaux', 'regles', 'rituels']
```

## 2. Comptage indépendant des situations et des variantes (avec détection de clés dupliquées)

```
$ python3  # json.loads(raw, object_pairs_hook=<detecteur de doublons>)

CLES DUPLIQUEES encouragements.json : aucune
nb situations : 16
accueil                     20 variantes  (cle==id: True)
annonce_programme           20 variantes  (cle==id: True)
avant_lecture               20 variantes  (cle==id: True)
encouragement_lecture       20 variantes  (cle==id: True)
hesitation                  20 variantes  (cle==id: True)
reussite_etape              20 variantes  (cle==id: True)
transition_etapes           20 variantes  (cle==id: True)
avant_maths                 20 variantes  (cle==id: True)
indice_demande              20 variantes  (cle==id: True)
blocage                     20 variantes  (cle==id: True)
demande_pause               20 variantes  (cle==id: True)
retour_de_pause             20 variantes  (cle==id: True)
cloture                     20 variantes  (cle==id: True)
pas_de_devoirs              20 variantes  (cle==id: True)
photo_illisible             20 variantes  (cle==id: True)
reprise_session             20 variantes  (cle==id: True)
TOTAL variantes : 320
manquantes : []
en trop    : []
```

## 3. Rituels, entrées totales et régularité du schéma

```
$ python3

rituel onboarding: ecrans=3 rejoue='jamais' invariant=ABSENT
   ecran bienvenue_1    ordre=1 lignes=3
   ecran bienvenue_2    ordre=2 lignes=3
   ecran bienvenue_3    ordre=3 lignes=4
   -> 10 lignes
rituel rituel_fermeture: ecrans=1 rejoue="chaque soir, à l'identique" invariant=True
   ecran bravo          ordre=1 lignes=9
   -> 9 lignes
TOTAL lignes fixes : 19
TOTAL ENTREES (variantes + lignes) : 339
PROBLEMES DE SCHEMA : 0
entrees collectees : 339
```

## 4. Canaux et unicité

```
$ python3

ENTREES : 339
CANAUX : {'les_deux': 319, 'affiche': 15, 'tts': 5}
IDS uniques : 339 / 339 doublons: aucun
TEXTES uniques (strict) : 339 / 339 doublons: aucun
TEXTES uniques (normalises) : 339 doublons: aucun
```

```
$ python3  # repartition detaillee des entrees non-les_deux

  encouragement_lecture  affiche  10
  onboarding             affiche  3
  rituel_fermeture       affiche  2
  transition_etapes      tts      5
```

## 5. Longueur des phrases, deux règles de comptage

```
$ python3

PHRASES comptees : 591
Max en comptage STRICT (elision=2 mots) : 10 -> enc.blocage.02 : On souffle un peu, ou on passe à la suite
Max en comptage SOUPLE (elision=1 mot)  : 10 -> enc.blocage.02 : On souffle un peu, ou on passe à la suite
Depassements >12 mots STRICT : 0
Depassements >12 mots SOUPLE : 0

--- 12 phrases les plus longues (strict, souple, id, texte) ---
  10 / 10  enc.photo_illisible.04     Mes yeux de loutre ne lisent pas bien ce soir
  10 / 10  enc.blocage.02             On souffle un peu, ou on passe à la suite
   9 /  9  enc.hesitation.19          On le regarde de plus près, tous les deux
   9 /  9  enc.hesitation.17          Je le répète, et tu le dis après moi
   9 /  9  enc.avant_maths.20         Tu peux compter à voix haute, si tu veux
   9 /  8  enc.photo_illisible.06     Je n'ai pas réussi à lire le cahier
   9 /  8  enc.pas_de_devoirs.04      Il n'y a rien à faire ce soir
   9 /  8  enc.pas_de_devoirs.01      Ce soir, il n'y a pas de devoirs
   9 /  8  enc.hesitation.10          Tu veux qu'on le lise en même temps
   9 /  8  enc.blocage.08             Tu as le droit de t'arrêter un moment
   9 /  8  enc.annonce_programme.02   Je te montre ce qu'on fait ce soir
   9 /  7  enc.photo_illisible.16     Je n'ai pas tout compris sur l'image

--- entrees entieres les plus longues (toutes phrases confondues) ---
  11 / 10  enc.indice_demande.03      Je t'aide un peu. Je ne dis pas le résultat.
  11 / 10  enc.avant_maths.13         Je ne donne pas les réponses. Je t'aide à chercher.
  11 / 10  enc.annonce_programme.06   Tu sais déjà tout. Il n'y a pas de surprise.
  11 /  9  enc.photo_illisible.20     Je m'occupe de ça. Ce n'est pas ton souci.
  11 /  9  enc.pas_de_devoirs.13      Il n'y a pas de devoirs. C'est tout simple.
```

## 6. Vocabulaire interdit, emoji, chiffres, prénom en dur

Scan sur les **339 champs `texte`** uniquement (les champs de métadonnées sont
traités séparément plus bas) :

```
$ python3  # 43 motifs interdits, en frontiere de mot, insensible a la casse

=== VOCABULAIRE INTERDIT ===
aucune occurrence

=== EMOJI / SYMBOLES NON TEXTUELS ===
occurrences : 0

=== CHIFFRES (0-9) et nombres en toutes lettres ===
entrees avec un chiffre : 0
```

Motifs testés : `c'est faux`, `faux`, `fausse`, `erreur`, `tromp`, `incorrect`,
`essaie de faire mieux`, `mieux`, `nul`, `nulle`, `bête`, `meilleur`, `champion`,
`intelligent`, `doué`, `fort en`, comparaison à un camarade / copain / copine /
autre enfant / frère / sœur, `chrono`, `minute`, `seconde`, `décompte`,
`temps qui`, `score`, `points`, `note`, `noté`, `série`, `streak`,
`recommence pour`, `cadeau`, `bonbon`, `jouet`, `récompense`, `perds`, `perdre`,
`perdu`, `Evan`, `Gwenn`, `dépêche`, `vite`, `plus vite`.

Contrôle emoji par plages Unicode, sur les fichiers bruts :

```
$ perl -ne 'print "$ARGV:$.: $_" if /[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE00}-\x{FE0F}\x{1F300}-\x{1F9FF}]/' content/encouragements.json content/gwenn-scripts.json
(aucune ligne affichee)

$ python3  # inventaire de tous les caracteres non-ASCII des deux fichiers
  'À' U+00C0 Lu LATIN CAPITAL LETTER A WITH GRAVE
  'Ç' U+00C7 Lu LATIN CAPITAL LETTER C WITH CEDILLA
  'É' U+00C9 Lu LATIN CAPITAL LETTER E WITH ACUTE
  'à' U+00E0 Ll LATIN SMALL LETTER A WITH GRAVE
  'ç' U+00E7 Ll LATIN SMALL LETTER C WITH CEDILLA
  'è' U+00E8 Ll LATIN SMALL LETTER E WITH GRAVE
  'é' U+00E9 Ll LATIN SMALL LETTER E WITH ACUTE
  'ê' U+00EA Ll LATIN SMALL LETTER E WITH CIRCUMFLEX
  'î' U+00EE Ll LATIN SMALL LETTER I WITH CIRCUMFLEX
  'ô' U+00F4 Ll LATIN SMALL LETTER O WITH CIRCUMFLEX
  'ù' U+00F9 Ll LATIN SMALL LETTER U WITH GRAVE
  'û' U+00FB Ll LATIN SMALL LETTER U WITH CIRCUMFLEX
```

Prénom en dur :

```
$ grep -n -E "Evan|Gwenn" content/encouragements.json
exit=1 (aucune occurrence)

$ grep -n -i "gwenn" content/gwenn-scripts.json
2:  "schema": "tipi.gwenn-scripts.v1",
5:  "note_nom_de_fichier": "Le fichier s'appelle gwenn-scripts.json parce que le prompt maître le nomme ainsi. Le personnage s'appelle Pilou partout dans les textes.",
```

Les deux occurrences de « Gwenn » sont dans le nom de schéma et dans la note
explicative, jamais dans un `texte` destiné à l'enfant. Conforme au point que
l'Orchestrateur a sorti de mon périmètre (ESC-001).

Grep littéral sur les fichiers entiers, pour montrer ce qu'un contrôle naïf
remonterait et pourquoi ce ne sont pas des constats :

```
$ grep -n -i -E "c'est faux|erreur|trompé|essaie de faire mieux|chrono|décompte|score|compteur" content/encouragements.json content/gwenn-scripts.json
content/encouragements.json:15:      "c'est faux",
content/encouragements.json:16:      "erreur",
content/encouragements.json:17:      "tu t'es trompé",
content/encouragements.json:18:      "essaie de faire mieux",
content/encouragements.json:23:      "chrono",
content/encouragements.json:24:      "décompte",
content/encouragements.json:25:      "score chiffré",
content/encouragements.json:26:      "compteur d'erreurs",
content/encouragements.json:1443:      "note": "Aucune durée, aucun décompte, aucun nombre de cycles. Le retour est possible tout de suite.",
```

Les huit premières occurrences sont le contenu du tableau `regles.interdits`,
c'est-à-dire la liste des interdits elle-même ; la neuvième est une `note` de
situation. **Aucune n'est dans un `texte`.** Je le consigne pour qu'un contrôle
ultérieur ne le compte pas comme une violation.

## 7. Unicité réelle : les 20 variantes d'une situation sont-elles interchangeables ?

Indice de Jaccard sur les mots pleins (mots-outils français retirés), toutes
paires à l'intérieur de chaque situation, seuil 0,50.

```
$ python3

--accueil--               paires >=0.50 : 0
--annonce_programme--     paires >=0.50 : 1
   0.5  enc.annonce_programme.05 «Voilà les images de ce soir. On les suit.»  ||  enc.annonce_programme.11 «Voilà notre chemin de ce soir. On le suit.»
--avant_lecture--         paires >=0.50 : 0
--encouragement_lecture-- paires >=0.50 : 1
   0.5  enc.encouragement_lecture.03 «Prends ton temps.»  ||  enc.encouragement_lecture.15 «Tu prends ton temps. C'est exactement ça.»
--hesitation--            paires >=0.50 : 0
--reussite_etape--        paires >=0.50 : 2
   0.6  enc.reussite_etape.06 «Tu as fait ce qu'il fallait. C'est bien.»  ||  enc.reussite_etape.16 «C'est fait. Tu as donné ce qu'il fallait.»
   0.5  enc.reussite_etape.04 «Bravo. Tu as travaillé sérieusement.»  ||  enc.reussite_etape.20 «Tu as travaillé jusqu'à la fin. Bravo.»
--transition_etapes--     paires >=0.50 : 1
   0.57 enc.transition_etapes.09 «Tu as fini cette partie. On passe à l'autre.»  ||  enc.transition_etapes.16 «Bravo pour cette partie. On passe à l'autre.»
--avant_maths--           paires >=0.50 : 0
--indice_demande--        paires >=0.50 : 0
--blocage--               paires >=0.50 : 0
--demande_pause--         paires >=0.50 : 0
--retour_de_pause--       paires >=0.50 : 0
--cloture--               paires >=0.50 : 0
--pas_de_devoirs--        paires >=0.50 : 5
   0.67 enc.pas_de_devoirs.09 «Ce soir, c'est tranquille. Il n'y a rien.»  ||  enc.pas_de_devoirs.18 «Le soir est à toi. Il n'y a rien.»
   0.67 enc.pas_de_devoirs.04 «Il n'y a rien à faire ce soir.»  ||  enc.pas_de_devoirs.18 «Le soir est à toi. Il n'y a rien.»
   0.5  enc.pas_de_devoirs.04 «Il n'y a rien à faire ce soir.»  ||  enc.pas_de_devoirs.11 «Rien à faire ce soir. Ton coffre reste ouvert.»
   0.5  enc.pas_de_devoirs.04 «Il n'y a rien à faire ce soir.»  ||  enc.pas_de_devoirs.09 «Ce soir, c'est tranquille. Il n'y a rien.»
   0.5  enc.pas_de_devoirs.03 «Le cahier est vide ce soir. Bonne soirée.»  ||  enc.pas_de_devoirs.05 «Ce soir, on ne travaille pas. Bonne soirée.»
--photo_illisible--       paires >=0.50 : 1
   0.5  enc.photo_illisible.01 «Je n'arrive pas à lire la feuille.»  ||  enc.photo_illisible.10 «La feuille est difficile à lire pour moi.»
--reprise_session--       paires >=0.50 : 0

TOTAL paires >=0.50 : 11
```

```
$ python3  # squelettes recurrents : deux premiers mots normalises

  accueil                  [('bonsoir {prenom}', 4), ('te voila', 4), ('te revoila', 2), ('bonsoir je', 2)]
  annonce_programme        [('voila le', 3), ('je te', 2), ('je t', 2)]
  avant_lecture            [('je lis', 2), ('on lit', 2)]
  encouragement_lecture    [('ta voix', 2)]
  hesitation               [('ce mot', 5), ('on le', 3), ('tu veux', 3)]
  reussite_etape           [('tu as', 8), ('c est', 3), ('bravo tu', 2), ('cette etape', 2)]
  avant_maths              [('les maths', 3), ('en maths', 2)]
  indice_demande           [('je t', 5), ('je te', 4), ('voila un', 2)]
  blocage                  [('cet exercice', 2), ('tu veux', 2), ('tu as', 2)]
  demande_pause            [('la pause', 2)]
  retour_de_pause          [('te revoila', 2), ('on repart', 2), ('on reprend', 2)]
  cloture                  [('le travail', 4), ('c est', 4), ('voila on', 2)]
  pas_de_devoirs           [('ce soir', 6), ('pas de', 4), ('il n', 2)]
  photo_illisible          [('je n', 4), ('l image', 2), ('la photo', 2), ('je ne', 2)]
  reprise_session          [('on reprend', 3), ('te revoila', 2), ('bonsoir {prenom}', 2), ('te voila', 2)]
```

**Conclusion sur l'unicité réelle** : l'unicité n'est pas que celle des chaînes.
Quinze situations sur seize passent un test de recouvrement sémantique que
l'unicité stricte ne teste pas. Ce n'est pas « la même phrase déclinée vingt
fois » : `accueil`, `hesitation`, `blocage`, `demande_pause`, `cloture`,
`indice_demande` et `avant_maths` ne produisent aucune paire au-dessus de 0,50,
ce qui est rare sur vingt phrases courtes contraintes à un même contexte. Seule
`pas_de_devoirs` se répète (constat 9, [MINEUR]). Le défaut **n'est pas
systématique**, il n'y a donc pas de [MAJEUR] sur ce point.

## 8. Cohérence avec le livrable marketing : les clés déclarées existent-elles ?

Extraction des clés réellement **définies** dans les tables de clés du marketing
(lignes de tableau de la forme `| `cle` |` ou `| n | `cle` |`), puis comparaison
avec les 35 clés distinctes déclarées dans les champs `cles_ui`.

```
$ python3

cles REELLEMENT DEFINIES dans les tables du marketing : 330

>>> CLES DECLAREES PAR contenu-enfant QUI NE SONT PAS DES CLES DU MARKETING : 5
   enfant.programme.corps    declaree par ['annonce_programme']
      -> eclatee dans le marketing en : ['enfant.programme.corps.lecture_maths', 'enfant.programme.corps.maths_lecture']
   lecture.intro.titre       declaree par ['avant_lecture']
      -> eclatee dans le marketing en : ['lecture.intro.titre.apres', 'lecture.intro.titre.premier']
   maths.intro.titre         declaree par ['avant_maths']
      -> eclatee dans le marketing en : ['maths.intro.titre.apres', 'maths.intro.titre.premier']
   transition.annonce        declaree par ['transition_etapes']
      -> eclatee dans le marketing en : ['transition.annonce.lecture', 'transition.annonce.maths']
   transition.felicitation   declaree par ['transition_etapes', 'cloture']
      -> eclatee dans le marketing en : ['transition.felicitation.lecture', 'transition.felicitation.maths']

cles marketing 'bravo.*' :
   ['bravo.bouton_principal', 'bravo.bouton_secondaire', 'bravo.coffre', 'bravo.corps',
    'bravo.fin', 'bravo.pierres', 'bravo.pierres_plus_tard', 'bravo.pierres_plus_tard_2', 'bravo.titre']
```

Les 30 autres clés déclarées existent bien. Les identifiants livrés dans
`gwenn-scripts.json` pour les deux boutons du rituel — `bravo.bouton` et
`bravo.bouton_2` — ne figurent pas dans cette liste (constat 7).

```
$ python3  # cles declarees par PLUSIEURS situations

  lecture.retour.effort    <- ['encouragement_lecture', 'reussite_etape']
  transition.felicitation  <- ['transition_etapes', 'cloture']
```

## 9. Jeton `{prenom}` et accords de genre

```
$ python3

entrees portant {prenom} : 11
  accueil : 8   (01, 03, 06, 09, 12, 14, 17, 20)
  reprise_session : 2   (02, 14)
  rituel_fermeture : 1  (bravo.titre)

=== PARTICIPES / ADJECTIFS ACCORDES (risque de genre) ===
   enc.accueil.01               'Bonsoir {prenom}. Je suis contente de te voir.'      (Pilou, feminin : OK)
   enc.accueil.05               'Te revoilà. Assieds-toi, on est tranquilles.'        (invariable en genre : OK)
   enc.accueil.11               'Salut. Je suis contente que tu sois là.'             (Pilou, feminin : OK)
   enc.annonce_programme.10     "Je t'explique avant. Comme ça, tu es tranquille."    (invariable : OK)
   enc.retour_de_pause.06       'Contente de te revoir.'                              (Pilou, feminin : OK)
   enc.pas_de_devoirs.09        "Ce soir, c'est tranquille. Il n'y a rien."           (invariable : OK)
   enc.photo_illisible.11       'Je mets un peu de temps. Reste tranquille.'          (invariable : OK)
   enc.reprise_session.01       "Te revoilà. On reprend là où on s'était arrêtés."    <-- ACCORD MASCULIN PLURIEL
   enc.reprise_session.06       'On continue. Tes pierres sont bien rangées.'         (accord sur "pierres" : OK)
```

Une seule occurrence en défaut, `enc.reprise_session.01` (constat 11).

## 10. `photo_illisible` : contenu et issues

```
$ python3

=== variantes qui NOMMENT la photo / image / feuille / cahier / ecriture ===
   enc.photo_illisible.01  "Je n'arrive pas à lire la feuille."
   enc.photo_illisible.02  "L'image est un peu floue pour moi."
   enc.photo_illisible.05  'La photo est sombre. Je ne vois pas les mots.'
   enc.photo_illisible.06  "Je n'ai pas réussi à lire le cahier."
   enc.photo_illisible.08  "L'écriture se cache. Je la cherche encore."
   enc.photo_illisible.10  'La feuille est difficile à lire pour moi.'
   enc.photo_illisible.13  'La photo ne me dit pas grand-chose.'
   enc.photo_illisible.14  'Je relis la feuille, tout doucement.'
   enc.photo_illisible.16  "Je n'ai pas tout compris sur l'image."
   enc.photo_illisible.19  "L'image reste floue. Je continue à chercher."
   -> 10 variantes sur 20

=== variantes offrant une SORTIE (coffre / action) ===
   enc.photo_illisible.03  'Je cherche encore tes devoirs. Patiente un peu.'
   enc.photo_illisible.17  'Ça prend un moment. Tu peux voir ton coffre.'
   enc.photo_illisible.18  'Je ne lis pas encore ce devoir. Patience.'
   -> 3 variantes sur 20, dont 1 seule avec une action reelle
```

Référence marketing opposée, `docs/agents/P1/produit-marketing.out.md` :

```
1719: | **OCR illisible** | `parent.scan.illisible.*` (7.10) | jamais montré à l'enfant | Reprendre la photo ou saisir à la main |
 567: | `enfant.accueil.souci.titre` | « Je cherche encore tes devoirs. » | dit_affiche |
 568: | `enfant.accueil.souci.corps` | « Tu peux aller voir ton coffre. » | dit_affiche |
 569: | `enfant.accueil.souci.bouton` | « Voir mon coffre » | affiche |
1854: | PRD-16 | ... | Les quatre états limites ont un texte bienveillant et au moins une action de sortie ... |
```

## 11. `indice_demande` : les quatre amorces du marketing

```
$ grep -n "\`maths\.indice\." docs/agents/P1/produit-marketing.out.md

858:| `maths.indice.1.amorce` | « Je te pose une question, pour t'aider. » | dit_affiche |
859:| `maths.indice.2.amorce` | « On peut faire autrement. Écoute. » | dit_affiche |
860:| `maths.indice.3.amorce` | « Je te montre un exemple plus facile. » | dit_affiche |
861:| `maths.indice.4.amorce` | « On le fait ensemble, tout doucement. » | dit_affiche |
862:| `maths.indice.epuise` | « Je t'ai tout dit. À toi de chercher. » | dit_affiche |
```

## 12. `blocage` : les deux clés déclarées n'ont pas le même sens

```
$ grep -n "\`maths\.blocage\|\`lecture\.blocage" docs/agents/P1/produit-marketing.out.md

722:| `lecture.blocage.corps`   | « Le micro n'entend pas bien ce soir. »       | dit_affiche |
723:| `lecture.blocage.corps_2` | « On fait une pause, ou on continue ? »       | dit_affiche |
724:| `lecture.blocage.bouton`  | « Faire une pause »                            | affiche |
725:| `lecture.blocage.bouton_2`| « Continuer »                                  | affiche |
886:| `maths.blocage.corps`     | « Celui-là est difficile. C'est normal. »      | dit_affiche |
887:| `maths.blocage.corps_2`   | « On souffle un peu, ou on passe à la suite ? »| dit_affiche |
888:| `maths.blocage.bouton`    | « Faire une pause »                            | affiche |
889:| `maths.blocage.bouton_2`  | « Passer à la suite »                          | affiche |
```

## 13. Rituel de fermeture : ordre des boutons, marketing contre livraison

```
$ sed -n '1018,1030p' docs/agents/P1/produit-marketing.out.md

| Ordre | Clé | Texte | Mode |
| 1 | `bravo.titre` | « Bravo Evan. » | dit_affiche |
| 2 | `bravo.corps` | « Tu as fait tes devoirs ce soir. » | dit_affiche |
| 3 | `bravo.pierres` | « Tu as gagné des pierres. » | dit_affiche |
| 4 | `bravo.coffre` | « Je les range dans ton coffre. » | dit_affiche |
| 5 | `bravo.fin` | « C'est fini. Tu peux aller jouer. » | dit_affiche |
| 6 | `bravo.bouton_principal` | « Aller jouer » | affiche |
| 7 | `bravo.bouton_secondaire` | « Voir mon coffre » | affiche |

**Décision DES-06 sur la hiérarchie des deux boutons** (reprise du 2026-09-20) :
l'action principale de la clôture est **« Aller jouer »**. Elle est seule en bas
d'écran, pleine largeur, à l'emplacement habituel de l'action principale.
```

Livré dans `content/gwenn-scripts.json`, lignes 231-248 :

```json
{ "id": "bravo.bouton",   "ordre": 8, "role": "bouton", "texte": "Voir mon coffre", "canal": "affiche", "condition": null, "jetons": [] },
{ "id": "bravo.bouton_2", "ordre": 9, "role": "bouton", "texte": "Aller jouer",     "canal": "affiche", "condition": null, "jetons": [] }
```

## 14. Vocabulaire de canal : les deux énumérations concurrentes

```
$ sed -n '359,364p' docs/agents/P1/produit-marketing.out.md

- `dit` — lu par Pilou en TTS uniquement
- `affiche` — affiché à l'écran uniquement
- `dit_affiche` — les deux, avec le même texte mot pour mot
[...] `dit_affiche` (PED-10). Un texte en `affiche` seul ne peut être que décoratif ou

$ python3 -c "import json;print(json.load(open('content/encouragements.json'))['canaux'])"
['tts', 'affiche', 'les_deux']

$ grep -c "dit_affiche" docs/agents/P1/produit-marketing.out.md
(porté sur les tables de clés du livrable marketing)
```

Fiche `contenu-enfant` du prompt maître, `TIPI-PROMPT-CURSOR.md` ligne 411 :

```
- Indiquer pour chaque entrée si elle est lue par TTS, affichée, ou les deux.
```

Aucune des trois chaînes `tts`, `affiche`, `les_deux` n'y est imposée.

---

# SYNTHÈSE

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | Aucun. JSON valide, 16/16 situations, 20/20 variantes, aucun interdit absolu dans un texte enfant, aucun emoji, aucun chiffre, aucun prénom en dur. |
| **[MAJEUR]** | **8** | 1 (`bravo.titre` dans `cloture`), 2 (5 clés retirées), 3 (pas de dispatch par variante), 4 (`indice_demande` / PED-02), 5 (`photo_illisible`), 6 (`blocage` lecture), 7 (boutons du rituel inversés), 8 (deux vocabulaires de canal) |
| **[MINEUR]** | **5** | 9 (`pas_de_devoirs` répétitive), 10 (répétition banque/rituel), 11 (accord de genre), 12 (répartition des canaux mal expliquée), 13 (registre CE1 sur 6 tournures) |

**VERDICT: FAIL**, mécaniquement, par la règle de ma fiche de rôle : un seul
[MAJEUR] impose FAIL, il y en a huit.

## Ce qui est acquis et ne sera pas recontrôlé

Pour que la reprise soit courte, je fixe ce qui est validé et n'a pas à être
retouché :

- **Les vingt-trois compteurs annoncés sont exacts.** Recomptés indépendamment,
  aucun écart. Le producteur n'a inventé aucune sortie de commande. Sur le point
  que ma fiche de rôle place en premier, le livrable est irréprochable.
- **La validité et la régularité du JSON** : 0 clé dupliquée, 0 champ manquant,
  0 champ surnuméraire, 339/339 canaux valides, aucune entrée sans canal.
- **PED-04 et PED-05** sont couvertes réellement, et bien.
- **Le corps des textes** : 591 phrases sous 10 mots, aucun interdit, aucune
  comparaison, aucune ironie, aucune pression, aucune promesse de récompense
  réelle, le « je » systématique quand quelque chose ne marche pas, le jeton
  `{prenom}` partout au lieu d'un prénom gravé.
- **La diversité réelle** des quinze banques autres que `pas_de_devoirs`.
- **L'arbitrage PED-11 / PED-12 lui-même** : la décision est juste, seule son
  exécution est à reprendre d'une ligne.
- **Le nom de fichier `gwenn-scripts.json`** : hors de mon périmètre, ESC-001
  ouverte par l'Orchestrateur. Le producteur a fait ce qu'il fallait — conserver
  le nom imposé, documenter l'écart dans `note_nom_de_fichier`, n'employer
  « Gwenn » dans aucun texte enfant.

## Ce qui doit revenir corrigé

Par ordre de coût croissant. Les constats 1, 2, 7 et 11 sont des corrections de
quelques lignes ; 5, 9, 10 et 13 sont de la réécriture de texte ; 3, 4 et 6 sont
des décisions de structure qui doivent être **tranchées dans le livrable**, pas
renvoyées au développement.

| Constat | Nature | Fichier |
| --- | --- | --- |
| 1 | Retirer `"bravo.titre"` de `cloture.cles_ui` | `encouragements.json` |
| 2 | Remplacer 5 clés par les clés éclatées du marketing | `encouragements.json` |
| 7 | Renommer les 2 boutons, inverser `ordre`, porter la hiérarchie | `gwenn-scripts.json` |
| 11 | `enc.reprise_session.01` → « On reprend là où on en était. » | `encouragements.json` |
| 12 | Corriger la phrase de répartition des canaux | `contenu-enfant.out.md` |
| 5 | Réécrire 10 variantes de `photo_illisible`, ajouter la sortie | `encouragements.json` |
| 9 | Réécrire 4 variantes de `pas_de_devoirs` | `encouragements.json` |
| 10 | Réécrire `enc.cloture.16` et `enc.cloture.18` | `encouragements.json` |
| 13 | Reformuler 6 tournures au concret | `encouragements.json` |
| 3 | Décider comment une variante désigne sa clé d'écran | structure |
| 4 | Éclater `indice_demande` en 4 niveaux, ou neutraliser 6 variantes | structure |
| 6 | Éclater `blocage` en `blocage_maths` / `blocage_lecture` | structure |
| 8 | Trancher l'énumération de canal, l'écrire dans les deux livrables | structure + Orchestrateur |

Les constats 3, 4, 6 et 8 augmentent le volume de la banque (PED-11 s'applique à
chaque situation réelle). Si l'Orchestrateur juge le volume disproportionné, la
décision lui revient, mais elle doit être **écrite** : PED-11 exige 20 variantes
par situation, et regrouper deux situations sous une clé unique pour tenir le
compte n'est pas une façon de couvrir l'exigence.
