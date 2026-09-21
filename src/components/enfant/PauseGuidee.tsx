"use client";

import type { ReactElement } from "react";

import { Pilou } from "@/components/pilou/Pilou";
import { PilouReflechit } from "@/components/pilou/PilouReflechit";
import { SpeechBubble } from "@/components/pilou/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { useTransitionSession } from "@/hooks/useTransitionSession";

/**
 * PRD-12 — la respiration guidée avec Pilou.
 *
 * Quatre textes, tous résolus côté serveur depuis `content/ui-enfant.json` :
 * `pause.inspire`, `pause.expire`, `pause.rassurance`, `pause.bouton`. Aucun
 * n'est écrit ici (ARB-10).
 *
 * ---------------------------------------------------------------------------
 * LE RYTHME EST CELUI DE PILOU, ET IL N'EST PAS RECOPIÉ EN JAVASCRIPT
 * ---------------------------------------------------------------------------
 * La première version de cet écran faisait alterner les deux phrases avec un
 * `setInterval`, ce qui demandait une **nouvelle constante de durée** — donc un
 * nombre recopié à côté de l'animation `respire` de `tailwind.config.ts`,
 * exactement la duplication non gardée que `controle-code` a fait rougir au
 * tour 2 de V1 ([MAJEUR] 1). Le rythme est donc porté par l'animation de Pilou,
 * une seule fois, en CSS, et les deux phrases sont **affichées ensemble**.
 *
 * Deux bénéfices, et ce ne sont pas des consolations : du texte qui apparaît et
 * disparaît est un clignotement, que DES-08 refuse ; et
 * `prefers-reduced-motion` est déjà traité par `themes.css` pour toutes les
 * animations du produit, donc sans une ligne ici.
 *
 * **Aucun chrono, aucun décompte, aucune durée affichée** (PED-07, ETH-01) :
 * l'enfant revient quand il veut, et le bouton est là dès la première seconde.
 * C'est ce que dit `pause.rassurance`.
 */
export interface TextesPause {
  /** `pause.titre` et `pause.corps`, tirés de la banque `demande_pause` (ARB-04). */
  readonly titre: string;
  readonly corps: string;
  readonly inspire: string;
  readonly expire: string;
  readonly rassurance: string;
  readonly bouton: string;
  /** `enfant.attente.pilou`, pour l'habillage de TEC-12. */
  readonly attente: string;
}

export function PauseGuidee({
  sessionId,
  textes,
}: {
  readonly sessionId: string;
  readonly textes: TextesPause;
}): ReactElement {
  const transition = useTransitionSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-prose flex-col items-center justify-center gap-8 p-6">
      <Pilou taille="grande" anime />

      <SpeechBubble>
        <span className="block">{textes.inspire}</span>
        <span className="block">{textes.expire}</span>
      </SpeechBubble>

      <p className="font-texte text-corps text-texte-secondaire">{textes.rassurance}</p>

      {transition.attenteAffichee ? <PilouReflechit etiquette={textes.attente} /> : null}

      <Button
        pleineLargeur
        desactive={transition.enCours}
        onClick={() => {
          // T8 — la pause revient TOUJOURS sur l'étape d'où elle venait, et
          // c'est `etape_courante` qui le dit. Aucune colonne
          // `etat_avant_pause` n'est nécessaire, et cet écran n'en transporte
          // aucune trace : il ne sait même pas d'où il vient.
          transition.envoyer({ sessionId, evenement: "PAUSE_TERMINEE", etatAttendu: "pause" });
        }}
      >
        {textes.bouton}
      </Button>
    </main>
  );
}
