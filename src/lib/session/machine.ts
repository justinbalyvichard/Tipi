/**
 * La machine à états de session — **FONCTION PURE** (TEC-10, P2 §9.2).
 *
 * Aucun accès base, aucune horloge, aucun réseau, aucune configuration : une
 * transition ne dépend que de l'état persisté, de l'événement reçu et du plan
 * de la soirée. C'est elle que les tests parcourent état par état, et c'est
 * elle qui décide — le service, lui, exécute.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA TABLE EST TOTALE, ET NON UNE LISTE DE CAS AUTORISÉS
 * ---------------------------------------------------------------------------
 * Leçon 2 du projet : *quantifier la propriété sur tous ses sites, présents et
 * futurs ; le compilateur est le meilleur quantificateur.*
 *
 * `TRANSITIONS` est donc un `Record<Evenement, Record<EtatSession, Regle |
 * null>>` : **les dix événements × les neuf états, soit quatre-vingt-dix cases
 * écrites une par une.** Aucune n'est implicite.
 *
 *  - Ajouter un état à l'énumération Prisma casse la compilation en **dix**
 *    endroits, et le dixième est celui qu'on aurait oublié.
 *  - Ajouter un événement casse la compilation une fois, et force à répondre
 *    pour les neuf états.
 *  - `null` veut dire « invalide, et quelqu'un l'a écrit » : c'est la
 *    différence entre une case absente et une case refusée.
 *
 * Une table de cas autorisés aurait la forme `Partial<Record<…>>`, et un état
 * ajouté demain y serait silencieusement « aucun cas » — un refus qui a l'air
 * d'une décision et qui n'en est pas une.
 *
 * ---------------------------------------------------------------------------
 * CE QUE LA MACHINE NE DÉCIDE PAS
 * ---------------------------------------------------------------------------
 *  - **L'autorisation** de `ABANDON_PARENT` (cookie de portée `sortie_session`,
 *    PRD-13) : elle se joue dans la route, avant l'appel. La machine dit ce
 *    qu'une sortie parent produit, jamais qui a le droit de la demander.
 *  - **La garde de `CLOTURE_AUTOMATIQUE`** (`session.date` antérieure à la
 *    soirée courante, ARB-09) : elle est portée par `estSoireePerimee()` et
 *    n'est jamais évaluée côté client.
 *  - **Le seuil de `BLOCAGE`** (PED-08) : c'est un seuil de configuration
 *    (TEC-16), donc serveur, donc dans le service.
 *
 * Chacun de ces trois points est une garde **hors** de la fonction pure parce
 * qu'elle a besoin d'autre chose que l'état : une requête, une horloge, une
 * configuration. Les nommer ici est ce qui empêche de croire que la pureté de
 * ce fichier les couvre.
 */
import {
  etatDeMatiere,
  type Effet,
  type EtatSession,
  type Evenement,
  type PlanSession,
  type RegleId,
  type ResultatTransition,
  type Transition,
} from "@/lib/session/types";

/**
 * Une règle de la table 9.2 : elle reçoit l'état de départ — indispensable à
 * T11, qui ne change pas d'état — et le plan, et rend soit une transition,
 * soit un refus motivé.
 */
type Regle = (etat: EtatSession, plan: PlanSession) => ResultatTransition;

function transition(
  regle: RegleId,
  vers: EtatSession,
  etapeCourante: number | null,
  effets: readonly Effet[],
): ResultatTransition {
  return { ok: true, transition: { regle, vers, etapeCourante, effets } };
}

function refus(motif: string): ResultatTransition {
  return { ok: false, motif };
}

/**
 * L'étape désignée par `etapeCourante`, ou un refus motivé.
 * Un index hors du plan est une incohérence de données, jamais un cas nominal :
 * le `CHECK` de cohérence `session.etat` / `session.etape_courante` de
 * `supabase/policies.sql` l'interdit déjà en base.
 */
function etapeA(plan: PlanSession, index: number | null): { readonly ok: false; readonly motif: string } | { readonly ok: true; readonly index: number } {
  if (index === null) {
    return { ok: false, motif: "etape_courante est nulle alors que la transition en exige une." };
  }
  if (plan.etapes[index] === undefined) {
    return { ok: false, motif: `etape_courante = ${index} hors du programme (${plan.etapes.length} étapes).` };
  }
  return { ok: true, index };
}

// ---------------------------------------------------------------------------
// Les douze règles de la table 9.2
// ---------------------------------------------------------------------------

/** T1 — `DEMARRER` depuis `idle`. La session a été validée par le parent (TEC-06). */
const T1: Regle = () => transition("T1", "annonce", null, [{ type: "demarrer" }]);

/**
 * T2 et T3 — `PROGRAMME_VU` depuis `annonce`. Une seule règle, deux issues,
 * selon que la soirée porte des étapes ou non.
 *
 * T3 est la soirée `sansDevoir` : **aucune pierre, aucun rituel de clôture**
 * (P2 §9.2 et §9.5 propriété 2). Un enfant qui n'a pas de devoirs n'a pas
 * travaillé ; lui donner le forfait d'ARB-13 le donnerait par vacuité.
 */
const T2_T3: Regle = (_etat, plan) => {
  const premiere = plan.etapes[0];
  if (premiere === undefined) {
    return transition("T3", "termine", null, [{ type: "terminer" }]);
  }
  return transition("T2", etatDeMatiere(premiere.matiere), 0, []);
};

/**
 * T4 et T5 — `ETAPE_TERMINEE` depuis une étape.
 *
 * T5 est le premier des **trois créditeurs du bonus** (ARB-13) : le crédit de
 * l'étape est placé AVANT l'appel au bonus dans la liste d'effets, et c'est cet
 * ordre — interne à une transaction — qui rend vrai le prédicat fondé sur le
 * ledger (P2 §9.5, constat 26).
 */
const T4_T5: Regle = (etat, plan) => {
  const courante = etapeA(plan, plan.etapeCourante);
  if (!courante.ok) return refus(courante.motif);
  const etape = plan.etapes[courante.index];
  if (etape === undefined) return refus("étape introuvable.");
  if (etatDeMatiere(etape.matiere) !== etat) {
    return refus(
      `l'état ${etat} ne correspond pas à la matière programmée (${etape.matiere}) à l'index ${courante.index}.`,
    );
  }
  const crediter: Effet = { type: "crediter_etape", matiere: etape.matiere };
  const derniere = courante.index + 1 >= plan.etapes.length;
  if (!derniere) {
    return transition("T4", "transition", courante.index, [crediter]);
  }
  return transition("T5", "cloture", courante.index, [
    crediter,
    { type: "crediter_bonus_si_complete" },
  ]);
};

/** T6 — `TRANSITION_VUE` : on avance d'une étape, et l'ordre vient du programme. */
const T6: Regle = (_etat, plan) => {
  const courante = etapeA(plan, plan.etapeCourante);
  if (!courante.ok) return refus(courante.motif);
  const suivante = courante.index + 1;
  const etape = plan.etapes[suivante];
  if (etape === undefined) {
    return refus(`aucune étape à l'index ${suivante} : la transition n'a pas de suite.`);
  }
  return transition("T6", etatDeMatiere(etape.matiere), suivante, []);
};

/**
 * T7 — `PAUSE_DEMANDEE` (PRD-12).
 *
 * **Aucun effet de crédit, dans aucun sens.** La pause est accessible à
 * l'enfant lui-même, ne compte pas comme un abandon et ne retire aucune pierre.
 * Le seul effet est un fait qualitatif pour le résumé du parent (PRD-06).
 *
 * Aucune colonne `etat_avant_pause` : l'étape de retour se déduit de
 * `etapeCourante`, qui n'est pas modifié ici (P2 §9.1). T8 le prouve en
 * revenant exactement sur la matière de cette étape.
 */
const T7: Regle = (_etat, plan) => {
  const courante = etapeA(plan, plan.etapeCourante);
  if (!courante.ok) return refus(courante.motif);
  return transition("T7", "pause", courante.index, [{ type: "fait", fait: "pause" }]);
};

/** T8 — `PAUSE_TERMINEE` : retour sur l'étape d'où l'on venait, sans colonne dédiée. */
const T8: Regle = (_etat, plan) => {
  const courante = etapeA(plan, plan.etapeCourante);
  if (!courante.ok) return refus(courante.motif);
  const etape = plan.etapes[courante.index];
  if (etape === undefined) return refus("étape introuvable.");
  return transition("T8", etatDeMatiere(etape.matiere), courante.index, []);
};

/**
 * T9 — `CLOTURE_VUE` : la soirée se referme. **Aucun crédit ici**, et ce n'est
 * pas un oubli : T5 a déjà crédité l'étape et évalué le bonus dans la même
 * transaction, avant d'amener la session en `cloture`. Le test de la machine
 * quantifie cette affirmation sur toutes les entrées de `cloture`.
 */
const T9: Regle = (_etat, plan) => transition("T9", "termine", plan.etapeCourante, [
  { type: "terminer" },
]);

/**
 * T10 — `ABANDON_PARENT` (PRD-13), **deuxième créditeur du bonus**.
 *
 * Le parent peut arrêter une séance dont l'enfant a déjà tout fini : l'arrêt ne
 * doit rien lui retirer (ETH-04). Le rattrapage des étapes achevées précède
 * l'appel au bonus, comme en T5 et en T12.
 */
const T10: Regle = (_etat, plan) =>
  transition("T10", "abandon_parent", plan.etapeCourante, [
    { type: "rattraper_etapes_achevees" },
    { type: "crediter_bonus_si_complete" },
    { type: "arret_parent" },
    { type: "terminer" },
  ]);

/**
 * T11 — `BLOCAGE` (PED-08) : l'état **ne change pas**. Pilou propose une pause
 * ou de passer à autre chose, sans insister. Aucun compteur n'est montré à
 * l'enfant (PED-07) ; le fait sert le résumé du parent.
 */
const T11: Regle = (etat, plan) =>
  transition("T11", etat, plan.etapeCourante, [{ type: "fait", fait: "blocage" }]);

/**
 * T12 — `CLOTURE_AUTOMATIQUE` (ARB-09), **troisième créditeur du bonus**.
 *
 * Déclenchée par le serveur, jamais par le client, et seulement sur une session
 * dont la date est passée. C'est le chemin de fermeture **autonome** que V3
 * doit livrer : aucun élément de V7 n'est requis pour clore une session, et une
 * session orpheline de la veille ne bloque jamais la soirée.
 */
const T12: Regle = (_etat, plan) =>
  transition("T12", "termine", plan.etapeCourante, [
    { type: "rattraper_etapes_achevees" },
    { type: "crediter_bonus_si_complete" },
    { type: "terminer" },
  ]);

// ---------------------------------------------------------------------------
// LA TABLE — dix événements × neuf états, aucune case implicite
// ---------------------------------------------------------------------------

/**
 * `null` = paire (état, événement) **invalide** : la route renvoie
 * `409 TIPI_TRANSITION_INVALIDE` avec le snapshot courant, sans aucun effet de
 * bord (P2 §9.2).
 *
 * Depuis `termine` et `abandon_parent`, toute case est `null` : ce sont des
 * états finaux, et l'unique partiel de `policies.sql` libère alors le créneau.
 */
export const TRANSITIONS: Readonly<
  Record<Evenement, Readonly<Record<EtatSession, Regle | null>>>
> = Object.freeze({
  DEMARRER: {
    idle: T1,
    annonce: null,
    etape_lecture: null,
    transition: null,
    etape_maths: null,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  PROGRAMME_VU: {
    idle: null,
    annonce: T2_T3,
    etape_lecture: null,
    transition: null,
    etape_maths: null,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  ETAPE_TERMINEE: {
    idle: null,
    annonce: null,
    etape_lecture: T4_T5,
    transition: null,
    etape_maths: T4_T5,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  TRANSITION_VUE: {
    idle: null,
    annonce: null,
    etape_lecture: null,
    transition: T6,
    etape_maths: null,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  PAUSE_DEMANDEE: {
    idle: null,
    annonce: null,
    etape_lecture: T7,
    transition: null,
    etape_maths: T7,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  PAUSE_TERMINEE: {
    idle: null,
    annonce: null,
    etape_lecture: null,
    transition: null,
    etape_maths: null,
    cloture: null,
    termine: null,
    pause: T8,
    abandon_parent: null,
  },
  CLOTURE_VUE: {
    idle: null,
    annonce: null,
    etape_lecture: null,
    transition: null,
    etape_maths: null,
    cloture: T9,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  ABANDON_PARENT: {
    idle: null,
    annonce: T10,
    etape_lecture: T10,
    transition: T10,
    etape_maths: T10,
    cloture: null,
    termine: null,
    pause: T10,
    abandon_parent: null,
  },
  BLOCAGE: {
    idle: null,
    annonce: null,
    etape_lecture: T11,
    transition: null,
    etape_maths: T11,
    cloture: null,
    termine: null,
    pause: null,
    abandon_parent: null,
  },
  CLOTURE_AUTOMATIQUE: {
    idle: T12,
    annonce: T12,
    etape_lecture: T12,
    transition: T12,
    etape_maths: T12,
    cloture: T12,
    termine: null,
    pause: T12,
    abandon_parent: null,
  },
});

/**
 * Applique un événement. **Fonction pure**, sans aucun effet.
 *
 * Toute paire absente de la table est invalide et rend un refus motivé : le
 * service en fait un `409` avec le snapshot courant, pour que le client se
 * recale sans rien perdre.
 */
export function appliquer(
  etat: EtatSession,
  evenement: Evenement,
  plan: PlanSession,
): ResultatTransition {
  const regle = TRANSITIONS[evenement][etat];
  if (regle === null) {
    return refus(`transition invalide : ${evenement} depuis ${etat}.`);
  }
  return regle(etat, plan);
}

/** Vrai si la transition porte l'effet demandé. Sert aux tests et au service. */
export function porte(t: Transition, type: Effet["type"]): boolean {
  return t.effets.some((e) => e.type === type);
}
