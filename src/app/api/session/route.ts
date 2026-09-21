/**
 * `POST /api/session` — TEC-06 : **la seule porte d'entrée vers `/enfant`**.
 *
 * Aucun chemin de V2 ne sait créer une session (contrôle C5 de
 * `scripts/verifier-confinement.ts`) : une soirée ne peut donc commencer
 * qu'ici, après la validation explicite du parent sur l'aperçu.
 *
 * **Effet de bord, avant la création** : la clôture automatique d'une session
 * périmée (T12, ARB-09). Une session de la veille ne doit jamais empêcher le
 * parent de lancer la soirée.
 *
 * Les valeurs du programme ne sont pas inventées ici : elles viennent de
 * l'aperçu produit par V2, que le parent a validé. La route valide leur forme
 * (Zod), la logique valide leurs règles (`creerSession`).
 */
import { z } from "zod";

import { ETAPES_MAX_PAR_SOIREE } from "@/config/pierres.config";
import { enfantCourant } from "@/lib/enfant/courant";
import { handler, versReponse } from "@/lib/errors/route";
import { cloreSessionsPerimees } from "@/lib/session/cloture-automatique";
import { creerSession } from "@/lib/session/service";
import { Matiere, Uuid } from "@/lib/validation/json";

export const dynamic = "force-dynamic";

/**
 * `.max(ETAPES_MAX_PAR_SOIREE)` et non `.max(2)` : PED-06 est un plafond de
 * configuration, pas un littéral qu'on recopie sur trois routes.
 */
const Entree = z.object({
  etapes: z
    .array(
      z.object({
        matiere: Matiere,
        exerciseIds: z.array(Uuid).min(1),
        dureeEstimeeMin: z.number().int().positive(),
      }),
    )
    .max(ETAPES_MAX_PAR_SOIREE),
  soirLeger: z.boolean(),
  /** PRD-16 — « pas de devoirs ce soir » est un choix, jamais un programme vide. */
  sansDevoir: z.boolean().optional(),
});

export async function POST(requete: Request): Promise<Response> {
  const corps: unknown = await requete.json().catch(() => undefined);
  const reponse = await handler(Entree, corps, async (entree) => {
    const enfant = await enfantCourant();
    await cloreSessionsPerimees(enfant.id);
    return { session: await creerSession(enfant.id, entree) };
  });
  return versReponse(reponse);
}
