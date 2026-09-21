/**
 * `POST /api/session/{id}/tentative` — la trace d'une tentative (P2 §8.3).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE ROUTE EST DANS V3, ET CE QU'ELLE NE FAIT PAS ENCORE
 * ---------------------------------------------------------------------------
 * Elle est **la persistance de PRD-18** au niveau de l'exercice : sa ligne
 * `attempt` dit où l'enfant s'était arrêté dans l'étape, et c'est elle que
 * `etapeAchevee()` lit pour décider quelles étapes T10 et T12 rattrapent. Sans
 * elle, le rattrapage d'ARB-13 n'aurait jamais rien à rattraper et serait du
 * code mort, non éprouvé.
 *
 * Ce qu'elle **ne fait pas** en V3, déclaré plutôt que tu : le champ `lecture`
 * de la sortie (`reconnue`, `motsHesitants`) suppose
 * `src/lib/lecture/matching.ts` et les seuils de 3.4, qui appartiennent à V4.
 * `transcription` est donc acceptée et **stockée**, jamais rapprochée, et la
 * sortie ne porte pas de champ `lecture` : un champ toujours absent vaut mieux
 * qu'un champ toujours faux.
 *
 * `nbIndicesUtilises` n'est PAS dans cette entrée : il n'est écrit que par
 * `POST /api/indices` (V5, constat 7).
 */
import { z } from "zod";

import { handler, versReponse } from "@/lib/errors/route";
import { enregistrerTentative } from "@/lib/session/tentatives";
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

  const reponse = await handler(Entree, entree, async (valide) => ({
    attemptId: await enregistrerTentative({
      sessionId: valide.id,
      exerciseId: valide.exerciseId,
      statut: valide.statut,
      ...(valide.nbSollicitations === undefined
        ? {}
        : { nbSollicitations: valide.nbSollicitations }),
      ...(valide.transcription === undefined ? {} : { transcription: valide.transcription }),
    }),
  }));
  return versReponse(reponse);
}
