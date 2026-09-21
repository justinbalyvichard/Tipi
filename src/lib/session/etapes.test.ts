import { StatutTentative } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { STATUTS_FINAUX, etapeAchevee, estStatutFinal } from "@/lib/session/etapes";
import type { EtapePrevue } from "@/lib/validation/json";

/**
 * `etapeAchevee()` — le prédicat de T10 et T12, et **pas celui du bonus**.
 *
 * Ce que ce fichier protège : la distinction du constat 26. `etapeAchevee()`
 * répond à « l'enfant a-t-il fini le travail ? » depuis les `attempt` ;
 * `etapesCreditees()` répond à « cette étape a-t-elle déjà donné sa pierre ? »
 * depuis le ledger. Les confondre a coûté une pierre à l'enfant sur le chemin
 * nominal, et trois `FAIL` à la porte G2.
 */

function etape(exerciseIds: readonly string[]): EtapePrevue {
  return { matiere: "maths", ordre: 0, dureeEstimeeMin: 10, exerciseIds: [...exerciseIds] };
}

describe("PRD-18 §1 — les statuts finaux, dérivés de l'énumération Prisma", () => {
  it("`en_cours` est le SEUL statut non final", () => {
    const tous = Object.values(StatutTentative);
    expect([...STATUTS_FINAUX].sort()).toEqual(tous.filter((s) => s !== "en_cours").sort());
    expect(estStatutFinal(StatutTentative.en_cours)).toBe(false);
  });

  it("`passee` et `bloquee` comptent comme finis — ce sont des faits, pas des échecs", () => {
    // PED-04 : aucune valeur ne porte de jugement juste/faux. ETH-04 : l'enfant
    // n'est pas puni d'avoir passé un exercice, l'étape compte quand même.
    expect(estStatutFinal(StatutTentative.passee)).toBe(true);
    expect(estStatutFinal(StatutTentative.bloquee)).toBe(true);
    expect(estStatutFinal(StatutTentative.terminee)).toBe(true);
  });

  it("LA LISTE N'EST PAS VIDE — vidée, T12 ne rattraperait plus jamais rien", () => {
    expect(STATUTS_FINAUX.length).toBeGreaterThan(0);
  });
});

describe("PRD-18 §2 — une étape est achevée quand TOUS ses exercices le sont", () => {
  const A = "a1";
  const B = "b2";

  it("tous finaux → achevée", () => {
    expect(
      etapeAchevee(etape([A, B]), [
        { exerciseId: A, statut: StatutTentative.terminee },
        { exerciseId: B, statut: StatutTentative.passee },
      ]),
    ).toBe(true);
  });

  it("un seul `en_cours` → NON achevée", () => {
    expect(
      etapeAchevee(etape([A, B]), [
        { exerciseId: A, statut: StatutTentative.terminee },
        { exerciseId: B, statut: StatutTentative.en_cours },
      ]),
    ).toBe(false);
  });

  it("un exercice SANS aucune ligne → NON achevée", () => {
    // « L'absence de trace n'est pas une preuve de travail » : c'est la limite
    // de la garantie, énoncée franchement en P2 §9.5. Le serveur n'a rien qui
    // atteste que l'étape a été faite, il ne la crédite donc pas.
    expect(etapeAchevee(etape([A, B]), [{ exerciseId: A, statut: StatutTentative.terminee }])).toBe(
      false,
    );
  });

  it("les tentatives d'AUTRES exercices ne comptent pas", () => {
    expect(
      etapeAchevee(etape([A]), [{ exerciseId: "autre", statut: StatutTentative.terminee }]),
    ).toBe(false);
  });

  it("une étape sans exercice n'est PAS achevée par vacuité (ARB-08)", () => {
    // Elle ne peut pas exister ; si elle existait, la déclarer achevée
    // ajouterait une pierre pour un travail qui n'a pas eu lieu — même geste
    // que la garde `length === 0` du bonus.
    expect(etapeAchevee(etape([]), [])).toBe(false);
  });

  it("aucune tentative du tout → NON achevée", () => {
    expect(etapeAchevee(etape([A]), [])).toBe(false);
  });
});
