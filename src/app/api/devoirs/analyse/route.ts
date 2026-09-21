/**
 * `POST /api/devoirs/analyse` — étapes 2 à 4 du pipeline (P2, §8.2).
 *
 * **Cette route ne démarre aucune session.** Elle rend un aperçu, que le parent
 * valide ensuite sur `/parent/programme`, et la seule porte vers `/enfant` est
 * `POST /api/session` (V3). C'est TEC-06 : « aucune session ne démarre sans
 * validation explicite du parent sur l'aperçu », et la façon la plus sûre de la
 * tenir est qu'aucun chemin de V2 ne sache créer une session.
 *
 * Borne d'entrée : 1 à 10 devoirs, celle du contrat. Dix photos couvrent très
 * largement un soir de CE1, et la borne protège autant la dépense d'OCR que le
 * budget de latence de P2 §12.1.
 */
import { z } from "zod";

import { analyserDevoirs } from "@/lib/devoirs/analyse";
import { handler, versReponse } from "@/lib/errors/route";

export const dynamic = "force-dynamic";

const Entree = z.object({
  homeworkIds: z.array(z.string().uuid()).min(1).max(10),
});

export async function POST(requete: Request): Promise<Response> {
  const corps: unknown = await requete.json().catch(() => undefined);
  const reponse = await handler(Entree, corps, async (entree) => ({
    programme: await analyserDevoirs(entree.homeworkIds),
  }));
  return versReponse(reponse);
}
