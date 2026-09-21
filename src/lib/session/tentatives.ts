/**
 * La trace d'une tentative — **SERVEUR UNIQUEMENT** (PRD-18, P2 §8.3).
 *
 * Vit dans `src/lib/` et non dans la route, parce que « `src/app/api/` valide,
 * autorise, appelle `src/lib`, mappe les erreurs — et ne contient jamais de
 * logique métier » (P2 §2). La règle n'est pas cosmétique ici : c'est cette
 * ligne `attempt` que `etapeAchevee()` lit pour décider quelles étapes T10 et
 * T12 rattrapent, donc elle appartient au moteur de session.
 *
 * Ce que ce module n'écrit jamais :
 *  - `nbIndicesUtilises`, réservé à `POST /api/indices` (V5, constat 7) — sans
 *    quoi le client déciderait du compte d'indices, donc contournerait PED-02 ;
 *  - `motsHesitants`, écrit par le rapprochement de lecture de V4 (3.4).
 */
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { ETATS_FINAUX } from "@/lib/session/types";
import type { StatutTentative } from "@prisma/client";

garderServeur("src/lib/session/tentatives.ts");

export interface DemandeTentative {
  readonly sessionId: string;
  readonly exerciseId: string;
  readonly statut: StatutTentative;
  readonly nbSollicitations?: number;
  readonly transcription?: string;
}

/**
 * Upsert sur `(sessionId, exerciseId)` : la reprise met à jour **la même
 * ligne**, elle n'en crée pas une seconde (PRD-18).
 *
 * Une session close n'accepte plus de trace : ce serait réécrire le passé, et
 * le rattrapage de T12 lit précisément ces lignes-là.
 */
export async function enregistrerTentative(demande: DemandeTentative): Promise<string> {
  garderServeur("src/lib/session/tentatives.ts");

  const courante = await prisma.session.findUnique({
    where: { id: demande.sessionId },
    select: { id: true, etat: true },
  });
  if (courante === null || ETATS_FINAUX.includes(courante.etat)) {
    throw new AppError(
      "TIPI_SESSION_INTROUVABLE",
      `session ${demande.sessionId} absente ou close.`,
    );
  }

  const tentative = await prisma.attempt.upsert({
    where: {
      sessionId_exerciseId: {
        sessionId: demande.sessionId,
        exerciseId: demande.exerciseId,
      },
    },
    create: {
      sessionId: demande.sessionId,
      exerciseId: demande.exerciseId,
      statut: demande.statut,
      nbSollicitations: demande.nbSollicitations ?? 0,
      transcriptionAudio: demande.transcription ?? null,
    },
    update: {
      statut: demande.statut,
      ...(demande.nbSollicitations === undefined
        ? {}
        : { nbSollicitations: demande.nbSollicitations }),
      ...(demande.transcription === undefined
        ? {}
        : { transcriptionAudio: demande.transcription }),
    },
    select: { id: true },
  });

  return tentative.id;
}
