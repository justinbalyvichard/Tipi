"use client";

import type { ReactElement } from "react";

import { Pilou } from "@/components/pilou/Pilou";
import { PilouReflechit } from "@/components/pilou/PilouReflechit";
import { SpeechBubble } from "@/components/pilou/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useTransitionSession } from "@/hooks/useTransitionSession";

/**
 * PRD-10 — la transition douce entre deux étapes.
 *
 * Trois choses, dans cet ordre, et rien de plus : **une félicitation courte**,
 * **une micro-animation**, **l'annonce de la suivante**. Les deux phrases sont
 * tirées de la banque (`transition.felicitation.{matiere}` et
 * `transition.annonce.{matiere}`, ARB-04) côté serveur, où vit le tirage sans
 * répétition immédiate ; le libellé du bouton est fixe (`transition.bouton`,
 * ARB-06).
 *
 * La micro-animation est celle de Pilou et celle de la bulle — `animate-respire`
 * et `animate-apparait` —, donc rien de nouveau et rien de recopié. Elle
 * s'efface sous `prefers-reduced-motion` grâce à `themes.css`.
 *
 * **Aucun compteur, aucun chrono, aucune pierre affichée ici** (PED-07) : les
 * `ProgressDots` disent où l'on en est du programme, en pictos, ce que PRD-07
 * autorise ; ils ne comptent ni points ni erreurs.
 */
export interface TextesTransition {
  readonly felicitation: string;
  readonly annonce: string;
  readonly bouton: string;
  readonly attente: string;
}

export function EcranTransition({
  sessionId,
  textes,
  nbEtapes,
  etapeCourante,
}: {
  readonly sessionId: string;
  readonly textes: TextesTransition;
  readonly nbEtapes: number;
  /** Index de l'étape qui vient de se terminer. */
  readonly etapeCourante: number;
}): ReactElement {
  const transition = useTransitionSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-prose flex-col items-center justify-center gap-8 p-6">
      <Pilou taille="grande" anime />

      <SpeechBubble>
        <span className="block">{textes.felicitation}</span>
        <span className="block">{textes.annonce}</span>
      </SpeechBubble>

      <ProgressDots total={nbEtapes} courant={etapeCourante + 1} />

      {transition.attenteAffichee ? <PilouReflechit etiquette={textes.attente} /> : null}

      <Button
        pleineLargeur
        desactive={transition.enCours}
        onClick={() => {
          transition.envoyer({
            sessionId,
            evenement: "TRANSITION_VUE",
            etatAttendu: "transition",
          });
        }}
      >
        {textes.bouton}
      </Button>
    </main>
  );
}
