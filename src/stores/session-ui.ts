"use client";

/**
 * Zustand — état d'**AFFICHAGE** seulement (TEC-04, P2 D2).
 *
 * D2 est la décision qui gouverne ce fichier : *l'état de session vit en base,
 * et la base est la seule source de vérité* (TEC-18, PRD-18). Zustand ne
 * détient que ce qui peut disparaître sans conséquence — la variante de phrase
 * en cours, l'indice affiché, le micro ouvert. Fermer l'onglet ne perd rien ;
 * rouvrir relit la base.
 *
 * Ce qui n'a donc RIEN à faire ici, et qu'aucune verticale n'a le droit d'y
 * ajouter :
 *  - l'état de la machine à états (`session.etat`) ;
 *  - l'étape courante, le programme, le solde de pierres ;
 *  - quoi que ce soit qu'une route serveur écrit.
 *
 * Aucune persistance non plus : `localStorage` ne porte aucune donnée de
 * parcours (D2). Le store est volatil par construction.
 *
 * V1 pose le câblage. La machine à états et ses événements sont livrés par V3.
 */
import { create } from "zustand";

export interface EtatAffichageSession {
  /**
   * Identifiants des dernières variantes jouées, par situation. Porte la règle
   * « sans répétition immédiate » (ARB-04) d'un écran à l'autre, sans jamais
   * décider quel texte s'affiche : le tirage est dans `src/content/selection.ts`.
   */
  readonly dernieresVariantes: Readonly<Record<string, readonly string[]>>;
  /** PED-02 — niveau d'indice déroulé à l'écran, 0 à 4. Le fait vit en base. */
  readonly niveauIndiceAffiche: number;
  /** Le micro est ouvert. Purement visuel ; la transcription part au serveur. */
  readonly microOuvert: boolean;
  /** TEC-12 — l'habillage « Pilou réfléchit » est affiché. */
  readonly attenteAffichee: boolean;

  memoriserVariante: (situationId: string, varianteId: string, profondeur: number) => void;
  definirNiveauIndice: (niveau: number) => void;
  definirMicroOuvert: (ouvert: boolean) => void;
  definirAttenteAffichee: (affichee: boolean) => void;
  /** Remet l'affichage à neuf. Appelé au changement d'étape, jamais en base. */
  reinitialiser: () => void;
}

const ETAT_INITIAL = {
  dernieresVariantes: {} as Readonly<Record<string, readonly string[]>>,
  niveauIndiceAffiche: 0,
  microOuvert: false,
  attenteAffichee: false,
};

export const useSessionUi = create<EtatAffichageSession>((set) => ({
  ...ETAT_INITIAL,

  memoriserVariante: (situationId, varianteId, profondeur) =>
    set((etat) => {
      const precedentes = etat.dernieresVariantes[situationId] ?? [];
      return {
        dernieresVariantes: {
          ...etat.dernieresVariantes,
          [situationId]: [...precedentes, varianteId].slice(-Math.max(profondeur, 1)),
        },
      };
    }),

  definirNiveauIndice: (niveau) => set({ niveauIndiceAffiche: niveau }),
  definirMicroOuvert: (ouvert) => set({ microOuvert: ouvert }),
  definirAttenteAffichee: (affichee) => set({ attenteAffichee: affichee }),
  reinitialiser: () => set({ ...ETAT_INITIAL }),
}));
