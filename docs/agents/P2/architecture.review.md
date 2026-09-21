# P2 — Contrôle adversarial de l'architecture

VERDICT: PASS_AVEC_RESERVES

Contrôleur : `controle-architecture` (lecture seule). Porte G2, **tour 4**,
autorisé par dérogation humaine (ESC-002) pour le seul contrôle du constat 26.
Livrables contrôlés : `docs/agents/P2/architecture.out.md`,
`prisma/schema.prisma`, `supabase/policies.sql`, `.env.example`.

**Tour 4 : 0 [BLOQUANT], 0 [MAJEUR], 2 [MINEUR].** Aucun [MAJEUR] : le verdict
n'est pas FAIL.

**Le constat 26 est fermé, et je l'ai vérifié en base et non à la lecture.**
La séparation des deux prédicats est réelle, `crediterBonusSiSoireeComplete()`
ne lit plus jamais `attempt`, et **je n'ai trouvé aucun chemin où le décompte du
ledger précéderait l'écriture des lignes d'étape** — l'énumération est en B.1.
Les constats 27 et 28 sont fermés eux aussi, le premier par la preuve directe
que demandait sa formulation.

J'ai tout rejoué moi-même sur un PostgreSQL 16.13 neuf : `prisma db push`, dix
applications successives de `policies.sql` en `psql -1 -v ON_ERROR_STOP=1`, les
sept chemins d'ARB-13 en données construites par moi, le test de mutation, la
recherche d'un défaut voisin, cinq attaques du rôle `anon` et quatre tests
adverses de contraintes. **Aucun des 28 chiffres annoncés n'est faux** —
quatrième tour consécutif sans un écart.

Les deux réserves ne portent pas sur l'architecture mais sur ses **instruments
de vérification** : un angle mort que j'ai su exploiter en données, et une
procédure de mutation qui n'est pas reconstituable telle qu'elle est publiée.
Aucune des deux ne justifierait de refermer la porte ; toutes deux méritent
d'être corrigées avant que `tests-unitaires` et `securite-rgpd` n'en héritent.

---

## A. Constats du tour 4

Numérotation continue : tour 1 constats 1-19, tour 2 constats 20-25, tour 3
constats 26-28.

### [MINEUR] 29 — Les invariants V9 et V10 ont un angle mort commun, que j'ai franchi en données : un bonus versé à tort sur une soirée incomplète, avec un montant faux, tombe exactement sur 3 et passe les deux.

V9 ne s'applique qu'aux sessions dont **toutes** les étapes sont créditées :

```sql
WHERE x.nb_etapes > 0
  AND x.nb_creditees = x.nb_etapes   -- soirée complète du point de vue du ledger
  AND x.total <> 3;
```

V10 n'attrape que les totaux hors `{0, 1, 3}`. Entre les deux subsiste une
fenêtre : une soirée **incomplète** (`nb_creditees < nb_etapes`, donc V9 ne
regarde pas) dont le total vaut néanmoins 3 (donc V10 ne dit rien).

Je l'ai construite et jouée sur la base réelle : session à **2 étapes
programmées**, **1 seule créditée**, plus une ligne `bonus_soiree_complete` de
**2** — montant qui serait correct pour un Soir léger, pas pour deux étapes.
Total = 3. Sortie complète en E.6 :

```
### VOISIN 2 : bonus verse a tort sur une soiree INCOMPLETE, montant faux, total=3 ###
   etapes programmees = 2
   total cas 3 = 3
 V9 OK — toute soirée complète vaut exactement 3 pierres.
 V10 OK — aucune session close hors {0, 1, 3} pierres.
   exit:0
```

**Les deux invariants déclarent la base saine alors qu'une pierre a été versée
sans contrepartie.** La base ne peut pas s'y opposer non plus : le `CHECK
gem_ledger_delta_borne` borne le delta à 1..2 sans rien savoir du nombre
d'étapes.

Je pèse la gravité honnêtement. Le défaut n'est pas atteignable par le code tel
qu'il est décrit : `crediterBonusSiSoireeComplete()` refuse de verser tant que
`creditees !== etapes.length`, et le montant est `3 - etapes.length`. Il faudrait
**deux** bugs simultanés. C'est donc un angle mort d'instrument, pas un défaut
d'architecture — d'où [MINEUR] et non [MAJEUR]. Mais c'est l'instrument que P5 et
P7 vont hériter, et l'argument qui le justifie — « un invariant attrape ce qu'une
re-dérivation confirmerait » — mérite d'être vrai jusqu'au bout.

Correction attendue, une clause dans V9 : signaler aussi les sessions finales où
`nb_creditees < nb_etapes` **et** où il existe une ligne
`bonus_soiree_complete`. Énoncé : *un bonus n'existe que sur une soirée dont
toutes les étapes sont créditées.* C'est le second versant de l'invariant
d'ARB-13, celui qui dit quand le bonus **ne doit pas** être là, et le livrable
n'énonce aujourd'hui que le premier.

---

### [MINEUR] 30 — La procédure du test de mutation publiée en 17.6.3 n'est pas reconstituable telle quelle : suivie à la lettre, elle ne fait pas rougir V9 mais V6.

Le résultat annoncé est **vrai** — je l'ai reproduit, message pour message. La
procédure qui y mène, non.

`architecture.out.md` § 17.6.3, transcription de la mutation :

> ```
> $ DELETE FROM gem_ledger WHERE session_id = '…0001' AND raison = 'bonus_soiree_complete';
> $ SELECT … la session porte maintenant 2 pierres pour 2 étapes
>
> $ psql -1 -v ON_ERROR_STOP=1 -f policies.sql
> ERROR:  ARB-13 VIOLÉE — soirée(s) complète(s) ne valant pas 3 pierres : …
> ```

Supprimer une ligne de `gem_ledger` sans toucher à `child.gem_balance` rompt
l'invariant du solde, et **V6 s'exécute avant V9** (lignes 544 et 611 du
fichier). Le fichier s'arrête donc sur V6, pas sur V9. C'est ce que j'ai obtenu
en suivant la procédure publiée :

```
=== policies.sql sur la base MUTEE ===
---exit:3---
ERROR:  SEC-06 : 1 enfant(s) dont le solde diffère de la somme du ledger
```

Il manque une étape non publiée : réaligner `child.gem_balance` sur le ledger
muté, pour que la mutation n'exerce **que** le barème. Une fois cette étape
ajoutée, V9 rougit exactement comme annoncé, avec le même libellé :

```
NOTICE:  V6 OK — solde == somme du ledger pour tous les enfants.
ERROR:  ARB-13 VIOLÉE — soirée(s) complète(s) ne valant pas 3 pierres :
        50000000-0000-0000-0000-000000000001 (2 pierres pour 2 étape(s))
```

`40-protocole-agents.mdc`, règle 2, demande qu'un contrôleur puisse
**reconstituer la procédure**, pas seulement vérifier le résultat. Ici je ne
pouvais pas : j'ai dû diagnostiquer l'écart et inventer l'étape manquante. Le
paragraphe d'honnêteté de 17.6.3 sur la première mutation sans `COMMIT` montre
que l'auteur connaît le sujet ; c'est pourquoi l'omission mérite d'être
signalée plutôt que passée.

Correction attendue : ajouter l'étape de réalignement du solde à la
transcription, et une phrase disant pourquoi — **une mutation doit n'exercer
qu'un invariant à la fois**, sans quoi c'est un autre qui rougit et l'on conclut
faux. C'est aussi la consigne dont `controle-tests` aura besoin en P5.

---

## B. Les points que vous m'avez demandé de juger

### B.1 — La séparation des deux prédicats : vérifiée, et aucun chemin ne l'invalide

**Ce que le livrable dit** (§ 9.5, tableau des prédicats) :

| Prédicat | Fondé sur | Employé par |
| --- | --- | --- |
| `etapeCreditee(tx, session, matiere)` | **Le ledger** : existe-t-il une ligne `gem_ledger` pour `(session_id, raison_de_cette_matiere)` ? | **Le bonus**, et lui seul |
| `etapeAchevee(session, etape)` | Les lignes `attempt` | **T10 et T12 uniquement**, pour décider quelles étapes rattraper |

Et le code du bonus ne lit effectivement plus que le ledger :

```ts
const creditees = await tx.gemLedger.count({
  where: { sessionId: session.id,
           raison: { in: ['etape_lecture_terminee', 'etape_maths_terminee'] } },
});
if (creditees !== etapes.length) return 0;
```

C'est la correction que je recommandais au tour 3, et le diagnostic qui
l'accompagne est meilleur que le mien : je proposais de changer la définition ;
lui a vu que **le nom portait deux questions** et les a séparées. `etapeAchevee`
garde un usage légitime — savoir quoi rattraper — et ne contamine plus la
décision de versement.

**J'ai cherché un chemin où le décompte précéderait l'écriture des lignes
d'étape. Il n'y en a pas.** Les trois créditeurs, vérifiés un par un :

| Créditeur | État du ledger à l'appel | Verdict |
| --- | --- | --- |
| **T5** `ETAPE_TERMINEE`, dernière étape | Les étapes antérieures ont été créditées par T4, dans des transactions committées ; celle-ci vient de l'être dans la **même** transaction, juste avant (« crédit +1, **puis** … », table 9.2) | ✓ Le `count` voit sa propre écriture |
| **T10** `ABANDON_PARENT` | Le rattrapage écrit d'abord les étapes achevées et non créditées, **puis** appelle le bonus | ✓ |
| **T12** `CLOTURE_AUTOMATIQUE` | Idem | ✓ |

Et les transitions qui n'appellent pas le bonus ne le doivent pas :

- **T4** ne l'appelle pas, et c'est correct : sa garde est « une étape suit »,
  donc la soirée n'est jamais complète à ce moment. Sur une soirée à une seule
  étape, T4 est d'ailleurs inatteignable (aucune étape ne suit) — seul T5 joue.
- **T9** `CLOTURE_VUE` ne crédite rien : T5 l'a toujours précédé. C'était le
  dernier train manqué du constat 26 ; il ne l'est plus, puisque T5 verse
  désormais.
- **T3** (`sansDevoir`) est couvert par la garde `etapes.length === 0`.

Une dépendance croisée mérite d'être nommée, parce qu'elle est maintenant
porteuse : le `count` compare un nombre de lignes à `etapes.length`, et l'unique
`(session_id, raison)` plafonne à deux raisons d'étape. Si une session pouvait
programmer deux étapes de la **même** matière, le compte n'atteindrait jamais
`etapes.length` et le bonus ne tomberait jamais. C'est le constat 9 du tour 1 qui
l'interdit (`TIPI_ETAPES_MEME_MATIERE`, § 8.3). La garde existe, elle est au bon
endroit — mais elle est passée du statut de confort à celui de condition du
barème, et le livrable ne le dit pas. Je ne l'érige pas en constat : la garde est
là et elle est testable. Je le signale pour que personne ne la retire un jour en
la croyant décorative.

### B.2 — Les invariants : ils capturent bien le défaut, l'argument est juste à une nuance près, et ils laissent passer un voisin

**Capturent-ils le défaut du constat 26 ?** Oui, et je l'ai prouvé en le
rejouant : bonus supprimé sur une soirée complète à deux étapes, V9 rougit en
nommant la session, V10 aussi ; bonus restauré, les deux reverdissent (E.5).
L'invariant n'est pas décoratif.

**Mieux : j'ai vérifié qu'il attrape aussi la forme que V10 ne voit pas.** J'ai
supprimé le bonus d'un **Soir léger** — total = 1, qui appartient à `{0, 1, 3}` :

```
### VOISIN 1 : Soir leger dont le bonus manque (total=1, donc DANS {0,1,3}) ###
   total cas 2 = 1
50000000-…-000000000002 (1 pierres pour 1 étape(s))      <- V9 rougit
   exit:3
   -> V10 seule :  exit:0  V10 OK — aucune session close hors {0, 1, 3} pierres.
```

**V10 est aveugle à ce cas, V9 l'attrape.** C'est une précision utile sur la
formule « V10 est la forme la plus courte du constat 26 » : elle ne vaut que
pour la soirée à deux étapes. Sur un Soir léger, seul V9 protège. Les deux ne
sont pas redondants, ils sont complémentaires — et c'est V9 qui porte la
garantie.

**L'argument « invariant plutôt que re-dérivation » est juste, à une nuance
près.** Le livrable écrit qu'« un test qui aurait recalculé `3 − n` et l'aurait
comparé au code aurait trouvé les deux d'accord ». C'est vrai d'une re-dérivation
du **montant** — comparer la valeur de la ligne `bonus_soiree_complete` à
`3 − n` ne prouve rien quand la ligne est **absente** : il n'y a rien à
comparer, et le test passe. Ce n'est pas vrai d'une re-dérivation du **total**,
qui aurait attendu `n + (3 − n)` et trouvé 2 : elle aurait vu le constat 26
elle aussi. Là où l'invariant est strictement supérieur, c'est sur le cas qu'il
cite plus loin et qui est le bon : **une règle de barème fausse mais
uniformément appliquée**, que toute re-dérivation partageant la règle
confirmerait. La conclusion tient, la justification gagnerait à être énoncée sur
ce cas-là plutôt que sur le constat 26.

**Laissent-ils passer un voisin ?** Oui, exactement un, et je l'ai franchi :
c'est le constat 29. Un bonus versé à tort sur une soirée incomplète, du mauvais
montant, tombe sur 3 et passe les deux vérifications. L'invariant énonce quand le
bonus **doit** être là ; il n'énonce jamais quand il **ne doit pas** l'être.

### B.3 — La limite énoncée : acceptable, et elle ne masque pas de huitième chemin

Le livrable écrit :

> « Si **ni** l'événement de fin d'étape **ni** la finalisation des `attempt`
> n'atteignent le serveur […] rien en base n'atteste que l'étape a été faite, et
> T12 ne la créditera pas : la soirée vaudra 1 pierre au lieu de 3. Ce n'est pas
> un défaut qu'une définition de prédicat peut réparer : le serveur n'a aucune
> preuve. »

**La limite est juste, et elle est minimale.** J'ai déroulé les quatre
combinaisons de preuve pour la dernière étape :

| Événement `ETAPE_TERMINEE` | `attempt` finalisés | Qui crédite | Total |
| --- | --- | --- | --- |
| arrive | arrivés | T5 | **3** |
| arrive | **n'arrivent pas** | T5, via le ledger — c'est le constat 26 corrigé | **3** |
| **n'arrive pas** | arrivés | T12 (ou T10), via `etapeAchevee` puis le bonus | **3** |
| **n'arrive pas** | **n'arrivent pas** | personne | **1** |

Les deux cas partiels se rattrapent chacun par un canal différent, et c'est
précisément ce que la séparation des prédicats a rendu possible : le ledger
couvre la première ligne d'échec, les `attempt` couvrent la seconde. Seule
l'absence **totale** de preuve reste, et elle est irréparable par construction —
aucun prédicat ne peut attester d'un travail dont rien n'est parvenu au serveur.
Inventer une pierre dans ce cas serait pire : ce serait créditer sans fait.

**Elle ne masque pas de huitième chemin.** J'ai cherché les sorties du graphe :
les seules transitions vers un état final sont T3, T5, T9, T10 et T12, toutes
examinées en B.1. Une session qui n'atteint jamais d'état final n'est pas un
chemin — elle reste reprenable, et T12 la ferme à la première ouverture d'un
soir ultérieur. Et T12 ne se déclenche pas le soir même (garde sur
`session.date`), ce qui préserve la reprise de PRD-18.

Un mot sur la formulation : « la soirée vaudra 1 pierre au lieu de 3 » suppose
qu'une étape au moins a été créditée. Si l'appareil s'éteint pendant la
**première** étape, la soirée vaut 0. Le livrable décrit le cas le plus fréquent,
pas le pire ; c'est sans conséquence, mais un lecteur pressé pourrait croire à
un plancher.

---

## C. Chiffres annoncés contre chiffres réels

Tous recomptés ou rejoués par moi. **Aucun écart, sur 28 grandeurs.**

| Grandeur | Annoncé | Mesuré | Écart |
| --- | --- | --- | --- |
| Entrées lues (canal `tts` / `les_deux`) | 454 | 454 | — |
| Clips distincts | 474 | 474 | — |
| Caractères du corpus fixe | 21 016 | 21 016 | — |
| Longueur moyenne | 44,3 | 44,3 | — |
| Part du quota mensuel | 2,10 % | 2,10 % | — |
| A — sans jeton → public | 420 / 19 105 | 420 / 19 105 | — |
| B — `{matiere}` → public | 40 / 1 372 | 40 / 1 372 | — |
| C — `{prenom}` → privé | 14 / 539 | 14 / 539 | — |
| Clips à deux jetons | 0 | 0 | — |
| Public / privé | 460 / 14 | 460 / 14 | — |
| Variables `.env.example` | 27 | 27 | — |
| Variables `NEXT_PUBLIC_` | 3 | 3 | — |
| Lignes du tableau § 11 | 27 | 27 | — |
| Modèles Prisma | 10 | 10 | — |
| Énumérations | 6 | 6 | — |
| Conformité 3.7 | aucun champ absent | aucun champ absent | — |
| `prisma validate` | valide, exit 0 | valide, exit 0 | — |
| `prisma db push` | schéma appliqué | appliqué, `Done in 165ms` | — |
| Tables `public` après `db push` | 10 + `_prisma_migrations` fabriquée = 11 | 10, puis 11 | — |
| `policies.sql` en `psql -1 -v ON_ERROR_STOP=1` | exit 0 | **exit 0** | — |
| Vérifications exécutées | 10 (V1→V10) | 10, toutes vertes | — |
| Tables couvertes par la RLS | 11 | 11 (`rowsecurity = t` partout) | — |
| Buckets | 4, dont `tts-prive` privé | 4, V8 verte | — |
| Cas 1 — deux étapes | 3 pierres | **3** | — |
| Cas 2 — Soir léger | 3 pierres | **3** | — |
| Cas 3 — une seule terminée | 1 pierre | **1** | — |
| Cas 4 — `sansDevoir` | 0 pierre | **0** | — |
| Cas 5 — constat 26 corrigé | 3 pierres | **3** | — |
| Cas 6 — clôture automatique | 3 pierres | **3** | — |
| Attaques `anon` refusées | 5 | 5, solde inchangé | — |
| Règle R1 (TEC-17) | 0 résultat | 0 (exit 1) | — |
| Règle R2 (écriture du solde) | `service.ts` seul | `service.ts` seul | — |

**Quatrième tour consécutif sans un chiffre faux.** Sur les quatre tours, aucune
grandeur annoncée par l'architecte ne s'est révélée inexacte, y compris celles
qu'il a introduites en cours de route et celles qu'il a mesurées lui-même sur une
base.

---

## D. Non-régression

**Conformité champ par champ à la section 3.7 — intacte.** Contrôle mécanique
(E.7) : aucun champ de 3.7 absent ni renommé sur les neuf tables, 10 modèles, 6
énumérations. Le schéma n'a pas été modifié au tour 4, et `prisma db push` l'a
appliqué pour de bon sur une base neuve : **il ne se contente plus d'être
valide, il crée réellement ses tables**.

**RLS table par table — vérifiée en base, plus seulement au catalogue.** Après
application, `rowsecurity = t` sur les **onze** tables de `public`,
`_prisma_migrations` comprise. J'ai vérifié que le bloc du constat 3 fait bien
passer cette table de `f` à `t` (E.3). J'ai aussi vérifié que **V1 n'est pas
décoratif** : en ajoutant une table sans RLS, le fichier échoue en la nommant,
puis reverdit après retrait (E.4).

**Aucun double crédit — prouvé en données.** La réinsertion du même
`(session_id, raison)` est refusée par la base :

```
ERROR:  duplicate key value violates unique constraint "gem_ledger_session_id_raison_key"
DETAIL:  Key (session_id, raison)=(…0001, bonus_soiree_complete) already exists.
```

**PRD-12 sans `etat_avant_pause` — inchangé.** La table 9.2 conserve T1→T12 dans
l'ordre du tour 2 ; aucune renumérotation au tour 4. La pause reste accessible
depuis les deux seuls états d'étape, `etape_courante` n'est incrémenté que par
T6, et le `CHECK` l'impose non nul en `pause` — refus vérifié en base (E.8).

**Étanchéité des buckets — inchangée**, et V8 verte à chaque application. Le tri
reste structurel, le décideur unique, les préfixes disjoints, une seule
`CREATE POLICY` dans tout le fichier.

**Les autres garde-fous, éprouvés en base et non plus lus** : seconde session
active refusée (unique partiel, PRD-18), état incohérent refusé (`CHECK`,
TEC-10), delta négatif refusé (ETH-04). Sortie en E.8.

Une observation neutre au passage : `gem_ledger_delta_borne CHECK (delta BETWEEN
1 AND 2)` subsume `gem_ledger_delta_positif CHECK (delta > 0)`, si bien qu'un
delta négatif est désormais rejeté au nom de la **borne** et non de la
contrainte dédiée à ETH-04 — c'est ce que montre le message d'erreur. Les deux
contraintes existent, V4 exige les deux, rien n'est cassé ; je le note pour
qu'un futur lecteur d'un journal d'erreur ne croie pas ETH-04 disparue.

---

## E. Sorties réelles de mes commandes

Environnement : PostgreSQL **16.13** (Ubuntu), cluster neuf créé par `initdb`
pour ce contrôle, port 55432, détruit à la fin. Émulation minimale de Supabase
créée par moi : rôles `anon` et `authenticated`, `GRANT USAGE ON SCHEMA public`
et `ALTER DEFAULT PRIVILEGES … GRANT ALL` **pour que les `REVOKE` du fichier
aient réellement quelque chose à retirer**, schéma `storage` avec `buckets` et
`objects`. Ce n'est pas un projet Supabase : ni PostgREST, ni l'API Storage —
même limite que celle que le livrable énonce, et elle reste celle de P7.

### E.1 `prisma validate` et `prisma db push`

```
$ prisma validate --schema prisma/schema.prisma
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
---exit:0---

$ prisma db push --schema prisma/schema.prisma --skip-generate
Datasource "db": PostgreSQL database "tipi", schema "public" at "127.0.0.1:55432"
🚀  Your database is now in sync with your Prisma schema. Done in 165ms

$ select count(*) from pg_tables where schemaname='public'   ->  10
attempt calibration_log child exercise family gem_ledger homework
reward_threshold session settings_access
```

**Précision que le livrable gagnerait à faire** : `db push` crée **10** tables.
La onzième, `_prisma_migrations`, n'est créée ni par `db push` ni par le schéma —
l'architecte le dit en 17.6 (« fabriquée exprès ») mais la juxtaposition de
17.6.1 donne à lire que `db push` en produit 11. Trop ténu pour un constat ;
signalé pour la précision.

### E.2 Application atomique — la preuve du constat 27

L'invocation que je désignais comme catastrophique au tour 3, sur une base où
`_prisma_migrations` n'existe pas encore :

```
$ psql -d tipi -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
---exit:0---
NOTICE:  public._prisma_migrations absente : jouez d'abord prisma migrate deploy.
NOTICE:  ALTER DEFAULT PRIVILEGES posé pour le rôle postgres. Ce rôle doit être celui de DIRECT_URL.
NOTICE:  constraint "gem_ledger_delta_max_un" of relation "gem_ledger" does not exist, skipping
NOTICE:  policy "tts_cache_lecture_publique" for relation "storage.objects" does not exist, skipping
NOTICE:  V1 OK — RLS activée sur toutes les tables de public.
NOTICE:  V2 OK — aucune policy sur les tables métier.
NOTICE:  V3 OK — aucun privilège de table pour anon ni authenticated.
NOTICE:  V4 OK — les 8 contraintes de la partie B sont en place.
NOTICE:  V5 ignorée — base vide, rejouer après le seed.
NOTICE:  V6 OK — solde == somme du ledger pour tous les enfants.
NOTICE:  V7 — devoirs: 8388608 octets, audios: 10485760 octets (…)
NOTICE:  V8 OK — tts-prive existe et est privé.
NOTICE:  V9 OK — toute soirée complète vaut exactement 3 pierres.
NOTICE:  V10 OK — aucune session close hors {0, 1, 3} pierres.
```

**Exit 0 sous `-1 -v ON_ERROR_STOP=1` : le constat 27 est prouvé corrigé**, et
le bloc `_prisma_migrations` dégrade proprement quand la table n'existe pas
encore, comme annoncé. Le fichier est rejouable : je l'ai appliqué **dix fois**
au cours de ce contrôle, toujours avec le même résultat.

### E.3 Couverture de `_prisma_migrations` (constat 3, vérifié en données)

```
$ CREATE TABLE public._prisma_migrations (…);
$ select tablename, rowsecurity … where tablename='_prisma_migrations'
_prisma_migrations|f                       <- avant

$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql      ---exit:0---

_prisma_migrations|t  attempt|t  calibration_log|t  child|t  exercise|t
family|t  gem_ledger|t  homework|t  reward_threshold|t  session|t
settings_access|t                          <- après, 11 tables
```

### E.4 V1 est-il décoratif ? Test de mutation sur la RLS

```
$ CREATE TABLE public.table_intruse (id int);
$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
ERROR:  SEC-03 : RLS absente sur : table_intruse
---exit:3---

$ DROP TABLE public.table_intruse;
$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
NOTICE:  V1 OK — RLS activée sur toutes les tables de public.
---exit:0---
```

V1 rougit, nomme la table, reverdit. Non décoratif.

### E.5 Les sept chemins d'ARB-13, en données construites par moi

Sept sessions insérées à la main, indépendamment des trois de l'architecte :

```
 cas |      etat      | etapes | etapes_creditees | bonus | total_pierres
-----+----------------+--------+------------------+-------+---------------
 1   | termine        |      2 |                2 |     1 |             3
 2   | termine        |      1 |                1 |     2 |             3
 3   | abandon_parent |      2 |                1 |     0 |             1
 4   | termine        |      0 |                0 |     0 |             0
 5   | termine        |      2 |                2 |     1 |             3
 6   | termine        |      1 |                1 |     2 |             3
 7   | etape_maths    |      2 |                1 |     0 |             1   (non finale)

 gem_balance | somme_ledger
          14 |           14
```

**Les cas 2 et 6 sont des Soirs légers : 3 pierres, comme les cas 1 et 5 à deux
étapes.** ARB-13 est vérifié en données, et ARB-06 avec — le Soir léger est
indiscernable dans le coffre. Le cas 3, interrompu, vaut 1 : le bonus ne tombe
pas. Le cas 7, non final, est hors du champ des invariants, ce qui est correct :
une session en cours a légitimement des pierres partielles.

Application du fichier sur ces données : **exit 0, V5a/V5b/V5c, V6, V9, V10
vertes**, et V5 ne laisse rien derrière elle (12 lignes de ledger avant comme
après, dont exactement 2 à `delta = 2` : les deux bonus de Soir léger).

### E.6 Test de mutation, et recherche d'un défaut voisin

Mutation, procédure telle que publiée en 17.6.3 :

```
$ DELETE FROM gem_ledger WHERE session_id='…0001' AND raison='bonus_soiree_complete';
DELETE 1
$ select sum(delta) … where session_id='…0001'   ->  2      (mutation bien PERSISTÉE)

$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
ERROR:  SEC-06 : 1 enfant(s) dont le solde diffère de la somme du ledger
---exit:3---                                   <- V6, pas V9 : constat 30
```

Avec l'étape manquante (réalignement du solde), la mutation n'exerce plus que le
barème :

```
$ UPDATE child SET gem_balance=(SELECT SUM(delta) FROM gem_ledger WHERE child_id=child.id);
$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
NOTICE:  V6 OK — solde == somme du ledger pour tous les enfants.
ERROR:  ARB-13 VIOLÉE — soirée(s) complète(s) ne valant pas 3 pierres :
        50000000-0000-0000-0000-000000000001 (2 pierres pour 2 étape(s))
---exit:3---

$ V10 seule :
ERROR:  ARB-13 VIOLÉE — total de pierres hors {0,1,3} : 50000000-…-000000000001 = 2
---exit:3---

$ INSERT … bonus restauré ; UPDATE child … ;
$ psql -1 -v ON_ERROR_STOP=1 -f supabase/policies.sql
NOTICE:  V9 OK — toute soirée complète vaut exactement 3 pierres.
NOTICE:  V10 OK — aucune session close hors {0, 1, 3} pierres.
---exit:0---
```

**Les deux invariants rougissent, nomment la session fautive, et reverdissent.**
Le résultat annoncé en 17.6.3 est authentique.

Recherche d'un défaut voisin, deux tentatives :

```
### VOISIN 1 : Soir leger dont le bonus manque (total=1, donc DANS {0,1,3}) ###
   total cas 2 = 1
50000000-…-000000000002 (1 pierres pour 1 étape(s))    <- V9 ROUGIT
   exit:3
   -> V10 seule :  exit:0  V10 OK …                     <- V10 AVEUGLE

### VOISIN 2 : bonus verse a tort sur une soiree INCOMPLETE, montant faux, total=3 ###
   etapes programmees = 2
   total cas 3 = 3
 V9 OK — toute soirée complète vaut exactement 3 pierres.
 V10 OK — aucune session close hors {0, 1, 3} pierres.
   exit:0                                               <- LES DEUX AVEUGLES
```

Voisin 1 confirme la complémentarité de V9 et V10 ; voisin 2 est le constat 29.

### E.7 Corpus TTS, variables, schéma, règles `grep`

```
entrees 454 | clips 474 | car 21016 | moy 44.3 | quota 2.10%
A 420/19105 | B 40/1372 | C 14/539 | deux jetons 0 | public 460

$ grep -cE '^[A-Z][A-Z0-9_]*=' .env.example     -> 27
$ grep -cE '^NEXT_PUBLIC_' .env.example         -> 3
$ (lignes du tableau § 11)                      -> 27
3.7 : aucun champ manquant | modeles 10 | enums 6

-- R1 (TEC-17) --   (aucune ligne)   R1 exit:1
-- R2 écriture --   src/lib/pierres/service.ts
```

### E.8 Cinq attaques `anon` et quatre tests adverses de contraintes

```
--- 1. LECTURE de child ---            ERROR:  permission denied for table child
--- 2. LECTURE de gem_ledger ---       ERROR:  permission denied for table gem_ledger
--- 3. ECRITURE de pierres (n.3) ---   ERROR:  permission denied for table gem_ledger
--- 4. MODIFICATION du solde ---       ERROR:  permission denied for table child
--- 5. LECTURE du code_hash ---        ERROR:  permission denied for table settings_access
--- solde reel apres les tentatives --- 14        (inchangé)

1. DOUBLE CREDIT  -> ERROR: duplicate key … "gem_ledger_session_id_raison_key"
                     DETAIL: Key (session_id, raison)=(…0001, bonus_soiree_complete) already exists.
2. 2e SESSION ACTIVE -> ERROR: duplicate key … "session_une_active_par_enfant"
                     DETAIL: Key (child_id)=(c0000000-…-000000000001) already exists.
3. ETAT INCOHERENT -> ERROR: … violates check constraint "session_etape_courante_coherente"
4. DELTA NEGATIF   -> ERROR: … violates check constraint "gem_ledger_delta_borne"
```

Le refus survient au niveau des privilèges, avant l'évaluation de RLS : c'est la
couche 3 du modèle de la section 4, et elle rend les autres redondantes plutôt
qu'inutiles. Ce qui n'est pas prouvé ici, et que je ne prétends pas : le
comportement de PostgREST et de l'API Storage de Supabase.

### E.9 Les deux mineurs du tour 3

```
$ grep -n "annulation volontaire|Jouez-la donc" supabase/policies.sql
ABSENTE - supprimée                                        <- constat 27

$ grep -n "V5c|pile au seuil" supabase/policies.sql
513: RAISE NOTICE 'V5c non concluante — aucune session sans ligne bonus_soiree_complete.';
523: RAISE NOTICE 'V5c non concluante — collision d''unicité.';
525: RAISE NOTICE 'V5c OK — delta de 2 accepté (pile au seuil), insertion annulée.'; 

§ 9.5, endroit n° 6 : « Pas à moi — et À TRAITER. Au contrôle du tour 3, puis à
ma propre relecture du tour 4, la ligne porte encore "+1 bonus si les 2 étapes
du soir sont terminées". La phrase suivante … est doublement fausse sous
ARB-13 »                                                    <- constat 28
```

Vérification de l'état réel du livrable marketing : la ligne a **migré de 1148 à
1161** (le fichier a gagné des lignes ailleurs) et porte toujours le barème
révoqué. Le livrable a eu raison de la désigner par sa section — « "Barème
rappelé" en 7.8 » — plutôt que par un numéro de ligne, qui aurait déjà vieilli.

---

## F. Historique des quatre tours

### F.1 Tour 1 — `FAIL`, 7 [MAJEUR], 12 [MINEUR] — tous fermés

| # | Constat | Sort |
| --- | --- | --- |
| 1 | Prénom de l'enfant dans le bucket TTS public (14 clips) | Fermé T2 — deux buckets, tri par jeton |
| 2 | Règle `grep` de TEC-17 impassable | Fermé T2 — réécrite, deux sorties publiées |
| 3 | `_prisma_migrations` non couverte, preuve D1 fausse | Fermé T2 — **vérifié en base au T4** |
| 4 | `creditDiffere` contre transaction unique | Fermé T2 — crédit dans la transaction |
| 5 | Session périmée bloquant les soirées suivantes | Fermé T2 — T12 `CLOTURE_AUTOMATIQUE` |
| 6 | Qui rend `{prenom}` : 12.2 contre 8.4 | Fermé T2 — règle unique |
| 7 | `POST /api/indices` sans `sessionId` | Fermé T2 — entrée et écriture contractualisées |
| 8 | `gem_ledger.session_id` nullable | Fermé T2 — colonne obligatoire |
| 9 | Deux étapes de même matière | Fermé T2 — **devenu condition du barème au T4**, voir B.1 |
| 10 | « Trois contraintes » au lieu de huit | Fermé T2 |
| 11 | Trois renvois de section faux | Fermé T2 |
| 12 | `src/lib/validation/` absent de l'arborescence | Fermé T2 |
| 13 | `ALTER DEFAULT PRIVILEGES` sans `FOR ROLE` | Fermé T2 — **`FOR ROLE` observé au T4** |
| 14 | Partie D en commentaires | Fermé T2, **exécutée pour de bon au T4** |
| 15 | Tailles d'upload dupliquées | Fermé T2 — V7 les affiche |
| 16 | Seuil de 400 ms sans propriétaire | Fermé T2 — `ui.config.ts` |
| 17 | PRD-13 sans porte vers le cookie parent | Fermé T2 — `SortieParent.tsx` |
| 18 | TEC-09 réservée, non portée | Fermé T2 — ARB-11 |
| 19 | `CHECK` 0..365 contre route 0/7/30 | Fermé T2 |

### F.2 Tour 2 — `FAIL`, 3 [MAJEUR], 3 [MINEUR] — tous fermés

| # | Constat | Sort |
| --- | --- | --- |
| 20 | Le bonus n'avait qu'un créditeur, T5 | Fermé T3 — fonction unique, trois créditeurs |
| 21 | « 2 pierres comme une soirée à deux étapes » : faux, ARB-06 violé | Fermé T3 — **ARB-13, vérifié en données au T4** |
| 22 | Cinquième et sixième endroits du barème non cités | Fermé T3 côté architecte ; endroit 6 traité par l'Orchestrateur |
| 23 | « vérifiée par V8 » : V8 ne contrôle que le catalogue | Fermé T3 — preuve à la source + test P7 nommé |
| 24 | 300 ms contre 400 pour une transaction | Fermé T3 — budgets recomposés, préchargement nommé |
| 25 | Retrait des six clés oubliant le marketing | Fermé T3 — trois fichiers |

### F.3 Tour 3 — `FAIL`, 1 [MAJEUR], 2 [MINEUR] — tous fermés

| # | Constat | Sort, vérifié au tour 4 |
| --- | --- | --- |
| 26 | **[MAJEUR]** `estTerminee` fondé sur les `attempt` : bonus perdu sur le chemin nominal | **FERMÉ.** Deux prédicats séparés, `etapeCreditee()` fondé sur le ledger ; aucun chemin où le décompte précède les écritures (B.1) ; cas 5 vérifié en données (E.5) |
| 27 | `RAISE EXCEPTION` finale de V5 | **FERMÉ**, prouvé directement : `psql -1 -v ON_ERROR_STOP=1` rend exit 0 (E.2) |
| 28 | Sixième endroit du barème déclaré traité à tort | **FERMÉ.** Statut « À TRAITER », citation, double fausseté relevée (E.9) |

### F.4 Tour 4 — `PASS_AVEC_RESERVES`, 2 [MINEUR]

| # | Constat |
| --- | --- |
| 29 | Angle mort commun à V9 et V10 : un bonus versé à tort sur une soirée incomplète, montant faux, total 3, passe les deux |
| 30 | La procédure de mutation de 17.6.3 n'est pas reconstituable : suivie à la lettre, c'est V6 qui rougit, pas V9 |

**Bilan des quatre tours : 30 constats, dont 11 [MAJEUR], tous fermés sauf les
deux réserves de ce tour.** Aucun n'a été versé au backlog.

---

## G. Réserves, et ce que j'en attends

Les deux réserves ne bloquent pas la porte. Elles portent sur des instruments de
vérification dont `tests-unitaires` (P5) et `securite-rgpd` (P7) vont hériter, et
c'est là qu'elles doivent être traitées :

1. **Constat 29** — une clause dans V9 : *un bonus n'existe que sur une soirée
   dont toutes les étapes sont créditées*. C'est le second versant de
   l'invariant d'ARB-13. À porter dans `supabase/policies.sql` et dans les tests
   de P5, qui reprendront le même énoncé.
2. **Constat 30** — publier l'étape manquante de la mutation, et la règle qu'elle
   illustre : **une mutation doit n'exercer qu'un invariant à la fois**. Cette
   phrase servira directement à `controle-tests`, dont le protocole impose
   exactement cet exercice sur huit tests critiques.

Je verse ces deux points au dossier de P5 plutôt qu'à un cinquième tour de P2 :
ils ne changent ni le schéma, ni les routes, ni les contraintes, ni un seul
chiffre, et l'architecture qu'ils accompagnent est vérifiée.

**Un mot pour finir, puisque ce tour a été obtenu par dérogation.** Ce qui
distingue ce livrable, au terme de quatre tours, n'est pas qu'il soit exempt de
défauts — il en a eu trente. C'est que la nature de ses preuves a changé en cours
de route : d'un document qui affirmait, il est devenu un fichier qui s'exécute et
qui échoue bruyamment quand il a tort. Les deux défauts que l'architecte a
trouvés seuls en exécutant enfin son propre SQL — une vérification qui ne
s'exécutait jamais, une mutation sans `COMMIT` qui n'avait rien prouvé — valent
mieux qu'un rapport sans aveu : ce sont des défauts qu'aucune relecture n'aurait
montrés, et il les a publiés au lieu de les taire. C'est la raison pour laquelle
je rends un verdict positif, et non la fatigue d'un quatrième tour.

Je n'ai proposé **aucune refonte**. Je n'ai écrit **aucun fichier de
production**, ni commit git. Le cluster PostgreSQL créé pour ce contrôle a été
arrêté et supprimé.
