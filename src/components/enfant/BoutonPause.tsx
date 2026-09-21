"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/Button";
import { useTransitionSession } from "@/hooks/useTransitionSession";
import type { EtatSession } from "@/lib/session/types";

/**
 * PRD-12 — le bouton pause, **à l'enfant lui-même**.
 *
 * Il n'est protégé par rien : ni appui long, ni code, ni confirmation. C'est la
 * différence exacte avec la sortie anticipée de PRD-13, qui est réservée au
 * parent. Un enfant fatigué doit pouvoir souffler sans demander la permission,
 * et **sans rien perdre** : T7 ne porte aucun effet de crédit, dans aucun sens.
 *
 * Le libellé vient de `content/ui-enfant.json` (`session.pause.bouton`), jamais
 * d'ici (ARB-10). Il est fixe et non varié : un libellé d'action qui change
 * transforme un repère en devinette pour un enfant de six ans et demi (ARB-06).
 *
 * **Où ce bouton se monte** : sur les deux écrans d'étape,
 * `/enfant/session/lecture` et `/enfant/session/maths`, livrés par V4 et V5.
 * V3 livre le bouton, la transition T7, l'écran de pause et le retour T8 —
 * c'est-à-dire tout ce que PRD-12 demande et que le moteur de session porte.
 */
export function BoutonPause({
  sessionId,
  etatAttendu,
  libelle,
}: {
  readonly sessionId: string;
  /** L'état d'étape depuis lequel la pause est demandée. */
  readonly etatAttendu: EtatSession;
  /** `session.pause.bouton`, résolu côté serveur. */
  readonly libelle: string;
}): ReactElement {
  const transition = useTransitionSession();

  return (
    <Button
      variante="secondaire"
      icone="pause"
      desactive={transition.enCours}
      onClick={() => {
        transition.envoyer({ sessionId, evenement: "PAUSE_DEMANDEE", etatAttendu });
      }}
    >
      {libelle}
    </Button>
  );
}
