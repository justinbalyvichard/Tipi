# P1bis — Fichiers d'interface et retrait des clés mortes

Livrable de l'agent `contenu-enfant`, mission ARB-10 et ARB-12, après la
fermeture de G1. **Version 2 : reprise du `VERDICT: FAIL` du tour 1**
(1 [MAJEUR], 4 [MINEUR]), et application d'ARB-14. Sources : `docs/agents/P1/produit-marketing.out.md`,
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
| `intertitre` | 71 | Reprise **mot pour mot** de l'intertitre du marketing : « État d'erreur — micro refusé ou indisponible », « Variante de reprise (l'app a été fermée en cours de soirée, PRD-18) », « Cas breton (PED-13) — texte affiché, consigne expliquée en français, pas de TTS ni de STT ». 27 intertitres distincts, recollés quand ils courent sur plusieurs lignes |
| `segment_de_cle` | 41 | Là où l'intertitre du marketing est générique (« États d'erreur », 22 lignes) ou absent, la condition met en phrase **l'état que la clé nomme déjà** : `camera_refusee` → « l'accès à l'appareil photo est refusé ». La table des 25 segments est **publiée dans les deux fichiers** (`regles.conditions_par_segment`) |
| `definie_ici` | 21 | Les 9 observations du résumé parent, et 12 clés dont **aucune convention de nommage** ne dit la condition |
| **Total** | **133 / 288** | |

Chaque entrée porte désormais `condition_source`, pour qu'un lecteur sache si la
condition vient de la source ou de ce livrable. Le contrôle 5 bis vérifie qu'il
ne reste **aucune entrée à marqueur d'état sans condition** : 0, et les 15
entrées que vous citiez en exemple sont toutes traitées.

**Les paires mutuellement exclusives sont dites dans le fichier, pas dans le
rapport.** Chaque entrée porte `exclusif_avec`, généré depuis une liste de
groupes, donc réciproque par construction. 15 entrées en portent une :

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
contenu est **récupéré** de la source dans 112 cas sur 133 — intertitre du
marketing, ou état que la clé nomme elle-même via une table de segments publiée
dans le fichier. Les 21 restants sont écrits ici et marqués comme tels.

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
conditions renseignees : 133 / 288
origine : {"intertitre":71,"definie_ici":21,"segment_de_cle":41}
exclusivites declarees : 15
roles : {"bouton":62,"indetermine":111,"titre":39,"corps":42,"action":23,"valeur":2,"aide":9}
---exit:0---
```

## 7.2 Couverture, propriété, conditions, fidélité, charte

Le script est conservé hors du dépôt. Il vérifie : que chaque clé du marketing a
un fichier propriétaire ; qu'aucune n'en a deux ; que les six clés mortes ont
disparu des trois fichiers ; **que plus aucune entrée à marqueur d'état n'est
sans condition, et que les 15 entrées citées par le contrôle du tour 1 sont
traitées** ; que les exclusivités déclarées sont réciproques et pointent sur des
clés existantes ; que les jetons déclarés sont ceux employés ; que chaque texte
est **identique** à sa source ; la forme des entrées, les canaux, les rôles ; la
charte sur les textes enfant ; ARB-14 ; les emoji et le prénom en dur ; et
ARB-13.

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
ui-enfant.json   101 entrees, 62 avec condition, canaux {'affiche': 47, 'les_deux': 54}, roles {'bouton': 38, 'indetermine': 33, 'titre': 7, 'corps': 19, 'action': 3, 'valeur': 1}
                 ecrans : {'/enfant': 5, '/enfant/programme': 10, '/enfant/session/lecture': 40, '/enfant/session/maths': 23, '/enfant/pause': 4, '/enfant/coffre': 19}
ui-parent.json   187 entrees, 71 avec condition, canaux {'affiche': 187}, roles {'indetermine': 78, 'titre': 32, 'corps': 23, 'bouton': 24, 'action': 20, 'aide': 9, 'valeur': 1}
                 ecrans : {'/parent': 31, '/parent/programme': 28, '/parent/resume': 23, '/reglages/code': 19, '/reglages': 82, 'notification': 4}

========================================================================
5 bis. [MAJEUR] 1 — le champ condition
========================================================================
entrees avec une condition : 133 / 288
origine : {'intertitre': 71, 'definie_ici': 21, 'segment_de_cle': 41}
entrees a marqueur d'etat SANS condition : 0
echantillon du controle (15 entrees) encore a null : 0
exemples de conditions reprises de l'intertitre :
   enfant.accueil.reprise.bouton            Variante de reprise (l'app a été fermée en cours de soirée, PRD-18)
   enfant.accueil.vide.bouton               État vide — aucun devoir préparé ce soir (PRD-16)
   enfant.accueil.souci.bouton              État d'erreur — les devoirs n'ont pas pu être chargés
   enfant.programme.une.titre               Variante à une seule étape (une seule matière reconnue, matière retirée par le parent, ou mode basse énergie, PRD-04)
   enfant.programme.une.bouton              Variante à une seule étape (une seule matière reconnue, matière retirée par le parent, ou mode basse énergie, PRD-04)
   enfant.programme.souci.titre             État d'erreur — le programme n'a pas pu être lu
exemples de conditions tirees du segment de cle :
   coffre.cosmetiques.verrouille            le cosmétique n'est pas encore débloqué
   coffre.cosmetiques.debloque              la saisie est bloquée après cinq essais (SEC-02)
   coffre.cosmetiques.vide                  aucun cosmétique n'est disponible
   parent.scan.camera_refusee.titre         l'accès à l'appareil photo est refusé
   parent.scan.camera_refusee.corps         l'accès à l'appareil photo est refusé
   parent.scan.camera_refusee.bouton        l'accès à l'appareil photo est refusé

========================================================================
5 ter. EXCLUSIVITE MUTUELLE DECLAREE DANS LE FICHIER
========================================================================
entrees portant une exclusivite : 15, liens : 15
   enfant.programme.corps.lecture_maths       exclusif avec enfant.programme.corps.maths_lecture
   enfant.programme.corps.maths_lecture       exclusif avec enfant.programme.corps.lecture_maths
   enfant.programme.une.titre                 exclusif avec enfant.programme.titre
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
ui-parent.json   jetons declares ['{date}', '{duree}', '{liste}', '{matiere}', '{n}', '{prenom}', '{version}']
                 jetons employes ['{date}', '{duree}', '{liste}', '{matiere}', '{n}', '{prenom}', '{version}']

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
