/**
 * Instrument de contrôle du socle V1.
 *
 * `pnpm verifier:socle`
 *
 * ------------------------------------------------------------------------
 * CE QU'IL EST, ET CE QU'IL N'EST PAS
 * ------------------------------------------------------------------------
 * `40-protocole-agents.mdc` demande de **préférer un invariant à une
 * re-dérivation** : une re-dérivation partage la règle qu'elle vérifie et ne
 * peut donc pas attraper une règle fausse. Les cinq contrôles ci-dessous sont
 * des invariants — une propriété que le résultat doit satisfaire, quelle que
 * soit la façon dont il a été obtenu — et aucun ne recalcule ce qu'il mesure.
 *
 * Pour la même raison, ce script **importe les modules réels** plutôt que de
 * recopier leurs tables : il lit `src/lib/errors/codes.ts` et
 * `src/content/cles.ts` tels qu'ils sont livrés. Une copie divergerait en
 * silence, et un instrument qui mesure une copie mesure autre chose.
 *
 * Chaque contrôle imprime **ce qu'il a réellement examiné**. Un contrôle qui
 * n'a rien pu examiner sort en ÉCHEC, jamais en vert : un instrument qui
 * affiche le défaut sans le voir est pire qu'un instrument muet.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CLES_TABLE_7_0 } from "@/content/cles";
import { contenu } from "@/content/loader";
import { CODES_ERREUR, TOUS_LES_CODES } from "@/lib/errors/codes";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Trois états, et non deux. `PARTIEL` existe parce qu'un contrôle qui n'a pas
 * pu tout mesurer ne doit pas s'afficher vert : il doit nommer la dimension
 * qu'il n'a pas couverte. C'est la règle 5 de « Corriger un instrument de
 * mesure » — un instrument qui affiche le défaut sans le voir est pire qu'un
 * instrument muet.
 */
type Etat = "OK" | "PARTIEL" | "ÉCHEC";

/**
 * La porte que cet invariant garde. Un invariant peut voir un défaut réel qui
 * n'appartient pas à la verticale courante : il le dit haut et fort à chaque
 * passage, mais il ne fait échouer que SA porte.
 *
 * Introduit au tour 2 de G4.V1, sur l'arbitrage de l'Orchestrateur qui fait des
 * cinq libellés de cosmétiques et des cinq seuils d'ARB-16 une **dépendance de
 * la porte G4.V6**. Sans ce mécanisme, il n'y avait que deux issues, mauvaises
 * toutes les deux : un instrument rouge en permanence, qu'on finit par ignorer,
 * ou un défaut réel passé sous silence.
 */
type Porte = "V1" | "V6";

const PORTES: readonly Porte[] = ["V1", "V6"];

interface Resultat {
  readonly nom: string;
  readonly etat: Etat;
  readonly examine: string;
  readonly defauts: readonly string[];
  /** Ce que ce passage n'a pas pu mesurer. Vide si la couverture est entière. */
  readonly nonMesure: string | null;
  readonly porte: Porte;
}

const resultats: Resultat[] = [];

function enregistrer(
  nom: string,
  examine: string,
  defauts: readonly string[],
  options: { executable?: boolean; nonMesure?: string; porte?: Porte } = {},
): void {
  const executable = options.executable ?? true;
  const nonMesure = options.nonMesure ?? null;
  const etat: Etat = !executable || defauts.length > 0
    ? "ÉCHEC"
    : nonMesure === null
      ? "OK"
      : "PARTIEL";
  resultats.push({ nom, etat, examine, defauts, nonMesure, porte: options.porte ?? "V1" });
}

/** Porte contrôlée par ce passage : `--porte=V1` (défaut) ou `--porte=V6`. */
function porteCourante(): Porte {
  const arg = process.argv.find((a) => a.startsWith("--porte="));
  const valeur = arg?.slice("--porte=".length);
  if (valeur === undefined) return "V1";
  const trouvee = PORTES.find((p) => p === valeur);
  if (trouvee === undefined) {
    throw new Error(`Porte inconnue : ${valeur}. Portes possibles : ${PORTES.join(", ")}.`);
  }
  return trouvee;
}

// ---------------------------------------------------------------------------
// Clés portées par content/, tous fichiers confondus
// ---------------------------------------------------------------------------

function clesUiFixes(): ReadonlySet<string> {
  const c = contenu();
  return new Set([
    ...Object.keys(c.uiEnfant.textes),
    ...Object.keys(c.uiParent.textes),
  ]);
}

function clesBanque(): ReadonlySet<string> {
  const c = contenu();
  const cles = new Set<string>();
  for (const situation of Object.values(c.encouragements.situations)) {
    for (const cle of situation.cles_ui) cles.add(cle);
    for (const variante of situation.variantes) {
      for (const partie of variante.parties) {
        for (const cle of partie.cles_ui) cles.add(cle);
      }
    }
  }
  for (const rituel of Object.values(c.rituels.rituels)) {
    for (const ecran of rituel.ecrans) {
      for (const ligne of ecran.lignes) cles.add(ligne.id);
    }
  }
  return cles;
}

// ---------------------------------------------------------------------------
// I1 — TEC-13 : aucun secret serveur dans le bundle client
// ---------------------------------------------------------------------------
// L'invariant porte sur l'ARTEFACT, pas sur une convention de nommage : on
// cherche dans `.next/static` la VALEUR de chaque variable classée serveur.
// C'est ce qui le rend indifférent au contournement réel — renommer un secret
// en `NEXT_PUBLIC_…` pour « le faire marcher côté client » change le nom, pas
// la valeur, et le contrôle rougit quand même.
//
// La liste des variables serveur n'est pas écrite ici : elle est DÉRIVÉE de
// `.env.example`, seul document qui les déclare toutes. Ajouter un secret à
// `.env.example` étend donc le contrôle sans qu'on y pense.

function variablesDeclarees(): { serveur: string[]; publiques: string[] } {
  const brut = readFileSync(join(RACINE, ".env.example"), "utf8");
  const noms = [...brut.matchAll(/^([A-Z][A-Z0-9_]*)=/gmu)].map((m) => m[1] ?? "");
  return {
    serveur: noms.filter((n) => !n.startsWith("NEXT_PUBLIC_")),
    publiques: noms.filter((n) => n.startsWith("NEXT_PUBLIC_")),
  };
}

function valeursLocales(): Readonly<Record<string, string>> {
  const table: Record<string, string> = {};
  for (const fichier of [".env.local", ".env"]) {
    try {
      const brut = readFileSync(join(RACINE, fichier), "utf8");
      for (const ligne of brut.split("\n")) {
        const m = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(ligne.trim());
        if (m?.[1] !== undefined && m[2] !== undefined) {
          table[m[1]] ??= m[2].replace(/^["']|["']$/gu, "");
        }
      }
    } catch {
      // Fichier absent : c'est le cas normal en intégration continue.
    }
  }
  for (const [nom, valeur] of Object.entries(process.env)) {
    if (valeur !== undefined && valeur !== "") table[nom] ??= valeur;
  }
  return table;
}

function fichiersDu(dossier: string): string[] {
  const trouves: string[] = [];
  const parcourir = (chemin: string): void => {
    for (const entree of readdirSync(chemin)) {
      const complet = join(chemin, entree);
      if (statSync(complet).isDirectory()) parcourir(complet);
      else trouves.push(complet);
    }
  };
  try {
    parcourir(dossier);
  } catch {
    return [];
  }
  return trouves;
}

function i1(): void {
  const statique = join(RACINE, ".next", "static");
  const fichiers = fichiersDu(statique);
  if (fichiers.length === 0) {
    enregistrer(
      "I1 — TEC-13 : aucun secret serveur dans le bundle client",
      ".next/static : ABSENT",
      [".next/static introuvable. Lancer `pnpm build` avant ce contrôle."],
      { executable: false },
    );
    return;
  }

  const { serveur } = variablesDeclarees();
  const valeurs = valeursLocales();
  const cherchables = serveur.filter((n) => {
    const v = valeurs[n];
    // Une valeur trop courte produirait des coïncidences dans du JavaScript
    // minifié : on ne la cherche pas, et on le dit.
    return v !== undefined && v.length >= 8;
  });

  const defauts: string[] = [];
  const corpus = fichiers.map((f) => readFileSync(f, "utf8"));

  for (const nom of cherchables) {
    const valeur = valeurs[nom];
    if (valeur === undefined) continue;
    for (const [i, texte] of corpus.entries()) {
      if (texte.includes(valeur)) {
        defauts.push(
          `la VALEUR de ${nom} apparaît dans ${fichiers[i]?.replace(RACINE, ".") ?? "?"}`,
        );
      }
    }
  }
  for (const nom of serveur) {
    for (const [i, texte] of corpus.entries()) {
      if (texte.includes(nom)) {
        defauts.push(
          `le NOM ${nom} apparaît dans ${fichiers[i]?.replace(RACINE, ".") ?? "?"}`,
        );
      }
    }
  }

  const nonCherchables = serveur.length - cherchables.length;
  enregistrer(
    "I1 — TEC-13 : aucun secret serveur dans le bundle client",
    `${fichiers.length} fichiers de .next/static · ${serveur.length} variables serveur déclarées dans .env.example · ${cherchables.length} VALEURS réellement recherchées · ${serveur.length} NOMS recherchés`,
    defauts,
    nonCherchables > 0
      ? {
          nonMesure: `${nonCherchables} variables serveur n'avaient aucune valeur disponible : leur valeur n'a donc PAS été cherchée dans le bundle, seul leur nom l'a été. Rejouer ce contrôle après un build fait avec un .env.local renseigné pour obtenir la couverture entière.`,
        }
      : {},
  );
}

// ---------------------------------------------------------------------------
// I2 — PRD-02 : aucun âge n'est stockable, quel que soit le nom qu'on lui donne
// ---------------------------------------------------------------------------
// RÉÉCRIT AU TOUR 2 DE G4.V1, après le MAJEUR 2 de `controle-code`.
//
// La version du tour 1 cherchait un NOM (`/^age|[Aa]ge$/`). Le contrôleur l'a
// mise en défaut en une ligne : `anneesRevolues Int @default(6)` — le même âge
// figé, sous un autre nom — passait vert, dans le schéma comme dans le seed. Un
// invariant qui cherche cinq lettres se contourne en renommant, et le rapport
// le présentait pourtant comme « structurel ». Le motif produisait en outre des
// faux positifs sur `stockage`, `langage`, `message`.
//
// La version ci-dessous cherche la PROPRIÉTÉ, pas l'étiquette. Trois
// sous-invariants, dont deux totalement indépendants du nom des champs :
//
//   I2a — AUCUN champ scalaire de `child` n'est numérique, hormis `gemBalance`.
//         Un âge est un nombre. Sous n'importe quel nom, il tombe ici.
//         `gemBalance` est la seule exception, et elle est nommée : c'est un
//         solde, recalculable depuis `gem_ledger` (TEC-11), pas une donnée
//         dérivable de `date_naissance`.
//
//   I2b — L'ensemble des champs scalaires de `child` est EXACTEMENT l'ensemble
//         déclaré ci-dessous. Invariant de réciprocité, dans les deux sens :
//         un champ ajouté au schéma et absent de la liste rougit, un champ
//         déclaré ici et disparu du schéma aussi. Il attrape un âge même
//         stocké en `String` (« 6 ans »), que I2a laisserait passer.
//         Le prix à payer est assumé : toute évolution de `child` doit passer
//         par cette liste. C'est voulu — `child` est fixée par la section 3.7
//         du prompt maître, une colonne de plus y est une décision
//         d'architecture, pas un détail d'implémentation.
//
//   I2c — Aucun champ, dans AUCUN modèle, ne porte le segment « age ». C'est
//         l'ancien contrôle, conservé comme troisième filet parce qu'il couvre
//         les neuf autres modèles, corrigé de ses faux positifs par découpage
//         en segments camelCase (`stockage` n'est plus signalé, `ageAnnees`
//         l'est toujours). Il est déclaré pour ce qu'il est : une heuristique
//         de nommage, jamais la garantie.
//
// Ce que I2 ne fait toujours pas, et il faut le dire : il ne prouve pas que
// `ageEnAnnees()` calcule juste. C'est le rôle des 16 tests de
// `src/lib/dates/age.test.ts`, et notamment de leur §4.

/** Les 12 champs scalaires de `child`, section 3.7 + `prisma/schema.prisma`. */
const CHAMPS_CHILD_DECLARES: readonly string[] = [
  "id",
  "familyId",
  "prenom",
  "dateNaissance",
  "niveauScolaire",
  "classeBilingue",
  "gemBalance",
  "themePrefere",
  "cosmetiqueActive",
  "onboardingTermineLe",
  "createdAt",
  "updatedAt",
];

/**
 * Le seul champ numérique autorisé sur `child`, et son motif : c'est un solde
 * recalculable depuis `gem_ledger` (TEC-11, SEC-06), pas une valeur dérivable
 * de `date_naissance`.
 */
const CHAMPS_CHILD_NUMERIQUES_AUTORISES: readonly string[] = ["gemBalance"];

const TYPES_NUMERIQUES = ["Int", "BigInt", "Float", "Decimal"];

interface ChampPrisma {
  readonly nom: string;
  readonly type: string;
  readonly relation: boolean;
}

function champsDuModele(corps: string): readonly ChampPrisma[] {
  const champs: ChampPrisma[] = [];
  for (const ligne of corps.split("\n")) {
    const nu = ligne.trim();
    if (nu === "" || nu.startsWith("//") || nu.startsWith("///") || nu.startsWith("@@")) continue;
    const m = /^(\w+)\s+(\w+)(\[\])?(\?)?/u.exec(nu);
    if (m?.[1] === undefined || m[2] === undefined) continue;
    champs.push({
      nom: m[1],
      type: m[2],
      // Une relation porte `@relation` ou est un tableau de modèle.
      relation: nu.includes("@relation") || m[3] === "[]",
    });
  }
  return champs;
}

/** Découpe un nom camelCase ou snake_case en segments minuscules. */
function segments(nom: string): readonly string[] {
  return nom
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .split("_")
    .map((s) => s.toLowerCase())
    .filter((s) => s !== "");
}

function i2(): void {
  const schema = readFileSync(join(RACINE, "prisma", "schema.prisma"), "utf8");
  const defauts: string[] = [];

  const modeles = [...schema.matchAll(/model\s+(\w+)\s*\{([^}]*)\}/gu)];
  const child = modeles.find((m) => m[1] === "Child");
  if (child === undefined) {
    enregistrer(
      "I2 — PRD-02 : aucun âge stockable, quel que soit son nom",
      "modèle Child : INTROUVABLE",
      ["Le modèle `Child` est absent de prisma/schema.prisma : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  const champsChild = champsDuModele(child[2] ?? "").filter((c) => !c.relation);

  // --- I2a : aucun champ numérique hors gemBalance ------------------------
  for (const champ of champsChild) {
    if (
      TYPES_NUMERIQUES.includes(champ.type) &&
      !CHAMPS_CHILD_NUMERIQUES_AUTORISES.includes(champ.nom)
    ) {
      defauts.push(
        `I2a — Child.${champ.nom} est de type ${champ.type} : un champ numérique sur child peut porter un âge (PRD-02). Seul ${CHAMPS_CHILD_NUMERIQUES_AUTORISES.join(", ")} est autorisé.`,
      );
    }
  }

  // --- I2b : réciprocité de l'ensemble déclaré ----------------------------
  const reels = new Set(champsChild.map((c) => c.nom));
  for (const nom of reels) {
    if (!CHAMPS_CHILD_DECLARES.includes(nom)) {
      defauts.push(
        `I2b — Child.${nom} existe dans le schéma mais n'est pas déclaré dans CHAMPS_CHILD_DECLARES. Toute colonne ajoutée à child doit être examinée : c'est là qu'un âge se loge.`,
      );
    }
  }
  for (const nom of CHAMPS_CHILD_DECLARES) {
    if (!reels.has(nom)) {
      defauts.push(
        `I2b — Child.${nom} est déclaré ici mais absent du schéma : la liste a dérivé, l'invariant ne protège plus ce qu'il croit protéger.`,
      );
    }
  }

  // --- I2c : heuristique de nommage, sur les dix modèles ------------------
  let champsExamines = 0;
  for (const modele of modeles) {
    const nomModele = modele[1] ?? "";
    for (const champ of champsDuModele(modele[2] ?? "")) {
      champsExamines += 1;
      if (segments(champ.nom).includes("age")) {
        defauts.push(
          `I2c — ${nomModele}.${champ.nom} porte le segment « age » (PRD-02).`,
        );
      }
    }
  }
  if (champsExamines === 0) {
    enregistrer(
      "I2 — PRD-02 : aucun âge stockable, quel que soit son nom",
      "schema.prisma : AUCUN champ lu",
      ["Le schéma n'a produit aucun champ : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  // --- le seed : mêmes trois filets, appliqués à ce qu'il écrit -----------
  // Un champ écrit par le seed et absent du schéma ne compile pas (Prisma le
  // type), donc I2b couvre déjà le seed par transitivité. Ce contrôle-ci
  // attrape le cas restant : une valeur numérique littérale posée sur child.
  const seed = readFileSync(join(RACINE, "prisma", "seed.ts"), "utf8");
  const bloc = /const EVAN = \{([\s\S]*?)\} as const;/u.exec(seed);
  if (bloc?.[1] === undefined) {
    defauts.push(
      "I2 — le bloc `const EVAN = { … } as const;` est introuvable dans prisma/seed.ts : l'instrument ne peut plus lire ce que le seed écrit.",
    );
  } else {
    for (const ligne of bloc[1].split("\n")) {
      const m = /^\s*(\w+)\s*:\s*(.+?),?\s*(\/\/.*)?$/u.exec(ligne);
      if (m?.[1] === undefined || m[2] === undefined) continue;
      if (/^-?\d+(\.\d+)?$/u.test(m[2].trim())) {
        defauts.push(
          `I2 — prisma/seed.ts écrit la valeur numérique littérale ${m[2].trim()} sur child.${m[1]} : un âge figé se loge exactement là (PRD-02).`,
        );
      }
      if (segments(m[1]).includes("age")) {
        defauts.push(`I2 — prisma/seed.ts écrit child.${m[1]} (PRD-02).`);
      }
    }
  }

  enregistrer(
    "I2 — PRD-02 : aucun âge stockable, quel que soit son nom",
    `I2a ${champsChild.length} champs scalaires de child, ${CHAMPS_CHILD_NUMERIQUES_AUTORISES.length} numérique autorisé · I2b réciprocité sur ${CHAMPS_CHILD_DECLARES.length} champs déclarés · I2c ${champsExamines} champs sur ${modeles.length} modèles · plus le bloc EVAN de prisma/seed.ts`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// I3 — PRD-16 : toute clé d'erreur est portée par content/
// ---------------------------------------------------------------------------
// « Un ensemble déclaré dont aucun élément ne doit rester inemployé » :
// chaque code d'erreur désigne une clé de contenu, et cette clé doit exister.
// Si elle manque, l'écran de récupération tombe au moment précis où il devait
// rattraper l'enfant — et PRD-16 interdit qu'un état limite soit une impasse.

function i3(): void {
  const toutes = new Set([...clesUiFixes(), ...clesBanque()]);
  const defauts: string[] = [];
  let examinees = 0;

  for (const code of TOUS_LES_CODES) {
    const cle = CODES_ERREUR[code].cleContenu;
    if (cle === null) continue;
    examinees += 1;
    const famille = cle.endsWith("*");
    if (!famille) {
      if (!toutes.has(cle)) defauts.push(`${code} → ${cle} : clé absente de content/.`);
      continue;
    }
    const prefixe = cle.slice(0, -1).replace(/\.$/u, "");
    const membres = [...toutes].filter(
      (k) => k === prefixe || k.startsWith(`${prefixe}.`),
    );
    if (membres.length === 0) {
      defauts.push(`${code} → ${cle} : aucune clé de content/ ne porte ce préfixe.`);
    }
  }

  if (examinees === 0) {
    enregistrer(
      "I3 — PRD-16 : les clés d'erreur existent dans content/",
      "AUCUNE clé examinée",
      ["Aucun code ne déclare de clé : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I3 — PRD-16 : les clés d'erreur existent dans content/",
    `${examinees} clés ou familles issues de ${TOUS_LES_CODES.length} codes, contre ${toutes.size} clés portées par content/`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// I4 — règle `raccordement` de content/encouragements.json
// ---------------------------------------------------------------------------
// Le fichier déclare lui-même : « Le champ `texte` de la variante est toujours
// la jointure des parties, dans l'ordre : c'est ce que lit le TTS. »
//
// L'invariant vérifie cette égalité sur toutes les variantes. Il attrape le cas
// qui ne se voit jamais en relecture : un écran juste et une voix fausse, ou
// l'inverse — Pilou dirait une phrase que l'écran n'affiche pas (PED-10).

function i4(): void {
  const situations = Object.values(contenu().encouragements.situations);
  const defauts: string[] = [];
  let variantes = 0;

  for (const situation of situations) {
    for (const variante of situation.variantes) {
      variantes += 1;
      const jointure = variante.parties.map((p) => p.texte).join(" ").trim();
      if (jointure !== variante.texte.trim()) {
        defauts.push(
          `${situation.id}/${variante.id} : la jointure des parties diffère du texte lu par le TTS.`,
        );
      }
    }
  }

  if (variantes === 0) {
    enregistrer(
      "I4 — raccordement : le texte lu est la jointure des parties",
      "AUCUNE variante examinée",
      ["Aucune variante trouvée : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I4 — raccordement : le texte lu est la jointure des parties",
    `${variantes} variantes réparties sur ${situations.length} situations`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// I5 — table 7.0 : chaque clé effective est portée par sa source, et par elle seule
// ---------------------------------------------------------------------------
// Invariant de réciprocité. `src/content/cles.ts` déclare, pour chacune des
// treize clés, si son texte vit dans les fichiers d'interface (`ui`) ou dans la
// banque de variantes (`banque`). Une clé annoncée « banque » mais rangée en
// texte fixe serait jouée sans variantes — et ARB-06 exige que le Soir léger
// reste indétectable par l'enfant.

function i5(): void {
  const fixes = clesUiFixes();
  const banque = clesBanque();
  const defauts: string[] = [];

  for (const { cle, source } of CLES_TABLE_7_0) {
    const dansUi = fixes.has(cle);
    const dansBanque = banque.has(cle);
    if (!dansUi && !dansBanque) {
      defauts.push(`${cle} : absente de content/ (déclarée « ${source} »).`);
      continue;
    }
    if (source === "ui" && !dansUi) {
      defauts.push(`${cle} : déclarée « ui » mais portée par la banque.`);
    }
    if (source === "banque" && !dansBanque) {
      defauts.push(`${cle} : déclarée « banque » mais portée par un texte fixe.`);
    }
  }

  if (CLES_TABLE_7_0.length === 0) {
    enregistrer(
      "I5 — table 7.0 : chaque clé est portée par la source déclarée",
      "AUCUNE clé examinée",
      ["La table 7.0 est vide : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I5 — table 7.0 : chaque clé est portée par la source déclarée",
    `${CLES_TABLE_7_0.length} clés effectives, contre ${fixes.size} clés fixes et ${banque.size} clés de banque`,
    defauts,
  );
}

// ---------------------------------------------------------------------------
// I6 — dépendance de la porte G4.V6 : les cosmétiques sans libellé ni seuil
// ---------------------------------------------------------------------------
// AJOUTÉ AU TOUR 2 DE G4.V1, sur arbitrage de l'Orchestrateur.
//
// Deux manques portent sur les mêmes cinq lignes de `src/config/mascot.config.ts` :
//
//   1. les cinq `cleLibelle` (`coffre.cosmetiques.aucun`, `.echarpe`, `.bonnet`,
//      `.noeud`, `.lunettes`) sont ABSENTES de `content/` — relevé par
//      `controle-design` en P3 (§8, point 5) et jamais refermé. Or
//      `src/content/loader.ts` LÈVE sur une clé absente, volontairement : la
//      première verticale qui câble `cleLibelle` fait donc tomber l'écran du
//      coffre. C'est V6 ;
//   2. les cinq `pierresRequises` sont à `null` depuis ARB-16, qui a sorti les
//      seuils 0/15/30/45/60 du code en attendant une décision produit.
//
// Aucun des deux n'appartient à V1 : les textes sont réservés à `contenu-enfant`
// (ARB-10), les seuils à une décision produit (ARB-16). Cet invariant les VOIT et
// les NOMME à chaque passage, et il fait échouer la porte **V6**, pas V1.
//
// Il est donc rouge aujourd'hui, et c'est son état attendu. Le jour où les cinq
// libellés et les cinq seuils arrivent, il passe vert sans qu'on y touche — la
// preuve dans les deux sens est en §0.3 de docs/agents/P4/V1.out.md.

function i6(): void {
  const mascot = readFileSync(join(RACINE, "src", "config", "mascot.config.ts"), "utf8");
  const lignes = [
    ...mascot.matchAll(
      /\{\s*id:\s*"([^"]+)",\s*cleLibelle:\s*"([^"]+)",\s*pierresRequises:\s*([^\s,}]+)/gu,
    ),
  ];

  if (lignes.length === 0) {
    enregistrer(
      "I6 — G4.V6 : chaque cosmétique a son libellé et son seuil",
      "mascot.config.ts : AUCUNE cosmétique lue",
      ["Aucune cosmétique trouvée dans mascot.config.ts : l'instrument ne mesure rien."],
      { executable: false, porte: "V6" },
    );
    return;
  }

  const toutes = new Set([...clesUiFixes(), ...clesBanque()]);
  const defauts: string[] = [];
  for (const ligne of lignes) {
    const id = ligne[1] ?? "";
    const cle = ligne[2] ?? "";
    const seuil = ligne[3] ?? "";
    if (!toutes.has(cle)) {
      defauts.push(
        `${id} : la clé ${cle} est absente de content/ — loader.texteUi() lèvera, et l'écran du coffre tombera (ARB-10, à produire par contenu-enfant).`,
      );
    }
    if (seuil === "null") {
      defauts.push(`${id} : pierresRequises est null — décision produit attendue (ARB-16).`);
    }
  }

  enregistrer(
    "I6 — G4.V6 : chaque cosmétique a son libellé et son seuil",
    `${lignes.length} cosmétiques de mascot.config.ts, contre ${toutes.size} clés portées par content/`,
    defauts,
    { porte: "V6" },
  );
}

// ---------------------------------------------------------------------------

i1();
i2();
i3();
i4();
i5();
i6();

const porte = porteCourante();

let echecsPorte = 0;
let echecsAutrePorte = 0;
let partiels = 0;
for (const r of resultats) {
  const marque = r.porte === porte ? r.etat : `${r.etat}/${r.porte}`;
  console.info(`[${marque.padEnd(10)}] ${r.nom}`);
  console.info(`          examiné : ${r.examine}`);
  for (const d of r.defauts) console.info(`          DÉFAUT : ${d}`);
  if (r.nonMesure !== null) console.info(`          NON MESURÉ : ${r.nonMesure}`);
  if (r.etat === "ÉCHEC") {
    if (r.porte === porte) echecsPorte += 1;
    else echecsAutrePorte += 1;
  }
  if (r.etat === "PARTIEL" && r.porte === porte) partiels += 1;
}

const couverts = resultats.length - partiels - echecsPorte - echecsAutrePorte;
console.info(
  `\nPorte contrôlée : ${porte}. ${resultats.length} invariants : ${couverts} vérifiés entièrement, ${partiels} partiels, ${echecsPorte} en échec pour ${porte}, ${echecsAutrePorte} en échec pour une porte ultérieure.`,
);

// Codes de sortie, corrigés au tour 2 après le MINEUR 6 de `controle-code` :
// `PARTIEL` ne doit PAS rendre 0. Une chaîne automatisée ne lit que ce nombre,
// et un contrôle qui n'a rien mesuré ne doit pas y passer pour vert.
//   0 = tout vérifié entièrement pour la porte contrôlée
//   1 = au moins un invariant en échec pour la porte contrôlée
//   2 = aucun échec, mais au moins un invariant PARTIEL
// Un échec sur une porte ULTÉRIEURE est imprimé et n'affecte pas ce code : il
// est opposable à sa porte, contrôlée par `--porte=V6`.
process.exitCode = echecsPorte > 0 ? 1 : partiels > 0 ? 2 : 0;
