import type { ReactElement, ReactNode } from "react";
import { cx } from "./cx";

/**
 * Carte — surface posée sur le fond d'écran.
 * Rayon `--tipi-rayon-carte` : 20 px dans les deux thèmes (3.8 : 18–22 px côté
 * Pilou, 20 px côté Apple). L'ombre est une ombre portée douce côté Pilou et
 * un simple filet côté Apple, **jamais un dégradé**.
 *
 * `ton` teinte le fond de la carte avec une teinte de 3.8. Le texte reste en
 * `text-encre` quelle que soit la teinte : les quatre couples sont mesurés
 * entre 12,65:1 et 13,06:1 côté Pilou, 15,03:1 côté Apple (DES-05).
 */
export type TonCarte = "surface" | "bleu" | "corail" | "jaune" | "menthe";

const parTon: Readonly<Record<TonCarte, string>> = {
  surface: "bg-surface",
  bleu: "bg-teinte-bleu",
  corail: "bg-teinte-corail",
  jaune: "bg-teinte-jaune",
  menthe: "bg-teinte-menthe",
};

interface CardProps {
  readonly children: ReactNode;
  readonly ton?: TonCarte;
  readonly className?: string;
  /** Rend la carte comme une `<section>` étiquetée par son titre. */
  readonly ariaLabelledBy?: string;
}

export function Card({
  children,
  ton = "surface",
  className,
  ariaLabelledBy,
}: CardProps): ReactElement {
  return (
    <section
      {...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy })}
      className={cx(
        "rounded-carte p-5 text-encre shadow-douce",
        parTon[ton],
        className
      )}
    >
      {children}
    </section>
  );
}
