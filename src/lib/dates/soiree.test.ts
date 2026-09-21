import { describe, expect, it } from "vitest";

import {
  FUSEAU_FOYER,
  dateSoiree,
  estSoireePerimee,
  formaterDate,
  partiesCalendaires,
  partiesDateSeule,
} from "@/lib/dates/soiree";

/**
 * M-01 — LA GARDE DE T12, ÉPROUVÉE AVANT D'ÊTRE CÂBLÉE.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE
 * ---------------------------------------------------------------------------
 * `P4/V1.review.md`, tour 1, MINEUR 7 : « `estSoireePerimee()` porte la garde
 * T12 d'ARB-09 et n'a aucun test, là où son voisin `age.ts` en a seize. »
 * Le constat a été **versé au dossier d'entrée de V3, pas au backlog** : la
 * verticale qui câble T12 doit le tester **avant**, pas après.
 *
 * Ce que la garde décide, en clair : une session dont `session.date` appartient
 * à une soirée antérieure est close côté serveur (T12), et l'enfant est
 * accueilli sur les devoirs du jour. Si elle répond « non » à tort, l'enfant
 * retombe sur les devoirs de la veille — l'impasse que PRD-16 interdit et
 * qu'ARB-09 nomme. Si elle répond « oui » à tort, la soirée en cours est close
 * sous les doigts de l'enfant, au milieu d'une étape.
 *
 * ---------------------------------------------------------------------------
 * CE QUI EST CONTRÔLÉ, ET CE QUI NE L'EST PAS
 * ---------------------------------------------------------------------------
 * Aucun test ci-dessous ne recompare `formaterDate(a) < formaterDate(b)` : ce
 * serait une **re-dérivation**, et deux implémentations correctes d'une règle
 * fausse sont d'accord entre elles (`40-protocole-agents.mdc`). Les contrôles
 * sont des **propriétés** : antisymétrie, irréflexivité, stabilité sur une
 * journée entière de calendrier, et invariance au décalage horaire.
 *
 * La propriété est **quantifiée sur les 24 heures d'une journée**, y compris
 * les deux jours de bascule d'heure d'été : c'est là, et seulement là, qu'une
 * lecture en UTC d'un instant local change de jour.
 */

/** Une colonne `@db.Date` telle que Prisma la rend : minuit **UTC**. */
function colonneDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Un instant absolu, écrit en UTC. */
function instant(iso: string): Date {
  return new Date(iso);
}

// ---------------------------------------------------------------------------
// 1. Valeurs témoins — la table de vérité de la garde
// ---------------------------------------------------------------------------

describe("ARB-09 §1 — la garde, sur des cas écrits à la main", () => {
  /**
   * | `session.date` | instant (UTC) | heure de Paris | périmée ? |
   * | --- | --- | --- | --- |
   * | 2026-09-20 | 2026-09-21T16:00Z | 21 sept. 18 h | oui — la veille |
   * | 2026-09-21 | 2026-09-21T16:00Z | 21 sept. 18 h | non — le soir même |
   * | 2026-09-22 | 2026-09-21T16:00Z | 21 sept. 18 h | non — jamais dans le futur |
   * | 2026-09-20 | 2026-09-20T21:00Z | 20 sept. 23 h | non — encore le même soir |
   * | 2026-09-20 | 2026-09-20T22:30Z | **21 sept. 0 h 30** | oui — le jour a tourné |
   */
  const temoins: readonly (readonly [string, string, boolean])[] = [
    ["2026-09-20", "2026-09-21T16:00:00.000Z", true],
    ["2026-09-21", "2026-09-21T16:00:00.000Z", false],
    ["2026-09-22", "2026-09-21T16:00:00.000Z", false],
    ["2026-09-20", "2026-09-20T21:00:00.000Z", false],
    ["2026-09-20", "2026-09-20T22:30:00.000Z", true],
  ];

  for (const [date, quand, attendu] of temoins) {
    it(`session du ${date}, à ${quand} → ${attendu ? "périmée" : "en cours"}`, () => {
      expect(estSoireePerimee(colonneDate(date), instant(quand))).toBe(attendu);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Le cas qui a motivé le module : minuit à Paris n'est pas minuit en UTC
// ---------------------------------------------------------------------------

describe("ARB-09 §2 — la bascule de jour a lieu à l'heure du foyer", () => {
  /**
   * Le défaut que ce module existe pour empêcher : comparer deux `Date` par
   * leur valeur absolue. En été, 22 h 00 UTC est déjà minuit à Paris.
   * Une soirée commencée le 20 à 23 h 30 heure de Paris — soit 21 h 30 UTC —
   * appartient encore au 20, et ne doit pas être close.
   */
  it("21 h 30 UTC, un soir d'été : la soirée du 20 n'est PAS périmée", () => {
    // 21 h 30 UTC = 23 h 30 à Paris (UTC+2 en été). Toujours le 20.
    expect(estSoireePerimee(colonneDate("2026-09-20"), instant("2026-09-20T21:30:00.000Z"))).toBe(
      false,
    );
  });

  it("22 h 30 UTC, le même soir : le jour a tourné, la soirée du 20 EST périmée", () => {
    // 22 h 30 UTC = 0 h 30 le 21 à Paris. La soirée du 20 est finie.
    expect(estSoireePerimee(colonneDate("2026-09-20"), instant("2026-09-20T22:30:00.000Z"))).toBe(
      true,
    );
  });

  it("une lecture en UTC donnerait la réponse inverse à 22 h 30 — c'est le défaut évité", () => {
    // Contrôle du contrôle : on montre que la bonne réponse et la réponse
    // naïve diffèrent bien sur ce cas, sinon le test ci-dessus ne prouverait
    // rien. La « réponse naïve » est écrite ici et NULLE PART dans le produit.
    const naive = "2026-09-20" < instant("2026-09-20T22:30:00.000Z").toISOString().slice(0, 10);
    expect(naive).toBe(false);
    expect(estSoireePerimee(colonneDate("2026-09-20"), instant("2026-09-20T22:30:00.000Z"))).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Propriétés, quantifiées sur 24 heures et sur les deux bascules d'heure
// ---------------------------------------------------------------------------

/** Les 24 heures pleines d'une journée UTC, plus les demi-heures de bascule. */
function heuresDe(jour: string): readonly Date[] {
  const heures: Date[] = [];
  for (let h = 0; h < 24; h += 1) {
    heures.push(instant(`${jour}T${String(h).padStart(2, "0")}:00:00.000Z`));
    heures.push(instant(`${jour}T${String(h).padStart(2, "0")}:30:00.000Z`));
  }
  return heures;
}

/**
 * Quatre journées choisies pour ce qu'elles contiennent :
 * un jour ordinaire d'été (UTC+2), un jour ordinaire d'hiver (UTC+1), et les
 * **deux jours de bascule** de l'heure d'été en Europe.
 */
const JOURNEES: readonly string[] = [
  "2026-09-21",
  "2026-12-15",
  "2026-03-29",
  "2026-10-25",
];

describe("ARB-09 §3 — propriétés, sur 4 journées × 48 instants", () => {
  it("IRRÉFLEXIVE : la soirée du jour n'est jamais périmée, à aucune heure", () => {
    for (const jour of JOURNEES) {
      for (const quand of heuresDe(jour)) {
        const soiree = dateSoiree(quand);
        expect(
          estSoireePerimee(colonneDate(soiree), quand),
          `${soiree} à ${quand.toISOString()}`,
        ).toBe(false);
      }
    }
  });

  it("MONOTONE : la veille de la soirée courante est toujours périmée", () => {
    for (const jour of JOURNEES) {
      for (const quand of heuresDe(jour)) {
        const veille = new Date(quand.getTime() - 24 * 60 * 60 * 1000);
        const dateVeille = dateSoiree(veille);
        const dateCourante = dateSoiree(quand);
        if (dateVeille === dateCourante) continue; // même soirée : rien à dire
        expect(
          estSoireePerimee(colonneDate(dateVeille), quand),
          `${dateVeille} vue depuis ${quand.toISOString()}`,
        ).toBe(true);
      }
    }
  });

  it("ANTISYMÉTRIQUE : jamais périmée dans les deux sens", () => {
    for (const jour of JOURNEES) {
      for (const quand of heuresDe(jour)) {
        const demain = new Date(quand.getTime() + 24 * 60 * 60 * 1000);
        const a = dateSoiree(quand);
        const b = dateSoiree(demain);
        const aVersB = estSoireePerimee(colonneDate(a), demain);
        const bVersA = estSoireePerimee(colonneDate(b), quand);
        expect(aVersB && bVersA, `${a} / ${b}`).toBe(false);
      }
    }
  });

  it("AUCUNE soirée future n'est jamais périmée", () => {
    for (const jour of JOURNEES) {
      for (const quand of heuresDe(jour)) {
        const demain = new Date(quand.getTime() + 24 * 60 * 60 * 1000);
        expect(estSoireePerimee(colonneDate(dateSoiree(demain)), quand)).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Le fuseau est un PARAMÈTRE, et la garde en dépend réellement
// ---------------------------------------------------------------------------

describe("ARB-09 §4 — le fuseau du foyer (V2-02 : il deviendra une colonne)", () => {
  it("le fuseau livré est celui du foyer de la V1", () => {
    // Pas une re-dérivation : la valeur est une décision produit (1.2),
    // et V2-02 dit ce qui la remplacera. La figer ici rend visible le jour
    // où quelqu'un la change sans changer la ligne du backlog.
    expect(FUSEAU_FOYER).toBe("Europe/Paris");
  });

  it("CHANGER DE FUSEAU CHANGE LA RÉPONSE — donc le paramètre est bien consommé", () => {
    // 2026-09-20T22:30Z : le 21 à Paris, encore le 20 à Ponta Delgada (UTC-0).
    const quand = instant("2026-09-20T22:30:00.000Z");
    expect(estSoireePerimee(colonneDate("2026-09-20"), quand, "Europe/Paris")).toBe(true);
    expect(estSoireePerimee(colonneDate("2026-09-20"), quand, "Atlantic/Azores")).toBe(false);
  });

  it("un fuseau inconnu LÈVE au lieu de se replier sur UTC en silence", () => {
    // Fail-closed : un repli silencieux ferait basculer la soirée d'une heure
    // sans que rien ne le dise. `Intl` refuse, et c'est ce qu'on veut.
    expect(() =>
      estSoireePerimee(colonneDate("2026-09-20"), instant("2026-09-21T16:00:00.000Z"), "Pas/Un/Fuseau"),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 5. Les briques : une date seule se lit en UTC, un instant dans son fuseau
// ---------------------------------------------------------------------------

describe("ARB-09 §5 — les deux lectures ne se confondent pas", () => {
  it("une colonne @db.Date garde son jour, quel que soit le fuseau d'exécution", () => {
    // `partiesDateSeule` lit en UTC : c'est ce qui empêche `session.date` de
    // changer de jour dans un fuseau à décalage négatif.
    expect(partiesDateSeule(colonneDate("2026-09-21"))).toEqual({
      annee: 2026,
      mois: 9,
      jour: 21,
    });
  });

  it("un instant se lit dans le fuseau du foyer, pas en UTC", () => {
    expect(partiesCalendaires(instant("2026-09-20T22:30:00.000Z"))).toEqual({
      annee: 2026,
      mois: 9,
      jour: 21,
    });
  });

  it("`mois` est un mois de calendrier, jamais l'index 0-11 de Date", () => {
    expect(partiesCalendaires(instant("2026-01-15T12:00:00.000Z")).mois).toBe(1);
    expect(partiesDateSeule(colonneDate("2026-01-15")).mois).toBe(1);
  });

  it("formaterDate produit une forme triable, zéros compris", () => {
    expect(formaterDate({ annee: 2026, mois: 1, jour: 5 })).toBe("2026-01-05");
  });

  it("une date invalide LÈVE dans les deux lectures", () => {
    expect(() => partiesCalendaires(new Date("pas une date"))).toThrow();
    expect(() => partiesDateSeule(new Date("pas une date"))).toThrow();
  });
});
