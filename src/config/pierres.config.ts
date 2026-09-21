/**
 * Barème des pierres — une seule table pour tout le projet (P2, §2 et §9.5).
 *
 * FORME CANONIQUE DU BARÈME, reprise mot pour mot partout où il est énoncé
 * (ARB-12, point 2) :
 *
 * > **Une soirée complète vaut toujours 3 pierres, quel que soit le nombre
 * > d'étapes programmées : +1 par étape terminée, plus un bonus de
 * > `3 − nombre d'étapes programmées` lorsque toutes le sont (ARB-13).** La
 * > section 3.7 du prompt maître écrit « +1 bonus si les 2 étapes du soir sont
 * > terminées » ; ARB-13 forfaitise la soirée parce que la pierre récompense le
 * > fait de venir et de finir, jamais le volume de travail (PED-05) — un enfant
 * > ne doit pas recevoir moins parce que son parent l'a ménagé un soir de
 * > fatigue.
 *
 * Trois propriétés à ne pas perdre à l'implémentation (P2, §9.5) :
 *  1. le bonus vaut 1 ou 2, jamais 0 ni négatif — PED-06 plafonne les étapes
 *     à deux, donc `3 − n ∈ {1, 2}` pour `n ∈ {1, 2}` ;
 *  2. une soirée sans aucune étape programmée ne crédite rien — le cas
 *     `sansDevoir` rendrait « toutes les étapes sont terminées » vrai par
 *     vacuité, et `3 − 0 = 3` ;
 *  3. le bonus est crédité par TOUTE transition menant à une soirée complète,
 *     jamais par une seule.
 *
 * Ce fichier porte les VALEURS. Le service qui crédite, le prédicat fondé sur
 * le ledger et les trois créditeurs sont livrés par la verticale V6
 * (`src/lib/pierres/`). Aucune valeur de barème ne doit y être réécrite.
 *
 * ETH-04 : aucun delta négatif n'existe, ici comme en base
 * (`gem_ledger_delta_positif`, `gem_ledger_delta_borne`).
 */

/**
 * Le forfait d'une soirée complète. C'est le seul nombre du barème qui ne se
 * déduit de rien : c'est la décision d'ARB-13 elle-même.
 */
export const FORFAIT_SOIREE_COMPLETE = 3;

/** Pierres créditées par étape programmée terminée. */
export const PIERRES_PAR_ETAPE = 1;

/** PED-06 — plafond d'étapes par soirée. Borne le bonus à {1, 2}. */
export const ETAPES_MAX_PAR_SOIREE = 2;

/**
 * Bornes du `delta` acceptées en base par `gem_ledger_delta_borne`
 * (supabase/policies.sql, partie B). Écrites ici pour que le service V6 et la
 * contrainte Postgres soient comparables sans relire le SQL.
 */
export const DELTA_MIN = 1;
export const DELTA_MAX = 2;

/**
 * Les trois seules raisons de crédit. Miroir exact de l'énumération
 * `RaisonGem` de `prisma/schema.prisma`. Jamais de pierre par bonne réponse
 * (PED-05).
 */
export const RAISONS_GEM = [
  "etape_lecture_terminee",
  "etape_maths_terminee",
  "bonus_soiree_complete",
] as const;

export type RaisonGem = (typeof RAISONS_GEM)[number];

export const PIERRES = Object.freeze({
  forfaitSoireeComplete: FORFAIT_SOIREE_COMPLETE,
  pierresParEtape: PIERRES_PAR_ETAPE,
  etapesMaxParSoiree: ETAPES_MAX_PAR_SOIREE,
  deltaMin: DELTA_MIN,
  deltaMax: DELTA_MAX,
  raisons: RAISONS_GEM,
});
