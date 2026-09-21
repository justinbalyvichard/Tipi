/**
 * Fabrique d'`AiProvider` — **SERVEUR UNIQUEMENT** (TEC-17, P2 §5.1).
 *
 * Ce fichier et `src/config/env.ts` sont, avec `src/lib/ai/providers/`, les
 * trois seuls endroits du dépôt où le nom d'un fournisseur a le droit
 * d'apparaître. C'est irréductible : associer une valeur de configuration à une
 * implémentation suppose de connaître la valeur.
 *
 * Le provider construit ici n'est pas une implémentation : c'est **le même
 * pour tous les transports**. Prompts, schémas, scellement, invariant SEC-04,
 * relance unique et trace de calibration sont tenus une fois, ici et dans
 * `execution.ts`. Un transport ne peut donc ni les contourner, ni les
 * affaiblir, ni oublier d'en appliquer un.
 */
import type { TexteAnonymise } from "@/lib/ai/anonymisation";
import type { AiProvider, ResultatIa, TexteExercice } from "@/lib/ai/provider";
import { executerPrompt } from "@/lib/ai/execution";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";
import { PROMPT_2_INDICES } from "@/lib/ai/prompts/prompt-2-indices";
import { PROMPT_3_QUESTIONS } from "@/lib/ai/prompts/prompt-3-questions";
import {
  NOM_TRANSPORT_BOUCHON,
  transportBouchon,
} from "@/lib/ai/providers/bouchon";
import {
  NOM_TRANSPORT_DEEPSEEK,
  transportDeepSeek,
} from "@/lib/ai/providers/deepseek";
import {
  DevoirStructure,
  QuatreIndices,
  QuestionsLecture,
} from "@/lib/ai/schemas";
import type { AiTransport } from "@/lib/ai/transport";
import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/ai/index.ts");

/**
 * Les implémentations enregistrées. Ajouter un modèle hébergé en UE, c'est
 * ajouter une ligne ici et un fichier dans `providers/` — et rien d'autre.
 */
const TRANSPORTS: Readonly<Record<string, () => AiTransport>> = {
  [NOM_TRANSPORT_DEEPSEEK]: transportDeepSeek,
  [NOM_TRANSPORT_BOUCHON]: transportBouchon,
};

/**
 * Le texte qu'un exercice de maths donne à lire au modèle.
 *
 * Fonction séparée et exportée pour une raison précise : c'est elle qui décide
 * de ce qui entre dans le payload du prompt 2. Un test peut donc vérifier
 * qu'elle ne compose **que** les trois champs de `TexteExercice`, sans jamais
 * ajouter un identifiant d'exercice ni un identifiant de session.
 *
 * Elle rend une `string` **brute**, et c'est voulu : la composition a lieu
 * **avant** le caviardage, chez l'appelant qui connaît le foyer. Composer après
 * aurait recréé un chemin par lequel du texte non anonymisé rejoint du texte
 * anonymisé — exactement la faille du tour 1, déplacée d'un cran.
 */
export function texteDePrompt(exercice: TexteExercice): string {
  const type = exercice.type === undefined ? "" : `\nType : ${exercice.type}`;
  return `Consigne : ${exercice.consigne}${type}\nÉnoncé : ${exercice.contenu}`;
}

function construire(transport: AiTransport): AiProvider {
  return {
    nom: transport.nom,

    structurerDevoir(texteOcr: TexteAnonymise): Promise<ResultatIa<DevoirStructure>> {
      return executerPrompt(transport, PROMPT_1_STRUCTURATION, texteOcr, DevoirStructure);
    },

    genererIndices(exercice: TexteAnonymise): Promise<ResultatIa<QuatreIndices>> {
      return executerPrompt(transport, PROMPT_2_INDICES, exercice, QuatreIndices);
    },

    genererQuestions(texte: TexteAnonymise): Promise<ResultatIa<QuestionsLecture>> {
      return executerPrompt(transport, PROMPT_3_QUESTIONS, texte, QuestionsLecture);
    },
  };
}

/** Les noms d'implémentation acceptés par `AI_PROVIDER`. */
export function transportsConnus(): readonly string[] {
  return Object.keys(TRANSPORTS);
}

export function getAiProvider(): AiProvider {
  garderServeur("src/lib/ai/index.ts");
  const nom = env().AI_PROVIDER;
  const fabrique = TRANSPORTS[nom];
  if (fabrique === undefined) {
    // Une valeur inconnue n'est pas repliée en silence sur un défaut : un
    // fournisseur choisi par erreur doit s'entendre, pas se deviner.
    throw new Error(
      `AI_PROVIDER = « ${nom} » : implémentation inconnue. Valeurs acceptées : ${transportsConnus().join(", ")}.`,
    );
  }
  return construire(fabrique());
}

/** Construit un provider sur un transport donné. Réservé aux tests. */
export function providerSurTransportPourTest(transport: AiTransport): AiProvider {
  return construire(transport);
}
