# P1 — Produit & marketing Tipi

Livrable de l'agent `produit-marketing`. Source unique : `TIPI-PROMPT-CURSOR.md`
sections 1, 2 et 3, plus `.cursor/rules/00-charte-tipi.mdc` et
`.cursor/rules/30-copy-enfant.mdc`.

Ce document contient les **textes définitifs**. Ils sont destinés à être copiés
tels quels dans les fichiers de contenu (`content/*.json`), jamais écrits en dur
dans un composant. Les clés proposées ici font foi pour `contenu-enfant` (P1bis)
et pour `design-system` (P3).

Aucun emoji dans ce document ni dans aucun texte qu'il définit (DES-07).
Aucune référence à la Bretagne dans la marque : le breton est une contrainte de
devoirs (PED-13), jamais un thème de marque.

---

# Reprise après verdict du 2026-09-20

Verdict `controle-produit` : FAIL, 0 bloquant, 5 majeurs, 5 mineurs. Les dix
constats sont repris ci-dessous, constat par constat, avec l'endroit modifié.

| Constat | Niveau | Ce qui a changé | Où |
| --- | --- | --- | --- |
| 1 | MAJEUR | L'ordre des étapes n'est plus figé. Les clés `enfant.programme.corps`, `enfant.programme.une.corps`, `lecture.intro.titre`, `maths.intro.titre`, `transition.felicitation` et `transition.annonce` sont éclatées en variantes par ordre et par matière, et une règle de sélection explicite est ajoutée. Les états « maths seule », « maths en premier » et « transition maths vers lecture » ont désormais leurs textes | 7.4, 7.5 entrée d'étape, 7.6 entrée d'étape et transition, nouvelle section 7.0 |
| 2 | MAJEUR | L'affirmation « le solde est le seul chiffre » est remplacée par l'énumération exacte des trois nombres admis devant l'enfant, tous dans `/enfant/coffre`, avec la règle générale qui les autorise et l'interdiction sur les sept autres écrans enfant | 7.9, arbitrage A2, nouvel item de checklist TON-7 |
| 3 | MAJEUR | `reglages.paliers.description_ex` ne suggère plus de récompense réelle. ETH-05.3 est reformulé en conséquence, une seule fois | 7.14 sous-page Paliers, checklist ETH-05.3 |
| 4 | MAJEUR | `coffre.palier.description` est **retirée de l'écran enfant**. La description saisie par le parent reste visible côté parent uniquement. Le périmètre de recherche de ETH-05.1 est corrigé | 7.9, 7.14, checklist ETH-05.1 |
| 5 | MAJEUR | Les deux chiffres du résumé parent sont supprimés. `parent.resume.date` devient « {date} » et `parent.resume.pierres` devient une phrase sans nombre. PRD-06 redevient couverte telle qu'écrite, sans dérogation | 7.12, arbitrage A7, couverture PRD-06 |
| 6 | MINEUR | La durée de l'écran de lancement est reformulée en minimum, sans contradiction | 4.2 |
| 7 | MINEUR | « Une seconde. » devient « J'arrive. » | 7.3, `enfant.attente.pilou` |
| 8 | MINEUR | « Aller jouer » devient l'action principale de la clôture, « Voir mon coffre » passe en action secondaire | 7.8 |
| 9 | MINEUR | La contradiction du nom `content/gwenn-scripts.json` est notée en arbitrage A13 et l'item TON-6 est amendé. Le fichier n'est pas renommé : le nom vient du prompt maître, l'arbitrage revient à l'humain | 6.1, section 11, checklist TON-6 |
| 10 | MINEUR | Double espace supprimé | 7.10, `parent.scan.analyse_en_cours` |

Aucun constat n'est laissé sans reprise. La seule action hors de ce livrable est
l'ouverture d'une ligne dans `docs/agents/ESCALADE.md` pour le constat 9, qui
revient à l'Orchestrateur : voir « Constats mineurs non repris » en fin de
document.

---

## Sommaire

1. Plateforme de marque
2. Personnalité de Pilou et ton de voix
3. Ce qu'on ne dira jamais
4. Brief icône d'application et écran de lancement
5. Identité sonore
6. Conventions de rédaction et clés de contenu
7. Micro-copies écran par écran (les 14 routes de la section 3.1)
8. Notification parent
9. États limites transverses (PRD-16)
10. Checklist éthique opposable ETH-01 à ETH-05
11. Arbitrages produit tranchés ici
12. Tableau de couverture REQ-PRD et REQ-ETH
13. Constats mineurs non repris, et la seule escalade demandée

---

# 1. Plateforme de marque

## 1.1 Promesse

> **Tipi est l'endroit où les devoirs du soir se passent calmement.**

Formulation longue, opposable, utilisable en interne :

> Tipi accompagne un enfant de CE1 dans ses devoirs du soir, seul avec Pilou,
> pour que le moment des devoirs cesse d'être un moment de tension entre un
> parent fatigué et un enfant fatigué.

La promesse porte sur **l'ambiance du moment**, jamais sur le résultat scolaire.
Aucune communication Tipi, interne ou externe, ne contient les mots
« progrès », « niveau », « réussite scolaire », « rattrapage », « classement »,
« meilleur », « plus vite ».

**Preuve de la promesse** : deux étapes maximum par soir quel que soit le volume
de devoirs (PED-06), une pause toujours accessible et toujours gratuite
(PRD-12), aucun chiffre montré à l'enfant (PED-07).

## 1.2 Territoire : le tipi comme abri

Le tipi est un **petit abri où l'on est bien**. Ce n'est ni une école, ni un
terrain de jeu, ni une salle de classe. C'est un lieu fermé, doux, éclairé de
l'intérieur, où il ne se passe qu'une chose à la fois.

Le territoire se décline en trois idées, dans cet ordre de priorité :

| Idée | Traduction produit | Traduction visuelle |
| --- | --- | --- |
| **On est à l'abri** | Une seule action principale par écran, toujours en bas (DES-06) | Formes arrondies, fond crème, ombre douce, aucun dégradé |
| **On est accompagné** | Toute information importante est aussi dite par Pilou (PED-10) | Pilou présente sur tous les écrans enfant |
| **On peut sortir quand on veut** | La pause ne coûte rien et ne se compte pas (PRD-12, ETH-04) | Bouton pause visible, jamais grisé, jamais en rouge |

**Interdits de territoire** : pas de fusée, pas de montagne à gravir, pas de
podium, pas de carte de progression avec des niveaux, pas de médaille, pas de
trophée, pas de barre de score. Le seul objet de collection est la **pierre**,
qui ne se perd jamais (ETH-04).

Le tipi n'est rattaché à **aucune région et aucune culture réelle**. Pas de
référence bretonne, pas de motif amérindien, pas de folklore. Le tipi de Tipi
est une forme géométrique douce : un triangle arrondi avec une ouverture
éclairée. Rien de plus.

## 1.3 Architecture de marque

| Élément | Décision |
| --- | --- |
| Nom du produit | **Tipi**, jamais décliné, jamais suivi d'un slogan dans l'application (DES-10) |
| Nom de la mascotte | **Pilou**, une petite loutre, invariable, défini une seule fois dans `mascot.config.ts` (DES-09) |
| Voix de Pilou | Une seule voix féminine française, figée pour toute la vie du produit (TEC-08) |
| Objet de progression | **Les pierres**. Jamais « points », jamais « score », jamais « XP » |
| Lieu de collection | **Le coffre à trésors** (PRD-14) |
| Deux apparences | Thème « Pilou » et thème « Apple » (PRD-17). Ce sont des apparences, pas deux marques : mêmes textes, mêmes mots, même Pilou |

**Décision de marque sur les thèmes** : le thème n'est jamais présenté à
l'enfant comme une récompense ni comme un déblocage. Il se change depuis
Réglages, par le parent uniquement.

## 1.4 Ce que Tipi n'est pas

- Tipi n'est pas un professeur : il ne corrige pas, il ne note pas, il ne dit
  jamais si c'est juste (voir 3.5 du prompt maître).
- Tipi n'est pas un jeu : aucune partie à gagner, aucun adversaire, aucun temps
  à battre.
- Tipi n'est pas un outil de suivi scolaire : le résumé parent est qualitatif et
  jamais chiffré (PRD-06).
- Tipi n'est pas un distributeur de récompenses : il affiche une progression, la
  famille décide et donne (ETH-05).

---

# 2. Personnalité de Pilou et ton de voix

## 2.1 Qui est Pilou

Pilou est une petite loutre qui habite le tipi. Elle n'a **pas d'histoire
personnelle**, pas de famille, pas de passé, pas d'anniversaire. Elle est là,
c'est tout. Ce vide est volontaire : il évite les récits parasites et les
attaches affectives qu'on ne pourrait pas tenir.

Corps clair aux contours très arrondis, petites oreilles rondes, joues colorées,
museau doux (section 1.3 du prompt maître).

## 2.2 Les cinq traits de Pilou

| Trait | Ce que ça veut dire | Exemple de phrase conforme | Contre-exemple interdit |
| --- | --- | --- | --- |
| **Calme** | Elle ne s'excite jamais, même quand tout va bien | « Bravo. Tu as bien travaillé ce soir. » | « Waouh, incroyable, tu es un champion ! » |
| **Patiente** | Elle ne relance jamais deux fois de suite | « Je t'attends. Prends ton temps. » | « Alors, tu te décides ? » |
| **Curieuse** | Elle pose des questions, elle ne donne pas de réponses | « Tu comptes comment, toi ? » | « La réponse, c'est huit. » |
| **Fiable** | Elle dit toujours la même chose au même moment | Rituel de fermeture identique chaque soir (PED-12) | Une clôture différente selon la performance |
| **Humble** | Quand quelque chose ne marche pas, c'est elle qui n'a pas compris | « Je n'ai pas bien entendu. » | « Tu n'as pas parlé assez fort. » |

**Règle de personnalité la plus importante** : quand quelque chose échoue,
**c'est toujours Pilou qui n'a pas réussi**, jamais l'enfant. Le sujet
grammatical d'un message de difficulté est toujours « je » ou « ça », jamais
« tu ».

## 2.3 Ton de voix, enfant

Valable pour tout texte affiché ou dit à l'enfant (section 1.3 du prompt maître,
`30-copy-enfant.mdc`) :

1. Une idée par phrase.
2. **12 mots maximum par phrase.**
3. Vocabulaire de CE1, présent de l'indicatif.
4. Pas de subordonnée complexe, pas de « bien que », « afin que », « toutefois ».
5. On valorise l'effort et l'essai, jamais le résultat seul (PED-05).
6. Jamais « c'est faux » ni équivalent (PED-04).
7. Jamais d'ironie, jamais de second degré.
8. Jamais de chiffre de performance, jamais de chrono, jamais de compteur
   (PED-07).
9. Toute information importante est aussi **dite** par Pilou, jamais seulement
   écrite (PED-10).

**Tutoiement systématique.** Le prénom « Evan » est utilisé à l'accueil et à la
clôture, pas à chaque phrase : au-delà, il devient insistant.

## 2.4 Ton de voix, parent

Adulte, factuel, court, sans jargon et sans flatterie. Le parent a deux minutes
par soir.

1. Phrases courtes, pas de limite de 12 mots, mais pas de paragraphe.
2. Jamais de chiffre de performance de l'enfant (PRD-06).
3. Jamais de culpabilisation : aucun « vous n'avez pas… », aucun « pensez à… »,
   aucun rappel de ce qui n'a pas été fait (ETH-02).
4. Les libellés d'action sont des verbes à l'infinitif : « Ajouter une photo »,
   « Lancer la session ».
5. Quand quelque chose ne fonctionne pas, on dit **ce qui s'est passé** et **ce
   qu'on peut faire maintenant**, dans cet ordre, en une phrase chacun.
6. Le mot « erreur » est proscrit dans l'interface parent aussi : on décrit le
   fait (« La photo n'a pas pu être lue. »).

---

# 3. Ce qu'on ne dira jamais

Liste opposable. Tout contrôleur peut rechercher ces chaînes dans `content/**`
et dans `src/**` et rendre un verdict.

## 3.1 Interdits de vocabulaire, écrans enfant

| Interdit | Pourquoi | Ce qu'on dit à la place |
| --- | --- | --- |
| « c'est faux », « faux », « incorrect » | PED-04 | « Tu veux réessayer ? » |
| « erreur », « tu t'es trompé » | PED-04 | « Je n'ai pas bien compris. » |
| « essaie de faire mieux », « recommence pour mieux faire » | PRD-11, PED-05 | « Tu as bien travaillé. On s'arrête là. » |
| « plus vite », « dépêche-toi », « il te reste… » | PED-07, ETH-01 | « Prends ton temps. » |
| « comme les autres », « les enfants de ton âge » | PED-05 | rien, aucune comparaison n'a de substitut |
| « tu es intelligent », « tu es doué » | PED-05 (éloge de l'effort) | « Tu as bien cherché. » |
| « tu as gagné X points », « ton score » | PED-07 | « Tu as une pierre de plus. » |
| « série », « d'affilée », « tous les jours sans rater » | ETH-02 | rien, la notion n'existe pas |
| « tu perds une pierre », « attention, tu vas perdre… » | ETH-04 | rien, la notion n'existe pas |
| « dernière chance », « plus que… », « vite » | ETH-01 | rien, la notion n'existe pas |
| « si tu finis, tu auras un bonbon » | ETH-05 | « Je garde tes pierres. » |
| le prénom du parent | `30-copy-enfant.mdc` | « à la maison » |
| tout emoji | DES-07 | icône SVG au trait |

## 3.2 Interdits de mécanique produit

- Aucun compte à rebours, aucun sablier, aucune barre qui se vide (ETH-01).
- Aucune série à entretenir, aucun calendrier de présence (ETH-02).
- Aucun achat, aucune publicité, aucun traceur tiers (ETH-03).
- Aucune pierre retirée, aucune expiration de pierre (ETH-04).
- Aucune récompense réelle promise ou octroyée par l'application (ETH-05).
- Aucune notification envoyée à l'enfant. Les notifications sont parent
  uniquement, et uniquement en fin de session (PRD-06).
- Aucun écran de fin qui propose de refaire pour améliorer (PRD-11).

## 3.3 Interdits de marque

- Aucune référence à la Bretagne, à la langue bretonne ou à un folklore
  régional dans le nom, l'univers, les visuels, les sons ou les textes de
  marque. Le breton n'apparaît que comme **contenu de devoir** (PED-13).
- Aucun slogan dans l'application, y compris sur l'écran de lancement (DES-10).
- Aucune promesse de performance scolaire, nulle part, y compris dans les textes
  parent.

---

# 4. Brief icône d'application et écran de lancement

Brief visuel, pas de production (DES-10 : sobres, sans aucun texte marketing).

## 4.1 Icône d'application

| Point | Décision |
| --- | --- |
| Sujet | **Un tipi seul.** Pas de Pilou, pas de lettre, pas de texte |
| Forme | Triangle isocèle aux trois angles arrondis, base légèrement évasée. Une ouverture verticale en goutte, centrée bas |
| Couleurs | Fond plein bleu accent `#6FB8E8`. Tipi en blanc `#FFFFFF`. Ouverture en jaune accent `#FFD166` |
| Fond | Aplat uni. **Aucun dégradé**, aucune ombre portée, aucune texture (3.8) |
| Trait | Le tipi est une forme pleine, pas un contour. Lisible à 40 px |
| Marge de sécurité | Le tipi occupe 62 % de la largeur, centré, marge égale sur les quatre côtés. Compatible icône masquable Android (zone sûre 80 %) |
| Texte | **Aucun.** Ni « Tipi », ni baseline (DES-10) |
| Variantes à produire | 1024, 512, 192, 180, 167, 152, 120, 32 px, plus une version masquable et une version monochrome pour la barre d'état |
| Thème Apple | L'icône ne change pas selon le thème. Une seule icône pour tout le produit |

**Test d'acceptation de l'icône** : posée sur un écran d'accueil chargé, elle
doit se reconnaître sans lire le nom, et ne doit ressembler ni à un jeu, ni à
une application scolaire.

## 4.2 Écran de lancement

| Point | Décision |
| --- | --- |
| Fond | `#FFF8EE` en thème Pilou, `#F5F5F7` en thème Apple. Le thème mémorisé est appliqué dès le lancement pour éviter un flash |
| Contenu | Le même tipi que l'icône, en `#2E2A26` (thème Pilou) ou `#1D1D1F` (thème Apple), centré, hauteur 96 px, ouverture en `#FFD166` |
| Texte | **Aucun texte.** Pas de nom, pas de slogan, pas de « chargement… » (DES-10) |
| Animation | L'ouverture du tipi s'éclaircit une fois, sur 600 ms, en fondu. Rien d'autre. Aucun clignotement, aucun flash (DES-08) |
| Durée | Visible 800 ms **au minimum**, pour éviter un clignotement si l'aiguillage tranche immédiatement. Si l'aiguillage `/` n'a pas tranché, l'écran reste affiché tel quel, sans indicateur, sans limite de durée et sans message |
| Son | `son_ouverture`, une seule fois, voir section 5 |
| Ce qui est interdit | Pilou, une barre de progression, un pourcentage, un texte marketing, un logo animé |

---

# 5. Identité sonore

## 5.1 Principes

1. **Le son confirme, il n'alerte jamais.** Aucun son ne signale une difficulté,
   une faute ou une fin de temps.
2. **Aucun son descendant.** Pas de « buzz », pas d'accord mineur de fin, pas de
   note qui tombe. Un son descendant serait lu comme un reproche (PED-04).
3. **Timbres doux uniquement** : bois frotté, kalimba, marimba feutré, souffle.
   Aucun son métallique, aucune sirène, aucun applaudissement enregistré.
4. **Jamais deux sons en même temps.** La voix de Pilou a toujours la priorité :
   tout son est coupé ou atténué de 12 dB pendant une réplique TTS.
5. **Volume plafonné** : aucun son ne dépasse -14 LUFS. Pas de compression
   agressive.
6. **Silence respecté** : si l'appareil est en mode silencieux, Tipi reste
   silencieux, voix de Pilou comprise. Un réglage « Sons de l'application »
   existe dans Réglages et ne coupe jamais la voix de Pilou séparément sans le
   dire.
7. **Aucun son de notification** côté enfant.

## 5.2 Tableau des sons

| Clé | Moment | Durée | Intention | Notes |
| --- | --- | --- | --- | --- |
| `son_ouverture` | Écran de lancement, une fois par ouverture d'app | 1,0 s | « On entre dans un endroit calme » | Deux notes montantes, kalimba, réverbération courte |
| `son_pilou_apparait` | Pilou entre à l'écran (`/enfant`) | 0,6 s | Présence douce | Souffle court + une note |
| `son_ecran_suivant` | Passage d'un écran enfant au suivant | 0,35 s | Continuité | Très discret, quasi subliminal |
| `son_micro_ouvert` | L'enfant appuie sur le micro | 0,25 s | « Je t'écoute » | Une note tenue, montante |
| `son_micro_ferme` | Fin de l'écoute | 0,25 s | « J'ai entendu » | Même note, plus courte. **Jamais différente selon la qualité de la réponse** |
| `son_pilou_reflechit` | Attente IA supérieure à 400 ms (TEC-12) | boucle 2,4 s | Patience | Nappe très basse, sans rythme, fondu entrant 300 ms |
| `son_etape_finie` | Fin d'une étape, avant la transition | 0,9 s | « C'est fait » | Trois notes montantes, marimba |
| `son_pierre` | Une pierre est créditée | 0,6 s | « Ça se range dans le coffre » | Note cristalline unique. Une seule fois, jamais répétée par pierre |
| `son_pause_entree` | Entrée dans `/enfant/pause` | 0,8 s | Décompression | Nappe chaude, fondu entrant |
| `son_respiration` | Pendant la respiration guidée | boucle 8,0 s | Rythme d'inspiration et d'expiration | Souffle lent, 4 s montée / 4 s descente, sans voix |
| `son_pause_sortie` | Retour à l'étape | 0,5 s | Reprise calme | Même timbre que `son_pause_entree`, inversé en douceur |
| `son_cloture` | Écran `/enfant/bravo`, une seule fois | 1,5 s | Rituel identique chaque soir (PED-12) | Motif de quatre notes, toujours le même, jamais modulé selon la soirée |
| `son_coffre_ouvre` | Ouverture de `/enfant/coffre` | 0,8 s | Curiosité calme | Bois + note tenue |
| `son_cosmetique_choisie` | L'enfant applique un cosmétique de Pilou | 0,4 s | Confirmation | Neutre, identique pour tous les cosmétiques |

## 5.3 Sons explicitement interdits

| Son | Pourquoi |
| --- | --- |
| Son de mauvaise réponse | PED-04, il n'existe aucune notion de mauvaise réponse |
| Tic-tac, sablier, compte à rebours | PED-07, ETH-01 |
| Fanfare, applaudissements, foule | PED-05, l'éloge reste calme et centré sur l'effort |
| Son de pierre perdue | ETH-04 |
| Son de notification côté enfant | ETH-02 |
| Musique de fond continue | Charge cognitive inutile pour un enfant fatigué |

---

# 6. Conventions de rédaction et clés de contenu

## 6.1 Où vivent les textes

Aucun texte destiné à un utilisateur n'est écrit dans un composant
(`30-copy-enfant.mdc`).

| Fichier | Contenu |
| --- | --- |
| `content/gwenn-scripts.json` | Répliques fixes de Pilou : rituels, onboarding, clôture. Une seule variante, jouée à l'identique. **Nom en attente d'arbitrage, voir A13** |
| `content/encouragements.json` | Banque de variantes par situation, 20 minimum chacune (PED-11) |
| `content/ui-enfant.json` | Textes affichés des écrans enfant : titres, libellés de boutons, états |
| `content/ui-parent.json` | Textes affichés des écrans parent et Réglages |

Les clés données dans la section 7 sont normatives.

**Réserve sur un nom de fichier** : `gwenn` est le mot breton pour « blanc ». Ce
nom entre en contradiction avec l'interdit de marque de la section 3.3, et il ne
désigne aucun objet du produit, la mascotte s'appelant Pilou. Le nom est **fixé
par le prompt maître** (`.cursor/agents/contenu-enfant.md`) : ce livrable ne le
renomme pas de sa propre initiative. L'arbitrage est demandé à l'humain, voir
A13 en section 11.

## 6.2 Annotation de chaque texte enfant

Chaque entrée porte un champ `mode` :

- `dit` — lu par Pilou en TTS uniquement
- `affiche` — affiché uniquement
- `dit_affiche` — les deux, avec le même texte mot pour mot

**Règle** : tout texte porteur d'une information nécessaire à l'action est en
`dit_affiche` (PED-10). Un texte en `affiche` seul ne peut être que décoratif ou
redondant.

## 6.3 Règle de longueur, vérifiable

Toute chaîne en `dit_affiche` ou `dit` destinée à l'enfant : **chaque phrase
compte 12 mots maximum**. Un point, un point d'interrogation ou un point
d'exclamation termine une phrase. Un contrôleur peut mesurer mécaniquement.

---

# 7. Micro-copies, écran par écran

Les 14 routes de la section 3.1, dans l'ordre du tableau.

Pour chaque écran : titre, corps, libellé du bouton principal, états vides,
états d'erreur, textes lus par Pilou.

La section 7.0 ci-dessous est transverse : elle fixe les variantes de textes qui
dépendent de l'ordre des étapes, puisque le parent peut réordonner et retirer une
matière (PRD-04).

---

## 7.0 — Règle transverse : textes dépendant de l'ordre des étapes

**Le problème** : PRD-04 autorise le parent à retirer une matière et à
réordonner les étapes. Six configurations de soirée sont donc atteignables.

| # | Configuration | Atteinte par |
| --- | --- | --- |
| C1 | Lecture puis maths | cas nominal |
| C2 | Maths puis lecture | « Faire passer en premier » sur l'étape maths |
| C3 | Lecture seule | le parent retire l'étape maths, ou seule la lecture a été reconnue |
| C4 | Maths seule | le parent retire l'étape lecture, ou seules des maths ont été reconnues |
| C5 | Lecture seule en Soir léger | « Soir léger » avec la lecture conservée |
| C6 | Maths seule en Soir léger | « Soir léger » avec les maths conservées |

**La décision** : aucune phrase enfant ne nomme une matière dans un texte figé
qui serait réutilisé pour une autre configuration. Chaque texte dépendant de
l'ordre existe en variantes, avec une clé explicite par variante. **Aucune
interpolation de nom de matière dans une phrase générique** : « D'abord la
{matiere}. » est interdit, parce que la phrase ne tiendrait plus au pluriel
(« la maths ») et parce qu'un contrôleur ne pourrait pas lire le texte final.

**Table de sélection**, normative pour `dev-feature` :

| Clé générique | Configuration | Clé effective à jouer |
| --- | --- | --- |
| Annonce, deux étapes | C1 | `enfant.programme.corps.lecture_maths` |
| Annonce, deux étapes | C2 | `enfant.programme.corps.maths_lecture` |
| Annonce, une étape | C3, C5 | `enfant.programme.une.corps.lecture` |
| Annonce, une étape | C4, C6 | `enfant.programme.une.corps.maths` |
| Entrée d'étape lecture | lecture en première position | `lecture.intro.titre.premier` |
| Entrée d'étape lecture | lecture en seconde position | `lecture.intro.titre.apres` |
| Entrée d'étape maths | maths en première position | `maths.intro.titre.premier` |
| Entrée d'étape maths | maths en seconde position | `maths.intro.titre.apres` |
| Félicitation de transition | l'étape qui vient de finir est la lecture | `transition.felicitation.lecture` |
| Félicitation de transition | l'étape qui vient de finir est les maths | `transition.felicitation.maths` |
| Annonce de transition | l'étape suivante est les maths | `transition.annonce.maths` |
| Annonce de transition | l'étape suivante est la lecture | `transition.annonce.lecture` |
| Étape vide, suite existante | une autre étape suit | `lecture.vide.corps_2.suite` ou `maths.vide.corps_2.suite` |
| Étape vide, pas de suite | c'était la dernière étape | `lecture.vide.corps_2.fin` ou `maths.vide.corps_2.fin` |

**Règle de contrôle opposable** : pour chacune des six configurations C1 à C6, un
contrôleur doit pouvoir dérouler la soirée et constater que Pilou ne nomme jamais
une matière absente du programme du soir. Une configuration qui fait dire à Pilou
une matière absente est un défaut bloquant.

---

## 7.1 `/` — Aiguillage

**Public** : aucun. Écran technique, jamais montré volontairement.

**Décision produit** : cet écran **n'a aucun texte** (DES-10). Il affiche
l'écran de lancement de la section 4.2 pendant l'aiguillage, puis redirige vers
`/bienvenue`, `/parent` ou l'écran de reprise de session (PRD-18).

| Clé | Texte | Mode |
| --- | --- | --- |
| — | Aucun texte. L'écran de lancement est affiché tel quel | — |

**État d'attente** : tant que l'aiguillage n'a pas tranché, l'écran de lancement
reste affiché, sans indicateur, sans texte, sans animation supplémentaire et sans
limite de durée. Il n'existe aucun délai au bout duquel un message apparaîtrait.

**État d'erreur** (état applicatif illisible, base injoignable) : on n'affiche
jamais une page d'erreur à un enfant. L'aiguillage bascule sur `/parent` avec le
bandeau parent suivant.

| Clé | Texte | Mode |
| --- | --- | --- |
| `parent.aiguillage.bandeau` | « Tipi n'a pas retrouvé la soirée en cours. Vous pouvez repartir d'ici. » | affiche |

**Pilou ne parle pas sur cet écran.**

**Règles d'aiguillage** (PRD-01, PRD-18) :

| Condition | Destination |
| --- | --- |
| Onboarding jamais joué | `/bienvenue` |
| Onboarding joué, session en cours à l'état `etape_lecture` ou `etape_maths` | l'étape en cours, avec la reprise de 7.5 / 7.6 |
| Onboarding joué, session prête et validée par le parent | `/enfant` |
| Sinon | `/parent` |

L'onboarding **n'est jamais rejoué** une fois son marqueur posé (PRD-01).

---

## 7.2 `/bienvenue` — Onboarding, 3 écrans

**Public** : enfant. **Joué une seule fois à vie** (PRD-01).

**Décision produit** : trois écrans, un message par écran, un bouton en bas,
aucun réglage, aucune saisie, aucune question. Pilou dit chaque écran en entier.
Aucun bouton « passer » : l'onboarding dure moins de 40 secondes.

### Écran 1 sur 3 — Qui est là

| Clé | Texte | Mode |
| --- | --- | --- |
| `bienvenue.1.titre` | « Bonjour, moi c'est Pilou. » | dit_affiche |
| `bienvenue.1.corps` | « J'habite ici, dans le tipi. » | dit_affiche |
| `bienvenue.1.bouton` | « Bonjour Pilou » | affiche |

Texte dit par Pilou, en entier : « Bonjour, moi c'est Pilou. J'habite ici, dans
le tipi. »

### Écran 2 sur 3 — Ce qu'on fait ensemble

| Clé | Texte | Mode |
| --- | --- | --- |
| `bienvenue.2.titre` | « On fait les devoirs ensemble. » | dit_affiche |
| `bienvenue.2.corps` | « Deux choses par soir. Pas plus. » | dit_affiche |
| `bienvenue.2.bouton` | « D'accord » | affiche |

Texte dit par Pilou : « On fait les devoirs ensemble. Deux choses par soir. Pas
plus. » (PED-06, annoncé dès le premier soir.)

### Écran 3 sur 3 — La pause et les pierres

| Clé | Texte | Mode |
| --- | --- | --- |
| `bienvenue.3.titre` | « Tu peux t'arrêter quand tu veux. » | dit_affiche |
| `bienvenue.3.corps` | « Appuie sur la pause. Je t'attends. » | dit_affiche |
| `bienvenue.3.corps_2` | « Tu gagnes des pierres. Elles restent à toi. » | dit_affiche |
| `bienvenue.3.bouton` | « On y va » | affiche |

Texte dit par Pilou : « Tu peux t'arrêter quand tu veux. Appuie sur la pause. Je
t'attends. Tu gagnes des pierres. Elles restent à toi. » (PRD-12, ETH-04 dits à
l'enfant dès le premier soir.)

**État vide** : sans objet, l'onboarding n'affiche aucune donnée.

**État d'erreur** : si la voix ne peut pas être jouée (TTS indisponible), les
trois écrans restent lisibles et le parcours continue. Aucun message d'erreur
n'est montré à l'enfant. Pilou reste silencieuse.

**Indicateur de progression** : trois points en bas, sans chiffre, sans
pourcentage. Jamais « écran 1/3 » écrit.

---

## 7.3 `/enfant` — Accueil

**Public** : enfant. Pilou salue Evan (section 3.1).

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.accueil.titre` | « Bonsoir Evan. » | dit_affiche |
| `enfant.accueil.corps` | « Je suis contente de te voir. » | dit_affiche |
| `enfant.accueil.bouton` | « On commence » | affiche |

Texte dit par Pilou, situation `accueil` de la banque (PED-11, 20 variantes
minimum) : « Bonsoir Evan. Je suis contente de te voir. »

**Variante de reprise** (l'app a été fermée en cours de soirée, PRD-18) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.accueil.reprise.titre` | « Te revoilà, Evan. » | dit_affiche |
| `enfant.accueil.reprise.corps` | « On reprend là où on s'était arrêtés. » | dit_affiche |
| `enfant.accueil.reprise.bouton` | « On continue » | affiche |

Aucune mention du temps écoulé, aucune remarque sur l'interruption (ETH-02).

**État vide — aucun devoir préparé ce soir** (PRD-16) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.accueil.vide.titre` | « Ce soir, il n'y a pas de devoirs. » | dit_affiche |
| `enfant.accueil.vide.corps` | « On se voit demain. Bonne soirée. » | dit_affiche |
| `enfant.accueil.vide.bouton` | « Voir mon coffre » | affiche |

Texte dit par Pilou, situation `pas_de_devoirs` : « Ce soir, il n'y a pas de
devoirs. On se voit demain. Bonne soirée. » Aucun ton de regret, aucune
justification, aucune impasse : le bouton mène au coffre.

**État d'erreur — les devoirs n'ont pas pu être chargés** :

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.accueil.souci.titre` | « Je cherche encore tes devoirs. » | dit_affiche |
| `enfant.accueil.souci.corps` | « Tu peux aller voir ton coffre. » | dit_affiche |
| `enfant.accueil.souci.bouton` | « Voir mon coffre » | affiche |

Le sujet du problème est Pilou, jamais l'enfant. Aucun code technique affiché.

**Attente IA supérieure à 400 ms** (TEC-12) : animation « Pilou réfléchit » plus
`son_pilou_reflechit`, avec le texte suivant.

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.attente.pilou` | « Je regarde tes devoirs. J'arrive. » | dit_affiche |

Aucune durée n'est annoncée à l'enfant, même approximative (PED-07), et aucune
figure de style n'est employée : un enfant de 6 ans prend tout au premier degré.

---

## 7.4 `/enfant/programme` — Annonce des 2 étapes en pictos

**Public** : enfant. **2 pictos maximum, aucune liste dense** (PRD-07).

**Décision produit** : deux cartes côte à côte, un picto SVG au trait et un mot
par carte. Aucune durée affichée à l'enfant, aucune numérotation chiffrée,
aucune liste d'exercices (PED-07).

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.programme.titre` | « Ce soir, on fait deux choses. » | dit_affiche |
| `enfant.programme.carte.lecture` | « La lecture » | dit_affiche |
| `enfant.programme.carte.maths` | « Les maths » | dit_affiche |
| `enfant.programme.corps.lecture_maths` | « D'abord la lecture. Après, les maths. » | dit_affiche |
| `enfant.programme.corps.maths_lecture` | « D'abord les maths. Après, la lecture. » | dit_affiche |
| `enfant.programme.bouton` | « Je commence » | affiche |

L'ordre des deux cartes à l'écran suit toujours l'ordre réel des étapes : la
première étape est la carte de gauche. La variante de `enfant.programme.corps.*`
est choisie selon la table de sélection de 7.0.

Texte dit par Pilou, situation `annonce_programme`, configuration C1 : « Ce soir,
on fait deux choses. D'abord la lecture. Après, les maths. »
Configuration C2 : « Ce soir, on fait deux choses. D'abord les maths. Après, la
lecture. »

**Variante à une seule étape** (une seule matière reconnue, matière retirée par
le parent, ou mode basse énergie, PRD-04) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.programme.une.titre` | « Ce soir, on fait une seule chose. » | dit_affiche |
| `enfant.programme.une.corps.lecture` | « On fait la lecture. Et c'est tout. » | dit_affiche |
| `enfant.programme.une.corps.maths` | « On fait les maths. Et c'est tout. » | dit_affiche |
| `enfant.programme.une.bouton` | « Je commence » | affiche |

Une seule carte est affichée, centrée. Pilou dit, configuration C4 ou C6 : « Ce
soir, on fait une seule chose. On fait les maths. Et c'est tout. »

Le mode basse énergie n'est **jamais** présenté à l'enfant comme un mode réduit,
un rattrapage ou une faveur. C'est simplement le programme du soir. Les
configurations C3 et C5 d'une part, C4 et C6 d'autre part, sont
**indiscernables pour l'enfant** : rien ne distingue un Soir léger d'une soirée
où il n'y avait qu'une seule matière.

**État vide** : impossible ici. Une session n'est lancée que si le parent a
validé un programme d'au moins une étape (TEC-06). Si le programme arrive vide,
on bascule sur l'état vide de `/enfant` (7.3).

**État d'erreur — le programme n'a pas pu être lu** :

| Clé | Texte | Mode |
| --- | --- | --- |
| `enfant.programme.souci.titre` | « Je n'arrive pas à ouvrir le programme. » | dit_affiche |
| `enfant.programme.souci.corps` | « On regarde ton coffre en attendant. » | dit_affiche |
| `enfant.programme.souci.bouton` | « Voir mon coffre » | affiche |

---

## 7.5 `/enfant/session/lecture` — Étape lecture

**Public** : enfant. Voir 3.4 du prompt maître (PRD-08).

### Déroulé et textes

**Entrée dans l'étape**

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.intro.titre.premier` | « On commence par la lecture. » | dit_affiche |
| `lecture.intro.titre.apres` | « Maintenant, la lecture. » | dit_affiche |
| `lecture.intro.corps` | « Je lis d'abord. Tu écoutes. » | dit_affiche |
| `lecture.intro.bouton` | « Écouter Pilou » | affiche |

`lecture.intro.titre.premier` est joué quand la lecture est la première étape du
soir, y compris quand elle est la seule. `lecture.intro.titre.apres` est joué
quand elle suit les maths (configuration C2). Voir la table de sélection de 7.0.

**Pilou lit le texte, comme modèle**

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.modele.corps` | « Voilà. Maintenant, c'est ton tour. » | dit_affiche |
| `lecture.modele.bouton` | « À mon tour » | affiche |
| `lecture.modele.relire` | « Réécouter » | affiche |

Le bouton « Réécouter » est disponible sans limite. Aucun compteur d'écoutes.

**L'enfant lit à voix haute**

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.micro.consigne` | « Appuie sur le micro. Lis à voix haute. » | dit_affiche |
| `lecture.micro.bouton` | « Parler » | affiche |
| `lecture.micro.en_cours` | « Je t'écoute. » | affiche |
| `lecture.micro.bouton_stop` | « J'ai fini » | affiche |

**Aucune correction mot à mot affichée** (3.4). Le texte lu ne se colore pas,
ne se barre pas, ne se surligne pas en rouge. Le suivi visuel, s'il existe, est
neutre et uniquement au service du repérage de la ligne.

**Retour après la lecture** — situation `reussite_lecture` ou `effort_lecture`
de la banque (PED-11). Exemples canoniques :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.retour.effort` | « Bravo. Tu as lu jusqu'au bout. » | dit_affiche |
| `lecture.retour.effort_2` | « Tu as bien cherché tes mots. » | dit_affiche |
| `lecture.retour.bouton` | « Continuer » | affiche |

Aucun pourcentage de correspondance, aucun nombre de mots justes, aucune note
(PED-07). Le retour porte sur **l'acte de lire**, jamais sur la performance.

**Hésitation détectée sur un mot** — situation `hesitation` :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.hesitation.corps` | « On regarde ce mot ensemble ? » | dit_affiche |
| `lecture.hesitation.bouton` | « D'accord » | affiche |
| `lecture.hesitation.bouton_2` | « Je continue » | affiche |

Pilou **propose**, elle n'impose pas. « Je continue » est toujours disponible.

**Transcription non exploitable** (PED-09) — jamais une sanction :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.pas_entendu.corps` | « Je n'ai pas bien entendu. » | dit_affiche |
| `lecture.pas_entendu.corps_2` | « Tu peux redire, s'il te plaît ? » | dit_affiche |
| `lecture.pas_entendu.bouton` | « Je redis » | affiche |
| `lecture.pas_entendu.bouton_2` | « On passe à la suite » | affiche |

Après trois tentatives sans résultat exploitable (PED-08), Pilou ne relance plus
et propose deux issues.

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.blocage.corps` | « Le micro n'entend pas bien ce soir. » | dit_affiche |
| `lecture.blocage.corps_2` | « On fait une pause, ou on continue ? » | dit_affiche |
| `lecture.blocage.bouton` | « Faire une pause » | affiche |
| `lecture.blocage.bouton_2` | « Continuer » | affiche |

Le problème est attribué au micro, jamais à l'enfant.

**Questions de compréhension** (1 à 2, jugées sur mots-clés, jamais notées) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.question.intro` | « J'ai une petite question sur l'histoire. » | dit_affiche |
| `lecture.question.bouton` | « Répondre » | affiche |
| `lecture.question.retour_ok` | « Oui, c'est bien ça. Tu as bien écouté. » | dit_affiche |
| `lecture.question.retour_autre` | « Tu veux relire le début, pour voir ? » | dit_affiche |
| `lecture.question.passer` | « Je ne sais pas » | affiche |

`lecture.question.retour_autre` remplace toute forme de « c'est faux » (PED-04).
Le bouton « Je ne sais pas » est toujours présent et ne coûte rien.

**Cas breton** (PED-13) — texte affiché, consigne expliquée en français, pas de
TTS ni de STT :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.breton.intro` | « Ce texte est en breton. » | dit_affiche |
| `lecture.breton.corps` | « Je ne sais pas le lire. Toi, oui. » | dit_affiche |
| `lecture.breton.consigne` | « Lis-le à voix haute, tranquillement. » | dit_affiche |
| `lecture.breton.bouton` | « J'ai lu » | affiche |
| `lecture.breton.bouton_2` | « M'enregistrer » | affiche |

Aucune promesse n'est faite à l'enfant sur le breton (PED-13). Pilou dit
simplement qu'elle ne sait pas le lire. L'enregistrement est optionnel et
présenté sans enjeu ; le parent pourra le réécouter.

**Bouton pause, permanent** (PRD-12) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `session.pause.bouton` | « Pause » | affiche |

Visible en haut à droite, cible de 56 px minimum (DES-04), jamais grisé, jamais
masqué, jamais en couleur d'alerte.

**Sortie anticipée, parent uniquement** (PRD-13) : appui long de 2 secondes sur
le titre de l'étape, puis code parent. Aucun bouton visible pour l'enfant.

| Clé | Texte | Mode |
| --- | --- | --- |
| `session.sortie_parent.titre` | « Arrêter la session ? » | affiche |
| `session.sortie_parent.corps` | « Les pierres déjà gagnées sont conservées. » | affiche |
| `session.sortie_parent.bouton` | « Saisir le code » | affiche |
| `session.sortie_parent.annuler` | « Revenir à la session » | affiche |

**État vide** : une étape lecture sans contenu exploitable ne démarre pas. Le
moteur passe directement à l'étape suivante et Pilou dit :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.vide.corps` | « Ce soir, il n'y a pas de lecture. » | dit_affiche |
| `lecture.vide.corps_2.suite` | « On passe aux maths. » | dit_affiche |
| `lecture.vide.corps_2.fin` | « On a fini. Viens voir. » | dit_affiche |

`lecture.vide.corps_2.suite` n'est joué que si une étape maths suit réellement.
Sinon, `lecture.vide.corps_2.fin` mène directement à `/enfant/bravo`.

**État d'erreur — micro refusé ou indisponible** :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.micro_absent.corps` | « Le micro ne marche pas ce soir. » | dit_affiche |
| `lecture.micro_absent.corps_2` | « Lis à voix haute. Appuie quand tu as fini. » | dit_affiche |
| `lecture.micro_absent.bouton` | « J'ai fini de lire » | affiche |

L'étape reste terminable sans micro. Aucune impasse (PRD-16).

**État d'erreur — voix de Pilou indisponible** : le texte reste affiché,
l'enfant lit, aucun message technique.

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.sans_voix.corps` | « Je ne peux pas lire à voix haute ce soir. » | affiche |
| `lecture.sans_voix.corps_2` | « Le texte est là. Lis-le tranquillement. » | affiche |

**Reprise d'étape après fermeture** (PRD-18) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `lecture.reprise.corps` | « On reprend la lecture. » | dit_affiche |
| `lecture.reprise.corps_2` | « On était ici. » | dit_affiche |

---

## 7.6 `/enfant/session/maths` — Étape maths

**Public** : enfant. Voir 3.5 du prompt maître (PRD-09).

**Décision produit non négociable** : Pilou ne donne **jamais** le résultat,
même sur insistance répétée (PED-01). Aucune validation binaire juste/faux n'est
affichée (3.5). L'enfant dit quand il a fini, Pilou félicite l'effort.

**Entrée dans l'étape**

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.intro.titre.premier` | « On commence par les maths. » | dit_affiche |
| `maths.intro.titre.apres` | « Maintenant, les maths. » | dit_affiche |
| `maths.intro.corps` | « On regarde d'abord les objets. » | dit_affiche |
| `maths.intro.bouton` | « Je regarde » | affiche |

`maths.intro.titre.premier` est joué quand les maths sont la première étape du
soir, y compris quand elles sont la seule (configurations C2, C4 et C6).
`maths.intro.titre.apres` est joué quand elles suivent la lecture. Voir la table
de sélection de 7.0.

**Concret avant abstrait** (PED-03) : les pastilles à compter s'affichent
d'abord, seules, puis l'opération apparaît sous elles.

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.concret.corps` | « Regarde les ronds. Tu peux les compter. » | dit_affiche |
| `maths.concret.bouton` | « Voir le calcul » | affiche |

**Consigne de l'exercice**

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.consigne.titre` | « Voilà ce qu'il faut faire. » | dit_affiche |
| `maths.exo.bouton_indice` | « Un petit indice ? » | affiche |
| `maths.exo.bouton_fini` | « J'ai trouvé » | affiche |

**Les 4 indices progressifs** (PED-02, TEC-07) — un par appui, jamais plus loin.
Textes d'habillage, le contenu de chaque indice est pré-généré à l'analyse.

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.indice.1.amorce` | « Je te pose une question, pour t'aider. » | dit_affiche |
| `maths.indice.2.amorce` | « On peut faire autrement. Écoute. » | dit_affiche |
| `maths.indice.3.amorce` | « Je te montre un exemple plus facile. » | dit_affiche |
| `maths.indice.4.amorce` | « On le fait ensemble, tout doucement. » | dit_affiche |
| `maths.indice.epuise` | « Je t'ai tout dit. À toi de chercher. » | dit_affiche |

Aucune amorce n'indique le rang de l'indice. **Jamais « indice 2 sur 4 »**, ni
aucun compteur d'indices visible par l'enfant (PED-07). Le nombre d'indices
utilisés est enregistré en base (`attempt.nb_indices_utilises`) pour le résumé
parent, jamais affiché à l'enfant.

**L'enfant demande le résultat** (PED-01) — refus constant, chaleureux, sans
reproche, quel que soit le nombre de demandes :

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.demande_resultat.1` | « Je ne donne pas les réponses. Je t'aide à chercher. » | dit_affiche |
| `maths.demande_resultat.2` | « Je garde la réponse pour toi. Tu vas trouver. » | dit_affiche |
| `maths.demande_resultat.3` | « C'est toi qui trouves. Moi, je t'aide. » | dit_affiche |
| `maths.demande_resultat.4` | « Non, je ne la dis pas. Veux-tu un indice ? » | dit_affiche |

La 4e formulation est aussi la dernière : au-delà, Pilou propose une pause ou de
passer à autre chose (PED-08), sans jamais céder et sans jamais s'agacer.

**Blocage détecté** (PED-08, après 3 sollicitations sans réponse exploitable) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.blocage.corps` | « Celui-là est difficile. C'est normal. » | dit_affiche |
| `maths.blocage.corps_2` | « On souffle un peu, ou on passe à la suite ? » | dit_affiche |
| `maths.blocage.bouton` | « Faire une pause » | affiche |
| `maths.blocage.bouton_2` | « Passer à la suite » | affiche |

Pilou ne repose plus la question ensuite. Passer à la suite ne retire aucune
pierre et n'est jamais commenté (ETH-04).

**L'enfant dit qu'il a fini**

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.fini.retour` | « Bravo. Tu as bien cherché. » | dit_affiche |
| `maths.fini.retour_2` | « Tu as trouvé ta façon de faire. » | dit_affiche |
| `maths.fini.bouton` | « Continuer » | affiche |

Aucune vérification affichée, aucune coche verte, aucune croix (3.5, PED-04).

**Transition entre les deux étapes** (PRD-10) — félicitation courte,
micro-animation, annonce de la suivante :

| Clé | Texte | Mode |
| --- | --- | --- |
| `transition.felicitation.lecture` | « C'est fait. Tu as terminé la lecture. » | dit_affiche |
| `transition.felicitation.maths` | « C'est fait. Tu as terminé les maths. » | dit_affiche |
| `transition.annonce.maths` | « Maintenant, on passe aux maths. » | dit_affiche |
| `transition.annonce.lecture` | « Maintenant, on passe à la lecture. » | dit_affiche |
| `transition.bouton` | « Continuer » | affiche |

La félicitation nomme l'étape **qui vient de finir**, l'annonce nomme l'étape
**qui suit**. Les deux se choisissent par la table de sélection de 7.0.
Configuration C1 : « C'est fait. Tu as terminé la lecture. Maintenant, on passe
aux maths. » Configuration C2 : « C'est fait. Tu as terminé les maths.
Maintenant, on passe à la lecture. »

**L'écran de transition n'existe pas dans une soirée à une seule étape**
(configurations C3 à C6) : la fin de l'unique étape mène directement à
`/enfant/bravo`.

Micro-animation : Pilou hoche la tête, 600 ms, aucune explosion de particules,
aucun flash (DES-08). Son `son_etape_finie` puis `son_pierre`.

**Bouton pause** : identique à 7.5, `session.pause.bouton`, toujours visible.

**Sortie anticipée parent** : identique à 7.5 (PRD-13).

**État vide** — pas de maths ce soir :

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.vide.corps` | « Ce soir, il n'y a pas de maths. » | dit_affiche |
| `maths.vide.corps_2.suite` | « On passe à la lecture. » | dit_affiche |
| `maths.vide.corps_2.fin` | « On a fini. Viens voir. » | dit_affiche |

`maths.vide.corps_2.suite` n'est joué que si une étape lecture suit réellement
(configuration C2). Sinon, `maths.vide.corps_2.fin` mène directement à
`/enfant/bravo`.

**État d'erreur — indices indisponibles** (secours de TEC-07 en échec) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.sans_indice.corps` | « Je n'ai pas d'indice pour celui-là. » | dit_affiche |
| `maths.sans_indice.corps_2` | « Compte sur tes doigts, ça marche bien. » | dit_affiche |
| `maths.sans_indice.bouton` | « J'ai trouvé » | affiche |
| `maths.sans_indice.bouton_2` | « Passer à la suite » | affiche |

Le repli **ne donne jamais** le résultat, y compris en cas de panne IA
(charte, point 6).

**Reprise d'étape après fermeture** (PRD-18) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `maths.reprise.corps` | « On reprend les maths. » | dit_affiche |
| `maths.reprise.corps_2` | « On était sur celui-là. » | dit_affiche |

Les indices déjà déroulés restent déroulés à la reprise : l'enfant ne recommence
pas à zéro.

---

## 7.7 `/enfant/pause` — Respiration guidée

**Public** : enfant. **Accessible par l'enfant lui-même** depuis les deux étapes
(PRD-12).

**Décision produit** : la pause ne compte jamais comme un abandon, ne retire
aucune pierre, n'a **aucune durée imposée, aucun décompte et aucun minuteur**
(PED-07, ETH-01). Le bouton de retour est actif dès la première seconde.

| Clé | Texte | Mode |
| --- | --- | --- |
| `pause.titre` | « On souffle un peu. » | dit_affiche |
| `pause.corps` | « Regarde le rond. Respire avec lui. » | dit_affiche |
| `pause.inspire` | « On inspire. » | dit_affiche |
| `pause.expire` | « On souffle. » | dit_affiche |
| `pause.rassurance` | « Tu reviens quand tu veux. » | dit_affiche |
| `pause.bouton` | « Je reviens » | affiche |

Texte dit par Pilou à l'entrée, situation `demande_pause` : « On souffle un peu.
Regarde le rond. Respire avec lui. Tu reviens quand tu veux. »

**Animation** : un cercle qui grandit sur 4 s puis rétrécit sur 4 s, en continu.
Aucun chiffre, aucun nombre de cycles affiché, aucune barre. Son
`son_respiration` en boucle.

**Retour à l'étape**, situation `retour_de_pause` :

| Clé | Texte | Mode |
| --- | --- | --- |
| `pause.retour.corps` | « Te revoilà. On y retourne tranquillement. » | dit_affiche |

Aucune mention de la durée de la pause, aucun commentaire sur le fait d'avoir
fait une pause (PED-05, ETH-02).

**État vide** : sans objet.

**État d'erreur — animation ou son indisponibles** : l'écran reste affiché avec
le texte, le bouton « Je reviens » reste actif. Aucun message technique.

---

## 7.8 `/enfant/bravo` — Clôture et pierres gagnées

**Public** : enfant. **Rituel identique chaque soir** (PED-12, PRD-11).

**Décision produit** : l'enchaînement, les phrases et le son sont **exactement
les mêmes** chaque soir, quelle que soit la soirée. Aucune variation selon la
performance. Aucune incitation à recommencer pour faire mieux (PRD-11).

Séquence fixe, dans cet ordre :

| Ordre | Clé | Texte | Mode |
| --- | --- | --- | --- |
| 1 | `bravo.titre` | « Bravo Evan. » | dit_affiche |
| 2 | `bravo.corps` | « Tu as fait tes devoirs ce soir. » | dit_affiche |
| 3 | `bravo.pierres` | « Tu as gagné des pierres. » | dit_affiche |
| 4 | `bravo.coffre` | « Je les range dans ton coffre. » | dit_affiche |
| 5 | `bravo.fin` | « C'est fini. Tu peux aller jouer. » | dit_affiche |
| 6 | `bravo.bouton_principal` | « Aller jouer » | affiche |
| 7 | `bravo.bouton_secondaire` | « Voir mon coffre » | affiche |

**Décision DES-06 sur la hiérarchie des deux boutons** (reprise du 2026-09-20) :
l'action principale de la clôture est **« Aller jouer »**. Elle est seule en bas
d'écran, pleine largeur, à l'emplacement habituel de l'action principale.
« Voir mon coffre » est une action secondaire, en retrait visuel, placée
au-dessus, sans fond plein.

Motif : le rituel du soir doit se terminer sur la sortie de l'application, pas
sur l'inventaire des pierres. Terminer sur le coffre reviendrait à clore la
soirée sur le décompte de ce qui a été obtenu, ce que PRD-11 et PED-05 refusent.
Le coffre reste accessible, mais il n'est jamais la destination proposée en
premier.

Texte dit par Pilou, en entier, chaque soir : « Bravo Evan. Tu as fait tes
devoirs ce soir. Tu as gagné des pierres. Je les range dans ton coffre. C'est
fini. Tu peux aller jouer. »

**Affichage des pierres** : les pierres gagnées apparaissent une par une, en
image, avec `son_pierre` une seule fois. **Aucun chiffre n'est affiché** sur cet
écran (PED-07). Le solde chiffré n'existe que dans le coffre, et l'enfant y va
s'il le veut.

**Barème rappelé** (3.7) : +1 par étape terminée, +1 bonus si les 2 étapes du
soir sont terminées. Jamais de pierre par bonne réponse (PED-05). Le bonus n'est
jamais annoncé à l'avance : ce serait un levier de pression (ETH-01).

**Cas d'une seule étape terminée** : même rituel, mêmes phrases, une pierre de
moins affichée. **Aucune phrase ne mentionne ce qui n'a pas été fait** (ETH-02).

**Cas d'une session arrêtée par le parent** (PRD-13) : même rituel, mêmes
phrases. Les pierres déjà acquises sont affichées. Aucune mention de
l'interruption.

**État vide** : sans objet, l'écran n'est atteint qu'en fin de session.

**État d'erreur — le crédit de pierres n'a pas pu être écrit** :

| Clé | Texte | Mode |
| --- | --- | --- |
| `bravo.pierres_plus_tard` | « Je range tes pierres un peu plus tard. » | dit_affiche |
| `bravo.pierres_plus_tard_2` | « Elles sont à toi. Elles ne se perdent pas. » | dit_affiche |

Le crédit est rejoué côté serveur. L'enfant n'est jamais informé d'un échec
technique et **aucune pierre n'est jamais perdue** (ETH-04).

**Ce qui est interdit sur cet écran** : « tu peux recommencer pour faire mieux »,
un récapitulatif chiffré, une comparaison avec hier, un « à demain, n'oublie
pas ! », une invitation à revenir demain formulée comme une obligation.

---

## 7.9 `/enfant/coffre` — Coffre à trésors

**Public** : enfant. Solde de pierres, cosmétiques de Pilou, progression vers le
palier suivant (PRD-14).

**Décision produit sur les nombres montrés à l'enfant** (PED-07).

Règle générale, opposable : **seuls des nombres d'inventaire de pierres sont
affichés à l'enfant, et uniquement dans `/enfant/coffre`.** Un nombre
d'inventaire est un nombre qui compte des pierres possédées ou des pierres
restant à obtenir. Il ne baisse jamais, il ne mesure pas l'enfant, il ne se
compare pas d'un soir à l'autre.

Liste exhaustive des **trois** nombres admis devant l'enfant, tous dans
`/enfant/coffre` :

| # | Clé | Texte | Ce que le nombre compte |
| --- | --- | --- | --- |
| 1 | `coffre.solde.valeur` | « {n} » | Les pierres possédées. Ne baisse jamais (ETH-04) |
| 2 | `coffre.palier.reste` | « Encore {n} pierres. » | Les pierres restant avant le palier. Diminue seulement parce que le solde monte |
| 3 | `coffre.cosmetiques.verrouille` | « Il faut {n} pierres pour celui-là. » | Le seuil fixe d'un cosmétique. Constant |

**Interdiction correspondante** : **aucun nombre, d'aucune sorte, sur les sept
autres écrans enfant** — `/bienvenue`, `/enfant`, `/enfant/programme`,
`/enfant/session/lecture`, `/enfant/session/maths`, `/enfant/pause`,
`/enfant/bravo`. Ni durée, ni numéro d'étape, ni numéro d'indice, ni nombre
d'essais, ni nombre de pierres du soir, ni progression en pourcentage.

Ni le solde, ni aucun de ces trois nombres n'est un score de performance. L'écran
est accessible à tout moment, y compris en dehors d'une session.

| Clé | Texte | Mode |
| --- | --- | --- |
| `coffre.titre` | « Ton coffre à trésors » | dit_affiche |
| `coffre.solde.label` | « Tes pierres » | dit_affiche |
| `coffre.solde.valeur` | « {n} » | affiche |
| `coffre.rassurance` | « Tes pierres restent là. Elles ne partent jamais. » | dit_affiche |
| `coffre.bouton` | « Retour » | affiche |

Texte dit par Pilou à l'ouverture : « Ton coffre à trésors. Tes pierres restent
là. Elles ne partent jamais. »

**Progression vers le palier suivant** (PRD-14, ETH-05) :

| Clé | Texte | Mode |
| --- | --- | --- |
| `coffre.palier.titre` | « Le prochain palier » | affiche |
| `coffre.palier.reste` | « Encore {n} pierres. » | dit_affiche |
| `coffre.palier.atteint` | « Tu as atteint le palier. » | dit_affiche |
| `coffre.palier.maison` | « Je garde tes pierres. Le reste se décide à la maison. » | dit_affiche |

**Décision ETH-05, écrite noir sur blanc, en deux temps.**

**1. La description du palier saisie par le parent n'est pas affichée à
l'enfant.** L'écran `/enfant/coffre` ne montre du palier que
`coffre.palier.titre`, `coffre.palier.reste`, `coffre.palier.atteint` et
`coffre.palier.maison`. Le champ `reward_threshold.description` reste visible
**côté parent uniquement**, dans `/reglages`, sous-page Paliers.

Motif : ce champ est du texte libre saisi par un adulte. Il échapperait à toutes
les règles qui s'appliquent à chaque autre chaîne enfant du produit — 12 mots
maximum (6.3), vocabulaire de CE1, interdiction d'emoji (DES-07), interdiction de
promesse. Une seule chaîne enfant hors charte est une brèche dans la charte.
L'afficher reviendrait de plus à faire dire à l'application ce que seule la
famille décide.

**Conséquence rédactionnelle** : l'enfant voit une progression vers un palier
sans en connaître le contenu par l'application. Il le connaît par sa famille,
qui le lui a dit elle-même. C'est exactement l'intention de ETH-05.

**2. L'application n'octroie jamais la récompense.** `coffre.palier.maison` est
affiché et dit systématiquement sous le palier, pour qu'aucun enfant ne comprenne
que l'application donne quoi que ce soit. Aucune phrase du type « tu as gagné une
sortie » n'existe. Atteindre un palier ne déclenche aucune notification.

**Chaîne supprimée à la reprise du 2026-09-20** : `coffre.palier.description`
n'existe plus dans `content/ui-enfant.json`. Toute réapparition d'un texte libre
parent sur un écran enfant est un défaut bloquant.

**Aucun palier défini** — état vide :

| Clé | Texte | Mode |
| --- | --- | --- |
| `coffre.palier.vide` | « Il n'y a pas de palier pour l'instant. » | dit_affiche |
| `coffre.palier.vide_2` | « Tes pierres s'accumulent. C'est bien. » | dit_affiche |

Aucune incitation à demander un palier au parent.

**Cosmétiques de Pilou**

| Clé | Texte | Mode |
| --- | --- | --- |
| `coffre.cosmetiques.titre` | « Habiller Pilou » | dit_affiche |
| `coffre.cosmetiques.bouton_appliquer` | « Mettre à Pilou » | affiche |
| `coffre.cosmetiques.verrouille` | « Il faut {n} pierres pour celui-là. » | dit_affiche |
| `coffre.cosmetiques.debloque` | « Celui-là est à toi. » | dit_affiche |
| `coffre.cosmetiques.vide` | « Il n'y a rien à mettre pour l'instant. » | dit_affiche |

Un cosmétique verrouillé est affiché en silhouette neutre, **jamais avec un
cadenas rouge, jamais avec un compte à rebours, jamais avec une mention
« bientôt indisponible »** (ETH-01, ETH-03). Il n'est pas cliquable et ne
déclenche aucun message insistant.

**Décision ETH-03** : aucun cosmétique n'est achetable. Il n'existe aucun moyen
de payer dans Tipi, aucune publicité, aucun contenu sponsorisé, aucun traceur
tiers.

**État d'erreur — solde non récupérable** :

| Clé | Texte | Mode |
| --- | --- | --- |
| `coffre.souci.corps` | « Je n'arrive pas à ouvrir le coffre. » | dit_affiche |
| `coffre.souci.corps_2` | « Tes pierres sont bien là. Reviens tout à l'heure. » | dit_affiche |
| `coffre.souci.bouton` | « Retour » | affiche |

---

## 7.10 `/parent` — Scan des devoirs

**Public** : parent. Capture de plusieurs photos, une par consigne ou exercice
(PRD-03). Engrenage Réglages en entrée discrète (PRD-15).

| Clé | Texte |
| --- | --- |
| `parent.scan.titre` | « Les devoirs de ce soir » |
| `parent.scan.corps` | « Prenez une photo par consigne ou par exercice. » |
| `parent.scan.bouton_ajouter` | « Ajouter une photo » |
| `parent.scan.bouton_principal` | « Analyser les devoirs » |
| `parent.scan.compteur` | « {n} photo » / « {n} photos » |
| `parent.scan.photo_supprimer` | « Retirer cette photo » |
| `parent.scan.astuce` | « Posez la feuille à plat, bien éclairée. » |
| `parent.scan.saisie_manuelle` | « Saisir le devoir à la main » |

**Décision PRD-03** : plusieurs photos par soir, une par consigne, ajoutées à la
suite. Chaque vignette est supprimable avant l'analyse. La saisie manuelle est
disponible dès cet écran, pas seulement en cas d'échec : c'est la voie de secours
de PRD-16, et elle est toujours ouverte.

**Entrée Réglages** (PRD-15) : icône engrenage SVG au trait, en haut à droite,
sans libellé, sans badge. Elle mène à `/reglages/code`. Elle n'apparaît sur
**aucun écran enfant** (SEC-08).

| Clé | Texte |
| --- | --- |
| `parent.scan.reglages_aria` | « Réglages » |

**État vide — aucune photo ajoutée** :

| Clé | Texte |
| --- | --- |
| `parent.scan.vide.titre` | « Aucune photo pour l'instant. » |
| `parent.scan.vide.corps` | « Ajoutez une photo, ou saisissez le devoir à la main. » |
| `parent.scan.vide.bouton` | « Ajouter une photo » |

**État vide — pas de devoirs ce soir** (PRD-16) : le parent peut lancer une
soirée sans devoir.

| Clé | Texte |
| --- | --- |
| `parent.scan.sans_devoir.bouton` | « Pas de devoirs ce soir » |
| `parent.scan.sans_devoir.confirmation` | « Pilou dira simplement qu'il n'y a rien ce soir. Le coffre reste accessible. » |
| `parent.scan.sans_devoir.valider` | « Ouvrir Tipi à Evan » |

Aucune alerte, aucun message qui suggère qu'il manque quelque chose (ETH-02).

**États d'erreur**

| Clé | Texte |
| --- | --- |
| `parent.scan.camera_refusee.titre` | « Tipi n'a pas accès à l'appareil photo. » |
| `parent.scan.camera_refusee.corps` | « Autorisez l'accès dans les réglages du téléphone, ou saisissez le devoir à la main. » |
| `parent.scan.camera_refusee.bouton` | « Saisir le devoir à la main » |
| `parent.scan.envoi_echec.titre` | « La photo n'a pas pu être envoyée. » |
| `parent.scan.envoi_echec.corps` | « Vérifiez la connexion, puis réessayez. La photo est conservée. » |
| `parent.scan.envoi_echec.bouton` | « Réessayer » |
| `parent.scan.illisible.titre` | « La photo n'a pas pu être lue. » |
| `parent.scan.illisible.corps` | « Reprenez la photo à plat et bien éclairée, ou saisissez le devoir à la main. » |
| `parent.scan.illisible.bouton` | « Reprendre la photo » |
| `parent.scan.illisible.bouton_2` | « Saisir le devoir à la main » |
| `parent.scan.analyse_echec.titre` | « L'analyse n'a pas abouti. » |
| `parent.scan.analyse_echec.corps` | « Vous pouvez relancer l'analyse, ou saisir le devoir à la main. » |
| `parent.scan.analyse_echec.bouton` | « Relancer l'analyse » |

**Décision PRD-16** : aucun de ces états n'est une impasse. Chacun propose au
moins une action, et la saisie manuelle est toujours l'une d'elles. **Aucun code
technique, aucune trace de pile, aucun identifiant de requête n'est affiché.**

**Pendant l'analyse** :

| Clé | Texte |
| --- | --- |
| `parent.scan.analyse_en_cours` | « Analyse en cours… » |
| `parent.scan.analyse_duree` | « Cela prend une quinzaine de secondes. » |

**Pilou ne parle pas sur les écrans parent.** Aucun TTS n'est joué dans
`/parent`, `/parent/programme`, `/parent/resume`, `/reglages/code` et
`/reglages` : l'enfant peut être à côté.

---

## 7.11 `/parent/programme` — Aperçu et ajustement

**Public** : parent. Aperçu modifiable (PRD-04). **Aucune session ne démarre sans
validation explicite du parent** (TEC-06).

| Clé | Texte |
| --- | --- |
| `parent.apercu.titre` | « Le programme de ce soir » |
| `parent.apercu.resume` | « 2 étapes ce soir : lecture, maths. Environ 12 minutes. » |
| `parent.apercu.resume_une` | « 1 étape ce soir : lecture. Environ 6 minutes. » |
| `parent.apercu.etape_lecture` | « Lecture » |
| `parent.apercu.etape_maths` | « Maths » |
| `parent.apercu.duree` | « environ {n} min » |
| `parent.apercu.exercices` | « {n} exercice » / « {n} exercices » |
| `parent.apercu.bouton_retirer` | « Retirer cette étape » |
| `parent.apercu.bouton_monter` | « Faire passer en premier » |
| `parent.apercu.bouton_modifier` | « Modifier la consigne » |
| `parent.apercu.bouton_principal` | « Lancer la session » |
| `parent.apercu.bouton_retour` | « Revenir aux photos » |

**Mode basse énergie** (PRD-04) :

| Clé | Texte |
| --- | --- |
| `parent.apercu.basse_energie.label` | « Soir léger » |
| `parent.apercu.basse_energie.aide` | « Une seule étape, plus courte. Pilou ne le présente pas comme un raccourci. » |
| `parent.apercu.basse_energie.actif` | « Soir léger activé : une seule étape ce soir. » |

**Décision PRD-04** : le parent peut retirer une matière, réordonner les étapes
et activer « Soir léger ». L'ordre choisi est celui que Pilou annonce à l'enfant
en 7.4. La durée estimée est affichée au parent seulement, jamais à l'enfant
(PED-07).

**Décision TEC-06 et PRD-05** : le bouton « Lancer la session » est la seule
porte d'entrée vers `/enfant`. La session se joue sur le même appareil, sans
compte et sans connexion pour l'enfant. Au lancement, l'application passe en
mode enfant : l'engrenage Réglages disparaît, le retour arrière ne ramène pas à
`/parent`.

| Clé | Texte |
| --- | --- |
| `parent.apercu.passage_enfant` | « Passez le téléphone à Evan. Pilou prend le relais. » |

**Plus de 2 étapes détectées** (PED-06) :

| Clé | Texte |
| --- | --- |
| `parent.apercu.regroupe` | « Tout a été regroupé en 2 étapes. Le reste attendra demain. » |
| `parent.apercu.reporte` | « Reporté à demain : {liste} » |

**État vide — rien d'exploitable dans les photos** :

| Clé | Texte |
| --- | --- |
| `parent.apercu.vide.titre` | « Aucun exercice n'a été reconnu. » |
| `parent.apercu.vide.corps` | « Reprenez une photo, ou saisissez le devoir à la main. » |
| `parent.apercu.vide.bouton` | « Saisir le devoir à la main » |
| `parent.apercu.vide.bouton_2` | « Reprendre une photo » |

**États d'erreur**

| Clé | Texte |
| --- | --- |
| `parent.apercu.echec.titre` | « Le programme n'a pas pu être préparé. » |
| `parent.apercu.echec.corps` | « Vous pouvez relancer l'analyse, ou saisir le devoir à la main. » |
| `parent.apercu.echec.bouton` | « Relancer l'analyse » |
| `parent.apercu.lancement_echec.titre` | « La session n'a pas pu démarrer. » |
| `parent.apercu.lancement_echec.corps` | « Le programme est conservé. Réessayez dans un instant. » |
| `parent.apercu.lancement_echec.bouton` | « Réessayer » |

---

## 7.12 `/parent/resume` — Résumé de fin de session

**Public** : parent. **Qualitatif, jamais chiffré** (PRD-06).

**Décision PRD-06, écrite noir sur blanc** : PRD-06 dit « qualitatif, **jamais
chiffré** ». Le résumé est donc **entièrement dépourvu de chiffre**. Pas de note,
pas de pourcentage, pas de nombre de mots justes, pas de nombre d'erreurs, pas de
temps de lecture, **et pas non plus de durée de séance ni de nombre de pierres**.
Il contient des faits qualitatifs et une observation utile pour le lendemain.

La durée de séance a été retirée à la reprise du 2026-09-20 : c'est la donnée la
plus directement lisible en performance d'un soir sur l'autre, ce que le reste du
produit refuse partout ailleurs (ETH-02). Le nombre de pierres a été retiré pour
la même raison de lecture comparative. Le parent qui veut le solde exact l'ouvre
dans `/reglages`, sous-page Paliers, hors du résumé du soir.

La seule donnée numérique restante est la **date**, qui identifie la séance et ne
mesure rien.

| Clé | Texte |
| --- | --- |
| `parent.resume.titre` | « La soirée d'Evan » |
| `parent.resume.date` | « {date} » |
| `parent.resume.etapes.titre` | « Ce qui a été fait » |
| `parent.resume.etape_faite` | « {matiere} : terminée » |
| `parent.resume.etape_passee` | « {matiere} : passée » |
| `parent.resume.observation.titre` | « Observation » |
| `parent.resume.pierres` | « Les pierres de ce soir sont dans le coffre. » |
| `parent.resume.bouton` | « Fermer » |
| `parent.resume.bouton_2` | « Écouter l'enregistrement » |

**Observations types**, générées à partir de faits de session :

| Situation | Texte |
| --- | --- |
| Lecture fluide | « Evan a lu le texte en entier, sans s'arrêter longtemps. » |
| Hésitations en lecture | « Evan a buté sur quelques mots. Ils sont listés ci-dessous, si vous voulez les revoir. » |
| Maths avec indices | « Evan a demandé de l'aide sur les maths. Pilou l'a guidé sans donner les réponses. » |
| Maths sans indice | « Evan a fait les maths seul, sans demander d'indice. » |
| Pause prise | « Evan a fait une pause. Il est revenu ensuite. » |
| Blocage | « Un exercice a bloqué. Il pourrait valoir le coup de le refaire ensemble, à tête reposée. » |
| Soir léger | « Soirée en mode Soir léger : une seule étape. » |
| Exercice breton | « Le texte en breton a été lu par Evan seul. Pilou ne le corrige pas. » |
| Session arrêtée par le parent | « La séance a été arrêtée avant la fin. Les pierres acquises sont conservées. » |

**Mots hésitants** : listés en clair, sans commentaire, sans nombre, sous le
libellé « Mots à revoir, si vous voulez ». Ce n'est pas une correction, c'est une
information.

**Décision ETH-02** : aucun résumé ne contient de reproche, de rappel de ce qui
n'a pas été fait, ni de comparaison avec les soirs précédents. Il n'existe aucun
historique comparatif dans l'interface parent en V1.

**État vide — séance sans devoir** :

| Clé | Texte |
| --- | --- |
| `parent.resume.vide.titre` | « Pas de devoirs ce soir. » |
| `parent.resume.vide.corps` | « Evan a ouvert Tipi. Il n'y avait rien à faire. » |

**États d'erreur**

| Clé | Texte |
| --- | --- |
| `parent.resume.indispo.titre` | « Le résumé n'est pas encore prêt. » |
| `parent.resume.indispo.corps` | « Il apparaîtra ici dans quelques instants. La séance est bien enregistrée. » |
| `parent.resume.audio_absent` | « L'enregistrement n'est plus disponible. Les audios sont effacés automatiquement. » |

`parent.resume.audio_absent` renvoie à la purge de SEC-05, décrite dans
Réglages.

---

## 7.13 `/reglages/code` — Clavier numérique 10 chiffres

**Public** : parent. Code à 10 chiffres (PRD-15), hashé (SEC-01), limitation de
tentatives (SEC-02).

**Décision produit** : cet écran a **trois modes** — création au premier accès,
saisie ensuite, et blocage après échecs. Il n'est atteignable que depuis
l'engrenage de `/parent` ou depuis la sortie anticipée parent (PRD-13). Il
n'existe aucun lien vers lui depuis un écran enfant (SEC-08).

### Mode création (premier accès)

| Clé | Texte |
| --- | --- |
| `reglages.code.creation.titre` | « Choisissez un code à 10 chiffres » |
| `reglages.code.creation.corps` | « Ce code protège les réglages. Il n'est pas demandé à Evan. » |
| `reglages.code.creation.avert` | « Notez-le : il ne peut pas être récupéré. » |
| `reglages.code.creation.confirmer.titre` | « Saisissez-le une seconde fois » |
| `reglages.code.creation.bouton` | « Enregistrer le code » |
| `reglages.code.creation.discordance` | « Les deux saisies ne correspondent pas. Recommencez. » |
| `reglages.code.creation.longueur` | « Le code fait exactement 10 chiffres. » |

**Décision SEC-01** : aucun code par défaut n'est livré. Le code n'apparaît
jamais en clair à l'écran après validation, jamais dans un journal, jamais dans
un prompt IA (SEC-08).

### Mode saisie

| Clé | Texte |
| --- | --- |
| `reglages.code.saisie.titre` | « Code parent » |
| `reglages.code.saisie.corps` | « 10 chiffres » |
| `reglages.code.saisie.bouton` | « Valider » |
| `reglages.code.saisie.effacer` | « Effacer » |
| `reglages.code.saisie.annuler` | « Annuler » |

Les chiffres saisis sont masqués par des pastilles pleines, sans révélation
possible. Aucun retour visuel ne se déclenche avant le dixième chiffre.

### États d'erreur et blocage (SEC-02)

| Clé | Texte |
| --- | --- |
| `reglages.code.refuse` | « Ce code ne correspond pas. » |
| `reglages.code.refuse_reste` | « Il reste {n} essais avant un blocage temporaire. » |
| `reglages.code.bloque.titre` | « Saisie bloquée » |
| `reglages.code.bloque.corps` | « Trop d'essais. Réessayez dans {duree}. » |
| `reglages.code.bloque.aide` | « Le blocage se lève tout seul. Rien n'est perdu. » |

**Décision SEC-02** : blocage progressif après 5 essais. Le message indique
uniquement la durée restante, jamais le nombre total d'essais historiques,
jamais un indice sur le code.

**Décision produit sur le ton** : même bloqué, le message reste factuel et non
accusateur. « Ce code ne correspond pas » plutôt que « code incorrect » ou
« erreur ».

**Cas de la sortie anticipée de session** (PRD-13) : après validation du code,
l'application revient au résumé parent, pas à l'écran enfant.

| Clé | Texte |
| --- | --- |
| `reglages.code.sortie.titre` | « Arrêter la session d'Evan » |
| `reglages.code.sortie.corps` | « Les pierres déjà gagnées sont conservées. » |

**Écran enfant** : cet écran n'est jamais visible par l'enfant. L'appui long qui
y mène dure 2 secondes, sans indication visuelle qui le signalerait à l'enfant.

---

## 7.14 `/reglages` — Menu Réglages et sous-pages

**Public** : parent. Accessible uniquement après le code (PRD-15).

| Clé | Texte |
| --- | --- |
| `reglages.titre` | « Réglages » |
| `reglages.bouton_fermer` | « Fermer les réglages » |

**Menu principal**, en liste groupée :

| Clé | Libellé | Sous-titre |
| --- | --- | --- |
| `reglages.menu.enfant` | « Profil d'Evan » | « Prénom, date de naissance, classe » |
| `reglages.menu.theme` | « Apparence » | « Pilou ou Apple » |
| `reglages.menu.paliers` | « Paliers de récompense » | « Ce que vous décidez de donner » |
| `reglages.menu.sons` | « Sons » | « Sons de l'application et voix de Pilou » |
| `reglages.menu.donnees` | « Données et confidentialité » | « Ce qui est stocké, export, suppression » |
| `reglages.menu.audio` | « Enregistrements vocaux » | « Durée de conservation » |
| `reglages.menu.code` | « Code parent » | « Changer le code » |
| `reglages.menu.calibration` | « Calibration des photos » | « Réglage de la lecture des photos » |
| `reglages.menu.apropos` | « À propos » | « Version de Tipi » |

### Sous-page « Profil d'Evan » (PRD-02)

| Clé | Texte |
| --- | --- |
| `reglages.enfant.titre` | « Profil d'Evan » |
| `reglages.enfant.prenom` | « Prénom » |
| `reglages.enfant.naissance` | « Date de naissance » |
| `reglages.enfant.age` | « {n} ans » |
| `reglages.enfant.age_aide` | « L'âge est calculé à partir de la date de naissance. » |
| `reglages.enfant.niveau` | « Niveau » |
| `reglages.enfant.bilingue` | « Classe bilingue français-breton » |
| `reglages.enfant.bilingue_aide` | « Les textes en breton sont affichés. Pilou les explique en français, sans les lire. » |
| `reglages.enfant.bouton` | « Enregistrer » |

**Décision PRD-02** : le profil est pré-rempli (Evan, 29/11/2019, CE1, classe
bilingue) et reste modifiable. **L'âge n'est jamais une valeur saisie ni codée
en dur** : il est calculé depuis la date de naissance et affiché en lecture
seule.

**Décision PED-13** : `reglages.enfant.bilingue_aide` est la seule promesse faite
sur le breton, et elle est faite au parent, jamais à l'enfant. Aucun réglage ne
laisse croire qu'une voix bretonne arrivera.

### Sous-page « Apparence » (PRD-17)

| Clé | Texte |
| --- | --- |
| `reglages.theme.titre` | « Apparence » |
| `reglages.theme.pilou` | « Pilou » |
| `reglages.theme.pilou_aide` | « Coloré, arrondi, chaleureux. » |
| `reglages.theme.apple` | « Apple » |
| `reglages.theme.apple_aide` | « Sobre, proche des réglages du téléphone. » |
| `reglages.theme.corps` | « Le changement est immédiat. Les textes et Pilou ne changent pas. » |

**Décision PRD-17** : deux thèmes commutables à chaud, choisis par le parent.
Aucune bascule automatique, aucun thème présenté comme meilleur. Le thème
sélectionné est appliqué dès l'écran de lancement (section 4.2).

### Sous-page « Paliers de récompense » (PRD-14, ETH-05)

| Clé | Texte |
| --- | --- |
| `reglages.paliers.titre` | « Paliers de récompense » |
| `reglages.paliers.corps` | « Vous définissez le palier et vous donnez la récompense. Tipi compte seulement les pierres. » |
| `reglages.paliers.ajouter` | « Ajouter un palier » |
| `reglages.paliers.gems` | « Nombre de pierres » |
| `reglages.paliers.description` | « Ce que vous proposez » |
| `reglages.paliers.description_ex` | « Par exemple : ce que vous avez prévu de faire ensemble. » |
| `reglages.paliers.description_aide` | « Ce texte reste ici. Il n'est pas affiché à Evan. » |
| `reglages.paliers.atteint` | « Atteint le {date} » |
| `reglages.paliers.supprimer` | « Supprimer ce palier » |
| `reglages.paliers.vide` | « Aucun palier pour l'instant. Les pierres s'accumulent quand même. » |

**Décision ETH-05** : `reglages.paliers.corps` est affiché en haut de la page,
non masquable. Tipi ne délivre jamais la récompense et ne notifie jamais l'enfant
qu'une récompense est due. Le solde ne baisse jamais quand un palier est atteint
(ETH-04) : le palier est marqué « atteint », les pierres restent.

**Décision sur l'exemple de saisie, tranchée une seule fois** : le champ
description est **vide par défaut**. Aucune valeur n'est pré-remplie, aucune
valeur n'est enregistrée à la place du parent. `reglages.paliers.description_ex`
est un texte d'aide affiché sous le champ, jamais une valeur de champ, et il ne
nomme **aucun objet, aucune sortie et aucun avantage précis** : il renvoie le
parent à ce qu'il a déjà décidé. L'application ne suggère donc jamais de
récompense.

**Décision de périmètre** (reprise du 2026-09-20) : cette description n'est
affichée que dans cet écran de Réglages. Elle n'apparaît sur aucun écran enfant,
ce que `reglages.paliers.description_aide` dit explicitement au parent au moment
où il la saisit. Voir 7.9.

### Sous-page « Sons »

| Clé | Texte |
| --- | --- |
| `reglages.sons.titre` | « Sons » |
| `reglages.sons.effets` | « Sons de l'application » |
| `reglages.sons.voix` | « Voix de Pilou » |
| `reglages.sons.voix_aide` | « Si la voix est coupée, les textes restent affichés. » |
| `reglages.sons.silence_aide` | « En mode silencieux, Tipi ne produit aucun son. » |

**Décision PED-10** : couper la voix de Pilou est possible, mais l'aide indique
explicitement que l'information reste lisible à l'écran. Aucun texte porteur
d'information n'est exclusivement vocal.

### Sous-page « Données et confidentialité » (SEC-07)

| Clé | Texte |
| --- | --- |
| `reglages.donnees.titre` | « Données et confidentialité » |
| `reglages.donnees.intro` | « Voici ce que Tipi garde, et pourquoi. » |
| `reglages.donnees.photos` | « Les photos des devoirs, pour lire les consignes. » |
| `reglages.donnees.textes` | « Le texte des devoirs, pour préparer la séance. » |
| `reglages.donnees.audio` | « Les enregistrements vocaux, pour que vous puissiez les réécouter. » |
| `reglages.donnees.session` | « Le déroulé des séances, pour reprendre là où Evan s'est arrêté. » |
| `reglages.donnees.pierres` | « L'historique des pierres, pour que le compte soit toujours juste. » |
| `reglages.donnees.ia` | « Le texte des devoirs est analysé par un service d'intelligence artificielle. Le prénom d'Evan et les photos ne lui sont jamais envoyés. » |
| `reglages.donnees.export` | « Exporter mes données » |
| `reglages.donnees.supprimer` | « Tout supprimer » |
| `reglages.donnees.supprimer_conf` | « Cette suppression est définitive. Les pierres et l'historique seront effacés. » |
| `reglages.donnees.supprimer_valider` | « Supprimer définitivement » |

**Décision ETH-03** : cette page affirme qu'il n'y a ni publicité, ni traceur
tiers, ni achat.

| Clé | Texte |
| --- | --- |
| `reglages.donnees.pas_de_pub` | « Tipi ne contient aucune publicité, aucun achat et aucun traceur publicitaire. » |

### Sous-page « Enregistrements vocaux » (SEC-05)

| Clé | Texte |
| --- | --- |
| `reglages.audio.titre` | « Enregistrements vocaux » |
| `reglages.audio.corps` | « Les enregistrements sont effacés automatiquement après la durée choisie. » |
| `reglages.audio.duree` | « Conserver pendant » |
| `reglages.audio.option_7` | « 7 jours » |
| `reglages.audio.option_30` | « 30 jours » |
| `reglages.audio.option_0` | « Ne rien conserver » |
| `reglages.audio.purger` | « Effacer maintenant » |

### Sous-page « Code parent » (SEC-01)

| Clé | Texte |
| --- | --- |
| `reglages.codeparent.titre` | « Code parent » |
| `reglages.codeparent.corps` | « Le code protège les réglages. Il n'est jamais montré à Evan. » |
| `reglages.codeparent.changer` | « Changer le code » |
| `reglages.codeparent.actuel` | « Code actuel » |
| `reglages.codeparent.nouveau` | « Nouveau code » |

### Sous-page « Calibration des photos » (TEC-16)

| Clé | Texte |
| --- | --- |
| `reglages.calibration.titre` | « Calibration des photos » |
| `reglages.calibration.corps` | « Les premières photos sont conservées avec leur analyse, pour régler la lecture automatique. » |
| `reglages.calibration.restantes` | « {n} photos encore enregistrées pour la calibration. » |
| `reglages.calibration.voir` | « Voir le détail d'une analyse » |
| `reglages.calibration.desactiver` | « Arrêter la calibration » |

### Sous-page « À propos »

| Clé | Texte |
| --- | --- |
| `reglages.apropos.titre` | « À propos » |
| `reglages.apropos.version` | « Version {version} » |
| `reglages.apropos.corps` | « Tipi accompagne Evan dans ses devoirs du soir. » |

**Aucun slogan, aucun texte marketing, aucun lien de partage, aucune invitation
à noter l'application.**

### États vides et d'erreur de Réglages

| Clé | Texte |
| --- | --- |
| `reglages.vide.paliers` | « Aucun palier pour l'instant. » |
| `reglages.vide.audio` | « Aucun enregistrement conservé. » |
| `reglages.vide.calibration` | « Aucune analyse enregistrée pour l'instant. » |
| `reglages.echec.sauvegarde` | « La modification n'a pas pu être enregistrée. Réessayez. » |
| `reglages.echec.export` | « L'export n'a pas pu être préparé. Réessayez dans un instant. » |
| `reglages.echec.suppression` | « La suppression n'a pas pu aller au bout. Rien n'a été effacé. » |
| `reglages.session_expiree` | « Les réglages se sont refermés. Saisissez le code à nouveau. » |

**Décision PRD-15** : la session Réglages se referme automatiquement après
5 minutes d'inactivité ou dès que la session enfant démarre.

---

# 8. Notification parent (PRD-06)

**Décision produit** : Tipi envoie **une seule notification, à un seul moment** :
à la fin de la séance, au parent. Il n'existe aucune autre notification dans
l'application.

| Clé | Texte |
| --- | --- |
| `notif.resume.titre` | « La séance d'Evan est terminée. » |
| `notif.resume.corps` | « Le résumé est prêt. » |
| `notif.resume.sans_devoir.titre` | « Pas de devoirs ce soir. » |
| `notif.resume.sans_devoir.corps` | « Evan a ouvert Tipi. Il n'y avait rien à faire. » |

**Notifications formellement interdites** (ETH-01, ETH-02) :

| Notification interdite | Pourquoi |
| --- | --- |
| « Evan n'a pas fait ses devoirs ce soir » | Culpabilisante (ETH-02) |
| « 3 soirs d'affilée, ne cassez pas la série » | Série à ne pas casser (ETH-02) |
| « Plus que 2 heures pour faire les devoirs » | Urgence artificielle (ETH-01) |
| « Evan vous attend » | Pression sur le parent |
| Toute notification envoyée à l'enfant | Aucune sollicitation d'un enfant de 6 ans |
| Toute notification de relance à J+1, J+3, J+7 | Réengagement forcé (ETH-02) |

---

# 9. États limites transverses (PRD-16)

Les quatre états limites nommés par PRD-16, avec leur traitement définitif.

| État limite | Écran parent | Écran enfant | Sortie garantie |
| --- | --- | --- | --- |
| **Aucun devoir chargé ce soir** | `parent.scan.sans_devoir.*` (7.10) | `enfant.accueil.vide.*` (7.3) | L'enfant va au coffre. Le parent n'est pas relancé |
| **OCR illisible** | `parent.scan.illisible.*` (7.10) | jamais montré à l'enfant | Reprendre la photo ou saisir à la main |
| **Blocage total sur un exercice** | signalé dans le résumé (7.12) | `maths.blocage.*` / `lecture.blocage.*` | Pause ou passage à la suite, sans commentaire |
| **Session interrompue et reprise plus tard** | aucun message | `enfant.accueil.reprise.*`, `lecture.reprise.*`, `maths.reprise.*` | On repart exactement là où l'enfant s'était arrêté (PRD-18) |

**Règle opposable** : aucun état limite n'affiche un message technique brut, un
code d'erreur, un identifiant de requête ou une trace de pile. Chaque état limite
propose au moins une action possible. Un état limite sans action est un défaut
bloquant.

---

# 10. Checklist éthique opposable ETH-01 à ETH-05

Checklist à usage des contrôleurs (`controle-produit`, `controle-design`,
`controle-code`, `gardien-charte`, `recette-finale`). Chaque item se vérifie
**en regardant un écran ou en lisant un fichier**, et se répond par oui ou non.
Un seul « non » est bloquant.

## ETH-01 — Aucun mécanisme d'urgence ou de rareté artificielle

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| ETH-01.1 | Aucun écran enfant n'affiche un chrono, un sablier, un compte à rebours ou une barre qui se vide ? | Les 8 écrans enfant, en session réelle | [ ] |
| ETH-01.2 | Aucune phrase de `content/**` ne contient « vite », « dépêche », « plus que », « dernière chance », « il te reste » ? | Recherche textuelle dans `content/**` | [ ] |
| ETH-01.3 | Les cosmétiques verrouillés du coffre sont affichés sans mention de durée, de date limite ou de disponibilité limitée ? | `/enfant/coffre`, un cosmétique verrouillé | [ ] |
| ETH-01.4 | L'écran de pause n'affiche aucune durée, aucun décompte et aucun nombre de cycles ? | `/enfant/pause` | [ ] |
| ETH-01.5 | Le bonus de la 2e étape n'est jamais annoncé avant d'être acquis ? | `/enfant/programme`, `/enfant/bravo` | [ ] |
| ETH-01.6 | Aucune notification ne mentionne un délai ou une échéance ? | `content/ui-parent.json`, section `notif.*` | [ ] |

## ETH-02 — Aucune série à ne pas casser ni notification culpabilisante

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| ETH-02.1 | Aucun écran n'affiche un nombre de jours consécutifs, un calendrier de présence ou une série ? | Les 14 écrans | [ ] |
| ETH-02.2 | La seule notification existante est celle de fin de séance, adressée au parent ? | Code d'envoi des notifications, un seul point d'appel | [ ] |
| ETH-02.3 | Aucune notification n'est envoyée quand l'enfant n'a pas ouvert l'application ? | Absence de toute tâche planifiée de relance | [ ] |
| ETH-02.4 | Le résumé parent ne mentionne jamais ce qui n'a pas été fait sur un ton de reproche ? | `/parent/resume`, cas « étape passée » et « session arrêtée » | [ ] |
| ETH-02.5 | L'écran de reprise ne mentionne ni le temps écoulé, ni l'interruption ? | `/enfant`, cas reprise (PRD-18) | [ ] |
| ETH-02.6 | Aucune phrase enfant ne contient « d'affilée », « série », « chaque jour », « tu n'as pas » ? | Recherche textuelle dans `content/**` | [ ] |

## ETH-03 — Aucun achat intégré, aucune publicité, aucun traceur tiers

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| ETH-03.1 | Aucun écran ne propose d'acheter, de s'abonner, de débloquer contre paiement ? | Les 14 écrans, en particulier `/enfant/coffre` et `/reglages` | [ ] |
| ETH-03.2 | Aucune dépendance de paiement n'est présente dans `package.json` ? | `package.json` | [ ] |
| ETH-03.3 | Aucun script tiers d'analyse, de publicité ou de mesure d'audience n'est chargé ? | Onglet réseau sur les 14 écrans, et `src/app/layout.tsx` | [ ] |
| ETH-03.4 | Aucun cookie tiers n'est posé ? | Stockage du navigateur après une séance complète | [ ] |
| ETH-03.5 | La page Données et confidentialité affirme explicitement l'absence de publicité, d'achat et de traceur ? | `/reglages`, clé `reglages.donnees.pas_de_pub` | [ ] |

## ETH-04 — Les pierres ne se perdent jamais et n'expirent jamais

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| ETH-04.1 | Aucun delta négatif ne peut être écrit dans `gem_ledger` ? | Contrainte en base et test qui le prouve | [ ] |
| ETH-04.2 | Le solde affiché dans le coffre ne baisse jamais entre deux ouvertures consécutives ? | `/enfant/coffre` avant et après une séance interrompue | [ ] |
| ETH-04.3 | Atteindre un palier ne diminue pas le solde ? | `/enfant/coffre` et `/reglages`, palier marqué atteint | [ ] |
| ETH-04.4 | Une pause, un passage d'exercice ou une sortie anticipée parent ne retire aucune pierre ? | Scénarios pause, blocage, sortie parent | [ ] |
| ETH-04.5 | Aucune date d'expiration n'existe sur une pierre ou un cosmétique ? | Schéma de données, absence de champ d'expiration | [ ] |
| ETH-04.6 | Aucune phrase de `content/**` ne contient « perdre », « perdu », « retirer une pierre », « expire » ? | Recherche textuelle dans `content/**` | [ ] |

## ETH-05 — L'application n'octroie jamais elle-même une récompense réelle

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| ETH-05.1 | Aucune phrase dite ou affichée à l'enfant ne promet un objet, une sortie ou un avantage réel ? Le contrôle porte sur les textes du produit **et** sur toute donnée saisie par le parent qui serait rendue sur un écran enfant | `content/encouragements.json`, `content/gwenn-scripts.json`, `content/ui-enfant.json`, **et** le champ `reward_threshold.description` : vérifier qu'aucun composant d'un écran `/enfant/**` ne le rend | [ ] |
| ETH-05.1 bis | L'écran `/enfant/coffre` n'affiche aucun texte libre saisi par le parent ? La clé `coffre.palier.description` n'existe nulle part dans le code ni dans les fichiers de contenu | Recherche de `coffre.palier.description` et de `reward_threshold.description` dans `src/app/enfant/**` et `content/ui-enfant.json`, 0 occurrence attendue | [ ] |
| ETH-05.2 | Le palier affiché à l'enfant est accompagné de la mention que la décision se prend à la maison ? | `/enfant/coffre`, clé `coffre.palier.maison`, affichée et dite | [ ] |
| ETH-05.3 | La description du palier est saisie par le parent, le champ est vide par défaut, aucune valeur n'est pré-remplie ni enregistrée à sa place ? Un exemple de saisie neutre est admis sous le champ, à condition qu'il ne nomme aucun objet, aucune sortie et aucun avantage précis | `/reglages`, sous-page Paliers : champ vide à la création, et texte de `reglages.paliers.description_ex` | [ ] |
| ETH-05.4 | Atteindre un palier ne déclenche aucune notification à l'enfant ni aucune promesse automatique ? | Scénario palier atteint | [ ] |
| ETH-05.5 | La page Paliers affiche en permanence que c'est le parent qui donne ? | `/reglages`, clé `reglages.paliers.corps`, non masquable | [ ] |
| ETH-05.6 | Aucune récompense virtuelle n'est présentée comme ayant une valeur réelle ? | `/enfant/coffre`, cosmétiques | [ ] |

## Contrôle transverse de la charte de ton

| # | Question de contrôle | Où regarder | Oui / Non |
| --- | --- | --- | --- |
| TON-1 | Aucune chaîne destinée à l'enfant ne contient « c'est faux », « erreur », « tu t'es trompé », « faire mieux » ? | `content/**` | [ ] |
| TON-2 | Chaque phrase destinée à l'enfant compte 12 mots maximum ? | Mesure automatique sur `content/**` | [ ] |
| TON-3 | Aucun emoji n'apparaît dans `content/**`, `src/**` et les icônes ? | Recherche de plages Unicode d'emoji | [ ] |
| TON-4 | Toute information nécessaire à l'action est en `dit_affiche` ? | Champ `mode` de chaque entrée de contenu | [ ] |
| TON-5 | Aucun message de difficulté n'a « tu » pour sujet ? | États d'erreur des écrans enfant | [ ] |
| TON-6 | Aucune référence à la Bretagne hors contenu de devoir et hors réglage parent ? Le nom de fichier `content/gwenn-scripts.json` est la seule exception connue, imposée par le prompt maître et en attente d'arbitrage (A13) : elle ne vaut pas non-conformité tant que A13 n'est pas tranché | `content/**`, visuels, sons, nom du produit, nom de la mascotte | [ ] |
| TON-7 | Les seuls nombres affichés à l'enfant sont les trois nombres d'inventaire de `/enfant/coffre` listés en 7.9 ? | Les 8 écrans enfant, en session réelle : aucun nombre sur les sept autres | [ ] |
| TON-8 | Pour chacune des six configurations C1 à C6 de 7.0, Pilou ne nomme jamais une matière absente du programme du soir ? | Dérouler les six configurations : lecture puis maths, maths puis lecture, lecture seule, maths seule, et les deux Soirs légers | [ ] |

---

# 11. Arbitrages produit tranchés ici

Les points que le prompt maître laissait ouverts, et la décision retenue.

| # | Point ouvert | Décision | Justification |
| --- | --- | --- | --- |
| A1 | `/bienvenue` est marqué « Enfant » dans la section 3.1, mais le code parent doit bien être créé une première fois | L'onboarding reste **entièrement enfant**, 3 écrans, sans saisie. Le code parent est créé au **premier accès à `/reglages/code`**, en mode création (7.13) | Ne jamais faire passer un enfant de 6 ans par un écran de configuration |
| A2 | Le coffre affiche des nombres, or PED-07 interdit les chiffres devant l'enfant | **Trois nombres exactement** sont admis devant l'enfant, tous dans `/enfant/coffre` : `coffre.solde.valeur`, `coffre.palier.reste` et `coffre.cosmetiques.verrouille`. Ce sont des nombres d'inventaire de pierres. **Aucun nombre, d'aucune sorte, sur les sept autres écrans enfant.** Règle générale et liste exhaustive écrites en 7.9, contrôlées par TON-7 | Un nombre d'inventaire de pierres ne baisse jamais, ne mesure pas l'enfant et ne se compare pas d'un soir à l'autre. Ce n'est pas une mesure de performance |
| A3 | Le palier de récompense risque d'être lu comme une promesse de l'application | La description du palier saisie par le parent **n'est pas affichée à l'enfant** : elle reste dans `/reglages`. `/enfant/coffre` ne montre que la progression et la mention permanente `coffre.palier.maison`, affichée et dite | ETH-05, et refus d'une chaîne enfant échappant aux 12 mots, au vocabulaire CE1 et à DES-07 |
| A4 | Quelle durée pour la pause | **Aucune durée.** Le bouton de retour est actif immédiatement | PRD-12, ETH-01 |
| A5 | Faut-il annoncer le bonus de la 2e étape pour motiver | **Non.** Le bonus n'est jamais annoncé à l'avance | Ce serait un levier de pression (ETH-01) |
| A6 | Pilou parle-t-elle sur les écrans parent | **Non.** Aucun TTS sur `/parent`, `/parent/programme`, `/parent/resume`, `/reglages/code`, `/reglages` | L'enfant peut être à côté ; le résumé parent ne doit pas lui être lu |
| A7 | Quelles données chiffrées dans le résumé parent | **Aucune.** PRD-06 dit « jamais chiffré » et le résumé ne contient donc aucun chiffre. La durée de séance et le nombre de pierres, présents dans la première version, sont retirés. Seule subsiste la date, qui identifie la séance et ne mesure rien | PRD-06 pris à la lettre. La durée de séance est la donnée la plus lisible en comparaison d'un soir sur l'autre, ce que ETH-02 refuse partout ailleurs. Aucune dérogation n'est donc demandée |
| A8 | Comment nommer le mode basse énergie côté parent | **« Soir léger »**. Jamais présenté à l'enfant comme un mode réduit | PRD-04, et l'enfant ne doit pas se vivre en version dégradée |
| A9 | Que faire si le micro est refusé en lecture | L'étape reste terminable sans micro, via « J'ai fini de lire » | PRD-16, aucune impasse |
| A10 | Que dit Pilou si l'IA ne fournit aucun indice | Elle propose une méthode concrète générique, et **ne donne jamais le résultat** | PED-01, charte point 6 |
| A11 | Faut-il un historique comparatif pour le parent | **Non en V1.** Versé au backlog V2 | Risque direct de lecture en performance (ETH-02) |
| A12 | Le breton dans la marque | **Exclu totalement.** Le breton n'existe que comme contenu de devoir, et la seule mention est destinée au parent | PED-13, consigne de marque |
| A13 | Le nom de fichier `content/gwenn-scripts.json` est un mot breton, ce qui contredit l'interdit de marque de la section 3.3 | **Non tranché ici. Arbitrage humain demandé.** Ce livrable ne renomme pas le fichier : le nom est fixé par le prompt maître. Option 1, conserver `content/gwenn-scripts.json` et assumer l'exception, que TON-6 mentionne alors nommément. Option 2, renommer en `content/pilou-scripts.json`, cohérent avec la marque et avec le nom de la mascotte, ce qui impose de corriger `.cursor/agents/contenu-enfant.md` | Le producteur n'a pas autorité pour modifier le prompt maître ni un fichier d'agent. À ouvrir dans `docs/agents/ESCALADE.md` par l'Orchestrateur |
| A14 | Que se passe-t-il entre une soirée à deux étapes et une soirée à une étape | **Aucune différence perceptible par l'enfant.** Les six configurations C1 à C6 de 7.0 se jouent avec des textes propres. Rien ne signale à l'enfant qu'une matière a été retirée ou qu'un Soir léger est actif | PRD-04 autorise le parent à réordonner et à retirer ; l'enfant ne doit jamais se vivre en version dégradée |

Points versés au backlog V2, non traités ici : historique comparatif parent,
voix de synthèse bretonne, second enfant dans l'interface, partage du résumé.

---

# 12. Tableau de couverture REQ-PRD et REQ-ETH

Une ligne par exigence, la section de ce document qui la traite, et la décision.

| ID | Section de ce document | Décision produit |
| --- | --- | --- |
| PRD-01 | 7.2, 7.1 | Onboarding en 3 écrans enfant, textes définitifs fournis, sans saisie. Un marqueur est posé à la fin de l'écran 3 ; l'aiguillage de `/` ne renvoie plus jamais vers `/bienvenue`. Aucun bouton « revoir l'accueil » n'existe dans Réglages |
| PRD-02 | 7.14, sous-page Profil | Profil unique pré-rempli (Evan, 29/11/2019, CE1, classe bilingue). L'âge est affiché en lecture seule et calculé depuis la date de naissance : `reglages.enfant.age_aide` l'écrit explicitement. Aucun âge saisi ni codé en dur |
| PRD-03 | 7.10 | `/parent` permet d'ajouter plusieurs photos, une par consigne, chacune supprimable avant l'analyse. Compteur de photos, astuce de cadrage, et saisie manuelle disponible en permanence |
| PRD-04 | 7.11, 7.0 | L'aperçu est modifiable : retirer une étape, la faire passer en premier, modifier une consigne, et activer « Soir léger » (une seule étape, plus courte). L'ordre choisi est celui que Pilou annonce à l'enfant. Les six configurations de soirée qui en découlent (C1 à C6) ont chacune leurs textes enfant, listés en 7.0 avec leur table de sélection : aucune phrase enfant ne fige l'ordre ni la matière, et Pilou ne nomme jamais une matière absente du programme du soir |
| PRD-05 | 7.11 | « Lancer la session » est la seule porte vers `/enfant`, sur le même appareil. L'enfant n'a ni compte, ni connexion, ni saisie. Le passage est explicite : `parent.apercu.passage_enfant` |
| PRD-06 | 7.12, 8 | Résumé **entièrement non chiffré**, conforme à la lettre de PRD-06 : faits et observation en langage courant, aucune note, aucun pourcentage, aucun compte d'erreurs, **et ni durée de séance ni nombre de pierres**. Seule la date identifie la séance. Une notification unique, en fin de séance, adressée au parent. Aucune dérogation n'est demandée |
| PRD-07 | 7.4, 7.9 | `/enfant/programme` affiche 2 cartes maximum, un picto et un mot par carte, dans l'ordre réel des étapes. Aucune durée, aucune numérotation, aucune liste d'exercices. Pilou annonce l'ordre à l'oral. Plus largement, aucun nombre n'est affiché sur cet écran ni sur aucun autre écran enfant, hors les trois nombres d'inventaire de `/enfant/coffre` énumérés en 7.9 |
| PRD-08 | 7.5 | Étape lecture complète : modèle lu par Pilou, réécoute illimitée, micro, retour centré sur l'effort, hésitation traitée par une proposition, transcription douteuse traitée par « je n'ai pas bien entendu », questions de compréhension avec « Je ne sais pas » toujours disponible, cas breton en mode dégradé |
| PRD-09 | 7.6 | Étape maths complète : concret avant abstrait, bouton « Un petit indice ? » qui déroule 4 niveaux et pas un de plus, refus constant de donner le résultat avec 4 formulations, blocage traité par une proposition de pause ou de passage, aucune validation juste/faux affichée |
| PRD-10 | 7.6 transition, 7.0 | Transition douce : félicitation courte nommant l'étape qui vient de finir (`transition.felicitation.lecture` ou `.maths`), micro-animation de 600 ms sans flash, annonce de l'étape suivante (`transition.annonce.maths` ou `.lecture`), puis un seul bouton « Continuer ». L'écran de transition n'existe pas dans une soirée à une seule étape |
| PRD-11 | 7.8 | Clôture rituelle identique chaque soir. Pierres affichées une à une, sans chiffre. L'action principale en bas d'écran est « Aller jouer » ; « Voir mon coffre » est une action secondaire en retrait, pour que la soirée ne se termine pas sur l'inventaire (DES-06). Aucune phrase n'invite à recommencer pour faire mieux ; la liste des formulations interdites sur cet écran est explicite |
| PRD-12 | 7.5, 7.6, 7.7 | Bouton « Pause » permanent sur les deux écrans d'étape, cible de 56 px minimum, jamais grisé. `/enfant/pause` n'a aucune durée imposée, retour actif immédiatement, aucune pierre retirée, aucun commentaire au retour |
| PRD-13 | 7.5, 7.13 | Sortie anticipée par appui long de 2 s sur le titre de l'étape, puis code parent. Aucun bouton visible pour l'enfant, aucune indication visuelle de l'appui long. Après validation, retour au résumé parent, pierres acquises conservées |
| PRD-14 | 7.9 | `/enfant/coffre` affiche le solde, les cosmétiques de Pilou et la progression vers le palier suivant. La description du palier saisie par le parent n'est **pas** affichée à l'enfant : l'écran montre la progression et la mention `coffre.palier.maison`. Cosmétique verrouillé en silhouette neutre, non cliquable, sans cadenas ni urgence. Accessible hors session. Les trois seuls nombres montrés à l'enfant dans tout le produit sont ici, et sont énumérés |
| PRD-15 | 7.10, 7.13, 7.14 | Entrée Réglages par un engrenage discret, présent uniquement sur `/parent`. Code numérique à 10 chiffres, créé au premier accès, jamais livré par défaut. Fermeture automatique après 5 minutes d'inactivité ou au démarrage d'une session enfant |
| PRD-16 | 7.3, 7.5, 7.6, 7.10, 7.11, 9 | Les quatre états limites ont un texte bienveillant et au moins une action de sortie : aucun devoir ce soir, OCR illisible, blocage total, session interrompue. Aucun code technique n'est jamais affiché. La saisie manuelle est la voie de secours permanente |
| PRD-17 | 7.14, sous-page Apparence | Deux thèmes commutables à chaud depuis Réglages, « Pilou » et « Apple ». Mêmes textes, même Pilou, même icône. Aucun thème présenté comme meilleur, aucune bascule automatique. Le thème mémorisé est appliqué dès l'écran de lancement |
| PRD-18 | 7.1, 7.3, 7.5, 7.6 | La reprise est traitée par des textes dédiés à trois niveaux : accueil (`enfant.accueil.reprise.*`), lecture (`lecture.reprise.*`), maths (`maths.reprise.*`). Les indices déjà déroulés restent déroulés. Aucune mention du temps écoulé ni de l'interruption |
| ETH-01 | 3.2, 5.3, 7.7, 7.9, 10 | Aucun chrono, sablier, décompte, barre qui se vide, date limite ni rareté, nulle part. La pause n'a aucune durée. Le bonus de la 2e étape n'est jamais annoncé à l'avance. Checklist de 6 items vérifiables |
| ETH-02 | 3.2, 7.3, 7.8, 7.12, 8, 10 | Aucune série, aucun calendrier de présence, aucune relance. Une seule notification, en fin de séance, au parent. Le résumé ne reproche jamais rien. La reprise ne commente jamais l'interruption. Checklist de 6 items vérifiables |
| ETH-03 | 3.2, 7.9, 7.14, 10 | Aucun achat, aucune publicité, aucun traceur tiers. Aucun cosmétique achetable. La page Données et confidentialité l'affirme explicitement via `reglages.donnees.pas_de_pub`. Checklist de 5 items vérifiables |
| ETH-04 | 1.2, 3.1, 7.8, 7.9, 7.14, 10 | Les pierres ne se perdent jamais et n'expirent jamais. Aucun delta négatif en base. Pause, passage d'exercice, sortie parent et palier atteint ne retirent rien. En cas d'échec de crédit, Pilou dit que les pierres ne se perdent pas et le crédit est rejoué. Checklist de 6 items vérifiables |
| ETH-05 | 1.4, 7.9, 7.14, 10 | L'application n'octroie jamais de récompense réelle et n'en suggère aucune. La description du palier est saisie par le parent, dans un champ vide par défaut, et **reste côté parent** : aucun texte libre parent n'est rendu sur un écran enfant. `/enfant/coffre` affiche la progression et `coffre.palier.maison`, affiché et dit à chaque consultation. `reglages.paliers.corps` est affiché en permanence côté parent. Aucune notification de palier à l'enfant. Checklist de 7 items vérifiables |

---

# 13. Constats mineurs non repris

| Constat | Statut | Justification |
| --- | --- | --- |
| 6 | Repris | — |
| 7 | Repris | — |
| 8 | Repris | — |
| 9 | Repris **dans ce livrable**, action restante hors périmètre | La contradiction est notée en 6.1, tranchée en arbitrage A13 et l'item TON-6 est amendé pour qu'un contrôleur ne bute plus dessus. Le fichier n'est **pas** renommé : son nom est fixé par le prompt maître et par `.cursor/agents/contenu-enfant.md`, que ce livrable n'a pas autorité pour modifier. La ligne à ouvrir dans `docs/agents/ESCALADE.md` revient à l'Orchestrateur, avec la question fermée ci-dessous |
| 10 | Repris | — |

**Aucun constat n'est refusé.** Les cinq majeurs et les cinq mineurs sont traités
dans le livrable.

## Demande d'escalade, une seule, pour le constat 9

Question fermée proposée à l'Orchestrateur pour `docs/agents/ESCALADE.md` :

> Le fichier de contenu est nommé `content/gwenn-scripts.json` par le prompt
> maître. « gwenn » est le mot breton pour « blanc » et ne désigne aucun objet du
> produit : la mascotte s'appelle Pilou. Ce nom contredit l'interdit de marque
> « aucune référence à la langue bretonne dans le nom, l'univers, les visuels,
> les sons ou les textes de marque ». **Acceptes-tu de renommer ce fichier en
> `content/pilou-scripts.json`, ce qui impose de corriger le prompt maître et
> `.cursor/agents/contenu-enfant.md` — oui ou non ?**

Conséquence d'un « non » : le nom est conservé, l'exception est assumée et reste
documentée en A13 et dans l'item TON-6. Aucun autre point du livrable n'en dépend,
et `contenu-enfant` peut produire son livrable sans attendre la réponse.

**Aucune autre escalade n'est demandée.** En particulier, le constat 5 a été
corrigé plutôt que maintenu : PRD-06 est désormais couverte telle qu'écrite, sans
dérogation à demander à l'humain.

---

**Fin du livrable P1 `produit-marketing`.**

Suite attendue : `contenu-enfant` (P1bis) produit les 20 variantes minimum par
situation à partir des clés et des textes canoniques de la section 7, puis
`controle-produit` rend son verdict.
