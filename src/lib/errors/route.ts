/**
 * Enveloppe de handler de route (P2, §8) — **SERVEUR UNIQUEMENT**.
 *
 * Conventions communes à toutes les routes, tenues ici une seule fois :
 *  - parse Zod de l'entrée, `400 TIPI_VALIDATION` en cas d'échec ;
 *  - exécution du handler ;
 *  - mapping `AppError` → statut HTTP, et même forme de corps partout ;
 *  - toute erreur inattendue devient `500 TIPI_INTERNE`, sans fuite : le
 *    message d'origine reste côté serveur.
 *
 * Aucune route ne renvoie jamais `code_hash`, ni le code en clair, ni une
 * variable d'environnement (SEC-01, SEC-08). C'est ici que cette garantie
 * tient : le client ne reçoit qu'un code et une clé de contenu.
 */
import { z } from "zod";

import { AppError, corpsErreurDe, estAppError, type CorpsErreur } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/errors/route.ts");

/** Journal serveur. Un seul point de sortie, pour qu'il soit remplaçable. */
function journaliser(erreur: AppError): void {
  // `console.error`, et rien d'autre : TEC-15 interdit la trace de mise au
  // point laissée derrière soi, pas la journalisation d'une erreur serveur.
  // Le linter le tient — voir l'`overrides` nominatif de `.eslintrc.json`.
  const suffixe = erreur.detail === undefined ? "" : ` — ${erreur.detail}`;
  console.error(`[tipi] ${erreur.code}${suffixe}`);
}

export interface ReponseRoute<T> {
  readonly status: number;
  readonly body: T | CorpsErreur;
}

/**
 * Valide `entree` contre `schema`, puis exécute `action`.
 *
 * Toute entrée externe passe par Zod avant usage : c'est la règle de code du
 * projet, et TEC-05 pour les sorties d'IA. Un handler ne voit jamais une
 * valeur non validée.
 */
export async function handler<E, S>(
  schema: z.ZodType<E>,
  entree: unknown,
  action: (valeur: E) => Promise<S>,
): Promise<ReponseRoute<S>> {
  let valeur: E;
  try {
    const parse = schema.safeParse(entree);
    if (!parse.success) {
      const champs = parse.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new AppError("TIPI_VALIDATION", `champs: ${champs}`);
    }
    valeur = parse.data;
  } catch (brute) {
    return reponseErreur(brute);
  }

  try {
    const resultat = await action(valeur);
    return { status: 200, body: resultat };
  } catch (brute) {
    return reponseErreur(brute);
  }
}

/**
 * Traduit le résultat d'un `handler` en réponse HTTP.
 *
 * AJOUTÉE PAR V2, à l'endroit où V1 avait laissé la place : V1 n'a livré
 * aucune route, donc aucun besoin de rendre une `Response`. La conversion est
 * ici et nulle part ailleurs, pour que les 32 chemins de P2 §8 aient
 * rigoureusement la même forme de corps et le même jeu d'en-têtes.
 *
 * `cache-control: no-store` sur toutes les routes : aucune réponse de Tipi
 * n'est cachable — un programme du soir, un état de session, un solde de
 * pierres sont des données vivantes, et un intermédiaire qui en garderait une
 * copie afficherait les devoirs d'hier.
 */
export function versReponse<T>(reponse: ReponseRoute<T>): Response {
  return Response.json(reponse.body, {
    status: reponse.status,
    headers: { "cache-control": "no-store" },
  });
}

function reponseErreur<S>(brute: unknown): ReponseRoute<S> {
  const erreur = estAppError(brute)
    ? brute
    : new AppError(
        "TIPI_INTERNE",
        brute instanceof Error ? brute.message : String(brute),
      );
  journaliser(erreur);
  return { status: erreur.httpStatus, body: corpsErreurDe(erreur) };
}
