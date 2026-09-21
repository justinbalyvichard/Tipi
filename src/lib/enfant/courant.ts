/**
 * L'enfant du foyer et les identifiants qu'il ne faut jamais laisser sortir —
 * **SERVEUR UNIQUEMENT**.
 *
 * V1 = **un seul enfant, profil pré-rempli** (1.2, PRD-02), mais le schéma est
 * multi-enfants depuis le départ. Ce module est l'unique endroit qui fait le
 * pont entre les deux : il choisit l'enfant courant, et le jour où il y en aura
 * deux, c'est sa signature qui change — pas celle de chaque route.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `interditsDe()` VIT ICI ET PAS DANS `src/lib/ai/`
 * ---------------------------------------------------------------------------
 * SEC-04 se décompose en trois parties (voir `src/lib/ai/anonymisation.ts`).
 * La partie (B) — « le texte ne contient aucun identifiant du foyer » — est la
 * seule qui exige de **connaître** le prénom. Elle doit donc s'exercer du côté
 * qui lit la base, c'est-à-dire ici, et surtout **pas** dans `src/lib/ai/**`,
 * où faire entrer un prénom romprait la barrière 1 de P2 §6 : aucune signature
 * de la frontière d'IA n'accepte une donnée identifiante.
 *
 * C'est une lecture de l'architecture, pas une entorse : P2 §6 écrit
 * `assertPayloadAnonyme(payload, interdits)` sans dire qui l'appelle, et le
 * seul appelant possible est celui qui possède `interdits`.
 */
import { IdentifiantsInterdits } from "@/lib/ai/anonymisation";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/enfant/courant.ts");

export interface EnfantCourant {
  readonly id: string;
  readonly prenom: string;
  readonly familyId: string;
  readonly familyNom: string;
  readonly calibrationActive: boolean;
}

export async function enfantCourant(): Promise<EnfantCourant> {
  garderServeur("src/lib/enfant/courant.ts");
  const enfant = await prisma.child.findFirst({
    orderBy: { createdAt: "asc" },
    include: { family: true },
  });
  if (enfant === null) {
    throw new AppError(
      "TIPI_INTROUVABLE",
      "aucun profil enfant en base : le seed de PRD-02 n'a pas été joué.",
    );
  }
  return {
    id: enfant.id,
    prenom: enfant.prenom,
    familyId: enfant.familyId,
    familyNom: enfant.family.nom,
    calibrationActive: enfant.family.calibrationActive,
  };
}

/**
 * Les identifiants du foyer qui ne doivent jamais franchir la frontière d'IA.
 *
 * Quatre valeurs, et chacune pour une raison :
 *  - le **prénom**, que SEC-04 nomme, et qu'une photo de cahier porte très
 *    souvent écrit en haut de la page ;
 *  - l'**identifiant de l'enfant** et celui du **foyer**, qui rendraient un
 *    payload ré-identifiable sans contenir un seul mot de français ;
 *  - le **nom du foyer**, qui est un nom de famille.
 *
 * La liste est construite **à partir de l'enregistrement**, jamais recopiée :
 * un champ identifiant ajouté à `child` demain devra être ajouté ici, et c'est
 * un geste visible.
 */
export function interditsDe(enfant: EnfantCourant): IdentifiantsInterdits {
  // SCELLÉ AU TOUR 3 — [MAJEUR] M5. Ce module est le seul du produit qui lise
  // la base, donc le seul qui sache quoi retirer : c'est ici, et nulle part
  // ailleurs, que la fabrique du sceau est appelée. Le contrôle C7 de
  // `scripts/verifier-confinement.ts` l'épingle.
  return IdentifiantsInterdits.sceller([
    enfant.prenom,
    enfant.id,
    enfant.familyId,
    enfant.familyNom,
  ]);
}
