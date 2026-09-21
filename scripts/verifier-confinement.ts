/**
 * Instrument de contrôle de la verticale V2 — « Capture & analyse IA ».
 *
 * `pnpm verifier:confinement`
 *
 * ------------------------------------------------------------------------
 * CE QU'IL EST, ET CE QU'IL N'EST PAS
 * ------------------------------------------------------------------------
 * L'architecture le nomme comme un livrable de V2 (P2, §2 et §14) : « rejoue
 * les règles grep de 5.1 et 7.2 ». Il fait cela — et davantage, parce qu'une
 * règle grep contrôle **un nom dans un emplacement**, et que ce projet a payé
 * cinq fois le prix d'un instrument qui contrôle un emplacement plutôt qu'une
 * propriété (G4.V1, tours 1 à 4).
 *
 * Les cinq contrôles ci-dessous sont donc, autant que possible, des
 * **propriétés** :
 *
 *   C1  le nom du fournisseur n'apparaît nulle part hors des trois fichiers
 *       irréductibles. C'est la règle grep de P2 §5.1, rejouée telle quelle —
 *       et l'architecture dit elle-même ce qu'elle prouve et ne prouve pas.
 *
 *   C2  **SEC-04 partie (C)** : la fermeture transitive des imports de
 *       `src/lib/ai/**` est CONTENUE dans un ensemble déclaré de modules
 *       incapables d'atteindre la base, le Storage, l'OCR ou les fichiers.
 *       Ce n'est pas une liste d'interdits — c'est une liste d'**autorisés**,
 *       et c'est ce qui la rend opposable à ce qu'on n'a pas prévu.
 *
 *   C3  **TEC-05** : aucun type binaire n'apparaît dans `src/lib/ai/**`.
 *       Envoyer l'image au modèle de langage demanderait d'en faire entrer un.
 *
 *   C4  **TEC-16** : aucun seuil numérique n'est comparé dans `src/lib/ocr/**`.
 *       Règle opposable de P2 §13.
 *
 *   C5  **TEC-06** : aucun module de V2 n'écrit dans `session` ni dans
 *       `gem_ledger`. Aucune session ne peut donc démarrer sans passer par la
 *       validation du parent, parce qu'aucun chemin de V2 ne sait en créer une.
 *
 * Chaque contrôle imprime **ce qu'il a réellement examiné**, et un contrôle qui
 * n'a rien pu examiner sort en ÉCHEC, jamais en vert : un instrument qui
 * affiche le défaut sans le voir est pire qu'un instrument muet
 * (`40-protocole-agents.mdc`, règle 5).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type Etat = "OK" | "ÉCHEC";

interface Resultat {
  readonly cle: string;
  readonly nom: string;
  readonly etat: Etat;
  readonly examine: string;
  readonly defauts: readonly string[];
}

const resultats: Resultat[] = [];

function enregistrer(
  cle: string,
  nom: string,
  examine: string,
  defauts: readonly string[],
  executable = true,
): void {
  resultats.push({
    cle,
    nom,
    etat: !executable || defauts.length > 0 ? "ÉCHEC" : "OK",
    examine,
    defauts,
  });
}

// ---------------------------------------------------------------------------
// Outillage commun
// ---------------------------------------------------------------------------

/** Chemins relatifs à la racine, en séparateurs POSIX, de tous les `.ts`/`.tsx`. */
function fichiersSous(dossierRelatif: string): readonly string[] {
  const racine = join(RACINE, dossierRelatif);
  const trouves: string[] = [];
  const parcourir = (chemin: string): void => {
    for (const entree of readdirSync(chemin)) {
      const complet = join(chemin, entree);
      if (statSync(complet).isDirectory()) {
        parcourir(complet);
        continue;
      }
      if (/\.tsx?$/u.test(entree)) {
        trouves.push(relative(RACINE, complet).split(/[\\/]/u).join(posix.sep));
      }
    }
  };
  try {
    parcourir(racine);
  } catch {
    return [];
  }
  return trouves.sort();
}

function lire(cheminRelatif: string): string {
  return readFileSync(join(RACINE, cheminRelatif), "utf8");
}

/**
 * Le code, **commentaires et chaînes retirés**.
 *
 * Indispensable, et pas cosmétique : ces fichiers sont très commentés, et les
 * commentaires citent les noms mêmes que les contrôles cherchent — « le
 * `Buffer` n'entre jamais ici ». Chercher dans le texte brut ferait rougir
 * l'instrument sur la phrase qui explique pourquoi il doit rester vert.
 */
function codeNu(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/(^|[^:\\])\/\/[^\n]*/gu, "$1")
    .replace(/`(?:[^`\\]|\\.)*`/gu, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/gu, '""')
    .replace(/"(?:[^"\\\n]|\\.)*"/gu, '""');
}

/** Les spécificateurs importés par un fichier, statiques et dynamiques. */
function importsDe(source: string): readonly string[] {
  const nu = source
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/(^|[^:\\])\/\/[^\n]*/gu, "$1");
  const trouves: string[] = [];
  for (const m of nu.matchAll(/\bfrom\s+["']([^"']+)["']/gu)) trouves.push(m[1] ?? "");
  for (const m of nu.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu)) {
    trouves.push(m[1] ?? "");
  }
  for (const m of nu.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/gu)) {
    trouves.push(m[1] ?? "");
  }
  return trouves.filter((s) => s !== "");
}

/**
 * Résout un spécificateur en chemin de fichier du dépôt, ou rend `null` si
 * c'est un paquet externe.
 */
function resoudre(depuis: string, specificateur: string): string | null {
  let base: string;
  if (specificateur.startsWith("@/")) base = `src/${specificateur.slice(2)}`;
  else if (specificateur.startsWith("@content/")) base = `content/${specificateur.slice(9)}`;
  else if (specificateur.startsWith(".")) {
    base = posix.normalize(posix.join(posix.dirname(depuis), specificateur));
  } else return null;

  for (const candidat of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    try {
      if (statSync(join(RACINE, candidat)).isFile()) return candidat;
    } catch {
      continue;
    }
  }
  // Un chemin local qui ne résout pas est un défaut à signaler, pas un externe.
  return base;
}

// ---------------------------------------------------------------------------
// C1 — TEC-17 : le nom du fournisseur ne fuit pas hors des trois fichiers
// ---------------------------------------------------------------------------
// Règle exacte de P2 §5.1, corrigée au tour 2 de G2 :
//   grep -rilE 'deepseek' src/ | grep -vE '^src/(lib/ai/providers/|lib/ai/index\.ts|config/env\.ts)'
// Elle doit renvoyer ZÉRO ligne.
//
// Ce qu'elle prouve : qu'aucun fichier hors des trois cités ne nomme le
// fournisseur. Ce qu'elle ne prouve pas : le confinement — c'est l'interface
// `AiProvider`, qui ne mentionne aucun fournisseur, qui le porte. L'architecture
// le dit elle-même, et l'instrument ne prétend pas mieux.

const AUTORISES_A_NOMMER_LE_FOURNISSEUR = /^src\/(lib\/ai\/providers\/|lib\/ai\/index\.ts|config\/env\.ts)/u;

function c1(): void {
  const fichiers = fichiersSous("src");
  if (fichiers.length === 0) {
    enregistrer("C1", "C1 — TEC-17 : le nom du fournisseur reste confiné", "src/ : AUCUN fichier lu", ["src/ introuvable : l'instrument ne mesure rien."], false);
    return;
  }
  const defauts: string[] = [];
  let citants = 0;
  for (const fichier of fichiers) {
    if (!/deepseek/iu.test(lire(fichier))) continue;
    citants += 1;
    if (!AUTORISES_A_NOMMER_LE_FOURNISSEUR.test(fichier)) {
      defauts.push(`${fichier} nomme le fournisseur hors des trois fichiers irréductibles.`);
    }
  }
  enregistrer(
    "C1",
    "C1 — TEC-17 : le nom du fournisseur reste confiné",
    `${fichiers.length} fichiers de src/ lus · ${citants} le nomment · 3 emplacements irréductibles (providers/, ai/index.ts, config/env.ts)`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C2 — SEC-04 partie (C) : `src/lib/ai/**` ne peut atteindre aucune source
// ---------------------------------------------------------------------------
// C'est la partie de SEC-04 qu'aucune assertion d'exécution ne peut porter :
// (A) garantit que le corps émis ne contient rien d'autre que le prompt et le
// texte, (B) que le texte est caviardé — mais ni l'une ni l'autre n'empêche un
// module d'IA d'aller CHERCHER un prénom en base pour l'y remettre.
//
// La propriété qui l'empêche est de nature statique : **la fermeture
// transitive des imports de `src/lib/ai/**` est contenue dans un ensemble
// déclaré**. Et c'est un ensemble d'AUTORISÉS, pas d'interdits : une liste
// d'interdits ne connaît que ce qu'on lui a appris, celle-ci ne laisse passer
// que ce qu'on a écrit.
//
// Chaque entrée porte sa justification (ARB-18 mesure 2). Toute modification
// est `[MAJEUR]` sans démonstration écrite : élargir cette table, c'est donner
// à la frontière d'IA un accès qu'elle n'avait pas.

const FERMETURE_AUTORISEE_AI: Readonly<Record<string, string>> = Object.freeze({
  "src/lib/ai/":
    "Le module lui-même : interface, fabrique, prompts, schémas, scellement, transports. C'est ce dont on calcule la fermeture.",
  "src/lib/errors/":
    "Taxonomie d'erreurs et classe AppError. Ne lit aucune donnée, n'ouvre aucune connexion : ce sont des constantes et une classe.",
  "src/lib/runtime/":
    "Garde d'exécution serveur (TEC-13). Quatre lignes qui testent la présence de `window`, sans aucun accès à quoi que ce soit.",
  "src/config/env.ts":
    "Configuration du serveur : nom du modèle, adresse, clé, délai d'abandon. Ne contient aucune donnée du foyer, et ne sait pas lire la base.",
  "zod":
    "Validation de schéma, paquet externe sans accès au système de fichiers ni au réseau. C'est TEC-05 qui l'exige pour la sortie du modèle.",
});

function c2(): void {
  // Les fichiers de test sont hors de la fermeture : ils ne sont pas livrés,
  // ils importent `vitest` et ils ont le droit d'observer. La propriété porte
  // sur ce qui tourne devant l'enfant, pas sur ce qui le vérifie.
  const depart = fichiersSous("src/lib/ai").filter((f) => !f.endsWith(".test.ts"));
  if (depart.length === 0) {
    enregistrer("C2", "C2 — SEC-04 (C) : la frontière d'IA n'atteint aucune source de données", "src/lib/ai : AUCUN fichier lu", ["src/lib/ai introuvable : l'instrument ne mesure rien."], false);
    return;
  }

  const vus = new Set<string>(depart);
  const aVoir = [...depart];
  const externes = new Set<string>();
  const defauts: string[] = [];
  let aretes = 0;

  if (Object.keys(FERMETURE_AUTORISEE_AI).length === 0) {
    // Vidée, la fermeture autorisée refuserait tout : le contrôle deviendrait
    // ininterprétable plutôt que muet. On le dit quand même.
    defauts.push("FERMETURE_AUTORISEE_AI est vide : le contrôle n'a plus de référence.");
  }

  const autorise = (cible: string): boolean =>
    Object.keys(FERMETURE_AUTORISEE_AI).some(
      (prefixe) => cible === prefixe || cible.startsWith(prefixe),
    );

  while (aVoir.length > 0) {
    const fichier = aVoir.pop();
    if (fichier === undefined) break;
    let source: string;
    try {
      source = lire(fichier);
    } catch {
      defauts.push(`${fichier} : fichier illisible, la fermeture est incomplète.`);
      continue;
    }
    for (const specificateur of importsDe(source)) {
      aretes += 1;
      const cible = resoudre(fichier, specificateur);
      if (cible === null) {
        externes.add(specificateur);
        if (!autorise(specificateur)) {
          defauts.push(
            `${fichier} importe le paquet « ${specificateur} », hors de la fermeture autorisée de SEC-04 (C).`,
          );
        }
        continue;
      }
      if (!autorise(cible)) {
        defauts.push(
          `${fichier} importe ${cible}, hors de la fermeture autorisée de SEC-04 (C). La frontière d'IA y gagnerait un chemin vers une source de données.`,
        );
        continue;
      }
      if (!vus.has(cible)) {
        vus.add(cible);
        aVoir.push(cible);
      }
    }
  }

  // Une table de justifications ne vaut que si chacune a été écrite.
  for (const [entree, motif] of Object.entries(FERMETURE_AUTORISEE_AI)) {
    if (motif.trim().length < 40) {
      defauts.push(`${entree} figure dans la fermeture autorisée sans motif écrit (ARB-18 mesure 2).`);
    }
  }

  if (aretes === 0) {
    enregistrer("C2", "C2 — SEC-04 (C) : la frontière d'IA n'atteint aucune source de données", "0 import lu", ["Aucun import trouvé : l'instrument ne mesure rien."], false);
    return;
  }

  enregistrer(
    "C2",
    "C2 — SEC-04 (C) : la frontière d'IA n'atteint aucune source de données",
    `${depart.length} fichiers de départ · ${vus.size} modules dans la fermeture transitive · ${aretes} imports suivis · ${externes.size} paquets externes (${[...externes].sort().join(", ") || "aucun"}) · ${Object.keys(FERMETURE_AUTORISEE_AI).length} entrées autorisées, chacune justifiée`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C3 — TEC-05 : aucun type binaire dans `src/lib/ai/**`
// ---------------------------------------------------------------------------
// « Interdit : envoyer l'image à DeepSeek. Le modèle vision réduit chaque image
// à environ 1024 jetons et n'est pas fiable sur de l'écriture manuscrite
// d'enfant photographiée au smartphone. »
//
// La propriété : la frontière d'IA n'a aucun moyen de REPRÉSENTER une image.
// Pas de `Buffer`, pas de `Uint8Array`, pas de `Blob`, pas de `File`. Faire
// entrer une photo demanderait d'en écrire un — donc un diff visible.
//
// Les commentaires sont retirés avant la recherche : ils citent ces noms-là
// pour expliquer pourquoi ils sont absents.

const TYPES_BINAIRES: readonly string[] = [
  "Buffer",
  "Uint8Array",
  "Uint8ClampedArray",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Blob",
  "File",
  "FileReader",
  "ReadableStream",
  "DataView",
];

function c3(): void {
  const fichiers = fichiersSous("src/lib/ai");
  if (fichiers.length === 0) {
    enregistrer("C3", "C3 — TEC-05 : aucun type binaire ne peut entrer dans la frontière d'IA", "src/lib/ai : AUCUN fichier lu", ["src/lib/ai introuvable : l'instrument ne mesure rien."], false);
    return;
  }
  const defauts: string[] = [];
  // Famille de [MAJEUR] M5 : une liste de recherchés vidée ferait passer le
  // contrôle sur tout, en silence.
  if (TYPES_BINAIRES.length === 0) {
    defauts.push("TYPES_BINAIRES est vide : le contrôle ne cherche plus rien.");
  }
  for (const fichier of fichiers) {
    if (fichier.endsWith(".test.ts")) continue;
    const nu = codeNu(lire(fichier));
    for (const type of TYPES_BINAIRES) {
      if (new RegExp(`\\b${type}\\b`, "u").test(nu)) {
        defauts.push(
          `${fichier} emploie « ${type} » : une image pourrait entrer dans la frontière d'IA (TEC-05).`,
        );
      }
    }
  }
  enregistrer(
    "C3",
    "C3 — TEC-05 : aucun type binaire ne peut entrer dans la frontière d'IA",
    `${fichiers.filter((f) => !f.endsWith(".test.ts")).length} fichiers de src/lib/ai (hors tests) · ${TYPES_BINAIRES.length} types binaires recherchés, commentaires et chaînes retirés`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C4 — TEC-16 : aucun seuil numérique comparé dans `src/lib/ocr/**`
// ---------------------------------------------------------------------------
// Règle opposable de P2 §13 : « aucun littéral numérique de seuil n'apparaît
// dans src/lib/ocr/**, src/lib/lecture/** ni src/lib/maths/** ». Les deux
// derniers dossiers appartiennent à V4 et V5 ; le contrôle les couvrira dès
// qu'ils existeront, sans modification.
//
// Ce qui est cherché est une COMPARAISON à un littéral — `x < 0.7` — et non un
// nombre quelconque : une confiance simulée par le bouchon n'est pas un seuil,
// une borne de boucle non plus. C'est le geste de décider avec un nombre écrit
// sur place qui est interdit.

const DOSSIERS_SANS_SEUIL: readonly string[] = ["src/lib/ocr", "src/lib/lecture", "src/lib/maths"];

function c4(): void {
  const fichiers = DOSSIERS_SANS_SEUIL.flatMap((d) => fichiersSous(d));
  if (fichiers.length === 0) {
    enregistrer("C4", "C4 — TEC-16 : aucun seuil numérique dispersé", "aucun dossier lu", ["Aucun des dossiers surveillés n'existe : l'instrument ne mesure rien."], false);
    return;
  }
  const defauts: string[] = [];
  let lignes = 0;
  for (const fichier of fichiers) {
    if (fichier.endsWith(".test.ts")) continue;
    const nu = codeNu(lire(fichier));
    for (const [rang, ligne] of nu.split("\n").entries()) {
      lignes += 1;
      if (/[<>]=?\s*-?\d/u.test(ligne) || /-?\d(?:\.\d+)?\s*[<>]=?[^=]/u.test(ligne)) {
        defauts.push(
          `${fichier}:${rang + 1} compare à un littéral numérique. Tout seuil passe par SEUILS (TEC-16, P2 §13).`,
        );
      }
    }
  }
  enregistrer(
    "C4",
    "C4 — TEC-16 : aucun seuil numérique dispersé",
    `${fichiers.filter((f) => !f.endsWith(".test.ts")).length} fichiers de ${DOSSIERS_SANS_SEUIL.filter((d) => fichiersSous(d).length > 0).join(", ")} · ${lignes} lignes examinées, commentaires et chaînes retirés`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C5 — TEC-06 : aucun chemin de V2 ne sait démarrer une session
// ---------------------------------------------------------------------------
// « Aucune session ne démarre sans validation explicite du parent sur l'aperçu. »
//
// La façon la plus sûre de tenir cette exigence n'est pas de la vérifier dans
// un écran : c'est de faire en sorte qu'aucun code de la capture ne sache créer
// une session. `POST /api/session` (V3) reste la seule porte vers `/enfant`.
// Le même contrôle couvre le ledger : V2 ne crédite rien (TEC-11, SEC-06).
//
// ---------------------------------------------------------------------------
// RÉÉCRIT AU TOUR 2 — [MAJEUR] M1
// ---------------------------------------------------------------------------
// La version du tour 1 cherchait `prisma.session` ou `tx.session` : un NOM dans
// un EMPLACEMENT, exactement la faute que V1 avait mis quatre tours à corriger.
// `controle-code` a créé une session depuis le pipeline de capture **sans
// jamais écrire ces mots**, par relation imbriquée :
//
//   await prisma.child.update({
//     where: { id: enfant.id },
//     data: { sessions: { create: { date: new Date(), etapesPrevues: [] } } },
//   });
//
// L'instrument est resté vert, `typecheck` aussi, et une session `idle` a bien
// été ouverte en base.
//
// La PROPRIÉTÉ, elle, ne dépend d'aucune forme d'écriture : **aucun identifiant
// du périmètre de V2 ne doit nommer, directement ou par relation, les tables
// interdites.** Et la liste des noms par lesquels on les atteint n'est pas
// écrite ici : elle est **DÉRIVÉE de `prisma/schema.prisma`** (ARB-18 mesure 1)
// — délégués, champs de relation qui y mènent, clés étrangères, noms de tables.
// Ajouter demain une relation vers `Session` étend le contrôle sans qu'on y
// pense ; la renommer ne le désarme pas.
//
// S'y ajoute une INTERDICTION, au seul endroit où le problème se pose : le SQL
// brut. Aucune lecture d'identifiants ne peut voir ce qu'une chaîne SQL écrit,
// et le pipeline de capture n'en a aucun besoin — il a Prisma. C'est le même
// geste que V1 a posé sur `prisma/seed.ts` ([MINEUR] T4-1).

/**
 * Les modèles dont V2 ne doit toucher à rien, avec la phrase qui les y met.
 * Ce sont des **noms de modèles Prisma** : tout le reste — délégué, relations,
 * clés étrangères, table — en est dérivé.
 */
const MODELES_INTERDITS_A_V2: Readonly<Record<string, string>> = Object.freeze({
  Session:
    "TEC-06 — une session ne se crée qu'après la validation du parent sur l'aperçu, par POST /api/session (V3). Aucun chemin de la capture ne doit pouvoir en ouvrir une, par quelque forme d'écriture que ce soit.",
  GemLedger:
    "TEC-11 et SEC-06 — le crédit de pierres est un effet de transition de session, écrit par src/lib/pierres/service.ts (V6), jamais par la capture.",
});

/**
 * Champ supplémentaire interdit, qui n'est pas un modèle : le solde mis en
 * cache sur `child`. SEC-06 veut qu'il soit recalculé depuis le ledger par la
 * route serveur, et la capture n'a rien à y écrire.
 */
const CHAMPS_INTERDITS_A_V2: Readonly<Record<string, string>> = Object.freeze({
  gemBalance:
    "SEC-06 — le solde est un cache recalculé depuis gem_ledger par la route serveur. La capture ne le lit ni ne l'écrit.",
});

const PERIMETRE_V2: readonly string[] = ["src/lib/devoirs", "src/app/api/devoirs"];

/** Première lettre en minuscule : le nom du délégué Prisma d'un modèle. */
function delegue(modele: string): string {
  return modele.charAt(0).toLowerCase() + modele.slice(1);
}

/**
 * Tous les identifiants par lesquels le code peut atteindre un modèle interdit,
 * **dérivés de `prisma/schema.prisma`** : le délégué, le nom de table `@@map`,
 * et tout champ de relation — de n'importe quel modèle — dont le type est l'un
 * des modèles interdits, plus la clé étrangère qui l'accompagne.
 */
function identifiantsInterdits(): {
  readonly noms: ReadonlySet<string>;
  readonly source: string;
} {
  const schema = lire("prisma/schema.prisma");
  const noms = new Set<string>();
  const interdits = new Set(Object.keys(MODELES_INTERDITS_A_V2));

  for (const modele of interdits) {
    noms.add(delegue(modele));
    noms.add(modele);
  }

  // Parcours ligne à ligne, modèle par modèle : une expression régulière sur le
  // bloc entier s'arrête à la première accolade fermante, et les commentaires
  // de documentation du schéma en contiennent.
  let courant: string | null = null;
  for (const ligne of schema.split("\n")) {
    const nu = ligne.trim();
    const ouverture = /^model\s+(\w+)\s*\{/u.exec(nu);
    if (ouverture?.[1] !== undefined) {
      courant = ouverture[1];
      continue;
    }
    if (courant === null) continue;
    if (nu === "}") {
      courant = null;
      continue;
    }
    if (nu === "" || nu.startsWith("//") || nu.startsWith("///")) continue;

    // Table physique d'un modèle interdit.
    const map = /@@map\("([^"]+)"\)/u.exec(nu);
    if (map?.[1] !== undefined && interdits.has(courant)) {
      noms.add(map[1]);
      continue;
    }

    const champ = /^(\w+)\s+(\w+)(\[\])?/u.exec(nu);
    if (champ?.[1] === undefined || champ[2] === undefined) continue;
    if (!interdits.has(champ[2])) continue;

    // Champ de relation vers un modèle interdit : `sessions Session[]`,
    // `session Session`, quel que soit le modèle porteur.
    noms.add(champ[1]);
    // …et la clé étrangère déclarée avec lui : `@relation(fields: [sessionId])`.
    for (const cle of nu.matchAll(/fields:\s*\[([^\]]+)\]/gu)) {
      for (const morceau of (cle[1] ?? "").split(",")) {
        const propre = morceau.trim();
        if (propre !== "") noms.add(propre);
      }
    }
  }

  return {
    noms,
    source: `${noms.size} identifiants dérivés de prisma/schema.prisma (${[...noms].sort().join(", ")})`,
  };
}

function c5(): void {
  const fichiers = PERIMETRE_V2.flatMap((d) => fichiersSous(d)).filter(
    (f) => !f.endsWith(".test.ts"),
  );
  if (fichiers.length === 0) {
    enregistrer("C5", "C5 — TEC-06 : aucun chemin de V2 ne démarre de session", "aucun fichier lu", ["Le périmètre de V2 est vide : l'instrument ne mesure rien."], false);
    return;
  }

  const { noms, source } = identifiantsInterdits();
  if (noms.size === 0) {
    enregistrer("C5", "C5 — TEC-06 : aucun chemin de V2 ne démarre de session", "AUCUN identifiant dérivé", ["La dérivation depuis prisma/schema.prisma n'a rien produit : l'instrument ne mesure rien."], false);
    return;
  }

  const defauts: string[] = [];
  let identifiantsExamines = 0;

  for (const fichier of fichiers) {
    const nu = codeNu(lire(fichier));

    // Le SQL brut échappe à toute lecture d'identifiants : il est interdit ici.
    const sqlBrut = [...nu.matchAll(/\$executeRaw\w*|\$queryRaw\w*/gu)].map((m) => m[0]);
    if (sqlBrut.length > 0) {
      defauts.push(
        `${fichier} emploie ${[...new Set(sqlBrut)].join(", ")} : aucune lecture d'identifiants ne peut voir ce qu'une chaîne SQL écrit, et la capture n'a aucun besoin de SQL brut (TEC-06).`,
      );
    }

    // Tout identifiant du fichier, y compris les clés d'objet : c'est par une
    // clé d'objet que passe l'écriture imbriquée du contrôleur.
    for (const trouve of nu.matchAll(/[A-Za-z_$][\w$]*/gu)) {
      const identifiant = trouve[0];
      identifiantsExamines += 1;
      if (!noms.has(identifiant)) continue;
      const modele = Object.keys(MODELES_INTERDITS_A_V2).find(
        (m) => identifiant === m || identifiant === delegue(m),
      );
      const motif =
        (modele === undefined ? undefined : MODELES_INTERDITS_A_V2[modele]) ??
        `Identifiant menant à une table interdite à V2, dérivé de prisma/schema.prisma. ${Object.values(MODELES_INTERDITS_A_V2)[0] ?? ""}`;
      defauts.push(`${fichier} nomme « ${identifiant} ». ${motif}`);
    }

    for (const [champ, motif] of Object.entries(CHAMPS_INTERDITS_A_V2)) {
      if (new RegExp(`\\b${champ}\\b`, "u").test(nu)) {
        defauts.push(`${fichier} nomme « ${champ} ». ${motif}`);
      }
    }
  }

  for (const [quoi, motif] of [
    ...Object.entries(MODELES_INTERDITS_A_V2),
    ...Object.entries(CHAMPS_INTERDITS_A_V2),
  ]) {
    if (motif.trim().length < 40) {
      defauts.push(`${quoi} est interdit sans motif écrit (ARB-18 mesure 2).`);
    }
  }

  enregistrer(
    "C5",
    "C5 — TEC-06 : aucun chemin de V2 ne démarre de session",
    `${fichiers.length} fichiers de ${PERIMETRE_V2.join(", ")} · ${identifiantsExamines} identifiants examinés · ${source} · SQL brut interdit`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C6 — SEC-04, LE GOND DE (B) : `executerPrompt` est le SEUL passage vers le réseau
// ---------------------------------------------------------------------------
// AJOUTÉ AU TOUR 2, et c'est le contrôle qui tient tous les autres.
//
// La correction du [BLOQUANT] B1 fait porter (B) par un type nominal exigé en
// entrée d'`executerPrompt()`. Cette garantie ne vaut que si `executerPrompt`
// est **réellement** le seul chemin du produit vers le fournisseur. Sans ce
// contrôle, ma propre affirmation serait ce que le verdict du tour 1 reproche :
// une propriété vraie là où je l'ai écrite, et non partout où elle doit tenir.
//
// Trois propriétés, toutes vérifiées sur le code et non sur une intention :
//
//   (a) `transport.emettre()` — la seule fonction qui touche le réseau — n'est
//       appelée QUE depuis `src/lib/ai/execution.ts` ;
//   (b) `fetch` n'apparaît QUE dans `src/lib/ai/providers/`, donc jamais dans
//       un module qui pourrait court-circuiter le scellement ;
//   (c) `executerPrompt()` n'est appelée QUE depuis `src/lib/ai/index.ts`, la
//       fabrique — donc aucun appelant ne peut l'atteindre par un autre
//       chemin que les trois méthodes d'`AiProvider`.
//
// ---------------------------------------------------------------------------
// CE QUE C6 PROUVE, ET CE QU'IL NE PROUVE PAS — [MINEUR] N6 du tour 2
// ---------------------------------------------------------------------------
// Le tour 2 écrivait ici : « (a) ∧ (b) ∧ (c) ⟹ tout octet émis vers un
// fournisseur est passé par le scellement ». **C'est faux, et `controle-code`
// l'a montré** : en laissant le `fetch(` légitime en place et en AJOUTANT un
// appel aliasé (`const envoyer = globalThis.fetch`) dans le périmètre de V2,
// le texte brut est sorti avec six contrôles verts.
//
// Ce que C6 prouve : **les passages nommés restent uniques et lisibles en un
// seul endroit.** C'est une propriété de lisibilité, et elle est utile — elle
// attrape le contournement ordinaire, celui qu'on écrit sans y penser, et sa
// garde « zéro occurrence ⇒ ÉCHEC » attrape aussi la disparition d'un passage
// par alias ou ré-exportation, ce que le contrôleur a vérifié.
//
// Ce que C6 ne prouve pas, et qu'aucune lecture statique ne prouvera :
// l'absence d'exfiltration. `node:https`, `node:net`, un `import()` dynamique
// ou un `fetch` atteint par une variable y suffisent sans jamais écrire le mot
// surveillé. C'est la même honnêteté que C1 affiche trois cents lignes plus
// haut, et elle vaut mieux qu'une implication séduisante et fausse.

const PASSAGES_UNIQUES: readonly {
  readonly quoi: string;
  readonly motif: RegExp;
  readonly ou: RegExp;
  readonly motifDeclare: string;
}[] = [
  {
    quoi: "transport.emettre(",
    motif: /\.emettre\s*\(/gu,
    ou: /^src\/lib\/ai\/execution\.ts$/u,
    motifDeclare:
      "La seule fonction du produit qui atteigne le fournisseur. Appelée ailleurs, elle émettrait un corps qui n'aurait traversé ni le scellement ni l'invariant (A) de SEC-04.",
  },
  {
    quoi: "fetch(",
    // ÉLARGI PAR V3, et le motif est écrit plutôt que tu. La règle du tour 2
    // — « fetch( seulement dans src/lib/ai/providers/ » — a rougi sur le
    // PREMIER écran qui parle au serveur : un appel vers /api/session/… ne
    // parle à aucun fournisseur. Élargir à src/hooks/** aurait rendu un appel
    // de fournisseur écrivable dans un hook ; le second destinataire reçoit
    // donc son passage unique, comme le premier a le sien, avec une garde
    // EXÉCUTABLE dans le fichier (le chemin doit commencer par /api/).
    motif: /\bfetch\s*\(/gu,
    ou: /^src\/lib\/(ai\/providers\/|api\/client\.ts$)/u,
    motifDeclare:
      "Le produit n'a que DEUX destinations réseau, chacune lisible en un seul endroit : un fournisseur externe derrière AiTransport, et les routes de Tipi derrière appelerApi(). Un fetch ailleurs contournerait l'une ou l'autre — la coupure corps()/emettre() de SEC-04, ou la validation Zod de la réponse.",
  },
  {
    quoi: "executerPrompt(",
    motif: /\bexecuterPrompt\s*\(/gu,
    ou: /^src\/lib\/ai\/(index|execution)\.ts$/u,
    motifDeclare:
      "Le passage obligé qui exige un TexteAnonymise. Appelé depuis un autre module, il resterait sûr — le type tient — mais la frontière cesserait d'être lisible en un seul endroit, et c'est cette lisibilité qui a manqué au tour 1.",
  },
];

function c6(): void {
  const fichiers = fichiersSous("src").filter((f) => !f.endsWith(".test.ts"));
  if (fichiers.length === 0) {
    enregistrer("C6", "C6 — SEC-04 : un seul passage du produit vers le réseau du fournisseur", "src/ : AUCUN fichier lu", ["src/ introuvable : l'instrument ne mesure rien."], false);
    return;
  }

  const defauts: string[] = [];
  const comptes: string[] = [];

  for (const { quoi, motif, ou, motifDeclare } of PASSAGES_UNIQUES) {
    let total = 0;
    for (const fichier of fichiers) {
      const nu = codeNu(lire(fichier));
      const occurrences = [...nu.matchAll(motif)].length;
      if (occurrences === 0) continue;
      total += occurrences;
      if (!ou.test(fichier)) {
        defauts.push(`${fichier} appelle « ${quoi} » hors de ${ou.source}. ${motifDeclare}`);
      }
    }
    if (total === 0) {
      defauts.push(
        `aucune occurrence de « ${quoi} » dans src/ : l'instrument ne mesure rien pour ce passage. Le produit ne parle plus à aucun fournisseur, ou le motif ne reconnaît plus l'appel.`,
      );
    }
    comptes.push(`${quoi} ${total}`);
  }

  enregistrer(
    "C6",
    "C6 — SEC-04 : un seul passage du produit vers le réseau du fournisseur",
    `${fichiers.length} fichiers de src/ (hors tests) · ${PASSAGES_UNIQUES.length} passages surveillés, chacun justifié · occurrences trouvées : ${comptes.join(" · ")}`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C7 — LES TROIS SCEAUX NE SE FABRIQUENT QU'À UN SEUL ENDROIT
// ---------------------------------------------------------------------------
// AJOUTÉ AU TOUR 3, en réponse à [MAJEUR] M5.
//
// SEC-04 repose désormais sur trois types nominaux : `IdentifiantsInterdits`,
// `TexteAnonymise`, `PayloadIa`. Un type nominal garantit **la forme** de son
// argument. Il ne garantit rien sur **le contenu de la configuration qui
// l'alimente** — c'est exactement ce que le contrôleur a exploité au tour 2 en
// passant une liste d'interdits vide, avec tous les instruments au vert.
//
// Le sceau de `IdentifiantsInterdits` referme la brèche du côté du type : un
// objet littéral n'est plus assignable, et la fabrique refuse une liste vide.
// Reste une question que le type ne peut pas trancher : **les valeurs
// viennent-elles bien du foyer ?** `src/lib/ai/**` n'a aucun accès à la base
// (C2) et ne peut pas le vérifier. C'est donc un contrôle de lisibilité qui
// l'épingle : la fabrique n'est appelée que depuis le module qui lit la base.
//
// Ce que C7 prouve : chacun des trois sceaux a **un et un seul** lieu de
// fabrication dans le code livré, et ce lieu est celui qui détient la donnée
// nécessaire. Ce qu'il ne prouve pas : qu'un futur module ne ré-exportera pas
// une fabrique sous un autre nom — même limite que C6, déclarée pour les mêmes
// raisons. La garde « zéro occurrence ⇒ ÉCHEC » attrape sa disparition.

const SCEAUX: readonly {
  readonly quoi: string;
  readonly motif: RegExp;
  readonly ou: RegExp;
  readonly motifDeclare: string;
}[] = [
  {
    quoi: "IdentifiantsInterdits.sceller(",
    motif: /\bIdentifiantsInterdits\s*\.\s*sceller\s*\(/gu,
    ou: /^src\/lib\/enfant\/courant\.ts$/u,
    motifDeclare:
      "Seul module du produit qui lise la base, donc seul à savoir quels identifiants retirer. Fabriqué ailleurs, le sceau attesterait une liste que personne n'a tirée du foyer — la faute exacte de [MAJEUR] M5.",
  },
  {
    quoi: "TexteAnonymise.depuis(",
    motif: /\bTexteAnonymise\s*\.\s*depuis\s*\(/gu,
    ou: /^src\/lib\/devoirs\/analyse\.ts$/u,
    motifDeclare:
      "Le caviardage s'exerce là où le foyer est connu, et hors de src/lib/ai/** pour que la barrière 1 de P2 §6 reste intacte. Un second lieu de fabrication serait un second endroit où l'oublier.",
  },
  {
    quoi: "PayloadIa.sceller(",
    motif: /\bPayloadIa\s*\.\s*sceller\s*\(/gu,
    ou: /^src\/lib\/ai\/execution\.ts$/u,
    motifDeclare:
      "Le scellement précède immédiatement l'invariant (A) et l'émission, dans le passage obligé. Sceller ailleurs séparerait le scellement du contrôle qui le suit.",
  },
];

function c7(): void {
  const fichiers = fichiersSous("src").filter((f) => !f.endsWith(".test.ts"));
  if (fichiers.length === 0) {
    enregistrer("C7", "C7 — SEC-04 : les trois sceaux ne se fabriquent qu'à un seul endroit", "src/ : AUCUN fichier lu", ["src/ introuvable : l'instrument ne mesure rien."], false);
    return;
  }

  const defauts: string[] = [];
  const comptes: string[] = [];

  for (const { quoi, motif, ou, motifDeclare } of SCEAUX) {
    let total = 0;
    for (const fichier of fichiers) {
      const nu = codeNu(lire(fichier));
      const occurrences = [...nu.matchAll(motif)].length;
      if (occurrences === 0) continue;
      total += occurrences;
      if (!ou.test(fichier)) {
        defauts.push(`${fichier} fabrique « ${quoi} » hors de ${ou.source}. ${motifDeclare}`);
      }
    }
    if (total === 0) {
      defauts.push(
        `aucune occurrence de « ${quoi} » dans src/ : l'instrument ne mesure rien pour ce sceau. Le sceau a disparu, ou le motif ne reconnaît plus sa fabrique.`,
      );
    }
    comptes.push(`${quoi} ${total}`);
  }

  for (const { quoi, motifDeclare } of SCEAUX) {
    if (motifDeclare.trim().length < 40) {
      defauts.push(`${quoi} est épinglé sans motif écrit (ARB-18 mesure 2).`);
    }
  }

  enregistrer(
    "C7",
    "C7 — SEC-04 : les trois sceaux ne se fabriquent qu'à un seul endroit",
    `${fichiers.length} fichiers de src/ (hors tests) · ${SCEAUX.length} sceaux surveillés, chacun justifié · occurrences trouvées : ${comptes.join(" · ")}`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C8 — V3 : L'ÉTAT DE SESSION ET LE LEDGER N'ONT QU'UN ÉCRIVAIN CHACUN
// ---------------------------------------------------------------------------
// AJOUTÉ PAR V3, dans la forme de C6 et C7 : des **passages uniques**, chacun
// épinglé à son lieu, chacun portant son motif, et chacun en ÉCHEC si le
// passage disparaît.
//
// Ce que C8 prouve, et ce qu'il ne prouve pas — la même honnêteté que C6 :
//
//   Il prouve que les écritures qui décident de l'état d'une soirée et du solde
//   de pierres restent **lisibles en un seul endroit**. C'est ce qui rend
//   vérifiable la phrase de P2 §9.3 : « une transition = une transaction ».
//   Deux écrivains, c'est deux ordres d'exécution possibles, donc l'ordre
//   « crédits d'étape puis bonus » qui n'est plus garanti — le défaut exact du
//   constat 26, qui a coûté une pierre à l'enfant.
//
//   Il ne prouve pas l'absence d'écriture : une écriture imbriquée par relation
//   (`child.update({ data: { sessions: { create: … } } })`) ne nomme aucun de
//   ces passages. C'est C5 qui attrape cette forme-là, par dérivation depuis
//   `prisma/schema.prisma`, et il la couvre pour le périmètre de V2. Étendre C5
//   à tout `src/` est impossible en l'état : `sessionId` est un identifiant
//   légitime dans un hook, un composant et une route, et un contrôle qui rougit
//   partout ne mesure plus rien.

const ECRITURES_UNIQUES: readonly {
  readonly quoi: string;
  readonly motif: RegExp;
  readonly ou: RegExp;
  readonly motifDeclare: string;
}[] = [
  {
    quoi: "gemLedger.create(",
    motif: /\bgemLedger\s*\.\s*create\s*\(/gu,
    ou: /^src\/lib\/pierres\/service\.ts$/u,
    motifDeclare:
      "TEC-11 et SEC-06 — la seule écriture du ledger. Ailleurs, une pierre serait créditée sans passer par le barème ni par l'unique (session_id, raison) qui porte l'idempotence, et l'invariant gem_balance == SUM(delta) cesserait d'être rétabli.",
  },
  {
    quoi: "gemBalance",
    motif: /\bgemBalance\b/gu,
    ou: /^src\/lib\/pierres\/service\.ts$/u,
    motifDeclare:
      "SEC-06 — le solde est un cache RECALCULÉ depuis le ledger, jamais incrémenté ni écrit par un autre module. Un second écrivain ferait diverger le cache de sa source sans qu'aucune requête ne le dise.",
  },
  {
    quoi: "session.update(",
    motif: /\bsession\s*\.\s*update\s*\(/gu,
    ou: /^src\/lib\/session\/service\.ts$/u,
    motifDeclare:
      "TEC-10 — l'état persisté ne change qu'au terme d'une transition calculée par la machine, dans la transaction qui porte ses effets. Une seconde écriture ferait avancer l'état sans crédit, ou créditerait sans faire avancer l'état.",
  },
  {
    quoi: "session.create(",
    motif: /\bsession\s*\.\s*create\s*\(/gu,
    ou: /^src\/lib\/session\/service\.ts$/u,
    motifDeclare:
      "TEC-06 — une session ne naît qu'après la validation du parent, avec ses cinq gardes (PED-06, ARB-08, matières distinctes, session déjà active, drapeau sansDevoir). Créée ailleurs, elle les contournerait toutes.",
  },
  {
    quoi: "appliquer(",
    motif: /(?<![A-Za-z0-9_$])appliquer\s*\(/gu,
    ou: /^src\/lib\/session\/(machine|service)\.ts$/u,
    motifDeclare:
      "La fonction pure de la machine n'est appelée que par le service, qui l'entoure du verrou, de l'idempotence et de la transaction. Appelée ailleurs, elle rendrait une transition que personne ne persisterait — un état décidé et jamais écrit, contre PRD-18.",
  },
  {
    quoi: "crediterBonusSiSoireeComplete(",
    motif: /\bcrediterBonusSiSoireeComplete\s*\(/gu,
    ou: /^src\/lib\/(pierres\/service|session\/service)\.ts$/u,
    motifDeclare:
      "ARB-13 — le bonus est défini une fois et exécuté une fois, à l'endroit qui applique les effets de la machine dans l'ordre où elle les a posés. Ses trois créditeurs (T5, T10, T12) sont des lignes de la TABLE, pas trois appels dispersés : c'est ce qui empêche qu'un quatrième chemin terminal oublie le bonus.",
  },
  {
    quoi: "$queryRaw / $executeRaw",
    motif: /\$(?:queryRaw|executeRaw)\w*/gu,
    ou: /^src\/lib\/session\/service\.ts$/u,
    motifDeclare:
      "Le SQL brut échappe à toute lecture d'identifiants. Le seul du produit est le SELECT … FOR UPDATE du verrou de transition, irréductible : ni Prisma ni une contrainte ne savent l'exprimer. Tout autre serait une écriture que C5 et C8 ne peuvent pas voir.",
  },
];

function c8(): void {
  const fichiers = fichiersSous("src").filter((f) => !f.endsWith(".test.ts"));
  if (fichiers.length === 0) {
    enregistrer("C8", "C8 — TEC-10, TEC-11, SEC-06 : un seul écrivain par garantie", "src/ : AUCUN fichier lu", ["src/ introuvable : l'instrument ne mesure rien."], false);
    return;
  }

  const defauts: string[] = [];
  const comptes: string[] = [];

  for (const { quoi, motif, ou, motifDeclare } of ECRITURES_UNIQUES) {
    let total = 0;
    for (const fichier of fichiers) {
      const nu = codeNu(lire(fichier));
      const occurrences = [...nu.matchAll(motif)].length;
      if (occurrences === 0) continue;
      total += occurrences;
      if (!ou.test(fichier)) {
        defauts.push(`${fichier} écrit « ${quoi} » hors de ${ou.source}. ${motifDeclare}`);
      }
    }
    if (total === 0) {
      defauts.push(
        `aucune occurrence de « ${quoi} » dans src/ : l'instrument ne mesure rien pour cette écriture. Le passage a disparu, ou le motif ne le reconnaît plus.`,
      );
    }
    comptes.push(`${quoi} ${total}`);
  }

  for (const { quoi, motifDeclare } of ECRITURES_UNIQUES) {
    if (motifDeclare.trim().length < 40) {
      defauts.push(`${quoi} est épinglé sans motif écrit (ARB-18 mesure 2).`);
    }
  }

  enregistrer(
    "C8",
    "C8 — TEC-10, TEC-11, SEC-06 : un seul écrivain par garantie",
    `${fichiers.length} fichiers de src/ (hors tests) · ${ECRITURES_UNIQUES.length} écritures surveillées, chacune justifiée · occurrences trouvées : ${comptes.join(" · ")}`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// C0 — QUI GARDE LE GARDIEN ? LES TABLES DE L'INSTRUMENT, GARDÉES CONTRE ELLES-MÊMES
// ---------------------------------------------------------------------------
// AJOUTÉ AU TOUR 4, en réponse à [MAJEUR] M6, et c'est la question que ce projet
// n'avait pas encore posée.
//
// Le tour 3 s'était donné une doctrine — *« toute valeur dont le zéro, le vide
// ou l'absence rend une garde inopérante doit avoir son cas au catalogue »* —
// et l'avait étendue nommément à l'instrument. `controle-code` l'a alors
// appliquée à l'instrument lui-même et a trouvé **quatre tables qui se vident
// sans que rien ne rougisse**, dont celles de C6 et C7 — les deux contrôles qui
// n'existent que pour tenir SEC-04. Sept verts, sortie 0.
//
// La faute n'était pas d'avoir oublié quatre `if` : c'était d'avoir écrit la
// garde **trois fois à la main**. Une garde recopiée est une garde qu'on oublie
// à la quatrième table, et qu'on oubliera à la huitième.
//
// C0 la rend donc mécanique, et en deux temps :
//
//   (1) **chaque table déclarative est enregistrée avec un prédicat de
//       neutralité** — vide pour une liste ou un enregistrement, « autorise
//       n'importe quoi » pour une expression régulière d'autorisation — et
//       porte la phrase disant ce que sa neutralité éteindrait ;
//
//   (2) **la liste des tables à enregistrer est DÉRIVÉE du fichier lui-même**
//       (ARB-18 mesure 1) : C0 relit `scripts/verifier-confinement.ts`, y
//       trouve toute constante de premier niveau qui ressemble à une table, et
//       exige qu'elle soit enregistrée. Ajouter demain une huitième table sans
//       l'enregistrer fait rougir l'instrument — on ne peut plus oublier.
//
// Ce que C0 prouve : aucune table déclarative de cet instrument ne peut être
// vidée, ni aucune de ses expressions d'autorisation élargie à tout, sans que
// la porte le voie. Ce qu'il ne prouve pas : qu'une table mal remplie mesure la
// bonne chose — cela reste le travail d'un contrôleur qui la lit ligne à ligne.

/**
 * Une constante de ce fichier qui n'est **pas** une table déclarative, avec la
 * raison. Sans cette liste, la dérivation (2) exigerait d'enregistrer des
 * constantes qui ne gardent rien.
 */
const NON_DECLARATIVES: Readonly<Record<string, string>> = Object.freeze({
  NON_DECLARATIVES:
    "Cette liste d'exemptions elle-même. Elle n'autorise rien dans le code contrôlé : la vider rendrait C0 PLUS sévère, jamais plus laxiste, et un contrôleur la lit ligne à ligne.",
});

/**
 * Fichier qui ne doit être autorisé par **aucune** expression d'autorisation de
 * cet instrument. Sert de sonde : une regex qui l'accepte accepte tout.
 */
const TEMOIN_HORS_PERIMETRE = "src/app/dev/design-system/page.tsx";

/** Vrai si cette expression d'autorisation est devenue permissive. */
function regexNeutre(re: RegExp): boolean {
  return re.test("") || re.test(TEMOIN_HORS_PERIMETRE);
}

/**
 * Le registre des tables déclaratives, avec pour chacune son prédicat de
 * neutralité et **la phrase disant ce que sa neutralité éteindrait**
 * (ARB-18 mesure 2).
 */
const TABLES_GARDEES: readonly {
  readonly nom: string;
  readonly controle: string;
  readonly estNeutre: () => boolean;
  readonly eteint: string;
}[] = [
  {
    nom: "AUTORISES_A_NOMMER_LE_FOURNISSEUR",
    controle: "C1",
    estNeutre: () => regexNeutre(AUTORISES_A_NOMMER_LE_FOURNISSEUR),
    eteint:
      "TEC-17 : une expression qui autorise tout laisse n'importe quel fichier de src/ nommer le fournisseur, et C1 reste vert.",
  },
  {
    nom: "FERMETURE_AUTORISEE_AI",
    controle: "C2",
    estNeutre: () => Object.keys(FERMETURE_AUTORISEE_AI).length === 0,
    eteint:
      "SEC-04 (C) : sans référence, la fermeture d'imports de src/lib/ai/** n'est plus comparée à rien de déclaré.",
  },
  {
    nom: "TYPES_BINAIRES",
    controle: "C3",
    estNeutre: () => TYPES_BINAIRES.length === 0,
    eteint:
      "TEC-05 : aucun type binaire n'est plus cherché, donc une image pourrait entrer dans la frontière d'IA sans un mot.",
  },
  {
    nom: "DOSSIERS_SANS_SEUIL",
    controle: "C4",
    estNeutre: () => DOSSIERS_SANS_SEUIL.length === 0,
    eteint:
      "TEC-16 : plus aucun dossier n'est examiné, donc un seuil littéral peut revenir n'importe où sans être vu.",
  },
  {
    nom: "MODELES_INTERDITS_A_V2",
    controle: "C5",
    estNeutre: () => Object.keys(MODELES_INTERDITS_A_V2).length === 0,
    eteint:
      "TEC-06 : plus aucun modèle interdit, donc la dérivation depuis le schéma ne produit plus d'identifiant et V2 peut créer une session.",
  },
  {
    nom: "CHAMPS_INTERDITS_A_V2",
    controle: "C5",
    estNeutre: () => Object.keys(CHAMPS_INTERDITS_A_V2).length === 0,
    eteint:
      "SEC-06 : le solde de pierres cesse d'être surveillé dans le périmètre de la capture.",
  },
  {
    nom: "PERIMETRE_V2",
    controle: "C5",
    estNeutre: () => PERIMETRE_V2.length === 0,
    eteint:
      "TEC-06 : plus aucun fichier n'est lu, donc le contrôle ne peut plus rien trouver — il sortirait vert sur un périmètre vide.",
  },
  {
    nom: "PASSAGES_UNIQUES",
    controle: "C6",
    estNeutre: () =>
      PASSAGES_UNIQUES.length === 0 || PASSAGES_UNIQUES.some((p) => regexNeutre(p.ou)),
    eteint:
      "SEC-04 : plus aucun passage vers le réseau n'est surveillé. C'est le contrôle qui rend vraie la garantie du type TexteAnonymise — il ne vaut que si executerPrompt reste le seul chemin.",
  },
  {
    nom: "SCEAUX",
    controle: "C7",
    estNeutre: () => SCEAUX.length === 0 || SCEAUX.some((s) => regexNeutre(s.ou)),
    eteint:
      "SEC-04 : plus aucun sceau n'est épinglé à son unique lieu de fabrication. C'est le contrôle qui répond à [MAJEUR] M5 — un sceau fabriqué ailleurs atteste une liste que personne n'a tirée du foyer.",
  },
  {
    nom: "ECRITURES_UNIQUES",
    controle: "C8",
    estNeutre: () =>
      ECRITURES_UNIQUES.length === 0 || ECRITURES_UNIQUES.some((e) => regexNeutre(e.ou)),
    eteint:
      "TEC-10, TEC-11, SEC-06 : plus aucune écriture n'est épinglée à son écrivain unique. L'état de session et le ledger pourraient être écrits depuis n'importe où, donc hors de la transaction qui tient l'ordre « crédits d'étape puis bonus » — le défaut du constat 26, qui coûtait une pierre à l'enfant.",
  },
];

/**
 * Les constantes de premier niveau de ce fichier qui **ressemblent à une
 * table** : nom en capitales, initialisée par un littéral de tableau, un
 * `Object.freeze` ou une expression régulière. Dérivé du source, jamais recopié.
 */
function tablesDuFichier(): readonly string[] {
  const source = lire("scripts/verifier-confinement.ts");
  const trouvees: string[] = [];
  for (const m of source.matchAll(
    /^const\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*(Object\.freeze\(|\[|\/)/gmu,
  )) {
    const nom = m[1];
    if (nom !== undefined && !trouvees.includes(nom)) trouvees.push(nom);
  }
  return trouvees;
}

function c0(): void {
  const defauts: string[] = [];

  // (1) aucune table enregistrée n'est neutre.
  for (const { nom, controle, estNeutre, eteint } of TABLES_GARDEES) {
    if (estNeutre()) {
      defauts.push(`${nom} (${controle}) est NEUTRALISÉE. ${eteint}`);
    }
    if (eteint.trim().length < 40) {
      defauts.push(`${nom} est gardée sans motif écrit (ARB-18 mesure 2).`);
    }
  }

  // (2) aucune table du fichier n'échappe au registre.
  const declarees = tablesDuFichier();
  if (declarees.length === 0) {
    enregistrer("C0", "C0 — les tables de l'instrument, gardées contre elles-mêmes", "AUCUNE constante lue dans le source de l'instrument", ["La dérivation n'a produit aucune table : C0 ne mesure rien."], false);
    return;
  }
  const enregistrees = new Set(TABLES_GARDEES.map((t) => t.nom));
  for (const nom of declarees) {
    if (enregistrees.has(nom)) continue;
    if (Object.prototype.hasOwnProperty.call(NON_DECLARATIVES, nom)) {
      const raison = NON_DECLARATIVES[nom] ?? "";
      if (raison.trim().length < 40) {
        defauts.push(`${nom} est exemptée sans raison écrite (ARB-18 mesure 2).`);
      }
      continue;
    }
    defauts.push(
      `${nom} est une table déclarative de cet instrument et n'est NI enregistrée dans TABLES_GARDEES, NI exemptée dans NON_DECLARATIVES. Une table qu'on oublie d'enregistrer est une table qu'on pourra vider en silence ([MAJEUR] M6).`,
    );
  }
  // Deux réciproques. Une entrée du registre qui ne correspond à aucune table
  // du fichier signale un renommage — donc une garde qui ne garde plus rien.
  // Une exemption sans table correspondante est une exemption périmée, qui
  // couvrirait un jour un nom réemployé pour autre chose.
  for (const { nom } of TABLES_GARDEES) {
    if (!declarees.includes(nom)) {
      defauts.push(`${nom} est enregistrée dans TABLES_GARDEES mais n'existe plus dans le fichier.`);
    }
  }
  for (const nom of Object.keys(NON_DECLARATIVES)) {
    if (!declarees.includes(nom)) {
      defauts.push(`${nom} est exemptée dans NON_DECLARATIVES mais n'existe plus dans le fichier : une exemption périmée finit par couvrir autre chose.`);
    }
  }

  enregistrer(
    "C0",
    "C0 — les tables de l'instrument, gardées contre elles-mêmes",
    `${declarees.length} constantes déclaratives dérivées du source · ${TABLES_GARDEES.length} gardées, chacune justifiée · ${Object.keys(NON_DECLARATIVES).length} exemptées, chacune motivée · sonde d'autorisation : « ${TEMOIN_HORS_PERIMETRE} »`,
    defauts,
  );
}

// ---------------------------------------------------------------------------

c0();
c1();
c2();
c3();
c4();
c5();
c6();
c7();
c8();

let echecs = 0;
for (const r of resultats) {
  console.info(`[${r.etat.padEnd(6)}] ${r.nom}`);
  console.info(`          examiné : ${r.examine}`);
  for (const d of r.defauts) console.info(`          DÉFAUT : ${d}`);
  if (r.etat === "ÉCHEC") echecs += 1;
}

console.info(
  `\n${resultats.length} contrôles : ${resultats.length - echecs} verts, ${echecs} en échec.`,
);

process.exitCode = echecs > 0 ? 1 : 0;
