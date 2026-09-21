/**
 * La table état → écran (section 3.1, P2 §9.1).
 *
 * Isolée de `aiguillage.ts` parce qu'elle est **la seule partie de l'aiguillage
 * qui soit utile au navigateur** : un écran qui vient de faire une transition
 * doit savoir où aller. `aiguillage.ts`, lui, lit la base et reste serveur.
 *
 * Le `Record<EtatSession, string>` est **total** : les neuf états, aucune
 * valeur par défaut. Ajouter un état casse la compilation ici, au lieu de
 * produire une redirection silencieuse vers l'accueil — c'est-à-dire un enfant
 * qui perd son étape en cours, ce que PRD-18 interdit.
 */
import type { EtatSession } from "@/lib/session/types";

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

export function routeDe(etat: EtatSession): string {
  return ROUTE_PAR_ETAT[etat];
}
