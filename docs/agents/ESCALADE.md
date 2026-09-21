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

## ESC-001 — Le fichier `content/gwenn-scripts.json` porte un nom incohérent

Ouverte le : 2026-09-20 · Par : Orchestrateur, sur remontée de `produit-marketing` · Porte : G1 · Statut : **en attente**

**Rien n'en dépend.** `contenu-enfant` avance avec le nom actuel, et le
renommage éventuel coûte une commande. Je remonte parce qu'un agent ne peut pas
corriger le prompt maître de sa propre autorité.

Le constat en trois lignes. La mascotte s'appelle **Pilou** partout dans le
prompt maître. Mais la section 5.1 impose à `contenu-enfant` de produire
`content/gwenn-scripts.json`, et la règle `30-copy-enfant.mdc` cible
`src/components/gwenn/**`. « Gwenn » semble être un reste d'une version
antérieure où la mascotte portait un autre nom — un nom breton, alors que la
section 1.3 pose explicitement que ni le nom, ni l'animal, ni l'univers visuel
ne font référence à la Bretagne.

| Option | Conséquence |
| --- | --- |
| Garder `gwenn-scripts.json` | Le dépôt garde un nom de fichier et un dossier de composants qui ne correspondent à rien dans le produit. Coût nul, confusion permanente pour tout agent qui arrive après. |
| Renommer en `pilou-scripts.json` et `src/components/pilou/**` | Cohérence totale. Impose de corriger le prompt maître en section 5.1 et la règle `30-copy-enfant.mdc`, donc de modifier la source de vérité en cours de route. |

> **Question fermée** : accepte-t-on de renommer `content/gwenn-scripts.json` en
> `content/pilou-scripts.json` et `src/components/gwenn/**` en
> `src/components/pilou/**`, en corrigeant le prompt maître en conséquence —
> oui ou non ?

**Réponse humaine (2026-09-21) : NON.** Statut : **close, tranchée**.

Le fichier garde le nom `content/gwenn-scripts.json` imposé par la section 5.1 du
prompt maître. **Aucun agent ne rouvre ce sujet.**

Ce qui est acquis et n'a jamais été en cause : le personnage s'appelle **Pilou**
partout. Vérifié le 2026-09-21 sur l'ensemble du dépôt — **zéro occurrence de
« Gwenn » comme nom de personnage** dans les 767 textes. Toutes les occurrences
restantes sont le nom du fichier, l'identifiant de schéma qui en dérive
(`tipi.gwenn-scripts.v2`), ou des phrases qui expliquent précisément cet écart.

Le seul point qui posait un vrai risque a été corrigé indépendamment de cette
question : le glob de `.cursor/rules/30-copy-enfant.mdc` ciblait un dossier
`src/components/gwenn/**` qui n'existera jamais, et la règle de rédaction pour
l'enfant serait restée silencieusement inactive pendant tout le développement.
Elle couvre désormais les chemins réels.

---

## Escalades de désaccord producteur/contrôleur

Au troisième `FAIL` sur une même porte, l'Orchestrateur ouvre ici une entrée :
porte concernée, désaccord en trois lignes, options avec leurs conséquences,
question fermée.

---

## ESC-002 — Porte G2 : troisième `FAIL`, sur un défaut découvert au dernier tour

Ouverte le : 2026-09-20 · Par : Orchestrateur · Porte : **G2, bloquée** · Statut : **en attente**

### Le désaccord en trois lignes

Il n'y a **pas** de désaccord entre le producteur et le contrôleur. Les trois
tours ont convergé : 24 des 25 constats des tours 1 et 2 sont clos, `prisma
validate` passe, et le contrôleur n'a relevé **aucun chiffre faux sur 26
grandeurs, pour le troisième tour consécutif**.

Le troisième `FAIL` porte sur un défaut **né au tour 3**, que personne n'avait
pu voir plus tôt parce qu'il n'apparaît qu'une fois ARB-13 appliqué : le
prédicat qui déclenche le bonus est défini sur les lignes `attempt`, écrites par
une autre route sans ordre garanti, alors que le crédit d'étape est déclenché
par l'événement de transition. Conséquence : **l'enfant termine sa soirée et
reçoit 2 pierres au lieu de 3**, et le « Soir léger » redevient détectable.

Le contrôleur écrit lui-même que « l'architecture est bonne et prête », que la
correction tient en **une phrase en §9.4 et une ligne de commentaire en §9.5**,
sans aucun changement de schéma, de route, de contrainte ni de chiffre — et
qu'il ne minore pas le constat parce que c'est le dernier tour. Il a raison sur
les deux points.

### Ce qui bloque, et pourquoi je ne décide pas seul

La règle 6.4 du prompt maître est mécanique : au troisième `FAIL`, l'Orchestrateur
escalade et s'arrête sur la phase. Je l'applique plutôt que de m'accorder un
quatrième tour, parce que c'est exactement le genre de dérogation qui vide un
protocole de sa substance — et parce que le mode d'emploi de ce projet prévoit
que tu n'interviens qu'ici.

| Option | Conséquence |
| --- | --- |
| **A. Autoriser un quatrième tour sur G2** *(recommandé)* | Le producteur applique la correction d'une ligne, le contrôleur la vérifie, G2 s'ouvre. Coût : un aller-retour. Risque : aucun, la correction est spécifiée mot pour mot par le contrôleur et ne touche ni le schéma ni les contrats de routes. |
| **B. Ouvrir G2 en `PASS_AVEC_RESERVES` et verser le constat en V2** | P3 démarre tout de suite. Mais un enfant recevrait 2 pierres au lieu de 3 sur le chemin nominal, et ARB-06 serait violé dès la première soirée réelle. Le contrôleur a qualifié ce constat `[MAJEUR]` en connaissance de cause. Je le déconseille. |
| **C. Laisser G2 bloquée jusqu'à une revue humaine du dossier** | Le projet s'arrête sur P2 et P3. Seuls les travaux indépendants avancent : `contenu-enfant` produit `ui-enfant.json` et `ui-parent.json` (ARB-10) et retire les six clés d'ARB-12. |

### Question fermée

> **Autorises-tu un quatrième aller-retour sur la porte G2, par dérogation à la
> règle des trois tours — oui ou non ?**

**Réponse humaine (2026-09-21) : OUI, option A.** Statut : **close, G2 relancée**.

Dérogation accordée pour ce tour et pour ce motif uniquement — un défaut né au
tour 3, sans désaccord entre producteur et contrôleur, dont la correction est
spécifiée mot pour mot. Elle ne crée pas de précédent : la règle des trois tours
reste la règle, et un quatrième tour reste une décision humaine.

---

### Ce qui avance pendant ce temps, sans attendre ta réponse

- `contenu-enfant` produit `content/ui-enfant.json` et `content/ui-parent.json`,
  sous contrôle de `controle-produit` (ARB-10) — requis avant G3 de toute façon.
- Le retrait des six clés `lecture.vide.*` / `maths.vide.*` dans les trois
  fichiers concernés (ARB-12).
- La table d'amendements du prompt maître est complétée : le contrôleur a relevé
  qu'elle oubliait **ARB-04** — la fiche `contenu-enfant.md` énumère 16
  situations là où le fichier validé en G1 en porte 23, et cet agent est
  justement relancé maintenant.
