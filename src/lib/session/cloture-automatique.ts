/**
 * T12 — la clôture automatique — **SERVEUR UNIQUEMENT** (ARB-09, PRD-16, PRD-18).
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE EMPÊCHE, EN UNE PHRASE
 * ---------------------------------------------------------------------------
 * Sans elle, une session laissée ouverte hier renvoie l'enfant sur les devoirs
 * de la veille, et empêche le parent de lancer la soirée : « une impasse que
 * PRD-16 interdit » (ARB-09). C'est pour cela que **V3 livre un chemin de
 * fermeture autonome** : aucun élément de V7 n'est requis pour clore une
 * session normalement.
 *
 * ---------------------------------------------------------------------------
 * LA GARDE, ET OÙ ELLE EST
 * ---------------------------------------------------------------------------
 * La garde est `estSoireePerimee(session.date, maintenant)` — et **rien
 * d'autre**. Elle n'est jamais évaluée côté client : c'est le serveur qui sait
 * quel jour on est. Elle est testée avant d'être câblée (M-01,
 * `src/lib/dates/soiree.test.ts`).
 *
 * ---------------------------------------------------------------------------
 * LE TROISIÈME CRÉDITEUR DU BONUS
 * ---------------------------------------------------------------------------
 * T12 crédite ce qui était dû : **d'abord les étapes achevées et non créditées,
 * ensuite le bonus de soirée complète** (P2 §9.4). C'est le cas du constat 20 :
 * tout est fini en base, le dernier appui n'est jamais arrivé — sans cette
 * troisième porte, l'enfant perdait définitivement une pierre.
 *
 * L'ordre n'est pas tenu ici : il est tenu par la machine, qui pose
 * `rattraper_etapes_achevees` avant `crediter_bonus_si_complete` dans les
 * effets de T12, et par le service, qui les exécute dans l'ordre reçu. Ce
 * module ne fait que trouver les sessions et déclencher l'événement.
 */
import { prisma } from "@/lib/db/prisma";
import { estSoireePerimee } from "@/lib/dates/soiree";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { appliquerEvenement } from "@/lib/session/service";
import { ETATS_FINAUX } from "@/lib/session/types";

garderServeur("src/lib/session/cloture-automatique.ts");

export interface SessionClose {
  readonly sessionId: string;
  readonly pierresCreditees: number;
}

/**
 * Ferme toute session non finale dont la soirée est passée, et rend ce qui a
 * été crédité au passage.
 *
 * Appelée par `GET /api/etat` **et** par `POST /api/session`, avant toute
 * réponse et avant toute création (P2 §8.1 et §8.3). Les deux, et pas une
 * seule : l'aiguillage protège l'enfant, la création protège le parent.
 *
 * `evenementId` est **déterministe** — `cloture-auto:<sessionId>` — et non
 * tiré au hasard : si deux appels concurrents ou successifs tentent la même
 * clôture, l'idempotence du journal en absorbe le second sans effet de bord.
 * Un identifiant aléatoire aurait produit deux lignes de journal pour un seul
 * fait, et c'est le genre de doublon qui rend un résumé parent faux.
 */
export async function cloreSessionsPerimees(
  childId: string,
  maintenant: Date = new Date(),
): Promise<readonly SessionClose[]> {
  garderServeur("src/lib/session/cloture-automatique.ts");

  const candidates = await prisma.session.findMany({
    where: { childId, etat: { notIn: [...ETATS_FINAUX] } },
    select: { id: true, date: true, etat: true },
    orderBy: { date: "asc" },
  });

  const closes: SessionClose[] = [];
  for (const candidate of candidates) {
    // LA GARDE. Une session de la soirée courante n'est jamais touchée : la
    // clore sous les doigts de l'enfant serait le défaut symétrique.
    if (!estSoireePerimee(candidate.date, maintenant)) continue;

    const resultat = await appliquerEvenement({
      sessionId: candidate.id,
      evenementId: `cloture-auto:${candidate.id}`,
      evenement: "CLOTURE_AUTOMATIQUE",
      etatAttendu: candidate.etat,
    });
    if (!resultat.ok) continue;
    closes.push({ sessionId: candidate.id, pierresCreditees: resultat.pierresCreditees });
  }
  return closes;
}
