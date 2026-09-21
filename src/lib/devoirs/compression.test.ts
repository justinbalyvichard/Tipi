import { describe, expect, it } from "vitest";

import { COTE_MAX_PX, dimensionsCibles } from "@/lib/devoirs/compression";

/**
 * Étape 1 du pipeline — la partie **calculable** de la compression client.
 *
 * Le dessin sur canevas n'est pas testé ici : il exige un navigateur, et c'est
 * précisément pourquoi il a été réduit à quelques lignes autour de cette
 * fonction pure. P6 le couvrira en recette réelle, sur un vrai appareil — le
 * seul endroit où il existe vraiment.
 */

describe("cadrage de la photo avant envoi", () => {
  it("réduit le plus grand côté à la borne, en paysage comme en portrait", () => {
    expect(dimensionsCibles({ largeur: 4000, hauteur: 3000 })).toEqual({
      largeur: COTE_MAX_PX,
      hauteur: 1200,
    });
    expect(dimensionsCibles({ largeur: 3000, hauteur: 4000 })).toEqual({
      largeur: 1200,
      hauteur: COTE_MAX_PX,
    });
  });

  it("N'AGRANDIT JAMAIS une image déjà petite", () => {
    // Réagrandir n'ajouterait aucune information et coûterait des octets sur
    // le réseau d'un téléphone, un soir de semaine.
    expect(dimensionsCibles({ largeur: 800, hauteur: 600 })).toEqual({
      largeur: 800,
      hauteur: 600,
    });
  });

  it("laisse intacte une image pile à la borne", () => {
    expect(dimensionsCibles({ largeur: COTE_MAX_PX, hauteur: 900 })).toEqual({
      largeur: COTE_MAX_PX,
      hauteur: 900,
    });
  });

  it("INVARIANT : les proportions sont conservées", () => {
    for (const source of [
      { largeur: 4032, hauteur: 3024 },
      { largeur: 3024, hauteur: 4032 },
      { largeur: 5000, hauteur: 1000 },
      { largeur: 1000, hauteur: 5000 },
    ]) {
      const cible = dimensionsCibles(source);
      const avant = source.largeur / source.hauteur;
      const apres = cible.largeur / cible.hauteur;
      expect(Math.abs(avant - apres)).toBeLessThan(0.01);
    }
  });

  it("INVARIANT : aucun côté ne tombe à zéro, même sur une image très allongée", () => {
    // Une bande de 6000 × 2 px arrondirait à 0 sans la borne basse, et le
    // canevas refuserait de dessiner — donc la photo partirait non compressée
    // au lieu de partir du tout.
    const cible = dimensionsCibles({ largeur: 6000, hauteur: 2 });
    expect(cible.largeur).toBeGreaterThan(0);
    expect(cible.hauteur).toBeGreaterThan(0);
  });

  it("rend zéro sur une source dégénérée, sans lever", () => {
    expect(dimensionsCibles({ largeur: 0, hauteur: 0 })).toEqual({ largeur: 0, hauteur: 0 });
  });
});
