/**
 * `DELETE /api/devoirs/photo/{homeworkId}` — retrait d'une vignette avant
 * analyse (P2, §8.2).
 *
 * `204` sans corps : il n'y a rien à dire, et une réponse vide est ce qui
 * permet à l'écran parent de retirer la vignette sans rien réafficher.
 *
 * `409 TIPI_DEJA_ANALYSE` dès qu'un exercice existe. Ce code était nommé par le
 * contrat de route de P2 §8.2 et **absent de la taxonomie fermée** de §10.1 :
 * il a été ajouté à `src/lib/errors/codes.ts` par V2, sans clé de contenu,
 * comme les autres gardes qui ne s'affichent pas.
 */
import { z } from "zod";

import { retirerPhoto } from "@/lib/devoirs/upload";
import { handler, versReponse } from "@/lib/errors/route";

export const dynamic = "force-dynamic";

const Entree = z.object({ homeworkId: z.string().uuid() });

export async function DELETE(
  _requete: Request,
  contexte: { params: { homeworkId: string } },
): Promise<Response> {
  const reponse = await handler(Entree, contexte.params, async (entree) => {
    await retirerPhoto(entree.homeworkId);
    return null;
  });
  if (reponse.status === 200) return new Response(null, { status: 204 });
  return versReponse(reponse);
}
