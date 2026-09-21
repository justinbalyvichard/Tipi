/**
 * Prompt 1 — structuration du devoir (texte OCR → JSON).
 *
 * **Texte repris mot pour mot de la section 3.6 du prompt maître.** Il n'est
 * ni reformulé, ni « amélioré » : c'est un livrable produit, versionné ici pour
 * que P5 puisse comparer une sortie de modèle à la version qui l'a produite.
 *
 * Versionnement (P2, §5.1) : `VERSION` change dès que le texte change, et la
 * version voyage avec chaque appel jusqu'à `calibration_log` (TEC-16). Sans
 * elle, un réglage fait sur vingt photos ne serait pas rejouable — on ne
 * saurait plus quel prompt a produit quelle sortie.
 *
 * SEC-04 : ce texte ne contient aucun jeton, aucun prénom, aucune donnée du
 * foyer. C'est une constante, identique pour tous les enfants.
 */
import type { PromptVersionne } from "@/lib/ai/prompts/types";

export const VERSION_PROMPT_1 = "1.0.0";

const TEXTE = [
  "Tu structures un devoir scolaire pour un enfant de CE1 (6-7 ans), classe bilingue français-breton.",
  "Entrée : texte brut extrait par OCR d'une photo de cahier ou de feuille d'exercice.",
  "Détecte la langue de chaque consigne (fr ou br).",
  "Découpe en exercices distincts.",
  "Regroupe les exercices d'une même matière dans une seule étape.",
  "Maximum 2 étapes au total.",
  "Pour chaque exercice, indique : matière (lecture ou maths), consigne reformulée simplement pour un CE1, type d'exercice, durée estimée en minutes.",
  "Ne résous jamais les exercices de maths.",
  'Réponds uniquement en JSON valide : { "langue_detectee": "fr"|"br"|"mixte", "etapes": [{ "matiere": "lecture"|"maths", "duree_estimee_min": number, "exercices": [{ "consigne": string, "type": string, "contenu": string }] }] }',
].join(" ");

export const PROMPT_1_STRUCTURATION: PromptVersionne = Object.freeze({
  id: "structuration",
  version: VERSION_PROMPT_1,
  texte: TEXTE,
});
