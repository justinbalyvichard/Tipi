# P2 — Contrôle adversarial de l'architecture

VERDICT: FAIL

Contrôleur : `controle-architecture` (lecture seule). Porte G2, **tour 3 sur 3**.
Livrables contrôlés : `docs/agents/P2/architecture.out.md` (v3, 2049 lignes),
`prisma/schema.prisma`, `supabase/policies.sql` (528 lignes), `.env.example`.

**Tour 3 : 1 [MAJEUR], 2 [MINEUR], 0 [BLOQUANT].** Un seul [MAJEUR] impose FAIL.
Plus une observation hors livrable, qui ne compte pas dans ce verdict.

Je rends FAIL sur **un seul** constat, et je le dis d'emblée pour que
l'escalade porte sur la bonne question : **les six constats du tour 2 sont
fermés, correctement et sans régression**, la correction de la contrainte
`CHECK` que l'architecte a trouvée lui-même est juste et je la valide, les 26
grandeurs annoncées sont exactes à l'unité, et `prisma validate` est reproduit.
Le [MAJEUR] 26 porte sur **une définition d'une ligne** — celle du prédicat qui
décide du versement du bonus — et il fait perdre une pierre à l'enfant sur le
chemin **nominal**, c'est-à-dire le chemin que ni ARB-08 ni ARB-13 n'avaient eu
à regarder. C'est la question fermée que je propose de porter en escalade.

---

## A. Constats du tour 3

La numérotation continue : tour 1 constats 1-19, tour 2 constats 20-25.

### [MAJEUR] 26 — Le prédicat qui décide du bonus n'a qu'une définition, fondée sur les lignes `attempt`, écrites par une **autre** route sans ordre garanti. Sur le chemin nominal T5, l'enfant peut finir sa soirée et recevoir 2 pierres au lieu de 3.

Vous m'avez demandé de chercher un quatrième chemin de complétion. **Je n'en ai
pas trouvé : l'énumération des créditeurs est complète** (je la donne en B.1).
Le défaut est ailleurs, et il est plus proche du centre : ce n'est pas un chemin
qui manque, c'est le **prédicat** commun aux trois qui n'est pas défini de façon
à tenir sur le premier d'entre eux.

La fonction unique, `architecture.out.md` § 9.5 :

```ts
async function crediterBonusSiSoireeComplete(tx, session): Promise<number> {
  const etapes = session.etapesPrevues;
  if (etapes.length === 0) return 0;                  // propriété 2
  if (!etapes.every(estTerminee)) return 0;           // toutes terminées ?
  return crediter(tx, session, 'bonus_soiree_complete', 3 - etapes.length);
}
```

`estTerminee` n'est défini qu'à un seul endroit du livrable, § 9.4 point 3,
dans le paragraphe qui décrit le rattrapage de T12 :

> « Il les identifie sans ambiguïté : **une étape est terminée quand toutes les
> lignes `attempt` de ses exercices portent un statut final**, et non créditée
> quand il n'existe pas de ligne `gem_ledger` pour `(session_id, raison)` ; **le
> bonus est dû quand toutes les étapes programmées le sont** […] »

Or le crédit `+1` d'une étape, lui, n'est pas déclenché par les `attempt` mais
par **l'événement**. Table 9.2 :

> « T4 | `ETAPE_TERMINEE` | `etape_lecture`, `etape_maths` | **une étape suit** |
> `transition` | crédit +1 de la matière terminée »
> « T5 | `ETAPE_TERMINEE` | … | **dernière étape** | `cloture` | crédit +1,
> **puis `crediterBonusSiSoireeComplete()`** »

Les gardes de T4 et T5 sont « une étape suit » et « dernière étape ». **Aucune
ne porte sur les `attempt`.** Et les lignes `attempt` sont écrites par une route
distincte, dont le statut vient du client — § 8.3 :

> « **`POST /api/session/{id}/tentative`** | Entrée | `{ exerciseId: Uuid,
> statut: "en_cours"|"terminee"|"passee"|"bloquee", … }` »

La séquence des deux appels n'est spécifiée nulle part, et la transaction de
9.3 ne finalise aucun `attempt`.

**Conséquence, sur le chemin nominal.** L'enfant termine le dernier exercice de
la dernière étape et appuie sur le bouton de fin. Si la ligne `attempt`
correspondante est encore à `en_cours` — le `POST …/tentative` n'est pas parti,
est parti après, ou l'enfant a appuyé sur « j'ai fini » sans que le dernier
exercice ait été marqué — alors, dans la même transaction :

- le `+1` de l'étape est crédité, parce qu'il dépend de l'**événement** ;
- `crediterBonusSiSoireeComplete()` renvoie **0**, parce qu'il dépend des
  **`attempt`** ;
- la session passe à `cloture`, puis T9 `CLOTURE_VUE` la mène à `termine` — et
  **T9 ne crédite rien**, la table 9.2 le confirme.

Depuis `termine`, « aucune transition n'est possible » (9.2), aucune route
n'accepte de montant (7.1), et T12 ne se déclenche que sur une session **non
finale** dont la date est passée. **Le bonus est perdu définitivement, sur une
soirée normalement terminée.** L'enfant reçoit 2 pierres là où ARB-13 en promet
3 — exactement le préjudice que l'arbitrage a été rendu pour supprimer, et le
Soir léger redevient au passage détectable dans le coffre, contre ARB-06.

La même transaction crédite donc l'étape et refuse le bonus pour deux raisons
contradictoires. C'est aussi le standard que l'architecte se donne lui-même en
9.5, propriété 3 et note finale — « l'idempotence ne repose pas sur la
discipline d'appel » — et qu'il n'applique pas ici : le versement du bonus
repose sur l'ordre dans lequel le client émet deux requêtes.

**Correction attendue, une ligne.** Définir `estTerminee` sur le **ledger** et
non sur les `attempt` : *une étape est terminée lorsqu'il existe une ligne
`gem_ledger` pour `(session_id, raison_de_cette_étape)`.* Cette définition est
cohérente aux trois créditeurs, je l'ai vérifiée :

- **T5** : le `+1` de la dernière étape est écrit **avant** l'appel au bonus
  (« crédit +1, **puis** … »), et les étapes précédentes l'ont été par T4 ;
- **T10** et **T12** : le livrable crédite explicitement « les étapes terminées
  et non créditées, **puis** le bonus », donc les lignes existent au moment du
  test.

Elle supprime toute dépendance à l'ordre des appels client, et le `attempt` ne
sert plus qu'à ce pour quoi il est fiable : décider, dans T10 et T12, quelles
étapes rattraper. Garder en plus, si on veut une ceinture, une garde sur T4/T5
exigeant que toutes les lignes `attempt` de l'étape soient finales — mais alors
il faut le dire, et dire ce qui se passe sinon.

---

### [MINEUR] 27 — V5 se termine par une `RAISE EXCEPTION` inconditionnelle qui n'est pas nécessaire, et qui fait échouer l'application nominale d'un fichier de sécurité.

`supabase/policies.sql`, fin du bloc V5 :

```sql
  RAISE EXCEPTION 'V5 : annulation volontaire de la transaction de test.';
END $$;
-- NOTE : V5 se termine par une exception volontaire pour ne rien laisser en
-- base. Jouez-la donc SÉPARÉMENT (psql -c), pas dans la même transaction que le
-- reste du fichier. Commentez ce bloc pour une application non interactive.
```

Elle est **prouvablement inutile**. Les deux insertions interdites sont chacune
enveloppées dans leur propre `BEGIN … EXCEPTION WHEN check_violation`, donc
aucune ne peut committer : si les `CHECK` sont en place, les deux échouent et
sont rattrapées ; s'ils manquent, le bloc lève déjà sa propre exception
(`'ETH-04 VIOLÉE…'` / `'ARB-13 VIOLÉE…'`), qui annule le `DO`. Il n'y a rien à
annuler quand V5 réussit.

Le coût, lui, est réel. La partie D a été rendue exécutable au tour 1 (constat
14) pour cesser d'être « une consigne que personne ne joue » ; V5 y retourne,
puisque la consigne est de la jouer à part ou de la commenter. Et sur un
fichier de **sécurité** :

- avec `ON_ERROR_STOP=1`, V6, V7 et V8 ne s'exécutent jamais ;
- avec `psql -1`, c'est **tout le fichier qui est annulé** — parties A, B et C
  comprises, donc **la RLS n'est pas appliquée**, alors que la base a l'air
  d'avoir reçu le fichier.

Ce sont deux invocations ordinaires pour un fichier qu'on veut appliquer
atomiquement.

Correction attendue : supprimer la `RAISE EXCEPTION` finale — les deux
gestionnaires internes suffisent — ou, si l'on tient à la ceinture, entourer V5
d'un `BEGIN; … ROLLBACK;` explicite et retirer la consigne de commentaire.

---

### [MINEUR] 28 — Le tableau des six endroits du barème déclare le sixième « traité par l'Orchestrateur ». Il ne l'est pas : la ligne porte toujours la règle révoquée.

`architecture.out.md`, § 9.5, « Les six endroits qui énoncent le barème » :

> « | 6 | `docs/agents/P1/produit-marketing.out.md` ligne 1148 | **Pas à moi.**
> Traité séparément par l'Orchestrateur | »

`docs/agents/P1/produit-marketing.out.md`, lignes 1148-1153, tel que je l'ai lu
aujourd'hui — **inchangé** :

> « **Barème rappelé** (3.7) : +1 par étape terminée, **+1 bonus si les 2 étapes
> du soir sont terminées.** […]
> **Cas d'une seule étape terminée** : même rituel, mêmes phrases, **une pierre
> de moins affichée.** »

Aucun amendement n'y figure, et le bloc « AMENDEMENTS » du prompt maître ne
mentionne pas ce fichier (ses quatre lignes visent §3.7, §5.1, §5.2 et
`gwenn-scripts.json`). La seconde phrase est d'ailleurs devenue **doublement**
fausse sous ARB-13 : une soirée à une seule étape programmée vaut 3 pierres,
donc rien n'y est « une pierre de moins ».

Ce n'est pas à l'architecte de corriger ce fichier, et il a raison de l'écrire.
Mais son tableau affirme un fait qui n'est pas le cas, sur la question même que
ce tour devait clore : un lecteur du § 9.5 conclura que les six endroits sont
alignés. Et ce livrable est celui dont ARB-10 fait extraire `ui-enfant.json`, et
celui que V8 lira pour l'écran `/enfant/bravo`.

Correction attendue : remplacer « Traité séparément par l'Orchestrateur » par
« **À traiter** — au contrôle du tour 3, la ligne porte encore la règle
révoquée », en gardant la colonne « Pas à moi ».

---

## B. Les points que vous m'avez demandé de juger

### B.1 — Les trois créditeurs du bonus, et la recherche d'un quatrième chemin

**Les trois chemins existent, et ils sont bons.** Vérifiés un par un dans la
table 9.2 : T5 (`crédit +1, puis crediterBonusSiSoireeComplete()`), T10
(`crédit des étapes déjà terminées et non encore créditées, puis
crediterBonusSiSoireeComplete()`), T12 (idem). La fonction est unique, écrite
en 9.5, et prend `tx` en paramètre : elle s'exécute donc dans la transaction de
son appelant, conformément à 9.3. L'idempotence repose sur l'unique
`(session_id, raison)` — sur une colonne devenue obligatoire au tour 2 — et non
sur la discipline d'appel : appeler la fonction trois fois de suite est sans
effet au-delà du premier crédit. C'est la bonne construction, et elle répare
exactement le constat 20.

**J'ai cherché un quatrième chemin de complétion. Il n'y en a pas.** J'ai
énuméré toutes les transitions menant à un état final ou à `cloture` :

| Transition | Vers | Crédite le bonus ? | Verdict |
| --- | --- | --- | --- |
| T3 `PROGRAMME_VU` (programme vide) | `termine` | Non | **Correct.** Garde explicite : `if (etapes.length === 0) return 0` (propriété 2). Le cas `sansDevoir` rendrait « toutes terminées » vrai par vacuité et `3 − 0 = 3` : **le piège est vu et fermé**, et c'était le premier endroit où je suis allé regarder |
| T5 `ETAPE_TERMINEE` (dernière) | `cloture` | Oui | Chemin nominal |
| T9 `CLOTURE_VUE` | `termine` | Non | Sans objet : T5 le précède toujours — **sauf dans le cas du constat 26**, où c'est précisément le dernier train manqué |
| T10 `ABANDON_PARENT` | `abandon_parent` | Oui | Correct |
| T12 `CLOTURE_AUTOMATIQUE` | `termine` | Oui | Correct |

Aucune autre transition ne quitte le graphe. T4, T6, T7, T8 et T11 ne mènent pas
à un état final ; depuis `termine` et `abandon_parent`, rien n'est possible.
**L'énumération des créditeurs est donc close.** Le défaut n'est pas un chemin
manquant mais le prédicat commun aux trois, constat 26.

Je note au passage que la garde sur `sansDevoir` est la marque d'une
vérification réellement menée : c'est un cas que seul quelqu'un qui déroule
l'arithmétique à la main rencontre.

### B.2 — Le barème ARB-13, recalculé sur tous les chemins

J'ai refait le calcul moi-même, sans reprendre son tableau, en partant de la
formule d'ARB-13 telle qu'elle est écrite dans `GATES.md` : « `+1` par étape
terminée, plus un bonus de `3 − nombre d'étapes programmées` lorsque toutes sont
terminées ».

| Chemin | Étapes programmées | Étapes créditées | Bonus | Total | Annoncé | OK |
| --- | --- | --- | --- | --- | --- | --- |
| Soirée à 2 étapes, tout terminé (T4 puis T5) | 2 | 1 + 1 | 3 − 2 = 1 | **3** | 3 | ✓ |
| Soir léger / une matière, terminé (T5 seul) | 1 | 1 | 3 − 1 = 2 | **3** | 3 | ✓ |
| 2 étapes, une seule terminée | 2 | 1 | 0 (garde `every`) | **1** | 1 | ✓ |
| Aucune étape (`sansDevoir`, T3) | 0 | — | 0 (garde `length === 0`) | **0** | 0 | ✓ |

Et les chemins que vous m'avez demandé d'ajouter, que son tableau ne couvre pas
explicitement :

| Chemin | Détail | Total | Verdict |
| --- | --- | --- | --- |
| **Soirée abandonnée par le parent, tout déjà fini** (T10) | étapes créditées par T4/T5 ou rattrapées par T10, puis bonus | **3** | ✓ Correct — T10 appelle la fonction |
| **Soirée abandonnée en cours d'étape 2** (T10) | 1 (étape 1) + 0 | **1** | ✓ Correct, `every` est faux |
| **Soirée close automatiquement, tout fini en base** (T12) | rattrapage de l'étape + bonus | **3** | ✓ Correct — c'est la réparation du constat 20 |
| **Soirée close automatiquement, étape 2 inachevée** (T12) | 1 + 0 | **1** | ✓ Correct |
| **Soirée reprise le soir même** (PRD-18) | la reprise ne crédite rien par elle-même ; les crédits restent portés par T4/T5 et l'unique empêche le doublon | inchangé | ✓ Correct |
| **`sansDevoir` jamais ouverte, close par T12 le lendemain** | T12 sur une session à `idle` ou `annonce` avec 0 étape | **0** | ✓ Correct — la garde `length === 0` tient aussi sur ce chemin, que le livrable ne cite pas mais qui est réel |
| **Soirée terminée normalement, dernier `attempt` non finalisé** (T5 puis T9) | 1 + 1 + **0** | **2** | ✗ **Constat 26** |

Le forfait est donc juste sur tous les chemins sauf un, et ARB-06 est réellement
satisfait — le Soir léger devient indétectable dans le coffre — partout sauf sur
ce même chemin.

Deux vérifications de bornes, puisque le bonus est maintenant variable :
`3 − n` vaut 2 pour `n = 1` et 1 pour `n = 2` ; `n ≥ 3` est impossible (PED-06,
et `POST /api/session` valide `1..2`) ; `n = 0` est gardé. Le bonus n'est donc
jamais nul ni négatif, et l'affirmation de la propriété 1 est exacte.

### B.3 — La contrainte `CHECK` : le raisonnement est **juste**, et la trouvaille est réelle

C'est le point que vous vouliez voir en premier. **Je confirme les trois
affirmations, dans le SQL réel.**

**1. L'ancienne contrainte aurait bien rejeté le bonus d'ARB-13.** Au tour 2,
`policies.sql` posait `gem_ledger_delta_max_un CHECK (delta <= 1)` — je l'avais
lue et je l'avais laissée passer, parce qu'elle était exacte sous le barème
d'alors. Sous ARB-13, le bonus d'un Soir léger vaut `3 − 1 = 2` : l'insertion
aurait levé une `check_violation`. Et le crédit étant dans la transaction depuis
le tour 2 (constat 4), **la transition entière aurait été annulée** :
l'enfant n'aurait pas seulement perdu le bonus, il serait resté bloqué à l'écran
de fin d'étape, tous les soirs légers, en production. La trouvaille est réelle et
elle est sienne.

**2. Le remplacement est correct.** `policies.sql` lignes 193-202 :

```sql
ALTER TABLE public.gem_ledger DROP CONSTRAINT IF EXISTS gem_ledger_delta_max_un;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gem_ledger_delta_borne') THEN
    ALTER TABLE public.gem_ledger
      ADD CONSTRAINT gem_ledger_delta_borne CHECK (delta BETWEEN 1 AND 2);
  END IF;
END $$;
```

Le motif du `DROP` est exact : les deux contraintes sont des prédicats
indépendants, Postgres les conjugue, et **la plus stricte l'aurait emporté en
silence** sur une base ayant déjà reçu le fichier du tour 2 — le `CHECK` neuf
aurait été posé, accepté, et parfaitement inopérant. Un `ADD` idempotent sans
`DROP` est un piège classique de fichier rejouable ; il est évité. Le `DROP` est
lui-même idempotent (`IF EXISTS`) et placé avant le `DO`, donc l'ordre est bon.
Le renommage est justifié : `delta_max_un` aurait menti sur son contenu.

**3. Aucune autre contrainte ne bloque un delta de 2.** J'ai relevé la totalité
des contraintes portant sur `gem_ledger` (sortie E.5) : il n'en existe que deux,
`gem_ledger_delta_positif CHECK (delta > 0)` et `gem_ledger_delta_borne`. Côté
Prisma, `delta Int @db.SmallInt` couvre ±32767. `child_gem_balance_positif
CHECK (gem_balance >= 0)` porte sur le solde, pas sur le delta. **Rien ne
bloque 2.** J'ai aussi balayé le dépôt à la recherche de références résiduelles
à l'ancien nom et à `delta <= 1` : les cinq occurrences restantes sont toutes
historiques ou explicatives, aucune n'est opérante. Et V4, la vérification qui
liste les huit contraintes attendues, a bien été mise à jour avec
`gem_ledger_delta_borne` (ligne 407) — un oubli à cet endroit aurait fait échouer
le fichier sur une base pourtant conforme.

**4. V5 teste bien `-1` **et** `3`.** Vérifié, lignes 428-450 : deux blocs
`BEGIN … EXCEPTION WHEN check_violation`, le premier insérant `-1` avec
`etape_lecture_terminee`, le second `3` avec `bonus_soiree_complete`, chacun
levant une exception nommée si l'insertion passe. La borne haute est donc
prouvée par la borne + 1, ce qui est la bonne façon de tester un `BETWEEN` — et
`40-protocole-agents.mdc` règle 3 demande précisément qu'un seuil soit publié
avec son sens exact. Il manque, pour être complet, le cas **pile au seuil** que
cette même règle réclame : une insertion de `2` qui doit **réussir**. Sans elle,
une borne accidentellement retombée à `<= 1` passerait V5 sans bruit. Je ne
l'érige pas en constat — V4 vérifie que la contrainte s'appelle `delta_borne`,
ce qui est un garde-fou indirect — mais je le signale comme l'amélioration qui
fermerait le sujet.

Le seul défaut de ce bloc est sa sortie : constat 27.

### B.4 — Le bloc « AMENDEMENTS » : le mécanisme est **le bon**, sa couverture ne l'est **pas**

Vous demandez si la solution suffit pour qu'un agent rejouant la PHASE 0 ne
réécrive pas les fiches fausses. Ma réponse : **oui pour le barème, non comme
dispositif général** — et le défaut est déjà actif, pas seulement en cas de
replay.

**Ce qui est juste, et que je tiens à nommer :**

1. **La place.** Le bloc est en tête de fichier, **avant le titre**. Le mode
   d'emploi dit « Lis `TIPI-PROMPT-CURSOR.md` **en entier** » : on ne peut pas le
   manquer.
2. **La règle de préséance est explicite** : « En cas de conflit, l'arbitrage
   gagne sur le texte d'origine. » Sans elle, un agent consciencieux aurait
   suivi le texte normatif.
3. **Le texte d'origine est préservé**, ce qui rend l'écart auditable au lieu de
   le faire disparaître — c'est le bon réflexe, le même qu'au tour 2 sur les
   règles `grep` publiées dans les deux versions.
4. **Et surtout : la fiche `.cursor/agents/tests-unitaires.md` porte l'amendement
   au point d'usage**, inséré juste sous la ligne fautive, qui est conservée.
   C'est le motif fort : l'agent qui ne lit que sa fiche — et c'est exactement ce
   que fait `tests-unitaires` — voit l'amendement **là où il allait se tromper**.
   Un bandeau en tête d'un autre fichier ne l'aurait pas atteint.

**Ce qui ne suffit pas :**

1. **La table est incomplète, et l'omission mord tout de suite.** Le bloc a
   quatre lignes : §3.7, §5.1 `tests-unitaires`, §5.2 glob, `gwenn-scripts.json`.
   Il manque au moins **ARB-04**. La fiche `.cursor/agents/contenu-enfant.md`
   énumère **16 situations** ; le fichier livré et validé en G1 en porte **23**
   (sortie E.6), parce qu'ARB-04 a refusé de fusionner des sens différents — les
   quatre niveaux d'indices sont quatre situations, les deux blocages sont deux
   situations. Cette fiche ne porte **aucun amendement** (zéro occurrence de
   « ARB-04 »). Or ARB-10 renvoie `contenu-enfant` produire `ui-enfant.json` et
   `ui-parent.json` **avant G3** : il va relire cette fiche dans les jours qui
   viennent, avec sa liste de 16. Ce n'est donc pas un risque de replay lointain,
   c'est le prochain agent lancé sur cette porte.
   Il manque aussi la ligne 1148 du livrable marketing (constat 28).
2. **PHASE 0 n'a pas de renvoi au point d'usage.** La §5 ordonne : « Crée
   immédiatement l'arborescence suivante, avec le contenu **exact** donné
   ci-dessous. » Un agent qui exécute cette phrase écrit la fiche fausse ;
   l'amendement lui demande de revenir corriger ensuite (« appliquer ces
   amendements dans la foulée »). Un dispositif en deux temps dont le second
   temps dépend de la mémoire est précisément ce qui se perd. Le correctif
   respecte votre contrainte de ne pas toucher au texte d'origine, puisqu'il
   n'entre dans aucun des blocs de code : **une phrase dans le préambule de la
   §5**, du type « Avant d'écrire ces fichiers, applique les AMENDEMENTS de
   l'en-tête : certains blocs ci-dessous portent des règles révoquées. »

**Ma recommandation** : garder le bloc et le motif, ajouter la ligne ARB-04 et
la ligne marketing à la table, porter l'amendement **dans la fiche
`contenu-enfant.md` au point d'usage** comme cela a été fait pour
`tests-unitaires.md` — c'est cette partie-là qui protège vraiment —, et ajouter
le renvoi d'une phrase en tête de §5. Avec cela, je considérerais le dispositif
suffisant. En l'état, il protège le barème et laisse ARB-04 exposé.

**Une remarque de fond, puisque vous me demandez de juger la solution et pas
seulement de la vérifier.** Ce que ce tour a mis au jour dépasse le barème : la
PHASE 0 crée des fiches d'agents à partir d'un texte figé, et **chaque
arbitrage qui révoque une règle de ce texte laisse une fiche préréglée
derrière lui**. Le bloc d'amendements est le bon outil, mais il ne vaudra que
s'il est alimenté à chaque arbitrage. Je suggère que le protocole l'exige
explicitement : tout `ARB-xx` qui contredit une ligne du prompt maître ouvre
une ligne dans ce bloc, au moment où il est rendu. C'est la version
généralisable de ce que vous venez de réparer deux fois — ARB-12 non inscrit,
puis §5.1 préréglé.

---

## C. Chiffres annoncés contre chiffres réels

Tous recomptés par moi, avec mes propres instruments. **Aucun écart, sur 26
grandeurs.**

| Grandeur | Annoncé | Mesuré | Écart |
| --- | --- | --- | --- |
| Entrées lues (canal `tts` / `les_deux`) | 454 | 454 | — |
| Clips distincts à synthétiser | 474 | 474 | — |
| Caractères du corpus fixe | 21 016 | 21 016 | — |
| Longueur moyenne | 44,3 | 44,3 | — |
| Part du quota mensuel | 2,10 % | 2,10 % | — |
| A — sans jeton → **public** | 420 clips, 19 105 car. | 420 / 19 105 | — |
| B — jeton `{matiere}` → **public** | 40 clips, 1 372 car. | 40 / 1 372 | — |
| C — jeton `{prenom}` → **privé** | 14 clips, 539 car. | 14 / 539 | — |
| Clips portant les deux jetons | 0 | 0 | — |
| Total public / privé | 460 / 14 | 460 / 14 | — |
| Variables dans `.env.example` | 27 | 27 | — |
| Variables `NEXT_PUBLIC_` | 3 | 3 | — |
| Lignes du tableau § 11 | 27 | 27 | — |
| Modèles Prisma | 10 | 10 | — |
| Énumérations Prisma | 6 | 6 | — |
| Valeurs de `RaisonGem` | 3, dont `bonus_soiree_complete` | 3, conformes | — |
| `gem_ledger.session_id` | obligatoire | `String` non optionnel | — |
| Contraintes déportées, partie B | 8 | 8, listées dans l'en-tête du schéma | — |
| Contraintes sur `gem_ledger` | 2 (`delta > 0`, `BETWEEN 1 AND 2`) | 2 | — |
| Tables couvertes par la RLS | 11 | 11 `ENABLE` + 11 `REVOKE ALL` | — |
| Buckets | 4 (3 privés, 1 public) | 4 | — |
| Policies sur `storage.objects` | 1 (`SELECT` sur `tts-cache`) | 1 | — |
| Vérifications exécutables partie D | 8 (V1→V8) | 8 | — |
| Règle R1 (TEC-17) | 0 résultat | 0 (exit 1) | — |
| Règle R2 (écriture du solde) | `src/lib/pierres/service.ts` seul | idem | — |
| Chemins de route distincts | 32 | 32 | — |
| `prisma validate` | valide, exit 0 | valide, exit 0 | — |

Troisième tour consécutif sans un seul écart de chiffre. Je le relève parce que
c'est rare : sur les trois tours, **aucune des grandeurs annoncées par
l'architecte ne s'est révélée fausse**, y compris celles qu'il a introduites
lui-même en cours de route.

---

## D. Non-régression après ARB-13 et le changement de contrainte

**Conformité champ par champ à la section 3.7 — intacte.** Contrôle mécanique
(E.4) : sur les neuf tables et leurs champs de 3.7, **aucun manquant, aucun
renommé**. 10 modèles, 6 énumérations, `CalibrationLog` toujours seule table
hors 3.7. Le seul changement de schéma du tour 3 est le commentaire de
`RaisonGem` ; `bonus_soiree_complete` conserve son nom d'ARB-08, seul son
montant change.

**RLS table par table — inchangée.** 11 `ENABLE ROW LEVEL SECURITY`, 11
`REVOKE ALL ON public.… FROM anon, authenticated`, **aucune policy** sur une
table métier, `_prisma_migrations` toujours couverte, `REVOKE USAGE ON SCHEMA
public`, `ALTER DEFAULT PRIVILEGES FOR ROLE %I`. V1 balaie toujours `pg_tables`
sans liste en dur. Une seule `CREATE POLICY` dans tout le fichier, en `SELECT`,
sur `tts-cache`.

**Étanchéité des buckets — inchangée.** 4 buckets, 3 privés. Le tri reste
structurel (présence d'un jeton avant rendu), le décideur unique (`POST
/api/voix`), les préfixes disjoints, et aucune policy d'écriture client. Le
constat 23 est fermé proprement : la revendication « vérifiée par V8 » est
remplacée par une preuve à la source **et** un test d'intégration dont le
porteur est nommé — `securite-rgpd` en P7, sur les 14 clés de 17.3, attendu 404.
C'est exactement ce que je demandais, y compris le rapprochement avec la
tentative n°8 de `red-team`.

**Aucun double crédit — toujours vrai, bonus compris.** Les quatre verrous
subsistent (`FOR UPDATE`, `evenementId` journalisé, `etatAttendu`, unique
`(session_id, raison)` sur colonne obligatoire). Le nouveau créditeur du bonus
partage le même unique : appeler `crediterBonusSiSoireeComplete()` depuis T5
puis, le lendemain, depuis T12, ne crédite qu'une fois. Et la borne
`BETWEEN 1 AND 2` refuserait de toute façon un delta hors barème. **Je n'ai
trouvé aucun chemin de double crédit** ; le défaut du tour 3 est, comme au tour
2, un crédit qui manque.

**PRD-12 sans `etat_avant_pause` — toujours tenu.** Aucune renumérotation au
tour 3 : la table 9.2 conserve T1→T12 dans l'ordre du tour 2. T7
`PAUSE_DEMANDEE` n'est accessible que depuis `etape_lecture` et `etape_maths`,
T8 `PAUSE_TERMINEE` revient sur `etapes_prevues[etape_courante].matiere`, et
`etape_courante` n'est incrémenté que par T6, après l'étape. Le `CHECK
session_etape_courante_coherente` est inchangé et impose toujours
`etape_courante IS NOT NULL` en `pause`.

**Couverture REQ-TEC / REQ-SEC.** 19 REQ-TEC et 8 REQ-SEC, chacune rattachée à
un élément qui existe et qui la porte. **Zéro [BLOQUANT] à ce titre, pour le
troisième tour consécutif.** TEC-09 porte « couverte sous condition » (ARB-11),
TEC-11 cite maintenant les deux fonctions et les trois transitions terminales.

---

## E. Sorties réelles de mes commandes

### E.1 `prisma validate` — rejoué par moi

```
$ cd /home/user/Tipi && DATABASE_URL="postgresql://u:p@localhost:5432/postgres" \
  DIRECT_URL="postgresql://u:p@localhost:5432/postgres" \
  $SP/prisma-check/node_modules/.bin/prisma validate --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
---exit:0---
```

Condition de recevabilité de ma fiche remplie pour le tour 3. Aucune base
contactée, aucun fichier déposé dans le dépôt.

### E.2 Corpus TTS et ventilation, instrument indépendant

```
entrees lues: 454 | clips: 474 | car: 21016 | moy: 44.3 | quota: 2.10%
A public: 420 / 19105 | B public: 40 / 1372 | C prive: 14 / 539
deux jetons: 0 | public total: 460
```

### E.3 Comptes de fichiers et de structures

```
$ grep -cE '^[A-Z][A-Z0-9_]*=' .env.example              -> 27
$ grep -cE '^NEXT_PUBLIC_' .env.example                  -> 3
   NEXT_PUBLIC_TTS_CACHE_URL, NEXT_PUBLIC_SPEECH_PROVIDER, NEXT_PUBLIC_APP_VERSION
$ (lignes du tableau de la section 11)                   -> 27
$ grep -c "ENABLE ROW LEVEL SECURITY" supabase/policies.sql   -> 11
$ grep -c "REVOKE ALL ON public\."    supabase/policies.sql   -> 11
$ (buckets déclarés)                                     -> 4
$ grep -c "CREATE POLICY"             supabase/policies.sql   -> 1
```

### E.4 Conformité mécanique à la section 3.7 et état du schéma

```
3.7 : AUCUN CHAMP MANQUANT sur les 9 tables
modeles: 10 | enums: 6
gem_ledger.sessionId obligatoire: true
RaisonGem: etape_lecture_terminee, etape_maths_terminee, bonus_soiree_complete
```

### E.5 La contrainte de borne, dans le SQL réel

```
$ grep -n "gem_ledger" supabase/policies.sql | grep -i "constraint\|check"
169:    SELECT 1 FROM pg_constraint WHERE conname = 'gem_ledger_delta_positif'
172:      ADD CONSTRAINT gem_ledger_delta_positif CHECK (delta > 0);
193:ALTER TABLE public.gem_ledger DROP CONSTRAINT IF EXISTS gem_ledger_delta_max_un;
197:    SELECT 1 FROM pg_constraint WHERE conname = 'gem_ledger_delta_borne'
200:      ADD CONSTRAINT gem_ledger_delta_borne CHECK (delta BETWEEN 1 AND 2);
```

**Deux contraintes seulement sur `gem_ledger` : `delta > 0` et
`delta BETWEEN 1 AND 2`. Rien ne bloque un delta de 2.** Le `DROP … IF EXISTS`
de l'ancienne est présent et précède l'ajout. V4 (ligne 407) liste bien
`gem_ledger_delta_borne`. Références résiduelles à `delta_max_un` et
`delta <= 1` : cinq, toutes historiques ou explicatives, aucune opérante.

V5, extraits des deux preuves destructives :

```
INSERT … VALUES (…, -1, 'etape_lecture_terminee');
  RAISE EXCEPTION 'ETH-04 VIOLÉE : un delta négatif a été accepté.';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'V5 OK — delta négatif refusé…';

INSERT … VALUES (…,  3, 'bonus_soiree_complete');
  RAISE EXCEPTION 'ARB-13 VIOLÉE : un delta de 3 a été accepté.';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'V5 OK — delta de 3 refusé…';

RAISE EXCEPTION 'V5 : annulation volontaire de la transaction de test.';   <-- constat 27
```

### E.6 Le bloc d'amendements, les fiches et le glob

```
$ (glob de .cursor/rules/30-copy-enfant.mdc)
globs: ["content/**", "src/app/enfant/**", "src/app/bienvenue/**",
        "src/components/enfant/**", "src/components/pilou/**", "src/lib/ai/prompts/**"]
        -> src/app/bienvenue/** présent, gwenn supprimé : ma remarque du tour 1 est CLOSE

$ (fiche tests-unitaires.md, ligne 12 et suivantes)
- Service pierres : +1 par étape, +1 bonus pour 2 étapes, …
  > **Amendement de l'Orchestrateur — ARB-08 et ARB-13.** … Cette règle a été
  > **révoquée**. … Écris tes tests contre ce barème et non contre la ligne
  > d'origine, conservée ici pour la traçabilité.
        -> amendement AU POINT D'USAGE : c'est la bonne forme

$ (fiche contenu-enfant.md)
« …pour les situations suivantes — accueil, annonce du programme, …, reprise
  d'une session interrompue. »                       -> 16 situations
$ node -e "…Object.keys(encouragements.situations).length"   -> 23 situations
$ grep -c -i "amendement\|ARB-04" .cursor/agents/contenu-enfant.md   -> 0
        -> ARB-04 non amendé, et `contenu-enfant` est relancé avant G3 (ARB-10)

$ (docs/agents/P1/produit-marketing.out.md, l. 1148-1153)
**Barème rappelé** (3.7) : +1 par étape terminée, +1 bonus si les 2 étapes du
soir sont terminées. …
**Cas d'une seule étape terminée** : … une pierre de moins affichée.
        -> INCHANGÉ : constat 28
```

### E.7 Les deux règles `grep`, rejouées sur une arborescence reconstituée

```
-- R1 (TEC-17) --
$ grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)'
(aucune ligne)   exit:1  = zéro résultat = conforme

-- R2, ÉCRITURE du ledger ou du solde --
src/lib/pierres/service.ts          <-- et rien d'autre

-- R3, LECTURE du solde --
src/app/api/coffre/route.ts
src/lib/pierres/service.ts
scripts/verifier-solde.ts
```

---

## F. Historique des trois tours

### F.1 Tour 1 — `FAIL`, 7 [MAJEUR], 12 [MINEUR]

| # | Constat | Gravité | Sort |
| --- | --- | --- | --- |
| 1 | Prénom de l'enfant dans le bucket TTS public (14 clips) | [MAJEUR] | **Fermé T2.** Deux buckets, tri par jeton, 3 affirmations fausses supprimées |
| 2 | Règle `grep` de TEC-17 impassable | [MAJEUR] | **Fermé T2.** Réécrite, ancienne et nouvelle sorties publiées |
| 3 | `_prisma_migrations` non couverte, preuve D1 fausse | [MAJEUR] | **Fermé T2.** Bloc dédié + V1 balayant `pg_tables` |
| 4 | `creditDiffere` contre transaction unique | [MAJEUR] | **Fermé T2.** Crédit dans la transaction, drapeau supprimé |
| 5 | Session périmée bloquant les soirées suivantes | [MAJEUR] | **Fermé T2.** T12 `CLOTURE_AUTOMATIQUE` |
| 6 | Qui rend `{prenom}` : 12.2 contre 8.4 | [MAJEUR] | **Fermé T2.** Règle unique, budget corrigé |
| 7 | `POST /api/indices` sans `sessionId` | [MAJEUR] | **Fermé T2.** Entrée et effet d'écriture contractualisés |
| 8 | `gem_ledger.session_id` nullable | [MINEUR] | **Fermé T2.** Colonne obligatoire |
| 9 | Deux étapes de même matière | [MINEUR] | **Fermé T2.** `TIPI_ETAPES_MEME_MATIERE` |
| 10 | « Trois contraintes » au lieu de huit | [MINEUR] | **Fermé T2.** Les huit listées dans l'en-tête |
| 11 | Trois renvois de section faux | [MINEUR] | **Fermé T2** |
| 12 | `src/lib/validation/` absent de l'arborescence | [MINEUR] | **Fermé T2** |
| 13 | `ALTER DEFAULT PRIVILEGES` sans `FOR ROLE` | [MINEUR] | **Fermé T2.** `FOR ROLE %I` + rôle imposé |
| 14 | Partie D en commentaires | [MINEUR] | **Fermé T2**, *partiellement rouvert T3 sur V5 seule* (constat 27) |
| 15 | Tailles d'upload dupliquées | [MINEUR] | **Fermé T2.** Deux variables, V7 |
| 16 | Seuil de 400 ms sans propriétaire | [MINEUR] | **Fermé T2.** `src/config/ui.config.ts` |
| 17 | PRD-13 sans porte vers le cookie parent | [MINEUR] | **Fermé T2.** `SortieParent.tsx`, cookie porté |
| 18 | TEC-09 réservée, non portée | [MINEUR] | **Fermé T2.** ARB-11, ligne de traçabilité |
| 19 | `CHECK` 0..365 contre route 0/7/30 | [MINEUR] | **Fermé T2.** Deux niveaux assumés |

### F.2 Tour 2 — `FAIL`, 3 [MAJEUR], 3 [MINEUR]

| # | Constat | Gravité | Sort | Vérifié où |
| --- | --- | --- | --- | --- |
| 20 | Le bonus n'avait qu'un créditeur, T5 | [MAJEUR] | **Fermé.** Fonction unique appelée par T5, T10 et T12, idempotente par l'unique `(session_id, raison)` | B.1 ; § 9.2, 9.4, 9.5 |
| 21 | « 2 pierres, comme une soirée à deux étapes » : faux, et ARB-06 violé | [MAJEUR] | **Fermé.** ARB-13 : forfait de 3 pierres, bonus `3 − n`, tableau des quatre cas, phrase fausse supprimée | B.2 ; § 9.5 |
| 22 | Cinquième et sixième endroits du barème non cités, dont la fiche `tests-unitaires` | [MAJEUR] | **Fermé côté architecte** : les six sont listés avec leur propriétaire. Corrigé côté Orchestrateur pour la fiche et le prompt maître ; **le sixième reste ouvert** (constat 28) | B.4 ; § 9.5 ; E.6 |
| 23 | « vérifiée par V8 » : V8 ne contrôle que le catalogue | [MINEUR] | **Fermé.** Preuve à la source + test P7 dont le porteur est nommé | § 6, fin |
| 24 | 300 ms pour trois allers-retours contre 400 pour une transaction | [MINEUR] | **Fermé.** Budgets recomposés poste par poste (80 + 120 + 150), « Lancer la session » à 250 ms, et l'absence d'habillage attribuée au **préchargement** et non à la vitesse — avec la mention explicite qu'à 400 ms on est **au** seuil et non en dessous | § 12.1 |
| 25 | Consigne de retrait des six clés oubliant le marketing | [MINEUR] | **Fermé.** Trois fichiers, trois emplacements, et le sort des textes eux-mêmes | § 10.3 |

**Sur les 25 constats des tours 1 et 2, 24 sont fermés et 1 ne dépend plus de
l'architecte.** Aucun n'a été versé au backlog.

### F.3 Tour 3 — `FAIL`, 1 [MAJEUR], 2 [MINEUR]

| # | Constat | Gravité |
| --- | --- | --- |
| 26 | `estTerminee` défini sur les `attempt` : le bonus est perdu sur le chemin nominal T5 → T9 | **[MAJEUR]** |
| 27 | V5 se termine par une `RAISE EXCEPTION` inutile qui fait échouer l'application nominale du fichier | [MINEUR] |
| 28 | Le sixième endroit du barème est déclaré traité ; il ne l'est pas | [MINEUR] |

---

## G. Observation hors livrable — elle ne compte pas dans le verdict

**G.1 — Le bloc « AMENDEMENTS » laisse ARB-04 exposé, et l'agent concerné est le
prochain lancé.** Détaillé en B.4. La fiche `.cursor/agents/contenu-enfant.md`
énumère 16 situations là où ARB-04 en impose 23, sans amendement ni ligne dans
la table. ARB-10 renvoie `contenu-enfant` produire `ui-enfant.json` et
`ui-parent.json` avant G3 : il relira cette fiche avant la prochaine porte. Je
recommande d'y porter l'amendement **au point d'usage**, comme cela a été fait
pour `tests-unitaires.md` — c'est cette forme-là qui protège — et d'ajouter la
ligne correspondante à la table, ainsi qu'une phrase de renvoi en tête de la §5.

Je note que mes deux observations de procédure du tour 2 sont **closes** :
ARB-12 est inscrit dans `GATES.md` avec la mention de la faute de traçabilité, le
journal porte les entrées des tours 1 et 2, et le glob a reçu
`src/app/bienvenue/**`.

---

## H. Ce que je propose pour l'escalade

Le tour 3 étant le dernier autorisé, voici la question fermée que je suggère
d'ouvrir dans `docs/agents/ESCALADE.md`. Elle tient en une décision.

> **Question.** Le prédicat `estTerminee`, qui commande le versement du bonus
> de pierres dans `crediterBonusSiSoireeComplete()`, doit-il être défini sur
> **les lignes `gem_ledger` déjà écrites pour l'étape** (proposition du
> contrôle), plutôt que sur **le statut des lignes `attempt`** (rédaction
> actuelle, § 9.4) ?
>
> **Pourquoi elle se pose.** Le crédit `+1` d'une étape est déclenché par
> l'événement `ETAPE_TERMINEE` ; le bonus est conditionné aux lignes `attempt`,
> écrites par une route distincte sans ordre garanti. Sur le chemin nominal, un
> enfant qui termine sa soirée peut recevoir 2 pierres au lieu des 3 qu'ARB-13
> garantit, sans qu'aucun rattrapage ne reste possible.
>
> **Coût de la correction** : une phrase en § 9.4, une ligne de commentaire dans
> le pseudo-code de § 9.5. Aucun changement de schéma, de route, de contrainte
> ni de chiffre.
>
> **Si la réponse est oui**, les constats 27 et 28 se corrigent dans le même
> mouvement (suppression d'une `RAISE EXCEPTION`, un mot dans un tableau), et
> G2 peut passer au vert sans quatrième tour de production.

Mon avis, puisqu'il vous revient de trancher : **l'architecture est bonne et
elle est prête**. Trois tours ont fermé 25 constats sans jamais un écart de
chiffre, et les deux découvertes les plus lourdes de cette porte — le cache TTS
public et la contrainte `CHECK` qui aurait rejeté le bonus — ont été trouvées
l'une par le contrôle, l'autre par le producteur en vérifiant son propre
travail. Le [MAJEUR] 26 n'est pas un défaut de conception : c'est une définition
qui manque de précision d'un cran, sur un mécanisme créé au tour 2 et modifié au
tour 3. Je le rends [MAJEUR] parce qu'il coûte une pierre à un enfant sur le
chemin nominal et qu'aucun rattrapage ne le récupère — et c'est très exactement
la classe de défaut que cette porte a passé deux tours à éliminer. Je ne le
rendrais pas moins grave parce que c'est le dernier tour.

Je n'ai proposé **aucune refonte**. Je n'ai écrit **aucun fichier de
production**, ni commit git.
