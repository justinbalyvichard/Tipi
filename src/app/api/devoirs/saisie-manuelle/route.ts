/**
 * `POST /api/devoirs/saisie-manuelle` — voie de secours **toujours ouverte**
 * (PRD-16, P2 §8.2).
 *
 * C'est la sortie des deux états limites les plus probables d'un soir de
 * semaine : la photo illisible et le service d'analyse indisponible. Elle ne
 * dépend d'aucun compte externe — ni OCR, ni modèle lorsque celui-ci est
 * absent (`src/lib/devoirs/analyse.ts`, structuration de secours). Une soirée
 * reste possible, ce que P2 §11 pose comme une exigence et non comme un espoir.
 *
 * Les bornes de longueur sont celles du contrat : `consigne` 1..500,
 * `contenu` 1..4000.
 */
import { z } from "zod";

import { ajouterSaisieManuelle } from "@/lib/devoirs/upload";
import { handler, versReponse } from "@/lib/errors/route";

export const dynamic = "force-dynamic";

const Entree = z.object({
  matiere: z.enum(["lecture", "maths"]),
  consigne: z.string().trim().min(1).max(500),
  contenu: z.string().trim().min(1).max(4000),
});

export async function POST(requete: Request): Promise<Response> {
  const corps: unknown = await requete.json().catch(() => undefined);
  const reponse = await handler(Entree, corps, (entree) => ajouterSaisieManuelle(entree));
  return versReponse(reponse);
}
