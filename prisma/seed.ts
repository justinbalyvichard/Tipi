/**
 * Seed — foyer, profil d'Evan, palier d'exemple (PRD-02, P2 §14 V1).
 *
 * PRD-02 : « Profil enfant unique pré-rempli (Evan, 29/11/2019, CE1, bilingue
 * breton), **âge calculé depuis la date de naissance, jamais codé en dur**. »
 *
 * Ce fichier écrit donc une DATE, et jamais un âge. Ce n'est pas une
 * convention : `child` n'a aucune colonne d'âge (`prisma/schema.prisma`), donc
 * il n'existe aucun endroit où en stocker un. L'âge s'obtient par
 * `ageEnAnnees(child.dateNaissance, …)` — `src/lib/dates/age.ts` — et de
 * nulle part ailleurs.
 *
 * Idempotence : le seed est rejouable. Il n'écrase jamais une donnée vivante —
 * ni le solde de pierres, ni le thème choisi, ni le marqueur d'onboarding. Un
 * seed qui remettrait `gem_balance` à zéro retirerait des pierres à un enfant,
 * ce qu'ETH-04 interdit absolument.
 *
 * Ce que le seed n'écrit PAS :
 *  - aucun `settings_access` : le code parent est créé par le parent lui-même,
 *    au premier passage dans Réglages (V7). Un code par défaut serait un code
 *    connu de quiconque lit ce dépôt (SEC-01) ;
 *  - aucune session, aucun devoir : une soirée se construit, elle ne se seme pas ;
 *  - aucune ligne de `gem_ledger` : le solde doit rester égal à la somme du
 *    ledger (TEC-11), et une pierre offerte par un script n'a pas été gagnée.
 *
 * Exécution : `pnpm db:seed`. Elle exige une base réelle atteignable par
 * `DATABASE_URL`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Le foyer. V1 = un seul (1.2), mais le schéma est multi-foyers. */
const NOM_FOYER = "Tipi";

/**
 * Evan. Les quatre valeurs de PRD-02, et rien de plus.
 *
 * `Date.UTC` et non `new Date("2019-11-29")` : la colonne est un `@db.Date`,
 * une date de calendrier sans heure. La construire en heure locale la ferait
 * basculer d'un jour dans tout fuseau à décalage négatif, et l'enfant
 * changerait d'âge un jour trop tôt. `src/lib/dates/soiree.ts` la relit en UTC
 * pour la même raison.
 */
const EVAN = {
  prenom: "Evan",
  dateNaissance: new Date(Date.UTC(2019, 10, 29)), // 29 novembre 2019
  niveauScolaire: "CE1",
  classeBilingue: true,
} as const;

/**
 * Un palier d'exemple (PRD-14).
 *
 * Il vaut le forfait de trois soirées complètes — `3 × 3` au barème d'ARB-13 —
 * pour que le coffre montre une progression atteignable dès la première
 * semaine, sans jamais mettre l'enfant sous tension (ETH-01).
 *
 * ETH-05 : l'application n'octroie jamais elle-même la récompense. Ce palier
 * est un texte que le parent réécrit dans Réglages ; c'est lui qui décide et
 * qui donne. La description reste donc volontairement neutre et sans promesse.
 */
const PALIER_EXEMPLE = {
  gemsRequis: 9,
  description: "À définir avec le parent",
} as const;

async function main(): Promise<void> {
  const foyer =
    (await prisma.family.findFirst({ where: { nom: NOM_FOYER } })) ??
    (await prisma.family.create({ data: { nom: NOM_FOYER } }));

  const existant = await prisma.child.findFirst({
    where: { familyId: foyer.id, prenom: EVAN.prenom },
  });

  const enfant =
    existant === null
      ? await prisma.child.create({ data: { familyId: foyer.id, ...EVAN } })
      : // Mise à jour des SEULS champs d'identité de PRD-02. `gemBalance`,
        // `themePrefere`, `cosmetiqueActive` et `onboardingTermineLe` ne sont
        // jamais touchés : ce sont des données vivantes.
        await prisma.child.update({
          where: { id: existant.id },
          data: {
            dateNaissance: EVAN.dateNaissance,
            niveauScolaire: EVAN.niveauScolaire,
            classeBilingue: EVAN.classeBilingue,
          },
        });

  const palier = await prisma.rewardThreshold.findFirst({
    where: { childId: enfant.id },
  });
  if (palier === null) {
    await prisma.rewardThreshold.create({
      data: { childId: enfant.id, ...PALIER_EXEMPLE },
    });
  }

  // `console.info`, et rien d'autre : TEC-15 vise la trace de mise au point
  // laissée derrière soi. Un script d'opérateur doit dire ce qu'il a fait.
  console.info(
    `[seed] foyer ${foyer.nom} · enfant ${enfant.prenom} né le ${enfant.dateNaissance
      .toISOString()
      .slice(0, 10)} · ${enfant.niveauScolaire}${enfant.classeBilingue ? " bilingue" : ""}`,
  );
  console.info("[seed] aucun âge n'est écrit en base : PRD-02 le calcule depuis la date.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur: unknown) => {
    console.error("[seed] échec :", erreur);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
