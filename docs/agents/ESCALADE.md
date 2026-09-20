# Escalades — Tipi

Ce fichier est le **seul canal** entre l'équipe d'agents et l'humain. Chaque
entrée pose une **question fermée**, à laquelle on peut répondre en une phrase.

Réponds directement sous la question, dans la colonne « Réponse humaine ».

---

## ESC-000 — Les six éléments que les agents ne peuvent pas produire seuls

Ouverte le : 2026-09-20 · Par : Orchestrateur · Statut : **en attente**

Ces six points sont listés à la section 8 du prompt maître. Ils sont demandés
**maintenant**, et non à la fin, parce que chacun bloque une phase précise.
Le développement continue sans attendre sur tout ce qui n'en dépend pas.

### 1. Les comptes et les clés

**Bloque** : G4.V1 en exécution réelle (le code et les tests se développent avec
des bouchons, mais rien ne tourne contre le vrai service), G4.V2 (OCR + IA),
G4.V4 (TTS), G8 (déploiement).

Comptes à créer, tous dimensionnés pour rester dans les quotas gratuits :

| Service | Usage | Contrainte |
| --- | --- | --- |
| Supabase | Postgres + Storage | **projet en région UE** (TEC-02) |
| DeepSeek | Analyse de texte uniquement | jamais d'image envoyée (3.2) |
| Google Cloud Vision | OCR `DOCUMENT_TEXT_DETECTION` | aucune configuration préalable |
| Google Cloud Text-to-Speech | Voix Chirp3-HD | ~45 000 caractères/mois contre 1 M offerts |
| Vercel | Hébergement | variables serveur uniquement |

La reconnaissance vocale passe par le navigateur (Web Speech API) : ni compte,
ni quota.

> **Question fermée** : peux-tu créer ces cinq comptes et me déposer les clés
> dans un `.env.local` non versionné — oui ou non ?

**Réponse humaine** : _(en attente)_

---

### 2. Le code parent à 10 chiffres

**Bloque** : G4.V7 en usage réel. Les agents implémentent la saisie, le hash
(argon2id) et la limitation de tentatives ; ils ne fixent **jamais** la valeur.

> **Question fermée** : confirmes-tu que tu saisiras toi-même le code à 10
> chiffres au premier lancement, sans jamais l'écrire dans le dépôt — oui ou non ?

**Réponse humaine** : _(en attente)_

---

### 3. De vraies photos de devoirs

**Ne bloque pas** le développement : Google Cloud Vision ne s'entraîne pas et ne
demande aucune configuration préalable. En revanche les **seuils** (confiance
minimale avant de déclarer « illisible », pré-traitement de l'image, tolérance
du matching de lecture) ne se règlent que sur du réel.

C'est exactement le rôle de **TEC-16** : le mode calibration journalise les 20
premières photos pour qu'une passe de réglage suive la première semaine d'usage.
Aucun agent ne figera ces seuils comme définitifs.

> **Question fermée** : acceptes-tu de livrer la V1 avec des seuils OCR
> provisoires, à régler après une semaine d'usage réel — oui ou non ?

**Réponse humaine** : _(en attente)_

---

### 4. Un test micro avec la voix d'Evan

**Bloque** : la validation finale de G4.V4 (module Lecture). La reconnaissance
vocale est structurellement moins fiable sur une voix d'enfant. Aucun agent ne
peut simuler ça : le seuil de tolérance du matching de lecture se règle sur des
enregistrements réels.

Le code sera livré avec un seuil par défaut **configurable**, pas constant.

> **Question fermée** : peux-tu faire lire trois phrases à Evan au micro du
> téléphone une fois la V4 livrée, pour caler le seuil — oui ou non ?

**Réponse humaine** : _(en attente)_

---

### 5. Le choix de la voix de Pilou

**Bloque** : la valeur définitive dans `src/config/mascot.config.ts` (TEC-08).
Le code sera livré avec une voix par défaut clairement marquée comme
provisoire, derrière l'interface `VoiceProvider`.

C'est un choix **subjectif et définitif** : changer la voix plus tard serait
vécu comme une rupture par un enfant de cet âge.

> **Question fermée** : peux-tu écouter les voix françaises féminines Chirp3-HD
> avec Evan et me donner l'identifiant exact de celle qu'il choisit — oui ou non ?

**Réponse humaine** : _(en attente)_

---

### 6. La décision sur le breton

**Bloque** : rien en V1. PED-13 acte le **mode dégradé** : texte affiché,
consigne expliquée en français par Pilou, aucune synthèse ni reconnaissance
vocale bretonne, aucune promesse faite à l'enfant sur ce point. C'est ce qui
sera implémenté par défaut.

L'alternative serait de contacter l'Office public de la langue bretonne pour un
accès à leur synthèse vocale — hors périmètre V1, à verser en V2 si tu le
souhaites.

> **Question fermée** : confirmes-tu le mode dégradé pour la V1, sans démarche
> auprès de l'Office public de la langue bretonne — oui ou non ?

**Réponse humaine** : _(en attente)_

---

## Ce qui avance sans attendre ces réponses

- **P1** (produit, marketing, contenu enfant) — aucune dépendance.
- **P2** (architecture, schéma Prisma, politiques RLS, contrats de routes) — aucune dépendance.
- **P3** (design system, deux thèmes, composants, Pilou en SVG) — aucune dépendance.
- **P4 V1 à V9** — le code s'écrit et se teste contre des bouchons et des
  fournisseurs simulés derrière `AiProvider`, `VoiceProvider` et `SpeechProvider`.
- **P5** (tests unitaires) et **P6** (recette E2E) — jouables sans clés réelles.

Seules l'exécution contre les vrais services et la mise en ligne attendent les
réponses ci-dessus.

---

## Escalades de désaccord producteur/contrôleur

Au troisième `FAIL` sur une même porte, l'Orchestrateur ouvre ici une entrée :
porte concernée, désaccord en trois lignes, options avec leurs conséquences,
question fermée.

*(aucune pour l'instant)*
