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

const TABLES_INTERDITES_A_V2: Readonly<Record<string, string>> = Object.freeze({
  session:
    "TEC-06 — une session ne se crée qu'après la validation du parent sur l'aperçu, par POST /api/session (V3). Aucun chemin de la capture ne doit pouvoir en ouvrir une.",
  gemLedger:
    "TEC-11 et SEC-06 — le crédit de pierres est un effet de transition de session, écrit par src/lib/pierres/service.ts (V6), jamais par la capture.",
  gemBalance:
    "SEC-06 — le solde est recalculé depuis le ledger par la route serveur, jamais écrit ailleurs. La capture n'a rien à y faire.",
});

const PERIMETRE_V2: readonly string[] = ["src/lib/devoirs", "src/app/api/devoirs"];

function c5(): void {
  const fichiers = PERIMETRE_V2.flatMap((d) => fichiersSous(d));
  if (fichiers.length === 0) {
    enregistrer("C5", "C5 — TEC-06 : aucun chemin de V2 ne démarre de session", "aucun fichier lu", ["Le périmètre de V2 est vide : l'instrument ne mesure rien."], false);
    return;
  }
  const defauts: string[] = [];
  for (const fichier of fichiers) {
    if (fichier.endsWith(".test.ts")) continue;
    const nu = codeNu(lire(fichier));
    for (const [table, motif] of Object.entries(TABLES_INTERDITES_A_V2)) {
      if (new RegExp(`\\b(?:prisma|tx)\\s*\\.\\s*${table}\\b`, "u").test(nu)) {
        defauts.push(`${fichier} touche « ${table} ». ${motif}`);
      }
    }
    if (/\bsessionId\s*:/u.test(nu)) {
      defauts.push(
        `${fichier} écrit un champ sessionId. ${TABLES_INTERDITES_A_V2["session"] ?? ""}`,
      );
    }
  }
  for (const [table, motif] of Object.entries(TABLES_INTERDITES_A_V2)) {
    if (motif.trim().length < 40) {
      defauts.push(`${table} est interdite sans motif écrit (ARB-18 mesure 2).`);
    }
  }
  enregistrer(
    "C5",
    "C5 — TEC-06 : aucun chemin de V2 ne démarre de session",
    `${fichiers.filter((f) => !f.endsWith(".test.ts")).length} fichiers de ${PERIMETRE_V2.join(", ")} · ${Object.keys(TABLES_INTERDITES_A_V2).length} accès interdits, chacun justifié`,
    defauts,
  );
}

// ---------------------------------------------------------------------------

c1();
c2();
c3();
c4();
c5();

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
