/**
 * Regroupement du programme — PED-06, ARB-08, et rien d'autre.
 *
 * Fonction **pure** : aucune base, aucun réseau, aucune date. C'est ce qui la
 * rend testable à l'unité, et c'est la moitié du pipeline où les deux règles
 * pédagogiques les plus faciles à perdre se décident.
 *
 * ---------------------------------------------------------------------------
 * LES DEUX RÈGLES, ET CE QU'ELLES COÛTENT SI ON LES MANQUE
 * ---------------------------------------------------------------------------
 * **PED-06** — « 2 étapes maximum par soir, quel que soit le volume réel de
 * devoirs ; les exercices d'une même matière sont regroupés dans une seule
 * étape. » Le parent photographie une consigne par photo : six photos de maths
 * font **une** étape de maths, jamais six.
 *
 * **ARB-08** — « Une étape vide n'est jamais créée. Si l'analyse produit une
 * étape sans exercice, elle est écartée et la soirée en compte une de moins. »
 * Le motif est chiffré dans l'arbitrage : une IA qui découpe mal coûterait deux
 * pierres à l'enfant — l'étape et le bonus —, et ETH-04 interdit qu'il perde
 * quoi que ce soit pour une erreur d'analyse.
 *
 * ---------------------------------------------------------------------------
 * `reportes` : CE QUE LE CHAMP PORTE, ET POURQUOI IL EST VIDE AUJOURD'HUI
 * ---------------------------------------------------------------------------
 * Le contrat de `POST /api/devoirs/analyse` (P2, §8.2) rend `reportes:
 * string[]`. Avec **deux** matières et un regroupement par matière, le nombre
 * d'étapes après regroupement ne peut pas dépasser deux : le champ est donc
 * **structurellement vide en V1**. Je le dis au lieu de laisser croire qu'il
 * est rempli et non testé.
 *
 * La condition exacte qui le remplirait est écrite et **gardée par du code**,
 * pas par un commentaire : dès qu'une troisième matière existera, la troisième
 * étape partira dans `reportes` au lieu d'être perdue. Écrire la règle
 * maintenant coûte six lignes ; la découvrir le jour où une matière s'ajoute
 * coûterait un devoir disparu sans que personne le voie.
 */
import type { MatiereIa } from "@/lib/ai/schemas";

/** PED-06 — deux étapes au maximum, quel que soit le volume réel. */
export const ETAPES_MAX = 2;

export interface ExerciceCandidat {
  readonly homeworkId: string;
  readonly matiere: MatiereIa;
  readonly consigne: string;
  readonly type: string;
  readonly contenu: string;
  /** Part de la durée d'étape estimée par le modèle qui revient à cet exercice. */
  readonly dureeEstimeeMin: number;
}

export interface EtapeCandidate {
  readonly matiere: MatiereIa;
  readonly dureeEstimeeMin: number;
  readonly exercices: readonly ExerciceCandidat[];
}

/** Ce qu'une analyse de photo rend, avant tout regroupement. */
export interface AnalysePhoto {
  readonly homeworkId: string;
  readonly etapes: readonly {
    readonly matiere: MatiereIa;
    readonly dureeEstimeeMin: number;
    readonly exercices: readonly {
      readonly consigne: string;
      readonly type: string;
      readonly contenu: string;
    }[];
  }[];
}

export interface Regroupement {
  readonly etapes: readonly EtapeCandidate[];
  /** Matières écartées faute de place (PED-06). Vide tant qu'il n'y a que deux matières. */
  readonly reportes: readonly string[];
  /** Nombre d'étapes écartées parce que vides (ARB-08). Journalisé, jamais montré. */
  readonly etapesVidesEcartees: number;
}

/**
 * La durée d'une étape est **la somme des durées de ses exercices**, à
 * l'analyse comme à la relecture (`GET /api/devoirs/programme`). Le modèle
 * estime par étape ; cette fonction répartit, et la somme redonne la durée de
 * l'étape à l'arrondi près. Une seule définition, donc aucune divergence
 * possible entre les deux chemins — c'est ce qui justifie la colonne
 * `exercise.duree_estimee_min` ajoutée par V2.
 *
 * `Math.max(1, …)` : un exercice ne dure jamais zéro minute, et zéro serait
 * refusé par `EtapePrevue` au lancement de la session (V3).
 */
export function dureeParExercice(dureeEtape: number, nbExercices: number): number {
  if (nbExercices === 0) return 0;
  return Math.max(1, Math.round(dureeEtape / nbExercices));
}

export function regrouper(analyses: readonly AnalysePhoto[]): Regroupement {
  const parMatiere = new Map<MatiereIa, { duree: number; exercices: ExerciceCandidat[] }>();
  let etapesVidesEcartees = 0;

  for (const analyse of analyses) {
    for (const etape of analyse.etapes) {
      // ARB-08 — écartée ici, à l'endroit que l'architecture nomme (P2, §8.2).
      if (etape.exercices.length === 0) {
        etapesVidesEcartees += 1;
        continue;
      }
      const groupe = parMatiere.get(etape.matiere) ?? { duree: 0, exercices: [] };
      const part = dureeParExercice(etape.dureeEstimeeMin, etape.exercices.length);
      for (const exercice of etape.exercices) {
        groupe.duree += part;
        groupe.exercices.push({
          homeworkId: analyse.homeworkId,
          matiere: etape.matiere,
          consigne: exercice.consigne,
          type: exercice.type,
          contenu: exercice.contenu,
          dureeEstimeeMin: part,
        });
      }
      // `Map` conserve l'ordre d'insertion : la première matière rencontrée
      // reste la première étape du soir. L'ordre des photos fait donc foi, et
      // le parent peut le corriger sur l'aperçu (PRD-04, livré par V8).
      parMatiere.set(etape.matiere, groupe);
    }
  }

  const toutes = [...parMatiere.entries()].map(([matiere, groupe]) => ({
    matiere,
    dureeEstimeeMin: groupe.duree,
    exercices: groupe.exercices,
  }));

  // PED-06 — le plafond. Aujourd'hui sans effet, et gardé quand même : voir
  // l'en-tête. Ce qui dépasse est NOMMÉ, jamais perdu en silence.
  const etapes = toutes.slice(0, ETAPES_MAX);
  const reportes = toutes.slice(ETAPES_MAX).map((e) => e.matiere);

  return { etapes, reportes, etapesVidesEcartees };
}
