/**
 * Le thème est un attribut sur `<html>`, et rien d'autre (3.8, `20-themes.mdc`).
 * Le commuter ne remonte aucun composant React : le navigateur ré-résout les
 * variables CSS. C'est ce qui rend PRD-17 instantané et vérifiable.
 */
export const THEMES = ["pilou", "apple"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_PAR_DEFAUT: Theme = "pilou";

export function estTheme(valeur: string | undefined): valeur is Theme {
  return valeur !== undefined && (THEMES as readonly string[]).includes(valeur);
}

/**
 * Applique le thème à `<html>`. La persistance n'est pas traitée ici : le thème
 * retenu vit dans `child.theme_prefere` (3.7) et c'est la verticale Réglages
 * qui le lit et l'écrit. Le design system se limite à l'appliquer.
 */
export function appliquerTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
