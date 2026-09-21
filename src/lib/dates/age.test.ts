import { describe, expect, it } from "vitest";

import { ageEnAnnees } from "@/lib/dates/age";
import { FUSEAU_FOYER } from "@/lib/dates/soiree";

/**
 * PRD-02 — test de non-régression du calcul d'âge.
 *
 * Deux familles de contrôles, et la distinction compte
 * (`40-protocole-agents.mdc`, « Invariant plutôt que re-dérivation ») :
 *
 *  - Les **valeurs témoins** (§1) sont des dates calculées à la main et
 *    publiées dans le tableau ci-dessous. Ce ne sont pas une re-dérivation :
 *    aucune seconde implémentation de la règle n'intervient.
 *
 *  - Les **invariants** (§2 à §5) affirment des propriétés que le résultat doit
 *    satisfaire quelle que soit la façon dont il est obtenu. Ils n'écrivent
 *    jamais `annee − annee`, ne comparent jamais à un second calcul, et
 *    attrapent donc aussi une règle fausse uniformément appliquée. Un test qui
 *    recalculerait `reference.annee − naissance.annee − (avant ? 1 : 0)` serait
 *    d'accord avec le code même si la règle était fausse.
 *
 * La date de naissance est construite en UTC, comme la colonne `@db.Date` que
 * Prisma rend, et comme le seed l'écrit.
 */

/** 29 novembre 2019, la date de PRD-02. */
const EVAN = new Date(Date.UTC(2019, 10, 29));
/** Un 29 février, le seul cas de calendrier qui n'a pas d'anniversaire annuel. */
const BISSEXTILE = new Date(Date.UTC(2020, 1, 29));

/** Instant à midi, heure du foyer — loin de tout basculement de jour. */
function midi(annee: number, mois: number, jour: number): Date {
  return new Date(Date.UTC(annee, mois - 1, jour, 12, 0, 0));
}

function jourSuivant(instant: Date): Date {
  return new Date(instant.getTime() + 24 * 60 * 60 * 1000);
}

describe("PRD-02 — §1 valeurs témoins, calculées à la main", () => {
  /**
   * | Référence | Situation | Âge attendu |
   * | --- | --- | --- |
   * | 2019-11-29 | le jour même de la naissance | 0 |
   * | 2020-11-28 | veille du 1er anniversaire | 0 |
   * | 2020-11-29 | 1er anniversaire | 1 |
   * | 2026-09-21 | date de rédaction de ce test | 6 |
   * | 2026-11-28 | veille du 7e anniversaire | 6 |
   * | 2026-11-29 | 7e anniversaire | 7 |
   */
  const temoins: readonly (readonly [string, number])[] = [
    ["2019-11-29", 0],
    ["2020-11-28", 0],
    ["2020-11-29", 1],
    ["2026-09-21", 6],
    ["2026-11-28", 6],
    ["2026-11-29", 7],
  ];

  for (const [jour, attendu] of temoins) {
    it(`le ${jour}, Evan a ${attendu} an(s)`, () => {
      const [a, m, j] = jour.split("-").map(Number) as [number, number, number];
      expect(ageEnAnnees(EVAN, midi(a, m, j), FUSEAU_FOYER)).toBe(attendu);
    });
  }

  it("refuse une date de référence antérieure à la naissance", () => {
    expect(() => ageEnAnnees(EVAN, midi(2019, 11, 28), FUSEAU_FOYER)).toThrow();
  });
});

describe("PRD-02 — §2 invariant : l'âge ne décroît jamais et ne saute jamais", () => {
  /**
   * Balayage jour par jour sur dix ans. Deux propriétés, sans aucun recalcul :
   * l'âge est croissant au sens large, et chaque pas d'un jour l'augmente de 0
   * ou de 1 — jamais de 2, jamais de −1.
   */
  it.each([
    ["Evan (29/11/2019)", EVAN],
    ["un 29 février (29/02/2020)", BISSEXTILE],
  ])("%s : monotone, par pas de 0 ou 1", (_libelle, naissance) => {
    let instant = new Date(naissance.getTime() + 12 * 60 * 60 * 1000);
    let precedent = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
    const fin = midi(naissance.getUTCFullYear() + 10, 12, 31);

    while (instant.getTime() <= fin.getTime()) {
      const courant = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
      const pas = courant - precedent;
      expect(pas === 0 || pas === 1).toBe(true);
      precedent = courant;
      instant = jourSuivant(instant);
    }
  });
});

describe("PRD-02 — §3 invariant : exactement un incrément par année vécue", () => {
  /**
   * Sur dix années vécues, l'âge doit augmenter dix fois. Ni neuf — un
   * anniversaire manqué —, ni onze — un double incrément un 1er janvier.
   *
   * L'invariant ne sait pas comment l'âge se calcule : il compte des
   * changements de valeur.
   */
  it.each([
    ["Evan (29/11/2019)", EVAN],
    ["un 29 février (29/02/2020)", BISSEXTILE],
  ])("%s : dix incréments en dix ans", (_libelle, naissance) => {
    const annees = 10;
    const debut = new Date(naissance.getTime() + 12 * 60 * 60 * 1000);
    const fin = new Date(
      Date.UTC(
        naissance.getUTCFullYear() + annees,
        naissance.getUTCMonth(),
        naissance.getUTCDate(),
        12,
      ),
    );

    let instant = debut;
    let precedent = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
    let increments = 0;
    while (instant.getTime() < fin.getTime()) {
      instant = jourSuivant(instant);
      const courant = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
      if (courant !== precedent) increments += 1;
      precedent = courant;
    }

    expect(increments).toBe(annees);
    expect(ageEnAnnees(naissance, fin, FUSEAU_FOYER)).toBe(annees);
  });
});

describe("PRD-02 — §4 invariant : l'incrément tombe toujours le même jour du calendrier", () => {
  /**
   * L'ensemble des couples (mois, jour) auxquels l'âge change doit tenir en UN
   * seul élément pour une naissance ordinaire. C'est ce qui distingue un
   * anniversaire d'une règle fausse mais régulière — un incrément au 1er
   * janvier, ou à la rentrée scolaire, passerait les invariants §2 et §3 et
   * tombe ici.
   *
   * Le 29 février est publié à part : il n'a pas d'anniversaire les années non
   * bissextiles, donc son ensemble en compte deux, et c'est le comportement
   * attendu, pas un défaut.
   */
  function joursDIncrement(naissance: Date, annees: number): readonly string[] {
    const vus = new Set<string>();
    let instant = new Date(naissance.getTime() + 12 * 60 * 60 * 1000);
    let precedent = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
    const fin = midi(naissance.getUTCFullYear() + annees, 12, 31);
    while (instant.getTime() <= fin.getTime()) {
      const courant = ageEnAnnees(naissance, instant, FUSEAU_FOYER);
      if (courant !== precedent) {
        vus.add(
          `${String(instant.getUTCMonth() + 1).padStart(2, "0")}-${String(
            instant.getUTCDate(),
          ).padStart(2, "0")}`,
        );
      }
      precedent = courant;
      instant = jourSuivant(instant);
    }
    return [...vus].sort();
  }

  it("Evan : l'âge ne change que le 29 novembre", () => {
    expect(joursDIncrement(EVAN, 12)).toEqual(["11-29"]);
  });

  it("un 29 février : le 29 février, ou le 1er mars quand il n'existe pas", () => {
    expect(joursDIncrement(BISSEXTILE, 12)).toEqual(["02-29", "03-01"]);
  });
});

describe("PRD-02 — §5 invariant : l'âge ne dépend pas de l'heure de la soirée", () => {
  /**
   * Une session de devoirs se joue entre 17 h et 21 h, heure du foyer. L'âge ne
   * doit pas changer à l'intérieur d'une même soirée — ni à 22 h en été, quand
   * l'heure UTC a déjà basculé au lendemain.
   *
   * L'invariant se tient pour deux dates : une veille d'anniversaire et
   * l'anniversaire lui-même, en heure d'été comme en heure d'hiver.
   */
  it.each([
    ["veille d'anniversaire, heure d'hiver", "2026-11-28", "+01:00", 6],
    ["anniversaire, heure d'hiver", "2026-11-29", "+01:00", 7],
    ["soirée d'été", "2026-06-15", "+02:00", 6],
  ])("%s : la même valeur de 17 h à 22 h", (_libelle, jour, decalage, attendu) => {
    const heures = [17, 18, 19, 20, 21, 22];
    const valeurs = new Set(
      heures.map((h) =>
        ageEnAnnees(
          EVAN,
          new Date(`${jour}T${String(h).padStart(2, "0")}:30:00${decalage}`),
          FUSEAU_FOYER,
        ),
      ),
    );
    expect(valeurs.size).toBe(1);
    expect([...valeurs][0]).toBe(attendu);
  });
});
