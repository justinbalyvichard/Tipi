import { describe, expect, it } from "vitest";

import {
  DevoirStructure,
  QuatreIndices,
  QuestionsLecture,
} from "@/lib/ai/schemas";

/**
 * TEC-05 — la sortie du modèle est une entrée externe, et c'est la moins
 * fiable du produit : elle n'a aucun contrat, seulement une consigne.
 *
 * Chaque contrôle est écrit **dans les deux sens** : une sortie conforme passe,
 * et la déformation minimale qui devrait la faire tomber la fait tomber. Un
 * schéma qu'on ne voit jamais refuser n'est pas un schéma, c'est une
 * déclaration d'intention.
 */

const DEVOIR_CONFORME = {
  langue_detectee: "fr",
  etapes: [
    {
      matiere: "lecture",
      duree_estimee_min: 8,
      exercices: [
        { consigne: "Lis le texte à voix haute.", type: "lecture", contenu: "Le renard…" },
      ],
    },
  ],
};

describe("prompt 1 — structuration du devoir", () => {
  it("accepte une sortie conforme et la rend en camelCase", () => {
    const lu = DevoirStructure.parse(DEVOIR_CONFORME);
    expect(lu.langueDetectee).toBe("fr");
    expect(lu.etapes[0]?.dureeEstimeeMin).toBe(8);
    expect(lu.etapes[0]?.exercices[0]?.consigne).toBe("Lis le texte à voix haute.");
  });

  it("REFUSE une matière hors des deux de la V1 (PED-06)", () => {
    const fraude = {
      ...DEVOIR_CONFORME,
      etapes: [{ ...DEVOIR_CONFORME.etapes[0], matiere: "histoire" }],
    };
    expect(DevoirStructure.safeParse(fraude).success).toBe(false);
  });

  it("REFUSE une troisième étape (PED-06 : deux au maximum)", () => {
    const etape = DEVOIR_CONFORME.etapes[0];
    expect(
      DevoirStructure.safeParse({
        ...DEVOIR_CONFORME,
        etapes: [etape, etape, etape],
      }).success,
    ).toBe(false);
  });

  it("REFUSE une durée nulle, qui rendrait l'aperçu parent mensonger", () => {
    expect(
      DevoirStructure.safeParse({
        ...DEVOIR_CONFORME,
        etapes: [{ ...DEVOIR_CONFORME.etapes[0], duree_estimee_min: 0 }],
      }).success,
    ).toBe(false);
  });

  it("REFUSE une consigne vide, qui laisserait l'enfant devant un écran muet", () => {
    expect(
      DevoirStructure.safeParse({
        ...DEVOIR_CONFORME,
        etapes: [
          {
            ...DEVOIR_CONFORME.etapes[0],
            exercices: [{ consigne: "   ", type: "lecture", contenu: "x" }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("ACCEPTE une étape vide : ARB-08 l'écarte, il ne la refuse pas", () => {
    // La distinction compte. Refuser ici enverrait un devoir parfaitement
    // lisible en état « illisible » à cause d'une étape parasite ; ARB-08
    // demande de l'écarter, ce que fait `src/lib/devoirs/regroupement.ts`.
    const lu = DevoirStructure.safeParse({
      ...DEVOIR_CONFORME,
      etapes: [{ matiere: "maths", duree_estimee_min: 5, exercices: [] }],
    });
    expect(lu.success).toBe(true);
  });

  it("écarte un champ surnuméraire sans faire échouer l'analyse", () => {
    const lu = DevoirStructure.safeParse({ ...DEVOIR_CONFORME, commentaire: "bonjour" });
    expect(lu.success).toBe(true);
    expect(Object.keys(lu.success ? lu.data : {})).toEqual(["langueDetectee", "etapes"]);
  });
});

describe("prompt 2 — les quatre indices (PED-02, TEC-07)", () => {
  const quatre = ["un", "deux", "trois", "quatre"];

  it("accepte exactement quatre indices", () => {
    expect(QuatreIndices.parse({ indices: quatre }).indices).toHaveLength(4);
  });

  it("REFUSE trois indices : le bouton en déroule quatre, jamais trois", () => {
    expect(QuatreIndices.safeParse({ indices: quatre.slice(0, 3) }).success).toBe(false);
  });

  it("REFUSE cinq indices : l'échelle de PED-02 s'arrête au quatrième", () => {
    expect(QuatreIndices.safeParse({ indices: [...quatre, "cinq"] }).success).toBe(false);
  });

  it("REFUSE un niveau vide, qui ferait un appui sans réponse", () => {
    expect(QuatreIndices.safeParse({ indices: ["un", "", "trois", "quatre"] }).success).toBe(
      false,
    );
  });
});

describe("prompt 3 — questions de compréhension", () => {
  const conforme = {
    questions: [{ question: "De quoi parle le texte ?", mots_cles: ["renard", "rivière"] }],
  };

  it("accepte une sortie conforme et rend `motsCles`", () => {
    expect(QuestionsLecture.parse(conforme).questions[0]?.motsCles).toEqual([
      "renard",
      "rivière",
    ]);
  });

  it("REFUSE une question sans mot-clé : le jugement souple n'aurait rien à juger", () => {
    expect(
      QuestionsLecture.safeParse({
        questions: [{ question: "De quoi parle le texte ?", mots_cles: [] }],
      }).success,
    ).toBe(false);
  });

  it("REFUSE une liste vide de questions", () => {
    expect(QuestionsLecture.safeParse({ questions: [] }).success).toBe(false);
  });
});
