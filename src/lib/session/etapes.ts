/**
 * « L'enfant a-t-il fini le travail de cette étape ? » — **FONCTION PURE**.
 *
 * ---------------------------------------------------------------------------
 * DEUX PRÉDICATS, DEUX NOMS, DEUX SOURCES (P2 §9.5, constat 26)
 * ---------------------------------------------------------------------------
 * La confusion qui a coûté une pierre à l'enfant venait d'un seul nom,
 * `estTerminee`, employé pour deux questions différentes. Elles sont désormais
 * nommées distinctement, et elles ne vivent pas dans le même fichier :
 *
 * | Prédicat | Question | Fondé sur | Employé par |
 * | --- | --- | --- | --- |
 * | `etapesCreditees()` (`src/lib/pierres/service.ts`) | cette étape a-t-elle **déjà donné sa pierre** ? | **le ledger** | le bonus, et lui seul |
 * | `etapeAchevee()` (ici) | l'enfant a-t-il **fini le travail** ? | les lignes `attempt` | **T10 et T12 uniquement** |
 *
 * **Le bonus ne lit jamais `attempt`.** Ce fichier n'est donc importé que par
 * le rattrapage des deux transitions d'interruption, et il le dit.
 *
 * Pourquoi la lecture des `attempt` est fiable là : T12 s'exécute le lendemain,
 * une fois que plus aucune requête n'est en vol ; T10 s'exécute sur décision
 * d'un parent présent.
 */
import { StatutTentative } from "@prisma/client";

import type { EtapePrevue } from "@/lib/validation/json";

/**
 * Les statuts qui disent « cet exercice ne bougera plus ».
 *
 * Dérivés de l'énumération Prisma par **soustraction** de `en_cours`, et non
 * recopiés (ARB-18 mesure 1) : un statut ajouté demain sera compté comme final
 * — ce qui est le bon défaut, puisque `en_cours` est le seul état d'attente —
 * et l'ajout se verra ici sans qu'on ait à y penser.
 *
 * Aucune valeur ne porte de jugement juste/faux : `passee` et `bloquee` sont
 * des faits, jamais des échecs (PED-04). Un exercice passé compte comme fini :
 * l'enfant n'est pas puni d'avoir passé (ETH-04).
 *
 * Neutraliser cette liste — la vider — ne casse rien visiblement : elle rendrait
 * simplement `etapeAchevee()` toujours faux, donc T12 ne rattraperait plus rien
 * et l'enfant perdrait ses pierres le lendemain d'une coupure. Le catalogue des
 * neutralisations le garde.
 */
export const STATUTS_FINAUX: readonly StatutTentative[] = Object.freeze(
  Object.values(StatutTentative).filter((s) => s !== StatutTentative.en_cours),
);

export function estStatutFinal(statut: StatutTentative): boolean {
  return STATUTS_FINAUX.includes(statut);
}

/** Une tentative, réduite à ce dont ce prédicat a besoin. */
export interface TentativeConnue {
  readonly exerciseId: string;
  readonly statut: StatutTentative;
}

/**
 * Vrai quand **toutes** les lignes `attempt` des exercices de l'étape portent
 * un statut final. Un exercice sans ligne du tout n'est pas achevé : l'absence
 * de trace n'est pas une preuve de travail (P2 §9.5, « la limite de la
 * garantie »).
 *
 * Une étape sans exercice ne peut pas exister (ARB-08) ; si elle existait, elle
 * serait déclarée **non achevée** plutôt qu'achevée par vacuité — même geste
 * que la garde `length === 0` du bonus.
 */
export function etapeAchevee(
  etape: EtapePrevue,
  tentatives: readonly TentativeConnue[],
): boolean {
  if (etape.exerciseIds.length === 0) return false;
  const finaux = new Set(
    tentatives.filter((t) => estStatutFinal(t.statut)).map((t) => t.exerciseId),
  );
  return etape.exerciseIds.every((id) => finaux.has(id));
}
