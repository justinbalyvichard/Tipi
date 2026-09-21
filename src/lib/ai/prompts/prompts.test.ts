import { describe, expect, it } from "vitest";

import {
  CLAUSE_JAMAIS_LE_RESULTAT,
  PROMPT_2_INDICES,
} from "@/lib/ai/prompts/prompt-2-indices";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";
import { PROMPT_3_QUESTIONS } from "@/lib/ai/prompts/prompt-3-questions";
import {
  CORPUS_INSISTANCE_PED_01,
  contientResultat,
  enLettres,
  niveauxQuiDonnentLeResultat,
} from "@/lib/ai/prompts/ped-01";

/**
 * Les trois prompts de la section 3.6, et **le terrain de PED-01**.
 *
 * Ce que ce fichier prouve : que les prompts portent ce que le prompt maître
 * leur demande de porter, et que le détecteur que P5 utilisera **mord** — en
 * chiffres comme en toutes lettres.
 *
 * Ce qu'il ne prouve pas, et que personne ne doit lui faire dire : qu'un vrai
 * modèle ne donne jamais le résultat. Cela demande d'appeler le modèle, donc un
 * compte externe (ESC-000), et c'est le test de non-régression que P5 écrira
 * avec les outils livrés ici.
 */

describe("les trois prompts de 3.6 sont versionnés", () => {
  for (const prompt of [PROMPT_1_STRUCTURATION, PROMPT_2_INDICES, PROMPT_3_QUESTIONS]) {
    it(`« ${prompt.id} » porte une version et un texte non vide`, () => {
      expect(prompt.version).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(prompt.texte.trim().length).toBeGreaterThan(0);
    });
  }

  it("les trois identifiants sont distincts", () => {
    const ids = [PROMPT_1_STRUCTURATION.id, PROMPT_2_INDICES.id, PROMPT_3_QUESTIONS.id];
    expect(new Set(ids).size).toBe(3);
  });

  it("aucun prompt ne porte de jeton de contenu ni de donnée du foyer (SEC-04)", () => {
    // Un prompt est une constante du produit, identique pour tous les enfants :
    // c'est la moitié « prompt » de l'invariant de dérivabilité.
    for (const prompt of [PROMPT_1_STRUCTURATION, PROMPT_2_INDICES, PROMPT_3_QUESTIONS]) {
      expect(prompt.texte, prompt.id).not.toMatch(/\{\{?\s*\w+\s*\}?\}/u);
      expect(prompt.texte, prompt.id).not.toMatch(/evan/iu);
    }
  });
});

describe("PED-01 — le prompt 2 porte la promesse produit", () => {
  it("contient la clause « jamais le résultat », extraite et non recopiée", () => {
    expect(PROMPT_2_INDICES.texte).toContain(CLAUSE_JAMAIS_LE_RESULTAT);
    expect(CLAUSE_JAMAIS_LE_RESULTAT).toMatch(/JAMAIS/u);
    expect(CLAUSE_JAMAIS_LE_RESULTAT).toMatch(/même si on insiste/u);
  });

  it("décrit les quatre niveaux de PED-02, dans l'ordre", () => {
    const texte = PROMPT_2_INDICES.texte;
    const positions = ["1)", "2)", "3)", "4)"].map((n) => texte.indexOf(n));
    expect(positions.every((p) => p !== -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("le niveau 4 interdit explicitement de prononcer le résultat", () => {
    expect(PROMPT_2_INDICES.texte).toContain("sans jamais prononcer le résultat final");
  });
});

describe("PED-01 — le détecteur que P5 rejouera", () => {
  it("trouve le résultat écrit en chiffres", () => {
    expect(contientResultat("Alors ça fait 12 en tout.", 12).trouve).toBe(true);
  });

  it("trouve le résultat écrit en toutes lettres — le contournement évident", () => {
    // Un modèle à qui l'on interdit d'écrire « 12 » écrit « douze ». Un
    // détecteur aveugle aux lettres afficherait le défaut sans le voir.
    expect(contientResultat("Alors ça fait douze en tout.", 12).trouve).toBe(true);
    expect(contientResultat("Tu arrives à quatre-vingts.", 80).trouve).toBe(true);
    expect(contientResultat("On tombe sur soixante-et-onze.", 71).trouve).toBe(true);
  });

  it("ne se déclenche pas sur un nombre qui en contient un autre", () => {
    expect(contientResultat("Il y a 120 billes dans la boîte.", 12).trouve).toBe(false);
    expect(contientResultat("En 2012, …", 12).trouve).toBe(false);
  });

  it("ne se déclenche pas sur un indice honnête", () => {
    expect(
      contientResultat("Tu peux compter sur tes doigts, un par un.", 12).trouve,
    ).toBe(false);
  });

  it("déclare son incomplétude au lieu de conclure, hors de ses bornes", () => {
    // Règle 5 de `40-protocole-agents.mdc` : un instrument qui affiche le
    // défaut sans le voir est pire qu'un instrument muet.
    const verdict = contientResultat("le total est quatre mille deux cent quarante-deux", 4242);
    expect(verdict.horsBornes).toBe(true);
    expect(enLettres(4242)).toBeNull();
  });

  it("nomme les niveaux fautifs, et rien qu'eux", () => {
    const indices = [
      "Qu'est-ce qu'on te demande de trouver ?",
      "Compte sur tes doigts.",
      "Essaie avec 2 + 1 pour voir.",
      "Le résultat est douze.",
    ];
    expect(niveauxQuiDonnentLeResultat(indices, 12)).toEqual([4]);
    expect(niveauxQuiDonnentLeResultat(indices.slice(0, 3), 12)).toEqual([]);
  });

  it("le corpus d'insistance couvre plusieurs formes de demande", () => {
    expect(CORPUS_INSISTANCE_PED_01.length).toBeGreaterThanOrEqual(5);
    expect(new Set(CORPUS_INSISTANCE_PED_01).size).toBe(CORPUS_INSISTANCE_PED_01.length);
  });
});

describe("la table des nombres en lettres", () => {
  const temoins: readonly [number, string][] = [
    [0, "zéro"],
    [7, "sept"],
    [12, "douze"],
    [16, "seize"],
    [17, "dix-sept"],
    [21, "vingt-et-un"],
    [30, "trente"],
    [42, "quarante-deux"],
    [60, "soixante"],
    [71, "soixante-et-onze"],
    [79, "soixante-dix-neuf"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [99, "quatre-vingt-dix-neuf"],
    [100, "cent"],
  ];

  for (const [n, mot] of temoins) {
    it(`${n} s'écrit « ${mot} »`, () => {
      expect(enLettres(n)).toBe(mot);
    });
  }

  it("rend null hors des bornes déclarées, sans deviner", () => {
    expect(enLettres(-1)).toBeNull();
    expect(enLettres(101)).toBeNull();
    expect(enLettres(1.5)).toBeNull();
  });
});
