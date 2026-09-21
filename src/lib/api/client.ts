/**
 * Le **seul** appel réseau du produit vers ses propres routes.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE, ET CE QU'IL A COÛTÉ DE NE PAS L'AVOIR
 * ---------------------------------------------------------------------------
 * Le contrôle C6 de `scripts/verifier-confinement.ts` épingle `fetch(` à
 * `src/lib/ai/providers/`, au motif qu'« un appel réseau écrit hors d'un
 * fournisseur contournerait l'interface `AiTransport` ». Tant que V1 et V2
 * n'avaient livré aucun écran, la règle et la propriété coïncidaient.
 *
 * V3 livre le premier écran qui parle au serveur, et **C6 a rougi** — avec
 * raison au regard de sa lettre, à tort au regard de son sens : un appel vers
 * `/api/session/…` ne parle à aucun fournisseur. La correction n'est pas
 * d'élargir la règle à `src/hooks/**`, ce qui rendrait un appel à un
 * fournisseur écrivable dans un hook. Elle est de donner au **second**
 * destinataire son passage unique, comme le premier a le sien.
 *
 * Deux passages, deux destinations, chacun lisible en un seul endroit :
 *  - `src/lib/ai/providers/` → un fournisseur externe, derrière `AiTransport` ;
 *  - ce fichier → **les routes de Tipi, et rien d'autre**.
 *
 * ---------------------------------------------------------------------------
 * LA GARDE EST EXÉCUTABLE, PAS DÉCLARATIVE
 * ---------------------------------------------------------------------------
 * « Rien d'autre » n'est pas une intention écrite en commentaire : `chemin`
 * doit commencer par `/api/`. Une adresse absolue — donc un autre hôte — est
 * refusée avant tout envoi. C'est cette ligne qui empêche ce module de devenir
 * le passe-droit que C6 refusait d'ouvrir.
 *
 * La réponse est **validée par Zod** avant d'être rendue : elle a traversé le
 * réseau, elle est donc une entrée externe, quand bien même c'est notre propre
 * serveur qui l'a écrite.
 */
import type { z } from "zod";

/** Préfixe autorisé. Une adresse absolue ne commence jamais par `/api/`. */
const PREFIXE_TIPI = "/api/";

export class ErreurApi extends Error {
  public readonly statut: number;

  public constructor(statut: number, chemin: string) {
    // Aucun détail technique n'est destiné à un humain : ce message sert au
    // journal du navigateur, jamais à un écran (PRD-16).
    super(`${chemin} a répondu ${statut}`);
    this.name = "ErreurApi";
    this.statut = statut;
  }
}

export async function appelerApi<T>(
  chemin: string,
  schema: z.ZodType<T>,
  init?: { readonly method?: "GET" | "POST"; readonly corps?: unknown },
): Promise<T> {
  if (!chemin.startsWith(PREFIXE_TIPI)) {
    throw new Error(
      `« ${chemin} » n'est pas une route de Tipi : ce module n'appelle que ${PREFIXE_TIPI}**, et jamais un hôte externe.`,
    );
  }

  const reponse = await fetch(chemin, {
    method: init?.method ?? "GET",
    ...(init?.corps === undefined
      ? {}
      : {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(init.corps),
        }),
  });

  const brut: unknown = await reponse.json().catch(() => undefined);
  if (!reponse.ok) throw new ErreurApi(reponse.status, chemin);

  const parse = schema.safeParse(brut);
  if (!parse.success) {
    throw new ErreurApi(reponse.status, `${chemin} (forme de réponse inattendue)`);
  }
  return parse.data;
}
