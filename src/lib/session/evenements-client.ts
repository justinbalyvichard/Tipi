/**
 * Quels événements un **client** a le droit d'émettre (P2 §8.3, ARB-09).
 *
 * La règle : un événement dont la garde est une donnée que **seul le serveur
 * possède** n'entre jamais par la route. `CLOTURE_AUTOMATIQUE` en est le cas
 * type — sa garde est `session.date` antérieure à la soirée courante, donc
 * l'horloge du serveur.
 *
 * La liste autorisée est **dérivée par soustraction** de `EVENEMENTS` (ARB-18
 * mesure 1) : un onzième événement ajouté demain sera accepté par défaut, ce
 * qui est le bon défaut, et le retirer demandera d'écrire son nom **avec son
 * motif**. Une liste d'autorisés recopiée aurait, elle, silencieusement exclu
 * le nouvel événement — un refus qui a l'air d'une décision et qui n'en est pas
 * une.
 *
 * Neutralisation gardée par `src/config/neutralisations.test.ts` : vider
 * `EVENEMENTS_SERVEUR` rendrait `CLOTURE_AUTOMATIQUE` émettable depuis le
 * navigateur, donc permettrait à un client de clore sa propre soirée en cours
 * et de déclencher le rattrapage à n'importe quel moment.
 */
import { EVENEMENTS, type Evenement } from "@/lib/session/types";

export const EVENEMENTS_SERVEUR: Readonly<Record<string, string>> = Object.freeze({
  CLOTURE_AUTOMATIQUE:
    "Sa garde est `session.date` antérieure à la soirée courante (ARB-09), donc l'horloge du serveur. Émise par un client, elle clôturerait la soirée en cours et déclencherait le rattrapage d'ARB-13 hors de son moment.",
});

export const EVENEMENTS_CLIENT: readonly Evenement[] = Object.freeze(
  EVENEMENTS.filter((e) => !Object.prototype.hasOwnProperty.call(EVENEMENTS_SERVEUR, e)),
);

export function estEvenementClient(evenement: Evenement): boolean {
  return EVENEMENTS_CLIENT.includes(evenement);
}
