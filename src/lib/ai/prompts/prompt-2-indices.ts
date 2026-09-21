/**
 * Prompt 2 — indices progressifs de maths (jamais la réponse).
 *
 * **Texte repris mot pour mot de la section 3.6 du prompt maître.**
 *
 * PED-01 est une **promesse produit**, pas une préférence de rédaction : « en
 * maths, ne jamais donner le résultat, même si l'enfant le demande
 * explicitement plusieurs fois ». Le prompt porte cette promesse ; le test de
 * non-régression qui la vérifie contre un vrai modèle est écrit par P5, et son
 * terrain — corpus d'insistance et détecteur de résultat — est livré ici dans
 * `src/lib/ai/prompts/ped-01.ts`.
 *
 * `CLAUSE_JAMAIS_LE_RESULTAT` est extraite du texte et non recopiée : un test
 * qui recopierait la phrase resterait vert si quelqu'un la retirait du prompt.
 * C'est la règle « invariant plutôt que re-dérivation » appliquée à une chaîne.
 */
import type { PromptVersionne } from "@/lib/ai/prompts/types";

export const VERSION_PROMPT_2 = "1.0.0";

/**
 * La phrase qui porte PED-01, telle qu'elle est écrite dans la section 3.6.
 * Elle est déclarée ici comme **motif de recherche**, et le module vérifie à
 * l'import qu'elle est bien présente dans le texte du prompt : retirer la
 * clause du prompt fait échouer le chargement du module, pas seulement un test.
 */
export const CLAUSE_JAMAIS_LE_RESULTAT =
  "Tu ne donnes JAMAIS le résultat d'un calcul ou d'un problème, même si on te le demande directement, même si on insiste.";

const TEXTE = [
  "Tu es Pilou, une petite loutre qui aide un enfant de CE1 à faire ses maths.",
  CLAUSE_JAMAIS_LE_RESULTAT,
  "Pour l'exercice donné, génère 4 indices progressifs, du plus léger au plus explicite :",
  "1) une question ouverte qui fait réfléchir à ce qui est demandé ;",
  "2) une suggestion de méthode concrète (compter sur ses doigts, dessiner les objets) ;",
  "3) un exemple similaire avec des nombres plus petits ;",
  "4) une résolution guidée pas à pas à l'oral, sans jamais prononcer le résultat final.",
  "Ton chaleureux, phrases courtes, vocabulaire de CE1.",
  'Réponds en JSON : { "indices": [string, string, string, string] }',
].join(" ");

if (!TEXTE.includes(CLAUSE_JAMAIS_LE_RESULTAT)) {
  // Impossible par construction aujourd'hui, et c'est justement le but : le
  // jour où quelqu'un réécrit `TEXTE` sans la clause, le module refuse de se
  // charger et toute la verticale maths s'arrête. PED-01 ne se perd pas en
  // silence dans un diff.
  throw new Error(
    "PED-01 : le prompt 2 ne porte plus la clause « jamais le résultat » (src/lib/ai/prompts/prompt-2-indices.ts).",
  );
}

export const PROMPT_2_INDICES: PromptVersionne = Object.freeze({
  id: "indices",
  version: VERSION_PROMPT_2,
  texte: TEXTE,
});
