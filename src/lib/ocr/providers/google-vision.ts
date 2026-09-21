/**
 * Google Cloud Vision, `DOCUMENT_TEXT_DETECTION` (TEC-05) —
 * **SERVEUR UNIQUEMENT**.
 *
 * `DOCUMENT_TEXT_DETECTION` et non `TEXT_DETECTION` : le premier est réglé pour
 * des pages denses et manuscrites, le second pour des enseignes et des
 * panneaux. C'est la différence entre lire un cahier de CE1 et ne pas le lire.
 *
 * ---------------------------------------------------------------------------
 * NON EXÉCUTÉ CONTRE LE VRAI SERVICE
 * ---------------------------------------------------------------------------
 * Aucun compte externe n'existe (ESC-000). Ce fichier n'a jamais reçu de
 * réponse réelle de Google. Ce qui est prouvé : la sélection par configuration,
 * l'appel, la validation Zod de la réponse, le calcul de confiance et le chemin
 * d'erreur. Ce qui ne l'est pas : la forme exacte de la réponse réelle, et la
 * qualité de la lecture sur l'écriture d'Evan — qui est précisément ce que le
 * mode calibration de TEC-16 existe pour mesurer.
 *
 * ---------------------------------------------------------------------------
 * LE CHARGEMENT EST DIFFÉRÉ, ET POUR UNE RAISON
 * ---------------------------------------------------------------------------
 * Le SDK est importé dynamiquement, à l'intérieur de `extraire`. Sans cela,
 * choisir `OCR_PROVIDER="bouchon"` chargerait quand même une soixantaine de
 * paquets au démarrage — un bouchon qui coûte le prix du vrai service n'en est
 * pas un.
 */
import { z } from "zod";

import type { OcrProvider, ResultatOcr } from "@/lib/ocr/provider";
import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/ocr/providers/google-vision.ts");

export const NOM_OCR_GOOGLE_VISION = "google-vision";

/**
 * La réponse du service est une entrée externe : validée par Zod avant usage,
 * et **tolérante sur ce qui manque**. Un champ absent doit donner « je n'ai
 * rien lu », jamais une exception de lecture de propriété.
 */
const ReponseVision = z.object({
  fullTextAnnotation: z
    .object({
      text: z.string().optional(),
      pages: z.array(z.object({ confidence: z.number().optional() })).optional(),
    })
    .nullish(),
  error: z.object({ message: z.string().optional() }).nullish(),
});

/**
 * Confiance retenue pour la photo : la **plus basse** des pages.
 *
 * Choix explicite, et il va dans le sens de PRD-16 : prendre la moyenne
 * masquerait une page illisible derrière une page nette, et l'enfant
 * travaillerait sur un exercice à moitié inventé. Mieux vaut déclarer la photo
 * illisible et proposer au parent de la reprendre.
 */
function confianceRetenue(pages: readonly { readonly confidence?: number }[]): number {
  const valeurs = pages
    .map((p) => p.confidence)
    .filter((c): c is number => typeof c === "number" && Number.isFinite(c));
  if (valeurs.length === 0) return 0;
  return valeurs.reduce((bas, c) => (c < bas ? c : bas), valeurs[0] ?? 0);
}

export function ocrGoogleVision(): OcrProvider {
  garderServeur("src/lib/ocr/providers/google-vision.ts");
  const { GOOGLE_SERVICE_ACCOUNT_JSON } = env();

  return {
    nom: NOM_OCR_GOOGLE_VISION,

    async extraire(image: Buffer): Promise<ResultatOcr> {
      if (GOOGLE_SERVICE_ACCOUNT_JSON === undefined || GOOGLE_SERVICE_ACCOUNT_JSON === "") {
        // P2 §11 : l'absence du compte de service ne refuse pas le démarrage.
        // L'OCR échoue, le parent bascule sur la saisie manuelle, la soirée
        // reste possible. Le test vit dans le fournisseur, jamais dans le code
        // applicatif.
        throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON absente");
      }

      const credentials: unknown = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
      const { ImageAnnotatorClient } = await import("@google-cloud/vision");
      const client = new ImageAnnotatorClient({
        credentials: z
          .object({ client_email: z.string(), private_key: z.string() })
          .parse(credentials),
      });

      const [brute] = await client.documentTextDetection({
        image: { content: image },
      });

      const lue = ReponseVision.safeParse(brute);
      if (!lue.success) {
        throw new Error("réponse Vision hors contrat");
      }
      const message = lue.data.error?.message;
      if (message !== undefined && message !== "") {
        throw new Error(`Vision : ${message}`);
      }

      return {
        texte: lue.data.fullTextAnnotation?.text ?? "",
        confiance: confianceRetenue(lue.data.fullTextAnnotation?.pages ?? []),
      };
    },
  };
}
