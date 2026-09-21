/**
 * DeepSeek — **le seul fichier du produit qui connaisse le protocole du
 * fournisseur** (TEC-17, P2 §5.1) : forme du corps de requête, nom du modèle,
 * forme de la réponse, adresse du point d'entrée.
 *
 * Deux autres fichiers en connaissent seulement le **nom**, et c'est
 * irréductible : `src/lib/ai/index.ts`, qui associe la valeur `"deepseek"` à
 * son implémentation, et `src/config/env.ts`, qui porte la valeur par défaut de
 * `AI_PROVIDER`. La règle opposable de P2 §5.1 est rejouée par
 * `scripts/verifier-confinement.ts` (C1).
 *
 * ---------------------------------------------------------------------------
 * MODE TEXTE UNIQUEMENT — TEC-05
 * ---------------------------------------------------------------------------
 * Ce transport n'a aucun moyen d'envoyer une image : `corps()` ne reçoit qu'un
 * `PayloadIa`, dont les deux seuls contenus sont le prompt versionné et une
 * `string`. L'interdit de la section 3.2 n'est donc pas une consigne de revue,
 * c'est une impossibilité de typage. Son motif, rappelé pour qu'aucun agent en
 * aval ne le « corrige » : le modèle vision de DeepSeek réduit chaque image à
 * environ 1024 jetons et n'est pas fiable sur de l'écriture manuscrite d'enfant
 * photographiée au smartphone.
 *
 * ---------------------------------------------------------------------------
 * AUCUN SDK
 * ---------------------------------------------------------------------------
 * `fetch` sur un point d'entrée compatible OpenAI (P2 §15.2). C'est un bénéfice
 * pour le changement de fournisseur, jamais une preuve de confinement.
 *
 * **Ce transport n'a jamais été exécuté contre le vrai service** : aucun compte
 * externe n'existe (ESC-000). Ce qui est prouvé ici est la forme du corps, la
 * validation de la réponse et le chemin d'erreur ; ce qui ne l'est pas est
 * l'accord de cette forme avec l'API réelle.
 */
import { z } from "zod";

import type { CorpsIa, PayloadIa } from "@/lib/ai/anonymisation";
import type { AiTransport } from "@/lib/ai/transport";
import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/ai/providers/deepseek.ts");

export const NOM_TRANSPORT_DEEPSEEK = "deepseek";

/**
 * La réponse du fournisseur est une entrée externe : elle est validée par Zod
 * avant le moindre usage, comme tout le reste.
 */
const ReponseDeepSeek = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
});

/**
 * `temperature: 0` — on veut la même structuration pour la même photo. Une
 * sortie qui change d'un appel à l'autre rendrait la calibration de TEC-16
 * ininterprétable : on ne saurait plus si un réglage de seuil a changé quelque
 * chose, ou si c'est le modèle qui a bougé.
 */
const TEMPERATURE = 0;

export function transportDeepSeek(): AiTransport {
  garderServeur("src/lib/ai/providers/deepseek.ts");
  const { DEEPSEEK_MODEL, DEEPSEEK_BASE_URL, DEEPSEEK_API_KEY } = env();

  return {
    nom: NOM_TRANSPORT_DEEPSEEK,
    // Le nom du modèle vient de la configuration du serveur. Il élargit le
    // vocabulaire de l'invariant de dérivabilité, et rien d'autre.
    vocabulaire: [DEEPSEEK_MODEL],

    corps(payload: PayloadIa): CorpsIa {
      return {
        model: DEEPSEEK_MODEL,
        messages: payload.messages(),
        response_format: { type: "json_object" },
        temperature: TEMPERATURE,
        stream: false,
      };
    },

    async emettre(corps: CorpsIa, signal: AbortSignal): Promise<string> {
      if (DEEPSEEK_API_KEY === undefined || DEEPSEEK_API_KEY === "") {
        // P2 §11 : l'absence de clé ne refuse pas le démarrage, elle dégrade
        // l'analyse. Le parent bascule sur la saisie manuelle et la soirée
        // reste possible. Ce test vit dans le transport, pas dans le code
        // applicatif : la fabrique choisit une implémentation, elle ne
        // contourne jamais l'interface.
        throw new Error("DEEPSEEK_API_KEY absente");
      }

      const reponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(corps),
      });

      if (!reponse.ok) {
        throw new Error(`réponse ${reponse.status} du fournisseur`);
      }

      const validee = ReponseDeepSeek.safeParse(await reponse.json());
      if (!validee.success) {
        throw new Error("réponse du fournisseur hors contrat");
      }
      return validee.data.choices[0]?.message.content ?? "";
    },
  };
}
