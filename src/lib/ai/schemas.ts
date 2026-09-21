/**
 * Les TROIS sorties JSON de la section 3.6, **strictement validées par Zod**
 * (TEC-05, P2 §5.1).
 *
 * Règle de code du projet : toute entrée externe est validée par Zod avant
 * usage. La sortie d'un modèle de langage est l'entrée externe la moins fiable
 * du produit — elle n'a aucun contrat, seulement une consigne.
 *
 * ---------------------------------------------------------------------------
 * CE QUE « STRICTEMENT » VEUT DIRE ICI, ET CE QU'IL NE VEUT PAS DIRE
 * ---------------------------------------------------------------------------
 * La sévérité porte sur **la forme et les valeurs** : énumérations fermées,
 * tuple de quatre indices exactement, bornes numériques, chaînes non vides.
 * Elle ne porte **pas** sur la présence de champs surnuméraires, que Zod écarte
 * silencieusement. C'est une décision, et voici son motif : un modèle qui
 * ajoute un champ décoratif à une sortie par ailleurs parfaite enverrait le
 * devoir entier en état « illisible », et le parent reprendrait une photo
 * correcte. PRD-16 demande des états limites rares et justes, pas zélés.
 *
 * Les champs surnuméraires ne sont pas une faille : rien de ce qui entre ici
 * ne ressort vers le modèle, et ce qui est écrit en base l'est champ par champ.
 *
 * ---------------------------------------------------------------------------
 * NOMMAGE
 * ---------------------------------------------------------------------------
 * Les noms d'entrée sont ceux de la section 3.6, au signe près : c'est le
 * contrat que le prompt annonce au modèle, et le modifier ici ferait diverger
 * le prompt de son schéma. La sortie, elle, est en camelCase, comme tout le
 * reste du code. La conversion se fait ici, en un seul endroit.
 */
import { z } from "zod";

/** Les deux seules matières de la V1 (PED-06). */
export const MatiereIa = z.enum(["lecture", "maths"]);
export type MatiereIa = z.infer<typeof MatiereIa>;

/** 3.2 étape 3 et PED-13 : français, breton, ou les deux sur la même page. */
export const LangueIa = z.enum(["fr", "br", "mixte"]);
export type LangueIa = z.infer<typeof LangueIa>;

const texteNonVide = z.string().trim().min(1);

/**
 * Bornes de durée. Un exercice de CE1 qui durerait plus de deux heures est une
 * sortie fausse, pas un devoir : la borne haute est donc un vrai contrôle, pas
 * une décoration. La borne basse refuse le zéro, qui rendrait un aperçu
 * mensonger côté parent.
 */
const dureeMinutes = z.number().int().min(1).max(120);

// ---------------------------------------------------------------------------
// Prompt 1 — structuration du devoir
// ---------------------------------------------------------------------------

const ExerciceIa = z
  .object({
    consigne: texteNonVide.max(1000),
    type: texteNonVide.max(120),
    contenu: z.string().trim().max(4000),
  })
  .transform((e) => ({ consigne: e.consigne, type: e.type, contenu: e.contenu }));

/**
 * Une étape peut arriver **vide**, et le schéma l'accepte volontairement :
 * ARB-08 veut qu'une étape sans exercice soit **écartée**, pas qu'elle fasse
 * échouer l'analyse entière. La refuser ici enverrait un devoir lisible en
 * état « illisible » pour une étape parasite. L'écart se fait dans
 * `src/lib/devoirs/regroupement.ts`, à l'endroit que l'architecture nomme.
 */
const EtapeIa = z
  .object({
    matiere: MatiereIa,
    duree_estimee_min: dureeMinutes,
    exercices: z.array(ExerciceIa),
  })
  .transform((e) => ({
    matiere: e.matiere,
    dureeEstimeeMin: e.duree_estimee_min,
    exercices: e.exercices,
  }));

/**
 * `etapes` est borné à 2 par PED-06 — la consigne du prompt le dit déjà, et le
 * schéma le rend opposable. Un modèle qui en rendrait trois est en faute, et sa
 * sortie est rejouée une fois avant de basculer en « illisible » (3.2, étape 4).
 */
export const DevoirStructure = z
  .object({
    langue_detectee: LangueIa,
    etapes: z.array(EtapeIa).max(2),
  })
  .transform((d) => ({ langueDetectee: d.langue_detectee, etapes: d.etapes }));

export type DevoirStructure = z.infer<typeof DevoirStructure>;
export type EtapeStructuree = DevoirStructure["etapes"][number];
export type ExerciceStructure = EtapeStructuree["exercices"][number];

// ---------------------------------------------------------------------------
// Prompt 2 — quatre indices progressifs (PED-02, TEC-07)
// ---------------------------------------------------------------------------

/**
 * **Exactement quatre**, jamais trois, jamais cinq : le bouton « un petit
 * indice ? » en déroule un par appui et s'arrête au quatrième (3.5). Un tuple,
 * et non un tableau borné, pour que le type porte lui-même les quatre niveaux.
 */
export const QuatreIndices = z
  .object({
    indices: z.tuple([
      texteNonVide.max(600),
      texteNonVide.max(600),
      texteNonVide.max(600),
      texteNonVide.max(600),
    ]),
  })
  .transform((q) => ({ indices: q.indices }));

export type QuatreIndices = z.infer<typeof QuatreIndices>;

// ---------------------------------------------------------------------------
// Prompt 3 — questions de compréhension (3.4)
// ---------------------------------------------------------------------------

/**
 * Le prompt demande deux questions ; le schéma accepte de une à trois.
 *
 * Motif, et il est pédagogique avant d'être technique : une question de moins
 * ne casse rien — l'étape lecture reste jouable — alors qu'un rejet renverrait
 * l'enfant sur un état limite. Le jugement est souple par construction (3.4,
 * PED-09) ; son schéma n'a pas à être plus raide que lui.
 */
export const QuestionsLecture = z
  .object({
    questions: z
      .array(
        z
          .object({
            question: texteNonVide.max(400),
            mots_cles: z.array(texteNonVide.max(60)).min(1).max(6),
          })
          .transform((q) => ({ question: q.question, motsCles: q.mots_cles })),
      )
      .min(1)
      .max(3),
  })
  .transform((q) => ({ questions: q.questions }));

export type QuestionsLecture = z.infer<typeof QuestionsLecture>;
