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
 * Une porte du projet, telle que `docs/agents/GATES.md` la nomme.
 *
 * RÉÉCRIT AU TOUR 3, sur **ARB-18 mesure 1** : *un invariant dérive sa
 * référence de la source, il ne la recopie pas.* Au tour 2, les portes
 * valides étaient une liste littérale dans ce fichier, et la porte d'un
 * invariant une option disséminée dans six appels `enregistrer`.
 * `controle-code` a montré qu'on déplaçait un défaut réel de V1 vers V6 —
 * et donc qu'on rendait V1 verte malgré un âge stocké — **en ajoutant une
 * ligne** (`[MINEUR] T2-4`).
 *
 * Deux remèdes, tous deux d'ARB-18 :
 *  - les portes existantes sont **dérivées de `GATES.md`**, fichier que seul
 *    l'Orchestrateur écrit. Une porte inventée ici ne passe pas ;
 *  - l'affectation invariant → porte est **une table unique**, en tête de
 *    fichier, et chaque entrée hors `G4.V1` **porte sa justification**
 *    (mesure 2). Déplacer un invariant ne se fait plus d'un trait au milieu
 *    d'un appel : il faut venir ici et écrire une phrase.
 */
type Porte = string;

const PORTE_COURANTE_PAR_DEFAUT = "G4.V1";

/**
 * Les portes déclarées par `docs/agents/GATES.md`, **avec leur statut**,
 * dérivées et non recopiées.
 */
function portesDeclarees(): ReadonlyMap<Porte, string> {
  const brut = readFileSync(join(RACINE, "docs", "agents", "GATES.md"), "utf8");
  const portes = new Map<Porte, string>();
  // Le statut est une cellule entière : « verte », « ouverte », « en cours »,
  // « bloquée ». La capturer avec `\w+` ratait « en cours » — et donc G4.V1,
  // la porte courante elle-même. Trouvé en rejouant l'instrument.
  for (const l of brut.matchAll(/^\|\s*(G\d+(?:\.V\d+)?)\s*\|[^|]*\|[^|]*\|[^|]*\|([^|]*)\|/gmu)) {
    const nom = l[1] ?? "";
    const statut = (l[2] ?? "").replace(/\*/gu, "").trim().toLowerCase();
    if (!portes.has(nom)) portes.set(nom, statut);
  }
  if (portes.size === 0) {
    throw new Error(
      "Aucune porte lue dans docs/agents/GATES.md : l'instrument ne sait plus à quelle porte il répond.",
    );
  }
  return portes;
}

/**
 * Affectation invariant → porte. **Table unique, et chaque entrée hors
 * `G4.V1` porte le motif qui l'y met** (ARB-18 mesures 1 et 3).
 *
 * Toute modification de cette table est `[MAJEUR]` sans démonstration écrite,
 * au même titre que `AJOUTS_ARCHITECTURE` : déplacer un invariant de porte,
 * c'est décider qu'un défaut ne bloque plus la verticale courante.
 */
const PORTE_PAR_INVARIANT: Readonly<Record<string, { readonly porte: Porte; readonly motif: string }>> =
  {
    I1: { porte: "G4.V1", motif: "" },
    I2: { porte: "G4.V1", motif: "" },
    I3: { porte: "G4.V1", motif: "" },
    I4: { porte: "G4.V1", motif: "" },
    I5: { porte: "G4.V1", motif: "" },
    I6: {
      porte: "G4.V6",
      motif:
        "ARB-17 (b) : les cinq libellés de cosmétiques et les cinq seuils d'ARB-16 sont une dépendance de la porte G4.V6. Aucun des deux n'appartient à V1 — les textes sont réservés à contenu-enfant (ARB-10), les seuils à une décision produit (ARB-16).",
    },
  };

type Etat = "OK" | "PARTIEL" | "ÉCHEC";

interface Resultat {
  readonly cle: string;
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
  cle: string,
  nom: string,
  examine: string,
  defauts: readonly string[],
  options: { executable?: boolean; nonMesure?: string } = {},
): void {
  const executable = options.executable ?? true;
  const nonMesure = options.nonMesure ?? null;
  const etat: Etat = !executable || defauts.length > 0
    ? "ÉCHEC"
    : nonMesure === null
      ? "OK"
      : "PARTIEL";
  const affectation = PORTE_PAR_INVARIANT[cle];
  if (affectation === undefined) {
    throw new Error(
      `L'invariant ${cle} n'a pas d'affectation dans PORTE_PAR_INVARIANT. Un invariant sans porte déclarée ne bloque rien.`,
    );
  }
  resultats.push({ cle, nom, etat, examine, defauts, nonMesure, porte: affectation.porte });
}

/** Porte contrôlée par ce passage : `--porte=G4.V1` (défaut) ou une autre de `GATES.md`. */
function porteCourante(portes: ReadonlyMap<Porte, string>): Porte {
  const arg = process.argv.find((a) => a.startsWith("--porte="));
  const valeur = arg?.slice("--porte=".length);
  if (valeur === undefined) return PORTE_COURANTE_PAR_DEFAUT;
  if (!portes.has(valeur)) {
    throw new Error(
      `Porte inconnue : « ${valeur} ». Les portes déclarées par docs/agents/GATES.md sont : ${[...portes.keys()].join(", ")}.`,
    );
  }
  return valeur;
}

/**
 * Vérifie que la table d'affectation est cohérente avec `GATES.md` et avec
 * ARB-18 : toute porte citée existe, et tout déplacement hors de `G4.V1` porte
 * son motif. Sans cette garde, la table pourrait nommer une porte inexistante
 * et un invariant ne bloquerait plus rien, en silence.
 */
function verifierTableDesPortes(portes: ReadonlyMap<Porte, string>): readonly string[] {
  const defauts: string[] = [];
  for (const [cle, { porte, motif }] of Object.entries(PORTE_PAR_INVARIANT)) {
    const statut = portes.get(porte);
    if (statut === undefined) {
      defauts.push(
        `${cle} est affecté à « ${porte} », qui n'est pas une porte de docs/agents/GATES.md.`,
      );
      continue;
    }
    if (porte === PORTE_COURANTE_PAR_DEFAUT) continue;

    if (motif.trim().length < 40) {
      defauts.push(
        `${cle} est déplacé hors de ${PORTE_COURANTE_PAR_DEFAUT} sans motif écrit (ARB-18 mesure 2). Déplacer un invariant de porte, c'est décider qu'un défaut ne bloque plus la verticale courante : cela s'écrit.`,
      );
    }
    // Un défaut ne se reporte pas sur une porte DÉJÀ FERMÉE : ce serait le
    // faire disparaître. Le statut vient de `GATES.md`, que seul
    // l'Orchestrateur écrit — la garde n'est pas contournable d'ici.
    if (statut === "verte") {
      defauts.push(
        `${cle} est reporté sur « ${porte} », que docs/agents/GATES.md déclare déjà VERTE. Reporter un défaut sur une porte fermée, c'est l'effacer.`,
      );
    }
  }
  return defauts;
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
      "I1",
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
    "I1",
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
// I2 — PRD-02 : aucun âge stockable sur `child`, quel que soit son nom
// ---------------------------------------------------------------------------
// TROISIÈME ÉCRITURE. Historique, parce qu'il dit à quoi sert un contrôleur :
//
//   Tour 1 — cherchait un NOM (`/^age|[Aa]ge$/`). `anneesRevolues Int
//            @default(6)` passait vert. [MAJEUR] 2.
//   Tour 2 — cherchait la PROPRIÉTÉ sur `child`, mais la liste de référence
//            était RECOPIÉE ici : deux lignes suffisaient à la désarmer, et un
//            âge sur un AUTRE modèle passait vert. [MINEUR] T2-2 + §4 du verdict.
//   Tour 3 — la référence est DÉRIVÉE de la section 3.7 du prompt maître, que
//            personne dans ce dépôt ne possède (ARB-18 mesure 1), et la
//            couverture s'étend aux dix modèles.
//
// Quatre sous-invariants :
//
//   I2a — AUCUN champ scalaire de `child` n'est numérique, hormis ceux qui
//         portent ici leur justification. Un âge est un nombre.
//
//   I2b — L'ensemble des colonnes de CHAQUE table est exactement celui que la
//         section 3.7 du prompt maître énonce, PLUS les ajouts d'architecture
//         qui portent chacun **la phrase disant pourquoi ils ne sont pas
//         dérivables de `date_naissance`** (ARB-18 mesure 2). Réciprocité dans
//         les deux sens. C'est lui qui attrape un âge en `String`, un âge sur
//         `session`, et toute colonne apparue sans décision.
//
//   I2c — Aucun champ d'aucun modèle ne porte le segment « age ». Heuristique
//         de nommage, déclarée comme telle, jamais la garantie.
//
//   I2d — Le profil semé a EXACTEMENT la forme de PRD-02 : quatre champs, et
//         chacun d'une forme déclarée. Ajouté au tour 3 sur **une mutation que
//         j'ai cherchée moi-même** : `niveauScolaire: "CE1, 6 ans"` figeait
//         l'âge d'Evan dans un champ `String` déjà déclaré, et passait les
//         trois autres sous-invariants.
//
// Ce que I2 ne fait toujours pas : prouver que `ageEnAnnees()` calcule juste.
// C'est le rôle des 16 tests de `src/lib/dates/age.test.ts`.

/**
 * Le modèle de données de la **section 3.7 du prompt maître**, dérivé et non
 * recopié. C'est la source que `dev-feature` ne possède pas : un champ ajouté
 * à une table devient un écart entre le code et le cahier des charges — ce
 * qu'il est réellement — et aucune ligne de ce fichier ne peut l'effacer.
 */
function modeleDe37(): ReadonlyMap<string, readonly string[]> {
  const brut = readFileSync(join(RACINE, "TIPI-PROMPT-CURSOR.md"), "utf8");
  const table = new Map<string, readonly string[]>();
  for (const ligne of brut.matchAll(/^\|\s*`(\w+)`\s*\|[^|]*\|([^|]*)\|\s*$/gmu)) {
    const nom = ligne[1] ?? "";
    const champs = (ligne[2] ?? "")
      .split(",")
      .map((c) => c.trim().replace(/\s*\(.*\)$/u, ""))
      .filter((c) => /^[a-z][a-z0-9_]*$/u.test(c));
    // Une ligne de 3.7 décrit une table : elle nomme au moins `id`.
    if (champs.includes("id")) table.set(nom, champs);
  }
  return table;
}

/**
 * Colonnes présentes dans `prisma/schema.prisma` et absentes de la section
 * 3.7. Chacune porte **la phrase qui dit pourquoi elle n'est pas dérivable de
 * `date_naissance`** — ARB-18 mesure 2 : une liste de noms se complète sans
 * réfléchir, une liste de justifications se complète en mentant, ce qui est un
 * autre geste.
 *
 * Toute modification de cette table est `[MAJEUR]` sans démonstration écrite
 * dans le rapport de verticale (ARB-18 mesure 3).
 */
const AJOUTS_ARCHITECTURE: Readonly<Record<string, string>> = {
  // --- horodatages techniques, sur toutes les tables ---
  "family.created_at": "Horodatage de création, posé par la base. Sans rapport avec la naissance de l'enfant.",
  "child.created_at": "Horodatage de création du profil, posé par la base. C'est la date d'un enregistrement, jamais celle d'une personne.",
  "child.updated_at": "Horodatage de dernière écriture, posé par la base à chaque mise à jour.",
  "exercise.created_at": "Horodatage de création, posé par la base.",
  "session.created_at": "Horodatage de création, posé par la base.",
  "session.updated_at": "Horodatage de dernière écriture, posé par la base.",
  "attempt.created_at": "Horodatage de création, posé par la base.",
  "attempt.updated_at": "Horodatage de dernière écriture, posé par la base.",
  "reward_threshold.created_at": "Horodatage de création, posé par la base.",
  // --- ajouts motivés par une exigence nommée ---
  "child.onboarding_termine_le":
    "PRD-01 — date à laquelle l'onboarding a été joué, pour ne jamais le rejouer. C'est un fait de parcours, pas une donnée de la personne : deux enfants nés le même jour ont des valeurs différentes.",
  "family.retention_audio_jours":
    "SEC-05 — durée de conservation des audios, en jours, réglable dans Réglages. Une durée de rétention, pas un âge : elle vaut 7 par défaut quel que soit l'enfant.",
  "family.calibration_active":
    "TEC-16 — drapeau du mode calibration OCR. Booléen, sans aucune arithmétique de dates.",
  "homework.confiance_ocr":
    "TEC-16 — score de confiance de l'OCR sur cette photo. Propriété d'une image, pas d'une personne.",
  "homework.saisie_manuelle":
    "PRD-16 — vrai quand le parent a saisi le devoir à la main. Booléen.",
  "session.soir_leger":
    "PRD-04 — Soir léger activé par le parent. Booléen, et ARB-06 exige qu'il reste indétectable par l'enfant.",
  "session.arret_parent":
    "PRD-13 — session arrêtée par le parent. Booléen.",
  "session.evenements":
    "PRD-18 — journal append-only des transitions, pour la reprise et l'idempotence. Aucune ligne n'y porte de donnée de la personne.",
  "attempt.nb_sollicitations":
    "PED-08 — sollicitations sans réponse exploitable, comparé au seuil de configuration. Compteur d'une tentative, remis à zéro à chaque exercice.",
  "attempt.mots_hesitants":
    "3.4 — mots sur lesquels l'enfant a hésité, pour « Mots à revoir » côté parent. Liste de chaînes.",
  "exercise.ordre":
    "Rang de l'exercice dans son devoir, pour le reconstruire dans l'ordre. Indice de position, borné par le nombre d'exercices.",
  // --- table entière hors 3.7, exigée nommément par TEC-16 ---
  "calibration_log.*":
    "TEC-16 — table entière hors de la section 3.7, exigée nommément par l'exigence. Elle ne contient aucune donnée identifiante : ni prénom, ni photo, ni date de naissance (SEC-04).",
};

/**
 * Champs numériques autorisés, avec la phrase qui dit pourquoi chacun n'est pas
 * dérivable de `date_naissance` (ARB-18 mesure 2).
 */
const CHAMPS_CHILD_NUMERIQUES_AUTORISES: Readonly<Record<string, string>> = {
  gem_balance:
    "TEC-11, SEC-06 — solde de pierres, toujours recalculable comme somme de gem_ledger. Il dépend de ce que l'enfant a fait, jamais de sa date de naissance : deux enfants nés le même jour ont des soldes différents, et un même enfant en a plusieurs au cours d'une semaine.",
};

const TYPES_NUMERIQUES = ["Int", "BigInt", "Float", "Decimal"];

interface ChampPrisma {
  readonly nom: string;
  readonly colonne: string;
  readonly type: string;
}

interface ModelePrisma {
  readonly modele: string;
  readonly table: string;
  readonly champs: readonly ChampPrisma[];
}

/**
 * Découpe `schema.prisma` en modèles, **ligne par ligne**.
 *
 * Pourquoi pas une expression régulière `model\s+(\w+)\s*\{([^}]*)\}` :
 * elle s'arrête à la première accolade fermante, et les commentaires de
 * documentation du schéma en contiennent — `/// Forme : [{ "matiere": … }]`.
 * Les modèles `Exercise` et `Session` étaient donc tronqués, et l'instrument
 * annonçait absentes six colonnes bel et bien présentes. Trouvé en écrivant
 * la version dérivée de 3.7, au tour 3.
 *
 * Une **relation** est un champ dont le type est un autre modèle : c'est la
 * seule définition sûre. Chercher `@relation` ou `[]` rate les relations
 * un-à-un déclarées de l'autre côté, comme `settingsAccess SettingsAccess?`.
 */
function modelesDuSchema(schema: string): readonly ModelePrisma[] {
  const lignes = schema.split("\n");
  const bruts: { nom: string; corps: string[] }[] = [];
  let courant: { nom: string; corps: string[] } | null = null;
  for (const ligne of lignes) {
    const ouverture = /^model\s+(\w+)\s*\{/u.exec(ligne.trim());
    if (ouverture?.[1] !== undefined) {
      courant = { nom: ouverture[1], corps: [] };
      continue;
    }
    if (courant === null) continue;
    if (ligne.trim() === "}") {
      bruts.push(courant);
      courant = null;
      continue;
    }
    courant.corps.push(ligne);
  }

  const nomsDeModele = new Set(bruts.map((b) => b.nom));
  return bruts.map(({ nom, corps }) => {
    const texte = corps.join("\n");
    const map = /@@map\("([^"]+)"\)/u.exec(texte);
    const champs: ChampPrisma[] = [];
    for (const ligne of corps) {
      const nu = ligne.trim();
      if (nu === "" || nu.startsWith("//") || nu.startsWith("@@")) continue;
      const m = /^(\w+)\s+(\w+)(\[\])?/u.exec(nu);
      if (m?.[1] === undefined || m[2] === undefined) continue;
      if (nomsDeModele.has(m[2])) continue; // relation
      const colonne = /@map\("([^"]+)"\)/u.exec(nu);
      champs.push({ nom: m[1], colonne: colonne?.[1] ?? m[1], type: m[2] });
    }
    return { modele: nom, table: map?.[1] ?? nom.toLowerCase(), champs };
  });
}

/** Découpe un nom camelCase ou snake_case en segments minuscules. */
function segments(nom: string): readonly string[] {
  return nom
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .split("_")
    .map((x) => x.toLowerCase())
    .filter((x) => x !== "");
}

/**
 * Forme attendue du profil semé, PRD-02 mot pour mot : « Evan, 29/11/2019,
 * CE1, bilingue breton ». Quatre champs, pas cinq, et chacun d'une forme qui
 * n'admet pas un âge — `niveauScolaire` en particulier, où « CE1, 6 ans »
 * passait au tour 2.
 */
const FORME_PROFIL_SEME: Readonly<Record<string, { readonly motif: RegExp; readonly attendu: string }>> = {
  prenom: { motif: /^"[A-ZÉÈÀÂÎÔÛ][a-zéèêàâîïôûç-]*"$/u, attendu: "un prénom seul, sans chiffre" },
  dateNaissance: {
    motif: /^new Date\(Date\.UTC\(\d{4},\s*\d{1,2},\s*\d{1,2}\)\)$/u,
    attendu: "new Date(Date.UTC(aaaa, m, j)) — une date de calendrier en UTC",
  },
  niveauScolaire: {
    motif: /^"(CP|CE1|CE2|CM1|CM2)"$/u,
    attendu: "un niveau scolaire seul : CP, CE1, CE2, CM1 ou CM2. Un âge n'y entre pas",
  },
  classeBilingue: { motif: /^(true|false)$/u, attendu: "un booléen" },
};

function i2(): void {
  const schema = readFileSync(join(RACINE, "prisma", "schema.prisma"), "utf8");
  const defauts: string[] = [];
  const attendu37 = modeleDe37();

  if (attendu37.size === 0) {
    enregistrer("I2", "I2 — PRD-02 : aucun âge stockable sur child, quel que soit son nom",
      "section 3.7 du prompt maître : AUCUNE table lue",
      ["La section 3.7 n'a produit aucune table : l'instrument n'a plus de référence et ne mesure rien."],
      { executable: false });
    return;
  }

  const modeles = modelesDuSchema(schema);
  const tables = new Map<string, readonly ChampPrisma[]>(
    modeles.map((m) => [m.table, m.champs]),
  );

  const champsChild = tables.get("child");
  if (champsChild === undefined) {
    enregistrer("I2", "I2 — PRD-02 : aucun âge stockable sur child, quel que soit son nom",
      "table child : INTROUVABLE",
      ["La table `child` est absente de prisma/schema.prisma : l'instrument ne mesure rien."],
      { executable: false });
    return;
  }

  // --- I2a : aucun champ numérique sur child hors exception justifiée ------
  for (const champ of champsChild) {
    if (!TYPES_NUMERIQUES.includes(champ.type)) continue;
    const motif = CHAMPS_CHILD_NUMERIQUES_AUTORISES[champ.colonne];
    if (motif === undefined) {
      defauts.push(
        `I2a — child.${champ.colonne} est de type ${champ.type} : un champ numérique sur child peut porter un âge (PRD-02). Les seules exceptions sont ${Object.keys(CHAMPS_CHILD_NUMERIQUES_AUTORISES).join(", ")}, et chacune porte son motif.`,
      );
    } else if (motif.trim().length < 40) {
      defauts.push(
        `I2a — child.${champ.colonne} est autorisé sans motif écrit (ARB-18 mesure 2).`,
      );
    }
  }

  // --- I2b : réciprocité avec la section 3.7, sur TOUTES les tables --------
  let colonnesExaminees = 0;
  for (const [table, champs] of tables) {
    const declare37 = attendu37.get(table);
    const tableEntiereJustifiee = AJOUTS_ARCHITECTURE[`${table}.*`];
    for (const champ of champs) {
      colonnesExaminees += 1;
      if (declare37?.includes(champ.colonne) === true) continue;
      const justification = AJOUTS_ARCHITECTURE[`${table}.${champ.colonne}`] ?? tableEntiereJustifiee;
      if (justification === undefined) {
        defauts.push(
          `I2b — ${table}.${champ.colonne} n'existe ni dans la section 3.7 du prompt maître, ni dans AJOUTS_ARCHITECTURE. Toute colonne hors du cahier des charges doit porter la phrase qui dit pourquoi elle n'est pas dérivable de date_naissance (ARB-18).`,
        );
      } else if (justification.trim().length < 40) {
        defauts.push(
          `I2b — ${table}.${champ.colonne} est déclaré sans motif écrit (ARB-18 mesure 2).`,
        );
      }
    }
    if (declare37 !== undefined) {
      const reelles = new Set(champs.map((c) => c.colonne));
      for (const attendue of declare37) {
        if (!reelles.has(attendue)) {
          defauts.push(
            `I2b — ${table}.${attendue} est exigée par la section 3.7 du prompt maître et absente du schéma.`,
          );
        }
      }
    }
  }
  for (const table of attendu37.keys()) {
    if (!tables.has(table)) {
      defauts.push(`I2b — la table ${table} de la section 3.7 est absente du schéma.`);
    }
  }

  // Deux justifications identiques signalent un copier-coller : une liste de
  // justifications ne vaut que si chacune a été écrite pour son entrée.
  const vues = new Map<string, string>();
  for (const [cle, texte] of Object.entries(AJOUTS_ARCHITECTURE)) {
    const precedent = vues.get(texte.trim());
    if (precedent !== undefined && !texte.startsWith("Horodatage")) {
      defauts.push(
        `I2b — ${cle} et ${precedent} portent exactement la même justification : au moins l'une des deux n'a pas été écrite pour son entrée (ARB-18 mesure 2).`,
      );
    }
    vues.set(texte.trim(), cle);
  }

  // --- I2c : heuristique de nommage, sur les dix modèles -------------------
  let champsExamines = 0;
  for (const [table, champs] of tables) {
    for (const champ of champs) {
      champsExamines += 1;
      if (segments(champ.nom).includes("age") || segments(champ.colonne).includes("age")) {
        defauts.push(`I2c — ${table}.${champ.colonne} porte le segment « age » (PRD-02).`);
      }
    }
  }

  // --- I2d : la forme exacte du profil semé --------------------------------
  const seed = readFileSync(join(RACINE, "prisma", "seed.ts"), "utf8");
  const bloc = /const EVAN = \{([\s\S]*?)\} as const;/u.exec(seed);
  if (bloc?.[1] === undefined) {
    defauts.push(
      "I2d — le bloc `const EVAN = { … } as const;` est introuvable dans prisma/seed.ts : l'instrument ne peut plus lire ce que le seed écrit.",
    );
  } else {
    const ecrits = new Map<string, string>();
    for (const ligne of bloc[1].split("\n")) {
      const m = /^\s*(\w+)\s*:\s*(.+?),\s*(\/\/.*)?$/u.exec(ligne);
      if (m?.[1] === undefined || m[2] === undefined) continue;
      ecrits.set(m[1], m[2].trim());
    }
    for (const [nom, valeur] of ecrits) {
      const forme = FORME_PROFIL_SEME[nom];
      if (forme === undefined) {
        defauts.push(
          `I2d — le seed écrit child.${nom}, qui n'est pas l'un des quatre champs de PRD-02 (${Object.keys(FORME_PROFIL_SEME).join(", ")}). Un cinquième champ semé est exactement là qu'un âge se fige.`,
        );
        continue;
      }
      if (!forme.motif.test(valeur)) {
        defauts.push(
          `I2d — child.${nom} vaut ${valeur} dans le seed ; attendu : ${forme.attendu} (PRD-02).`,
        );
      }
    }
    for (const nom of Object.keys(FORME_PROFIL_SEME)) {
      if (!ecrits.has(nom)) {
        defauts.push(`I2d — le seed n'écrit pas child.${nom}, exigé par PRD-02.`);
      }
    }
  }

  if (colonnesExaminees === 0 || champsExamines === 0) {
    enregistrer("I2", "I2 — PRD-02 : aucun âge stockable sur child, quel que soit son nom",
      "schema.prisma : AUCUNE colonne lue",
      ["Le schéma n'a produit aucune colonne : l'instrument ne mesure rien."],
      { executable: false });
    return;
  }

  enregistrer(
    "I2",
    "I2 — PRD-02 : aucun âge stockable sur child, quel que soit son nom",
    `I2a ${champsChild.length} champs de child, ${Object.keys(CHAMPS_CHILD_NUMERIQUES_AUTORISES).length} numérique autorisé et justifié · I2b ${colonnesExaminees} colonnes de ${tables.size} tables contre ${attendu37.size} tables de la section 3.7 + ${Object.keys(AJOUTS_ARCHITECTURE).length} ajouts justifiés · I2c ${champsExamines} champs · I2d les ${Object.keys(FORME_PROFIL_SEME).length} champs du profil semé`,
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
      "I3",
      "I3 — PRD-16 : les clés d'erreur existent dans content/",
      "AUCUNE clé examinée",
      ["Aucun code ne déclare de clé : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I3",
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
      "I4",
      "I4 — raccordement : le texte lu est la jointure des parties",
      "AUCUNE variante examinée",
      ["Aucune variante trouvée : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I4",
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
      "I5",
      "I5 — table 7.0 : chaque clé est portée par la source déclarée",
      "AUCUNE clé examinée",
      ["La table 7.0 est vide : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  enregistrer(
    "I5",
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
      "I6",
      "I6 — G4.V6 : chaque cosmétique a son libellé et son seuil",
      "mascot.config.ts : AUCUNE cosmétique lue",
      ["Aucune cosmétique trouvée dans mascot.config.ts : l'instrument ne mesure rien."],
      { executable: false },
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
    "I6",
    "I6 — G4.V6 : chaque cosmétique a son libellé et son seuil",
    `${lignes.length} cosmétiques de mascot.config.ts, contre ${toutes.size} clés portées par content/`,
    defauts,
  );
}

// ---------------------------------------------------------------------------

i1();
i2();
i3();
i4();
i5();
i6();

const portes = portesDeclarees();
const porte = porteCourante(portes);

// La table d'affectation est elle-même contrôlée, avant tout le reste : une
// porte inventée, ou un invariant déplacé sans motif, désarmerait l'instrument
// en silence (ARB-18).
const defautsTable = verifierTableDesPortes(portes);

let echecsPorte = defautsTable.length;
let echecsAutrePorte = 0;
let partiels = 0;

const reportes = Object.entries(PORTE_PAR_INVARIANT).filter(
  ([, a]) => a.porte !== PORTE_COURANTE_PAR_DEFAUT,
);
if (reportes.length > 0) {
  // La table est IMPRIMÉE, motif compris, dès qu'un invariant est reporté.
  // ARB-18 veut qu'un désarmement ne puisse pas se faire en silence : le motif
  // doit donc se lire dans la sortie que le contrôleur regarde, pas seulement
  // dans le code source qu'il pourrait ne pas ouvrir.
  console.info("Invariants reportés sur une autre porte — table PORTE_PAR_INVARIANT :");
  for (const [cle, a] of reportes) {
    console.info(`  ${cle} -> ${a.porte} (${portes.get(a.porte) ?? "?"}) : ${a.motif}`);
  }
  console.info("");
}

if (defautsTable.length > 0) {
  console.info(`[ÉCHEC     ] Table PORTE_PAR_INVARIANT — affectation des invariants aux portes`);
  console.info(`          examiné : ${Object.keys(PORTE_PAR_INVARIANT).length} invariants contre ${portes.size} portes déclarées par docs/agents/GATES.md`);
  for (const d of defautsTable) console.info(`          DÉFAUT : ${d}`);
}

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
  // CORRIGÉ AU TOUR 3 — [MAJEUR] T2-1. Au tour 2, ce compteur était filtré par
  // `&& r.porte === porte` : un PARTIEL rattaché à une AUTRE porte n'était
  // compté nulle part, tombait dans `couverts`, et la synthèse concluait
  // « 0 partiels » deux écrans après avoir imprimé `[PARTIEL/G4.V1]`. Sous
  // `--porte=G4.V6`, l'instrument rendait 0 alors que TEC-13 n'avait mesuré
  // aucune valeur — et j'avais publié cette ligne comme preuve. Un PARTIEL est
  // un PARTIEL, quelle que soit la porte qui le porte.
  if (r.etat === "PARTIEL") partiels += 1;
}

const couverts = resultats.length - partiels - echecsPorte - echecsAutrePorte;
console.info(
  `\nPorte contrôlée : ${porte}. ${resultats.length} invariants : ${couverts} vérifiés entièrement, ${partiels} partiels (toutes portes), ${echecsPorte} en échec pour ${porte}, ${echecsAutrePorte} en échec pour une autre porte.`,
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
