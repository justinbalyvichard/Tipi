/**
 * Le barème, appliqué — **FONCTIONS PURES** (ARB-13, P2 §9.5).
 *
 * FORME CANONIQUE DU BARÈME, reprise mot pour mot partout où il est énoncé :
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
 * `src/config/pierres.config.ts` porte les VALEURS ; ce module porte le calcul
 * et **le scellement de la configuration dont il dépend**. Aucune valeur n'y
 * est réécrite : `FORFAIT_SOIREE_COMPLETE`, `PIERRES_PAR_ETAPE`, `DELTA_MIN` et
 * `DELTA_MAX` sont importés.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE SCELLEMENT EST AU CHARGEMENT DU MODULE
 * ---------------------------------------------------------------------------
 * Leçon 3 du projet : *sceller la configuration dont dépend une garantie ; une
 * liste vide, un seuil à zéro, un motif qui ne matche rien éteignent une garde
 * sans la contourner.*
 *
 * Le barème est exactement cela. `FORFAIT_SOIREE_COMPLETE = 0` ne casse rien,
 * ne lève rien, ne rougit nulle part : il rend simplement `3 − n` négatif, donc
 * le bonus refusé par la borne, donc la soirée complète à 2 pierres au lieu de
 * 3 — l'écart d'une pierre qui rend le Soir léger détectable et qui a coûté
 * trois `FAIL` à G2. `PIERRES_PAR_ETAPE = 0` fait le même genre de dégât en
 * silence.
 *
 * `assertBaremeScelle()` est donc appelée **à l'import**. Un barème neutralisé
 * ne se découvre pas un soir, devant un enfant : il empêche le module de
 * charger, donc la route de répondre.
 */
import {
  DELTA_MAX,
  DELTA_MIN,
  ETAPES_MAX_PAR_SOIREE,
  FORFAIT_SOIREE_COMPLETE,
  PIERRES_PAR_ETAPE,
  RAISONS_GEM,
  type RaisonGem,
} from "@/config/pierres.config";
import { Matiere } from "@/lib/validation/json";

/**
 * La raison de crédit d'une étape, **dérivée de la matière** (ARB-18 mesure 1).
 * Le `switch` est exhaustif : ajouter une matière casse la compilation ici, et
 * non six mois plus tard sur une étape qui ne crédite rien.
 */
export function raisonEtape(matiere: Matiere): RaisonGem {
  switch (matiere) {
    case "lecture":
      return "etape_lecture_terminee";
    case "maths":
      return "etape_maths_terminee";
  }
}

/**
 * Les raisons qui comptent comme « une étape a donné sa pierre ».
 *
 * **Dérivée des matières**, jamais recopiée : c'est ce décompte que le prédicat
 * du bonus compare au nombre d'étapes programmées. Une liste recopiée qui
 * oublierait une matière ferait refuser le bonus à toute soirée contenant cette
 * matière — le défaut du constat 26, sous une autre forme.
 */
export const RAISONS_ETAPE: readonly RaisonGem[] = Object.freeze(
  Matiere.options.map((m) => raisonEtape(m)),
);

/** `bonus_soiree_complete` — nommée une fois, lue partout. */
export const RAISON_BONUS: RaisonGem = "bonus_soiree_complete";

/**
 * Le bonus d'ARB-13 : `3 − nombre d'étapes programmées`.
 *
 * Trois propriétés, et chacune est ici :
 *  1. il vaut 1 ou 2, jamais 0 ni négatif — un résultat hors des bornes de la
 *     base est un barème neutralisé, et LÈVE plutôt que de créditer de travers ;
 *  2. **une soirée sans aucune étape programmée ne crédite rien** — le cas
 *     `sansDevoir` rendrait « toutes les étapes sont terminées » vrai par
 *     vacuité, et `3 − 0 = 3` ;
 *  3. il est crédité par toute transition menant à une soirée complète — ce
 *     troisième point n'est pas ici : il est dans la machine, et il est
 *     quantifié par son test.
 */
export function bonusSoireeComplete(nbEtapesProgrammees: number): number {
  if (nbEtapesProgrammees <= 0) return 0;
  const bonus = FORFAIT_SOIREE_COMPLETE - nbEtapesProgrammees * PIERRES_PAR_ETAPE;
  if (!Number.isInteger(bonus) || bonus < DELTA_MIN || bonus > DELTA_MAX) {
    throw new Error(
      `Barème neutralisé : le bonus de ${nbEtapesProgrammees} étape(s) vaut ${bonus}, hors des bornes ${DELTA_MIN}..${DELTA_MAX} de gem_ledger_delta_borne (ARB-13).`,
    );
  }
  return bonus;
}

/**
 * Le total qu'une soirée complète doit valoir. **Une constante de décision, pas
 * un calcul** : c'est l'énoncé d'ARB-13 lui-même, et c'est contre lui que
 * l'invariant du forfait se vérifie, sans jamais recalculer `3 − n`.
 */
export const TOTAL_SOIREE_COMPLETE = FORFAIT_SOIREE_COMPLETE;

/**
 * Les valeurs dont le barème dépend, réunies en un objet **pour pouvoir être
 * neutralisées dans un test**.
 *
 * Sans ce paramètre, le scellement ne serait vérifiable que dans un sens : on
 * pourrait montrer qu'il ne lève pas sur la configuration livrée, jamais qu'il
 * lève sur une configuration éteinte. *Un instrument qui n'a jamais rougi est
 * non éprouvé.*
 */
export interface ConfigBareme {
  readonly forfait: number;
  readonly pierresParEtape: number;
  readonly etapesMax: number;
  readonly deltaMin: number;
  readonly deltaMax: number;
  readonly raisonsEtape: readonly RaisonGem[];
  readonly raisonBonus: RaisonGem;
  readonly raisonsConnues: readonly RaisonGem[];
}

/** La configuration réellement livrée. Aucune valeur n'est écrite ici. */
export const CONFIG_BAREME_LIVREE: ConfigBareme = Object.freeze({
  forfait: FORFAIT_SOIREE_COMPLETE,
  pierresParEtape: PIERRES_PAR_ETAPE,
  etapesMax: ETAPES_MAX_PAR_SOIREE,
  deltaMin: DELTA_MIN,
  deltaMax: DELTA_MAX,
  raisonsEtape: RAISONS_ETAPE,
  raisonBonus: RAISON_BONUS,
  raisonsConnues: RAISONS_GEM,
});

/**
 * Scellement du barème. Appelée **à l'import de ce module** sur la
 * configuration livrée, et par le catalogue des neutralisations
 * (`src/config/neutralisations.test.ts`) sur des configurations éteintes.
 *
 * Chaque vérification porte **la phrase disant ce que sa neutralité éteindrait**
 * (ARB-18 mesure 2).
 */
export function assertBaremeScelle(config: ConfigBareme = CONFIG_BAREME_LIVREE): void {
  const defauts: string[] = [];

  if (config.pierresParEtape < config.deltaMin || config.pierresParEtape > config.deltaMax) {
    defauts.push(
      `PIERRES_PAR_ETAPE = ${config.pierresParEtape} : à zéro, une étape terminée ne crédite rien et la soirée complète ne vaut plus 3 pierres (ARB-13).`,
    );
  }
  if (config.forfait <= 0) {
    defauts.push(
      `FORFAIT_SOIREE_COMPLETE = ${config.forfait} : à zéro, le forfait d'ARB-13 disparaît et le Soir léger redevient détectable à une pierre près (ARB-06).`,
    );
  }
  if (config.etapesMax <= 0) {
    defauts.push(
      `ETAPES_MAX_PAR_SOIREE = ${config.etapesMax} : à zéro, aucune soirée ne peut être programmée et PED-06 n'a plus rien à plafonner.`,
    );
  }
  if (config.deltaMin <= 0 || config.deltaMax < config.deltaMin) {
    defauts.push(
      `bornes ${config.deltaMin}..${config.deltaMax} : un delta nul ou négatif franchirait le code et se ferait refuser par la base (ETH-04), au milieu d'une transaction de transition.`,
    );
  }
  if (config.raisonsEtape.length === 0) {
    defauts.push(
      "RAISONS_ETAPE est vide : le prédicat du bonus compterait toujours zéro étape créditée, donc ne verserait jamais le bonus — l'enfant perdrait une pierre chaque soir, sans qu'aucun test d'unité ne rougisse.",
    );
  }
  if (config.raisonsEtape.includes(config.raisonBonus)) {
    defauts.push(
      "la raison du bonus figure parmi les raisons d'étape : le bonus se compterait lui-même, et une soirée à une étape paraîtrait complète dès qu'un bonus existe.",
    );
  }
  for (const raison of [...config.raisonsEtape, config.raisonBonus]) {
    if (!config.raisonsConnues.includes(raison)) {
      defauts.push(
        `« ${raison} » n'existe pas dans l'énumération RaisonGem : le crédit serait refusé par la base au moment de l'écriture, donc la transition entière annulée.`,
      );
    }
  }
  // La borne d'ARB-13 : avec un plafond de deux étapes, `3 − n` doit tomber
  // dans 1..2 pour toute soirée programmable. On l'affirme sur toutes les
  // tailles atteignables plutôt que sur un exemple.
  for (let n = 1; n <= config.etapesMax; n += 1) {
    const bonus = config.forfait - n * config.pierresParEtape;
    if (bonus < config.deltaMin || bonus > config.deltaMax) {
      defauts.push(
        `une soirée de ${n} étape(s) donnerait un bonus de ${bonus}, hors des bornes acceptées en base : cette soirée-là ne vaudrait pas 3 pierres (ARB-13).`,
      );
    }
  }

  if (defauts.length > 0) {
    throw new Error(`Barème neutralisé (ARB-13) : ${defauts.join(" | ")}`);
  }
}

assertBaremeScelle();
