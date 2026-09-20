# P2 — Contrôle adversarial de l'architecture

VERDICT: FAIL

Contrôleur : `controle-architecture` (lecture seule). Porte G2, tour 1.
Livrables contrôlés : `docs/agents/P2/architecture.out.md`, `prisma/schema.prisma`,
`supabase/policies.sql`, `.env.example`.

Sources lues en entier : `TIPI-PROMPT-CURSOR.md` (2.3, 2.4, 3.2, 3.3, 3.6, 3.7,
4.3), `docs/agents/P1/produit-marketing.out.md`,
`docs/agents/P1/contenu-enfant.out.md`, `content/encouragements.json`,
`content/gwenn-scripts.json`, `docs/agents/GATES.md` (ARB-01 à ARB-07),
`.cursor/rules/30-copy-enfant.mdc`, `.cursor/rules/40-protocole-agents.mdc`
(section « Corriger un instrument de mesure »).

**7 [MAJEUR], 12 [MINEUR], 0 [BLOQUANT].** Un seul [MAJEUR] impose FAIL.

`prisma validate` a été rejoué et reproduit à l'identique : la condition de
recevabilité du point 8 de ma fiche est remplie, la sortie est en section D.
Le verdict FAIL ne porte donc pas sur le schéma Prisma, qui est le livrable le
plus solide des quatre.

---

## A. Constats

### [MAJEUR] 1 — Le bucket public `tts-cache` contiendra le prénom de l'enfant, prononcé à voix haute. Trois affirmations du livrable le nient.

Le livrable affirme trois fois que ce bucket ne contient aucune donnée
personnelle.

`architecture.out.md`, décision D1 :

> « Le seul objet que le client va chercher directement est un clip audio du
> cache TTS, qui est public par construction et **ne contient aucune donnée
> personnelle** (TEC-09b). »

`architecture.out.md`, section 4 :

> « `tts-cache` est public **en lecture seule** — une seule policy `SELECT` —
> parce qu'il ne contient que la voix de Pilou disant **des phrases identiques
> pour tous**, et que le chemin est un sha256 du texte. »

`supabase/policies.sql`, lignes 235-240 :

> « le contenu est la voix de Pilou disant des phrases de la banque de contenu,
> **identiques pour tous, sans aucune donnée identifiante**. Le chemin est un
> sha256 du texte rendu : il n'est pas énumérable et ne révèle rien. »

C'est faux, et c'est le livrable lui-même qui le prouve. La clé de cache est
`sha256(voixId + "|" + modele + "|" + texteRendu)` (section 12.2) — **le texte
rendu**, donc jeton `{prenom}` déjà remplacé. J'ai recompté le corpus : sur les
474 clips pré-chauffés, **14 contiennent `{prenom}`** et seront donc synthétisés
avec « Evan » dans la bande son, puis déposés dans un bucket public :

```
clips LUS contenant {prenom}: 14
 - accueil | enc.accueil.01 | Bonsoir {prenom}. Je suis contente de te voir.
 - accueil | enc.accueil.03 | Salut {prenom}. Ton tipi est prêt.
 - accueil | enc.accueil.06 | Bonsoir {prenom}. Le tipi t'attendait.
 - accueil | enc.accueil.09 | Te voilà, {prenom}. On y va doucement.
 - accueil | enc.accueil.12 | Bonsoir {prenom}. Ici, on prend son temps.
 - accueil | enc.accueil.14 | Coucou {prenom}. Tu es là, c'est bien.
 - accueil | enc.accueil.17 | Bonsoir {prenom}. On fait un petit moment ensemble.
 - accueil | enc.accueil.20 | Te voilà, {prenom}. Ce moment est à nous deux.
 - reprise_session | enc.reprise_session.01 | Te revoilà, {prenom}. On reprend là où on en était.
 - reprise_session | enc.reprise_session.02 | Bonsoir {prenom}. On continue notre travail.
 - reprise_session | enc.reprise_session.10 | Bonsoir {prenom}. On reprend doucement, sans tout refaire.
 - reprise_session | enc.reprise_session.14 | Bonsoir {prenom}. On termine ensemble ce soir.
 - reprise_session | enc.reprise_session.20 | Bonsoir {prenom}. On finit le chemin, doucement.
 - gwenn | bravo.titre | Bravo {prenom}.
```

Et la mesure de 21 016 caractères de la section 12.2 n'est reproductible **que**
si l'on rend `{prenom}` en « Evan » (section D.2 ci-dessous) : l'architecte a
donc bien pré-chauffé ces 14 clips avec le prénom dedans. La phrase « phrases
identiques pour tous » est contredite par sa propre mesure.

L'argument « le chemin est un sha256, il n'est pas énumérable » ne tient pas
davantage : `content/encouragements.json` est versionné dans le dépôt, `voixId`
et `modele` sont dans `mascot.config.ts` (DES-09, donc importable côté client).
Quiconque a le dépôt peut calculer les 474 chemins pour un prénom deviné, et
**confirmer le prénom de l'enfant** par un simple `GET 200`/`404`. Un sha256
d'un corpus public n'est pas un secret, c'est un index.

Correction attendue : soit ne jamais pré-chauffer ni cacher un clip portant
`{prenom}` dans le bucket public (les 14 clips passent par `POST /api/voix`,
bucket privé et URL signée), soit rendre `tts-cache` privé et servir tous les
clips par URL signée — et dans les deux cas corriger les trois affirmations
citées, y compris le commentaire de `supabase/policies.sql`.

---

### [MAJEUR] 2 — TEC-17 : la seule preuve opposable de confinement de DeepSeek ne peut pas passer, et l'affirmation qu'elle défend est fausse.

`architecture.out.md`, section 5.1, reprise telle quelle en section 16 comme
l'élément qui porte TEC-17 :

> « `src/lib/ai/providers/deepseek.ts` est **le seul fichier du dépôt où la
> chaîne « deepseek » a le droit d'apparaître**, avec `.env.example` et ce
> document. Règle opposable : `grep -ril deepseek src/ --exclude-dir=ai/providers`
> doit renvoyer zéro résultat. `controle-code` peut la rejouer à chaque
> verticale. »

Deux défauts, tous deux vérifiés :

**(a) `--exclude-dir=ai/providers` n'exclut rien.** GNU grep compare le motif au
**nom de base** du répertoire ; un motif contenant `/` ne correspond jamais. J'ai
reconstitué l'arborescence minimale décrite par le livrable et rejoué la règle
(sortie complète en D.3) : elle renvoie `src/lib/ai/providers/deepseek.ts`
lui-même. La règle ne peut donc **jamais** renvoyer zéro, quelle que soit la
qualité du code.

**(b) Corrigée, elle reste fausse.** Avec `--exclude-dir=providers`, il reste
deux fichiers que le livrable impose lui-même :

- `src/lib/ai/index.ts`, décrit en section 2 comme « fabrique, lit `AI_PROVIDER` » :
  une fabrique doit associer la valeur `"deepseek"` à son implémentation et
  importer `./providers/deepseek`.
- `src/config/env.ts`, dont la section 11 fixe pour `AI_PROVIDER` : « Défaut
  `deepseek` ». Un défaut est un littéral dans le parse Zod.

La règle renvoie donc au minimum deux fichiers hors `providers/`. C'est le seul
instrument de preuve nommé pour TEC-17 ; il condamne `controle-code` à un
[MAJEUR] mécanique à chaque verticale.

Correction attendue : énoncer la règle sur le périmètre réel, par exemple
`grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)$'`
doit renvoyer zéro, **et** réécrire l'affirmation « le seul fichier du dépôt »
en « le seul fichier qui connaît le protocole du fournisseur ; la fabrique et le
parse d'environnement en connaissent le nom ». Publier la sortie de la règle
corrigée, conformément à `40-protocole-agents.mdc` § « Corriger un instrument de
mesure », règle 2.

Note : la même faiblesse frappe la règle de la section 7.2,
`grep -rn "gemLedger.create\|gemBalance" src/ --include=*.ts` « ne doit renvoyer
que `src/lib/pierres/service.ts` et `scripts/verifier-solde.ts` » — `scripts/`
n'est pas sous `src/` et ne peut donc pas figurer dans le résultat, et
`GET /api/coffre` (budget 12.1 : « 1 lecture `child` + paliers ») lira forcément
`gemBalance`. Je ne la compte pas séparément ; elle doit être corrigée dans le
même mouvement.

---

### [MAJEUR] 3 — SEC-03 : `_prisma_migrations` n'est couverte par aucune ligne de `policies.sql`, et la requête de preuve D1 de l'architecte ne rendrait pas le résultat qu'elle annonce.

`supabase/policies.sql`, partie D :

> « -- D1. Toutes les tables du schéma public ont RLS activée. Attendu : 0 ligne.
> -- SELECT tablename FROM pg_tables
> --  WHERE schemaname = 'public' AND rowsecurity IS FALSE; »

La partie A traite **dix** tables : `family`, `child`, `homework`, `exercise`,
`session`, `attempt`, `gem_ledger`, `reward_threshold`, `settings_access`,
`calibration_log`. Or l'en-tête du fichier précise que les tables sont créées
par `prisma migrate deploy`, qui crée **aussi** `public._prisma_migrations`.
Cette table n'a ni `ENABLE ROW LEVEL SECURITY`, ni `REVOKE`. D1 renverrait donc
`_prisma_migrations`, c'est-à-dire **1 ligne au lieu de 0** : la preuve rendue
par l'architecte pour SEC-03 échoue sur son propre critère d'acceptation.

Sur le fond, SEC-03 dit « RLS activée sur **toutes** les tables Supabase ». Le
`REVOKE USAGE ON SCHEMA public` (ligne 117) atténue, mais le livrable présente
explicitement cinq couches de défense en profondeur (section 4, points 1 à 5) :
il en manque quatre sur cinq pour cette table. C'est exactement la surface n° 4
de `red-team`.

Correction attendue : ajouter à la partie A le bloc `ALTER TABLE
public._prisma_migrations ENABLE ROW LEVEL SECURITY; REVOKE ALL ON
public._prisma_migrations FROM anon, authenticated;`, ou rendre D1 générique et
capable de nommer toute table future non couverte. Corriger aussi la section 16,
qui écrit « RLS activée sur les 10 tables » là où SEC-03 exige « toutes ».

---

### [MAJEUR] 4 — Le « crédit différé » de la section 8.3 est impossible si la section 9.3 dit vrai, et il n'a pas de chemin de rejeu depuis un état final.

Deux passages du même document se contredisent sur le chemin le plus sensible du
produit.

`architecture.out.md`, section 8.3, route `POST /api/session/{id}/transition` :

> « **Crédit différé** | Si l'écriture des pierres échoue **alors que la
> transition a réussi**, la réponse porte `creditDiffere: true` : l'écran de
> clôture joue `bravo.pierres_plus_tard` et **le crédit est rejoué au prochain
> appel** (ETH-04). »

`architecture.out.md`, section 9.3 :

> « Chaque appel de `appliquerEvenement()` exécute **une seule transaction
> Prisma** : […] 5. effets de bord de la table 9.2, **dont les crédits de
> pierres** ; 6. `UPDATE session` […] ; 7. commit. […] Une coupure de courant
> laisse soit l'ancien état complet, soit le nouveau état complet. »

Si le crédit est dans la transaction, son échec **annule la transition** :
`creditDiffere: true` ne peut jamais être renvoyé, et l'état n'avance pas. S'il
est hors transaction pour permettre le cas différé, alors la garantie « dans la
même transaction que ses effets » de 9.3 est fausse, et l'invariant
`gem_balance == SUM(gem_ledger.delta)` que 7.3 et la requête D6 revendiquent
peut être violé transitoirement.

Second défaut, indépendant : « rejoué au prochain appel » n'existe pas dans deux
cas. La table 9.2 pose que « depuis `abandon_parent` et `termine`, **aucune
transition n'est possible** : ce sont des états finaux ». Or T11
(`ABANDON_PARENT`) crédite (« crédit des étapes déjà terminées et non encore
créditées ») et mène directement à un état final. Un crédit différé sur T11 n'a
donc **aucun appel suivant** pour être rejoué, et la section 7.1 garantit qu'« il
n'existe aucune route qui accepte un montant ». Les pierres sont perdues
définitivement — ETH-04 dit « les pierres ne se perdent jamais ».

Correction attendue : trancher la sémantique (je recommande : crédit **dans** la
transaction, `creditDiffere` supprimé, et l'idempotence par `(session_id,
raison)` suffit au rejeu naturel), ou bien décrire explicitement le porteur du
rattrapage (job de réconciliation nommé, ou rejeu à la lecture de
`GET /api/coffre`) et retirer de 9.3 la phrase « dans la même transaction que
ses effets ».

---

### [MAJEUR] 5 — Une session non close bloque toutes les soirées suivantes, et le livrable ne nomme aucune sortie. Cela contredit « aucun état n'est une impasse ».

Trois éléments combinés produisent une impasse :

1. `supabase/policies.sql`, partie B :
   `CREATE UNIQUE INDEX … session_une_active_par_enfant ON public.session (child_id) WHERE etat NOT IN ('termine', 'abandon_parent');`
2. `architecture.out.md`, 8.3 : `POST /api/session` renvoie
   `409 TIPI_SESSION_DEJA_ACTIVE (unique partiel)`.
3. `architecture.out.md`, 9.2 : depuis `etape_lecture` / `etape_maths`, le seul
   chemin vers un état final hors clôture normale est T11 `ABANDON_PARENT`, dont
   la garde est « **cookie parent valide** ».

Conséquence : si l'enfant s'arrête au milieu d'une étape un soir et que
personne ne clôt la session, **le lendemain le parent ne peut plus lancer de
session** — `409`, mappé en `parent.apercu.lancement_echec.*` (section 10.1). Et
`GET /api/etat`, qui « cherche la session dont l'état n'est ni `termine` ni
`abandon_parent` », renverra l'enfant sur **les devoirs de la veille**.

`session.date` existe dans le schéma et est indexée (`@@index([childId, date])`),
mais **aucune garde de la section 9 ni aucune route ne la lit** pour borner la
reprise à la soirée en cours. Aucune expiration n'est décrite nulle part.

Cela contredit frontalement la section 10.2 :

> « **Aucun état de cette section n'est une impasse** : chacun a au moins un
> bouton. »

Correction attendue : nommer l'élément qui ferme une session périmée — soit une
garde sur `session.date` dans `GET /api/etat` et `POST /api/session` (une
session d'une date antérieure est close automatiquement en `termine`, pierres
acquises conservées), soit une transition explicite déclenchée côté parent, avec
son code d'erreur et sa clé de contenu. Et décrire le cas « reprise le
lendemain » dans le tableau des états limites de 10.2, car c'est le seul des
quatre cas de PRD-16 dont le chemin de récupération n'est pas complet.

---

### [MAJEUR] 6 — Le cache TTS ne peut pas fonctionner comme décrit : 12.2 exige que le client rende `{prenom}`, 8.4 interdit que le client le rende.

`architecture.out.md`, section 8.4, route `POST /api/voix` :

> « **Décision** | La route **n'accepte jamais de texte libre**. Elle résout
> elle-même le texte depuis `content/**` ou depuis la base. Deux raisons : un
> client ne peut pas brûler le quota TTS avec du texte arbitraire, et **le rendu
> du jeton `{prenom}` reste côté serveur**. »

`architecture.out.md`, section 12.2, séquence côté client :

> « 1. calculer la clé du **texte rendu** (le texte est déjà connu : il vient de
> `content/**` ou de la réponse d'une route) ; 2. `GET
> {NEXT_PUBLIC_TTS_CACHE_URL}/<voixId>/<clé>.mp3` ; 3. `200` → lecture immédiate
> (150 ms) »

La clé étant `sha256(voixId + "|" + modele + "|" + texteRendu)`, le client doit
rendre `{prenom}` lui-même pour la calculer. Soit il le fait — et 8.4 est faux —
soit il ne le fait pas, et **les 14 clips du constat 1 ne touchent jamais le
cache** : ils paient systématiquement le chemin « cache manqué » à 900 ms
(12.1), dont les deux situations les plus fréquentes du produit, `accueil`
(premier son de chaque soirée) et `reprise_session`.

Le budget de latence de 12.1 (« TTS, cache touché : 150 ms ; Pilou parle tout de
suite ») n'est donc pas tenu sur la première phrase que l'enfant entend chaque
soir.

Correction attendue : trancher qui rend le jeton et le dire une seule fois. La
résolution cohérente avec le constat 1 est : le serveur rend le jeton, les clips
à `{prenom}` ne sont pas dans le bucket public, et `POST /api/voix` renvoie une
URL signée pour ceux-là — avec le budget de latence de 12.1 corrigé en
conséquence pour `accueil` et `reprise_session`.

---

### [MAJEUR] 7 — `POST /api/indices` ne peut pas tenir la garde qu'on lui prête, ni alimenter la reprise PRD-18 : son schéma d'entrée ne porte pas la session.

`architecture.out.md`, section 8.4 :

> « **`POST /api/indices`** | Entrée | `{ exerciseId: Uuid, niveau: 1..4 }` »
> « Erreurs | `400 TIPI_VALIDATION` si `niveau` > 4 ou **si le niveau demandé
> dépasse de plus de 1 le dernier servi** »
> « Règles | **Un indice par appel**, jamais le tableau complet : le client ne
> peut pas afficher le niveau 4 d'emblée. »

Et section 9.3, reprise :

> « Le client repart avec le snapshot, **les indices déjà déroulés
> (`attempt.nb_indices_utilises`)** et l'exercice en cours. »

« Le dernier servi » et `indicesDejaVus` du `Snapshot` (8.3) vivent dans
`attempt.nb_indices_utilises`. Or la ligne `attempt` est identifiée par
`@@unique([sessionId, exerciseId])` (`prisma/schema.prisma`, ligne 273) : **sans
`sessionId` en entrée, la route ne peut ni lire ni écrire cette ligne**. Le
contrat ne décrit d'ailleurs aucun effet d'écriture pour cette route, alors
qu'il est le seul endroit où le compteur peut avancer — `POST
/api/session/{id}/tentative` existe, mais rien n'impose au client de l'appeler à
chaque indice, et le livrable ne le dit pas.

Conséquences : la garde anti-saut-au-niveau-4 (PED-02, promesse produit) et la
persistance des indices déroulés à la reprise (PRD-18) reposent sur un élément
qui, tel que contractualisé, ne peut pas les porter.

Atténuation partielle : l'unique partiel `session_une_active_par_enfant`
garantit au plus une session active, donc le serveur **pourrait** résoudre la
session implicitement — mais ce n'est écrit nulle part, et la DoD de
`architecte` exige « le contrat de chaque route serveur : chemin, méthode,
schéma Zod d'entrée et de sortie ».

Correction attendue : ajouter `sessionId: Uuid` à l'entrée de `POST
/api/indices`, et énoncer son effet d'écriture (upsert de
`attempt.nb_indices_utilises`) dans le contrat, dans la même transaction que la
lecture de l'indice.

---

### [MINEUR] 8 — `gem_ledger.session_id` est nullable : l'unique qui garantit l'idempotence du crédit ne s'applique pas aux `NULL`.

`architecture.out.md`, section 7.4 :

> « `delta > 0` et `delta <= 1` sont des `CHECK` Postgres (ETH-04),
> `gem_balance >= 0` aussi, et **l'unique `(session_id, raison)` rend un double
> crédit impossible même en cas de double appel**. »

`prisma/schema.prisma`, lignes 285 et 291-295 :

```
sessionId String?   @map("session_id") @db.Uuid
session   Session?  @relation(fields: [sessionId], references: [id], onDelete: SetNull)
@@unique([sessionId, raison])
```

PostgreSQL traite les `NULL` comme distincts dans un index unique (`NULLS
DISTINCT` par défaut). Deux lignes `(NULL, 'etape_lecture_terminee')` sont donc
acceptées. Aucun chemin de code décrit n'écrit `session_id = NULL` à la
création, mais `onDelete: SetNull` en produit, et surtout l'affirmation « rend un
double crédit impossible » est présentée comme une garantie de schéma : elle ne
l'est que si la colonne est obligatoire.

Correction attendue : rendre `sessionId` obligatoire sur `GemLedger` (aucun
crédit du barème de 3.7 n'existe hors session) — ou, à défaut, ajouter en partie
B un index unique `NULLS NOT DISTINCT` et nuancer la phrase de 7.4.

---

### [MINEUR] 9 — `POST /api/session` n'interdit pas deux étapes de la même matière, alors que la clé d'idempotence et l'énumération `RaisonGem` le supposent.

`architecture.out.md`, 8.3 : « Entrée | `{ etapes: [{ matiere: Matiere,
exerciseIds: Uuid[], dureeEstimeeMin: number }] (1..2), soirLeger: boolean }` » ;
seule erreur de validation citée : « `400 TIPI_VALIDATION` si plus de 2 étapes
(PED-06) ».

`prisma/schema.prisma`, lignes 71-75 : `RaisonGem` ne connaît que
`etape_lecture_terminee`, `etape_maths_terminee`, `bonus_deux_etapes`. Le barème
est donc indexé sur la **matière**, pas sur le rang de l'étape. Un programme à
deux étapes `lecture` — que le schéma Zod accepte — ferait échouer le second
crédit sur l'unique `(session_id, raison)` : soit une erreur serveur en pleine
clôture, soit une étape faite et non créditée.

Correction attendue : ajouter au contrat de `POST /api/session` la garde « les
matières des étapes sont deux à deux distinctes (PED-06) » avec son code
d'erreur, ou indexer `RaisonGem` sur le rang de l'étape.

---

### [MINEUR] 10 — L'en-tête de `prisma/schema.prisma` annonce trois contraintes déportées ; il y en a huit.

`prisma/schema.prisma`, lignes 9-12 :

> « **Trois contraintes** ne sont pas exprimables en Prisma et vivent dans
> supabase/policies.sql, partie B : le CHECK `delta > 0` de gem_ledger (ETH-04),
> l'unicité partielle « une seule session active par enfant » (PRD-18) et le
> CHECK `tentatives_echouees >= 0` (SEC-02). »

`architecture.out.md`, section 3.3 : « Prisma ne sait exprimer ni `CHECK` ni
index unique partiel : **ces huit contraintes** vivent dans
`supabase/policies.sql`, partie B ». La partie B en contient bien huit ; cinq
sont invisibles pour qui ne lit que le schéma (`delta <= 1`, `gem_balance >= 0`,
`gems_requis > 0`, `retention_audio_jours BETWEEN 0 AND 365`, cohérence
`etat`/`etape_courante`). Le schéma est le fichier que lira `dev-feature`.

Correction attendue : lister les huit, ou renvoyer à la partie B sans avancer de
compte.

---

### [MINEUR] 11 — Trois renvois de section faux dans les fichiers livrés.

- `prisma/schema.prisma`, ligne 8 : « La table de correspondance champ par champ
  est dans docs/agents/P2/architecture.out.md, **section 3.2** » — c'est la
  section **3.1** ; la 3.2 traite des colonnes Json.
- `.env.example`, ligne 15 : « Le détail « ce qui se passe si elle manque » est
  dans docs/agents/P2/architecture.out.md, **section 8** » — c'est la section
  **11** ; la 8 traite des routes serveur.
- `supabase/policies.sql`, ligne 240 : « donc le **budget de latence de 3.8**
  tient sans clé côté client » — 3.8 du prompt maître est « Tokens des deux
  thèmes » ; le budget de latence est la section **12** de l'architecture.

---

### [MINEUR] 12 — `src/lib/validation/` est nommé comme porteur de la validation des colonnes Json, mais n'existe pas dans l'arborescence.

`architecture.out.md`, section 3.2 :

> « Trois colonnes Json, chacune avec une forme fixe validée par Zod à l'écriture
> **et** à la lecture (`src/lib/validation/`). »

L'arborescence de la section 2 liste sous `src/lib/` : `db`, `ai`, `ocr`,
`voice`, `speech`, `session`, `pierres`, `lecture`, `maths`, `parent`, `storage`,
`notifications`, `errors`, `dates`. Pas de `validation`. La forme des trois
colonnes Json — dont `session.evenements`, qui porte PRD-18 — n'a donc pas de
dossier propriétaire.

---

### [MINEUR] 13 — `ALTER DEFAULT PRIVILEGES` sans `FOR ROLE` ne couvre que les objets créés par le rôle qui exécute le script.

`supabase/policies.sql`, lignes 110-113, présenté en section 4 comme la
cinquième couche « pour qu'une table future n'hérite de rien ». Sans clause `FOR
ROLE`, la commande ne s'applique qu'aux objets créés **par le rôle courant**. Or
`policies.sql` est appliqué à la main après `prisma migrate deploy`, et rien
n'établit que les deux opérations passent par le même rôle (`DATABASE_URL`,
`DIRECT_URL`, éditeur SQL Supabase). La garantie annoncée est conditionnelle à
une hypothèse non écrite.

Correction attendue : préciser `FOR ROLE <rôle des migrations>`, ou documenter
en tête de fichier le rôle sous lequel `policies.sql` doit être joué.

---

### [MINEUR] 14 — Partie D : les six « preuves rejouables » sont intégralement en commentaires SQL, alors que SEC-03 exige « des tests qui le prouvent ».

`supabase/policies.sql`, lignes 276-304 : les six requêtes D1 à D6 sont
commentées (`--`). `architecture.out.md`, section 4 : « Ce sont les requêtes que
`securite-rgpd` et `red-team` doivent rejouer », et la section 16 rattache
SEC-03 à « `supabase/policies.sql` parties A et D ».

Ce n'est pas un test, c'est une consigne. Aucun élément nommé ne dit contre
quelle base elles tournent, ni qui échoue si elles rendent autre chose que le
résultat annoncé. Je ne le monte pas en [MAJEUR] parce que la fiche de
`securite-rgpd` porte explicitement « écrire des tests d'intégration qui prouvent
qu'un client anonyme est bloqué » : la tâche est tracée en P7. Mais D1 étant faux
(constat 3), la partie D doit être rejouée avant d'être confiée.

---

### [MINEUR] 15 — TEC-16 : deux seuils réels restent des littéraux dupliqués hors `seuils.config.ts`.

Les cinq seuils que TEC-16 vise nommément (« confiance minimale, tolérance du
matching de lecture ») sont bien centralisés dans `src/config/seuils.config.ts`
(section 13) et dans `.env.example`. Le contrôle demandé est donc satisfait sur
la lettre. Restent deux valeurs dupliquées entre deux fichiers livrés :

- taille maximale de photo : « `photo: File` (≤ 8 Mo…) » (8.2) et
  `file_size_limit = 8388608` (`policies.sql`, ligne 232) ;
- taille maximale d'audio : « `audio: File (≤ 10 Mo)` » (8.4) et `10485760`
  (`policies.sql`, ligne 234).

Un changement de l'une sans l'autre produit un rejet silencieux côté Storage
après un `200` applicatif. Hors périmètre strict de TEC-16, mais c'est
exactement la « constante dispersée » que l'exigence combat.

---

### [MINEUR] 16 — TEC-12 : le seuil de 400 ms est déclaré unique mais n'a pas de propriétaire nommé.

`architecture.out.md`, section 12.1 : « Le seuil est une constante unique, pas
une valeur répétée dans les composants. » Il n'est ni dans
`src/config/seuils.config.ts` (section 13, qui liste cinq clés et pas celle-là),
ni dans `.env.example` (25 variables, aucune ne le porte). La section 16 le
rattache à `src/components/pilou/PilouReflechit.tsx` — un composant, donc pas
`src/config/`, contre la responsabilité que la section 2 assigne elle-même à
`src/config/` (« Les valeurs réglables, en un seul endroit »).

---

### [MINEUR] 17 — PRD-13 : aucun élément nommé ne dit comment le parent obtient le cookie pendant une session enfant.

T11 exige « **cookie parent valide** » (9.2) et `403 TIPI_ABANDON_NON_AUTORISE`
sinon (8.3). Le cookie est émis par `POST /api/reglages/code/verifier` (8.6), et
PRD-15 veut l'entrée du code « depuis l'écran parent uniquement ». Or PRD-13
décrit un « appui long + code » **depuis l'écran de l'enfant**. Ni
l'arborescence (aucune page sous `src/app/enfant/` pour cela), ni la section 8,
ni la section 9 ne nomment le chemin qui relie les deux. L'exigence a un garde
serveur mais pas de porte.

---

### [MINEUR] 18 — TEC-09 : l'implémentation de repli n'a pas d'élément qui la porte, ce que le livrable assume.

Section 16 rattache TEC-09 à « `SpeechProvider`, `web-speech.ts`,
`NEXT_PUBLIC_SPEECH_PROVIDER`, contrat `POST /api/voix/transcrire` », et 8.4
précise que cette route « renvoie `501 TIPI_NON_IMPLEMENTE` ». Une route qui
renvoie 501 ne porte pas l'exigence, elle la réserve. Je ne le monte pas plus
haut : le texte de TEC-09 conditionne lui-même le repli (« **si** la précision
sur la voix d'Evan est insuffisante ») et l'architecte le déclare franchement au
lieu de le maquiller — voir mon avis en section B.

---

### [MINEUR] 19 — SEC-05 : le `CHECK` de rétention borne 0..365, la route n'accepte que 0, 7 ou 30.

`policies.sql`, lignes 185-194 : `CHECK (retention_audio_jours BETWEEN 0 AND
365)`. `architecture.out.md`, 8.6 : `GET | PATCH /api/reglages/audio` → `{
retentionJours: 0 | 7 | 30 }`. Le `CHECK` ne borne donc rien que la route
n'interdise déjà, et les deux listes divergeront au premier ajout d'une valeur.
À harmoniser, ou à assumer explicitement comme deux niveaux distincts.

---

## B. Avis sur les cinq points ouverts de la section 18

Ce sont des arbitrages qui vous reviennent. Voici mon avis technique, qui ne
vaut pas décision.

**1. TEC-09 réputée couverte sans l'implémentation Google STT.** *Favorable à la
couverture par l'interface + Web Speech.* Le texte de TEC-09 est conditionnel :
Google STT est « en implémentation de repli **si** la précision sur la voix
d'Evan est insuffisante ». Une condition non encore évaluée ne peut pas rendre
une exigence non couverte. Les trois éléments architecturaux qui comptent
existent et sont nommés : l'interface `SpeechProvider`, la valeur `google` de
`NEXT_PUBLIC_SPEECH_PROVIDER`, et le contrat de `POST /api/voix/transcrire`.
Écrire aujourd'hui une implémentation que personne ne peut exercer serait du
code mort, et `controle-code` le refuserait comme hors périmètre. **Condition à
poser** : que TEC-09 soit inscrite dans `TRACEABILITY.md` en statut « couverte
sous condition », avec la condition nommée (enregistrements réels d'Evan) et le
porteur (`qa-e2e` ou une escalade humaine), sinon `recette-finale` la comptera
non couverte et vous rejouerez ce débat en G8. Le `501 TIPI_NON_IMPLEMENTE` doit
rester : c'est la trace honnête.

**2. Dépendance croisée V3 / V7 autour du cookie parent.** *Favorable à la
recommandation de l'architecte (V3 livre la garde, V7 livre le cookie), mais
elle est incomplète.* La garde `403 TIPI_ABANDON_NON_AUTORISE` est testable sans
V7 et ne bloque rien : c'est le bon découpage. Mais mon constat 17 montre que le
point ouvert est mal posé — le vrai trou n'est pas l'ordre des verticales, c'est
qu'**aucune verticale ne s'est vu attribuer le chemin d'interface** « appui long
sur l'écran enfant → clavier 10 chiffres → cookie ». V3 livre la garde serveur,
V7 livre le clavier et le cookie, et personne ne livre le déclencheur. Et mon
constat 5 aggrave la dépendance : tant que V7 n'est pas là, **aucune session ne
peut être close autrement que par une clôture normale**, donc une session
abandonnée bloque toutes les suivantes (409). Si vous suivez la recommandation
de l'architecte, imposez que V3 livre en plus un chemin de fermeture de session
périmée qui ne dépende pas du cookie, sinon V3 est intestable seule sur plus
d'une soirée.

**3. Le barème d'une étape vide (T6, aucune pierre).** *Favorable, avec une
réserve de cohérence.* La lecture du barème est juste : 3.7 dit « +1 par étape
**terminée** », et une étape sans exercice exploitable n'a pas été faite. Deux
points à vérifier côté produit avant de trancher, que l'architecte n'a pas
soulevés : (a) T5 accorde « +1 bonus si **les deux étapes du soir** sont
terminées » — si l'une est vide, le bonus tombe aussi, donc une soirée où l'IA a
mal découpé coûte 2 pierres à l'enfant, pour une raison dont il n'est pas
responsable ; (b) ETH-04 dit que les pierres ne se perdent jamais — ne pas
créditer n'est pas retirer, l'exigence est respectée à la lettre, mais l'esprit
de ETH-05 et PED-05 (valoriser l'effort, pas le résultat) plaide pour créditer
l'étape que l'enfant a effectivement traversée. Mon avis : c'est bien une
décision produit, adressez-la à `produit-marketing` plutôt que de la trancher
seul, et posez la question sous la forme « une soirée où le pipeline a échoué
doit-elle être moins récompensée qu'une soirée normale ? ».

**4. Le glob `src/components/gwenn/**` (ESC-001).** *Le constat est exact, la
correction proposée est insuffisante.* J'ai vérifié
`.cursor/rules/30-copy-enfant.mdc`, ligne 3 :

```
globs: ["content/**", "src/components/gwenn/**", "src/lib/ai/prompts/**"]
```

et l'arborescence de la section 2 place la mascotte dans
`src/components/pilou/`. Le glob ne couvre donc **aucun fichier**. Mais étendre à
`src/components/{pilou,gwenn}/**` ne suffit pas : l'arborescence place aussi
`src/components/enfant/` (« composants d'écran enfant ») et
`src/app/enfant/**`, qui ne sont couverts ni par l'actuel ni par le proposé.
Comme la règle interdit précisément le texte enfant en dur, ce sont les dossiers
où il apparaîtrait. Ma recommandation : `["content/**", "src/components/pilou/**",
"src/components/enfant/**", "src/app/enfant/**", "src/lib/ai/prompts/**"]`, et
supprimer `gwenn` plutôt que de le conserver — garder un nom mort dans un glob
est ce qui a produit ESC-001.

**5. `content/ui-enfant.json` et `ui-parent.json` affectés à V1.** *Favorable à
V1, mais pas à `dev-feature` comme auteur.* J'ai vérifié : les deux fichiers sont
bien déclarés en 6.1 du marketing (lignes 390-391) et référencés jusque dans la
checklist éthique opposable (ETH-01.6, ETH-05.1, ETH-05.1 bis) — ils sont donc
déjà un instrument de contrôle de G1, pas seulement un fichier de V1. Les placer
en V1 est juste : sans eux, la première verticale qui pose un écran écrit du
texte en dur, ce que `10-stack.mdc` interdit et que `controle-code` marquerait
[MAJEUR]. En revanche, l'affirmation « c'est une extraction mécanique, pas une
rédaction » est à vérifier avant d'être crue : les tableaux 7.1 à 7.14 portent
des textes, pas des clés canoniques, et le seul fait qu'ARB-07 ait renommé
`transition.cloture.corps` en `session.fin_travail.corps` montre que la
nomenclature des clés est un sujet éditorial à part entière. Ma recommandation :
`contenu-enfant` produit les deux fichiers et `controle-produit` les contrôle
(gardien-charte inclus, puisque `ui-enfant.json` contient du texte vu par
l'enfant), **avant** G3 comme l'architecte le demande — et non `dev-feature`,
dont la fiche interdit d'écrire du texte utilisateur.

---

## C. Contrôles rendus conformes, pour mémoire

Ce sont les points où j'ai cherché une faille et n'en ai pas trouvé. Ils
comptent, parce que le FAIL ci-dessus ne doit pas laisser croire que tout est à
refaire.

**Point 4 de ma fiche — conformité du schéma Prisma à 3.7, champ par champ.**
Vérifiée colonne par colonne sur les neuf tables. **Aucun champ de 3.7 n'est
absent, aucun n'est renommé** : les `@map` produisent bien les noms de colonnes
de 3.7 (`gem_balance`, `etapes_prevues`, `nb_indices_utilises`, `bloque_jusqu_a`,
`atteint_le`…). Les ajouts sont au nombre de 17 et chacun cite une exigence
nommée (SEC-05, TEC-16, PRD-01, PED-06, PRD-04, PRD-13, PED-08, 3.4, PRD-16), ce
que je considère justifié ; `gem_ledger` et `settings_access` n'ont aucun ajout,
ce qui est le bon réflexe sur les deux tables sensibles. La dixième table
`CalibrationLog` est exigée nommément par TEC-16 (« journaliser en base le texte
OCR brut, le score de confiance et le JSON renvoyé par DeepSeek »). Comptes
annoncés vérifiés : **10 modèles, 6 énumérations** — exact. `child.age` est bien
absent (PRD-02).

**Point 1 — secrets.** Vérifié sur `.env.example` : **25 variables, dont
exactement 3 préfixées `NEXT_PUBLIC_`**, comptées par moi (sortie D.4), et le
tableau de la section 11 a bien 25 lignes. Les trois publiques sont
`NEXT_PUBLIC_TTS_CACHE_URL` (une URL de fichiers), `NEXT_PUBLIC_SPEECH_PROVIDER`
(`"web-speech"`) et `NEXT_PUBLIC_APP_VERSION` : **aucune n'est un secret**.
`SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`,
`PARENT_SESSION_SECRET`, `CRON_SECRET` sont toutes serveur. Aucune clé `anon`
Supabase n'existe dans la liste, ce qui est cohérent avec D1 : il n'y a pas de
client Supabase dans le navigateur. Je n'ai trouvé **aucune contradiction** à
l'affirmation « le navigateur ne parle qu'à Next.js » dans les quatre livrables
— à une nuance près, que je ne compte pas comme un secret exposé : le client va
chercher directement un objet du bucket public `tts-cache` (constats 1 et 6), ce
qui est un accès sans clé, donc TEC-13 tient. La séparation `src/config/env.ts`
(serveur) / `env.client.ts` (les 3 publiques) est nommée et cohérente.

**Point 2 — RLS, table par table.** Pour chacune des dix tables métier,
`policies.sql` partie A pose `ENABLE ROW LEVEL SECURITY` **et** `REVOKE ALL …
FROM anon, authenticated`, et **aucune policy n'est créée** pour ces deux rôles :
`family` (l. 48-49), `child` (55-56), `homework` (62-63), `exercise` (68-69),
`session` (74-75), `attempt` (81-82), `gem_ledger` (87-88), `reward_threshold`
(93-94), `settings_access` (99-100), `calibration_log` (105-106). En PostgreSQL,
RLS active sans policy applicable = zéro ligne en lecture et zéro écriture ; le
`REVOKE` fait échouer la requête en amont ; `REVOKE USAGE ON SCHEMA public`
(l. 117) empêche PostgREST de résoudre le nom. Un client anonyme ne peut donc ni
lire ni écrire **aucune** de ces dix tables. Storage : `devoirs` et `audios` sont
privés sans aucune policy ; `tts-cache` a une unique policy `SELECT` et aucune
policy d'écriture pour `anon`/`authenticated`. La démonstration tient — sous
réserve du constat 3 (`_prisma_migrations`) et du constat 13 (`FOR ROLE`).

*Jugement sur le refus total, que vous m'avez demandé.* **Il est juste, et
mieux fondé que des policies paramétriques.* Sans authentification, il n'existe
pas de `auth.uid()` : une policy `USING (family_id = auth.jwt() ->> 'family_id')`
ne serait jamais évaluée, donc jamais testée, et donnerait une défense de papier
— c'est précisément le piège que `40-protocole-agents.mdc` décrit sous
« instrument de mesure ». Face à SEC-03, qui exige « avec des tests qui le
prouvent », le refus total est **plus** testable qu'une policy paramétrique :
« aucune policy, aucun privilège » se prouve par deux requêtes de catalogue
déterministes, là où une policy paramétrique demanderait de fabriquer des JWT.
Le jour où une authentification apparaît, le chemin est écrit en partie E en
quatre étapes, et il est correct dans l'ordre : Auth, table de liaison, GRANT
restreint + policy, puis `FORCE ROW LEVEL SECURITY` avec un rôle applicatif non
propriétaire. Le seul piège à surveiller est que ce jour-là le `REVOKE USAGE ON
SCHEMA public` devra être levé **avant** que les policies existent, fenêtre
pendant laquelle tout est ouvert ; à inscrire en partie E. Le refus de `FORCE`
est également bien motivé : avec zéro policy, `FORCE` verrouillerait
l'application elle-même.

**Point 3 — solde de pierres.** La démonstration en cinq points tient sur
l'essentiel, et j'ai vérifié les contraintes **dans le SQL réel** et non dans le
rapport : `gem_ledger_delta_positif CHECK (delta > 0)` (`policies.sql`
l. 130-138), `gem_ledger_delta_max_un CHECK (delta <= 1)` (l. 141-149),
`child_gem_balance_positif CHECK (gem_balance >= 0)` (l. 152-160), et
`@@unique([sessionId, raison])` (`schema.prisma` l. 295). Les trois `CHECK` sont
bien présents et idempotents (`DO $$ … IF NOT EXISTS`). L'inventaire des routes
(section 8) ne contient effectivement **aucune** route de crédit ni aucun
paramètre `delta`/`montant`/`gems`/`solde` en entrée : je l'ai parcouru, les 32
chemins annoncés existent et je les ai comptés — le chiffre est exact.
`GET /api/coffre` est en lecture. Le recalcul par `SUM(delta)` plutôt que par
incrément est le bon choix et rend l'invariant de 3.7 vérifiable.

*Sur le rejeu, que vous m'avez demandé de chercher.* Une même transition rejouée
deux fois ne crédite **pas** deux fois, et il y a trois verrous superposés :
(a) `SELECT … FOR UPDATE` sur la session (9.3, étape 1) ; (b) `evenementId` déjà
présent dans `session.evenements` → retour du snapshot sans effet de bord (8.3,
9.3 étape 2) ; (c) `etatAttendu` différent de l'état persisté → `409` sans
écriture (9.3 étape 3) ; (d) en dernier ressort l'unique `(session_id, raison)`.
Un rejeu avec un **nouvel** `evenementId` mais le même `etatAttendu` est arrêté
par (c), puisque l'état a déjà changé. Un rejeu concurrent est arrêté par (a).
Le seul trou que j'ai trouvé est celui du constat 8 (`session_id` nullable) et
celui du constat 9 (deux étapes de même matière). **SEC-06 est architecturalement
tenue** ; ce sont les constats 4, 8 et 9 qui doivent être corrigés, pas la
démonstration.

**Point 5 — états limites PRD-16.** Les quatre ont un état applicatif et un
chemin de récupération nommés (section 10.2), et j'ai vérifié que les clés de
contenu citées existent réellement dans les livrables P1 : `parent.scan.illisible`,
`parent.scan.sans_devoir`, `enfant.accueil.vide`, `lecture.vide`, `maths.vide`,
`lecture.reprise`, `maths.reprise`, `maths.blocage`, `bravo.pierres_plus_tard`,
`lecture.sans_voix`, `lecture.micro_absent`, `maths.sans_indice`, `coffre.souci`,
`parent.aiguillage.bandeau`, `parent.resume.audio_absent`, `reglages.session_expiree`,
`parent.apercu.lancement_echec`, `enfant.attente.pilou` — **toutes présentes**
dans `produit-marketing.out.md` ou dans `content/*.json`. Aucune clé inventée.
La voie de secours `POST /api/devoirs/saisie-manuelle` est bien toujours ouverte,
y compris quand `DEEPSEEK_API_KEY` manque. Le quatrième cas (« session
interrompue et reprise plus tard ») est **incomplet** — voir constat 5.

**Point 6 — persistance à chaque transition (PRD-18).** Les douze transitions de
la table 9.2 ont toutes une colonne « Écrit en base » non vide, **y compris T12
`BLOCAGE`** qui ne change pas d'état (journal + `attempt`). La section 9.3 place
l'écriture dans la même transaction que les effets. Je n'ai trouvé aucune
transition sans écriture. Le cas où la persistance n'est **pas** écrite est
ailleurs, et c'est le constat 7 : la progression **à l'intérieur** d'une étape
(exercice courant, indices déroulés) ne passe pas par la route de transition, et
la route qui devrait la porter ne peut pas identifier la ligne `attempt`.

**Point 7 — sur-ingénierie et les refus revendiqués.** Aucune abstraction sans
exigence : les quatre interfaces de fournisseur sont adossées à TEC-17, TEC-08,
TEC-09 et TEC-05 ; les 14 dépendances de 15.1 citent chacune une exigence ; les
13 refus de 15.2 sont motivés. Le refus de `xstate` est justifié (9 états, 12
transitions, fonction pure). Le refus du SDK de fournisseur est un vrai bénéfice
architectural, même si l'instrument censé le prouver est cassé (constat 2). Le
refus de Web Push est cohérent avec TEC-18 et PRD-06 sur un seul appareil.

*Sur `etat_avant_pause`, que vous m'avez demandé de vérifier.* **Le refus est
correct et PRD-12 tient.** J'ai déroulé le cas : `etape_courante` est incrémenté
par T7 `TRANSITION_VUE` **avant** l'entrée dans l'état de l'étape suivante, donc
`etat` et `etapes_prevues[etape_courante].matiere` sont toujours en phase. T8
n'est accessible que depuis `etape_lecture` et `etape_maths`, jamais depuis
`transition` ni `annonce`, donc au moment d'entrer en `pause`, `etape_courante`
désigne toujours l'étape que l'enfant était en train de faire — et T9
`PAUSE_TERMINEE` y revient. Le `CHECK session_etape_courante_coherente`
(`policies.sql` l. 204-219) le garantit au niveau du schéma en imposant
`etape_courante IS NOT NULL` dans les états `etape_lecture`, `etape_maths`,
`transition` et `pause`. La colonne aurait été une donnée redondante de plus à
tenir cohérente. Les cinq autres refus d'ajout de 3.1 (table `session_event`,
table `tts_cache`, table `user`, colonne `child.age`, table `cosmetique`) sont
également fondés, `child.age` étant même exigé par PRD-02.

**Couverture REQ-TEC / REQ-SEC (contrôle supplémentaire demandé).** Les 19
REQ-TEC et 8 REQ-SEC ont chacune une ligne et un élément nommé en section 16.
J'ai vérifié l'existence de chaque élément cité dans l'arborescence de la section
2, dans `schema.prisma`, dans `policies.sql` ou dans `.env.example`. **Deux
éléments cités n'existent pas ou ne portent pas l'exigence** : la règle grep de
TEC-17 (constat 2, [MAJEUR]) et `src/lib/validation/` cité en 3.2 (constat 12).
Deux la portent partiellement : TEC-09 (constat 18) et SEC-03 (constat 3). Les 23
autres sont rattachées à un élément qui existe et qui la tient. Je n'ai relevé
**aucun [BLOQUANT]** à ce titre : aucune exigence n'est citée sans le moindre
élément.

**Cache TTS (contrôle supplémentaire demandé) — les chiffres sont exacts.** J'ai
recompté sur `content/*.json` sans me fier au rapport. **474 clips et 21 016
caractères sont reproduits à l'unité près** (sortie D.2), ainsi que la moyenne de
44,3 et la part de quota : 21 016 / 1 000 000 = **2,1016 %**, arrondi à 2,10 %.
J'ai également reproduit la justification du chiffre 474 : 460 variantes
d'`encouragements.json` + 19 lignes de `gwenn-scripts.json` = 479, moins **25**
entrées de canal `affiche` (20 + 5, compte exact), soit 454, plus les **20**
variantes portant `{matiere}` comptées double = 474. Pour tomber sur 21 016 il
faut rendre `{prenom}` en « Evan » **et** `{matiere}` en « la lecture » / « les
maths », ce qui est bien la table `jeton_matiere` de `encouragements.json` — la
mesure est donc conforme au rendu grammatical arbitré en G1. **Aucun écart.**
C'est la partie la mieux étayée du livrable ; elle a en revanche une conséquence
que l'architecte n'a pas vue, et c'est le constat 1.

**TEC-16 (contrôle supplémentaire demandé) — les seuils sont bien des variables
de configuration.** Les cinq seuils de `SEUILS` (section 13) correspondent
exactement à cinq variables de `.env.example` (`OCR_CONFIANCE_MIN`,
`LECTURE_TOLERANCE_MOT`, `LECTURE_SEUIL_MOTS_OK`, `BLOCAGE_NB_SOLLICITATIONS`,
`CALIBRATION_NB_PHOTOS`), avec la règle opposable « aucun littéral numérique de
seuil dans `src/lib/ocr/**`, `src/lib/lecture/**`, `src/lib/maths/**` ». Les deux
seuils que TEC-16 nomme explicitement sont couverts. La journalisation du **seuil
en vigueur au moment de l'analyse** (`calibration_log.seuil_confiance_applique`)
est un vrai soin : sans elle un réglage a posteriori ne serait pas rejouable.
Réserves mineures : constats 15 et 16.

**TEC-17 (contrôle supplémentaire demandé) — l'absence de SDK ne suffit pas.**
Vous demandiez si l'absence de SDK prouve le confinement. **Non.** Elle prouve
l'absence de dépendance dans `package.json`, ce qui est un vrai bénéfice pour le
changement de fournisseur, mais le confinement au sens de TEC-17 — « aucune
dépendance à DeepSeek ne fuit hors de `src/lib/ai/` » — porte sur le **code**, et
un `fetch` brut fuit aussi bien qu'un SDK : la forme du corps de requête, le nom
du modèle, la forme de la réponse. Ce qui porte réellement le confinement ici
est l'interface `AiProvider`, qui ne mentionne aucun fournisseur et ne prend que
`string` et `TexteExercice` — c'est solide, et c'est aussi ce qui rend SEC-04
structurel (section 6, barrière 1 : le compilateur refuse un `Child`, un
`prenom`, un `Buffer`). Le vrai problème est que l'unique instrument de
vérification de ce confinement est cassé : constat 2.

---

## D. Sorties réelles de mes commandes

### D.1 `prisma validate` — rejoué par moi, commande de la section 17

Installation du CLI hors du dépôt :

```
$ mkdir -p $SP/prisma-check
$ cd /home/user/Tipi && npm install prisma@5.22.0 --prefix $SP/prisma-check --no-audit --no-fund
added 6 packages in 3s
```

Validation :

```
$ cd /home/user/Tipi && DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
  DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
  $SP/prisma-check/node_modules/.bin/prisma validate --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
---exit:0---
```

**La sortie de la section 17 est reproduite à l'identique, exit 0.** La commande
de rejeu fournie en section 17 fonctionne telle quelle (j'ai seulement remplacé
`/tmp/prisma-check` par mon répertoire de travail de session). Aucune base n'a
été contactée, le dépôt n'a reçu aucun fichier. La condition de recevabilité de
ma fiche (point 8) est remplie.

Limite de ce contrôle, comme l'architecte le dit lui-même : `prisma validate`
vérifie la grammaire et la cohérence du schéma, pas la conformité à 3.7 ni
l'existence des contraintes SQL. J'ai contrôlé ces deux points à la lecture
(section C, point 4, et section A constats 8 et 10).

### D.2 Recomptage du corpus TTS sur `content/*.json`

```
$ node -e "…" (mesure indépendante sur content/encouragements.json et content/gwenn-scripts.json)
total variantes encouragements: 460
par canal: {"les_deux":440,"affiche":20}
lignes gwenn-scripts avec texte+canal: 19 {"les_deux":14,"affiche":5}
variantes avec {matiere}: 20   avec {prenom}: 13 (encouragements) + 1 (gwenn) = 14
lignes lues (tts/les_deux): 454
```

Recherche du rendu qui reproduit le chiffre annoncé (instrument publié
intégralement, conformément à `40-protocole-agents.mdc` § « Corriger un
instrument de mesure », règle 2) :

```
prenom           matiere                        clips   caracteres   moyenne
"Evan"           ["lecture","maths"]            474     20876        44.0
"Evan"           ["la lecture","les maths"]     474     21016        44.3   <== ANNONCÉ
"Evan"           ["lecture","mathématiques"]    474     21036        44.4
"{prenom}"       ["lecture","maths"]            474     20932        44.2
"{prenom}"       ["la lecture","les maths"]     474     21072        44.5
""               ["lecture","maths"]            474     20820        43.9
""               ["la lecture","les maths"]     474     20960        44.2
TOUT y compris les 25 entrées `affiche`         499     21305        42.7
```

Table de rendu du jeton, lue dans `content/encouragements.json` :

```
jeton_matiere.valeurs = {
  "enfant.programme.une.corps.lecture": "la lecture",
  "enfant.programme.une.corps.maths":   "les maths"
}
```

**474 clips et 21 016 caractères : exact.** 21016 / 1000000 = 2,1016 % → 2,10 % :
exact. Moyenne 21016 / 474 = 44,34 → 44,3 : exact. Aucun écart sur les quatre
grandeurs annoncées en 12.2.

### D.3 Règle opposable de TEC-17, rejouée sur une arborescence reconstituée

Arborescence minimale conforme à la section 2 du livrable : `src/lib/ai/providers/deepseek.ts`,
`src/lib/ai/index.ts` (fabrique lisant `AI_PROVIDER`), `src/config/env.ts`
(défaut `deepseek`, section 11).

```
$ grep --version | head -1
grep (GNU grep) 3.11

$ grep -ril deepseek src/ --exclude-dir=ai/providers      # la règle, telle qu'écrite en 5.1
src/config/env.ts
src/lib/ai/index.ts
src/lib/ai/providers/deepseek.ts
---exit:0---

$ grep -ril deepseek src/ --exclude-dir=providers          # variante corrigée
src/config/env.ts
src/lib/ai/index.ts
---exit:0---
```

La règle annoncée « doit renvoyer zéro résultat » renvoie trois fichiers, dont
celui qu'elle prétend exclure. Corrigée, elle en renvoie encore deux, que le
livrable impose lui-même. Constat 2.

### D.4 Comptes de `.env.example` et du tableau de la section 11

```
$ grep -cE '^[A-Z][A-Z0-9_]*=' .env.example
25
$ grep -cE '^NEXT_PUBLIC_' .env.example
3
$ (lignes du tableau de la section 11 de architecture.out.md)
25
```

**25 variables, 3 publiques, 25 lignes de tableau : exact, aucun écart.**

### D.5 Glob de `.cursor/rules/30-copy-enfant.mdc`

```
$ sed -n '1,4p' .cursor/rules/30-copy-enfant.mdc
---
description: Règles de rédaction des textes destinés à l'enfant et des prompts IA
globs: ["content/**", "src/components/gwenn/**", "src/lib/ai/prompts/**"]
---
```

Confirme le point ouvert n° 4 de l'architecte : l'arborescence livrée place la
mascotte dans `src/components/pilou/`, le glob ne couvre aucun fichier. Voir mon
avis en section B.

### D.6 Clés de contenu citées par la taxonomie d'erreurs

Les 16 clés vérifiées existent toutes dans `docs/agents/P1/produit-marketing.out.md`
ou dans `content/*.json` (occurrences non nulles pour chacune). Aucune clé
inventée dans la section 10.

---

## E. Ce qu'il faut pour un verdict PASS au tour 2

Les sept [MAJEUR] sont tous corrigeables sans refonte. Par ordre de gravité
décroissante :

1. Constat 1 — sortir le prénom du bucket public, et corriger les trois
   affirmations, dont celle qui vit dans `supabase/policies.sql`.
2. Constat 3 — couvrir `_prisma_migrations` en partie A et rendre D1 vraie.
3. Constat 4 — trancher entre transaction unique et crédit différé, et nommer le
   rattrapage depuis un état final.
4. Constat 5 — nommer la fermeture d'une session périmée, sans quoi une soirée
   abandonnée bloque toutes les suivantes.
5. Constat 7 — ajouter `sessionId` à `POST /api/indices` et son effet d'écriture.
6. Constat 6 — trancher qui rend `{prenom}` et corriger le budget de latence.
7. Constat 2 — réécrire les deux règles grep et publier leur sortie réelle.

Les douze [MINEUR] sont à corriger dans le même tour, sauf les 18 et 19 qui
peuvent partir en réserve si vous les tranchez en section B.

Je n'ai proposé **aucune refonte** : chaque correction attendue ci-dessus est une
ligne, une garde ou une phrase, adossée à une exigence nommée du prompt maître.
Je n'ai écrit **aucun fichier de production**, ni commit git.
