# Portes (gates) du projet Tipi

Statuts possibles : `ouverte` (peut démarrer), `en cours`, `verte` (validée par
un contrôleur distinct), `bloquée` (escalade en cours).

**Seul l'Orchestrateur met ce fichier à jour.** Une phase ne démarre jamais si
sa porte amont n'est pas verte.

| Porte | Phase | Producteur | Contrôleur | Statut | Date | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | P1 Produit & marketing + P1bis Contenu enfant | `produit-marketing`, `contenu-enfant` | `controle-produit` | **verte** | 2026-09-20 | [marketing](P1/produit-marketing.review.md) · [contenu](P1/contenu-enfant.review.md) |
| G2 | P2 Architecture | `architecte` | `controle-architecture` | **bloquée** | 2026-09-20 | [verdict](P2/architecture.review.md) · [ESC-002](ESCALADE.md) |
| G3 | P3 Design system | `design-system` | `controle-design` | ouverte | — | — |
| G4.V1 | P4 V1 Socle | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V2 | P4 V2 Capture & analyse IA | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V3 | P4 V3 Moteur de session | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V4 | P4 V4 Module Lecture | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V5 | P4 V5 Module Maths | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V6 | P4 V6 Pierres & Coffre | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V7 | P4 V7 Réglages & code parent | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V8 | P4 V8 Espace parent | `dev-feature` | `controle-code` | ouverte | — | — |
| G4.V9 | P4 V9 Onboarding, états limites, polish | `dev-feature` | `controle-code` | ouverte | — | — |
| G5 | P5 Tests | `tests-unitaires` | `controle-tests` | ouverte | — | — |
| G6 | P6 Recette E2E | `qa-e2e` | `controle-qa` | ouverte | — | — |
| G7 | P7 Sécurité & RGPD | `securite-rgpd` | `red-team` | ouverte | — | — |
| G8 | P8 Livraison | `release` | `recette-finale` | ouverte | — | — |

## Dépendances

- G1 → G2 → G3 → G4.V1 → G4.V2 → G4.V3
- G4.V3 verte → G4.V4, G4.V5, G4.V6 en parallèle ; G4.V7, G4.V8 en parallèle
- G4.V9 en dernier, après toutes les autres verticales
- G4.* toutes vertes → G5 → G6 → G7 → G8

## Arbitrages de l'Orchestrateur

Décisions prises par l'Orchestrateur lorsqu'un désaccord dépasse le périmètre
d'un agent, sans atteindre le seuil d'une escalade humaine. Elles font foi pour
tous les agents en aval.

| # | Porte | Décision | Motif |
| --- | --- | --- | --- |
| ARB-01 | G1 | Le prénom de l'enfant est un jeton `{prenom}` dans toute chaîne de contenu, écrans parent compris. « Evan » ne subsiste que dans la prose qui parle de lui comme personne réelle. | Le prompt maître pose en 1.2 un schéma multi-enfants dès le départ. `content/` tenait déjà cette convention, le livrable marketing non : les verticales auraient hérité des deux. |
| ARB-02 | G1 | Le vocabulaire des canaux est celui de `contenu-enfant` : `tts`, `affiche`, `les_deux`. Le livrable marketing s'aligne. | Ce sont les fichiers de `content/` que le code consomme. Un document ne dicte pas son vocabulaire aux fichiers qu'il décrit. |
| ARB-03 | G1 | Les boutons du rituel de fermeture suivent l'arbitrage DES-06 du livrable marketing. `contenu-enfant` s'aligne et corrige ses identifiants. | DES-06 impose une seule action principale par écran, toujours au même endroit, et la copie d'écran appartient au marketing. |
| ARB-04 | G1 | Aucune situation distincte n'est regroupée sous une clé unique pour tenir le compte de 20 variantes. Une situation = un moment de la session qui a son propre sens. Les quatre niveaux d'indices sont quatre situations ; le blocage en lecture et le blocage en maths sont deux situations. | PED-11 exige 20 variantes par situation. Tenir le compte en fusionnant des sens différents couvrirait l'exigence sur le papier et pas devant l'enfant, qui les entendra toutes. Surcoût de volume assumé. |
| ARB-05 | G1 | Deux réserves `[MINEUR]` du contrôle marketing ont été corrigées au lieu d'être versées au backlog, par dérogation à la règle 6.2. | Ce livrable est la source que liront l'architecte, le design system et les neuf verticales. Une contradiction interne s'y serait propagée en code. |
| ARB-08 | G2 | **Une étape vide n'est jamais créée.** Si l'analyse produit une étape sans exercice, elle est écartée et la soirée en compte une de moins. Le bonus porte sur « toutes les étapes programmées terminées », jamais sur un « 2 » en dur. | Le contrôle a montré qu'une IA qui découpe mal coûterait 2 pierres à l'enfant — l'étape et le bonus. L'enfant n'est pas responsable d'une erreur d'analyse, et ETH-04 interdit qu'il perde quoi que ce soit. Supprimer le cas plutôt que l'arbitrer. |
| ARB-09 | G2 | **La clôture normale d'une session ne dépend d'aucun élément de V7.** V3 livre un chemin de fermeture autonome ; V7 n'ajoute que la sortie anticipée du parent. Garde obligatoire sur `session.date`. | Sans cela, aucune session ne peut être close avant V7, et une session orpheline de la veille renvoie l'enfant sur les devoirs d'hier — une impasse que PRD-16 interdit. |
| ARB-10 | G2 | **`content/ui-enfant.json` et `ui-parent.json` sont produits par `contenu-enfant`, contrôlés par `controle-produit`, et non par `dev-feature`.** | La fiche de `dev-feature` lui interdit d'écrire du texte utilisateur. ARB-07 a prouvé que la nomenclature des clés est éditoriale et non mécanique. |
| ARB-11 | G2 | **TEC-09 est inscrite « couverte sous condition »** dans `TRACEABILITY.md`, la condition étant nommée : le test micro avec la voix d'Evan (section 8, point 4). | Une exigence réputée couverte sans sa condition explicite fait rejouer le débat à la recette finale. |
| ARB-12 | G2 | Les six clés `lecture.vide.*` et `maths.vide.*` sont **retirées**, après vérification que chacun des cinq états limites garde sa propre couverture. Le retrait touche `content/encouragements.json` **et** le livrable marketing, qui les déclare à trois endroits. Le barème reçoit une **formulation canonique unique**, citant ARB-08, reprise mot pour mot partout où il est énoncé. | ARB-08 rend ces clés inatteignables, et du texte sans déclencheur est une contradiction qui attend qu'on recâble un écran dessus. Un écart assumé et tracé n'est pas un écart ; un écart silencieux est un piège pour le dernier agent de la chaîne. *(Arbitrage rendu le 2026-09-20 et transmis par message ; son absence de ce tableau a été relevée par `controle-architecture` — c'était une faute de traçabilité de l'Orchestrateur, réparée ici.)* |
| ARB-13 | G2 | **Une soirée complète vaut toujours 3 pierres, quel que soit le nombre d'étapes programmées.** Barème : `+1` par étape terminée, plus un bonus de `3 − nombre d'étapes programmées` lorsque toutes sont terminées. Le bonus doit être crédité par **toute** transition menant à une soirée complète, y compris la clôture automatique, et jamais par une seule. | `controle-architecture` a démontré que « +1 par étape, +1 si tout est terminé » donnait 3 pierres à deux étapes et 2 à une seule : le Soir léger redevenait **détectable à une pierre près**, violant ARB-06 au moment même où le livrable le déclarait satisfait. Or la pierre récompense le fait de venir et de finir, jamais le volume de travail (PED-05) — un enfant ne doit pas recevoir moins parce que son parent l'a ménagé. Le bonus n'est jamais négatif, PED-06 plafonnant les étapes à deux. |
| ARB-07 | G1 | **Révocation d'une décision antérieure.** `transition.cloture.corps` est renommée `session.fin_travail.corps`. J'avais d'abord tranché de garder le nom, au motif de la cohérence avec la famille `transition.*`. | Les deux producteurs ont buté sur ce nom indépendamment, sans s'être lus. Interrogé, le contrôleur a répondu que je me trompais, en assumant que c'est lui qui avait proposé ce nom au tour 1. Son argument emporte la décision : `transition.*` ne signifie pas « charnière » mais « une étape suit », or ici aucune ne suit — le rituel de fermeture n'est pas une étape. Le préfixe mentait sur le sens. Coût du renommage : 2 occurrences côté `content/`, 5 côté marketing. |
| ARB-06 | G1 | Les libellés de bouton et les titres porteurs d'ordre restent **fixes**, sans banque de variantes. En revanche l'annonce du programme à une seule étape (mode basse énergie) **a ses 20 variantes**. | Un libellé d'action qui change transforme un repère en devinette pour un enfant de six ans et demi, et DES-06 veut une action principale constante. L'annonce du programme, elle, figure dans les 16 situations de la fiche de mission : le mode basse énergie n'en est pas une autre, c'est la même un soir de fatigue — le soir où l'enfant a le moins de ressources serait le seul sans variété. Contrainte maintenue : le Soir léger reste indétectable par l'enfant. |

## Journal

| Date | Événement |
| --- | --- |
| 2026-09-20 | PHASE 0 : équipe d'agents et fichiers de protocole mis en place. |
| 2026-09-20 | ESCALADE initiale écrite : demande des six éléments humains (section 8). |
| 2026-09-20 | G1 passée en `en cours` : lancement de `produit-marketing` et `contenu-enfant`. |
| 2026-09-20 | ESC-001 ouverte : nom de fichier `gwenn-scripts.json` incohérent avec la mascotte Pilou. |
| 2026-09-20 | Marketing, tour 1 : `FAIL` (5 majeurs, 5 mineurs), gardien-charte NON CONFORME. |
| 2026-09-20 | Marketing, tour 2 : `PASS_AVEC_RESERVES` (3 mineurs), gardien-charte CONFORME, aucun écart de chiffres. |
| 2026-09-20 | Marketing, tour 3 : `PASS_AVEC_RESERVES` (2 mineurs), deuxième tour consécutif sans écart de chiffres. Arbitrages ARB-01 et ARB-05. |
| 2026-09-20 | Banque de phrases, tour 1 : `FAIL` (8 majeurs, 5 mineurs), gardien-charte NON CONFORME. Les 23 grandeurs annoncées vérifiées à l'unité près. Arbitrages ARB-02, ARB-03, ARB-04. |
| 2026-09-20 | Banque de phrases, tour 2 : `FAIL` (2 majeurs, 4 mineurs), gardien-charte CONFORME. Rendu agrammatical du jeton `{matiere}` découvert ; 3 grandeurs fausses sur 24, toutes sur le recouvrement. Arbitrage ARB-07 révoquant une décision antérieure. |
| 2026-09-20 | Banque de phrases, tour 3 : `PASS_AVEC_RESERVES` (2 mineurs), gardien-charte CONFORME, **aucun écart sur 24 grandeurs**. Piège d'outillage jugé maîtrisé après contre-mesure indépendante. |
| 2026-09-20 | **G1 verte.** Les deux réserves mineures restantes sont corrigées hors porte. P2 ouverte, `architecte` lancé. |
| 2026-09-20 | Architecture, tour 1 : `FAIL` (7 majeurs, 12 mineurs). `prisma validate` rejoué et reproduit par le contrôleur : le FAIL ne porte pas sur le schéma. Fuite découverte — le cache TTS public aurait contenu 14 clips prononçant le prénom de l'enfant. Arbitrages ARB-08 à ARB-11, puis ARB-12. |
| 2026-09-20 | Architecture, tour 2 : `FAIL` (3 majeurs, 3 mineurs). Les 19 constats du tour 1 tous fermés, vérifiés dans les fichiers ; aucun écart sur 23 grandeurs recomptées. Les trois majeurs sont nés du tour 2, tous sur le barème et la clôture automatique. Arbitrage ARB-13. |
| 2026-09-20 | Architecture, tour 3 : `FAIL` (1 majeur, 2 mineurs), sur un défaut né au tour 3 et invisible avant l'application d'ARB-13. Aucun écart sur 26 grandeurs, troisième tour consécutif. **Troisième FAIL : G2 bloquée, ESC-002 ouverte** conformément à la règle 6.4. |
| 2026-09-20 | Deux manquements de l'Orchestrateur relevés par `controle-architecture` et réparés : ARB-12 rendu par message mais jamais inscrit dans ce tableau, et aucune entrée de journal pour G2 après deux tours. Un arbitrage non écrit n'est opposable à personne. |
