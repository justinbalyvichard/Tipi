/**
 * Compression de la photo **côté client** — étape 1 du pipeline (3.2, PRD-03).
 *
 * « Le parent prend une photo par consigne ; compression côté client, envoi
 * vers Supabase Storage. » L'architecture refuse `sharp` explicitement (P2
 * §15.2) : la compression se fait dans le navigateur, avant envoi. Trois
 * bénéfices, tous réels pour l'usage visé — un parent fatigué, un téléphone,
 * un soir de semaine : l'envoi tient dans le budget de 2,5 s de P2 §12.1, le
 * plafond `UPLOAD_MAX_PHOTO_OCTETS` cesse d'être atteint par une photo de
 * 12 Mpx, et le serveur ne dépense rien.
 *
 * ---------------------------------------------------------------------------
 * CE MODULE EST CLIENT, ET NE DOIT RIEN IMPORTER DE SERVEUR
 * ---------------------------------------------------------------------------
 * Aucun import de `src/config/env.ts`, de `seuils.config.ts` ni de quoi que ce
 * soit qui les atteigne (TEC-13). Les deux constantes de cadrage vivent donc
 * ici, et elles ne sont pas des seuils de calibration au sens de TEC-16 : ce
 * sont des bornes de rendu d'image, sans rapport avec la confiance de l'OCR ni
 * avec la tolérance de lecture.
 *
 * ---------------------------------------------------------------------------
 * LE CALCUL EST SÉPARÉ DU DESSIN, ET C'EST CE QUI LE REND TESTABLE
 * ---------------------------------------------------------------------------
 * `dimensionsCibles()` est une fonction pure : elle se teste sans navigateur,
 * sans canevas et sans image. `compresserPhoto()` ne fait plus que dessiner.
 * C'est la seule partie qui exige un navigateur, et elle est réduite au
 * minimum — P6 la couvrira en recette réelle, puisque c'est le seul endroit où
 * elle existe vraiment.
 */

/**
 * Côté le plus long, en pixels, après compression.
 *
 * 1600 px : une page A4 photographiée à cette résolution garde une écriture de
 * CE1 parfaitement lisible pour un OCR de documents, alors que 2400 px double
 * le poids sans rien apporter à la lecture. Ce n'est pas un seuil à régler sur
 * du réel, c'est une borne de cadrage.
 */
export const COTE_MAX_PX = 1600;

/** Qualité JPEG. Au-delà, le poids croît vite ; en deçà, le texte fin bave. */
export const QUALITE_JPEG = 0.82;

export const TYPE_SORTIE = "image/jpeg";

export interface Dimensions {
  readonly largeur: number;
  readonly hauteur: number;
}

/**
 * Dimensions après réduction, **à proportions conservées**.
 *
 * Une image déjà plus petite que la borne n'est **pas agrandie** : la
 * réagrandir n'ajouterait aucune information et coûterait des octets. Le
 * résultat est arrondi à l'entier supérieur pour qu'aucun côté ne tombe à zéro
 * sur une image très allongée.
 */
export function dimensionsCibles(source: Dimensions, coteMax = COTE_MAX_PX): Dimensions {
  const { largeur, hauteur } = source;
  if (largeur <= 0 || hauteur <= 0) return { largeur: 0, hauteur: 0 };
  const plusGrand = Math.max(largeur, hauteur);
  if (plusGrand <= coteMax) return { largeur, hauteur };
  const facteur = coteMax / plusGrand;
  return {
    largeur: Math.max(1, Math.round(largeur * facteur)),
    hauteur: Math.max(1, Math.round(hauteur * facteur)),
  };
}

/**
 * Réduit une photo prise par le parent et rend le `Blob` à envoyer.
 *
 * En cas d'échec — navigateur sans `createImageBitmap`, contexte 2D refusé,
 * image illisible — la fonction rend **le fichier d'origine** plutôt que de
 * lever. PRD-16 : une compression impossible ne doit pas empêcher le parent
 * d'envoyer sa photo ; au pire, l'envoi est plus lent, et le plafond de taille
 * de la route dira ce qu'il en est, avec un message qui mène à un geste.
 */
export async function compresserPhoto(fichier: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return fichier;
  }
  try {
    const image = await createImageBitmap(fichier);
    const cible = dimensionsCibles({ largeur: image.width, hauteur: image.height });
    const canevas = document.createElement("canvas");
    canevas.width = cible.largeur;
    canevas.height = cible.hauteur;
    const pinceau = canevas.getContext("2d");
    if (pinceau === null) return fichier;
    pinceau.drawImage(image, 0, 0, cible.largeur, cible.hauteur);
    image.close();

    const compresse = await new Promise<Blob | null>((resoudre) => {
      canevas.toBlob(resoudre, TYPE_SORTIE, QUALITE_JPEG);
    });
    if (compresse === null) return fichier;
    // Une compression qui alourdit n'en est pas une : c'est le cas d'une photo
    // déjà petite et déjà compressée.
    return compresse.size < fichier.size ? compresse : fichier;
  } catch {
    return fichier;
  }
}
