# P1bis — Fichiers d'interface et retrait des clés mortes

Livrable de l'agent `contenu-enfant`, mission ARB-10 et ARB-12, après la
fermeture de G1. **Version 3** : reprise du `VERDICT: FAIL` du tour 1
(1 [MAJEUR], 4 [MINEUR]), application d'ARB-14, puis reprise du
`VERDICT: FAIL` du tour 2 (1 [MAJEUR], 3 [MINEUR]), puis la réserve du
`VERDICT: PASS_AVEC_RESERVES` du tour 3. Sources : `docs/agents/P1/produit-marketing.out.md`,
`docs/agents/GATES.md` (ARB-08, ARB-10, ARB-12, ARB-13), et le bloc
**AMENDEMENTS** en tête de `TIPI-PROMPT-CURSOR.md`.

| Fichier | Rôle | Volume |
| --- | --- | --- |
| `content/ui-enfant.json` | Textes **fixes** des écrans enfant | 101 entrées, 6 écrans |
| `content/ui-parent.json` | Textes **fixes** des écrans parent et Réglages | 187 entrées, 6 écrans |
| `content/encouragements.json` | Banque de variantes (inchangée, sauf retrait ARB-12) | 23 situations, 460 variantes |
| `content/gwenn-scripts.json` | Rituels fixes (inchangé) | 19 lignes |
| `docs/agents/P1/ui-content.out.md` | Le présent rapport | — |

Aucun emoji, aucun prénom en dur, aucun commit git.

---

## Sommaire

0. Reprise après verdict du tour 1
0 bis. Reprise après verdict du tour 2
0 ter. Réserve du tour 3
1. Ce que portent les deux fichiers neufs, et ce qu'ils ne portent pas
2. Schéma des `ui-*.json`
3. Répartition enfant / parent
4. Les neuf clés que j'ai créées
5. Tâche B — retrait des six clés mortes
6. ARB-13 — le barème et les textes
7. Contrôles mécaniques et sorties réelles
8. Réserves et ce qui reste ouvert

---

# 0. Reprise après verdict du tour 1

## [MAJEUR] 1 — le champ `condition`

Le constat est juste et je ne le discute pas : le fichier publiait que `null`
signifie « cas nominal », et 85 entrées le démentaient. Votre remarque sur
l'origine de l'information a décidé la correction : **elle n'était pas à
inventer, elle était à récupérer.** Le marketing la porte en intertitre au-dessus
de chaque table, et mon extraction gardait la colonne « Texte » en jetant
l'intertitre.

J'ai choisi la **voie (a)** : renseigner `condition`, et non assouplir la règle.

| Origine | Entrées | Comment |
| --- | --- | --- |
| `intertitre` | 72 | Reprise **mot pour mot** de l'intertitre du marketing : « État d'erreur — micro refusé ou indisponible », « Variante de reprise (l'app a été fermée en cours de soirée, PRD-18) », « Cas breton (PED-13) — texte affiché, consigne expliquée en français, pas de TTS ni de STT ». **27 valeurs distinctes dans les fichiers**, toutes retrouvées mot pour mot dans la source par le contrôle. Les intertitres qui courent sur plusieurs lignes sont recollés |
| `segment_de_cle` | 43 | Là où l'intertitre du marketing est générique (« États d'erreur », 22 lignes) ou absent, la condition met en phrase **l'état que la clé nomme déjà** : `camera_refusee` → « l'accès à l'appareil photo est refusé ». La table des 26 segments est **publiée dans les deux fichiers** (`regles.conditions_par_segment`), l'appariement se fait par **segments exacts**, et le générateur échoue si deux segments apparient la même clé |
| `definie_ici` | 22 | Les 9 observations du résumé parent, et 13 clés dont **aucune convention de nommage** ne dit la condition |
| **Total** | **137 / 288** | |

Chaque entrée porte désormais `condition_source`, pour qu'un lecteur sache si la
condition vient de la source ou de ce livrable. Le contrôle 5 bis vérifie qu'il
ne reste **aucune entrée à marqueur d'état sans condition** : 0 sur les 98 qui
en portent un, la liste des 27 marqueurs étant imprimée à côté du chiffre. Les 19
entrées citées par les deux tours de contrôle sont toutes traitées.

**Les paires mutuellement exclusives sont dites dans le fichier, pas dans le
rapport.** Chaque entrée porte `exclusif_avec`, généré depuis une liste de
groupes, donc réciproque par construction à l'intérieur des fichiers UI.
21 entrées en portent une, pour 33 liens :

| Paire | Conditions écrites |
| --- | --- |
| `parent.apercu.resume` / `.resume_une` | « deux étapes sont programmées » / « une seule étape est programmée » |
| `enfant.programme.corps.lecture_maths` / `.maths_lecture` | « la lecture est programmée avant les maths » / l'inverse |
| `lecture.intro.titre.premier` / `.apres`, `maths.intro.titre.premier` / `.apres` | « première étape du soir » / « vient après une autre étape » |
| `coffre.palier.reste` / `.atteint`, `coffre.cosmetiques.verrouille` / `.debloque` | palier non atteint / atteint, cosmétique verrouillé / débloqué |
| `parent.resume.etape_faite` / `.etape_passee` | « l'étape a été terminée » / « l'étape a été passée » |
| `enfant.programme.une.titre` / `enfant.programme.titre` | la sœur vit dans `encouragements.json`, et le fichier le dit |

Je n'ai pas rejoué mon argument de §2 sur le champ `etat`, comme vous me l'avez
demandé : il était bon pour sa question et ne couvrait pas celle-ci.

## Les quatre [MINEUR]

| # | Constat | Sort |
| --- | --- | --- |
| 2 | Quatre accords de genre, pas un | **Corrigé en amont et répercuté ici.** `produit-marketing` a corrigé les quatre textes ; j'ai surtout changé la mécanique : les 9 observations ne sont plus recopiées dans mon générateur, elles sont **extraites de la table 7.12** comme les 279 autres. Une correction de la source se propage désormais par simple régénération, sans ressaisie. Mon fichier porte « {prenom} a fait une pause, puis a repris la séance. » et « Pilou a donné des indices, jamais les réponses. » |
| 3 | `parent.apercu.resume` fige étapes, ordre et durée | **Non repris, transmis.** Le texte est verbatim dans le marketing, qui en est propriétaire, et mon mandat de ce tour se limite aux deux fichiers `ui-*.json`. J'ai fait ce qui relève de moi : la paire porte une condition explicite et une exclusivité déclarée, donc le défaut ne peut plus produire un écran faux en silence. Pour `BACKLOG-V2.md` si `produit-marketing` ne le reprend pas |
| 4 | Six jetons déclarés jamais employés côté enfant | **Corrigé.** `jetons_connus` est désormais **calculé** à partir des jetons réellement employés par chaque fichier : `ui-enfant` déclare `{n}` et rien d'autre, `ui-parent` en déclare 7 et les emploie tous. Le contrôle 5 quater compare déclarés et employés à chaque exécution |
| 5 | Le rôle `texte` attribué à des commandes | **Corrigé, par les deux voies que vous proposiez.** Ajout du rôle `action`, attribué par une liste publiée de verbes d'action en dernier segment : 23 entrées, dont « Tout supprimer », « Supprimer ce palier », « Réécouter », « Je ne sais pas ». Et la valeur de repli s'appelle maintenant `indetermine` et non `texte`, pour qu'aucun composant ne la rende en corps de texte par défaut. Rôles : `bouton` 62, `indetermine` 111, `corps` 42, `titre` 39, `action` 23, `aide` 9, `valeur` 2 |

## ARB-14, tombé pendant ce tour

« Un jeton emporte son genre, son nombre et son article. » Le contrôle
5 quinquies applique un instrument en deux versions :

- **version large** : toute préposition collée à gauche d'un jeton, et tout mot
  accordé suivant un jeton. Elle signale 16 entrées ;
- **version retenue** : la préposition ne compte que devant un jeton **qui porte
  son article**, soit `{matiere}` — « à {prenom} » et « d'{prenom} » sont
  corrects, un prénom n'a pas d'article ; et l'accord ne compte que s'il est
  attribut du sujet ou participe avec COD antéposé — « a buté », « a demandé »
  sont invariables. Elle signale 1 entrée, `notif.resume.titre`, dont le verdict
  manuel est imprimé : « La séance d'{prenom} **est terminée** » s'accorde avec
  « la séance », pas avec le jeton. Correct.

Les deux versions et le motif du resserrement sont imprimés à chaque exécution.
`parent.resume.etape_faite`, qui disait « {matiere} : terminée » — le cas
« nombre » d'ARB-14 — a été corrigé à la source et vaut maintenant
« {matiere} : c'est fait » dans mon fichier, par répercussion automatique.

---

# 0 bis. Reprise après verdict du tour 2

## [MAJEUR] 6 — l'appariement, et l'instrument qui ne l'a pas vu

Le constat est exact, et le plus grave des deux défauts n'est pas la condition
fausse : c'est que **mon contrôle imprimait la ligne absurde et concluait
`AUCUN PROBLEME`**. Une preuve verte produite par un instrument aveugle vaut
moins que pas de preuve du tout. J'ai relu la section « Corriger un instrument de
mesure » du protocole avant de reprendre.

**L'appariement.** `condition_de_cle` retenait la première entrée de table dont
le motif était une **sous-chaîne** de la clé : `bloque` capturait `debloque`.
Trois changements :

1. **appariement par segments exacts** : la clé est découpée sur les points, le
   motif aussi, et il faut une égalité de segments consécutifs. « bloque » ne
   peut plus apparier « debloque » ;
2. **plus aucune dépendance à l'ordre de la table** : le générateur collecte
   *toutes* les entrées qui apparient, et **échoue** si elles donnent deux
   conditions différentes. L'ordre ne porte donc plus de sens — la dépendance
   n'est pas documentée, elle est supprimée, comme vous le demandiez ;
3. `coffre.cosmetiques.debloque` porte désormais « le cosmétique est débloqué ».

**L'instrument.** Il ne se contente plus d'imprimer, il **re-dérive** :

| Contrôle ajouté | Résultat |
| --- | --- |
| Ré-implémentation indépendante de l'appariement, comparée à ce que porte le fichier | 43 conditions `segment_de_cle` re-dérivées à l'identique, **0 écart** |
| Clé appariant deux segments donnant des conditions différentes | **0** |
| Segment déclaré dans la table et jamais employé — le signal que vous relevez | **0** sur 26 |
| Condition `intertitre` retrouvée **mot pour mot** dans le marketing | **27 / 27** |
| Garde-fou sur la table 7.12 | 9 lignes dans la source, 9 clés créées ici |

**Ce que le nouvel instrument a trouvé à son premier passage**, et que je publie
parce que c'est le cœur du sujet : il a levé **deux drapeaux, tous deux dus à
lui-même**. Il comparait la condition nettoyée de ses marqueurs de gras à une
source qui les portait encore — 48 faux « intertitre introuvable » — et il
comptait `parent.resume.observation.titre`, une clé du marketing, parmi mes neuf
observations. Les deux sont corrigés, et l'instrument a **échoué** au lieu de
conclure vert : c'est exactement le comportement qui manquait au tour 2.

## Le garde-fou sur les ajouts

Vous avez raison : ma mécanique d'extraction est réelle pour les **corrections**
— les six textes corrigés à la source sont arrivés ici sans ressaisie, et le
septième l'a fait pendant ce tour même, `parent.apercu.resume` devenant
« 2 étapes ce soir : {matieres}. Environ {duree} min. » — mais elle était
**muette pour les ajouts**, la table 7.12 n'ayant aucune clé.

Le garde-fou est posé **des deux côtés** : le générateur **refuse de produire**
et le contrôle **échoue** si le nombre de lignes de la table 7.12 diffère du
nombre de clés `observation.*` créées ici. Un ajout de ligne ou un renommage de
libellé arrête la chaîne au lieu de passer inaperçu. J'ai ajouté le même réflexe
sur les jetons : un jeton employé par la source et non documenté fait échouer le
générateur avec un message explicite, au lieu de planter sur une clé manquante —
c'est ainsi que `{matieres}` a été vu et documenté dans le même passage.

## Les trois [MINEUR]

| # | Constat | Sort |
| --- | --- | --- |
| 7 | Quatre entrées non nominales sans condition, et la liste de marqueurs non publiée | **Corrigé.** `enfant.attente.pilou` reçoit son intertitre « Attente IA supérieure à 400 ms (TEC-12) » — l'ajout de « Attente IA » à la liste des intertitres conditionnels a suffi, l'information était bien là où ma méthode regarde ; `parent.resume.indispo.*` reçoivent le segment `indispo` ; `maths.indice.epuise` reçoit « les quatre indices ont été donnés (PED-02) », en `definie_ici`. **La liste des 27 marqueurs est désormais imprimée à côté du chiffre qu'elle fonde** : 98 entrées à marqueur, **0 sans condition** |
| 8 | « 27 intertitres distincts » annoncés, 26 réels | **Corrigé.** J'avais publié le nombre d'intertitres moissonnés dans le document, pas celui des valeurs présentes dans les fichiers. Le contrôle imprime désormais la grandeur qui décrit le fichier : « conditions distinctes d'origine intertitre : 27, pour 72 entrées », et vérifie chacune contre la source |
| 9 | `exclusif_avec` incomplet | **Corrigé sur les deux familles, et la règle publiée dit maintenant la vérité.** Le corps de `/enfant/programme` déclare ses **quatre** candidats, dont deux portés par `encouragements.json` ; les familles de boutons de `/enfant` (4 clés) et de `/enfant/programme` (2 clés) sont déclarées. 21 entrées, 33 liens. La règle ne dit plus « réciproque par construction » tout court, mais « réciproque par construction **à l'intérieur des deux fichiers ui-\*** », et nomme le cas unidirectionnel |

## Le [MINEUR] 3 du tour 1

Vous l'avez tranché et confié à `produit-marketing` : il est corrigé à la source
pendant ce tour, et **arrivé ici par régénération**, jetons `{matieres}` et
`{duree}` compris. Je garde la condition et l'exclusivité de la paire, comme
demandé. Je retiens la remarque du contrôleur sur « à verser au backlog si » :
c'est la formule par laquelle un défaut disparaît, et je ne la réemploierai pas
sans nommer qui reprend le défaut et quand.

---

# 0 ter. Réserve du tour 3

`VERDICT: PASS_AVEC_RESERVES` — 0 [BLOQUANT], 0 [MAJEUR], 1 [MINEUR], aucun écart
sur 24 grandeurs. La réserve est levée.

**La règle d'appariement est désormais dans les deux fichiers**, sous
`regles.appariement_des_segments`, juste au-dessus de la table qu'elle consomme.
Elle est écrite pour quelqu'un qui modifiera la table sans avoir lu ce fil :

> Comment un motif de `conditions_par_segment` s'apparie à une clé, avant d'en
> modifier la table. La clé est découpée sur les points, le motif aussi ; il y a
> appariement quand les segments du motif se retrouvent tels quels et consécutifs
> parmi ceux de la clé. Un segment se compare **en entier, jamais en
> sous-chaîne** : « bloque » apparie `reglages.code.bloque.titre` et n'apparie
> **pas** `coffre.cosmetiques.debloque`. L'ordre des segments **dans** un motif
> compte : « paliers.vide » apparie `reglages.paliers.vide` et n'apparie pas
> `reglages.vide.paliers`. L'ordre des **entrées** de la table n'a en revanche
> aucun effet : le générateur collecte tous les motifs qui apparient et, s'ils
> donnent deux conditions différentes, il échoue au lieu de trancher en silence —
> ajouter un motif qui en recouvre un autre arrête donc la production au lieu de
> produire une condition fausse. Enfin, tout motif déclaré ici doit être employé
> par au moins une clé : un motif inemployé signale qu'il est masqué par un autre
> ou devenu obsolète, et le contrôle le refuse.

C'est la même leçon qu'au tour 1 sur la `note` de `cloture` : ce qui n'est écrit
que dans un rapport n'existe pas pour celui qui lit le fichier. La table a
d'ailleurs changé de taille deux fois — 25 puis 26 segments — sans que sa règle
de lecture soit écrite nulle part.

## Ce que je retiens du contre-test du contrôleur

Deux choses que je n'avais pas vues et que j'inscris ici pour la suite :

1. **Ma réparation supprimait cinq collisions latentes, pas une.**
   `camera_refusee` contre `refuse` en cachait trois de plus, qui ne rendaient le
   bon résultat que par l'ordre de la table. Un défaut visible en cachait quatre
   invisibles, tous du même mécanisme.
2. **Une re-dérivation ne peut pas attraper une règle fausse.** Mon contrôle
   re-dérive les conditions avec une implémentation indépendante, mais il partage
   la table et la règle : au tour 2, deux implémentations de « première
   sous-chaîne » auraient été parfaitement d'accord sur la même erreur. Ce qui
   aurait sauvé ce tour-là, c'est l'invariant « 0 segment déclaré inemployé »,
   puisque le bon segment était masqué donc inutilisé. **Préférer un invariant à
   une re-dérivation chaque fois que les deux sont possibles** — la règle est
   désormais au protocole, et mes contrôles portent les deux.

---

# 1. Ce que portent les deux fichiers neufs, et ce qu'ils ne portent pas

La frontière est la même dans les quatre fichiers, et elle est écrite dans
chacun d'eux (`regles.perimetre`) :

| Fichier | Contenu | Critère |
| --- | --- | --- |
| `ui-enfant.json`, `ui-parent.json` | Titres, libellés de bouton, étiquettes, états vides, messages d'état | Le texte est **le même à chaque affichage** |
| `encouragements.json` | Les paroles de Pilou qui changent d'un soir à l'autre | Le texte est **tiré au sort** dans une banque de 20 |
| `gwenn-scripts.json` | Onboarding et rituel de fermeture | Le texte est **fixe et joué dans un ordre imposé** |

**Règle de propriété, nouvelle et opposable** : une clé d'écran a **exactement un
fichier propriétaire**, celui qui porte son texte. Elle peut être *mentionnée*
ailleurs — `cles_fixes_non_variees` de `encouragements.json` dit ce que la banque
ne fait pas varier — mais une mention n'est pas une propriété. Le contrôle 2
compte les propriétaires, pas les mentions : 0 clé en porte deux.

Cette distinction est écrite dans les fichiers eux-mêmes
(`proprietaire_des_textes` dans la banque, `regles.propriete_des_cles` dans les
deux fichiers neufs). C'est la leçon du constat 1 du tour 1 : une note juste à
côté d'une déclaration fausse ne protège personne.

**Les textes ne sont pas ressaisis.** Ils sont extraits des tables du livrable
marketing par le générateur, et le contrôle 4 recompare chaque entrée à sa
source : 288 entrées comparées, **0 écart**. Une faute de frappe dans un texte
destiné à un enfant qui apprend à lire n'aurait aucune excuse.

---

# 2. Schéma des `ui-*.json`

Même forme que les deux fichiers existants : une table indexée par clé, pour un
accès direct en TypeScript.

```
{
  "schema": "tipi.ui-enfant.v1",
  "version": "1.0.0",
  "public": "enfant",
  "canaux": ["tts", "affiche", "les_deux"],
  "jetons_connus": { "{n}": "..." },
  "regles": { "perimetre": "...", "propriete_des_cles": "...", "role": "...",
              "condition": "...", "conditions_par_segment": [...],
              "exclusif_avec": "..." },
  "textes": {
    "lecture.micro_absent.corps": {
      "id": "lecture.micro_absent.corps",
      "ecran": "/enfant/session/lecture",
      "texte": "Le micro ne marche pas ce soir.",
      "canal": "les_deux",
      "role": "corps",
      "jetons": [],
      "condition": "État d'erreur — micro refusé ou indisponible",
      "condition_source": "intertitre",
      "exclusif_avec": []
    }
  }
}
```

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | `string` | Identique à la clé d'indexation. C'est la clé du marketing, jamais renommée |
| `ecran` | `string` | Route de la section 3.1 où le texte s'affiche |
| `texte` | `string` | Le texte, extrait du marketing mot pour mot |
| `canal` | `"tts" \| "affiche" \| "les_deux"` | Vocabulaire d'ARB-02, le même que dans les deux autres fichiers |
| `role` | `"titre" \| "corps" \| "bouton" \| "action" \| "aide" \| "valeur" \| "indetermine"` | Dérivé par **règle mécanique publiée**, sans rien deviner. Le repli s'appelle `indetermine` |
| `jetons` | `string[]` | Jetons présents dans `texte`, recalculés et contrôlés contre le texte |
| `condition` | `string \| null` | `null` dans le cas nominal. Sinon la condition d'affichage en clair |
| `condition_source` | `"intertitre" \| "segment_de_cle" \| "definie_ici" \| null` | D'où vient la condition, pour qu'un lecteur sache ce qui est repris de la source et ce qui est écrit ici |
| `exclusif_avec` | `string[]` | Clés décrivant le même emplacement d'écran et qui ne peuvent pas s'afficher ensemble. Réciproque par construction |

**Sur le champ `role`** : sept valeurs, chacune déclenchée par un segment
explicite de la clé ou par la forme du texte — jamais par une supposition. Un
dernier segment commençant par « bouton » donne `bouton` ; un verbe d'action de
la liste publiée donne `action` ; « titre » donne `titre` ; un segment finissant
par « aide » donne `aide` ; un segment commençant par « corps » donne `corps` ;
un texte réduit à un jeton donne `valeur` ; le reste donne `indetermine`. Le
repli ne s'appelle plus `texte` : un composant qui lit `indetermine` sait qu'il
n'a pas l'information, là où `texte` l'invitait à rendre du corps de texte.

**Sur le champ `condition`** : il dit la vérité sur les 288 entrées, et son
contenu est **récupéré** de la source dans 115 cas sur 137 — intertitre du
marketing, ou état que la clé nomme elle-même via une table de segments publiée
dans le fichier. Les 22 restants sont écrits ici et marqués comme tels.

**Toujours aucun champ `etat`.** L'état reste lisible dans la clé
(`*.vide.*`, `*.souci.*`) et dans `condition` ; un troisième emplacement pour la
même information serait une source de divergence de plus.

---

# 3. Répartition enfant / parent

Séparation stricte, par préfixe de clé : `parent.`, `reglages.` et `notif.` vont
dans `ui-parent.json`, tout le reste dans `ui-enfant.json`.

| `ui-enfant.json` | Entrées | | `ui-parent.json` | Entrées |
| --- | --- | --- | --- | --- |
| `/enfant` | 5 | | `/parent` | 31 |
| `/enfant/programme` | 10 | | `/parent/programme` | 28 |
| `/enfant/session/lecture` | 40 | | `/parent/resume` | 23 |
| `/enfant/session/maths` | 23 | | `/reglages/code` | 19 |
| `/enfant/pause` | 4 | | `/reglages` | 82 |
| `/enfant/coffre` | 19 | | `notification` | 4 |
| **Total** | **101** | | **Total** | **187** |

**Un cas particulier, tranché et commenté dans le générateur** :
`parent.aiguillage.bandeau` est déclaré en section 7.1 (`/`), mais le marketing
précise que l'aiguillage bascule vers `/parent` et y pose ce bandeau. Il part
donc dans `ui-parent.json` avec `ecran: "/parent"`. C'est la seule entrée dont
l'écran ne se déduit pas du titre de sa section.

**Canal côté parent** : `affiche` pour les 187 entrées. Pilou ne parle jamais au
parent — PED-10 ne concerne que l'enfant, et le marketing ne déclare aucun mode
sur les tables parent. C'est écrit dans `regles.canal` du fichier.

**Canal côté enfant** : repris tel quel du marketing, 54 en `les_deux` et 47 en
`affiche`. Les 47 sont des libellés de bouton et des valeurs, jamais une
information nécessaire à l'action.

---

# 4. Les neuf clés que j'ai créées

Le marketing donne les **observations types** du résumé parent (section 7.12)
sous forme de tableau « Situation | Texte », **sans clé nommée**. Neuf textes
destinés à un utilisateur, qu'aucun fichier de contenu ne portait : `dev-feature`
les aurait écrits en dur, ce qu'ARB-10 vise précisément à éviter. Je leur ai donc
donné des clés, ce qui est le travail éditorial que cet arbitrage me confie.

| Clé | Condition d'affichage |
| --- | --- |
| `parent.resume.observation.lecture_fluide` | la lecture s'est faite sans hésitation marquée |
| `parent.resume.observation.hesitations` | au moins un mot a demandé une reprise |
| `parent.resume.observation.maths_indices` | au moins un indice a été demandé |
| `parent.resume.observation.maths_sans_indice` | aucun indice demandé |
| `parent.resume.observation.pause` | au moins une pause prise, et la session a repris |
| `parent.resume.observation.blocage` | blocage détecté selon PED-08 |
| `parent.resume.observation.soir_leger` | Soir léger activé par le parent |
| `parent.resume.observation.breton` | un exercice en breton était au programme |
| `parent.resume.observation.arret_avant_fin` | **la séance s'est terminée avant la dernière étape, que l'arrêt vienne du parent (PRD-13) ou d'une clôture automatique** |

**La dernière applique votre consigne à la lettre : condition élargie, texte
inchangé.** La phrase « La séance a été arrêtée avant la fin. Les pierres
acquises sont conservées. » est exacte dans les deux cas ; seule l'étiquette
« Session arrêtée par le parent » était trop étroite d'un cas. Le texte est
repris mot pour mot, c'est le nom de la clé et sa `condition` qui portent
l'élargissement. Aucun texte nouveau n'a été inventé pour la clôture automatique.

---

# 5. Tâche B — retrait des six clés mortes (ARB-12)

ARB-08 pose qu'une étape vide n'est jamais créée. Les six clés `lecture.vide.*`
et `maths.vide.*` n'avaient donc plus de déclencheur.

| Fichier | Emplacements traités |
| --- | --- |
| `docs/agents/P1/produit-marketing.out.md` | **3** : la table de sélection de la section 7.0 (2 lignes retirées), l'état vide de 7.5 et l'état vide de 7.6 (tables remplacées par la règle ARB-08) |
| `content/encouragements.json` | **1** : `lecture.vide.corps` et `maths.vide.corps` retirées du cinquième groupe de `cles_fixes_non_variees`, avec le motif du retrait inscrit dans le groupe |
| `content/ui-enfant.json` | **0 par construction** : le fichier est généré depuis le marketing nettoyé, les six clés n'y sont jamais entrées |

Les deux blocs du marketing ne sont pas seulement supprimés : ils sont
**remplacés par la règle qui les tue**, pour qu'un lecteur qui cherche « et si
une étape est vide ? » trouve la réponse et non un trou.

> **État vide** : **sans objet, et sans texte.** ARB-08 pose qu'une étape sans
> exercice exploitable n'est jamais créée : l'analyse l'écarte et la soirée en
> compte une de moins. […] Les clés `lecture.vide.*` sont retirées (ARB-12) : un
> texte sans déclencheur finit toujours par être recâblé sur un écran.

Le contrôle 3 vérifie les six clés dans les trois fichiers : **absentes
partout**. Les deux mentions restantes dans le marketing sont les phrases
ci-dessus, qui tracent le retrait : un écart tracé n'est pas un écart.

**Le cas « pas de maths ce soir » reste couvert**, et je l'ai écrit dans le
marketing à l'endroit du retrait : la soirée compte une seule étape, emprunte
`enfant.programme.une.corps.*` — la banque de 20 variantes d'ARB-06 — puis passe
à la clôture par `session.fin_travail.corps`.

---

# 6. ARB-13 — le barème et les textes

Règle opposable : **une soirée complète vaut toujours 3 pierres**, quel que soit
le nombre d'étapes. La pierre récompense le fait de venir et de finir, jamais le
volume de travail.

**Aucun texte des quatre fichiers n'énonce de barème**, et c'est la bonne façon
de respecter ARB-13 : ni l'enfant ni le parent ne se voient expliquer un calcul.
Le contrôle 8 le vérifie sur les 767 textes des quatre fichiers.

- Côté enfant : « Tu as gagné des pierres. » (rituel), « Tu gagnes des pierres.
  Elles restent à toi. » (onboarding). Aucun nombre, aucune contrepartie.
- Côté parent : « Les pierres de ce soir sont dans le coffre. » Aucun nombre.
- Les trois seuls nombres montrés à l'enfant sont des inventaires du coffre
  (`coffre.solde.valeur`, `coffre.palier.reste`, `coffre.cosmetiques.verrouille`),
  jamais un gain du soir.

**Conséquence vérifiée pour ARB-06** : rien ne permet à l'enfant de constater
qu'un Soir léger rapporte autant qu'une soirée à deux étapes — parce que rien ne
lui dit jamais combien rapporte une étape.

---

# 7. Contrôles mécaniques et sorties réelles

## 7.1 Validité JSON des quatre fichiers

```
content/ui-enfant.json : JSON VALIDE, schema=tipi.ui-enfant.v1, entrees=101
content/ui-parent.json : JSON VALIDE, schema=tipi.ui-parent.v1, entrees=187
content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v2, entrees=460
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v2, entrees=19
regle d_appariement publiee dans les deux fichiers : true
table de segments publiee : 26 entrees
conditions renseignees : 137 / 288
---exit:0---
```

## 7.2 Couverture, propriété, conditions, fidélité, charte

Le script est conservé hors du dépôt. Il vérifie : que chaque clé du marketing a
un fichier propriétaire ; qu'aucune n'en a deux ; que les six clés mortes ont
disparu des trois fichiers ; **qu'aucune entrée à marqueur d'état n'est sans
condition, la liste des marqueurs étant imprimée avec le chiffre** ; **que les
conditions tirées d'un segment sont re-dérivables par une implémentation
indépendante, qu'aucun segment n'est ambigu et qu'aucun segment déclaré ne reste
inemployé** ; que chaque condition d'origine `intertitre` existe mot pour mot
dans le marketing ; **le garde-fou sur la table 7.12** ; que les exclusivités
sont réciproques dans les fichiers UI ; que les jetons déclarés sont ceux
employés ; que chaque texte est identique à sa source ; la forme des entrées, les
canaux, les rôles ; la charte sur les textes enfant ; ARB-14 ; les emoji et le
prénom en dur ; et ARB-13.

```
========================================================================
1. COUVERTURE : chaque cle du marketing a un fichier proprietaire
========================================================================
cles UI declarees par le marketing : 333
cles portees par un fichier de content/ : 333
cles ORPHELINES (aucun fichier) : 0

========================================================================
2. PROPRIETE UNIQUE : aucune cle declaree deux fois
========================================================================
cles portees par plus d'un fichier : 0
cles portees par content/ mais absentes du marketing : 9
   HORS SOURCE parent.resume.observation.lecture_fluide -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.hesitations -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.maths_indices -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.maths_sans_indice -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.pause -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.blocage -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.soir_leger -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.breton -> ['ui-parent.json']
   HORS SOURCE parent.resume.observation.arret_avant_fin -> ['ui-parent.json']
   (les 9 observations du resume parent sont creees par ce livrable :
    le marketing les donne en texte, sans cle nommee)

========================================================================
3. ARB-12 : les six cles mortes ont disparu des trois fichiers
========================================================================
   lecture.vide.corps           marketing:False  content:False  cles_fixes:False
   lecture.vide.corps_2.suite   marketing:False  content:False  cles_fixes:False
   lecture.vide.corps_2.fin     marketing:False  content:False  cles_fixes:False
   maths.vide.corps             marketing:False  content:False  cles_fixes:False
   maths.vide.corps_2.suite     marketing:False  content:False  cles_fixes:False
   maths.vide.corps_2.fin       marketing:False  content:False  cles_fixes:False
mentions restantes de « lecture.vide.* » / « maths.vide.* » dans le marketing : 2
  (ce sont les traces du retrait, volontaires : un ecart trace n'est pas un ecart)

========================================================================
4. FIDELITE : le texte de content/ est celui du marketing
========================================================================
entrees comparees : 288, ecarts : 0

========================================================================
5. SCHEMA DES DEUX FICHIERS UI
========================================================================
ui-enfant.json   101 entrees, 64 avec condition, canaux {'affiche': 47, 'les_deux': 54}, roles {'bouton': 38, 'indetermine': 33, 'titre': 7, 'corps': 19, 'action': 3, 'valeur': 1}
                 ecrans : {'/enfant': 5, '/enfant/programme': 10, '/enfant/session/lecture': 40, '/enfant/session/maths': 23, '/enfant/pause': 4, '/enfant/coffre': 19}
ui-parent.json   187 entrees, 73 avec condition, canaux {'affiche': 187}, roles {'indetermine': 78, 'titre': 32, 'corps': 23, 'bouton': 24, 'action': 20, 'aide': 9, 'valeur': 1}
                 ecrans : {'/parent': 31, '/parent/programme': 28, '/parent/resume': 23, '/reglages/code': 19, '/reglages': 82, 'notification': 4}

========================================================================
5 bis. [MAJEUR] 1 et 6 — le champ condition, et l'instrument qui le controle
========================================================================
liste de marqueurs employee (publiee avec le chiffre) : vide, souci, echec, illisible, absent, sans_, refus, expiree, breton, reprise, plus_tard, actif, regroupe, reporte, verrouille, atteint, bloque, pas_entendu, discordance, avert, sans_voix, sans_indice, camera_, basse_energie, attente, epuise, indispo
entrees portant un marqueur d'etat : 98
entrees avec une condition : 137 / 288
origine : {'intertitre': 72, 'definie_ici': 22, 'segment_de_cle': 43}
conditions distinctes d'origine intertitre : 27, pour 72 entrees
entrees a marqueur d'etat SANS condition : 0
echantillon des controles (19 entrees) encore a null : 0

--- l'instrument re-derive au lieu de se contenter d'imprimer ---
table de segments publiee dans le fichier : 26 entrees
conditions d'origine segment_de_cle re-derivees a l'identique : 43, ecarts : 0
cles appariant deux segments differents : 0
segments declares JAMAIS employes : 0 
conditions d'origine intertitre retrouvees mot pour mot dans le marketing : 27 / 27
garde-fou 7.12 : 9 lignes dans la source, 9 cles observation.* ici

========================================================================
5 ter. EXCLUSIVITE MUTUELLE DECLAREE DANS LE FICHIER
========================================================================
entrees portant une exclusivite : 21, liens : 33
   enfant.accueil.bouton                      exclusif avec enfant.accueil.reprise.bouton, enfant.accueil.vide.bouton, enfant.accueil.souci.bouton
   enfant.accueil.reprise.bouton              exclusif avec enfant.accueil.bouton, enfant.accueil.vide.bouton, enfant.accueil.souci.bouton
   enfant.accueil.vide.bouton                 exclusif avec enfant.accueil.bouton, enfant.accueil.reprise.bouton, enfant.accueil.souci.bouton
   enfant.accueil.souci.bouton                exclusif avec enfant.accueil.bouton, enfant.accueil.reprise.bouton, enfant.accueil.vide.bouton
   enfant.programme.corps.lecture_maths       exclusif avec enfant.programme.corps.maths_lecture, enfant.programme.une.corps.lecture, enfant.programme.une.corps.maths
   enfant.programme.corps.maths_lecture       exclusif avec enfant.programme.corps.lecture_maths, enfant.programme.une.corps.lecture, enfant.programme.une.corps.maths
   enfant.programme.bouton                    exclusif avec enfant.programme.une.bouton
   enfant.programme.une.titre                 exclusif avec enfant.programme.titre
   enfant.programme.une.bouton                exclusif avec enfant.programme.bouton
   lecture.intro.titre.premier                exclusif avec lecture.intro.titre.apres
   lecture.intro.titre.apres                  exclusif avec lecture.intro.titre.premier
   maths.intro.titre.premier                  exclusif avec maths.intro.titre.apres
   maths.intro.titre.apres                    exclusif avec maths.intro.titre.premier
   coffre.palier.reste                        exclusif avec coffre.palier.atteint
   coffre.cosmetiques.verrouille              exclusif avec coffre.cosmetiques.debloque
   coffre.palier.atteint                      exclusif avec coffre.palier.reste
   coffre.cosmetiques.debloque                exclusif avec coffre.cosmetiques.verrouille
   parent.apercu.resume                       exclusif avec parent.apercu.resume_une
   parent.apercu.resume_une                   exclusif avec parent.apercu.resume
   parent.resume.etape_faite                  exclusif avec parent.resume.etape_passee
   parent.resume.etape_passee                 exclusif avec parent.resume.etape_faite

========================================================================
5 quater. ROLES ET JETONS DECLARES
========================================================================
roles : {'bouton': 62, 'indetermine': 111, 'titre': 39, 'corps': 42, 'action': 23, 'valeur': 2, 'aide': 9}
commandes citees par le controle encore typees corps de texte : 0
ui-enfant.json   jetons declares ['{n}']
                 jetons employes ['{n}']
ui-parent.json   jetons declares ['{date}', '{duree}', '{liste}', '{matieres}', '{matiere}', '{n}', '{prenom}', '{version}']
                 jetons employes ['{date}', '{duree}', '{liste}', '{matieres}', '{matiere}', '{n}', '{prenom}', '{version}']

========================================================================
5 quinquies. ARB-14 — un jeton emporte son genre, son nombre et son article
========================================================================
instrument, version LARGE puis version RETENUE, sur les 288 entrees.
  (a) preposition contractante collee a gauche d'un jeton
  (b) jeton suivi, dans la meme phrase, d'un mot en -e/-ee/-es/-ees
  version LARGE   : (a) 12, (b) 4
     (a) parent.scan.sans_devoir.valider              Ouvrir Tipi à {prenom}
     (a) parent.apercu.passage_enfant                 Passez le téléphone à {prenom}. Pilou prend le relais.
     (a) parent.resume.titre                          La soirée d'{prenom}
     (a) reglages.code.creation.corps                 Ce code protège les réglages. Il n'est pas demandé à {prenom}.
     (a) reglages.code.sortie.titre                   Arrêter la session d'{prenom}
     (a) reglages.menu.enfant                         Profil d'{prenom}
     (a) reglages.enfant.titre                        Profil d'{prenom}
     (a) reglages.paliers.solde                       Pierres de {prenom} aujourd'hui : {n}
     (a) reglages.paliers.description_aide            Ce texte reste ici. Il n'est pas affiché à {prenom}.
     (a) reglages.donnees.ia                          Le texte des devoirs est analysé par un service d'intelligence artificielle. Le prénom d'{prenom} et les photos ne lui sont jamais envoyés.
     (a) reglages.codeparent.corps                    Le code protège les réglages. Il n'est jamais montré à {prenom}.
     (a) notif.resume.titre                           La séance d'{prenom} est terminée.
     (b) reglages.donnees.ia                          Le prénom d'{prenom} et les photos ne lui sont jamais envoyés  [envoyés]
     (b) notif.resume.titre                           La séance d'{prenom} est terminée  [terminée]
     (b) parent.resume.observation.hesitations        {prenom} a buté sur quelques mots  [buté]
     (b) parent.resume.observation.maths_indices      {prenom} a demandé de l'aide sur les maths  [demandé]
  resserrement, motive :
     (a) ne vaut que pour un jeton qui porte son article, soit {matiere}.
         « à {prenom} », « d'{prenom} » sont corrects : un prenom n'a pas d'article.
     (b) ne vaut que si le mot accorde est attribut du sujet (est/sont + participe)
         ou participe avec COD anteposé (l'a guidé) : « a buté », « a demandé »
         sont invariables avec avoir sans COD anteposé.
  version RETENUE : (a) 0, (b) 1
     (b) notif.resume.titre : La séance d'{prenom} est terminée
         verdict manuel : accord sur un nom du texte (la séance, le prénom et les photos), pas sur le jeton. Correct.

========================================================================
6. CHARTE SUR LES TEXTES ENFANT (ui-enfant.json)
========================================================================
entrees enfant : 101, phrase la plus longue : lecture.sans_voix.corps (10 mots) : Je ne peux pas lire à voix haute ce soir
depassements de 12 mots : 0

========================================================================
7. EMOJI, PRENOM EN DUR, CHIFFRES EN DUR — les quatre fichiers
========================================================================
encouragements.json      emoji 0, « Evan » en dur 0
gwenn-scripts.json       emoji 0, « Evan » en dur 0
ui-enfant.json           emoji 0, « Evan » en dur 0
ui-parent.json           emoji 0, « Evan » en dur 0

========================================================================
8. ARB-13 : aucun texte ne lie la quantite de travail aux pierres
========================================================================
regle LARGE (premiere version de l'instrument) : 1 texte(s) signale(s)
   [encouragements.json] << par étape >> : On déroule l'exercice ensemble, étape par étape.
      verifie a la main : parle des indices, pas des pierres. Faux positif.
regle RETENUE (quantite ET le mot pierre) : 0 texte(s) signale(s)
rappel ARB-13 : une soiree complete vaut toujours 3 pierres, quel que soit
le nombre d'etapes. Aucun texte enfant ou parent n'enonce de bareme.

========================================================================
RESULTAT : AUCUN PROBLEME
========================================================================
```

`exit: 0`.

## 7.3 Instruments publiés

Conformément à la règle inscrite au protocole après ma mission précédente, le
contrôle 8 publie **les deux versions de son détecteur ARB-13** :

- **règle large**, première version : tout motif de quantité ou d'étape. Elle
  signale 1 texte, « On déroule l'exercice ensemble, étape par étape. », qui est
  l'amorce de l'indice de niveau 4 et n'a aucun rapport avec les pierres ;
- **règle retenue** : un motif de quantité **et** le mot « pierre » dans le même
  texte. Elle signale 0 texte.

Le resserrement est motivé dans le code et son résultat d'origine est imprimé à
chaque exécution : un lecteur voit ce que l'ancienne version trouvait et pourquoi
elle se trompait, sans avoir à me croire sur parole.

---

# 8. Réserves et ce qui reste ouvert

1. **`parent.resume.observation.pause` porte un accord de genre** : « {prenom} a
   fait une pause. **Il est revenu** ensuite. » Le texte est repris mot pour mot
   du marketing, qui en est propriétaire, et mon mandat sur son livrable se
   limite aux trois emplacements des clés mortes. Je le signale sans le corriger :
   avec un deuxième enfant (PRD-02), la phrase devient fausse. Correction
   suggérée à `produit-marketing` : « {prenom} a fait une pause, puis a repris. »
2. **`reglages.*` compte 82 entrées sur un seul écran.** C'est le menu et ses
   sous-pages, tel que le marketing les décrit. Si le design system découpe les
   sous-pages en routes distinctes, le champ `ecran` de ces 82 entrées devra
   suivre. Rien à faire tant que P3 n'a pas tranché.
3. **Les 9 clés d'observation sont nommées par moi.** Si `produit-marketing` veut
   une autre nomenclature, elle se change dans un seul fichier.
4. **Visa `gardien-charte`** : les 101 textes enfant de `ui-enfant.json` sont des
   textes destinés à l'enfant, donc soumis à son avis avant d'être considérés
   comme livrés. Cet agent est producteur, il ne s'auto-valide pas.

---

## Note de procédure

Aucun commit git. Fichiers modifiés par cette mission :
`content/ui-enfant.json` et `content/ui-parent.json` (créés),
`content/encouragements.json` (retrait ARB-12 et déclaration de propriété),
`docs/agents/P1/produit-marketing.out.md` (trois emplacements des clés mortes,
seule modification autorisée par la mission), et le présent rapport.
