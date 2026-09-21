/**
 * Service pierres — **SERVEUR UNIQUEMENT** (TEC-11, SEC-06, P2 §7 et §9.5).
 *
 * Le seul module du projet qui écrive dans `gem_ledger` et dans
 * `child.gem_balance`. Le client n'écrit jamais un solde, et **aucune route
 * n'accepte un montant** : le montant est décidé ici, à partir du barème.
 *
 * ---------------------------------------------------------------------------
 * CE QUE V3 LIVRE, ET CE QUE V6 AJOUTERA
 * ---------------------------------------------------------------------------
 * `src/config/pierres.config.ts` annonce ce fichier comme un livrable de V6.
 * V3 le livre quand même, et la raison est dans la spécification elle-même :
 * la section 3.3 écrit que **chaque transition crédite les pierres via le
 * service serveur**, et P2 §9.4 que le crédit vit **dans la transaction de la
 * transition**. Une machine à états livrée sans son créditeur serait une
 * machine dont chaque chemin nominal est faux, et le rattrapage d'ARB-13 — qui
 * est le cœur de cette verticale — n'aurait rien à rattraper.
 *
 * Ce que V3 ne livre pas et laisse entier à V6 : le coffre (`GET /api/coffre`),
 * les paliers, les cosmétiques, le script `verifier-solde.ts`. Aucune valeur de
 * barème n'est réécrite ici — elles viennent toutes de la configuration.
 *
 * ---------------------------------------------------------------------------
 * L'IDEMPOTENCE : L'UNIQUE `(session_id, raison)`, ET LE VERROU
 * ---------------------------------------------------------------------------
 * `@@unique([sessionId, raison])` rend un double crédit impossible en base.
 * Mais une violation d'unicité **avorte la transaction Postgres en cours**, et
 * avec elle toute la transition : on ne peut donc pas s'en servir comme d'un
 * `if`. Le crédit lit donc d'abord, puis écrit, et cette lecture est sûre parce
 * que la transition détient déjà le verrou `SELECT … FOR UPDATE` sur la ligne
 * `session` (P2 §9.3, étape 1). L'unique reste le garde-fou de dernier ressort,
 * jamais le mécanisme de décision.
 */
import type { Prisma } from "@prisma/client";

import { DELTA_MAX, DELTA_MIN, PIERRES_PAR_ETAPE, type RaisonGem } from "@/config/pierres.config";
import {
  RAISONS_ETAPE,
  RAISON_BONUS,
  bonusSoireeComplete,
  raisonEtape,
} from "@/lib/pierres/bareme";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import type { Matiere } from "@/lib/validation/json";

garderServeur("src/lib/pierres/service.ts");

/** Le strict nécessaire pour créditer : à qui, et pour quelle soirée. */
export interface ContexteCredit {
  readonly sessionId: string;
  readonly childId: string;
}

type Tx = Prisma.TransactionClient;

/**
 * Recalcule `child.gem_balance` **depuis le ledger** (SEC-06), au lieu de
 * l'incrémenter. Un incrément suppose que le cache était juste ; une somme ne
 * suppose rien. L'invariant `gem_balance == SUM(delta)` est donc rétabli à
 * chaque crédit, et non seulement espéré.
 */
async function recalculerSolde(tx: Tx, childId: string): Promise<number> {
  const somme = await tx.gemLedger.aggregate({
    where: { childId },
    _sum: { delta: true },
  });
  const solde = somme._sum.delta ?? 0;
  await tx.child.update({ where: { id: childId }, data: { gemBalance: solde } });
  return solde;
}

/**
 * Écrit une ligne de ledger, si elle n'existe pas déjà, et rend le nombre de
 * pierres réellement créditées — `0` quand la raison était déjà servie.
 *
 * Le montant est borné avant écriture : un delta hors de `1..2` serait refusé
 * par `gem_ledger_delta_borne`, ce qui annulerait la transition entière. Le
 * refuser ici nomme la cause au lieu de la faire découvrir par Postgres.
 */
export async function crediter(
  tx: Tx,
  contexte: ContexteCredit,
  raison: RaisonGem,
  delta: number,
): Promise<number> {
  if (!Number.isInteger(delta) || delta < DELTA_MIN || delta > DELTA_MAX) {
    throw new Error(
      `Delta de ${delta} pour « ${raison} » : hors des bornes ${DELTA_MIN}..${DELTA_MAX} (ETH-04, ARB-13).`,
    );
  }
  const deja = await tx.gemLedger.findUnique({
    where: { sessionId_raison: { sessionId: contexte.sessionId, raison } },
    select: { id: true },
  });
  if (deja !== null) return 0;

  await tx.gemLedger.create({
    data: {
      childId: contexte.childId,
      sessionId: contexte.sessionId,
      delta,
      raison,
    },
  });
  await recalculerSolde(tx, contexte.childId);
  return delta;
}

/** `+1` pour une étape terminée. Le montant vient du barème, jamais d'une route. */
export async function crediterEtape(
  tx: Tx,
  contexte: ContexteCredit,
  matiere: Matiere,
): Promise<number> {
  return crediter(tx, contexte, raisonEtape(matiere), PIERRES_PAR_ETAPE);
}

/**
 * Combien d'étapes de cette session ont **déjà donné leur pierre**.
 *
 * PRÉDICAT FONDÉ SUR LE LEDGER, et non sur les lignes `attempt` (P2 §9.5,
 * constat 26). Le `+1` d'une étape est déclenché par l'**événement**
 * `ETAPE_TERMINEE` ; conditionner le bonus aux `attempt`, écrits par une route
 * distincte dont l'ordre n'est garanti nulle part, faisait perdre une pierre à
 * l'enfant sur le chemin nominal.
 */
export async function etapesCreditees(tx: Tx, sessionId: string): Promise<number> {
  return tx.gemLedger.count({
    where: { sessionId, raison: { in: [...RAISONS_ETAPE] } },
  });
}

/**
 * Le bonus d'ARB-13 — appelé par **T5, T10 et T12**, dans LEUR transaction, et
 * toujours **après** les crédits d'étape de cette même transaction.
 *
 * Rend le nombre de pierres créditées : `0` si la soirée n'est pas complète, si
 * elle ne portait aucune étape, ou si le bonus a déjà été versé.
 */
export async function crediterBonusSiSoireeComplete(
  tx: Tx,
  contexte: ContexteCredit,
  nbEtapesProgrammees: number,
): Promise<number> {
  // Propriété 2 : `sansDevoir` ne crédite rien. Sans cette garde, « toutes les
  // étapes sont terminées » serait vrai par vacuité et vaudrait 3 pierres.
  if (nbEtapesProgrammees <= 0) return 0;

  const creditees = await etapesCreditees(tx, contexte.sessionId);
  if (creditees !== nbEtapesProgrammees) return 0;

  return crediter(tx, contexte, RAISON_BONUS, bonusSoireeComplete(nbEtapesProgrammees));
}

/**
 * Somme des pierres de CETTE session. Sert le snapshot (`pierresDuSoir`) et
 * l'invariant du forfait : une session finale dont toutes les étapes sont
 * créditées vaut exactement `TOTAL_SOIREE_COMPLETE`.
 */
export async function pierresDeLaSession(tx: Tx, sessionId: string): Promise<number> {
  const somme = await tx.gemLedger.aggregate({
    where: { sessionId },
    _sum: { delta: true },
  });
  return somme._sum.delta ?? 0;
}
