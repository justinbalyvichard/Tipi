/**
 * `OcrProvider` — la frontière de l'étape 2 du pipeline (3.2, TEC-05).
 *
 * L'interface existe parce que l'OCR est l'endroit du produit le plus
 * susceptible d'être remplacé après la calibration de TEC-16 — pas par symétrie
 * décorative avec les trois autres frontières (P2, §5.4).
 *
 * **Interdit structurel, et c'est le nœud de TEC-05** : `OcrProvider` est le
 * seul endroit du produit qui manipule des octets d'image. `AiProvider`, lui,
 * ne prend aucun `Buffer`, aucune image, aucune URL. Faire passer une photo au
 * modèle de langage demanderait de changer cette interface-là, ce qu'une revue
 * verrait.
 */

export interface ResultatOcr {
  /** Le texte extrait, brut. Vide = état « illisible » (`TIPI_OCR_VIDE`). */
  readonly texte: string;
  /**
   * Score de confiance dans [0,1], comparé à `SEUILS.ocrConfianceMin` par le
   * pipeline — jamais par le fournisseur, qui n'a pas à connaître le seuil
   * (TEC-16 : les seuils sont en configuration, en un seul endroit).
   */
  readonly confiance: number;
}

export interface OcrProvider {
  readonly nom: string;
  /**
   * `DOCUMENT_TEXT_DETECTION` pour l'implémentation Google Cloud Vision
   * (TEC-05). Les octets entrent ici et n'en ressortent jamais.
   */
  extraire(image: Buffer): Promise<ResultatOcr>;
}
