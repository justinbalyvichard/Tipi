/**
 * Dates de calendrier (P2, §2 — `src/lib/dates/soiree.ts`).
 *
 * Deux besoins, une seule mécanique : lire les composantes **de calendrier**
 * d'un instant, dans un fuseau nommé. Aucune dépendance : l'architecture
 * refuse `date-fns` et `dayjs`, `Intl` suffit (P2, §15.2).
 *
 * Pourquoi c'est indispensable : « la soirée du 21 septembre » n'est pas un
 * instant, c'est une date locale. Comparer deux `Date` par leur valeur
 * absolue ferait basculer la soirée à 22 h heure de Paris en été, et la garde
 * de la clôture automatique T12 (PRD-18) renverrait l'enfant sur les devoirs
 * de la veille.
 */

/**
 * Fuseau du foyer. V1 = un seul foyer, en France (1.2). La valeur est ici, et
 * nulle part ailleurs : le jour où Tipi devient multi-foyers, elle devient une
 * colonne de `family` et ce module reçoit le fuseau en paramètre — la
 * signature le prévoit déjà.
 */
export const FUSEAU_FOYER = "Europe/Paris";

export interface PartiesCalendaires {
  readonly annee: number;
  /** 1 à 12. Jamais l'index 0-11 de `Date.getMonth()`, source d'erreurs. */
  readonly mois: number;
  /** 1 à 31. */
  readonly jour: number;
}

const formateurs = new Map<string, Intl.DateTimeFormat>();

function formateur(fuseau: string): Intl.DateTimeFormat {
  const existant = formateurs.get(fuseau);
  if (existant !== undefined) return existant;
  const cree = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  formateurs.set(fuseau, cree);
  return cree;
}

/**
 * Composantes de calendrier d'un instant, **dans un fuseau nommé**.
 * À employer pour tout ce qui est un instant : `created_at`, `started_at`,
 * « maintenant ».
 */
export function partiesCalendaires(
  instant: Date,
  fuseau: string = FUSEAU_FOYER,
): PartiesCalendaires {
  if (Number.isNaN(instant.getTime())) {
    throw new Error("Date invalide passée à partiesCalendaires.");
  }
  const parties = formateur(fuseau).formatToParts(instant);
  const lire = (type: Intl.DateTimeFormatPartTypes): number => {
    const trouve = parties.find((p) => p.type === type);
    if (trouve === undefined) {
      throw new Error(`Composante ${type} absente du formateur de dates.`);
    }
    return Number.parseInt(trouve.value, 10);
  };
  return { annee: lire("year"), mois: lire("month"), jour: lire("day") };
}

/**
 * Composantes de calendrier d'une colonne `DATE` de Postgres, **en UTC**.
 *
 * `child.date_naissance` et `session.date` sont des `@db.Date` : Prisma les
 * rend en `Date` à minuit UTC. Les relire dans un fuseau local leur ferait
 * changer de jour dans tout fuseau à décalage négatif. Une date sans heure se
 * lit en UTC, toujours.
 */
export function partiesDateSeule(dateSeule: Date): PartiesCalendaires {
  if (Number.isNaN(dateSeule.getTime())) {
    throw new Error("Date invalide passée à partiesDateSeule.");
  }
  return {
    annee: dateSeule.getUTCFullYear(),
    mois: dateSeule.getUTCMonth() + 1,
    jour: dateSeule.getUTCDate(),
  };
}

/** `YYYY-MM-DD`, forme normalisée et triable d'une date de calendrier. */
export function formaterDate(parties: PartiesCalendaires): string {
  const mm = String(parties.mois).padStart(2, "0");
  const jj = String(parties.jour).padStart(2, "0");
  return `${parties.annee}-${mm}-${jj}`;
}

/**
 * La soirée à laquelle appartient un instant, en date locale du foyer.
 * C'est la valeur écrite dans `session.date` et comparée par la garde T12.
 */
export function dateSoiree(instant: Date, fuseau: string = FUSEAU_FOYER): string {
  return formaterDate(partiesCalendaires(instant, fuseau));
}

/**
 * Vrai si la session datée `dateSession` appartient à une soirée ANTÉRIEURE à
 * celle de `instant`. C'est exactement la garde de la clôture automatique T12
 * (ARB-09, PRD-18) : une session de la veille est close côté serveur, et
 * l'enfant est accueilli sur les devoirs du jour.
 */
export function estSoireePerimee(
  dateSession: Date,
  instant: Date,
  fuseau: string = FUSEAU_FOYER,
): boolean {
  return formaterDate(partiesDateSeule(dateSession)) < dateSoiree(instant, fuseau);
}
