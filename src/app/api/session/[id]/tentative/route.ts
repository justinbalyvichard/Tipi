/**
 * `POST /api/session/{id}/tentative` — la trace d'une tentative (P2 §8.3).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE ROUTE EST DANS V3, ET CE QU'ELLE NE FAIT PAS ENCORE
 * ---------------------------------------------------------------------------
 * Elle est **la persistance de PRD-18** au niveau de l'exercice : c'est sa
 * ligne `attempt` qui dit où l'enfant s'était arrêté dans l'étape, et c'est
 * elle que `etapeAchevee()` lit pour décider quelles étapes T10 et T12
 * rattrapent. Sans elle, le rattrapage d'ARB-13 n'aurait jamais rien à
 * rattraper et serait du code mort non éprouvé.
 *
 * Ce qu'elle **ne fait pas** en V3, et c'est déclaré plutôt que tu : le champ
 * `lecture` de la sortie (`reconnue`, `motsHesitants`) suppose
 * `src/lib/lecture/matching.ts` et les seuils de 3.4, qui appartiennent à V4.
 * `transcription` est donc acceptée et **stockée**, jamais rapprochée. La
 * sortie ne porte pas de champ `lecture` : un champ toujours absent vaut mieux
 * qu'un champ toujours faux.
 *
 * `nbIndicesUtilises` n'est PAS dans cette entrée : il n'est écrit que par
 * `POST /api/indices` (V5, constat 7). Une route qui accepterait les deux
 * laisserait le client décider du compte d'indices, donc contourner PED-02.
 */
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { handler, versReponse } from "@/lib/errors/route";
import { ETATS_FINAUX } from "@/lib/session/types";
import { Uuid } from "@/lib/validation/json";

export const dynamic = "force-dynamic";

const Entree = z.object({
  id: Uuid,
  exerciseId: Uuid,
  statut: z.enum(["en_cours", "terminee", "passee", "bloquee"]),
  nbSollicitations: z.number().int().nonnegative().optional(),
  transcription: z.string().max(4000).optional(),
});

export async function POST(
  requete: Request,
  contexte: { params: { id: string } },
): Promise<Response> {
  const corpsRecu: unknown = await requete.json().catch(() => undefined);
  const entree =
    typeof corpsRecu === "object" && corpsRecu !== null
      ? { ...corpsRecu, id: contexte.params.id }
      : { id: contexte.params.id };

  const reponse = await handler(Entree, entree, async (valide) => {
    const session = await prisma.session.findUnique({
      where: { id: valide.id },
      select: { id: true, etat: true },
    });
    // Une session close n'accepte plus de trace : ce serait réécrire le passé,
    // et le rattrapage de T12 lit précisément ces lignes-là.
    if (session === null || ETATS_FINAUX.includes(session.etat)) {
      throw new AppError("TIPI_SESSION_INTROUVABLE", `session ${valide.id} absente ou close.`);
    }

    // Upsert sur `(sessionId, exerciseId)` : la reprise met à jour la même
    // ligne, elle n'en crée pas une seconde (PRD-18).
    const tentative = await prisma.attempt.upsert({
      where: { sessionId_exerciseId: { sessionId: valide.id, exerciseId: valide.exerciseId } },
      create: {
        sessionId: valide.id,
        exerciseId: valide.exerciseId,
        statut: valide.statut,
        nbSollicitations: valide.nbSollicitations ?? 0,
        transcriptionAudio: valide.transcription ?? null,
      },
      update: {
        statut: valide.statut,
        ...(valide.nbSollicitations === undefined
          ? {}
          : { nbSollicitations: valide.nbSollicitations }),
        ...(valide.transcription === undefined
          ? {}
          : { transcriptionAudio: valide.transcription }),
      },
      select: { id: true },
    });

    return { attemptId: tentative.id };
  });
  return versReponse(reponse);
}
