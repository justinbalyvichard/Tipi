import { describe, expect, it } from "vitest";

import { TRANSITIONS, appliquer, porte } from "@/lib/session/machine";
import {
  ETATS,
  ETATS_FINAUX,
  EVENEMENTS,
  estEtatFinal,
  etatDeMatiere,
  type Effet,
  type EtatSession,
  type Evenement,
  type PlanSession,
  type RegleId,
  type Transition,
} from "@/lib/session/types";
import type { EtapePrevue } from "@/lib/validation/json";

/**
 * TEC-10 — LA MACHINE, PARCOURUE SUR TOUTES SES CASES.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE FICHIER CONTRÔLE, ET COMMENT
 * ---------------------------------------------------------------------------
 * Les contrôles ne portent pas sur « la ligne T5 fait bien ceci » : ce serait
 * relire la table à côté de la table. Ils portent sur des **propriétés
 * quantifiées** sur le produit cartésien complet — neuf états × dix événements
 * × quinze plans de soirée, soit 1 350 appels — et sur l'ensemble des règles
 * *dérivé* de la table, jamais recopié.
 *
 * La propriété centrale est celle d'ARB-13 : **le bonus est crédité par toute
 * transition menant à une soirée complète, jamais par une seule.** Elle est
 * affirmée ici sans que le test sache lesquelles : il les CALCULE, et compare
 * l'ensemble obtenu à un ensemble déclaré avec sa justification. Une treizième
 * transition qui mènerait demain à un état final sans créditer ferait rougir ce
 * fichier sans qu'on y touche.
 */

// ---------------------------------------------------------------------------
// Le domaine de quantification
// ---------------------------------------------------------------------------

function etape(matiere: EtapePrevue["matiere"], ordre: number): EtapePrevue {
  return {
    matiere,
    ordre,
    dureeEstimeeMin: 10,
    exerciseIds: [`00000000-0000-4000-8000-00000000000${ordre}`],
  };
}

/** Les programmes atteignables : `sansDevoir`, les deux Soirs légers, C1 et C2. */
const PROGRAMMES: readonly { readonly nom: string; readonly etapes: readonly EtapePrevue[] }[] = [
  { nom: "sansDevoir", etapes: [] },
  { nom: "une étape lecture (C3/C5)", etapes: [etape("lecture", 0)] },
  { nom: "une étape maths (C4/C6)", etapes: [etape("maths", 0)] },
  { nom: "lecture puis maths (C1)", etapes: [etape("lecture", 0), etape("maths", 1)] },
  { nom: "maths puis lecture (C2)", etapes: [etape("maths", 0), etape("lecture", 1)] },
];

const INDEX: readonly (number | null)[] = [null, 0, 1];

const PLANS: readonly { readonly nom: string; readonly plan: PlanSession }[] = PROGRAMMES.flatMap(
  (p) =>
    INDEX.map((etapeCourante) => ({
      nom: `${p.nom} · etapeCourante=${String(etapeCourante)}`,
      plan: { etapes: p.etapes, etapeCourante },
    })),
);

/** Tous les triplets, et le résultat que la machine en fait. */
function tousLesAppels(): readonly {
  readonly etat: EtatSession;
  readonly evenement: Evenement;
  readonly plan: PlanSession;
  readonly nomPlan: string;
  readonly transition: Transition | null;
}[] {
  const appels: {
    etat: EtatSession;
    evenement: Evenement;
    plan: PlanSession;
    nomPlan: string;
    transition: Transition | null;
  }[] = [];
  for (const etat of ETATS) {
    for (const evenement of EVENEMENTS) {
      for (const { nom, plan } of PLANS) {
        const resultat = appliquer(etat, evenement, plan);
        appels.push({
          etat,
          evenement,
          plan,
          nomPlan: nom,
          transition: resultat.ok ? resultat.transition : null,
        });
      }
    }
  }
  return appels;
}

const APPELS = tousLesAppels();

// ---------------------------------------------------------------------------
// 1. La table est TOTALE, et elle n'est pas neutralisée
// ---------------------------------------------------------------------------

describe("TEC-10 §1 — la table couvre les 90 cases, et elle mord", () => {
  it("les dix événements × les neuf états sont tous écrits", () => {
    // La garantie est de compilation ; ce test fixe la propriété observable,
    // et surtout il vérifie que les listes dérivées n'ont pas rétréci.
    expect(ETATS).toHaveLength(9);
    expect(EVENEMENTS).toHaveLength(10);
    for (const evenement of EVENEMENTS) {
      const colonne = TRANSITIONS[evenement];
      for (const etat of ETATS) {
        expect(Object.prototype.hasOwnProperty.call(colonne, etat), `${evenement}/${etat}`).toBe(
          true,
        );
      }
    }
  });

  it("LA TABLE N'EST PAS VIDE — une table toute à `null` refuserait tout en silence", () => {
    // Leçon 4 : la doctrine s'applique à l'instrument comme au produit. Ici,
    // l'instrument est la table elle-même : neutralisée, elle ne laisserait
    // plus aucune soirée se dérouler, et aucun test de cas nominal isolé ne
    // saurait dire que c'est LA TABLE qui a été vidée.
    const peuplees = EVENEMENTS.flatMap((e) => ETATS.map((s) => TRANSITIONS[e][s])).filter(
      (r) => r !== null,
    );
    expect(peuplees.length).toBeGreaterThan(0);
    // 23 cases peuplées sur 90, comptées une par une :
    // T1 1 · T2_T3 1 · T4_T5 2 · T6 1 · T7 2 · T8 1 · T9 1 · T10 5 · T11 2 · T12 7.
    expect(peuplees).toHaveLength(23);
  });

  it("aucune transition n'est possible depuis un état final", () => {
    for (const etat of ETATS_FINAUX) {
      for (const evenement of EVENEMENTS) {
        expect(TRANSITIONS[evenement][etat], `${evenement} depuis ${etat}`).toBeNull();
      }
    }
  });

  it("les douze règles de la table 9.2 sont toutes atteignables", () => {
    const vues = new Set(APPELS.map((a) => a.transition?.regle).filter((r) => r !== undefined));
    const attendues: readonly RegleId[] = [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ];
    expect([...vues].sort()).toEqual([...attendues].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. ARB-13 — LE BONUS A TROIS CRÉDITEURS, ET LE TEST LES CALCULE
// ---------------------------------------------------------------------------

/**
 * Les transitions qui mènent hors du travail — `cloture` ou un état final —
 * et qui ne créditent PAS le bonus, avec la phrase qui les dispense
 * (ARB-18 mesure 2). Toute autre est un défaut : c'est le constat 26.
 */
const DISPENSEES_DE_BONUS: Readonly<Record<string, string>> = Object.freeze({
  T3: "Soirée `sansDevoir` : aucune étape programmée, donc rien n'a été fait. Créditer ici donnerait le forfait par vacuité — propriété 2 du barème, et le rituel de clôture ne se joue pas non plus.",
  T9: "`CLOTURE_VUE` part de `cloture`, état où T5 a DÉJÀ crédité l'étape et évalué le bonus dans la même transaction. Un second appel ne serait pas faux — l'unique le rend inopérant — mais il masquerait le fait que le seul chemin vers `cloture` est T5, ce que le test ci-dessous vérifie.",
});

describe("ARB-13 §2 — le bonus, quantifié sur les 1 350 appels", () => {
  it("TOUTE transition menant à la fin du travail crédite le bonus, ou est dispensée par écrit", () => {
    const manquantes = new Map<RegleId, string>();
    for (const appel of APPELS) {
      const t = appel.transition;
      if (t === null) continue;
      const menantALaFin = t.vers === "cloture" || estEtatFinal(t.vers);
      if (!menantALaFin) continue;
      if (porte(t, "crediter_bonus_si_complete")) continue;
      if (Object.prototype.hasOwnProperty.call(DISPENSEES_DE_BONUS, t.regle)) continue;
      manquantes.set(t.regle, `${appel.etat} + ${appel.evenement} → ${t.vers} (${appel.nomPlan})`);
    }
    expect(
      [...manquantes.entries()].map(([r, ou]) => `${r} : ${ou}`),
      "transitions terminales sans bonus et sans dispense écrite",
    ).toEqual([]);
  });

  it("les créditeurs du bonus sont EXACTEMENT T5, T10 et T12 — calculés, pas recopiés", () => {
    const crediteurs = new Set<RegleId>();
    for (const appel of APPELS) {
      if (appel.transition !== null && porte(appel.transition, "crediter_bonus_si_complete")) {
        crediteurs.add(appel.transition.regle);
      }
    }
    // « jamais par une seule » : le tour 2 de l'architecture ne créditait qu'en
    // T5, et l'enfant dont la tablette s'éteignait avant le dernier appui
    // perdait le bonus définitivement.
    expect([...crediteurs].sort()).toEqual(["T10", "T12", "T5"]);
  });

  it("chaque dispense porte sa justification écrite (ARB-18 mesure 2)", () => {
    for (const [regle, motif] of Object.entries(DISPENSEES_DE_BONUS)) {
      expect(motif.trim().length, regle).toBeGreaterThanOrEqual(40);
    }
    expect(Object.keys(DISPENSEES_DE_BONUS).length).toBeGreaterThan(0);
  });

  it("le SEUL chemin vers `cloture` est T5, qui crédite — c'est ce qui dispense T9", () => {
    const versCloture = new Set<RegleId>();
    for (const appel of APPELS) {
      if (appel.transition?.vers === "cloture") versCloture.add(appel.transition.regle);
    }
    expect([...versCloture]).toEqual(["T5"]);
  });

  it("L'ORDRE est tenu : le bonus vient toujours APRÈS les crédits d'étape", () => {
    // C'est cet ordre — interne à une transaction — qui rend vrai le prédicat
    // fondé sur le ledger. Inversé, T5 refuserait le bonus sur le chemin
    // nominal : l'étape ne serait pas encore au ledger au moment du décompte.
    for (const appel of APPELS) {
      const t = appel.transition;
      if (t === null) continue;
      const rangBonus = t.effets.findIndex((e) => e.type === "crediter_bonus_si_complete");
      if (rangBonus < 0) continue;
      const credits: Effet["type"][] = ["crediter_etape", "rattraper_etapes_achevees"];
      for (const [rang, effet] of t.effets.entries()) {
        if (credits.includes(effet.type)) {
          expect(rang, `${t.regle} : ${effet.type} après le bonus`).toBeLessThan(rangBonus);
        }
      }
    }
  });

  it("une soirée sans étape ne crédite RIEN, sur aucun chemin", () => {
    for (const appel of APPELS) {
      if (appel.plan.etapes.length > 0) continue;
      const t = appel.transition;
      if (t === null) continue;
      expect(porte(t, "crediter_etape"), `${t.regle} crédite une étape sans programme`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. PRD-12 — LA PAUSE NE RETIRE RIEN, ET N'A BESOIN D'AUCUNE COLONNE
// ---------------------------------------------------------------------------

describe("PRD-12 §3 — la pause, sur toutes ses entrées", () => {
  it("`PAUSE_DEMANDEE` n'a AUCUN effet de crédit, dans aucun sens", () => {
    let vues = 0;
    for (const appel of APPELS) {
      if (appel.evenement !== "PAUSE_DEMANDEE") continue;
      const t = appel.transition;
      if (t === null) continue;
      vues += 1;
      expect(t.effets.map((e) => e.type)).toEqual(["fait"]);
      expect(t.vers).toBe("pause");
    }
    // Sans ce compte, le test serait vrai par vacuité si la pause disparaissait.
    expect(vues).toBeGreaterThan(0);
  });

  it("la pause n'est atteignable QUE depuis les deux états d'étape", () => {
    const depuis = ETATS.filter((e) => TRANSITIONS.PAUSE_DEMANDEE[e] !== null);
    expect(depuis.sort()).toEqual(["etape_lecture", "etape_maths"]);
  });

  it("ALLER-RETOUR : on revient sur la MÊME étape, sans colonne `etat_avant_pause`", () => {
    // La démonstration que la colonne est inutile : l'étape de retour se déduit
    // de `etapeCourante`, qui n'est pas modifié par T7. On le vérifie sur les
    // quatre programmes non vides, aux deux positions possibles.
    let cas = 0;
    for (const { etapes } of PROGRAMMES) {
      for (const [index, etapeCourante] of etapes.entries()) {
        const plan: PlanSession = { etapes, etapeCourante: index };
        const depart = etatDeMatiere(etapeCourante.matiere);

        const aller = appliquer(depart, "PAUSE_DEMANDEE", plan);
        expect(aller.ok).toBe(true);
        if (!aller.ok) continue;
        expect(aller.transition.etapeCourante).toBe(index);

        const retour = appliquer(
          aller.transition.vers,
          "PAUSE_TERMINEE",
          { etapes, etapeCourante: aller.transition.etapeCourante },
        );
        expect(retour.ok).toBe(true);
        if (!retour.ok) continue;
        expect(retour.transition.vers, `${plan.etapes.length} étapes, index ${index}`).toBe(depart);
        expect(retour.transition.etapeCourante).toBe(index);
        cas += 1;
      }
    }
    expect(cas).toBe(6);
  });

  it("la pause depuis une étape hors programme est REFUSÉE, pas approximée", () => {
    const plan: PlanSession = { etapes: [etape("lecture", 0)], etapeCourante: 7 };
    expect(appliquer("etape_lecture", "PAUSE_DEMANDEE", plan).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Les soirées nominales, de bout en bout
// ---------------------------------------------------------------------------

/** Déroule une suite d'événements et rend les règles franchies. */
function derouler(
  etapes: readonly EtapePrevue[],
  evenements: readonly Evenement[],
): { readonly regles: readonly RegleId[]; readonly etat: EtatSession; readonly credits: number } {
  let etat: EtatSession = "idle";
  let etapeCourante: number | null = null;
  const regles: RegleId[] = [];
  let credits = 0;
  for (const evenement of evenements) {
    const resultat = appliquer(etat, evenement, { etapes, etapeCourante });
    if (!resultat.ok) throw new Error(`${evenement} refusé depuis ${etat} : ${resultat.motif}`);
    regles.push(resultat.transition.regle);
    credits += resultat.transition.effets.filter(
      (e) => e.type === "crediter_etape" || e.type === "crediter_bonus_si_complete",
    ).length;
    etat = resultat.transition.vers;
    etapeCourante = resultat.transition.etapeCourante;
  }
  return { regles, etat, credits };
}

describe("TEC-10 §4 — les soirées nominales", () => {
  it("C1 : lecture puis maths, jusqu'à `termine`", () => {
    const suivi = derouler(
      [etape("lecture", 0), etape("maths", 1)],
      [
        "DEMARRER",
        "PROGRAMME_VU",
        "ETAPE_TERMINEE",
        "TRANSITION_VUE",
        "ETAPE_TERMINEE",
        "CLOTURE_VUE",
      ],
    );
    expect(suivi.regles).toEqual(["T1", "T2", "T4", "T6", "T5", "T9"]);
    expect(suivi.etat).toBe("termine");
    // Deux crédits d'étape + un bonus : les trois pierres d'ARB-13.
    expect(suivi.credits).toBe(3);
  });

  it("C2 : maths puis lecture — l'ordre vient du programme, pas du code", () => {
    const suivi = derouler(
      [etape("maths", 0), etape("lecture", 1)],
      ["DEMARRER", "PROGRAMME_VU", "ETAPE_TERMINEE", "TRANSITION_VUE", "ETAPE_TERMINEE"],
    );
    expect(suivi.regles).toEqual(["T1", "T2", "T4", "T6", "T5"]);
    expect(suivi.etat).toBe("cloture");
  });

  it("Soir léger : une seule étape, et T5 d'emblée", () => {
    const suivi = derouler(
      [etape("maths", 0)],
      ["DEMARRER", "PROGRAMME_VU", "ETAPE_TERMINEE", "CLOTURE_VUE"],
    );
    expect(suivi.regles).toEqual(["T1", "T2", "T5", "T9"]);
    // Un crédit d'étape + un bonus. Le montant, lui, est du ressort du barème.
    expect(suivi.credits).toBe(2);
  });

  it("ARB-08 : une soirée sans devoirs va droit à `termine`, sans rituel ni pierre", () => {
    const suivi = derouler([], ["DEMARRER", "PROGRAMME_VU"]);
    expect(suivi.regles).toEqual(["T1", "T3"]);
    expect(suivi.etat).toBe("termine");
    expect(suivi.credits).toBe(0);
  });

  it("une soirée interrompue puis reprise passe par les mêmes règles (PRD-18)", () => {
    // La reprise n'est pas un chemin de la machine : c'est la même suite
    // d'événements, reprise là où elle s'était arrêtée. Rien à prévoir ici,
    // et c'est exactement ce qu'on veut vérifier.
    const etapes = [etape("lecture", 0), etape("maths", 1)];
    const avant = derouler(etapes, ["DEMARRER", "PROGRAMME_VU", "ETAPE_TERMINEE"]);
    expect(avant.etat).toBe("transition");
    const apres = appliquer("transition", "TRANSITION_VUE", { etapes, etapeCourante: 0 });
    expect(apres.ok && apres.transition.vers).toBe("etape_maths");
  });
});

// ---------------------------------------------------------------------------
// 5. Les gardes et les refus
// ---------------------------------------------------------------------------

describe("TEC-10 §5 — ce que la machine refuse", () => {
  it("toute paire absente de la table est refusée, avec un motif", () => {
    let refuses = 0;
    for (const appel of APPELS) {
      if (TRANSITIONS[appel.evenement][appel.etat] !== null) continue;
      const resultat = appliquer(appel.etat, appel.evenement, appel.plan);
      expect(resultat.ok).toBe(false);
      if (!resultat.ok) expect(resultat.motif.length).toBeGreaterThan(0);
      refuses += 1;
    }
    expect(refuses).toBeGreaterThan(0);
  });

  it("une étape terminée dont la matière ne correspond pas à l'état est REFUSÉE", () => {
    // La cohérence `session.etat` / `session.etape_courante` est aussi un CHECK
    // en base. La machine ne s'y fie pas : elle la revérifie, parce qu'une
    // incohérence créditerait la mauvaise matière, donc la mauvaise raison,
    // donc fausserait le prédicat du bonus.
    const plan: PlanSession = { etapes: [etape("lecture", 0)], etapeCourante: 0 };
    expect(appliquer("etape_maths", "ETAPE_TERMINEE", plan).ok).toBe(false);
    expect(appliquer("etape_lecture", "ETAPE_TERMINEE", plan).ok).toBe(true);
  });

  it("`TRANSITION_VUE` sans étape suivante est REFUSÉE", () => {
    const plan: PlanSession = { etapes: [etape("lecture", 0)], etapeCourante: 0 };
    expect(appliquer("transition", "TRANSITION_VUE", plan).ok).toBe(false);
  });

  it("`CLOTURE_AUTOMATIQUE` est possible depuis tout état NON final, et seulement là", () => {
    const depuis = ETATS.filter((e) => TRANSITIONS.CLOTURE_AUTOMATIQUE[e] !== null);
    expect(depuis.sort()).toEqual(ETATS.filter((e) => !estEtatFinal(e)).sort());
  });

  it("`BLOCAGE` ne change pas d'état — Pilou propose, l'enfant décide (PED-08)", () => {
    for (const etat of ["etape_lecture", "etape_maths"] satisfies readonly EtatSession[]) {
      const resultat = appliquer(etat, "BLOCAGE", {
        etapes: [etape("lecture", 0), etape("maths", 1)],
        etapeCourante: etat === "etape_lecture" ? 0 : 1,
      });
      expect(resultat.ok).toBe(true);
      if (resultat.ok) {
        expect(resultat.transition.vers).toBe(etat);
        expect(resultat.transition.effets).toEqual([{ type: "fait", fait: "blocage" }]);
      }
    }
  });

  it("la machine est PURE : deux appels identiques rendent la même chose", () => {
    const plan: PlanSession = { etapes: [etape("lecture", 0), etape("maths", 1)], etapeCourante: 0 };
    expect(appliquer("etape_lecture", "ETAPE_TERMINEE", plan)).toEqual(
      appliquer("etape_lecture", "ETAPE_TERMINEE", plan),
    );
  });
});
