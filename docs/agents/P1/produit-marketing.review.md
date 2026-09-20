VERDICT: PASS_AVEC_RESERVES

# Contrôle de `docs/agents/P1/produit-marketing.out.md` — tour 2

Contrôleur : `controle-produit` (lecture seule). Producteur : `produit-marketing`.
Tour 2 sur 3. Le livrable est passé de 1654 à 1904 lignes.
Sources : `TIPI-PROMPT-CURSOR.md` sections 1, 2 et 3 ; livrable relu **en entier**,
pas seulement aux endroits corrigés ; tous les contrôles mécaniques rejoués par le
contrôleur, sans reprendre un seul chiffre du producteur.

Relevé : **0 [BLOQUANT], 0 [MAJEUR], 3 [MINEUR]** → la règle « un seul BLOQUANT ou
MAJEUR impose FAIL » ne s'applique pas. **PASS_AVEC_RESERVES.**

Les trois réserves sont mineures, toutes rédactionnelles, aucune ne bloque le
démarrage de P1bis ni de P2. Aucune n'exige un nouveau tour de contrôle : elles se
corrigent en même temps que la prochaine passe sur le document.

---

## Les cinq [MAJEUR] du tour 1 sont réellement corrigés

Vérifié à la lecture, pas sur déclaration.

**Constat 1 — ordre des étapes figé. Corrigé, et bien corrigé.**
La nouvelle section 7.0 pose six configurations C1 à C6 et une table de sélection
normative de 14 lignes. J'ai déroulé les six configurations moi-même contre les
textes livrés : aucune ne fait nommer par Pilou une matière absente du programme.
Les douze variantes annoncées existent toutes (annexe E). Le point délicat est traité
explicitement : `lecture.intro.titre.premier` est joué « y compris quand elle est la
seule » (ligne 659), `maths.intro.titre.premier` de même « (configurations C2, C4 et
C6) » (ligne 833), et l'écran de transition est déclaré inexistant dans une soirée à
une étape (ligne 921). Le refus de l'interpolation est motivé et juste : « « D'abord
la {matiere}. » est interdit, parce que la phrase ne tiendrait plus au pluriel (« la
maths ») » (ligne 405). Les deux états vides d'étape sont eux aussi éclatés en
`.suite` et `.fin`, ce que je n'avais pas demandé et qui ferme un trou réel.

**Constat 2 — « le solde est le seul chiffre ». Corrigé.**
La phrase fausse a disparu de 7.9. À la place, une règle générale opposable
(ligne 1086), la liste exhaustive des trois nombres avec ce que chacun compte
(lignes 1095 à 1099), l'interdiction nommant les sept autres écrans enfant
(ligne 1101), l'arbitrage A2 réécrit et un nouvel item de checklist TON-7. J'ai
recompté : il y a exactement **3** chaînes enfant porteuses d'un nombre, et les trois
sont dans `/enfant/coffre` (annexe D). Un résidu subsiste en section 1.1, voir
constat 1 ci-dessous, mais il est mineur et ne touche plus la partie normative.

**Constat 3 — ETH-05.3 contredit par l'exemple de palier. Corrigé.**
`reglages.paliers.description_ex` est devenu « Par exemple : ce que vous avez prévu de
faire ensemble. » : plus aucun objet, aucune sortie, aucun avantage nommé. ETH-05.3
est reformulé une seule fois et devient vérifiable, avec le bon « où regarder » :
champ vide à la création, plus le texte de `description_ex`. L'item est désormais
cochable de bonne foi.

**Constat 4 — texte libre parent affiché à l'enfant. Corrigé, avec le bon motif.**
`coffre.palier.description` n'apparaît plus dans aucune table de 7.9. La décision est
écrite en deux temps (lignes 1130 à 1156), avec le motif exact que j'avais demandé :
ce champ « échapperait à toutes les règles qui s'appliquent à chaque autre chaîne
enfant du produit — 12 mots maximum (6.3), vocabulaire de CE1, interdiction d'emoji
(DES-07), interdiction de promesse » (ligne 1138). Le périmètre de ETH-05.1 est
corrigé et couvre maintenant « toute donnée saisie par le parent qui serait rendue
sur un écran enfant ». Un item ETH-05.1 bis est ajouté, qui demande 0 occurrence de
`coffre.palier.description` et de `reward_threshold.description` sous
`src/app/enfant/**`. Côté parent, `reglages.paliers.description_aide` — « Ce texte
reste ici. Il n'est pas affiché à Evan. » — prévient le parent au moment où il
saisit. C'est plus complet que ce que j'avais exigé.

**Constat 5 — PRD-06 « jamais chiffré ». Corrigé, sans dérogation.**
Les deux chiffres sont retirés. `parent.resume.date` est réduit à « {date} » et
`parent.resume.pierres` devient « Les pierres de ce soir sont dans le coffre. ».
L'arbitrage A7 est réécrit en « **Aucune.** PRD-06 pris à la lettre […] Aucune
dérogation n'est donc demandée ». Le producteur a choisi de corriger plutôt que
d'escalader, ce qui était la meilleure des deux branches que je lui avais laissées.

## Les cinq [MINEUR] du tour 1

6, 7, 8 et 10 sont corrigés, vérifiés un par un (annexe F) : la durée de l'écran de
lancement est passée en « 800 ms **au minimum** […] sans limite de durée » ;
« Une seconde. » est devenu « J'arrive. », avec une justification ajoutée sous la
table ; la clôture distingue `bravo.bouton_principal` « Aller jouer » et
`bravo.bouton_secondaire` « Voir mon coffre », avec un motif qui va au-delà de ma
demande ; le double espace a disparu, et il n'en reste aucun dans le document.

Le constat 9, le nom `content/gwenn-scripts.json`, **n'est pas compté contre le
producteur** : l'Orchestrateur a tranché que le nom est fixé par le prompt maître,
hors de l'autorité du producteur comme de la mienne, et ouvre lui-même l'escalade.
Je note seulement que le livrable a fait ce qu'il pouvait en faire : réserve écrite
en 6.1, arbitrage A13 avec deux options et une question fermée, item TON-6 amendé
pour qu'un contrôleur aval ne bute plus dessus.

## Aucun acquis du tour 1 n'a été cassé

Relu et recompté sur la version corrigée : les 14 routes ont toujours leurs textes,
leur bouton principal, leur état vide et leur état d'erreur rédigés ; 0 pictogramme ;
0 terme interdit ; 0 anglicisme ; 0 phrase enfant au-dessus de 12 mots ; aucune
référence à la Bretagne comme thème de marque ; aucune promesse de performance
scolaire, aucun vocabulaire de compétition ou de classement, aucun mécanisme
d'urgence, de rareté, de streak ni de notification culpabilisante. Les textes de 7.5
que la reprise ne touchait pas — blocage, hésitation, questions, cas breton, pause,
sortie parent — sont intacts, et la section 9 ne cite aucune clé devenue orpheline.

## Les chiffres annoncés par le producteur sont exacts

**Aucun écart.** J'ai recompté les neuf chiffres qu'il avance, sans en reprendre
aucun. Tous tombent juste.

| Chiffre annoncé | Recompté par le contrôleur | Écart |
| --- | --- | --- |
| 0 pictogramme | 0, `grep` sur les plages Unicode sort en code 1 | aucun |
| 161 chaînes enfant | 161 | aucun |
| 0 chaîne enfant de plus de 12 mots | 0, maximum observé 10 mots | aucun |
| 0 terme interdit | 0 sur 52 termes cherchés | aucun |
| exactement 3 nombres devant l'enfant, tous dans le coffre | 3, tous en section 7.9 | aucun |
| 14 routes plus la section 7.0 | 15 sections `## 7.x`, dont 7.0 transverse | aucun |
| 23 exigences citées | 23 / 23 | aucun |
| checklist 6 / 6 / 5 / 6 / 7 | 6 / 6 / 5 / 6 / 7 | aucun |
| 8 items de ton | 8, TON-1 à TON-8 | aucun |

C'est un point qui mérite d'être écrit : au tour 1 je vérifiais des compteurs pour
les démentir, ici ils tiennent tous.

---

## Constats du tour 2

### 1. [MINEUR] — La section 1.1 affirme encore « aucun chiffre montré à l'enfant », ce que 7.9 contredit désormais explicitement

Texte fautif, ligne 80 :

> **Preuve de la promesse** : deux étapes maximum par soir quel que soit le volume
> de devoirs (PED-06), une pause toujours accessible et toujours gratuite
> (PRD-12), aucun chiffre montré à l'enfant (PED-07).

C'est exactement l'affirmation générale fausse que le constat 2 du tour 1 visait.
Elle a été corrigée en 7.9 et dans l'arbitrage A2, où trois nombres sont maintenant
admis et énumérés, mais elle a survécu ici. La portée est faible — la section 1.1 est
une promesse de marque, pas une spécification, et la règle normative est désormais
sans ambiguïté en 7.9 et contrôlée par TON-7 — mais le document se contredit à deux
endroits, et c'est le genre de phrase qu'un contrôleur aval cite de bonne foi.

**Correction attendue** : remplacer par « aucun chiffre de performance montré à
l'enfant (PED-07) : les seuls nombres affichés sont les trois nombres d'inventaire
de `/enfant/coffre` énumérés en 7.9 ».

### 2. [MINEUR] — Le résumé parent renvoie le parent vers une sous-page qui n'affiche pas le solde

Texte fautif, lignes 1363 à 1365 :

> Le nombre de pierres a été retiré pour la même raison de lecture comparative. Le
> parent qui veut le solde exact l'ouvre dans `/reglages`, sous-page Paliers, hors du
> résumé du soir.

J'ai lu la sous-page Paliers de 7.14 : ses dix clés sont `titre`, `corps`, `ajouter`,
`gems`, `description`, `description_ex`, `description_aide`, `atteint`, `supprimer`
et `vide`. `reglages.paliers.gems` est « Nombre de pierres », mais c'est le **seuil à
saisir** pour créer un palier, pas le solde d'Evan. **Aucune clé n'affiche le solde.**
La phrase promet donc au parent une information que le livrable ne spécifie nulle
part. C'est un effet de bord de la correction du constat 5 : en retirant le chiffre
du résumé, le producteur l'a renvoyé vers un écran où il n'avait pas été prévu.

**Correction attendue** : ajouter à la sous-page Paliers la clé
`reglages.paliers.solde` — « Pierres d'Evan : {n} » — affichée en haut de la page
sous `reglages.paliers.corps`, et le dire dans la décision de la section 7.12 ; ou,
si le solde ne doit pas être exposé au parent hors du coffre, supprimer purement la
phrase « Le parent qui veut le solde exact l'ouvre dans `/reglages`, sous-page
Paliers ». Les deux sont acceptables, il faut en choisir une.

### 3. [MINEUR] — « Le prochain palier » : mot hors vocabulaire CE1, désormais sans explication à côté

Texte concerné, ligne 1125 :

`` | `coffre.palier.titre` | « Le prochain palier » | affiche ``

Je signale d'emblée que **je n'avais pas relevé ce point au tour 1** et qu'il est en
partie une conséquence de la correction que j'ai moi-même exigée : tant que
`coffre.palier.description` était affichée juste en dessous, l'enfant voyait une
formulation concrète écrite par sa famille. Cette description est maintenant retirée,
à raison, et il ne reste devant l'enfant que le mot « palier », qui n'appartient pas
au vocabulaire d'un enfant de 6 ans et demi dans ce sens abstrait.

La gravité reste faible, pour une raison précise inscrite dans le livrable lui-même :
la clé est en mode `affiche`, et la règle de 6.2 veut qu'« un texte en `affiche` seul
ne peut être que décoratif ou redondant ». L'information réelle est portée par deux
chaînes `dit_affiche` en français de CE1, « Encore {n} pierres. » et « Je garde tes
pierres. Le reste se décide à la maison. ». L'enfant n'est donc pas laissé sans
information compréhensible.

**Correction attendue** : remplacer le libellé par « Bientôt » ou par « Encore un
peu », et laisser `coffre.palier.reste` et `coffre.palier.maison` porter le sens.
À défaut, conserver « Le prochain palier » et l'inscrire comme exception assumée
dans la section 3.1 des interdits de vocabulaire, pour que `contenu-enfant` et
`gardien-charte` ne le relèvent pas à leur tour.

---

## Observations sans gravité, qui ne sont pas des constats

Elles n'appellent aucune correction obligatoire, je les signale pour que le
producteur en dispose s'il repasse sur le document.

- Le titre de la section 13, « Constats mineurs non repris », désigne un tableau où
  les cinq constats sont marqués « Repris ». Le titre dit le contraire de son
  contenu. « Suivi des constats mineurs et escalade demandée » serait exact.
- Les états de blocage de 7.5 et 7.6 proposent deux boutons de même rang
  (« Faire une pause » / « Continuer »). C'est un choix entre deux issues, pas une
  paire principale/secondaire, donc DES-06 n'est pas en cause. Je le note parce que
  la correction du constat 8 a introduit une hiérarchie explicite sur `/enfant/bravo`
  et qu'un lecteur pourrait attendre la même chose ici.

---

# AVIS gardien-charte

Passe refaite par le contrôleur après son propre contrôle, avec la grille complète
de `.cursor/agents/gardien-charte.md`, sur les textes destinés à l'enfant dans la
version corrigée : les 161 chaînes portant un champ `mode` dans les sections 7.1 à
7.9, en accordant une attention particulière aux quinze chaînes nouvelles ou
modifiées de la reprise.

**1. Ton — effort valorisé, jamais le résultat seul ; aucune formulation lisible comme un reproche.**
Conforme. Les chaînes nouvelles ne dérogent pas. « C'est fait. Tu as terminé les
maths. » constate un achèvement, pas une performance, exactement comme son homologue
lecture. « On fait les maths. Et c'est tout. » ne porte aucune trace de manque, ce
qui est capital : c'est la phrase des configurations C4 et C6, donc celle d'un soir
où une matière a été retirée ou où le Soir léger est actif. Le livrable verrouille ce
point en écrivant que C3 et C5 d'une part, C4 et C6 d'autre part, sont
« **indiscernables pour l'enfant** » (ligne 627) et en arbitrant en A14 qu'« aucune
différence perceptible par l'enfant » ne doit exister. La règle du sujet « je » ou
« ça » dans les messages de difficulté est toujours tenue partout.

**2. Interdits absolus — « c'est faux », « erreur », « tu t'es trompé », « essaie de faire mieux », toute comparaison, toute ironie.**
Conforme. 0 occurrence sur les 161 chaînes, vérifié mécaniquement sur 52 termes
(annexe C). **La réserve du tour 1 a disparu** : « Une seconde. » est devenu
« Je regarde tes devoirs. J'arrive. », et le producteur a ajouté sous la table la
règle qui l'y oblige — « aucune figure de style n'est employée : un enfant de 6 ans
prend tout au premier degré » (ligne 580). Plus aucun énoncé non littéral dans les
textes enfant.

**3. Charge — une idée par phrase, 12 mots maximum, vocabulaire de CE1.**
Conforme. 161 chaînes mesurées, 0 dépassement, maximum 10 mots. Les quinze chaînes
nouvelles sont toutes courtes et au présent de l'indicatif.
**Une réserve, non bloquante** : le libellé `coffre.palier.titre` « Le prochain
palier » emploie un mot hors du vocabulaire d'un CE1 dans ce sens. Il est en mode
`affiche` seul, donc décoratif au sens de la règle 6.2 du livrable, et l'information
utile est portée à côté par deux chaînes `dit_affiche` en langage simple. Je ne le
retiens donc pas comme un passage fautif, mais comme la réserve du constat 3.

**4. Pression — aucun chrono, aucun décompte, aucun compteur d'erreurs, aucune série.**
Conforme, et renforcé depuis le tour 1. L'unique unité de temps prononcée à l'enfant
a été supprimée. La règle des nombres est maintenant explicite et exhaustive :
trois nombres d'inventaire, tous dans `/enfant/coffre`, « aucun nombre, d'aucune
sorte, sur les sept autres écrans enfant […] ni durée, ni numéro d'étape, ni numéro
d'indice, ni nombre d'essais » (ligne 1101). J'ai vérifié mécaniquement que c'est
vrai dans le document, et non seulement affirmé. La pause reste sans durée, sans
décompte et sans nombre de cycles.

**5. Récompense — aucune promesse d'une récompense réelle par l'application, aucune perte de pierres possible.**
**Conforme. Le motif de non-conformité du tour 1 a réellement disparu.** J'ai vérifié
les deux moitiés du problème. Côté enfant, `coffre.palier.description` n'existe plus
dans aucune table de 7.9 ; l'écran ne montre du palier que le libellé, la progression
et `coffre.palier.maison` « Je garde tes pierres. Le reste se décide à la maison. » ;
le livrable ajoute que toute réapparition d'un texte libre parent sur un écran enfant
est un défaut bloquant (ligne 1154). Côté parent, l'exemple de saisie ne nomme plus
ni objet ni sortie. L'application n'affiche donc plus aucune promesse de récompense
réelle à l'enfant, et n'en suggère plus aucune au parent. Les pierres restent
inperdables, ce que l'enfant s'entend dire dès l'onboarding et à chaque ouverture du
coffre.

**6. Maths — aucun contenu, prompt ou repli ne peut conduire à donner le résultat.**
Conforme, inchangé et toujours solide : quatre refus rédigés, proposition de pause
au-delà, repli de panne IA qui ne donne pas davantage le résultat, aucune validation
juste/faux affichée.

**7. Autonomie — la pause reste toujours accessible et ne coûte jamais rien.**
Conforme, inchangé. Bouton permanent sur les deux écrans d'étape, cible de 56 px,
jamais grisé, aucune pierre retirée, aucun commentaire au retour. La correction du
constat 8 va dans le même sens : la soirée se termine sur « Aller jouer », pas sur
l'inventaire.

AVIS: CONFORME

Aucun passage fautif à citer. Une seule réserve, consignée et non bloquante :

- Réserve, ligne 1125 : `` | `coffre.palier.titre` | « Le prochain palier » | affiche ``
  Reformulation proposée : « Bientôt », ou « Encore un peu ». Le sens reste porté par
  `coffre.palier.reste` — « Encore {n} pierres. » — et par `coffre.palier.maison` —
  « Je garde tes pierres. Le reste se décide à la maison. » —, toutes deux en
  `dit_affiche` et en français de CE1.

---

# Annexes — sorties réelles des commandes du tour 2

Toutes les commandes ont été exécutées par `controle-produit` sur la version corrigée
de `/home/user/Tipi/docs/agents/P1/produit-marketing.out.md`. Les sorties sont collées
telles quelles. Aucune n'est reconstituée de mémoire, aucune n'est reprise du tour 1.

Note de méthode : le script de recherche de vocabulaire interdit portait une étiquette
« 154 » écrite en dur, héritée du tour 1. Plutôt que de coller une sortie dont
l'étiquette aurait été fausse, je l'ai relancé avec le compte calculé à l'exécution.
C'est la version corrigée qui figure en annexe C.

## Annexe A — Pictogrammes, routes, items de checklist, exigences

```
=== A. PICTOGRAMMES ===
EXIT=1 (1 = aucune correspondance)

=== B. ROUTES ET SECTION TRANSVERSE ===
15
dont 7.0 transverse :
1

=== C. ITEMS DE CHECKLIST ===
ETH-01 : 6 items
ETH-02 : 6 items
ETH-03 : 5 items
ETH-04 : 6 items
ETH-05 : 7 items
TON    : 8 items

=== D. EXIGENCES CITEES ===
PRD-01:4 PRD-02:3 PRD-03:3 PRD-04:9 PRD-05:2 PRD-06:10 PRD-07:2 PRD-08:2 PRD-09:2 PRD-10:2 PRD-11:6 PRD-12:7 PRD-13:6 PRD-14:5 PRD-15:6 PRD-16:10 PRD-17:4 PRD-18:8 ETH-01:21 ETH-02:24 ETH-03:11 ETH-04:18 ETH-05:22 
Exigences citees au moins une fois : 23 / 23
```

La commande de recherche de pictogrammes est identique à celle du tour 1 :

```
LC_ALL=C.UTF-8 grep -nP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}\x{1F1E6}-\x{1F1FF}\x{2700}-\x{27BF}\x{24C2}\x{203C}\x{2049}]' docs/agents/P1/produit-marketing.out.md
```

Elle ne remonte aucune ligne. Les 15 sections `## 7.x` sont les 14 routes de la
section 3.1 plus la section transverse 7.0.

## Annexe B — Longueur des phrases destinées à l'enfant

Même script qu'au tour 1, relancé sur la version corrigée.

```
Chaines enfant extraites (tables avec colonne mode) : 161


Phrases enfant de plus de 12 mots : 0

--- Les 6 phrases enfant les plus longues ---
L887   `maths.blocage.corps_2`            [10 mots] On souffle un peu, ou on passe à la suite ?
L803   `lecture.sans_voix.corps`          [10 mots] Je ne peux pas lire à voix haute ce soir.
L1175  `coffre.cosmetiques.vide`          [ 8 mots] Il n'y a rien à mettre pour l'instant.
L1162  `coffre.palier.vide`               [ 8 mots] Il n'y a pas de palier pour l'instant.
L1067  `bravo.pierres_plus_tard`          [ 8 mots] Je range tes pierres un peu plus tard.
L936   `maths.vide.corps`                 [ 8 mots] Ce soir, il n'y a pas de maths.
```

161 chaînes contre 154 au tour 1 : les 7 chaînes supplémentaires sont le solde net
des variantes ajoutées par la section 7.0 et de `coffre.palier.description`
supprimée.

## Annexe C — Vocabulaire interdit et anglicismes

52 termes cherchés sur les chaînes enfant, recherche insensible à la casse : les
interdits de la charte et de la section 3.1 du livrable, plus 20 anglicismes.

```
Chaines enfant analysees : 161
Occurrences de vocabulaire interdit ou d'anglicisme : 0
```

## Annexe D — Nombres affichés à l'enfant

Extraction de toutes les chaînes enfant contenant `{n}` ou un chiffre, avec la
section dans laquelle elles se trouvent.

```
=== Chaines enfant porteuses d'un nombre, et leur ecran ===
L1114  section 7.9   `coffre.solde.valeur`                {n}
L1126  section 7.9   `coffre.palier.reste`                Encore {n} pierres.
L1173  section 7.9   `coffre.cosmetiques.verrouille`      Il faut {n} pierres pour celui-là.
Total chaines enfant porteuses d'un nombre : 3
```

Exactement trois, toutes en section 7.9, donc toutes dans `/enfant/coffre`. Les sept
autres écrans enfant n'affichent aucun nombre. C'est conforme à la règle posée en
7.9, à l'arbitrage A2 et à l'item TON-7.

## Annexe E — Variantes de textes dépendant de l'ordre des étapes

```
=== Couverture C1..C6 : chaque configuration a-t-elle ses textes ? ===
598: -> « D'abord la lecture. Après, les maths. » | dit_affiche |
599: -> « D'abord les maths. Après, la lecture. » | dit_affiche |
617: -> « On fait la lecture. Et c'est tout. » | dit_affiche |
618: -> « On fait les maths. Et c'est tout. » | dit_affiche |
654: -> « On commence par la lecture. » | dit_affiche |
655: -> « Maintenant, la lecture. » | dit_affiche |
827: -> « On commence par les maths. » | dit_affiche |
828: -> « Maintenant, les maths. » | dit_affiche |
909: -> « C'est fait. Tu as terminé la lecture. » | dit_affiche |
910: -> « C'est fait. Tu as terminé les maths. » | dit_affiche |
911: -> « Maintenant, on passe aux maths. » | dit_affiche |
912: -> « Maintenant, on passe à la lecture. » | dit_affiche |
```

Déroulé des six configurations, fait à la main contre ces textes et contre la table
de sélection de 7.0 :

| Config | Annonce | Entrée 1re étape | Transition | Entrée 2e étape | Trou ? |
| --- | --- | --- | --- | --- | --- |
| C1 lecture puis maths | `corps.lecture_maths` | `lecture.intro.titre.premier` | `felicitation.lecture` + `annonce.maths` | `maths.intro.titre.apres` | aucun |
| C2 maths puis lecture | `corps.maths_lecture` | `maths.intro.titre.premier` | `felicitation.maths` + `annonce.lecture` | `lecture.intro.titre.apres` | aucun |
| C3 lecture seule | `une.corps.lecture` | `lecture.intro.titre.premier` | pas d'écran de transition (ligne 921) | — | aucun |
| C4 maths seule | `une.corps.maths` | `maths.intro.titre.premier` | pas d'écran de transition | — | aucun |
| C5 lecture seule, Soir léger | `une.corps.lecture` | `lecture.intro.titre.premier` | pas d'écran de transition | — | aucun |
| C6 maths seule, Soir léger | `une.corps.maths` | `maths.intro.titre.premier` | pas d'écran de transition | — | aucun |

Dans aucune des six configurations Pilou ne nomme une matière absente du programme du
soir. C3 et C5 sont identiques pour l'enfant, C4 et C6 aussi : le Soir léger est
indétectable, ce qui est l'intention de A8 et A14.

## Annexe F — Vérification des corrections mineures et des clés orphelines

```
=== Constats 6,7,8,10 : verification ponctuelle ===
274:| Durée | Visible 800 ms **au minimum**, pour éviter un clignotement si l'aiguillage tranche immédiatement. Si l'aiguillage `/` n'a pas tranché, l'écran reste affiché tel quel, sans indicateur, sans limite de durée et sans message |
578:| `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | dit_affiche |
1026:| 6 | `bravo.bouton_principal` | « Aller jouer » | affiche |
1027:| 7 | `bravo.bouton_secondaire` | « Voir mon coffre » | affiche |
double-espace EXIT=1
```

`double-espace EXIT=1` signifie que la recherche `«[^»]*  [^»]*»` ne remonte plus
aucune chaîne : le double espace de `parent.scan.analyse_en_cours` a disparu et il
n'en existe aucun autre dans le document.

Recherche des clés remplacées, pour vérifier qu'aucune référence orpheline ne subsiste :
`coffre.palier.description` n'apparaît plus que dans la note de suppression de 7.9
(ligne 1154), dans l'item ETH-05.1 bis qui en exige 0 occurrence (ligne 1785) et dans
le tableau de reprise en tête de document (ligne 28). Les anciennes clés
`enfant.programme.corps`, `maths.intro.titre`, `transition.felicitation`,
`lecture.vide.corps_2` et `maths.vide.corps_2` n'apparaissent plus qu'au pluriel de
leurs variantes, jamais comme clé effective, sauf dans le tableau de reprise qui les
cite comme étant celles qui ont été éclatées.

## Annexe G — Les deux contradictions résiduelles

```
=== Affirmations generales sur les chiffres montres a l'enfant ===
26:| 2 | MAJEUR | L'affirmation « le solde est le seul chiffre » est remplacée par l'énumération exacte des trois nombres admis devant l'enfant, tous dans `/enfant/coffre`, avec la règle générale qui les autorise et l'interdiction sur les sept autres écrans enfant | 7.9, arbitrage A2, nouvel item de checklist TON-7 |
80:(PRD-12), aucun chiffre montré à l'enfant (PED-07).
1046:image, avec `son_pierre` une seule fois. **Aucun chiffre n'est affiché** sur cet
```

La ligne 80 est le constat 1 du tour 2. La ligne 1046 est correcte : elle porte sur
le seul écran `/enfant/bravo`, où en effet aucun chiffre n'est affiché.

```
=== Le solde est-il specifie cote parent, sous-page Paliers ? ===
1364:la même raison de lecture comparative. Le parent qui veut le solde exact l'ouvre
1559:| `reglages.paliers.titre` | « Paliers de récompense » |
1560:| `reglages.paliers.corps` | « Vous définissez le palier et vous donnez la récompense. Tipi compte seulement les pierres. » |
1561:| `reglages.paliers.ajouter` | « Ajouter un palier » |
1562:| `reglages.paliers.gems` | « Nombre de pierres » |
1563:| `reglages.paliers.description` | « Ce que vous proposez » |
1564:| `reglages.paliers.description_ex` | « Par exemple : ce que vous avez prévu de faire ensemble. » |
1565:| `reglages.paliers.description_aide` | « Ce texte reste ici. Il n'est pas affiché à Evan. » |
1566:| `reglages.paliers.atteint` | « Atteint le {date} » |
1567:| `reglages.paliers.supprimer` | « Supprimer ce palier » |
1568:| `reglages.paliers.vide` | « Aucun palier pour l'instant. Les pierres s'accumulent quand même. » |
```

Aucune de ces dix clés n'affiche le solde d'Evan. C'est le constat 2 du tour 2.

## Annexe H — Portée de ce contrôle

`git status` au moment du contrôle montre que `content/encouragements.json` a été
modifié et que `docs/agents/P1/contenu-enfant.out.md` est apparu. **Ces deux fichiers
ne sont pas dans le périmètre de ce verdict** : ils relèvent de P1bis, produit par
`contenu-enfant`, qui appelle son propre contrôle. Je n'ai ni compté les variantes
d'`encouragements.json`, ni validé son JSON, ni lu `contenu-enfant.out.md`. Ce
verdict ne porte que sur `docs/agents/P1/produit-marketing.out.md`.

Aucun fichier du produit n'a été écrit ni modifié par ce contrôle. Aucun commit git.

---

# Historique — tour 1

Verdict du tour 1 : **FAIL**, 0 [BLOQUANT], 5 [MAJEUR], 5 [MINEUR]. Avis
`gardien-charte` du tour 1 : **NON CONFORME**, sur la règle 5, récompense.

| # | Niveau tour 1 | Constat | Sort au tour 2 |
| --- | --- | --- | --- |
| 1 | MAJEUR | Quatre textes enfant figeaient l'ordre lecture → maths alors que PRD-04 autorise le retrait et le réordonnancement ; les états « maths seule », « maths en premier » et « transition maths vers lecture » n'avaient aucun texte | **Corrigé.** Section 7.0 avec six configurations C1 à C6 et table de sélection ; douze variantes rédigées ; états vides d'étape éclatés en `.suite` et `.fin` ; item TON-8 ajouté. Vérifié configuration par configuration |
| 2 | MAJEUR | « Le solde est le seul chiffre montré à l'enfant » était faux : trois chaînes enfant portaient un nombre, ce qui ruinait la prémisse de l'arbitrage A2 | **Corrigé** dans la partie normative : règle générale, liste exhaustive des trois nombres, interdiction sur les sept autres écrans, A2 réécrit, item TON-7. **Résidu mineur** en section 1.1 → constat 1 du tour 2 |
| 3 | MAJEUR | ETH-05.3 interdisait toute suggestion de palier par l'application, mais `reglages.paliers.description_ex` proposait « une sortie au parc le samedi » : l'item était incochable | **Corrigé.** L'exemple ne nomme plus ni objet ni sortie, ETH-05.3 est reformulé une seule fois et devient vérifiable |
| 4 | MAJEUR | `coffre.palier.description`, texte libre écrit par le parent, était affichée à l'enfant hors de toute règle de ton, de longueur et d'emoji ; le périmètre de ETH-05.1 ne la couvrait pas | **Corrigé.** Chaîne retirée de l'écran enfant, motif écrit, périmètre de ETH-05.1 élargi, item ETH-05.1 bis ajouté, `description_aide` prévient le parent. **Effet de bord mineur** → constat 3 du tour 2 |
| 5 | MAJEUR | PRD-06 « qualitatif, jamais chiffré » était déclarée couverte alors que le résumé parent contenait la durée de séance et le nombre de pierres, sur la base d'un arbitrage interne sans escalade | **Corrigé**, et par la bonne branche : les deux chiffres sont retirés, A7 réécrit, aucune dérogation demandée. **Résidu mineur** → constat 2 du tour 2 |
| 6 | MINEUR | L'écran de lancement se contredisait : « 800 ms maximum » et « reste affiché au bout de 1 200 ms » | **Corrigé.** « 800 ms au minimum […] sans limite de durée » |
| 7 | MINEUR | « Je regarde tes devoirs. Une seconde. » : figure de style et unité de temps servies à un enfant qui prend tout au premier degré | **Corrigé.** « Je regarde tes devoirs. J'arrive. », avec la règle écrite sous la table |
| 8 | MINEUR | `/enfant/bravo` proposait deux boutons de même rang, « 6 » et « 6 bis », sans désigner l'action principale, alors que le livrable revendique DES-06 | **Corrigé.** « Aller jouer » est l'action principale seule en bas d'écran, « Voir mon coffre » passe en secondaire, avec un motif rattaché à PRD-11 et PED-05 |
| 9 | MINEUR | `content/gwenn-scripts.json` porte un mot breton, ce qui contredit l'interdit de marque de la section 3.3 ; le nom vient du prompt maître, pas du producteur | **Hors périmètre, non compté contre le producteur.** L'Orchestrateur a tranché que le renommage n'est ni de l'autorité du producteur ni de la mienne et ouvre lui-même l'escalade. Le livrable a fait ce qu'il pouvait : réserve en 6.1, arbitrage A13 avec question fermée, item TON-6 amendé |
| 10 | MINEUR | Double espace dans `parent.scan.analyse_en_cours` | **Corrigé**, et il n'en reste aucun dans le document |

Aucun constat du tour 1 n'a été contesté par le producteur, et aucun n'est resté sans
reprise. Le motif de non-conformité `gardien-charte` du tour 1, la promesse de
récompense réelle affichée à l'enfant, a été vérifié disparu au tour 2.

Note de procédure conservée du tour 1 : en rédigeant l'annexe G du premier verdict,
j'avais recopié une ligne de sortie de commande de façon altérée. Je l'avais corrigée
avec la sortie réelle et signalée. Au tour 2, une étiquette « 154 » écrite en dur dans
un script aurait rendu une sortie trompeuse : j'ai relancé le script avec le compte
calculé plutôt que de coller la sortie d'origine.

---

## Suite

Les trois réserves du tour 2 se corrigent en quelques lignes et n'appellent pas de
troisième tour de contrôle formel. `contenu-enfant` (P1bis) peut travailler dès
maintenant à partir des clés et des textes canoniques de la section 7, qui sont
stables : les variantes de 7.0 sont nommées, la table de sélection est normative, et
aucune clé ne changera du fait des trois réserves ci-dessus, sauf
`coffre.palier.titre` si le producteur retient la reformulation proposée.

La seule question ouverte hors de ce livrable est l'arbitrage A13 sur le nom
`content/gwenn-scripts.json`, porté par l'Orchestrateur.
