/**
 * Prompt 3 — questions de compréhension de lecture.
 *
 * **Texte repris mot pour mot de la section 3.6 du prompt maître**, à une
 * différence près, déclarée : le jeton `{{texte}}` de la section 3.6 n'est pas
 * substitué dans le prompt. Le texte lu par l'enfant est passé comme **message
 * utilisateur**, séparé du prompt.
 *
 * Ce n'est pas un détail de forme, c'est SEC-04 : l'invariant de dérivabilité
 * (`src/lib/ai/anonymisation.ts`) vérifie que tout octet émis appartient soit
 * au prompt versionné, soit au texte de l'exercice. Une interpolation fondrait
 * les deux en une seule chaîne et l'invariant ne pourrait plus rien séparer.
 *
 * Le contrat de sortie est inchangé.
 */
import type { PromptVersionne } from "@/lib/ai/prompts/types";

export const VERSION_PROMPT_3 = "1.0.0";

const TEXTE = [
  "Tu es Pilou. Un enfant de CE1 vient de lire à voix haute le texte fourni par le message suivant.",
  "Génère 2 questions de compréhension orale simples, avec pour chacune 2 à 3 mots-clés attendus dans une bonne réponse, pour un jugement souple et non une correction stricte.",
  'Réponds en JSON : { "questions": [{ "question": string, "mots_cles": [string] }] }',
].join(" ");

export const PROMPT_3_QUESTIONS: PromptVersionne = Object.freeze({
  id: "questions",
  version: VERSION_PROMPT_3,
  texte: TEXTE,
});
