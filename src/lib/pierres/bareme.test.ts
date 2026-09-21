import { describe, expect, it } from "vitest";

import { ETAPES_MAX_PAR_SOIREE, PIERRES_PAR_ETAPE, RAISONS_GEM } from "@/config/pierres.config";
import {
  RAISONS_ETAPE,
  RAISON_BONUS,
  TOTAL_SOIREE_COMPLETE,
  assertBaremeScelle,
  bonusSoireeComplete,
  raisonEtape,
} from "@/lib/pierres/bareme";
import { Matiere } from "@/lib/validation/json";

/**
 * ARB-13 — L'INVARIANT DU FORFAIT, ET POURQUOI IL NE RECALCULE JAMAIS `3 − n`.
 *
 * `40-protocole-agents.mdc` demande de préférer un invariant à une
 * re-dérivation. Le barème s'y prête, et c'est le genre de défaut qu'un test de
 * re-dérivation aurait manqué : *un test qui recalcule `3 − n` et le compare au
 * code trouve les deux d'accord, puisque le défaut du tour 2 n'était pas dans
 * le calcul du montant mais dans la condition de versement.*
 *
 * L'énoncé vérifié ici est donc celui d'ARB-13 lui-même :
 *
 * > Une soirée complète vaut **exactement 3 pierres**, quel que soit le nombre
 * > d'étapes, quel que soit le chemin, quel que soit l'ordre des requêtes.
 *
 * `TOTAL_SOIREE_COMPLETE` est la décision, pas un calcul. Aucune ligne
 * ci-dessous n'écrit `3 - n`.
 */

describe("ARB-13 §1 — l'invariant du forfait, sans re-dérivation", () => {
  it("une soirée complète vaut EXACTEMENT le forfait, pour toute taille programmable", () => {
    for (let n = 1; n <= ETAPES_MAX_PAR_SOIREE; n += 1) {
      const etapes = n * PIERRES_PAR_ETAPE;
      const total = etapes + bonusSoireeComplete(n);
      expect(total, `soirée de ${n} étape(s)`).toBe(TOTAL_SOIREE_COMPLETE);
    }
  });

  it("le Soir léger est INDÉTECTABLE dans le coffre (ARB-06)", () => {
    // Le défaut qu'ARB-13 répare : « +1 par étape, +1 si tout est terminé »
    // donnait 3 pierres à deux étapes et 2 à une seule. Un écart d'une pierre,
    // parfaitement visible dans un coffre chiffré par PRD-14.
    const uneEtape = PIERRES_PAR_ETAPE + bonusSoireeComplete(1);
    const deuxEtapes = 2 * PIERRES_PAR_ETAPE + bonusSoireeComplete(2);
    expect(uneEtape).toBe(deuxEtapes);
  });

  it("le corollaire : la somme d'une session appartient à {0, 1, 3}, jamais 2", () => {
    // « Une session à 2 est, par construction, une soirée complète dont le
    // bonus manque. » C'est la forme la plus courte du constat 26.
    const possibles = new Set<number>([0]); // sansDevoir
    possibles.add(PIERRES_PAR_ETAPE); // une étape sur deux terminée
    for (let n = 1; n <= ETAPES_MAX_PAR_SOIREE; n += 1) {
      possibles.add(n * PIERRES_PAR_ETAPE + bonusSoireeComplete(n));
    }
    expect([...possibles].sort((a, b) => a - b)).toEqual([0, 1, 3]);
    expect(possibles.has(2)).toBe(false);
  });

  it("une soirée SANS étape programmée ne crédite rien (propriété 2)", () => {
    // `sansDevoir` rendrait « toutes les étapes sont terminées » vrai par
    // vacuité, et le forfait entier serait versé à un enfant qui n'a pas
    // travaillé.
    expect(bonusSoireeComplete(0)).toBe(0);
    expect(bonusSoireeComplete(-1)).toBe(0);
  });

  it("un nombre d'étapes hors du plafond LÈVE au lieu de créditer de travers", () => {
    // Trois étapes violeraient PED-06 en amont ; si le plafond sautait, le
    // bonus tomberait hors des bornes de `gem_ledger_delta_borne` et la base
    // annulerait la transition. Lever ici nomme la cause.
    expect(() => bonusSoireeComplete(ETAPES_MAX_PAR_SOIREE + 1)).toThrow(/Barème neutralisé/u);
  });
});

describe("ARB-13 §2 — les raisons, dérivées des matières", () => {
  it("chaque matière a sa raison, et la liste est dérivée de l'énumération", () => {
    expect([...RAISONS_ETAPE]).toEqual(Matiere.options.map((m) => raisonEtape(m)));
    expect(RAISONS_ETAPE.length).toBe(Matiere.options.length);
  });

  it("toutes les raisons employées existent dans l'énumération Prisma", () => {
    for (const raison of [...RAISONS_ETAPE, RAISON_BONUS]) {
      expect(RAISONS_GEM, raison).toContain(raison);
    }
  });

  it("le bonus n'est PAS une raison d'étape — sinon il se compterait lui-même", () => {
    // Le prédicat du bonus compte les lignes d'étape. Si la raison de bonus y
    // figurait, un second appel verrait « toutes les étapes créditées » d'une
    // soirée à une étape dès qu'un bonus existe : le décompte serait faux.
    expect(RAISONS_ETAPE).not.toContain(RAISON_BONUS);
  });

  it("le barème livré est scellé", () => {
    expect(() => assertBaremeScelle()).not.toThrow();
  });
});
