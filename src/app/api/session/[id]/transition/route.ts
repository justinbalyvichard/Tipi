/**
 * `POST /api/session/{id}/transition` — **la seule route qui mute l'état**
 * (TEC-10, P2 §8.3).
 *
 * ---------------------------------------------------------------------------
 * LES DEUX ÉVÉNEMENTS QUE CETTE ROUTE N'ACCEPTE PAS DU CLIENT
 * ---------------------------------------------------------------------------
 * `CLOTURE_AUTOMATIQUE` est **retirée du schéma d'entrée**, par soustraction de
 * la liste des événements et non par un `if` : sa garde est `session.date`
 * antérieure à la soirée courante, une question d'horloge serveur (ARB-09).
 * Un client qui pourrait l'émettre pourrait clore sa propre soirée en cours et
 * déclencher le rattrapage à n'importe quel moment.
 *
 * `ABANDON_PARENT` est acceptée par le schéma mais soumise à
 * `autorisationSortie()` (PRD-13). V3 livre l'interface et une implémentation
 * qui refuse toujours : la sortie anticipée n'est pas un bouton de l'enfant, et
 * son cookie appartient à V7.
 *
 * ---------------------------------------------------------------------------
 * LE 409 PORTE LE SNAPSHOT
 * ---------------------------------------------------------------------------
 * « `409 TIPI_TRANSITION_INVALIDE` **avec le snapshot courant dans la
 * réponse**, pour que le client se recale sans rien perdre. » Le refus n'est
 * donc pas une exception : le service le rend comme une valeur, et cette route
 * le sérialise avec l'état réel de la session.
 */
import { z } from "zod";

import { AppError, corpsErreurDe, type CorpsErreur } from "@/lib/errors/app-error";
import { handler, versReponse } from "@/lib/errors/route";
import { autorisationSortie } from "@/lib/parent/autorisation-sortie";
import { estEvenementClient } from "@/lib/session/evenements-client";
import { appliquerEvenement } from "@/lib/session/service";
import { Evenement, type Snapshot } from "@/lib/session/types";
import { EtatSession, Uuid } from "@/lib/validation/json";

export const dynamic = "force-dynamic";

const Entree = z.object({
  id: Uuid,
  evenementId: Uuid,
  evenement: Evenement.refine(estEvenementClient, { message: "événement réservé au serveur" }),
  etatAttendu: EtatSession,
});

/**
 * Ce que l'action rend. `refus` non nul devient le `409` : le refus voyage par
 * la valeur, parce qu'une `AppError` ne transporte qu'un code et que le contrat
 * exige le snapshot dans le corps.
 */
interface SortieTransition {
  readonly refus: string | null;
  readonly session: Snapshot;
  readonly pierresCreditees: number;
}

function estSortie(corps: SortieTransition | CorpsErreur): corps is SortieTransition {
  return "session" in corps;
}

const ENTETES = { "cache-control": "no-store" } as const;

export async function POST(
  requete: Request,
  contexte: { params: { id: string } },
): Promise<Response> {
  const corpsRecu: unknown = await requete.json().catch(() => undefined);
  const entree =
    typeof corpsRecu === "object" && corpsRecu !== null
      ? { ...corpsRecu, id: contexte.params.id }
      : { id: contexte.params.id };

  const reponse = await handler<z.infer<typeof Entree>, SortieTransition>(
    Entree,
    entree,
    async (valide) => {
      if (valide.evenement === "ABANDON_PARENT") {
        const motif = await autorisationSortie().autoriserSortieSession(requete);
        if (motif !== null) {
          throw new AppError("TIPI_ABANDON_NON_AUTORISE", motif);
        }
      }
      const resultat = await appliquerEvenement({
        sessionId: valide.id,
        evenementId: valide.evenementId,
        evenement: valide.evenement,
        etatAttendu: valide.etatAttendu,
      });
      if (!resultat.ok) {
        return { refus: resultat.motif, session: resultat.session, pierresCreditees: 0 };
      }
      return {
        refus: null,
        session: resultat.session,
        pierresCreditees: resultat.pierresCreditees,
      };
    },
  );

  if (reponse.status !== 200 || !estSortie(reponse.body)) return versReponse(reponse);

  const { refus, session, pierresCreditees } = reponse.body;
  if (refus !== null) {
    const erreur = new AppError("TIPI_TRANSITION_INVALIDE", refus);
    return Response.json(
      { ...corpsErreurDe(erreur), session },
      { status: erreur.httpStatus, headers: ENTETES },
    );
  }
  return Response.json({ session, pierresCreditees }, { status: 200, headers: ENTETES });
}
