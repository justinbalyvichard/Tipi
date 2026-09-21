# Backlog V2 — Tipi

Toute idée hors du référentiel d'exigences de la section 2 du prompt maître
atterrit ici, avec une ligne de justification. **Aucun agent ne code une idée
non tracée, même bonne.**

`recette-finale` vérifie que ce fichier ne contient **aucune exigence du
référentiel** : une `REQ-xxx` repoussée en V2 est `[BLOQUANT]`.

| # | Idée | Origine (agent / phase) | Pourquoi hors périmètre V1 | Date |
| --- | --- | --- | --- | --- |
| — | *(vide pour l'instant)* | — | — | — |

## Constats `[MINEUR]` reportés

Les constats `[MINEUR]` des verdicts de contrôle n'empêchent pas une porte de
s'ouvrir, mais sont recopiés ici.

| # | Constat | Verdict d'origine | Date |
| --- | --- | --- | --- |
| — | *(vide pour l'instant)* | — | — |

## Réserves à reprendre en P5 — ne pas verser en V2

Ces deux réserves ne sont **pas** du hors-périmètre. Elles ont été laissées
ouvertes à la fermeture de G2 parce qu'elles ne changent ni schéma, ni route, ni
contrainte, ni un chiffre — mais elles **doivent** être reprises par
`tests-unitaires` et vérifiées par `controle-tests`. Les inscrire ici évite
qu'elles disparaissent entre deux phases.

| # | Réserve | Origine | Ce que P5 doit en faire |
| --- | --- | --- | --- |
| P5-01 | **Un invariant dit quand le bonus doit être là, jamais quand il ne doit pas l'être.** Le contrôleur a démontré en données qu'un bonus versé à tort sur une soirée incomplète, avec un montant faux, tombe sur 3 et **passe les deux invariants**. | `architecture.review.md`, tour 4, mineur 29 | Écrire le test qui manque : un bonus ne doit exister que si toutes les étapes programmées sont créditées. L'invariant seul ne suffit pas, il lui faut sa réciproque. |
| P5-02 | **Une procédure de mutation doit être reconstituable.** Suivie à la lettre, celle de l'architecte fait rougir le mauvais invariant : supprimer une ligne de ledger sans réaligner `gem_balance` rompt d'abord l'invariant du solde. Le contrôleur a dû diagnostiquer l'étape manquante. | `architecture.review.md`, tour 4, mineur 30 | Toute procédure de mutation publiée doit nommer l'étape de réalignement, et dire **quel** invariant doit rougir. Un test de mutation qui fait rougir autre chose que la cible ne prouve pas ce qu'il prétend. |
| P5-03 | **Une garde devenue porteuse du barème n'est pas documentée.** `TIPI_ETAPES_MEME_MATIERE` conditionne désormais le barème, sans que le livrable le dise. | `architecture.review.md`, tour 4 | Couvrir par un test nommé, et documenter la dépendance là où le barème est énoncé. |
