/**
 * Étape 3 du pipeline (3.2) — normalisation du texte brut et détection de
 * langue fr/br.
 *
 * ---------------------------------------------------------------------------
 * AUCUN SEUIL NUMÉRIQUE ICI, ET CE N'EST PAS UN HASARD
 * ---------------------------------------------------------------------------
 * TEC-16 veut les seuils en configuration, jamais en constantes dispersées, et
 * P2 §13 en fait une règle opposable : « aucun littéral numérique de seuil
 * n'apparaît dans `src/lib/ocr/**` ». La détection de langue est donc écrite
 * **sans aucun seuil** : elle ne compare pas une proportion de mots bretons à
 * un pourcentage, elle constate la **présence** de marqueurs. Deux ensembles,
 * trois cas, zéro nombre à régler — et donc zéro nombre à oublier de régler.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE DÉTECTION EST, ET CE QU'ELLE N'EST PAS
 * ---------------------------------------------------------------------------
 * C'est la détection **locale**, gratuite et immédiate. Le prompt 1 demande
 * aussi au modèle la langue de chaque consigne, et c'est **sa** réponse qui
 * fait foi (3.6). La détection locale sert à deux choses, toutes deux réelles :
 * elle donne une langue quand le modèle est indisponible, et elle est
 * journalisée à côté de la réponse du modèle pour la calibration de TEC-16 —
 * deux avis qui divergent sur vingt photos, c'est une information.
 *
 * PED-13 rappelé pour qu'aucun agent en aval ne s'emballe : le breton est un
 * mode dégradé assumé. On détecte la langue pour afficher le texte et expliquer
 * la consigne en français, jamais pour promettre quoi que ce soit à l'enfant.
 */
import type { LangueIa } from "@/lib/ai/schemas";

/**
 * Marqueurs du breton. Deux familles, toutes deux nécessaires :
 *  - des **graphèmes** propres au breton, que le français n'écrit pas ;
 *  - des **mots grammaticaux** très fréquents, cherchés comme mots entiers.
 *
 * Chaque entrée est choisie pour ne pas exister en français : `ar` et `an` sont
 * cherchés comme mots pleins, donc jamais dans « part » ni « anse ».
 */
const MARQUEURS_BRETON: readonly RegExp[] = Object.freeze([
  /c'h/u,
  /zh/u,
  /ñ/u,
  /(?:^|\s)(?:ar|an|al|ur|un|ul)\s+\w*(?:c'h|zh)/u,
  /(?:^|\s)(?:ha|hag|gant|eus|ez|hep|pelec'h|petra|piv|kont|niver|lenn|skriv)(?:\s|$|[.,;:!?])/u,
]);

/**
 * Marqueurs du français. Mots grammaticaux qui n'existent pas en breton, et
 * qu'un devoir de CE1 emploie forcément s'il est rédigé en français.
 */
const MARQUEURS_FRANCAIS: readonly RegExp[] = Object.freeze([
  /(?:^|\s)(?:le|la|les|des|une|dans|avec|pour|est|sont|tu|je|il|elle|nous|vous|combien|calcule|écris|lis|réponds|colorie)(?:\s|$|[.,;:!?])/u,
]);

/** Minuscules, accents conservés : `ñ` est un marqueur, le retirer l'effacerait. */
function replier(texte: string): string {
  return texte.toLowerCase();
}

/**
 * Nettoyage du texte brut rendu par l'OCR.
 *
 * Ce qui est fait, et pourquoi chaque geste :
 *  - normalisation Unicode NFC, pour que « é » composé et « é » décomposé
 *    soient la même chaîne — sans quoi un caviardage de prénom (SEC-04)
 *    pourrait rater une occurrence écrite autrement ;
 *  - suppression des signes de contrôle, que l'OCR laisse parfois passer ;
 *  - unification des fins de ligne et des espaces insécables ;
 *  - suppression des lignes vides et des espaces de bord.
 *
 * Ce qui n'est **pas** fait, volontairement : aucune correction orthographique,
 * aucune mise en minuscules, aucune suppression de ponctuation. Le texte part
 * ensuite vers le modèle et vers l'écran du parent ; l'abîmer pour le
 * « nettoyer » reviendrait à décider à la place du modèle.
 */
export function normaliserTexteOcr(brut: string): string {
  return brut
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .replace(/[   ]/gu, " ")
    .replace(/[\p{Cc}\p{Cf}]/gu, (c) => (c === "\n" ? c : " "))
    .split("\n")
    .map((ligne) => ligne.replace(/[ \t]+/gu, " ").trim())
    .filter((ligne) => ligne !== "")
    .join("\n");
}

export interface LangueDetectee {
  readonly langue: LangueIa;
  /** Les marqueurs réellement reconnus, pour que la calibration soit lisible. */
  readonly marqueursBreton: readonly string[];
  readonly marqueursFrancais: readonly string[];
}

/**
 * Détection locale fr / br / mixte, **par présence de marqueurs**.
 *
 *  - des marqueurs des deux langues → `mixte` ;
 *  - seulement des marqueurs bretons → `br` ;
 *  - tout le reste → `fr`.
 *
 * Le dernier cas couvre le texte sans marqueur — une page de calculs, par
 * exemple. Le français est le repli, et c'est le bon : PED-13 fait expliquer
 * toute consigne en français de toute façon.
 */
export function detecterLangue(texte: string): LangueDetectee {
  const plat = replier(texte);
  const br = MARQUEURS_BRETON.filter((m) => m.test(plat)).map((m) => m.source);
  const fr = MARQUEURS_FRANCAIS.filter((m) => m.test(plat)).map((m) => m.source);

  const langue: LangueIa =
    br.length !== 0 && fr.length !== 0 ? "mixte" : br.length !== 0 ? "br" : "fr";

  return { langue, marqueursBreton: br, marqueursFrancais: fr };
}

/** Vrai si le texte n'apporte rien : état « illisible » (`TIPI_OCR_VIDE`). */
export function texteVide(texte: string): boolean {
  return normaliserTexteOcr(texte).replace(/[^\p{L}\p{N}]/gu, "") === "";
}
