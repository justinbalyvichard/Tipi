/**
 * SEC-04 — où la coupure est faite, et **la propriété qui la prouve**.
 *
 * ---------------------------------------------------------------------------
 * CE QUE SEC-04 DEMANDE
 * ---------------------------------------------------------------------------
 * « Le payload envoyé au modèle ne contient jamais le prénom de l'enfant, ni
 * la photo brute, ni aucune donnée identifiante — uniquement le texte de
 * l'exercice. »
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE MODULE NE CONTRÔLE PAS UN EMPLACEMENT
 * ---------------------------------------------------------------------------
 * L'architecture (P2, §6) nomme trois barrières : le type, le constructeur
 * unique de payload, la garde d'exécution. Les deux premières sont des
 * propriétés d'emplacement — *c'est ici que le corps se fabrique*. Le projet a
 * appris en G4.V1 qu'un contrôle d'emplacement se contourne : `controle-code` a
 * écrit le même défaut trente lignes plus bas et l'instrument est resté vert.
 *
 * On cherche donc la **propriété**, et elle se décompose en trois parties
 * indépendantes dont la conjonction est exactement SEC-04 :
 *
 *   (A) **Dérivabilité du corps émis.** Tout octet du corps envoyé au
 *       fournisseur appartient soit au prompt versionné, soit au texte de
 *       l'exercice, soit à un vocabulaire de protocole **déclaré et clos**.
 *       C'est `assertCorpsDerivable()`, ci-dessous. Une donnée identifiante
 *       glissée dans n'importe quel champ — connu ou inventé — laisse un résidu
 *       et l'appel n'est pas émis. Cette partie ne suppose **aucune** connaissance
 *       du prénom : elle tient même si l'on ignore qui est l'enfant.
 *
 *   (B) **Anonymat du texte.** Le texte qui entre ici ne contient aucun
 *       identifiant du foyer. Cette partie-là exige de connaître le prénom, et
 *       elle est donc exercée par l'appelant, qui seul le connaît :
 *       `caviarder()` puis `assertTexteAnonyme()`, appelés depuis
 *       `src/lib/devoirs/analyse.ts`. Elle n'est pas décorative : une photo de
 *       cahier porte très souvent le prénom écrit en haut de la page, et l'OCR
 *       le lit.
 *
 *   (C) **Inaccessibilité de la source.** `src/lib/ai/**` n'a, dans toute sa
 *       fermeture transitive d'imports, aucun chemin vers la base, vers le
 *       Storage ni vers l'OCR : il ne peut pas aller chercher lui-même un
 *       prénom, un identifiant ou une photo. C'est un invariant de graphe,
 *       vérifié par `scripts/verifier-confinement.ts` (C2).
 *
 * (A) ∧ (B) ∧ (C) ⟹ SEC-04. Aucune des trois n'est une convention : la
 * première et la troisième sont mécaniques, la deuxième est une assertion
 * exécutée avant chaque appel.
 *
 * ---------------------------------------------------------------------------
 * L'INTERDIT DE TEC-05, RENDU IMPOSSIBLE PAR LE TYPE
 * ---------------------------------------------------------------------------
 * `PayloadIa` ne se construit qu'à partir d'un `PromptVersionne` et d'une
 * `string`. Aucune signature de ce module n'accepte un `Buffer`, un
 * `Uint8Array`, un `Blob` ni une URL de photo. Envoyer l'image au modèle de
 * langage n'est pas « interdit par convention » : c'est une erreur de
 * compilation.
 */
import { AppError } from "@/lib/errors/app-error";
import type { PromptVersionne } from "@/lib/ai/prompts/types";

/**
 * Un message du corps émis. Deux rôles, pas plus : le prompt et le texte.
 * Aucun troisième rôle n'existe, donc aucun emplacement libre.
 */
export interface MessageIa {
  readonly role: "system" | "user";
  readonly content: string;
}

/** Le corps réellement émis, et ce que `calibration_log.payload_ia` stocke. */
export type CorpsIa = Readonly<Record<string, unknown>>;

/**
 * Identifiants du foyer qui ne doivent jamais franchir la frontière.
 *
 * ---------------------------------------------------------------------------
 * SCELLÉ AU TOUR 3 — [MAJEUR] M5, et c'est la troisième leçon de cette verticale
 * ---------------------------------------------------------------------------
 * Au tour 2, c'était une **interface** : un objet littéral que n'importe quel
 * appelant composait en trois signes. `controle-code` a écrit `{ valeurs: [] }`
 * à un seul site d'appel — **un argument remplacé** — et a obtenu : `tsc` vert,
 * lint vert, 135 tests verts, six contrôles verts, et « Devoirs de Evan » sur
 * le réseau dans deux corps sur trois.
 *
 * Le caviardage n'avait pas été contourné : il avait été **rendu neutre**. Il a
 * tourné, il n'avait simplement rien à retirer.
 *
 * Les trois leçons, dans l'ordre où le projet les a payées :
 *   1. (V1) contrôler une **propriété**, pas un emplacement ;
 *   2. (tour 1) une propriété doit être **quantifiée sur tous ses sites** ;
 *   3. (tour 2) **un type garde la forme de son argument, jamais le contenu de
 *      la configuration qui l'alimente.** Une garantie qui dépend d'une donnée
 *      doit sceller cette donnée aussi.
 *
 * D'où : champ privé, constructeur privé, une seule fabrique, et **refus d'une
 * liste vide**. Une liste d'interdits vide n'est pas une configuration valide,
 * c'est un caviardage débranché — le même raisonnement que le refus du texte
 * vide par `PayloadIa.sceller`.
 *
 * Ce que le type prouve : aucun objet littéral n'est assignable, donc l'argument
 * est aussi quantifié que le site d'appel. Ce qu'il ne prouve pas : que les
 * valeurs sont bien **celles du foyer** — `src/lib/ai/**` n'a aucun accès à la
 * base (C2) et ne peut pas le vérifier. C'est le contrôle C7 de
 * `scripts/verifier-confinement.ts` qui épingle la fabrique à
 * `src/lib/enfant/courant.ts`, le seul module qui lise la base.
 */
export class IdentifiantsInterdits {
  private readonly sceau: true = true;

  /** Les valeurs à retirer. Non vide, chacune non blanche, gelée. */
  public readonly valeurs: readonly string[];

  private constructor(valeurs: readonly string[]) {
    this.valeurs = Object.freeze([...valeurs]);
  }

  /**
   * La seule fabrique. Refuse une liste vide ou entièrement blanche.
   *
   * Un foyer a toujours au moins un prénom : une liste vide ne vient jamais de
   * la base, elle vient d'un appelant qui n'avait pas le foyer sous la main et
   * que le compilateur aurait encouragé à passer `{ valeurs: [] }`.
   */
  public static sceller(valeurs: readonly string[]): IdentifiantsInterdits {
    // `replier` et non `trim` — [MINEUR] N9 du tour 3. `controle-code` a scellé
    // `["\u0301"]`, un accent combinant seul : ni vide, ni blanc, et pourtant
    // inopérant, parce que tous les consommateurs (`retenus`, `caviarder`,
    // `assertAucunIdentifiant`) mesurent la vacuité avec `replier`. Le refus
    // tombait alors trois couches plus bas, au dernier instant avant
    // l'émission, avec un message qui parlait d'assertion vide là où le défaut
    // était une liste mal formée. La fabrique mesure maintenant le vide comme
    // ses consommateurs le mesurent.
    const utiles = valeurs.map((v) => v.trim()).filter((v) => replier(v) !== "");
    if (utiles.length === 0) {
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        "liste d'identifiants interdits vide : un caviardage sans rien à retirer n'est pas un caviardage (SEC-04, M5).",
      );
    }
    return new IdentifiantsInterdits(utiles);
  }

  /** Vrai si le sceau tient. Sert au test de non-régression. */
  public estScelle(): boolean {
    return this.sceau;
  }
}

/**
 * Remplacement posé à la place d'un identifiant trouvé dans un texte de devoir.
 * Volontairement muet : il ne dit pas au modèle ce qui a été retiré.
 */
export const REMPLACEMENT_IDENTIFIANT = "[…]";

/**
 * Au-dessous de cette longueur, un identifiant n'est cherché **qu'en mot
 * entier**.
 *
 * Deux signes ne se caviardent pas par sous-chaîne : retirer « Li » crèverait
 * « lire », « police » et « lit », et un texte de devoir ainsi haché serait
 * illisible pour le modèle comme pour le parent. Mais l'ignorer serait pire :
 * ce serait un caviardage silencieusement inopérant, c'est-à-dire l'instrument
 * qui affiche le défaut sans le voir.
 *
 * La sortie n'est donc ni « saboter le texte » ni « laisser passer » : c'est
 * **changer de mode de recherche**. Court ⇒ mot entier, entouré de frontières
 * de mot. Long ⇒ sous-chaîne, pour attraper « Evan: », « EVAN » et « Évan ».
 *
 * Conséquence, déclarée : un identifiant d'un ou deux signes collé à un autre
 * mot sans frontière — « chezLi » — n'est pas caviardé. Aucun foyer réel n'est
 * dans ce cas, et le produit ne le fabrique jamais : le texte vient d'un OCR de
 * cahier, pas d'un identifiant concaténé.
 */
export const LONGUEUR_MOT_ENTIER = 3;

/**
 * Motifs structurels refusés quel que soit le foyer : ils signalent qu'une
 * image ou un binaire a été glissé dans un champ de texte (TEC-05).
 */
const MOTIFS_BINAIRES: readonly { readonly nom: string; readonly motif: RegExp }[] =
  Object.freeze([
    { nom: "data:image", motif: /data:image/iu },
    { nom: "base64", motif: /base64/iu },
    {
      nom: "suite binaire",
      // 512 signes sans espace ni ponctuation : aucun devoir de CE1 n'en
      // produit, une image encodée si.
      motif: /[A-Za-z0-9+/=]{512,}/u,
    },
  ]);

// GARDE DE CHARGEMENT — [MAJEUR] M5, appliqué au-delà de son site.
// Une liste de motifs vidée ferait passer `assertAucunIdentifiant` sur tout,
// en silence et sans qu'aucun test ne rougisse : c'est exactement la faute de
// M5, une configuration rendue neutre. Le module refuse alors de se charger.
if (MOTIFS_BINAIRES.length === 0) {
  throw new Error(
    "SEC-04 : MOTIFS_BINAIRES est vide. Une liste de motifs vide ne refuse rien (src/lib/ai/anonymisation.ts).",
  );
}

/**
 * Vocabulaire de protocole autorisé dans le résidu de (A).
 *
 * **Liste close.** Chaque entrée porte la phrase qui justifie sa présence
 * (ARB-18 mesure 2, appliquée ici parce que c'est exactement le même risque :
 * une liste de noms s'allonge sans réfléchir, une liste de justifications
 * s'allonge en mentant). Toute modification est `[MAJEUR]` sans démonstration
 * écrite : élargir ce vocabulaire, c'est autoriser un mot de plus à sortir.
 */
const VOCABULAIRE_PROTOCOLE: Readonly<Record<string, string>> = Object.freeze({
  // --- CORRIGÉ AU TOUR 2 — [MAJEUR] M3 ---------------------------------------
  // Le tour 1 exemptait EN SILENCE deux classes entières de jetons : ceux de
  // moins de trois signes, et toute suite purement numérique jusqu'à dix
  // chiffres. `controle-code` a fait passer par ces deux trous une date de
  // naissance (`{"dn":"29/11/2019"}`), un identifiant de dix chiffres
  // (`{"user_id":4815162342}`) et un prénom de deux lettres (`{"user":"Li"}`).
  //
  // Le propos de §3 — « tout octet appartient au prompt, au texte, ou à un
  // vocabulaire déclaré et clos » — était donc littéralement faux, et les deux
  // exemptions ne figuraient pas dans cette table, qui existe pour que rien ne
  // se taise sans justification écrite (ARB-18 mesure 2).
  //
  // Les deux exemptions sont SUPPRIMÉES, pas déclarées : déclarer un trou le
  // rend visible, le supprimer le referme. Tout jeton d'au moins UN signe est
  // désormais examiné, chiffres compris. Les seuls nombres qui sortent sont
  // ceux qui figurent ci-dessous ou que le transport déclare dans son
  // `vocabulaire` — donc des valeurs de configuration du serveur, jamais des
  // données venues d'une requête.
  "0": "Valeur du champ `temperature` : zéro, pour que la même photo donne la même structuration (TEC-16 le suppose). Un chiffre seul ne peut porter aucune donnée du foyer, et il est le SEUL numéral non déclaré par un transport.",
  messages: "Nom du champ qui porte la conversation, protocole compatible OpenAI.",
  role: "Nom du champ qui distingue le prompt du texte. Deux valeurs seulement.",
  content: "Nom du champ qui porte le texte d'un message.",
  system: "Rôle du prompt versionné. Constante du produit, identique pour tous.",
  user: "Rôle du texte de l'exercice. Désigne un rôle de protocole, jamais une personne.",
  model: "Nom du champ qui désigne le modèle appelé. Sa valeur vient de la configuration.",
  response: "Première moitié de `response_format`, champ qui exige une sortie JSON.",
  format: "Seconde moitié de `response_format`, le champ qui impose la forme de la réponse.",
  type: "Nom du champ qui précise la forme de sortie exigée.",
  json: "Valeur de sortie exigée : du JSON, ce que TEC-05 demande de valider par Zod.",
  object: "Seconde moitié de `json_object`, la forme de sortie exigée.",
  temperature: "Nom du champ de température. Sa valeur est numérique.",
  stream: "Nom du champ de diffusion continue. Sa valeur est booléenne.",
  false: "Valeur booléenne sérialisée. Ne peut porter aucune donnée du foyer.",
  true: "Valeur booléenne sérialisée. Ne peut porter aucune donnée du foyer.",
  null: "Absence de valeur sérialisée. Ne peut porter aucune donnée du foyer.",
});

/**
 * Forme admise pour une valeur de configuration déclarée par un transport :
 * un nom de modèle, pas une phrase. Tout ce qui n'y ressemble pas est ignoré
 * plutôt qu'ajouté au vocabulaire (tour 3, même famille que M5).
 */
const FORME_VALEUR_PROTOCOLE = /^[A-Za-z0-9._:-]{1,64}$/u;

/**
 * Suites de lettres ou de chiffres examinées dans le résidu.
 *
 * **Plus aucune borne basse** ([MAJEUR] M3) : `{1,}`, et non `{3,}`. « id »,
 * « dn » et « E7 » sont des jetons comme les autres.
 */
const MOTIF_JETON = /[\p{L}\p{N}]+/gu;

// ---------------------------------------------------------------------------
// Repliement : comparer sans tenir compte de la casse ni des accents, tout en
// sachant revenir aux positions du texte d'origine.
// ---------------------------------------------------------------------------

interface TextePlie {
  /** Minuscules, sans diacritiques. */
  readonly plat: string;
  /** `index[i]` = décalage, dans le texte d'origine, du signe qui a produit `plat[i]`. */
  readonly index: readonly number[];
  readonly longueurOrigine: number;
}

function plier(texte: string): TextePlie {
  let plat = "";
  const index: number[] = [];
  let decalage = 0;
  for (const signe of texte) {
    const replie = signe.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    for (const c of replie) {
      plat += c;
      index.push(decalage);
    }
    decalage += signe.length;
  }
  return { plat, index, longueurOrigine: texte.length };
}

function replier(texte: string): string {
  return plier(texte).plat;
}

/**
 * Les identifiants pris en compte : tous, sauf les vides.
 *
 * **Aucun n'est écarté pour sa longueur** — c'est le mode de recherche qui
 * change, jamais la couverture. Voir `LONGUEUR_MOT_ENTIER`.
 */
function retenus(interdits: IdentifiantsInterdits): readonly string[] {
  return interdits.valeurs.map((v) => v.trim()).filter((v) => replier(v) !== "");
}

/** Vrai si cet identifiant se cherche en mot entier plutôt qu'en sous-chaîne. */
function chercheEnMotEntier(identifiant: string): boolean {
  return replier(identifiant).length < LONGUEUR_MOT_ENTIER;
}

/** `true` si `plat[debut..fin[` est bordé par autre chose qu'une lettre ou un chiffre. */
function borneDeMot(plat: string, debut: number, fin: number): boolean {
  const avant = debut === 0 ? "" : (plat[debut - 1] ?? "");
  const apres = fin >= plat.length ? "" : (plat[fin] ?? "");
  const estLettre = (c: string): boolean => c !== "" && /[\p{L}\p{N}]/u.test(c);
  return !estLettre(avant) && !estLettre(apres);
}

// ---------------------------------------------------------------------------
// (B) — anonymat du texte : caviardage puis assertion
// ---------------------------------------------------------------------------

/**
 * Retire du texte toute occurrence des identifiants du foyer, **sans tenir
 * compte de la casse ni des accents**.
 *
 * Pourquoi cette fonction existe alors que le texte vient d'un devoir : une
 * photo de cahier porte presque toujours le prénom écrit en haut de la page, et
 * l'OCR le lit. Sans caviardage, SEC-04 serait violée par le chemin le plus
 * ordinaire du produit — pas par une faute de code.
 */
export function caviarder(texte: string, interdits: IdentifiantsInterdits): string {
  let resultat = texte;
  for (const interdit of retenus(interdits)) {
    resultat = retirer(resultat, interdit);
  }
  return resultat;
}

/** Positions repliées de `cible` dans `plat`, selon le mode de recherche. */
function occurrences(plat: string, cible: string, motEntier: boolean): readonly number[] {
  const trouvees: number[] = [];
  let depart = plat.indexOf(cible);
  while (depart !== -1) {
    const fin = depart + cible.length;
    if (!motEntier || borneDeMot(plat, depart, fin)) trouvees.push(depart);
    depart = plat.indexOf(cible, depart + 1);
  }
  return trouvees;
}

function retirer(texte: string, aiguille: string): string {
  const foin = plier(texte);
  const cible = replier(aiguille);
  if (cible === "") return texte;

  const positions = occurrences(foin.plat, cible, chercheEnMotEntier(aiguille));
  if (positions.length === 0) return texte;

  const morceaux: string[] = [];
  let curseurOrigine = 0;
  for (const depart of positions) {
    const debutOrigine = foin.index[depart] ?? 0;
    if (debutOrigine < curseurOrigine) continue; // chevauchement : déjà retiré
    const finPlat = depart + cible.length;
    const finOrigine = foin.index[finPlat] ?? foin.longueurOrigine;
    morceaux.push(texte.slice(curseurOrigine, debutOrigine), REMPLACEMENT_IDENTIFIANT);
    curseurOrigine = finOrigine;
  }
  morceaux.push(texte.slice(curseurOrigine));
  return morceaux.join("");
}

/**
 * Barrière 3 de P2 §6, appliquée au texte : aucun identifiant du foyer, aucun
 * motif binaire. Lève `TIPI_PAYLOAD_NON_ANONYME` et **l'appel n'est pas émis**.
 */
export function assertTexteAnonyme(
  texte: string,
  interdits: IdentifiantsInterdits,
  ou: string,
): void {
  assertAucunIdentifiant(texte, interdits, ou);
}

/**
 * Barrière 3 de P2 §6, appliquée au corps émis **tel qu'il est journalisé**.
 *
 * C'est la forme que `red-team` rejouera sur `calibration_log.payload_ia` : la
 * preuve ne demande pas de faire confiance au code, elle lit ce qui est
 * réellement parti (P2, §6, « Preuve »).
 */
export function assertPayloadAnonyme(
  corps: CorpsIa,
  interdits: IdentifiantsInterdits,
  ou = "corps émis",
): void {
  assertAucunIdentifiant(JSON.stringify(corps), interdits, ou);
}

function assertAucunIdentifiant(
  serialise: string,
  interdits: IdentifiantsInterdits,
  ou: string,
): void {
  const plat = replier(serialise);
  const aChercher = retenus(interdits);
  // TROISIÈME GARDE sur la même donnée ([MAJEUR] M5), au niveau le plus bas.
  // Le sceau l'interdit à la construction, `depuis()` le revérifie, et cette
  // assertion — qui est la dernière avant l'émission — ne se laisse pas
  // exécuter à vide. Une assertion qui n'a rien à chercher réussit toujours :
  // c'est la définition d'un garde-fou désarmé.
  if (aChercher.length === 0) {
    throw new AppError(
      "TIPI_PAYLOAD_NON_ANONYME",
      `${ou} : aucun identifiant à chercher, l'assertion serait vide (SEC-04, M5).`,
    );
  }
  for (const interdit of aChercher) {
    // Même mode de recherche que le caviardage, sans quoi l'assertion serait
    // plus stricte que le nettoyage et rejetterait un texte pourtant propre —
    // ou l'inverse, ce qui serait pire.
    if (occurrences(plat, replier(interdit), chercheEnMotEntier(interdit)).length > 0) {
      // Le détail ne cite JAMAIS la valeur trouvée : un journal serveur ne doit
      // pas devenir l'endroit où le prénom fuit (SEC-01, SEC-08).
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        `${ou} : un identifiant du foyer (longueur ${interdit.length}) y figure.`,
      );
    }
  }
  for (const { nom, motif } of MOTIFS_BINAIRES) {
    if (motif.test(serialise)) {
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        `${ou} : motif binaire « ${nom} » détecté. TEC-05 interdit d'envoyer l'image au modèle de langage.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// (B) QUANTIFIÉE — le texte anonymisé est un TYPE, pas une convention d'appel
// ---------------------------------------------------------------------------

/**
 * Un texte **qui a traversé (B)**.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE TYPE EXISTE — [BLOQUANT] B1 DU TOUR 1
 * ---------------------------------------------------------------------------
 * Au tour 1, (B) était **annoncée** comme « une assertion exécutée avant chaque
 * appel » et **exercée à un site d'appel sur trois** : `structurerDevoir` la
 * recevait caviardée, `genererIndices` et `genererQuestions` non. `controle-code`
 * a monté un vrai point d'entrée HTTP, déclenché la voie de secours de PRD-16, et
 * **le prénom de l'enfant est parti en clair** dans le corps du prompt 2.
 *
 * La faute n'était pas un oubli : c'était la même faute que V1 avait payée
 * quatre tours durant, d'un cran plus haut. V1 avait appris à **contrôler une
 * propriété plutôt qu'un emplacement** ; la leçon suivante est qu'une propriété
 * doit être **quantifiée sur tous ses sites**, et que rien d'autre qu'un type ne
 * quantifie pour de bon. Un `caviarder()` recopié aux deux sites manquants
 * aurait refermé le trou d'aujourd'hui et laissé le quatrième site de demain
 * l'ouvrir à nouveau.
 *
 * ---------------------------------------------------------------------------
 * CE QUE LE TYPE GARANTIT, ET COMMENT
 * ---------------------------------------------------------------------------
 * Le champ privé `sceau` rend le type **nominal** : aucune `string`, aucun objet
 * littéral ne lui est assignable. Le constructeur est privé. La seule fabrique
 * est `TexteAnonymise.depuis()`, qui **caviarde puis assère**. Et
 * `executerPrompt()` — le passage obligé unique vers le réseau — n'accepte que
 * ce type.
 *
 * Conséquence, et c'est la quantification demandée : **tout corps émis, par
 * n'importe quel site d'appel présent ou futur, porte un texte qui a traversé
 * (B).** Ajouter une quatrième méthode à `AiProvider` dans six mois ne rouvre
 * rien — le compilateur refuse la `string` brute.
 *
 * ---------------------------------------------------------------------------
 * ET LA BARRIÈRE 1 RESTE INTACTE
 * ---------------------------------------------------------------------------
 * Les identifiants du foyer n'entrent pas dans `src/lib/ai/**` par une méthode
 * de fournisseur : ils entrent par cette **fabrique**, appelée par
 * `src/lib/devoirs/analyse.ts`, qui seul les connaît. Aucune signature
 * d'`AiProvider` ni d'`AiTransport` n'accepte un prénom — elles n'acceptent plus
 * même une `string`.
 */
export class TexteAnonymise {
  private readonly sceau: true = true;

  /** Le texte caviardé. C'est lui, et lui seul, qui part. */
  public readonly valeur: string;
  /** D'où il vient, pour les messages d'erreur. Jamais une donnée du foyer. */
  public readonly origine: string;

  private constructor(valeur: string, origine: string) {
    this.valeur = valeur;
    this.origine = origine;
  }

  /**
   * **La seule porte d'entrée.** Caviarde, puis assère, puis scelle.
   *
   * L'assertion après le caviardage n'est pas redondante : elle attrape le cas
   * où le caviardage n'aurait pas tout retiré — un identifiant coupé par une
   * normalisation Unicode, par exemple — et fait échouer l'appel plutôt que de
   * l'émettre. Ceinture et bretelles, sur la seule exigence du référentiel qui
   * porte sur des données de mineur.
   */
  public static depuis(
    texte: string,
    interdits: IdentifiantsInterdits,
    origine: string,
  ): TexteAnonymise {
    // [MAJEUR] M5, point subsidiaire. Le sceau d'`IdentifiantsInterdits` rend
    // déjà ce cas inatteignable — mais une garantie de sécurité qui repose sur
    // « un autre module l'a déjà vérifié » est celle qui tombe le jour où ce
    // module change. La fabrique vérifie donc ce dont elle dépend.
    if (interdits.valeurs.length === 0) {
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        `${origine} : liste d'identifiants interdits vide, le caviardage n'aurait rien à retirer (SEC-04, M5).`,
      );
    }
    const propre = caviarder(texte, interdits);
    assertTexteAnonyme(propre, interdits, origine);
    return new TexteAnonymise(propre, origine);
  }

  /** Vrai si le sceau tient. Sert au test de non-régression. */
  public estAnonymise(): boolean {
    return this.sceau;
  }
}

// ---------------------------------------------------------------------------
// Le payload scellé — construction unique, type nominal
// ---------------------------------------------------------------------------

/**
 * Le corps d'une requête d'IA, **scellé**.
 *
 * Le champ privé `sceau` rend ce type **nominal** : aucun objet littéral ne lui
 * est assignable, même s'il en a la forme. On ne peut donc pas fabriquer un
 * payload ailleurs, puis le faire passer pour scellé — le compilateur refuse.
 * C'est la barrière 2 de P2 §6, rendue mécanique plutôt que conventionnelle.
 */
export class PayloadIa {
  private readonly sceau: true = true;

  /** Le prompt versionné, constante du produit. */
  public readonly systeme: string;
  /** Le texte de l'exercice, déjà caviardé par l'appelant. */
  public readonly utilisateur: string;
  public readonly promptId: PromptVersionne["id"];
  public readonly promptVersion: string;

  private constructor(prompt: PromptVersionne, texte: string) {
    this.systeme = prompt.texte;
    this.utilisateur = texte;
    this.promptId = prompt.id;
    this.promptVersion = prompt.version;
  }

  /**
   * Le seul constructeur de payload du produit.
   *
   * Refuse un texte vide : au-delà du bon sens, un texte vide casserait
   * l'invariant de dérivabilité — `"".split("")` découpe chaque signe — et un
   * invariant qui se casse sur une valeur limite est un invariant qui ment.
   */
  public static sceller(prompt: PromptVersionne, texte: TexteAnonymise): PayloadIa {
    if (prompt.texte.trim() === "") {
      throw new AppError("TIPI_PAYLOAD_NON_ANONYME", "prompt vide : rien à sceller.");
    }
    if (texte.valeur.trim() === "") {
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        `texte vide : rien à sceller (${texte.origine}).`,
      );
    }
    return new PayloadIa(prompt, texte.valeur);
  }

  /** Les deux messages, dans l'ordre. Aucun troisième rôle n'existe. */
  public messages(): readonly MessageIa[] {
    return Object.freeze([
      Object.freeze<MessageIa>({ role: "system", content: this.systeme }),
      Object.freeze<MessageIa>({ role: "user", content: this.utilisateur }),
    ]);
  }

  /** Vrai si `this.sceau` tient encore : sert au test de non-régression. */
  public estScelle(): boolean {
    return this.sceau;
  }
}

// ---------------------------------------------------------------------------
// (A) — dérivabilité du corps émis
// ---------------------------------------------------------------------------

export interface DefautDerivabilite {
  readonly jeton: string;
  readonly motif: string;
}

/**
 * **L'invariant de SEC-04.**
 *
 * Tout octet du corps émis appartient à l'un de trois ensembles :
 *   1. le prompt versionné ;
 *   2. le texte de l'exercice ;
 *   3. le vocabulaire de protocole déclaré, plus les nombres et la ponctuation
 *      JSON.
 *
 * Mise en œuvre : on sérialise, on retire les deux chaînes connues, puis on
 * examine **chaque suite de lettres ou de chiffres de trois signes ou plus** du
 * résidu. Une seule qui ne soit pas déclarée, et l'appel n'est pas émis.
 *
 * Ce que cela attrape et qu'une liste noire ne peut pas attraper : un champ
 * inventé (`"enfant":"Evan"`), un identifiant technique (`child_id`), une URL
 * de photo, un jeton d'authentification recopié par erreur — **tout ce qu'on
 * n'a pas pensé à interdire**. Une liste noire ne connaît que ce qu'on lui a
 * appris ; cet invariant ne connaît que ce qu'on lui a **autorisé**.
 *
 * @param vocabulaireSupplementaire valeurs de configuration légitimes, comme le
 *   nom du modèle appelé. Elles viennent de l'environnement du serveur, jamais
 *   d'une requête, et `src/lib/ai/**` n'a aucun accès à la base (invariant C2
 *   de `scripts/verifier-confinement.ts`) : ce paramètre ne peut donc pas
 *   servir à blanchir une donnée du foyer.
 */
export function assertCorpsDerivable(
  corps: CorpsIa,
  payload: PayloadIa,
  vocabulaireSupplementaire: readonly string[] = [],
): void {
  // AJOUTÉ AU TOUR 2 — le contrôle du résidu ne voit PAS ce qui est dans le
  // texte utilisateur, puisqu'il l'a retiré pour l'examiner. Les motifs
  // structurels, eux, doivent porter sur **ce qui part réellement**, texte
  // compris : une image encodée glissée dans un énoncé sortirait sinon sans que
  // (A) la voie. C'est le seul contrôle qui peut s'appliquer au texte sans
  // rejeter chaque mot d'un devoir.
  const serialise = JSON.stringify(corps);
  for (const { nom, motif } of MOTIFS_BINAIRES) {
    if (motif.test(serialise)) {
      throw new AppError(
        "TIPI_PAYLOAD_NON_ANONYME",
        `corps émis : motif binaire « ${nom} » détecté, texte utilisateur compris. TEC-05 interdit d'envoyer l'image au modèle de langage.`,
      );
    }
  }

  const defauts = defautsDeDerivabilite(corps, payload, vocabulaireSupplementaire);
  if (defauts.length > 0) {
    const resume = defauts.map((d) => `« ${d.jeton} » (${d.motif})`).join(" ; ");
    throw new AppError(
      "TIPI_PAYLOAD_NON_ANONYME",
      `corps non dérivable du prompt et du texte : ${resume}. L'appel n'est pas émis (SEC-04).`,
    );
  }
}

/** La mesure elle-même, séparée de la levée, pour être testable dans les deux sens. */
export function defautsDeDerivabilite(
  corps: CorpsIa,
  payload: PayloadIa,
  vocabulaireSupplementaire: readonly string[] = [],
): readonly DefautDerivabilite[] {
  const brut = JSON.stringify(corps);
  const residu = brut
    .split(JSON.stringify(payload.systeme))
    .join(" ")
    .split(JSON.stringify(payload.utilisateur))
    .join(" ");

  const autorises = new Set<string>(Object.keys(VOCABULAIRE_PROTOCOLE));
  for (const mot of vocabulaireSupplementaire) {
    // AJOUTÉ AU TOUR 3, même famille que M5 : `vocabulaire` est une
    // configuration, et une configuration trop large neutralise (A) aussi
    // sûrement qu'une liste d'interdits vide la neutralisait. Une valeur de
    // protocole est un nom de modèle : lettres, chiffres, `.`, `_`, `:`, `-`,
    // 64 signes au plus. Tout le reste est ignoré — jamais blanchi.
    if (!FORME_VALEUR_PROTOCOLE.test(mot)) continue;
    for (const jeton of replier(mot).matchAll(MOTIF_JETON)) {
      autorises.add(jeton[0]);
    }
  }

  const defauts: DefautDerivabilite[] = [];
  // Le tiret bas ne fait pas partie d'un jeton : c'est un séparateur de
  // protocole (`response_format`, `json_object`), et l'y inclure obligerait à
  // déclarer chaque combinaison au lieu de chaque mot. Découper dessus rend le
  // vocabulaire plus petit ET le contrôle plus fin — `child_id` devient
  // « child », qui n'est déclaré nulle part.
  //
  // CORRIGÉ AU TOUR 2 — [MAJEUR] M3 : plus aucune exemption. Ni longueur
  // minimale, ni laissez-passer numérique. Un jeton sort s'il est déclaré, et
  // pour aucune autre raison.
  for (const trouve of residu.matchAll(MOTIF_JETON)) {
    const jeton = replier(trouve[0]);
    if (autorises.has(jeton)) continue;
    defauts.push({
      jeton,
      motif: /^\d+$/u.test(jeton)
        ? "numéral hors du vocabulaire déclaré — un nombre peut être un identifiant ou une date"
        : "hors du vocabulaire de protocole déclaré",
    });
  }
  return defauts;
}

/** Les entrées du vocabulaire, pour qu'un contrôleur les lise sans ouvrir le code. */
export function vocabulaireProtocole(): Readonly<Record<string, string>> {
  return VOCABULAIRE_PROTOCOLE;
}
