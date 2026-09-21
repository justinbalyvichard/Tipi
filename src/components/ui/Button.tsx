import type { ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconeNom } from "./Icon";

/**
 * DES-04, DES-06, DES-07, DES-05.
 *
 * - Le composant rend **toujours** un `<button>` ou un `<a>`, jamais un `div`
 *   ni un `span` porteur d'un `onClick`. Le choix est dicté par la présence de
 *   `href` : une navigation est un lien, une action est un bouton.
 * - Hauteur minimale `min-h-cible` = `--tipi-cible-min` = 56 px (DES-04). La
 *   valeur n'est pas recopiée ici : elle vient du jeton.
 * - Le libellé est rendu en `text-action` (20 px, graisse 700). Ce n'est pas un
 *   choix esthétique : c'est ce qui fait franchir à tous les libellés d'action
 *   le seuil « grand texte » de WCAG, et ramène le contraste exigé à 3:1 —
 *   seule façon d'employer l'accent bleu du thème Apple sans passer sous AA.
 *   Les ratios sont publiés dans le rapport P3.
 * - Aucun texte n'est écrit ici : le libellé arrive par `children`, depuis
 *   `content/`.
 * - Bouton sans libellé visible : l'étiquette est portée par l'icône
 *   (`role="img"` + `aria-label`) et **n'est pas répétée** sur le bouton. Le
 *   nom accessible du bouton est calculé depuis ce contenu ; le doubler ferait
 *   annoncer deux fois la même chose.
 */
export type VarianteBouton = "primaire" | "secondaire" | "texte";

type BoutonCommun = {
  readonly variante?: VarianteBouton;
  readonly icone?: IconeNom;
  readonly pleineLargeur?: boolean;
  readonly desactive?: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
  /** Rendu en `<a>` quand il est fourni ; en `<button>` sinon. */
  readonly href?: string;
  readonly type?: "button" | "submit";
  readonly ariaPressed?: boolean;
};

/**
 * Deux formes exclusives, imposées par le type :
 * - un bouton avec libellé (`children`) ;
 * - un bouton **sans libellé visible**, qui exige alors `etiquette` et `icone`.
 *   Aucune icône seule ne peut donc être livrée sans `aria-label`.
 */
type BoutonProps = BoutonCommun &
  (
    | { readonly children: ReactNode; readonly etiquette?: undefined }
    | { readonly children?: undefined; readonly etiquette: string; readonly icone: IconeNom }
  );

const parVariante: Readonly<Record<VarianteBouton, string>> = {
  primaire:
    "bg-accent-primaire text-accent-primaire-encre shadow-douce active:shadow-none",
  secondaire: "bg-teinte-bleu text-encre border-hairline border-ligne",
  texte: "bg-transparent text-texte-secondaire",
};

export function Button(props: BoutonProps): ReactElement {
  const {
    variante = "primaire",
    icone,
    pleineLargeur = false,
    desactive = false,
    className,
    onClick,
    href,
    type = "button",
    ariaPressed,
    children,
    etiquette,
  } = props;

  const iconeSeule = children === undefined;

  const classes = cx(
    "inline-flex items-center justify-center gap-2",
    "min-h-cible min-w-cible",
    iconeSeule ? "px-0 aspect-square" : "px-6",
    "rounded-pilule font-texte text-action",
    "transition-colors duration-douce ease-douce",
    "disabled:opacity-60",
    parVariante[variante],
    pleineLargeur ? "w-full" : "",
    className
  );

  const contenu = (
    <>
      {icone === undefined ? null : iconeSeule ? (
        <Icon nom={icone} etiquette={etiquette ?? ""} taille={28} />
      ) : (
        <Icon nom={icone} decorative taille={24} />
      )}
      {children}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={classes}
        {...(etiquette === undefined || iconeSeule ? {} : { "aria-label": etiquette })}
      >
        {contenu}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={desactive}
      className={classes}
      {...(ariaPressed === undefined ? {} : { "aria-pressed": ariaPressed })}
      {...(etiquette === undefined || iconeSeule ? {} : { "aria-label": etiquette })}
    >
      {contenu}
    </button>
  );
}
