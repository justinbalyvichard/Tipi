import type { ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconeNom } from "./Icon";

/**
 * Ligne de liste groupée — l'idiome du thème Apple (3.8 : « listes groupées à
 * séparateurs hairline, badges d'icônes en carrés arrondis 8 px »), rendue par
 * les mêmes composants dans le thème Pilou avec ses propres rayons.
 *
 * Contraintes tenues :
 * - Une ligne cliquable est **un `<button>` ou un `<a>`**, jamais un `div`
 *   écouté. Une ligne non cliquable est un `<li>` sans interaction.
 * - Hauteur minimale `min-h-cible` (56 px, DES-04).
 * - Le sous-titre emploie `text-texte-appui`, rôle dont la valeur atteint AA
 *   en petit texte dans les deux thèmes — voir la décision DS-1 du rapport P3.
 *   `--tipi-texte-secondaire` n'est jamais employé ici : en thème Apple il ne
 *   mesure que 3,62:1.
 * - Le chevron est décoratif : le nom accessible de la ligne vient du libellé.
 *
 * `ListGroup` porte le `<ul>` et les séparateurs, pour qu'aucun écran n'ait à
 * réinventer la mécanique du filet entre deux lignes.
 */
interface ListGroupProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly ariaLabelledBy?: string;
}

export function ListGroup({ children, className, ariaLabelledBy }: ListGroupProps): ReactElement {
  return (
    <ul
      {...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy })}
      className={cx(
        "overflow-hidden rounded-liste bg-surface shadow-douce",
        "[&>li+li]:border-t-hairline [&>li+li]:border-ligne",
        className
      )}
    >
      {children}
    </ul>
  );
}

type TonBadge = "primaire" | "secondaire" | "tertiaire" | "neutre";

const parTonBadge: Readonly<Record<TonBadge, string>> = {
  primaire: "bg-accent-primaire text-accent-primaire-encre",
  secondaire: "bg-accent-secondaire text-encre",
  tertiaire: "bg-accent-tertiaire text-encre",
  neutre: "bg-teinte-bleu text-encre",
};

type ListRowProps = {
  readonly titre: ReactNode;
  readonly sousTitre?: ReactNode;
  /** Valeur affichée à droite : état, choix courant. Jamais un score. */
  readonly valeur?: ReactNode;
  readonly icone?: IconeNom;
  readonly tonIcone?: TonBadge;
  readonly className?: string;
} & (
  | { readonly href: string; readonly onClick?: undefined }
  | { readonly onClick: () => void; readonly href?: undefined }
  | { readonly href?: undefined; readonly onClick?: undefined }
);

export function ListRow(props: ListRowProps): ReactElement {
  const { titre, sousTitre, valeur, icone, tonIcone = "neutre", className } = props;
  const cliquable = props.href !== undefined || props.onClick !== undefined;

  const interieur = (
    <>
      {icone === undefined ? null : (
        <span
          className={cx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-badge",
            parTonBadge[tonIcone]
          )}
        >
          <Icon nom={icone} decorative taille={22} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-texte text-corps font-semibold text-encre">{titre}</span>
        {sousTitre === undefined ? null : (
          <span className="font-texte text-appui font-normal text-texte-appui">{sousTitre}</span>
        )}
      </span>
      {valeur === undefined ? null : (
        <span className="font-texte text-appui text-texte-appui">{valeur}</span>
      )}
      {cliquable ? (
        // Le chevron ne porte aucune information : la ligne entière est un
        // `button` ou un `a` doté d'un nom accessible. `data-tipi-decor` est ce
        // qui l'exempte de la mesure de contraste du rendu, et rien d'autre.
        <span data-tipi-decor="chevron" className="flex text-pointille">
          <Icon nom="chevron" decorative taille={20} />
        </span>
      ) : null}
    </>
  );

  const classes = cx(
    "flex w-full min-h-cible items-center gap-3 bg-surface px-4 py-3",
    "transition-colors duration-douce ease-douce",
    className
  );

  return (
    <li>
      {props.href !== undefined ? (
        <a href={props.href} className={classes}>
          {interieur}
        </a>
      ) : props.onClick !== undefined ? (
        <button type="button" onClick={props.onClick} className={classes}>
          {interieur}
        </button>
      ) : (
        <div className={classes}>{interieur}</div>
      )}
    </li>
  );
}
