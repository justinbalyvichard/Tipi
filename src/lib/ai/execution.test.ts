import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PayloadIa, type CorpsIa } from "@/lib/ai/anonymisation";
import { ErreurAppelIa, executerPrompt, extraireJson } from "@/lib/ai/execution";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";
import { DevoirStructure } from "@/lib/ai/schemas";
import type { AiTransport } from "@/lib/ai/transport";
import { reinitialiserEnvPourTest } from "@/config/env";

/**
 * L'étape 4 du pipeline, mot pour mot : « appel DeepSeek en mode texte, sortie
 * JSON strictement validée par un schéma Zod. **Toute sortie non conforme est
 * rejouée une fois, puis bascule en état illisible.** »
 *
 * Ce fichier éprouve la phrase dans ses trois cas : conforme du premier coup,
 * conforme à la relance, jamais conforme. Plus les deux chemins d'échec réseau,
 * et — le plus important — **le fait que l'invariant SEC-04 empêche
 * physiquement l'émission** quand le corps n'est pas dérivable.
 */

/** Les six variables critiques, valeurs inoffensives : aucun compte n'existe. */
const ENV_TEST: Readonly<Record<string, string>> = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DIRECT_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "https://test.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  PARENT_SESSION_SECRET: "test-parent-session-secret",
  CRON_SECRET: "test-cron-secret",
  AI_TIMEOUT_MS: "50",
};

const SORTIE_CONFORME = JSON.stringify({
  langue_detectee: "fr",
  etapes: [
    {
      matiere: "lecture",
      duree_estimee_min: 8,
      exercices: [{ consigne: "Lis.", type: "lecture", contenu: "Le renard." }],
    },
  ],
});

interface Journal {
  readonly emissions: CorpsIa[];
}

function transportQuiRend(
  reponses: readonly (string | "jamais")[],
  journal: Journal,
): AiTransport {
  let rang = 0;
  return {
    nom: "epreuve",
    vocabulaire: ["epreuve"],
    corps(payload: PayloadIa): CorpsIa {
      return { model: "epreuve", messages: payload.messages(), temperature: 0 };
    },
    emettre(corps: CorpsIa, signal: AbortSignal): Promise<string> {
      journal.emissions.push(corps);
      const reponse = reponses[Math.min(rang, reponses.length - 1)] ?? "";
      rang += 1;
      if (reponse === "jamais") {
        // Ne répond pas : c'est l'abandon par `AI_TIMEOUT_MS` qui doit trancher.
        return new Promise((_resoudre, rejeter) => {
          signal.addEventListener("abort", () => {
            rejeter(new Error("abandon"));
          });
        });
      }
      return Promise.resolve(reponse);
    },
  };
}

beforeEach(() => {
  for (const [nom, valeur] of Object.entries(ENV_TEST)) process.env[nom] = valeur;
  reinitialiserEnvPourTest();
});

afterEach(() => {
  for (const nom of Object.keys(ENV_TEST)) delete process.env[nom];
  reinitialiserEnvPourTest();
});

describe("étape 4 — validation stricte et relance unique", () => {
  it("rend la valeur validée quand la première sortie est conforme", async () => {
    const journal: Journal = { emissions: [] };
    const resultat = await executerPrompt(
      transportQuiRend([SORTIE_CONFORME], journal),
      PROMPT_1_STRUCTURATION,
      "Lis le texte.",
      DevoirStructure,
    );
    expect(resultat.valeur.langueDetectee).toBe("fr");
    expect(resultat.trace.tentatives).toBe(1);
    expect(journal.emissions).toHaveLength(1);
  });

  it("REJOUE UNE FOIS quand la première sortie est non conforme", async () => {
    const journal: Journal = { emissions: [] };
    const resultat = await executerPrompt(
      transportQuiRend(['{"langue_detectee":"klingon"}', SORTIE_CONFORME], journal),
      PROMPT_1_STRUCTURATION,
      "Lis le texte.",
      DevoirStructure,
    );
    expect(resultat.trace.tentatives).toBe(2);
    expect(journal.emissions).toHaveLength(2);
  });

  it("bascule en TIPI_IA_SORTIE_INVALIDE après la relance, et PAS avant", async () => {
    const journal: Journal = { emissions: [] };
    await expect(
      executerPrompt(
        transportQuiRend(["ceci n'est pas du JSON"], journal),
        PROMPT_1_STRUCTURATION,
        "Lis le texte.",
        DevoirStructure,
      ),
    ).rejects.toMatchObject({ code: "TIPI_IA_SORTIE_INVALIDE" });
    // Exactement deux : une de plus serait une boucle sur un enfant qui attend,
    // une de moins ne serait pas la relance que 3.2 exige.
    expect(journal.emissions).toHaveLength(2);
  });

  it("rend TIPI_IA_TIMEOUT quand le fournisseur ne répond pas", async () => {
    const journal: Journal = { emissions: [] };
    await expect(
      executerPrompt(
        transportQuiRend(["jamais"], journal),
        PROMPT_1_STRUCTURATION,
        "Lis le texte.",
        DevoirStructure,
      ),
    ).rejects.toMatchObject({ code: "TIPI_IA_TIMEOUT" });
  });

  it("rend TIPI_IA_INDISPONIBLE quand l'émission échoue", async () => {
    const transport: AiTransport = {
      nom: "epreuve",
      vocabulaire: ["epreuve"],
      corps: (p) => ({ model: "epreuve", messages: p.messages(), temperature: 0 }),
      emettre: () => Promise.reject(new Error("réseau coupé")),
    };
    await expect(
      executerPrompt(transport, PROMPT_1_STRUCTURATION, "Lis.", DevoirStructure),
    ).rejects.toMatchObject({ code: "TIPI_IA_INDISPONIBLE" });
  });

  it("transporte sa trace dans l'erreur, pour que TEC-16 puisse la journaliser", async () => {
    const journal: Journal = { emissions: [] };
    try {
      await executerPrompt(
        transportQuiRend(["pas du JSON"], journal),
        PROMPT_1_STRUCTURATION,
        "Lis.",
        DevoirStructure,
      );
      throw new Error("aurait dû lever");
    } catch (brute) {
      expect(brute).toBeInstanceOf(ErreurAppelIa);
      if (brute instanceof ErreurAppelIa) {
        expect(brute.trace.promptId).toBe("structuration");
        expect(brute.trace.reponseBrute).toBe("pas du JSON");
        expect(brute.trace.payload).toBeDefined();
      }
    }
  });
});

describe("SEC-04 — l'émission est INATTEIGNABLE si le corps n'est pas dérivable", () => {
  it("un transport qui ajoute un champ identifiant n'émet RIEN", async () => {
    const journal: Journal = { emissions: [] };
    const malveillant: AiTransport = {
      nom: "epreuve",
      vocabulaire: ["epreuve"],
      corps: (p) => ({
        model: "epreuve",
        messages: p.messages(),
        // Le champ fautif. Il n'est pas dans le vocabulaire déclaré.
        contexte: "Evan CE1",
      }),
      emettre: (corps) => {
        journal.emissions.push(corps);
        return Promise.resolve(SORTIE_CONFORME);
      },
    };

    await expect(
      executerPrompt(malveillant, PROMPT_1_STRUCTURATION, "Lis.", DevoirStructure),
    ).rejects.toMatchObject({ code: "TIPI_PAYLOAD_NON_ANONYME" });

    // LE POINT DU TEST : zéro émission. L'appel n'est pas parti.
    expect(journal.emissions).toHaveLength(0);
  });
});

describe("extraction du JSON d'une réponse bavarde", () => {
  it("accepte un JSON encadré de texte ou d'un bloc de code", () => {
    expect(extraireJson('Voici :\n```json\n{"a":1}\n```\nVoilà.')).toEqual({ a: 1 });
  });

  it("lève quand il n'y a aucun objet", () => {
    expect(() => extraireJson("désolé, je ne peux pas")).toThrow();
  });
});
