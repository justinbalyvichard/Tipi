# P1bis — Contenu enfant Tipi

Livrable de l'agent `contenu-enfant`. Sources : `TIPI-PROMPT-CURSOR.md` (sections
1.3, 2.2, 3.4, 3.5), `docs/agents/P1/produit-marketing.out.md`,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

Fichiers produits :

| Fichier | Rôle | Volume |
| --- | --- | --- |
| `content/encouragements.json` | Banque de variantes par situation (PED-11) | 16 situations, 320 variantes |
| `content/gwenn-scripts.json` | Répliques fixes des rituels (PRD-01, PED-12) | 2 rituels, 4 écrans, 19 lignes |
| `docs/agents/P1/contenu-enfant.out.md` | Le présent rapport | — |

Aucun emoji dans les fichiers ni dans ce rapport (DES-07). Tous les textes sont
destinés à l'enfant ; aucun n'est écrit en dur dans un composant
(`30-copy-enfant.mdc`).

---

## Sommaire

1. Schéma de `content/encouragements.json`
2. Schéma de `content/gwenn-scripts.json`
3. Compte exact de variantes par situation
4. Contrôles mécaniques et sorties réelles
5. Couverture de PED-04, PED-05, PED-11, PED-12
6. Le jeton `{prenom}` et le multi-enfants (PRD-02)
7. Écart de nommage : `gwenn-scripts.json` contre le personnage Pilou
8. Arbitrages tranchés dans ce livrable
9. Cohérence avec le livrable marketing
10. Ce qui reste ouvert

---

# 1. Schéma de `content/encouragements.json`

## 1.1 Structure

Le fichier est un objet unique. Les situations sont une **table indexée par
identifiant de situation**, pour une lecture directe en TypeScript
(`banque.situations["accueil"].variantes`), sans recherche dans un tableau.

```
{
  "schema": "tipi.encouragements.v1",
  "version": "1.0.0",
  "personnage": "Pilou",
  "jeton_prenom": "{prenom}",
  "canaux": ["tts", "affiche", "les_deux"],
  "regles": { ... },
  "situations": {
    "accueil": {
      "id": "accueil",
      "libelle": "Accueil du soir, Pilou salue l'enfant",
      "ecran": "/enfant",
      "cles_ui": ["enfant.accueil.titre", "enfant.accueil.corps"],
      "req": ["PED-11", "PED-05", "PED-10"],
      "note": "Jouée à l'ouverture de l'écran enfant, avant l'annonce du programme.",
      "variantes": [
        {
          "id": "enc.accueil.01",
          "texte": "Bonsoir {prenom}. Je suis contente de te voir.",
          "canal": "les_deux",
          "jetons": ["{prenom}"]
        }
      ]
    }
  }
}
```

## 1.2 Champs

| Champ | Niveau | Type | Rôle |
| --- | --- | --- | --- |
| `schema` | racine | `string` | Identifiant de format, pour un futur changement de structure |
| `version` | racine | `string` | Version du contenu, incrémentée à chaque révision de texte |
| `personnage` | racine | `string` | Toujours `"Pilou"` |
| `jeton_prenom` | racine | `string` | Le jeton substituable utilisé dans les textes |
| `canaux` | racine | `string[]` | Les trois valeurs autorisées de `canal` |
| `regles` | racine | `object` | Règles de rédaction et de sélection, lisibles par un contrôleur |
| `situations` | racine | `Record<SituationId, Situation>` | Les 16 situations |
| `id` | situation | `string` | Identique à la clé. Stable, jamais renommé |
| `libelle` | situation | `string` | Intitulé humain, non affiché à l'enfant |
| `ecran` | situation | `string` | Route où la situation se joue (section 3.1 du prompt maître) |
| `cles_ui` | situation | `string[]` | Clés du livrable marketing que cette banque alimente |
| `req` | situation | `string[]` | Exigences couvertes |
| `note` | situation | `string` | Condition d'emploi, opposable en revue |
| `variantes` | situation | `Variante[]` | Au minimum 20 entrées |
| `id` | variante | `string` | **Identifiant stable** `enc.<situation>.<nn>` |
| `texte` | variante | `string` | La phrase, telle qu'elle est dite ou affichée |
| `canal` | variante | `"tts" \| "affiche" \| "les_deux"` | **Canal de diffusion** |
| `jetons` | variante | `string[]` | Jetons présents dans `texte`, vide si aucun |

## 1.3 Le canal de diffusion

| Valeur | Sens | Emploi |
| --- | --- | --- |
| `tts` | Lue par Pilou, non affichée | Pendant une micro-animation, quand l'écran ne porte pas de texte |
| `affiche` | Affichée seulement, Pilou se tait | Pendant que le micro est ouvert : la voix de Pilou couvrirait celle de l'enfant et polluerait la reconnaissance vocale |
| `les_deux` | Dite **et** affichée, mot pour mot | Cas par défaut, et cas obligatoire dès qu'une information est nécessaire à l'action (PED-10) |

Répartition réelle sur les 339 entrées des deux fichiers : `tts` 5,
`affiche` 15, `les_deux` 319.

Les 15 entrées `affiche` et les 5 entrées `tts` sont concentrées dans deux
situations, et chacune est justifiée dans le champ `note` de sa situation :

- `encouragement_lecture` — entrées 01 à 10 en `affiche` : elles s'affichent
  pendant que l'enfant lit dans le micro. L'identité sonore impose que la voix
  de Pilou n'entre jamais en concurrence avec autre chose ; ici elle n'entre pas
  en concurrence avec l'enfant lui-même. Les entrées 11 à 20 sont en `les_deux`,
  micro fermé.
- `transition_etapes` — entrées 01 à 05 en `tts` : elles sont dites pendant la
  micro-animation de transition (PRD-10), où l'écran ne porte aucun texte.

## 1.4 Consommation depuis TypeScript

Le fichier se type sans transformation :

```ts
type Canal = "tts" | "affiche" | "les_deux";

type Variante = {
  id: string;
  texte: string;
  canal: Canal;
  jetons: string[];
};

type Situation = {
  id: string;
  libelle: string;
  ecran: string;
  cles_ui: string[];
  req: string[];
  note: string;
  variantes: Variante[];
};

type Encouragements = {
  schema: "tipi.encouragements.v1";
  version: string;
  personnage: "Pilou";
  jeton_prenom: string;
  canaux: Canal[];
  regles: Record<string, unknown>;
  situations: Record<SituationId, Situation>;
};
```

`SituationId` est l'union des 16 clés listées en section 3. Règle de sélection
inscrite dans le fichier : tirage aléatoire **sans répétition immédiate** dans
`variantes`. Le `id` de la dernière variante jouée par situation est mémorisé
côté session, jamais un compteur visible par l'enfant.

---

# 2. Schéma de `content/gwenn-scripts.json`

## 2.1 Structure

Même vocabulaire que la banque (`id`, `texte`, `canal`), mais **aucune
variante** : ce sont des répliques fixes, jouées dans l'ordre.

```
{
  "schema": "tipi.gwenn-scripts.v1",
  "version": "1.0.0",
  "personnage": "Pilou",
  "note_nom_de_fichier": "...",
  "jeton_prenom": "{prenom}",
  "canaux": ["tts", "affiche", "les_deux"],
  "regles": { ... },
  "rituels": {
    "onboarding": {
      "id": "onboarding",
      "libelle": "Onboarding en 3 écrans",
      "route": "/bienvenue",
      "req": ["PRD-01", "PED-06", "PED-10", "PRD-12", "ETH-04"],
      "rejoue": "jamais",
      "note": "...",
      "ecrans": [
        {
          "id": "bienvenue_1",
          "ordre": 1,
          "libelle": "Qui est là",
          "lignes": [
            {
              "id": "bienvenue.1.titre",
              "ordre": 1,
              "role": "titre",
              "texte": "Bonjour, moi c'est Pilou.",
              "canal": "les_deux",
              "condition": null,
              "jetons": []
            }
          ]
        }
      ]
    },
    "rituel_fermeture": { "...": "même forme, invariant: true" }
  }
}
```

## 2.2 Champs propres aux rituels

| Champ | Niveau | Type | Rôle |
| --- | --- | --- | --- |
| `rituels` | racine | `Record<"onboarding" \| "rituel_fermeture", Rituel>` | Les deux rituels |
| `rejoue` | rituel | `string` | `"jamais"` pour l'onboarding (PRD-01), `"chaque soir, à l'identique"` pour la fermeture (PED-12) |
| `invariant` | rituel | `boolean` | Présent et `true` sur `rituel_fermeture` : aucune variante n'est autorisée |
| `ecrans` | rituel | `Ecran[]` | Ordonnés par `ordre` |
| `lignes` | écran | `Ligne[]` | Ordonnées par `ordre` |
| `role` | ligne | `"titre" \| "corps" \| "bouton"` | Place dans la maquette |
| `condition` | ligne | `string \| null` | `null` = toujours jouée. Sinon, nom de l'état applicatif qui la déclenche |

**Règle de lecture par le TTS**, inscrite dans le fichier : Pilou lit, dans
l'ordre de `ordre`, toutes les lignes dont le `canal` vaut `tts` ou `les_deux`
et dont la `condition` est remplie. Les boutons sont en `affiche` et ne sont
jamais lus.

## 2.3 Contenu livré

**Onboarding, 3 écrans, joué une seule fois à vie (PRD-01)** — textes repris
mot pour mot du livrable marketing (section 7.2), avec les clés d'origine.

| Écran | Clés | Texte |
| --- | --- | --- |
| 1 sur 3 | `bienvenue.1.titre`, `.corps`, `.bouton` | « Bonjour, moi c'est Pilou. » / « J'habite ici, dans le tipi. » / « Bonjour Pilou » |
| 2 sur 3 | `bienvenue.2.titre`, `.corps`, `.bouton` | « On fait les devoirs ensemble. » / « Deux choses par soir. Pas plus. » / « D'accord » |
| 3 sur 3 | `bienvenue.3.titre`, `.corps`, `.corps_2`, `.bouton` | « Tu peux t'arrêter quand tu veux. » / « Appuie sur la pause. Je t'attends. » / « Tu gagnes des pierres. Elles restent à toi. » / « On y va » |

**Rituel de fermeture, identique chaque soir (PED-12)** — un seul écran,
`/enfant/bravo`, `invariant: true`.

| Ordre | Clé | Texte | `condition` |
| --- | --- | --- | --- |
| 1 | `bravo.titre` | « Bravo {prenom}. » | `null` |
| 2 | `bravo.corps` | « Tu as fait tes devoirs ce soir. » | `null` |
| 3 | `bravo.pierres` | « Tu as gagné des pierres. » | `credit_pierres_ok` |
| 4 | `bravo.coffre` | « Je les range dans ton coffre. » | `credit_pierres_ok` |
| 5 | `bravo.pierres_plus_tard` | « Je range tes pierres un peu plus tard. » | `credit_pierres_differe` |
| 6 | `bravo.pierres_plus_tard_2` | « Elles sont à toi. Elles ne se perdent pas. » | `credit_pierres_differe` |
| 7 | `bravo.fin` | « C'est fini. Tu peux aller jouer. » | `null` |
| 8 | `bravo.bouton` | « Voir mon coffre » | `null` |
| 9 | `bravo.bouton_2` | « Aller jouer » | `null` |

Les lignes 5 et 6 **remplacent** les lignes 3 et 4 quand le crédit de pierres
n'a pas pu être écrit. C'est le seul aménagement du rituel, il ne dépend pas de
la soirée de l'enfant mais d'un état technique, et il ne change ni l'ordre, ni
le ton, ni le début, ni la fin. Une seule étape terminée, une session arrêtée
par le parent : mêmes phrases, sans exception, sans mention de ce qui n'a pas
été fait.

---

# 3. Compte exact de variantes par situation

Comptes **relevés mécaniquement** dans le fichier livré (voir la sortie réelle
en section 4.2), jamais estimés.

| # | Situation demandée | Clé dans le fichier | Variantes | Canal des entrées |
| --- | --- | --- | --- | --- |
| 1 | Accueil | `accueil` | **20** | 20 `les_deux` |
| 2 | Annonce du programme | `annonce_programme` | **20** | 20 `les_deux` |
| 3 | Avant lecture | `avant_lecture` | **20** | 20 `les_deux` |
| 4 | Encouragement en cours de lecture | `encouragement_lecture` | **20** | 10 `affiche` + 10 `les_deux` |
| 5 | Hésitation sur un mot | `hesitation` | **20** | 20 `les_deux` |
| 6 | Réussite d'étape | `reussite_etape` | **20** | 20 `les_deux` |
| 7 | Transition entre étapes | `transition_etapes` | **20** | 5 `tts` + 15 `les_deux` |
| 8 | Avant maths | `avant_maths` | **20** | 20 `les_deux` |
| 9 | Indice demandé | `indice_demande` | **20** | 20 `les_deux` |
| 10 | Blocage | `blocage` | **20** | 20 `les_deux` |
| 11 | Demande de pause | `demande_pause` | **20** | 20 `les_deux` |
| 12 | Retour de pause | `retour_de_pause` | **20** | 20 `les_deux` |
| 13 | Clôture | `cloture` | **20** | 20 `les_deux` |
| 14 | Pas de devoirs ce soir | `pas_de_devoirs` | **20** | 20 `les_deux` |
| 15 | Photo illisible | `photo_illisible` | **20** | 20 `les_deux` |
| 16 | Reprise d'une session interrompue | `reprise_session` | **20** | 20 `les_deux` |
| | **Total** | | **320** | |

Les 16 situations demandées sont couvertes, aucune n'est en dessous de 20.

Les 320 variantes sont **320 textes distincts** : le contrôle d'unicité compare
les 339 textes des deux fichiers, normalisés en minuscules et sans ponctuation,
et ne trouve aucun doublon, ni à l'intérieur d'une situation, ni entre deux
situations. Ce n'est pas une phrase déclinée vingt fois : chaque variante porte
une image ou une proposition différente, parce qu'un enfant qui fait ses devoirs
tous les soirs les entendra toutes.

---

# 4. Contrôles mécaniques et sorties réelles

Deux commandes, rejouables telles quelles par `controle-produit`.

## 4.1 Validité JSON (`node`)

Commande :

```
node -e "
const fs=require('fs');
for (const f of ['content/encouragements.json','content/gwenn-scripts.json']) {
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  console.log(f+' : JSON valide, schema='+d.schema+', cles racine='+Object.keys(d).length);
}
const e=JSON.parse(fs.readFileSync('content/encouragements.json','utf8'));
console.log('situations : '+Object.keys(e.situations).length);
console.log('variantes  : '+Object.values(e.situations).reduce((a,s)=>a+s.variantes.length,0));
const g=JSON.parse(fs.readFileSync('content/gwenn-scripts.json','utf8'));
console.log('rituels    : '+Object.keys(g.rituels).join(', '));
console.log('lignes fixes : '+Object.values(g.rituels).reduce((a,r)=>a+r.ecrans.reduce((b,x)=>b+x.lignes.length,0),0));
"
```

Sortie réelle :

```
content/encouragements.json : JSON valide, schema=tipi.encouragements.v1, cles racine=7
content/gwenn-scripts.json : JSON valide, schema=tipi.gwenn-scripts.v1, cles racine=8
situations : 16
variantes  : 320
rituels    : onboarding, rituel_fermeture
lignes fixes : 19
---- exit: 0
```

## 4.2 Contrôle de charte (comptes, longueur, interdits, unicité)

Le script de contrôle est conservé hors du dépôt (répertoire de travail de
l'agent). Il ouvre les deux fichiers et vérifie, sur **toutes** les entrées :

1. le nombre de variantes par situation ;
2. la longueur de chaque phrase, avec un découpage sur `.`, `!`, `?` et un
   **comptage strict** où une élision compte pour deux mots (« je t'aide » = 3
   mots), donc plus sévère que la règle ;
3. les mots et fragments interdits, en frontière de mot ;
4. les emoji (catégories Unicode `So`, `Sk`, `Cs` au-dessus de U+2000), les
   chiffres, et toute occurrence du prénom `Evan` écrit en dur ;
5. l'unicité des identifiants et des textes ;
6. la validité de chaque `canal` ;
7. la forme des rituels (3 écrans d'onboarding, `invariant` sur la fermeture).

Sortie réelle :

```
==================================================================
1. COMPTE DE VARIANTES PAR SITUATION (encouragements.json)
==================================================================
accueil                   20 variantes   OK
annonce_programme         20 variantes   OK
avant_lecture             20 variantes   OK
encouragement_lecture     20 variantes   OK
hesitation                20 variantes   OK
reussite_etape            20 variantes   OK
transition_etapes         20 variantes   OK
avant_maths               20 variantes   OK
indice_demande            20 variantes   OK
blocage                   20 variantes   OK
demande_pause             20 variantes   OK
retour_de_pause           20 variantes   OK
cloture                   20 variantes   OK
pas_de_devoirs            20 variantes   OK
photo_illisible           20 variantes   OK
reprise_session           20 variantes   OK
------------------------------------------------------------------
situations : 16    total variantes : 320

==================================================================
2. LONGUEUR DES PHRASES (limite : 12 mots)
==================================================================
entrees controlees : 339
phrases controlees : 591
phrase la plus longue : enc.blocage.02 / 10 : On souffle un peu, ou on passe à la suite
depassements de 12 mots : 0

==================================================================
3. VOCABULAIRE INTERDIT, EMOJI, CHIFFRES, PRENOM EN DUR
==================================================================
occurrences trouvees : 0

==================================================================
4. UNICITE DES IDENTIFIANTS ET DES TEXTES
==================================================================
identifiants : 339, doublons : aucun
textes : 339, textes identiques : aucun

==================================================================
5. REPARTITION DES CANAUX
==================================================================
tts           5 entrees
affiche      15 entrees
les_deux    319 entrees

==================================================================
6. RITUELS FIXES (gwenn-scripts.json)
==================================================================
onboarding           ecrans : 3   lignes : 10   rejoue : jamais
rituel_fermeture     ecrans : 1   lignes : 9   rejoue : chaque soir, à l'identique
onboarding : 3 ecrans (PRD-01 en exige 3)
rituel_fermeture invariant : True (PED-12)

==================================================================
RESULTAT : AUCUN PROBLEME
==================================================================
```

**Lecture des résultats** : 339 entrées, 591 phrases, aucune phrase au-dessus de
12 mots, la plus longue étant à 10 mots en comptage strict. Aucun mot interdit,
aucun emoji, aucun chiffre, aucun prénom écrit en dur.

**Deux points à signaler honnêtement au contrôleur :**

1. Le premier passage du contrôle a levé un faux positif : « sérieusement »
   contenait la chaîne « série ». Le contrôle a été durci avec des frontières de
   mot au lieu d'une recherche de sous-chaîne, et la phrase « Bravo. Tu as
   travaillé sérieusement. » a été conservée telle quelle. Aucun texte n'a été
   modifié pour faire passer un contrôle.
2. Le mot « perdent » apparaît une fois, dans `bravo.pierres_plus_tard_2` :
   « Elles sont à toi. Elles ne se perdent pas. » C'est un texte repris du
   livrable marketing et c'est une phrase de rassurance ETH-04 ; la notion de
   perte n'est jamais présentée comme possible, elle est niée.

## 4.3 Jeton `{prenom}`, phrases canoniques, absence de « Gwenn »

Sortie réelle du contrôle complémentaire (le script complet est dans le
répertoire de travail de l'agent) :

```
entrees avec {prenom} : 11
Counter({'accueil': 8, 'reprise_session': 2, 'rituel_fermeture': 1})

PRESENTE  'Bonsoir {prenom}. Je suis contente de te voir.'  ['enc.accueil.01']
PRESENTE  "On reprend là où on s'était arrêtés."  ['enc.reprise_session.01']
PRESENTE  'On regarde ce mot ensemble ?'  ['enc.hesitation.01']
PRESENTE  "Celui-là est difficile. C'est normal."  ['enc.blocage.01']
PRESENTE  'On souffle un peu, ou on passe à la suite ?'  ['enc.blocage.02']
PRESENTE  'Te revoilà. On y retourne tranquillement.'  ['enc.retour_de_pause.01']
PRESENTE  "Ce soir, il n'y a pas de devoirs."  ['enc.pas_de_devoirs.01']
PRESENTE  'Je cherche encore tes devoirs.'  ['enc.photo_illisible.03']
PRESENTE  'On souffle un peu.'  ['enc.demande_pause.01']
PRESENTE  'Regarde le rond.'  ['enc.demande_pause.01']

occurrences de Gwenn : 0
```

---

# 5. Couverture de PED-04, PED-05, PED-11, PED-12

## 5.1 PED-04 — Jamais « c'est faux » ni équivalent

**Décision** : la notion de réponse fausse n'existe nulle part dans le contenu.
Aucune des 339 entrées ne porte de jugement sur l'exactitude, et le contrôle
mécanique de la section 4.2 le prouve pour « faux », « erreur », « trompé »,
« incorrect » et leurs formes.

Là où un autre produit dirait que c'est faux, Tipi propose :

| Moment | Situation | Exemples livrés |
| --- | --- | --- |
| L'enfant bute sur un mot | `hesitation` | « On regarde ce mot ensemble ? », « Ce mot est difficile. C'est normal. », « Tu veux réessayer, ou tu préfères continuer ? » |
| La transcription est inexploitable | `hesitation`, `blocage` | Pilou relance par une question ou propose de continuer, jamais par un constat (PED-09) |
| L'enfant n'avance plus | `blocage` | « Ce n'est pas grave. On peut continuer autrement. », « On arrête celui-là. Tu as bien essayé. » |
| La photo n'a pas pu être lue | `photo_illisible` | Le sujet grammatical est toujours Pilou : « Je n'arrive pas à lire la feuille. » |

**Règle de personnalité appliquée partout** : quand quelque chose ne marche pas,
le sujet de la phrase est « je » (Pilou) ou « ça », jamais « tu ». Les 20
variantes de `photo_illisible` sont toutes construites ainsi.

## 5.2 PED-05 — Éloge de l'effort et de la stratégie, jamais de l'intelligence ni du résultat

**Décision** : aucune entrée ne qualifie l'enfant. On qualifie **ce qu'il a
fait**. Les mots « intelligent », « doué », « meilleur », « champion », « score »
sont absents et contrôlés mécaniquement.

Les 20 variantes de `reussite_etape` portent toutes sur l'acte, la durée de
l'effort ou la stratégie :

- l'acte : « C'est fait. Tu as terminé cette étape. », « Tu as travaillé jusqu'à
  la fin. Bravo. »
- la persévérance : « Tu as tenu jusqu'au bout. Bravo. », « Tu as essayé, encore
  et encore. Bravo. »
- la stratégie : « Tu as bien cherché. Ça compte beaucoup. », « Tu as gardé ta
  concentration. Bravo. », « Tu as avancé à ton rythme. C'est parfait. »

Même logique dans `encouragement_lecture` (« Tu as recommencé la phrase. C'est
une bonne idée. », « Lire à voix haute demande des efforts. Tu le fais. ») et
dans `indice_demande`, où demander de l'aide est présenté comme une bonne
stratégie et non comme un aveu : « Tu peux demander un indice, c'est permis. »,
« Demander de l'aide, c'est une bonne idée. »

**Conséquence appliquée au barème** : aucune variante ne relie une pierre à une
bonne réponse. Les pierres ne sont mentionnées que dans le rituel de fermeture
et dans `reprise_session` (« Tes pierres sont bien rangées. »), jamais comme la
contrepartie d'un résultat.

## 5.3 PED-11 — Au moins 20 variantes par situation, dans un fichier de contenu

**Décision** : 16 situations, 20 variantes chacune, 320 au total, dans
`content/encouragements.json`, hors du code. Le compte exact par situation est
en section 3, relevé par la commande de la section 4.2.

PED-11 nomme explicitement six situations : réussite, effort, hésitation, pause,
reprise, clôture. Correspondance :

| Situation nommée par PED-11 | Clé livrée | Variantes |
| --- | --- | --- |
| réussite | `reussite_etape` | 20 |
| effort | `encouragement_lecture` | 20 |
| hésitation | `hesitation` | 20 |
| pause | `demande_pause` + `retour_de_pause` | 20 + 20 |
| reprise | `reprise_session` | 20 |
| clôture | `cloture` | 20 |

Les dix autres situations du périmètre de l'agent sont couvertes au même niveau.
Aucun texte enfant n'est écrit en dur : les clés UI listées dans `cles_ui`
rattachent chaque situation aux écrans du livrable marketing.

## 5.4 PED-12 — Rituel de fermeture identique chaque soir

**Décision** : la clôture est **la seule séquence du produit sans variante**.
Elle vit dans `content/gwenn-scripts.json`, sous `rituels.rituel_fermeture`,
avec `invariant: true` et `rejoue: "chaque soir, à l'identique"`. Le moteur de
session lit les lignes dans l'ordre de `ordre`, sans tirage, sans condition liée
à la performance de la soirée.

Ce que cela garantit concrètement :

- même enchaînement : bravo, constat du travail fait, pierres, coffre, fin ;
- même ton : calme, factuel, affirmatif ;
- même texte, qu'il y ait eu une étape ou deux, que la session ait été arrêtée
  par le parent ou non ;
- aucune incitation à recommencer pour faire autrement (PRD-11) ;
- aucun chiffre sur cet écran (PED-07).

**Arbitrage assumé, à lire avec PED-11** : PED-11 demande 20 variantes pour la
clôture, PED-12 exige un rituel identique. Les deux exigences sont tenues en les
plaçant à deux moments différents :

| Moment | Fichier | Contenu |
| --- | --- | --- |
| Fin de la dernière étape, avant l'écran `/enfant/bravo` | `encouragements.json`, situation `cloture` | 20 variantes : « Le travail du soir est fini. », « On ferme le cahier. Doucement, sans bruit. » |
| Écran `/enfant/bravo` | `gwenn-scripts.json`, `rituel_fermeture` | 9 lignes fixes, jouées à l'identique chaque soir |

La banque `cloture` **précède** le rituel et ne le remplace jamais. Cette règle
est inscrite dans le champ `note` de la situation `cloture`, pour qu'un
développeur ou un contrôleur la lise dans le fichier lui-même.

---

# 6. Le jeton `{prenom}` et le multi-enfants (PRD-02)

**Décision** : le prénom de l'enfant n'est écrit en dur **nulle part**. Chaque
texte qui nomme l'enfant porte le jeton `{prenom}`, et la variante déclare ce
jeton dans son champ `jetons`.

Pourquoi : PRD-02 impose un profil enfant pré-rempli en V1, mais un **schéma de
données multi-enfants dès le départ** (`child.prenom` en base). Un prénom gravé
dans un fichier de contenu obligerait à réécrire la banque pour un deuxième
enfant, et ferait dire à Pilou le prénom d'un autre enfant que celui qui est
devant l'écran. Le jeton rend le contenu indépendant du profil.

Mise en oeuvre attendue côté code :

- la substitution se fait au moment du rendu, depuis `child.prenom` lu en base ;
- le jeton est également substitué **avant** l'envoi au TTS, et la clé de cache
  TTS (TEC-09b) est calculée sur le texte substitué, pour que la voix dise le
  bon prénom ;
- un texte contenant `{prenom}` n'est jamais envoyé à un modèle d'IA : SEC-04
  interdit toute donnée identifiante dans un payload DeepSeek, et ces textes
  n'ont aucune raison d'y aller, ils sont fixes.

Entrées concernées : 8 variantes de `accueil`, 2 de `reprise_session`, et la
ligne `bravo.titre` du rituel de fermeture. Le contrôle de la section 4.2
vérifie qu'aucune entrée ne contient la chaîne `Evan`.

Le champ racine `jeton_prenom` des deux fichiers documente le jeton retenu, pour
qu'un futur jeton (par exemple un surnom) se déclare au même endroit.

---

# 7. Écart de nommage : `gwenn-scripts.json` contre le personnage Pilou

**À signaler explicitement.** Le fichier s'appelle `gwenn-scripts.json` parce
que le prompt maître le nomme ainsi, en section 5.1 (fiche de l'agent
`contenu-enfant`) et dans la règle `30-copy-enfant.mdc`. Le nom de fichier est
donc conservé tel quel.

Mais le personnage s'appelle **Pilou** dans tout le prompt maître (section 1.3,
« Pilou, une petite loutre ») et dans tout le livrable marketing. « Gwenn » est
un nom de mascotte antérieur, resté dans un nom de fichier et dans un chemin de
composants (`src/components/gwenn/**` dans `30-copy-enfant.mdc`). Aucun texte
destiné à l'enfant ne contient « Gwenn » : le contrôle d'unicité et la relecture
le confirment, et le fichier porte un champ `note_nom_de_fichier` qui l'écrit
noir sur blanc.

**Conséquence pratique** : un développeur qui cherche les répliques de Pilou doit
savoir qu'elles sont dans `gwenn-scripts.json`. C'est un piège de lisibilité, pas
une faute fonctionnelle.

**Proposition, non appliquée ici** : renommer le fichier en
`pilou-scripts.json` et le dossier `src/components/gwenn/` en
`src/components/pilou/`. Ce renommage touche le prompt maître et une règle
permanente ; il n'est pas du ressort de cet agent et part donc dans
`docs/agents/BACKLOG-V2.md`, à l'initiative de l'Orchestrateur.

---

# 8. Arbitrages tranchés dans ce livrable

| # | Sujet | Arbitrage retenu |
| --- | --- | --- |
| 1 | PED-11 contre PED-12 sur la clôture | La banque `cloture` est jouée à la fin de la dernière étape, le rituel fixe est joué sur `/enfant/bravo`. Le rituel n'est jamais remplacé par une variante (section 5.4) |
| 2 | `photo_illisible` alors que le marketing écrit que l'OCR illisible n'est « jamais montré à l'enfant » | Les 20 variantes ne parlent jamais d'OCR, de photo ratée ni du parent. Elles habillent l'attente et le souci côté enfant (`enfant.accueil.souci.*`, `enfant.attente.pilou`), avec Pilou comme sujet. La reprise de la photo reste une action parent |
| 3 | Vocabulaire du canal : `dit` / `affiche` / `dit_affiche` (marketing) contre `tts` / `affiche` / `les_deux` (mission) | Les fichiers portent `tts`, `affiche`, `les_deux`, comme demandé. Correspondance : `dit` = `tts`, `affiche` = `affiche`, `dit_affiche` = `les_deux`. À harmoniser dans un seul sens avant le développement de V1 |
| 4 | Nombre d'étapes dans `annonce_programme` | Aucune variante ne dit « deux ». Le nombre est porté par les clés UI du marketing (`enfant.programme.titre` et sa variante à une seule étape), pour que le mode basse énergie n'oblige pas à une deuxième banque |
| 5 | Accord grammatical et genre | Aucune variante ne contient d'adjectif ou de participe accordé au genre de l'enfant (pas de « tu es prêt », pas de « tu es allé »). Les textes restent justes pour un deuxième enfant, quel que soit son genre |
| 6 | Situations marketing et situations de la mission | Les noms de situation du marketing sont repris tels quels : `accueil`, `annonce_programme`, `hesitation`, `demande_pause`, `retour_de_pause`, `pas_de_devoirs`. Les dix autres suivent la même convention `snake_case` |
| 7 | Chiffres | Aucun chiffre dans aucune entrée, y compris en toutes lettres pour un rang d'indice ou un numéro d'écran (PED-07) |
| 8 | Longueur réelle des phrases | Limite fixée à 12 mots, tenue à 10 au pire, avec un comptage plus sévère que la règle. La marge est volontaire : elle absorbe une future relecture sans repasser sous la limite |
| 9 | Ordre des étapes figé dans les textes | **Aucune des 320 variantes ne suppose que la lecture précède les maths.** PRD-04 autorise le parent à réordonner ou à retirer une matière, et `docs/agents/P1/produit-marketing.review.md` sanctionne ce défaut en [MAJEUR] n°1 sur quatre textes du livrable marketing. Trois de mes variantes avaient le même défaut et ont été réécrites avant livraison : « On commence par la lecture. » devient « C'est le moment de la lecture. », « Maintenant, les maths. » devient « C'est le moment des maths. », « On passe aux maths. » devient « Les maths, c'est maintenant. » Conséquence : chaque banque reste utilisable en entier quel que soit l'ordre choisi par le parent, et aucune situation ne descend sous 20 variantes utilisables dans un contexte donné |

---

# 9. Cohérence avec le livrable marketing

| Point de cohérence | Vérification |
| --- | --- |
| Voix de Pilou | Calme, patiente, curieuse, fiable, humble (marketing 2.2). Aucune exclamation excessive, aucun « waouh », aucun « champion » |
| Sujet des messages de difficulté | Toujours « je » ou « ça », jamais « tu » — appliqué aux 20 variantes de `photo_illisible` et aux entrées de `blocage` |
| Clés de contenu | Chaque situation déclare les clés du marketing qu'elle alimente, dans `cles_ui` |
| Textes canoniques | L'onboarding (7.2) et le rituel de clôture (7.8) sont repris **mot pour mot** dans `gwenn-scripts.json`. Dans la banque, la phrase canonique du marketing est placée en **variante 01** de sa situation. Présence vérifiée par commande pour `accueil`, `hesitation`, `blocage` (01 et 02), `demande_pause`, `retour_de_pause`, `pas_de_devoirs`, `photo_illisible`, `reprise_session` |
| Deux phrases canoniques volontairement **non** reprises | « On commence par la lecture. » et « Maintenant, les maths. » figent l'ordre des étapes. Voir l'arbitrage 9 |
| Absence de « Gwenn » dans les textes | Vérifiée par commande : 0 occurrence dans les 339 entrées |
| Interdits de vocabulaire | La table 3.1 du marketing est reprise dans le champ `regles.interdits` du fichier et contrôlée mécaniquement |
| Tutoiement | Systématique. Le prénom n'apparaît qu'à l'accueil, à la reprise et à la clôture, jamais à chaque phrase |
| PED-10 | 319 entrées sur 339 sont en `les_deux`. Les 20 autres sont justifiées situation par situation (section 1.3) |
| ETH-05 | Aucune entrée ne promet un objet, une sortie ou un avantage réel. Le sujet des paliers reste dans le coffre, côté marketing (`coffre.palier.maison`) |

---

# 10. Ce qui reste ouvert

1. **Harmonisation du vocabulaire de canal** entre le marketing (`dit_affiche`)
   et les fichiers de contenu (`les_deux`). Un seul vocabulaire doit survivre
   avant V1. Décision attendue de l'Orchestrateur.
2. **Renommage de `gwenn-scripts.json`** en `pilou-scripts.json` (section 7) :
   hors périmètre de cet agent, candidat pour `BACKLOG-V2.md`.
3. **Cache TTS (TEC-09b)** : les 339 entrées sont des phrases récurrentes, donc
   toutes cachables. Les 11 entrées contenant `{prenom}` doivent être cachées
   après substitution, une entrée de cache par prénom.
4. **Visa `gardien-charte`** : obligatoire avant de considérer ce contenu comme
   livré (`30-copy-enfant.mdc`). Non joué par cet agent, qui est le producteur.
5. **Lecture à voix haute par un adulte** : les 320 variantes ont été écrites
   pour l'oreille, pas encore entendues avec la voix Chirp3-HD retenue. Le choix
   de la voix est l'un des six points humains de la section 8 du prompt maître.
6. **Dépendance au livrable marketing en cours de correction** : ce contenu a été
   écrit contre la version de `produit-marketing.out.md` présente au moment de la
   production. Ce livrable est sous verdict `FAIL` et en cours de reprise par son
   producteur. Les clés déclarées dans `cles_ui` doivent être re-vérifiées après la
   correction, en particulier celles de `/enfant/programme` et de `maths.intro`,
   que le [MAJEUR] n°1 demande de dédoubler. La banque elle-même est déjà neutre
   vis-à-vis de l'ordre des étapes (arbitrage 9), donc aucune variante n'est à
   réécrire de ce fait.

---

## Note de procédure

Cet agent n'a effectué **aucun commit git**. Le commit
`83073ad content(p1bis): banque de phrases de Pilou et scripts du rituel
[agent:contenu-enfant]`, qui contient les deux fichiers de contenu, a été créé par
l'Orchestrateur. Les fichiers ont été régénérés après ce commit pour appliquer
l'arbitrage 9 ; ils apparaissent donc comme modifiés dans l'arbre de travail, et
le présent rapport n'est pas encore suivi par git.
