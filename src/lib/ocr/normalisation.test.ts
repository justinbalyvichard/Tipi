import { describe, expect, it } from "vitest";

import { detecterLangue, normaliserTexteOcr, texteVide } from "@/lib/ocr/normalisation";

/**
 * Étape 3 du pipeline (3.2) — normalisation et détection fr/br.
 *
 * Le contrôle le plus important de ce fichier n'est pas une assertion de
 * résultat : c'est **l'absence de seuil numérique**. P2 §13 en fait une règle
 * opposable, et la détection est écrite pour n'en avoir aucun — elle constate
 * des marqueurs, elle ne compare pas une proportion à un pourcentage.
 * L'invariant C4 de `scripts/verifier-confinement.ts` le vérifie sur le
 * fichier ; ici, on vérifie que la règle **fonctionne** sans.
 */

describe("normalisation du texte brut", () => {
  it("unifie les fins de ligne et supprime les lignes vides", () => {
    expect(normaliserTexteOcr("Lis.\r\n\r\n\r\nLe renard.\r")).toBe("Lis.\nLe renard.");
  });

  it("réduit les espaces multiples et les espaces insécables", () => {
    expect(normaliserTexteOcr("Lis   le texte  .")).toBe("Lis le texte .");
  });

  it("supprime les signes de contrôle que l'OCR laisse passer", () => {
    expect(normaliserTexteOcr("Lis\u0000 le\u0007 texte")).toBe("Lis le texte");
  });

  it("compose les accents en NFC, pour que le caviardage de SEC-04 ne les rate pas", () => {
    // « é » décomposé (e + accent combinant) et « é » composé doivent devenir
    // la même chaîne : sinon un prénom accentué échapperait au caviardage.
    const decompose = "Évan lit";
    expect(normaliserTexteOcr(decompose)).toBe("Évan lit");
    expect(normaliserTexteOcr(decompose)).toBe(normaliserTexteOcr("Évan lit"));
  });

  it("ne corrige rien d'autre : ni orthographe, ni casse, ni ponctuation", () => {
    const brut = "LIS le txte a voix HAUTE !!!";
    expect(normaliserTexteOcr(brut)).toBe(brut);
  });
});

describe("texte vide — l'état « illisible » de PRD-16", () => {
  it("reconnaît un texte sans aucune lettre ni chiffre", () => {
    for (const rien of ["", "   ", "\n\n", "-- .. --", "•••"]) {
      expect(texteVide(rien), JSON.stringify(rien)).toBe(true);
    }
  });

  it("ne déclare pas vide un texte qui porte un seul chiffre", () => {
    expect(texteVide("7 + 5 =")).toBe(false);
  });
});

describe("détection de langue, sans aucun seuil", () => {
  it("reconnaît le français sur une consigne ordinaire", () => {
    expect(detecterLangue("Lis le texte à voix haute.").langue).toBe("fr");
    expect(detecterLangue("Calcule combien il reste de billes.").langue).toBe("fr");
  });

  it("reconnaît le breton sur ses graphèmes et ses mots grammaticaux", () => {
    expect(detecterLangue("Pelec'h emañ al louarn ?").langue).toBe("br");
    expect(detecterLangue("Lenn ar pennad-skrid.").langue).toBe("br");
  });

  it("reconnaît une page mixte, celle du cas réel d'Evan (PED-13)", () => {
    const page = "Lenn ar pennad-skrid.\nCalcule le nombre de billes dans la boîte.";
    expect(detecterLangue(page).langue).toBe("mixte");
  });

  it("replie sur le français quand aucun marqueur n'apparaît", () => {
    // Une page de calculs purs. Le repli est le bon : PED-13 fait expliquer
    // toute consigne en français de toute façon.
    expect(detecterLangue("7 + 5 =\n12 - 4 =").langue).toBe("fr");
  });

  it("nomme les marqueurs reconnus, pour que la calibration soit lisible", () => {
    const verdict = detecterLangue("Pelec'h emañ al louarn ?");
    expect(verdict.marqueursBreton.length).toBeGreaterThan(0);
    expect(verdict.marqueursFrancais).toEqual([]);
  });

  it("ne prend pas « part » ni « anse » pour des articles bretons", () => {
    // Les mots grammaticaux bretons sont cherchés en MOTS ENTIERS. Sans cela,
    // « ar » et « an » déclencheraient sur la moitié des consignes françaises.
    expect(detecterLangue("Range les parts dans l'anse du panier.").langue).toBe("fr");
  });

  it("ne dépend pas de l'ordre des lignes", () => {
    // Invariant : un résultat qui dépendrait de l'ordre trahirait un comptage
    // implicite, donc un seuil caché.
    const a = "Lenn ar pennad-skrid.\nCalcule le nombre de billes.";
    const b = "Calcule le nombre de billes.\nLenn ar pennad-skrid.";
    expect(detecterLangue(a).langue).toBe(detecterLangue(b).langue);
  });
});
