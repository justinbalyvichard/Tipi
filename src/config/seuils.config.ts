/**
 * TEC-16 — seuils de calibration, **SERVEUR UNIQUEMENT** (P2, §13).
 *
 * Règle opposable à `controle-code` : aucun littéral numérique de seuil
 * n'apparaît dans `src/lib/ocr/**`, `src/lib/lecture/**` ni `src/lib/maths/**`.
 * Tout passe par `SEUILS`.
 *
 * Rappel de la section 8.3 du prompt maître, à ne pas perdre : ces seuils sont
 * des valeurs de DÉPART, pas des vérités. Ils ne se règlent que sur de vraies
 * photos et de vrais enregistrements. Aucun agent en aval ne doit les figer.
 *
 * Ce module est serveur parce qu'il lit `env.ts`. C'est aussi la raison pour
 * laquelle le rapprochement du texte lu se fait côté serveur (P2, §13) :
 * descendre `lectureToleranceMot` dans le bundle disperserait la valeur que
 * TEC-16 veut centraliser.
 */
import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/config/seuils.config.ts");

export interface Seuils {
  /** Sous ce score de confiance OCR, la photo est « illisible » (PRD-16). */
  readonly ocrConfianceMin: number;
  /** Tolérance Levenshtein relative, par mot (3.4). */
  readonly lectureToleranceMot: number;
  /** Part de mots reconnus jugée suffisante (3.4). */
  readonly lectureSeuilMotsOk: number;
  /** PED-08 — sollicitations sans réponse exploitable avant proposition de pause. */
  readonly blocageNbSollicitations: number;
  /** TEC-16 — nombre de photos journalisées en mode calibration. */
  readonly calibrationNbPhotos: number;
  /**
   * Durée estimée d'une étape quand aucun modèle ne l'a estimée (saisie
   * manuelle sans fournisseur d'IA). **Sixième entrée, ajoutée par V2** : écart
   * déclaré par rapport aux cinq de P2 §13, motivé dans `src/config/env.ts`.
   */
  readonly dureeSecoursEtapeMin: number;
}

let cache: Seuils | undefined;

export function seuils(): Seuils {
  garderServeur("src/config/seuils.config.ts");
  if (cache !== undefined) return cache;
  const e = env();
  cache = Object.freeze({
    ocrConfianceMin: e.OCR_CONFIANCE_MIN,
    lectureToleranceMot: e.LECTURE_TOLERANCE_MOT,
    lectureSeuilMotsOk: e.LECTURE_SEUIL_MOTS_OK,
    blocageNbSollicitations: e.BLOCAGE_NB_SOLLICITATIONS,
    calibrationNbPhotos: e.CALIBRATION_NB_PHOTOS,
    dureeSecoursEtapeMin: e.DUREE_SECOURS_ETAPE_MIN,
  });
  return cache;
}

/** Remet le cache à zéro. Réservé aux tests. */
export function reinitialiserSeuilsPourTest(): void {
  cache = undefined;
}
