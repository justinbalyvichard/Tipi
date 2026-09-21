/**
 * DES-05 — contrôle des contrastes, dans les deux thèmes.
 *
 * L'instrument ne recopie aucune couleur : il **lit `src/styles/themes.css`**,
 * résout les chaînes de `var()` pour chaque thème, puis évalue une liste de
 * couples déclarés. Recopier les hexadécimaux ici aurait produit une
 * re-dérivation — deux copies d'une même erreur seraient d'accord entre elles
 * (`40-protocole-agents.mdc`, « Invariant plutôt que re-dérivation »).
 *
 * Deux invariants sont vérifiés en plus des ratios :
 *   I1. Tout rôle de couleur déclaré dans `themes.css` est résolvable dans les
 *       DEUX thèmes. Un rôle défini d'un seul côté est un thème incomplet.
 *   I2. Tout rôle de couleur déclaré est employé par au moins un couple de la
 *       liste ci-dessous, ou explicitement inscrit comme non textuel. Un rôle
 *       déclaré et jamais employé est une couleur qui n'a jamais été mesurée.
 *
 * Usage : node scripts/verifier-contraste.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(racine, "src/styles/themes.css"), "utf8");

/** Découpe le fichier en blocs { sélecteur, déclarations }. */
function blocs(source) {
  const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(sansCommentaires)) !== null) {
    const selecteur = m[1].trim();
    const decls = {};
    for (const d of m[2].split(";")) {
      const i = d.indexOf(":");
      if (i === -1) continue;
      const cle = d.slice(0, i).trim();
      if (!cle.startsWith("--")) continue;
      decls[cle] = d.slice(i + 1).trim();
    }
    out.push({ selecteur, decls });
  }
  return out;
}

const tousBlocs = blocs(css);

/** Les déclarations visibles pour un thème donné, dans l'ordre de la cascade. */
function variablesDuTheme(theme) {
  const vars = {};
  for (const b of tousBlocs) {
    const s = b.selecteur;
    // `:root` couvre déjà le bloc « :root, [data-theme="pilou"] » : une
    // troisième branche pour ce cas était morte (constat 11 du tour 1).
    const concerne = s.includes(":root") || s.includes(`[data-theme="${theme}"]`);
    // Un bloc qui cible l'AUTRE thème est ignoré.
    const autre = theme === "pilou" ? "apple" : "pilou";
    if (s.includes(`[data-theme="${autre}"]`) && !s.includes(`[data-theme="${theme}"]`)) continue;
    if (!concerne) continue;
    Object.assign(vars, b.decls);
  }
  return vars;
}

/**
 * Résout `var(--x)` en cascade jusqu'à une valeur littérale.
 * Un `var(--x, repli)` est REJETÉ bruyamment : au tour 1 il aurait traversé
 * jusqu'au calcul de luminance et produit un `NaN:1` affiché, c'est-à-dire un
 * instrument qui imprime une absurdité sans la voir.
 */
function resoudre(vars, nom, profondeur = 0) {
  if (profondeur > 12) throw new Error(`Cycle de var() sur ${nom}`);
  const brut = vars[nom];
  if (brut === undefined) return undefined;
  const t = brut.trim();
  const m = /^var\((--[a-z0-9-]+)\)$/i.exec(t);
  if (m) return resoudre(vars, m[1], profondeur + 1);
  // Un `var()` SEUL dont la forme n'est pas `var(--x)` — donc `var(--x, repli)`
  // — est rejeté. Une pile de polices comme `var(--police-baloo), "Baloo 2",
  // system-ui` n'est PAS un var() seul : elle traverse sans bruit, et c'est
  // voulu, ce n'est pas une couleur. Le durcissement demandé visait le repli
  // qui aurait produit un `NaN:1` affiché sans être vu ; il ne vise pas les
  // valeurs composées.
  if (/^var\([^)]*\)$/.test(t)) {
    throw new Error(
      `Forme de var() non gérée sur ${nom} : ${t}. Un repli masquerait la valeur réellement rendue.`
    );
  }
  return t;
}

// ---------------------------------------------------------------- WCAG 2.1
const composantes = (hex) => {
  const s = hex.replace("#", "");
  const n = s.length === 3 ? [...s].map((c) => c + c) : [s.slice(0, 2), s.slice(2, 4), s.slice(4, 6)];
  return n.map((p) => parseInt(p, 16) / 255);
};
const luminance = (hex) =>
  composantes(hex)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const [h, l] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (h + 0.05) / (l + 0.05);
};
/** Tronqué vers le bas : un arrondi ne fait jamais passer un couple. */
const tronque = (r) => Math.floor(r * 100) / 100;

/**
 * Les couples RÉELLEMENT livrés, un par usage, avec le composant qui le porte.
 * `taille` : "petit" → seuil 4,5:1 ; "grand" → 3:1 (≥ 24 px, ou ≥ 18,66 px en
 * graisse 700 — c'est le cas de `text-action` et `text-titre`) ; "nonTexte"
 * → 3:1 (WCAG 1.4.11) ; "decor" → aucun seuil, élément purement décoratif.
 */
const COUPLES = [
  ["texte de page", "--tipi-encre", "--tipi-fond", "petit", "toutes les pages"],
  ["texte sur carte", "--tipi-encre", "--tipi-surface", "petit", "Card, SpeechBubble, ListRow"],
  ["sous-titre de liste", "--tipi-texte-appui", "--tipi-surface", "petit", "ListRow, ThemeSwitch"],
  // Constat 3 du tour 1 : ce couple est rendu par l'option RETENUE de
  // ThemeSwitch, dont le fond passe en teinte bleue. Il manquait à la liste —
  // la démonstration que cette liste dérive du rendu. C'est ce défaut de
  // conception que `verifier-contraste-rendu.mjs` supprime.
  ["sous-titre ThemeSwitch, option retenue", "--tipi-texte-appui", "--tipi-teinte-bleu", "petit", "ThemeSwitch"],
  ["légende sur fond", "--tipi-texte-appui", "--tipi-fond", "petit", "Bloc de /dev/design-system"],
  ["Button primaire", "--tipi-accent-primaire-encre", "--tipi-accent-primaire", "grand", "Button"],
  ["Button secondaire", "--tipi-encre", "--tipi-teinte-bleu", "petit", "Button"],
  ["Button texte sur fond", "--tipi-texte-secondaire", "--tipi-fond", "grand", "Button"],
  ["Button texte sur carte", "--tipi-texte-secondaire", "--tipi-surface", "grand", "Button"],
  ["Chip bleu", "--tipi-encre", "--tipi-teinte-bleu", "petit", "Chip, Card"],
  ["Chip corail", "--tipi-encre", "--tipi-teinte-corail", "petit", "Chip, Card"],
  ["Chip jaune", "--tipi-encre", "--tipi-teinte-jaune", "petit", "Chip, Card"],
  ["Chip menthe", "--tipi-encre", "--tipi-teinte-menthe", "petit", "Chip, Card"],
  ["Chip neutre", "--tipi-encre", "--tipi-surface", "petit", "Chip"],
  ["GemCounter", "--tipi-encre", "--tipi-accent-pierre", "petit", "GemCounter"],
  ["Keypad, chiffre", "--tipi-encre", "--tipi-surface", "petit", "Keypad"],
  ["badge ListRow primaire", "--tipi-accent-primaire-encre", "--tipi-accent-primaire", "nonTexte", "ListRow"],
  ["badge ListRow secondaire", "--tipi-encre", "--tipi-accent-secondaire", "nonTexte", "ListRow"],
  ["badge ListRow tertiaire", "--tipi-encre", "--tipi-accent-tertiaire", "nonTexte", "ListRow"],
  ["icône au trait sur carte", "--tipi-encre", "--tipi-surface", "nonTexte", "Icon"],
  ["icône au trait sur fond", "--tipi-encre", "--tipi-fond", "nonTexte", "Icon"],
  ["contour ProgressDots", "--tipi-texte-secondaire", "--tipi-fond", "nonTexte", "ProgressDots"],
  ["contour Keypad", "--tipi-texte-secondaire", "--tipi-surface", "nonTexte", "Keypad"],
  ["points PilouReflechit", "--tipi-texte-secondaire", "--tipi-fond", "nonTexte", "PilouReflechit"],
  ["anneau de focus", "--tipi-encre", "--tipi-fond", "nonTexte", "themes.css, :focus-visible"],
  ["option retenue ThemeSwitch", "--tipi-encre", "--tipi-teinte-bleu", "nonTexte", "ThemeSwitch"],
  ["trait de Pilou sur fond", "--pilou-trait-couleur", "--tipi-fond", "nonTexte", "Pilou"],
  ["trait de Pilou sur son corps", "--pilou-trait-couleur", "--pilou-corps", "nonTexte", "Pilou"],
  ["museau de Pilou", "--pilou-museau", "--pilou-ventre", "nonTexte", "Pilou"],
  // Les formes cosmétiques sont CERNÉES par le trait d'encre du groupe SVG :
  // c'est le trait, et non le remplissage, qui rend la forme perceptible. On
  // mesure donc le trait contre le remplissage. Le ratio du remplissage seul
  // contre le corps reste publié plus bas, en mesure de référence, pour que
  // rien ne soit effacé par ce choix de couple.
  ["trait autour du cosmétique", "--pilou-trait-couleur", "--pilou-cosmetique", "nonTexte", "Pilou"],
  ["trait autour du cosmétique 2", "--pilou-trait-couleur", "--pilou-cosmetique-2", "nonTexte", "Pilou"],
  // Décoratifs : filets et chevrons. WCAG 1.4.11 ne les vise pas — ils ne
  // portent aucune information que le libellé de la ligne ne porte déjà.
  // Les joues de Pilou sont un fard : elles n'ont pas de contour et ne portent
  // aucune information. Les retirer ne change rien à ce que l'écran dit.
  ["joues de Pilou", "--pilou-joue", "--pilou-corps", "decor", "Pilou"],
  ["filet de séparation", "--tipi-ligne", "--tipi-surface", "decor", "ListGroup, Chip"],
  ["chevron de ListRow", "--tipi-pointille", "--tipi-surface", "decor", "ListRow"],
  ["silhouette de cosmétique", "--pilou-silhouette", "--tipi-fond", "nonTexte", "Pilou"],
];

/**
 * MESURES DE RÉFÉRENCE — couples qu'aucun composant livré ne produit, mesurés
 * et publiés quand même. Elles ne comptent pas dans le verdict, parce qu'elles
 * ne sont pas livrées ; elles sont là pour que la règle d'emploi de chaque
 * jeton soit vérifiable, et pour qu'un choix de couple ne serve pas à effacer
 * un chiffre gênant. Le contrôle 8 de `verifier-design-system.sh` prouve que
 * la colonne « porté par » dit vrai.
 */
const REFERENCES = [
  ["texte discret sur fond", "--tipi-texte-discret", "--tipi-fond", 4.5, "réservé au grand texte ; aucun composant livré ne l'emploie"],
  ["texte secondaire en petit texte", "--tipi-texte-secondaire", "--tipi-surface", 4.5, "interdit en petit texte ; c'est ce chiffre qui motive la décision DS-1"],
  ["remplissage du cosmétique sur le corps", "--pilou-cosmetique", "--pilou-corps", 3, "mesure d'origine, avant de mesurer le trait qui cerne la forme"],
  ["remplissage du cosmétique 2 sur le corps", "--pilou-cosmetique-2", "--pilou-corps", 3, "mesure d'origine, avant de mesurer le trait qui cerne la forme"],
  ["blanc sur accent primaire, en petit texte", "--tipi-accent-primaire-encre", "--tipi-accent-primaire", 4.5, "c'est ce chiffre qui impose text-action en graisse 700"],
];

const SEUILS = { petit: 4.5, grand: 3, nonTexte: 3, decor: 0 };
const THEMES = ["pilou", "apple"];

let echecs = 0;
const lignes = [];
const rolesEmployes = new Set();

for (const theme of THEMES) {
  const vars = variablesDuTheme(theme);
  for (const [usage, fg, bg, taille, porteur] of COUPLES) {
    rolesEmployes.add(fg);
    rolesEmployes.add(bg);
    const vfg = resoudre(vars, fg);
    const vbg = resoudre(vars, bg);
    if (vfg === undefined || vbg === undefined) {
      lignes.push(`| ${theme} | ${usage} | ${fg} | ${bg} | — | — | ROLE NON RESOLU |`);
      echecs += 1;
      continue;
    }
    const r = tronque(ratio(vfg, vbg));
    const seuil = SEUILS[taille];
    const ok = r >= seuil;
    if (!ok) echecs += 1;
    lignes.push(
      `| ${theme} | ${usage} | ${fg} ${vfg} | ${bg} ${vbg} | ${r.toFixed(2)}:1 | ${
        seuil === 0 ? "décoratif" : `${seuil}:1 (${taille})`
      } | ${ok ? "OK" : "SOUS LE SEUIL"} | ${porteur} |`
    );
  }
}

console.log("| Thème | Usage | Avant-plan | Fond | Ratio | Seuil | Verdict | Porté par |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const l of lignes) console.log(l);

console.log("\n| Thème | MESURE DE RÉFÉRENCE (non livrée) | Avant-plan | Fond | Ratio | Repère | Motif |");
console.log("| --- | --- | --- | --- | --- | --- | --- |");
for (const theme of THEMES) {
  const vars = variablesDuTheme(theme);
  for (const [usage, fg, bg, repere, motif] of REFERENCES) {
    rolesEmployes.add(fg);
    rolesEmployes.add(bg);
    const r = tronque(ratio(resoudre(vars, fg), resoudre(vars, bg)));
    console.log(`| ${theme} | ${usage} | ${fg} | ${bg} | ${r.toFixed(2)}:1 | ${repere}:1 | ${motif} |`);
  }
}

// -------- I1 : tout rôle résolvable dans les deux thèmes
const varsPilou = variablesDuTheme("pilou");
const varsApple = variablesDuTheme("apple");
const rolesDeclares = Object.keys(varsPilou).filter(
  (k) => (k.startsWith("--tipi-") || k.startsWith("--pilou-")) && /^#|var\(/.test(varsPilou[k])
);
const manquantsApple = rolesDeclares.filter((k) => resoudre(varsApple, k) === undefined);

// -------- I2 : tout rôle de couleur employé par au moins un couple
const rolesCouleur = rolesDeclares.filter((k) => {
  const v = resoudre(varsPilou, k);
  return typeof v === "string" && v.startsWith("#");
});
const jamaisEmployes = rolesCouleur.filter((k) => !rolesEmployes.has(k));

console.log(`\nCouples mesurés : ${lignes.length} (${COUPLES.length} par thème, ${THEMES.length} thèmes).`);
console.log(`Couples sous leur seuil : ${echecs}.`);
console.log(`I1 — rôles déclarés côté Pilou : ${rolesDeclares.length} ; non résolus côté Apple : ${manquantsApple.length}${manquantsApple.length ? " -> " + manquantsApple.join(", ") : ""}`);
console.log(`I2 — rôles de couleur : ${rolesCouleur.length} ; jamais mesurés : ${jamaisEmployes.length}${jamaisEmployes.length ? " -> " + jamaisEmployes.join(", ") : ""}`);

// -------- I3 : toute entrée de palette est soit reliée à un rôle, soit
// déclarée ici comme présente pour la seule conformité à DES-01/DES-02.
// Constat 10 du tour 1 : I2 porte sur les RÔLES et ne voyait pas les entrées
// de palette orphelines. Le rapport présentait pourtant I2 comme la garantie
// qu'aucune couleur n'échappe à la mesure. I3 comble exactement cet écart.
const PALETTE_SANS_ROLE_ASSUMEE = [
  "--palette-apple-accent-rouge",
  "--palette-apple-accent-gris",
];
const entreesPalette = Object.keys(varsPilou)
  .concat(Object.keys(varsApple))
  .filter((k) => k.startsWith("--palette-"));
const entreesUniques = [...new Set(entreesPalette)];
const valeursDeRole = new Set(
  rolesDeclares.map((k) => (varsPilou[k] ?? "").trim()).concat(rolesDeclares.map((k) => (varsApple[k] ?? "").trim()))
);
const orphelines = entreesUniques.filter((k) => !valeursDeRole.has(`var(${k})`));
const orphelinesNonDeclarees = orphelines.filter((k) => !PALETTE_SANS_ROLE_ASSUMEE.includes(k));
console.log(
  `I3 — entrées de palette : ${entreesUniques.length} ; sans rôle : ${orphelines.length} (${orphelines.join(", ") || "aucune"}) ; sans rôle ET non déclarées : ${orphelinesNonDeclarees.length}`
);
console.log(
  "     Les entrées sans rôle sont présentes parce que DES-01/DES-02 exigent les tokens EXACTS de 3.8 ; aucun composant ne peut les atteindre, et c'est écrit plutôt que subi."
);

const total = echecs + manquantsApple.length + jamaisEmployes.length + orphelinesNonDeclarees.length;
console.log(`\n=== VERDICT DE L INSTRUMENT : ${total === 0 ? "OK" : "ECHEC"} ===`);
process.exit(total === 0 ? 0 : 1);
