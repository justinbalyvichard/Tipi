import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  IdentifiantsInterdits,
  PayloadIa,
  TexteAnonymise,
  assertCorpsDerivable,
  defautsDeDerivabilite,
  type CorpsIa,
} from "@/lib/ai/anonymisation";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";
import {
  NEUTRE_LEGITIME,
  REFUSENT_LE_NEUTRE,
  SANS_VALEUR_NEUTRE,
  env,
  reinitialiserEnvPourTest,
} from "@/config/env";
import { reinitialiserSeuilsPourTest, seuils } from "@/config/seuils.config";

/**
 * LE CATALOGUE DES NEUTRALISATIONS — tour 3, [MAJEUR] M5 généralisé.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS `src/lib/ai/`
 * ---------------------------------------------------------------------------
 * `controle-code` a neutralisé le caviardage de SEC-04 non pas en le
 * contournant, mais en lui passant une liste d'interdits **vide** : la fonction
 * a tourné, elle n'avait rien à retirer, et `tsc`, le lint, 135 tests et six
 * contrôles sont restés verts pendant que le prénom partait sur le réseau.
 *
 * L'Orchestrateur a demandé de chercher **la même faute ailleurs** plutôt que
 * de corriger seulement celle-ci. Ce fichier est le résultat : un test par
 * valeur dont la neutralité éteindrait une garde, et un test pour la seule
 * valeur neutre qui soit **légitime**, nommée comme telle.
 *
 * Il vit dans `src/config/` parce que c'est de configuration qu'il s'agit, et
 * qu'il couvre trois modules à la fois — `env.ts`, `seuils.config.ts`,
 * `anonymisation.ts`. Les verticales qui suivent y ajouteront leurs lignes :
 * **toute valeur dont le zéro, le vide ou l'absence rend une garde inopérante
 * doit avoir son cas ici.**
 */

/**
 * Nom de modèle témoin : ce fichier ne nomme aucun fournisseur (TEC-17, C1,
 * qui vaut pour TOUT fichier de `src/`, tests compris).
 */
const MODELE_TEMOIN = "modele-texte";

/** Les six variables critiques, valeurs inoffensives : aucun compte n'existe. */
const BASE: Readonly<Record<string, string>> = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DIRECT_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "https://test.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  PARENT_SESSION_SECRET: "test-parent-session-secret",
  CRON_SECRET: "test-cron-secret",
};

const POSEES: string[] = [];

function poser(variables: Readonly<Record<string, string>>): void {
  for (const [nom, valeur] of Object.entries({ ...BASE, ...variables })) {
    process.env[nom] = valeur;
    POSEES.push(nom);
  }
  reinitialiserEnvPourTest();
  reinitialiserSeuilsPourTest();
}

beforeEach(() => {
  POSEES.length = 0;
});

afterEach(() => {
  for (const nom of POSEES) delete process.env[nom];
  reinitialiserEnvPourTest();
  reinitialiserSeuilsPourTest();
});

// ---------------------------------------------------------------------------
// 1. La neutralisation exacte du contrôleur
// ---------------------------------------------------------------------------

describe("M5 — la liste d'identifiants interdits", () => {
  it("REFUSE une liste vide : un caviardage sans rien à retirer n'en est pas un", () => {
    expect(() => IdentifiantsInterdits.sceller([])).toThrow();
  });

  it("REFUSE une liste entièrement blanche, qui est une liste vide déguisée", () => {
    expect(() => IdentifiantsInterdits.sceller(["", "   ", "\t"])).toThrow();
  });

  it("ACCEPTE un foyer réel, et gèle ses valeurs", () => {
    const scelle = IdentifiantsInterdits.sceller(["Evan", "  Le Goff  "]);
    expect(scelle.valeurs).toEqual(["Evan", "Le Goff"]);
    expect(scelle.estScelle()).toBe(true);
    expect(Object.isFrozen(scelle.valeurs)).toBe(true);
  });

  it("n'expose qu'UNE fabrique : `sceller`", () => {
    // La garantie principale est de compilation — aucun objet littéral n'est
    // assignable. Ce test fixe la propriété observable qui l'accompagne.
    const fabriques = Object.getOwnPropertyNames(IdentifiantsInterdits).filter(
      (n) => !["length", "name", "prototype"].includes(n),
    );
    expect(fabriques).toEqual(["sceller"]);
  });

  it("le caviardage reste inopérant si la liste est vide — donc il ne doit jamais l'être", () => {
    // La démonstration de la faute, gardée comme témoin : c'est bien la LISTE
    // qui portait la garantie, pas la fonction.
    const scelle = IdentifiantsInterdits.sceller(["Zzz-absent-du-texte"]);
    const t = TexteAnonymise.depuis("Devoirs de Evan : calcule.", scelle, "témoin");
    expect(t.valeur).toContain("Evan");
  });
});

// ---------------------------------------------------------------------------
// 2. La même faute ailleurs : les seuils
// ---------------------------------------------------------------------------

/**
 * Les valeurs dont la neutralité est réellement **exécutée** ci-dessous.
 * Hissée hors du `describe` pour que la section 5 puisse comparer ce numérateur
 * au dénominateur dérivé de `.env.example` — une phrase qui couvre plus large
 * que sa mesure est le défaut que les trois premiers tours ont répété.
 */
const NEUTRALISATIONS: readonly { readonly variable: string; readonly eteint: string }[] = [
    { variable: "OCR_CONFIANCE_MIN", eteint: "l'état « illisible » de PRD-16" },
    { variable: "LECTURE_TOLERANCE_MOT", eteint: "la tolérance de lecture (3.4)" },
    { variable: "LECTURE_SEUIL_MOTS_OK", eteint: "le jugement souple de PED-09" },
    { variable: "CALIBRATION_NB_PHOTOS", eteint: "la preuve de SEC-04 en base (TEC-16)" },
    { variable: "BLOCAGE_NB_SOLLICITATIONS", eteint: "la détection de blocage de PED-08" },
    { variable: "AI_TIMEOUT_MS", eteint: "tout appel, abandonné avant de partir" },
    { variable: "CODE_MAX_TENTATIVES", eteint: "le blocage progressif de SEC-02" },
    { variable: "PARENT_SESSION_TTL_MIN", eteint: "la session parent de PRD-15" },
    { variable: "DUREE_SECOURS_ETAPE_MIN", eteint: "une étape de zéro minute" },
    { variable: "UPLOAD_MAX_PHOTO_OCTETS", eteint: "l'envoi de toute photo (PRD-03)" },
    // AJOUTÉ AU TOUR 4 — [MAJEUR] M6 (c). Le tour 3 écrivait
    // « UPLOAD_MAX_*_OCTETS » dans sa prose et ne testait que la photo. La
    // borne existait dans le code, le cas manquait au catalogue : la phrase
    // couvrait plus large que la mesure.
    { variable: "UPLOAD_MAX_AUDIO_OCTETS", eteint: "l'envoi de tout audio (SEC-05, V4)" },
];

const NEUTRALISATIONS_TESTEES: readonly string[] = NEUTRALISATIONS.map((n) => n.variable);

describe("la même faute ailleurs — un seuil neutre éteint sa garde", () => {
  for (const { variable, eteint } of NEUTRALISATIONS) {
    it(`REFUSE ${variable} = 0 — cela éteindrait ${eteint}`, () => {
      poser({ [variable]: "0" });
      expect(() => env()).toThrow(new RegExp(variable, "u"));
    });
  }

  // AJOUTÉ AU TOUR 4 — [MAJEUR] M6 (b). La douzième valeur, trouvée par
  // `controle-code` dans le fichier que le tour 3 déclarait avoir balayé. Sa
  // validation contrôlait la FORME de la liste et jamais ses valeurs : c'est
  // l'attaque du tour 2 portée sur une autre exigence.
  describe("CODE_BLOCAGE_PALIERS_SEC — une liste non vide au contenu neutre", () => {
    for (const valeur of ["0", "0,0,0,0", "60,0,900"]) {
      it(`REFUSE « ${valeur} » — SEC-02 deviendrait un blocage de zéro seconde`, () => {
        poser({ CODE_BLOCAGE_PALIERS_SEC: valeur });
        expect(() => env()).toThrow(/CODE_BLOCAGE_PALIERS_SEC/u);
      });
    }

    it("ACCEPTE la progression livrée par défaut", () => {
      poser({ CODE_BLOCAGE_PALIERS_SEC: "60,300,900,3600" });
      expect(env().CODE_BLOCAGE_PALIERS_SEC).toBe("60,300,900,3600");
    });
  });

  it("les seuils livrés par défaut sont tous strictement positifs", () => {
    poser({});
    const s = seuils();
    for (const [nom, valeur] of Object.entries(s)) {
      expect(valeur, nom).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. La seule exception légitime, et le sens qu'il faudra lui donner
// ---------------------------------------------------------------------------

describe("AUDIO_RETENTION_JOURS_DEFAUT = 0 — l'exception, et sa lecture fixée", () => {
  // AJOUTÉ AU TOUR 4 — [MINEUR] N11. Le tour 3 déclarait cette exception
  // légitime au motif d'un commentaire de `prisma/schema.prisma`. Le
  // contrôleur a relevé, avec raison, que **aucun code ne consomme encore la
  // valeur** — la purge de SEC-05 appartient à une verticale ultérieure — et
  // que `0` se lit tout aussi naturellement dans l'autre sens :
  // `if (jours === 0) return;`, « purge désactivée », est la ligne qu'on écrit
  // sans y penser, et elle conserverait POUR TOUJOURS les enregistrements
  // vocaux d'un enfant de six ans. L'inverse exact de l'intention.
  //
  // Une exception légitime doit être prouvée par un test, pas par un
  // commentaire. Les deux tests ci-dessous fixent le sens, et le second le
  // dérive du schéma plutôt que de le recopier : réécrire le commentaire dans
  // l'autre sens fait rougir le test.

  it("ACCEPTE la valeur 0 — c'est la seule valeur neutre légitime du fichier", () => {
    poser({ AUDIO_RETENTION_JOURS_DEFAUT: "0" });
    expect(env().AUDIO_RETENTION_JOURS_DEFAUT).toBe(0);
  });

  it("FIXE sa lecture : 0 = purge totale, JAMAIS purge désactivée", () => {
    const schema = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "..", "prisma", "schema.prisma"),
      "utf8",
    );
    const bloc = schema.slice(
      Math.max(0, schema.indexOf("retentionAudioJours") - 400),
      schema.indexOf("retentionAudioJours"),
    );
    // Le sens documenté doit être « ne rien conserver ». Toute reformulation
    // vers « purge désactivée », « conserver indéfiniment » ou « sans limite »
    // est le contresens que SEC-05 interdit.
    expect(bloc).toMatch(/0\s*=\s*ne rien conserver/u);
    expect(bloc).not.toMatch(/purge d[ée]sactiv|ind[ée]finiment|sans limite/iu);
  });
});

// ---------------------------------------------------------------------------
// 4. La même faute ailleurs : un vocabulaire de protocole trop large
// ---------------------------------------------------------------------------

describe("la même faute ailleurs — un vocabulaire de transport trop large", () => {
  // CORRIGÉ AU TOUR 4 — [MAJEUR] M6 (c). Le tour 3 présentait ce cas comme
  // fermé. Il est fermé **en forme**, pas **en neutralité** : aucune forme ne
  // distingue un nom de modèle ordinaire de `evan`, et un transport qui déclarerait
  // `vocabulaire: ["evan"]` blanchirait ce jeton. `controle-code` l'a mesuré.
  //
  // Je ne referme pas ce cas, et je dis pourquoi plutôt que de le taire :
  // `src/lib/ai/**` ne connaît pas le foyer (C2) et ne peut donc pas comparer
  // le vocabulaire aux identifiants ; la valeur vient de la configuration du
  // serveur et jamais d'une requête ; et C7 épingle déjà la fabrique du sceau.
  // Ce qui est testé ci-dessous est donc la FORME, et rien de plus.
  it("IGNORE une valeur de configuration qui n'a pas la forme d'un nom de modèle", () => {
    // Un transport qui déclarerait « Evan Le Goff » blanchirait deux jetons.
    // La forme admise est celle d'un nom de modèle, et rien d'autre.
    const interdits = IdentifiantsInterdits.sceller(["Zzz-absent"]);
    const payload = PayloadIa.sceller(
      PROMPT_1_STRUCTURATION,
      TexteAnonymise.depuis("Calcule : 7 + 5 =", interdits, "test"),
    );
    const corps: CorpsIa = {
      model: "modele-texte",
      messages: payload.messages(),
      temperature: 0,
      note: "Evan Le Goff",
    };
    const defauts = defautsDeDerivabilite(corps, payload, ["modele-texte", "Evan Le Goff"]);
    expect(defauts.map((d) => d.jeton)).toContain("evan");
    expect(() =>
      assertCorpsDerivable(corps, payload, ["modele-texte", "Evan Le Goff"]),
    ).toThrow();
  });

  it("ACCEPTE un nom de modèle ordinaire", () => {
    const interdits = IdentifiantsInterdits.sceller(["Zzz-absent"]);
    const payload = PayloadIa.sceller(
      PROMPT_1_STRUCTURATION,
      TexteAnonymise.depuis("Calcule : 7 + 5 =", interdits, "test"),
    );
    const corps: CorpsIa = {
      model: MODELE_TEMOIN,
      messages: payload.messages(),
      temperature: 0,
    };
    expect(defautsDeDerivabilite(corps, payload, [MODELE_TEMOIN])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. LE DÉNOMINATEUR — ce qu'il y avait à couvrir, et non ce que j'ai couvert
// ---------------------------------------------------------------------------
//
// AJOUTÉ AU TOUR 4. Les trois écarts de chiffres relevés par `controle-code`
// aux tours 1, 2 et 3 sont de la même famille, et il l'a nommée : **je mesure
// ce que j'ai couvert, pas ce qu'il y avait à couvrir.** Onze valeurs annoncées
// quand il y en avait douze ; deux tables d'instrument gardées sur sept ; une
// forme d'assertion sur trois.
//
// Corriger la douzième valeur ne corrige pas la famille. Ce qui la corrige est
// un **dénominateur dérivé** : la liste des variables n'est pas écrite ici, elle
// vient de `.env.example`, seul document qui les déclare toutes — la même
// dérivation que l'invariant I1 du socle (ARB-18 mesure 1). Chaque variable doit
// tomber dans **exactement une** des trois familles ci-dessous, avec sa phrase.
// Une variable ajoutée demain sans classement fait rougir ce test.

describe("le dénominateur — toute variable serveur est classée, ou le test rougit", () => {
  const declarees = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env.example"),
    "utf8",
  )
    .split("\n")
    .map((l) => /^([A-Z][A-Z0-9_]*)=/u.exec(l.trim())?.[1])
    .filter((n): n is string => n !== undefined && !n.startsWith("NEXT_PUBLIC_"));

  const classees = new Map<string, string>([
    ...Object.entries(REFUSENT_LE_NEUTRE),
    ...Object.entries(NEUTRE_LEGITIME),
    ...Object.entries(SANS_VALEUR_NEUTRE),
  ]);

  it("la dérivation lit bien quelque chose", () => {
    // Un dénominateur vide rendrait tous les contrôles suivants vacuement vrais.
    expect(declarees.length).toBeGreaterThan(0);
  });

  it("CHAQUE variable serveur déclarée est classée dans exactement une famille", () => {
    const manquantes = declarees.filter((n) => !classees.has(n));
    expect(manquantes, `variables non classées : ${manquantes.join(", ")}`).toEqual([]);
  });

  it("AUCUNE variable classée n'a disparu de .env.example", () => {
    const perimees = [...classees.keys()].filter((n) => !declarees.includes(n));
    expect(perimees, `classements périmés : ${perimees.join(", ")}`).toEqual([]);
  });

  it("les trois familles sont disjointes", () => {
    const total =
      Object.keys(REFUSENT_LE_NEUTRE).length +
      Object.keys(NEUTRE_LEGITIME).length +
      Object.keys(SANS_VALEUR_NEUTRE).length;
    expect(classees.size).toBe(total);
  });

  it("chaque classement porte sa phrase (ARB-18 mesure 2)", () => {
    for (const [nom, motif] of classees) {
      expect(motif.trim().length, nom).toBeGreaterThanOrEqual(40);
    }
  });

  it("chaque variable qui refuse le neutre a son cas exécutable plus haut", () => {
    // Le numérateur doit couvrir le dénominateur : la liste testée ci-dessus
    // et la famille déclarée ici sont la même, ou le catalogue ment.
    const testees = new Set([...NEUTRALISATIONS_TESTEES, "CODE_BLOCAGE_PALIERS_SEC"]);
    const oubliees = Object.keys(REFUSENT_LE_NEUTRE).filter((n) => !testees.has(n));
    expect(oubliees, `déclarées mais non testées : ${oubliees.join(", ")}`).toEqual([]);
  });
});
