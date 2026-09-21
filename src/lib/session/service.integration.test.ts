import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  assurerBaseDeTest,
  idEvenement,
  nettoyerFoyer,
  nouveauFoyer,
  type FoyerDeTest,
} from "@/lib/session/integration-support";
import { cloreSessionsPerimees } from "@/lib/session/cloture-automatique";
import { appliquerEvenement, colonneDateSoiree, creerSession } from "@/lib/session/service";
import { enregistrerTentative } from "@/lib/session/tentatives";
import type { EtatSession } from "@/lib/session/types";

/**
 * Les imports statiques ci-dessus ne déclenchent AUCUNE lecture de
 * l'environnement : `src/lib/db/prisma.ts` résout `env()` paresseusement, à la
 * première utilisation réelle du client — jamais à l'import (voir son propre
 * en-tête, « la connexion est DIFFÉRÉE, pas supprimée »). `assurerBaseDeTest()`,
 * appelée dans `beforeAll` ci-dessous, pose `DATABASE_URL` et les cinq autres
 * variables critiques AVANT le premier appel réel — c'est-à-dire avant le
 * premier `it`, jamais avant.
 */

/**
 * `service.ts` — **appliquerEvenement() contre un vrai PostgreSQL**
 * (P4/V3.review.md, tour 1, [MAJEUR] 1).
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE FICHIER RÉPARE
 * ---------------------------------------------------------------------------
 * `machine.test.ts` prouve ce que la machine **décide** — 1 350 appels d'une
 * fonction pure, sans base. Il ne prouve rien de ce que `service.ts` **écrit**.
 * Le contrôleur l'a démontré en rendant `executerEffet()` muet sur le cas
 * `crediter_bonus_si_complete` : 244 tests verts, `verifier:confinement` vert,
 * `pnpm build` vert, et l'enfant ne recevait plus jamais le bonus.
 *
 * Chaque test ci-dessous appelle **la vraie fonction exportée**,
 * `appliquerEvenement()`, contre une base PostgreSQL réelle, migrée et
 * contrainte comme en production (voir `integration-support.ts`), puis relit
 * `gem_ledger` et `child.gem_balance` **directement en base** — jamais depuis
 * la valeur que la fonction rend elle-même, pour ne pas se contenter de croire
 * ce qu'elle prétend avoir fait.
 *
 * C'est l'automatisation exacte de ce que `pnpm epreuve:session` fait à la
 * main : les mêmes chemins (T5 deux étapes, T5 Soir léger, le cas du constat
 * 26, T10, T12, l'idempotence, PRD-12), mais dans `pnpm test -- --run`.
 */

const TIMEOUT_DB_MS = 20_000;

describe("service.ts — écritures réelles en base (MAJEUR 1)", () => {
  const foyers: FoyerDeTest[] = [];

  beforeAll(async () => {
    await assurerBaseDeTest();
  }, TIMEOUT_DB_MS);

  afterAll(async () => {
    for (const foyer of foyers) await nettoyerFoyer(prisma, foyer.familyId);
    await prisma.$disconnect();
  });

  async function foyer(suffixe: string): Promise<FoyerDeTest> {
    const f = await nouveauFoyer(prisma, suffixe);
    foyers.push(f);
    return f;
  }

  /** Somme de `gem_ledger` pour une session, lue directement en base. */
  async function pierresEnBase(sessionId: string): Promise<number> {
    const somme = await prisma.gemLedger.aggregate({
      where: { sessionId },
      _sum: { delta: true },
    });
    return somme._sum.delta ?? 0;
  }

  async function raisonsEnBase(sessionId: string): Promise<readonly string[]> {
    const lignes = await prisma.gemLedger.findMany({
      where: { sessionId },
      select: { raison: true },
      orderBy: { createdAt: "asc" },
    });
    return lignes.map((l) => l.raison);
  }

  it(
    "T5 — deux étapes, tout terminé : le bonus EST écrit en base, pas seulement rendu",
    async () => {
      const f = await foyer("t5-deux-etapes");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });

      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
      const dernier = await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });

      expect(dernier.ok).toBe(true);
      if (!dernier.ok) return;
      // La valeur RENDUE par la fonction…
      expect(dernier.pierresCreditees).toBe(2); // +1 étape, +1 bonus, sur CET appel
      expect(dernier.session.etat).toBe("cloture");

      // … et ce qui est RÉELLEMENT en base, lu par une requête séparée.
      expect(await pierresEnBase(session.id)).toBe(3);
      expect(await raisonsEnBase(session.id)).toEqual([
        "etape_lecture_terminee",
        "etape_maths_terminee",
        "bonus_soiree_complete",
      ]);
      const enfant = await prisma.child.findUniqueOrThrow({ where: { id: f.childId } });
      expect(enfant.gemBalance).toBe(3);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "T5 — Soir léger, une seule étape : bonus de 2 réellement écrit, total 3",
    async () => {
      const f = await foyer("t5-soir-leger");
      const session = await creerSession(f.childId, {
        etapes: [{ matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 }],
        soirLeger: true,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });

      expect(await pierresEnBase(session.id)).toBe(3);
      const ledger = await prisma.gemLedger.findMany({ where: { sessionId: session.id } });
      const bonus = ledger.find((l) => l.raison === "bonus_soiree_complete");
      expect(bonus?.delta).toBe(2); // ARB-13 : 3 − 1 étape
    },
    TIMEOUT_DB_MS,
  );

  it(
    "le bonus vient du LEDGER, jamais des `attempt` — constat 26, automatisé",
    async () => {
      const f = await foyer("constat-26");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.lecture, statut: "terminee" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
      // La tentative de maths reste `en_cours` : la route `tentative` n'a
      // jamais été rejouée pour cet exercice. Le bonus ne doit pas en dépendre.
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.maths, statut: "en_cours" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });

      expect(await pierresEnBase(session.id)).toBe(3);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "T10 — abandon parent : rattrapage PUIS bonus, réellement écrits",
    async () => {
      const f = await foyer("t10-abandon");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      // L'enfant a tout fini, mais aucun ETAPE_TERMINEE n'a jamais été envoyé :
      // seules les lignes `attempt` en attestent. C'est le cas que ARB-13
      // nomme : « le parent peut arrêter une séance dont l'enfant a déjà tout
      // fini — l'arrêt ne doit rien lui retirer. »
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.lecture, statut: "terminee" });
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.maths, statut: "terminee" });

      // PROGRAMME_VU (T2) amène déjà la session sur la première étape
      // programmée — ici `etape_lecture`, puisque « lecture » est en tête.
      const resultat = await appliquerEvenement({
        sessionId: session.id,
        evenementId: idEvenement(),
        evenement: "ABANDON_PARENT",
        etatAttendu: "etape_lecture",
      });
      expect(resultat.ok).toBe(true);
      if (!resultat.ok) return;
      expect(resultat.session.etat).toBe("abandon_parent" satisfies EtatSession);
      expect(resultat.session.arretParent).toBe(true);
      expect(await pierresEnBase(session.id)).toBe(3);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "T12 — clôture automatique : rattrapage PUIS bonus, réellement écrits",
    async () => {
      const f = await foyer("t12-cloture-auto");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.lecture, statut: "terminee" });
      await enregistrerTentative({ sessionId: session.id, exerciseId: f.maths, statut: "terminee" });

      const hier = new Date(Date.now() - 36 * 60 * 60 * 1000);
      await prisma.session.update({ where: { id: session.id }, data: { date: colonneDateSoiree(hier) } });

      const avant = await pierresEnBase(session.id);
      const closes = await cloreSessionsPerimees(f.childId);
      const apres = await pierresEnBase(session.id);
      const relue = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });

      expect(avant).toBe(1); // seule l'étape lecture était créditée avant la coupure
      expect(closes.map((c) => c.sessionId)).toContain(session.id);
      expect(apres).toBe(3);
      expect(relue.etat).toBe("termine" satisfies EtatSession);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "idempotence — rejouer le même evenementId ne crédite pas deux fois, en base",
    async () => {
      const f = await foyer("idempotence");
      const session = await creerSession(f.childId, {
        etapes: [{ matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 }],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });

      const rejoue = idEvenement();
      const premier = await appliquerEvenement({ sessionId: session.id, evenementId: rejoue, evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });
      const second = await appliquerEvenement({ sessionId: session.id, evenementId: rejoue, evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });

      expect(premier.ok && premier.pierresCreditees).toBe(3);
      expect(second.ok && second.pierresCreditees).toBe(0);
      // Une seule ligne par raison, pas deux : c'est la lecture en base qui
      // le prouve, pas la valeur rendue par le second appel.
      expect(await prisma.gemLedger.count({ where: { sessionId: session.id } })).toBe(2);
      expect(await pierresEnBase(session.id)).toBe(3);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "PRD-12 — pause : aucune ligne de gem_ledger, retour sur la même étape en base",
    async () => {
      const f = await foyer("pause");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });

      const avant = await pierresEnBase(session.id);
      const enPause = await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PAUSE_DEMANDEE", etatAttendu: "etape_maths" });
      const pendant = await pierresEnBase(session.id);
      const retour = await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PAUSE_TERMINEE", etatAttendu: "pause" });
      const apres = await pierresEnBase(session.id);

      expect(avant).toBe(pendant);
      expect(pendant).toBe(apres);
      expect(enPause.ok && enPause.session.etat).toBe("pause" satisfies EtatSession);
      expect(retour.ok && retour.session.etat).toBe("etape_maths" satisfies EtatSession);
      expect(retour.ok && retour.session.etapeCourante).toBe(1);
      // Aucune LIGNE SUPPLÉMENTAIRE n'apparaît pour la pause : seule reste la
      // ligne de l'étape lecture, déjà créditée avant la pause. La pause elle-
      // même n'existe QUE dans le journal de la session (résumé parent,
      // PRD-06), jamais dans le ledger.
      expect(await prisma.gemLedger.count({ where: { sessionId: session.id } })).toBe(1);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "SEC-06 — gem_balance recalculé == SUM(gem_ledger.delta) après une séquence complète",
    async () => {
      const f = await foyer("sec-06");
      const session = await creerSession(f.childId, {
        etapes: [
          { matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 },
          { matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 },
        ],
        soirLeger: false,
      });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_lecture" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "TRANSITION_VUE", etatAttendu: "transition" });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "ETAPE_TERMINEE", etatAttendu: "etape_maths" });

      const enfant = await prisma.child.findUniqueOrThrow({ where: { id: f.childId } });
      const somme = await prisma.gemLedger.aggregate({
        where: { childId: f.childId },
        _sum: { delta: true },
      });
      expect(enfant.gemBalance).toBe(somme._sum.delta ?? -1);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "ARB-08 — sansDevoir : aucune ligne de gem_ledger écrite, en base",
    async () => {
      const f = await foyer("sans-devoir");
      const session = await creerSession(f.childId, { etapes: [], soirLeger: false, sansDevoir: true });
      await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "DEMARRER", etatAttendu: "idle" });
      const fin = await appliquerEvenement({ sessionId: session.id, evenementId: idEvenement(), evenement: "PROGRAMME_VU", etatAttendu: "annonce" });

      expect(fin.ok && fin.session.etat).toBe("termine" satisfies EtatSession);
      expect(await prisma.gemLedger.count({ where: { sessionId: session.id } })).toBe(0);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "TEC-06 — TIPI_SESSION_DEJA_ACTIVE, levé par creerSession() contre la vraie contrainte",
    async () => {
      const f = await foyer("session-active");
      await creerSession(f.childId, {
        etapes: [{ matiere: "maths", exerciseIds: [f.maths], dureeEstimeeMin: 5 }],
        soirLeger: false,
      });
      await expect(
        creerSession(f.childId, {
          etapes: [{ matiere: "lecture", exerciseIds: [f.lecture], dureeEstimeeMin: 5 }],
          soirLeger: false,
        }),
      ).rejects.toMatchObject({ code: "TIPI_SESSION_DEJA_ACTIVE" });
    },
    TIMEOUT_DB_MS,
  );
});
