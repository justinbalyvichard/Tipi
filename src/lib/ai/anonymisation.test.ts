import { describe, expect, it } from "vitest";

import {
  PayloadIa,
  REMPLACEMENT_IDENTIFIANT,
  assertCorpsDerivable,
  assertPayloadAnonyme,
  assertTexteAnonyme,
  caviarder,
  defautsDeDerivabilite,
  vocabulaireProtocole,
  type CorpsIa,
  type IdentifiantsInterdits,
} from "@/lib/ai/anonymisation";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";

/**
 * SEC-04 — les trois parties, éprouvées **dans le bon sens** : chaque garde est
 * d'abord montrée ROUGE sur un cas fautif, puis VERTE sur le cas propre. Un
 * test qui ne montrerait que le vert prouverait qu'on sait écrire du code
 * correct, pas que la garde mord.
 *
 * Rappel de la décomposition (`src/lib/ai/anonymisation.ts`) :
 *   (A) le corps émis ne contient rien d'autre que le prompt et le texte ;
 *   (B) le texte ne contient aucun identifiant du foyer ;
 *   (C) `src/lib/ai/**` n'a aucun accès à la base — invariant C2 de
 *       `scripts/verifier-confinement.ts`, hors de portée d'un test unitaire.
 */

/** Nom de modèle témoin : ce fichier ne nomme aucun fournisseur (TEC-17).
 * Le contrôle C1 de `scripts/verifier-confinement.ts` rejoue la règle de P2 §5.1,
 * qui vaut pour TOUT fichier de `src/`, tests compris. */
const MODELE_TEMOIN = "modele-texte";

const INTERDITS: IdentifiantsInterdits = {
  valeurs: [
    "Evan",
    "3f1a9c22-0000-4000-8000-000000000001",
    "9b2d4e55-0000-4000-8000-000000000002",
    "Foyer Le Goff",
  ],
};

function payload(texte: string): PayloadIa {
  return PayloadIa.sceller(PROMPT_1_STRUCTURATION, texte);
}

/** Le corps que le transport du fournisseur fabrique, reproduit ici à l'identique. */
function corpsFournisseur(p: PayloadIa, modele = MODELE_TEMOIN): CorpsIa {
  return {
    model: modele,
    messages: p.messages(),
    response_format: { type: "json_object" },
    temperature: 0,
    stream: false,
  };
}

// ---------------------------------------------------------------------------
// (B) — caviardage du texte
// ---------------------------------------------------------------------------

describe("SEC-04 (B) — caviardage du texte de devoir", () => {
  it("retire le prénom écrit en haut d'une page de cahier", () => {
    const brut = "Evan — CE1\nLis le texte à voix haute.";
    expect(brut).toContain("Evan");
    const propre = caviarder(brut, INTERDITS);
    expect(propre).not.toContain("Evan");
    expect(propre).toContain(REMPLACEMENT_IDENTIFIANT);
    expect(propre).toContain("Lis le texte à voix haute.");
  });

  it("retire le prénom quelles que soient la casse et les accents", () => {
    for (const forme of ["EVAN", "evan", "Évan", "ÉVAN", "evAn"]) {
      const propre = caviarder(`Cahier de ${forme}, page 12`, INTERDITS);
      expect(propre, forme).not.toMatch(/evan/iu);
      expect(propre, forme).toContain("page 12");
    }
  });

  it("retire les identifiants techniques, qui ne contiennent pourtant aucun mot", () => {
    const brut = "reference 3f1a9c22-0000-4000-8000-000000000001 fin";
    expect(caviarder(brut, INTERDITS)).not.toContain("3f1a9c22");
  });

  it("retire le nom du foyer, qui est un nom de famille", () => {
    expect(caviarder("Foyer Le Goff / devoirs", INTERDITS)).not.toContain("Le Goff");
  });

  it("n'abîme pas un texte qui ne contient aucun identifiant", () => {
    const brut = "Calcule : 7 + 5 =\nCombien de billes reste-t-il ?";
    expect(caviarder(brut, INTERDITS)).toBe(brut);
  });

  it("cherche un identifiant court EN MOT ENTIER et ne hache pas le texte", () => {
    const courts: IdentifiantsInterdits = { valeurs: ["Li"] };
    // Rouge si la recherche était en sous-chaîne : « lire » et « police »
    // seraient éventrés.
    const propre = caviarder("Li doit lire la police du livre.", courts);
    expect(propre).toContain("lire");
    expect(propre).toContain("police");
    // …et l'identifiant en mot entier est bel et bien retiré.
    expect(propre.startsWith(REMPLACEMENT_IDENTIFIANT)).toBe(true);
  });
});

describe("SEC-04 (B) — l'assertion mord avant l'émission", () => {
  it("REFUSE un texte qui porte encore le prénom", () => {
    expect(() => assertTexteAnonyme("Evan doit lire", INTERDITS, "test")).toThrowError(
      /TIPI_PAYLOAD_NON_ANONYME|identifiant/u,
    );
  });

  it("ACCEPTE le même texte une fois caviardé", () => {
    const propre = caviarder("Evan doit lire", INTERDITS);
    expect(() => assertTexteAnonyme(propre, INTERDITS, "test")).not.toThrow();
  });

  it("REFUSE une image glissée dans un champ de texte (TEC-05)", () => {
    for (const fraude of [
      "data:image/png;base64,iVBORw0KGgo=",
      `photo ${"A".repeat(600)}`,
    ]) {
      expect(() => assertTexteAnonyme(fraude, INTERDITS, "test")).toThrow();
    }
  });

  it("ne cite JAMAIS la valeur trouvée dans son message (SEC-01)", () => {
    try {
      assertTexteAnonyme("Evan doit lire", INTERDITS, "test");
      throw new Error("l'assertion aurait dû lever");
    } catch (brute) {
      const message = brute instanceof Error ? `${brute.message}` : String(brute);
      expect(message).not.toContain("Evan");
    }
  });
});

// ---------------------------------------------------------------------------
// (A) — dérivabilité du corps émis
// ---------------------------------------------------------------------------

describe("SEC-04 (A) — l'invariant de dérivabilité", () => {
  it("accepte le corps réellement émis par le transport du fournisseur", () => {
    const p = payload("Lis le texte à voix haute.");
    expect(defautsDeDerivabilite(corpsFournisseur(p), p, [MODELE_TEMOIN])).toEqual([]);
  });

  it("REFUSE un champ inventé qui porte un prénom — SANS connaître ce prénom", () => {
    const p = payload("Lis le texte à voix haute.");
    const fraude: CorpsIa = { ...corpsFournisseur(p), enfant: "Evan" };
    // Aucune liste noire n'intervient : `vocabulaire` ne contient pas « Evan »,
    // donc le jeton est simplement hors du vocabulaire autorisé. C'est ce qui
    // distingue un invariant d'une liste d'interdits — il attrape ce qu'on
    // n'avait pas pensé à interdire.
    const defauts = defautsDeDerivabilite(fraude, p, [MODELE_TEMOIN]);
    expect(defauts.map((d) => d.jeton)).toContain("evan");
    expect(() => assertCorpsDerivable(fraude, p, [MODELE_TEMOIN])).toThrow();
  });

  it("REFUSE un identifiant technique glissé dans un champ de protocole", () => {
    const p = payload("Calcule : 7 + 5 =");
    const fraude: CorpsIa = {
      ...corpsFournisseur(p),
      user: "3f1a9c22-0000-4000-8000-000000000001",
    };
    expect(() => assertCorpsDerivable(fraude, p, [MODELE_TEMOIN])).toThrow();
  });

  it("REFUSE un troisième message, même vide de sens", () => {
    const p = payload("Calcule : 7 + 5 =");
    const fraude: CorpsIa = {
      ...corpsFournisseur(p),
      messages: [...p.messages(), { role: "system", content: "contexte foyer LeGoff" }],
    };
    expect(() => assertCorpsDerivable(fraude, p, [MODELE_TEMOIN])).toThrow();
  });

  it("REFUSE une suite binaire déguisée en nombre", () => {
    const p = payload("Calcule : 7 + 5 =");
    const fraude: CorpsIa = { ...corpsFournisseur(p), seed: "1".repeat(64) };
    expect(() => assertCorpsDerivable(fraude, p, [MODELE_TEMOIN])).toThrow();
  });

  it("REFUSE un nom de modèle non déclaré au vocabulaire", () => {
    const p = payload("Calcule : 7 + 5 =");
    // Le corps est honnête, mais le transport ne l'a pas déclaré : l'invariant
    // ne fait pas confiance, il vérifie.
    expect(() => assertCorpsDerivable(corpsFournisseur(p, "modele-maison"), p, [])).toThrow();
    expect(() =>
      assertCorpsDerivable(corpsFournisseur(p, "modele-maison"), p, ["modele-maison"]),
    ).not.toThrow();
  });

  it("laisse passer le texte du devoir, si étrange soit-il", () => {
    // Propriété : tout ce qui vient du texte est dérivable, par construction.
    const p = payload("Colorie les zvartañ pelec'h — 12 × 3 — Xyzzy Plugh");
    expect(defautsDeDerivabilite(corpsFournisseur(p), p, [MODELE_TEMOIN])).toEqual([]);
  });

  it("chaque entrée du vocabulaire de protocole porte une justification écrite", () => {
    // ARB-18 mesure 2, appliquée par analogie : une liste de noms s'allonge
    // sans réfléchir, une liste de justifications s'allonge en mentant.
    for (const [mot, motif] of Object.entries(vocabulaireProtocole())) {
      expect(motif.trim().length, mot).toBeGreaterThanOrEqual(40);
    }
  });
});

// ---------------------------------------------------------------------------
// Le scellement lui-même
// ---------------------------------------------------------------------------

describe("SEC-04 — le payload scellé", () => {
  it("ne porte que deux messages, dans l'ordre", () => {
    const p = payload("Lis le texte.");
    const messages = p.messages();
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: "system", content: PROMPT_1_STRUCTURATION.texte });
    expect(messages[1]).toEqual({ role: "user", content: "Lis le texte." });
    expect(p.estScelle()).toBe(true);
  });

  it("refuse un texte vide, qui casserait l'invariant de dérivabilité", () => {
    expect(() => PayloadIa.sceller(PROMPT_1_STRUCTURATION, "   ")).toThrow();
  });

  it("garde la trace du prompt et de sa version pour la calibration (TEC-16)", () => {
    const p = payload("Lis le texte.");
    expect(p.promptId).toBe("structuration");
    expect(p.promptVersion).toBe(PROMPT_1_STRUCTURATION.version);
  });
});

describe("SEC-04 — la garde du journal de calibration", () => {
  it("REFUSE d'écrire un payload qui porte un identifiant", () => {
    const p = payload("Lis le texte.");
    const pollue: CorpsIa = { ...corpsFournisseur(p), note: "Evan" };
    expect(() => assertPayloadAnonyme(pollue, INTERDITS)).toThrow();
  });

  it("ACCEPTE le payload réellement émis", () => {
    const p = payload(caviarder("Evan — CE1\nLis le texte.", INTERDITS));
    expect(() => assertPayloadAnonyme(corpsFournisseur(p), INTERDITS)).not.toThrow();
  });
});
