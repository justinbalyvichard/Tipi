# P2 — Architecture technique de Tipi

Livrable de l'agent `architecte`. Porte G2.

Sources lues en entier avant de concevoir : `TIPI-PROMPT-CURSOR.md` (2.3, 2.4,
3.1 à 3.8, 4.3), `docs/agents/P1/produit-marketing.out.md`,
`docs/agents/P1/contenu-enfant.out.md`, `content/encouragements.json`,
`content/gwenn-scripts.json`, `docs/agents/GATES.md` (arbitrages ARB-01 à
ARB-07), les cinq règles de `.cursor/rules/`.

| Fichier livré | Contenu |
| --- | --- |
| `docs/agents/P2/architecture.out.md` | Le présent document |
| `prisma/schema.prisma` | 10 modèles, 6 énumérations, `prisma validate` vert (section 17) |
| `supabase/policies.sql` | RLS table par table, contraintes non exprimables en Prisma, Storage |
| `.env.example` | 25 variables, aucune valeur réelle |

Aucun commit git. Aucun code applicatif écrit : ce livrable décrit, il
n'implémente pas.

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
17. `prisma validate` — sortie réelle
18. Points que je veux voir tranchés

---

# 1. Principes et ce que l'architecture refuse de faire

Cinq décisions structurantes gouvernent tout le reste. Chacune est rattachée à
une exigence nommée ; aucune n'est une préférence de style.

**D1 — Le navigateur ne parle qu'à Next.js. Jamais à Supabase, jamais à un
fournisseur tiers.** Conséquence : il n'existe aucune clé Supabase, Google ou
DeepSeek dans le bundle, pas même la clé `anon` (TEC-13). Les photos transitent
par une route serveur, les audios aussi, les URL de lecture sont signées côté
serveur. Le seul objet que le client va chercher directement est un clip audio
du cache TTS, qui est public par construction et ne contient aucune donnée
personnelle (TEC-09b). Coût assumé : la photo passe par le serveur, donc elle
est compressée à ~1 Mo côté client avant envoi.

**D2 — L'état de session vit en base, et la base est la seule source de
vérité** (TEC-18, PRD-18). Zustand ne détient que de l'état d'affichage
(variante de phrase en cours, indice affiché, micro ouvert). Fermer l'onglet ne
perd rien ; rouvrir relit la base. Aucun `localStorage` ne porte de donnée de
parcours.

**D3 — Une seule route mute l'état de session**, `POST /api/session/:id/transition`.
Elle recalcule l'état cible à partir de l'état persisté et de l'événement reçu,
jamais à partir d'un état envoyé par le client. C'est aussi le seul endroit d'où
partent les crédits de pierres (TEC-10, TEC-11, SEC-06).

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
│   ├── ui-enfant.json               À PRODUIRE EN V1 — clés fixes des écrans enfant
│   └── ui-parent.json               À PRODUIRE EN V1 — écrans parent et Réglages
├── docs/agents/                     livrables et verdicts
├── prisma/
│   ├── schema.prisma                livré ici
│   ├── migrations/                  générées par `prisma migrate dev`
│   └── seed.ts                      foyer + profil d'Evan + palier d'exemple (PRD-02)
├── supabase/
│   └── policies.sql                 livré ici, appliqué APRÈS `migrate deploy`
├── scripts/
│   ├── prewarm-tts.ts               TEC-09b — synthèse des 474 clips fixes
│   └── verifier-solde.ts            TEC-11 — rejoue l'invariant solde == somme du ledger
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
    │   └── parent/                  composants d'écran parent et Réglages
    ├── config/
    │   ├── env.ts                   parse Zod des variables, SERVEUR UNIQUEMENT
    │   ├── env.client.ts            les 3 variables NEXT_PUBLIC_, importable côté client
    │   ├── mascot.config.ts         P3 — nom, palette, cosmétiques, VOIX FIGÉE (TEC-08)
    │   ├── seuils.config.ts         TEC-16 — tous les seuils, un seul endroit
    │   └── pierres.config.ts        barème de 3.7, une seule table
    ├── content/                     chargeur typé des fichiers content/
    │   ├── schema.ts                Zod des 4 fichiers, exécuté une fois au boot
    │   ├── loader.ts                import JSON + parse + gel
    │   ├── selection.ts             tirage sans répétition immédiate (ARB-04)
    │   ├── jetons.ts                rendu de {prenom} et {matiere} (ARB-01, ARB-06)
    │   └── cles.ts                  table de sélection C1→C6 de 7.0 du marketing
    ├── lib/
    │   ├── db/prisma.ts             singleton Prisma, serveur uniquement
    │   ├── ai/                      TEC-17 — voir section 5
    │   │   ├── provider.ts          interface AiProvider + types d'entrée/sortie
    │   │   ├── index.ts             fabrique, lit AI_PROVIDER
    │   │   ├── anonymisation.ts     SEC-04 — construction et garde du payload
    │   │   ├── schemas.ts           Zod des 3 sorties JSON (3.6)
    │   │   ├── prompts/             prompt-1-structuration.ts, -2-indices.ts, -3-questions.ts
    │   │   └── providers/deepseek.ts  SEUL fichier qui connaît DeepSeek
    │   ├── ocr/
    │   │   ├── provider.ts          interface OcrProvider
    │   │   ├── providers/google-vision.ts
    │   │   └── normalisation.ts     3.2 étape 3 : nettoyage + détection fr/br
    │   ├── voice/                   TEC-08, TEC-09b
    │   │   ├── provider.ts          interface VoiceProvider
    │   │   ├── index.ts             fabrique, lit VOICE_PROVIDER
    │   │   ├── cache.ts             clé sha256, lecture/écriture Storage
    │   │   └── providers/google-chirp3.ts
    │   ├── speech/                  TEC-09
    │   │   ├── provider.ts          interface SpeechProvider (client)
    │   │   └── providers/web-speech.ts
    │   ├── session/                 TEC-10
    │   │   ├── types.ts             EtatSession, Evenement, Etape, Snapshot
    │   │   ├── machine.ts           FONCTION PURE : (etat, evenement, plan) -> transition
    │   │   └── service.ts           applique la transition en transaction, persiste
    │   ├── pierres/
    │   │   ├── bareme.ts            +1 par étape, +1 bonus (3.7)
    │   │   └── service.ts           crediter() : ledger + recalcul du solde (SEC-06)
    │   ├── lecture/
    │   │   ├── matching.ts          normalisation + Levenshtein par mot (3.4)
    │   │   └── questions.ts         jugement souple sur mots-clés
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
    │   └── dates/age.ts             âge calculé depuis la date de naissance (PRD-02)
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

**Point d'attention livré tel quel à l'Orchestrateur** : `content/ui-enfant.json`
et `content/ui-parent.json` sont déclarés en 6.1 du livrable marketing et
consommés par tous les écrans, mais **ils n'existent pas encore**. Leur contenu
est intégralement écrit dans les tableaux de 7.1 à 7.14 du marketing : c'est une
extraction mécanique, pas une rédaction. Je l'affecte à V1 (section 14). Sans
eux, V2 à V9 écriraient du texte en dur, ce que `10-stack.mdc` interdit.

---

# 3. Modèle de données

## 3.1 Conformité à la section 3.7, table par table

Les neuf tables de 3.7 existent, avec leurs champs clés, aux noms de colonnes
exacts. Une dixième table existe, exigée nommément par TEC-16.

| Table 3.7 | Modèle Prisma | Champs de 3.7 présents | Ajouts, et l'exigence qui les impose |
| --- | --- | --- | --- |
| `family` | `Family` | id, nom | `retention_audio_jours` (SEC-05), `calibration_active` (TEC-16), `created_at` |
| `child` | `Child` | id, family_id, prenom, date_naissance, niveau_scolaire, classe_bilingue, gem_balance, theme_prefere, cosmetique_active | `onboarding_termine_le` (PRD-01 + TEC-18 : le marqueur doit survivre à un vidage du navigateur), `created_at`, `updated_at` |
| `homework` | `Homework` | id, child_id, photo_url, texte_ocr, langue_detectee, matiere, created_at | `confiance_ocr` (TEC-16), `saisie_manuelle` (PRD-16) |
| `exercise` | `Exercise` | id, homework_id, consigne, type, contenu, indices (Json) | `ordre` (PED-06 : l'ordre des exercices d'une étape doit être stable), `created_at` |
| `session` | `Session` | id, child_id, date, etat, etapes_prevues (Json), etape_courante, resume, started_at, ended_at | `evenements` (PRD-18 + PRD-06), `soir_leger` (PRD-04), `arret_parent` (PRD-13), `created_at`, `updated_at` |
| `attempt` | `Attempt` | id, exercise_id, session_id, transcription_audio, audio_url, nb_indices_utilises, statut | `nb_sollicitations` (PED-08), `mots_hesitants` (3.4 « Mots à revoir »), `created_at`, `updated_at` |
| `gem_ledger` | `GemLedger` | id, child_id, session_id, delta, raison, created_at | aucun |
| `reward_threshold` | `RewardThreshold` | id, child_id, gems_requis, description, atteint_le | `created_at` |
| `settings_access` | `SettingsAccess` | id, family_id, code_hash, tentatives_echouees, bloque_jusqu_a, updated_at | aucun |
| — | `CalibrationLog` | — | **Table entière**, exigée par TEC-16 : « journaliser en base le texte OCR brut, le score de confiance et le JSON renvoyé par DeepSeek » |

**Aucun champ de 3.7 n'est absent, aucun n'est renommé.** Les champs Prisma sont
en camelCase et mappés en snake_case par `@map`, pour que le SQL reste celui de
3.7 : `child.gemBalance` → colonne `gem_balance`, `session.etapesPrevues` →
colonne `etapes_prevues`. Un contrôleur qui veut vérifier lit la colonne, pas le
champ TypeScript.

**Six ajouts refusés**, pour mémoire, parce qu'ils auraient été de la
sur-ingénierie : table `session_event` (une colonne Json suffit), table
`tts_cache` (le chemin est déterministe, section 12), colonne
`session.etat_avant_pause` (l'étape de retour se déduit de `etape_courante`),
table `user` (aucune authentification en V1, TEC-18), colonne `child.age`
(interdit par PRD-02), table `cosmetique` (les cosmétiques sont une constante de
`mascot.config.ts`, pas une donnée).

## 3.2 Formes des colonnes Json

Trois colonnes Json, chacune avec une forme fixe validée par Zod à l'écriture
**et** à la lecture (`src/lib/validation/`). Aucune n'est un fourre-tout.

```ts
// exercise.indices — TEC-07
{ niveaux: [string, string, string, string], source: "pregenere" | "secours" }

// session.etapes_prevues — le programme validé par le parent (TEC-06)
Array<{ matiere: "lecture" | "maths", ordre: number,
        dureeEstimeeMin: number, exerciseIds: string[] }>

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
| `session(child_id, date)` | schema.prisma | session du soir |
| `session(child_id, etat)` | schema.prisma | aiguillage `/` : trouver la session active (PRD-18) |
| `attempt(session_id)`, `attempt(exercise_id)` | schema.prisma | résumé parent, reprise |
| **unique** `attempt(session_id, exercise_id)` | schema.prisma | une tentative par exercice et par session : la reprise met à jour, elle ne duplique pas |
| `gem_ledger(child_id, created_at)` | schema.prisma | recalcul du solde et export |
| **unique** `gem_ledger(session_id, raison)` | schema.prisma | **idempotence du crédit** : un double appui ne crédite pas deux fois |
| `reward_threshold(child_id, gems_requis)` | schema.prisma | palier suivant |
| **unique** `settings_access(family_id)` | schema.prisma | un seul code par foyer |
| `calibration_log(created_at)`, unique `(homework_id)` | schema.prisma | consultation depuis Réglages |
| **CHECK** `gem_ledger.delta > 0` | policies.sql B | **ETH-04 au niveau du schéma**, pas seulement du code |
| **CHECK** `gem_ledger.delta <= 1` | policies.sql B | le barème de 3.7 ne connaît que +1 |
| **CHECK** `child.gem_balance >= 0` | policies.sql B | SEC-06 |
| **CHECK** `settings_access.tentatives_echouees >= 0` | policies.sql B | SEC-02 |
| **CHECK** `reward_threshold.gems_requis > 0` | policies.sql B | PRD-14 |
| **CHECK** `family.retention_audio_jours BETWEEN 0 AND 365` | policies.sql B | SEC-05 |
| **UNIQUE partiel** `session(child_id) WHERE etat NOT IN (termine, abandon_parent)` | policies.sql B | PRD-18 : une seule session active, sinon la reprise est ambiguë |
| **CHECK** cohérence `session.etat` / `etape_courante` | policies.sql B | TEC-10 : pas d'état de session impossible en base |

Prisma ne sait exprimer ni `CHECK` ni index unique partiel : ces huit
contraintes vivent dans `supabase/policies.sql`, partie B, en SQL idempotent, et
le commentaire d'en-tête de `schema.prisma` y renvoie nommément.

---

# 4. Row Level Security

Le fichier `supabase/policies.sql` traite les dix tables une par une. Le modèle
est le même partout, et c'est volontaire :

1. `ALTER TABLE … ENABLE ROW LEVEL SECURITY` ;
2. **aucune policy** pour `anon` ni `authenticated` — en Postgres, RLS activée
   sans policy applicable signifie zéro ligne lisible et zéro écriture ;
3. `REVOKE ALL … FROM anon, authenticated`, pour que la requête échoue avant
   même l'évaluation des policies ;
4. `REVOKE USAGE ON SCHEMA public`, pour que PostgREST ne résolve même pas le
   nom de la table ;
5. `ALTER DEFAULT PRIVILEGES … REVOKE`, pour qu'une table future n'hérite de
   rien.

**Pourquoi le refus total et non des policies par famille.** Il n'y a aucune
authentification en V1 : l'enfant joue sans compte (PRD-05) et le parent est
identifié par un code, pas par une identité Supabase. Il n'existe donc pas de
`auth.uid()` à qui rattacher une ligne. Écrire aujourd'hui
`USING (family_id = auth.jwt() ->> 'family_id')` produirait des politiques
jamais évaluées, donc jamais testées, qui donneraient l'illusion d'une défense.
La partie E de `policies.sql` décrit en quatre étapes ce qui change le jour où
un second appareil arrive (TEC-18).

**Pourquoi pas `FORCE ROW LEVEL SECURITY`.** `FORCE` soumettrait aussi le
propriétaire des tables à RLS. Comme il n'existe aucune policy, l'application
elle-même serait verrouillée. La connexion applicative est une connexion serveur
de confiance, qui n'est atteignable ni depuis le navigateur ni depuis
l'extérieur ; la surface exposée en permanence, c'est PostgREST avec les rôles
`anon` et `authenticated`, et c'est elle que ce fichier ferme.

**Storage.** Trois buckets. `devoirs` et `audios` sont privés et n'ont
**aucune** policy : ils sont injoignables sans URL signée émise côté serveur.
`tts-cache` est public **en lecture seule** — une seule policy `SELECT` — parce
qu'il ne contient que la voix de Pilou disant des phrases identiques pour tous,
et que le chemin est un sha256 du texte. Aucun bucket n'a de policy d'écriture :
tout téléversement passe par `SUPABASE_SERVICE_ROLE_KEY`, côté serveur.

**Preuves rejouables** : la partie D de `policies.sql` contient six requêtes
(RLS activée partout, aucune policy métier, aucun privilège `anon`, contrainte
ETH-04 présente, insertion d'un delta négatif refusée, invariant du solde). Ce
sont les requêtes que `securite-rgpd` et `red-team` doivent rejouer.

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
- `src/lib/ai/providers/deepseek.ts` est **le seul fichier du dépôt où la chaîne
  « deepseek » a le droit d'apparaître**, avec `.env.example` et ce document.
  Règle opposable : `grep -ril deepseek src/ --exclude-dir=ai/providers` doit
  renvoyer zéro résultat. `controle-code` peut la rejouer à chaque verticale.
- Les trois prompts sont dans `src/lib/ai/prompts/`, versionnés
  (`VERSION = "1.0.0"` exporté), couverts par les tests de non-régression PED-01.
- Les trois sorties sont validées par les schémas Zod de `src/lib/ai/schemas.ts`.
  Une sortie non conforme est rejouée **une fois**, puis bascule en état
  `TIPI_IA_SORTIE_INVALIDE` (3.2 étape 4).
- L'implémentation DeepSeek est un simple `fetch` sur un point d'entrée
  compatible OpenAI. **Aucun SDK de fournisseur n'entre dans `package.json`** :
  changer de fournisseur n'oblige donc même pas à retirer une dépendance.

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
(`POST /api/voix/transcrire`, section 8) sont prêts. C'est le point 1 de la
section 18.

`estDisponible()` faux ou permission refusée ⇒ état `lecture.micro_absent` :
l'étape reste terminable sans micro (PRD-16).

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
`data:image` ou `base64`. Une correspondance lève une `AppError` et l'appel
n'est **pas** émis. La liste des interdits est passée par l'appelant, qui est la
route serveur : c'est le seul endroit qui connaît à la fois l'enfant et l'IA, et
il ne transmet que la liste de ce qu'il faut interdire.

**Preuve.** `calibration_log.payload_ia` stocke le payload **exact** qui a été
envoyé (TEC-16). Le test de SEC-04 n'a donc pas besoin de faire confiance au
code : il lit en base ce qui est réellement parti et vérifie l'absence du
prénom. C'est la même donnée que `red-team` attaquera (tentative 8).

**Le code parent ne traverse jamais cette frontière** (SEC-08) : il n'est connu
que de `src/lib/parent/code.ts`, qui ne dépend d'aucun module de `src/lib/ai/`.

---

# 7. TEC-11 et SEC-06 — démonstration qu'aucun chemin client n'incrémente le solde

La démonstration se fait en cinq points, chacun vérifiable par un contrôleur.

**7.1 — Il n'existe aucune route qui accepte un montant.** L'inventaire complet
des routes (section 8) ne contient aucun `POST /api/pierres`, aucun paramètre
`delta`, `montant`, `gems` ou `solde` en entrée. `GET /api/coffre` est la seule
route qui parle de pierres, et elle est en lecture.

**7.2 — Le crédit n'est pas une route, c'est un effet de bord.**
`crediterEtape()` et `crediterBonus()` vivent dans `src/lib/pierres/service.ts`
et ne sont appelés que depuis `src/lib/session/service.ts`, lui-même appelé par
la seule route `POST /api/session/:id/transition`. Le montant n'est jamais un
paramètre d'entrée : il est lu dans `src/config/pierres.config.ts` (barème de
3.7). Règle opposable pour `controle-code` :
`grep -rn "gemLedger.create\|gemBalance" src/ --include=*.ts` ne doit renvoyer
que `src/lib/pierres/service.ts` et `scripts/verifier-solde.ts`.

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
`scripts/verifier-solde.ts` et la requête D6 de `policies.sql` rejouent.

**7.4 — La base refuse ce que le code refuserait.** `delta > 0` et `delta <= 1`
sont des `CHECK` Postgres (ETH-04), `gem_balance >= 0` aussi, et l'unique
`(session_id, raison)` rend un double crédit impossible même en cas de double
appel. Un bug applicatif ne peut pas retirer une pierre.

**7.5 — Le client n'a aucune connexion à la base.** Pas de clé Supabase dans le
bundle (D1), RLS et `REVOKE` refusent tout à `anon` (section 4). Une requête
forgée n'a ni endpoint applicatif, ni accès direct.

Chemins d'attaque envisagés et fermés : requête forgée sur une route de crédit
(n'existe pas), rejeu d'une transition déjà appliquée (unique
`(session_id, raison)`), double appui (idempotence + contrôle d'état attendu,
section 9), écriture directe PostgREST (RLS + REVOKE), manipulation du store
Zustand (le store ne porte que de l'affichage ; le coffre relit
`GET /api/coffre`).

---

# 8. Contrats des routes serveur

Conventions communes à **toutes** les routes :

- Handler enveloppé par `src/lib/errors/route.ts` : parse Zod de l'entrée,
  exécution, mapping `AppError` → statut HTTP.
- Réponse d'erreur, toujours la même forme, jamais de détail technique :
  `{ "erreur": { "code": "TIPI_…", "cleContenu": "parent.scan.illisible.corps" } }`.
  La `cleContenu` dit à l'interface quel texte bienveillant afficher (PRD-16) ;
  aucun message technique n'est renvoyé, aucune trace de pile, aucun identifiant
  de requête (règle opposable de la section 9 du marketing).
- `400 TIPI_VALIDATION` en cas d'échec Zod, sur toutes les routes, sans exception.
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
| Erreurs | `500 TIPI_INTERNE` → l'interface bascule sur `/parent` avec `parent.aiguillage.bandeau` ; **jamais une page d'erreur à l'enfant** |

## 8.2 Capture et analyse (V2)

| | |
| --- | --- |
| **`POST /api/devoirs/photo`** | `multipart/form-data`, PRD-03 |
| Entrée | `photo: File` (≤ 8 Mo, `image/jpeg\|png\|webp`) |
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
| Sortie | `{ programme: { etapes: [{ matiere, dureeEstimeeMin, exercices: [{ id, consigne, type }] }] (1..2), langueDetectee: "fr"\|"br"\|"mixte", reportes: string[] } }` |
| Erreurs | `422 TIPI_OCR_VIDE`, `422 TIPI_OCR_CONFIANCE_BASSE` → `parent.scan.illisible.*` ; `422 TIPI_AUCUN_EXERCICE` → `parent.apercu.vide.*` ; `502 TIPI_IA_SORTIE_INVALIDE` (après une relance), `502 TIPI_IA_INDISPONIBLE`, `504 TIPI_IA_TIMEOUT` → `parent.scan.analyse_echec.*` |
| Notes | Le regroupement à 2 étapes maximum est fait **côté serveur** après validation Zod, jamais laissé au modèle seul (PED-06). Les indices des exercices de maths sont pré-générés ici (TEC-07). Journalisation calibration si `family.calibration_active` (TEC-16). |

| | |
| --- | --- |
| **`GET /api/devoirs/programme`** | relecture de l'aperçu après un rafraîchissement |
| Sortie | même forme que ci-dessus, ou `404 TIPI_INTROUVABLE` |

## 8.3 Session (V3)

| | |
| --- | --- |
| **`POST /api/session`** | TEC-06 : seule porte d'entrée vers `/enfant` |
| Entrée | `{ etapes: [{ matiere: Matiere, exerciseIds: Uuid[], dureeEstimeeMin: number }] (1..2), soirLeger: boolean }` |
| Sortie | `{ session: Snapshot }` avec `etat = "idle"` |
| Erreurs | `409 TIPI_SESSION_DEJA_ACTIVE` (unique partiel), `400 TIPI_VALIDATION` si plus de 2 étapes (PED-06) |
| Note | Une soirée « pas de devoirs ce soir » crée une session avec `etapes: []` — autorisé uniquement par le drapeau explicite `sansDevoir: true`, pour qu'un programme vide accidentel reste une erreur. |

| | |
| --- | --- |
| **`GET /api/session/{id}`** | reprise (PRD-18) |
| Sortie | `Snapshot = { id, etat, etapeCourante, etapes, matiereCourante, exerciceCourant, indicesDejaVus: number, soirLeger, arretParent, pierresDuSoir: number }` |

| | |
| --- | --- |
| **`POST /api/session/{id}/transition`** | **la seule route qui mute l'état** |
| Entrée | `{ evenementId: Uuid, evenement: Evenement, etatAttendu: EtatSession }` |
| Sortie | `{ session: Snapshot, pierresCreditees: number, creditDiffere: boolean }` |
| Erreurs | `409 TIPI_TRANSITION_INVALIDE` **avec le snapshot courant dans la réponse**, pour que le client se recale sans rien perdre ; `404 TIPI_SESSION_INTROUVABLE` ; `403 TIPI_ABANDON_NON_AUTORISE` si `ABANDON_PARENT` sans cookie parent (PRD-13) |
| Idempotence | Un `evenementId` déjà présent dans `session.evenements` renvoie `200` avec le snapshot courant, **sans effet de bord**. `etatAttendu` différent de l'état persisté ⇒ `409` sans effet de bord. Le double appui rapide est donc sans conséquence. |
| Crédit différé | Si l'écriture des pierres échoue alors que la transition a réussi, la réponse porte `creditDiffere: true` : l'écran de clôture joue `bravo.pierres_plus_tard` et le crédit est rejoué au prochain appel (ETH-04). |

| | |
| --- | --- |
| **`POST /api/session/{id}/tentative`** | trace d'une tentative (PRD-18, PRD-06) |
| Entrée | `{ exerciseId: Uuid, statut: "en_cours"\|"terminee"\|"passee"\|"bloquee", nbIndicesUtilises: 0..4, nbSollicitations: number, transcription?: string (≤ 4000), motsHesitants?: string[] }` |
| Sortie | `{ attemptId: Uuid }` |
| Note | Upsert sur `(sessionId, exerciseId)` : la reprise met à jour la même ligne, les indices déjà déroulés restent déroulés (7.6). |

| | |
| --- | --- |
| **`GET /api/session/{id}/resume`** | PRD-06 |
| Sortie | `{ date: string, etapes: [{ matiere, statut: "terminee"\|"passee" }], observations: string[], motsARevoir: string[], audios: [{ attemptId, disponible: boolean }] }` |
| Règle | **Aucun nombre** dans la sortie hormis la date : ni durée, ni pierres, ni compte de mots. Les observations sont choisies dans la table de 7.12 à partir des faits de `session.evenements` et des `attempt`. |

## 8.4 Voix et indices (V4, V5)

| | |
| --- | --- |
| **`POST /api/voix`** | TEC-08, TEC-09b |
| Entrée | `{ source: "banque", situationId: string, varianteId: string, jetons?: { prenom?: boolean, matiere?: "lecture"\|"maths" } }` \| `{ source: "rituel", ligneId: string }` \| `{ source: "ui", cle: string }` \| `{ source: "exercice", exerciseId: Uuid, champ: "consigne"\|"contenu"\|"indice", niveau?: 1..4 }` |
| Sortie | `{ url: string, texte: string, cache: "hit"\|"miss" }` |
| Erreurs | `404 TIPI_INTROUVABLE` (identifiant inconnu), `502 TIPI_TTS_INDISPONIBLE` → `lecture.sans_voix.*`, `429 TIPI_TTS_QUOTA` |
| **Décision** | La route **n'accepte jamais de texte libre**. Elle résout elle-même le texte depuis `content/**` ou depuis la base. Deux raisons : un client ne peut pas brûler le quota TTS avec du texte arbitraire, et le rendu du jeton `{prenom}` reste côté serveur. |

| | |
| --- | --- |
| **`POST /api/voix/transcrire`** | repli STT de TEC-09, **contrat défini, non implémenté en V1** |
| Entrée | `{ audio: File (≤ 10 Mo), langue: "fr-FR" }` |
| Sortie | `{ transcription: string, confiance: number }` |
| État | Renvoie `501 TIPI_NON_IMPLEMENTE` tant que le test avec la voix d'Evan n'a pas conclu (section 18, point 1). |

| | |
| --- | --- |
| **`POST /api/indices`** | PED-02, TEC-07 |
| Entrée | `{ exerciseId: Uuid, niveau: 1..4 }` |
| Sortie | `{ niveau: 1..4, texte: string, dernier: boolean }` |
| Erreurs | `400 TIPI_VALIDATION` si `niveau` > 4 ou si le niveau demandé dépasse de plus de 1 le dernier servi ; `502 TIPI_INDICES_INDISPONIBLES` → `maths.sans_indice.*` |
| Règles | **Un indice par appel**, jamais le tableau complet : le client ne peut pas afficher le niveau 4 d'emblée. Si `exercise.indices` est nul, génération de secours par `AiProvider` (TEC-07) ; si elle échoue, l'état de repli ne donne **jamais** le résultat (charte, point 6). |

## 8.5 Coffre (V6)

| | |
| --- | --- |
| **`GET /api/coffre`** | PRD-14 |
| Sortie | `{ solde: number, palierSuivant: { gemsRequis: number, reste: number } \| null, cosmetiques: [{ id, nom, seuil, debloque: boolean, actif: boolean }] }` |
| Règle | `palierSuivant.description` **n'est pas dans la sortie** : le texte libre du parent ne descend jamais vers un écran enfant (ETH-05, décision 7.9). |
| Erreurs | `502 TIPI_INTERNE` → `coffre.souci.*` |

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
| `POST /api/reglages/code/verifier` | `{ code: string (10 chiffres) }` | `{ ok: true }` + cookie parent | `401 TIPI_CODE_INVALIDE` + `{ essaisRestants }`, `423 TIPI_CODE_BLOQUE` + `{ bloqueJusquA }`, `409 TIPI_CODE_ABSENT` (→ mode création) |
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

L'export ne contient **ni `code_hash`, ni payload d'IA brut d'un autre foyer**,
et la suppression est une seule transaction : en cas d'échec, rien n'est effacé
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
`etapes_prevues[etape_courante].matiere`. Une donnée en moins à maintenir
cohérente.

## 9.2 Table de transitions

`evenementId` et `etatAttendu` accompagnent chaque événement (section 8.3).

| # | Événement | Depuis | Garde | Vers | Effets de bord | Écrit en base |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `DEMARRER` | `idle` | session validée par le parent (TEC-06) | `annonce` | — | `etat`, `started_at`, journal |
| T2 | `PROGRAMME_VU` | `annonce` | `etapes_prevues` non vide | état de `etapes_prevues[0].matiere` | — | `etat`, `etape_courante = 0`, journal |
| T3 | `PROGRAMME_VU` | `annonce` | `etapes_prevues` vide (soirée sans devoir) | `termine` | **aucune pierre**, aucun rituel de clôture ; l'enfant voit `enfant.accueil.vide.*` et va au coffre | `etat`, `ended_at`, journal |
| T4 | `ETAPE_TERMINEE` | `etape_lecture`, `etape_maths` | une étape suit | `transition` | crédit +1 de la matière terminée | `etat`, ledger, `gem_balance`, journal |
| T5 | `ETAPE_TERMINEE` | `etape_lecture`, `etape_maths` | dernière étape | `cloture` | crédit +1, puis **+1 bonus si les deux étapes du soir sont terminées** | `etat`, ledger ×2, `gem_balance`, journal |
| T6 | `ETAPE_VIDE` | `etape_lecture`, `etape_maths` | l'étape n'a aucun exercice exploitable | `transition` ou `cloture` selon la suite | **aucun crédit** : l'étape n'a pas été faite. Textes `lecture.vide.*` / `maths.vide.*` | `etat`, journal |
| T7 | `TRANSITION_VUE` | `transition` | — | état de `etapes_prevues[etape_courante + 1].matiere` | — | `etat`, `etape_courante += 1`, journal |
| T8 | `PAUSE_DEMANDEE` | `etape_lecture`, `etape_maths` | — | `pause` | **aucune pierre retirée, jamais** (PRD-12, ETH-04) ; fait « pause prise » pour le résumé | `etat`, journal |
| T9 | `PAUSE_TERMINEE` | `pause` | — | état de `etapes_prevues[etape_courante].matiere` | — | `etat`, journal |
| T10 | `CLOTURE_VUE` | `cloture` | — | `termine` | génération du résumé (PRD-06), notification locale au parent | `etat`, `resume`, `ended_at`, journal |
| T11 | `ABANDON_PARENT` | `annonce`, `etape_lecture`, `etape_maths`, `transition`, `pause` | **cookie parent valide** (PRD-13) | `abandon_parent` | crédit des étapes déjà terminées et non encore créditées ; résumé « séance arrêtée » | `etat`, `arret_parent = true`, `ended_at`, `resume`, ledger, journal |
| T12 | `BLOCAGE` | `etape_lecture`, `etape_maths` | `nb_sollicitations >= BLOCAGE_NB_SOLLICITATIONS` | **inchangé** | fait « blocage » pour le résumé ; l'interface propose pause ou suite (PED-08) | journal, `attempt` |

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
5. effets de bord de la table 9.2, dont les crédits de pierres ;
6. `UPDATE session` : `etat`, `etape_courante`, horodatages, `evenements`
   augmenté d'une ligne ;
7. commit.

**La persistance est donc écrite à chaque transition, dans la même transaction
que ses effets**, jamais après coup et jamais en différé. Une coupure de courant
laisse soit l'ancien état complet, soit le nouveau état complet.

**Reprise** : `GET /api/etat` cherche la session dont l'état n'est ni `termine`
ni `abandon_parent` et renvoie la route de l'état. Le client repart avec le
snapshot, les indices déjà déroulés (`attempt.nb_indices_utilises`) et
l'exercice en cours. Aucune information de reprise n'est lue dans le navigateur.

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
| `TIPI_SESSION_DEJA_ACTIVE` | 409 | parent | `parent.apercu.lancement_echec.*` |
| `TIPI_TRANSITION_INVALIDE` | 409 | — | aucun message : le client se recale sur le snapshot |
| `TIPI_ABANDON_NON_AUTORISE` | 403 | parent | `reglages.code.refuse` |
| `TIPI_TTS_INDISPONIBLE` | 502 | enfant | `lecture.sans_voix.*` |
| `TIPI_TTS_QUOTA` | 429 | enfant | `lecture.sans_voix.*` |
| `TIPI_STT_INDISPONIBLE` *(client)* | — | enfant | `lecture.micro_absent.*` |
| `TIPI_MICRO_REFUSE` *(client)* | — | enfant | `lecture.micro_absent.*` |
| `TIPI_TRANSCRIPTION_VIDE` *(client)* | — | enfant | `lecture.pas_entendu.*` (PED-09) |
| `TIPI_INDICES_INDISPONIBLES` | 502 | enfant | `maths.sans_indice.*` |
| `TIPI_CREDIT_DIFFERE` | 200 + drapeau | enfant | `bravo.pierres_plus_tard*` |
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

## 10.2 Correspondance avec les quatre états limites de PRD-16

| État limite PRD-16 | État applicatif | Chemin de récupération, garanti |
| --- | --- | --- |
| **Aucun devoir chargé ce soir** | Session à `etapes_prevues: []`, transition T3, `etat = termine` | Écran `/enfant` en état vide, bouton « Voir mon coffre ». Côté parent : `parent.scan.sans_devoir.*`, aucune relance. Aucune pierre, aucun rituel de clôture mensonger. |
| **OCR illisible** | `TIPI_OCR_VIDE` ou `TIPI_OCR_CONFIANCE_BASSE`, seuil `OCR_CONFIANCE_MIN` | Écran parent `parent.scan.illisible.*` : reprendre la photo **ou** saisir à la main (`POST /api/devoirs/saisie-manuelle`, toujours disponible). **Jamais montré à l'enfant.** |
| **Blocage total sur un exercice** | Transition T12, `attempt.statut = bloquee` | `maths.blocage.*` ou `lecture.blocage.*` : pause ou passage à la suite. Aucune pierre retirée, aucun commentaire. En maths, le repli `maths.sans_indice.*` ne donne jamais le résultat. |
| **Session interrompue et reprise plus tard** | La session reste dans son état persisté ; `GET /api/etat` la retrouve | `enfant.accueil.reprise.*`, puis `lecture.reprise.*` / `maths.reprise.*`. Les indices déjà déroulés restent déroulés. Aucune mention du temps écoulé. |

Cinq états limites supplémentaires, non nommés par PRD-16 mais présents dans le
livrable marketing, ont eux aussi un code et une sortie : voix indisponible
(`lecture.sans_voix`), micro indisponible (`lecture.micro_absent`), indices
indisponibles (`maths.sans_indice`), crédit de pierres différé
(`bravo.pierres_plus_tard`), coffre indisponible (`coffre.souci`).

**Aucun état de cette section n'est une impasse** : chacun a au moins un bouton.

---

# 11. Variables d'environnement

25 variables. Colonne « côté » : `serveur` = jamais dans le bundle ;
`public` = inlinée par Next.js, donc **jamais un secret**.

| Variable | Côté | À quoi elle sert | Si elle manque |
| --- | --- | --- | --- |
| `DATABASE_URL` | serveur | Connexion Prisma via le pooler Supabase (TEC-02, TEC-03) | **Le serveur ne démarre pas**, message nommant la variable |
| `DIRECT_URL` | serveur | Connexion directe pour `prisma migrate` | Démarrage refusé ; migrations impossibles |
| `SUPABASE_URL` | serveur | Point d'entrée Storage | Démarrage refusé |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | Téléversement, URL signées, purge | Démarrage refusé |
| `NEXT_PUBLIC_TTS_CACHE_URL` | public | Préfixe public des clips TTS déjà synthétisés | Le client ne tente pas le cache direct et passe par `POST /api/voix` : plus lent, jamais cassé |
| `AI_PROVIDER` | serveur | Choix de l'implémentation `AiProvider` (TEC-17) | Défaut `deepseek` |
| `DEEPSEEK_API_KEY` | serveur | Authentification du fournisseur | Démarrage **accepté** ; l'analyse renvoie `TIPI_IA_INDISPONIBLE` et le parent bascule sur la saisie manuelle. Une soirée reste possible. |
| `DEEPSEEK_BASE_URL` | serveur | Point d'entrée du fournisseur | Défaut `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | serveur | Modèle appelé | Défaut `deepseek-chat` |
| `AI_TIMEOUT_MS` | serveur | Abandon d'un appel trop long | Défaut `20000` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | serveur | Compte de service Vision (OCR) et Text-to-Speech | Démarrage accepté ; OCR → `TIPI_OCR_VIDE` (saisie manuelle), TTS → `lecture.sans_voix`, les textes restent affichés (PED-10) |
| `VOICE_PROVIDER` | serveur | Choix de l'implémentation `VoiceProvider` (TEC-08) | Défaut `google-chirp3` |
| `NEXT_PUBLIC_SPEECH_PROVIDER` | public | Choix du `SpeechProvider` dans le navigateur (TEC-09) — pas un secret | Défaut `web-speech` |
| `PARENT_SESSION_SECRET` | serveur | Signature du cookie de session Réglages (PRD-15) | **Le serveur ne démarre pas.** Un secret par défaut ouvrirait les Réglages à qui connaît le code source |
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
d'architecture, pas un accident : une clé d'IA manquante ne doit pas empêcher un
enfant de faire sa lecture.

---

# 12. Budget de latence et stratégie de cache TTS

## 12.1 Budget par interaction

Règle générale TEC-12 : **toute attente dépassant 400 ms est habillée par
« Pilou réfléchit »** (composant `src/components/pilou/PilouReflechit.tsx`, plus
`son_pilou_reflechit` et le texte `enfant.attente.pilou`). Le seuil est une
constante unique, pas une valeur répétée dans les composants.

| Interaction | Budget p95 | Composition | Habillage |
| --- | --- | --- | --- |
| Aiguillage `/` | 300 ms | 1 requête indexée `session(child_id, etat)` | écran de lancement, sans texte |
| Ajout d'une photo | 2,5 s | compression client ~300 ms + transfert ~1 Mo + écriture Storage | vignette en attente, côté parent |
| **Analyse complète** | 15 s, abandon à 20 s | OCR 1,5–3 s par photo (jusqu'à 4 en parallèle) + structuration < 50 ms + prompt 1 : 4–10 s + prompts 2 et 3 en parallèle : 3–8 s | `parent.scan.analyse_en_cours` + `analyse_duree` (« une quinzaine de secondes »), côté parent uniquement |
| Lancer la session | 400 ms | création de session, 1 transaction | bouton en attente |
| **Transition d'étape** | 150 ms | 1 transaction : verrou, journal, ledger, solde | aucun habillage nécessaire ; « Pilou réfléchit » au-delà de 400 ms |
| Indice pré-généré | 120 ms | 1 lecture `exercise.indices` | aucun |
| Indice de secours (TEC-07) | 3–8 s | 1 appel `AiProvider` | « Pilou réfléchit » |
| **TTS, cache touché** | 150 ms | `GET` direct sur le bucket public, CDN | aucun : Pilou parle tout de suite |
| **TTS, cache manqué** | 900 ms | route serveur + synthèse + écriture Storage | « Pilou réfléchit » |
| STT | local | Web Speech API, dans le navigateur | `lecture.micro.en_cours` (affiché, Pilou se tait) |
| Coffre | 200 ms | 1 lecture `child` + paliers | aucun |
| Vérification du code parent | 250–400 ms | argon2id, **coût volontaire** (SEC-01/02) | bouton en attente |

## 12.2 Cache TTS (TEC-09b)

**Clé de cache** : `sha256(voixId + "|" + modele + "|" + texteRendu)`.
**Chemin** : `tts-cache/<voixId>/<sha256>.mp3`, bucket public en lecture.

Le chemin est **déterministe** : le client peut calculer l'URL et tenter le
`GET` directement, sans appel serveur. C'est la raison pour laquelle il n'existe
pas de table `tts_cache` — une table imposerait un aller-retour serveur sur
chaque phrase et créerait un second état à garder cohérent avec Storage.

Séquence, côté client :

1. calculer la clé du texte rendu (le texte est déjà connu : il vient de
   `content/**` ou de la réponse d'une route) ;
2. `GET {NEXT_PUBLIC_TTS_CACHE_URL}/<voixId>/<clé>.mp3` ;
3. `200` → lecture immédiate (150 ms) ;
4. `404` → `POST /api/voix` → le serveur synthétise, écrit dans le bucket,
   renvoie l'URL. La phrase est en cache pour toujours.

**Ce qui est pré-chauffé** (`scripts/prewarm-tts.ts`, joué au déploiement). Le
corpus fixe a été mesuré sur les fichiers réellement livrés en P1bis :

```
$ node -e "…" (mesure sur content/encouragements.json et content/gwenn-scripts.json)
clips a synthetiser (textes distincts) : 474
caracteres total du corpus fixe        : 21016
longueur moyenne d'un clip             : 44.3
quota mensuel Chirp3-HD offert         : 1 000 000 caracteres
part du quota consommee UNE SEULE FOIS : 2.10 %
```

474 clips parce que les 25 entrées `affiche` ne sont jamais lues et que les
20 variantes portant `{matiere}` comptent double (ARB-06).

**Ce qui n'est pas pré-chauffable** : le texte propre au devoir du soir —
consignes reformulées, texte de lecture, indices, questions. Estimation par
soirée : texte de lecture ~300 caractères, 2 questions ~120, 4 consignes ~360,
3 exercices de maths × 4 indices × ~120 = ~1 440 → **~2 200 caractères par
soirée**, soit ~48 000 par mois sur 22 soirs d'école. C'est l'ordre de grandeur
annoncé en section 8 du prompt maître (~45 000/mois), et **moins de 5 % du
quota gratuit**.

Sans le cache, le seul bouton « Réécouter », qui est disponible **sans limite**
(7.5), suffirait à faire exploser ce budget. C'est exactement ce que TEC-09b
demande d'éviter.

**Purge** : aucune. Le corpus fixe pèse quelques dizaines de mégaoctets et ne
contient aucune donnée personnelle. La purge de SEC-05 ne concerne que le bucket
`audios`, c'est-à-dire la voix de l'enfant.

---

# 13. TEC-16 — seuils de calibration

**Un seul fichier** : `src/config/seuils.config.ts`. Il lit `env.ts`, valide, et
exporte un objet gelé :

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
verticale, les éléments d'architecture livrés et les dépendances réelles.

| V | Contenu | Éléments d'architecture livrés | Dépend de |
| --- | --- | --- | --- |
| **V1** | Socle | `prisma/schema.prisma` appliqué, `supabase/policies.sql` appliqué, `src/config/env.ts`, `seuils.config.ts`, `pierres.config.ts`, `src/lib/db/prisma.ts`, `src/lib/errors/**`, `src/content/**` (chargeur + Zod), **`content/ui-enfant.json` et `content/ui-parent.json` extraits du marketing 7.1→7.14**, `prisma/seed.ts` (Evan + palier d'exemple), `src/lib/dates/age.ts` | G3 (design system) |
| **V2** | Capture & analyse IA | `src/lib/ocr/**`, `src/lib/ai/**` (interface, fabrique, 3 prompts, 3 schémas Zod, anonymisation), routes 8.2, `CalibrationLog` | V1 |
| **V3** | Moteur de session | `src/lib/session/machine.ts` (pure), `service.ts`, routes 8.3, reprise via `GET /api/etat`, pause | V1 ; **V2 pour un programme réel**, mais la machine se teste sur un programme forgé : V3 peut démarrer dès que V1 est verte |
| **V4** | Module Lecture | `src/lib/voice/**` (+ cache + `scripts/prewarm-tts.ts`), `src/lib/speech/**`, `src/lib/lecture/matching.ts`, `questions.ts`, routes 8.4 voix | V3 |
| **V5** | Module Maths | `src/lib/maths/indices.ts`, `POST /api/indices`, secours TEC-07 | V3, et V2 pour les indices pré-générés |
| **V6** | Pierres & Coffre | `src/lib/pierres/**`, `GET /api/coffre`, `POST /api/coffre/cosmetique`, `scripts/verifier-solde.ts` | V3 (le crédit est un effet de transition) |
| **V7** | Réglages & code parent | `src/lib/parent/code.ts`, `session-parent.ts`, routes 8.6, les 8 sous-pages | V1 |
| **V8** | Espace parent | Écrans `/parent`, `/parent/programme`, `/parent/resume`, `src/lib/parent/resume.ts`, `src/lib/notifications/locale.ts` | V2 et V3 ; V6 pour l'affichage du solde en Réglages |
| **V9** | Onboarding, états limites, son, icône, polish | `/bienvenue`, les neuf états limites de la section 10.2, thèmes commutés à chaud, sons | toutes |

**Ordre** : V1 → V2 → V3 en série (comme le veut `GATES.md`), puis V4, V5, V6 en
parallèle, puis V7 et V8, puis V9. Deux précisions par rapport au tableau de
`GATES.md` :

1. **V7 ne dépend que de V1** : le code parent, son hash et son blocage ne
   touchent ni la session ni l'IA. Il peut donc être développé en parallèle de
   V2 et V3 si l'Orchestrateur veut paralléliser plus tôt. Il le faut même
   partiellement : la sortie anticipée de PRD-13, exercée par V3, exige le
   cookie parent de V7. **Dépendance croisée à arbitrer** — voir section 18,
   point 2.
2. **V6 dépend de V3** et non l'inverse : le crédit de pierres est un effet de
   bord de transition. Développer V6 avant V3 obligerait à écrire une route de
   crédit autonome, c'est-à-dire exactement ce que SEC-06 interdit.

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
| SDK DeepSeek ou OpenAI | Un `fetch` suffit, et **ne pas avoir de dépendance de fournisseur est la meilleure preuve de TEC-17** |
| `xstate` ou autre bibliothèque de machine à états | La machine de 3.3 tient en une fonction pure d'une soixantaine de lignes, entièrement testable. Une bibliothèque ajouterait un vocabulaire à apprendre pour neuf états |
| `trpc`, `graphql` | 32 chemins de route à contrat fixe, déjà typées par Zod |
| Un `repository` au-dessus de Prisma | Prisma **est** la couche d'accès. Une couche par-dessus n'aurait aucun second implémenteur |
| `web-push`, service worker, table d'abonnements | PRD-06 demande une notification ; TEC-18 dit un seul appareil. L'API `Notification` du navigateur, sur le même appareil, suffit. Le Web Push part dans `BACKLOG-V2.md` comme évolution multi-appareils |
| `date-fns`, `dayjs` | `Intl` et les dates natives suffisent pour un âge et une date de séance (PRD-02) |
| `uuid` | `crypto.randomUUID()` |
| une bibliothèque de distance de Levenshtein | 20 lignes, et le seuil doit rester dans `seuils.config.ts` (TEC-16) |
| `framer-motion` | DES-08 demande des animations courtes et douces : CSS suffit, et une bibliothèque d'animation invite aux effets que DES-08 interdit |
| `sharp` | La compression d'image se fait dans le navigateur, avant envoi |
| une table `tts_cache` | Le chemin est déterministe (section 12.2) |
| des policies RLS par famille | Aucune authentification en V1 (section 4) |
| un `middleware.ts` d'authentification globale | Une seule famille de routes est protégée (`/api/reglages/**`) : la garde est explicite dans ces handlers, donc visible et testable, plutôt que diffuse dans un middleware |

---

# 16. Tableau de couverture REQ-TEC et REQ-SEC

Une ligne par exigence, l'élément d'architecture **nommé** qui la porte, et
comment.

| ID | Élément d'architecture nommé | Comment |
| --- | --- | --- |
| TEC-01 | Arborescence `src/app/**` (App Router), `tsconfig` strict, `tailwind.config.ts`, `pnpm` | Section 2 ; aucun dossier `pages/`, tous les écrans de 3.1 sont des segments App Router |
| TEC-02 | `prisma/schema.prisma` (datasource postgresql), `supabase/policies.sql` (3 buckets), `SUPABASE_URL` | Projet Supabase en région UE, Postgres + Storage |
| TEC-03 | `prisma/schema.prisma` | 10 modèles conformes à 3.7, section 3.1 champ par champ |
| TEC-04 | `src/stores/session-ui.ts` (Zustand), `src/hooks/**` (TanStack Query) | Zustand ne porte que l'affichage (D2), les données serveur passent par Query |
| TEC-05 | `src/lib/ocr/providers/google-vision.ts` → `src/lib/ocr/normalisation.ts` → `src/lib/ai/providers/deepseek.ts` | Pipeline 3.2 en 5 étapes isolées ; `AiProvider` n'accepte aucune image, donc le mode vision est structurellement inaccessible (5.4) |
| TEC-06 | `POST /api/session` | Seule création de session ; `/enfant` est inatteignable sans une session en base, et `GET /api/etat` renvoie `/parent` sinon |
| TEC-07 | `exercise.indices` (Json), `POST /api/devoirs/analyse` (pré-génération), `POST /api/indices` (secours) | Les 4 indices sont écrits à l'analyse ; la génération dynamique n'est appelée que si `indices` est nul |
| TEC-08 | `src/lib/voice/provider.ts` (`VoiceProvider`), `providers/google-chirp3.ts`, `src/config/mascot.config.ts` | Fabrique sur `VOICE_PROVIDER` ; la voix est figée dans `mascot.config.ts` et **n'est pas une variable d'environnement** (5.2) |
| TEC-09 | `src/lib/speech/provider.ts` (`SpeechProvider`), `providers/web-speech.ts`, `NEXT_PUBLIC_SPEECH_PROVIDER`, contrat `POST /api/voix/transcrire` | Web Speech en V1 ; le repli Google a son interface, sa valeur de configuration et son contrat de route, non implémenté et déclaré tel quel (5.3, section 18) |
| TEC-09b | `src/lib/voice/cache.ts`, bucket public `tts-cache`, `scripts/prewarm-tts.ts` | Clé sha256 déterministe, 474 clips pré-chauffés = 2,10 % du quota une seule fois, ~5 %/mois en usage (12.2) |
| TEC-10 | `src/lib/session/machine.ts` (fonction pure), `EtatSession` (enum Prisma), table 9.2 | 9 états, 12 transitions, toute paire non listée est refusée en 409 |
| TEC-11 | `src/lib/pierres/service.ts`, `POST /api/session/:id/transition` | Seul chemin d'écriture, section 7, cinq points de démonstration |
| TEC-12 | `src/components/pilou/PilouReflechit.tsx`, seuil unique 400 ms, `enfant.attente.pilou` | Budget de latence 12.1 : chaque interaction au-dessus de 400 ms est nommée et habillée |
| TEC-13 | Décision D1, `src/config/env.ts` vs `env.client.ts`, 3 variables publiques sans secret | Aucun client Supabase, Google ou IA dans le navigateur ; contrôle `grep` sur `.next/static` en section 11 |
| TEC-14 | `package.json` scripts `typecheck`, `lint`, `test`, `build` ; aucune dépendance native exotique | Décidé ici, exécuté par les verticales |
| TEC-15 | `10-stack.mdc`, taxonomie d'erreurs typée (`src/lib/errors/codes.ts`) plutôt que chaînes libres | Aucune union ouverte, donc pas de `any` de confort dans la gestion d'erreur |
| TEC-16 | `src/config/seuils.config.ts`, modèle `CalibrationLog`, `family.calibration_active`, routes `/api/reglages/calibration` | Seuils en un seul endroit, journalisation des 20 premières analyses avec **le seuil en vigueur** (section 13) |
| TEC-17 | `src/lib/ai/provider.ts`, `src/lib/ai/index.ts`, `src/lib/ai/providers/deepseek.ts`, `AI_PROVIDER` | Un seul fichier connaît le fournisseur ; aucun SDK de fournisseur dans `package.json` ; règle `grep` opposable (5.1) |
| TEC-18 | Modèle `Session` (`etat`, `etapes_prevues`, `etape_courante`, `evenements`), décision D2, partie E de `policies.sql` | Tout l'état de parcours est en base, y compris `child.onboarding_termine_le` ; le passage à deux appareils est décrit en 4 étapes sans toucher au moteur |
| SEC-01 | `settings_access.code_hash`, `src/lib/parent/code.ts` (`@node-rs/argon2`) | Aucune route ne renvoie le hash ; aucun journal ne reçoit le code ; aucun code par défaut n'est livré |
| SEC-02 | `settings_access.tentatives_echouees`, `bloque_jusqu_a`, `CODE_MAX_TENTATIVES`, `CODE_BLOCAGE_PALIERS_SEC`, `POST /api/reglages/code/verifier` | Blocage progressif après 5 essais, compteur en base (pas en mémoire de processus), CHECK `>= 0` |
| SEC-03 | `supabase/policies.sql` parties A et D | RLS activée sur les 10 tables, aucune policy pour `anon`/`authenticated`, `REVOKE`, et 6 requêtes de preuve rejouables |
| SEC-04 | `src/lib/ai/anonymisation.ts`, typage de `AiProvider`, `calibration_log.payload_ia` | Trois barrières : type, constructeur unique, garde d'exécution ; la preuve est lisible en base (section 6) |
| SEC-05 | `family.retention_audio_jours`, bucket privé `audios`, `POST /api/cron/purge-audios`, `CRON_SECRET`, `/api/reglages/audio` | Purge planifiée et paramétrable, durée bornée par CHECK, `attempt.audio_url` remis à null |
| SEC-06 | `src/lib/pierres/service.ts` (recalcul `SUM(delta)`), CHECK `delta > 0`, unique `(session_id, raison)`, absence de route de crédit | Section 7 : cinq points, dont l'absence totale de chemin client |
| SEC-07 | `GET /api/reglages/donnees/export`, `DELETE /api/reglages/donnees`, sous-page 7.14 | Export en une pièce jointe JSON, suppression en une transaction (rien de partiel), sans `code_hash` |
| SEC-08 | Cookie parent httpOnly signé, `src/lib/parent/code.ts` isolé de `src/lib/ai/**`, aucune entrée Réglages sur un écran enfant | Le code n'entre jamais dans un payload d'IA (il n'est pas dans le domaine de `AiProvider`), ni dans une réponse, ni dans un log |

---

# 17. `prisma validate` — sortie réelle

**Contexte honnête** : le dépôt n'a pas encore de `package.json` — il sera créé
en V1. J'ai donc installé le CLI Prisma dans mon répertoire de travail
temporaire, hors du dépôt, et validé le fichier livré, depuis la racine du
projet. Le dépôt n'a reçu **aucun fichier** de cette installation.

Sortie réelle, collée telle quelle. `$SP` est mon répertoire de travail
temporaire, hors du dépôt. Les deux commandes ci-dessous sont **exactement**
celles que j'ai exécutées en dernier, dans cet ordre :

```
$ cd /home/user/Tipi && npm install prisma@5.22.0 --prefix $SP --no-audit --no-fund
added 6 packages in 4s

$ DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
  DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
  $SP/node_modules/.bin/prisma validate --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
---exit:0---
```

Version du CLI employé :

```
$ prisma -v
prisma                  : 5.22.0
@prisma/client          : Not found
Computed binaryTarget   : debian-openssl-3.0.x
Operating System        : linux
```

Le fichier livré est en outre passé par `prisma format` avant cette validation
(sortie : `Formatted prisma/schema.prisma in 33ms 🚀`), puis revalidé — c'est la
sortie ci-dessus.

`DATABASE_URL` et `DIRECT_URL` sont renseignées avec des valeurs factices, ce
que `prisma validate` exige pour résoudre `env()` ; **aucune base n'a été
contactée** et le dépôt n'a reçu aucun fichier de cette installation.

**Limite de ce contrôle, énoncée franchement** : `prisma validate` vérifie la
grammaire et la cohérence du schéma. Il ne vérifie **ni** la conformité à la
section 3.7, **ni** l'existence des contraintes SQL de `policies.sql`. Ces deux
points se contrôlent à la lecture (section 3.1) et par les requêtes de la
partie D de `policies.sql`, sur une vraie base.

Commande à rejouer par `controle-architecture`, vérifiée telle quelle :

```
mkdir -p /tmp/prisma-check \
&& cd /home/user/Tipi \
&& npm install prisma@5.22.0 --prefix /tmp/prisma-check --no-audit --no-fund \
&& DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
   DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
   /tmp/prisma-check/node_modules/.bin/prisma validate --schema prisma/schema.prisma
```

---

# 18. Points que je veux voir tranchés

Cinq points. Les trois premiers engagent du code, les deux derniers sont des
incohérences de nommage que je n'ai pas autorité pour corriger.

1. **Le repli STT de TEC-09.** Je n'implémente pas Google Cloud Speech-to-Text
   en V1 : l'interface, la valeur de configuration et le contrat de route
   existent, l'implémentation renvoie `501`. Motif : TEC-09 la conditionne à un
   constat d'insuffisance sur la voix d'Evan, et la section 8.4 dit que ce
   constat demande des enregistrements réels. Livrer l'implémentation
   maintenant, c'est du code jamais exercé ; ne pas la livrer, c'est une
   exigence partiellement couverte que `recette-finale` comptera comme non
   couverte. **Question fermée : TEC-09 est-elle réputée couverte par
   l'interface plus Web Speech, le repli Google étant conditionné au test
   humain ?**

2. **Dépendance croisée V3 / V7.** La sortie anticipée de PRD-13, exercée par le
   moteur de session (V3), exige le cookie parent produit par V7. Soit V7 passe
   avant V3, soit V3 livre la transition `ABANDON_PARENT` avec une garde
   refusant tout tant que V7 n'est pas là. Je recommande la seconde : la garde
   est testable (`403 TIPI_ABANDON_NON_AUTORISE`) et ne bloque rien.

3. **Une étape vide ne crédite aucune pierre** (transition T6). Une étape sans
   exercice exploitable n'a pas été faite par l'enfant, et le barème de 3.7 dit
   « +1 par étape **terminée** ». L'enfant ne voit aucun nombre hors du coffre,
   donc rien ne lui signale ce qui manque. Je le signale parce que c'est une
   décision de barème, et que le barème appartient au produit.

4. **`content/gwenn-scripts.json`** — déjà ouvert en ESC-001. Mon arborescence
   place la mascotte dans `src/components/pilou/`, alors que la règle
   `30-copy-enfant.mdc` cible `src/components/gwenn/**`. Si le nom du composant
   reste `pilou`, **la règle ne s'appliquera à aucun fichier** et les textes
   enfant échapperont au garde-fou. Correction minimale proposée, que je ne fais
   pas moi-même : étendre le glob à `src/components/{pilou,gwenn}/**`.

5. **`content/ui-enfant.json` et `content/ui-parent.json` n'existent pas.** Ils
   sont déclarés en 6.1 du marketing et consommés par tous les écrans. Leur
   contenu est intégralement dans les tableaux 7.1 à 7.14 : c'est une extraction,
   pas une rédaction. Je l'ai affectée à V1. Si l'Orchestrateur préfère la
   confier à `contenu-enfant` plutôt qu'à `dev-feature`, il faut le décider avant
   G3 : sans ces deux fichiers, la première verticale qui pose un écran écrira du
   texte en dur.
