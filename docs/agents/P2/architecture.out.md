# P2 — Architecture technique de Tipi

Livrable de l'agent `architecte`. Porte G2. **Version 2**, reprise du
`VERDICT: FAIL` du tour 1 (`docs/agents/P2/architecture.review.md` : 7 [MAJEUR],
12 [MINEUR], 0 [BLOQUANT]) et des cinq arbitrages rendus par l'Orchestrateur.

Sources lues en entier avant de concevoir : `TIPI-PROMPT-CURSOR.md` (2.3, 2.4,
3.1 à 3.8, 4.3), `docs/agents/P1/produit-marketing.out.md`,
`docs/agents/P1/contenu-enfant.out.md`, `content/encouragements.json`,
`content/gwenn-scripts.json`, `docs/agents/GATES.md` (arbitrages ARB-01 à
ARB-07), les cinq règles de `.cursor/rules/`, et au tour 2 le verdict en entier.

| Fichier livré | Contenu |
| --- | --- |
| `docs/agents/P2/architecture.out.md` | Le présent document |
| `prisma/schema.prisma` | 10 modèles, 6 énumérations, `prisma validate` vert (section 17) |
| `supabase/policies.sql` | RLS des 11 tables, 8 contraintes, 4 buckets, 8 vérifications **exécutables** |
| `.env.example` | 27 variables, 3 publiques, aucune valeur réelle |

Aucun commit git. Aucun code applicatif écrit : ce livrable décrit, il
n'implémente pas.

---

# 0. Reprise après verdict du tour 1

**Les 19 constats sont traités. Aucun n'est laissé de côté, aucun ne part en
réserve.** Les constats 18 et 19, que le contrôleur autorisait à verser au
backlog, sont traités ici aussi : ils coûtaient une phrase chacun.

## 0.1 Les sept [MAJEUR]

| # | Constat | Ce que j'ai changé | Où le vérifier |
| --- | --- | --- | --- |
| 1 | Le bucket public `tts-cache` aurait contenu 14 clips prononçant « Evan », et le livrable l'affirmait trois fois innocent | **Deux buckets.** `tts-cache` public ne reçoit que les clips **sans aucun jeton de prénom** ; `tts-prive`, privé, reçoit les 14 clips à prénom et tout clip de texte de devoir, servis par URL signée. Les trois affirmations fausses sont supprimées et remplacées par une règle opposable et mesurée | Section 12.2 ; `policies.sql` partie C (règle de séparation + bucket `tts-prive` + vérification V8) |
| 2 | La règle `grep` de TEC-17 ne peut jamais passer, et reste fausse une fois corrigée | Règle réécrite sur le périmètre réel, **sortie réelle publiée** (l'ancienne aussi, conformément à `40-protocole-agents.mdc`), et l'affirmation « le seul fichier du dépôt » corrigée en « le seul fichier qui connaît le protocole ». La règle des pierres est réécrite de même, en séparant écriture et lecture | Sections 5.1 et 7.2, sorties en 17.2 |
| 3 | `_prisma_migrations` n'était couverte par rien, ce qui rendait la preuve D1 fausse | Bloc dédié en partie A, et **V1 n'a plus de liste en dur** : elle balaie `pg_tables` et lève une exception en nommant toute table non couverte, présente ou future | `policies.sql` partie A (bloc `_prisma_migrations`) et partie D (V1) |
| 4 | Le crédit différé de 8.3 est impossible si la transaction unique de 9.3 dit vrai, et n'a pas de rejeu depuis un état final | **Tranché : le crédit est dans la transaction.** `creditDiffere` disparaît de la réponse serveur. `bravo.pierres_plus_tard` reste, mais rattaché à sa vraie cause — la transition non délivrée côté client — et le rattrapage a un porteur nommé : `fermerSessionPerimee()` | Sections 8.3, 9.3, 9.4, 10.1 |
| 5 | Une session non close bloque toutes les soirées suivantes et renvoie l'enfant sur les devoirs de la veille | **Transition T12 `CLOTURE_AUTOMATIQUE`**, gardée par `session.date`, déclenchée par `GET /api/etat` **et** par `POST /api/session`. Elle crédite ce qui était dû, clôt, et libère l'unique partiel. Cinquième ligne ajoutée au tableau des états limites | Sections 9.2 (T12), 9.4, 10.2 |
| 6 | 12.2 exigeait que le client rende `{prenom}`, 8.4 le lui interdisait | **Une seule règle, énoncée une fois** : le client ne rend jamais un jeton. Il ne calcule une clé de cache que pour un texte **sans jeton** ; tout texte à jeton passe par `POST /api/voix`, qui rend, synthétise et range dans le bon bucket. Budget de latence corrigé avec une troisième ligne pour le chemin privé | Sections 8.4, 12.1, 12.2 |
| 7 | `POST /api/indices` ne portait pas `sessionId` : ni garde PED-02, ni reprise PRD-18 | `sessionId` ajouté à l'entrée, **et l'effet d'écriture est contractualisé** : upsert de `attempt.nbIndicesUtilises` dans la même transaction que la lecture de l'indice | Section 8.4 |

## 0.2 Les douze [MINEUR]

| # | Constat | Ce que j'ai changé |
| --- | --- | --- |
| 8 | `gem_ledger.session_id` nullable : l'unique ne garantissait rien sur les `NULL` | Colonne rendue **obligatoire**, relation en `Cascade` (SetNull est impossible sur une colonne obligatoire), commentaire expliquant pourquoi dans le schéma |
| 9 | Deux étapes de même matière feraient échouer le second crédit | Garde ajoutée au contrat de `POST /api/session` : matières deux à deux distinctes, code `TIPI_ETAPES_MEME_MATIERE` |
| 10 | L'en-tête du schéma annonçait 3 contraintes déportées, il y en a 8 | **Les huit sont listées dans l'en-tête de `schema.prisma`**, avec leur exigence |
| 11 | Trois renvois de section faux | Corrigés : `schema.prisma` → section 3.1 ; `.env.example` → section 11 ; `policies.sql` → section 12 de ce document (et non « 3.8 » du prompt maître) |
| 12 | `src/lib/validation/` cité mais absent de l'arborescence | Ajouté en section 2, avec sa responsabilité : les schémas Zod des trois colonnes Json |
| 13 | `ALTER DEFAULT PRIVILEGES` sans `FOR ROLE` | `FOR ROLE current_user` explicite, `RAISE NOTICE` du rôle employé, et **le rôle d'exécution est imposé en tête de fichier** |
| 14 | Les six « preuves » de la partie D étaient des commentaires | **Huit vérifications exécutables** qui lèvent une exception sur invariant faux. Appliquer le fichier sur une base non conforme échoue bruyamment |
| 15 | Les deux tailles de téléversement dupliquées entre les routes et Storage | Deux variables `UPLOAD_MAX_PHOTO_OCTETS` / `UPLOAD_MAX_AUDIO_OCTETS`, la duplication est **nommée comme la seule du livrable** des deux côtés, et V7 les affiche pour comparaison |
| 16 | Le seuil de 400 ms n'avait pas de propriétaire | `src/config/ui.config.ts`, nouveau fichier : les constantes d'interface importables côté client. `seuils.config.ts` dépend de `env.ts`, serveur uniquement : il ne pouvait pas le porter |
| 17 | PRD-13 : aucun élément ne dit comment le parent obtient le cookie depuis l'écran enfant | `src/components/enfant/SortieParent.tsx` nommé, son chemin décrit, et la distinction entre les deux portes (PRD-15 Réglages, PRD-13 sortie de session) écrite |
| 18 | TEC-09 : une route qui renvoie 501 réserve l'exigence, elle ne la porte pas | ARB-11 appliqué : la ligne exacte à inscrire dans `TRACEABILITY.md` est fournie en 16.1 |
| 19 | `CHECK` 0..365 contre une route à 0/7/30 | Assumé explicitement comme deux niveaux distincts, écrit dans `policies.sql` : borne de schéma contre options d'interface |

## 0.3 Les cinq arbitrages de l'Orchestrateur

Ils sont inscrits dans `docs/agents/GATES.md` sous les numéros **ARB-08 à
ARB-11**, que ce document cite désormais par leur numéro.

| Arbitrage | Application |
| --- | --- |
| **ARB-11 — TEC-09 couverte sous condition** | Ligne de traçabilité rédigée en 16.1, avec la condition nommée et son porteur. Le `501 TIPI_NON_IMPLEMENTE` reste |
| **ARB-09 — V3 autonome pour la fermeture** | La clôture normale (T9) et la clôture automatique (T12) ne dépendent d'aucun élément de V7. V7 n'ajoute que la sortie anticipée (T10). Écrit en 14, colonne « dépend de » |
| **ARB-08 — une étape vide n'est jamais créée** | La transition `ETAPE_VIDE` **disparaît** de la machine. `POST /api/session` refuse une étape sans exercice (`exerciseIds` non vide). Le bonus devient « toutes les étapes programmées terminées » : l'énumération `RaisonGem` passe de `bonus_deux_etapes` à **`bonus_soiree_complete`**. Conséquence signalée en 18 |
| **Glob `30-copy-enfant.mdc`** (sans numéro à ce jour) | Glob complet proposé en 18, `gwenn` supprimé. Je ne modifie pas le fichier de règles : ce n'est pas un de mes quatre livrables |
| **ARB-10 — `ui-enfant.json` / `ui-parent.json`** | Affectés à **`contenu-enfant`, contrôlés par `controle-produit`, avant G3**, et non à `dev-feature`. Écrit en 14 |

## 0.4 Reprise après ARB-12

ARB-12 tranche les deux points que j'avais laissés ouverts à la fin du tour 2.

| Point | Décision de l'Orchestrateur | Ce que j'ai fait |
| --- | --- | --- |
| **ARB-12.1 — les six clés `lecture.vide.*` / `maths.vide.*`** | Retirées, **à condition** qu'aucun des cinq états limites n'y perde sa couverture. « Je préfère une clé en trop à un état limite sans écran » | **Vérification menée état par état, section 10.3.** Les cinq états gardent chacun une couverture propre : aucune des six clés n'est porteuse. **Les six partent.** J'y ajoute deux points d'exécution que la vérification a fait apparaître : le retrait touche aussi `content/encouragements.json` (deux entrées de `cles_fixes_non_variees`), et une **condition** du résumé parent doit être élargie — sans ajouter le moindre texte |
| **ARB-12.2 — le barème** | La ligne de `TRACEABILITY.md` doit citer ARB-08 et expliquer l'écart en une phrase. Idem partout où le livrable touche au barème | **Formulation canonique unique, écrite en 9.5**, reprise dans les **quatre** endroits qui énoncent le barème : section 9.5, commentaire de `RaisonGem` dans `prisma/schema.prisma`, commentaire du `CHECK gem_ledger_delta_max_un` dans `supabase/policies.sql`, et **trois lignes de traçabilité prêtes à coller en 16.2** (ETH-04, TEC-11, SEC-06) |

Rien d'autre n'a bougé : aucun chiffre, aucune route, aucune table, aucune
variable. Les mesures du tour 2 restent valides telles quelles, et
`prisma validate` est rejoué en 17.1 parce que le commentaire de `RaisonGem` a
changé.

---

## Sommaire

1. Principes et ce que l'architecture refuse de faire
2. Arborescence
3. Modèle de données
4. Row Level Security
5. Les quatre frontières de fournisseur (TEC-17, TEC-08, TEC-09, OCR)
6. SEC-04 — où la coupure est faite
7. TEC-11 et SEC-06 — démonstration qu'aucun chemin client n'incrémente le solde
8. Contrats des routes serveur
9. Machine à états de session
10. Taxonomie d'erreurs et états limites PRD-16
11. Variables d'environnement
12. Budget de latence et stratégie de cache TTS
13. TEC-16 — seuils de calibration
14. Verticales V1 à V9 et dépendances
15. Dépendances, et celles que je n'ajoute pas
16. Tableau de couverture REQ-TEC et REQ-SEC
17. Sorties réelles de mes commandes
18. Points que je veux voir tranchés

---

# 1. Principes et ce que l'architecture refuse de faire

Cinq décisions structurantes gouvernent tout le reste. Chacune est rattachée à
une exigence nommée ; aucune n'est une préférence de style.

**D1 — Le navigateur ne parle qu'à Next.js. Jamais à Supabase, jamais à un
fournisseur tiers.** Conséquence : il n'existe aucune clé Supabase, Google ou
DeepSeek dans le bundle, pas même la clé `anon` (TEC-13). Les photos transitent
par une route serveur, les audios aussi, les URL de lecture sont signées côté
serveur. **Une seule exception, bornée et mesurée** : le client va chercher
directement, sans aucune clé, les clips audio du bucket public `tts-cache`, qui
ne contient que des phrases de Pilou sans jeton — ni prénom, ni texte de devoir
(section 12.2). Tout clip personnel passe par le serveur.

**D2 — L'état de session vit en base, et la base est la seule source de
vérité** (TEC-18, PRD-18). Zustand ne détient que de l'état d'affichage
(variante de phrase en cours, indice affiché, micro ouvert). Fermer l'onglet ne
perd rien ; rouvrir relit la base. Aucun `localStorage` ne porte de donnée de
parcours.

**D3 — Une seule route mute l'état de session**, `POST /api/session/:id/transition`.
Elle recalcule l'état cible à partir de l'état persisté et de l'événement reçu,
jamais à partir d'un état envoyé par le client. C'est aussi le seul endroit d'où
partent les crédits de pierres, **dans la même transaction que la transition**
(TEC-10, TEC-11, SEC-06).

**D4 — Le payload d'IA est construit par un seul module, à partir d'un seul
type.** L'interface `AiProvider` ne sait pas ce qu'est un enfant : elle ne prend
que du texte d'exercice. On ne peut donc pas lui passer un prénom par
inadvertance (SEC-04, section 6).

**D5 — Pas de couche sans exigence.** Concrètement, ce que je n'écris pas : pas
de bibliothèque de machine à états, pas de tRPC, pas de service worker ni de Web
Push, pas de repository pattern au-dessus de Prisma, pas de politique RLS
paramétrique tant qu'il n'y a pas d'authentification, pas de table de cache TTS,
pas de file d'attente. Chaque refus est motivé en section 15.

---

# 2. Arborescence

```
tipi/
├── .env.example                     livré ici
├── .cursor/                         agents et règles (PHASE 0)
├── content/                         TEXTES. Lecture seule pour le code.
│   ├── encouragements.json          P1bis — 23 situations, 460 variantes
│   ├── gwenn-scripts.json           P1bis — rituels invariants (19 lignes)
│   ├── ui-enfant.json               V1 par `contenu-enfant` — clés fixes des écrans enfant
│   └── ui-parent.json               V1 par `contenu-enfant` — écrans parent et Réglages
├── docs/agents/                     livrables et verdicts
├── prisma/
│   ├── schema.prisma                livré ici
│   ├── migrations/                  générées par `prisma migrate dev`
│   └── seed.ts                      foyer + profil d'Evan + palier d'exemple (PRD-02)
├── supabase/
│   └── policies.sql                 livré ici, appliqué APRÈS `migrate deploy`
├── scripts/
│   ├── prewarm-tts.ts               TEC-09b — 460 clips publics, 14 clips privés
│   ├── verifier-solde.ts            TEC-11 — rejoue l'invariant solde == somme du ledger
│   └── verifier-confinement.ts      TEC-17 — rejoue les règles grep de 5.1 et 7.2
├── public/                          icône, écran de lancement, sons
├── e2e/                             P6 — 11 scénarios Playwright
└── src/
    ├── app/                         Next.js 14 App Router
    │   ├── layout.tsx               thème appliqué sur <html data-theme>, providers
    │   ├── page.tsx                 `/` aiguillage (7.1), aucun texte
    │   ├── bienvenue/page.tsx       onboarding 3 écrans (PRD-01)
    │   ├── enfant/
    │   │   ├── page.tsx             accueil, états vide / souci / reprise
    │   │   ├── programme/page.tsx   annonce en 2 pictos (PRD-07)
    │   │   ├── session/lecture/page.tsx
    │   │   ├── session/maths/page.tsx
    │   │   ├── pause/page.tsx       respiration (PRD-12)
    │   │   ├── bravo/page.tsx       rituel invariant (PED-12)
    │   │   └── coffre/page.tsx      solde, palier, cosmétiques (PRD-14)
    │   ├── parent/
    │   │   ├── page.tsx             scan (PRD-03) + engrenage Réglages
    │   │   ├── programme/page.tsx   aperçu et ajustement (PRD-04, TEC-06)
    │   │   └── resume/page.tsx      résumé qualitatif (PRD-06)
    │   ├── reglages/
    │   │   ├── code/page.tsx        clavier 10 chiffres (PRD-15, SEC-01/02)
    │   │   ├── page.tsx             menu
    │   │   └── [section]/page.tsx   8 sous-pages de 7.14
    │   ├── dev/design-system/page.tsx   P3, jamais liée depuis l'app
    │   └── api/                     TOUTES les routes serveur, détaillées en 8
    ├── components/
    │   ├── ui/                      P3 — Button, Card, Chip, Keypad, GemCounter…
    │   ├── pilou/                   P3 — mascotte SVG, PilouReflechit, SpeechBubble
    │   ├── enfant/                  composants d'écran enfant
    │   │   └── SortieParent.tsx     PRD-13 — appui long 2 s + clavier, en surcouche
    │   └── parent/                  composants d'écran parent et Réglages
    ├── config/
    │   ├── env.ts                   parse Zod des variables, SERVEUR UNIQUEMENT
    │   ├── env.client.ts            les 3 variables NEXT_PUBLIC_, importable côté client
    │   ├── ui.config.ts             constantes d'interface CLIENT : seuil 400 ms (TEC-12),
    │   │                            durées d'animation, appui long PRD-13
    │   ├── mascot.config.ts         P3 — nom, palette, cosmétiques, VOIX FIGÉE (TEC-08)
    │   ├── seuils.config.ts         TEC-16 — seuils de calibration, serveur uniquement
    │   └── pierres.config.ts        barème de 3.7, une seule table
    ├── content/                     chargeur typé des fichiers content/
    │   ├── schema.ts                Zod des 4 fichiers, exécuté une fois au boot
    │   ├── loader.ts                import JSON + parse + gel
    │   ├── selection.ts             tirage sans répétition immédiate (ARB-04)
    │   ├── jetons.ts                rendu de {prenom} et {matiere} — SERVEUR (SEC-04)
    │   └── cles.ts                  table de sélection C1→C6 de 7.0 du marketing
    ├── lib/
    │   ├── db/prisma.ts             singleton Prisma, serveur uniquement
    │   ├── validation/
    │   │   └── json.ts              Zod des 3 colonnes Json (3.2), à l'écriture ET à la lecture
    │   ├── ai/                      TEC-17 — voir section 5
    │   │   ├── provider.ts          interface AiProvider + types d'entrée/sortie
    │   │   ├── index.ts             fabrique, lit AI_PROVIDER
    │   │   ├── anonymisation.ts     SEC-04 — construction et garde du payload
    │   │   ├── schemas.ts           Zod des 3 sorties JSON (3.6)
    │   │   ├── prompts/             prompt-1-structuration.ts, -2-indices.ts, -3-questions.ts
    │   │   └── providers/deepseek.ts  SEUL fichier qui connaît le protocole du fournisseur
    │   ├── ocr/
    │   │   ├── provider.ts          interface OcrProvider
    │   │   ├── providers/google-vision.ts
    │   │   └── normalisation.ts     3.2 étape 3 : nettoyage + détection fr/br
    │   ├── voice/                   TEC-08, TEC-09b
    │   │   ├── provider.ts          interface VoiceProvider
    │   │   ├── index.ts             fabrique, lit VOICE_PROVIDER
    │   │   ├── cache.ts             clé sha256, AIGUILLAGE public / privé (SEC-04)
    │   │   └── providers/google-chirp3.ts
    │   ├── speech/                  TEC-09
    │   │   ├── provider.ts          interface SpeechProvider (client)
    │   │   └── providers/web-speech.ts
    │   ├── session/                 TEC-10
    │   │   ├── types.ts             EtatSession, Evenement, Etape, Snapshot
    │   │   ├── machine.ts           FONCTION PURE : (etat, evenement, plan) -> transition
    │   │   ├── service.ts           applique la transition en transaction, persiste
    │   │   └── cloture-automatique.ts  T12 — ferme une session périmée (PRD-18)
    │   ├── pierres/
    │   │   ├── bareme.ts            +1 par étape, +1 si toutes les étapes sont finies
    │   │   └── service.ts           crediter() : ledger + recalcul du solde (SEC-06)
    │   ├── lecture/
    │   │   ├── matching.ts          normalisation + Levenshtein par mot (3.4) — SERVEUR
    │   │   └── questions.ts         jugement souple sur mots-clés — SERVEUR
    │   ├── maths/
    │   │   └── indices.ts           déroulé 1→4, un par appui, jamais plus loin
    │   ├── parent/
    │   │   ├── code.ts              argon2id, vérification, blocage (SEC-01/02)
    │   │   ├── session-parent.ts    cookie httpOnly signé, TTL 5 min (PRD-15)
    │   │   └── resume.ts            faits de session -> observations (PRD-06)
    │   ├── storage/supabase.ts      upload, URL signée, purge (SEC-05)
    │   ├── notifications/locale.ts  Notification API, même appareil (PRD-06, TEC-18)
    │   ├── errors/
    │   │   ├── codes.ts             la taxonomie de la section 10
    │   │   ├── app-error.ts         classe AppError { code, httpStatus, cleContenu }
    │   │   └── route.ts             enveloppe handler() : validation Zod + mapping HTTP
    │   └── dates/
    │       ├── age.ts               âge calculé depuis la date de naissance (PRD-02)
    │       └── soiree.ts            date locale d'une soirée — garde de T12 (PRD-18)
    ├── hooks/                       TanStack Query : useSession, useCoffre, useVoix…
    ├── stores/session-ui.ts         Zustand : état d'AFFICHAGE seulement (D2)
    └── styles/themes.css            P3 — variables CSS des deux thèmes
```

**Responsabilités, en une phrase par dossier de premier niveau :**

| Dossier | Responsabilité | Ce qu'il ne fait jamais |
| --- | --- | --- |
| `content/` | Tous les textes vus par un humain | Contenir de la logique |
| `src/app/(pages)` | Composer des composants, appeler des hooks | Contenir une règle métier, une clé, un texte en dur |
| `src/app/api/` | Valider, autoriser, appeler `src/lib`, mapper les erreurs | Contenir de la logique métier |
| `src/lib/**` | La logique, testable sans Next.js | Importer un composant React |
| `src/config/` | Les valeurs réglables, en un seul endroit | Être dupliqué dans le code |
| `src/stores/` | État d'affichage volatil | Porter l'état de session (c'est la base) |

**Pourquoi deux fichiers de configuration et non un** (constat 16) :
`seuils.config.ts` lit `env.ts`, qui est strictement serveur — l'importer depuis
un composant ferait fuiter la configuration serveur dans le bundle. `ui.config.ts`
ne contient que des constantes d'interface sans secret, et c'est lui qui porte le
seuil de 400 ms de TEC-12. Le partage est net : un seuil **réglable sur du réel**
va dans `seuils.config.ts` (serveur) ; une constante **de présentation** va dans
`ui.config.ts` (client).

---

# 3. Modèle de données

## 3.1 Conformité à la section 3.7, table par table

Les neuf tables de 3.7 existent, avec leurs champs clés, aux noms de colonnes
exacts. Une dixième table existe, exigée nommément par TEC-16. La onzième table
du schéma, `_prisma_migrations`, est créée par l'outil de migration et couverte
par la RLS au même titre (section 4).

| Table 3.7 | Modèle Prisma | Champs de 3.7 présents | Ajouts, et l'exigence qui les impose |
| --- | --- | --- | --- |
| `family` | `Family` | id, nom | `retention_audio_jours` (SEC-05), `calibration_active` (TEC-16), `created_at` |
| `child` | `Child` | id, family_id, prenom, date_naissance, niveau_scolaire, classe_bilingue, gem_balance, theme_prefere, cosmetique_active | `onboarding_termine_le` (PRD-01 + TEC-18 : le marqueur doit survivre à un vidage du navigateur), `created_at`, `updated_at` |
| `homework` | `Homework` | id, child_id, photo_url, texte_ocr, langue_detectee, matiere, created_at | `confiance_ocr` (TEC-16), `saisie_manuelle` (PRD-16) |
| `exercise` | `Exercise` | id, homework_id, consigne, type, contenu, indices (Json) | `ordre` (PED-06 : l'ordre des exercices d'une étape doit être stable), `created_at` |
| `session` | `Session` | id, child_id, date, etat, etapes_prevues (Json), etape_courante, resume, started_at, ended_at | `evenements` (PRD-18 + PRD-06), `soir_leger` (PRD-04), `arret_parent` (PRD-13), `created_at`, `updated_at` |
| `attempt` | `Attempt` | id, exercise_id, session_id, transcription_audio, audio_url, nb_indices_utilises, statut | `nb_sollicitations` (PED-08), `mots_hesitants` (3.4 « Mots à revoir »), `created_at`, `updated_at` |
| `gem_ledger` | `GemLedger` | id, child_id, session_id, delta, raison, created_at | aucun. **`session_id` est passé d'optionnel à obligatoire** (constat 8) |
| `reward_threshold` | `RewardThreshold` | id, child_id, gems_requis, description, atteint_le | `created_at` |
| `settings_access` | `SettingsAccess` | id, family_id, code_hash, tentatives_echouees, bloque_jusqu_a, updated_at | aucun |
| — | `CalibrationLog` | — | **Table entière**, exigée par TEC-16 : « journaliser en base le texte OCR brut, le score de confiance et le JSON renvoyé par DeepSeek » |

**Aucun champ de 3.7 n'est absent, aucun n'est renommé.** Les champs Prisma sont
en camelCase et mappés en snake_case par `@map`, pour que le SQL reste celui de
3.7 : `child.gemBalance` → colonne `gem_balance`, `session.etapesPrevues` →
colonne `etapes_prevues`. Un contrôleur qui veut vérifier lit la colonne, pas le
champ TypeScript.

**Une valeur d'énumération a changé au tour 2**, sur arbitrage de
l'Orchestrateur : `RaisonGem.bonus_deux_etapes` devient
**`bonus_soiree_complete`**. Le barème ne porte plus un « 2 » en dur (section
9.5).

**Six ajouts refusés**, pour mémoire, parce qu'ils auraient été de la
sur-ingénierie : table `session_event` (une colonne Json suffit), table
`tts_cache` (le chemin est déterministe, section 12.2), colonne
`session.etat_avant_pause` (l'étape de retour se déduit de `etape_courante`),
table `user` (aucune authentification en V1, TEC-18), colonne `child.age`
(interdit par PRD-02), table `cosmetique` (les cosmétiques sont une constante de
`mascot.config.ts`, pas une donnée).

## 3.2 Formes des colonnes Json

Trois colonnes Json, chacune avec une forme fixe validée par Zod à l'écriture
**et** à la lecture. Le propriétaire de ces schémas est `src/lib/validation/json.ts`
(constat 12). Aucune n'est un fourre-tout.

```ts
// exercise.indices — TEC-07
{ niveaux: [string, string, string, string], source: "pregenere" | "secours" }

// session.etapes_prevues — le programme validé par le parent (TEC-06)
// exerciseIds est NON VIDE : une étape sans exercice n'est jamais programmée
Array<{ matiere: "lecture" | "maths", ordre: number,
        dureeEstimeeMin: number, exerciseIds: string[] /* .min(1) */ }>

// session.evenements — journal append-only (PRD-18, PRD-06)
Array<{ evenementId: string, evenement: Evenement,
        de: EtatSession, vers: EtatSession, at: string /* ISO 8601 */ }>
```

## 3.3 Index et contraintes

| Objet | Où | Pourquoi |
| --- | --- | --- |
| `child(family_id)` | schema.prisma | listing du foyer |
| `homework(child_id, created_at)` | schema.prisma | photos du soir, du plus récent au plus ancien |
| `exercise(homework_id, ordre)` | schema.prisma | reconstruction d'une étape dans l'ordre |
| `session(child_id, date)` | schema.prisma | session du soir, **et garde de la clôture automatique T12** |
| `session(child_id, etat)` | schema.prisma | aiguillage `/` : trouver la session active (PRD-18) |
| `attempt(session_id)`, `attempt(exercise_id)` | schema.prisma | résumé parent, reprise |
| **unique** `attempt(session_id, exercise_id)` | schema.prisma | une tentative par exercice et par session : la reprise met à jour, elle ne duplique pas |
| `gem_ledger(child_id, created_at)` | schema.prisma | recalcul du solde et export |
| **unique** `gem_ledger(session_id, raison)` | schema.prisma | **idempotence du crédit**, sur une colonne `session_id` **obligatoire** : sans cela, PostgreSQL traiterait deux `NULL` comme distincts et l'unique ne garantirait rien (constat 8) |
| `reward_threshold(child_id, gems_requis)` | schema.prisma | palier suivant |
| **unique** `settings_access(family_id)` | schema.prisma | un seul code par foyer |
| `calibration_log(created_at)`, unique `(homework_id)` | schema.prisma | consultation depuis Réglages |
| **CHECK** `gem_ledger.delta > 0` | policies.sql B | **ETH-04 au niveau du schéma**, pas seulement du code |
| **CHECK** `gem_ledger.delta <= 1` | policies.sql B | le barème de 3.7 ne connaît que +1 |
| **CHECK** `child.gem_balance >= 0` | policies.sql B | SEC-06 |
| **CHECK** `settings_access.tentatives_echouees >= 0` | policies.sql B | SEC-02 |
| **CHECK** `reward_threshold.gems_requis > 0` | policies.sql B | PRD-14 |
| **CHECK** `family.retention_audio_jours BETWEEN 0 AND 365` | policies.sql B | SEC-05, borne de schéma — les options d'interface (0, 7, 30) sont un second niveau, assumé (constat 19) |
| **UNIQUE partiel** `session(child_id) WHERE etat NOT IN (termine, abandon_parent)` | policies.sql B | PRD-18 : une seule session active. Son pendant obligatoire est T12, sans quoi elle transformerait une soirée abandonnée en blocage définitif (constat 5) |
| **CHECK** cohérence `session.etat` / `etape_courante` | policies.sql B | TEC-10 : pas d'état de session impossible en base |

Prisma ne sait exprimer ni `CHECK` ni index unique partiel : ces huit
contraintes vivent dans `supabase/policies.sql`, partie B, en SQL idempotent.
**Les huit sont désormais listées nommément dans l'en-tête de
`prisma/schema.prisma`** (constat 10), parce que c'est ce fichier-là que lira
`dev-feature`.

---

# 4. Row Level Security

Le fichier `supabase/policies.sql` traite les dix tables métier une par une,
**plus `_prisma_migrations`** (constat 3). Le modèle est le même partout, et
c'est volontaire :

1. `ALTER TABLE … ENABLE ROW LEVEL SECURITY` ;
2. **aucune policy** pour `anon` ni `authenticated` — en Postgres, RLS activée
   sans policy applicable signifie zéro ligne lisible et zéro écriture ;
3. `REVOKE ALL … FROM anon, authenticated`, pour que la requête échoue avant
   même l'évaluation des policies ;
4. `REVOKE USAGE ON SCHEMA public`, pour que PostgREST ne résolve même pas le
   nom de la table ;
5. `ALTER DEFAULT PRIVILEGES FOR ROLE current_user … REVOKE`, pour qu'une table
   future n'hérite de rien.

**`_prisma_migrations`.** Elle est créée par `prisma migrate deploy`, pas par le
schéma, et le tour 1 l'avait oubliée. Elle ne contient aucune donnée
personnelle, mais SEC-03 dit « toutes les tables », et surtout son oubli rendait
fausse la preuve que je rendais moi-même. Elle a maintenant son bloc, protégé
par un `DO` qui n'échoue pas si le fichier est joué avant la première migration.

**Le rôle d'exécution est désormais imposé** (constat 13) : `policies.sql` doit
être joué sous le rôle de `DIRECT_URL`, celui des migrations. `ALTER DEFAULT
PRIVILEGES` porte une clause `FOR ROLE current_user` explicite et annonce le
rôle employé par un `RAISE NOTICE`. Sous un autre rôle, la commande ne
couvrirait aucune table future — la garantie était conditionnelle à une
hypothèse qui n'était pas écrite ; elle l'est.

**Pourquoi le refus total et non des policies par famille.** Il n'y a aucune
authentification en V1 : l'enfant joue sans compte (PRD-05) et le parent est
identifié par un code, pas par une identité Supabase. Il n'existe donc pas de
`auth.uid()` à qui rattacher une ligne. Écrire aujourd'hui
`USING (family_id = auth.jwt() ->> 'family_id')` produirait des politiques
jamais évaluées, donc jamais testées, qui donneraient l'illusion d'une défense.
La partie E de `policies.sql` décrit en quatre étapes ce qui change le jour où
un second appareil arrive (TEC-18) — **avec, au point 3, l'ordre impératif :
créer les policies d'abord, ouvrir le schéma ensuite**, sans quoi il existerait
une fenêtre où tout serait atteignable sans policy.

**Pourquoi pas `FORCE ROW LEVEL SECURITY`.** `FORCE` soumettrait aussi le
propriétaire des tables à RLS. Comme il n'existe aucune policy, l'application
elle-même serait verrouillée. La connexion applicative est une connexion serveur
de confiance ; la surface exposée en permanence, c'est PostgREST avec les rôles
`anon` et `authenticated`, et c'est elle que ce fichier ferme.

**Storage : quatre buckets** (section 12.2 pour le détail du partage).
`devoirs`, `audios` et `tts-prive` sont privés et n'ont **aucune** policy : ils
sont injoignables sans URL signée émise côté serveur. `tts-cache` est public
**en lecture seule** — une seule policy `SELECT` — et ne contient que des clips
sans aucun jeton. Aucun bucket n'a de policy d'écriture.

**Les preuves sont devenues exécutables** (constat 14). La partie D ne contient
plus des requêtes en commentaire mais **huit blocs `DO $$` qui lèvent une
exception** si l'invariant est faux : RLS sur toutes les tables sans liste en dur
(V1), aucune policy (V2), aucun privilège `anon` (V3), les huit contraintes
présentes (V4), un delta négatif réellement refusé (V5), l'invariant du solde
(V6), les tailles de Storage (V7), et l'existence d'un `tts-prive` privé (V8).
Appliquer `policies.sql` sur une base non conforme échoue bruyamment. Limite
assumée et écrite dans le fichier : ces vérifications prouvent l'état du
catalogue, pas le comportement de PostgREST face à une vraie clé anonyme —
c'est le travail de `securite-rgpd` en P7.

---

# 5. Les quatre frontières de fournisseur

## 5.1 `AiProvider` (TEC-17)

```ts
// src/lib/ai/provider.ts — ne mentionne aucun fournisseur
export type TexteExercice = { consigne: string; contenu: string; type?: string };

export interface AiProvider {
  readonly nom: string;
  structurerDevoir(texteOcr: string): Promise<DevoirStructure>;   // prompt 1
  genererIndices(exercice: TexteExercice): Promise<QuatreIndices>; // prompt 2
  genererQuestions(texte: string): Promise<QuestionsLecture>;      // prompt 3
}
```

- `src/lib/ai/index.ts` expose `getAiProvider()` et choisit sur `AI_PROVIDER`.
- `src/lib/ai/providers/deepseek.ts` est **le seul fichier qui connaît le
  protocole du fournisseur** : forme du corps de requête, nom du modèle, forme
  de la réponse. Deux autres fichiers en connaissent seulement le **nom**, et
  c'est irréductible : `src/lib/ai/index.ts`, qui associe la valeur `"deepseek"`
  à son implémentation, et `src/config/env.ts`, qui porte la valeur par défaut
  de `AI_PROVIDER`.
- Les trois prompts sont dans `src/lib/ai/prompts/`, versionnés
  (`VERSION = "1.0.0"` exporté), couverts par les tests de non-régression PED-01.
- Les trois sorties sont validées par les schémas Zod de `src/lib/ai/schemas.ts`.
  Une sortie non conforme est rejouée **une fois**, puis bascule en état
  `TIPI_IA_SORTIE_INVALIDE` (3.2 étape 4).
- L'implémentation est un simple `fetch` sur un point d'entrée compatible
  OpenAI. **Aucun SDK de fournisseur n'entre dans `package.json`.**

**Règle opposable, corrigée** (constat 2). Celle du tour 1 était cassée :
`--exclude-dir` compare le **nom de base** d'un répertoire, donc
`--exclude-dir=ai/providers` n'exclut rien, et la règle renvoyait jusqu'au
fichier qu'elle prétendait exclure. La règle exacte est :

```
grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)'
```

Elle doit renvoyer **zéro ligne**. Sortie réelle de l'ancienne comme de la
nouvelle en section 17.2 ; `scripts/verifier-confinement.ts` la rejoue, et
`controle-code` peut l'exécuter à chaque verticale.

Ce que cette règle prouve et ce qu'elle ne prouve pas : elle prouve qu'aucun
fichier hors des trois cités ne nomme le fournisseur. Elle ne prouve pas à elle
seule le confinement au sens de TEC-17 — c'est l'interface `AiProvider`, qui ne
mentionne aucun fournisseur et ne prend que `string` et `TexteExercice`, qui le
porte. L'absence de SDK est un bénéfice pour le changement de fournisseur, pas
une preuve de confinement : un `fetch` brut fuit aussi bien qu'un SDK s'il est
écrit ailleurs.

Ce qu'il faut faire pour passer à un modèle hébergé en UE : écrire un fichier
dans `src/lib/ai/providers/`, l'enregistrer dans la fabrique, changer
`AI_PROVIDER`. Zéro ligne modifiée ailleurs.

## 5.2 `VoiceProvider` (TEC-08)

```ts
export interface VoiceProvider {
  readonly nom: string;
  synthetiser(texte: string, voix: VoixConfig): Promise<ArrayBuffer>; // audio/mpeg
}
```

Fabrique sur `VOICE_PROVIDER`, implémentation `google-chirp3.ts`. **Le nom de la
voix n'est pas une variable d'environnement** : il est figé dans
`src/config/mascot.config.ts`, parce que TEC-08 exige une voix unique et
définitive et que la section 8.5 du prompt maître en fait un choix humain. Une
voix modifiable par variable d'environnement serait une rupture possible pour
l'enfant à chaque déploiement.

## 5.3 `SpeechProvider` (TEC-09)

```ts
export interface SpeechProvider {
  readonly nom: string;
  estDisponible(): boolean;
  ecouter(options: { langue: "fr-FR" }): Promise<{ transcription: string; confiance: number }>;
  arreter(): void;
}
```

V1 implémente `web-speech.ts` (`webkitSpeechRecognition`), gratuite et sans
quota. Le choix se fait sur `NEXT_PUBLIC_SPEECH_PROVIDER`, qui n'est pas un
secret. **L'implémentation Google Cloud Speech-to-Text n'est pas écrite en V1**,
et je le dis franchement plutôt que de livrer du code mort : TEC-09 la
conditionne à un constat d'insuffisance sur la voix d'Evan, et la section 8.4 du
prompt maître dit que ce constat demande des enregistrements réels. L'interface,
la valeur `google` de la variable et le contrat de la route de repli
(`POST /api/voix/transcrire`, section 8) sont prêts ; la route renvoie
`501 TIPI_NON_IMPLEMENTE`, qui est la trace honnête. **ARB-11 appliqué** : la ligne de traçabilité correspondante est rédigée
en 16.1.

`estDisponible()` faux ou permission refusée ⇒ état `lecture.micro_absent` :
l'étape reste terminable sans micro (PRD-16).

**Le rapprochement du texte lu est fait côté serveur**, dans
`POST /api/session/:id/tentative` (section 8.3), et non dans le navigateur. Deux
raisons : les seuils de tolérance sont des variables de configuration serveur
(TEC-16) et n'ont pas à descendre dans le bundle, et le résultat doit de toute
façon être persisté dans `attempt` (PRD-18). Le client n'envoie que la
transcription.

## 5.4 `OcrProvider`

```ts
export interface OcrProvider {
  readonly nom: string;
  extraire(image: Buffer): Promise<{ texte: string; confiance: number }>;
}
```

Une seule implémentation, Google Cloud Vision `DOCUMENT_TEXT_DETECTION`
(TEC-05). L'interface existe parce que l'OCR est l'endroit du produit le plus
susceptible d'être remplacé après la calibration (TEC-16) — pas par symétrie
décorative.

**Interdit structurel** : `AiProvider` ne prend aucun `Buffer`, aucune image,
aucune URL. Envoyer une photo à un modèle de langage est impossible sans
changer l'interface, ce qu'une revue verrait (3.2, encadré « Interdit »).

---

# 6. SEC-04 — où la coupure est faite

Trois barrières, dans cet ordre, toutes nommées.

**Barrière 1, le type.** `AiProvider` n'accepte que `string` et
`TexteExercice = { consigne, contenu, type? }`. Il n'existe aucune signature qui
accepte un `Child`, un `prenom`, un `childId` ou un `Buffer`. Le compilateur
refuse de passer une donnée identifiante : ce n'est pas une convention, c'est une
erreur de typage.

**Barrière 2, le constructeur de payload.** `src/lib/ai/anonymisation.ts` est le
seul module qui fabrique le corps de la requête. Il expose :

```ts
export function construirePayload(prompt: string, texte: string): PayloadIa;
export function assertPayloadAnonyme(payload: PayloadIa, interdits: string[]): void;
```

`providers/deepseek.ts` n'a pas le droit de construire son corps de requête
lui-même ; il reçoit un `PayloadIa` déjà scellé.

**Barrière 3, la garde à l'exécution.** Avant chaque appel réseau,
`assertPayloadAnonyme` cherche dans le payload sérialisé, en comparaison
insensible à la casse et aux accents : le prénom de l'enfant, son
identifiant, l'identifiant de famille, le nom du foyer, et toute occurrence de
`data:image` ou `base64`. Une correspondance lève une `AppError`
(`TIPI_PAYLOAD_NON_ANONYME`) et l'appel n'est **pas** émis.

**Preuve.** `calibration_log.payload_ia` stocke le payload **exact** qui a été
envoyé (TEC-16). Le test de SEC-04 n'a donc pas besoin de faire confiance au
code : il lit en base ce qui est réellement parti et vérifie l'absence du
prénom. C'est la même donnée que `red-team` attaquera (tentative 8).

**La quatrième fuite possible était le son, et elle est fermée au tour 2.** Le
prénom ne part pas seulement dans un payload de texte : il est aussi
**prononcé** par Pilou dans 14 clips audio. Le tour 1 les déposait dans un
bucket public dont le chemin est calculable depuis le dépôt : c'était un oracle
de confirmation du prénom. Ces 14 clips vivent désormais dans le bucket privé
`tts-prive` et ne sont servis que par URL signée (section 12.2). La règle est
écrite dans `supabase/policies.sql` et vérifiée par V8.

**Le code parent ne traverse jamais aucune de ces frontières** (SEC-08) : il
n'est connu que de `src/lib/parent/code.ts`, qui ne dépend d'aucun module de
`src/lib/ai/` ni de `src/lib/voice/`.

---

# 7. TEC-11 et SEC-06 — démonstration qu'aucun chemin client n'incrémente le solde

La démonstration se fait en cinq points, chacun vérifiable par un contrôleur.

**7.1 — Il n'existe aucune route qui accepte un montant.** L'inventaire complet
des routes (section 8) ne contient aucun `POST /api/pierres`, aucun paramètre
`delta`, `montant`, `gems` ou `solde` en entrée. `GET /api/coffre` est la seule
route qui parle de pierres, et elle est en lecture.

**7.2 — Le crédit n'est pas une route, c'est un effet de bord.**
`crediterEtape()` et `crediterBonus()` vivent dans `src/lib/pierres/service.ts`
et ne sont appelés que depuis `src/lib/session/service.ts` et
`src/lib/session/cloture-automatique.ts`, eux-mêmes appelés par les seules
routes `POST /api/session/:id/transition`, `GET /api/etat` et
`POST /api/session` (pour la clôture automatique T12). Le montant n'est jamais un
paramètre d'entrée : il est lu dans `src/config/pierres.config.ts`.

**Règles opposables, corrigées** (constat 2, note). Celle du tour 1 mélangeait
écriture et lecture et citait `scripts/`, qui n'est pas sous `src/`. Deux règles
distinctes, dont les sorties réelles sont en 17.2 :

```
# R2 — ÉCRITURE du ledger ou du solde. Attendu : src/lib/pierres/service.ts, et rien d'autre.
grep -rlE 'gemLedger\.(create|createMany|upsert|update|delete)|gemBalance *:|gem_balance *=' \
     src/ scripts/ --include=*.ts

# R3 — LECTURE du solde. Autorisée hors du service : le coffre l'affiche.
grep -rlE 'gemBalance' src/ scripts/ --include=*.ts
```

**7.3 — Le solde est recalculé, jamais incrémenté.** Dans une seule transaction
Prisma :

```
INSERT INTO gem_ledger (child_id, session_id, delta, raison) VALUES (…, 1, …)
UPDATE child SET gem_balance =
  (SELECT COALESCE(SUM(delta), 0) FROM gem_ledger WHERE child_id = $1)
WHERE id = $1
```

Aucun `gem_balance = gem_balance + 1` n'existe. Le solde est donc toujours
exactement la somme du ledger — l'invariant que 3.7 demande de tester, et que
`scripts/verifier-solde.ts` et la vérification V6 de `policies.sql` rejouent.

**7.4 — La base refuse ce que le code refuserait.** `delta > 0` et `delta <= 1`
sont des `CHECK` Postgres (ETH-04), `gem_balance >= 0` aussi, et l'unique
`(session_id, raison)` rend un double crédit impossible même en cas de double
appel. **Cette dernière garantie n'était vraie qu'à moitié au tour 1** :
`session_id` était nullable, et PostgreSQL traite les `NULL` comme distincts
dans un index unique. La colonne est désormais obligatoire (constat 8), ce qui
est de toute façon la vérité métier : aucun crédit du barème de 3.7 n'existe hors
d'une session.

**7.5 — Le client n'a aucune connexion à la base.** Pas de clé Supabase dans le
bundle (D1), RLS et `REVOKE` refusent tout à `anon` (section 4). Une requête
forgée n'a ni endpoint applicatif, ni accès direct.

Chemins d'attaque envisagés et fermés : requête forgée sur une route de crédit
(n'existe pas), rejeu d'une transition déjà appliquée (`evenementId` +
`etatAttendu` + unique `(session_id, raison)`), double appui (verrou
`FOR UPDATE`), écriture directe PostgREST (RLS + REVOKE), manipulation du store
Zustand (le store ne porte que de l'affichage ; le coffre relit
`GET /api/coffre`).

---

# 8. Contrats des routes serveur

32 chemins. Conventions communes à **toutes** les routes :

- Handler enveloppé par `src/lib/errors/route.ts` : parse Zod de l'entrée,
  exécution, mapping `AppError` → statut HTTP.
- Réponse d'erreur, toujours la même forme, jamais de détail technique :
  `{ "erreur": { "code": "TIPI_…", "cleContenu": "parent.scan.illisible.corps" } }`.
- `400 TIPI_VALIDATION` en cas d'échec Zod, sur toutes les routes.
- Les routes `/api/reglages/**` exigent le cookie de session parent signé ; sans
  lui, `401 TIPI_REGLAGES_EXPIRE`, sans aucune autre information (SEC-08).
- Aucune route ne renvoie jamais `code_hash`, ni le code en clair, ni une
  variable d'environnement (SEC-01, SEC-08).

Types Zod partagés : `Uuid = z.string().uuid()`,
`Matiere = z.enum(["lecture","maths"])`,
`EtatSession = z.enum(["idle","annonce","etape_lecture","transition","etape_maths","cloture","termine","pause","abandon_parent"])`.

## 8.1 Aiguillage

| | |
| --- | --- |
| **`GET /api/etat`** | Aiguillage de `/` (7.1), PRD-01, PRD-18 |
| Entrée | aucune |
| Sortie | `{ onboardingFait: boolean, enfant: { id: Uuid, prenom: string, theme: "pilou"\|"apple" }, sessionActive: { id: Uuid, etat: EtatSession, route: string } \| null, programmeEnAttente: boolean }` |
| **Effet de bord** | **Clôture automatique d'une session périmée (T12)** : avant de répondre, la route cherche une session non finale dont `session.date` est antérieure à la soirée courante ; si elle existe, elle la clôt, crédite ce qui était dû et génère son résumé. `sessionActive` vaut alors `null`. C'est ce qui empêche l'enfant de retomber sur les devoirs de la veille (constat 5) |
| Erreurs | `500 TIPI_INTERNE` → l'interface bascule sur `/parent` avec `parent.aiguillage.bandeau` ; **jamais une page d'erreur à l'enfant** |

## 8.2 Capture et analyse (V2)

| | |
| --- | --- |
| **`POST /api/devoirs/photo`** | `multipart/form-data`, PRD-03 |
| Entrée | `photo: File` (≤ `UPLOAD_MAX_PHOTO_OCTETS`, `image/jpeg\|png\|webp`) |
| Sortie | `{ homeworkId: Uuid }` |
| Erreurs | `413 TIPI_FICHIER_TROP_GRAND`, `415 TIPI_FORMAT_REFUSE`, `502 TIPI_UPLOAD_ECHEC` → `parent.scan.envoi_echec.*` |

| | |
| --- | --- |
| **`DELETE /api/devoirs/photo/{homeworkId}`** | retrait d'une vignette avant analyse |
| Sortie | `204` |
| Erreurs | `404 TIPI_INTROUVABLE`, `409 TIPI_DEJA_ANALYSE` |

| | |
| --- | --- |
| **`POST /api/devoirs/saisie-manuelle`** | voie de secours toujours ouverte (PRD-16) |
| Entrée | `{ matiere: Matiere, consigne: string (1..500), contenu: string (1..4000) }` |
| Sortie | `{ homeworkId: Uuid }` |

| | |
| --- | --- |
| **`POST /api/devoirs/analyse`** | pipeline 3.2, étapes 2 à 4 |
| Entrée | `{ homeworkIds: Uuid[] (1..10) }` |
| Sortie | `{ programme: { etapes: [{ matiere, dureeEstimeeMin, exercices: [{ id, consigne, type }] (1..n) }] (1..2), langueDetectee, reportes: string[] } }` |
| Erreurs | `422 TIPI_OCR_VIDE`, `422 TIPI_OCR_CONFIANCE_BASSE` → `parent.scan.illisible.*` ; `422 TIPI_AUCUN_EXERCICE` → `parent.apercu.vide.*` ; `502 TIPI_IA_SORTIE_INVALIDE` (après une relance), `502 TIPI_IA_INDISPONIBLE`, `504 TIPI_IA_TIMEOUT` → `parent.scan.analyse_echec.*` |
| Notes | Le regroupement à 2 étapes maximum est fait **côté serveur** après validation Zod (PED-06). **Une étape sans exercice exploitable n'est pas proposée au parent** : elle est écartée ici, et la soirée en compte une de moins (ARB-08). Si toutes le sont, `TIPI_AUCUN_EXERCICE`. Les indices des exercices de maths sont pré-générés ici (TEC-07). Journalisation calibration si `family.calibration_active` (TEC-16) |

| | |
| --- | --- |
| **`GET /api/devoirs/programme`** | relecture de l'aperçu après un rafraîchissement |
| Sortie | même forme que ci-dessus, ou `404 TIPI_INTROUVABLE` |

## 8.3 Session (V3)

| | |
| --- | --- |
| **`POST /api/session`** | TEC-06 : seule porte d'entrée vers `/enfant` |
| Entrée | `{ etapes: [{ matiere: Matiere, exerciseIds: Uuid[] (min 1), dureeEstimeeMin: number }] (1..2), soirLeger: boolean, sansDevoir?: boolean }` |
| Sortie | `{ session: Snapshot }` avec `etat = "idle"` |
| **Effet de bord** | Même clôture automatique T12 que `GET /api/etat`, **avant** la création : une session de la veille ne doit jamais empêcher le parent de lancer la soirée (constat 5) |
| Gardes | `400 TIPI_VALIDATION` si plus de 2 étapes (PED-06) ; `400 TIPI_ETAPE_SANS_EXERCICE` si une étape a `exerciseIds` vide (ARB-08) ; `400 TIPI_ETAPES_MEME_MATIERE` si deux étapes portent la même matière — sans quoi le second crédit échouerait sur l'unique `(session_id, raison)` (constat 9) ; `409 TIPI_SESSION_DEJA_ACTIVE` s'il reste une session active **de la soirée courante**, avec `{ sessionId }` dans la réponse pour que l'interface propose « Reprendre la soirée en cours » |
| Note | Une soirée « pas de devoirs ce soir » se crée avec `etapes: []` **et** `sansDevoir: true`. Le drapeau est obligatoire : un programme vide accidentel reste une erreur |

| | |
| --- | --- |
| **`GET /api/session/{id}`** | reprise (PRD-18) |
| Sortie | `Snapshot = { id, etat, etapeCourante, etapes, matiereCourante, exerciceCourant, indicesDejaVus: number, soirLeger, arretParent, pierresDuSoir: number }` |

| | |
| --- | --- |
| **`POST /api/session/{id}/transition`** | **la seule route qui mute l'état** |
| Entrée | `{ evenementId: Uuid, evenement: Evenement, etatAttendu: EtatSession }` |
| Sortie | `{ session: Snapshot, pierresCreditees: number }` |
| Erreurs | `409 TIPI_TRANSITION_INVALIDE` **avec le snapshot courant dans la réponse**, pour que le client se recale sans rien perdre ; `404 TIPI_SESSION_INTROUVABLE` ; `403 TIPI_ABANDON_NON_AUTORISE` si `ABANDON_PARENT` sans cookie parent (PRD-13) |
| Idempotence | Un `evenementId` déjà présent dans `session.evenements` renvoie `200` avec le snapshot courant, **sans effet de bord**. `etatAttendu` différent de l'état persisté ⇒ `409` sans effet de bord |
| **Crédit** | **Dans la transaction, toujours** (constat 4). Il n'existe plus de `creditDiffere` en sortie : si le crédit échoue, la transition entière est annulée et le client reçoit une erreur, donc l'état n'avance pas et rien n'est perdu. L'invariant `gem_balance == SUM(delta)` n'est jamais violé, même transitoirement |

| | |
| --- | --- |
| **`POST /api/session/{id}/tentative`** | trace d'une tentative (PRD-18, PRD-06) **et rapprochement du texte lu** (3.4) |
| Entrée | `{ exerciseId: Uuid, statut: "en_cours"\|"terminee"\|"passee"\|"bloquee", nbSollicitations?: number, transcription?: string (≤ 4000) }` |
| Sortie | `{ attemptId: Uuid, lecture?: { reconnue: boolean, motsHesitants: string[] } }` |
| Notes | Upsert sur `(sessionId, exerciseId)` : la reprise met à jour la même ligne. Quand `transcription` est fournie, le serveur applique `src/lib/lecture/matching.ts` avec les seuils de `seuils.config.ts` (TEC-16) et écrit `mots_hesitants` : le seuil ne descend jamais dans le bundle. **`nbIndicesUtilises` n'est pas dans cette entrée** : il n'est écrit que par `POST /api/indices` (constat 7) |

| | |
| --- | --- |
| **`GET /api/session/{id}/resume`** | PRD-06 |
| Sortie | `{ date: string, etapes: [{ matiere, statut: "terminee"\|"passee" }], observations: string[], motsARevoir: string[], audios: [{ attemptId, disponible: boolean }] }` |
| Règle | **Aucun nombre** dans la sortie hormis la date : ni durée, ni pierres, ni compte de mots. Les observations sont choisies dans la table de 7.12 à partir des faits de `session.evenements` et des `attempt` |

## 8.4 Voix et indices (V4, V5)

| | |
| --- | --- |
| **`POST /api/voix`** | TEC-08, TEC-09b, SEC-04 |
| Entrée | `{ demandes: [ D ] (1..12) }` où `D` vaut `{ source: "banque", situationId, varianteId, matiere?: "lecture"\|"maths" }` \| `{ source: "rituel", ligneId }` \| `{ source: "ui", cle }` \| `{ source: "exercice", exerciseId: Uuid, champ: "consigne"\|"contenu"\|"indice", niveau?: 1..4 }` |
| Sortie | `{ clips: [{ url: string, texte: string, cache: "hit"\|"miss", portee: "public"\|"prive" }] }` |
| Erreurs | `404 TIPI_INTROUVABLE` (identifiant inconnu), `502 TIPI_TTS_INDISPONIBLE` → `lecture.sans_voix.*`, `429 TIPI_TTS_QUOTA` |
| **Décisions** | (1) La route **n'accepte jamais de texte libre** : elle résout elle-même le texte depuis `content/**` ou depuis la base, ce qui interdit de brûler le quota avec du texte arbitraire. (2) **Le serveur est le seul à rendre les jetons** : le client n'envoie jamais un prénom, il n'en calcule jamais le hachage. (3) La route **choisit le bucket** : `tts-prive` + URL signée dès que le texte rendu contient le prénom ou vient d'un devoir, `tts-cache` public sinon (section 12.2). (4) L'entrée est un **tableau** : un écran demande toutes ses phrases en un aller-retour |

| | |
| --- | --- |
| **`POST /api/voix/transcrire`** | repli STT de TEC-09, **contrat défini, non implémenté en V1** |
| Entrée | `{ audio: File (≤ UPLOAD_MAX_AUDIO_OCTETS), langue: "fr-FR" }` |
| Sortie | `{ transcription: string, confiance: number }` |
| État | Renvoie `501 TIPI_NON_IMPLEMENTE` tant que le test avec la voix d'Evan n'a pas conclu (ARB-11, ligne de traçabilité en 16.1) |

| | |
| --- | --- |
| **`POST /api/indices`** | PED-02, TEC-07, PRD-18 |
| Entrée | `{ sessionId: Uuid, exerciseId: Uuid, niveau: 1..4 }` |
| Sortie | `{ niveau: 1..4, texte: string, dernier: boolean }` |
| **Effet d'écriture, contractuel** | Dans **la même transaction** que la lecture : upsert de la ligne `attempt` sur `(sessionId, exerciseId)` avec `nbIndicesUtilises = max(actuel, niveau)`. C'est le seul endroit où ce compteur avance, et c'est ce qui fait tenir la reprise PRD-18 — les indices déjà déroulés restent déroulés (constat 7) |
| Gardes | `400 TIPI_VALIDATION` si `niveau > 4` ou si `niveau > nbIndicesUtilises + 1` : **l'enfant ne peut pas sauter au niveau 4** (PED-02). `404 TIPI_SESSION_INTROUVABLE` si la session n'est pas active ou n'est pas celle de l'exercice |
| Repli | Si `exercise.indices` est nul, génération de secours par `AiProvider` (TEC-07) ; si elle échoue, `502 TIPI_INDICES_INDISPONIBLES` → `maths.sans_indice.*`, qui ne donne **jamais** le résultat (charte, point 6) |

## 8.5 Coffre (V6)

| | |
| --- | --- |
| **`GET /api/coffre`** | PRD-14 |
| Sortie | `{ solde: number, palierSuivant: { gemsRequis: number, reste: number } \| null, cosmetiques: [{ id, nom, seuil, debloque: boolean, actif: boolean }] }` |
| Règle | `palierSuivant.description` **n'est pas dans la sortie** : le texte libre du parent ne descend jamais vers un écran enfant (ETH-05, décision 7.9) |
| Erreurs | `502 TIPI_COFFRE_INDISPONIBLE` → `coffre.souci.*` |

| | |
| --- | --- |
| **`POST /api/coffre/cosmetique`** | DES-09 |
| Entrée | `{ cosmetiqueId: string }` |
| Sortie | `{ cosmetiqueActive: string }` |
| Erreurs | `403 TIPI_COSMETIQUE_VERROUILLE` si `solde < seuil` — vérifié **côté serveur**, jamais sur la foi du client |

## 8.6 Réglages et code parent (V7)

| Route | Entrée | Sortie | Erreurs |
| --- | --- | --- | --- |
| `POST /api/reglages/code/creer` | `{ code: string (10 chiffres), confirmation: string }` | `204` + cookie parent | `400 TIPI_CODE_LONGUEUR`, `400 TIPI_CODE_DISCORDANT`, `409 TIPI_CODE_EXISTANT` |
| `POST /api/reglages/code/verifier` | `{ code: string (10 chiffres), portee: "reglages" \| "sortie_session" }` | `{ ok: true }` + cookie parent | `401 TIPI_CODE_INVALIDE` + `{ essaisRestants }`, `423 TIPI_CODE_BLOQUE` + `{ bloqueJusquA }`, `409 TIPI_CODE_ABSENT` (→ mode création) |
| `POST /api/reglages/code/changer` | `{ actuel, nouveau, confirmation }` | `204` | idem |
| `GET \| PATCH /api/reglages/profil` | `{ prenom?, dateNaissance?, niveauScolaire?, classeBilingue? }` | `{ profil }` avec `age` **calculé** | `400` |
| `PATCH /api/reglages/apparence` | `{ theme: "pilou"\|"apple" }` | `{ theme }` | — |
| `GET \| POST /api/reglages/paliers`, `DELETE /api/reglages/paliers/{id}` | `{ gemsRequis: number > 0, description: string (1..200) }` | `{ paliers }` | `400` |
| `GET \| PATCH /api/reglages/audio` | `{ retentionJours: 0 \| 7 \| 30 }` | `{ retentionJours, nbEnregistrements }` | `400` |
| `POST /api/reglages/audio/purger` | aucune | `{ supprimes: number }` | `502` |
| `GET /api/reglages/calibration` | — | `{ active: boolean, restantes: number, analyses: [{ id, createdAt, confianceOcr, erreurCode }] }` | — |
| `GET /api/reglages/calibration/{id}` | — | `{ texteOcrBrut, confianceOcr, payloadIa, reponseIaBrute, seuilConfianceApplique, dureeMs }` | `404` |
| `PATCH /api/reglages/calibration` | `{ active: false }` | `{ active }` | — |
| `GET /api/reglages/donnees/export` | — | `application/json` en pièce jointe (SEC-07) | `502 TIPI_EXPORT_ECHEC` |
| `DELETE /api/reglages/donnees` | `{ confirmation: "SUPPRIMER" }` | `204` | `502 TIPI_SUPPRESSION_ECHEC` — **transaction : rien de partiel** |

**La portée du cookie** (constat 17). `POST /api/reglages/code/verifier` prend
une `portee`, parce que PRD-13 et PRD-15 sont **deux portes différentes** :

- `portee: "reglages"` — demandée depuis l'engrenage de `/parent` (PRD-15).
  Le cookie ouvre `/reglages/**`, TTL `PARENT_SESSION_TTL_MIN`.
- `portee: "sortie_session"` — demandée depuis l'écran enfant en cours de
  session (PRD-13), par `src/components/enfant/SortieParent.tsx` : appui long de
  2 secondes sur le titre de l'étape (durée dans `ui.config.ts`), puis une
  surcouche qui affiche le clavier `Keypad`. **Ce n'est pas une navigation** :
  aucune route enfant ne mène à `/reglages/code`, et aucun lien n'est visible
  (SEC-08). Le cookie obtenu autorise **uniquement** l'événement
  `ABANDON_PARENT`, pas l'ouverture des Réglages.

L'export ne contient **ni `code_hash`, ni payload d'IA d'un autre foyer**, et la
suppression est une seule transaction : en cas d'échec, rien n'est effacé
(`reglages.echec.suppression`).

## 8.7 Audio et purge planifiée (SEC-05)

| Route | Contrat |
| --- | --- |
| `POST /api/audio` | `multipart` `{ audio: File, sessionId, exerciseId }` → `{ attemptId }`. Bucket privé. |
| `GET /api/audio/{attemptId}` | → `{ url: string (signée, 5 min) }` ou `404 TIPI_AUDIO_PURGE` → `parent.resume.audio_absent` |
| `POST /api/cron/purge-audios` | En-tête `Authorization: Bearer $CRON_SECRET`, sinon `401`. Supprime les objets plus vieux que `family.retention_audio_jours` et met `attempt.audio_url` à null. Déclenché par Vercel Cron, quotidien. |

---

# 9. Machine à états de session

## 9.1 États

Les sept états de 3.3, plus les deux états annoncés par le même paragraphe :

| État | Sens | Écran |
| --- | --- | --- |
| `idle` | Session créée, parent a validé, l'enfant n'a pas encore commencé | `/enfant` |
| `annonce` | Programme annoncé en pictos | `/enfant/programme` |
| `etape_lecture` | Étape de lecture en cours | `/enfant/session/lecture` |
| `transition` | Entre deux étapes | `/enfant/session/*` (écran de transition) |
| `etape_maths` | Étape de maths en cours | `/enfant/session/maths` |
| `cloture` | Rituel de fermeture | `/enfant/bravo` |
| `termine` | Soirée close | `/enfant/coffre` ou sortie |
| `pause` | **Sur-état**, depuis les deux états d'étape | `/enfant/pause` |
| `abandon_parent` | Sortie anticipée validée par le code (PRD-13) | `/enfant/bravo` puis `/parent/resume` |

`etape_lecture` et `etape_maths` sont deux états distincts, comme l'exige
TEC-10, mais **l'ordre n'est pas figé** : il est lu dans `etapes_prevues`, ce qui
couvre les six configurations C1 à C6 du marketing (7.0). C2 donne bien
`annonce → etape_maths → transition → etape_lecture → cloture`.

**Pas de colonne `etat_avant_pause`** : l'étape de retour se déduit de
`etapes_prevues[etape_courante].matiere`.

## 9.2 Table de transitions

`evenementId` et `etatAttendu` accompagnent chaque événement (section 8.3).
**La transition `ETAPE_VIDE` du tour 1 a disparu** : une étape sans exercice
n'est plus jamais programmée (ARB-08).

| # | Événement | Depuis | Garde | Vers | Effets de bord | Écrit en base |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `DEMARRER` | `idle` | session validée par le parent (TEC-06) | `annonce` | — | `etat`, `started_at`, journal |
| T2 | `PROGRAMME_VU` | `annonce` | `etapes_prevues` non vide | état de `etapes_prevues[0].matiere` | — | `etat`, `etape_courante = 0`, journal |
| T3 | `PROGRAMME_VU` | `annonce` | `etapes_prevues` vide (soirée `sansDevoir`) | `termine` | **aucune pierre**, aucun rituel de clôture ; l'enfant voit `enfant.accueil.vide.*` et va au coffre | `etat`, `ended_at`, journal |
| T4 | `ETAPE_TERMINEE` | `etape_lecture`, `etape_maths` | une étape suit | `transition` | crédit +1 de la matière terminée | `etat`, ledger, `gem_balance`, journal |
| T5 | `ETAPE_TERMINEE` | `etape_lecture`, `etape_maths` | dernière étape | `cloture` | crédit +1, **puis +1 `bonus_soiree_complete` si toutes les étapes programmées sont terminées** (9.5) | `etat`, ledger ×2, `gem_balance`, journal |
| T6 | `TRANSITION_VUE` | `transition` | — | état de `etapes_prevues[etape_courante + 1].matiere` | — | `etat`, `etape_courante += 1`, journal |
| T7 | `PAUSE_DEMANDEE` | `etape_lecture`, `etape_maths` | — | `pause` | **aucune pierre retirée, jamais** (PRD-12, ETH-04) ; fait « pause prise » pour le résumé | `etat`, journal |
| T8 | `PAUSE_TERMINEE` | `pause` | — | état de `etapes_prevues[etape_courante].matiere` | — | `etat`, journal |
| T9 | `CLOTURE_VUE` | `cloture` | — | `termine` | génération du résumé (PRD-06), notification locale au parent | `etat`, `resume`, `ended_at`, journal |
| T10 | `ABANDON_PARENT` | `annonce`, `etape_lecture`, `etape_maths`, `transition`, `pause` | **cookie parent de portée `sortie_session`** (PRD-13) | `abandon_parent` | crédit des étapes déjà terminées et non encore créditées ; résumé « séance arrêtée » | `etat`, `arret_parent = true`, `ended_at`, `resume`, ledger, journal |
| T11 | `BLOCAGE` | `etape_lecture`, `etape_maths` | `nb_sollicitations >= BLOCAGE_NB_SOLLICITATIONS` | **inchangé** | fait « blocage » pour le résumé ; l'interface propose pause ou suite (PED-08) | journal, `attempt` |
| T12 | `CLOTURE_AUTOMATIQUE` | tout état non final | **`session.date` antérieure à la soirée courante** — déclenchée par le serveur, jamais par le client | `termine` | crédit des étapes terminées et non créditées ; résumé « séance arrêtée » ; libère l'unique partiel | `etat`, `ended_at`, `resume`, ledger, journal |

Toute paire (état, événement) absente de cette table est **invalide** : la route
renvoie `409 TIPI_TRANSITION_INVALIDE` avec le snapshot courant, sans aucun effet
de bord. `machine.ts` est une fonction pure, sans accès base : c'est elle que les
tests unitaires de P5 parcourent état par état.

Depuis `abandon_parent` et `termine`, **aucune transition n'est possible** : ce
sont des états finaux, et l'unique partiel de `policies.sql` libère alors le
créneau pour une nouvelle session.

## 9.3 Persistance, transition par transition (PRD-18)

Chaque appel de `appliquerEvenement()` exécute **une seule transaction Prisma** :

1. `SELECT … FOR UPDATE` sur la session (verrou, protège du double appui) ;
2. si `evenementId` est déjà dans `session.evenements` → retour du snapshot, fin ;
3. si `etatAttendu !== session.etat` → `409`, fin, sans écriture ;
4. `machine.ts` calcule la transition (fonction pure) ;
5. effets de bord de la table 9.2, **dont les crédits de pierres** ;
6. `UPDATE session` : `etat`, `etape_courante`, horodatages, `evenements`
   augmenté d'une ligne ;
7. commit.

**La persistance est écrite à chaque transition, dans la même transaction que
ses effets.** Cette phrase est désormais vraie sans exception : le crédit différé
qui la contredisait a été supprimé (9.4). Une coupure laisse soit l'ancien état
complet, soit le nouvel état complet.

**Reprise** : `GET /api/etat` cherche la session dont l'état n'est ni `termine`
ni `abandon_parent` **et dont la date est celle de la soirée courante**, et
renvoie la route de l'état. Le client repart avec le snapshot, les indices déjà
déroulés (`attempt.nb_indices_utilises`) et l'exercice en cours. Aucune
information de reprise n'est lue dans le navigateur.

## 9.4 Le crédit ne peut pas être différé côté serveur (constat 4)

Trois affirmations, dans cet ordre, remplacent la contradiction du tour 1.

**1. Le crédit est dans la transaction.** S'il échoue, la transition est
annulée : l'état n'avance pas, aucune pierre n'est écrite à moitié, l'invariant
`gem_balance == SUM(delta)` n'est jamais violé, même transitoirement. La réponse
`creditDiffere` n'existe plus.

**2. `bravo.pierres_plus_tard` garde une cause réelle, et c'est le réseau.** Le
cas que le contenu P1bis décrit (`condition: credit_pierres_differe`) n'est pas
un échec d'écriture en base : c'est une **transition non délivrée**. L'enfant a
fini, l'appareil a perdu le réseau, la requête n'est jamais arrivée. Le client le
détecte (`TIPI_TRANSITION_NON_DELIVREE`, code purement client), joue les lignes 5
et 6 du rituel au lieu des lignes 3 et 4 — « Je range tes pierres un peu plus
tard. Elles sont à toi. Elles ne se perdent pas. » — et réessaie avec **le même
`evenementId`**, ce qui est sans risque puisque la route est idempotente.

**3. Le rattrapage a un porteur nommé, y compris si l'application est fermée.**
`src/lib/session/cloture-automatique.ts`, appelé par `GET /api/etat` et
`POST /api/session`, ferme toute session non finale dont la date est passée
(T12) **et crédite à ce moment-là les étapes terminées non encore créditées**.
Il les identifie sans ambiguïté : une étape est terminée quand toutes les lignes
`attempt` de ses exercices portent un statut final, et non créditée quand il
n'existe pas de ligne `gem_ledger` pour `(session_id, raison)`. Le crédit passe
par le même `crediterEtape()`, avec le même unique : un rattrapage ne peut pas
créditer deux fois. Aucune route n'accepte pour autant un montant (7.1).

Conséquence sur T10 : l'`ABANDON_PARENT` crédite dans sa propre transaction et
mène à un état final, sans jamais dépendre d'un « prochain appel » qui
n'existerait pas.

## 9.5 Barème (ARB-08)

| Événement créditeur | Delta | Raison |
| --- | --- | --- |
| Une étape programmée est terminée | +1 | `etape_lecture_terminee` ou `etape_maths_terminee` |
| **Toutes** les étapes programmées du soir sont terminées | +1 | `bonus_soiree_complete` |

Le bonus ne porte plus un « 2 » en dur. C'est la conséquence directe de
l'arbitrage : puisqu'une étape vide n'est jamais programmée, « toutes les étapes
programmées » est une notion qui ne dépend plus de la qualité du découpage de
l'IA. Un enfant n'est jamais privé d'une pierre parce que le pipeline a mal
fonctionné.

**L'écart à la section 3.7, écrit ici dans sa forme canonique.** Tout endroit du
projet qui énonce le barème reprend cette phrase, mot pour mot :

> **+1 par étape terminée, +1 lorsque *toutes les étapes programmées* du soir
> sont terminées (ARB-08).** La section 3.7 du prompt maître écrit « +1 bonus si
> les 2 étapes du soir sont terminées » ; ARB-08 remplace ce « 2 » en dur par
> « toutes les étapes programmées » parce qu'une étape vide n'est plus jamais
> programmée, de sorte qu'un découpage incomplet de l'IA ne coûte aucune pierre
> à un enfant qui n'en est pas responsable.

Conséquence concrète, à ne jamais laisser implicite : **une soirée à une seule
étape rapporte 2 pierres, comme une soirée à deux étapes.** C'est cohérent avec
PED-05, ETH-01 et ARB-06, qui veut qu'un Soir léger reste indétectable par
l'enfant — y compris dans son coffre.

Les quatre endroits qui énoncent le barème citent désormais ARB-08 : cette
section, le commentaire de l'énumération `RaisonGem` dans `prisma/schema.prisma`,
le commentaire du `CHECK gem_ledger_delta_max_un` dans `supabase/policies.sql`,
et les lignes de `TRACEABILITY.md` rédigées en 16.2. `src/config/pierres.config.ts`,
écrit en V1, portera la même phrase en commentaire d'en-tête : c'est la seule
table de barème du code.

Jamais de pierre par bonne réponse (PED-05). Jamais de delta négatif (ETH-04,
garanti par `CHECK`).

---

# 10. Taxonomie d'erreurs et états limites PRD-16

## 10.1 Les codes

`src/lib/errors/codes.ts` — une union TypeScript fermée, pas des chaînes libres.
Chaque code porte trois choses : son statut HTTP, la clé de contenu à afficher,
et le public (enfant ou parent).

| Code | HTTP | Public | Clé de contenu affichée |
| --- | --- | --- | --- |
| `TIPI_VALIDATION` | 400 | parent | selon le champ |
| `TIPI_INTROUVABLE` | 404 | parent | `reglages.echec.sauvegarde` |
| `TIPI_INTERNE` | 500 | — | jamais montrée brute |
| `TIPI_FICHIER_TROP_GRAND` | 413 | parent | `parent.scan.envoi_echec.*` |
| `TIPI_FORMAT_REFUSE` | 415 | parent | `parent.scan.envoi_echec.*` |
| `TIPI_UPLOAD_ECHEC` | 502 | parent | `parent.scan.envoi_echec.*` |
| `TIPI_OCR_VIDE` | 422 | parent | `parent.scan.illisible.*` |
| `TIPI_OCR_CONFIANCE_BASSE` | 422 | parent | `parent.scan.illisible.*` |
| `TIPI_AUCUN_EXERCICE` | 422 | parent | `parent.apercu.vide.*` |
| `TIPI_IA_SORTIE_INVALIDE` | 502 | parent | `parent.scan.analyse_echec.*` |
| `TIPI_IA_INDISPONIBLE` | 502 | parent | `parent.scan.analyse_echec.*` |
| `TIPI_IA_TIMEOUT` | 504 | parent | `parent.scan.analyse_echec.*` |
| `TIPI_PAYLOAD_NON_ANONYME` | 500 | — | l'appel n'est pas émis (SEC-04) |
| `TIPI_SESSION_INTROUVABLE` | 404 | enfant | `enfant.accueil.souci.*` |
| `TIPI_SESSION_DEJA_ACTIVE` | 409 | parent | `parent.apercu.lancement_echec.*` + action « Reprendre la soirée en cours » |
| `TIPI_ETAPE_SANS_EXERCICE` | 400 | parent | `parent.apercu.vide.*` |
| `TIPI_ETAPES_MEME_MATIERE` | 400 | parent | `parent.apercu.echec.*` |
| `TIPI_TRANSITION_INVALIDE` | 409 | — | aucun message : le client se recale sur le snapshot |
| `TIPI_ABANDON_NON_AUTORISE` | 403 | parent | `reglages.code.refuse` |
| `TIPI_TRANSITION_NON_DELIVREE` *(client)* | — | enfant | `bravo.pierres_plus_tard*` (9.4) |
| `TIPI_TTS_INDISPONIBLE` | 502 | enfant | `lecture.sans_voix.*` |
| `TIPI_TTS_QUOTA` | 429 | enfant | `lecture.sans_voix.*` |
| `TIPI_STT_INDISPONIBLE` *(client)* | — | enfant | `lecture.micro_absent.*` |
| `TIPI_MICRO_REFUSE` *(client)* | — | enfant | `lecture.micro_absent.*` |
| `TIPI_TRANSCRIPTION_VIDE` *(client)* | — | enfant | `lecture.pas_entendu.*` (PED-09) |
| `TIPI_INDICES_INDISPONIBLES` | 502 | enfant | `maths.sans_indice.*` |
| `TIPI_COSMETIQUE_VERROUILLE` | 403 | enfant | `coffre.cosmetiques.verrouille` |
| `TIPI_COFFRE_INDISPONIBLE` | 502 | enfant | `coffre.souci.*` |
| `TIPI_CODE_INVALIDE` | 401 | parent | `reglages.code.refuse` + `refuse_reste` |
| `TIPI_CODE_BLOQUE` | 423 | parent | `reglages.code.bloque.*` |
| `TIPI_CODE_ABSENT` | 409 | parent | bascule en mode création |
| `TIPI_CODE_LONGUEUR` | 400 | parent | `reglages.code.creation.longueur` |
| `TIPI_CODE_DISCORDANT` | 400 | parent | `reglages.code.creation.discordance` |
| `TIPI_REGLAGES_EXPIRE` | 401 | parent | `reglages.session_expiree` |
| `TIPI_AUDIO_PURGE` | 404 | parent | `parent.resume.audio_absent` |
| `TIPI_EXPORT_ECHEC` | 502 | parent | `reglages.echec.export` |
| `TIPI_SUPPRESSION_ECHEC` | 502 | parent | `reglages.echec.suppression` |
| `TIPI_NON_IMPLEMENTE` | 501 | — | route de repli STT (section 5.3) |

**Deux règles opposables.** Premièrement, aucun code technique n'est jamais
affiché ni à l'enfant ni au parent : le code sert au journal serveur et au choix
de la clé, rien d'autre. Deuxièmement, **aucune clé d'erreur destinée à l'enfant
ne désigne l'enfant comme cause** : le sujet est Pilou, le micro, ou la photo
(7.3, PED-09).

**Un code supprimé au tour 2** : `TIPI_CREDIT_DIFFERE`. Il décrivait un état
serveur qui ne peut pas exister (9.4). Son remplaçant, `TIPI_TRANSITION_NON_DELIVREE`,
est un code **client** : il naît d'une requête qui n'est jamais partie.

## 10.2 Correspondance avec les quatre états limites de PRD-16

| État limite PRD-16 | État applicatif | Chemin de récupération, garanti |
| --- | --- | --- |
| **Aucun devoir chargé ce soir** | Session à `etapes_prevues: []` et `sansDevoir: true`, transition T3, `etat = termine` | Écran `/enfant` en état vide, bouton « Voir mon coffre ». Côté parent : `parent.scan.sans_devoir.*`, aucune relance. Aucune pierre, aucun rituel de clôture mensonger |
| **OCR illisible** | `TIPI_OCR_VIDE` ou `TIPI_OCR_CONFIANCE_BASSE`, seuil `OCR_CONFIANCE_MIN` | Écran parent `parent.scan.illisible.*` : reprendre la photo **ou** saisir à la main (`POST /api/devoirs/saisie-manuelle`, toujours disponible). **Jamais montré à l'enfant** |
| **Blocage total sur un exercice** | Transition T11, `attempt.statut = bloquee` | `maths.blocage.*` ou `lecture.blocage.*` : pause ou passage à la suite. Aucune pierre retirée, aucun commentaire. En maths, le repli `maths.sans_indice.*` ne donne jamais le résultat |
| **Session interrompue et reprise le soir même** | La session reste dans son état persisté ; `GET /api/etat` la retrouve | `enfant.accueil.reprise.*`, puis `lecture.reprise.*` / `maths.reprise.*`. Les indices déjà déroulés restent déroulés (`POST /api/indices` les écrit, 8.4). Aucune mention du temps écoulé |
| **Session interrompue et jamais reprise — le lendemain** *(cinquième ligne, constat 5)* | Transition **T12 `CLOTURE_AUTOMATIQUE`**, déclenchée par `GET /api/etat` ou `POST /api/session` | La session de la veille est close côté serveur, **les pierres acquises sont créditées** (9.4, point 3), son résumé est généré pour le parent. L'enfant est accueilli par `enfant.accueil.*` ordinaire, sur les devoirs **du jour**, sans aucune mention de la veille (ETH-02). Le parent n'est jamais bloqué par un `409` |

Cinq états limites supplémentaires, non nommés par PRD-16 mais présents dans le
livrable marketing, ont eux aussi un code et une sortie : voix indisponible
(`lecture.sans_voix`), micro indisponible (`lecture.micro_absent`), indices
indisponibles (`maths.sans_indice`), transition non délivrée
(`bravo.pierres_plus_tard`), coffre indisponible (`coffre.souci`).

**Aucun état de cette section n'est une impasse** : chacun a au moins un bouton,
et la seule impasse du tour 1 — la session de la veille — est fermée par T12.

## 10.3 Les six clés rendues inatteignables par ARB-08 (ARB-12, point 1)

ARB-08 supprime la transition `ETAPE_VIDE` : une étape sans exercice n'est plus
jamais programmée, donc les six clés qui l'accompagnaient n'ont plus de
déclencheur. Avant de conclure à leur retrait, l'Orchestrateur demande de
vérifier qu'aucune d'elles ne servait de filet à un état limite sans que ce soit
écrit. **J'ai mené la vérification état par état. Voici son résultat.**

| État limite | Ce qui le couvre réellement | Une des six clés est-elle porteuse ? |
| --- | --- | --- |
| **Aucun devoir chargé ce soir** | Parent : `parent.scan.sans_devoir.bouton/.confirmation/.valider`, et `parent.apercu.vide.*` si l'analyse ne reconnaît rien. Enfant : `enfant.accueil.vide.titre/.corps/.bouton`, alimentées par les 20 variantes de la banque `pas_de_devoirs` | **Non.** C'est un état de **session** — zéro étape programmée, transition T3 — et non une étape vide. Les deux cas étaient déjà distincts avant ARB-08 : les clés ne se recouvrent en rien |
| **OCR illisible** | Parent : `parent.scan.illisible.*` (4 clés) + saisie manuelle toujours ouverte. Enfant, s'il est déjà devant l'écran : `enfant.accueil.souci.*` + les 20 variantes de `photo_illisible` | **Non.** Une photo illisible n'a jamais produit d'étape : elle bloque en amont de la validation parent (TEC-06) |
| **Blocage total sur un exercice** | `maths.blocage.corps/.corps_2` + boutons, `lecture.blocage.corps/.corps_2` + boutons, et les banques `blocage_maths` et `blocage_lecture` (20 variantes chacune). Repli maths : `maths.sans_indice.*` | **Non.** Le blocage suppose un exercice présent : c'est l'inverse d'une étape vide |
| **Session interrompue et reprise le soir même** | `enfant.accueil.reprise.*` + banque `reprise_session`, puis `lecture.reprise.corps/.corps_2` et `maths.reprise.corps/.corps_2` | **Non.** Aucun rapport : la reprise rejoue une étape qui a du contenu |
| **Session orpheline close automatiquement (T12)** | Enfant : accueil ordinaire, sans aucune mention de la veille (ETH-02). Parent : résumé, avec l'observation « La séance a été arrêtée avant la fin. Les pierres acquises sont conservées. » et `parent.resume.etape_passee` pour les étapes non faites | **Non** — mais avec une réserve, ci-dessous |

**Conclusion : les six clés peuvent être retirées.** Ce sont
`lecture.vide.corps`, `lecture.vide.corps_2.suite`, `lecture.vide.corps_2.fin`,
`maths.vide.corps`, `maths.vide.corps_2.suite`, `maths.vide.corps_2.fin`.
Aucune ne porte seule un état limite ; chacun des cinq états garde une couverture
complète et propre.

**Deux points d'exécution pour `contenu-enfant`, sous contrôle de
`controle-produit` (ARB-10). Je ne modifie pas `content/` moi-même.**

1. **Le retrait touche deux fichiers, pas un.** Les six clés n'existent pas
   encore dans `content/ui-enfant.json`, qui reste à écrire : il suffit de ne pas
   les y créer. Mais `lecture.vide.corps` et `maths.vide.corps` sont **déjà
   déclarées** dans `content/encouragements.json`, dans le cinquième groupe de
   `cles_fixes_non_variees` (« États techniques à message unique »). Ces deux
   entrées-là doivent en être retirées, sinon le fichier déclarera comme « clé
   fixe volontairement non variée » une clé qui n'existe plus nulle part — et le
   contrôle qui vérifie que les clés déclarées existent côté marketing échouera.
   Les six autres clés du même groupe restent : elles ont toutes un déclencheur
   (`lecture.pas_entendu.*`, `lecture.micro_absent.corps`,
   `lecture.sans_voix.corps`, `maths.sans_indice.corps`,
   `enfant.programme.souci.corps`).

2. **Une condition à élargir, et non une clé à ajouter.** Le livrable marketing
   (7.12) range l'observation « La séance a été arrêtée avant la fin. Les pierres
   acquises sont conservées. » sous la condition « Session arrêtée par le
   parent ». **Le texte est exact pour T12 aussi** — la séance a bien été
   interrompue, les pierres sont bien conservées (9.4, point 3) — mais la
   condition est trop étroite d'un cas. Elle doit devenir « Séance non terminée :
   arrêt par le parent (T10) ou clôture automatique le lendemain (T12) ». Aucun
   texte nouveau n'est nécessaire, et c'est tant mieux : une phrase de plus,
   c'est une phrase de plus à faire viser par `gardien-charte`.

Si `controle-produit` juge qu'une de ces six clés doit malgré tout survivre, je
préfère qu'elle survive : une clé en trop est un fichier un peu gros, un état
limite sans écran est un enfant devant une impasse.

---

# 11. Variables d'environnement

27 variables. Colonne « côté » : `serveur` = jamais dans le bundle ;
`public` = inlinée par Next.js, donc **jamais un secret**.

| Variable | Côté | À quoi elle sert | Si elle manque |
| --- | --- | --- | --- |
| `DATABASE_URL` | serveur | Connexion Prisma via le pooler Supabase (TEC-02, TEC-03) | **Le serveur ne démarre pas**, message nommant la variable |
| `DIRECT_URL` | serveur | Connexion directe pour `prisma migrate`. **C'est aussi le rôle sous lequel `policies.sql` doit être joué** | Démarrage refusé ; migrations impossibles |
| `SUPABASE_URL` | serveur | Point d'entrée Storage | Démarrage refusé |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | Téléversement, URL signées, purge | Démarrage refusé |
| `NEXT_PUBLIC_TTS_CACHE_URL` | public | Préfixe public des clips TTS **sans jeton** déjà synthétisés | Le client ne tente pas le cache direct et passe par `POST /api/voix` : plus lent, jamais cassé |
| `UPLOAD_MAX_PHOTO_OCTETS` | serveur | Plafond de la route photo. **Doit égaler `file_size_limit` du bucket `devoirs`** | Défaut `8388608` |
| `UPLOAD_MAX_AUDIO_OCTETS` | serveur | Plafond des routes audio. **Doit égaler `file_size_limit` du bucket `audios`** | Défaut `10485760` |
| `AI_PROVIDER` | serveur | Choix de l'implémentation `AiProvider` (TEC-17) | Défaut `deepseek` |
| `DEEPSEEK_API_KEY` | serveur | Authentification du fournisseur | Démarrage **accepté** ; l'analyse renvoie `TIPI_IA_INDISPONIBLE` et le parent bascule sur la saisie manuelle. Une soirée reste possible |
| `DEEPSEEK_BASE_URL` | serveur | Point d'entrée du fournisseur | Défaut `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | serveur | Modèle appelé | Défaut `deepseek-chat` |
| `AI_TIMEOUT_MS` | serveur | Abandon d'un appel trop long | Défaut `20000` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | serveur | Compte de service Vision (OCR) et Text-to-Speech | Démarrage accepté ; OCR → `TIPI_OCR_VIDE` (saisie manuelle), TTS → `lecture.sans_voix`, les textes restent affichés (PED-10) |
| `VOICE_PROVIDER` | serveur | Choix de l'implémentation `VoiceProvider` (TEC-08) | Défaut `google-chirp3` |
| `NEXT_PUBLIC_SPEECH_PROVIDER` | public | Choix du `SpeechProvider` dans le navigateur (TEC-09) — pas un secret | Défaut `web-speech` |
| `PARENT_SESSION_SECRET` | serveur | Signature du cookie de session parent (PRD-13, PRD-15) | **Le serveur ne démarre pas.** Un secret par défaut ouvrirait les Réglages à qui connaît le code source |
| `PARENT_SESSION_TTL_MIN` | serveur | Fermeture automatique des Réglages | Défaut `5` |
| `CODE_MAX_TENTATIVES` | serveur | SEC-02 | Défaut `5` |
| `CODE_BLOCAGE_PALIERS_SEC` | serveur | Durées de blocage progressif (SEC-02) | Défaut `60,300,900,3600` |
| `OCR_CONFIANCE_MIN` | serveur | Seuil « illisible » (TEC-16) | Défaut `0.70` |
| `LECTURE_TOLERANCE_MOT` | serveur | Tolérance Levenshtein par mot (3.4, TEC-16) | Défaut `0.34` |
| `LECTURE_SEUIL_MOTS_OK` | serveur | Part de mots reconnus suffisante | Défaut `0.60` |
| `BLOCAGE_NB_SOLLICITATIONS` | serveur | PED-08 | Défaut `3` |
| `CALIBRATION_NB_PHOTOS` | serveur | TEC-16 | Défaut `20` |
| `AUDIO_RETENTION_JOURS_DEFAUT` | serveur | Valeur initiale de `family.retention_audio_jours` (SEC-05) | Défaut `7` |
| `CRON_SECRET` | serveur | Authentifie `POST /api/cron/purge-audios` | **Le serveur ne démarre pas** : sans lui, la route de purge serait ouverte |
| `NEXT_PUBLIC_APP_VERSION` | public | Réglages > À propos | Défaut `0.0.0` |

**Trois variables publiques seulement**, et aucune n'est un secret. Règle de
contrôle, rejouable par `red-team` (tentative 5) :
`grep -rE "DEEPSEEK|SERVICE_ROLE|GOOGLE_SERVICE|PARENT_SESSION|CRON_SECRET" .next/static`
doit renvoyer zéro résultat.

**Mécanique de la défaillance** (`src/config/env.ts`) : un schéma Zod sépare les
variables **critiques** (absence = refus de démarrer : les quatre premières,
`PARENT_SESSION_SECRET`, `CRON_SECRET`) des variables **dégradables** (absence =
fonctionnalité en repli bienveillant). Ce classement est une décision
d'architecture : une clé d'IA manquante ne doit pas empêcher un enfant de faire
sa lecture.

**Les deux variables d'upload sont la seule duplication assumée du livrable**
(constat 15) : Storage ne peut pas lire le code applicatif, donc les mêmes
nombres existent des deux côtés. C'est écrit dans `.env.example` et dans
`policies.sql`, et la vérification V7 les affiche pour comparaison.

---

# 12. Budget de latence et stratégie de cache TTS

## 12.1 Budget par interaction

Règle générale TEC-12 : **toute attente dépassant 400 ms est habillée par
« Pilou réfléchit »** (composant `src/components/pilou/PilouReflechit.tsx`, plus
`son_pilou_reflechit` et le texte `enfant.attente.pilou`). Le seuil est une
constante unique, **propriétaire nommé : `src/config/ui.config.ts`** (constat 16).

| Interaction | Budget p95 | Composition | Habillage |
| --- | --- | --- | --- |
| Aiguillage `/` | 300 ms | 1 requête indexée `session(child_id, etat)` (+ T12 le lendemain d'une soirée abandonnée) | écran de lancement, sans texte |
| Ajout d'une photo | 2,5 s | compression client ~300 ms + transfert ~1 Mo + écriture Storage | vignette en attente, côté parent |
| **Analyse complète** | 15 s, abandon à 20 s | OCR 1,5–3 s par photo (jusqu'à 4 en parallèle) + structuration < 50 ms + prompt 1 : 4–10 s + prompts 2 et 3 en parallèle : 3–8 s | `parent.scan.analyse_en_cours` + `analyse_duree`, côté parent uniquement |
| Lancer la session | 400 ms | création de session, 1 transaction | bouton en attente |
| **Transition d'étape** | 150 ms | 1 transaction : verrou, journal, ledger, solde | aucun habillage nécessaire ; « Pilou réfléchit » au-delà de 400 ms |
| Indice pré-généré | 150 ms | 1 transaction : lecture `exercise.indices` + upsert `attempt` | aucun |
| Indice de secours (TEC-07) | 3–8 s | 1 appel `AiProvider` | « Pilou réfléchit » |
| Rapprochement de lecture | 200 ms | `POST …/tentative` : matching serveur + écriture | `lecture.micro.en_cours` reste affiché |
| **TTS public, cache touché** | 150 ms | `GET` direct sur le bucket public, CDN, sans clé | aucun : Pilou parle tout de suite |
| **TTS privé, cache touché** | 300 ms | `POST /api/voix` + URL signée + `GET` Storage | aucun : sous le seuil de 400 ms |
| **TTS, cache manqué** (public ou privé) | 900 ms | route serveur + synthèse + écriture Storage | « Pilou réfléchit » |
| STT | local | Web Speech API, dans le navigateur | `lecture.micro.en_cours` (affiché, Pilou se tait) |
| Coffre | 200 ms | 1 lecture `child` + paliers | aucun |
| Vérification du code parent | 250–400 ms | argon2id, **coût volontaire** (SEC-01/02) | bouton en attente |

**Ce que le tour 1 promettait à tort** (constat 6) : 150 ms sur la première
phrase de chaque soirée. Les 8 variantes d'`accueil` sur 20 qui portent le
prénom, les 5 de `reprise_session` sur 20, et `bravo.titre` qui est joué **chaque
soir**, sont des clips privés : leur budget est de 300 ms, pas 150. Deux raisons
pour que cela reste confortable : le clip est en cache (aucune synthèse), et
`POST /api/voix` prend un **tableau** de demandes, donc l'écran d'accueil paie un
seul aller-retour pour toutes ses phrases.

## 12.2 Cache TTS (TEC-09b), et la séparation public / privé (SEC-04)

**Clé de cache** : `sha256(voixId + "|" + modele + "|" + texteRendu)`.

**Deux buckets, et la règle qui les sépare** :

| Bucket | Visibilité | Contenu | Servi par |
| --- | --- | --- | --- |
| `tts-cache` | **public en lecture** | Tout clip dont le texte rendu ne contient **aucun jeton de prénom** et ne vient pas d'un devoir | `GET` direct du client, sans clé |
| `tts-prive` | **privé** | Tout clip qui prononce le prénom de l'enfant, et tout clip de texte de devoir (consigne, contenu, indice) | `POST /api/voix` → URL signée 5 min |

**Pourquoi.** La clé est un sha256 du texte rendu, et
`content/encouragements.json` est versionné dans le dépôt, tout comme `voixId`
et `modele` (`mascot.config.ts`). Quiconque a le dépôt peut donc calculer les
chemins pour un prénom **deviné** et lire le code HTTP : un `200` confirmerait le
prénom de l'enfant. **Un sha256 d'un corpus public n'est pas un secret, c'est un
index.** Le tour 1 affirmait trois fois le contraire ; ces trois affirmations
sont supprimées, y compris celle qui vivait dans `supabase/policies.sql`.

Cacher ces clips reste indispensable — TEC-09b vise le quota, pas la
publicité —, donc ils sont cachés, mais dans un bucket privé. Le chemin privé
porte en plus le `child_id` (`tts-prive/<child_id>/<voixId>/<sha256>.mp3`) : dans
un foyer à plusieurs enfants, deux prénoms ne se croisent pas.

**Qui rend les jetons : le serveur, toujours** (constat 6). Règle unique,
énoncée une seule fois et valable partout :

> Le client ne rend jamais un jeton, et ne calcule une clé de cache que pour un
> texte qui n'en contient aucun. Tout texte à jeton passe par `POST /api/voix`.

Séquence, côté client :

1. le texte vient de `content/**` ; **s'il contient `{prenom}` ou `{matiere}`**,
   aller directement à l'étape 4 ;
2. sinon, calculer la clé et tenter
   `GET {NEXT_PUBLIC_TTS_CACHE_URL}/<voixId>/<clé>.mp3` ;
3. `200` → lecture immédiate (150 ms). Fin ;
4. `POST /api/voix` avec l'identifiant de la variante (jamais du texte libre) :
   le serveur rend le jeton, cherche le cache, synthétise si nécessaire, range
   dans le bucket qui convient et renvoie l'URL.

**Ce qui est pré-chauffé** (`scripts/prewarm-tts.ts`, joué au déploiement pour
le corpus public, et au seed du profil pour le corpus privé). Mesure refaite au
tour 2 sur les fichiers livrés en P1bis, **instrument publié en 17.3** :

```
entrees lues (canal tts ou les_deux)   : 454
clips distincts a synthetiser          : 474
caracteres du corpus fixe              : 21016
longueur moyenne                       : 44.3
part du quota mensuel (1 000 000 car.) : 2.10 %

REPARTITION PAR DESTINATION DE CACHE
A. sans aucun jeton  -> bucket PUBLIC  : 420 clips, 19105 car.
B. jeton {matiere}   -> bucket PUBLIC  : 40 clips, 1372 car.
C. jeton {prenom}    -> bucket PRIVE   : 14 clips, 539 car.
clips portant les DEUX jetons          : 0
```

Les quatre grandeurs du tour 1 (474, 21 016, 44,3 et 2,10 %) sont **inchangées**
et reproduites par le nouvel instrument : la correction ajoute une ventilation,
elle ne déplace aucun total. Les catégories A et B vont dans le bucket public :
« la lecture » et « les maths » ne sont pas des données personnelles. La
catégorie C, 14 clips et 539 caractères, est celle qui n'aurait jamais dû y
être.

**Ce qui n'est pas pré-chauffable** : le texte propre au devoir du soir —
consignes reformulées, texte de lecture, indices, questions. Estimation par
soirée : texte de lecture ~300 caractères, 2 questions ~120, 4 consignes ~360,
3 exercices de maths × 4 indices × ~120 = ~1 440 → **~2 200 caractères par
soirée**, soit ~48 000 par mois sur 22 soirs d'école. C'est l'ordre de grandeur
annoncé en section 8 du prompt maître (~45 000/mois), et **moins de 5 % du quota
gratuit**. Ces clips vont tous dans `tts-prive` : un texte de devoir est une
donnée de l'enfant.

Sans le cache, le seul bouton « Réécouter », disponible **sans limite** (7.5),
suffirait à faire exploser ce budget. C'est exactement ce que TEC-09b demande
d'éviter.

**Purge** : aucune sur `tts-cache`, dont le contenu est impersonnel et pèse
quelques dizaines de mégaoctets. `tts-prive` suit la suppression du foyer
(SEC-07) ; il n'est pas concerné par la purge de SEC-05, qui vise la voix de
l'**enfant** dans le bucket `audios`, et non la voix de Pilou.

---

# 13. TEC-16 — seuils de calibration

**Un seul fichier** : `src/config/seuils.config.ts`, **serveur uniquement**. Il
lit `env.ts`, valide, et exporte un objet gelé :

```ts
export const SEUILS = Object.freeze({
  ocrConfianceMin: …,          // OCR_CONFIANCE_MIN
  lectureToleranceMot: …,      // LECTURE_TOLERANCE_MOT
  lectureSeuilMotsOk: …,       // LECTURE_SEUIL_MOTS_OK
  blocageNbSollicitations: …,  // BLOCAGE_NB_SOLLICITATIONS
  calibrationNbPhotos: …,      // CALIBRATION_NB_PHOTOS
});
```

Règle opposable pour `controle-code` : aucun littéral numérique de seuil
n'apparaît dans `src/lib/ocr/**`, `src/lib/lecture/**` ni `src/lib/maths/**`.
Tout passe par `SEUILS`.

C'est parce que ces seuils sont serveur que **le rapprochement du texte lu se
fait côté serveur** (5.3, 8.3) : descendre `lectureToleranceMot` dans le bundle
pour faire le matching dans le navigateur aurait dispersé la valeur que TEC-16
veut centraliser.

**Le seuil de 400 ms de TEC-12 n'est pas ici** (constat 16) : ce n'est pas un
seuil de calibration mais une constante de présentation, et elle doit être
lisible par un composant. Elle vit dans `src/config/ui.config.ts`, avec la durée
de l'appui long de PRD-13 et les durées d'animation de DES-08.

**Le mode calibration** : tant que `family.calibration_active` est vrai et que
`COUNT(calibration_log) < SEUILS.calibrationNbPhotos`, chaque analyse écrit une
ligne `calibration_log` : texte OCR brut, confiance, **payload d'IA anonymisé
réellement envoyé**, réponse brute, code d'erreur éventuel, **seuil en vigueur au
moment de l'analyse**, durée. Le seuil est journalisé avec l'analyse : sans lui,
un réglage a posteriori ne serait pas rejouable. Consultation dans Réglages >
Calibration des photos (7.14). Au-delà du compte, la journalisation s'arrête
d'elle-même ; le parent peut aussi l'arrêter à la main.

**Rappel de la section 8.3 du prompt maître, à ne pas perdre** : ces seuils sont
des valeurs de départ, pas des vérités. Ils ne se règlent que sur de vraies
photos et de vrais enregistrements. Aucun agent en aval ne doit les figer.

---

# 14. Verticales V1 à V9 et dépendances

Le découpage est celui de 4.3, que je n'ai pas modifié. J'y ajoute, pour chaque
verticale, les éléments d'architecture livrés, les dépendances réelles, et — pour
deux d'entre elles — **le producteur**, sur arbitrage de l'Orchestrateur.

| V | Contenu | Éléments d'architecture livrés | Dépend de |
| --- | --- | --- | --- |
| **V1** | Socle | `prisma/schema.prisma` appliqué, `supabase/policies.sql` appliqué **sous le rôle de `DIRECT_URL`**, `src/config/{env,env.client,ui,seuils,pierres}.config.ts`, `src/lib/db/prisma.ts`, `src/lib/errors/**`, `src/lib/validation/json.ts`, `src/content/**`, `prisma/seed.ts` (Evan + palier d'exemple), `src/lib/dates/{age,soiree}.ts` | G3 |
| **V1-contenu** | **`content/ui-enfant.json` et `content/ui-parent.json`** | Extraction et nomenclature des clés des tableaux 7.1 à 7.14 du marketing | **Producteur : `contenu-enfant`. Contrôleur : `controle-produit`, `gardien-charte` inclus. À livrer AVANT G3** (ARB-10) |
| **V2** | Capture & analyse IA | `src/lib/ocr/**`, `src/lib/ai/**` (interface, fabrique, 3 prompts, 3 schémas Zod, anonymisation), routes 8.2, `CalibrationLog`, `scripts/verifier-confinement.ts` | V1 |
| **V3** | Moteur de session | `src/lib/session/machine.ts` (pure), `service.ts`, **`cloture-automatique.ts`**, routes 8.3, reprise via `GET /api/etat`, pause | V1 ; V2 pour un programme réel, mais la machine se teste sur un programme forgé |
| **V4** | Module Lecture | `src/lib/voice/**` (+ cache **à deux buckets** + `scripts/prewarm-tts.ts`), `src/lib/speech/**`, `src/lib/lecture/matching.ts`, `questions.ts`, route `POST /api/voix` | V3 |
| **V5** | Module Maths | `src/lib/maths/indices.ts`, `POST /api/indices` (avec son effet d'écriture), secours TEC-07 | V3, et V2 pour les indices pré-générés |
| **V6** | Pierres & Coffre | `src/lib/pierres/**`, `GET /api/coffre`, `POST /api/coffre/cosmetique`, `scripts/verifier-solde.ts` | V3 (le crédit est un effet de transition) |
| **V7** | Réglages & code parent | `src/lib/parent/code.ts`, `session-parent.ts`, routes 8.6, les 8 sous-pages, **`src/components/enfant/SortieParent.tsx`** (PRD-13) | V1 |
| **V8** | Espace parent | Écrans `/parent`, `/parent/programme`, `/parent/resume`, `src/lib/parent/resume.ts`, `src/lib/notifications/locale.ts` | V2 et V3 ; V6 pour l'affichage du solde en Réglages |
| **V9** | Onboarding, états limites, son, icône, polish | `/bienvenue`, les états limites de 10.2, thèmes commutés à chaud, sons | toutes |

**Ordre** : V1 → V2 → V3 en série, puis V4, V5, V6 en parallèle, puis V7 et V8,
puis V9.

**Le point ouvert du tour 1 sur V3/V7 est refermé par ARB-09**, et le
contrôleur avait raison de dire que je posais mal le problème :

- **V3 ne dépend d'aucun élément de V7 pour fermer une session.** La clôture
  normale (T9) n'a aucune garde, et la clôture automatique (T12) est déclenchée
  par le serveur sur la date. V3 est donc testable seule sur plusieurs soirées.
- **V7 n'ajoute que la sortie anticipée** (T10) : le cookie de portée
  `sortie_session`, et le déclencheur `SortieParent.tsx` — que le tour 1
  n'attribuait à personne (constat 17). Il est attribué à V7, avec le clavier.
- Tant que V7 n'est pas livrée, `ABANDON_PARENT` répond
  `403 TIPI_ABANDON_NON_AUTORISE`. C'est testable, et cela ne bloque rien.

---

# 15. Dépendances, et celles que je n'ajoute pas

## 15.1 Ce que j'ajoute, avec l'exigence qui le justifie

| Dépendance | Exigence |
| --- | --- |
| `next`, `react`, `react-dom` | TEC-01 |
| `typescript`, `@types/*` | TEC-01, TEC-15 |
| `tailwindcss`, `postcss`, `autoprefixer` | TEC-01, DES-01/02 |
| `prisma`, `@prisma/client` | TEC-03 |
| `zod` | TEC-05 (sortie IA strictement validée), `10-stack.mdc` |
| `zustand` | TEC-04 |
| `@tanstack/react-query` | TEC-04 |
| `@supabase/supabase-js` | TEC-02 — **Storage uniquement, importé seulement côté serveur** |
| `@google-cloud/vision` | TEC-05 |
| `@google-cloud/text-to-speech` | TEC-08 |
| `@node-rs/argon2` | SEC-01 (argon2id) |
| `vitest`, `@testing-library/react`, `msw` | 4.2 P5, DoD du projet |
| `@playwright/test` | 4.2 P6 |
| `eslint`, `eslint-config-next`, `prettier` | TEC-14, TEC-15 |

## 15.2 Ce que je n'ajoute pas, et pourquoi

| Refusé | Pourquoi |
| --- | --- |
| SDK DeepSeek ou OpenAI | Un `fetch` suffit. Bénéfice réel pour le changement de fournisseur — mais ce n'est pas ce qui prouve le confinement, c'est l'interface `AiProvider` (5.1) |
| `xstate` ou autre bibliothèque de machine à états | La machine de 3.3 tient en une fonction pure d'une soixantaine de lignes, entièrement testable. Une bibliothèque ajouterait un vocabulaire à apprendre pour neuf états |
| `trpc`, `graphql` | 32 chemins de route à contrat fixe, déjà typés par Zod |
| Un `repository` au-dessus de Prisma | Prisma **est** la couche d'accès |
| `web-push`, service worker, table d'abonnements | PRD-06 demande une notification ; TEC-18 dit un seul appareil. L'API `Notification` du navigateur suffit. Le Web Push part dans `BACKLOG-V2.md` |
| `date-fns`, `dayjs` | `Intl` et les dates natives suffisent pour un âge, une date de séance et la comparaison de soirée de T12 |
| `uuid` | `crypto.randomUUID()` |
| une bibliothèque de distance de Levenshtein | 20 lignes, et le seuil doit rester dans `seuils.config.ts` (TEC-16) |
| `framer-motion` | DES-08 demande des animations courtes et douces : CSS suffit |
| `sharp` | La compression d'image se fait dans le navigateur, avant envoi |
| une table `tts_cache` | Le chemin est déterministe (12.2), y compris côté privé |
| des policies RLS par famille | Aucune authentification en V1 (section 4) |
| un `middleware.ts` d'authentification globale | Une seule famille de routes est protégée (`/api/reglages/**`), plus un événement (`ABANDON_PARENT`) : la garde est explicite dans ces handlers, donc visible et testable |
| une file d'attente pour le rattrapage des pierres | Le rattrapage est porté par T12, qui s'exécute de toute façon à l'ouverture suivante (9.4) |

---

# 16. Tableau de couverture REQ-TEC et REQ-SEC

Une ligne par exigence, l'élément d'architecture **nommé** qui la porte, et
comment.

| ID | Élément d'architecture nommé | Comment |
| --- | --- | --- |
| TEC-01 | Arborescence `src/app/**` (App Router), `tsconfig` strict, `tailwind.config.ts`, `pnpm` | Section 2 ; aucun dossier `pages/`, tous les écrans de 3.1 sont des segments App Router |
| TEC-02 | `prisma/schema.prisma` (datasource postgresql), `supabase/policies.sql` (4 buckets), `SUPABASE_URL` | Projet Supabase en région UE, Postgres + Storage |
| TEC-03 | `prisma/schema.prisma` | 10 modèles conformes à 3.7, section 3.1 champ par champ |
| TEC-04 | `src/stores/session-ui.ts` (Zustand), `src/hooks/**` (TanStack Query) | Zustand ne porte que l'affichage (D2), les données serveur passent par Query |
| TEC-05 | `src/lib/ocr/providers/google-vision.ts` → `src/lib/ocr/normalisation.ts` → `src/lib/ai/providers/deepseek.ts` | Pipeline 3.2 en 5 étapes isolées ; `AiProvider` n'accepte aucune image, donc le mode vision est structurellement inaccessible (5.4) |
| TEC-06 | `POST /api/session` | Seule création de session ; `/enfant` est inatteignable sans une session en base, et `GET /api/etat` renvoie `/parent` sinon |
| TEC-07 | `exercise.indices` (Json), `POST /api/devoirs/analyse` (pré-génération), `POST /api/indices` (secours) | Les 4 indices sont écrits à l'analyse ; la génération dynamique n'est appelée que si `indices` est nul |
| TEC-08 | `src/lib/voice/provider.ts` (`VoiceProvider`), `providers/google-chirp3.ts`, `src/config/mascot.config.ts` | Fabrique sur `VOICE_PROVIDER` ; la voix est figée dans `mascot.config.ts` et **n'est pas une variable d'environnement** (5.2) |
| TEC-09 | `src/lib/speech/provider.ts` (`SpeechProvider`), `providers/web-speech.ts`, `NEXT_PUBLIC_SPEECH_PROVIDER`, contrat `POST /api/voix/transcrire` | Web Speech en V1. **Couverte sous condition** : le repli Google a son interface, sa valeur de configuration et son contrat, et n'est pas implémenté. Ligne de traçabilité en 16.1 |
| TEC-09b | `src/lib/voice/cache.ts`, buckets `tts-cache` (public) **et `tts-prive`**, `scripts/prewarm-tts.ts` | Clé sha256 déterministe, 474 clips pré-chauffés = 2,10 % du quota une seule fois, ~5 %/mois en usage. **La séparation des deux buckets est ce qui rend le cache compatible avec SEC-04** (12.2) |
| TEC-10 | `src/lib/session/machine.ts` (fonction pure), `EtatSession` (enum Prisma), table 9.2, `CHECK session_etape_courante_coherente` | 9 états, 12 transitions, toute paire non listée est refusée en 409 |
| TEC-11 | `src/lib/pierres/service.ts`, `POST /api/session/:id/transition`, `src/lib/session/cloture-automatique.ts` | Seuls chemins d'écriture, section 7, cinq points de démonstration + règles grep de 7.2 |
| TEC-12 | `src/components/pilou/PilouReflechit.tsx`, **seuil unique dans `src/config/ui.config.ts`**, `enfant.attente.pilou` | Budget de latence 12.1 : chaque interaction au-dessus de 400 ms est nommée et habillée |
| TEC-13 | Décision D1, `src/config/env.ts` vs `env.client.ts`, 3 variables publiques sans secret | Aucun client Supabase, Google ou IA dans le navigateur ; l'unique accès direct est un `GET` sans clé sur un bucket public sans donnée personnelle ; contrôle `grep` sur `.next/static` en section 11 |
| TEC-14 | `package.json` scripts `typecheck`, `lint`, `test`, `build` ; aucune dépendance native exotique | Décidé ici, exécuté par les verticales |
| TEC-15 | `10-stack.mdc`, taxonomie d'erreurs typée (`src/lib/errors/codes.ts`) plutôt que chaînes libres | Aucune union ouverte, donc pas de `any` de confort dans la gestion d'erreur |
| TEC-16 | `src/config/seuils.config.ts` (serveur), modèle `CalibrationLog`, `family.calibration_active`, routes `/api/reglages/calibration` | Seuils en un seul endroit — c'est pourquoi le matching de lecture est serveur (13) — et journalisation des 20 premières analyses **avec le seuil en vigueur** |
| TEC-17 | `src/lib/ai/provider.ts`, `src/lib/ai/index.ts`, `src/lib/ai/providers/deepseek.ts`, `AI_PROVIDER`, `scripts/verifier-confinement.ts` | L'interface ne nomme aucun fournisseur ; un seul fichier connaît son protocole, deux autres son nom ; **règle grep corrigée et sortie publiée** (5.1, 17.2) |
| TEC-18 | Modèle `Session` (`etat`, `etapes_prevues`, `etape_courante`, `evenements`), décision D2, partie E de `policies.sql` | Tout l'état de parcours est en base, y compris `child.onboarding_termine_le` ; le passage à deux appareils est décrit en 4 étapes, avec l'ordre impératif des GRANT |
| SEC-01 | `settings_access.code_hash`, `src/lib/parent/code.ts` (`@node-rs/argon2`) | Aucune route ne renvoie le hash ; aucun journal ne reçoit le code ; aucun code par défaut n'est livré |
| SEC-02 | `settings_access.tentatives_echouees`, `bloque_jusqu_a`, `CODE_MAX_TENTATIVES`, `CODE_BLOCAGE_PALIERS_SEC`, `POST /api/reglages/code/verifier` | Blocage progressif après 5 essais, compteur en base (pas en mémoire de processus), CHECK `>= 0` |
| SEC-03 | `supabase/policies.sql` parties A et D, **y compris `_prisma_migrations`** | RLS activée sur **toutes** les tables du schéma public, aucune policy pour `anon`/`authenticated`, `REVOKE`, et 8 vérifications **exécutables** dont V1 qui balaie `pg_tables` sans liste en dur |
| SEC-04 | `src/lib/ai/anonymisation.ts`, typage de `AiProvider`, `calibration_log.payload_ia`, **bucket `tts-prive` + vérification V8** | Quatre barrières : le type, le constructeur unique, la garde d'exécution, et **la séparation des clips audio qui prononcent le prénom** (section 6, 12.2) |
| SEC-05 | `family.retention_audio_jours`, bucket privé `audios`, `POST /api/cron/purge-audios`, `CRON_SECRET`, `/api/reglages/audio` | Purge planifiée et paramétrable, durée bornée par CHECK, `attempt.audio_url` remis à null |
| SEC-06 | `src/lib/pierres/service.ts` (recalcul `SUM(delta)`), CHECK `delta > 0`, unique `(session_id, raison)` sur colonne **obligatoire**, absence de route de crédit | Section 7 : cinq points, dont l'absence totale de chemin client |
| SEC-07 | `GET /api/reglages/donnees/export`, `DELETE /api/reglages/donnees`, sous-page 7.14 | Export en une pièce jointe JSON, suppression en une transaction (rien de partiel), sans `code_hash` |
| SEC-08 | Cookie parent httpOnly signé **et porté** (`reglages` / `sortie_session`), `src/lib/parent/code.ts` isolé de `src/lib/ai/**`, aucune entrée Réglages sur un écran enfant | Le code n'entre jamais dans un payload d'IA ; la porte de PRD-13 est une surcouche, pas une navigation (8.6) |

## 16.1 Ligne à inscrire dans `TRACEABILITY.md` pour TEC-09 (ARB-11)

Je ne modifie pas `TRACEABILITY.md`, qui n'est pas un de mes quatre livrables.
Voici la ligne exacte, prête à coller, pour que `recette-finale` ne rejoue pas ce
débat en G8 :

```
| TEC-09 | STT navigateur derrière SpeechProvider | src/lib/speech/provider.ts,
src/lib/speech/providers/web-speech.ts, NEXT_PUBLIC_SPEECH_PROVIDER,
POST /api/voix/transcrire (501) | tests V4 | COUVERTE SOUS CONDITION —
l'implémentation de repli Google Cloud STT n'est écrite que si la précision sur
la voix d'Evan est jugée insuffisante. Condition évaluable uniquement sur des
enregistrements réels (prompt maître, section 8.4). Porteur : escalade humaine,
puis `qa-e2e`. Tant que la condition n'est pas évaluée, l'exigence est réputée
couverte par l'interface + Web Speech (arbitrage Orchestrateur, G2 tour 1). |
```

Une correction de ma part sur cette ligne : elle dit « arbitrage Orchestrateur,
G2 tour 1 », et cet arbitrage porte désormais un numéro. Lire **ARB-11**.

## 16.2 Lignes à inscrire dans `TRACEABILITY.md` pour le barème (ARB-12, point 2)

Le risque est nommé : `recette-finale` ne lit pas `GATES.md` exigence par
exigence, elle lit la section 2 du prompt maître et vérifie le code contre elle.
Elle trouvera « +1 bonus si les 2 étapes du soir sont terminées » en 3.7, verra
`bonus_soiree_complete`, et conclura à un écart — avec raison, si rien ne le lui
explique là où elle regarde. **Un écart assumé et tracé n'est pas un écart ; un
écart silencieux est un piège pour le dernier agent de la chaîne.**

Trois lignes portent le barème. Chacune doit citer ARB-08 :

```
| ETH-04 | Les pierres ne se perdent jamais et n'expirent jamais |
prisma/schema.prisma (CHECK gem_ledger.delta > 0 et delta <= 1, via
supabase/policies.sql partie B), src/lib/pierres/service.ts,
src/config/pierres.config.ts | tests V6 | COUVERTE. BARÈME MODIFIÉ PAR ARB-08 :
+1 par étape terminée, +1 quand TOUTES les étapes programmées du soir sont
terminées. La section 3.7 écrit « les 2 étapes » ; ARB-08 remplace ce « 2 » en
dur parce qu'une étape vide n'est plus jamais programmée, afin qu'un découpage
incomplet de l'IA ne coûte aucune pierre à l'enfant. Conséquence assumée : une
soirée à une seule étape rapporte 2 pierres. |

| TEC-11 | Service pierres côté serveur | src/lib/pierres/service.ts,
src/lib/session/service.ts, src/lib/session/cloture-automatique.ts,
POST /api/session/:id/transition | tests V6 | COUVERTE. Barème appliqué :
voir ETH-04 et ARB-08 — le bonus porte sur toutes les étapes programmées, pas
sur un « 2 » en dur. |

| SEC-06 | Le solde n'est jamais modifiable depuis le client | recalcul
SUM(gem_ledger.delta) dans src/lib/pierres/service.ts, unique
(session_id, raison) sur colonne obligatoire, aucune route n'accepte de montant
| tests V6 | COUVERTE. Barème : voir ETH-04 et ARB-08. |
```

Le même paragraphe canonique figure en 9.5, dans le commentaire de l'énumération
`RaisonGem` de `prisma/schema.prisma`, et dans celui du `CHECK
gem_ledger_delta_max_un` de `supabase/policies.sql`. Quatre endroits, une seule
formulation, et le numéro d'arbitrage partout : `recette-finale` tombera dessus
quel que soit le fichier par lequel elle entre.

---

# 17. Sorties réelles de mes commandes

## 17.1 `prisma validate`, après les corrections du tour 2

`$SP` est mon répertoire de travail temporaire, hors du dépôt. Le schéma a été
modifié au tour 2 (`session_id` obligatoire, `bonus_soiree_complete`, en-tête des
huit contraintes), puis de nouveau après ARB-12 (le commentaire de `RaisonGem`
cite désormais ARB-08 et l'écart à la section 3.7). Sortie ci-dessous : celle de
ma dernière exécution, postérieure à toutes les corrections.

```
$ cd /home/user/Tipi && npm install prisma@5.22.0 --prefix $SP --no-audit --no-fund
added 6 packages in 4s

$ export DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
         DIRECT_URL="postgresql://u:p@localhost:5432/postgres"
$ $SP/node_modules/.bin/prisma format --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
Formatted prisma/schema.prisma in 36ms 🚀

$ $SP/node_modules/.bin/prisma validate --schema prisma/schema.prisma
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

Deux précisions d'honnêteté sur ce bloc. La durée affichée par `prisma format`
varie d'une exécution à l'autre (33 ms au tour 1, 34 puis 36 ms au tour 2) :
c'est la sortie réelle de ma dernière exécution, pas un chiffre stable. Et le cadre « Update
available » est la bannière que le CLI imprime de lui-même ; je la laisse plutôt
que de la couper, puisque `controle-architecture` la verra en rejouant.
Le choix de la version 5.22.0 est délibéré : c'est la dernière 5.x stable, et
`10-stack.mdc` n'impose pas de version. Passer en 8.x est une décision de V1, pas
d'architecture.

Version du CLI employé :

```
$ prisma -v
prisma                  : 5.22.0
@prisma/client          : Not found
Computed binaryTarget   : debian-openssl-3.0.x
Operating System        : linux
```

`DATABASE_URL` et `DIRECT_URL` sont renseignées avec des valeurs factices, ce
que `prisma validate` exige pour résoudre `env()` ; **aucune base n'a été
contactée** et le dépôt n'a reçu aucun fichier de cette installation.

**Limite de ce contrôle, énoncée franchement** : `prisma validate` vérifie la
grammaire et la cohérence du schéma. Il ne vérifie **ni** la conformité à la
section 3.7, **ni** l'existence des contraintes SQL de `policies.sql`. Ces deux
points se contrôlent à la lecture (section 3.1) et par les vérifications V1 à V8
de `policies.sql`, sur une vraie base.

Commande à rejouer par `controle-architecture`, vérifiée telle quelle :

```
mkdir -p /tmp/prisma-check \
&& cd /home/user/Tipi \
&& npm install prisma@5.22.0 --prefix /tmp/prisma-check --no-audit --no-fund \
&& DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
   DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
   /tmp/prisma-check/node_modules/.bin/prisma validate --schema prisma/schema.prisma
```

## 17.2 Les règles grep, ancienne et nouvelle (constat 2)

`40-protocole-agents.mdc` demande, quand on corrige un instrument, de
**re-mesurer avec l'ancienne version et de publier ce qu'elle signalait**. Les
deux sorties sont donc ici.

Arborescence de test, reconstituée hors du dépôt, conforme à la section 2 :
`src/lib/ai/providers/deepseek.ts` (protocole), `src/lib/ai/index.ts` (fabrique),
`src/config/env.ts` (valeur par défaut), `src/lib/session/service.ts`,
`src/lib/pierres/service.ts`, `src/app/api/coffre/route.ts`,
`scripts/verifier-solde.ts`.

**Ancienne règle, celle du tour 1** — annoncée « doit renvoyer zéro résultat » :

```
$ grep --version | head -1
grep (GNU grep) 3.11

$ grep -ril deepseek src/ --exclude-dir=ai/providers
src/config/env.ts
src/lib/ai/index.ts
src/lib/ai/providers/deepseek.ts
---exit:0---
```

Trois fichiers, dont celui qu'elle prétendait exclure : `--exclude-dir` compare
le **nom de base** du répertoire, un motif contenant `/` ne correspond jamais.
L'ancienne règle ne pouvait donc jamais passer. Le contrôleur l'avait reproduit ;
je le reproduis à l'identique.

**Nouvelle règle R1**, sur le périmètre réel :

```
$ grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)'
---exit:1  (1 = aucun resultat = conforme)---

$ grep -rilE 'deepseek' src/        # pour mémoire, les 3 fichiers autorisés
src/config/env.ts
src/lib/ai/index.ts
src/lib/ai/providers/deepseek.ts
```

**Règles R2 et R3 du solde** (7.2), remplaçant celle du tour 1 qui mélangeait
lecture et écriture et citait un dossier hors périmètre :

```
$ grep -rlE 'gemLedger\.(create|createMany|upsert|update|delete)|gemBalance *:|gem_balance *=' \
       src/ scripts/ --include=*.ts
src/lib/pierres/service.ts
---exit:0---

$ grep -rlE 'gemBalance' src/ scripts/ --include=*.ts
src/app/api/coffre/route.ts
scripts/verifier-solde.ts
```

R2 ne renvoie que le service : **une seule écriture dans tout le dépôt**. R3
montre que les lectures, elles, sont ailleurs et c'est normal — le coffre affiche
le solde, le script vérifie l'invariant. Séparer les deux règles est ce qui rend
chacune vraie.

## 17.3 L'instrument de mesure du corpus TTS

Publié intégralement, comme l'exige la règle 2 de
`40-protocole-agents.mdc` : un contrôleur doit pouvoir reconstituer la
procédure, pas seulement vérifier le résultat.

```js
// node corpus-tts.js <racine du depot>
const fs = require('fs'); const path = require('path');
const racine = process.argv[2] || '.';
const enc = JSON.parse(fs.readFileSync(path.join(racine,'content/encouragements.json'),'utf8'));
const gwe = JSON.parse(fs.readFileSync(path.join(racine,'content/gwenn-scripts.json'),'utf8'));
const PRENOM = 'Evan';                        // rendu du jeton {prenom}
const MATIERES = ['la lecture', 'les maths']; // table jeton_matiere du fichier de contenu

// Une entree lue = canal 'tts' ou 'les_deux'. Les 'affiche' ne sont jamais synthetisees.
const entrees = [];
for (const [sid, s] of Object.entries(enc.situations))
  for (const v of s.variantes)
    if (v.canal !== 'affiche') entrees.push({ situation: sid, id: v.id, texte: v.texte });
for (const [rid, r] of Object.entries(gwe.rituels))
  for (const e of r.ecrans) for (const l of e.lignes)
    if (l.texte && l.canal !== 'affiche') entrees.push({ situation: rid, id: l.id, texte: l.texte });

// Un clip = un texte RENDU distinct. Une entree a jeton {matiere} produit 2 clips.
const clips = [];
for (const e of entrees) {
  const aPrenom = e.texte.includes('{prenom}'), aMatiere = e.texte.includes('{matiere}');
  const rendus = aMatiere ? MATIERES.map(m => e.texte.replace('{matiere}', m)) : [e.texte];
  for (const r of rendus) clips.push({ ...e, aPrenom, aMatiere, rendu: r.replace('{prenom}', PRENOM) });
}
const uniques = [...new Map(clips.map(c => [c.rendu, c])).values()];
const somme = a => a.reduce((n, c) => n + c.rendu.length, 0);
const A = uniques.filter(c => !c.aPrenom && !c.aMatiere);
const B = uniques.filter(c => !c.aPrenom &&  c.aMatiere);
const C = uniques.filter(c =>  c.aPrenom);
// … impressions : totaux, puis A / B / C, puis la liste nominative de C.
```

Sortie réelle sur le dépôt :

```
entrees lues (canal tts ou les_deux)   : 454
clips distincts a synthetiser          : 474
caracteres du corpus fixe              : 21016
longueur moyenne                       : 44.3
part du quota mensuel (1 000 000 car.) : 2.10 %

REPARTITION PAR DESTINATION DE CACHE
A. sans aucun jeton  -> bucket PUBLIC  : 420 clips, 19105 car.
B. jeton {matiere}   -> bucket PUBLIC  : 40 clips, 1372 car.
C. jeton {prenom}    -> bucket PRIVE   : 14 clips, 539 car.
clips portant les DEUX jetons          : 0

LES 14 CLIPS QUI NE DOIVENT JAMAIS ETRE PUBLICS
   accueil            enc.accueil.01                 Bonsoir Evan. Je suis contente de te voir.
   accueil            enc.accueil.03                 Salut Evan. Ton tipi est prêt.
   accueil            enc.accueil.06                 Bonsoir Evan. Le tipi t'attendait.
   accueil            enc.accueil.09                 Te voilà, Evan. On y va doucement.
   accueil            enc.accueil.12                 Bonsoir Evan. Ici, on prend son temps.
   accueil            enc.accueil.14                 Coucou Evan. Tu es là, c'est bien.
   accueil            enc.accueil.17                 Bonsoir Evan. On fait un petit moment ensemble.
   accueil            enc.accueil.20                 Te voilà, Evan. Ce moment est à nous deux.
   reprise_session    enc.reprise_session.01         Te revoilà, Evan. On reprend là où on en était.
   reprise_session    enc.reprise_session.02         Bonsoir Evan. On continue notre travail.
   reprise_session    enc.reprise_session.10         Bonsoir Evan. On reprend doucement, sans tout refaire.
   reprise_session    enc.reprise_session.14         Bonsoir Evan. On termine ensemble ce soir.
   reprise_session    enc.reprise_session.20         Bonsoir Evan. On finit le chemin, doucement.
   rituel_fermeture   bravo.titre                    Bravo Evan.
```

**Re-mesure avec l'ancienne question** : les quatre grandeurs du tour 1 — 474
clips, 21 016 caractères, 44,3 de moyenne, 2,10 % du quota — sont **identiques**.
L'instrument corrigé n'a effacé aucun chiffre ; il a rendu visible une
ventilation que l'ancien ne calculait pas, et c'est cette ventilation qui a
révélé le défaut. La liste nominative des 14 clips est publiée pour qu'un
contrôleur puisse vérifier, fichier en main, qu'aucun d'eux ne se retrouve dans
le bucket public.

## 17.4 Comptes de `.env.example`

```
$ grep -cE '^[A-Z][A-Z0-9_]*=' .env.example
27
$ grep -cE '^NEXT_PUBLIC_' .env.example
3
```

27 variables, dont 3 publiques — les deux ajoutées au tour 2 sont
`UPLOAD_MAX_PHOTO_OCTETS` et `UPLOAD_MAX_AUDIO_OCTETS`, toutes deux serveur
(constat 15). Le tableau de la section 11 compte 27 lignes.

---

# 18. Points que je veux voir tranchés

Les cinq points du tour 1 sont tranchés et appliqués (0.3). Les deux points que
j'avais laissés ouverts à la fin du tour 2 le sont par ARB-12 (0.4) :

- **les six clés `lecture.vide.*` / `maths.vide.*`** : la vérification demandée
  est faite, état limite par état limite, en **section 10.3**. Les cinq états
  gardent une couverture propre, les six clés partent, et deux points
  d'exécution sont écrits pour `contenu-enfant` ;
- **le barème** : formulation canonique en **9.5**, reprise dans les quatre
  endroits qui l'énoncent, et trois lignes de `TRACEABILITY.md` prêtes à coller
  en **16.2**.

Il ne reste donc **qu'un seul point ouvert**, et il n'est pas de mon ressort.

**Le glob de `30-copy-enfant.mdc` reste faux tant que personne ne l'écrit.**
Le fichier de règles n'est pas un de mes quatre livrables. La valeur complète,
qui suit la recommandation du contrôleur et supprime `gwenn` au lieu de le
conserver :

```
globs: ["content/**", "src/components/pilou/**", "src/components/enfant/**",
        "src/app/enfant/**", "src/lib/ai/prompts/**"]
```

Tant que cette ligne n'est pas modifiée, **la règle qui interdit le texte enfant
en dur ne couvre aucun fichier** : `src/components/gwenn/**` n'existera jamais.
Le nom de fichier `content/gwenn-scripts.json` reste, lui, en attente de
l'humain (ESC-001) : je n'y touche pas, et la première entrée du glob,
`content/**`, le couvre quel que soit son nom final.
