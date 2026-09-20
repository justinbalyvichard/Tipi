VERDICT: FAIL

# Contrôle de `contenu-enfant` — tour 2

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Objets contrôlés : `content/encouragements.json` (`tipi.encouragements.v2`,
version 2.0.0), `content/gwenn-scripts.json` (`tipi.gwenn-scripts.v2`,
version 2.0.0), `docs/agents/P1/contenu-enfant.out.md`.

Références : `TIPI-PROMPT-CURSOR.md` §1, §2, §3, §5.1 ;
`docs/agents/GATES.md` (arbitrages ARB-02, ARB-03, ARB-04, ARB-06) ;
`docs/agents/P1/produit-marketing.out.md` ; `.cursor/rules/00-charte-tipi.mdc` ;
`.cursor/rules/30-copy-enfant.mdc`.

## Position

**Les treize constats du tour 1 sont traités, et bien traités.** Les huit
[MAJEUR] sont corrigés au fond, pas habillés : `cloture` n'alimente plus
`bravo.titre`, les cinq clés mortes sont remplacées, le champ `parties` règle le
raccordement, `indice_demande` est éclaté en quatre niveaux réels,
`photo_illisible` est réécrite de bout en bout, `blocage_lecture` existe, les
boutons du rituel suivent DES-06, le vocabulaire de canal est tranché. Les cinq
[MINEUR] aussi. Le volume passe de 320 à 460 variantes sans perte de qualité :
c'est un travail sérieux et je le dis avant de dire le reste.

**Le FAIL tient à deux constats neufs**, tous deux introduits par la reprise
elle-même :

1. Le jeton `{matiere}`, mécanisme ajouté au tour 2, produit **un rendu
   agrammatical** que l'enfant entendra et lira : « On s'occupe de **les maths**,
   tous les deux. » Le contrôle du producteur portait sur la position du jeton et
   sur l'accord ; il ne portait pas sur ce qui précède le jeton, qui est
   justement ce qui casse.
2. **Trois chiffres annoncés sur le recouvrement sont faux.** C'est le premier
   écart entre chiffre annoncé et chiffre réel depuis le début de cette porte, et
   il tombe sur l'indicateur que le producteur avait lui-même signalé comme
   fragile.

Les vingt-et-une autres grandeurs annoncées sont exactes à l'unité.

---

# CONSTATS DU TOUR 2

## [MAJEUR] 14 — Le jeton `{matiere}` produit un rendu agrammatical : « On s'occupe de les maths »

`content/encouragements.json`, `situations.annonce_programme_une_etape` :

```json
{ "id": "enc.annonce_programme_une_etape.03",
  "texte": "On s'occupe de {matiere}, tous les deux.",
  "jetons": ["{matiere}"],
  "parties": [{ "cles_ui": ["enfant.programme.une.corps.lecture",
                            "enfant.programme.une.corps.maths"],
                "texte": "On s'occupe de {matiere}, tous les deux." }] }
```

`jeton_matiere.valeurs` donne les deux substitutions. Les deux rendus réels :

```
[enfant.programme.une.corps.lecture]  "On s'occupe de la lecture, tous les deux."   OK
[enfant.programme.une.corps.maths]    "On s'occupe de les maths, tous les deux."    AGRAMMATICAL
```

« de les » n'existe dans aucun registre du français : la préposition `de` se
contracte obligatoirement avec `les` en `des`. La forme correcte est
« On s'occupe **des maths**, tous les deux. »

Pourquoi le contrôle du producteur ne l'a pas vu. Le rapport §0 bis affirme que
le jeton « n'apparaît jamais en début de phrase et n'est jamais sujet d'un
verbe », et `regles.jeton_matiere_regle` inscrit la même garantie dans le
fichier. J'ai vérifié les deux : elles sont **tenues**, 20/20. Mais elles portent
sur ce qui suit le jeton. Le défaut est dans ce qui le **précède** : le jeton
porte son propre article (« **la** lecture » / « **les** maths »), donc toute
préposition placée devant doit se contracter, et la contraction **diffère entre
les deux valeurs** (`de la lecture` sans contraction, `des maths` avec). La règle
déclarée ne couvre pas ce cas, et c'est le seul cas où le gabarit ne peut pas
être juste pour les deux valeurs à la fois.

Les 19 autres variantes passent, et ce n'est pas un hasard : elles emploient soit
aucune préposition (`On fait {matiere}`, `Je te propose {matiere}`), soit une
préposition qui ne se contracte pas (`pour {matiere}`, `sur {matiere}`). Une
seule emploie `de`, et c'est celle qui casse.

Gravité. Ce texte est dit par le TTS et affiché sur `/enfant/programme` à un
enfant de CE1 en cours d'apprentissage de la lecture, un soir sur deux où le
parent a retiré une matière. Une application qui accompagne les devoirs ne peut
pas lui faire entendre une faute d'agglutination. Et l'affirmation du rapport
selon laquelle « les deux rendus sont contrôlés » est, sur ce point précis,
démentie par le fichier.

**Correction attendue** — deux lignes, au choix :
- réécrire la variante sans préposition contractante :
  `enc.annonce_programme_une_etape.03` → « On s'occupe **du travail de**
  {matiere}, tous les deux. » n'est pas bon non plus ; écrire plutôt
  « **On prépare** {matiere}, tous les deux. » ou « **On regarde** {matiere},
  tous les deux. » ;
- et, pour que le défaut ne revienne pas, ajouter à
  `regles.jeton_matiere_regle` la contrainte manquante : **« Aucune préposition
  contractante (`de`, `à`) ne précède immédiatement le jeton : les deux valeurs
  ne se contractent pas de la même façon. »** Cette phrase est la garantie qui
  manquait ; sans elle, la prochaine variante ajoutée rouvrira le même trou.

## [MAJEUR] 15 — Trois chiffres annoncés sur le recouvrement sont faux ; trois paires dépassent réellement 0,50, dont deux sont la même phrase à un mot près

Le rapport §4 annonce :

> « **aucune paire de variantes d'une même banque ne dépasse 0,50 de
> recouvrement** (indice de Jaccard sur les mots pleins, **la mesure même du
> contrôleur**). Le **maximum constaté est de 0,50**, sur **cinq banques**. »

J'ai rejoué ma mesure du tour 1, avec **la liste de mots-outils exacte du tour
1**, sans un mot ajouté, et en appliquant la neutralisation des jetons que le
producteur déclare en §5.4.

| Grandeur | Annoncé | **Mesuré par moi** |
| --- | --- | --- |
| Paires strictement au-dessus de 0,50 | **0** | **3** |
| Maximum de recouvrement | **0,50** | **0,667** |
| Banques touchées au seuil | **5** | **10** (12 paires exactement à 0,50) |

Les trois paires au-dessus de 0,50 :

```
0,667  [encouragement_pendant_lecture]
       02  « Continue, tu lis bien. »
       18  « C'est bien, continue. »

0,571  [transition_lecture_vers_maths]
       05  « Tu as terminé ta lecture. On va faire les maths. »
       10  « Tu as terminé la lecture. On finit avec les maths. »

0,571  [photo_illisible]
       04  « Je prends un peu plus de temps. Ton coffre est ouvert. »
       07  « Je mets un peu de temps ce soir. Le coffre est ouvert pour toi. »
```

Les deux premières ne sont pas des artefacts de mesure. `encouragement_pendant_lecture`
02 et 18 sont **les deux mêmes mots pleins dans l'autre ordre** ; l'enfant les
voit pendant qu'il lit, à quelques minutes d'intervalle. `transition_lecture_vers_maths`
05 et 10 sont **la même phrase**, à l'article et au verbe près — et la variante
01 de la même banque dit encore « Tu as terminé la lecture. Maintenant, on passe
aux maths. » : trois variantes sur vingt disent la même chose. Le miroir
`transition_maths_vers_lecture` a le même défaut sur 01 et 10.

Sur le regroupement à 0,50. Douze paires tombent **exactement** sur la valeur
seuil, réparties sur dix banques. Une distribution qui s'arrête pile au seuil de
publication sur douze paires n'est pas un hasard de rédaction : c'est la marque
d'une réécriture menée jusqu'à ce que l'indicateur cesse de remonter, et non
jusqu'à ce que les phrases cessent de se ressembler. Deux exemples, à 0,50 et
donc absents du rapport, qui sont pourtant la même phrase à un mot près :

```
0,50  [annonce_programme_une_etape]  16 « Notre programme du soir, c'est {matiere}. »
                                     20 « Notre travail du soir, c'est {matiere}. »
0,50  [transition_maths_vers_lecture] 01 « C'est fait. Tu as terminé les maths. Maintenant, on passe à la lecture. »
                                      10 « Tu as terminé les maths. On finit avec la lecture. »
```

Ce que je ne dis pas. **Je ne conclus à aucune malhonnêteté.** Le producteur a
signalé de lui-même, en §5.4, qu'il avait neutralisé `{matiere}` dans son indice,
et c'est cette déclaration qui m'a mis sur la piste ; sans elle, je n'aurais pas
rejoué la mesure sous deux règles. Il a par ailleurs réécrit cinq des six paires
que la mesure gonflée avait fait remonter, ce que j'ai vérifié : la banque
`pas_de_devoirs`, qui était mon [MINEUR] 9, ne produit plus aucune paire au-dessus
de 0,50 sous aucune de mes quatre mesures. Le geste était bon.

Ce que je dis. Un « 0 » publié sur un indicateur de qualité, produit par une
règle ajustée après la mesure, et que la mesure d'origine contredit, ne peut pas
franchir une porte. Ma fiche de rôle me demande de recalculer chaque chiffre
annoncé : trois de ceux-là sont faux.

**Correction attendue** :
1. Réécrire les cinq variantes suivantes, qui sont des doublons de sens :
   `enc.encouragement_pendant_lecture.18`, `enc.transition_lecture_vers_maths.10`,
   `enc.transition_maths_vers_lecture.10`, `enc.photo_illisible.07`,
   `enc.annonce_programme_une_etape.20`. Chacune doit changer d'**angle**, pas de
   tournure. Exemples applicables : `encouragement_pendant_lecture.18` →
   « Ta lecture avance. » ; `transition_lecture_vers_maths.10` → « La lecture est
   derrière nous. Les maths arrivent. » ; `photo_illisible.07` → « Je vérifie
   encore une chose. Ton coffre t'attend. » ; `annonce_programme_une_etape.20` →
   « Ce soir, on avance sur {matiere}. » — attention, `19` dit déjà « On avance
   sur {matiere}, doucement. », donc choisir un autre angle.
2. Republier le chiffre avec sa **règle explicite** : liste de mots-outils,
   traitement des jetons, seuil, et comparaison strict/large. Un indicateur dont
   la règle n'est pas publiée avec lui n'est pas vérifiable.
3. Ne pas viser le seuil : viser l'écart. Douze paires à 0,50 exactement est un
   résultat à corriger, pas à publier.

---

## [MINEUR] 16 — Cinq clés du marketing ne sont ni variées ni déclarées fixes

`cles_fixes_non_variees` est le bon dispositif, et il répond exactement à mon
[MAJEUR] 3 du tour 1 : huit groupes, 29 clés, un motif par groupe. Mais il est
incomplet. Cinq clés que la version 1 du livrable déclarait alimentées par une
banque ne figurent **ni** dans une `cles_ui` **ni** dans `cles_fixes_non_variees` :

| Clé | Texte canonique du marketing | Sort au tour 2 |
| --- | --- | --- |
| `maths.concret.corps` | « Regarde les ronds. Tu peux les compter. » | déclarée nulle part |
| `pause.rassurance` | « Tu reviens quand tu veux. » | déclarée nulle part |
| `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | déclarée nulle part |
| `lecture.reprise.corps` | « On reprend la lecture. » | déclarée nulle part |
| `maths.reprise.corps` | « On reprend les maths. » | déclarée nulle part |

Aucun impact devant l'enfant : les cinq ont un texte canonique valable et
fonctionnent parfaitement en clé fixe, et deux d'entre elles gagnent même à
l'être (`pause.rassurance` porte l'autonomie PRD-12, `maths.concret.corps` porte
PED-03 : une formulation constante y est préférable). Le défaut est que le
dispositif se présente comme la liste de ce que la banque ne varie pas, et qu'un
développeur le lira comme exhaustif.

**Correction attendue** : ajouter à `cles_fixes_non_variees` un neuvième groupe
contenant ces cinq clés, avec le motif « Repères constants d'un soir à l'autre :
une formulation stable vaut mieux qu'une variante (PED-03, PRD-12, PRD-18). »

## [MINEUR] 17 — Une tournure au-dessus du registre CE1

```
enc.indice_demande_2.15 : « Tu peux barrer les ronds au fur et à mesure. »
```

« au fur et à mesure » est une locution figée de quatre mots, sans sens
littéral déductible, adressée à un enfant de six ans et demi au moment où il est
bloqué sur un calcul. Les dix-neuf autres variantes du même niveau sont
concrètes et immédiates (« Tu peux compter sur tes doigts. », « Tu peux poser des
jetons sur la table. ») : celle-ci détonne.

**Correction attendue** : « Tu peux barrer les ronds, un par un. »

## [MINEUR] 18 — Un seul éloge formulé par la négation

```
enc.reussite_maths.15 : « Tu n'as pas abandonné. Bravo pour ton courage. »
```

Sur 479 entrées, c'est la seule qui félicite en niant une conduite négative.
Elle introduit l'idée d'abandon au moment exact où l'enfant vient de réussir, et
la charte de ton rappelle qu'« un enfant de 6 ans prend tout au premier degré ».
Les dix-neuf autres variantes de la banque nomment ce qu'il a **fait**
(« Tu as tenu jusqu'au bout. », « Tu as compté jusqu'au bout. »), ce qui est la
bonne formulation de PED-05.

**Correction attendue** : « Tu es allé jusqu'au bout. Bravo pour ton courage. »
ne convient pas (participe accordé au genre) ; écrire « Tu as continué jusqu'au
bout. Bravo pour ton courage. »

## [MINEUR] 19 — `transition.cloture.corps` : le nom est mauvais, et j'en suis l'auteur

Voir mon jugement détaillé plus bas (question 4). Je le porte en constat parce
que l'Orchestrateur a demandé une qualification explicite.

Le préfixe `transition.` désigne partout ailleurs l'écran qui sépare deux étapes
(`transition.felicitation.*`, `transition.annonce.*`, `transition.bouton`). Cette
clé-ci porte la phrase de fin du travail, après la dernière étape, sur un moment
où aucune étape ne suit. Le nom décrit l'inverse de ce qu'il désigne.

**Correction attendue** : renommer en `session.fin_travail.corps`. Deux
occurrences côté `content/` (`situations.cloture.cles_ui` et `statut_cles`),
cinq côté marketing.

---

# JUGEMENTS DEMANDÉS PAR L'ORCHESTRATEUR

## 1. Le jeton `{matiere}` : procédé sain, ou ARB-04 contourné ?

**Le procédé est sain. Ce n'est pas ARB-04 contourné.** Mais son contrôle est
insuffisant, et le défaut trouvé le prouve.

Pourquoi ce n'est pas un contournement. ARB-04 interdit de regrouper sous une
clé unique des **situations de sens différent**. Ici, les deux clés
`enfant.programme.une.corps.lecture` et `.maths` ne sont pas deux situations :
c'est **la même situation** — l'annonce d'une soirée à une seule étape — dont le
seul paramètre variable est la matière. Le test que j'applique est celui-ci :
*les deux clés diraient-elles des choses différentes à l'enfant si la banque
était éclatée en deux ?* Non. Elles diraient les mêmes vingt phrases avec un mot
substitué. C'est exactement le cas où un jeton est le bon outil, et il l'est pour
la même raison que `{prenom}` : il rend le contenu indépendant d'une donnée qui
ne change pas le sens. Éclater en deux banques de 20 produirait 40 variantes dont
la moitié serait le calque de l'autre — c'est-à-dire précisément le défaut de
diversité que PED-11 cherche à empêcher.

Le contraste avec les cas où le producteur a **refusé** le jeton confirme que la
ligne est bien comprise. Il n'a pas écrit une banque unique « Tu as terminé
{matiere}. On passe à {autre_matiere}. » : il a créé
`transition_lecture_vers_maths` et `transition_maths_vers_lecture`, deux banques
pleines. C'est le bon appel, parce que là le sens change — l'ordre de la soirée
est une information, pas un paramètre.

Ce qui ne va pas. Les trois garanties annoncées (jamais en début de phrase,
jamais sujet d'un verbe, deux rendus contrôlés) sont **vérifiées pour les deux
premières et fausses pour la troisième**. Les deux garanties tenues portent sur
la **droite** du jeton ; le seul endroit où un gabarit peut casser est à sa
**gauche**, parce que le jeton emporte son article et que l'article change de
nombre entre les deux valeurs. Une garantie qui regarde du mauvais côté n'est pas
une garantie. D'où le [MAJEUR] 14, et d'où la correction que je demande : la
contrainte manquante doit être **écrite dans le fichier**, pas seulement la
variante corrigée, sinon le trou se rouvrira à la première variante ajoutée.

Sur les deux rendus, pour le reste : longueur 8 à 10 mots en rendu maths comme en
rendu lecture, 0 dépassement, 0 interdit, 0 accord de genre, vocabulaire CE1
tenu. La seule autre tournure que j'ai regardée de près est « Ce soir, c'est les
maths, tranquillement. » (02) et « Notre programme du soir, c'est les maths. »
(16) : « c'est les maths » au lieu de « ce sont les maths » est du français oral
courant, Pilou parle, et un CE1 l'entend ainsi partout. Je ne le retiens pas.

**Verdict : procédé validé, contrôle à compléter, une variante à réécrire.**

## 2. Le Soir léger indiscernable

**Tenu. Je l'ai cherché sur le sens, pas sur les mots, et je n'ai rien trouvé.**

J'ai élargi la liste à **37 motifs** couvrant quatre champs : la réduction
(`moins`, `court`, `réduit`, `raccourci`, `allégé`, `léger`, `seulement`,
`uniquement`, `juste un/une`, `pas beaucoup`, `on en fait moins`), la fatigue de
l'enfant (`fatigué`, `épuisé`, `crevé`, `pas la force`, `pas en forme`,
`repos`, `se reposer`), le dispositif lui-même (`énergie`, `basse énergie`,
`mode`, `exception`, `spécial ce soir`), et la condescendance (`plus facile ce
soir`, `difficile pour toi ce soir`, `ça ira`, `pas trop`).

Résultat sur les 479 entrées : **huit occurrences, aucune dans la banque
`annonce_programme_une_etape`, qui en compte zéro sur les 37 motifs.**

Le jugement de fond, qui compte davantage. J'ai lu les vingt variantes une par
une dans leurs deux rendus. Aucune ne dit « on fait moins », ni par un mot, ni
par une construction, ni par un sous-entendu. Aucune ne parle de l'enfant, de son
état, de sa journée. Ce sont vingt annonces ordinaires d'un programme ordinaire.

La preuve la plus forte est ailleurs, et elle est involontaire : le **registre de
la brièveté est déjà présent dans la banque des soirées à deux étapes**.

```
annonce_programme.07 : « Voilà le programme. Il est court, comme toujours. »
annonce_programme.12 : « C'est tout pour ce soir. Rien de plus. »
annonce_programme.16 : « Voilà ce qui nous attend. Ce n'est pas long. »
annonce_programme.17 : « Le programme tient sur ces images. C'est tout. »
```

Autrement dit, « Et c'est tout » — la tournure la plus proche d'un aveu dans la
banque à une étape (`01`, texte canonique du marketing) — a **quatre jumelles
dans la banque à deux étapes**. Un enfant ne peut donc pas s'en servir comme
indice : la phrase ne discrimine rien. C'est la bonne façon de rendre un état
indiscernable, et je ne suis pas sûr qu'elle ait été construite exprès.

Le seul « fatigué » du fichier est `enc.blocage_lecture.06` : « Ma petite oreille
de loutre est fatiguée. » La fatigue est attribuée à Pilou, jamais à l'enfant,
dans la banque où c'est précisément ce que PED-09 demande.

Reste un point que je signale sans en faire un constat, parce qu'il n'est pas du
ressort de cet agent : la clé fixe `enfant.programme.une.titre` dit « Ce soir, on
fait une seule chose. » L'enfant peut donc **compter** : il voit qu'il y a une
étape au lieu de deux. Ce n'est pas ce qu'ARB-06 protège. Ce qu'ARB-06 protège,
c'est que l'enfant ne puisse pas savoir **pourquoi** : la même banque sert un
parent qui a retiré une matière (C3 à C6) et un Soir léger, et rien ne les
distingue. C'est tenu, et la `note` de la situation l'écrit noir sur blanc.

## 3. Le canal `tts` à 0 entrée

**La réponse du producteur est bonne, et je la valide sans réserve.**

Trois raisons.

D'abord, elle est **vérifiable et vérifiée**. J'ai recompté : 454 `les_deux`,
25 `affiche`, **0 `tts`**, sur 479 entrées. Les 25 `affiche` se décomposent en 20
encouragements de lecture affichés micro ouvert — Pilou se tait pour ne pas
couvrir la voix de l'enfant — et 5 libellés de bouton, jamais lus par
construction. Chaque emploi non-`les_deux` a donc un motif tenant à un mécanisme
réel, pas à une commodité.

Ensuite, elle **corrige une erreur au lieu de la défendre**. Les cinq entrées
`tts` du tour 1 étaient sur la transition ; le producteur écrit que c'était une
erreur de sa part, parce que l'écran de transition porte du texte et qu'un enfant
qui entend mal doit pouvoir le lire. C'est exact : PED-10 exige le doublage à
l'oral, il n'interdit pas l'affichage, et un texte utile à l'action qui n'est pas
affiché est une perte sèche pour l'enfant. Le raisonnement qui mène à « 0 `tts`
en V1 » est le bon raisonnement pédagogique, et l'ancienne valeur était le défaut.

Enfin, elle **inscrit la décision dans le fichier** et pas seulement dans le
rapport : `regles.canal_tts_en_v1` explique à un développeur pourquoi une
énumération à trois valeurs en a une vide. C'est exactement ce qu'il faut pour
qu'un futur lecteur ne « nettoie » pas la valeur en croyant bien faire.

Je conclus que la troisième hypothèse est la bonne, celle que ni vous ni lui
n'aviez formulée : `tts` n'est ni une valeur inutile ni le symptôme d'une
situation manquante, c'est une **valeur d'extension documentée**. La garder coûte
un membre d'union en TypeScript et rend possible, sans migration, la réplique
d'ambiance pendant une animation sans texte. La supprimer coûterait un changement
de schéma le jour où elle servira.

## 4. Le nommage de `transition.cloture.corps` : oui, vous vous trompez

**Je qualifie le point, en [MINEUR] 19, et je vous recommande de revenir sur
votre décision.**

Commençons par l'aveu qui rend mon avis suspect et qu'il faut donc poser :
**c'est moi qui ai proposé ce nom**, au tour 1, dans la correction attendue du
constat 1 (« par exemple `transition.cloture.corps` »). `produit-marketing` l'a
créé, `contenu-enfant` l'a consommé. Les deux producteurs l'ont ensuite signalé,
séparément, sans s'être lus. Trois agents ont touché ce nom ; les deux qui
devaient s'en servir ont buté dessus. Le signal ne vient pas d'eux, il vient de
ma proposition, qui était mauvaise.

Sur le fond, votre motif — « la cohérence avec la famille `transition.*` prime »
— suppose que cette clé appartient à la famille. Elle n'y appartient pas. Les
clés `transition.*` désignent toutes l'écran qui sépare **deux étapes**, celui de
PRD-10 : `transition.felicitation.lecture`, `transition.annonce.maths`,
`transition.bouton`. Leur trait commun n'est pas « on change de chose », c'est
« une étape suit ». Or `transition.cloture.corps` se joue au moment précis où
**aucune étape ne suit** : c'est le seul membre de la famille qui nie le critère
d'appartenance de la famille. Le préfixe ne crée donc pas de la cohérence, il
crée une fausse parenté — ce qui est pire qu'un nom isolé, parce qu'un
développeur qui range les clés par famille câblera celle-ci avec ses voisines,
c'est-à-dire sur l'écran de transition.

Et le risque n'est pas théorique. Cette clé est la dernière chose que Pilou dit
avant `/enfant/bravo`. Une erreur de câblage la ferait jouer entre deux étapes,
où l'enfant s'entendrait annoncer la fin du travail au milieu de sa soirée, et
ferait disparaître la phrase qui prépare le rituel. C'est l'endroit du produit où
une confusion de nommage coûte le plus cher.

Le coût de la correction est de sept occurrences, toutes dans des documents
encore ouverts, avant que la moindre ligne de code n'ait été écrite. Après G1,
ce nom entrera dans `src/lib/`, dans le cache TTS et dans les tests.

**Ma recommandation : `session.fin_travail.corps`.** Elle dit le moment (fin du
travail), elle ne promet pas d'étape suivante, et elle sort d'une famille à
laquelle elle n'appartient pas. C'est le nom que le producteur propose lui-même
en §0 bis.

## 5. Les trois points d'honnêteté du producteur

Vous me demandez de vérifier que ces corrections d'outillage n'ont pas servi à
faire disparaître un vrai défaut. J'ai refait les trois mesures avec ma propre
règle.

**Point 1 — le détecteur d'accord de genre, restreint après deux faux positifs.
Honnête, et le résultat tient.** J'ai passé les **527 rendus réels** — chaque
texte avec `{prenom}` substitué par trois prénoms dont un féminin, et chaque
texte avec `{matiere}` dans ses deux valeurs — au crible de deux motifs : les
adjectifs et participes à genre variable, et les tournures « tu es … é »,
« on est … é ». Dix occurrences remontent, **les dix sont correctes** :

```
'contente'  Je suis contente de te voir.            -> accord sur Pilou, feminin
'prêt'      Ton tipi est prêt.                      -> accord sur tipi, masculin
'fatiguée'  Ma petite oreille de loutre est fatiguée -> accord sur oreille, feminin
'prête'     Je ne suis pas encore prête.            -> accord sur Pilou, feminin
'arrivé'    Aucun devoir n'est arrivé ce soir.      -> accord sur devoir, masculin
'terminées' Les maths sont terminées.               -> accord sur maths, feminin pluriel
'rangées'   Tes pierres sont bien rangées.          -> accord sur pierres, feminin pluriel
```

Aucun accord ne porte sur l'enfant. Les deux faux positifs que le producteur
signale en sont bien : restreindre le détecteur était le bon geste, et **aucun
texte n'a été modifié pour faire passer le contrôle**. Le vrai défaut du tour 1
(`enc.reprise_session.01`, « on s'était arrêtés ») a bien été réécrit :
« Te revoilà, {prenom}. On reprend là où on en était. » C'est propre.

**Point 2 — l'indice de recouvrement, jeton `{matiere}` neutralisé. La
neutralisation est légitime ; le chiffre publié ne l'est pas.** La neutralisation
elle-même est correcte : un jeton porté par les vingt variantes d'une banque est
une constante, pas un mot plein, et le compter gonfle l'indice de cette seule
banque. `{prenom}` était déjà traité ainsi au tour 1. Je l'ai donc appliquée.

Mais j'ai mesuré les deux régimes, et voici ce que la neutralisation déplace :

| Paire | jeton compté | jeton neutralisé |
| --- | --- | --- |
| `annonce_programme_une_etape` 16 / 20 | 0,60 → **remonte** | 0,50 → **disparaît** |
| `reprise_session` 02 / 20 | 0,57 → **remonte** | 0,50 → **disparaît** |

Ces deux paires passent d'« au-dessus du seuil » à « exactement au seuil ».
Substantiellement, ce sont **la même phrase à un mot près** : « Notre programme
du soir » contre « Notre travail du soir ». La neutralisation est juste comme
méthode, et elle a pour effet collatéral de retirer du rapport deux doublons
réels. C'est ce que vous me demandiez de chercher, et c'est ce que j'ai trouvé —
pas une manipulation, un angle mort méthodologique.

Le producteur a bien réécrit ce qu'il annonçait avoir réécrit : `pas_de_devoirs`,
qui portait cinq paires au tour 1, n'en porte plus **aucune** sous aucune de mes
quatre mesures, et ses vingt variantes changent réellement d'angle (cartable
fermé, leçon, coffre, temps libre, repos). Le geste est réel. C'est le chiffre
final qui est faux, et il l'est de trois façons : voir [MAJEUR] 15.

**Point 3 — le détecteur de niveau d'indice, complété. Honnête, et je le vérifie
autrement qu'avec un détecteur.** Plutôt que de recoder sa liste de radicaux,
j'ai lu les **80 variantes** des quatre banques et je les ai confrontées une par
une au texte de PED-02. Résultat :

- `indice_demande_1` (question ouverte sur ce qui est demandé) : 20/20 posent ou
  annoncent une question. Aucune n'annonce une méthode, un exemple ou une
  résolution.
- `indice_demande_2` (méthode concrète) : 20/20 nomment un geste — doigts,
  dessin, jetons, cubes, crayons, barrer, séparer, compter à voix haute. Aucune
  ne donne d'exemple chiffré.
- `indice_demande_3` (exemple analogue, nombres plus simples) : 20/20 annoncent
  un exemple ou des nombres plus petits.
- `indice_demande_4` (résolution guidée sans prononcer le résultat) : 20/20
  annoncent un accompagnement pas à pas, et **six réservent explicitement le
  résultat à l'enfant** — « C'est toi qui dis le résultat. », « Je te montre
  tout, sauf la réponse. », « Le résultat reste à toi. », « Tu gardes la fin. ».

La phrase que son détecteur refusait à tort, `indice_demande_2.11` « Voilà
comment on peut s'y prendre. », est bien du niveau 2 : elle annonce une manière
de faire. Il a eu raison de compléter la liste plutôt que de réécrire le texte.
Mon [MAJEUR] 4 du tour 1 est intégralement réparé, et ARB-04 est respecté au
sens strict : quatre situations, quatre clés, quatre banques pleines.

**Synthèse sur les trois points.** Deux corrections d'outillage sur trois sont
saines et n'ont rien masqué. La troisième (le recouvrement) est saine comme
méthode mais accompagne un chiffre faux. Et je note que **c'est la franchise du
producteur qui m'a permis de trouver le défaut** : sans sa déclaration en §5.4,
je n'aurais pas rejoué la mesure sous deux régimes. Une reprise qui dit où elle a
touché à ses instruments est une reprise contrôlable ; c'est la bonne conduite,
et elle mérite d'être dite même quand elle aboutit à un FAIL.

## Ce qui était acquis n'a pas été cassé

Vérifié mécaniquement, banque par banque.

| Acquis du tour 1 | État au tour 2 |
| --- | --- |
| 20 variantes minimum par situation | **23/23 situations à exactement 20** |
| Les 16 situations de la fiche de mission | **couvertes**, via `correspondance_mission` : 16 entrées, chacune pointant vers une ou plusieurs banques réelles |
| PED-04 — jamais « c'est faux » ni équivalent | **tenue** : 44 motifs, 0 occurrence dans les 499 rendus |
| PED-05 — éloge de l'effort, jamais de l'enfant | **tenue** : `intelligent`, `doué`, `meilleur`, `champion`, `super`, `génial` → 0 |
| PED-01 — jamais le résultat | **tenue** : `la réponse est`, `le résultat est`, `ça donne`, `égale` → 0 |
| PED-07 — aucun chiffre | **tenue** : 0 chiffre sur 479 textes |
| Aucun emoji | **tenu** : 0, sur les fichiers bruts |
| Aucun prénom en dur | **tenu** : 0 `Evan`, 0 `Gwenn` dans un `texte` |
| JSON régulier, 0 clé dupliquée | **tenu** |
| Arbitrage PED-11 / PED-12 | **tenu, et son exécution corrigée** |
| Les 6 tournures hors registre CE1 du tour 1 | **absentes** : `résiste`, `costaud`, `dormir`, `écriture se cache`, `travail dort`, `tipi allumé` → 0 |
| La banque `cloture` n'emprunte plus les mots du rituel | **tenu** : « Tu peux aller jouer » et « C'est fini » → 0 dans `cloture` |

---

# AVIS gardien-charte — tour 2

Grille des 7 points de `.cursor/agents/gardien-charte.md`, repassée sur les
**479 textes** et leurs **499 rendus** (jetons substitués).

Le tour 1 rendait NON CONFORME sur trois passages précis. Je vérifie d'abord que
le motif a disparu, puisque c'est ce qui est demandé.

## Les trois motifs du tour 1

**A — `photo_illisible` : l'enfant devant un échec sans issue. MOTIF DISPARU.**

La banque est réécrite intégralement. Mesuré :

```
variantes nommant la photo, l'image, la feuille, le cahier, l'écriture,
le flou, le sombre ou un échec de lecture ...............  0 / 20   (tour 1 : 10 / 20)
variantes offrant une sortie ............................ 20 / 20   (tour 1 :  3 / 20)
```

Les vingt disent Pilou **en train de chercher**, jamais en train d'échouer, et
les vingt ouvrent sur le coffre ou les pierres. Exemples :
« Je cherche encore tes devoirs. Tu peux aller voir ton coffre. »,
« Je n'ai pas fini de chercher. Le coffre t'attend juste à côté. »,
« Je m'occupe de tout. Va voir ton coffre tranquillement. »
Il n'existe plus un écran où un enfant fatigué reste sans rien à faire.

**B — le blocage en lecture présentant une panne de micro comme la difficulté de
l'enfant. MOTIF DISPARU.**

`blocage_lecture` existe, 20 variantes neuves, et la mesure est nette :

```
variantes attribuant la panne au micro ou à l'écoute de Pilou .... 20 / 20
variantes parlant de la difficulté de l'exercice ..................  0 / 20
variantes offrant une sortie ..................................... 20 / 20
```

« Le micro n'entend pas bien ce soir. », « Je t'entends mal, et ce n'est pas
toi. », « Ta voix ne m'arrive pas bien. On peut continuer sans le micro. » C'est
la formulation même que PED-09 prescrit. La variante 05 va plus loin que la
règle en disant explicitement à l'enfant que ce n'est pas lui — c'est bien vu.

`blocage_maths` conserve la cause exercice, séparément, avec sa propre sortie sur
19 variantes sur 20 (la vingtième, « Je reste avec toi. On choisit ensemble ce
qu'on fait. », en ouvre une autrement).

**C — l'amorce d'indice qui annonçait autre chose que l'aide qui suit. MOTIF
DISPARU.**

Quatre banques, une par niveau PED-02, 20 variantes chacune, chacune sur sa clé
unique. Les 80 textes lus un par un : aucune amorce n'annonce le contenu d'un
autre niveau. L'annonce décrit toujours l'aide qui vient.

## La grille, point par point

| # | Point | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Conforme.** `retour_apres_lecture` et `reussite_maths` nomment l'acte et la stratégie, jamais l'enfant. Une réserve de forme en [MINEUR] 18. |
| 2 | Interdits absolus | **Conforme.** 44 motifs testés sur 499 rendus : 0. Aucune comparaison, aucune ironie. |
| 3 | Charge : une idée par phrase, 12 mots, CE1 | **Conforme sur la mesure** : 865 phrases, maximum 10 mots, 0 dépassement sous mes deux règles de comptage. Une locution hors registre en [MINEUR] 17. |
| 4 | Pression : ni chrono, ni décompte, ni compteur, ni série | **Conforme.** 0 chiffre. `demande_pause` ne mentionne ni durée ni nombre de cycles. |
| 5 | Récompense : aucune promesse réelle, aucune perte de pierres | **Conforme** (ETH-04, ETH-05). Les pierres restent virtuelles et toujours acquises : « Elles sont à toi. Elles ne se perdent pas. » |
| 6 | Maths : rien ne conduit au résultat | **Conforme** (PED-01). `indice_demande_4` réserve explicitement le résultat à l'enfant dans six variantes sur vingt. |
| 7 | Autonomie : la pause accessible, gratuite | **Conforme.** « La pause ne coûte rien. Elle est à toi. », « Tu reviens quand tu veux. Rien ne presse. », « On ne fait rien du tout. C'est permis. », « Tu as bien fait de demander la pause. » |

## Passage à signaler, sans qu'il change l'avis

```
enc.annonce_programme_une_etape.03, rendu maths :
« On s'occupe de les maths, tous les deux. »
```

Je le mentionne ici parce que c'est un texte dit par Pilou à un enfant qui
apprend à lire, et qu'une application d'accompagnement scolaire ne peut pas lui
faire entendre une agglutination fautive. Mais je ne le compte pas contre la
grille : les mots sont du vocabulaire CE1, la phrase porte une idée et huit mots,
et elle ne met aucun enfant fatigué en difficulté. C'est un défaut de langue, pas
un défaut de charte, et il est traité là où il doit l'être, en [MAJEUR] 14.

**Reformulation proposée** : « On prépare {matiere}, tous les deux. »

AVIS: CONFORME

Motif : les trois passages A, B et C qui fondaient l'avis NON CONFORME du tour 1
ont disparu, vérifié par mesure et par lecture intégrale des banques concernées.
Aucun passage des 479 textes ne met aujourd'hui un enfant fatigué en difficulté,
ne lui adresse un reproche, ne lui met de pression, ne lui promet une récompense
réelle, ne lui donne un résultat de maths, ni ne lui ferme la pause. Les deux
réserves de forme ([MINEUR] 17 et 18) et l'agglutination du [MAJEUR] 14 sont à
corriger, mais aucune ne relève de la grille du gardien.

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

23 situations, aucune manquante, aucune en trop, aucune sous 20, `id` identique à
la clé d'indexation 23 fois sur 23, aucune clé JSON dupliquée.

## Les autres grandeurs

| Grandeur | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- |
| Situations | 23 | **23** | — |
| Variantes | 460 | **460** | — |
| Parties | 680 | **680** | — |
| Lignes fixes des rituels | 19 | **19** (10 + 9) | — |
| Entrées totales | 479 | **479** | — |
| Phrases contrôlées | 865 | **865** (sur les rendus réels) | — |
| Dépassements de 12 mots | 0 | **0** (règle stricte **et** règle souple) | — |
| Phrase la plus longue | 10 mots | **10 mots** | — |
| Interdits de vocabulaire | 0 | **0** (44 motifs, 499 rendus) | — |
| Emoji | 0 | **0** | — |
| Chiffres | 0 | **0** | — |
| Prénom en dur | 0 | **0** | — |
| Accords de genre fautifs sur les rendus | 0 | **0** (527 rendus, 3 prénoms) | — |
| Identifiants uniques | 479 | **479 / 479** | — |
| Textes uniques (stricts) | 479 | **479 / 479** | — |
| Textes uniques (normalisés) | — | **479 / 479** | — |
| `texte == jointure des parties` | 460 / 460 | **460 / 460** | — |
| Clés déclarées | 35 | **35** | — |
| Clés absentes du marketing | 0 | **0** | — |
| Clés déclarées par plusieurs banques | — | **0** | — |
| Parties sans clé | 0 | **0** | — |
| Canal `les_deux` | 454 | **454** | — |
| Canal `affiche` | 25 | **25** (20 banque + 5 boutons) | — |
| Canal `tts` | 0 | **0** | — |
| **Paires au-dessus de 0,50 de recouvrement** | **0** | **3** | **+3** |
| **Maximum de recouvrement** | **0,50** | **0,667** | **+0,167** |
| **Banques au seuil de 0,50** | **5** | **10** (12 paires) | **+5** |

**Vingt-et-une grandeurs exactes, trois fausses**, toutes trois sur le même
indicateur. Les trois écarts sont l'objet du [MAJEUR] 15.

## Ma règle de comptage des mots

Inchangée depuis le tour 1, et appliquée cette fois aux **rendus réels** et non
aux gabarits : `{prenom}` substitué, `{matiere}` développé dans ses deux valeurs.

- **Règle souple** (la mienne) : phrases découpées sur `.`, `!`, `?`, `…` ;
  l'élision et le trait d'union restent dans le mot — « je t'aide » = 2 mots.
- **Règle stricte** (celle du producteur) : on coupe aussi sur l'apostrophe et le
  trait d'union — « je t'aide » = 3 mots.

| Règle | Phrase la plus longue | Longueur | Dépassements |
| --- | --- | --- | --- |
| Stricte | `enc.indice_demande_2.15` — « Tu peux barrer les ronds au fur et à mesure » | **10** | **0** |
| Souple | même phrase | **10** | **0** |

Les deux rendus de `{matiere}` sont comptés séparément : le plus long,
`enc.annonce_programme_une_etape.18`, fait 9 mots en rendu maths comme en rendu
lecture. Mesuré aussi sur les entrées entières, la lecture la plus défavorable
donne un maximum de 12 mots stricts, donc encore sous la limite.

---

# SORTIES RÉELLES DES COMMANDES

Exécutées dans `/home/user/Tipi`, sorties collées telles quelles.

## 1. Validité JSON et détection de clés dupliquées

```
$ node -e "... JSON.parse des deux fichiers ..."
content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v2, version=2.0.0, cles racine=11 -> schema,version,personnage,jeton_prenom,jeton_matiere,canaux,regles,correspondance_mission,cles_fixes_non_variees,statut_cles,situations
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v2, version=2.0.0, cles racine=8 -> schema,version,personnage,note_nom_de_fichier,jeton_prenom,canaux,regles,rituels
---exit:0---

$ python3  # json.loads(raw, object_pairs_hook=<detecteur de doublons>)
CLES DUPLIQUEES encouragements.json : aucune
CLES DUPLIQUEES gwenn-scripts.json  : aucune
```

## 2. Comptage indépendant : situations, variantes, parties

```
$ python3
nb situations : 23
accueil                             20 var   40 parties  cle==id:True
annonce_programme                   20 var   20 parties  cle==id:True
annonce_programme_une_etape         20 var   20 parties  cle==id:True
avant_lecture                       20 var   20 parties  cle==id:True
encouragement_pendant_lecture       20 var   20 parties  cle==id:True
retour_apres_lecture                20 var   40 parties  cle==id:True
hesitation                          20 var   20 parties  cle==id:True
blocage_lecture                     20 var   40 parties  cle==id:True
avant_maths                         20 var   20 parties  cle==id:True
indice_demande_1                    20 var   20 parties  cle==id:True
indice_demande_2                    20 var   20 parties  cle==id:True
indice_demande_3                    20 var   20 parties  cle==id:True
indice_demande_4                    20 var   20 parties  cle==id:True
blocage_maths                       20 var   40 parties  cle==id:True
reussite_maths                      20 var   40 parties  cle==id:True
transition_lecture_vers_maths       20 var   40 parties  cle==id:True
transition_maths_vers_lecture       20 var   40 parties  cle==id:True
demande_pause                       20 var   40 parties  cle==id:True
retour_de_pause                     20 var   20 parties  cle==id:True
cloture                             20 var   20 parties  cle==id:True
pas_de_devoirs                      20 var   40 parties  cle==id:True
photo_illisible                     20 var   40 parties  cle==id:True
reprise_session                     20 var   40 parties  cle==id:True
TOTAL variantes : 460  TOTAL parties : 680
```

## 3. Rituels, entrées totales, schéma, invariant `texte == jointure`

```
$ python3
rituel onboarding: ecrans=3 rejoue='jamais'
   -> 10 lignes
rituel rituel_fermeture: ecrans=1 rejoue="chaque soir, à l'identique" invariant=True
    1 bravo.titre               role=titre              canal=les_deux cond=None    'Bravo {prenom}.'
    2 bravo.corps               role=corps              canal=les_deux cond=None    'Tu as fait tes devoirs ce soir.'
    3 bravo.pierres             role=corps              canal=les_deux cond=credit_pierres_ok       'Tu as gagné des pierres.'
    4 bravo.coffre              role=corps              canal=les_deux cond=credit_pierres_ok       'Je les range dans ton coffre.'
    5 bravo.pierres_plus_tard   role=corps              canal=les_deux cond=credit_pierres_differe  'Je range tes pierres un peu plus tard.'
    6 bravo.pierres_plus_tard_2 role=corps              canal=les_deux cond=credit_pierres_differe  'Elles sont à toi. Elles ne se perdent pas.'
    7 bravo.fin                 role=corps              canal=les_deux cond=None    "C'est fini. Tu peux aller jouer."
    8 bravo.bouton_principal    role=bouton_principal   canal=affiche  cond=None    'Aller jouer'
    9 bravo.bouton_secondaire   role=bouton_secondaire  canal=affiche  cond=None    'Voir mon coffre'
   -> 9 lignes
TOTAL lignes fixes : 19
TOTAL ENTREES : 479

ENTREES : 479  PARTIES : 680
PROBLEMES DE SCHEMA / INVARIANT : 0
INVARIANT texte==jointure verifie sur 460 variantes
CANAUX : {'les_deux': 454, 'affiche': 25}
IDS uniques : 479 / 479 aucun doublon
TEXTES uniques (strict) : 479 / 479 aucun doublon
TEXTES uniques (normalises) : 479 aucun doublon
```

Le contrôle de schéma vérifie aussi, et sans aucune anomalie : chaque variante
porte exactement `id`, `texte`, `canal`, `jetons`, `parties` ; chaque partie
exactement `cles_ui`, `texte` ; chaque clé déclarée par une partie figure dans
les `cles_ui` de sa situation ; les jetons déclarés sont exactement les jetons
présents dans le texte.

## 4. Longueur des phrases, sur les rendus réels

```
$ python3
PHRASES comptees SUR LES RENDUS REELS (prenom substitue, 2 rendus pour {matiere}) : 865
Depassements >12 STRICT : 0
Depassements >12 SOUPLE : 0
Max strict : 10  Max souple : 10

--- phrases les plus longues ---
  10/10  enc.indice_demande_2.15            Tu peux barrer les ronds au fur et à mesure
  10/10  enc.blocage_maths.01               On souffle un peu, ou on passe à la suite
  10/ 8  enc.blocage_lecture.16             Je n'entends qu'un petit bout de ta voix
  10/ 8  enc.blocage_lecture.05             Je t'entends mal, et ce n'est pas toi
   9/ 9  enc.indice_demande_3.10            Je te montre la même chose en plus petit
   9/ 9  enc.indice_demande_2.14            On peut compter avec des cubes ou des crayons
   9/ 9  enc.hesitation.19                  On le regarde de plus près, tous les deux
   9/ 9  enc.annonce_programme_une_etape.18 [rendu maths]   Ce soir, on passe du temps sur les maths
   9/ 9  enc.annonce_programme_une_etape.18 [rendu lecture] Ce soir, on passe du temps sur la lecture
```

## 5. Le jeton `{matiere}` : les deux rendus, variante par variante

```
$ python3
id   GABARIT                                     | RENDU LECTURE                              | RENDU MATHS
01   On fait {matiere}. Et c'est tout.           | On fait la lecture. Et c'est tout.         | On fait les maths. Et c'est tout.
02   Ce soir, c'est {matiere}, tranquillement.   | ...c'est la lecture, tranquillement.       | ...c'est les maths, tranquillement.
03   On s'occupe de {matiere}, tous les deux.    | On s'occupe de la lecture, tous les deux.  | On s'occupe de les maths, tous les deux.   <-- AGRAMMATICAL
04   Au programme, il y a {matiere}.             | ...il y a la lecture.                      | ...il y a les maths.
05   On travaille {matiere} ensemble.            | On travaille la lecture ensemble.          | On travaille les maths ensemble.
06   Je te propose {matiere} pour ce soir.       | ...la lecture pour ce soir.                | ...les maths pour ce soir.
07   On prend {matiere}, tranquillement.         | On prend la lecture, tranquillement.       | On prend les maths, tranquillement.
08   Aujourd'hui, on fait {matiere}.             | ...on fait la lecture.                     | ...on fait les maths.
09   On ouvre {matiere}, et on y va.             | On ouvre la lecture, et on y va.           | On ouvre les maths, et on y va.
10   On s'installe pour {matiere}.               | ...pour la lecture.                        | ...pour les maths.
11   Tu fais {matiere} avec moi.                 | Tu fais la lecture avec moi.               | Tu fais les maths avec moi.
12   On commence {matiere} quand tu veux.        | On commence la lecture quand tu veux.      | On commence les maths quand tu veux.
13   Ce soir, on regarde {matiere}.              | ...on regarde la lecture.                  | ...on regarde les maths.
14   On y va doucement pour {matiere}.           | ...pour la lecture.                        | ...pour les maths.
15   Je t'accompagne sur {matiere}.              | ...sur la lecture.                         | ...sur les maths.
16   Notre programme du soir, c'est {matiere}.   | ...c'est la lecture.                       | ...c'est les maths.
17   On fait {matiere}, comme il faut.           | On fait la lecture, comme il faut.         | On fait les maths, comme il faut.
18   Ce soir, on passe du temps sur {matiere}.   | ...sur la lecture.                         | ...sur les maths.
19   On avance sur {matiere}, doucement.         | ...sur la lecture, doucement.              | ...sur les maths, doucement.
20   Notre travail du soir, c'est {matiere}.     | ...c'est la lecture.                       | ...c'est les maths.

=== jeton absent de certaines variantes ? ===   (aucune)
=== jeton en debut de phrase ? ===              (aucune)
=== jeton sujet d'un verbe ? ===                (aucune)
```

```
$ python3  # scan des contractions fautives sur les 527 rendus
=== AGGLUTINATIONS / CONTRACTIONS FAUTIVES (de+le, de+les, a+le, a+les) ===
occurrences : 1
   enc.annonce_programme_une_etape.03  [enfant.programme.une.corps.maths]
   -> "On s'occupe de les maths, tous les deux."   (attendu : des)
```

## 6. Accords de genre sur les rendus (3 prénoms dont un féminin)

```
$ python3
RENDUS REELS controles : 527
tournures "tu es .. e" / "on est .. e" : 0
adjectifs/participes a genre variable : 10 -- tous corrects :
   enc.accueil.01           'contente'   accord sur Pilou (feminin)
   enc.accueil.03           'prêt'       accord sur tipi (masculin)
   enc.accueil.11           'contente'   accord sur Pilou
   enc.blocage_lecture.06   'fatiguée'   accord sur oreille (feminin)
   enc.pas_de_devoirs.06    'arrivé'     accord sur devoir (masculin)
   enc.photo_illisible.18   'prête'      accord sur Pilou
participes masculin pluriel type "arretes" : aucun sur l'enfant
   enc.transition_maths_vers_lecture.04  'Voilà les maths terminées.'   accord sur maths
   enc.transition_maths_vers_lecture.13  'Les maths sont terminées.'    accord sur maths
   enc.reprise_session.06                'Tes pierres sont bien rangées.' accord sur pierres

$ python3  # tour 1, constat 11
enc.reprise_session.01 : "Te revoilà, {prenom}. On reprend là où on en était."
```

## 7. Vocabulaire interdit, emoji, chiffres, prénom en dur

```
$ python3   # 44 motifs, en frontiere de mot, sur les 499 rendus
=== VOCABULAIRE INTERDIT ===
motifs declenches : 2
  [\bpas bien\b] 6 -- toutes dans blocage_lecture, sujet = le micro ou Pilou :
      "Le micro n'entend pas bien ce soir."
      "Je n'ai pas bien entendu."
      "Le son ne me parvient pas bien."
      "Je n'attrape pas bien ta voix."
      "Ta voix ne m'arrive pas bien."
      "Mon écoute ne marche pas bien ce soir."
  [\btu n'as pas\b] 1
      enc.reussite_maths.15  "Tu n'as pas abandonné. Bravo pour ton courage."

=== EMOJI ===     occurrences : 0
=== CHIFFRES ===  occurrences : 0
=== PRENOM EN DUR (Evan / Gwenn dans un texte) === occurrences : 0
```

Les six « pas bien » ne sont pas des constats : le sujet est toujours le micro ou
Pilou, jamais la performance de l'enfant, et c'est la formulation que PED-09
prescrit. La septième occurrence fait l'objet du [MINEUR] 18.

```
$ perl -ne 'print if /[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE00}-\x{FE0F}\x{1F300}-\x{1F9FF}]/' content/*.json
(aucune ligne)

$ python3  # inventaire des caracteres non-ASCII des deux fichiers
« » À Ç É à â ç è é ê î ô ù û   -> 15 caracteres, categories {Ll, Lu, Pi, Pf}
```

## 8. `photo_illisible` et `blocage_lecture` : les motifs du gardien

```
$ python3
photo_illisible    variantes offrant une sortie : 20/20
blocage_lecture    variantes offrant une sortie : 20/20
blocage_maths      variantes offrant une sortie : 19/20
photo_illisible : variantes nommant le support ou l'echec OCR : 0/20
blocage_lecture : variantes mettant la panne sur le micro/l'ecoute : 20/20
```

## 9. Clés déclarées contre clés du marketing

```
$ python3
cles definies dans les tables du marketing : 339
cles distinctes declarees au niveau situation : 35
cles distinctes declarees au niveau partie   : 35
identiques : True

>>> CLES DECLAREES ABSENTES DU MARKETING : 0
>>> CLES DECLAREES PAR PLUSIEURS SITUATIONS : aucune
>>> bravo.titre encore declare par une banque ? False
>>> intersection banques / cles_fixes_non_variees : aucune (coherent)
>>> transition.cloture.corps defini dans le marketing ? True
    | `transition.cloture.corps` | « Tu as bien travaillé. Viens avec moi. » | les_deux |

>>> les 5 cles eclatees du tour 1 :
   enfant.programme.corps   declaree ? False  -> declaree FIXE (porte l'ordre)
   lecture.intro.titre      declaree ? False  -> declaree FIXE (porte la position)
   maths.intro.titre        declaree ? False  -> declaree FIXE (porte la position)
   transition.annonce       declaree ? False  -> eclatees declarees : ['transition.annonce.lecture', 'transition.annonce.maths']
   transition.felicitation  declaree ? False  -> eclatees declarees : ['transition.felicitation.lecture', 'transition.felicitation.maths']
```

```
$ python3  # cles du tour 1 ni variees ni declarees fixes  -> [MINEUR] 16
   enfant.attente.pilou    banque:False  cles_fixes:False
   lecture.reprise.corps   banque:False  cles_fixes:False
   maths.concret.corps     banque:False  cles_fixes:False
   maths.reprise.corps     banque:False  cles_fixes:False
   pause.rassurance        banque:False  cles_fixes:False
Groupes de cles_fixes_non_variees : 8   cles listees : 29
```

## 10. Recouvrement — liste de mots-outils **exacte du tour 1**

```
$ python3
===== jetons NEUTRALISES (regle du producteur au tour 2) =====
paires STRICTEMENT au-dessus de 0,50 : 3
   0.667  [encouragement_pendant_lecture]
        02 «Continue, tu lis bien.»
        18 «C'est bien, continue.»
   0.571  [transition_lecture_vers_maths]
        05 «Tu as terminé ta lecture. On va faire les maths.»
        10 «Tu as terminé la lecture. On finit avec les maths.»
   0.571  [photo_illisible]
        04 «Je prends un peu plus de temps. Ton coffre est ouvert.»
        07 «Je mets un peu de temps ce soir. Le coffre est ouvert pour toi.»

paires EXACTEMENT a 0,50 : 12  (10 banques)
     [annonce_programme]             05 «Voilà les images de ce soir. On les suit.»  ||  11 «Voilà notre chemin de ce soir. On le suit.»
     [annonce_programme_une_etape]   16 «Notre programme du soir, c'est {matiere}.»  ||  20 «Notre travail du soir, c'est {matiere}.»
     [encouragement_pendant_lecture] 01 «Je t'écoute.»  ||  19 «Je t'écoute jusqu'au bout.»
     [indice_demande_1]              01 «Je te pose une question, pour t'aider.»  ||  12 «Ma question va t'aider à démarrer.»
     [indice_demande_1]              03 «Dis-moi ce qu'on cherche, dans cet exercice.»  ||  19 «On cherche ensemble ce que veut cet exercice.»
     [indice_demande_3]              01 «Je te montre un exemple plus facile.»  ||  09 «On s'entraîne sur un exemple facile.»
     [indice_demande_3]              15 «Avec de petits nombres, c'est plus clair.»  ||  20 «On essaie avec des nombres plus petits.»
     [reussite_maths]                03 «Tu as tenu jusqu'au bout. Bravo pour tes efforts.»  ||  13 «Tu as compté jusqu'au bout. Bravo pour ce travail.»
     [transition_lecture_vers_maths] 01 «C'est fait. Tu as terminé la lecture. Maintenant, on passe aux maths.»  ||  10 «Tu as terminé la lecture. On finit avec les maths.»
     [transition_maths_vers_lecture] 01 «C'est fait. Tu as terminé les maths. Maintenant, on passe à la lecture.»  ||  10 «Tu as terminé les maths. On finit avec la lecture.»
     [cloture]                       04 «On arrête là. Le soir est à toi.»  ||  18 «On s'arrête là. On se retrouve un autre soir.»
     [reprise_session]               02 «Bonsoir {prenom}. On continue notre travail.»  ||  20 «Bonsoir {prenom}. On continue notre chemin, tranquillement.»

===== jetons COMPTES (regle du controleur au tour 1) =====
paires STRICTEMENT au-dessus de 0,50 : 5   (les 3 ci-dessus, plus :)
   0.6    [annonce_programme_une_etape] 16 / 20
   0.571  [reprise_session] 02 / 20
```

Robustesse des trois paires, sous quatre mesures indépendantes :

```
paire                                  J sans stop  J mini-stop  J full-stop  difflib
encouragement_pendant_lecture.02/18           0.33         0.33         0.67     0.41
transition_lecture_vers_maths.05/10           0.54         0.55         0.57     0.83
photo_illisible.04/07                         0.47         0.43         0.57     0.73
annonce_programme_une_etape.16/20             0.71         0.67         0.50     0.79
reprise_session.02/20                         0.57         0.57         0.50     0.78
```

`transition_lecture_vers_maths` 05/10 dépasse 0,50 sous les quatre mesures et
atteint 0,83 en similarité de séquence : ce n'est pas un artefact de liste de
mots-outils, c'est la même phrase.

## 11. Soir léger — 37 motifs de réduction et de fatigue

```
$ python3
=== 37 motifs, sur les 479 entrees ===
  [\bmoins\b]  1   enc.indice_demande_3.06  "On fait pareil, mais avec moins d'objets."   (niveau 3, nombres plus petits)
  [\bcourt]    3   enc.annonce_programme.07 "Voilà le programme. Il est court, comme toujours."
                   enc.avant_lecture.17     "Le texte est court. On y va ensemble."
                   enc.indice_demande_3.16  "Voilà la même idée, en plus court."
  [\bfatigu]   1   enc.blocage_lecture.06   "Ma petite oreille de loutre est fatiguée."   (Pilou, pas l'enfant)
  [\bjuste (une|un|la|le|les)\b] 3  hesitation.07, demande_pause.07, demande_pause.14
  TOTAL : 8 occurrences

  dans annonce_programme_une_etape : 0 occurrence sur les 37 motifs
```

## 12. Ce qui était acquis

```
$ python3
=== les 6 tournures CE1 du tour 1 ont-elles disparu ? ===
   [résiste] 0   [costaud] 0   [dormir] 0
   [écriture se cache] 0   [travail dort] 0   [tipi est allumé] 0

=== la banque cloture emprunte-t-elle les mots du rituel ? ===
   ["tu peux aller jouer"] dans cloture -> 0
   ["c'est fini"] dans cloture -> 0

=== PED-05 : qualification de l'enfant ? ===
   intelligent / doué / meilleur / champion / super / génial -> 0

=== PED-01 : une entree annonce-t-elle un resultat ? ===
   "la réponse est" / "le résultat est" / "ça donne" / "égale" -> 0
   ("ça fait" remonte une fois : enc.demande_pause.15 "Étire tes bras. Ça fait du bien.")
```

---

# HISTORIQUE — TOUR 1

Verdict du tour 1 : **FAIL**, 0 [BLOQUANT], 8 [MAJEUR], 5 [MINEUR],
`AVIS gardien-charte : NON CONFORME`. Les 23 grandeurs annoncées avaient alors
été vérifiées à l'unité près, sans aucun écart.

| # | Gravité | Constat | Sort au tour 2 |
| --- | --- | --- | --- |
| 1 | [MAJEUR] | `situations.cloture.cles_ui` contenait `bravo.titre`, la ligne invariante du rituel : PED-12 cassée dans le fichier | **CORRIGÉ.** `cloture.cles_ui` = `['transition.cloture.corps']`. Aucune banque ne déclare une clé de `/enfant/bravo`. Vérifié. |
| 2 | [MAJEUR] | 5 clés déclarées n'existaient plus après la correction du marketing | **CORRIGÉ.** `transition.annonce` et `transition.felicitation` remplacées par leurs 4 clés éclatées ; `enfant.programme.corps`, `lecture.intro.titre`, `maths.intro.titre` déclarées fixes avec motif. 0 clé absente du marketing. Vérifié. |
| 3 | [MAJEUR] | Aucune variante ne disait quelle clé elle remplit, alors que 14 situations sur 16 en déclaraient 2 à 4 | **CORRIGÉ.** Champ `parties` : 680 parties, chacune portant son texte et ses clés ; invariant `texte == jointure` vrai 460 fois sur 460 ; `cles_fixes_non_variees` motive ce qui n'est pas varié. Vérifié. Reste une incomplétude de 5 clés : [MINEUR] 16. |
| 4 | [MAJEUR] | `indice_demande` : un tirage aléatoire de 20 amorces pour les 4 niveaux PED-02 | **CORRIGÉ.** 4 banques de 20, une par niveau, chacune sur sa clé unique. Les 80 textes relus : aucun hors registre de son niveau. Vérifié. |
| 5 | [MAJEUR] | `photo_illisible` : 10 variantes sur 20 nommaient la photo comme illisible ; 17 sur 20 sans issue | **CORRIGÉ.** Banque réécrite : 0/20 nomment le support, 20/20 ouvrent sur le coffre. Vérifié. |
| 6 | [MAJEUR] | `blocage` déclarait `lecture.blocage.corps` sans aucune variante sur le micro | **CORRIGÉ.** `blocage_lecture` créée : 20/20 attribuent la panne au micro ou à Pilou, 0 à l'exercice. `blocage_maths` conservée séparément. Vérifié. |
| 7 | [MAJEUR] | Boutons du rituel inversés contre DES-06, identifiants inexistants | **CORRIGÉ.** `bravo.bouton_principal` = « Aller jouer », ordre 8 ; `bravo.bouton_secondaire` = « Voir mon coffre », ordre 9 ; `role` porte la hiérarchie. Conforme à ARB-03. Vérifié. |
| 8 | [MAJEUR] | Deux vocabulaires de canal (`tts`/`les_deux` contre `dit`/`dit_affiche`) non tranchés | **CORRIGÉ.** ARB-02 tranche pour `tts`/`affiche`/`les_deux` ; la décision et la table de correspondance sont inscrites dans `regles.canal_decision` ; le marketing s'est aligné. Vérifié. |
| 9 | [MINEUR] | `pas_de_devoirs` : 5 paires au-dessus de 0,50 | **CORRIGÉ.** 6 variantes réécrites en changeant d'angle. 0 paire au-dessus de 0,50 sous mes quatre mesures. Vérifié. |
| 10 | [MINEUR] | La banque `cloture` empruntait « Tu peux aller jouer » et « C'est fini » au rituel | **CORRIGÉ.** 0 occurrence des deux formules dans `cloture`. Vérifié. |
| 11 | [MINEUR] | `enc.reprise_session.01` portait un participe accordé au masculin pluriel | **CORRIGÉ.** « On reprend là où on en était. » 0 accord de genre sur 527 rendus. Vérifié. |
| 12 | [MINEUR] | La phrase du rapport sur la répartition des canaux était fausse | **CORRIGÉ.** `affiche` 25 = 20 de la banque + 5 boutons, adossé au comptage par situation. Vérifié. |
| 13 | [MINEUR] | 6 tournures au-dessus du registre CE1 | **CORRIGÉ.** Les 6 expressions ont disparu. Une tournure neuve entre en [MINEUR] 17. |

Les trois motifs qui rendaient l'`AVIS gardien-charte` NON CONFORME au tour 1
(A `photo_illisible`, B blocage en lecture, C amorces d'indices) ont **tous les
trois disparu**, vérifiés par mesure et par lecture intégrale. L'avis repasse
CONFORME au tour 2.

---

# SYNTHÈSE DU TOUR 2

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | JSON valide, 23/23 situations à 20 variantes, 16 situations de mission couvertes, aucun interdit, aucun emoji, aucun chiffre, aucun prénom en dur, PED-01/04/05/07 tenues. |
| **[MAJEUR]** | **2** | 14 (rendu agrammatical du jeton `{matiere}`), 15 (trois chiffres faux sur le recouvrement, 3 paires réelles au-dessus de 0,50) |
| **[MINEUR]** | **4** | 16 (5 clés ni variées ni déclarées fixes), 17 (« au fur et à mesure »), 18 (éloge par la négation), 19 (nommage `transition.cloture.corps`) |

**VERDICT: FAIL**, mécaniquement : un seul [MAJEUR] impose FAIL, il y en a deux.

## Ce que coûte la reprise du tour 3

Les deux [MAJEUR] se corrigent en **six réécritures de variantes et deux lignes
de règle**. Ce n'est pas une refonte, et je le dis pour que le volume du verdict
ne fasse pas croire l'inverse.

| Constat | Action | Ampleur |
| --- | --- | --- |
| 14 | Réécrire `enc.annonce_programme_une_etape.03` et ajouter la contrainte de préposition à `regles.jeton_matiere_regle` | 1 variante + 1 ligne |
| 15 | Réécrire 5 variantes doublons ; republier le chiffre avec sa règle de mesure | 5 variantes + 1 paragraphe |
| 16 | Ajouter un 9ᵉ groupe à `cles_fixes_non_variees` | 1 bloc JSON |
| 17 | `enc.indice_demande_2.15` → « Tu peux barrer les ronds, un par un. » | 1 variante |
| 18 | `enc.reussite_maths.15` → « Tu as continué jusqu'au bout. Bravo pour ton courage. » | 1 variante |
| 19 | Renommer `transition.cloture.corps` → `session.fin_travail.corps` | 2 occurrences ici, 5 côté marketing — décision de l'Orchestrateur |

## Ce qui est acquis et ne sera pas recontrôlé au tour 3

- Les **vingt-et-une grandeurs exactes** : 23 situations, 460 variantes, 680
  parties, 479 entrées, 865 phrases, 19 lignes de rituel, 35 clés, 0 dépassement
  de 12 mots, 0 interdit, 0 emoji, 0 chiffre, 0 prénom en dur, 0 accord de genre,
  479 identifiants et 479 textes uniques, invariant `texte == jointure` 460/460,
  canaux 454/25/0.
- La **structure `parties`**, qui règle proprement le raccordement et se type
  sans transformation.
- Les **treize constats du tour 1**, tous corrigés au fond.
- **PED-01, PED-04, PED-05, PED-07, PED-11, PED-12** et l'arbitrage
  PED-11 / PED-12.
- L'`AVIS gardien-charte`, repassé **CONFORME**.
- Les réponses sur le **canal `tts`** (validée sans réserve) et sur le **jeton
  `{matiere}`** comme procédé (validé ; c'est son contrôle qui est en défaut).
- Le **Soir léger indiscernable**, vérifié sur 37 motifs et sur le sens.
- Le nom de fichier `gwenn-scripts.json` : hors périmètre, ESC-001.
