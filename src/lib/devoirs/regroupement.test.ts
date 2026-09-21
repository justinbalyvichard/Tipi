import { describe, expect, it } from "vitest";

import {
  ETAPES_MAX,
  dureeParExercice,
  regrouper,
  type AnalysePhoto,
} from "@/lib/devoirs/regroupement";

/**
 * PED-06 et ARB-08 — les deux règles les plus faciles à perdre du pipeline,
 * parce qu'elles ne se voient sur aucun écran tant qu'elles sont respectées.
 *
 * ARB-08 chiffre le coût de l'oubli : une étape vide programmée coûterait
 * **deux pierres** à l'enfant — l'étape et le bonus — pour une erreur
 * d'analyse dont il n'est pas responsable (ETH-04).
 */

function photo(
  homeworkId: string,
  etapes: AnalysePhoto["etapes"],
): AnalysePhoto {
  return { homeworkId, etapes };
}

const LECTURE = {
  matiere: "lecture",
  dureeEstimeeMin: 8,
  exercices: [{ consigne: "Lis.", type: "lecture", contenu: "Le renard." }],
} as const;

const MATHS = {
  matiere: "maths",
  dureeEstimeeMin: 6,
  exercices: [{ consigne: "Calcule 7 + 5.", type: "calcul", contenu: "7 + 5 =" }],
} as const;

describe("PED-06 — une étape par matière, deux au maximum", () => {
  it("regroupe six photos de maths en UNE seule étape", () => {
    const photos = Array.from({ length: 6 }, (_, i) => photo(`h${i}`, [MATHS]));
    const { etapes } = regrouper(photos);
    expect(etapes).toHaveLength(1);
    expect(etapes[0]?.matiere).toBe("maths");
    expect(etapes[0]?.exercices).toHaveLength(6);
  });

  it("ne dépasse jamais deux étapes", () => {
    const { etapes } = regrouper([
      photo("h1", [LECTURE]),
      photo("h2", [MATHS]),
      photo("h3", [LECTURE, MATHS]),
    ]);
    expect(etapes.length).toBeLessThanOrEqual(ETAPES_MAX);
  });

  it("conserve l'ordre de la première apparition des matières", () => {
    expect(regrouper([photo("h1", [MATHS]), photo("h2", [LECTURE])]).etapes[0]?.matiere).toBe(
      "maths",
    );
    expect(regrouper([photo("h1", [LECTURE]), photo("h2", [MATHS])]).etapes[0]?.matiere).toBe(
      "lecture",
    );
  });

  it("garde la trace de chaque exercice jusqu'à sa photo d'origine", () => {
    const { etapes } = regrouper([photo("h1", [MATHS]), photo("h2", [MATHS])]);
    expect(etapes[0]?.exercices.map((e) => e.homeworkId)).toEqual(["h1", "h2"]);
  });
});

describe("ARB-08 — une étape vide n'est jamais créée", () => {
  it("écarte une étape sans exercice, et la compte", () => {
    const vide = { matiere: "maths", dureeEstimeeMin: 5, exercices: [] } as const;
    const resultat = regrouper([photo("h1", [LECTURE, vide])]);
    expect(resultat.etapes).toHaveLength(1);
    expect(resultat.etapes[0]?.matiere).toBe("lecture");
    expect(resultat.etapesVidesEcartees).toBe(1);
  });

  it("n'invente pas d'étape quand TOUTES sont vides", () => {
    const vide = { matiere: "maths", dureeEstimeeMin: 5, exercices: [] } as const;
    const resultat = regrouper([photo("h1", [vide]), photo("h2", [vide])]);
    // Zéro étape : l'appelant rend `TIPI_AUCUN_EXERCICE`, jamais un programme
    // creux que le parent lancerait sans s'en apercevoir.
    expect(resultat.etapes).toHaveLength(0);
    expect(resultat.etapesVidesEcartees).toBe(2);
  });

  it("une étape vide n'ajoute AUCUNE minute au programme", () => {
    const vide = { matiere: "lecture", dureeEstimeeMin: 30, exercices: [] } as const;
    const avec = regrouper([photo("h1", [LECTURE, vide])]);
    const sans = regrouper([photo("h1", [LECTURE])]);
    expect(avec.etapes[0]?.dureeEstimeeMin).toBe(sans.etapes[0]?.dureeEstimeeMin);
  });
});

describe("la durée d'une étape est la somme de celles de ses exercices", () => {
  it("répartit la durée estimée par le modèle sur les exercices", () => {
    const { etapes } = regrouper([
      photo("h1", [
        {
          matiere: "maths",
          dureeEstimeeMin: 9,
          exercices: [
            { consigne: "a", type: "calcul", contenu: "1" },
            { consigne: "b", type: "calcul", contenu: "2" },
            { consigne: "c", type: "calcul", contenu: "3" },
          ],
        },
      ]),
    ]);
    expect(etapes[0]?.exercices.map((e) => e.dureeEstimeeMin)).toEqual([3, 3, 3]);
    expect(etapes[0]?.dureeEstimeeMin).toBe(9);
  });

  it("INVARIANT : la durée d'étape égale toujours la somme de ses exercices", () => {
    // C'est la propriété qui rend `GET /api/devoirs/programme` identique à
    // l'analyse : la relecture recalcule la même somme, à partir des mêmes
    // durées stockées sur `exercise`.
    const cas: AnalysePhoto[][] = [
      [photo("h1", [LECTURE])],
      [photo("h1", [MATHS]), photo("h2", [MATHS])],
      [photo("h1", [LECTURE, MATHS]), photo("h2", [LECTURE])],
      [
        photo("h1", [
          {
            matiere: "maths",
            dureeEstimeeMin: 7,
            exercices: [
              { consigne: "a", type: "c", contenu: "1" },
              { consigne: "b", type: "c", contenu: "2" },
            ],
          },
        ]),
      ],
    ];
    for (const entree of cas) {
      for (const etape of regrouper(entree).etapes) {
        const somme = etape.exercices.reduce((t, e) => t + e.dureeEstimeeMin, 0);
        expect(etape.dureeEstimeeMin).toBe(somme);
      }
    }
  });

  it("aucun exercice ne dure zéro minute", () => {
    // Zéro serait refusé par `EtapePrevue` au lancement de la session (V3) :
    // le défaut n'apparaîtrait qu'au moment où l'enfant attend.
    expect(dureeParExercice(1, 10)).toBeGreaterThanOrEqual(1);
    expect(dureeParExercice(0, 3)).toBeGreaterThanOrEqual(1);
  });
});
