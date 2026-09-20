VERDICT: PASS_AVEC_RESERVES

# Contrôle de `contenu-enfant` — tour 3, contrôle final

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Objets contrôlés : `content/encouragements.json` (`tipi.encouragements.v2`,
version **2.2.0**), `content/gwenn-scripts.json` (`tipi.gwenn-scripts.v2`,
version 2.0.0), `docs/agents/P1/contenu-enfant.out.md`.

Références : `TIPI-PROMPT-CURSOR.md` §1, §2, §3, §5.1 ; `docs/agents/GATES.md`
(ARB-02, ARB-03, ARB-04, ARB-06, **ARB-07**) ;
`docs/agents/P1/produit-marketing.out.md` ; `.cursor/rules/00-charte-tipi.mdc` ;
`.cursor/rules/30-copy-enfant.mdc`.

## Position

**Les deux [MAJEUR] et les quatre [MINEUR] du tour 2 sont corrigés, et le
renommage ARB-07 est fait des deux côtés.** Je n'ouvre aucun [BLOQUANT] ni aucun
[MAJEUR]. Deux [MINEUR] neufs restent, tous deux trouvés par moi, aucun ne
touchant l'enfant dans son usage normal, tous deux corrigeables en une ligne.

**Les vingt-quatre grandeurs annoncées sont exactes.** Aucun écart. C'est le
deuxième tour sur trois sans écart, et c'est le premier où l'indicateur de
recouvrement — celui que j'ai cassé au tour 2 — **tient sous ma propre mesure**.
J'ai vérifié son maximum publié (0,429 sur `hesitation` 02/20) avec ma liste de
mots-outils inchangée depuis le tour 1 : je retrouve 0,429 sur la même paire.

Le point que l'Orchestrateur demandait de trancher en priorité — le piège
d'outillage est-il maîtrisé ou seulement raconté — reçoit la réponse
**maîtrisé**, avec une limite de preuve que je nomme précisément plus bas.

Je note pour finir que j'ai eu tort au tour 2 sur un détail que le producteur a
corrigé contre moi, et qu'il avait raison : ma reformulation proposée pour le
constat 18 aurait créé le nouveau maximum du fichier. Je le vérifie et le
documente.

---

# CONSTATS DU TOUR 3

## [MINEUR] 20 — La `note` de la situation `cloture` est périmée sur deux points

`content/encouragements.json`, `situations.cloture.note`, ligne 6886 :

> « Dite a la fin de la derniere etape, AVANT l'ecran /enfant/bravo. Elle ne
> remplace jamais une ligne du rituel de fermeture, qui reste invariant
> (PED-12). Aucune variante ne reprend les mots du rituel. **La cle
> transition.cloture.corps est a creer cote marketing : voir statut_cles.** »

Deux erreurs dans la dernière phrase :

1. **Le nom est l'ancien.** ARB-07 a renommé la clé en
   `session.fin_travail.corps`. Le champ `cles_ui` de la même situation, deux
   lignes plus haut dans le même objet, porte le nouveau nom. Le fichier se
   contredit lui-même à deux lignes d'écart.
2. **« est à créer » est faux.** La clé existe : `produit-marketing.out.md` la
   définit et la référence à cinq endroits, ce que j'ai vérifié. La phrase date
   du tour 2, quand la clé n'existait pas encore.

Le champ `note` est décrit par le livrable comme la condition d'emploi opposable
en revue : c'est le texte qu'un développeur lit avant de câbler. Ici il le
renvoie vers un identifiant mort et lui annonce un travail déjà fait.

C'est le seul champ périmé du fichier. J'ai passé tous les champs de
métadonnées (`note`, `libelle`, `regles`, `statut_cles`,
`cles_fixes_non_variees`) au crible de douze motifs de péremption : seule cette
`note` remonte. La mention de `transition.cloture.corps` dans `statut_cles` est
**légitime** — elle documente l'historique du renommage, c'est sa fonction.

**Correction attendue** : remplacer la dernière phrase de
`situations.cloture.note` par « La cle `session.fin_travail.corps` est definie
cote marketing : voir `statut_cles`. »

## [MINEUR] 21 — `reussite_maths.15` valorise l'absence de pause

```
enc.reussite_maths.15 : « Tu as cherché sans t'arrêter. » || « Bravo pour ton courage. »
```

C'est la reformulation livrée pour mon [MINEUR] 18, et elle résout bien le
problème que j'avais soulevé : l'éloge n'est plus formulé par la négation d'une
conduite de l'enfant. Mais elle en introduit un autre, plus discret.

Cette banque se joue à la fin de l'étape de maths. La pause est accessible
**pendant** cette étape (PRD-12), et le produit répète partout qu'elle ne coûte
rien : « La pause ne coûte rien. Elle est à toi. », « Tu as bien fait de demander
la pause. », « Tu veux une pause ? Elle ne coûte rien. » Un enfant qui a fait
une pause pendant les maths peut donc s'entendre féliciter, au moment du bilan,
d'avoir cherché **sans s'arrêter**. Deux conséquences :

- la phrase est factuellement fausse pour lui ;
- elle lui apprend que ce qui vaut un « Bravo pour ton courage », c'est de ne pas
  s'être arrêté — exactement le raisonnement que la charte écarte au point 4 de
  la grille du gardien, « aucune série à ne pas casser ».

C'est la seule des 479 entrées qui attache l'éloge à la continuité de l'effort
plutôt qu'à l'effort lui-même. Les dix-neuf autres variantes de la banque sont
irréprochables sur ce point : elles nomment l'acte (« Tu as compté avec soin. »),
la stratégie (« Tu as utilisé tes doigts. C'est une bonne méthode. ») ou, mieux
encore, le recours à l'aide comme conduite valorisable (« Tu as demandé un
indice. C'est une bonne façon de chercher. »).

**Correction attendue** : « **Tu as cherché avec patience.** || Bravo pour ton
courage. » J'ai vérifié qu'elle ne recrée aucune proximité : maximum 0,333 contre
les dix-neuf autres variantes de la banque, sous la mesure du tour 1, très en
dessous du seuil de 0,50 et du maximum actuel du fichier. Variante équivalente si
le producteur préfère : « Tu as pris ton temps pour chercher. » (maximum 0,300).

---

# JUGEMENTS DEMANDÉS

## Le point prioritaire : le piège d'outillage est-il maîtrisé ou raconté ?

**Maîtrisé.** Je le dis après avoir essayé de le prendre en défaut, et je donne
les cinq preuves, puis la limite.

**Preuve 1 — la statistique qui m'avait servi à le démasquer est désormais
publiée, et je la confirme.** Au tour 2, le défaut ne tenait pas au chiffre
« 0 paire au-dessus du seuil » mais à ce que ce chiffre ne disait pas : douze
paires s'arrêtaient *pile* sur la valeur seuil. Le contrôle 10 publie maintenant
`paires EXACTEMENT a 0,50 sous A ou B : 0`. J'ai recompté sous sa règle : **0**.
Un indicateur qui publie de lui-même la statistique par laquelle on l'a pris en
défaut n'est plus le même indicateur.

**Preuve 2 — le seuil est passé en « supérieur ou égal », ce qui ferme le trou
par construction.** Le défaut du tour 2 était possible parce qu'un seuil en
« strictement supérieur » laisse une frontière où l'on peut s'arrêter. En
« supérieur ou égal », se poser sur la valeur seuil déclenche le signalement. Le
mécanisme ne peut plus se reproduire sur cet indicateur.

**Preuve 3 — l'indicateur sur-signale volontairement, et le volume traité le
prouve.** Trois mesures indépendantes (deux listes de mots-outils, dont une où
les adverbes restent des mots pleins, plus une similarité de séquence), une paire
signalée par n'importe laquelle étant traitée. Résultat : **46 paires signalées
là où ma mesure du tour 2 en trouvait 15**, et **53 variantes réécrites**. Un
agent qui voulait faire disparaître un chiffre n'élargit pas son filet à trois
fois ce que le contrôleur lui reprochait.

**Preuve 4 — la règle est publiée avec le chiffre, donc rejouable sans son
code.** Le contrôle imprime les deux listes, le traitement des jetons, les trois
seuils et la comparaison employée, *avant* de donner le résultat. C'est ce que
j'avais demandé au tour 2, et c'est ce qui m'a permis de rejouer la mesure.

**Preuve 5 — les chiffres tiennent sous ma propre liste, inchangée depuis le
tour 1.** C'est le test décisif, et c'est l'inverse du tour 2.

```
maximum publie mesure A : 0,429  sur ('hesitation', 02, 20)
ma mesure, meme paire   : 0,429  (accents strippes ET accents preserves)
paires > 0,50 chez moi  : 0
```

**Preuve 6, celle que je trouve la plus convaincante : il a appliqué la leçon à
un autre détecteur, sans qu'on le lui demande.** Après avoir élargi les radicaux
du détecteur de niveau 3, il a re-mesuré avec l'**ancienne** liste et publié les
6 variantes qu'elle refusait : `indice_demande_3` 05, 09, 13, 14, 19, 20. Je les
ai vérifiées une par une contre le texte de PED-02 (« un exemple analogue avec
des nombres plus simples ») :

| # | Texte | Niveau 3 ? |
| --- | --- | --- |
| 05 | « Regarde ce cas tout simple. » | oui — un cas plus simple |
| 09 | « Je te donne un modèle facile à suivre. » | oui — un modèle analogue |
| 13 | « On fait d'abord une version courte. » | oui — le même exercice, raccourci |
| 14 | « Voilà un cas facile pour comprendre. » | oui |
| 19 | « Écoute d'abord ce petit exercice. » | oui |
| 20 | « On prend moins d'objets pour commencer. » | oui — c'est littéralement « des nombres plus simples » |

Les six sont saines. L'élargissement du détecteur n'a rien masqué.

**La limite de la preuve, que je nomme pour qu'elle ne soit pas prise pour une
validation qu'elle n'est pas.** Je n'ai pas pu **reproduire sa liste de radicaux
d'origine** : ma reconstruction la plus naturelle (le radical « exemple ») en
signale quatorze, pas six, ce qui montre seulement que son ancienne liste
contenait d'autres radicaux que je ne connais pas. J'ai donc pu vérifier le
**résultat**, pas la **procédure**.

J'ai compensé par plus fort : au lieu de contrôler les 6 qu'il désigne, j'ai
relu les **20** variantes du niveau 3, et les 80 des quatre niveaux. Aucune
n'appartient au registre d'un autre niveau ; aucune n'annonce une question quand
elle donnera un exemple, ni une méthode quand elle déroulera une résolution. Deux
sont un peu vagues (`09` « un modèle facile à suivre », `18` « Voilà de quoi
t'entraîner d'abord ») sans être fausses. Un contrôle exhaustif de la banque
domine un contrôle des six signalées : la question posée est tranchée.

**Conséquence pour les phases de code, puisque c'est ce qui motivait la
question.** Le mécanisme n'est pas propre à ce livrable : il se reproduira chaque
fois qu'un agent ajustera un linter, un seuil de couverture, une règle
ESLint ou un filtre de test. Ce que ce tour établit comme praticable, et que je
recommande de porter en règle permanente pour G2 et au-delà :

1. **Un seuil s'écrit en « supérieur ou égal ».** La frontière stricte crée une
   zone où l'on peut se poser.
2. **Publier le compte des cas exactement au seuil**, à côté du compte des cas
   au-dessus. C'est la statistique qui révèle un ajustement à la frontière.
3. **Quand on modifie un instrument, re-mesurer avec l'ancienne version et
   publier ce qu'elle signalait**, vérifié pièce par pièce.
4. **Publier la règle avec le chiffre**, pour que le contrôleur rejoue sans lire
   le code du producteur.
5. **Et publier la liste ancienne elle-même**, ce qui manque ici : sans elle, le
   contrôleur vérifie le résultat mais pas la procédure. C'est le seul point à
   ajouter à la recette.

## Le jeton `{matiere}` : la garantie manquante est écrite, et les 40 rendus tiennent

`regles.jeton_matiere_regle` porte désormais les trois contraintes, et la
troisième est celle qui manquait :

> « **À GAUCHE** : aucune préposition contractante (de, à) ne le précède
> immédiatement, car le jeton porte son article et les deux valeurs ne se
> contractent pas de la même façon (de la lecture, mais des maths). »

C'est la formulation que je demandais, et elle est dans le fichier, pas seulement
dans le rapport : la prochaine variante ajoutée sera écrite contre elle.

`enc.annonce_programme_une_etape.03` devient « On prépare {matiere}, tous les
deux. » → « On prépare **la lecture** » / « On prépare **les maths** ». Correct.

J'ai contrôlé les **40 rendus** avec onze motifs, et pas seulement les
prépositions comme demandé :

```
contraction de+le/les, a+le/les .................... 0
elision manquante devant voyelle ................... 0
double determinant (le/la/les + la/les) ............ 0
majuscule en milieu de phrase ...................... 0
minuscule en tete de phrase ........................ 0
accord singulier impose a « les maths » ............ 0
accord pluriel impose a « la lecture » ............. 0
double espace / espace avant ponctuation ........... 0
apostrophe suivie d'espace / virgule collee ........ 0
```

Le mot situé **à gauche** du jeton, pour les vingt variantes : `fait`,
`travailles`, `prépare`, `a`, `travaille`, `propose`, `prend`, `fait`, `ouvre`,
`pour`, `fais`, `commence`, `regarde`, `pour`, `sur`, `met`, `fait`, `sur`,
`sur`, `travailler`. Aucune préposition contractante, aucun jeton en tête de
segment, aucun jeton sujet.

## La reformulation du constat 18 : il a eu raison contre moi

Il écarte ma reformulation du tour 2, « Tu as continué jusqu'au bout. Bravo pour
ton courage. », au motif qu'elle recréait une paire avec la variante 03. **Je
l'ai vérifiée, et il a raison — plus qu'il ne le dit.**

```
« Tu as continué jusqu'au bout. Bravo pour ton courage. »
   contre 03 « Tu as tenu jusqu'au bout. Bravo pour tes efforts. »
   -> Jaccard 0,500, avec MA liste de mots-outils
```

0,500, c'est au-dessus de son seuil de signalement, et **au-dessus du maximum
actuel du fichier (0,429)** : ma suggestion aurait créé le nouveau maximum et
réintroduit exactement le défaut que je venais de lui reprocher. Elle était
mauvaise. Refuser la formulation du contrôleur en disant pourquoi, plutôt que
l'appliquer parce qu'elle vient du contrôleur, est la bonne conduite, et le
protocole a bien fonctionné ici dans les deux sens.

Sa formulation de remplacement est d'ailleurs excellente sur l'indicateur (0,273
au maximum). C'est sur un autre axe qu'elle pèche, et c'est mon [MINEUR] 21.

## Le retrait non demandé des trois « c'est les maths » : j'approuve

Et je le dis d'autant plus volontiers que **je l'avais explicitement laissé
passer** : au tour 2 j'écrivais « "c'est les maths" au lieu de "ce sont les
maths" est du français oral courant, Pilou parle, et un CE1 l'entend ainsi
partout. Je ne le retiens pas. »

Il a eu un meilleur jugement que moi, pour une raison que je n'avais pas pesée :
ces chaînes sont en canal `les_deux`. L'enfant ne les entend pas seulement, **il
les lit**, mot pour mot, sur un écran d'une application qui l'accompagne
précisément dans son apprentissage de la lecture. Mon raisonnement valait pour de
l'oral ; il ne vaut pas pour un texte affiché. Et il a écarté la fausse
alternative : « ce sont les maths » aurait été guindé pour un CE1, donc plutôt
que de choisir entre une forme discutable et une forme raide, il a retiré la
construction. Les trois variantes concernées (02, 16, 20) sont réécrites et se
lisent naturellement : « Ce soir, tu travailles {matiere} avec moi. », « Au
programme du soir, on met {matiere}. », « On va travailler {matiere} ce soir. »

Vérifié : 0 occurrence de « c'est {matiere} », « c'est les maths », « c'est la
lecture » dans le fichier.

Un producteur qui relève son propre niveau d'exigence au-dessus de celui du
contrôleur, sur un point que le contrôleur avait explicitement abandonné, mérite
d'être signalé autrement que par un silence. **J'approuve le geste sans
réserve.**

## Ce qui était acquis n'a pas été cassé par les 53 réécritures

C'était le risque principal de ce tour, et il ne s'est pas réalisé. Vérifié
banque par banque, sur les 479 entrées et les 527 rendus.

| Acquis | État au tour 3 |
| --- | --- |
| 20 variantes par situation | **23/23 à exactement 20**, `id` = clé 23 fois sur 23 |
| Longueur : 12 mots maximum | **0 dépassement**, maximum **10**, sous mes deux règles de comptage |
| Interdits de vocabulaire | **0** sur 40 motifs — et « tu n'as pas », que je relevais au tour 2, a disparu |
| Emoji / chiffres / prénom en dur | **0 / 0 / 0** |
| Accord de genre sur les rendus | **0 faute** sur 527 rendus, 3 prénoms dont un féminin ; les 9 accords relevés portent tous sur Pilou, le tipi, le devoir, les maths ou les pierres |
| Schéma et invariant `texte == jointure` | **0 problème**, **460/460** |
| Identifiants et textes uniques | **479/479** en strict et en normalisé |
| `photo_illisible` | **0/20** nomment le support, **20/20** offrent une sortie |
| `blocage_lecture` | **20/20** mettent la panne sur le micro ou l'écoute de Pilou, **20/20** offrent une sortie |
| Les quatre niveaux d'indices | **20/20 dans leur registre** pour les quatre, vérifié par lecture des 80 |
| Soir léger indiscernable | **0 occurrence** sur 16 motifs de réduction et de fatigue dans la banque à une étape |
| 35 clés déclarées | **35**, **0 absente** du marketing, **0 déclarée par deux banques** |
| Renommage ARB-07 | **fait des deux côtés** : `cloture.cles_ui` et `statut_cles` portent `session.fin_travail.corps` ; 5 occurrences côté marketing, **0 ancienne restante**. Une seule trace périmée, en [MINEUR] 20 |
| `cles_fixes_non_variees` | **9 groupes, 34 clés**, les 5 clés de mon [MINEUR] 16 ajoutées, intersection avec les banques vide |
| PED-01 | **0** entrée n'annonce un résultat |
| PED-04 | **0** jugement d'exactitude sur 479 entrées |
| PED-05 | **0** qualification de l'enfant ; l'éloge porte sur l'acte et la stratégie |
| PED-11 / PED-12 | tenues, seuil atteint **par situation réelle** et non par regroupement |

Lecture intégrale des dix banques les plus touchées par les réécritures
(`photo_illisible`, `reprise_session`, `cloture`, `accueil`, `retour_de_pause`,
`pas_de_devoirs`, `annonce_programme`, `blocage_lecture`, `indice_demande_2`,
`indice_demande_4`) : **aucune variante réécrite ne s'écarte du sens de sa
situation.** Les réécritures changent l'angle, pas le rôle — `photo_illisible`
06, 07, 12, 13, 19, 20 disent toutes Pilou en train de chercher avec une sortie
vers le coffre ; `reprise_session` 07, 09, 12, 13, 17, 20 disent toutes que rien
n'est perdu ; `indice_demande_4` 10, 17, 18, 20 restent des résolutions guidées
qui réservent la fin à l'enfant.

---

# AVIS gardien-charte — tour 3

Grille des 7 points de `.cursor/agents/gardien-charte.md`, repassée sur les
**479 textes** et leurs **527 rendus** (`{prenom}` substitué par trois prénoms
dont un féminin, `{matiere}` développé dans ses deux valeurs).

| # | Point | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Conforme.** Aucune formulation ne peut se lire comme un reproche. L'éloge porte partout sur l'acte, l'effort ou la stratégie. |
| 2 | Interdits absolus | **Conforme.** 40 motifs sur 527 rendus : 0. Aucune comparaison, aucune ironie. « Tu n'as pas abandonné » a disparu. |
| 3 | Charge : une idée par phrase, 12 mots, CE1 | **Conforme.** 864 phrases, maximum **10 mots**, 0 dépassement sous mes deux règles. « au fur et à mesure » a disparu. Les 40 rendus du jeton sont grammaticalement corrects. |
| 4 | Pression : ni chrono, ni décompte, ni compteur, ni série | **Conforme, avec la réserve du [MINEUR] 21.** 0 chiffre, aucune durée, aucun cycle compté. Une seule variante attache l'éloge à la continuité de l'effort. |
| 5 | Récompense : aucune promesse réelle, aucune perte de pierres | **Conforme** (ETH-04, ETH-05). Les pierres restent virtuelles et toujours acquises. |
| 6 | Maths : rien ne conduit au résultat | **Conforme** (PED-01, PED-02). `indice_demande_4` réserve explicitement le résultat à l'enfant dans six variantes : « C'est toi qui dis le résultat. », « Je te montre tout, sauf la réponse. », « Le dernier mot est à toi. » |
| 7 | Autonomie : la pause accessible, gratuite | **Conforme.** « La pause ne coûte rien. Elle est à toi. », « Tu reviens quand tu veux. Rien ne presse. », « On ne fait rien du tout. C'est permis. », « Tu as bien fait de demander la pause. » `blocage_lecture` propose une pause ou une sortie dans ses 20 variantes. |

## Les trois motifs du tour 1 restent éteints

Vérifié à nouveau, puisque 53 variantes ont bougé depuis :

```
A. photo_illisible  : variantes nommant la photo, l'image, la feuille,
                      le cahier, l'ecriture ou un echec ....  0 / 20
                      variantes offrant une sortie ......... 20 / 20
B. blocage_lecture  : panne attribuee au micro ou a Pilou ... 20 / 20
                      variantes offrant une sortie ......... 20 / 20
C. indices          : 4 banques, 20 / 20 dans leur registre
                      pour les quatre niveaux
```

## Passage à signaler

```
enc.reussite_maths.15 : « Tu as cherché sans t'arrêter. Bravo pour ton courage. »
```

Seule entrée des 479 qui félicite la continuité de l'effort plutôt que l'effort.
Un enfant qui a demandé une pause pendant l'étape — conduite que le produit
encourage et déclare gratuite — peut recevoir cet éloge au bilan. C'est le point
4 de la grille, « aucune série à ne pas casser », effleuré et non franchi : rien
ne compte les pauses, rien ne les pénalise, rien ne les mentionne ailleurs.

**Reformulation proposée** : « Tu as cherché avec patience. Bravo pour ton
courage. » Vérifiée sans effet de bord : 0,333 au maximum contre les dix-neuf
autres variantes de la banque.

AVIS: CONFORME

Motif : aucun des 479 textes ne met un enfant fatigué en difficulté, ne lui
adresse un reproche, ne le compare, ne l'ironise, ne le met sous pression, ne lui
promet une récompense réelle, ne lui donne un résultat de maths, ni ne lui ferme
la pause. Les trois passages qui fondaient l'avis NON CONFORME du tour 1 sont
éteints et le restent après 53 réécritures. La seule réserve, `reussite_maths.15`,
relève du point 4 par effleurement et se corrige d'une phrase ; elle n'est pas
de nature à retenir l'avis.

---

# CHIFFRES ANNONCÉS CONTRE CHIFFRES RÉELS

Recomptés par mes propres commandes, sans lire les sorties du rapport.

## Variantes par situation

| # | Situation | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- | --- |
| 1 | `accueil` | 20 | **20** | — |
| 2 | `annonce_programme` | 20 | **20** | — |
| 3 | `annonce_programme_une_etape` | 20 | **20** | — |
| 4 | `avant_lecture` | 20 | **20** | — |
| 5 | `encouragement_pendant_lecture` | 20 | **20** | — |
| 6 | `retour_apres_lecture` | 20 | **20** | — |
| 7 | `hesitation` | 20 | **20** | — |
| 8 | `blocage_lecture` | 20 | **20** | — |
| 9 | `avant_maths` | 20 | **20** | — |
| 10 | `indice_demande_1` | 20 | **20** | — |
| 11 | `indice_demande_2` | 20 | **20** | — |
| 12 | `indice_demande_3` | 20 | **20** | — |
| 13 | `indice_demande_4` | 20 | **20** | — |
| 14 | `blocage_maths` | 20 | **20** | — |
| 15 | `reussite_maths` | 20 | **20** | — |
| 16 | `transition_lecture_vers_maths` | 20 | **20** | — |
| 17 | `transition_maths_vers_lecture` | 20 | **20** | — |
| 18 | `demande_pause` | 20 | **20** | — |
| 19 | `retour_de_pause` | 20 | **20** | — |
| 20 | `cloture` | 20 | **20** | — |
| 21 | `pas_de_devoirs` | 20 | **20** | — |
| 22 | `photo_illisible` | 20 | **20** | — |
| 23 | `reprise_session` | 20 | **20** | — |
| | **Total** | **460** | **460** | **—** |

## Les autres grandeurs

| Grandeur | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- |
| Version | 2.2.0 | **2.2.0** | — |
| JSON valide, clés dupliquées | valide, 0 | **valide, 0** | — |
| Situations | 23 | **23** | — |
| Variantes | 460 | **460** | — |
| Parties | 680 | **680** | — |
| Lignes fixes des rituels | 19 | **19** (10 + 9) | — |
| Entrées totales | 479 | **479** | — |
| Phrases contrôlées | 864 | **864** (sur les rendus) | — |
| Dépassements de 12 mots | 0 | **0** (règle stricte et règle souple) | — |
| Phrase la plus longue | 10 mots | **10 mots** | — |
| Interdits de vocabulaire | 0 | **0** (40 motifs, 527 rendus) | — |
| Emoji | 0 | **0** | — |
| Chiffres | 0 | **0** | — |
| Prénom en dur | 0 | **0** | — |
| Accords de genre fautifs | 0 | **0** (527 rendus, 3 prénoms) | — |
| Identifiants uniques | 479 | **479 / 479** | — |
| Textes uniques | 479 | **479 / 479** (strict et normalisé) | — |
| `texte == jointure des parties` | 460 / 460 | **460 / 460** | — |
| Parties sans clé | 0 | **0** | — |
| Clés déclarées | 35 | **35** | — |
| Clés absentes du marketing | 0 | **0** | — |
| Canaux `les_deux` / `affiche` / `tts` | 454 / 25 / 0 | **454 / 25 / 0** | — |
| Prépositions contractantes à gauche du jeton | 0 | **0** | — |
| Paires signalées (recouvrement) | 0 | **0** | — |
| Paires exactement au seuil de 0,50 | 0 | **0** sous sa règle | — |
| Maximum Jaccard | 0,429 | **0,429** sur la même paire | — |
| Maximum similarité de séquence | 0,698 | **0,696** (écart de tokenisation, seuil 0,70 non atteint) | — |

**Vingt-quatre grandeurs annoncées, vingt-quatre exactes. Aucun écart.**

## Note de méthode sur le recouvrement, et sur deux lectures à 0,50 qui sont les miennes

Je dois consigner un point que j'ai failli compter contre le producteur, et qui
est un défaut de ma mesure, pas de son fichier.

Ma tokenisation du tour 1 **retire les accents** avant d'appliquer la liste de
mots-outils. Deux effets de bord :

- « **là** » devient « la », qui est dans ma liste, donc « là » est traité comme
  un mot-outil et disparaît ;
- « **à** » ne devient pas « a » si je *préserve* les accents, donc « à » compte
  comme un mot plein.

Selon la variante de ma tokenisation, je trouve donc **une** paire à 0,50 — mais
pas la même :

```
accents strippes  : 0,500  encouragement_pendant_lecture 05/13
                    « Je suis là. » || « Je te suis des yeux. »
                    -> artefact : « là » efface, et « suis » (etre) homographe de « suis » (suivre)
                    -> sous l'autre tokenisation : 0,333

accents preserves : 0,500  pas_de_devoirs 05/20
                    « On ne travaille pas ce soir. Bonne soiree a toi. »
                    || « Ce soir, il n'y a rien a preparer. Bonne soiree, tranquillement. »
                    -> artefact : « à » compte comme mot plein
                    -> sous l'autre tokenisation : 0,429
```

Aucune des deux n'est un doublon de sens : « Je suis là » (je suis présente) et
« Je te suis des yeux » (je te regarde) n'ont rien de commun ; les deux phrases
de `pas_de_devoirs` partagent la formule de politesse finale et rien d'autre.
**Le vrai maximum de ma mesure, en écartant mes deux artefacts, est 0,429 sur
`hesitation` 02/20 — exactement le chiffre et exactement la paire que le
producteur publie.**

Je le détaille parce que c'est la symétrie du tour 2 : là j'avais cassé son
chiffre avec ma mesure, ici c'est ma mesure qui fléchit et la sienne qui tient.
Un contrôleur qui publie ses écarts dans un sens doit publier ses artefacts dans
l'autre.

## Ma règle de comptage des mots

Inchangée depuis le tour 1, appliquée aux rendus et non aux gabarits.

- **Règle souple** : phrases découpées sur `.`, `!`, `?`, `…` ; élision et trait
  d'union restent dans le mot — « je t'aide » = 2 mots.
- **Règle stricte** (celle du producteur) : on coupe aussi sur l'apostrophe et le
  trait d'union — « je t'aide » = 3 mots.

| Règle | Phrase la plus longue | Longueur | Dépassements |
| --- | --- | --- | --- |
| Stricte | `enc.blocage_maths.01` — « On souffle un peu, ou on passe à la suite » | **10** | **0** |
| Souple | même phrase | **10** | **0** |

---

# SORTIES RÉELLES DES COMMANDES

Exécutées dans `/home/user/Tipi`, sorties collées telles quelles.

## 1. Validité JSON, version, clés dupliquées

```
$ node -e "... JSON.parse des deux fichiers ..."
content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v2, version=2.2.0, cles racine=11
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v2, version=2.0.0, cles racine=8
---exit:0---

$ python3  # object_pairs_hook : detecte ce qu'un JSON.parse masque
CLES DUPLIQUEES encouragements : aucune
CLES DUPLIQUEES gwenn-scripts  : aucune
```

## 2. Comptage indépendant

```
$ python3
nb situations : 23
accueil 20 var 40 parties | annonce_programme 20/20 | annonce_programme_une_etape 20/20
avant_lecture 20/20 | encouragement_pendant_lecture 20/20 | retour_apres_lecture 20/40
hesitation 20/20 | blocage_lecture 20/40 | avant_maths 20/20
indice_demande_1 20/20 | indice_demande_2 20/20 | indice_demande_3 20/20 | indice_demande_4 20/20
blocage_maths 20/40 | reussite_maths 20/40
transition_lecture_vers_maths 20/40 | transition_maths_vers_lecture 20/40
demande_pause 20/40 | retour_de_pause 20/20 | cloture 20/20
pas_de_devoirs 20/40 | photo_illisible 20/40 | reprise_session 20/40
  (cle == id : 23 fois sur 23)
TOTAL variantes : 460  TOTAL parties : 680
lignes rituels : 19  ENTREES : 479
```

## 3. Schéma, invariant, unicité, canaux

```
$ python3
ENTREES: 479  PARTIES: 680  PROBLEMES SCHEMA/INVARIANT: 0  []
CANAUX: {'les_deux': 454, 'affiche': 25}
IDS uniques: 479 / 479   TEXTES uniques: 479 / 479
TEXTES uniques normalises: 479
```

Le contrôle vérifie sans anomalie : chaque variante porte exactement `id`,
`texte`, `canal`, `jetons`, `parties` ; chaque partie exactement `cles_ui` et
`texte` ; aucune partie sans clé ; chaque clé déclarée par une partie figure dans
les `cles_ui` de sa situation ; les jetons déclarés sont exactement les jetons
présents ; `texte` est la jointure des parties **460 fois sur 460**.

## 4. Longueur des phrases, sur les rendus

```
$ python3
RENDUS: 527
PHRASES (rendus, prenom substitue une fois) : 864
Depassements >12 STRICT: 0   SOUPLE: 0
Max strict: 10   Max souple: 10
   10/10 enc.blocage_maths.01        On souffle un peu, ou on passe à la suite
   10/ 8 enc.blocage_lecture.16      Je n'entends qu'un petit bout de ta voix
   10/ 8 enc.blocage_lecture.05      Je t'entends mal, et ce n'est pas toi
    9/ 9 enc.indice_demande_3.10     Je te montre la même chose en plus petit
    9/ 9 enc.indice_demande_2.14     On peut compter avec des cubes ou des crayons
    9/ 9 enc.hesitation.19           On le regarde de plus près, tous les deux
```

## 5. Le jeton `{matiere}` : mot de gauche et 40 rendus

```
$ python3
id   mot a GAUCHE   GABARIT                                     | RENDU LECTURE                        | RENDU MATHS
01   fait           On fait {matiere}. Et c'est tout.           | On fait la lecture. Et c'est tout.   | On fait les maths. Et c'est tout.
02   travailles     Ce soir, tu travailles {matiere} avec moi.  | ...la lecture avec moi.              | ...les maths avec moi.
03   prépare        On prépare {matiere}, tous les deux.        | On prépare la lecture, tous les deux.| On prépare les maths, tous les deux.
04   a              Au programme, il y a {matiere}.             | ...il y a la lecture.                | ...il y a les maths.
05   travaille      On travaille {matiere} ensemble.            | ...la lecture ensemble.              | ...les maths ensemble.
06   propose        Je te propose {matiere} pour ce soir.       | ...la lecture pour ce soir.          | ...les maths pour ce soir.
07   prend          On prend {matiere}, tranquillement.         | ...la lecture, tranquillement.       | ...les maths, tranquillement.
08   fait           Aujourd'hui, on fait {matiere}.             | ...la lecture.                       | ...les maths.
09   ouvre          On ouvre {matiere}, et on y va.             | ...la lecture, et on y va.           | ...les maths, et on y va.
10   pour           On s'installe pour {matiere}.               | ...pour la lecture.                  | ...pour les maths.
11   fais           Tu fais {matiere} avec moi.                 | ...la lecture avec moi.              | ...les maths avec moi.
12   commence       On commence {matiere} quand tu veux.        | ...la lecture quand tu veux.         | ...les maths quand tu veux.
13   regarde        Ce soir, on regarde {matiere}.              | ...la lecture.                       | ...les maths.
14   pour           On y va doucement pour {matiere}.           | ...pour la lecture.                  | ...pour les maths.
15   sur            Je t'accompagne sur {matiere}.              | ...sur la lecture.                   | ...sur les maths.
16   met            Au programme du soir, on met {matiere}.     | ...on met la lecture.                | ...on met les maths.
17   fait           On fait {matiere}, comme il faut.           | ...la lecture, comme il faut.        | ...les maths, comme il faut.
18   sur            Ce soir, on passe du temps sur {matiere}.   | ...sur la lecture.                   | ...sur les maths.
19   sur            On avance sur {matiere}, doucement.         | ...sur la lecture, doucement.        | ...sur les maths, doucement.
20   travailler     On va travailler {matiere} ce soir.         | ...la lecture ce soir.               | ...les maths ce soir.

### 40 RENDUS : SCAN GRAMMATICAL (11 motifs)
  [contraction de+le/les, a+le/les                        ] 0
  [elision manquante devant voyelle                       ] 0
  [double determinant (le/la/les + la/les)                ] 0
  [majuscule en milieu de phrase                          ] 0
  [minuscule en tete de phrase                            ] 0
  [double espace                                          ] 0
  [espace avant ponctuation simple                        ] 0
  [accord singulier impose a « les maths »                ] 0
  [accord pluriel impose a « la lecture »                 ] 0
  [apostrophe suivie d'espace                             ] 0
  [virgule collee au mot suivant                          ] 0

  jeton absent d'une variante : aucune
  jeton en debut de phrase    : aucune
  jeton sujet d'un verbe      : aucune
```

## 6. Recouvrement — liste de mots-outils **exacte du tour 1**, deux tokenisations

```
$ python3
===== jetons NEUTRALISES, accents strippes (tokenisation du tour 1) =====
  paires STRICTEMENT > 0,50 : 0
  paires EXACTEMENT a 0,50  : 1
     [encouragement_pendant_lecture] 05 «Je suis là.» || 13 «Je te suis des yeux.»
  MAXIMUM Jaccard : 0.5000   (artefact : « là » -> « la », mot-outil ; « suis » homographe)

===== jetons NEUTRALISES, accents preserves =====
  paires STRICTEMENT > 0,50 : 0
  paires EXACTEMENT a 0,50  : 1
     [pas_de_devoirs] 05/20   (artefact : « à » compte comme mot plein)
  MAXIMUM Jaccard : 0.5000

===== verification des deux maxima publies par le producteur =====
  [hesitation] 02/20
      A: «Ce mot est long. Tu veux l'essayer encore ?»
      B: «Ce mot demande un effort. Tu veux essayer ?»
      Jaccard accents strippes=0.429  accents preserves=0.429  sequence=0.651
  [retour_de_pause] 01/20
      Jaccard=0.167  sequence=0.674
  [pas_de_devoirs] 05/20       strippes=0.429  preserves=0.500
  [encouragement_pendant_lecture] 05/13   strippes=0.500  preserves=0.333

===== distribution des recouvrements (accents preserves), valeurs >= 0,30 =====
   0.50 -> 1 paire   0.44 -> 2   0.43 -> 8   0.40 -> 14
   0.38 -> 9         0.36 -> 1   0.33 -> 44  0.31 -> 1   0.30 -> 20

===== les 6 paires les plus proches, lues une par une =====
   J=0.500 seq=0.434 [pas_de_devoirs] 05 «On ne travaille pas ce soir. Bonne soirée à toi.»
                                      20 «Ce soir, il n'y a rien à préparer. Bonne soirée, tranquillement.»
   J=0.444 seq=0.649 [transition_lecture_vers_maths] 01 || 05
   J=0.429 seq=0.514 [transition_lecture_vers_maths] 13 || 16
   J=0.429 seq=0.447 [transition_lecture_vers_maths] 04 || 08
   J=0.429 seq=0.590 [pas_de_devoirs] 01 || 16
   J=0.429 seq=0.442 [indice_demande_1] 02 «J'ai une question pour toi. Écoute.»
                                        08 «On commence par comprendre. J'ai une question.»
   -> aucune n'est la meme phrase declinee ; toutes changent d'angle.
```

## 7. Le piège d'outillage : les 6 variantes signalées par l'ancien détecteur

```
$ sed -n '648,657p' docs/agents/P1/contenu-enfant.out.md
======================================================================
9. CONSTAT 4 — les quatre niveaux d'indices ne se melangent pas
======================================================================
re-mesure avec l'ANCIENNE liste de radicaux du niveau 3 : 6 variantes non reconnues
  05, 09, 13, 14, 19, 20
  (chacune verifiee a la main : ce sont des annonces d'exemple simplifie)
indice_demande_1   variantes dans le registre du niveau : 20 / 20
indice_demande_2   variantes dans le registre du niveau : 20 / 20
indice_demande_3   variantes dans le registre du niveau : 20 / 20
indice_demande_4   variantes dans le registre du niveau : 20 / 20
```

Les six, relues par moi contre PED-02 niveau 3 :

```
05  « Regarde ce cas tout simple. »              -> un cas plus simple      OK
09  « Je te donne un modèle facile à suivre. »   -> un modele analogue      OK
13  « On fait d'abord une version courte. »      -> le meme, raccourci      OK
14  « Voilà un cas facile pour comprendre. »     -> un cas plus simple      OK
19  « Écoute d'abord ce petit exercice. »        -> un exercice plus petit  OK
20  « On prend moins d'objets pour commencer. »  -> « nombres plus simples » OK
```

Ma reconstruction de l'ancienne liste (radical « exemple » seul) en signale 14 et
non 6 : je ne connais donc pas sa liste d'origine. J'ai vérifié le résultat, pas
la procédure — et j'ai compensé en relisant les **20** variantes du niveau 3 et
les **80** des quatre niveaux, aucune hors de son registre.

## 8. La reformulation du constat 18, vérifiée

```
$ python3   # max Jaccard contre les 19 AUTRES variantes de reussite_maths
  MA SUGGESTION DU TOUR 2    max J = 0.500  contre 03 «Tu as tenu jusqu'au bout. Bravo pour tes efforts.»
  LIVREE AU TOUR 3           max J = 0.273  contre 01 «Bravo. Tu as bien cherché. Tu as trouvé ta façon de faire.»
  MA PROPOSITION TOUR 3      max J = 0.333  contre 01
  VARIANTE DE SECOURS        max J = 0.300  contre 04
```

Ma suggestion du tour 2 aurait produit 0,500, soit le nouveau maximum du fichier.
Son refus était fondé.

## 9. Interdits, emoji, chiffres, prénom en dur, accord de genre

```
$ python3   # 40 motifs, sur les 527 rendus
=== INTERDITS : motifs declenches 1
  [\bpas bien\b] 6 -- toutes dans blocage_lecture, sujet = le micro ou Pilou :
     "Le micro n'entend pas bien ce soir."
     "Je n'ai pas bien entendu."
     "Le son ne me parvient pas bien."
     "Je n'attrape pas bien ta voix."
     "Ta voix ne m'arrive pas bien."
     "Mon écoute ne marche pas bien ce soir."
  ( "tu n'as pas" et "abandonn" : 0 -- le [MINEUR] 18 du tour 2 est bien corrige )

EMOJI: 0     CHIFFRES: []     PRENOM EN DUR: []

=== ACCORD DE GENRE sur 527 rendus (3 prenoms dont un feminin) ===
   enc.accueil.01           'contente'   accord sur Pilou (feminin)      [x3 prenoms]
   enc.accueil.03           'prêt'       accord sur tipi (masculin)      [x3 prenoms]
   enc.blocage_lecture.06   'fatiguée'   accord sur oreille (feminin)
   enc.pas_de_devoirs.06    'arrivé'     accord sur devoir (masculin)
   enc.photo_illisible.18   'prête'      accord sur Pilou (feminin)
   tournures "tu es ..e" / "on est ..e" : 0
   participes -es/-ees : idees, pierres rangees, maths terminees -- aucun sur l'enfant
```

Les six « pas bien » sont la formulation que PED-09 prescrit : le sujet est
toujours le micro ou Pilou, jamais la performance de l'enfant.

## 10. Clés, renommage ARB-07, clés fixes

```
$ python3
cles definies marketing : 339
cles declarees (situation) : 35 | (partie) : 35 | identiques : True
>>> CLES ABSENTES DU MARKETING : 0  []
>>> cles declarees par plusieurs banques : aucune

=== RENOMMAGE ARB-07 ===
  cloture.cles_ui : ['session.fin_travail.corps']
  statut_cles     : ['session.fin_travail.corps']
  'session.fin_travail.corps' defini cote marketing ? True
  occurrences cote marketing : 5 | anciennes ('transition.cloture.corps') restantes : 0

cles_fixes_non_variees : 9 groupes, 34 cles
  les 5 cles du [MINEUR] 16 presentes ? ['maths.concret.corps', 'pause.rassurance',
      'enfant.attente.pilou', 'lecture.reprise.corps', 'maths.reprise.corps']
  intersection banques / cles fixes : aucune
```

## 11. Fraîcheur des métadonnées — origine du [MINEUR] 20

```
$ python3   # 12 motifs de peremption sur tous les champs hors `texte`
  [transition\.cloture] .statut_cles.session.fin_travail.corps
      « Renommée depuis transition.cloture.corps, sur demande du contrôle du tour 2... »
      -> LEGITIME : documente l'historique du renommage

  [transition\.cloture] .situations.cloture.note
  [a creer]            .situations.cloture.note
      « ... La cle transition.cloture.corps est a creer cote marketing : voir statut_cles. »
      -> PERIME sur deux points  =>  [MINEUR] 20

  (le troisieme motif remonte « enfant.programme.une.titre » dans cles_fixes : faux positif)
```

## 12. Acquis — vérification après les 53 réécritures

```
$ python3
  photo_illisible    nomment le support : 0/20    sortie offerte : 20/20
  blocage_lecture    panne sur le micro : 20/20   sortie offerte : 20/20
  Soir leger : motifs de reduction/fatigue dans annonce_programme_une_etape : 0/16 motifs
  PED-05 qualification de l'enfant     : 0
  PED-01 resultat donne                : 0
  PED-04 jugement d'exactitude         : 0

  "c'est {matiere}" / "c'est les maths" / "c'est la lecture" : 0 / 0 / 0
  "au fur et a mesure" : absent
  valorisation de l'absence de pause : 1 occurrence  => [MINEUR] 21
      enc.reussite_maths.15  "Tu as cherché sans t'arrêter. Bravo pour ton courage."
```

---

# HISTORIQUE DES TOURS 1 ET 2

## Tour 1 — `FAIL` : 0 [BLOQUANT], 8 [MAJEUR], 5 [MINEUR], gardien NON CONFORME

Les 23 grandeurs annoncées avaient été vérifiées à l'unité, sans écart.

| # | Gravité | Constat | Sort |
| --- | --- | --- | --- |
| 1 | [MAJEUR] | `cloture.cles_ui` contenait `bravo.titre`, ligne invariante du rituel (PED-12 cassée dans le fichier) | **Corrigé au tour 2**, vérifié aux tours 2 et 3 |
| 2 | [MAJEUR] | 5 clés déclarées n'existaient plus après la correction du marketing | **Corrigé au tour 2** : clés éclatées utilisées ou déclarées fixes |
| 3 | [MAJEUR] | Rien ne disait quelle clé une variante remplit | **Corrigé au tour 2** : champ `parties`, invariant `texte == jointure` |
| 4 | [MAJEUR] | `indice_demande` aplatissait l'échelle PED-02 | **Corrigé au tour 2** : 4 banques de 20, une par niveau |
| 5 | [MAJEUR] | `photo_illisible` : 10/20 nommaient la photo, 17/20 sans issue | **Corrigé au tour 2** : 0/20 et 20/20, confirmé au tour 3 |
| 6 | [MAJEUR] | `blocage` mélangeait panne de micro et difficulté d'exercice | **Corrigé au tour 2** : `blocage_lecture` créée, 20/20 |
| 7 | [MAJEUR] | Boutons du rituel inversés contre DES-06, identifiants inexistants | **Corrigé au tour 2** (ARB-03) |
| 8 | [MAJEUR] | Deux vocabulaires de canal non tranchés | **Corrigé au tour 2** (ARB-02), décision inscrite dans le fichier |
| 9 | [MINEUR] | `pas_de_devoirs` répétitive (5 paires) | **Corrigé au tour 2**, 0 paire au tour 3 |
| 10 | [MINEUR] | `cloture` empruntait les mots du rituel | **Corrigé au tour 2**, 0 emprunt au tour 3 |
| 11 | [MINEUR] | Un participe accordé au genre (`reprise_session.01`) | **Corrigé au tour 2**, 0 accord fautif au tour 3 |
| 12 | [MINEUR] | Phrase du rapport sur les canaux fausse | **Corrigé au tour 2** |
| 13 | [MINEUR] | 6 tournures au-dessus du registre CE1 | **Corrigé au tour 2**, absentes au tour 3 |

Gardien tour 1 : **NON CONFORME** sur les points 1 et 7, motifs A
(`photo_illisible` sans issue), B (panne de micro présentée comme la difficulté
de l'enfant), C (amorce d'indice annonçant autre chose que l'aide qui suit).
Les trois motifs sont éteints depuis le tour 2 et le restent au tour 3.

## Tour 2 — `FAIL` : 0 [BLOQUANT], 2 [MAJEUR], 4 [MINEUR], gardien CONFORME

21 grandeurs exactes, **3 fausses**, toutes sur le recouvrement.

| # | Gravité | Constat | Sort |
| --- | --- | --- | --- |
| 14 | [MAJEUR] | Le jeton `{matiere}` produisait « On s'occupe **de les maths** » ; la garantie déclarée regardait à droite du jeton, le défaut était à gauche | **Corrigé au tour 3.** Variante réécrite en « On prépare {matiere}, tous les deux. » et **la contrainte manquante est inscrite dans `regles.jeton_matiere_regle`**. 40 rendus contrôlés sur 11 motifs : 0 défaut |
| 15 | [MAJEUR] | 3 chiffres faux sur le recouvrement : 3 paires > 0,50 (max 0,667) et 12 paires pile à 0,50 sur 10 banques, là où « 0, max 0,50, 5 banques » était annoncé | **Corrigé au tour 3.** 46 paires signalées par une mesure à trois règles, 53 variantes réécrites, seuil en « supérieur ou égal », compte des paires au seuil publié. Vérifié chez moi : 0 paire > 0,50, maximum 0,429 sur la paire qu'il publie |
| 16 | [MINEUR] | 5 clés ni variées ni déclarées fixes | **Corrigé au tour 3** : 9ᵉ groupe de `cles_fixes_non_variees`, les 5 clés présentes |
| 17 | [MINEUR] | « au fur et à mesure », hors registre CE1 | **Corrigé au tour 3** : « Tu peux barrer les ronds, un par un. » |
| 18 | [MINEUR] | Éloge par la négation (« Tu n'as pas abandonné. ») | **Corrigé au tour 3**, avec une formulation différente de la mienne — et il avait raison de l'écarter. Sa formulation appelle le [MINEUR] 21 |
| 19 | [MINEUR] | Nom `transition.cloture.corps` trompeur, que j'avais moi-même proposé au tour 1 | **Corrigé au tour 3** (ARB-07) : `session.fin_travail.corps`, des deux côtés. Une trace périmée subsiste : [MINEUR] 20 |

Jugements rendus au tour 2 et confirmés au tour 3 : le procédé `{matiere}` est
sain et ne contourne pas ARB-04 ; le Soir léger est indiscernable ; la réponse
sur le canal `tts` est validée sans réserve ; le nom de la clé de clôture devait
être changé.

---

# SYNTHÈSE DU TOUR 3

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | — |
| **[MAJEUR]** | **0** | — |
| **[MINEUR]** | **2** | 20 (`situations.cloture.note` périmée), 21 (`reussite_maths.15` valorise l'absence de pause) |

**VERDICT: PASS_AVEC_RESERVES.** Aucun [BLOQUANT], aucun [MAJEUR] : la règle
mécanique n'impose pas FAIL. Deux [MINEUR] subsistent, d'où la réserve.

## Les deux réserves, et comment les lever

Elles ne conditionnent pas l'ouverture de G1 : aucune n'atteint l'enfant dans son
usage normal, aucune ne bloque l'architecte, le design system ou les verticales.
Elles se lèvent en deux lignes, et je recommande de les corriger avant la
première consommation du fichier par du code.

| Constat | Action | Ampleur |
| --- | --- | --- |
| 20 | Dans `situations.cloture.note`, remplacer « La cle transition.cloture.corps est a creer cote marketing » par « La cle `session.fin_travail.corps` est definie cote marketing » | 1 phrase |
| 21 | `enc.reussite_maths.15` → « Tu as cherché avec patience. \|\| Bravo pour ton courage. » (vérifiée : 0,333 au maximum dans sa banque) | 1 variante |

## Ce que j'ai vérifié moi-même et qui n'a pas à être recontrôlé

- **Les vingt-quatre grandeurs annoncées, toutes exactes** : version 2.2.0, JSON
  valide, 0 clé dupliquée, 23 situations à 20, 460 variantes, 680 parties, 479
  entrées, 864 phrases, 0 dépassement de 12 mots avec un maximum de 10, 0
  interdit, 0 emoji, 0 chiffre, 0 prénom en dur, 0 accord de genre, 479
  identifiants et 479 textes uniques, invariant `texte == jointure` 460/460, 0
  partie sans clé, 35 clés dont 0 absente du marketing, canaux 454/25/0, 0
  préposition contractante à gauche du jeton, 0 paire signalée, 0 paire au seuil,
  maximum 0,429.
- **Les 40 rendus du jeton `{matiere}`**, sur 11 motifs grammaticaux.
- **Les 80 variantes des quatre niveaux d'indices**, relues contre PED-02.
- **Les 20 variantes de `photo_illisible` et de `blocage_lecture`**, et les dix
  banques les plus touchées par les 53 réécritures.
- **PED-01, PED-02, PED-04, PED-05, PED-07, PED-11, PED-12**, et l'arbitrage
  PED-11 / PED-12.
- **ARB-02, ARB-03, ARB-04, ARB-06, ARB-07**, tous appliqués.
- L'`AVIS gardien-charte`, **CONFORME**.

## Ce que je recommande de porter au-delà de cette porte

La recette en cinq points de la section « piège d'outillage » ci-dessus. Elle
est née d'un défaut réel, elle a été vérifiée sur deux instruments différents de
ce livrable, et elle s'appliquera telle quelle à un seuil de couverture de tests,
à une règle de lint ou à un filtre de résultats en phase de code. Le cinquième
point — **publier aussi l'ancienne version de l'instrument** — est le seul qui
manque encore ici, et c'est celui qui aurait permis de vérifier la procédure et
pas seulement le résultat.

Le nom de fichier `gwenn-scripts.json` reste hors de mon périmètre : ESC-001.
