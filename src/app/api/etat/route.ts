/**
 * `GET /api/etat` — aiguillage de `/` (P2 §8.1, PRD-18, ARB-09).
 *
 * **Effet de bord avant toute réponse** : la clôture automatique d'une session
 * périmée (T12). C'est ce qui empêche l'enfant de retomber sur les devoirs de
 * la veille.
 *
 * `500 TIPI_INTERNE` fait basculer l'interface sur `/parent` avec le bandeau
 * `parent.aiguillage.bandeau` : **jamais une page d'erreur à l'enfant**
 * (P2 §8.1). Ce choix est porté par l'écran, pas par la route — ici, la seule
 * garantie est qu'aucun détail technique ne franchit la frontière.
 */
import { z } from "zod";

import { handler, versReponse } from "@/lib/errors/route";
import { etatAiguillage } from "@/lib/session/aiguillage";

export const dynamic = "force-dynamic";

/** Aucune entrée. Le schéma vide est explicite : la route ne lit rien. */
const Entree = z.object({});

export async function GET(): Promise<Response> {
  const reponse = await handler(Entree, {}, async () => etatAiguillage());
  return versReponse(reponse);
}
