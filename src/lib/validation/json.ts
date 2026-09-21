/**
 * Schémas Zod des TROIS colonnes `Json` du modèle (P2, §3.2, constat 12).
 *
 * Ce module en est le propriétaire unique. Chaque colonne est validée
 * **à l'écriture ET à la lecture** : Prisma type une colonne `Json` en
 * `Prisma.JsonValue`, ce qui n'est pas une forme. Une ligne écrite par une
 * version antérieure du code doit être refusée explicitement, jamais lue de
 * travers.
 *
 * Aucune de ces trois colonnes n'est un fourre-tout.
 */
import { z } from "zod";

/** Les deux seules matières de la V1 (PED-06). */
export const Matiere = z.enum(["lecture", "maths"]);
export type Matiere = z.infer<typeof Matiere>;

/** Les neuf états de la machine (3.3, TEC-10). Miroir de `EtatSession`. */
export const EtatSession = z.enum([
  "idle",
  "annonce",
  "etape_lecture",
  "transition",
  "etape_maths",
  "cloture",
  "termine",
  "pause",
  "abandon_parent",
]);
export type EtatSession = z.infer<typeof EtatSession>;

export const Uuid = z.string().uuid();

/**
 * `exercise.indices` — TEC-07.
 *
 * Exactement quatre niveaux (PED-02), jamais trois, jamais cinq : le bouton
 * « un petit indice ? » en déroule un par appui et s'arrête au quatrième.
 * `source` distingue la pré-génération à l'analyse du secours à la demande.
 */
export const IndicesExercice = z.object({
  niveaux: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  source: z.enum(["pregenere", "secours"]),
});
export type IndicesExercice = z.infer<typeof IndicesExercice>;

/**
 * `session.etapes_prevues` — le programme validé par le parent (TEC-06).
 *
 * `exerciseIds` est NON VIDE, et c'est ARB-08 : une étape sans exercice n'est
 * jamais programmée, elle est écartée et la soirée en compte une de moins. Une
 * IA qui découpe mal ne doit pas coûter deux pierres à l'enfant.
 *
 * L'ordre de ce tableau fait foi pour les six configurations C1 à C6 (7.0).
 * `.max(2)` est PED-06 : deux étapes au maximum, quel que soit le volume réel.
 */
export const EtapePrevue = z.object({
  matiere: Matiere,
  ordre: z.number().int().nonnegative(),
  dureeEstimeeMin: z.number().int().positive(),
  exerciseIds: z.array(Uuid).min(1),
});
export type EtapePrevue = z.infer<typeof EtapePrevue>;

export const EtapesPrevues = z.array(EtapePrevue).max(2);
export type EtapesPrevues = z.infer<typeof EtapesPrevues>;

/**
 * `session.evenements` — journal append-only des transitions (PRD-18, PRD-06).
 *
 * Sert la reprise, l'idempotence des doubles appuis (`evenementId`) et les
 * faits qualitatifs du résumé parent. Il n'est jamais réécrit, seulement
 * étendu.
 *
 * `evenement` reste une chaîne non vide ici et non une énumération : la liste
 * des événements de la machine est livrée par V3 (`src/lib/session/types.ts`),
 * et ce module ne doit pas la dupliquer. V3 resserre le type à l'usage.
 */
export const EvenementJournal = z.object({
  evenementId: z.string().min(1),
  evenement: z.string().min(1),
  de: EtatSession,
  vers: EtatSession,
  at: z.string().datetime({ offset: true }),
});
export type EvenementJournal = z.infer<typeof EvenementJournal>;

export const JournalEvenements = z.array(EvenementJournal);
export type JournalEvenements = z.infer<typeof JournalEvenements>;

/**
 * `attempt.mots_hesitants` — 3.4, « Mots à revoir » côté parent.
 * Colonne `Json` de forme simple, listée ici pour qu'aucun autre module ne la
 * redéfinie au passage.
 */
export const MotsHesitants = z.array(z.string().min(1));
export type MotsHesitants = z.infer<typeof MotsHesitants>;

/**
 * Lit une valeur `Json` venue de la base et la refuse si sa forme a changé.
 * Lève une `Error` nommant la colonne : une donnée mal formée est un défaut
 * serveur, jamais un message montré à un humain (P2, §10.1).
 */
export function lireJson<T>(schema: z.ZodType<T>, colonne: string, valeur: unknown): T {
  const parse = schema.safeParse(valeur);
  if (!parse.success) {
    const champs = parse.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Colonne Json non conforme : ${colonne} (${champs}).`);
  }
  return parse.data;
}
