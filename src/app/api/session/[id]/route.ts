/**
 * `GET /api/session/{id}` — la reprise (PRD-18, P2 §8.3).
 *
 * Le client repart du snapshot : l'état, l'étape courante, l'exercice où
 * l'enfant s'était arrêté et les indices déjà déroulés. **Aucune information de
 * reprise n'est lue dans le navigateur** : `localStorage` ne porte aucune
 * donnée de parcours (P2 D2), et l'état de session vit en base (TEC-18).
 */
import { z } from "zod";

import { handler, versReponse } from "@/lib/errors/route";
import { lireSession } from "@/lib/session/service";
import { Uuid } from "@/lib/validation/json";

export const dynamic = "force-dynamic";

const Entree = z.object({ id: Uuid });

export async function GET(
  _requete: Request,
  contexte: { params: { id: string } },
): Promise<Response> {
  const reponse = await handler(Entree, contexte.params, async (entree) => ({
    session: await lireSession(entree.id),
  }));
  return versReponse(reponse);
}
