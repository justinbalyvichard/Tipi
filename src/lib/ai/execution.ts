/**
 * L'exécution d'un appel d'IA — **SERVEUR UNIQUEMENT**.
 *
 * Un seul endroit tient, pour les trois prompts et pour tous les fournisseurs
 * présents et à venir :
 *
 *  1. le scellement du payload (P2 §6, barrière 2) ;
 *  2. **l'invariant de dérivabilité de SEC-04**, avant tout accès réseau ;
 *  3. l'abandon au-delà de `AI_TIMEOUT_MS` → `TIPI_IA_TIMEOUT` ;
 *  4. la validation Zod stricte de la sortie (TEC-05) ;
 *  5. **la relance, une seule fois**, puis `TIPI_IA_SORTIE_INVALIDE` — le texte
 *     de la section 3.2 étape 4, mot pour mot : « Toute sortie non conforme est
 *     rejouée une fois, puis bascule en état illisible » ;
 *  6. la trace exacte de ce qui est parti et de ce qui est revenu (TEC-16).
 *
 * Aucune de ces six règles n'est laissée au fournisseur : un second fournisseur
 * les hériterait sans les réécrire, et ne pourrait pas les affaiblir.
 */
import {
  PayloadIa,
  assertCorpsDerivable,
  type CorpsIa,
  type TexteAnonymise,
} from "@/lib/ai/anonymisation";
import type { PromptVersionne } from "@/lib/ai/prompts/types";
import type { ResultatIa, TraceAppelIa } from "@/lib/ai/provider";
import type { AiTransport } from "@/lib/ai/transport";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/ai/execution.ts");

/** Nombre total de tentatives : la première, plus **une** relance (3.2, étape 4). */
export const TENTATIVES_MAX = 2;

/**
 * Ce qu'`executerPrompt` attend d'un schéma : savoir valider un `unknown`.
 *
 * Décrit structurellement plutôt qu'en `z.ZodType<T>`, et pour une raison
 * précise : les trois schémas de `schemas.ts` **transforment** leur entrée
 * (noms de la section 3.6 en entrée, camelCase en sortie), donc leur type
 * d'entrée n'est pas leur type de sortie. Les nommer par leur type de sortie
 * seul les rendrait inassignables. Cette forme-ci dit exactement ce qui est
 * utilisé — `safeParse` sur une valeur inconnue — et rien de plus.
 */
export interface SchemaSortie<T> {
  safeParse(valeur: unknown):
    | { readonly success: true; readonly data: T }
    | {
        readonly success: false;
        readonly error: {
          readonly issues: readonly {
            readonly path: readonly (string | number)[];
            readonly message: string;
          }[];
        };
      };
}

/**
 * Extrait le premier objet JSON d'une réponse de modèle.
 *
 * Les modèles encadrent volontiers leur JSON d'un bloc de code ou d'une phrase
 * d'introduction, malgré la consigne. Refuser ces sorties ferait basculer en
 * « illisible » des analyses parfaitement exploitables : on découpe donc du
 * premier `{` au dernier `}`. Ce n'est pas un assouplissement de la validation
 * — le schéma Zod s'applique ensuite sans concession sur ce qui a été extrait.
 */
export function extraireJson(brut: string): unknown {
  const debut = brut.indexOf("{");
  const fin = brut.lastIndexOf("}");
  if (debut === -1 || fin === -1 || fin <= debut) {
    throw new Error("aucun objet JSON dans la réponse");
  }
  return JSON.parse(brut.slice(debut, fin + 1));
}

/**
 * Erreur d'appel d'IA qui **transporte sa trace**.
 *
 * Sans elle, une analyse qui échoue ne pourrait pas être journalisée : TEC-16
 * demande de consigner « le code d'erreur éventuel » à côté du payload envoyé,
 * et c'est précisément sur les échecs que la calibration est instructive.
 */
export class ErreurAppelIa extends AppError {
  public readonly trace: TraceAppelIa;

  public constructor(
    code: ConstructorParameters<typeof AppError>[0],
    trace: TraceAppelIa,
    detail?: string,
  ) {
    super(code, detail);
    this.name = "ErreurAppelIa";
    this.trace = trace;
  }
}

function trace(
  prompt: PromptVersionne,
  corps: CorpsIa,
  brut: string | null,
  tentatives: number,
  debut: number,
  erreurCode: string | null = null,
): TraceAppelIa {
  return {
    promptId: prompt.id,
    promptVersion: prompt.version,
    payload: corps,
    reponseBrute: brut,
    tentatives,
    dureeMs: Date.now() - debut,
    erreurCode,
  };
}

/**
 * Scelle, contrôle, appelle, valide, relance une fois.
 *
 * ---------------------------------------------------------------------------
 * LE PASSAGE OBLIGÉ, ET CE QU'IL EXIGE — [BLOQUANT] B1 DU TOUR 1
 * ---------------------------------------------------------------------------
 * `texte` n'est pas une `string` : c'est un `TexteAnonymise`, type **nominal**
 * que seule `TexteAnonymise.depuis()` sait construire, et qui n'existe qu'après
 * caviardage et assertion. Cette fonction étant **le seul chemin du produit vers
 * le réseau du fournisseur**, la partie (B) de SEC-04 cesse d'être une
 * convention respectée à un site d'appel sur trois : elle devient une condition
 * de compilation, vraie pour les trois prompts d'aujourd'hui et pour ceux qu'on
 * ajoutera.
 *
 * Le caviardage lui-même s'exerce toujours hors de `src/lib/ai/**`, là où le
 * prénom est connu : c'est l'appelant qui fabrique le `TexteAnonymise`.
 */
export async function executerPrompt<T>(
  transport: AiTransport,
  prompt: PromptVersionne,
  texte: TexteAnonymise,
  schema: SchemaSortie<T>,
): Promise<ResultatIa<T>> {
  garderServeur("src/lib/ai/execution.ts");
  const debut = Date.now();
  const { AI_TIMEOUT_MS } = env();

  const payload = PayloadIa.sceller(prompt, texte);
  const corps = transport.corps(payload);

  // (A) — L'INVARIANT DE SEC-04, AVANT TOUT ACCÈS RÉSEAU.
  // `transport.emettre` est la seule fonction du produit qui atteigne le
  // fournisseur, et elle ne peut être appelée qu'après cette ligne.
  assertCorpsDerivable(corps, payload, transport.vocabulaire);

  let dernierBrut: string | null = null;
  let dernierDetail = "";

  for (let tentative = 1; tentative <= TENTATIVES_MAX; tentative += 1) {
    const horloge = new AbortController();
    const minuterie = setTimeout(() => {
      horloge.abort();
    }, AI_TIMEOUT_MS);

    let brut: string;
    try {
      brut = await transport.emettre(corps, horloge.signal);
    } catch (brute) {
      const expire = horloge.signal.aborted;
      const code = expire ? "TIPI_IA_TIMEOUT" : "TIPI_IA_INDISPONIBLE";
      throw new ErreurAppelIa(
        code,
        trace(prompt, corps, dernierBrut, tentative, debut, code),
        expire
          ? `abandon après ${AI_TIMEOUT_MS} ms`
          : brute instanceof Error
            ? brute.message
            : String(brute),
      );
    } finally {
      clearTimeout(minuterie);
    }

    dernierBrut = brut;

    const parse = schema.safeParse(lireSansLever(brut));
    if (parse.success) {
      return {
        valeur: parse.data,
        trace: trace(prompt, corps, brut, tentative, debut),
      };
    }
    dernierDetail = parse.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")} — ${i.message}`)
      .join(" ; ");
  }

  // Deux sorties non conformes : la relance a eu lieu, on bascule.
  throw new ErreurAppelIa(
    "TIPI_IA_SORTIE_INVALIDE",
    trace(prompt, corps, dernierBrut, TENTATIVES_MAX, debut, "TIPI_IA_SORTIE_INVALIDE"),
    `sortie non conforme après ${TENTATIVES_MAX} tentatives : ${dernierDetail}`,
  );
}

/**
 * Le JSON extrait, ou `undefined` si la réponse n'en contient pas.
 * `undefined` échoue ensuite au schéma : un seul chemin d'échec, donc une seule
 * relance possible, et jamais deux traitements différents pour « pas de JSON »
 * et « JSON mal formé ».
 */
function lireSansLever(brut: string): unknown {
  try {
    return extraireJson(brut);
  } catch {
    return undefined;
  }
}
