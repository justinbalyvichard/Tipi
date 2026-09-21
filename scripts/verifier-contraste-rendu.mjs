/**
 * DES-05 — contraste mesuré SUR LE RENDU, et non sur une liste écrite à la main.
 *
 * ------------------------------------------------------------------------
 * POURQUOI CE SECOND INSTRUMENT EXISTE
 * ------------------------------------------------------------------------
 * `verifier-contraste.mjs` avait coupé le cordon avec les couleurs — il lit
 * `themes.css` et résout les `var()` — mais pas avec **l'intention du
 * producteur sur ce que la page dessine** : sa liste de 34 couples était
 * écrite à la main. Il vérifiait donc l'arithmétique de 34 affirmations, pas
 * le rendu. Le tour 1 l'a payé : il a imprimé une ligne verte à 6,57:1 pour un
 * trait d'encre que la variante `lunettes` ne traçait pas, alors que la
 * monture réelle était à 2,05:1. C'est le cas exact de la règle 5 du
 * protocole — « un instrument qui affiche le défaut sans le voir est pire
 * qu'un instrument muet ».
 *
 * L'invariant tenu ici, et qui manquait :
 *
 *   **Toute couleur calculée par le navigateur pour un texte ou un tracé,
 *   contre son fond effectif, est mesurée.**
 *
 * Il n'y a donc plus de liste : l'instrument énumère le DOM rendu. Une forme
 * nouvelle est mesurée par construction, sans que personne pense à l'inscrire.
 *
 * ------------------------------------------------------------------------
 * LA SEULE PORTE DE SORTIE, ET ELLE EST EXPLICITE
 * ------------------------------------------------------------------------
 * Un élément n'échappe à la mesure que s'il porte `data-tipi-decor`, ou se
 * trouve sous un ancêtre qui le porte. Ces éléments sont **mesurés et publiés
 * quand même**, avec leur ratio et le motif : l'exemption est visible, jamais
 * silencieuse. Par défaut, tout est mesuré.
 *
 * Règle appliquée aux tracés SVG : une forme est perceptible si **son trait
 * OU son remplissage** atteint 3:1 contre le fond effectif. C'est la règle du
 * dessin de Pilou — une forme colorée peu contrastée est acceptable *parce
 * qu'elle est cernée par le trait d'encre*, et inacceptable dès que ce trait
 * disparaît. C'est cette règle qui attrape `lunettes` toute seule.
 *
 * Règle appliquée au texte : seuil WCAG 2.1 SC 1.4.3 — 4,5:1, ramené à 3:1
 * pour le grand texte (≥ 24 px, ou ≥ 18,66 px en graisse ≥ 700). Les
 * composants **désactivés** sont exemptés par la norme elle-même ; ils sont
 * mesurés et publiés à part, jamais tus.
 *
 * ------------------------------------------------------------------------
 * USAGE
 * ------------------------------------------------------------------------
 *   pnpm build && pnpm start -p 3210 &
 *   npm install --no-save --prefix /tmp/tipi-pw playwright@1.50.1
 *   NODE_PATH=/tmp/tipi-pw/node_modules node scripts/verifier-contraste-rendu.mjs
 *
 * Playwright n'est volontairement PAS dans `package.json` : l'architecture
 * (§15.1) le réserve à la phase P6. Il est résolu depuis une installation
 * externe, via `NODE_PATH`.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error(
    [
      "playwright introuvable. Cet instrument mesure le RENDU : il lui faut un navigateur.",
      "Playwright n'est pas une dépendance du projet (réservé à P6, architecture §15.1).",
      "",
      "  npm install --no-save --prefix /tmp/tipi-pw playwright@1.50.1",
      "  NODE_PATH=/tmp/tipi-pw/node_modules node scripts/verifier-contraste-rendu.mjs",
    ].join("\n")
  );
  process.exit(2);
}

const URL_PAGE = process.env.TIPI_URL ?? "http://127.0.0.1:3210/dev/design-system";

/** Relevé dans la page : aucune couleur n'est décidée ici, tout est calculé. */
const RELEVE = () => {
  const estTransparent = (c) =>
    !c || c === "transparent" || c === "none" || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c);

  const rgb = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };

  /** Opacité cumulée de l'élément et de ses ancêtres. */
  const opaciteCumulee = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const v = parseFloat(getComputedStyle(n).opacity);
      if (!Number.isNaN(v)) o *= v;
    }
    return o;
  };

  /** Premier fond non transparent en remontant les ancêtres. */
  const fondEffectif = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (!estTransparent(bg)) {
        const c = rgb(bg);
        if (c && c.a > 0.99) return c;
      }
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const composer = (avant, fond, alpha) => ({
    r: avant.r * alpha + fond.r * (1 - alpha),
    g: avant.g * alpha + fond.g * (1 - alpha),
    b: avant.b * alpha + fond.b * (1 - alpha),
  });

  const theme = (el) => {
    const n = el.closest("[data-theme]");
    return n ? n.getAttribute("data-theme") : "?";
  };

  const decor = (el) => {
    const n = el.closest("[data-tipi-decor]");
    return n ? n.getAttribute("data-tipi-decor") : null;
  };

  const desactive = (el) => el.closest("[disabled], :disabled, [aria-disabled='true']") !== null;

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };

  const textes = [];
  const traces = [];

  // ---- A. TEXTE : tout élément portant un nœud de texte non vide.
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg")) continue;
    const propre = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!propre || !visible(el)) continue;
    const s = getComputedStyle(el);
    const c = rgb(s.color);
    if (!c) continue;
    const fond = fondEffectif(el);
    const alpha = c.a * opaciteCumulee(el);
    textes.push({
      theme: theme(el),
      extrait: propre.slice(0, 34),
      px: parseFloat(s.fontSize),
      poids: parseInt(s.fontWeight, 10) || 400,
      avant: composer(c, fond, alpha),
      avantBrut: s.color,
      alpha: Math.round(alpha * 100) / 100,
      fond,
      fondBrut: `rgb(${fond.r}, ${fond.g}, ${fond.b})`,
      desactive: desactive(el),
      decor: decor(el),
    });
  }

  // ---- B. TRACÉS SVG : toute forme dessinée.
  for (const el of document.querySelectorAll(
    "svg path, svg circle, svg rect, svg ellipse, svg line, svg polygon, svg polyline"
  )) {
    const svg = el.closest("svg");
    if (!svg || !visible(svg)) continue;
    const s = getComputedStyle(el);
    const fond = fondEffectif(svg.parentElement ?? svg);
    const alpha = opaciteCumulee(el);
    const trait = estTransparent(s.stroke) ? null : rgb(s.stroke);
    const remplissage = estTransparent(s.fill) ? null : rgb(s.fill);
    if (!trait && !remplissage) continue;
    traces.push({
      theme: theme(el),
      svg: svg.getAttribute("viewBox") === "0 0 160 160" ? "Pilou" : "Icon",
      balise: el.tagName.toLowerCase(),
      trait: trait ? composer(trait, fond, trait.a * alpha) : null,
      traitBrut: trait ? s.stroke : "none",
      remplissage: remplissage ? composer(remplissage, fond, remplissage.a * alpha) : null,
      remplissageBrut: remplissage ? s.fill : "none",
      fond,
      fondBrut: `rgb(${fond.r}, ${fond.g}, ${fond.b})`,
      desactive: desactive(el),
      decor: decor(el),
    });
  }

  const marques = document.querySelectorAll("[data-tipi-decor]").length;
  const svgs = Array.from(document.querySelectorAll("svg"));
  const empreinte = {
    elements: document.querySelectorAll("body *").length,
    pilou: svgs.filter((s2) => s2.getAttribute("viewBox") === "0 0 160 160").length,
    icones: svgs.filter((s2) => s2.getAttribute("viewBox") === "0 0 24 24").length,
  };
  return { textes, traces, marques, empreinte };
};

// ------------------------------------------------------------------ WCAG 2.1
const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const ratio = (a, b) => {
  const [h, l] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (h + 0.05) / (l + 0.05);
};
/** Tronqué vers le bas : un arrondi ne fait jamais passer un couple. */
const tronque = (r) => Math.floor(r * 100) / 100;
const grandTexte = (px, poids) => px >= 24 || (px >= 18.66 && poids >= 700);

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(URL_PAGE, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const { textes, traces, marques, empreinte } = await page.evaluate(RELEVE);
await navigateur.close();

// -------------------------------------------------------------------------
// GARDE — un instrument qui ne mesure rien ne doit JAMAIS conclure « OK ».
//
// Écrit après un incident réel, publié dans le rapport : un serveur d'une
// version antérieure était resté lié au port, le nouveau n'a pas pu s'y lier,
// et l'instrument a d'abord imprimé « Textes mesurés : 0 ... VERDICT : OK »,
// puis a mesuré la MAUVAISE version sans rien signaler. C'est la règle 4 du
// protocole — « un détecteur qui ne trouve plus rien est suspect jusqu'à
// preuve du contraire » — et la règle 5, une preuve verte sans rien voir.
//
// L'empreinte ci-dessous est imprimée à chaque passage : elle dit QUELLE page
// a été mesurée, pas seulement combien de couples y étaient.
console.log("## Empreinte de la page mesurée\n");
console.log(`URL : ${URL_PAGE}`);
console.log(
  `Éléments : ${empreinte.elements} · SVG Pilou : ${empreinte.pilou} · SVG icône : ${empreinte.icones} · marqués \`data-tipi-decor\` : ${marques}`
);
console.log(`Textes relevés : ${textes.length} · formes relevées : ${traces.length}\n`);

// La garde répond à UNE question : « a-t-on mesuré une vraie page ? ».
// Elle ne répond pas à « est-ce la bonne version ? » — c'est l'empreinte
// ci-dessus qui le dit, et c'est un humain qui la lit. Confondre les deux
// empêcherait de rejouer l'instrument sur une version antérieure, ce que la
// règle 1 de « Corriger un instrument de mesure » demande précisément.
const PLANCHERS = { textes: 60, traces: 300, pilou: 20 };
const sousPlancher = [];
if (textes.length < PLANCHERS.textes) sousPlancher.push(`textes ${textes.length} < ${PLANCHERS.textes}`);
if (traces.length < PLANCHERS.traces) sousPlancher.push(`formes ${traces.length} < ${PLANCHERS.traces}`);
if (empreinte.pilou < PLANCHERS.pilou) sousPlancher.push(`SVG Pilou ${empreinte.pilou} < ${PLANCHERS.pilou}`);
if (sousPlancher.length > 0) {
  console.error(
    [
      "",
      "=== RELEVÉ INVRAISEMBLABLE — L INSTRUMENT REFUSE DE CONCLURE ===",
      ...sousPlancher.map((l) => `  ${l}`),
      "",
      "La page mesurée n'est pas celle attendue : serveur d'une version",
      "antérieure resté lié au port, page non hydratée, ou mauvaise URL.",
      "Relancer après `pkill -f next-server` et une reconstruction.",
    ].join("\n")
  );
  process.exit(3);
}

let echecs = 0;
const exemptes = [];

console.log("## A. Texte — couleur calculée contre fond effectif\n");
console.log("| # | Thème | Extrait | px | poids | Seuil | Avant-plan | Fond | Ratio | Verdict |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
let i = 0;
for (const t of textes) {
  const seuil = grandTexte(t.px, t.poids) ? 3 : 4.5;
  const r = tronque(ratio(t.avant, t.fond));
  if (t.desactive) {
    exemptes.push({ quoi: `texte « ${t.extrait} »`, theme: t.theme, r, motif: "composant désactivé — exempté par WCAG 2.1 SC 1.4.3" });
    continue;
  }
  if (t.decor) {
    exemptes.push({ quoi: `texte « ${t.extrait} »`, theme: t.theme, r, motif: `data-tipi-decor="${t.decor}"` });
    continue;
  }
  i += 1;
  const ok = r >= seuil;
  if (!ok) echecs += 1;
  console.log(
    `| ${i} | ${t.theme} | ${t.extrait} | ${t.px} | ${t.poids} | ${seuil}:1 | ${t.avantBrut}${t.alpha < 1 ? ` @${t.alpha}` : ""} | ${t.fondBrut} | ${r.toFixed(2)}:1 | ${ok ? "OK" : "*** SOUS SEUIL ***"} |`
  );
}

console.log("\n## B. Tracés SVG — trait OU remplissage doit atteindre 3:1\n");
console.log("| # | Thème | SVG | Balise | Trait | r(trait) | Remplissage | r(rempl.) | Fond | Meilleur | Verdict |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
let j = 0;
// Les tracés identiques (même trait, même remplissage, même fond, même SVG)
// sont regroupés : 81 SVG produisent des centaines de formes, et une ligne par
// cercle n'apprend rien. Le regroupement ne masque rien — une forme au ratio
// différent produit sa propre ligne.
const clef = (t) =>
  `${t.theme}|${t.svg}|${t.traitBrut}|${t.remplissageBrut}|${t.fondBrut}|${t.decor ?? ""}|${t.desactive}`;
const groupes = new Map();
for (const t of traces) {
  const k = clef(t);
  const g = groupes.get(k);
  if (g) g.n += 1;
  else groupes.set(k, { ...t, n: 1 });
}
for (const t of groupes.values()) {
  const rT = t.trait ? tronque(ratio(t.trait, t.fond)) : null;
  const rR = t.remplissage ? tronque(ratio(t.remplissage, t.fond)) : null;
  const meilleur = Math.max(rT ?? 0, rR ?? 0);
  if (t.desactive) {
    // Même exemption normative que pour le texte : WCAG 2.1 SC 1.4.3 met les
    // composants d'interface inactifs hors de son champ. L'appliquer au texte
    // et pas aux tracés était une incohérence de l'instrument, pas une
    // indulgence : le ratio reste mesuré et publié.
    exemptes.push({ quoi: `${t.n}× ${t.balise} de ${t.svg}`, theme: t.theme, r: meilleur, motif: "composant désactivé — exempté par WCAG 2.1 SC 1.4.3" });
    continue;
  }
  if (t.decor) {
    exemptes.push({ quoi: `${t.n}× ${t.balise} de ${t.svg}`, theme: t.theme, r: meilleur, motif: `data-tipi-decor="${t.decor}"` });
    continue;
  }
  j += 1;
  const ok = meilleur >= 3;
  if (!ok) echecs += 1;
  console.log(
    `| ${j} | ${t.theme} | ${t.svg} | ${t.n}× ${t.balise} | ${t.traitBrut} | ${rT === null ? "—" : rT.toFixed(2)} | ${t.remplissageBrut} | ${rR === null ? "—" : rR.toFixed(2)} | ${t.fondBrut} | ${meilleur.toFixed(2)}:1 | ${ok ? "OK" : "*** SOUS SEUIL ***"} |`
  );
}

console.log("\n## C. Exemptions — mesurées et publiées, jamais tues\n");
console.log("| Thème | Élément | Ratio mesuré | Motif |");
console.log("| --- | --- | --- | --- |");
for (const e of exemptes) {
  console.log(`| ${e.theme} | ${e.quoi} | ${e.r.toFixed(2)}:1 | ${e.motif} |`);
}

const exemptionsDecor = exemptes.filter((e) => e.motif.startsWith("data-tipi-decor"));
const exemptionsNorme = exemptes.filter((e) => !e.motif.startsWith("data-tipi-decor"));

console.log(`\nTextes mesurés : ${i}. Groupes de tracés mesurés : ${j} (${traces.length} formes).`);
console.log(`Sous leur seuil : ${echecs}.`);
console.log(
  `Exemptions : ${exemptionsDecor.length} par \`data-tipi-decor\` (${marques} éléments marqués dans le DOM), ${exemptionsNorme.length} par WCAG 1.4.3 (désactivés).`
);
console.log(
  "Invariant tenu : aucune liste de couples n'existe dans cet instrument — les couples sont énumérés depuis le DOM rendu."
);
console.log(
  "Limites déclarées : les bordures CSS (filets de liste, contours des ProgressDots et du Keypad) ne sont ni du texte ni un tracé SVG et ne sont pas couvertes ici — elles le sont par `verifier-contraste.mjs`. Le fond effectif d'une forme SVG est le fond CSS de son conteneur, jamais la forme voisine dessinée dessous."
);

console.log(`\n=== VERDICT DE L INSTRUMENT : ${echecs === 0 ? "OK" : "ECHEC"} ===`);
process.exit(echecs === 0 ? 0 : 1);
