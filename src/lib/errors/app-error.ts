/**
 * `AppError` — la seule erreur que les routes savent traduire (P2, §8, §10).
 *
 * Elle porte un code de la taxonomie fermée, et rien qu'un code : le statut
 * HTTP, la clé de contenu et le public s'en déduisent. Un handler ne choisit
 * donc jamais un statut à la main, et deux routes ne peuvent pas répondre
 * différemment à la même situation.
 *
 * `detail` n'est JAMAIS renvoyé au client (P2, §8) : il sert au journal
 * serveur. Aucun détail technique, aucune variable d'environnement, aucun
 * hash de code parent ne franchit la frontière (SEC-01, SEC-08).
 */
import { CODES_ERREUR, type CodeErreur, type DescriptionErreur } from "@/lib/errors/codes";

export class AppError extends Error {
  public readonly code: CodeErreur;
  public readonly description: DescriptionErreur;
  /** Contexte serveur. Jamais sérialisé vers le client. */
  public readonly detail: string | undefined;

  public constructor(code: CodeErreur, detail?: string) {
    super(code);
    this.name = "AppError";
    this.code = code;
    this.description = CODES_ERREUR[code];
    this.detail = detail;
  }

  /** Statut HTTP, ou 500 pour un code purement client mal aiguillé. */
  public get httpStatus(): number {
    return this.description.http ?? 500;
  }

  public get cleContenu(): string | null {
    return this.description.cleContenu;
  }
}

export function estAppError(valeur: unknown): valeur is AppError {
  return valeur instanceof AppError;
}

/**
 * Forme de réponse d'erreur, identique sur TOUTES les routes (P2, §8) :
 * `{ "erreur": { "code": "TIPI_…", "cleContenu": "parent.scan.illisible.corps" } }`
 */
export interface CorpsErreur {
  readonly erreur: {
    readonly code: CodeErreur;
    readonly cleContenu: string | null;
  };
}

export function corpsErreurDe(erreur: AppError): CorpsErreur {
  return { erreur: { code: erreur.code, cleContenu: erreur.cleContenu } };
}
