/**
 * Tirage d'une phrase de la banque **pour un écran de session** (PED-11, ARB-04).
 *
 * `src/content/selection.ts` fait le tirage ; ce module décide seulement **avec
 * quelle source d'aléa**, et la question n'est pas anodine.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE TIRAGE EST DÉTERMINISTE PAR SESSION, ET NON `Math.random`
 * ---------------------------------------------------------------------------
 * Les écrans de session sont rendus côté serveur — c'est ce qui garde le rendu
 * des jetons hors du bundle (SEC-04) — et un écran serveur est re-rendu à
 * chaque rafraîchissement. Avec `Math.random`, la phrase de Pilou changerait
 * sous les yeux de l'enfant à chaque retour sur l'écran, y compris après une
 * reprise de session : pour un enfant de six ans et demi, le repère deviendrait
 * une devinette — la raison même pour laquelle ARB-06 fige les libellés
 * d'action.
 *
 * La graine est donc `${sessionId}:${situationId}` : la phrase est **stable
 * pour une soirée et une situation**, et différente d'une soirée à l'autre.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CELA NE FAIT PAS, DIT PLUTÔT QUE TU
 * ---------------------------------------------------------------------------
 * La mémoire anti-répétition de `tirerVariante` porte sur les tirages
 * précédents, et elle vit côté affichage (`src/stores/session-ui.ts`, P2 D2).
 * Un rendu serveur ne la consulte pas : deux soirées consécutives peuvent donc
 * tomber sur la même variante, avec une chance sur vingt. Ce n'est pas une
 * répétition *immédiate* au sens de la règle `selection`, mais ce n'est pas non
 * plus la garantie complète. Le raccordement définitif passe par `POST
 * /api/voix`, dont le contrat prend déjà `situationId` **et** `varianteId`
 * (P2 §8.4) : c'est V4 qui fera choisir la variante une seule fois, pour le
 * texte et pour la voix ensemble. Inscrit comme point ouvert dans `V3.out.md`.
 */
import { situation } from "@/content/loader";
import { partiesParCle, tirerVariante } from "@/content/selection";
import { VARIANTES_SANS_REPETITION } from "@/config/ui.config";

/** Hachage FNV-1a, 32 bits. Sans dépendance, et suffisant pour choisir un index. */
function graine(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/**
 * Les couples « clé d'écran → texte » d'une variante de `situationId`, tirée de
 * façon stable pour `sessionId`.
 *
 * Lève si la situation n'existe pas : un écran qui tombe se répare, un écran
 * qui affiche un identifiant technique à un enfant ne se voit pas en recette
 * (`40-protocole-agents.mdc`).
 */
export function partiesPourSession(
  situationId: string,
  sessionId: string,
): ReadonlyMap<string, string> {
  const valeur = graine(`${sessionId}:${situationId}`);
  const { variante } = tirerVariante(
    situation(situationId),
    undefined,
    () => valeur,
    VARIANTES_SANS_REPETITION,
  );
  return partiesParCle(variante);
}

/** Le texte d'une clé d'écran dans la variante tirée, ou une erreur nommée. */
export function textePourSession(
  situationId: string,
  sessionId: string,
  cle: string,
): string {
  const trouve = partiesPourSession(situationId, sessionId).get(cle);
  if (trouve === undefined) {
    throw new Error(`La situation ${situationId} ne porte pas la clé d'écran ${cle}.`);
  }
  return trouve;
}
