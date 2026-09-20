# Portes (gates) du projet Tipi

Statuts possibles : `ouverte` (peut démarrer), `en cours`, `verte` (validée par
un contrôleur distinct), `bloquée` (escalade en cours).

**Seul l'Orchestrateur met ce fichier à jour.** Une phase ne démarre jamais si
sa porte amont n'est pas verte.

| Porte | Phase | Producteur | Contrôleur | Statut | Date | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | P1 Produit & marketing + P1bis Contenu enfant | `produit-marketing`, `contenu-enfant` | `controle-produit` | en cours | 2026-09-20 | — |
| G2 | P2 Architecture | `architecte` | `controle-architecture` | ouverte | — | — |
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

## Journal

| Date | Événement |
| --- | --- |
| 2026-09-20 | PHASE 0 : équipe d'agents et fichiers de protocole mis en place. |
| 2026-09-20 | ESCALADE initiale écrite : demande des six éléments humains (section 8). |
| 2026-09-20 | G1 passée en `en cours` : lancement de `produit-marketing` et `contenu-enfant`. |
