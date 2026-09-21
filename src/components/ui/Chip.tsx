import type { ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconeNom } from "./Icon";

/**
 * Pastille d'information — matière d'une étape, état d'une session.
 *
 * Le Chip n'est **jamais** cliquable : une pastille qui agit serait un `div`
 * porteur d'un `onClick`, ce que le design system interdit. Quand une pastille
 * doit agir, on emploie `Button variante="secondaire"`.
 *
 * Dans le thème Apple, les quatre tons convergent vers l'unique teinte de 3.8 :
 * la distinction passe par l'icône et le libellé, jamais par la seule couleur —
 * ce qui est aussi la bonne règle d'accessibilité.
 */
export type TonChip = "bleu" | "corail" | "jaune" | "menthe" | "neutre";

const parTon: Readonly<Record<TonChip, string>> = {
  bleu: "bg-teinte-bleu",
  corail: "bg-teinte-corail",
  jaune: "bg-teinte-jaune",
  menthe: "bg-teinte-menthe",
  neutre: "bg-surface border-hairline border-ligne",
};

interface ChipProps {
  readonly children: ReactNode;
  readonly ton?: TonChip;
  readonly icone?: IconeNom;
  readonly className?: string;
}

export function Chip({ children, ton = "bleu", icone, className }: ChipProps): ReactElement {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-pilule px-4 py-2",
        "font-texte text-corps text-encre",
        parTon[ton],
        className
      )}
    >
      {icone === undefined ? null : <Icon nom={icone} decorative taille={20} />}
      {children}
    </span>
  );
}
