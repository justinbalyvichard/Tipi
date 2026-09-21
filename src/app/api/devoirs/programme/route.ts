/**
 * `GET /api/devoirs/programme` — relecture de l'aperçu après un
 * rafraîchissement (P2, §8.2).
 *
 * Aucune entrée. Le programme rendu est celui de la **soirée courante** : un
 * devoir de la veille ne doit jamais réapparaître, pour la raison exacte qui a
 * fait écrire la clôture automatique T12 côté session (ARB-09).
 *
 * `404 TIPI_INTROUVABLE` quand rien n'a encore été analysé ce soir. Ce n'est
 * pas une erreur au sens du parent : l'écran affiche simplement son état vide,
 * `parent.scan.vide.*`.
 */
import { z } from "zod";

import { programmeCourant } from "@/lib/devoirs/programme";
import { handler, versReponse } from "@/lib/errors/route";

export const dynamic = "force-dynamic";

const Entree = z.object({});

export async function GET(): Promise<Response> {
  const reponse = await handler(Entree, {}, async () => ({
    programme: await programmeCourant(),
  }));
  return versReponse(reponse);
}
