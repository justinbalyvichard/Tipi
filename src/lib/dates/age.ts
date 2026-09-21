/**
 * PRD-02 — **l'âge se calcule depuis la date de naissance, jamais codé en dur.**
 *
 * C'est le cœur de l'exigence, et il tient en une propriété : `child` n'a
 * aucune colonne d'âge (`prisma/schema.prisma`), donc aucun code ne peut en
 * lire un. La seule façon d'obtenir l'âge d'un enfant est d'appeler cette
 * fonction avec `child.date_naissance`.
 *
 * Le contraire — un nombre stocké, ou écrit dans un fichier — serait faux
 * chaque 29 novembre au soir, et personne ne le verrait : c'est exactement le
 * genre de défaut silencieux que PRD-02 nomme.
 *
 * Aucune dépendance de dates (P2, §15.2).
 */
import {
  FUSEAU_FOYER,
  partiesCalendaires,
  partiesDateSeule,
  type PartiesCalendaires,
} from "@/lib/dates/soiree";

/**
 * Âge révolu, en années, d'une personne née le `dateNaissance` à l'instant
 * `reference`.
 *
 * Lecture des composantes, et pourquoi elles diffèrent :
 *  - `dateNaissance` vient d'une colonne `@db.Date`, donc sans heure : elle se
 *    lit **en UTC** (`partiesDateSeule`) ;
 *  - `reference` est un instant : il se lit **dans le fuseau du foyer**, sinon
 *    l'enfant changerait d'âge à 2 h du matin un soir d'été.
 *
 * Cas du 29 février : l'anniversaire d'une personne née un 29 février tombe le
 * 1er mars les années non bissextiles, ce que la comparaison jour/mois produit
 * naturellement.
 *
 * @throws si la naissance est postérieure à la référence — un âge négatif est
 *   une donnée fausse, pas un résultat.
 */
export function ageEnAnnees(
  dateNaissance: Date,
  reference: Date = new Date(),
  fuseau: string = FUSEAU_FOYER,
): number {
  const naissance = partiesDateSeule(dateNaissance);
  const maintenant = partiesCalendaires(reference, fuseau);

  let age = maintenant.annee - naissance.annee;
  if (avantDansLAnnee(maintenant, naissance)) {
    age -= 1;
  }

  if (age < 0) {
    throw new Error(
      "Date de naissance postérieure à la date de référence : l'âge n'existe pas.",
    );
  }
  return age;
}

/** Vrai si `a` tombe avant `b` dans l'année civile, mois puis jour. */
function avantDansLAnnee(a: PartiesCalendaires, b: PartiesCalendaires): boolean {
  if (a.mois !== b.mois) return a.mois < b.mois;
  return a.jour < b.jour;
}
