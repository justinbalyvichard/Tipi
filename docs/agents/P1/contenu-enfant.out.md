# P1bis — Contenu enfant Tipi

Livrable de l'agent `contenu-enfant`. **Version 2, reprise après le
`VERDICT: FAIL` du 2026-09-20** (`docs/agents/P1/contenu-enfant.review.md`,
8 [MAJEUR], 5 [MINEUR], avis `gardien-charte` NON CONFORME sur ses points 1 et 7).

Sources : `TIPI-PROMPT-CURSOR.md` (1.3, 2.2, 3.4, 3.5), le verdict,
`docs/agents/P1/produit-marketing.out.md` **dans sa version corrigée**,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

| Fichier | Rôle | Volume |
| --- | --- | --- |
| `content/encouragements.json` | Banque de variantes par situation (PED-11) | 22 situations, 440 variantes, 660 parties |
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
| 1 | [MAJEUR] `cloture` déclarait `bravo.titre`, ligne invariante du rituel | `situations.cloture.cles_ui` ne contient plus qu'une clé : `transition.cloture.corps`. La banque `cloture` n'alimente **aucune** clé de `/enfant/bravo` | `encouragements.json` | Contrôle 11 : `cles_ui de cloture : ['transition.cloture.corps']` |
| 2 | [MAJEUR] 5 clés retirées par la correction du marketing | Toutes les `cles_ui` ont été refaites sur les clés réellement présentes dans le marketing corrigé. Les clés éclatées par ordre ou par matière sont soit utilisées telles quelles (`transition.felicitation.lecture`, `transition.annonce.maths`, et leurs miroirs), soit déclarées fixes (`lecture.intro.titre.premier/.apres`, `maths.intro.titre.premier/.apres`, `enfant.programme.corps.*`) | `encouragements.json` | Contrôle 6 : les 33 clés déclarées existent dans `produit-marketing.out.md`, à la seule exception de `transition.cloture.corps`, à créer |
| 3 | [MAJEUR] rien ne disait quelle clé une variante remplit | **Chaque variante porte `parties`** : une partie = un texte + la ou les clés qu'il remplit. Le `texte` de la variante est la jointure des parties, dans l'ordre. Les clés que la banque ne fait **pas** varier sont listées et motivées dans `cles_fixes_non_variees` | `encouragements.json` | Contrôle 6 : 660 parties, invariant `texte == jointure` vrai sur 440/440, 0 partie sans clé |
| 4 | [MAJEUR] `indice_demande` aplatissait l'échelle PED-02 | Éclatée en **4 situations de 20 variantes** : `indice_demande_1` à `_4`, une par niveau, chacune sur sa clé unique. Chaque banque reste dans le registre de son niveau | `encouragements.json` | Contrôle 9 : 20/20 dans le registre pour les 4 niveaux, 0 vocabulaire d'un autre niveau |
| 5 | [MAJEUR] `photo_illisible` : constats d'échec, sans issue | **Les 20 variantes sont réécrites.** Pilou est toujours en train de chercher ; aucune ne nomme la photo, l'image, la feuille, le cahier ni l'écriture ; chacune ouvre sur le coffre | `encouragements.json` | Contrôle 7 : 0/20 nomment le support, **20/20** offrent une sortie |
| 6 | [MAJEUR] `blocage` mélangeait panne de micro et difficulté d'exercice | Éclatée en `blocage_maths` (l'exercice résiste) et **`blocage_lecture`** (20 variantes neuves : la panne est du côté du micro et de l'écoute de Pilou, jamais de l'enfant) | `encouragements.json` | Contrôle 8 : 20/20 attribuent la panne au micro ou à Pilou, 0 parle de l'exercice |
| 7 | [MAJEUR] boutons du rituel inversés, identifiants inexistants | `bravo.bouton_principal` = « Aller jouer », ordre 8 ; `bravo.bouton_secondaire` = « Voir mon coffre », ordre 9. Le champ `role` porte la hiérarchie | `gwenn-scripts.json` | Contrôle 13 : `ordre 8 bravo.bouton_principal Aller jouer` |
| 8 | [MAJEUR] deux vocabulaires de canal non tranchés | **Tranché** : `tts` / `affiche` / `les_deux`, décision de l'Orchestrateur du 2026-09-20 inscrite dans le fichier (`regles.canal_decision`) avec la table de correspondance. Le marketing s'aligne, et l'a déjà fait : ses tables portent `les_deux` | les deux fichiers | Contrôle 4 : 459/459 canaux valides, 0 entrée sans canal |
| 9 | [MINEUR] `pas_de_devoirs` répétitive | 6 variantes réécrites en changeant l'angle (cartable fermé, coffre ouvert, leçon, temps libre, repos) | `encouragements.json` | Contrôle 10 : **0 paire au-dessus de 0,50** sur les 22 banques |
| 10 | [MINEUR] la banque `cloture` empruntait les mots du rituel | `cloture` 13, 16 et 18 réécrites. « Tu peux aller jouer » et « C'est fini » sont réservés au rituel | `encouragements.json` | Contrôle 11 : 0 emprunt |
| 11 | [MINEUR] un participe accordé au genre | `enc.reprise_session.01` : « On reprend **là où on en était**. » | `encouragements.json` | Contrôle 4 : 0 accord de genre sur 459 entrées |
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

## Sommaire

1. Schéma de `content/encouragements.json`
2. Décomposition en situations (arbitrage A de l'Orchestrateur)
3. Schéma de `content/gwenn-scripts.json`
4. Compte exact de variantes par situation
5. Contrôles mécaniques et sorties réelles
6. Couverture de PED-04, PED-05, PED-11, PED-12
7. Le jeton `{prenom}` et le multi-enfants (PRD-02)
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
  "canaux": ["tts", "affiche", "les_deux"],
  "regles": { ... },
  "correspondance_mission": { "accueil": ["accueil"], ... },
  "cles_fixes_non_variees": [ { "cles": [...], "motif": "..." } ],
  "statut_cles": { "transition.cloture.corps": "À créer côté marketing..." },
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
| `statut_cles` | racine | `Record<string,string>` | Clés déclarées qui restent à créer côté marketing |
| `situations` | racine | `Record<SituationId, Situation>` | Les 22 situations |
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
| `tts` | Lue par Pilou, non affichée | **Aucune entrée aujourd'hui.** La valeur reste déclarée pour un futur moment parlé sans texte à l'écran |
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
| annonce du programme | `annonce_programme` | 20 |
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
| `enfant.programme.une.corps.lecture`, `.maths` | Mode basse énergie : un seul message, texte fixe |
| `lecture.intro.titre.premier/.apres`, `maths.intro.titre.premier/.apres` | Portent la position de l'étape. La banque remplit le corps, pas le titre |
| `maths.demande_resultat.1` à `.4`, `maths.indice.epuise` | Refus de donner le résultat (PED-01) : formulations fixes, contrôlées une fois pour toutes |
| `bravo.*` | Rituel invariant (PED-12), dans `gwenn-scripts.json` |
| Tous les libellés de bouton | Un libellé d'action ne varie pas d'un soir à l'autre (DES-06) |

**Conséquence assumée et écrite** : PED-11 s'applique aux situations où Pilou
*parle* à l'enfant d'un soir sur l'autre. Une clé structurelle, un libellé
d'action ou un message d'état technique ne sont pas des situations : les faire
varier n'apporte rien à l'enfant et multiplierait les chemins à contrôler.
Si l'Orchestrateur juge que le mode basse énergie mérite sa propre banque, c'est
+40 variantes et une ligne de décision ; je ne l'ai pas prise seul.

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
| 19 | `cloture` | **20** | `transition.cloture.corps` (à créer) | les_deux |
| 20 | `pas_de_devoirs` | **20** | `enfant.accueil.vide.titre` + `.corps` | les_deux |
| 21 | `photo_illisible` | **20** | `enfant.accueil.souci.titre` + `.corps` | les_deux |
| 22 | `reprise_session` | **20** | `enfant.accueil.reprise.titre` + `.corps` | les_deux |
| | **Total** | **440** | 33 clés | |

**Diversité réelle** : les 440 variantes sont 440 textes distincts (459 avec les
rituels), et **aucune paire de variantes d'une même banque ne dépasse 0,50 de
recouvrement** (indice de Jaccard sur les mots pleins, la mesure même du
contrôleur). Le maximum constaté est de 0,50, sur cinq banques.

---

# 5. Contrôles mécaniques et sorties réelles

Deux commandes, rejouables telles quelles.

## 5.1 Validité JSON (`node`)

```
$ node -e "
const fs=require('fs');
for (const f of ['content/encouragements.json','content/gwenn-scripts.json']) {
  try { const d=JSON.parse(fs.readFileSync(f,'utf8'));
    console.log(f+' : JSON VALIDE, schema='+d.schema+', cles racine='+Object.keys(d).length+' -> '+Object.keys(d).join(','));
  } catch(e){ console.log(f+' : JSON INVALIDE -> '+e.message); process.exit(1); } }
const e=JSON.parse(fs.readFileSync('content/encouragements.json','utf8'));
console.log('situations : '+Object.keys(e.situations).length);
console.log('variantes  : '+Object.values(e.situations).reduce((a,s)=>a+s.variantes.length,0));
console.log('parties    : '+Object.values(e.situations).reduce((a,s)=>a+s.variantes.reduce((b,v)=>b+v.parties.length,0),0));
const g=JSON.parse(fs.readFileSync('content/gwenn-scripts.json','utf8'));
console.log('rituels    : '+Object.keys(g.rituels).join(', '));
console.log('lignes fixes : '+Object.values(g.rituels).reduce((a,r)=>a+r.ecrans.reduce((b,x)=>b+x.lignes.length,0),0));
"

content/encouragements.json : JSON VALIDE, schema=tipi.encouragements.v2, cles racine=10 -> schema,version,personnage,jeton_prenom,canaux,regles,correspondance_mission,cles_fixes_non_variees,statut_cles,situations
content/gwenn-scripts.json : JSON VALIDE, schema=tipi.gwenn-scripts.v2, cles racine=8 -> schema,version,personnage,note_nom_de_fichier,jeton_prenom,canaux,regles,rituels
situations : 22
variantes  : 440
parties    : 660
rituels    : onboarding, rituel_fermeture
lignes fixes : 19
---exit:0---
```

## 5.2 Contrôle de charte et de raccordement

Le script est conservé hors du dépôt (répertoire de travail de l'agent). Il
vérifie, sur **toutes** les entrées : comptes par situation ; couverture des 16
situations de la mission ; longueur de chaque phrase en comptage strict (une
élision compte pour deux mots) ; mots et fragments interdits ; accords de genre ;
emoji, chiffres, prénom en dur ; unicité des identifiants, des textes bruts et
des textes normalisés ; validité et présence du canal ; invariant
`texte == jointure des parties` ; **existence réelle de chaque clé déclarée dans
`produit-marketing.out.md`** ; les quatre contrôles dédiés aux constats 4, 5, 6,
9 et 10 ; hiérarchie des boutons du rituel.

```
======================================================================
1. COMPTE DE VARIANTES PAR SITUATION
======================================================================
accueil                           20 variantes   OK
annonce_programme                 20 variantes   OK
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
situations : 22    total variantes : 440

======================================================================
2. COUVERTURE DES 16 SITUATIONS DE LA MISSION
======================================================================
accueil                                -> accueil                                                      OK (min 20)
annonce du programme                   -> annonce_programme                                            OK (min 20)
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
entrees controlees : 459
phrases controlees : 822
phrase la plus longue : enc.blocage_lecture.05 (10 mots) : Je t'entends mal, et ce n'est pas toi
depassements : 0

======================================================================
4. INTERDITS, EMOJI, CHIFFRES, PRENOM EN DUR, ACCORD DE GENRE, CANAL
======================================================================
occurrences trouvees : 0

======================================================================
5. UNICITE DES IDENTIFIANTS ET DES TEXTES
======================================================================
identifiants : 459, doublons : aucun
textes       : 459, doublons : aucun
textes normalises : 459, doublons : aucun

======================================================================
6. RACCORDEMENT : PARTIES, INVARIANT DE TEXTE, EXISTENCE DES CLES
======================================================================
parties controlees : 660
invariant texte == jointure des parties : OK sur 440/440
cles UI declarees : 33, toutes presentes dans produit-marketing.out.md sauf : transition.cloture.corps
cles fixes non variees declarees : 8 groupes

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
indice_demande_1   variantes dans le registre du niveau : 20 / 20
indice_demande_2   variantes dans le registre du niveau : 20 / 20
indice_demande_3   variantes dans le registre du niveau : 20 / 20
indice_demande_4   variantes dans le registre du niveau : 20 / 20
aucune variante des 80 ne contient de resultat chiffre (controle 4 : 0 chiffre)

======================================================================
10. CONSTAT 9 — recouvrement interne des banques (Jaccard, mots pleins)
======================================================================
paires au-dessus de 0,50 : 0
  max 0.50  transition_lecture_vers_maths    ('enc.transition_lecture_vers_maths.05', 'enc.transition_lecture_vers_maths.10')
  max 0.50  retour_de_pause                  ('enc.retour_de_pause.14', 'enc.retour_de_pause.18')
  max 0.50  reprise_session                  ('enc.reprise_session.01', 'enc.reprise_session.13')
  max 0.50  photo_illisible                  ('enc.photo_illisible.01', 'enc.photo_illisible.12')
  max 0.50  indice_demande_4                 ('enc.indice_demande_4.06', 'enc.indice_demande_4.18')

======================================================================
11. CONSTAT 10 — la banque cloture n'emprunte pas les mots du rituel
======================================================================
emprunts aux phrases du rituel : 0
cles_ui de cloture : ['transition.cloture.corps']

======================================================================
12. REPARTITION DES CANAUX
======================================================================
tts           0 entrees
affiche      25 entrees
les_deux    434 entrees
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
RESULTAT : AUCUN PROBLEME
======================================================================
```

`exit: 0`.

## 5.3 Jeton `{prenom}`, phrases canoniques, absence de « Gwenn »

```
entrees avec {prenom} : 14
Counter({'accueil': 8, 'reprise_session': 5, 'rituel_fermeture': 1})

PRESENTE  'Bonsoir {prenom}. Je suis contente de te voir.'  ['enc.accueil.01']
PRESENTE  "Je lis d'abord. Tu écoutes."  ['enc.avant_lecture.01']
PRESENTE  "On regarde d'abord les objets."  ['enc.avant_maths.01']
PRESENTE  'On regarde ce mot ensemble ?'  ['enc.hesitation.01']
PRESENTE  "Celui-là est difficile. C'est normal."  ['enc.blocage_maths.01']
PRESENTE  'On souffle un peu, ou on passe à la suite ?'  ['enc.blocage_maths.01']
PRESENTE  "Le micro n'entend pas bien ce soir."  ['enc.blocage_lecture.01']
PRESENTE  'On fait une pause, ou on continue ?'  ['enc.blocage_lecture.01', 'enc.blocage_maths.03']
PRESENTE  "Bravo. Tu as lu jusqu'au bout."  ['enc.retour_apres_lecture.01']
PRESENTE  'Tu as bien cherché tes mots.'  ['enc.retour_apres_lecture.01']
PRESENTE  'Bravo. Tu as bien cherché.'  ['enc.reussite_maths.01']
PRESENTE  'Tu as trouvé ta façon de faire.'  ['enc.reussite_maths.01']
PRESENTE  "C'est fait. Tu as terminé la lecture."  ['enc.transition_lecture_vers_maths.01']
PRESENTE  'Maintenant, on passe aux maths.'  ['enc.transition_lecture_vers_maths.01']
PRESENTE  "C'est fait. Tu as terminé les maths."  ['enc.transition_maths_vers_lecture.01']
PRESENTE  'Maintenant, on passe à la lecture.'  ['enc.transition_maths_vers_lecture.01']
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

**Les 25 phrases canoniques du marketing sont présentes**, chacune en variante
01 de sa situation : la banque étend le texte validé, elle ne le remplace pas.

## 5.4 Deux points d'honnêteté sur les contrôles

1. **Mon détecteur d'accord de genre a produit deux faux positifs** au premier
   passage : « Ton tipi est prêt. » (accord sur *tipi*) et « Je ne suis pas
   encore prête. » (accord sur *Pilou*). J'ai restreint le détecteur aux motifs
   qui portent réellement sur l'enfant (« tu es prêt », « tout seul », « on
   s'était arrêtés »…). **Aucun texte n'a été modifié pour faire passer un
   contrôle** ; les deux phrases sont correctes pour un enfant de tout genre.
2. **Mon détecteur de niveau d'indice était incomplet** : il refusait « Voilà
   comment on peut s'y prendre. » (niveau 2) faute des radicaux « comment »,
   « moyen », « prendre », « demand », « chaque pas ». J'ai complété la liste des
   radicaux attendus. Les quatre textes concernés étaient bien dans le registre
   de leur niveau. En revanche les **huit** variantes qui dépassaient 0,50 de
   recouvrement ont bien été **réécrites**, pas neutralisées dans le contrôle.

---

# 6. Couverture de PED-04, PED-05, PED-11, PED-12

## 6.1 PED-04 — Jamais « c'est faux » ni équivalent

La notion de réponse fausse n'existe nulle part : 459 entrées, 0 occurrence de
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

22 situations, 20 variantes chacune, 440 au total, hors du code. Les 16
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
(`transition.cloture.corps`), et le rituel de `/enfant/bravo` ne varie jamais.
Aucune des 20 variantes n'emprunte les mots du rituel (contrôle 11 : 0 emprunt).

---

# 7. Le jeton `{prenom}` et le multi-enfants (PRD-02)

Le prénom n'est écrit en dur nulle part : 0 occurrence de « Evan » sur 459
entrées. 14 entrées portent `{prenom}` : 8 dans `accueil`, 5 dans
`reprise_session`, 1 dans le rituel de fermeture.

PRD-02 impose un profil pré-rempli en V1 mais un **schéma multi-enfants dès le
départ**. Un prénom gravé obligerait à réécrire la banque pour un deuxième
enfant. Mise en œuvre attendue :

- substitution au rendu depuis `child.prenom` lu en base ;
- substitution **avant** l'envoi au TTS, la clé de cache (TEC-09b) étant
  calculée sur le texte substitué ;
- aucun de ces textes n'est envoyé à un modèle d'IA (SEC-04).

Même raison pour les accords : **aucune variante ne contient d'adjectif ou de
participe accordé au genre de l'enfant** (contrôle 4, 0 occurrence). Les textes
restent justes pour un deuxième enfant, quel que soit son genre.

---

# 8. Écart de nommage `gwenn-scripts.json`

Le nom de fichier imposé par le prompt maître est conservé. Le personnage
s'appelle **Pilou** dans tous les textes : 0 occurrence de « Gwenn » dans les
459 entrées (contrôle 5.3). Le fichier porte un champ `note_nom_de_fichier` qui
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
| 9 | Volume | 440 variantes assumées. Aucune situation regroupée pour tenir le compte de 20 |

---

# 10. Ce qui reste ouvert

1. **`transition.cloture.corps` est à créer côté marketing.** C'est la clé
   d'écran que la banque `cloture` alimente. Elle est déclarée dans
   `statut_cles` et c'est la seule clé du livrable qui n'existe pas encore.
2. **Mode basse énergie** : `enfant.programme.une.corps.lecture` et `.maths`
   restent des textes fixes. Leur donner une banque coûte +40 variantes ; la
   décision revient à l'Orchestrateur (section 2.2).
3. **Renommage de `gwenn-scripts.json`** en `pilou-scripts.json` : candidat
   `BACKLOG-V2.md`, hors périmètre.
4. **Cache TTS (TEC-09b)** : les 459 entrées sont des phrases récurrentes, donc
   toutes cachables. Les 14 entrées portant `{prenom}` doivent être cachées
   après substitution, une entrée de cache par prénom.
5. **Visa `gardien-charte`** : obligatoire avant de considérer ce contenu comme
   livré. Cet agent est producteur, il ne s'auto-valide pas.
6. **Lecture à voix haute** : les 440 variantes sont écrites pour l'oreille,
   pas encore entendues avec la voix Chirp3-HD retenue (point humain 5 de la
   section 8 du prompt maître).

---

## Note de procédure

Cet agent n'a effectué **aucun commit git**. Le commit `83073ad` qui contient la
version 1 des deux fichiers de contenu a été créé par l'Orchestrateur. La
version 2 est dans l'arbre de travail, non commitée, comme ce rapport.
