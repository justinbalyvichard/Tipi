VERDICT: PASS_AVEC_RESERVES

# Contrôle de `ui-enfant.json`, `ui-parent.json` et du retrait ARB-12 — tour 3, contrôle final

Contrôleur : `controle-produit` (lecture seule). Aucun fichier de produit n'a été
écrit ni modifié. Aucun commit git.

Objets contrôlés : `content/ui-enfant.json`, `content/ui-parent.json`,
`docs/agents/P1/ui-content.out.md`, et l'état des quatre fichiers de `content/`.

Références : `docs/agents/GATES.md` (ARB-01 à **ARB-15**),
`docs/agents/P1/produit-marketing.out.md`, `TIPI-PROMPT-CURSOR.md` §1 à §3,
`.cursor/rules/00-charte-tipi.mdc`, `.cursor/rules/30-copy-enfant.mdc`.

## Position

**Le [MAJEUR] 6 est réparé au niveau où je l'avais posé : la règle, pas la
donnée.** J'avais sanctionné un appariement par sous-chaîne dont l'ordre de table
était porteur de sens sans être documenté. La dépendance n'a pas été documentée,
elle a été **supprimée** — et je l'ai vérifié autrement que sur parole : **300
permutations aléatoires de la table produisent un résultat identique**. Sous
l'appariement par segments exacts, aucune clé des 288 n'apparie plus d'un motif,
et les 26 segments publiés servent tous.

**J'ai écrit ma propre implémentation, troisième et indépendante des deux
siennes, et elle re-dérive les 43 conditions `segment_de_cle` sans un seul
écart.** C'est la preuve que je peux apporter à sa place sur la question centrale
de ce tour, et elle vaut mieux que sa déclaration d'indépendance, que je ne peux
pas auditer.

**Les trois [MINEUR] du tour 2 sont corrigés.** Les 27 conditions d'intertitre
sont retrouvées mot pour mot dans la source, y compris celle que j'avais nommée ;
l'écart 27 contre 26 a disparu en même temps que sa cause ; `exclusif_avec` couvre
les deux familles que je lui reprochais d'ignorer, et sa règle ne prétend plus à
une réciprocité qu'elle n'a pas.

**Les vingt-quatre grandeurs annoncées sont exactes. Aucun écart.** Et rien
d'acquis n'est cassé : 279 textes identiques au caractère près, `ui-parent`
intégralement en `affiche`.

Il reste **une réserve mineure**, et c'est la seule : la règle d'appariement,
dont dépend toute la valeur de la table publiée, n'est écrite dans aucun des deux
fichiers. C'était le troisième volet de ma correction du tour 2 ; les deux autres
ont été faits.

---

# CONSTAT DU TOUR 3

## [MINEUR] 10 — La règle d'appariement n'est inscrite dans aucun des deux fichiers, alors que la table qu'elle consomme l'est

Ma correction attendue au tour 2 comportait trois volets. Deux sont faits :

| Volet demandé | État |
| --- | --- |
| Apparier au segment le plus spécifique, non à la première sous-chaîne | **Fait** — appariement par segments exacts, vérifié par re-dérivation |
| Ajouter l'assertion « tout segment publié est employé au moins une fois » | **Fait** — `segments declares JAMAIS employes : 0` sur 26 |
| **Inscrire cette règle dans `regles.conditions_par_segment`, à côté de la table, dans les deux fichiers** | **Non fait** |

Vérifié : `regles.conditions_par_segment` est, dans les deux fichiers, une liste
de 26 objets `{segment, condition}` et rien d'autre. Aucune prose ne
l'accompagne, et aucune des dix clés de `regles` ne décrit comment un segment
apparie une clé. `regles.condition` mentionne « table publiée ci-dessous » sans
dire ce qu'on en fait.

```
$ python3
### ui-enfant : cles de regles = ['perimetre','propriete_des_cles','source','role',
                                  'condition','conditions_par_segment','exclusif_avec',
                                  'jetons','canal','charge']
   conditions_par_segment : list 26 | elements = ['condition','segment']
   -> aucune mention de « segments exacts », « consécutifs », « échoue », « ordre de la table »
### ui-parent : idem
```

**Pourquoi cela compte malgré la correction du fond.** La table est faite pour
grandir : elle est passée de 25 à 26 segments pendant ce tour même, avec l'ajout
d'`indispo`. Le prochain agent qui voudra couvrir un nouvel état lira la table et
devra deviner la convention. Deux erreurs lui sont ouvertes :

- **croire à un appariement par sous-chaîne** et déclarer un segment partiel — par
  exemple `paliers` en pensant couvrir `reglages.paliers.atteint` ;
- **croire à un appariement sur un segment unique** et ne pas comprendre pourquoi
  `cosmetiques.debloque`, qui en compte deux, fonctionne.

La deuxième serait particulièrement ironique : c'est la forme à deux segments qui
a réparé mon [MAJEUR] 6, et rien ne dit qu'elle est permise.

Gravité mineure, et je la tiens pour mineure sans hésitation : le comportement
livré est correct, je l'ai re-dérivé moi-même, et les invariants le protègent
mécaniquement à chaque exécution. C'est un défaut de documentation d'un contrat
par ailleurs juste — pas une affirmation fausse, pas un écran faux, pas une
décision laissée au développeur.

**Correction attendue** : ajouter une clé `regles.appariement_des_segments` dans
les deux fichiers, par exemple :

> « Un motif de la table apparie une clé lorsque ses segments, séparés par des
> points, apparaissent comme une suite consécutive de segments de la clé. La
> comparaison porte sur des segments entiers, jamais sur des sous-chaînes :
> `bloque` n'apparie pas `debloque`. Un motif peut compter plusieurs segments
> (`cosmetiques.debloque`). L'ordre de la table est sans effet : tous les motifs
> qui apparient sont collectés, et la génération échoue s'ils donnent des
> conditions différentes. »

---

# JUGEMENTS DEMANDÉS

## La question centrale : la re-dérivation est-elle réellement indépendante ?

**Réponse courte : elle est partiellement indépendante, elle ne peut pas l'être
davantage, et ce n'est pas d'elle que vient la garantie de ce tour.** Je détaille,
parce que la question mérite mieux qu'un oui ou un non.

### Ce que je peux établir, et ce que je ne peux pas

Le script est conservé hors du dépôt, comme depuis le début de ce projet. Je ne
peux donc pas lire ses deux implémentations et vérifier qu'elles ne partagent pas
une fonction. **Je ne prendrai pas sa déclaration d'indépendance pour argent
comptant, et je ne la contesterai pas davantage : je l'ai remplacée.**

J'ai écrit ma propre implémentation de l'appariement, à partir des seuls éléments
publics — la table de 26 segments inscrite dans les fichiers, et la règle
« segments exacts » annoncée. Elle ne partage rien avec les siennes. Résultat sur
une exécution fraîche :

```
43 conditions segment_de_cle : ecarts = 0
cles ambigues sur les 288    : 0
segments publies : 26   jamais employes : 0
300 permutations de la table -> resultats differents : 0
```

C'est une **troisième** dérivation, réellement indépendante, et elle confirme la
sienne. Sur le résultat, la question est donc close : quelle que soit la parenté
de ses deux implémentations, ce que portent les fichiers est juste.

### Ce qu'une re-dérivation peut et ne peut pas attraper

Le raisonnement importe plus que le résultat, parce qu'il vaudra pour les phases
de code.

**Deux choses sont nécessairement partagées, et c'est correct :**

1. **La table.** Il n'y en a qu'une, et elle est publiée dans les fichiers. Une
   re-dérivation qui utiliserait une autre table testerait autre chose. La table
   est la **spécification**, pas l'implémentation : la partager est le principe
   même de l'exercice.
2. **La règle.** Les deux implémentations doivent supposer « segments exacts ».

De (2) découle la limite, et elle est sévère : **une re-dérivation peut attraper
une erreur de codage, elle ne peut pas attraper une règle fausse.** Or le défaut
du tour 2 était exactement une règle fausse — « première sous-chaîne trouvée »
était fidèlement implémentée, elle rendait simplement le mauvais résultat. Deux
implémentations indépendantes de cette règle auraient été d'accord, deux fois, sur
la même erreur, et auraient conclu vert avec une confiance accrue.

**Donc : le contrôle re-dérivé, seul, n'aurait pas évité le tour 2.** Je le dis
sans détour parce que c'est le point que vous me demandiez de trancher.

### D'où vient réellement la garantie

De trois **invariants**, qui n'ont pas cette faiblesse :

| Invariant | Ce qu'il attrape |
| --- | --- |
| « 0 segment déclaré jamais employé » | **Aurait fait échouer le tour 2.** `cosmetiques.debloque` était masqué par `bloque`, donc inutilisé : l'invariant l'aurait dit |
| « 0 clé appariant deux motifs à conditions différentes » | La collision elle-même, quelle que soit la règle |
| « lignes de la table 7.12 = clés `observation.*` » | Un ajout ou un renommage à la source |

Un invariant énonce une propriété que le résultat doit avoir. Il est vrai ou faux
**indépendamment de la façon dont le résultat a été calculé** — et c'est
précisément pour cela qu'il attrape une règle fausse là où une re-dérivation
échoue. Le premier de ces trois est celui que j'avais demandé au tour 2 ; c'est
lui qui fait le travail, pas la re-dérivation.

### Ce qui a vraiment changé, et qui n'est ni l'un ni l'autre

**Le comportement de l'instrument.** Au tour 2, il imprimait la ligne absurde
entre deux lignes correctes et concluait `AUCUN PROBLEME`. Ce tour-ci, il a levé
deux drapeaux à son premier passage — 48 faux « intertitre introuvable » dus à sa
propre normalisation des marqueurs de gras, et `parent.resume.observation.titre`
compté à tort parmi les neuf observations — et il a **échoué au lieu de conclure
vert**. Les deux défauts étaient les siens, il les publie.

C'est le changement qui compte. Un instrument qui échoue sur ses propres faux
positifs est un instrument qu'on peut croire quand il passe ; un instrument qui
conclut vert en imprimant une anomalie ne vaut rien, quelle que soit la qualité de
son implémentation.

### Verdict sur la question

- **Indépendance réelle** : impossible à établir de l'extérieur, et je ne la
  compte donc ni pour ni contre.
- **Indépendance structurellement plafonnée** : table et règle sont partagées par
  nécessité ; la re-dérivation ne couvre que l'erreur de codage.
- **Garantie effective** : elle vient des trois invariants et du passage à
  l'échec, pas de la re-dérivation.
- **Résultat vérifié** : par ma propre troisième implémentation, 43 sur 43, 0
  écart.

**Recommandation pour les phases de code**, puisque le mécanisme se reproduira sur
un linter, un seuil de couverture ou un filtre de tests : *préférer un invariant à
une re-dérivation à chaque fois que les deux sont possibles.* Une re-dérivation
coûte une seconde implémentation et ne couvre que la moitié du risque ; un
invariant coûte une assertion et couvre l'autre moitié, celle qui fait mal.

## L'ordre de la table : la dépendance a bien disparu, et le gain est plus large que le défaut

Vérifié par permutation, ce qui est le seul test qui vaille :

```
300 permutations aleatoires de la table -> resultats differents : 0
```

L'ordre est sans effet. Et il l'est **par construction** : sous l'appariement par
segments exacts, aucune des 288 clés n'apparie plus d'un motif. Le garde-fou
« échouer si deux motifs donnent des conditions différentes » ne peut donc pas se
déclencher aujourd'hui — c'est un verrou pour l'avenir, pas une pièce portante du
présent. Je le note pour qu'on ne lui prête pas un rôle qu'il n'a pas : ce qui
rend l'ordre indifférent, c'est l'appariement exact, pas la détection d'ambiguïté.

**Vous me demandiez de chercher un cas où deux motifs apparient sans que l'échec
se déclenche. Il n'y en a aucun** : zéro clé apparie deux motifs, à conditions
identiques ou différentes.

**Le contre-test montre que la réparation vaut plus que le défaut que j'avais
trouvé.** En rejouant l'ancien appariement par sous-chaîne sur la table
d'aujourd'hui :

```
cles ambigues en sous-chaine : 5
   coffre.cosmetiques.debloque         motifs=['bloque', 'cosmetiques.debloque']
   parent.scan.camera_refusee.bouton   motifs=['camera_refusee', 'refuse']
   parent.scan.camera_refusee.corps    motifs=['camera_refusee', 'refuse']
   parent.scan.camera_refusee.titre    motifs=['camera_refusee', 'refuse']
   reglages.code.refuse_reste          motifs=['refuse_reste', 'refuse']
```

Le tour 2 n'avait donc pas une collision, il en avait **cinq**. Quatre rendaient
le bon résultat uniquement parce que l'ordre de la table leur était favorable —
`camera_refusee` et `refuse_reste` précèdent `refuse`. C'est la définition d'un
défaut latent, et l'appariement exact les supprime toutes les cinq par
construction plutôt qu'une par une. La réparation est au bon niveau.

## ARB-15 : la propagation a bien eu lieu, sur les trois occurrences

```
parent.apercu.resume       content/ = '2 étapes ce soir : {matieres}. Environ {duree} min.'
                           source   = identique                                    -> IDENTIQUE
parent.apercu.resume_une   content/ = '1 étape ce soir : {matiere}. Environ {duree} min.'
                           source   = identique                                    -> IDENTIQUE
parent.apercu.regroupe     content/ = 'Le programme a été regroupé pour ce soir. Le reste attendra demain.'
                           source   = identique                                    -> IDENTIQUE
```

Les trois textes que j'avais signalés au tour 1 comme figeant l'ordre et la durée
sont aujourd'hui tokenisés à la source et arrivés ici sans ressaisie. La troisième
occurrence — `parent.apercu.regroupe`, qui disait « Tout a été regroupé en
**2 étapes** » — a perdu son nombre en dur : c'est celle que `produit-marketing` a
trouvée de lui-même, et elle n'était dans aucun de mes constats.

Deux détails que je valide au passage :

- **« min » plutôt que « minutes »** : l'abréviation est invariable, donc
  « Environ {duree} min » reste juste que `{duree}` vaille 6 ou 12. C'est une
  application correcte d'ARB-14 à un mot que l'arbitrage ne nommait pas ;
- **`{matieres}` au pluriel contre `{matiere}` au singulier** : deux jetons
  distincts plutôt qu'un seul dont le texte devrait connaître le nombre. C'est
  exactement ce qu'ARB-14 demande — « un jeton emporte son genre, son nombre et
  son article ».

Le nombre en dur qui subsiste dans ces deux clés, « 2 étapes » et « 1 étape »,
n'en est pas un : c'est le discriminant de la paire, et il est cohérent avec les
conditions déclarées (« deux étapes sont programmées » / « une seule étape est
programmée »). Rien à redire.

Le réflexe qu'il dit avoir appliqué aux jetons est vérifiable dans le résultat :
`{matieres}` est déclaré et employé, et dans les deux fichiers **l'ensemble des
jetons déclarés est exactement l'ensemble des jetons employés**. Un jeton
nouveau à la source ne peut plus arriver sans être documenté.

## Les trois [MINEUR] du tour 2

**[MINEUR] 7 — les 4 entrées non nominales.** Toutes corrigées, et par la bonne
source à chaque fois :

```
enfant.attente.pilou         'Attente IA supérieure à 400 ms (TEC-12)'      [intertitre]
maths.indice.epuise          'les quatre indices ont été donnés (PED-02)'   [definie_ici]
parent.resume.indispo.titre  "le résumé n'est pas encore calculé"           [segment_de_cle]
parent.resume.indispo.corps  "le résumé n'est pas encore calculé"           [segment_de_cle]
```

`enfant.attente.pilou` reçoit l'intertitre que j'avais cité — l'information était
bien là où sa méthode regarde, et son rapport le reconnaît sans détour.

**J'ai rejoué ma vérification du tour 2 avec une liste de marqueurs encore
élargie** — celle qui avait trouvé les 4 — en y ajoutant `expire`, `erreur`,
`absent`, `indisponible`, `calibration`. Elle remonte 7 entrées sans condition, et
**les 7 sont des faux positifs de ma propre liste** :

```
pause.expire                    'On souffle.'
   -> l'expiration du souffle, pendant de pause.inspire : le contenu nominal de l'ecran
reglages.calibration.titre / .corps / .restantes / .voir / .desactiver
reglages.menu.calibration
   -> le contenu nominal de la sous-page Calibration (TEC-16).
      L'etat vide de cette page existe separement : segment `vide.calibration`, employe.
```

Zéro manquement réel. C'est l'inverse du tour 2, où la même technique en trouvait
quatre.

**[MINEUR] 8 — « 27 intertitres » contre 26.** L'écart a disparu avec sa cause :
il y a désormais 27 valeurs distinctes réelles, la vingt-septième étant celle qui
manquait. Les 27 sont retrouvées mot pour mot dans le marketing.

**[MINEUR] 9 — `exclusif_avec`.** Les deux familles que je reprochais sont
couvertes : la famille de boutons de `/enfant` (4 clés liées deux à deux) et le
corps de `/enfant/programme` à quatre candidats, où les clés à deux étapes
pointent maintenant vers les clés à une étape portées par la banque. On passe de
15 entrées et 15 liens à **21 entrées et 33 liens**, avec **0 défaut de
réciprocité à l'intérieur des deux fichiers `ui-*`**.

Et la règle ne surpromet plus. Elle dit maintenant :

> « Réciproque par construction **À L'INTÉRIEUR** des deux fichiers `ui-*`. Quand
> une sœur est portée par un autre fichier de `content/` — `enfant.programme.titre`
> et `enfant.programme.une.corps.*` sont portés par `encouragements.json` — le lien
> est unidirectionnel, et ces fichiers ne portent pas le champ. Le mécanisme
> primaire de désambiguïsation reste `condition`. »

Les cinq liens unidirectionnels restants sont exactement ceux que cette phrase
annonce, et les deux familles concernées y sont nommées. Une limitation déclarée
n'est pas une omission.

## Ce qui était acquis n'a pas été cassé

| Acquis | État au tour 3 |
| --- | --- |
| 279 textes identiques au caractère près | **279 identiques, 0 divergence** |
| `ui-parent` intégralement en `affiche` | **187 / 187** |
| 333 clés, 0 orpheline, 0 doublon de propriété | **333 / 0 / 0** sur les quatre fichiers |
| 101 / 187 entrées, 6 / 6 écrans | **101 / 187, 6 / 6** |
| Les 9 clés créées, verbatim, `arret_avant_fin` intacte | **9 verbatim**, garde-fou 7.12 satisfait (9 = 9) |
| Six clés mortes retirées (ARB-12) | **0 clé, 0 texte** ; traces en prose volontaires |
| Charte enfant | **121 phrases, 0 dépassement, max 10 mots, 0 interdit, 0 `{prenom}`** |
| Emoji / prénom en dur sur 767 textes | **0 / 0** |
| ARB-13 : aucun barème | **0** — 5 déclenchements, tous bénins, identiques aux tours 1 et 2 |
| ARB-14 | **0** préposition contractante devant un jeton porteur d'article (y compris le nouveau `{matieres}`) ; **1** accord signalé, `notif.resume.titre`, qui s'accorde avec « la séance » et non avec le jeton ; exception de Pilou préservée |
| Jetons déclarés = jetons employés | **exact** dans les deux fichiers |

---

# AVIS gardien-charte — tour 3

Grille des 7 points de `.cursor/agents/gardien-charte.md`, sur les **101 textes
enfant** de `ui-enfant.json`, seuls textes de ce livrable destinés à l'enfant.

Aucun texte enfant n'a changé depuis le tour 1 : la fidélité à la source est
vérifiée identique, et les modifications de ce tour portent exclusivement sur des
champs de contrat (`condition`, `condition_source`, `exclusif_avec`). Je reprends
néanmoins la grille en entier.

| # | Point | Résultat |
| --- | --- | --- |
| 1 | Ton : effort valorisé, jamais de reproche | **Conforme.** Aucune formulation lisible comme un reproche. |
| 2 | Interdits absolus | **Conforme.** 0 occurrence. Aucune comparaison, aucune ironie. |
| 3 | Charge : une idée par phrase, 12 mots, CE1 | **Conforme.** 121 phrases, maximum **10 mots**, 0 dépassement sous mes deux règles de comptage. |
| 4 | Pression : ni chrono, ni décompte, ni compteur, ni série | **Conforme.** Aucun chiffre en dur côté enfant ; le seul nombre affiché est `coffre.solde.valeur` = `{n}`, inventaire du coffre et non score du soir (PED-07). |
| 5 | Récompense : aucune promesse réelle, aucune perte de pierres | **Conforme** (ETH-04, ETH-05). `coffre.palier.maison` : « Je garde tes pierres. Le reste se décide à la maison. » |
| 6 | Maths : rien ne conduit au résultat | **Conforme** (PED-01). Les quatre `maths.demande_resultat.*` refusent sans reprocher ; `maths.indice.epuise` clôt l'échelle sans la franchir, et porte enfin sa condition. |
| 7 | Autonomie : la pause accessible, gratuite | **Conforme.** `session.pause.bouton`, `lecture.blocage.bouton`, `maths.blocage.bouton`, et `pause.rassurance` « Tu reviens quand tu veux. » |

Deux améliorations de ce tour touchent l'enfant, indirectement mais réellement, et
je les note :

- les quatre boutons de `/enfant` qui se disputent la même place se déclarent
  désormais mutuellement exclusifs, et `enfant.programme.bouton` /
  `.une.bouton` aussi. Deux boutons rendus ensemble au même endroit auraient été
  une devinette pour un enfant de six ans et demi, ce que DES-06 refuse ;
- `maths.indice.epuise` et `enfant.attente.pilou` ne sont plus déclarées
  nominales : la première ne peut plus s'afficher avant que les quatre indices
  aient été donnés, ce qui protège l'échelle de PED-02 au niveau du contrat.

Le [MINEUR] 10 ne relève pas de cette grille : il porte sur la documentation d'une
règle de génération, et aucun texte n'est en cause.

AVIS: CONFORME

Motif : aucun des 101 textes enfant ne met un enfant fatigué en difficulté, ne lui
adresse un reproche, ne le compare, ne le met sous pression, ne lui promet une
récompense réelle, ne lui donne un résultat de maths, ni ne lui ferme la pause.
Troisième avis CONFORME consécutif sur ces textes, qui n'ont pas varié.

---

# CHIFFRES ANNONCÉS CONTRE CHIFFRES RÉELS

Recomptés par mes propres commandes, sur une exécution fraîche, sans lire les
sorties du rapport.

| Grandeur | Annoncé | **Recompté** | Écart |
| --- | --- | --- | --- |
| Les 4 fichiers JSON valides, 0 clé dupliquée | valides, 0 | **valides, 0** | — |
| Entrées `ui-enfant.json` | 101 | **101** | — |
| Entrées `ui-parent.json` | 187 | **187** | — |
| Écrans enfant / parent | 6 / 6 | **6 / 6** | — |
| `ui-parent` intégralement en `affiche` | 187 | **187 / 187** | — |
| Clés UI du marketing | 333 | **333** | — |
| Clés orphelines | 0 | **0** | — |
| Doublons de propriété (4 fichiers) | 0 | **0** | — |
| Textes identiques à la source | 288 | **279 par clé + 9 par texte, 0 divergence** | — |
| Conditions renseignées | 137 / 288 | **137 / 288** | — |
| dont `intertitre` | 72 | **72** | — |
| dont `segment_de_cle` | 43 | **43** | — |
| dont `definie_ici` | 22 | **22** | — |
| Conditions `intertitre` distinctes | 27 | **27** | — |
| Retrouvées mot pour mot dans la source | 27 / 27 | **27 / 27** | — |
| Conditions `segment_de_cle` re-dérivées à l'identique | 43, 0 écart | **43, 0 écart** (ma 3ᵉ implémentation) | — |
| Clés appariant deux motifs à conditions différentes | 0 | **0** | — |
| Segments publiés jamais employés | 0 sur 26 | **0 sur 26** | — |
| Dépendance à l'ordre de la table | supprimée | **supprimée** — 300 permutations, 0 différence | — |
| Entrées à marqueur d'état sans condition | 0 sur 98 | **0**, y compris sous ma liste élargie (7 faux positifs à moi) | — |
| Entrées exclusives / liens | 21 / 33 | **21 / 33**, 0 défaut de réciprocité intra-`ui-*` | — |
| Garde-fou table 7.12 | 9 = 9 | **9 = 9** | — |
| ARB-14 : signalements | 1, verdicté correct | **1**, `notif.resume.titre`, correct | — |
| ARB-13 : textes énonçant un barème | 0 | **0** sur 767 | — |
| Emoji / prénom en dur (4 fichiers) | 0 / 0 | **0 / 0** | — |
| Jetons déclarés = employés | oui | **exact** dans les deux fichiers | — |

**Vingt-quatre grandeurs annoncées, vingt-quatre exactes. Aucun écart.**

## Ma règle de comptage des mots

Inchangée depuis le premier tour : phrases découpées sur `.`, `!`, `?`, `…` ;
**règle souple**, l'élision reste dans le mot (« je t'aide » = 2 mots) ; **règle
stricte**, on coupe aussi sur l'apostrophe et le trait d'union (= 3 mots). Les
deux donnent ici le même résultat : maximum 10 mots, 0 dépassement.

---

# SORTIES RÉELLES DES COMMANDES

Exécutées dans `/home/user/Tipi`, sorties collées telles quelles.

## 1. Validité JSON des quatre fichiers

```
$ node -e "... JSON.parse des quatre fichiers ..."
content/ui-enfant.json      : VALIDE, version=1.0.0, cles racine=8
content/ui-parent.json      : VALIDE, version=1.0.0, cles racine=7
content/encouragements.json : VALIDE, version=2.2.0, cles racine=12
content/gwenn-scripts.json  : VALIDE, version=2.0.0, cles racine=8
---exit:0---

$ python3   # object_pairs_hook : detecte ce qu'un JSON.parse masque
ui-enfant / ui-parent / encouragements / gwenn-scripts : cles dupliquees : aucune
```

## 2. Comptes

```
$ python3
=== A. COMPTES ===
  entrees: 288 | enfant 101 | parent 187 | ecrans 6 / 6
  parent affiche: 187 / 187
  conditions: 137 |  {None: 151, 'intertitre': 72, 'definie_ici': 22, 'segment_de_cle': 43}
  exclusivite: 21 entrees, 33 liens
```

## 3. Ma re-dérivation indépendante, et le test de permutation

```
$ python3   # implementation ecrite depuis la seule table publiee
=== B. MA RE-DERIVATION INDEPENDANTE (appariement par segments exacts) ===
  43 conditions segment_de_cle : ecarts = 0  | cles ambigues sur 288 = 0
  segments publies: 26  jamais employes: 0 []
  300 permutations de la table -> resultats differents : 0
```

Détail de la vérification par entrée, exécution précédente :

```
entrees segment_de_cle dans le fichier : 43
  ECARTS entre ma derivation et le fichier : 0
  AMBIGUS (2+ motifs, conditions differentes) : 0
  SANS MOTIF : 0

=== cles appariant PLUSIEURS motifs (cas benin : conditions identiques) ===
  (aucune)
```

## 4. Contre-test : ce que l'ancien appariement donnerait aujourd'hui

```
$ python3
=== CONTRE-TEST : et si l'appariement etait reste en SOUS-CHAINE ? ===
  cles ambigues en sous-chaine : 5
     coffre.cosmetiques.debloque         motifs=['bloque', 'cosmetiques.debloque']
     parent.scan.camera_refusee.bouton   motifs=['camera_refusee', 'refuse']
     parent.scan.camera_refusee.corps    motifs=['camera_refusee', 'refuse']
     parent.scan.camera_refusee.titre    motifs=['camera_refusee', 'refuse']
     reglages.code.refuse_reste          motifs=['refuse_reste', 'refuse']
  -> c'est exactement ce que l'appariement exact supprime
```

## 5. Le cas du tour 2, et les quatre entrées du tour 2

```
$ python3
   coffre.cosmetiques.debloque    cond='le cosmétique est débloqué'                       motifs=['cosmetiques.debloque']
   coffre.cosmetiques.verrouille  cond="le cosmétique n'est pas encore débloqué"          motifs=['cosmetiques.verrouille']
   coffre.cosmetiques.vide        cond="aucun cosmétique n'est disponible"                motifs=['cosmetiques.vide']
   reglages.code.bloque.titre     cond='la saisie est bloquée après cinq essais (SEC-02)' motifs=['bloque']
   reglages.code.refuse_reste     cond='le code saisi ne correspond pas, et des essais restent' motifs=['refuse_reste']
   parent.resume.indispo.titre    cond="le résumé n'est pas encore calculé"               motifs=['indispo']

=== les 4 entrees du tour 2 ===
   enfant.attente.pilou         cond='Attente IA supérieure à 400 ms (TEC-12)'    [intertitre]
   maths.indice.epuise          cond='les quatre indices ont été donnés (PED-02)' [definie_ici]
   parent.resume.indispo.titre  cond="le résumé n'est pas encore calculé"         [segment_de_cle]
   parent.resume.indispo.corps  cond="le résumé n'est pas encore calculé"         [segment_de_cle]
```

## 6. Marqueurs d'état — ma liste élargie au-delà des 27 publiés

```
$ python3
=== MA liste elargie : 121 entrees a marqueur, 7 SANS condition ===
   [enfant] pause.expire                        'On souffle.'
   [parent] reglages.calibration.corps          'Les premières photos sont conservées avec leur analyse, […]'
   [parent] reglages.calibration.desactiver     'Arrêter la calibration'
   [parent] reglages.calibration.restantes      'Photos enregistrées pour la calibration : {n}'
   [parent] reglages.calibration.titre          'Calibration des photos'
   [parent] reglages.calibration.voir           "Voir le détail d'une analyse"
   [parent] reglages.menu.calibration           'Calibration des photos'
   -> les 7 sont des faux positifs de MA liste : contenu nominal de l'ecran de pause
      et de la sous-page Calibration. L'etat vide de celle-ci est couvert a part
      (segment `vide.calibration`, employe).
```

Liste des 27 marqueurs publiée par le producteur à côté du chiffre qu'elle fonde
(rapport, contrôle 5 bis) :

```
vide, souci, echec, illisible, absent, sans_, refus, expiree, breton, reprise,
plus_tard, actif, regroupe, reporte, verrouille, atteint, bloque, pas_entendu,
discordance, avert, sans_voix, sans_indice, camera_, basse_energie, attente,
epuise, indispo
entrees portant un marqueur d'etat : 98      entrees SANS condition : 0
```

## 7. Fidélité et couverture des clés

```
$ python3
=== C. FIDELITE + CLES ===
  cles marketing: 333 | identiques: 279 | DIVERGENTES: 0 [] | hors tables: 9

$ python3   # couverture sur les quatre fichiers
cles marketing : 333 | porteurs : 342
ORPHELINES : 0 []
HORS SOURCE : 9   (les 9 observations creees)
DOUBLONS   : aucun
```

## 8. Les 27 conditions d'intertitre contre la source

```
$ python3
=== D. INTERTITRES ===
  entrees: 72 | distinctes: 27 | introuvables dans la source: 0 []
```

Les 27, avec le nombre d'entrées qui les portent :

```
  ( 1) Attente IA supérieure à 400 ms (TEC-12)          <- la 27e, celle qui manquait au tour 2
  ( 2) Aucun palier défini — état vide
  ( 2) Blocage détecté (PED-08, après 3 sollicitations sans réponse exploitable)
  ( 5) Cas breton (PED-13) — texte affiché, consigne expliquée en français, pas de TTS ni de STT
  ( 2) Hésitation détectée sur un mot — situation `hesitation`
  ( 4) L'enfant demande le résultat (PED-01) — refus constant, chaleureux, sans reproche […]
  ( 3) Mode basse énergie (PRD-04)
  ( 2) Pendant l'analyse
  ( 2) Plus de 2 étapes détectées (PED-06)
  ( 2) Progression vers le palier suivant (PRD-14, ETH-05)
  ( 4) Reprise d'étape après fermeture (PRD-18)
  ( 4) Sortie anticipée, parent uniquement (PRD-13)
  ( 6) Transcription non exploitable (PED-09) — jamais une sanction
  ( 1) Variante de reprise (l'app a été fermée en cours de soirée, PRD-18)
  ( 2) Variante à une seule étape (une seule matière reconnue, matière retirée […], PRD-04)
  ( 1) État d'erreur (état applicatif illisible, base injoignable)
  ( 4) État d'erreur — indices indisponibles (secours de TEC-07 en échec)
  ( 3) État d'erreur — le programme n'a pas pu être lu
  ( 1) État d'erreur — les devoirs n'ont pas pu être chargés
  ( 3) État d'erreur — micro refusé ou indisponible
  ( 3) État d'erreur — solde non récupérable
  ( 2) État d'erreur — voix de Pilou indisponible
  ( 1) État vide — aucun devoir préparé ce soir (PRD-16)
  ( 3) État vide — aucune photo ajoutée
  ( 3) État vide — pas de devoirs ce soir (PRD-16)
  ( 4) État vide — rien d'exploitable dans les photos
  ( 2) État vide — séance sans devoir
```

## 9. ARB-15 : la propagation

```
$ python3
=== E. ARB-15 ===
  parent.apercu.resume         content/='2 étapes ce soir : {matieres}. Environ {duree} min.'
                               source  ='2 étapes ce soir : {matieres}. Environ {duree} min.'  -> IDENTIQUE
  parent.apercu.resume_une     content/='1 étape ce soir : {matiere}. Environ {duree} min.'
                               source  ='1 étape ce soir : {matiere}. Environ {duree} min.'    -> IDENTIQUE
  parent.apercu.regroupe       content/='Le programme a été regroupé pour ce soir. Le reste attendra demain.'
                               source  =identique                                              -> IDENTIQUE
```

## 10. Exclusivité : 21 entrées, 33 liens, réciprocité

```
$ python3
=== EXCLUSIVITE : 21 entrees, 33 liens ===
   problemes intra-ui : 0
   5 liens cross-fichier unidirectionnels, tous vers encouragements.json et tous declares :
      enfant.programme.corps.lecture_maths -> enfant.programme.une.corps.lecture / .maths
      enfant.programme.corps.maths_lecture -> enfant.programme.une.corps.lecture / .maths
      enfant.programme.une.titre           -> enfant.programme.titre

   coffre.cosmetiques.debloque      -> ['coffre.cosmetiques.verrouille']
   coffre.cosmetiques.verrouille    -> ['coffre.cosmetiques.debloque']
   coffre.palier.atteint            -> ['coffre.palier.reste']
   coffre.palier.reste              -> ['coffre.palier.atteint']
   enfant.accueil.bouton            -> ['enfant.accueil.reprise.bouton', 'enfant.accueil.vide.bouton', 'enfant.accueil.souci.bouton']
   enfant.accueil.reprise.bouton    -> ['enfant.accueil.bouton', 'enfant.accueil.vide.bouton', 'enfant.accueil.souci.bouton']
   enfant.accueil.souci.bouton      -> ['enfant.accueil.bouton', 'enfant.accueil.reprise.bouton', 'enfant.accueil.vide.bouton']
   enfant.accueil.vide.bouton       -> ['enfant.accueil.bouton', 'enfant.accueil.reprise.bouton', 'enfant.accueil.souci.bouton']
   enfant.programme.bouton          -> ['enfant.programme.une.bouton']
   enfant.programme.une.bouton      -> ['enfant.programme.bouton']
   lecture.intro.titre.premier      <-> lecture.intro.titre.apres
   maths.intro.titre.premier        <-> maths.intro.titre.apres
   parent.apercu.resume             <-> parent.apercu.resume_une
   parent.resume.etape_faite        <-> parent.resume.etape_passee
```

## 11. ARB-14, ARB-13, charte enfant, jetons

```
$ python3
=== F. ARB-14 / ARB-13 / charte / jetons ===
  total textes: 767
  ARB-14 (a) prep. contractante devant jeton a article ({matiere},{matieres},{liste}) : 0
  ARB-14 (b) devant tout jeton (large) : 6 -> toutes devant {prenom} : True
  ARB-14 (c) accord suivant un jeton : ["La séance d'{prenom} est terminée."]
             -> « terminée » s'accorde avec « la séance », pas avec le jeton. Correct.
  ARB-14 (d) exception Pilou preservee : enc.accueil.01 « Je suis contente de te voir. »
  emoji: 0 | Evan/Gwenn: 0
  charte enfant: phrases 121 | >12: 0 | max: 10 | interdits: []
  {prenom} cote enfant: []
  jetons ui-enfant: declares==employes -> True
  jetons ui-parent: declares==employes -> True

=== ARB-13 sur les 767 textes : 5 declenchements, aucun bareme ===
   [recompense]          reglages.menu.paliers / reglages.paliers.titre  'Paliers de récompense'
                         reglages.paliers.corps  'Vous définissez le palier et vous donnez la
                                                  récompense. Tipi compte seulement les pierres.'
                         -> enonce exact d'ETH-05 : l'application compte, le parent donne
   [nombre de pierres]   reglages.paliers.gems   'Nombre de pierres'   -> libelle de saisie parent
   [par etape]           enc.indice_demande_4.04 "On déroule l'exercice ensemble, étape par étape."
   [chaque etape]        enc.indice_demande_4.09 "Je t'explique chaque étape. Tu comptes."
   [tu gagnes .. pierre] bienvenue.3.corps_2     'Tu gagnes des pierres. Elles restent à toi.'
                         -> aucune quantite enoncee
```

## 12. Garde-fou sur la table 7.12

```
$ python3
  lignes de la table 7.12 : 9
  cles parent.resume.observation.* (hors .titre) : 9
  -> garde-fou satisfait : True
```

## 13. La règle d'appariement dans les fichiers — origine du [MINEUR] 10

```
$ python3
### ui-enfant : cles de regles = ['perimetre','propriete_des_cles','source','role',
      'condition','conditions_par_segment','exclusif_avec','jetons','canal','charge']
   conditions_par_segment : list 26 | elements = ['condition','segment']
   aucune mention de « segments exacts », « consécutifs », « échoue », « ordre de la table »
### ui-parent : idem
   ( « ambigu » remonte, mais il s'agit de « désambiguïsation » dans regles.exclusif_avec )
```

---

# HISTORIQUE DES TOURS 1 ET 2

## Tour 1 — `FAIL` : 0 [BLOQUANT], 1 [MAJEUR], 4 [MINEUR], gardien CONFORME

Vingt grandeurs annoncées, vingt exactes.

| # | Gravité | Constat | Sort |
| --- | --- | --- | --- |
| 1 | [MAJEUR] | `condition` à `null` sur 85 entrées non nominales, contre la règle publiée par le fichier ; `parent.apercu.resume` et `.resume_une` tous deux déclarés nominaux | **Corrigé au tour 2** par la voie (a) : 133 conditions, `condition_source`, 71 intertitres retrouvés dans la source. A engendré le [MAJEUR] 6 |
| 2 | [MINEUR] | Trois accords de genre manqués en plus de celui qu'il signalait | **Corrigé au tour 2**, et au bon niveau : les 9 observations ne sont plus en dur dans le générateur mais extraites de la table 7.12 |
| 3 | [MINEUR] | `parent.apercu.resume` fige étapes, ordre et durée | **Refus fondé au tour 2** (le texte appartient au marketing), mitigé par condition et exclusivité, puis **corrigé à la source au tour 3 sous ARB-15** — vérifié identique |
| 4 | [MINEUR] | Six jetons déclarés jamais employés côté enfant | **Corrigé au tour 2** : `jetons_connus` calculé. Tenu au tour 3, `{matieres}` compris |
| 5 | [MINEUR] | Le rôle `texte` attribué à des commandes, dont « Tout supprimer » | **Corrigé au tour 2** : rôle `action` sur 23 entrées, repli renommé `indetermine` |

## Tour 2 — `FAIL` : 0 [BLOQUANT], 1 [MAJEUR], 3 [MINEUR], gardien CONFORME

Vingt-deux grandeurs, un écart (« 27 intertitres » pour 26).

| # | Gravité | Constat | Sort au tour 3 |
| --- | --- | --- | --- |
| 6 | [MAJEUR] | `coffre.cosmetiques.debloque` portait « la saisie est bloquée après cinq essais (SEC-02) » : collision de sous-chaîne (`bloque` ⊂ `debloque`), sur une table dont l'ordre était porteur de sens sans être documenté. Le seul segment inemployé était le bon, masqué | **CORRIGÉ au niveau de la règle.** Appariement par segments exacts ; dépendance à l'ordre **supprimée**, vérifiée par 300 permutations ; invariant « 0 segment inemployé » ajouté ; l'entrée porte « le cosmétique est débloqué ». Le contre-test montre que la réparation supprime **cinq** collisions latentes, pas une |
| 7 | [MINEUR] | 4 entrées non nominales sans condition ; liste de marqueurs non publiée | **CORRIGÉ.** Les 4 ont leur condition, dont `enfant.attente.pilou` par l'intertitre que j'avais cité ; la liste des 27 marqueurs est imprimée à côté du chiffre. Ma liste élargie ne trouve plus aucun manquement réel |
| 8 | [MINEUR] | « 27 intertitres distincts » annoncés, 26 réels | **CORRIGÉ**, et par la bonne cause : il y a désormais 27 valeurs distinctes réelles, la 27ᵉ étant celle qui manquait |
| 9 | [MINEUR] | `exclusif_avec` incomplet : familles de boutons et corps à quatre candidats non couverts ; « réciproque par construction » surpromettait | **CORRIGÉ.** 21 entrées et 33 liens, 0 défaut intra-`ui-*`, et la règle précise désormais « à l'intérieur des deux fichiers `ui-*` » en nommant les deux familles cross-fichier |

---

# SYNTHÈSE DU TOUR 3

| Gravité | Nombre | Constats |
| --- | --- | --- |
| **[BLOQUANT]** | **0** | — |
| **[MAJEUR]** | **0** | — |
| **[MINEUR]** | **1** | 10 — la règle d'appariement n'est inscrite dans aucun des deux fichiers, alors que la table qu'elle consomme l'est |

**VERDICT: PASS_AVEC_RESERVES.** Aucun [BLOQUANT], aucun [MAJEUR] : la règle
mécanique n'impose pas FAIL. Une réserve subsiste, d'où le verdict sous réserve
plutôt qu'un PASS sec.

## La réserve, et comment la lever

Elle ne conditionne pas la suite : le comportement livré est correct, je l'ai
re-dérivé moi-même, et les invariants le protègent à chaque exécution. Elle se
lève en une clé de `regles`, dans les deux fichiers, dont je donne le texte au
constat 10. Je recommande de la corriger avant que la table ne soit étendue une
nouvelle fois — elle l'a été pendant ce tour.

| Constat | Action | Ampleur |
| --- | --- | --- |
| 10 | Ajouter `regles.appariement_des_segments` dans `ui-enfant.json` et `ui-parent.json` | 1 clé, 2 fichiers |

## Ce qui est acquis et ne sera pas recontrôlé

- **Les vingt-quatre grandeurs annoncées, toutes exactes.**
- **Les 279 textes identiques à la source au caractère près**, vérification la
  plus importante de ce livrable, sans faute aux trois tours.
- **Les 333 clés** : 0 orpheline, 0 doublon de propriété sur les quatre fichiers.
- **Les 43 conditions `segment_de_cle`**, re-dérivées par ma propre
  implémentation, 0 écart, 0 ambiguïté, 0 segment inemployé.
- **L'indifférence à l'ordre de la table**, établie par permutation et non par
  déclaration.
- **Les 27 conditions d'intertitre**, retrouvées mot pour mot dans la source.
- **Les 9 clés créées** et le garde-fou qui les compte contre la source.
- **ARB-12, ARB-13, ARB-14, ARB-15**, tous vérifiés indépendamment.
- L'`AVIS gardien-charte`, **CONFORME** pour la troisième fois.

## Ce que je recommande de porter au-delà de cette porte

Une règle de méthode, tirée de la question centrale de ce tour et valable pour
les linters, les seuils de couverture et les filtres de tests des phases de code :

> **Préférer un invariant à une re-dérivation chaque fois que les deux sont
> possibles.** Une re-dérivation attrape une erreur de codage et coûte une seconde
> implémentation ; elle ne peut pas attraper une règle fausse, puisque les deux
> implémentations partagent la règle. Un invariant énonce une propriété que le
> résultat doit avoir indépendamment de son calcul : il coûte une assertion et
> couvre précisément le risque que la re-dérivation laisse passer. Au tour 2, ce
> n'est pas une seconde implémentation qui aurait sauvé le livrable, c'est
> l'assertion « tout segment publié est employé au moins une fois ».

Et son corollaire, déjà acquis sur ce projet mais qui mérite d'être écrit : **un
instrument doit échouer, jamais imprimer une anomalie sous un `AUCUN PROBLEME`.**
C'est le changement de comportement de ce tour, et c'est lui qui rend les chiffres
croyables.
