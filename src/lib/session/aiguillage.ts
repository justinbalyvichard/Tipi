/**
 * Aiguillage de `/` — **SERVEUR UNIQUEMENT** (P2 §8.1, PRD-18, ARB-09).
 *
 * Deux choses, et dans cet ordre :
 *  1. **clore ce qui est périmé** (T12) — c'est ce qui empêche l'enfant de
 *    retomber sur les devoirs de la veille ;
 *  2. dire où aller.
 *
 * L'ordre n'est pas décoratif : répondre d'abord, clore ensuite, renverrait
 * l'enfant sur la session d'hier une dernière fois.
 *
 * ---------------------------------------------------------------------------
 * LA TABLE ÉTAT → ROUTE
 * ---------------------------------------------------------------------------
 * Un `Record<EtatSession, string>` **total** : les neuf états, aucune valeur
 * par défaut. Ajouter un état à l'énumération casse la compilation ici, au lieu
 * de produire une redirection silencieuse vers l'accueil — c'est-à-dire un
 * enfant qui perd son étape en cours, ce que PRD-18 interdit.
 *
 * Les routes sont celles de la section 3.1 du prompt maître. Aucune n'est un
 * texte destiné à un humain : ce sont des chemins.
 */
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { enfantCourant } from "@/lib/enfant/courant";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { cloreSessionsPerimees } from "@/lib/session/cloture-automatique";
import { ETATS_FINAUX, type EtatSession } from "@/lib/session/types";

garderServeur("src/lib/session/aiguillage.ts");

/** Section 3.1 — l'écran de chaque état (P2 §9.1). */
export const ROUTE_PAR_ETAT: Readonly<Record<EtatSession, string>> = Object.freeze({
  idle: "/enfant",
  annonce: "/enfant/programme",
  etape_lecture: "/enfant/session/lecture",
  transition: "/enfant/session/transition",
  etape_maths: "/enfant/session/maths",
  cloture: "/enfant/bravo",
  termine: "/enfant/coffre",
  pause: "/enfant/pause",
  abandon_parent: "/enfant/bravo",
});

export interface EtatAiguillage {
  readonly onboardingFait: boolean;
  readonly enfant: { readonly id: string; readonly prenom: string; readonly theme: string };
  readonly sessionActive: {
    readonly id: string;
    readonly etat: EtatSession;
    readonly route: string;
  } | null;
  readonly programmeEnAttente: boolean;
  /** Ce que la clôture automatique a fermé à l'instant. Pour le journal, jamais montré. */
  readonly sessionsCloses: readonly string[];
}

export async function etatAiguillage(maintenant: Date = new Date()): Promise<EtatAiguillage> {
  garderServeur("src/lib/session/aiguillage.ts");

  const enfant = await enfantCourant();
  const closes = await cloreSessionsPerimees(enfant.id, maintenant);

  const profil = await prisma.child.findUnique({
    where: { id: enfant.id },
    select: { themePrefere: true, onboardingTermineLe: true },
  });
  if (profil === null) {
    throw new AppError("TIPI_INTROUVABLE", "profil enfant disparu entre deux lectures.");
  }

  const active = await prisma.session.findFirst({
    where: { childId: enfant.id, etat: { notIn: [...ETATS_FINAUX] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, etat: true },
  });

  // « Un programme est en attente » = des exercices existent et aucune session
  // ne les porte encore. C'est ce qui fait apparaître l'aperçu côté parent.
  const programmeEnAttente =
    active === null &&
    (await prisma.exercise.count({ where: { homework: { childId: enfant.id } } })) > 0;

  return {
    onboardingFait: profil.onboardingTermineLe !== null,
    enfant: { id: enfant.id, prenom: enfant.prenom, theme: profil.themePrefere },
    sessionActive:
      active === null
        ? null
        : { id: active.id, etat: active.etat, route: ROUTE_PAR_ETAT[active.etat] },
    programmeEnAttente,
    sessionsCloses: closes.map((c) => c.sessionId),
  };
}
