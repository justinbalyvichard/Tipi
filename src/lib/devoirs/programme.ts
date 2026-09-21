/**
 * Relecture de l'aperçu après un rafraîchissement (P2, §8.2) —
 * **SERVEUR UNIQUEMENT**.
 *
 * Le parent recharge la page, ou revient dessus depuis Réglages : le programme
 * déjà analysé doit réapparaître **identique**, sans relancer ni l'OCR ni le
 * modèle. Sans cette route, un rafraîchissement coûterait une seconde analyse —
 * donc une dépense, une attente, et une sortie de modèle potentiellement
 * différente sous les yeux du parent.
 *
 * ---------------------------------------------------------------------------
 * « IDENTIQUE » EST ICI UNE PROPRIÉTÉ, PAS UNE INTENTION
 * ---------------------------------------------------------------------------
 * La durée d'une étape est **la somme des durées de ses exercices**, et c'est
 * la même définition qui sert à l'analyse (`src/lib/devoirs/regroupement.ts`).
 * Les deux chemins ne peuvent donc pas diverger : il n'y a pas deux calculs
 * qu'on espère d'accord, il y en a un seul.
 *
 * ---------------------------------------------------------------------------
 * LA GARDE DE SOIRÉE
 * ---------------------------------------------------------------------------
 * Seuls les devoirs de la **soirée courante** sont rendus. Un devoir de la
 * veille resté en base renverrait le parent sur le programme d'hier — le défaut
 * exact que le constat 5 de l'architecture a fermé côté session (T12, ARB-09),
 * et qui se reposerait ici à l'identique. La date locale du foyer fait foi
 * (`src/lib/dates/soiree.ts`), jamais l'instant absolu.
 */
import type { LangueIa, MatiereIa } from "@/lib/ai/schemas";
import type { EtapeRendue, ProgrammeRendu } from "@/lib/devoirs/analyse";
import { dateSoiree } from "@/lib/dates/soiree";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { enfantCourant } from "@/lib/enfant/courant";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/devoirs/programme.ts");

function langueGlobale(langues: readonly LangueIa[]): LangueIa {
  const distinctes = new Set(langues);
  if (distinctes.size === 0) return "fr";
  if (distinctes.size === 1) return langues[0] ?? "fr";
  return "mixte";
}

export async function programmeCourant(maintenant = new Date()): Promise<ProgrammeRendu> {
  garderServeur("src/lib/devoirs/programme.ts");
  const enfant = await enfantCourant();
  const soiree = dateSoiree(maintenant);

  const devoirs = await prisma.homework.findMany({
    where: { childId: enfant.id },
    orderBy: { createdAt: "asc" },
    include: { exercises: true },
  });

  const duSoir = devoirs.filter((d) => dateSoiree(d.createdAt) === soiree);

  const langues: LangueIa[] = [];
  for (const devoir of duSoir) {
    // ARB-08, même règle qu'à l'analyse : un devoir sans exercice n'apporte
    // aucune étape, et n'apporte donc pas non plus sa langue.
    if (devoir.exercises.length === 0) continue;
    if (devoir.langueDetectee !== null) langues.push(devoir.langueDetectee);
  }

  // Le tri se fait sur `ordre`, qui est GLOBAL au programme : il reconstitue à
  // la fois l'ordre des exercices dans une étape et l'ordre des étapes entre
  // elles, par ordre de première apparition. Et le regroupement se fait sur la
  // matière de l'EXERCICE, jamais sur celle du devoir — une photo peut porter
  // les deux (3.6).
  const tous = duSoir
    .flatMap((devoir) => devoir.exercises)
    .sort((a, b) => a.ordre - b.ordre);

  const parMatiere = new Map<MatiereIa, EtapeRendue>();
  for (const exercice of tous) {
    const existante = parMatiere.get(exercice.matiere);
    parMatiere.set(exercice.matiere, {
      matiere: exercice.matiere,
      dureeEstimeeMin: (existante?.dureeEstimeeMin ?? 0) + exercice.dureeEstimeeMin,
      exercices: [
        ...(existante?.exercices ?? []),
        { id: exercice.id, consigne: exercice.consigne, type: exercice.type },
      ],
    });
  }

  const etapes = [...parMatiere.values()];
  if (etapes.length === 0) {
    throw new AppError("TIPI_INTROUVABLE", "aucun programme analysé pour la soirée courante");
  }

  // `reportes` est vide par relecture : le report est une décision d'analyse
  // (PED-06), pas un état persistant. Le champ reste au contrat pour que la
  // forme de sortie des deux routes soit rigoureusement la même.
  return { etapes, langueDetectee: langueGlobale(langues), reportes: [] };
}
