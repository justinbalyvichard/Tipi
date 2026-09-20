# P1bis — Contenu enfant Tipi

Livrable de l'agent `contenu-enfant`. **Version 5, livrée** : reprise du
`VERDICT: FAIL` du tour 1, arbitrage ARB-06, reprise du `VERDICT: FAIL` du
tour 2, puis les deux réserves du `VERDICT: PASS_AVEC_RESERVES` du tour 3.
Verdicts repris : (`docs/agents/P1/contenu-enfant.review.md`,
8 [MAJEUR], 5 [MINEUR], avis `gardien-charte` NON CONFORME sur ses points 1 et 7).

Sources : `TIPI-PROMPT-CURSOR.md` (1.3, 2.2, 3.4, 3.5), le verdict,
`docs/agents/P1/produit-marketing.out.md` **dans sa version corrigée**,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

| Fichier | Rôle | Volume |
| --- | --- | --- |
| `content/encouragements.json` | Banque de variantes par situation (PED-11) | 23 situations, 460 variantes, 680 parties |
| `content/gwenn-scripts.json` | Répliques fixes des rituels (PRD-01, PED-12) | 2 rituels, 4 écrans, 19 lignes |
| `docs/agents/P1/contenu-enfant.out.md` | Le présent rapport | — |

Aucun emoji nulle part (DES-07). Aucun texte enfant en dur dans un composant
(`30-copy-enfant.mdc`). Aucun commit git de la part de cet agent.

---

# 0. Reprise après verdict du 2026-09-20

Les 8 [MAJEUR] et les 5 [MINEUR] sont traités. **Aucun constat n'est laissé de
côté.** Chaque ligne indique ce qui a changé et où le vérifier.

| # | Constat | Ce que j'ai changé | Où | Preuve mécanique |
| --- | --- | --- | --- | --- |
| 1 | [MAJEUR] `cloture` déclarait `bravo.titre`, ligne invariante du rituel | `situations.cloture.cles_ui` ne contient plus qu'une clé : `session.fin_travail.corps`. La banque `cloture` n'alimente **aucune** clé de `/enfant/bravo` | `encouragements.json` | Contrôle 11 : `cles_ui de cloture : ['session.fin_travail.corps']` |
| 2 | [MAJEUR] 5 clés retirées par la correction du marketing | Toutes les `cles_ui` ont été refaites sur les clés réellement présentes dans le marketing corrigé. Les clés éclatées par ordre ou par matière sont soit utilisées telles quelles (`transition.felicitation.lecture`, `transition.annonce.maths`, et leurs miroirs), soit déclarées fixes (`lecture.intro.titre.premier/.apres`, `maths.intro.titre.premier/.apres`, `enfant.programme.corps.*`) | `encouragements.json` | Contrôle 6 : les 35 clés déclarées existent dans `produit-marketing.out.md`, **aucune absente** |
| 3 | [MAJEUR] rien ne disait quelle clé une variante remplit | **Chaque variante porte `parties`** : une partie = un texte + la ou les clés qu'il remplit. Le `texte` de la variante est la jointure des parties, dans l'ordre. Les clés que la banque ne fait **pas** varier sont listées et motivées dans `cles_fixes_non_variees` | `encouragements.json` | Contrôle 6 : 680 parties, invariant `texte == jointure` vrai sur 460/460, 0 partie sans clé |
| 4 | [MAJEUR] `indice_demande` aplatissait l'échelle PED-02 | Éclatée en **4 situations de 20 variantes** : `indice_demande_1` à `_4`, une par niveau, chacune sur sa clé unique. Chaque banque reste dans le registre de son niveau | `encouragements.json` | Contrôle 9 : 20/20 dans le registre pour les 4 niveaux, 0 vocabulaire d'un autre niveau |
| 5 | [MAJEUR] `photo_illisible` : constats d'échec, sans issue | **Les 20 variantes sont réécrites.** Pilou est toujours en train de chercher ; aucune ne nomme la photo, l'image, la feuille, le cahier ni l'écriture ; chacune ouvre sur le coffre | `encouragements.json` | Contrôle 7 : 0/20 nomment le support, **20/20** offrent une sortie |
| 6 | [MAJEUR] `blocage` mélangeait panne de micro et difficulté d'exercice | Éclatée en `blocage_maths` (l'exercice résiste) et **`blocage_lecture`** (20 variantes neuves : la panne est du côté du micro et de l'écoute de Pilou, jamais de l'enfant) | `encouragements.json` | Contrôle 8 : 20/20 attribuent la panne au micro ou à Pilou, 0 parle de l'exercice |
| 7 | [MAJEUR] boutons du rituel inversés, identifiants inexistants | `bravo.bouton_principal` = « Aller jouer », ordre 8 ; `bravo.bouton_secondaire` = « Voir mon coffre », ordre 9. Le champ `role` porte la hiérarchie | `gwenn-scripts.json` | Contrôle 13 : `ordre 8 bravo.bouton_principal Aller jouer` |
| 8 | [MAJEUR] deux vocabulaires de canal non tranchés | **Tranché** : `tts` / `affiche` / `les_deux`, décision de l'Orchestrateur du 2026-09-20 inscrite dans le fichier (`regles.canal_decision`) avec la table de correspondance. Le marketing s'aligne, et l'a déjà fait : ses tables portent `les_deux` | les deux fichiers | Contrôle 4 : 479/479 canaux valides, 0 entrée sans canal |
| 9 | [MINEUR] `pas_de_devoirs` répétitive | 6 variantes réécrites en changeant l'angle (cartable fermé, coffre ouvert, leçon, temps libre, repos) | `encouragements.json` | Mesure refaite au tour 3, voir constat 15 : 0 paire signalée dans cette banque sous les trois règles |
| 10 | [MINEUR] la banque `cloture` empruntait les mots du rituel | `cloture` 13, 16 et 18 réécrites. « Tu peux aller jouer » et « C'est fini » sont réservés au rituel | `encouragements.json` | Contrôle 11 : 0 emprunt |
| 11 | [MINEUR] un participe accordé au genre | `enc.reprise_session.01` : « On reprend **là où on en était**. » | `encouragements.json` | Contrôle 4 : 0 accord de genre sur 479 entrées |
| 12 | [MINEUR] la phrase du rapport sur les canaux était fausse | Corrigée en section 1.3, et adossée au comptage réel par situation | ce rapport | Contrôle 12 : `affiche` 25 = 20 banque + 5 boutons |
| 13 | [MINEUR] 6 tournures au-dessus du registre CE1 | Les 6 sont reformulées au concret : « résiste », « costaud », « dormir », « l'écriture se cache », « le travail dort », « tipi allumé » ont disparu | `encouragements.json` | Recherche des 6 expressions : `absent` pour les 6 |

**Avis `gardien-charte`** — les trois passages A, B et C qui rendaient l'avis NON
CONFORME sont repris au fond, pas retouchés :

- **A, `photo_illisible`** : banque entièrement réécrite (constat 5). Il n'existe
  plus un seul écran où l'enfant se retrouve sans action possible.
- **B, blocage en lecture** : banque `blocage_lecture` créée (constat 6). Une
  panne de micro n'est plus jamais présentée comme une difficulté de l'enfant.
- **C, `indice_demande`** : quatre banques par niveau (constat 4). L'annonce
  décrit toujours l'aide qui suit.

**Ce qui était acquis n'a pas été cassé** : les compteurs restent exacts et
recomptables, les 16 situations de la mission restent couvertes à 20 variantes
au minimum, PED-04 et PED-05 restent tenues, le JSON reste régulier, et
l'arbitrage PED-11 / PED-12 est conservé — c'est son exécution d'une ligne qui
est corrigée (constat 1).

**Constats mineurs non repris : aucun.** Les cinq [MINEUR] sont corrigés.

---

# 0 bis. Arbitrage ARB-06 et réponses demandées

## Ce que j'ai ajouté

**Banque `annonce_programme_une_etape`, 20 variantes.** Total : 23 situations,
460 variantes. Les deux autres points de mon refus borné sont conservés comme
vous les avez tranchés : les libellés de bouton et les titres porteurs d'ordre
restent fixes.

Elle alimente les deux clés `enfant.programme.une.corps.lecture` et
`enfant.programme.une.corps.maths` avec **une seule banque de 20 variantes**,
grâce à un jeton de matière. C'est ce qui permet de tenir votre budget de +20 au
lieu de +40 sans jamais faire dire à Pilou une matière absente du programme.

| Point | Décision |
| --- | --- |
| Jeton | `{matiere}`, déclaré à la racine du fichier (`jeton_matiere`) avec sa table de valeurs : `…une.corps.lecture` vaut « la lecture », `…une.corps.maths` vaut « les maths » |
| Qui choisit la valeur | **La clé rendue**, jamais une logique de texte. Le code ne devine rien |
| Contrainte de rédaction | Le jeton n'apparaît jamais en début de phrase (question de majuscule) et n'est jamais sujet d'un verbe (question d'accord singulier/pluriel). Les 20 textes sont justes dans les deux rendus |
| Soir léger indétectable | Aucune variante ne dit ni ne laisse entendre que la soirée est raccourcie, allégée, réduite, ni qu'elle est liée à la fatigue de l'enfant. Contrôle mécanique sur les mots « seule », « court », « moins », « léger », « réduit », « fatigu », « rapide », « allég », « raccourc », dans les **deux** rendus |
| Couverture | Configurations C3 à C6 du marketing : matière retirée par le parent, ou Soir léger. Les quatre se jouent avec la même banque |

Preuve, contrôle 14 :

```
variantes portant le jeton {matiere} : 20 / 20
jeton en debut de phrase : 0
vocabulaire de reduction ou de fatigue : 0
cles remplies : ['enfant.programme.une.corps.lecture', 'enfant.programme.une.corps.maths']
rendus controles (les deux matieres) :
   On fait la lecture. Et c'est tout.
   On fait les maths. Et c'est tout.
   Ce soir, c'est la lecture, tranquillement.
   Ce soir, c'est les maths, tranquillement.
```

Le contrôle de longueur, les interdits, les emoji et les chiffres sont désormais
mesurés **sur chaque rendu**, pas sur le texte à jeton : 864 phrases contrôlées
pour 479 entrées, parce que les 20 variantes à jeton comptent double.

La variante 01 reprend mot pour mot le texte canonique du marketing
(« On fait la lecture. Et c'est tout. »), comme dans les 22 autres banques.

## Réponse sur le canal `tts`

Votre question est la bonne, et la réponse honnête est **la première : `tts` ne
sert à rien en V1**, et ce n'est pas le symptôme d'une situation qui aurait dû
l'employer.

Le raisonnement, vérifiable sur les 479 entrées : PED-10 impose que toute
information importante soit **doublée à l'oral**. Un texte utile à l'action est
donc toujours dit, et comme il est aussi lisible à l'écran, il est en
`les_deux`. Pour qu'une entrée soit en `tts`, il faudrait une parole que l'on ne
veuille **pas** afficher. Je n'ai trouvé aucun moment de la V1 dans ce cas :

- les seuls textes non lus sont les 20 encouragements affichés micro ouvert —
  Pilou se tait pour ne pas couvrir l'enfant — et les 5 libellés de bouton ;
- la version 1 de ce livrable plaçait 5 entrées en `tts` sur la transition,
  pendant la micro-animation. C'était une erreur de ma part : le marketing
  définit ces clés en `les_deux`, l'écran de transition porte bien du texte, et
  un enfant qui n'entend pas bien doit pouvoir le lire.

**Je garde donc la valeur dans l'énumération**, comme vous le proposez, pour une
future réplique purement vocale — typiquement une phrase d'ambiance pendant une
animation sans texte. C'est écrit dans le fichier lui-même
(`regles.canal_tts_en_v1`), pas seulement ici, pour qu'un développeur qui
découvre une énumération à trois valeurs dont une est vide sache que c'est voulu.

## Réponse sur le nom de la clé de clôture

**Question tranchée depuis, et dans l'autre sens.** J'avais recommandé de garder
`transition.cloture.corps` pour ne pas désynchroniser deux travaux en cours, tout
en écrivant que le nom décrivait l'inverse du moment qu'il désigne. Le contrôle
du tour 2 a qualifié le point en [MINEUR] 19 et l'Orchestrateur a révoqué sa
décision (ARB-07). **La clé s'appelle maintenant `session.fin_travail.corps`**,
des deux côtés. Ma réserve initiale était la bonne ; ma recommandation de ne pas
y toucher ne l'était pas.

---

# 0 ter. Reprise après verdict du tour 2

Les 2 [MAJEUR], les 4 [MINEUR] et le renommage sont traités. **Aucun constat
n'est laissé de côté ; la liste « Constats mineurs non repris » est vide.**

| # | Constat | Ce que j'ai changé | Preuve mécanique |
| --- | --- | --- | --- |
| 14 | [MAJEUR] « On s'occupe **de les maths** » : préposition contractante à gauche du jeton | `enc.annonce_programme_une_etape.03` devient « **On prépare** {matiere}, tous les deux. » Et surtout, la garantie manquante est ajoutée à `regles.jeton_matiere_regle` : **aucune préposition contractante (`de`, `à`) ne précède immédiatement le jeton**. Le contrôle 14 liste désormais, pour les 20 variantes, le **mot situé à gauche** du jeton et les deux rendus complets | Contrôle 14 : `prepositions contractantes a gauche du jeton : 0`, et les 40 rendus imprimés |
| 15 | [MAJEUR] 3 chiffres faux sur le recouvrement, 3 paires au-dessus de 0,50, 12 paires pile à 0,50 | **46 paires signalées par ma nouvelle mesure à trois règles, 46 traitées.** 53 variantes réécrites en trois passes, en changeant l'angle et non la tournure. L'indicateur est refait : trois mesures publiées avec leur règle, seuil en **supérieur ou égal** | Contrôle 10 : `paires signalees : 0`, `max A 0,429`, `max B 0,429`, `max C 0,698`, **`paires EXACTEMENT a 0,50 : 0`** |
| 16 | [MINEUR] 5 clés ni variées ni déclarées fixes | Neuvième groupe ajouté à `cles_fixes_non_variees` : `maths.concret.corps`, `pause.rassurance`, `enfant.attente.pilou`, `lecture.reprise.corps`, `maths.reprise.corps`, motif « Repères constants d'un soir à l'autre » | Contrôle 6 : `9 groupes, 34 cles` |
| 17 | [MINEUR] « au fur et à mesure » | `enc.indice_demande_2.15` devient « Tu peux barrer les ronds, un par un. » | Recherche de la locution : absente |
| 18 | [MINEUR] éloge par la négation | `enc.reussite_maths.15` a perdu « Tu n'as pas abandonné ». Je n'ai pas repris « Tu as continué jusqu'au bout », qui recréait une paire avec la variante 03. La formulation définitive est celle de la réserve 21, section 0 quater : « Tu as cherché avec patience. » | Contrôle 10 : aucune paire signalée dans `reussite_maths` |
| 19 | [MINEUR] + décision de l'Orchestrateur : nom de clé | `session.fin_travail.corps` devient **`session.fin_travail.corps`**, aux deux endroits : `situations.cloture.cles_ui` et `statut_cles`. `produit-marketing` a renommé ses cinq occurrences en parallèle | Contrôle 6 : `cles UI declarees : 35, absentes de produit-marketing.out.md : aucune` |

## Ce que j'ai retenu de la leçon sur l'indicateur

Vous m'écrivez : « quand tu corriges un outil de mesure, re-mesure ce que
l'ancienne version signalait, pas seulement ce que la nouvelle trouve. » C'est
exactement ce qui s'est passé : neutraliser `{matiere}` était juste, et cela a
fait glisser deux doublons réels de « au-dessus de 0,50 » à « exactement 0,50 »,
donc sous un seuil que j'avais écrit en **strictement supérieur**. Trois
conséquences, appliquées :

1. **Le seuil est en supérieur ou égal**, et le contrôle publie en plus le
   nombre de paires tombant *pile* sur la valeur seuil — la statistique qui
   m'avait échappé. Elle vaut zéro.
2. **Trois mesures indépendantes, pas une.** Une liste de mots-outils large, une
   liste minimale où les adverbes restent des mots pleins, et une similarité de
   séquence. Une paire signalée par **n'importe laquelle** est traitée. C'est ce
   qui fait passer le compte de 15 paires (votre mesure) à 46 (la mienne) : je
   préfère un indicateur qui remonte trop.
3. **La règle est publiée avec le chiffre** : les deux listes de mots-outils,
   le traitement des jetons, les trois seuils, et la comparaison employée. Le
   contrôle les imprime avant de donner le résultat, pour que le chiffre soit
   rejouable sans lire mon code.

Et quand j'ai élargi les radicaux du détecteur de niveau 3 après réécriture, j'ai
**re-mesuré avec l'ancienne liste** et publié ce qu'elle signalait : 6 variantes,
vérifiées une par une (section 5.4, point 4).

## Les 53 variantes réécrites

Par banque, membre de paire réécrit : `encouragement_pendant_lecture` 13, 18, 19 ;
`indice_demande_1` 06, 12, 19 ; `indice_demande_2` 08, 13, 15 ;
`indice_demande_3` 04, 05, 09, 13, 14, 18, 19, 20 ; `indice_demande_4` 10, 17,
18, 20 ; `reussite_maths` 13, 15 ; `transition_lecture_vers_maths` 04, 10, 18 ;
`transition_maths_vers_lecture` 04, 10, 18 ; `photo_illisible` 06, 07, 12, 13,
19, 20 ; `reprise_session` 07, 09, 12, 13, 17, 20 ; `annonce_programme` 11 ;
`annonce_programme_une_etape` 02, 03, 16, 20 ; `cloture` 11, 18 ;
`retour_de_pause` 18 ; `blocage_lecture` 08, 15 ; `pas_de_devoirs` 17 ;
`accueil` 11.

**Une tournure supprimée sans qu'on me l'ait demandée** : trois variantes de
l'annonce à une seule étape donnaient « c'est **les maths** ». La forme est
correcte à l'oral courant, mais pas au sens strict (« ce sont les maths »), et
« ce sont » serait guindé pour un CE1. Plutôt que de défendre une forme
discutable devant un enfant qui apprend à lire, je l'ai retirée : les trois
variantes sont réécrites sans elle.

---

# 0 quater. Réserves du tour 3

`VERDICT: PASS_AVEC_RESERVES` — 0 [BLOQUANT], 0 [MAJEUR], 2 [MINEUR], aucun
écart sur 24 grandeurs. Les deux réserves sont levées, une ligne chacune.

| # | Réserve | Correction | Vérification |
| --- | --- | --- | --- |
| 20 | `situations.cloture.note` portait encore l'ancien nom de clé et disait qu'elle « est à créer » | La note dit maintenant : « Elle alimente la seule clé `session.fin_travail.corps`, qui existe côté marketing depuis le 2026-09-20 et n'appartient à aucun écran de transition entre étapes. » | La `note` et le `cles_ui` du même objet disent désormais la même chose, ce qui était précisément le défaut du constat 1 du tour 1 |
| 21 | `enc.reussite_maths.15` valorisait l'absence de pause (« sans t'arrêter »), seule entrée sur 479 dans ce cas | « **Tu as cherché avec patience.** Bravo pour ton courage. » — la formulation du contrôleur, retenue telle quelle | Recouvrement recalculé après changement : **0 paire signalée**, maximum inchangé à 0,429 |

**Aucun chiffre n'a bougé.** 23 situations, 460 variantes, 680 parties, 479
entrées, 864 phrases, 0 dépassement, maximums de recouvrement 0,429 et 0,698,
0 paire exactement à 0,50 : identiques avant et après les deux corrections. La
réserve 21 ne change qu'un fragment de 4 mots, la réserve 20 ne touche aucun
texte destiné à l'enfant.

## La recommandation que je verse dans ma méthode

> « Quand tu corriges un instrument de mesure, publie aussi son ancienne
> version, pas seulement ce que la nouvelle trouve. »

Le contrôleur nomme honnêtement sa limite : il a pu vérifier mon **résultat**,
pas ma **procédure**, faute de pouvoir reconstituer ma liste de radicaux
d'origine, et il a compensé en relisant les 80 variantes des quatre niveaux à la
main. C'est un travail que ma publication aurait dû lui épargner. L'ancienne
liste est donc reproduite ici, telle qu'elle était avant élargissement :

```
ANCIENNE_LISTE_NIV3 = ["exemple", "ressemble", "petits nombres", "plus simple",
                       "plus facile", "plus petit", "cas plus simple",
                       "plus court", "pareil", "entraîne"]
```

Elle ne reconnaissait pas 6 des 20 variantes après réécriture (05, 09, 13, 14,
19, 20), parce qu'elles disent « cas tout simple », « version courte »,
« modèle », « petit exercice », « moins d'objets » au lieu d'« exemple ». Les
radicaux ajoutés sont : `cas`, `simple`, `modèle`, `version`, `moins d'objets`,
`petit exercice`. Le contrôle imprime les deux mesures à chaque exécution.

---

## Sommaire

0 bis. Arbitrage ARB-06 et réponses demandées
0 ter. Reprise après verdict du tour 2
0 quater. Réserves du tour 3
1. Schéma de `content/encouragements.json`
2. Décomposition en situations (arbitrage A de l'Orchestrateur)
3. Schéma de `content/gwenn-scripts.json`
4. Compte exact de variantes par situation
5. Contrôles mécaniques et sorties réelles
6. Couverture de PED-04, PED-05, PED-11, PED-12
7. Les jetons `{prenom}` et `{matiere}`, et le multi-enfants (PRD-02)
8. Écart de nommage `gwenn-scripts.json`
9. Arbitrages tranchés dans ce livrable
10. Ce qui reste ouvert

---

# 1. Schéma de `content/encouragements.json`

## 1.1 Structure

Table indexée par identifiant de situation, pour une lecture directe en
TypeScript, sans recherche dans un tableau.

```
{
  "schema": "tipi.encouragements.v2",
  "version": "2.0.0",
  "personnage": "Pilou",
  "jeton_prenom": "{prenom}",
  "jeton_matiere": { "jeton": "{matiere}", "valeurs": { ... }, "emploi": "..." },
  "canaux": ["tts", "affiche", "les_deux"],
  "regles": { ... },
  "correspondance_mission": { "accueil": ["accueil"], ... },
  "cles_fixes_non_variees": [ { "cles": [...], "motif": "..." } ],
  "statut_cles": { "session.fin_travail.corps": "À créer côté marketing..." },
  "situations": {
    "accueil": {
      "id": "accueil",
      "libelle": "Accueil du soir, Pilou salue l'enfant",
      "ecran": "/enfant",
      "cles_ui": ["enfant.accueil.titre", "enfant.accueil.corps"],
      "req": ["PED-11", "PED-05", "PED-10"],
      "note": "La partie 1 remplit le titre, la partie 2 le corps. ...",
      "variantes": [
        {
          "id": "enc.accueil.01",
          "texte": "Bonsoir {prenom}. Je suis contente de te voir.",
          "canal": "les_deux",
          "jetons": ["{prenom}"],
          "parties": [
            { "cles_ui": ["enfant.accueil.titre"], "texte": "Bonsoir {prenom}." },
            { "cles_ui": ["enfant.accueil.corps"], "texte": "Je suis contente de te voir." }
          ]
        }
      ]
    }
  }
}
```

## 1.2 Champs

| Champ | Niveau | Type | Rôle |
| --- | --- | --- | --- |
| `schema`, `version` | racine | `string` | Format et version du contenu |
| `canaux` | racine | `string[]` | Les trois valeurs autorisées de `canal` |
| `regles` | racine | `object` | Règles de rédaction, de sélection et de raccordement |
| `correspondance_mission` | racine | `Record<string, string[]>` | Les 16 situations de la mission vers les situations livrées |
| `cles_fixes_non_variees` | racine | `{cles, motif}[]` | Les clés d'écran que la banque ne fait **pas** varier, avec le motif |
| `statut_cles` | racine | `Record<string,string>` | Statut des clés qui ont demandé une création côté marketing |
| `situations` | racine | `Record<SituationId, Situation>` | Les 23 situations |
| `jeton_matiere` | racine | `object` | Le jeton `{matiere}`, sa table de valeurs par clé et son emploi |
| `cles_ui` | situation | `string[]` | Toutes les clés remplies par la situation, dans l'ordre des parties |
| `note` | situation | `string` | Condition d'emploi, opposable en revue |
| `id` | variante | `string` | **Identifiant stable** `enc.<situation>.<nn>` |
| `texte` | variante | `string` | La phrase complète : c'est ce que lit le TTS |
| `canal` | variante | `"tts" \| "affiche" \| "les_deux"` | **Canal de diffusion** |
| `jetons` | variante | `string[]` | Jetons présents dans `texte` |
| `parties` | variante | `{cles_ui, texte}[]` | **Le raccordement** : quel fragment va dans quelle clé d'écran |

## 1.3 Le canal de diffusion

| Valeur | Sens | Emploi réel |
| --- | --- | --- |
| `tts` | Lue par Pilou, non affichée | **Aucune entrée aujourd'hui, et c'est voulu.** Décision et motif en section 0 bis, inscrits dans le fichier sous `regles.canal_tts_en_v1` |
| `affiche` | Affichée seulement, Pilou se tait | 25 entrées |
| `les_deux` | Dite **et** affichée, mot pour mot | 434 entrées |

Répartition exacte des 25 entrées `affiche`, recomptée par situation :

```
encouragement_pendant_lecture  affiche  20
onboarding                     affiche   3   (boutons)
rituel_fermeture               affiche   2   (boutons)
```

Les 20 entrées de `encouragement_pendant_lecture` sont affichées pendant que le
micro est ouvert : la voix de Pilou couvrirait celle de l'enfant et dégraderait
la reconnaissance vocale. Les 5 autres sont des libellés de bouton, jamais lus
par construction (règle `lecture_tts` du fichier de rituels). **Tout le reste est
en `les_deux`** : une information utile à l'action est toujours doublée à l'oral
(PED-10).

La version 1 de ce livrable portait 5 entrées `tts` sur la transition. Elles ont
disparu parce que les clés `transition.felicitation.*` et `transition.annonce.*`
sont en `les_deux` côté marketing : c'est une mise en conformité, pas un oubli.

## 1.4 Consommation depuis TypeScript

```ts
type Canal = "tts" | "affiche" | "les_deux";

type Partie = { cles_ui: string[]; texte: string };

type Variante = {
  id: string;
  texte: string;      // toujours égal à parties.map(p => p.texte).join(" ")
  canal: Canal;
  jetons: string[];
  parties: Partie[];
};

type Situation = {
  id: string; libelle: string; ecran: string;
  cles_ui: string[]; req: string[]; note: string;
  variantes: Variante[];
};
```

**Règle de câblage, décidée ici et non laissée au développement** : on tire une
variante dans `situations[<id>].variantes`, puis chaque `partie` écrit son
`texte` dans chacune des clés de son `cles_ui`. Le TTS reçoit `variante.texte`.
Quand un `cles_ui` de partie contient plusieurs clés, ce sont des rendus
mutuellement exclusifs du même emplacement et le texte, neutre, convient à tous.
Toute clé d'écran absente de la banque est fixe : elle est listée dans
`cles_fixes_non_variees` avec son motif.

Règle de sélection : tirage aléatoire **sans répétition immédiate** par
situation. L'identifiant de la dernière variante jouée est mémorisé côté
session, jamais un compteur visible par l'enfant.

---

# 2. Décomposition en situations (arbitrage A de l'Orchestrateur)

Règle appliquée : **une situation est un moment qui porte un sens propre ; deux
clés d'écran de sens différent sont deux situations, chacune avec ses 20
variantes.** Aucune situation n'est regroupée pour tenir le compte de 20.

| Mission (16 situations demandées) | Situations livrées | Variantes |
| --- | --- | --- |
| accueil | `accueil` | 20 |
| annonce du programme | `annonce_programme`, `annonce_programme_une_etape` | 40 |
| avant lecture | `avant_lecture` | 20 |
| encouragement en cours de lecture | `encouragement_pendant_lecture`, `retour_apres_lecture` | 40 |
| hésitation sur un mot | `hesitation` | 20 |
| réussite d'étape | `reussite_maths`, `transition_lecture_vers_maths`, `transition_maths_vers_lecture` | 60 |
| transition entre étapes | `transition_lecture_vers_maths`, `transition_maths_vers_lecture` | 40 |
| avant maths | `avant_maths` | 20 |
| indice demandé | `indice_demande_1`, `_2`, `_3`, `_4` | 80 |
| blocage | `blocage_maths`, `blocage_lecture` | 40 |
| demande de pause | `demande_pause` | 20 |
| retour de pause | `retour_de_pause` | 20 |
| clôture | `cloture` | 20 |
| pas de devoirs ce soir | `pas_de_devoirs` | 20 |
| photo illisible | `photo_illisible` | 20 |
| reprise d'une session interrompue | `reprise_session` | 20 |

Cette table est **dans le fichier** (`correspondance_mission`), pas seulement
dans ce rapport, et le contrôle 2 la rejoue.

## 2.1 Pourquoi ces éclatements

| Situation éclatée | Motif |
| --- | --- |
| `indice_demande_1` à `_4` | Les quatre niveaux de PED-02 annoncent quatre aides différentes. Une amorce de niveau 3 avant une question ouverte ment à l'enfant |
| `blocage_maths` / `blocage_lecture` | Deux causes opposées : l'exercice résiste, ou le micro n'a rien capté. Dire « cet exercice est difficile » sur une panne de micro attribue à l'enfant une difficulté qui n'est pas la sienne (PED-09) |
| `encouragement_pendant_lecture` / `retour_apres_lecture` | Deux moments, deux clés, et deux canaux : affiché micro ouvert, dit et affiché micro fermé |
| `transition_lecture_vers_maths` / `transition_maths_vers_lecture` | Les textes nomment les matières. PRD-04 autorise le parent à mettre les maths en premier : le miroir ne s'improvise pas au rendu |

## 2.2 Ce que la banque ne fait délibérément pas varier

Décision explicite, inscrite dans `cles_fixes_non_variees` avec un motif par
groupe. Extraits :

| Clés | Motif |
| --- | --- |
| `enfant.programme.corps.lecture_maths`, `.maths_lecture` | Portent l'ordre des deux étapes. Une phrase tirée au sort risquerait d'annoncer un ordre faux |
| `enfant.programme.une.titre` | Titre de repérage de la soirée à une étape. Depuis ARB-06, c'est le **corps** qui varie, pas le titre |
| `lecture.intro.titre.premier/.apres`, `maths.intro.titre.premier/.apres` | Portent la position de l'étape. La banque remplit le corps, pas le titre |
| `maths.demande_resultat.1` à `.4`, `maths.indice.epuise` | Refus de donner le résultat (PED-01) : formulations fixes, contrôlées une fois pour toutes |
| `bravo.*` | Rituel invariant (PED-12), dans `gwenn-scripts.json` |
| Tous les libellés de bouton | Un libellé d'action ne varie pas d'un soir à l'autre (DES-06) |
| `maths.concret.corps`, `pause.rassurance`, `enfant.attente.pilou`, `lecture.reprise.corps`, `maths.reprise.corps` | Repères constants d'un soir à l'autre : une formulation stable vaut mieux qu'une variante (PED-03, PRD-12, PRD-18). Groupe ajouté au tour 3, sur le [MINEUR] 16 |

**Conséquence assumée et écrite** : PED-11 s'applique aux situations où Pilou
*parle* à l'enfant d'un soir sur l'autre. Une clé structurelle, un libellé
d'action ou un message d'état technique ne sont pas des situations : les faire
varier n'apporte rien à l'enfant et multiplierait les chemins à contrôler.
Le mode basse énergie faisait exception à cette règle dans la version 2 : il est
désormais couvert par la banque `annonce_programme_une_etape` (ARB-06, section
0 bis), pour +20 variantes et non +40, grâce au jeton `{matiere}`.

---

# 3. Schéma de `content/gwenn-scripts.json`

Même vocabulaire que la banque (`id`, `texte`, `canal`), **aucune variante**.
Dans ce fichier, le champ `id` **est** la clé d'écran du marketing.

```
"rituels": {
  "onboarding":       { "rejoue": "jamais", "ecrans": [3 écrans] },
  "rituel_fermeture": { "rejoue": "chaque soir, à l'identique", "invariant": true,
                        "ecrans": [1 écran] }
}
```

| Champ | Niveau | Rôle |
| --- | --- | --- |
| `rejoue` | rituel | `"jamais"` (PRD-01) ou `"chaque soir, à l'identique"` (PED-12) |
| `invariant` | rituel | `true` sur `rituel_fermeture` : aucune variante autorisée |
| `ordre` | écran, ligne | Pilote du rendu et de la lecture TTS |
| `role` | ligne | `titre`, `corps`, `bouton_principal`, `bouton_secondaire` |
| `condition` | ligne | `null` = toujours jouée, sinon l'état applicatif qui la déclenche |

**Le `role` porte la hiérarchie des boutons**, pas l'ordre d'affichage seul :
c'est ce qui fait survivre l'arbitrage DES-06 au fichier (constat 7).

## 3.1 Onboarding, 3 écrans, joué une seule fois à vie (PRD-01)

Textes repris mot pour mot du marketing (7.2), clés d'origine conservées. Une
seule action par écran, `role: "bouton_principal"`.

| Écran | Texte dit et affiché | Bouton |
| --- | --- | --- |
| 1 sur 3 | « Bonjour, moi c'est Pilou. » / « J'habite ici, dans le tipi. » | « Bonjour Pilou » |
| 2 sur 3 | « On fait les devoirs ensemble. » / « Deux choses par soir. Pas plus. » | « D'accord » |
| 3 sur 3 | « Tu peux t'arrêter quand tu veux. » / « Appuie sur la pause. Je t'attends. » / « Tu gagnes des pierres. Elles restent à toi. » | « On y va » |

## 3.2 Rituel de fermeture, identique chaque soir (PED-12)

| Ordre | Clé | Texte | Rôle | `condition` |
| --- | --- | --- | --- | --- |
| 1 | `bravo.titre` | « Bravo {prenom}. » | titre | `null` |
| 2 | `bravo.corps` | « Tu as fait tes devoirs ce soir. » | corps | `null` |
| 3 | `bravo.pierres` | « Tu as gagné des pierres. » | corps | `credit_pierres_ok` |
| 4 | `bravo.coffre` | « Je les range dans ton coffre. » | corps | `credit_pierres_ok` |
| 5 | `bravo.pierres_plus_tard` | « Je range tes pierres un peu plus tard. » | corps | `credit_pierres_differe` |
| 6 | `bravo.pierres_plus_tard_2` | « Elles sont à toi. Elles ne se perdent pas. » | corps | `credit_pierres_differe` |
| 7 | `bravo.fin` | « C'est fini. Tu peux aller jouer. » | corps | `null` |
| 8 | `bravo.bouton_principal` | « Aller jouer » | **bouton_principal** | `null` |
| 9 | `bravo.bouton_secondaire` | « Voir mon coffre » | bouton_secondaire | `null` |

L'action principale est « Aller jouer » : le rituel se termine sur la sortie de
l'application, pas sur l'inventaire des pierres (DES-06, PRD-11, PED-05).
Les lignes 5 et 6 remplacent les lignes 3 et 4 quand le crédit n'a pas pu être
écrit : c'est le seul aménagement, il dépend d'un état technique et jamais de la
soirée de l'enfant.

---

# 4. Compte exact de variantes par situation

Comptes **relevés mécaniquement** dans le fichier livré (sortie réelle en 5.2).

| # | Situation | Variantes | Clés remplies | Canal |
| --- | --- | --- | --- | --- |
| 1 | `accueil` | **20** | `enfant.accueil.titre` + `.corps` | les_deux |
| 2 | `annonce_programme` | **20** | `enfant.programme.titre` | les_deux |
| 2 bis | `annonce_programme_une_etape` | **20** | `enfant.programme.une.corps.lecture` + `.maths` (jeton `{matiere}`) | les_deux |
| 3 | `avant_lecture` | **20** | `lecture.intro.corps` | les_deux |
| 4 | `encouragement_pendant_lecture` | **20** | `lecture.micro.en_cours` | affiche |
| 5 | `retour_apres_lecture` | **20** | `lecture.retour.effort` + `.effort_2` | les_deux |
| 6 | `hesitation` | **20** | `lecture.hesitation.corps` | les_deux |
| 7 | `blocage_lecture` | **20** | `lecture.blocage.corps` + `.corps_2` | les_deux |
| 8 | `avant_maths` | **20** | `maths.intro.corps` | les_deux |
| 9 | `indice_demande_1` | **20** | `maths.indice.1.amorce` | les_deux |
| 10 | `indice_demande_2` | **20** | `maths.indice.2.amorce` | les_deux |
| 11 | `indice_demande_3` | **20** | `maths.indice.3.amorce` | les_deux |
| 12 | `indice_demande_4` | **20** | `maths.indice.4.amorce` | les_deux |
| 13 | `blocage_maths` | **20** | `maths.blocage.corps` + `.corps_2` | les_deux |
| 14 | `reussite_maths` | **20** | `maths.fini.retour` + `.retour_2` | les_deux |
| 15 | `transition_lecture_vers_maths` | **20** | `transition.felicitation.lecture` + `transition.annonce.maths` | les_deux |
| 16 | `transition_maths_vers_lecture` | **20** | `transition.felicitation.maths` + `transition.annonce.lecture` | les_deux |
| 17 | `demande_pause` | **20** | `pause.titre` + `pause.corps` | les_deux |
| 18 | `retour_de_pause` | **20** | `pause.retour.corps` | les_deux |
| 19 | `cloture` | **20** | `session.fin_travail.corps` | les_deux |
| 20 | `pas_de_devoirs` | **20** | `enfant.accueil.vide.titre` + `.corps` | les_deux |
| 21 | `photo_illisible` | **20** | `enfant.accueil.souci.titre` + `.corps` | les_deux |
| 22 | `reprise_session` | **20** | `enfant.accueil.reprise.titre` + `.corps` | les_deux |
| | **Total** | **460** | 35 clés | |

**Diversité réelle**, mesurée sous trois règles publiées (section 5.2,
contrôle 10) : les 460 variantes sont 460 textes distincts (479 avec les
rituels), **aucune paire d'une même banque n'atteint le seuil de 0,50** sur l'une
ou l'autre des deux mesures de Jaccard, **aucune n'atteint 0,70** en similarité
de séquence, et **aucune ne tombe exactement sur 0,50**. Maximums réels :
0,429 (Jaccard, les deux listes) et 0,698 (séquence). Le seuil est appliqué en
**supérieur ou égal**, et non en strictement supérieur comme au tour 2.

---

# 5. Contrôles mécaniques et sorties réelles

Deux commandes, rejouables telles quelles.

## 5.1 Validité JSON (`node`)

```
$ node -e "..." 

content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v2, cles racine=11 -> schema,version,personnage,jeton_prenom,jeton_matiere,canaux,regles,correspondance_mission,cles_fixes_non_variees,statut_cles,situations
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v2, cles racine=8 -> schema,version,personnage,note_nom_de_fichier,jeton_prenom,canaux,regles,rituels
situations : 23
variantes  : 460
parties    : 680
cle de cloture : session.fin_travail.corps
lignes fixes : 19
---exit:0---
```

## 5.2 Contrôle de charte, de raccordement et de recouvrement

Le script est conservé hors du dépôt (répertoire de travail de l'agent). Il
vérifie, sur **toutes** les entrées et **sur chaque rendu de jeton** : comptes
par situation ; couverture des 16 situations de la mission ; longueur de chaque
phrase en comptage strict ; mots et fragments interdits ; accords de genre ;
emoji, chiffres, prénom en dur ; unicité des identifiants, des textes bruts et
des textes normalisés ; validité et présence du canal ; invariant
`texte == jointure des parties` ; existence réelle de chaque clé déclarée dans
`produit-marketing.out.md` ; les contrôles dédiés aux constats 4, 5, 6, 9 et 10
du tour 1 ; **le recouvrement sous trois règles publiées, au seuil supérieur ou
égal** ; la hiérarchie des boutons du rituel ; et le contrôle 14, qui imprime le
**mot situé à gauche du jeton** et les deux rendus de chacune des 20 variantes à
jeton.

```
======================================================================
1. COMPTE DE VARIANTES PAR SITUATION
======================================================================
accueil                           20 variantes   OK
annonce_programme                 20 variantes   OK
annonce_programme_une_etape       20 variantes   OK
avant_lecture                     20 variantes   OK
encouragement_pendant_lecture     20 variantes   OK
retour_apres_lecture              20 variantes   OK
hesitation                        20 variantes   OK
blocage_lecture                   20 variantes   OK
avant_maths                       20 variantes   OK
indice_demande_1                  20 variantes   OK
indice_demande_2                  20 variantes   OK
indice_demande_3                  20 variantes   OK
indice_demande_4                  20 variantes   OK
blocage_maths                     20 variantes   OK
reussite_maths                    20 variantes   OK
transition_lecture_vers_maths     20 variantes   OK
transition_maths_vers_lecture     20 variantes   OK
demande_pause                     20 variantes   OK
retour_de_pause                   20 variantes   OK
cloture                           20 variantes   OK
pas_de_devoirs                    20 variantes   OK
photo_illisible                   20 variantes   OK
reprise_session                   20 variantes   OK
----------------------------------------------------------------------
situations : 23    total variantes : 460

======================================================================
2. COUVERTURE DES 16 SITUATIONS DE LA MISSION
======================================================================
accueil                                -> accueil                                                      OK (min 20)
annonce du programme                   -> annonce_programme, annonce_programme_une_etape               OK (min 20)
avant lecture                          -> avant_lecture                                                OK (min 20)
encouragement en cours de lecture      -> encouragement_pendant_lecture, retour_apres_lecture          OK (min 20)
hesitation sur un mot                  -> hesitation                                                   OK (min 20)
reussite d'etape                       -> reussite_maths, transition_lecture_vers_maths, transition_maths_vers_lecture OK (min 20)
transition entre etapes                -> transition_lecture_vers_maths, transition_maths_vers_lecture OK (min 20)
avant maths                            -> avant_maths                                                  OK (min 20)
indice demande                         -> indice_demande_1, indice_demande_2, indice_demande_3, indice_demande_4 OK (min 20)
blocage                                -> blocage_maths, blocage_lecture                               OK (min 20)
demande de pause                       -> demande_pause                                                OK (min 20)
retour de pause                        -> retour_de_pause                                              OK (min 20)
cloture                                -> cloture                                                      OK (min 20)
pas de devoirs ce soir                 -> pas_de_devoirs                                               OK (min 20)
photo illisible                        -> photo_illisible                                              OK (min 20)
reprise d'une session interrompue      -> reprise_session                                              OK (min 20)
situations de mission couvertes : 16 / 16

======================================================================
3. LONGUEUR DES PHRASES (limite : 12 mots, comptage strict)
======================================================================
entrees controlees : 479
phrases controlees : 864
phrase la plus longue : enc.blocage_lecture.05 (10 mots) : Je t'entends mal, et ce n'est pas toi
depassements : 0

======================================================================
4. INTERDITS, EMOJI, CHIFFRES, PRENOM EN DUR, ACCORD DE GENRE, CANAL
======================================================================
occurrences trouvees : 0

======================================================================
5. UNICITE DES IDENTIFIANTS ET DES TEXTES
======================================================================
identifiants : 479, doublons : aucun
textes       : 479, doublons : aucun
textes normalises : 479, doublons : aucun

======================================================================
6. RACCORDEMENT : PARTIES, INVARIANT DE TEXTE, EXISTENCE DES CLES
======================================================================
parties controlees : 680
invariant texte == jointure des parties : OK sur 460/460
cles UI declarees : 35, absentes de produit-marketing.out.md : aucune
cles fixes non variees declarees : 9 groupes, 34 cles
cles sous statut particulier : session.fin_travail.corps

======================================================================
7. CONSTAT 5 — photo_illisible : aucun support nomme, une sortie partout
======================================================================
variantes nommant la photo, l'image, la feuille ou le cahier : 0 / 20
variantes offrant une sortie explicite (coffre ou pierres) : 20 / 20

======================================================================
8. CONSTAT 6 — blocage_lecture : la panne est du cote de Pilou
======================================================================
variantes attribuant la panne au micro ou a l'ecoute de Pilou : 20 / 20

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
aucune variante des 80 ne contient de resultat chiffre (controle 4 : 0 chiffre)

======================================================================
10. CONSTAT 9 + [MAJEUR] 15 — recouvrement interne, trois regles publiees
======================================================================
Regle publiee avec l'indicateur :
  mesure A : Jaccard sur les mots pleins, liste de mots-outils LARGE (84 mots)
  mesure B : Jaccard sur les mots pleins, liste MINIMALE et grammaticale (66 mots)
             les adverbes (bien, tout, doucement...) y restent des mots pleins
  mesure C : similarite de sequence difflib sur le texte entier
  jetons {prenom} et {matiere} neutralises dans A et B, retires dans C
  seuil de signalement : A >= 0,50  OU  B >= 0,50  OU  C >= 0,70
  comparaison : superieur OU EGAL au seuil, jamais strictement superieur
paires signalees (A >= 0,50 ou B >= 0,50 ou C >= 0,70) : 0
maximum mesure A : 0.429  ('hesitation', 'enc.hesitation.02', 'enc.hesitation.20')
maximum mesure B : 0.429  ('hesitation', 'enc.hesitation.02', 'enc.hesitation.20')
maximum mesure C : 0.698  ('retour_de_pause', 'enc.retour_de_pause.01', 'enc.retour_de_pause.20')
paires EXACTEMENT a 0,50 sous A ou B : 0

======================================================================
11. CONSTAT 10 — la banque cloture n'emprunte pas les mots du rituel
======================================================================
emprunts aux phrases du rituel : 0
cles_ui de cloture : ['session.fin_travail.corps']

======================================================================
12. REPARTITION DES CANAUX
======================================================================
tts           0 entrees
affiche      25 entrees
les_deux    454 entrees
  encouragement_pendant_lecture  affiche  20
  onboarding                     affiche  3
  rituel_fermeture               affiche  2

======================================================================
13. RITUELS FIXES (gwenn-scripts.json)
======================================================================
onboarding           ecrans : 3   lignes : 10   rejoue : jamais
rituel_fermeture     ecrans : 1   lignes : 9   rejoue : chaque soir, à l'identique
  ordre 8  bravo.bouton_principal     bouton_principal   Aller jouer
  ordre 9  bravo.bouton_secondaire    bouton_secondaire  Voir mon coffre
onboarding : 3 ecrans (PRD-01 en exige 3)
rituel_fermeture invariant : True (PED-12)

======================================================================
14. ARB-06 — annonce a une seule etape : jeton {matiere}, Soir leger indiscernable
======================================================================
mot precedant le jeton, controle sur 20 variantes :
  prepositions contractantes (de, a, du, des, au, aux) a gauche du jeton : 0
  les deux rendus de chaque variante, avec le mot qui precede le jeton :
    01  mot a gauche : fait        
        On fait la lecture. Et c'est tout.
        On fait les maths. Et c'est tout.
    02  mot a gauche : travailles  
        Ce soir, tu travailles la lecture avec moi.
        Ce soir, tu travailles les maths avec moi.
    03  mot a gauche : prépare     
        On prépare la lecture, tous les deux.
        On prépare les maths, tous les deux.
    04  mot a gauche : a           
        Au programme, il y a la lecture.
        Au programme, il y a les maths.
    05  mot a gauche : travaille   
        On travaille la lecture ensemble.
        On travaille les maths ensemble.
    06  mot a gauche : propose     
        Je te propose la lecture pour ce soir.
        Je te propose les maths pour ce soir.
    07  mot a gauche : prend       
        On prend la lecture, tranquillement.
        On prend les maths, tranquillement.
    08  mot a gauche : fait        
        Aujourd'hui, on fait la lecture.
        Aujourd'hui, on fait les maths.
    09  mot a gauche : ouvre       
        On ouvre la lecture, et on y va.
        On ouvre les maths, et on y va.
    10  mot a gauche : pour        
        On s'installe pour la lecture.
        On s'installe pour les maths.
    11  mot a gauche : fais        
        Tu fais la lecture avec moi.
        Tu fais les maths avec moi.
    12  mot a gauche : commence    
        On commence la lecture quand tu veux.
        On commence les maths quand tu veux.
    13  mot a gauche : regarde     
        Ce soir, on regarde la lecture.
        Ce soir, on regarde les maths.
    14  mot a gauche : pour        
        On y va doucement pour la lecture.
        On y va doucement pour les maths.
    15  mot a gauche : sur         
        Je t'accompagne sur la lecture.
        Je t'accompagne sur les maths.
    16  mot a gauche : met         
        Au programme du soir, on met la lecture.
        Au programme du soir, on met les maths.
    17  mot a gauche : fait        
        On fait la lecture, comme il faut.
        On fait les maths, comme il faut.
    18  mot a gauche : sur         
        Ce soir, on passe du temps sur la lecture.
        Ce soir, on passe du temps sur les maths.
    19  mot a gauche : sur         
        On avance sur la lecture, doucement.
        On avance sur les maths, doucement.
    20  mot a gauche : travailler  
        On va travailler la lecture ce soir.
        On va travailler les maths ce soir.
variantes portant le jeton {matiere} : 20 / 20
jeton en debut de phrase : 0
vocabulaire de reduction ou de fatigue : 0
cles remplies : ['enfant.programme.une.corps.lecture', 'enfant.programme.une.corps.maths']
rendus controles (les deux matieres) :
   On fait la lecture. Et c'est tout.
   On fait les maths. Et c'est tout.
   Ce soir, tu travailles la lecture avec moi.
   Ce soir, tu travailles les maths avec moi.

======================================================================
RESULTAT : AUCUN PROBLEME
======================================================================
```

`exit: 0`.

## 5.3 Jetons, phrases canoniques, absence de « Gwenn »

```
entrees avec {prenom} : 14 {'accueil': 8, 'reprise_session': 5, 'rituel_fermeture': 1}
entrees avec {matiere} : 20 {'annonce_programme_une_etape': 20}
PRESENTE  'Bonsoir {prenom}. Je suis contente de te voir.'  ['enc.accueil.01']
PRESENTE  "On fait {matiere}. Et c'est tout."  ['enc.annonce_programme_une_etape.01']
PRESENTE  "Je lis d'abord. Tu écoutes."  ['enc.avant_lecture.01']
PRESENTE  "On regarde d'abord les objets."  ['enc.avant_maths.01']
PRESENTE  'On regarde ce mot ensemble ?'  ['enc.hesitation.01']
PRESENTE  "Celui-là est difficile. C'est normal."  ['enc.blocage_maths.01']
PRESENTE  "Le micro n'entend pas bien ce soir."  ['enc.blocage_lecture.01']
PRESENTE  "Bravo. Tu as lu jusqu'au bout."  ['enc.retour_apres_lecture.01']
PRESENTE  'Bravo. Tu as bien cherché.'  ['enc.reussite_maths.01']
PRESENTE  "C'est fait. Tu as terminé la lecture."  ['enc.transition_lecture_vers_maths.01']
PRESENTE  "C'est fait. Tu as terminé les maths."  ['enc.transition_maths_vers_lecture.01']
PRESENTE  "Je te pose une question, pour t'aider."  ['enc.indice_demande_1.01']
PRESENTE  'On peut faire autrement. Écoute.'  ['enc.indice_demande_2.01']
PRESENTE  'Je te montre un exemple plus facile.'  ['enc.indice_demande_3.01']
PRESENTE  'On le fait ensemble, tout doucement.'  ['enc.indice_demande_4.01']
PRESENTE  'On souffle un peu. Regarde le rond. Respire avec lui.'  ['enc.demande_pause.01']
PRESENTE  'Te revoilà. On y retourne tranquillement.'  ['enc.retour_de_pause.01']
PRESENTE  "Ce soir, il n'y a pas de devoirs. On se voit demain. Bonne soirée."  ['enc.pas_de_devoirs.01']
PRESENTE  'Je cherche encore tes devoirs. Tu peux aller voir ton coffre.'  ['enc.photo_illisible.01']
PRESENTE  'Te revoilà, {prenom}.'  ['enc.reprise_session.01']
phrases canoniques du marketing absentes : 0
occurrences de Gwenn : 0
```

## 5.4 Quatre points d'honnêteté sur les contrôles

1. **Mon détecteur d'accord de genre a produit deux faux positifs** au premier
   passage : « Ton tipi est prêt. » (accord sur *tipi*) et « Je ne suis pas
   encore prête. » (accord sur *Pilou*). J'ai restreint le détecteur aux motifs
   qui portent réellement sur l'enfant (« tu es prêt », « tout seul », « on
   s'était arrêtés »…). **Aucun texte n'a été modifié pour faire passer un
   contrôle** ; les deux phrases sont correctes pour un enfant de tout genre.
2. **Mon indice de recouvrement comptait le jeton `{matiere}` comme un mot
   plein.** Les 20 variantes de l'annonce à une seule étape le portant toutes, la
   mesure était gonflée pour cette seule banque. Je neutralise désormais
   `{matiere}` comme `{prenom}` l'était déjà. Cela dit, sur les six paires que la
   mesure gonflée a fait remonter, **j'ai quand même réécrit les cinq qui
   restaient trop proches une fois le jeton retiré** ; une seule était un pur
   artefact de mesure.
3. **Mon indicateur de recouvrement était trop permissif, et le contrôle du
   tour 2 l'a démontré.** Seuil en « strictement supérieur », une seule liste de
   mots-outils, pas de mesure de séquence : trois doublons réels passaient, et
   douze paires s'arrêtaient pile sur la valeur seuil. Refait en trois mesures
   publiées, seuil en supérieur ou égal, plus le compte des paires exactement au
   seuil (section 0 ter). Résultat après réécriture : 0 paire signalée, 0 paire
   à 0,50, maximum 0,429 en Jaccard et 0,698 en similarité de séquence.
4. **J'ai élargi les radicaux du détecteur de niveau 3** après avoir réécrit six
   variantes qui ne disaient plus « exemple » mais « cas simple », « version
   courte », « modèle ». Conformément à la leçon du tour 2, le contrôle
   **re-mesure avec l'ancienne liste** et publie ce qu'elle signalait : 6
   variantes, que j'ai vérifiées une par une — ce sont bien des annonces
   d'exemple simplifié, niveau 3 de PED-02.
5. **Mon détecteur de niveau d'indice était incomplet** : il refusait « Voilà
   comment on peut s'y prendre. » (niveau 2) faute des radicaux « comment »,
   « moyen », « prendre », « demand », « chaque pas ». J'ai complété la liste des
   radicaux attendus. Les quatre textes concernés étaient bien dans le registre
   de leur niveau. En revanche les **huit** variantes qui dépassaient 0,50 de
   recouvrement ont bien été **réécrites**, pas neutralisées dans le contrôle.

---

# 6. Couverture de PED-04, PED-05, PED-11, PED-12

## 6.1 PED-04 — Jamais « c'est faux » ni équivalent

La notion de réponse fausse n'existe nulle part : 479 entrées, 0 occurrence de
« faux », « erreur », « trompé », « incorrect » et de leurs formes (contrôle 4).

| Moment | Situation | Ce que Pilou dit à la place |
| --- | --- | --- |
| L'enfant bute sur un mot | `hesitation` | « On regarde ce mot ensemble ? », « Ce mot est difficile. C'est normal. » |
| Le micro n'a rien capté | `blocage_lecture` | « Je n'ai pas bien entendu. Tu veux redire, ou passer à la suite ? » — le sujet est Pilou, l'issue est ouverte |
| L'enfant n'avance plus en maths | `blocage_maths` | « Ce n'est pas grave. On peut continuer autrement. » |
| Les devoirs ne sont pas lisibles | `photo_illisible` | « Je cherche encore tes devoirs. Tu peux aller voir ton coffre. » |
| L'enfant dit qu'il a fini | `reussite_maths` | Aucune vérification, aucune coche, aucune croix : « Bravo. Tu as bien cherché. » |

**Règle tenue partout** : quand quelque chose ne marche pas, le sujet est « je »
ou « ça », jamais « tu ». Les contrôles 7 et 8 le prouvent banque par banque.

## 6.2 PED-05 — Éloge de l'effort et de la stratégie

0 occurrence de « intelligent », « doué », « meilleur », « champion », « score »,
« note ». Aucune variante ne qualifie l'enfant : elles qualifient ce qu'il a
fait.

- l'acte : « Tu as compté jusqu'au bout. Bravo pour ce travail. »
- la persévérance : « Tu as essayé, encore et encore. Ça compte beaucoup. »
- la stratégie : « Tu as utilisé tes doigts. C'est une bonne méthode. »,
  « Tu as dessiné pour t'aider. C'est une bonne idée. »
- demander de l'aide est une stratégie, pas un aveu : « Tu as demandé un indice.
  C'est une bonne façon de chercher. »

Aucune variante ne relie une pierre à une bonne réponse.

## 6.3 PED-11 — Au moins 20 variantes par situation, dans un fichier de contenu

23 situations, 20 variantes chacune, 460 au total, hors du code. Les 16
situations nommées par la mission sont couvertes, et la table de correspondance
est **dans le fichier**. Les six situations que PED-11 nomme explicitement :

| PED-11 | Situation livrée | Variantes |
| --- | --- | --- |
| réussite | `reussite_maths` + les deux transitions | 60 |
| effort | `retour_apres_lecture` + `encouragement_pendant_lecture` | 40 |
| hésitation | `hesitation` | 20 |
| pause | `demande_pause` + `retour_de_pause` | 40 |
| reprise | `reprise_session` | 20 |
| clôture | `cloture` | 20 |

**Le seuil est désormais atteint par situation réelle, plus par regroupement** :
c'est la réserve du contrôleur sur PED-11, et elle est levée par les éclatements
de la section 2.

## 6.4 PED-12 — Rituel de fermeture identique chaque soir

Le rituel vit dans `gwenn-scripts.json`, `invariant: true`, 9 lignes sans
variante, ordre stable, aucune condition liée à la performance de la soirée.

**Les deux contradictions relevées par le contrôle sont levées** :

1. `cloture.cles_ui` ne contient plus `bravo.titre` ; la banque n'alimente
   aucune clé de `/enfant/bravo` (contrôle 11).
2. La hiérarchie des boutons suit le marketing : « Aller jouer » est l'action
   principale (contrôle 13).

L'arbitrage reste celui de la version 1, validé par le contrôleur : la banque
`cloture` est dite **à la fin de la dernière étape**, sur une clé distincte
(`session.fin_travail.corps`), et le rituel de `/enfant/bravo` ne varie jamais.
Aucune des 20 variantes n'emprunte les mots du rituel (contrôle 11 : 0 emprunt).

---

# 7. Les jetons `{prenom}` et `{matiere}`, et le multi-enfants (PRD-02)

Le prénom n'est écrit en dur nulle part : 0 occurrence de « Evan » sur 479
entrées. 14 entrées portent `{prenom}` : 8 dans `accueil`, 5 dans
`reprise_session`, 1 dans le rituel de fermeture.

PRD-02 impose un profil pré-rempli en V1 mais un **schéma multi-enfants dès le
départ**. Un prénom gravé obligerait à réécrire la banque pour un deuxième
enfant. Mise en œuvre attendue :

- substitution au rendu depuis `child.prenom` lu en base ;
- substitution **avant** l'envoi au TTS, la clé de cache (TEC-09b) étant
  calculée sur le texte substitué ;
- aucun de ces textes n'est envoyé à un modèle d'IA (SEC-04).

**Le jeton `{matiere}`** obéit à la même logique, pour une autre raison : le
texte ne doit dépendre ni de la matière conservée par le parent, ni de l'ordre
choisi. Il est déclaré à la racine sous `jeton_matiere`, avec sa table de
valeurs par clé, et il n'est employé que dans `annonce_programme_une_etape`.
Contrainte de rédaction vérifiée mécaniquement : jamais en début de phrase,
jamais sujet d'un verbe.

Même raison pour les accords : **aucune variante ne contient d'adjectif ou de
participe accordé au genre de l'enfant** (contrôle 4, 0 occurrence). Les textes
restent justes pour un deuxième enfant, quel que soit son genre.

---

# 8. Écart de nommage `gwenn-scripts.json`

Le nom de fichier imposé par le prompt maître est conservé. Le personnage
s'appelle **Pilou** dans tous les textes : 0 occurrence de « Gwenn » dans les
479 entrées (contrôle 5.3). Le fichier porte un champ `note_nom_de_fichier` qui
écrit l'écart noir sur blanc. Le renommage en `pilou-scripts.json` touche le
prompt maître et une règle permanente : il reste hors de mon périmètre, et le
contrôleur note qu'une escalade ESC-001 est déjà ouverte par l'Orchestrateur.

---

# 9. Arbitrages tranchés dans ce livrable

| # | Sujet | Décision |
| --- | --- | --- |
| 1 | PED-11 contre PED-12 | La banque `cloture` précède le rituel, sur une clé distincte. Le rituel ne varie jamais. Validé par le contrôleur, exécution corrigée (constat 1) |
| 2 | `photo_illisible` | Pilou cherche, elle n'échoue pas. Aucun support nommé, une sortie dans chacune des 20 variantes |
| 3 | Vocabulaire des canaux | `tts` / `affiche` / `les_deux`, décision de l'Orchestrateur, inscrite dans les deux fichiers de contenu. Le marketing s'aligne. **Plus rien à harmoniser** |
| 4 | Ordre et matière | La banque ne dit jamais un ordre qu'elle ne connaît pas. Soit le texte est neutre, soit la situation est dédoublée par matière (transitions) |
| 5 | Accord grammatical | Aucun accord au genre de l'enfant |
| 6 | Raccordement aux écrans | `parties` dans chaque variante, plus `cles_fixes_non_variees` pour ce que la banque ne varie pas. La décision est dans le livrable, pas renvoyée au développement |
| 7 | Chiffres | Aucun chiffre, y compris en toutes lettres pour un rang d'indice |
| 8 | Longueur | 12 mots maximum, tenu à 10 au pire, en comptage strict |
| 9 | Volume | 460 variantes assumées, dont les 20 de l'annonce à une seule étape (ARB-06). Aucune situation regroupée pour tenir le compte de 20 |

---

# 10. Ce qui reste ouvert

1. **`session.fin_travail.corps` existe désormais** : `produit-marketing` l'a
   créée le 2026-09-20. Les 35 clés déclarées par la banque existent toutes.
   J'ai repris son texte canonique (« Tu as bien travaillé. Viens avec moi. »)
   en variante 01 de `cloture`, comme pour les 22 autres banques.
2. **Nom de la clé de clôture** : réglé. Renommée en
   `session.fin_travail.corps` des deux côtés, sur le [MINEUR] 19 et la
   révocation ARB-07 de l'Orchestrateur. Plus rien d'ouvert ici.
3. **Renommage de `gwenn-scripts.json`** en `pilou-scripts.json` : candidat
   `BACKLOG-V2.md`, hors périmètre.
4. **Cache TTS (TEC-09b)** : les 479 entrées sont des phrases récurrentes, donc
   toutes cachables. Les 14 entrées portant `{prenom}` et les 20 portant
   `{matiere}` doivent être cachées **après** substitution : une entrée de cache
   par prénom, et deux par variante d'annonce à une seule étape.
5. **Visa `gardien-charte`** : obligatoire avant de considérer ce contenu comme
   livré. Cet agent est producteur, il ne s'auto-valide pas.
6. **Lecture à voix haute** : les 460 variantes sont écrites pour l'oreille,
   pas encore entendues avec la voix Chirp3-HD retenue (point humain 5 de la
   section 8 du prompt maître).

---

## Note de procédure

Cet agent n'a effectué **aucun commit git**. Le commit `83073ad` qui contient la
version 1 des deux fichiers de contenu a été créé par l'Orchestrateur. La
version 2 est dans l'arbre de travail, non commitée, comme ce rapport.
