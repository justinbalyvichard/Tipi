/**
 * SEC-04 — où la coupure est faite, et **la propriété qui la prouve**.
 *
 * ---------------------------------------------------------------------------
 * CE QUE SEC-04 DEMANDE
 * ---------------------------------------------------------------------------
 * « Le payload envoyé à DeepSeek ne contient jamais le prénom de l'enfant, ni
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
 * Ce type ne voyage **pas** dans `src/lib/ai/**` : il est construit par
 * l'appelant, qui lit la base, et il ne sert qu'aux fonctions (B) ci-dessous.
 * Aucune méthode d'`AiProvider` ne l'accepte — barrière 1 de P2 §6, intacte.
 */
export interface IdentifiantsInterdits {
  readonly valeurs: readonly string[];
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

/** Un jeton purement numérique plus long que cela est refusé : c'est un blob. */
const LONGUEUR_MAX_JETON_NUMERIQUE = 10;

/** Suites de lettres ou de chiffres examinées dans le résidu. */
const MOTIF_JETON = /[\p{L}\p{N}]{3,}/gu;
/** Même découpage, sans borne basse, pour le vocabulaire déclaré. */
const MOTIF_JETON_LARGE = /[\p{L}\p{N}]+/gu;

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
  for (const interdit of retenus(interdits)) {
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
  public static sceller(prompt: PromptVersionne, texte: string): PayloadIa {
    if (prompt.texte.trim() === "") {
      throw new AppError("TIPI_PAYLOAD_NON_ANONYME", "prompt vide : rien à sceller.");
    }
    if (texte.trim() === "") {
      throw new AppError("TIPI_PAYLOAD_NON_ANONYME", "texte vide : rien à sceller.");
    }
    return new PayloadIa(prompt, texte);
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
    for (const jeton of replier(mot).matchAll(MOTIF_JETON_LARGE)) {
      autorises.add(jeton[0]);
    }
  }

  const defauts: DefautDerivabilite[] = [];
  // Le tiret bas ne fait pas partie d'un jeton : c'est un séparateur de
  // protocole (`response_format`, `json_object`), et l'y inclure obligerait à
  // déclarer chaque combinaison au lieu de chaque mot. Découper dessus rend le
  // vocabulaire plus petit ET le contrôle plus fin — `child_id` devient
  // « child », qui n'est déclaré nulle part.
  for (const trouve of residu.matchAll(MOTIF_JETON)) {
    const jeton = replier(trouve[0]);
    if (autorises.has(jeton)) continue;
    if (/^\d+$/u.test(jeton)) {
      if (jeton.length <= LONGUEUR_MAX_JETON_NUMERIQUE) continue;
      defauts.push({
        jeton,
        motif: `suite de ${jeton.length} chiffres, au-delà de la borne ${LONGUEUR_MAX_JETON_NUMERIQUE}`,
      });
      continue;
    }
    defauts.push({ jeton, motif: "hors du vocabulaire de protocole déclaré" });
  }
  return defauts;
}

/** Les entrées du vocabulaire, pour qu'un contrôleur les lise sans ouvrir le code. */
export function vocabulaireProtocole(): Readonly<Record<string, string>> {
  return VOCABULAIRE_PROTOCOLE;
}
