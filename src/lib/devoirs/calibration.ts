/**
 * TEC-16 — mode calibration OCR, **SERVEUR UNIQUEMENT**.
 *
 * « Pour les 20 premières photos, journaliser en base le texte OCR brut, le
 * score de confiance et le JSON renvoyé par le modèle, consultables depuis
 * Réglages, afin de régler les seuils sur de vrais devoirs et non sur des
 * exemples inventés. »
 *
 * Trois choses que ce module tient, et qui sont toutes des conditions de
 * rejouabilité :
 *
 *  1. **le seuil en vigueur au moment de l'analyse** est écrit avec la ligne.
 *     Sans lui, un réglage a posteriori ne serait pas rejouable : on saurait
 *     qu'une photo a été refusée, pas contre quoi ;
 *  2. **le payload exact** qui est parti, et non une reconstruction. C'est la
 *     preuve de SEC-04 nommée en P2 §6 : le test n'a pas besoin de faire
 *     confiance au code, il lit en base ce qui est réellement parti ;
 *  3. **les échecs sont journalisés comme les succès.** C'est même sur eux que
 *     la calibration est instructive : vingt photos qui marchent n'apprennent
 *     rien sur le seuil.
 *
 * La journalisation **s'arrête d'elle-même** au-delà du compte, et le parent
 * peut aussi l'arrêter à la main (`family.calibration_active`, Réglages, V7).
 *
 * ---------------------------------------------------------------------------
 * CE MODULE NE FAIT JAMAIS ÉCHOUER UNE ANALYSE
 * ---------------------------------------------------------------------------
 * Une écriture de journal qui casserait la soirée d'un enfant serait un défaut
 * bien pire que l'absence de mesure. Les erreurs d'écriture sont donc avalées —
 * **sauf une** : un payload non anonyme. Celle-là remonte, parce qu'écrire en
 * base un payload contenant le prénom créerait exactement la fuite que SEC-04
 * interdit, dans une table que Réglages affiche.
 */
import { Prisma } from "@prisma/client";

import { assertPayloadAnonyme } from "@/lib/ai/anonymisation";
import type { IdentifiantsInterdits } from "@/lib/ai/anonymisation";
import type { TraceAppelIa } from "@/lib/ai/provider";
import { prisma } from "@/lib/db/prisma";
import { estAppError } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { seuils } from "@/config/seuils.config";

garderServeur("src/lib/devoirs/calibration.ts");

export interface LigneCalibration {
  readonly homeworkId: string;
  readonly familyId: string;
  readonly texteOcrBrut: string;
  readonly confianceOcr: number;
  /**
   * **TOUS** les corps émis pour ce devoir, dans l'ordre : prompt 1, puis un
   * par exercice de maths (TEC-07).
   *
   * CORRIGÉ AU TOUR 2 — [MAJEUR] M2. Le tour 1 ne stockait qu'un corps, celui
   * du prompt 1, et c'était le seul qui passait par le caviardage. La table
   * était présentée comme « ce qui est réellement parti » alors qu'elle en
   * voyait le tiers : c'est la raison mécanique pour laquelle l'épreuve de bout
   * en bout n'a pas pu voir le bloquant B1.
   */
  readonly traces: readonly TraceAppelIa[];
}

/**
 * Vrai si la journalisation est encore ouverte : mode actif **et** compte non
 * atteint. Les deux conditions sont lues à chaque appel, jamais mises en cache :
 * le parent peut couper le mode en plein milieu d'une analyse.
 */
export async function calibrationOuverte(familyId: string): Promise<boolean> {
  const famille = await prisma.family.findUnique({ where: { id: familyId } });
  if (famille === null || !famille.calibrationActive) return false;
  return (await prisma.calibrationLog.count()) < seuils().calibrationNbPhotos;
}

export async function journaliserCalibration(
  ligne: LigneCalibration,
  interdits: IdentifiantsInterdits,
): Promise<void> {
  garderServeur("src/lib/devoirs/calibration.ts");
  if (!(await calibrationOuverte(ligne.familyId))) return;

  // La seule erreur qui a le droit de remonter d'ici. Elle signale qu'un
  // payload émis portait un identifiant : l'écrire en base l'exposerait dans
  // Réglages > Calibration des photos (SEC-04).
  //
  // Elle s'applique désormais à **chacun** des corps émis ([MAJEUR] M2) : un
  // contrôle qui n'examinerait que le premier serait de nouveau une propriété
  // quantifiée sur un site au lieu de tous.
  for (const [rang, trace] of ligne.traces.entries()) {
    assertPayloadAnonyme(
      trace.payload,
      interdits,
      `calibration_log.payload_ia[${rang}] (${trace.promptId})`,
    );
  }

  // Le tableau EXACT des corps émis, dans l'ordre d'émission. La forme change
  // par rapport au tour 1 — un objet devient un tableau —, et c'est assumé :
  // la colonne doit porter ce qui part, pas le premier de ce qui part.
  const payload: Prisma.InputJsonValue = JSON.parse(
    JSON.stringify(ligne.traces.map((t) => ({ prompt: t.promptId, version: t.promptVersion, corps: t.payload }))),
  );
  const reponses = ligne.traces.map((t) => t.reponseBrute);
  // `Prisma.DbNull` et non `null` : la colonne est `Json?`, et Prisma distingue
  // « champ absent » de « valeur JSON null ». Passer `null` serait refusé par le
  // typage, et le contourner écrirait un `null` JSON là où l'on veut un vide.
  const reponse: Prisma.InputJsonValue | typeof Prisma.DbNull = reponses.every((r) => r === null)
    ? Prisma.DbNull
    : JSON.parse(JSON.stringify(reponses));

  // Le premier code d'erreur rencontré : c'est celui qui a fait basculer
  // l'analyse. Les suivants en découlent.
  const erreurCode = ligne.traces.map((t) => t.erreurCode).find((c) => c != null) ?? null;
  const dureeMs = ligne.traces.reduce((total, t) => total + t.dureeMs, 0);

  try {
    await prisma.calibrationLog.upsert({
      where: { homeworkId: ligne.homeworkId },
      create: {
        homeworkId: ligne.homeworkId,
        texteOcrBrut: ligne.texteOcrBrut,
        confianceOcr: ligne.confianceOcr,
        payloadIa: payload,
        reponseIaBrute: reponse,
        erreurCode,
        seuilConfianceApplique: seuils().ocrConfianceMin,
        dureeMs,
      },
      update: {
        texteOcrBrut: ligne.texteOcrBrut,
        confianceOcr: ligne.confianceOcr,
        payloadIa: payload,
        reponseIaBrute: reponse,
        erreurCode,
        seuilConfianceApplique: seuils().ocrConfianceMin,
        dureeMs,
      },
    });
  } catch (brute) {
    if (estAppError(brute)) throw brute;
    // Journal indisponible : la soirée continue. TEC-16 mesure, elle ne
    // gouverne pas.
    return;
  }

  await couperSiCompteAtteint(ligne.familyId);
}

/**
 * Coupe le mode calibration dès que le compte est atteint. « Au-delà du compte,
 * la journalisation s'arrête d'elle-même » (P2, §13) : sans cette ligne, elle
 * s'arrêterait à la lecture mais le drapeau resterait vrai, et Réglages
 * afficherait un mode actif qui n'écrit plus rien.
 */
async function couperSiCompteAtteint(familyId: string): Promise<void> {
  if ((await prisma.calibrationLog.count()) < seuils().calibrationNbPhotos) return;
  await prisma.family.update({
    where: { id: familyId },
    data: { calibrationActive: false },
  });
}
