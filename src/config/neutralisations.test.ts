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
import { env, reinitialiserEnvPourTest } from "@/config/env";
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

describe("la même faute ailleurs — un seuil neutre éteint sa garde", () => {
  const neutralisations: readonly { readonly variable: string; readonly eteint: string }[] = [
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
  ];

  for (const { variable, eteint } of neutralisations) {
    it(`REFUSE ${variable} = 0 — cela éteindrait ${eteint}`, () => {
      poser({ [variable]: "0" });
      expect(() => env()).toThrow(new RegExp(variable, "u"));
    });
  }

  it("ACCEPTE AUDIO_RETENTION_JOURS_DEFAUT = 0 — la seule valeur neutre légitime", () => {
    // `prisma/schema.prisma` documente 0 comme « ne rien conserver » (SEC-05).
    // Une exception nommée n'est pas un trou ; une exception tacite en serait un.
    poser({ AUDIO_RETENTION_JOURS_DEFAUT: "0" });
    expect(env().AUDIO_RETENTION_JOURS_DEFAUT).toBe(0);
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
// 3. La même faute ailleurs : un vocabulaire de protocole trop large
// ---------------------------------------------------------------------------

describe("la même faute ailleurs — un vocabulaire de transport trop large", () => {
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
