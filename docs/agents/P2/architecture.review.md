# P2 — Contrôle adversarial de l'architecture

VERDICT: FAIL

Contrôleur : `controle-architecture` (lecture seule). Porte G2, **tour 2 sur 3**.
Livrables contrôlés : `docs/agents/P2/architecture.out.md` (v2, 1814 lignes),
`prisma/schema.prisma`, `supabase/policies.sql` (499 lignes), `.env.example`.

**Tour 2 : 3 [MAJEUR], 3 [MINEUR], 0 [BLOQUANT].** Un seul [MAJEUR] impose FAIL.
Plus deux observations hors livrable, qui ne comptent pas dans ce verdict.

**Les 19 constats du tour 1 sont tous traités, et correctement** (section F,
constat par constat, vérifié dans les fichiers et non dans le tableau de reprise
de la section 0). Les sept [MAJEUR] sont fermés. Aucune régression : la
conformité champ par champ à 3.7, la RLS table par table, l'impossibilité du
double crédit et le retour de pause sans `etat_avant_pause` tiennent toujours
(section D). Aucun des 27 chiffres annoncés n'est faux (section C).

**Les trois [MAJEUR] du tour 2 sont tous nés du tour 2 lui-même** : ils portent
sur le barème réécrit par ARB-08 et sur la transition T12 créée pour fermer le
constat 5. C'est le prix d'un changement de barème en fin de porte, et ils se
corrigent en trois clauses.

`prisma validate` rejoué : valide, exit 0, sortie en E.1.

---

## A. Constats du tour 2

La numérotation continue celle du tour 1, qui s'arrêtait à 19.

### [MAJEUR] 20 — Le bonus `bonus_soiree_complete` n'a de créditeur qu'en T5. Ni T10 ni T12 ne le rattrapent : un enfant qui finit tout mais perd le dernier appui perd une pierre.

ARB-08 a été rendu pour une raison écrite dans `GATES.md` :

> « Le contrôle a montré qu'une IA qui découpe mal coûterait 2 pierres à
> l'enfant — l'étape et le bonus. **L'enfant n'est pas responsable d'une erreur
> d'analyse, et ETH-04 interdit qu'il perde quoi que ce soit.** »

Le tour 2 a supprimé la cause qu'ARB-08 visait, et en a créé une autre. J'ai
relevé **toutes** les occurrences du mot « bonus » dans le livrable (sortie
E.4) : une seule transition le crédite.

`architecture.out.md`, 9.2, T5 — **seul créditeur du bonus** :

> « T5 | `ETAPE_TERMINEE` | … | dernière étape | `cloture` | crédit +1, **puis
> +1 `bonus_soiree_complete` si toutes les étapes programmées sont terminées** »

`architecture.out.md`, 9.2, T10 et T12 — le bonus est absent des deux :

> « T10 | `ABANDON_PARENT` | … | crédit des **étapes** déjà terminées et non
> encore créditées »
> « T12 | `CLOTURE_AUTOMATIQUE` | … | crédit des **étapes** terminées et non
> créditées »

Et la règle de rattrapage de 9.4, point 3, ne parle elle aussi que d'étapes :

> « Il les identifie sans ambiguïté : **une étape est terminée** quand toutes
> les lignes `attempt` de ses exercices portent un statut final, et non créditée
> quand il n'existe pas de ligne `gem_ledger` pour `(session_id, raison)`. »

Le cas est atteignable et ordinaire. L'enfant termine le dernier exercice de la
dernière étape ; `POST …/tentative` écrit `statut = "terminee"` ; la tablette
s'éteint, ou le parent ferme l'application avant que l'enfant n'appuie sur le
bouton de fin. `ETAPE_TERMINEE` n'est jamais émis. Le lendemain, T12 se
déclenche : il constate que toutes les lignes `attempt` sont finales, crédite
`etape_maths_terminee`… et s'arrête là. **Toutes les étapes programmées du soir
sont pourtant terminées : le bonus est dû, et personne ne l'écrit.** Aucune
route n'accepte de montant (7.1), aucune transition n'est possible depuis
`termine` (9.2) : la pierre est perdue définitivement.

C'est exactement la perte qu'ARB-08 voulait empêcher, déplacée de l'analyse vers
le réseau. PRD-18 existe précisément parce qu'une session du soir est
interrompue de temps en temps.

Correction attendue : étendre explicitement le rattrapage de T10 et T12 au
bonus, dans les deux lignes du tableau 9.2 et dans la phrase de 9.4 point 3 —
par exemple « crédit des étapes terminées et non créditées, **puis
`bonus_soiree_complete` si toutes les étapes programmées le sont et qu'il
n'existe pas déjà de ligne pour cette raison** ». L'unique `(session_id, raison)`
rend l'opération sûre en cas de rejeu, et aucune route n'accepte de montant pour
autant.

---

### [MAJEUR] 21 — « une soirée à une seule étape rapporte 2 pierres, **comme une soirée à deux étapes** » est arithmétiquement faux : une soirée à deux étapes en rapporte 3. La conclusion ARB-06 bâtie dessus tombe avec.

`architecture.out.md`, section 9.5, dans la formulation canonique du barème que
l'Orchestrateur m'a demandé de vérifier :

> « Conséquence concrète, à ne jamais laisser implicite : **une soirée à une
> seule étape rapporte 2 pierres, comme une soirée à deux étapes.** C'est
> cohérent avec PED-05, ETH-01 et ARB-06, qui veut qu'un Soir léger reste
> indétectable par l'enfant — **y compris dans son coffre**. »

Le barème de la même section 9.5 dit :

| Événement créditeur | Delta | Raison |
| --- | --- | --- |
| Une étape programmée est terminée | +1 | `etape_lecture_terminee` ou `etape_maths_terminee` |
| **Toutes** les étapes programmées du soir sont terminées | +1 | `bonus_soiree_complete` |

Le calcul est immédiat, et T5 le confirme (« crédit +1, **puis** +1 ») :

- soirée à **deux** étapes, toutes terminées : 1 + 1 + 1 = **3 pierres** ;
- soirée à **une** étape (Soir léger), terminée : 1 + 1 = **2 pierres**.

La phrase « comme une soirée à deux étapes » est donc fausse, et c'est la
seconde moitié qui pose le vrai problème : **le Soir léger reste détectable dans
le coffre**, à une pierre près, tous les soirs. ARB-06 pose explicitement la
contrainte inverse et fait foi :

> « Contrainte maintenue : le Soir léger reste indétectable par l'enfant. »

ARB-08 a rapproché les deux cas — avant lui, le Soir léger rapportait 1 pierre
contre 3, soit deux d'écart ; après lui, 2 contre 3, soit une — mais il ne les a
pas égalisés, et le livrable affirme qu'il l'a fait. Un écart d'une pierre par
soir léger est parfaitement visible dans un coffre que PRD-14 affiche chiffré.

Je ne propose pas de barème : ce n'est pas mon rôle et la fiche me l'interdit.
Correction attendue : retirer « comme une soirée à deux étapes » et la phrase
« y compris dans son coffre », remplacer par le calcul exact des deux cas, et
**remonter le conflit ARB-06 / ARB-08 à l'Orchestrateur comme point ouvert**,
puisque l'égaliser demande un barème forfaitaire par soirée — une décision de
produit, exactement comme ARB-08. Corriger aussi la ligne `ETH-04` de 16.2, qui
répète « une soirée à une seule étape rapporte 2 pierres » sans la comparaison :
elle est vraie isolément, mais elle sera lue à côté de 9.5.

---

### [MAJEUR] 22 — Le barème a un cinquième et un sixième endroit, non cités. L'un est la fiche de `tests-unitaires`, qui prescrit d'écrire un test sur la règle révoquée.

`architecture.out.md`, section 16.2, affirmation de complétude :

> « Quatre endroits, une seule formulation, et le numéro d'arbitrage partout :
> `recette-finale` tombera dessus **quel que soit le fichier par lequel elle
> entre**. »

J'ai vérifié les quatre endroits cités : ils existent tous et portent la
formulation canonique mot pour mot (section B.2). Puis j'ai cherché un cinquième,
comme l'Orchestrateur me l'a demandé. **J'en ai trouvé deux** (sortie E.5) :

**(a) `.cursor/agents/tests-unitaires.md`, ligne 12** — et son exemplaire dans
`TIPI-PROMPT-CURSOR.md` ligne 667 :

> « - Service pierres : +1 par étape, **+1 bonus pour 2 étapes**, jamais de
> delta négatif, solde toujours égal à la somme du ledger, écriture impossible
> depuis le client. »

C'est la **liste de couverture obligatoire** de l'agent `tests-unitaires`.
Lisant sa fiche, il écrira un test qui affirme que le bonus exige deux étapes.
Ce test échouera contre une implémentation correcte d'ARB-08 sur un Soir léger —
ou, pire, passera parce que l'implémentation aura été alignée sur le test. Et
`controle-tests`, dont le protocole exige de « vérifier que chaque exigence de la
liste de couverture obligatoire a au moins un test qui la nomme », validera cet
alignement. C'est précisément ce que `40-protocole-agents.mdc` appelle un
instrument de mesure préréglé sur la règle qu'il devait contrôler.

Le livrable nomme le risque pour `recette-finale` (16.2 : « un écart silencieux
est un piège pour le dernier agent de la chaîne ») et manque le même piège, plus
tôt dans la chaîne, sur un agent dont c'est le métier de mesurer.

**(b) `docs/agents/P1/produit-marketing.out.md`, ligne 1148** — livrable G1 verte,
et source d'extraction de `ui-enfant.json` (ARB-10) :

> « **Barème rappelé** (3.7) : +1 par étape terminée, **+1 bonus si les 2 étapes
> du soir sont terminées.** »

Suivi, deux lignes plus bas, de « **Cas d'une seule étape terminée** : même
rituel, mêmes phrases, **une pierre de moins affichée** » — qui ne correspond ni
à l'ancien barème (deux pierres de moins : 1 contre 3) ni au nouveau.

Correction attendue : je ne demande pas à l'architecte de modifier ces fichiers,
qui ne sont pas ses livrables — il a eu raison de ne pas toucher au glob pour la
même raison. Je demande qu'il les **nomme**, comme il a nommé le glob en section
18 : remplacer « quatre endroits » par la liste réelle, et ouvrir un point pour
l'Orchestrateur sur `.cursor/agents/tests-unitaires.md` et
`TIPI-PROMPT-CURSOR.md` §5.1, qui sont les seuls endroits où l'écart produit un
test faux et non une simple lecture divergente. La ligne de marketing relève du
même traitement qu'ARB-05.

---

### [MINEUR] 23 — « vérifiée par V8 » : V8 ne vérifie pas la séparation des deux buckets, seulement l'existence et la privacité de `tts-prive`.

`architecture.out.md`, section 6 :

> « Ces 14 clips vivent désormais dans le bucket privé `tts-prive` et ne sont
> servis que par URL signée (section 12.2). **La règle est écrite dans
> `supabase/policies.sql` et vérifiée par V8.** »

V8, dans `supabase/policies.sql` (lignes 464-476), fait exactement ceci :

```
SELECT public INTO est_public FROM storage.buckets WHERE id = 'tts-prive';
IF … NULL  THEN RAISE EXCEPTION 'SEC-04 : bucket tts-prive absent …';
IF est_public THEN RAISE EXCEPTION 'SEC-04 : bucket tts-prive marqué public.';
```

C'est un contrôle de **catalogue**, pas de contenu : il prouve que la
destination existe et qu'elle est privée, pas qu'aucun clip à jeton n'a atterri
dans `tts-cache`. Et il ne peut pas le prouver, puisque le chemin public est
`tts-cache/<voix_id>/<sha256>` : le hachage est opaque, rien dans le chemin ne
dit si le texte portait un jeton.

Je souligne que la séparation elle-même est solide, et je le détaille en B.1 :
c'est la revendication de preuve qui dépasse l'instrument.

Correction attendue : réécrire « vérifiée par V8 » en « la destination est
vérifiée par V8 ; la séparation, elle, se prouve à la source », et nommer le
porteur du contrôle de contenu — le plus simple étant un test de P5 ou P7 qui
recalcule les 14 clés de la liste de 17.3 et vérifie que
`GET {NEXT_PUBLIC_TTS_CACHE_URL}/<voixId>/<clé>.mp3` renvoie 404. La liste
nominative est déjà publiée en 17.3 ; il ne manque que l'agent qui la joue.

---

### [MINEUR] 24 — Le budget de 300 ms du chemin TTS privé contredit les 400 ms que le même tableau accorde à une route qui fait strictement moins de travail.

`architecture.out.md`, 12.1, deux lignes du même tableau :

> « **TTS privé, cache touché** | 300 ms | `POST /api/voix` + URL signée + `GET`
> Storage | aucun : **sous le seuil de 400 ms** »
> « Lancer la session | 400 ms | création de session, 1 transaction | bouton en
> attente »

Le chemin privé enchaîne trois allers-retours — la route Next.js, l'émission
d'une URL signée auprès de Supabase, puis le `GET` de l'objet — là où « Lancer la
session » en fait un seul, une transaction Postgres, pour 400 ms. Le budget le
plus lourd est donc annoncé plus bas que le plus léger, sans justification.

Ce n'est pas une faute de correction : aucune mesure n'est possible en P2,
faute de code, et l'architecte est par ailleurs honnête sur la conséquence
(12.1 : « Ce que le tour 1 promettait à tort »). Mais le chiffre de 300 ms est
exactement ce qui lui permet d'écrire « aucun habillage nécessaire ». S'il est
faux, TEC-12 impose « Pilou réfléchit » sur **la première phrase que l'enfant
entend chaque soir** (`accueil`) et sur `bravo.titre`, joué chaque soir — un
effet produit visible, pas une ligne de tableau.

Correction attendue : soit justifier la composition en 300 ms poste par poste,
soit porter la ligne à 400 ms ou plus et assumer l'habillage, en le disant dans
la même phrase.

---

### [MINEUR] 25 — Le retrait des six clés a une consigne d'exécution incomplète : elle oublie le livrable marketing, qui les déclare aux trois endroits d'où `contenu-enfant` extraira `ui-enfant.json`.

`architecture.out.md`, 10.3, point d'exécution 1 :

> « **Le retrait touche deux fichiers, pas un.** Les six clés n'existent pas
> encore dans `content/ui-enfant.json`, qui reste à écrire : il suffit de ne pas
> les y créer. Mais `lecture.vide.corps` et `maths.vide.corps` sont **déjà
> déclarées** dans `content/encouragements.json` […] »

Les deux affirmations sont exactes, je les ai vérifiées (sortie E.3 :
`content/encouragements.json` lignes 148-149, cinquième groupe de
`cles_fixes_non_variees`). Mais le compte de « deux fichiers » est faux : les
**six** clés sont déclarées dans `docs/agents/P1/produit-marketing.out.md`, à
trois endroits :

```
474-475 : table des conditions de rendu (« Étape vide, suite existante » / « pas de suite »)
830-835 : écran lecture — les trois clés lecture.vide.* avec leur texte
1028-1033 : écran maths — les trois clés maths.vide.* avec leur texte
```

Or ARB-10 confie `ui-enfant.json` à `contenu-enfant`, par extraction des tableaux
7.1 à 7.14 de ce même livrable. Si ces neuf lignes restent en place, l'extraction
recréera mécaniquement les six clés — et produira exactement l'incohérence
inverse de celle que l'architecte veut éviter : six clés dans `ui-enfant.json`
que `encouragements.json` ne déclarera plus comme « fixes non variées ».

Correction attendue : ajouter le livrable marketing au point d'exécution 1, avec
ses trois emplacements, et dire ce qu'il advient des textes eux-mêmes (« Ce soir,
il n'y a pas de lecture. », « On passe aux maths. », « On a fini. Viens voir. »).
Le régime d'ARB-05 s'applique : ce livrable est la source de tous les autres.

---

## B. Les trois points que l'Orchestrateur m'a demandé de juger

### B.1 — Le retrait des six clés : la vérification est **juste**, et la séparation des buckets est **étanche**

**J'ai refait le déroulé des cinq états limites moi-même, sans me fier à la
section 10.3.** Pour chacun, j'ai vérifié dans `content/*.json` et dans
`produit-marketing.out.md` que les clés de couverture citées existent
réellement (sortie E.3, 17 clés vérifiées, toutes présentes) :

| État limite | Couverture réelle, vérifiée par moi | Une des six clés est-elle porteuse ? |
| --- | --- | --- |
| Aucun devoir ce soir | `parent.scan.sans_devoir.bouton/.confirmation/.valider` (1 occ. chacune), `parent.apercu.vide` (4), `enfant.accueil.vide.titre/.corps` (22 chacune, banque `pas_de_devoirs`), `enfant.accueil.vide.bouton` (1) | **Non.** Zéro étape **programmée** (T3), pas une étape vide. Les deux cas n'ont jamais partagé de clé |
| OCR illisible | `parent.scan.illisible` (5), `enfant.accueil.souci` (45, banque `photo_illisible`), saisie manuelle toujours ouverte | **Non.** Une photo illisible est rejetée avant la validation parent (TEC-06) : elle n'a jamais produit d'étape |
| Blocage total | `maths.blocage.corps_2` (22), `lecture.blocage.corps_2` (22), banques `blocage_maths` / `blocage_lecture`, repli `maths.sans_indice` | **Non.** Le blocage suppose un exercice présent |
| Session reprise le soir même | `enfant.accueil.reprise` (47, banque `reprise_session`), `lecture.reprise.corps_2` (1), `maths.reprise.corps_2` (1) | **Non.** La reprise rejoue une étape qui a du contenu |
| Session orpheline close par T12 | Accueil ordinaire côté enfant ; côté parent `parent.resume.etape_passee` (1) et l'observation 7.12 ligne 1498 | **Non** |

J'ai aussi cherché le cas inverse, celui que l'Orchestrateur redoute : **ARB-08
crée-t-il un état sans écran ?** Non. Une étape écartée à l'analyse produit une
soirée à une étape, annoncée par `enfant.programme.une.titre` et les 20 variantes
d'`annonce_programme_une_etape` — qui existent et sont couvertes. Et une étape
ne peut plus devenir vide après coup : `DELETE /api/devoirs/photo/{id}` est
refusé après analyse (`409 TIPI_DEJA_ANALYSE`), et `exercise` ne disparaît que
par cascade depuis `homework`.

**Conclusion : les six clés peuvent partir. Aucun état limite n'y perdait sa
couverture.** Le compte de l'architecte est exact aussi sur le détail : le
cinquième groupe de `cles_fixes_non_variees` contient bien **huit** clés, dont
les deux à retirer, et les six qu'il énumère comme conservées — avec
`lecture.pas_entendu.*` valant deux clés — sont exactement les six restantes. La
seule faiblesse est la consigne d'exécution, constat 25.

**Sur l'étanchéité de la séparation public / privé**, que l'Orchestrateur me
demande d'attaquer : **je n'ai pas trouvé de chemin de fuite.** Quatre raisons,
chacune vérifiée dans un fichier :

1. **La décision est structurelle, pas heuristique.** Le critère est la présence
   d'un jeton dans le texte **source**, connue avant tout rendu — pas une
   recherche du prénom dans une chaîne déjà rendue. Mon recomptage indépendant
   (E.2) confirme la partition : 420 clips sans jeton + 40 à `{matiere}` =
   **460 publics**, 14 à `{prenom}` = **privés**, et **zéro clip porte les deux
   jetons**, donc aucun cas mixte n'existe à trancher.
2. **Un seul décideur.** `POST /api/voix` choisit le bucket (8.4, décision 3) et
   n'accepte jamais de texte libre : le client envoie un identifiant de variante,
   jamais une chaîne. Il ne peut donc pas faire ranger un texte de son choix.
3. **Les préfixes ne se croisent pas.** `policies.sql` ligne 339 :
   `tts-cache/<voix_id>/<sha256>` contre
   `tts-prive/<child_id>/<voix_id>/<sha256>`. Un objet privé ne peut pas occuper
   une adresse publique : le bucket fait partie du chemin.
4. **Le client ne peut rien écrire.** Une seule policy sur `storage.objects`, en
   `SELECT`, sur `tts-cache` seul (lignes 250-255). Aucune policy d'INSERT,
   d'UPDATE ni de DELETE, sur aucun bucket. Tout téléversement passe par
   `SUPABASE_SERVICE_ROLE_KEY`, serveur.

Et le texte de devoir ? Il n'a pas de jeton, donc la règle « jeton ⇒ privé » ne
le couvrirait pas — mais 8.4 et 12.2 le rangent explicitement au privé par sa
**source** (`source: "exercice"`, et « tout clip de texte de devoir »), ce qui
est la bonne clé de tri. Les trois affirmations fausses du tour 1 ont
effectivement disparu, y compris dans `supabase/policies.sql` : j'ai cherché
« identiques pour tous » et « aucune donnée identifiante », zéro occurrence.

Le seul défaut est le constat 23 : la preuve revendiquée ne fait pas ce qu'on lui
prête. Et le budget de 300 ms, constat 24, ne tient pas devant les 400 ms que le
même tableau accorde à une route plus légère.

**Sur la lecture « le chemin public était un oracle » que l'architecte soumet à
mon jugement : elle est juste, et c'est la bonne façon de le dire.** Un sha256
n'est un secret que si l'entrée est secrète. Ici l'entrée est
`voixId|modele|texte`, dont les trois composantes sont dans le dépôt ; seul le
prénom manque, et il se devine. Un `200` contre un `404` le confirme sans
authentification et sans laisser de trace côté application. Son refus de tout
rendre privé est également défendable : 539 caractères sur 21 016 sont
personnels, soit 2,6 % du corpus, et payer 150 ms de plus sur les 460 autres
clips pour les protéger serait une dépense sans contrepartie.

### B.2 — La traçabilité du barème : les quatre endroits sont bons, il en manque deux

**Les quatre endroits cités existent et portent la formulation canonique**, je
les ai ouverts un par un :

| # | Endroit | Vérifié |
| --- | --- | --- |
| 1 | `architecture.out.md` § 9.5 | Oui, lignes 1004-1009, avec ARB-08 et l'écart à 3.7 |
| 2 | `prisma/schema.prisma`, commentaire de `RaisonGem` | Oui, lignes 74-84 : « ÉCART ASSUMÉ ET TRACÉ … **ARB-08** (docs/agents/GATES.md) » |
| 3 | `supabase/policies.sql`, commentaire du `CHECK gem_ledger_delta_max_un` | Oui, lignes 176-179 : « ARB-08, qui remplace le « 2 étapes » en dur de la section 3.7 » |
| 4 | `architecture.out.md` § 16.2, trois lignes de `TRACEABILITY.md` | Oui, lignes 1522-1543 : ETH-04 porte l'explication complète, TEC-11 et SEC-06 y renvoient |

Le dispositif est bon dans son principe : quel que soit le fichier par lequel on
entre — le schéma, le SQL, le document, la traçabilité — on tombe sur le numéro
d'arbitrage. Et la phrase de 16.2 qui justifie l'exercice est exacte : « un écart
assumé et tracé n'est pas un écart ; un écart silencieux est un piège pour le
dernier agent de la chaîne. »

**Mais le cinquième endroit existe, et c'est le pire possible** : la fiche de
`tests-unitaires` prescrit d'écrire le test sur la règle révoquée. Et un sixième,
dans le livrable marketing. C'est le constat 22. Je souligne que la faille n'est
pas une lecture divergente mais un **test préréglé** : `tests-unitaires` ne lira
ni `GATES.md`, ni la section 9.5, il lira sa fiche.

Un mot sur la conséquence annoncée du barème : elle est fausse, et c'est le
constat 21. La formulation canonique elle-même est juste ; c'est la phrase qui la
suit qui se trompe de calcul.

### B.3 — Le glob corrigé : il reste **un** chemin de texte enfant à découvert

La valeur que vous avez écrite dans `.cursor/rules/30-copy-enfant.mdc`, vérifiée
telle quelle (sortie E.6) :

```
globs: ["content/**", "src/app/enfant/**", "src/components/enfant/**",
        "src/components/pilou/**", "src/lib/ai/prompts/**"]
```

`gwenn` est bien supprimé, et les deux dossiers que je réclamais au tour 1 —
`src/app/enfant/**` et `src/components/enfant/**` — sont là. **Il manque une
entrée, et une seule : `src/app/bienvenue/**`.**

L'onboarding est un écran **enfant** : `architecture.out.md` ligne 179 le place à
`src/app/bienvenue/page.tsx`, la verticale V9 le livre sous `/bienvenue`, et son
texte est celui de `content/gwenn-scripts.json` — dix lignes `bienvenue.1.*` à
`bienvenue.3.*`, canal `les_deux`, écrites pour un enfant de six ans et demi.
C'est PRD-01, joué une seule fois à vie, donc le seul écran de l'application que
personne ne reverra jamais pour le corriger. Il est hors du glob parce que la
route `/bienvenue` n'est pas sous `/enfant`.

Ma recommandation, qui close ma remarque du tour 1 :

```
globs: ["content/**", "src/app/bienvenue/**", "src/app/enfant/**",
        "src/components/enfant/**", "src/components/pilou/**",
        "src/lib/ai/prompts/**"]
```

J'ai cherché d'autres chemins et je n'en retiens aucun : `src/components/ui/**`
est générique et reçoit ses libellés en propriétés, `src/content/**` rend les
jetons sans écrire de texte, `src/lib/errors/codes.ts` ne porte que des clés, et
`src/app/parent/**` et `/reglages` sont hors du périmètre d'une règle qui vise
les textes destinés à l'enfant. Avec `src/app/bienvenue/**`, la liste est close.

---

## C. Chiffres annoncés contre chiffres réels

Tous recomptés par moi, aucun repris du rapport. **Aucun écart.**

| Grandeur | Annoncé | Mesuré | Écart |
| --- | --- | --- | --- |
| Entrées lues (canal `tts` / `les_deux`) | 454 | 454 | — |
| Clips distincts à synthétiser | 474 | 474 | — |
| Caractères du corpus fixe | 21 016 | 21 016 | — |
| Longueur moyenne d'un clip | 44,3 | 44,3 | — |
| Part du quota mensuel | 2,10 % | 2,1016 % → 2,10 % | — |
| A — sans jeton → bucket **public** | 420 clips, 19 105 car. | 420 / 19 105 | — |
| B — jeton `{matiere}` → **public** | 40 clips, 1 372 car. | 40 / 1 372 | — |
| C — jeton `{prenom}` → **privé** | 14 clips, 539 car. | 14 / 539 | — |
| Clips portant les deux jetons | 0 | 0 | — |
| Total public (460) / privé (14) | 460 / 14 | 460 / 14 | — |
| Variables dans `.env.example` | 27 | 27 | — |
| Variables `NEXT_PUBLIC_` | 3 | 3 | — |
| Lignes du tableau § 11 | 27 | 27 | — |
| Modèles Prisma | 10 | 10 | — |
| Énumérations Prisma | 6 | 6 | — |
| Contraintes déportées en `policies.sql` B | 8 | 8, listées dans l'en-tête du schéma | — |
| Chemins de route distincts | 32 | 32 | — |
| Tables couvertes par la RLS | 11 (10 métier + `_prisma_migrations`) | 11 blocs | — |
| Buckets | 4 (3 privés, 1 public) | 4 | — |
| Vérifications exécutables partie D | 8 (V1→V8) | 8 blocs `DO $$` | — |
| Ancienne règle grep — fichiers rendus | 3 | 3 | — |
| Nouvelle règle grep — fichiers rendus | 0 | 0 (exit 1) | — |
| `prisma validate` | valide, exit 0 | valide, exit 0 | — |

La ventilation 420 / 40 / 14 est une **grandeur nouvelle** du tour 2 : je l'ai
donc recalculée avec mon propre instrument et non avec celui publié en 17.3, et
les deux concordent. Les quatre grandeurs du tour 1 sont inchangées : conforme à
la règle 1 de « Corriger un instrument de mesure », l'instrument élargi n'a
effacé aucun chiffre — il a ajouté la ventilation qui a révélé le défaut.

---

## D. Non-régression : ce que le tour 1 avait acquis tient toujours

**Conformité champ par champ à la section 3.7 — intacte.** Contrôle mécanique
(sortie E.7) sur les neuf tables et leurs 58 champs de 3.7 : **aucun champ
absent, aucun renommé**, noms de colonnes conformes via `@map`. Les ajouts sont
inchangés et citent chacun une exigence ; `gem_ledger` et `settings_access`
n'ont toujours aucun ajout. Le seul changement du tour 2 est celui que je
demandais : `gem_ledger.session_id` passe de `String?` à `String`, avec
`onDelete: Cascade` — correct, `SetNull` étant impossible sur une colonne
obligatoire. 10 modèles, 6 énumérations, `CalibrationLog` toujours seule table
hors 3.7.

**RLS table par table — renforcée, pas cassée.** Les dix blocs métier sont
identiques au tour 1 (`ENABLE ROW LEVEL SECURITY` + `REVOKE ALL FROM anon,
authenticated`, aucune policy), et `_prisma_migrations` a désormais le sien
(lignes 119-134), protégé par un `DO` qui n'échoue pas si le fichier est joué
avant la première migration — bon réflexe. V1 balaie `pg_tables` sans liste en
dur et lève une exception en nommant toute table non couverte : c'est plus fort
que ce que je demandais, puisque cela couvre aussi les tables futures.
`ALTER DEFAULT PRIVILEGES` porte maintenant `FOR ROLE %I` calculé sur le rôle
courant, avec `RAISE NOTICE`, et le rôle d'exécution est imposé en tête de
fichier comme étant celui de `DIRECT_URL` — constat 13 fermé proprement.

**Aucun double crédit sur rejeu — toujours vrai, et mieux.** Les quatre verrous
du tour 1 subsistent : `SELECT … FOR UPDATE`, `evenementId` déjà journalisé,
`etatAttendu` différent, et l'unique `(session_id, raison)` — devenu réellement
opérant maintenant que la colonne est obligatoire. Le nouveau créditeur T12 passe
par le même `crediterEtape()` et le même unique (9.4, point 3) : un rattrapage ne
peut pas créditer deux fois. Le crédit est désormais dans la transaction, sans
exception, et `creditDiffere` a disparu de la sortie — 9.3 et 8.3 disent enfin la
même chose. Je n'ai trouvé aucun chemin de double crédit ; le défaut du barème
est l'inverse, un crédit qui manque (constat 20).

**PRD-12 sans `etat_avant_pause` — toujours tenu.** Les transitions ont été
renumérotées (`TRANSITION_VUE` passe de T7 à T6, `PAUSE_DEMANDEE` de T8 à T7,
`PAUSE_TERMINEE` de T9 à T8) et l'invariant survit : `etape_courante` est
incrémenté par `TRANSITION_VUE` avant l'entrée dans l'état suivant, la pause
n'est accessible que depuis `etape_lecture` et `etape_maths`, donc
`etapes_prevues[etape_courante].matiere` désigne toujours l'étape quittée. Le
`CHECK session_etape_courante_coherente` est inchangé (lignes 257-263) et impose
toujours `etape_courante IS NOT NULL` dans les quatre états concernés, `pause`
comprise. T12 mène à `termine` depuis n'importe quel état non final : j'ai
vérifié les deux clauses du CHECK pour chacun, aucune n'est violée.

**Secrets — inchangé.** 27 variables, 3 publiques, aucune n'est un secret ; les
deux ajoutées (`UPLOAD_MAX_PHOTO_OCTETS`, `UPLOAD_MAX_AUDIO_OCTETS`) sont
serveur. D1 énonce désormais correctement son exception — un `GET` sans clé sur
un bucket public qui ne contient aucune donnée personnelle — et cette phrase est
maintenant vraie, ce qui n'était pas le cas au tour 1.

**Couverture REQ-TEC / REQ-SEC.** Les deux éléments défaillants du tour 1 sont
réparés : la règle grep de TEC-17 passe réellement (E.5), et `src/lib/validation/json.ts`
figure maintenant dans l'arborescence. TEC-09 porte « couverte sous condition »
avec sa ligne de traçabilité rédigée (16.1) conformément à ARB-11. **Aucune
exigence n'est citée sans un élément qui la porte : zéro [BLOQUANT] à ce titre,
pour le deuxième tour consécutif.**

---

## E. Sorties réelles de mes commandes

### E.1 `prisma validate` — rejoué par moi

```
$ cd /home/user/Tipi && npm install prisma@5.22.0 --prefix $SP/prisma-check --no-audit --no-fund
added 6 packages in 3s

$ cd /home/user/Tipi && DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
  DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
  $SP/prisma-check/node_modules/.bin/prisma validate --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 8.0.0-rc.15                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
---exit:0---
```

Reproduit à l'identique, bannière comprise. La condition de recevabilité de ma
fiche (point 8) est remplie pour le tour 2. Le choix de rester en 5.22.0 est
défendable et l'architecte le motive ; je note seulement que `controle-code`
devra trancher la version en V1, puisque `10-stack.mdc` n'en impose aucune.

### E.2 Recomptage indépendant du corpus TTS et de sa ventilation

Instrument écrit par moi, sans reprendre celui de 17.3 : mêmes règles de lecture
(canal ≠ `affiche`), `{prenom}` → « Evan », `{matiere}` → « la lecture » / « les
maths » selon la table `jeton_matiere` de `content/encouragements.json`,
déduplication sur le texte rendu.

```
entrees lues        : 454
clips distincts     : 474
caracteres          : 21016
moyenne             : 44.3
part quota          : 2.10 %
A public sans jeton : 420 clips, 19105 car.
B public {matiere}  : 40 clips, 1372 car.
C prive  {prenom}   : 14 clips, 539 car.
les DEUX jetons     : 0
public total        : 460 clips
```

### E.3 Les six clés et les clés de couverture des cinq états limites

Les six clés, dans le dépôt :

```
content/encouragements.json:148:        "lecture.vide.corps",
content/encouragements.json:149:        "maths.vide.corps",
docs/agents/P1/produit-marketing.out.md:474  (condition « Étape vide, suite existante »)
docs/agents/P1/produit-marketing.out.md:475  (condition « Étape vide, pas de suite »)
docs/agents/P1/produit-marketing.out.md:830-832  lecture.vide.corps / .corps_2.suite / .corps_2.fin
docs/agents/P1/produit-marketing.out.md:1028-1030 maths.vide.corps / .corps_2.suite / .corps_2.fin
```

Groupes de `cles_fixes_non_variees` (9 groupes ; le cinquième est celui en cause) :

```
5 ["lecture.pas_entendu.corps","lecture.pas_entendu.corps_2","lecture.micro_absent.corps",
   "lecture.sans_voix.corps","maths.sans_indice.corps","lecture.vide.corps",
   "maths.vide.corps","enfant.programme.souci.corps"]   -> 8 clés, dont 2 à retirer
```

Les 17 clés de couverture citées en 10.3, comptées dans
`produit-marketing.out.md` + `content/*.json` — **aucune absente** :

```
  1  parent.scan.sans_devoir.bouton          22  enfant.accueil.vide.titre
  1  parent.scan.sans_devoir.confirmation    22  enfant.accueil.vide.corps
  1  parent.scan.sans_devoir.valider          1  enfant.accueil.vide.bouton
  4  parent.apercu.vide                       5  parent.scan.illisible
 45  enfant.accueil.souci                    22  maths.blocage.corps_2
 22  lecture.blocage.corps_2                 47  enfant.accueil.reprise
  1  lecture.reprise.corps_2                  1  maths.reprise.corps_2
  1  parent.resume.etape_passee               2  enfant.programme.souci.corps
  3  parent.apercu.echec
```

Condition 7.12 à élargir, vérifiée :
`produit-marketing.out.md:1498: | Session arrêtée par le parent | « La séance a
été arrêtée avant la fin. Les pierres acquises sont conservées. » |`

### E.4 Toutes les occurrences de « bonus » dans le livrable

```
69   (tableau de reprise ARB-08)       322-323 (renommage de l'énumération)
914  T5  <-- SEUL CRÉDITEUR           993  (tableau du barème 9.5)
995, 1005 (formulation canonique)     1515-1516, 1536 (TRACEABILITY 16.2)
1558 (note prisma validate)
```

Aucune occurrence sur les lignes T10 (919) ni T12 (921). Constat 20.

### E.5 Les règles grep, et la chasse au cinquième endroit du barème

Ancienne règle du tour 1, sur l'arborescence reconstituée — annoncée « zéro
résultat » :

```
$ grep --version | head -1
grep (GNU grep) 3.11
$ grep -ril deepseek src/ --exclude-dir=ai/providers
src/config/env.ts
src/lib/ai/index.ts
src/lib/ai/providers/deepseek.ts
```

Nouvelle règle R1 :

```
$ grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)'
(aucune ligne)  ---exit:1---
```

**Trois fichiers avant, zéro après.** La correction est exacte et la publication
des deux sorties est conforme à la règle 2 de `40-protocole-agents.mdc`.

Chasse au cinquième endroit du barème, sur tout le dépôt :

```
$ grep -rn "bonus pour 2 étapes|\+1 bonus|bonus si les 2|2 étapes du soir" \
       --include=*.md --include=*.mdc --include=*.prisma --include=*.sql .
prisma/schema.prisma:77           ÉCART ASSUMÉ ET TRACÉ … (conforme, endroit n°2)
supabase/policies.sql:177         ARB-08 … (conforme, endroit n°3)
TIPI-PROMPT-CURSOR.md:270         « +1 bonus si les 2 étapes du soir » (source 3.7, normal)
TIPI-PROMPT-CURSOR.md:667         « +1 bonus pour 2 étapes »   <-- NON CITÉ (fiche tests-unitaires)
.cursor/agents/tests-unitaires.md:12  « +1 bonus pour 2 étapes » <-- NON CITÉ
docs/agents/P1/produit-marketing.out.md:1148 « +1 bonus si les 2 étapes du » <-- NON CITÉ
```

Constat 22.

### E.6 Le glob corrigé

```
$ sed -n '1,4p' .cursor/rules/30-copy-enfant.mdc
---
description: Règles de rédaction des textes destinés à l'enfant et des prompts IA
globs: ["content/**", "src/app/enfant/**", "src/components/enfant/**", "src/components/pilou/**", "src/lib/ai/prompts/**"]
---
```

`gwenn` supprimé. `src/app/bienvenue/**` manque — section B.3.

### E.7 Conformité mécanique à la section 3.7

Extraction des noms de colonnes réels de `schema.prisma` (via `@map`), comparée
aux champs de la section 3.7 :

```
OK family             manquants: aucun  | ajouts: created_at, retention_audio_jours, calibration_active
OK child              manquants: aucun  | ajouts: onboarding_termine_le, created_at, updated_at
OK homework           manquants: aucun  | ajouts: confiance_ocr, saisie_manuelle
OK exercise           manquants: aucun  | ajouts: ordre, created_at
OK session            manquants: aucun  | ajouts: evenements, soir_leger, arret_parent, created_at, updated_at
OK attempt            manquants: aucun  | ajouts: nb_sollicitations, mots_hesitants, created_at, updated_at
OK gem_ledger         manquants: aucun  | ajouts: aucun
OK reward_threshold   manquants: aucun  | ajouts: created_at
OK settings_access    manquants: aucun  | ajouts: aucun
modeles: 10 | tables hors 3.7: calibration_log | enumerations: 6
AUCUN CHAMP DE 3.7 MANQUANT
```

### E.8 Comptes de `.env.example` et des chemins de route

```
$ grep -cE '^[A-Z][A-Z0-9_]*=' .env.example        -> 27
$ grep -cE '^NEXT_PUBLIC_' .env.example            -> 3
   NEXT_PUBLIC_TTS_CACHE_URL, NEXT_PUBLIC_SPEECH_PROVIDER, NEXT_PUBLIC_APP_VERSION
$ (lignes du tableau de la section 11)             -> 27
$ (chemins /api/ distincts, après normalisation)   -> 35 dont 3 non-routes
   (/api/pierres « qui n'existe pas » en 7.1, le glob /api/reglages/**,
    et src/app/api/coffre/route.ts issu de la sortie grep de 17.2)  ->  32 routes
```

---

## F. Historique du tour 1 : le sort des 19 constats

Vérifié dans les fichiers livrés, pas dans le tableau de reprise de la section 0.

| # | Tour 1 | Gravité | Sort au tour 2 | Vérifié où |
| --- | --- | --- | --- | --- |
| 1 | Prénom de l'enfant dans le bucket public | [MAJEUR] | **FERMÉ.** Deux buckets, séparation par jeton, 14 clips au privé, trois affirmations fausses supprimées y compris dans `policies.sql` | B.1, E.2 ; `policies.sql` l. 312, 332, 339 |
| 2 | Règle grep de TEC-17 impassable | [MAJEUR] | **FERMÉ.** Règle réécrite, ancienne et nouvelle sorties publiées, affirmation « seul fichier du dépôt » corrigée en « seul fichier qui connaît le protocole » | E.5 ; § 5.1, 17.2 |
| 3 | `_prisma_migrations` non couverte, D1 fausse | [MAJEUR] | **FERMÉ, au-delà.** Bloc dédié + V1 qui balaie `pg_tables` sans liste en dur | `policies.sql` l. 119-134, 355-364 |
| 4 | `creditDiffere` contre transaction unique | [MAJEUR] | **FERMÉ.** Crédit dans la transaction, `creditDiffere` et `TIPI_CREDIT_DIFFERE` supprimés, `bravo.pierres_plus_tard` rattaché à une cause réelle | § 8.3, 9.3, 9.4, 10.1 |
| 5 | Session périmée bloquant les soirées suivantes | [MAJEUR] | **FERMÉ.** T12 `CLOTURE_AUTOMATIQUE` gardée par `session.date`, déclenchée par `GET /api/etat` et `POST /api/session`, cinquième ligne au tableau PRD-16 | § 8.1, 8.3, 9.2, 10.2 |
| 6 | Qui rend `{prenom}` : 12.2 contre 8.4 | [MAJEUR] | **FERMÉ.** Règle unique « le client ne rend jamais un jeton », séquence client réécrite, troisième ligne de budget | § 8.4, 12.1, 12.2 |
| 7 | `POST /api/indices` sans `sessionId` | [MAJEUR] | **FERMÉ.** `sessionId` ajouté, effet d'écriture contractualisé dans la même transaction, garde `niveau > nbIndicesUtilises + 1` | § 8.4 |
| 8 | `gem_ledger.session_id` nullable | [MINEUR] | **FERMÉ.** Colonne obligatoire, `onDelete: Cascade`, motif commenté | `schema.prisma` l. 302-317 |
| 9 | Deux étapes de même matière | [MINEUR] | **FERMÉ.** Garde `TIPI_ETAPES_MEME_MATIERE`, clé `parent.apercu.echec.*` vérifiée existante | § 8.3, 10.1 ; E.3 |
| 10 | « Trois contraintes » au lieu de huit | [MINEUR] | **FERMÉ.** Les huit listées nommément dans l'en-tête du schéma, avec leur exigence | `schema.prisma` l. 9-19 |
| 11 | Trois renvois de section faux | [MINEUR] | **FERMÉ.** Les trois corrigés | `schema.prisma` l. 8 ; `.env.example` ; `policies.sql` l. 304 |
| 12 | `src/lib/validation/` absent de l'arborescence | [MINEUR] | **FERMÉ.** `src/lib/validation/json.ts` ajouté avec sa responsabilité | § 2, 3.2 |
| 13 | `ALTER DEFAULT PRIVILEGES` sans `FOR ROLE` | [MINEUR] | **FERMÉ.** `FOR ROLE %I` + `RAISE NOTICE` + rôle imposé en tête de fichier | `policies.sql` l. 8-13, 137-146 |
| 14 | Partie D en commentaires | [MINEUR] | **FERMÉ.** Huit blocs `DO $$` qui lèvent une exception ; limite assumée par écrit | `policies.sql` l. 345-476 |
| 15 | Tailles d'upload dupliquées | [MINEUR] | **FERMÉ.** Deux variables, duplication nommée comme la seule du livrable, V7 les affiche | § 11 ; `policies.sql` l. 290, 452-461 |
| 16 | Seuil de 400 ms sans propriétaire | [MINEUR] | **FERMÉ.** `src/config/ui.config.ts`, avec le partage serveur/client motivé | § 2, 12.1, 13 |
| 17 | PRD-13 : pas de porte vers le cookie parent | [MINEUR] | **FERMÉ.** `SortieParent.tsx`, cookie porté (`reglages` / `sortie_session`), attribué à V7 | § 8.6, 14 |
| 18 | TEC-09 réservée, non portée | [MINEUR] | **FERMÉ.** ARB-11 appliqué, ligne de `TRACEABILITY.md` rédigée | § 16.1 |
| 19 | `CHECK` 0..365 contre route 0/7/30 | [MINEUR] | **FERMÉ.** Assumé comme deux niveaux distincts, écrit des deux côtés | § 3.3 ; `policies.sql` |

**19 sur 19 fermés.** Aucun n'a été versé au backlog, y compris les deux que
j'autorisais à l'être. Plusieurs corrections vont au-delà de ce que je demandais
(V1 sans liste en dur, partie D exécutable, séparation des règles R2/R3
écriture/lecture) : je le note parce que ce sont elles qui rendent les preuves
rejouables par `securite-rgpd` et `red-team` en P7.

---

## G. Deux observations hors livrable — elles ne comptent pas dans le verdict

Elles ne portent pas sur les quatre livrables de `architecte` et ne sauraient
donc lui être imputées. Elles vous reviennent.

**G.1 — ARB-12 n'existe pas dans `GATES.md`.** Votre message annonce « mes
arbitrages **ARB-08 à ARB-12**, tracés dans `docs/agents/GATES.md` — lis-les,
ils font foi ». Le fichier contient ARB-08, ARB-09, ARB-10 et ARB-11. **ARB-12
est absent.** L'architecte l'a d'ailleurs relevé à sa façon : sa section 0.3 dit
« sous les numéros **ARB-08 à ARB-11** » et range le glob comme « (sans numéro à
ce jour) », tandis que sa section 0.4 s'intitule « Reprise après ARB-12 » et cite
« ARB-12.1 » et « ARB-12.2 » — deux décisions qui ne sont écrites nulle part
ailleurs que dans son propre rapport.

Or ARB-12 est l'arbitrage qui gouverne les deux points que vous m'avez demandé
de juger en priorité. S'il reste hors de `GATES.md`, le retrait des six clés et
la formulation du barème n'auront, pour tout agent en aval, **aucune source
opposable** : ni `contenu-enfant`, qui doit exécuter les deux points de 10.3, ni
`recette-finale`, qui ne lit pas les rapports de P2. Le journal de `GATES.md`
ne porte par ailleurs aucune entrée pour G2, alors que deux tours ont eu lieu.

**G.2 — `src/app/bienvenue/**` manque au glob que vous avez corrigé.** Détaillé
en B.3, avec la valeur complète recommandée. C'est ma remarque du tour 1, et
elle sera close avec cette entrée.

---

## H. Ce qu'il faut pour un PASS au tour 3

Les trois [MAJEUR] se corrigent en trois clauses et une liste ; aucun ne demande
de refonte, et aucun ne remet en cause une décision d'architecture.

1. **Constat 20** — étendre le rattrapage de T10 et T12 au
   `bonus_soiree_complete` : deux lignes du tableau 9.2 et une phrase en 9.4.
   C'est le seul des trois qui coûte une pierre à un enfant.
2. **Constat 21** — corriger l'arithmétique de 9.5 (2 étapes = 3 pierres),
   retirer « y compris dans son coffre », et remonter le conflit ARB-06 / ARB-08
   comme point ouvert plutôt que le déclarer résolu.
3. **Constat 22** — remplacer « quatre endroits » par la liste réelle, et ouvrir
   un point sur `.cursor/agents/tests-unitaires.md` et `TIPI-PROMPT-CURSOR.md`
   §5.1, qui feront écrire un test sur la règle révoquée.

Les trois [MINEUR] (23, 24, 25) tiennent en une phrase chacun et peuvent être
traités dans le même tour.

Je n'ai proposé **aucune refonte** : chaque correction attendue est une clause,
une liste ou une phrase, adossée à une exigence ou à un arbitrage nommé. Je n'ai
écrit **aucun fichier de production**, ni commit git.
