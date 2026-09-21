import type { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  crediter,
  crediterBonusSiSoireeComplete,
  crediterEtape,
  etapesCreditees,
  pierresDeLaSession,
} from "@/lib/pierres/service";
import {
  assurerBaseDeTest,
  nettoyerFoyer,
  nouveauFoyer,
  type FoyerDeTest,
} from "@/lib/session/integration-support";

/**
 * `pierres/service.ts` — **le seul écrivain de `gem_ledger` et de
 * `child.gem_balance`, exercé contre un vrai PostgreSQL** (P4/V3.review.md,
 * tour 1, [MAJEUR] 1).
 *
 * `service.integration.test.ts` prouve le branchement complet, au travers de
 * `appliquerEvenement()`. Ce fichier-ci prouve les fonctions de CE module,
 * directement, sans passer par la machine — c'est ce qui manquait
 * spécifiquement à `src/lib/pierres/service.ts`, cité nommément par le
 * contrôleur comme non couvert.
 */

const TIMEOUT_DB_MS = 20_000;

describe("pierres/service.ts — écritures réelles en base (MAJEUR 1)", () => {
  const foyers: FoyerDeTest[] = [];

  beforeAll(async () => {
    await assurerBaseDeTest();
  }, TIMEOUT_DB_MS);

  afterAll(async () => {
    for (const foyer of foyers) await nettoyerFoyer(prisma, foyer.familyId);
    await prisma.$disconnect();
  });

  /** Un foyer, et une session `idle` vide directement écrite (sans passer par `creerSession`). */
  async function foyerAvecSession(
    suffixe: string,
    etapesPrevues: (f: FoyerDeTest) => Prisma.InputJsonValue = () => [],
  ): Promise<{ readonly f: FoyerDeTest; readonly sessionId: string }> {
    const f = await nouveauFoyer(prisma, suffixe);
    foyers.push(f);
    const session = await prisma.session.create({
      data: {
        childId: f.childId,
        date: new Date(),
        etat: "idle",
        etapesPrevues: etapesPrevues(f),
      },
    });
    return { f, sessionId: session.id };
  }

  it(
    "crediter() écrit une ligne réelle et recalcule gem_balance DEPUIS le ledger",
    async () => {
      const { f, sessionId } = await foyerAvecSession("crediter-simple");

      const rendu = await prisma.$transaction((tx) =>
        crediter(tx, { sessionId, childId: f.childId }, "etape_lecture_terminee", 1),
      );
      expect(rendu).toBe(1);

      const ligne = await prisma.gemLedger.findUniqueOrThrow({
        where: { sessionId_raison: { sessionId, raison: "etape_lecture_terminee" } },
      });
      expect(ligne.delta).toBe(1);
      expect(ligne.childId).toBe(f.childId);

      const enfant = await prisma.child.findUniqueOrThrow({ where: { id: f.childId } });
      expect(enfant.gemBalance).toBe(1);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediter() est idempotent sur (sessionId, raison) : la seconde tentative rend 0 et n'écrit rien",
    async () => {
      const { f, sessionId } = await foyerAvecSession("crediter-idempotent");

      const premier = await prisma.$transaction((tx) =>
        crediter(tx, { sessionId, childId: f.childId }, "etape_maths_terminee", 1),
      );
      const second = await prisma.$transaction((tx) =>
        crediter(tx, { sessionId, childId: f.childId }, "etape_maths_terminee", 1),
      );

      expect(premier).toBe(1);
      expect(second).toBe(0);
      expect(await prisma.gemLedger.count({ where: { sessionId } })).toBe(1);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediter() REFUSE un delta hors bornes, AVANT toute écriture en base",
    async () => {
      const { f, sessionId } = await foyerAvecSession("crediter-borne");

      await expect(
        prisma.$transaction((tx) =>
          crediter(tx, { sessionId, childId: f.childId }, "bonus_soiree_complete", 5),
        ),
      ).rejects.toThrow(/hors des bornes/u);

      expect(await prisma.gemLedger.count({ where: { sessionId } })).toBe(0);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediterEtape() écrit exactement +1, pour la raison dérivée de la matière",
    async () => {
      const { f, sessionId } = await foyerAvecSession("crediter-etape");

      const rendu = await prisma.$transaction((tx) =>
        crediterEtape(tx, { sessionId, childId: f.childId }, "lecture"),
      );
      expect(rendu).toBe(1);

      const ligne = await prisma.gemLedger.findUniqueOrThrow({
        where: { sessionId_raison: { sessionId, raison: "etape_lecture_terminee" } },
      });
      expect(ligne.delta).toBe(1);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "etapesCreditees() compte depuis le LEDGER, jamais depuis `attempt` — aucune ligne `attempt` n'existe ici",
    async () => {
      const { f, sessionId } = await foyerAvecSession("etapes-creditees");

      expect(await prisma.$transaction((tx) => etapesCreditees(tx, sessionId))).toBe(0);
      await prisma.$transaction((tx) => crediterEtape(tx, { sessionId, childId: f.childId }, "lecture"));
      expect(await prisma.$transaction((tx) => etapesCreditees(tx, sessionId))).toBe(1);
      await prisma.$transaction((tx) => crediterEtape(tx, { sessionId, childId: f.childId }, "maths"));
      expect(await prisma.$transaction((tx) => etapesCreditees(tx, sessionId))).toBe(2);
      // Aucune ligne `attempt` n'a jamais été écrite dans ce test : le compte
      // ne peut donc venir que du ledger.
      expect(await prisma.attempt.count({ where: { sessionId } })).toBe(0);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediterBonusSiSoireeComplete() — LE TEST QUE LE CONTRÔLEUR DEMANDE : le bonus est réellement écrit quand toutes les étapes sont créditées",
    async () => {
      const { f, sessionId } = await foyerAvecSession("bonus-complet", (f) => [
        { matiere: "lecture", ordre: 0, dureeEstimeeMin: 5, exerciseIds: [f.lecture] },
        { matiere: "maths", ordre: 1, dureeEstimeeMin: 5, exerciseIds: [f.maths] },
      ]);
      const contexte = { sessionId, childId: f.childId };
      await prisma.$transaction((tx) => crediterEtape(tx, contexte, "lecture"));
      await prisma.$transaction((tx) => crediterEtape(tx, contexte, "maths"));

      const rendu = await prisma.$transaction((tx) => crediterBonusSiSoireeComplete(tx, contexte, 2));
      expect(rendu).toBe(1); // 3 − 2 étapes

      const bonus = await prisma.gemLedger.findUniqueOrThrow({
        where: { sessionId_raison: { sessionId, raison: "bonus_soiree_complete" } },
      });
      expect(bonus.delta).toBe(1);
      expect(await prisma.$transaction((tx) => pierresDeLaSession(tx, sessionId))).toBe(3);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediterBonusSiSoireeComplete() REND 0 et N'ÉCRIT RIEN si une étape manque au ledger",
    async () => {
      const { f, sessionId } = await foyerAvecSession("bonus-incomplet", (f) => [
        { matiere: "lecture", ordre: 0, dureeEstimeeMin: 5, exerciseIds: [f.lecture] },
        { matiere: "maths", ordre: 1, dureeEstimeeMin: 5, exerciseIds: [f.maths] },
      ]);
      const contexte = { sessionId, childId: f.childId };
      await prisma.$transaction((tx) => crediterEtape(tx, contexte, "lecture"));
      // Maths n'est PAS créditée : la soirée n'est pas complète.

      const rendu = await prisma.$transaction((tx) => crediterBonusSiSoireeComplete(tx, contexte, 2));
      expect(rendu).toBe(0);
      expect(
        await prisma.gemLedger.findUnique({
          where: { sessionId_raison: { sessionId, raison: "bonus_soiree_complete" } },
        }),
      ).toBeNull();
    },
    TIMEOUT_DB_MS,
  );

  it(
    "crediterBonusSiSoireeComplete() REND 0 sur une soirée `sansDevoir` (0 étape programmée)",
    async () => {
      const { f, sessionId } = await foyerAvecSession("bonus-sans-devoir", () => []);
      const rendu = await prisma.$transaction((tx) =>
        crediterBonusSiSoireeComplete(tx, { sessionId, childId: f.childId }, 0),
      );
      expect(rendu).toBe(0);
      expect(await prisma.gemLedger.count({ where: { sessionId } })).toBe(0);
    },
    TIMEOUT_DB_MS,
  );

  it(
    "recalculerSolde() (via crediter) RETABLIT gem_balance même si le cache était faux au départ",
    async () => {
      const { f, sessionId } = await foyerAvecSession("solde-faux");
      // Le cache est délibérément faussé, comme le serait une corruption :
      // SEC-06 exige un recalcul, jamais un incrément aveugle.
      await prisma.child.update({ where: { id: f.childId }, data: { gemBalance: 99 } });

      await prisma.$transaction((tx) =>
        crediter(tx, { sessionId, childId: f.childId }, "etape_lecture_terminee", 1),
      );

      const enfant = await prisma.child.findUniqueOrThrow({ where: { id: f.childId } });
      // Recalcul DEPUIS le ledger : 1, jamais 99 + 1 = 100.
      expect(enfant.gemBalance).toBe(1);
    },
    TIMEOUT_DB_MS,
  );
});
