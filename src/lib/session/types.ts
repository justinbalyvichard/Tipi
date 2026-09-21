/**
 * Vocabulaire de la machine à états de session (TEC-10, P2 §9.1).
 *
 * Ce module ne contient **aucune logique** : il porte les neuf états, les dix
 * événements, la forme du plan de soirée et celle d'une transition. Il est
 * importable partout, client compris — il ne lit ni base, ni environnement.
 *
 * Les neuf états ne sont pas redéclarés ici : ils viennent de
 * `src/lib/validation/json.ts`, qui est le propriétaire du schéma Zod miroir de
 * l'énumération Prisma. Une redéclaration serait une seconde liste à tenir à
 * jour, donc une divergence qui attend son jour (ARB-18 mesure 1).
 */
import { z } from "zod";

import { EtatSession, Matiere, type EtapePrevue } from "@/lib/validation/json";

export { EtatSession, Matiere };

/** Les neuf états, dans l'ordre de l'énumération Prisma. Dérivés, pas recopiés. */
export const ETATS: readonly EtatSession[] = Object.freeze([...EtatSession.options]);

/**
 * Les états d'où **aucune transition n'est possible** (P2, §9.2).
 *
 * C'est aussi la définition de « session active » par la négative : l'aiguillage
 * de `GET /api/etat` cherche une session dont l'état n'est **pas** ici, et
 * l'unique partiel de `supabase/policies.sql` libère le créneau dès qu'on y
 * entre. Vider cette liste rendrait toute session éternellement active ; la
 * remplir la rendrait immédiatement close. Les deux sont contrôlés par
 * `src/config/neutralisations.test.ts`.
 */
export const ETATS_FINAUX: readonly EtatSession[] = Object.freeze(["termine", "abandon_parent"]);

export function estEtatFinal(etat: EtatSession): boolean {
  return ETATS_FINAUX.includes(etat);
}

/** Les deux états d'étape, seuls d'où la pause est atteignable (PRD-12). */
export function etatDeMatiere(matiere: Matiere): EtatSession {
  switch (matiere) {
    case "lecture":
      return "etape_lecture";
    case "maths":
      return "etape_maths";
  }
}

/**
 * Les dix événements de la table 9.2. L'énumération est **fermée** : un
 * événement inconnu ne franchit pas le schéma Zod de la route.
 *
 * `ETAPE_VIDE` du tour 1 de l'architecture n'existe pas : une étape sans
 * exercice n'est plus jamais programmée (ARB-08).
 */
export const Evenement = z.enum([
  "DEMARRER",
  "PROGRAMME_VU",
  "ETAPE_TERMINEE",
  "TRANSITION_VUE",
  "PAUSE_DEMANDEE",
  "PAUSE_TERMINEE",
  "CLOTURE_VUE",
  "ABANDON_PARENT",
  "BLOCAGE",
  "CLOTURE_AUTOMATIQUE",
]);
export type Evenement = z.infer<typeof Evenement>;

export const EVENEMENTS: readonly Evenement[] = Object.freeze([...Evenement.options]);

/** Identifiants des douze règles de la table 9.2. Sert aux journaux et aux tests. */
export type RegleId =
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6"
  | "T7"
  | "T8"
  | "T9"
  | "T10"
  | "T11"
  | "T12";

/**
 * Le plan de la soirée, tel que la machine le voit.
 *
 * C'est **tout** ce dont elle a besoin : ni base, ni horloge, ni requête.
 * `etapeCourante` est l'index dans `etapes`, `null` avant `annonce`.
 */
export interface PlanSession {
  readonly etapes: readonly EtapePrevue[];
  readonly etapeCourante: number | null;
}

/**
 * Un effet de bord décidé par la machine et **exécuté par le service**.
 *
 * La machine ne fait rien : elle dit ce qu'il y a à faire. C'est ce qui la
 * garde pure, donc parcourable état par état par un test sans base (P2 §9.2),
 * et c'est ce qui permet de **quantifier** sur les effets — notamment de
 * vérifier qu'aucune transition menant à une soirée complète n'oublie le bonus
 * (ARB-13, propriété 3).
 */
export type Effet =
  /** T1 — `started_at`. */
  | { readonly type: "demarrer" }
  /** T4, T5 — `+1` pour l'étape qui vient d'être terminée. */
  | { readonly type: "crediter_etape"; readonly matiere: Matiere }
  /**
   * T10, T12 — crédite les étapes **achevées et non encore créditées**.
   * Fondé sur les lignes `attempt` (`etapeAchevee`), et sur elles seules.
   */
  | { readonly type: "rattraper_etapes_achevees" }
  /**
   * T5, T10, T12 — le bonus d'ARB-13, fondé sur le **ledger** et jamais sur
   * les `attempt`. Placé APRÈS les crédits d'étape dans la liste, et c'est
   * cet ordre qui fait tenir le prédicat (P2 §9.5).
   */
  | { readonly type: "crediter_bonus_si_complete" }
  /** T3, T9, T10, T12 — `ended_at`. */
  | { readonly type: "terminer" }
  /** T10 — `arret_parent = true` (PRD-13). Les pierres acquises restent (ETH-04). */
  | { readonly type: "arret_parent" }
  /** T7, T11 — fait qualitatif pour le résumé parent (PRD-06). Aucune pierre. */
  | { readonly type: "fait"; readonly fait: "pause" | "blocage" };

export interface Transition {
  readonly regle: RegleId;
  readonly vers: EtatSession;
  /** Valeur d'`etape_courante` APRÈS la transition. */
  readonly etapeCourante: number | null;
  readonly effets: readonly Effet[];
}

export type ResultatTransition =
  | { readonly ok: true; readonly transition: Transition }
  | { readonly ok: false; readonly motif: string };

/**
 * Le cliché rendu par les routes de session (P2, §8.3).
 * Aucun champ n'est un texte destiné à un humain : l'écran choisit ses clés.
 */
export interface Snapshot {
  readonly id: string;
  readonly etat: EtatSession;
  readonly etapeCourante: number | null;
  readonly etapes: readonly EtapePrevue[];
  readonly matiereCourante: Matiere | null;
  readonly exerciceCourant: string | null;
  readonly indicesDejaVus: number;
  readonly soirLeger: boolean;
  readonly arretParent: boolean;
  /** Somme des pierres de CETTE session. Jamais le solde du coffre (V6). */
  readonly pierresDuSoir: number;
}
