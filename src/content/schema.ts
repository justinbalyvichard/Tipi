/**
 * Schémas Zod des QUATRE fichiers de `content/` (P2, §2).
 *
 * `content/` est en lecture seule pour le code, et ses fichiers appartiennent
 * à `contenu-enfant` (ARB-10). Ce module ne les modifie pas : il refuse de
 * démarrer si leur forme change. Un texte rendu « undefined » devant un enfant
 * de six ans est un défaut d'interface, pas un détail.
 *
 * Les schémas sont **permissifs sur les champs éditoriaux** (`libelle`,
 * `note`, `req`, tables de règles) et **stricts sur ce que le code consomme** :
 * un identifiant, un texte non vide, un canal parmi trois, un rôle.
 *
 * ARB-02 : le vocabulaire des canaux est celui de `contenu-enfant` — `tts`,
 * `affiche`, `les_deux`. Aucun autre.
 */
import { z } from "zod";

export const Canal = z.enum(["tts", "affiche", "les_deux"]);
export type Canal = z.infer<typeof Canal>;

/** Une clé d'écran : segments minuscules séparés par des points. */
export const CleUi = z
  .string()
  .min(1)
  .regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/u, "Clé d'écran mal formée.");

const texteNonVide = z.string().min(1);

// ---------------------------------------------------------------------------
// content/ui-enfant.json et content/ui-parent.json
// ---------------------------------------------------------------------------

/**
 * Rôle d'un texte d'interface. `indetermine` est la valeur de repli voulue par
 * `contenu-enfant` : elle s'appelle ainsi, et non `texte`, pour qu'un composant
 * ne la rende pas en corps de texte par défaut.
 */
export const RoleTexte = z.enum([
  "titre",
  "corps",
  "bouton",
  "action",
  "aide",
  "valeur",
  "indetermine",
]);
export type RoleTexte = z.infer<typeof RoleTexte>;

export const EntreeUi = z
  .object({
    id: CleUi,
    ecran: z.string().min(1),
    texte: texteNonVide,
    canal: Canal,
    role: RoleTexte,
    jetons: z.array(z.string().min(1)),
    condition: z.string().min(1).nullable(),
    condition_source: z.string().min(1).nullable(),
    exclusif_avec: z.array(CleUi).optional(),
  })
  .passthrough();
export type EntreeUi = z.infer<typeof EntreeUi>;

export const FichierUi = z
  .object({
    schema: z.string().min(1),
    version: z.string().min(1),
    public: z.enum(["enfant", "parent"]),
    canaux: z.array(Canal).nonempty(),
    textes: z.record(CleUi, EntreeUi),
  })
  .passthrough();
export type FichierUi = z.infer<typeof FichierUi>;

// ---------------------------------------------------------------------------
// content/encouragements.json
// ---------------------------------------------------------------------------

/**
 * Une partie d'une variante : le morceau de phrase qui va dans une clé
 * d'écran donnée. La règle `raccordement` du fichier pose que le champ `texte`
 * de la variante est toujours la jointure de ses parties, dans l'ordre : c'est
 * ce que lit le TTS. L'invariant I4 de `scripts/verifier-socle.ts` le vérifie
 * sur les 460 variantes plutôt que de le supposer.
 */
export const PartieVariante = z
  .object({
    cles_ui: z.array(CleUi).nonempty(),
    texte: texteNonVide,
  })
  .passthrough();
export type PartieVariante = z.infer<typeof PartieVariante>;

export const Variante = z
  .object({
    id: z.string().min(1),
    texte: texteNonVide,
    canal: Canal,
    jetons: z.array(z.string().min(1)),
    parties: z.array(PartieVariante).nonempty(),
  })
  .passthrough();
export type Variante = z.infer<typeof Variante>;

/**
 * Une situation = un moment de la session qui porte un sens propre (ARB-04).
 * PED-11 exige au moins 20 variantes par situation ; le minimum est inscrit
 * dans le schéma, pas seulement dans un document.
 */
export const Situation = z
  .object({
    id: z.string().min(1),
    libelle: z.string().min(1),
    cles_ui: z.array(CleUi).nonempty(),
    variantes: z.array(Variante).min(20),
  })
  .passthrough();
export type Situation = z.infer<typeof Situation>;

export const FichierEncouragements = z
  .object({
    schema: z.string().min(1),
    version: z.string().min(1),
    personnage: z.literal("Pilou"),
    canaux: z.array(Canal).nonempty(),
    situations: z.record(z.string().min(1), Situation),
  })
  .passthrough();
export type FichierEncouragements = z.infer<typeof FichierEncouragements>;

// ---------------------------------------------------------------------------
// content/gwenn-scripts.json
// ---------------------------------------------------------------------------
// Le nom du fichier est celui du prompt maître. ESC-001 a été tranchée le
// 2026-09-21 : le nom est conservé, le personnage s'appelle Pilou partout.
// Aucun agent ne rouvre le sujet.

export const LigneRituel = z
  .object({
    id: CleUi,
    ordre: z.number().int().positive(),
    role: z.enum(["titre", "corps", "bouton_principal", "bouton_secondaire"]),
    texte: texteNonVide,
    canal: Canal,
    condition: z.string().min(1).nullable(),
    jetons: z.array(z.string().min(1)),
  })
  .passthrough();
export type LigneRituel = z.infer<typeof LigneRituel>;

export const EcranRituel = z
  .object({
    id: z.string().min(1),
    ordre: z.number().int().positive(),
    libelle: z.string().min(1),
    lignes: z.array(LigneRituel).nonempty(),
  })
  .passthrough();
export type EcranRituel = z.infer<typeof EcranRituel>;

export const Rituel = z
  .object({
    id: z.string().min(1),
    libelle: z.string().min(1),
    route: z.string().min(1),
    rejoue: z.string().min(1),
    ecrans: z.array(EcranRituel).nonempty(),
  })
  .passthrough();
export type Rituel = z.infer<typeof Rituel>;

export const FichierRituels = z
  .object({
    schema: z.string().min(1),
    version: z.string().min(1),
    personnage: z.literal("Pilou"),
    canaux: z.array(Canal).nonempty(),
    rituels: z.record(z.string().min(1), Rituel),
  })
  .passthrough();
export type FichierRituels = z.infer<typeof FichierRituels>;
