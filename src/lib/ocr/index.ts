/**
 * Fabrique d'`OcrProvider` — **SERVEUR UNIQUEMENT**.
 *
 * Symétrique de `src/lib/ai/index.ts`, et pour la même raison : le choix d'une
 * implémentation est une **valeur de configuration**, jamais un `if` dans le
 * code applicatif. Le pipeline ne sait pas contre quoi il tourne, et c'est ce
 * qui rend le branchement du vrai service indolore.
 *
 * `OCR_PROVIDER` est une variable **ajoutée par V2**, absente des 27 du tableau
 * P2 §11. Motif, déclaré plutôt que glissé : §11 a été écrit en supposant que
 * `GOOGLE_SERVICE_ACCOUNT_JSON` absente suffirait à dégrader l'OCR. C'est vrai
 * d'une dégradation, pas d'un **développement** : sans compte externe (ESC-000),
 * un pipeline qui ne sait que échouer n'est pas testable de bout en bout. §5.4
 * de la même architecture pose d'ailleurs l'interface `OcrProvider` en
 * prévoyant explicitement un remplacement après calibration — une fabrique sans
 * sélecteur n'en est pas une.
 */
import { NOM_OCR_BOUCHON, ocrBouchon } from "@/lib/ocr/providers/bouchon";
import {
  NOM_OCR_GOOGLE_VISION,
  ocrGoogleVision,
} from "@/lib/ocr/providers/google-vision";
import type { OcrProvider } from "@/lib/ocr/provider";
import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/ocr/index.ts");

const IMPLEMENTATIONS: Readonly<Record<string, () => OcrProvider>> = {
  [NOM_OCR_GOOGLE_VISION]: ocrGoogleVision,
  [NOM_OCR_BOUCHON]: ocrBouchon,
};

export function ocrConnus(): readonly string[] {
  return Object.keys(IMPLEMENTATIONS);
}

export function getOcrProvider(): OcrProvider {
  garderServeur("src/lib/ocr/index.ts");
  const nom = env().OCR_PROVIDER;
  const fabrique = IMPLEMENTATIONS[nom];
  if (fabrique === undefined) {
    throw new Error(
      `OCR_PROVIDER = « ${nom} » : implémentation inconnue. Valeurs acceptées : ${ocrConnus().join(", ")}.`,
    );
  }
  return fabrique();
}
