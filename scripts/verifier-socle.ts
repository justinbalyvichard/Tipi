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

interface Resultat {
  readonly nom: string;
  readonly etat: Etat;
  readonly examine: string;
  readonly defauts: readonly string[];
  /** Ce que ce passage n'a pas pu mesurer. Vide si la couverture est entière. */
  readonly nonMesure: string | null;
}

const resultats: Resultat[] = [];

function enregistrer(
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
  resultats.push({ nom, etat, examine, defauts, nonMesure });
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
// I2 — PRD-02 : l'âge n'est stocké nulle part
// ---------------------------------------------------------------------------
// Invariant STRUCTUREL, et c'est ce qui le rend fort : il ne vérifie pas que
// le calcul d'âge est juste (c'est le rôle du test), il vérifie qu'aucun
// endroit où loger un âge n'existe. Une colonne `age` rendrait possible la
// faute que PRD-02 nomme, et serait fausse chaque 29 novembre au soir.

function i2(): void {
  const schema = readFileSync(join(RACINE, "prisma", "schema.prisma"), "utf8");
  const defauts: string[] = [];

  const modeles = [...schema.matchAll(/model\s+(\w+)\s*\{([^}]*)\}/gu)];
  let champsExamines = 0;
  for (const modele of modeles) {
    const nom = modele[1] ?? "";
    const corps = modele[2] ?? "";
    for (const ligne of corps.split("\n")) {
      const champ = /^\s*(\w+)\s+\w/u.exec(ligne);
      if (champ?.[1] === undefined) continue;
      champsExamines += 1;
      if (/^age|[Aa]ge$/u.test(champ[1])) {
        defauts.push(`${nom}.${champ[1]} : le modèle expose un champ d'âge (PRD-02).`);
      }
    }
  }
  if (champsExamines === 0) {
    enregistrer(
      "I2 — PRD-02 : aucun âge stocké",
      "schema.prisma : AUCUN champ lu",
      ["Le schéma n'a produit aucun champ : l'instrument ne mesure rien."],
      { executable: false },
    );
    return;
  }

  const seed = readFileSync(join(RACINE, "prisma", "seed.ts"), "utf8");
  if (/\bage\s*:/iu.test(seed)) {
    defauts.push("prisma/seed.ts écrit un champ `age` (PRD-02).");
  }

  enregistrer(
    "I2 — PRD-02 : aucun âge stocké",
    `${modeles.length} modèles, ${champsExamines} champs de prisma/schema.prisma + prisma/seed.ts`,
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

i1();
i2();
i3();
i4();
i5();

let echecs = 0;
let partiels = 0;
for (const r of resultats) {
  console.info(`[${r.etat.padEnd(7)}] ${r.nom}`);
  console.info(`          examiné : ${r.examine}`);
  for (const d of r.defauts) console.info(`          DÉFAUT : ${d}`);
  if (r.nonMesure !== null) console.info(`          NON MESURÉ : ${r.nonMesure}`);
  if (r.etat === "ÉCHEC") echecs += 1;
  if (r.etat === "PARTIEL") partiels += 1;
}
const couverts = resultats.length - partiels - echecs;
console.info(
  `\n${resultats.length} invariants : ${couverts} vérifiés entièrement, ${partiels} partiels, ${echecs} en échec.`,
);
process.exitCode = echecs === 0 ? 0 : 1;
