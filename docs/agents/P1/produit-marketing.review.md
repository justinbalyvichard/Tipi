VERDICT: FAIL

# Contrôle de `docs/agents/P1/produit-marketing.out.md`

Contrôleur : `controle-produit` (lecture seule). Producteur : `produit-marketing`.
Sources du contrôle : `TIPI-PROMPT-CURSOR.md` sections 1, 2 et 3, lues en entier ;
livrable lu en entier (1654 lignes) ; toutes les mesures ci-dessous ont été
exécutées par le contrôleur, les sorties réelles sont collées en fin de document.

Règle appliquée mécaniquement : **un seul [BLOQUANT] ou [MAJEUR] impose FAIL.**
Relevé : 0 [BLOQUANT], 5 [MAJEUR], 5 [MINEUR] → **FAIL**.

---

## Ce qui a été vérifié et qui tient

Ces points sont bons. Ils sont listés pour que le producteur ne les casse pas en corrigeant le reste.

- **Les 14 routes de la section 3.1 sont toutes traitées**, dans l'ordre du tableau,
  une section chacune (7.1 à 7.14). Comptage mécanique : 14 sections. Chacune porte
  un titre, un corps, un libellé de bouton principal, un état vide (ou la mention
  explicite « sans objet ») et un état d'erreur rédigé. `/` fait exception assumée et
  justifiée par écrit (« cet écran **n'a aucun texte** (DES-10) ») et porte tout de
  même un état d'erreur rédigé (`parent.aiguillage.bandeau`). Aucun écran n'est
  seulement décrit au lieu d'être rédigé.
- **154 chaînes destinées à l'enfant extraites, 0 phrase de plus de 12 mots.** La plus
  longue fait 10 mots. Mesure mécanique, sortie collée en annexe A.
- **Aucun emoji.** Recherche sur les plages Unicode de pictogrammes, 0 correspondance,
  sortie collée en annexe B.
- **Aucun terme interdit de la charte dans les 154 chaînes enfant** : ni « c'est faux »,
  ni « faux », ni « erreur », ni « trompé », ni « faire mieux », ni « plus vite », ni
  « dépêche », ni « série », ni « d'affilée », ni « score », ni « points », ni
  « intelligent », ni « doué », ni comparaison. 0 occurrence, annexe C.
- **Aucun anglicisme** dans les textes enfant ni parent (recherche sur 19 anglicismes
  courants, 0 occurrence, annexe C). Le niveau de langue enfant est tenu : présent de
  l'indicatif, pas de subordonnée complexe.
- **Aucune référence à la Bretagne comme thème de marque.** Le breton n'apparaît que
  comme contenu de devoir (7.5 cas breton) et comme réglage parent
  (`reglages.enfant.bilingue`), conformément à PED-13. La section 3.3 l'interdit
  explicitement et l'arbitrage A12 le tranche. Une seule réserve mineure, constat 9.
- **Aucune promesse de performance scolaire, aucun vocabulaire de compétition ou de
  classement, aucun mécanisme d'urgence, de rareté, de streak, ni de notification
  culpabilisante** dans le livrable. Les notifications interdites sont même listées
  nommément en section 8.
- **Les 23 exigences PRD-01→18 et ETH-01→05 sont toutes citées** et j'ai ouvert chaque
  section citée : la décision produit y est réellement écrite dans 19 cas sur 23.
  Les 4 exceptions font l'objet des constats 2, 3, 4 et 5.
- **Les compteurs annoncés par le producteur sont vrais** : « checklist de 6 items »
  pour ETH-01, ETH-02, ETH-04, ETH-05 et « 5 items » pour ETH-03 — vérifié, 6/6/5/6/6.
  « Les 8 écrans enfant » de ETH-01.1 — vérifié, il y en a bien 8. « Les 14 écrans »
  de ETH-02.1 et ETH-03.1 — vérifié.
- Aucun fichier `content/*.json` n'existe encore à cette date (`ls` en annexe D) :
  il n'y a donc aucun compteur de variantes à recompter sur ce livrable. C'est le
  périmètre de `contenu-enfant` (P1bis), et le livrable le dit correctement.

---

## Constats

### 1. [MAJEUR] — Quatre textes enfant figent l'ordre lecture → maths, alors que PRD-04 autorise le parent à réordonner et à retirer une matière

Textes fautifs, cités exactement :

- ligne 510 : `` `enfant.programme.corps` | « D'abord la lecture. Après, les maths. » | dit_affiche ``
- ligne 522 : `` `enfant.programme.une.corps` | « On fait la lecture. Et c'est tout. » | dit_affiche ``
- ligne 716 : `` `maths.intro.titre` | « Maintenant, les maths. » | dit_affiche ``
- ligne 792 : `` `transition.felicitation` | « C'est fait. Tu as terminé la lecture. » | dit_affiche ``

Le livrable écrit lui-même, ligne 1120 : « **L'ordre choisi est celui que Pilou
annonce à l'enfant en 7.4** », et la couverture PRD-04 (ligne 1627) revendique
« retirer une étape, la faire passer en premier ».

Donc les états atteignables suivants n'ont **aucun texte rédigé** :
maths seule (le parent retire la lecture, PRD-04), maths en premier
(bouton « Faire passer en premier », ligne 1106), et la transition maths → lecture.
Dans ces états, le texte livré est factuellement faux pour l'enfant : Pilou annonce
la lecture alors qu'il n'y a pas de lecture. La DoD de `produit-marketing` exige
les textes définitifs de chaque écran ; ils manquent ici.

**Correction attendue** : ajouter les variantes manquantes avec des clés explicites,
et non une interpolation de matière dans une phrase figée :
`enfant.programme.corps.lecture_maths` et `enfant.programme.corps.maths_lecture`
(« D'abord les maths. Après, la lecture. ») ;
`enfant.programme.une.corps.lecture` et `enfant.programme.une.corps.maths`
(« On fait les maths. Et c'est tout. ») ;
`maths.intro.titre.premier` (« On commence par les maths. ») en plus de
`maths.intro.titre.apres` (« Maintenant, les maths. ») ;
`transition.felicitation.lecture` et `transition.felicitation.maths`
(« C'est fait. Tu as terminé les maths. »). Toutes ≤ 12 mots.

### 2. [MAJEUR] — L'affirmation « le solde est le seul chiffre montré à l'enfant » est fausse dans le livrable lui-même

Texte fautif, ligne 938 : « **Décision produit** : le solde est le **seul chiffre**
montré à l'enfant dans toute l'application. »
Repris comme arbitrage opposable A2, ligne 1601 : « Le solde est le **seul** chiffre
montré à l'enfant, uniquement dans `/enfant/coffre`. »

Or le même écran 7.9 contient trois chaînes enfant porteuses d'un nombre :

- ligne 947 : `` `coffre.solde.valeur` | « {n} » | affiche ``
- ligne 960 : `` `coffre.palier.reste` | « Encore {n} pierres. » | dit_affiche ``
- ligne 985 : `` `coffre.cosmetiques.verrouille` | « Il faut {n} pierres pour celui-là. » | dit_affiche ``

L'arbitrage A2 est l'unique justification qui autorise un chiffre devant l'enfant
face à PED-07. Il est construit sur une prémisse fausse et ne couvre donc que la
première des trois chaînes. `design-system` et `dev-feature` implémenteront
l'affirmation de la ligne 938 et se tromperont.

**Correction attendue** : réécrire la ligne 938 et l'arbitrage A2 pour énumérer
exactement les trois chiffres admis devant l'enfant, tous dans `/enfant/coffre`,
et écrire la règle générale qui les autorise : « seuls des nombres d'inventaire
de pierres, qui ne baissent jamais et ne mesurent pas l'enfant, sont affichés,
et uniquement dans `/enfant/coffre` ». Ajouter l'interdiction correspondante :
aucun nombre sur les sept autres écrans enfant.

### 3. [MAJEUR] — L'item de checklist ETH-05.3 est contredit par le texte livré en 7.14 : aucun contrôleur ne pourra jamais y répondre « oui »

Item opposable, ligne 1576 : « ETH-05.3 | La description du palier est saisie par le
parent, **jamais proposée ou suggérée par l'application** ? | `/reglages`, sous-page
Paliers, aucun modèle pré-rempli »

Texte livré, ligne 1368 : `` `reglages.paliers.description_ex` | « Par exemple : une
sortie au parc le samedi. » ``

C'est très exactement une récompense réelle suggérée par l'application. La checklist
éthique est le livrable opposable que les contrôleurs aval doivent pouvoir cocher ;
ici elle s'auto-invalide.

**Correction attendue** : trancher dans un sens ou dans l'autre, et une seule fois.
Soit supprimer `reglages.paliers.description_ex`. Soit reformuler ETH-05.3 en
« La description du palier est saisie par le parent. Le champ est vide par défaut ;
aucune valeur n'est pré-remplie ni enregistrée à la place du parent. Un exemple de
saisie neutre est admis », et remplacer l'exemple par un exemple qui ne soit pas une
récompense matérielle ou une sortie.

### 4. [MAJEUR] — L'item ETH-05.1 est falsifié par le produit lui-même : une promesse de récompense réelle écrite par le parent est affichée et lue à l'enfant

Item opposable, ligne 1574 : « ETH-05.1 | Aucune phrase dite ou affichée à l'enfant ne
promet un objet, une sortie ou un avantage réel ? | Recherche dans
`content/encouragements.json` et `content/gwenn-scripts.json` »

Texte livré, ligne 959 : `` `coffre.palier.description` |
« {description_definie_par_le_parent} » | affiche ``, sur l'écran enfant
`/enfant/coffre`, alimenté par le champ dont l'exemple fourni au parent est
« une sortie au parc le samedi » (ligne 1368).

Deux défauts distincts, tous deux à corriger :

1. Le périmètre de recherche de ETH-05.1 est faux. Les deux fichiers cités ne
   contiennent pas cette chaîne : elle vient de la base, saisie par le parent.
   Un contrôleur qui applique l'item à la lettre coche « oui » et passe à côté de
   la seule chaîne du produit qui puisse promettre une récompense réelle à l'enfant.
2. Aucune contrainte n'est posée sur cette chaîne : ni longueur maximale, ni règle
   de ton, ni interdiction d'emoji, alors que **toutes** les autres chaînes enfant du
   livrable sont soumises aux 12 mots (6.3) et à DES-07. C'est un trou dans la charte.

ETH-05 du prompt maître n'est pas violée au sens strict — l'application n'octroie
rien, et `coffre.palier.maison` (ligne 962) dit correctement que la décision se prend
à la maison. C'est la checklist du producteur, plus stricte, qui est invérifiable.

**Correction attendue** : (a) corriger le « où regarder » de ETH-05.1 en ajoutant
« et le champ `reward_threshold.description` saisi par le parent, tel qu'il est rendu
par `coffre.palier.description` » ; (b) écrire en 7.9 et en 7.14 la règle de
traitement de cette chaîne côté enfant : longueur plafonnée, aucun emoji, affichage
toujours accompagné de `coffre.palier.maison` ; ou décider que la description n'est
pas affichée à l'enfant et que `/enfant/coffre` ne montre que
`coffre.palier.reste`. Cette décision doit être écrite, pas sous-entendue.

### 5. [MAJEUR] — PRD-06 est annoncée couverte alors que le livrable relâche sa contrainte littérale sans escalade

PRD-06, prompt maître : « Résumé de fin de session pour le parent : qualitatif,
**jamais chiffré**, + notification ».

Livrable, lignes 1170 à 1172 : « Les seules données chiffrées autorisées sont la
**durée totale de la séance** et le **nombre de pierres créditées**, qui ne sont pas
des mesures de l'enfant. »

Chaînes concernées :

- ligne 1177 : `` `parent.resume.date` | « {date} · {duree} minutes » ``
- ligne 1182 : `` `parent.resume.pierres` | « {n} pierres créditées. » ``

La ligne de couverture PRD-06 (ligne 1629) écrit pourtant « Résumé qualitatif […]
Seules la durée de séance et le nombre de pierres sont chiffrés » et se déclare
couverte. Une exigence dont la contrainte est « jamais chiffré » ne peut pas être
déclarée couverte par un résumé qui contient deux chiffres, sur la seule base d'un
arbitrage interne (A7, ligne 1606). La durée de séance est de surcroît la donnée la
plus directement lisible en performance d'un soir sur l'autre, ce que le livrable
refuse partout ailleurs (ETH-02, ligne 1204 : « ni de comparaison avec les soirs
précédents »).

**Correction attendue** : au choix, et de façon explicite.
Soit supprimer les deux chiffres — `parent.resume.date` devient « {date} » et
`parent.resume.pierres` devient « Les pierres de ce soir sont dans le coffre. » —
et PRD-06 redevient couverte telle qu'écrite.
Soit maintenir l'arbitrage, et alors écrire une ligne dans `docs/agents/ESCALADE.md`
demandant une dérogation humaine explicite sur PRD-06, et marquer PRD-06
« couverte sous dérogation en attente » dans le tableau de couverture, pas
« couverte ».

### 6. [MINEUR] — L'écran de lancement se contredit sur sa propre durée

Ligne 248 : « | Durée | Visible 800 ms maximum. Si l'aiguillage `/` n'a pas tranché au
bout de 1 200 ms, l'écran reste affiché tel quel sans indicateur ni message | »

« 800 ms maximum » et « reste affiché au bout de 1 200 ms » ne peuvent pas être vrais
ensemble. `design-system` devra trancher seul, ce qui n'est pas son rôle.

**Correction attendue** : « Visible 800 ms au minimum, pour éviter un clignotement.
Si l'aiguillage n'a pas tranché, l'écran reste affiché tel quel, sans indicateur,
sans limite de durée et sans message. »

### 7. [MINEUR] — « Une seconde. » est une figure de style servie à un enfant qui prend tout au premier degré

Ligne 493 : `` `enfant.attente.pilou` | « Je regarde tes devoirs. Une seconde. » | dit_affiche ``

La charte de ton, section 1.3 du prompt maître : « Jamais d'ironie, jamais de second
degré : un enfant de 6 ans prend tout au premier degré. » Cette attente est déclenchée
au-delà de 400 ms (TEC-12) et le livrable annonce lui-même une analyse « d'une
quinzaine de secondes » (ligne 1083). La phrase énonce donc à l'enfant une durée
fausse, et introduit une unité de temps là où PED-07 veut qu'il n'y en ait aucune.

**Correction attendue** : remplacer par « Je regarde tes devoirs. J'arrive. »
(7 mots, aucune durée).

### 8. [MINEUR] — `/enfant/bravo` propose deux boutons sans hiérarchie, alors que le livrable revendique DES-06

Lignes 892 et 893 :
`` | 6 | `bravo.bouton` | « Voir mon coffre » | affiche ``
`` | 6 bis | `bravo.bouton_2` | « Aller jouer » | affiche ``

Le livrable pose pourtant lui-même, ligne 66 : « Une seule action principale par
écran, toujours en bas (DES-06) ». Le rang « 6 bis » ne dit pas lequel est l'action
principale. Sur l'écran de clôture, c'est exactement la décision qui compte : si
« Voir mon coffre » est l'action principale, le rituel du soir se termine sur
l'inventaire des pierres plutôt que sur « tu peux aller jouer », ce qui contredit
l'intention de PRD-11.

**Correction attendue** : désigner « Aller jouer » comme action principale en bas
d'écran, et « Voir mon coffre » comme action secondaire, visuellement en retrait,
et l'écrire dans la section 7.8.

### 9. [MINEUR] — Le nom de fichier `content/gwenn-scripts.json` est un mot breton, en contradiction avec l'interdit de marque posé par le livrable

Ligne 315 : `` | `content/gwenn-scripts.json` | Répliques fixes de Pilou : rituels,
onboarding, clôture. Une seule variante, jouée à l'identique | ``

Contre la ligne 209 du même livrable : « Aucune référence à la Bretagne, à la langue
bretonne ou à un folklore régional dans le nom, l'univers, les visuels, les sons ou
les textes de marque. »

« gwenn » est le mot breton pour « blanc », et il ne désigne aucun objet du produit :
la mascotte s'appelle Pilou, décidé ligne 85. Le nom est repris tel quel du prompt
maître (`.cursor/agents/contenu-enfant.md`), **ce n'est donc pas une invention du
producteur** et je ne le lui impute pas. Mais un contrôleur qui applique l'item
TON-6 de la checklist (ligne 1590) tombera dessus.

**Correction attendue** : ne pas renommer le fichier de sa propre initiative — c'est
le prompt maître qui le fixe. Ouvrir une ligne dans `docs/agents/ESCALADE.md`
demandant l'arbitrage humain entre `content/gwenn-scripts.json` (prompt maître) et
`content/pilou-scripts.json` (cohérent avec la marque), et noter la contradiction
en section 11 des arbitrages.

### 10. [MINEUR] — Double espace dans une chaîne d'interface

Ligne 1082 : `` | `parent.scan.analyse_en_cours` | « Analyse en cours…  » ``

Deux espaces entre le point de suspension et le guillemet fermant. Recopié tel quel
dans `content/ui-parent.json`, c'est un espace parasite à l'écran.

**Correction attendue** : « Analyse en cours… » avec un seul caractère de points de
suspension et aucun espace avant le guillemet fermant.

---

# AVIS gardien-charte

Passe appliquée par le contrôleur après son propre contrôle, avec la grille complète
de `.cursor/agents/gardien-charte.md`, sur les seuls textes destinés à l'enfant :
les 154 chaînes des sections 7.1 à 7.9 portant un champ `mode`, plus les répliques
de Pilou citées en prose dans ces sections.

**1. Ton — effort valorisé, jamais le résultat seul ; aucune formulation lisible comme un reproche.**
Conforme. Tous les retours portent sur l'acte : « Bravo. Tu as lu jusqu'au bout. »,
« Tu as bien cherché tes mots. », « Bravo. Tu as bien cherché. », « Tu as trouvé ta
façon de faire. », « Tu as fait tes devoirs ce soir. ». Le seul retour qui confirme un
résultat, « Oui, c'est bien ça. Tu as bien écouté. » (ligne 628), adjoint l'effort au
résultat : il n'est donc pas « le résultat seul ». La règle de personnalité de la
ligne 130 — « quand quelque chose échoue, c'est toujours Pilou qui n'a pas réussi » —
est tenue sans exception : « Je n'ai pas bien entendu. », « Le micro n'entend pas bien
ce soir. », « Je cherche encore tes devoirs. », « Je n'arrive pas à ouvrir le
coffre. », « Je ne sais pas le lire. ». Aucun message de difficulté n'a « tu » pour
sujet.

**2. Interdits absolus — « c'est faux », « erreur », « tu t'es trompé », « essaie de faire mieux », toute comparaison, toute ironie.**
Conforme sur les interdits lexicaux : 0 occurrence sur les 154 chaînes, vérifié
mécaniquement (annexe C). Aucune comparaison à un autre enfant, aucune comparaison à
un autre soir. La branche de réponse non attendue est traitée par une relance, « Tu
veux relire le début, pour voir ? », ce que la section 1.3 du prompt maître prescrit
explicitement en remplacement de « c'est faux ».
**Une réserve** : « Une seconde. » (ligne 493) est une figure de style. Ce n'est pas
de l'ironie, mais c'est un énoncé non littéral servi à un enfant de 6 ans, et il
annonce une durée que l'application ne tiendra pas.

**3. Charge — une idée par phrase, 12 mots maximum, vocabulaire de CE1.**
Conforme. 154 chaînes mesurées, 0 dépassement, maximum observé 10 mots. Présent de
l'indicatif partout, aucune subordonnée complexe, aucun mot hors CE1.

**4. Pression — aucun chrono, aucun décompte, aucun compteur d'erreurs, aucune série.**
Conforme. La pause n'a « aucune durée imposée, aucun décompte et aucun minuteur »
(ligne 840), son bouton de retour est actif à la première seconde, l'animation de
respiration n'affiche « aucun chiffre, aucun nombre de cycles » (ligne 856). Le rang
de l'indice n'est jamais dit : « Jamais « indice 2 sur 4 » » (ligne 747). Aucun
compteur d'erreurs, aucun compteur de tentatives, aucun compteur d'écoutes
(ligne 564). Aucune série, aucun calendrier de présence, aucune notification à
l'enfant. Réserve de forme, même passage qu'au point 2 : « Une seconde. » introduit
la seule unité de temps prononcée à l'enfant dans tout le livrable.

**5. Récompense — aucune promesse d'une récompense réelle par l'application, aucune perte de pierres possible.**
**NON CONFORME.** Aucune pierre ne se perd, c'est acquis et dit à l'enfant
(« Tes pierres restent là. Elles ne partent jamais. », « Elles sont à toi. Elles ne se
perdent pas. »). Mais l'écran enfant `/enfant/coffre` affiche
`coffre.palier.description` = « {description_definie_par_le_parent} » (ligne 959),
c'est-à-dire un texte libre dont le modèle proposé au parent est « Par exemple : une
sortie au parc le samedi. » (ligne 1368). L'application affiche donc bien à l'enfant
une promesse de récompense réelle. La mention « Je garde tes pierres. Le reste se
décide à la maison. » atténue, elle ne supprime pas : l'enfant lit la sortie au parc.
Aucune contrainte de ton, de longueur ni d'emoji n'est posée sur cette chaîne, alors
que toutes les autres chaînes enfant y sont soumises.

**6. Maths — aucun contenu, prompt ou repli ne peut conduire à donner le résultat.**
Conforme, et solidement. Quatre refus rédigés et rotatifs, « Je ne donne pas les
réponses. Je t'aide à chercher. », « Je garde la réponse pour toi. Tu vas trouver. »,
« C'est toi qui trouves. Moi, je t'aide. », « Non, je ne la dis pas. Veux-tu un
indice ? », suivis d'une proposition de pause sans jamais céder (ligne 762). Le repli
de panne IA ne donne pas non plus le résultat : « Je n'ai pas d'indice pour celui-là. »
puis « Compte sur tes doigts, ça marche bien. », avec la règle écrite ligne 819 :
« Le repli **ne donne jamais** le résultat ». Aucune validation juste/faux, aucune
coche, aucune croix.

**7. Autonomie — la pause reste toujours accessible et ne coûte jamais rien.**
Conforme. `session.pause.bouton` est « visible en haut à droite, cible de 56 px
minimum, jamais grisé, jamais masqué, jamais en couleur d'alerte » (ligne 656), sur
les deux écrans d'étape. Elle ne retire aucune pierre, ne compte pas comme un abandon,
et le retour ne la commente jamais. La sortie de tout état de blocage propose toujours
au moins deux issues dont une pause.

AVIS: NON CONFORME

Passage fautif, cité mot à mot, et reformulation proposée :

- Fautif, ligne 959 : `` | `coffre.palier.description` | « {description_definie_par_le_parent} » | affiche ``
  Reformulation proposée : retirer cette chaîne de l'écran enfant. `/enfant/coffre`
  n'affiche du palier que `coffre.palier.reste` — « Encore {n} pierres. » — et
  `coffre.palier.maison` — « Je garde tes pierres. Le reste se décide à la maison. ».
  La description saisie par le parent reste visible dans `/reglages`, côté parent.
  Si le produit tient à l'afficher à l'enfant, alors il faut écrire noir sur blanc
  la règle qui l'encadre : 12 mots maximum, aucun emoji, aucun verbe de promesse
  (« tu auras », « tu gagneras »), et affichage indissociable de
  `coffre.palier.maison`.

- Fautif, ligne 1368 : `` | `reglages.paliers.description_ex` | « Par exemple : une sortie au parc le samedi. » ``
  Reformulation proposée : « Par exemple : ce que vous avez prévu de faire ensemble. »
  L'exemple cesse alors de suggérer un objet ou une sortie précise, tout en aidant le
  parent à remplir le champ.

- Réserve, ligne 493 : `` | `enfant.attente.pilou` | « Je regarde tes devoirs. Une seconde. » | dit_affiche ``
  Reformulation proposée : « Je regarde tes devoirs. J'arrive. »

---

# Annexes — sorties réelles des commandes

Toutes les commandes ci-dessous ont été exécutées par `controle-produit` sur
`/home/user/Tipi/docs/agents/P1/produit-marketing.out.md`. Les sorties sont collées
telles quelles, sans retouche. Aucune sortie n'est reconstituée de mémoire.

## Annexe A — Longueur des phrases destinées à l'enfant (12 mots maximum)

Extraction de toutes les lignes de tableau dont la dernière colonne vaut `dit`,
`affiche` ou `dit_affiche`, découpage en phrases sur `.`, `?` et `!`, comptage des
mots, les marqueurs `{n}` comptant pour un mot.

Commande : `python3 mots.py` (script écrit dans le répertoire de travail temporaire
du contrôleur, jamais dans le produit).

```
Chaines enfant extraites (tables avec colonne mode) : 154


Phrases enfant de plus de 12 mots : 0

--- Les 6 phrases enfant les plus longues ---
L770   `maths.blocage.corps_2`            [10 mots] On souffle un peu, ou on passe à la suite ?
L692   `lecture.sans_voix.corps`          [10 mots] Je ne peux pas lire à voix haute ce soir.
L987   `coffre.cosmetiques.vide`          [ 8 mots] Il n'y a rien à mettre pour l'instant.
L974   `coffre.palier.vide`               [ 8 mots] Il n'y a pas de palier pour l'instant.
L921   `bravo.pierres_plus_tard`          [ 8 mots] Je range tes pierres un peu plus tard.
L807   `maths.vide.corps`                 [ 8 mots] Ce soir, il n'y a pas de maths.
```

## Annexe B — Absence d'emoji (DES-07)

Commande :

```
LC_ALL=C.UTF-8 grep -nP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}\x{1F1E6}-\x{1F1FF}\x{2700}-\x{27BF}\x{24C2}\x{203C}\x{2049}]' docs/agents/P1/produit-marketing.out.md
```

Sortie :

```
---EXIT=1 (1 = aucune correspondance)---
```

Aucune ligne remontée : aucun emoji, aucun dingbat, aucun pictogramme, aucun
sélecteur de variante emoji dans le livrable.

## Annexe C — Vocabulaire interdit et anglicismes dans les 154 chaînes enfant

Termes recherchés, recherche insensible à la casse, sur les 154 chaînes enfant
uniquement : `c'est faux`, `faux`, `incorrect`, `erreur`, `trompé`, `faire mieux`,
`recommence`, `plus vite`, `dépêche`, `il te reste`, `comme les autres`,
`intelligent`, `doué`, `score`, `points`, `série`, `d'affilée`, `perds`, `perdre`,
`dernière chance`, `plus que`, `vite`, `champion`, `gagné un`, `chrono`, `minute`,
`secondes`, `niveau`, `note`, `juste`, `bonne réponse`, puis les anglicismes
`score`, `streak`, `level`, `quiz`, `challenge`, `fun`, `cool`, `start`, `replay`,
`game`, `bonus`, `check`, `ok`, `coach`, `booster`, `badge`, `ranking`, `top`, `win`.

Sortie :

```
=== Occurrences de vocabulaire surveille dans les 154 chaines enfant ===
Total occurrences : 0

=== Phrases enfant citees en prose (hors tableaux), >12 mots ? ===
Phrases enfant en prose de plus de 12 mots : 0
```

## Annexe D — Couverture des exigences, comptage par le contrôleur

```
=== Occurrences par exigence (PRD-01..18, ETH-01..05) ===
PRD-01 :  4 occurrences | lignes: 376 385 391 1624 
PRD-02 :  3 occurrences | lignes: 1321 1335 1625 
PRD-03 :  3 occurrences | lignes: 1011 1024 1626 
PRD-04 :  6 occurrences | lignes: 517 1093 1111 1119 1607 1627 
PRD-05 :  2 occurrences | lignes: 1124 1628 
PRD-06 :  8 occurrences | lignes: 102 161 204 1165 1167 1476 1606 1629 
PRD-07 :  2 occurrences | lignes: 499 1630 
PRD-08 :  2 occurrences | lignes: 544 1631 
PRD-09 :  2 occurrences | lignes: 706 1632 
PRD-10 :  2 occurrences | lignes: 787 1633 
PRD-11 :  5 occurrences | lignes: 184 205 877 881 1634 
PRD-12 :  7 occurrences | lignes: 54 68 429 650 837 1603 1635 
PRD-13 :  6 occurrences | lignes: 659 801 911 1235 1285 1636 
PRD-14 :  5 occurrences | lignes: 88 936 954 1359 1637 
PRD-15 :  6 occurrences | lignes: 1011 1029 1230 1300 1471 1638 
PRD-16 : 10 occurrences | lignes: 28 466 685 1027 1045 1074 1502 1504 1608 1639 
PRD-17 :  4 occurrences | lignes: 89 1344 1355 1640 
PRD-18 :  8 occurrences | lignes: 357 376 456 695 822 1511 1546 1641 
ETH-01 : 21 occurrences | lignes: 29 185 191 198 298 841 906 991 1489 1495 1520 1527 1531 1532 1533 1534 1535 1536 1603 1604 1642 
ETH-02 : 22 occurrences | lignes: 163 189 199 301 464 866 909 1054 1204 1489 1493 1494 1498 1538 1542 1543 1544 1545 1546 1547 1610 1643 
ETH-03 : 11 occurrences | lignes: 200 991 994 1409 1549 1553 1554 1555 1556 1557 1644 
ETH-04 : 18 occurrences | lignes: 68 73 190 201 300 429 775 925 940 1376 1559 1563 1564 1565 1566 1567 1568 1645 
ETH-05 : 18 occurrences | lignes: 29 104 192 202 954 964 1359 1373 1520 1570 1574 1575 1576 1577 1578 1579 1602 1646 
```

Chaque section citée a été ouverte et lue. Les quatre exigences dont la décision
produit n'est pas réellement tenue à l'endroit cité sont PRD-04 (constat 1),
PRD-14 / PED-07 par l'arbitrage A2 (constat 2), ETH-05 (constats 3 et 4) et
PRD-06 (constat 5).

Aucun fichier de contenu n'existe encore, il n'y a donc aucun compteur de variantes
à recompter sur ce livrable :

```
ls: cannot access '/home/user/Tipi/content': No such file or directory
```

## Annexe E — Les 14 routes de la section 3.1

```
=== Les 14 sections d'ecran ===
351:## 7.1 `/` — Aiguillage
389:## 7.2 `/bienvenue` — Onboarding, 3 écrans
443:## 7.3 `/enfant` — Accueil
497:## 7.4 `/enfant/programme` — Annonce des 2 étapes en pictos
542:## 7.5 `/enfant/session/lecture` — Étape lecture
704:## 7.6 `/enfant/session/maths` — Étape maths
834:## 7.7 `/enfant/pause` — Respiration guidée
875:## 7.8 `/enfant/bravo` — Clôture et pierres gagnées
933:## 7.9 `/enfant/coffre` — Coffre à trésors
1008:## 7.10 `/parent` — Scan des devoirs
1091:## 7.11 `/parent/programme` — Aperçu et ajustement
1163:## 7.12 `/parent/resume` — Résumé de fin de session
1228:## 7.13 `/reglages/code` — Clavier numérique 10 chiffres
1298:## 7.14 `/reglages` — Menu Réglages et sous-pages

Nombre de sections d'ecran : 14
```

Pointage écran par écran, fait à la lecture, contre le tableau de la section 3.1 du
prompt maître. « BP » = libellé du bouton principal rédigé. « Err » = au moins un
état d'erreur rédigé. « Vide » = état vide rédigé ou déclaré sans objet.

| # | Route | BP | Err | Vide | Textes rédigés, pas seulement décrits |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | sans objet, décision écrite | oui, `parent.aiguillage.bandeau` | sans objet | oui |
| 2 | `/bienvenue` | oui, 3 boutons | oui, TTS indisponible | déclaré sans objet | oui |
| 3 | `/enfant` | oui, « On commence » | oui, `enfant.accueil.souci.*` | oui, `enfant.accueil.vide.*` | oui |
| 4 | `/enfant/programme` | oui, « Je commence » | oui, `enfant.programme.souci.*` | oui, renvoi motivé vers 7.3 | oui, sauf constat 1 |
| 5 | `/enfant/session/lecture` | oui, « À mon tour » | oui, micro absent et voix absente | oui, `lecture.vide.*` | oui |
| 6 | `/enfant/session/maths` | oui, « J'ai trouvé » | oui, `maths.sans_indice.*` | oui, `maths.vide.*` | oui, sauf constat 1 |
| 7 | `/enfant/pause` | oui, « Je reviens » | oui, décision écrite sans texte nouveau | déclaré sans objet | oui |
| 8 | `/enfant/bravo` | oui, mais hiérarchie absente, constat 8 | oui, `bravo.pierres_plus_tard.*` | déclaré sans objet | oui |
| 9 | `/enfant/coffre` | oui, « Retour » | oui, `coffre.souci.*` | oui, palier vide et cosmétiques vides | oui, sauf constat 4 |
| 10 | `/parent` | oui, « Analyser les devoirs » | oui, 4 cas rédigés | oui, 2 cas rédigés | oui |
| 11 | `/parent/programme` | oui, « Lancer la session » | oui, 2 cas rédigés | oui, `parent.apercu.vide.*` | oui |
| 12 | `/parent/resume` | oui, « Fermer » | oui, 3 cas rédigés | oui, `parent.resume.vide.*` | oui, sauf constat 5 |
| 13 | `/reglages/code` | oui, « Valider » | oui, refus et blocage | sans objet | oui |
| 14 | `/reglages` | oui, « Fermer les réglages » | oui, 4 cas rédigés | oui, 3 cas rédigés | oui, sauf constat 3 |

## Annexe F — Vérification des contradictions internes relevées

```
=== Chaines ENFANT contenant un nombre variable {n} ===
947:| `coffre.solde.valeur` | « {n} » | affiche |
960:| `coffre.palier.reste` | « Encore {n} pierres. » | dit_affiche |
985:| `coffre.cosmetiques.verrouille` | « Il faut {n} pierres pour celui-là. » | dit_affiche |

=== Affirmation opposee, section 7.9 et arbitrage A2 ===
938:**Décision produit** : le solde est le **seul chiffre** montré à l'enfant dans

=== Textes enfant qui figent l'ordre ou la matiere ===
510:| `enfant.programme.corps` | « D'abord la lecture. Après, les maths. » | dit_affiche |
522:| `enfant.programme.une.corps` | « On fait la lecture. Et c'est tout. » | dit_affiche |
716:| `maths.intro.titre` | « Maintenant, les maths. » | dit_affiche |
792:| `transition.felicitation` | « C'est fait. Tu as terminé la lecture. » | dit_affiche |
1633:| PRD-10 | 7.6, transition | Transition douce : félicitation courte (`transition.felicitation`), micro-animation de 600 ms sans flash, annonce de l'étape suivante (`transition.annonce`), puis un seul bouton « Continuer » |

=== Contradiction ETH-05.3 / description_ex ===
1368:| `reglages.paliers.description_ex` | « Par exemple : une sortie au parc le samedi. » |
1574:| ETH-05.1 | Aucune phrase dite ou affichée à l'enfant ne promet un objet, une sortie ou un avantage réel ? | Recherche dans `content/encouragements.json` et `content/gwenn-scripts.json` | [ ] |
1576:| ETH-05.3 | La description du palier est saisie par le parent, jamais proposée ou suggérée par l'application ? | `/reglages`, sous-page Paliers, aucun modèle pré-rempli | [ ] |

=== Double espace dans une chaine parent ===
1082:| `parent.scan.analyse_en_cours` | « Analyse en cours…  » |
```

```
=== Items de checklist par exigence ETH ===
ETH-01 : 6 items
ETH-02 : 6 items
ETH-03 : 5 items
ETH-04 : 6 items
ETH-05 : 6 items

=== Chiffres dans le resume parent (PRD-06 : 'jamais chiffre') ===
1170:faits qualitatifs et une observation utile pour le lendemain. Les seules données
1177:| `parent.resume.date` | « {date} · {duree} minutes » |
1182:| `parent.resume.pierres` | « {n} pierres créditées. » |

=== Ordre modifiable annonce au parent ===
1120:et activer « Soir léger ». L'ordre choisi est celui que Pilou annonce à l'enfant
1627:| PRD-04 | 7.11 | L'aperçu est modifiable : retirer une étape, la faire passer en premier, modifier une consigne, et activer « Soir léger » (une seule étape, plus courte). L'ordre choisi est celui que Pilou annonce à l'enfant |

=== Ecran de lancement : duree ===
| Durée | Visible 800 ms maximum. Si l'aiguillage `/` n'a pas tranché au bout de 1 200 ms, l'écran reste affiché tel quel sans indicateur ni message |
```

Les compteurs annoncés par le producteur sont donc exacts : 6, 6, 5, 6 et 6 items,
conformes à ce qu'annonce le tableau de couverture des lignes 1642 à 1646.

## Annexe G — Mentions du breton

```
13:Aucune référence à la Bretagne dans la marque : le breton est une contrainte de
76:référence bretonne, pas de motif amérindien, pas de folklore. Le tipi de Tipi
209:- Aucune référence à la Bretagne, à la langue bretonne ou à un folklore
211:  marque. Le breton n'apparaît que comme **contenu de devoir** (PED-13).
315:| `content/gwenn-scripts.json` | Répliques fixes de Pilou : rituels, onboarding, clôture. Une seule variante, jouée à l'identique |
635:**Cas breton** (PED-13) — texte affiché, consigne expliquée en français, pas de
640:| `lecture.breton.intro` | « Ce texte est en breton. » | dit_affiche |
641:| `lecture.breton.corps` | « Je ne sais pas le lire. Toi, oui. » | dit_affiche |
642:| `lecture.breton.consigne` | « Lis-le à voix haute, tranquillement. » | dit_affiche |
643:| `lecture.breton.bouton` | « J'ai lu » | affiche |
644:| `lecture.breton.bouton_2` | « M'enregistrer » | affiche |
646:Aucune promesse n'est faite à l'enfant sur le breton (PED-13). Pilou dit
1197:| Exercice breton | « Le texte en breton a été lu par Evan seul. Pilou ne le corrige pas. » |
1331:| `reglages.enfant.bilingue` | « Classe bilingue français-breton » |
1332:| `reglages.enfant.bilingue_aide` | « Les textes en breton sont affichés. Pilou les explique en français, sans les lire. » |
1341:sur le breton, et elle est faite au parent, jamais à l'enfant. Aucun réglage ne
1342:laisse croire qu'une voix bretonne arrivera.
1574:| ETH-05.1 | Aucune phrase dite ou affichée à l'enfant ne promet un objet, une sortie ou un avantage réel ? | Recherche dans `content/encouragements.json` et `content/gwenn-scripts.json` | [ ] |
1590:| TON-6 | Aucune référence à la Bretagne hors contenu de devoir ? | `content/**`, visuels, sons, nom | [ ] |
1611:| A12 | Le breton dans la marque | **Exclu totalement.** Le breton n'existe que comme contenu de devoir, et la seule mention est destinée au parent | PED-13, consigne de marque |
1614:voix de synthèse bretonne, second enfant dans l'interface, partage du résumé.
1631:| PRD-08 | 7.5 | Étape lecture complète : modèle lu par Pilou, réécoute illimitée, micro, retour centré sur l'effort, hésitation traitée par une proposition, transcription douteuse traitée par « je n'ai pas bien entendu », questions de compréhension avec « Je ne sais pas » toujours disponible, cas breton en mode dégradé
```

Sortie tronquée à 40 lignes par `head -40` à l'exécution ; la ligne 1631 ci-dessus
est la dernière remontée et la liste est complète.

Toutes les occurrences sont soit des interdits de marque posés par le livrable, soit
du contenu de devoir conforme à PED-13, soit un réglage destiné au parent. Une seule
occurrence pose question, `content/gwenn-scripts.json`, traitée au constat 9, et elle
provient du prompt maître, pas du producteur.

---

## Suite attendue

Le producteur `produit-marketing` reprend son livrable sur les constats 1 à 10, puis
`controle-produit` rejoue ce contrôle en entier. Les constats 3, 4 et 5 touchent la
checklist éthique opposable et le tableau de couverture : ils doivent être corrigés
dans le livrable, pas seulement dans le rapport du producteur. Le constat 5 et le
constat 9 peuvent appeler une ligne dans `docs/agents/ESCALADE.md` si le producteur
choisit de maintenir sa position plutôt que de corriger.

Aucun fichier du produit n'a été écrit ni modifié par ce contrôle. Aucun commit git.
