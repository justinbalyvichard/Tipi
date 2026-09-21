/**
 * Table de sélection des textes dépendant de l'ordre des étapes.
 *
 * Source normative : `docs/agents/P1/produit-marketing.out.md`, section 7.0,
 * qui se déclare elle-même « normative pour `dev-feature` ».
 *
 * Le problème qu'elle règle : PRD-04 autorise le parent à retirer une matière
 * et à réordonner les étapes. Six configurations de soirée sont atteignables.
 * La décision produit est qu'**aucune phrase enfant ne nomme une matière dans
 * un texte figé réutilisé pour une autre configuration**, et qu'il n'y a
 * **aucune interpolation de nom de matière dans une phrase générique** :
 * « D'abord la {matiere}. » est interdit, parce que la phrase ne tiendrait pas
 * au pluriel (« la maths ») et qu'un contrôleur ne pourrait pas lire le texte
 * final.
 *
 * Ce module ne contient donc que des **clés**, jamais un texte. Il ne compose
 * rien : il choisit.
 *
 * Règle de contrôle opposable (7.0) : pour chacune des six configurations, un
 * contrôleur doit pouvoir dérouler la soirée et constater que Pilou ne nomme
 * jamais une matière absente du programme du soir.
 *
 * ARB-06 : le Soir léger reste indétectable par l'enfant. C5 et C6 jouent
 * exactement les mêmes clés que C3 et C4 — c'est voulu, et c'est pour cela que
 * la table les apparie.
 */
import type { Matiere } from "@/lib/validation/json";

/** Les six configurations de soirée atteignables (7.0). */
export const CONFIGURATIONS = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;
export type Configuration = (typeof CONFIGURATIONS)[number];

/** Où vit le texte d'une clé : texte fixe d'interface, ou banque de variantes. */
export type SourceCle = "ui" | "banque";

export interface CleEffective {
  readonly cle: string;
  readonly source: SourceCle;
}

/**
 * Détermine la configuration d'une soirée à partir du programme figé et du
 * marqueur Soir léger. Aucune autre entrée n'intervient.
 *
 * @throws si le programme est vide : une soirée sans étape (`sansDevoir`) ne
 *   joue aucune annonce, et demander sa configuration est une erreur d'appel.
 */
export function configurationDe(
  matieresDansLOrdre: readonly Matiere[],
  soirLeger: boolean,
): Configuration {
  const premiere = matieresDansLOrdre[0];
  if (premiere === undefined) {
    throw new Error(
      "Soirée sans étape programmée : aucune configuration C1 à C6 ne s'applique (ARB-08).",
    );
  }
  if (matieresDansLOrdre.length >= 2) {
    return premiere === "lecture" ? "C1" : "C2";
  }
  if (soirLeger) {
    return premiere === "lecture" ? "C5" : "C6";
  }
  return premiere === "lecture" ? "C3" : "C4";
}

/** Annonce du programme à l'enfant (PRD-07). */
export function cleAnnonceProgramme(configuration: Configuration): CleEffective {
  switch (configuration) {
    case "C1":
      return { cle: "enfant.programme.corps.lecture_maths", source: "ui" };
    case "C2":
      return { cle: "enfant.programme.corps.maths_lecture", source: "ui" };
    case "C3":
    case "C5":
      return { cle: "enfant.programme.une.corps.lecture", source: "banque" };
    case "C4":
    case "C6":
      return { cle: "enfant.programme.une.corps.maths", source: "banque" };
  }
}

/** Entrée d'une étape, selon sa position dans la soirée. */
export function cleIntroEtape(matiere: Matiere, estPremiere: boolean): CleEffective {
  const rang = estPremiere ? "premier" : "apres";
  return { cle: `${matiere}.intro.titre.${rang}`, source: "ui" };
}

/** Félicitation de transition : l'étape qui vient de finir. */
export function cleFelicitationTransition(matiereTerminee: Matiere): CleEffective {
  return { cle: `transition.felicitation.${matiereTerminee}`, source: "banque" };
}

/** Annonce de transition : l'étape qui suit. */
export function cleAnnonceTransition(matiereSuivante: Matiere): CleEffective {
  return { cle: `transition.annonce.${matiereSuivante}`, source: "banque" };
}

/**
 * Passage vers la clôture : aucune étape ne suit, quelle que soit la
 * configuration C1 à C6.
 *
 * ARB-07 a renommé cette clé, et le motif mérite d'être rappelé ici :
 * `transition.*` ne signifie pas « charnière » mais « une étape suit », or ici
 * aucune ne suit — le rituel de fermeture n'est pas une étape. Le préfixe
 * mentait sur le sens.
 */
export const CLE_FIN_TRAVAIL: CleEffective = Object.freeze({
  cle: "session.fin_travail.corps",
  source: "banque",
});

/**
 * Les treize clés effectives de la table 7.0, à plat.
 *
 * Existe pour être vérifiée : l'invariant I5 de `scripts/verifier-socle.ts`
 * contrôle que chacune est portée par la source déclarée, et par elle seule.
 * Une clé annoncée « banque » mais rangée dans `ui-enfant.json` serait jouée
 * sans variantes, et le Soir léger redeviendrait détectable.
 */
export const CLES_TABLE_7_0: readonly CleEffective[] = Object.freeze([
  cleAnnonceProgramme("C1"),
  cleAnnonceProgramme("C2"),
  cleAnnonceProgramme("C3"),
  cleAnnonceProgramme("C4"),
  cleIntroEtape("lecture", true),
  cleIntroEtape("lecture", false),
  cleIntroEtape("maths", true),
  cleIntroEtape("maths", false),
  cleFelicitationTransition("lecture"),
  cleFelicitationTransition("maths"),
  cleAnnonceTransition("lecture"),
  cleAnnonceTransition("maths"),
  CLE_FIN_TRAVAIL,
]);
