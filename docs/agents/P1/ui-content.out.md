# P1bis — Fichiers d'interface et retrait des clés mortes

Livrable de l'agent `contenu-enfant`, mission ARB-10 et ARB-12, après la
fermeture de G1. Sources : `docs/agents/P1/produit-marketing.out.md`,
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

1. Ce que portent les deux fichiers neufs, et ce qu'ils ne portent pas
2. Schéma des `ui-*.json`
3. Répartition enfant / parent
4. Les neuf clés que j'ai créées
5. Tâche B — retrait des six clés mortes
6. ARB-13 — le barème et les textes
7. Contrôles mécaniques et sorties réelles
8. Réserves et ce qui reste ouvert

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
  "jetons_connus": { "{prenom}": "...", "{n}": "...", ... },
  "regles": { "perimetre": "...", "propriete_des_cles": "...", "role": "...", ... },
  "textes": {
    "lecture.micro.consigne": {
      "id": "lecture.micro.consigne",
      "ecran": "/enfant/session/lecture",
      "texte": "Appuie sur le micro. Lis à voix haute.",
      "canal": "les_deux",
      "role": "texte",
      "jetons": [],
      "condition": null
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
| `role` | `"titre" \| "bouton" \| "aide" \| "texte"` | Dérivé par **règle mécanique**, publiée : dernier segment commençant par « bouton » donne `bouton`, « titre » donne `titre`, un segment finissant par « aide » donne `aide`, tout le reste donne `texte`, valeur neutre |
| `jetons` | `string[]` | Jetons présents dans `texte`, contrôlés contre le texte |
| `condition` | `string \| null` | `null` dans le cas nominal. Sinon la condition d'affichage en clair |

**Sur le champ `role`** : je ne dérive que ce que la clé énonce sans ambiguïté, et
tout le reste tombe sur `texte`. Un rôle deviné serait pire qu'un rôle absent :
le design system câblerait un libellé de bouton comme un titre sans que rien ne
proteste. La règle est dans le fichier, pas seulement ici.

**Aucun champ dérivé pour l'état.** Les états limites se lisent dans la clé
elle-même (`*.vide.*`, `*.souci.*`, `*.illisible.*`), qui est la convention du
marketing. Ajouter un champ `etat` calculé par heuristique aurait créé une
seconde source de vérité pour la même information.

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
---exit:0---
```

## 7.2 Couverture, propriété, fidélité, charte

Le script est conservé hors du dépôt. Il vérifie : que chaque clé du marketing a
un fichier propriétaire ; qu'aucune n'en a deux ; que les six clés mortes ont
disparu des trois fichiers ; que chaque texte de `content/` est **identique** à
sa source ; la forme des entrées, les canaux, les jetons ; la charte sur les
textes enfant ; les emoji et le prénom en dur dans les quatre fichiers ; et
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
ui-enfant.json   101 entrees, 0 avec condition, canaux {'affiche': 47, 'les_deux': 54}, roles {'bouton': 38, 'texte': 56, 'titre': 7}
                 ecrans : {'/enfant': 5, '/enfant/programme': 10, '/enfant/session/lecture': 40, '/enfant/session/maths': 23, '/enfant/pause': 4, '/enfant/coffre': 19}
ui-parent.json   187 entrees, 9 avec condition, canaux {'affiche': 187}, roles {'texte': 122, 'titre': 32, 'bouton': 24, 'aide': 9}
                 ecrans : {'/parent': 31, '/parent/programme': 28, '/parent/resume': 23, '/reglages/code': 19, '/reglages': 82, 'notification': 4}

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
