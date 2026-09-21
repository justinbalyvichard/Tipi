import type { ReactElement } from "react";
import { cx } from "../ui/cx";
import { Pilou } from "./Pilou";

/**
 * TEC-12 — l'habillage d'attente, nommé par l'arborescence validée en P2
 * (`src/components/pilou/`, phase P3). Le seuil de 400 ms au-delà duquel il
 * s'affiche n'est **pas** décidé ici : il vit dans `ui.config.ts`, et c'est
 * l'appelant qui décide de monter ou non ce composant.
 *
 * DES-08 : trois points qui montent et redescendent, décalés, sur une courbe
 * douce. Aucune opacité qui s'éteint, aucun clignotement, aucun flash, et rien
 * ne bouge si le système demande à réduire les animations.
 *
 * Le texte d'attente (`enfant.attente.pilou`) n'est pas rendu ici : il arrive
 * par une `SpeechBubble`, alimentée depuis `content/`.
 */
interface PilouReflechitProps {
  /** Nom accessible, issu de `content/`. */
  readonly etiquette: string;
  readonly className?: string;
}

const RETARDS = ["0ms", "220ms", "440ms"] as const;

export function PilouReflechit({ etiquette, className }: PilouReflechitProps): ReactElement {
  return (
    <div role="status" aria-live="polite" className={cx("flex items-center gap-4", className)}>
      <Pilou taille="icone" anime />
      <span className="flex items-center gap-2">
        {RETARDS.map((retard) => (
          <span
            key={retard}
            style={{ animationDelay: retard }}
            className="block h-2.5 w-2.5 animate-pense-1 rounded-pilule bg-texte-secondaire"
          />
        ))}
      </span>
      <span className="sr-only">{etiquette}</span>
    </div>
  );
}
