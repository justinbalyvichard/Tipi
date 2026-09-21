import type { ReactElement } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

/**
 * Compteur de pierres — PRD-14, ETH-04, PED-07.
 *
 * Ce composant est le **seul** du design system autorisé à afficher un nombre
 * devant l'enfant, et uniquement dans `/enfant/coffre` : un nombre
 * d'inventaire, qui ne baisse jamais et ne mesure pas l'enfant (règle des trois
 * nombres admis, livrable marketing 7.9). Il n'existe ici ni variation, ni
 * flèche de progression, ni comparaison d'un soir à l'autre — le composant ne
 * reçoit qu'un solde.
 *
 * Le libellé (« Tes pierres ») arrive par `etiquette`, depuis
 * `content/ui-enfant.json`. Le nombre est rendu avec `Intl.NumberFormat`,
 * jamais concaténé à une chaîne rédigée.
 *
 * Contraste : encre sur `--tipi-accent-pierre` — 9,87:1 en thème Pilou,
 * 7,65:1 en thème Apple. Les deux ratios sont publiés dans le rapport P3.
 */
interface GemCounterProps {
  readonly solde: number;
  /** Libellé visible, issu de `content/`. */
  readonly etiquette: string;
  readonly taille?: "normale" | "hero";
  readonly className?: string;
}

export function GemCounter({
  solde,
  etiquette,
  taille = "normale",
  className,
}: GemCounterProps): ReactElement {
  const rendu = new Intl.NumberFormat("fr-FR").format(Math.max(solde, 0));

  return (
    <div
      className={cx(
        "inline-flex items-center gap-3 rounded-pilule bg-accent-pierre text-encre",
        taille === "hero" ? "px-6 py-4" : "px-5 py-3",
        "min-h-cible",
        className
      )}
    >
      <Icon nom="pierre" decorative taille={taille === "hero" ? 32 : 24} />
      <span className="font-texte text-corps">{etiquette}</span>
      <span className={cx("font-titre", taille === "hero" ? "text-titre" : "text-pierre")}>
        {rendu}
      </span>
    </div>
  );
}
