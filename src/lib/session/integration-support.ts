/**
 * Support des tests d'intégration du moteur de session — **contre un vrai
 * PostgreSQL, jamais un mock de transaction**.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE (P4/V3.review.md, tour 1, [MAJEUR] 1)
 * ---------------------------------------------------------------------------
 * Le contrôleur a rendu **totalement no-op** le cas `crediter_bonus_si_complete`
 * de `executerEffet()` dans `src/lib/session/service.ts` : le troisième
 * créditeur du bonus désactivé pour toujours, pour tous les enfants. Les 244
 * tests sont restés verts, `verifier:confinement` aussi, `pnpm build` aussi.
 * **Seule `pnpm epreuve:session`, un script manuel exigeant une base montée à
 * la main, l'a détecté.** C'est la même faute que le constat 26 avait déjà
 * coûtée une fois, en pire : elle n'était plus détectable par aucune commande
 * automatisée.
 *
 * Ce module automatise exactement ce que `scripts/epreuve-session.ts` fait à
 * la main, pour que `pnpm test -- --run` — commande de TEC-14, rejouée à
 * chaque tour par le contrôleur — attrape cette classe de régression sans
 * intervention manuelle.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI C'EST STRUCTUREL, ET PAS UN MOCK
 * ---------------------------------------------------------------------------
 * `src/lib/session/service.ts` n'est PAS testable par un mock fidèle de
 * `$transaction` : sa garantie centrale — « une transition = une transaction,
 * et si le crédit échoue, l'état n'avance pas » — repose sur le comportement
 * RÉEL de Postgres (verrou `FOR UPDATE`, atomicité, contrainte unique
 * `(session_id, raison)`). Un mock qui simule cette atomicité la re-décrit, et
 * deux implémentations correctes d'une transaction mal comprise seraient
 * d'accord entre elles — la même faute que ce projet évite pour le barème
 * (P2 §9.5, « invariant plutôt que re-dérivation »).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UNE BASE LOCALE N'EST PAS UN COMPTE EXTERNE MANQUANT (ESC-000)
 * ---------------------------------------------------------------------------
 * ESC-000 dit que les comptes externes — un projet Supabase, une clé d'un
 * fournisseur d'IA, un compte de service Google Cloud Vision — manquent
 * toujours (C1 de `scripts/verifier-confinement.ts` interdit d'ailleurs de
 * nommer un fournisseur hors de ses trois fichiers irréductibles, tests
 * compris — ce paragraphe s'en tient donc au générique), et que le
 * bouchonnage correspondant est structurel. Un serveur PostgreSQL local n'est
 * pas un compte de fournisseur : c'est le même moteur de base de données que
 * la section 1.1 décrit, exécuté localement, sans identifiant ni jeton d'un
 * tiers. C'est très exactement ce que `scripts/epreuve-session.ts` utilise
 * déjà, et ce que `docs/agents/P4/V3.out.md` §12 documente comme prérequis.
 *
 * ---------------------------------------------------------------------------
 * FAIL LOUD, JAMAIS UN SKIP SILENCIEUX
 * ---------------------------------------------------------------------------
 * Si `DATABASE_URL` n'est pas exportée, ou si Postgres n'est pas joignable à
 * cette adresse, `assurerBaseDeTest()` **lève**, avec le message exact à
 * suivre pour corriger — les mêmes commandes que `V3.out.md` §12. Un test qui
 * se tairait silencieusement (`it.skip`, un `try/catch` qui avale l'erreur)
 * serait exactement l'instrument muet que `40-protocole-agents.mdc` interdit :
 * il afficherait un test vert qui ne mesure plus rien.
 *
 * ---------------------------------------------------------------------------
 * LES CONTRAINTES DE `policies.sql` SONT DÉRIVÉES, JAMAIS RECOPIÉES
 * ---------------------------------------------------------------------------
 * La partie B de `supabase/policies.sql` (les huit contraintes non exprimables
 * en Prisma) est lue et exécutée telle quelle, entre ses deux marqueurs de
 * section. Recopier ces `CHECK` dans ce fichier créerait une seconde source de
 * vérité : un déphasage entre les deux serait invisible tant que personne ne
 * les compare (ARB-18 mesure 1). Toutes les instructions sont déjà idempotentes
 * (`IF NOT EXISTS` / `DO $$`), donc rejouables sans risque à chaque exécution
 * de la suite. La partie A (RLS, qui suppose les rôles Supabase `anon` /
 * `authenticated` / `service_role`) et la partie C (Storage) ne sont pas
 * appliquées ici : elles sont hors du périmètre de ces tests, qui portent sur
 * l'écriture réelle des transitions et du ledger, pas sur les politiques
 * d'accès ni le stockage de fichiers.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const MARQUEUR_DEBUT = "-- PARTIE B — Contraintes non exprimables dans schema.prisma";
const MARQUEUR_FIN = "-- PARTIE C — Storage";

/**
 * Les six variables critiques de `src/config/env.ts`, avec des valeurs
 * inoffensives — même geste que `BASE` dans `src/config/neutralisations.test.ts`
 * — SAUF `DATABASE_URL`/`DIRECT_URL`, qui doivent pointer sur une vraie base :
 * ce sont elles que ce module lit depuis l'environnement du processus, sans
 * valeur de repli silencieuse.
 */
export function preparerEnvDeTest(): void {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url.trim() === "") {
    throw new Error(
      [
        "Tests d'intégration du moteur de session : DATABASE_URL n'est pas définie.",
        "Ces tests EXÉCUTENT RÉELLEMENT les transactions de service.ts contre PostgreSQL",
        "— voir docs/agents/P4/V3.out.md §12 pour la procédure complète. En résumé :",
        "",
        "  pg_ctlcluster 16 main start",
        "  su postgres -c \"psql -c \\\"ALTER USER postgres PASSWORD 'tipi'\\\"\"",
        "  su postgres -c \"createdb tipi_v3\"   # ou une base dédiée",
        "  export DATABASE_URL=\"postgresql://postgres:tipi@127.0.0.1:5432/tipi_v3\"",
        "  export DIRECT_URL=\"$DATABASE_URL\"",
        "  pnpm test -- --run",
        "",
        "Ce n'est pas un compte externe manquant (ESC-000) : c'est un serveur PostgreSQL",
        "local, sans identifiant tiers — le même que `pnpm epreuve:session` utilise déjà.",
      ].join("\n"),
    );
  }
  process.env.DIRECT_URL ??= url;
  process.env.SUPABASE_URL ??= "https://test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
  process.env.PARENT_SESSION_SECRET ??= "test-parent-session-secret";
  process.env.CRON_SECRET ??= "test-cron-secret";
  process.env.AI_PROVIDER ??= "bouchon";
  process.env.OCR_PROVIDER ??= "bouchon";
}

/** Un client Prisma dédié à la préparation — distinct du singleton applicatif. */
function clientDePreparation(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url === undefined) throw new Error("preparerEnvDeTest() doit être appelée avant.");
  return new PrismaClient({ datasources: { db: { url } } });
}

/** `prisma migrate deploy`, contre la base désignée par `DATABASE_URL`. */
function migrerBase(): void {
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: RACINE,
    env: process.env,
    stdio: "pipe",
  });
}

/**
 * Applique la partie B de `supabase/policies.sql`, **lue depuis le fichier
 * réel**, jamais recopiée. Lève si les marqueurs de section ont disparu : une
 * dérivation qui ne trouve plus sa source doit être bruyante, pas silencieuse.
 */
function appliquerContraintesPartieB(): void {
  const complet = readFileSync(resolve(RACINE, "supabase", "policies.sql"), "utf8");
  const debut = complet.indexOf(MARQUEUR_DEBUT);
  const fin = complet.indexOf(MARQUEUR_FIN);
  if (debut === -1 || fin === -1 || fin <= debut) {
    throw new Error(
      "supabase/policies.sql : les marqueurs de la partie B sont introuvables. " +
        "La dérivation des contraintes ne peut pas s'appuyer sur une source qui a changé de forme.",
    );
  }
  const bloc = complet.slice(debut, fin);
  const url = process.env.DATABASE_URL;
  if (url === undefined) throw new Error("preparerEnvDeTest() doit être appelée avant.");
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-q"], { input: bloc, stdio: "pipe" });
}

let baseAssuree = false;

/**
 * Migre et applique les contraintes une seule fois par processus de test.
 * Idempotent : un second appel (un second fichier de test dans le même
 * worker) ne refait rien.
 */
export async function assurerBaseDeTest(): Promise<void> {
  preparerEnvDeTest();
  if (baseAssuree) return;

  // `$connect()`, jamais `$queryRaw` : ce module n'est PAS `service.ts`, le
  // seul fichier où C8 (`scripts/verifier-confinement.ts`) autorise le SQL
  // brut. Ouvrir la connexion suffit à savoir si Postgres est joignable, sans
  // introduire un second passage de SQL brut que l'instrument ne peut pas voir.
  let sonde: PrismaClient | undefined;
  try {
    sonde = clientDePreparation();
    await sonde.$connect();
  } catch (erreur) {
    throw new Error(
      `PostgreSQL injoignable à DATABASE_URL. Démarrer le serveur local — voir ` +
        `docs/agents/P4/V3.out.md §12. Détail : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    );
  } finally {
    await sonde?.$disconnect();
  }

  migrerBase();
  appliquerContraintesPartieB();
  baseAssuree = true;
}

export interface FoyerDeTest {
  readonly familyId: string;
  readonly childId: string;
  readonly lecture: string;
  readonly maths: string;
}

/**
 * Un foyer, un enfant et deux exercices (lecture, maths) fraîchement créés.
 * Chaque test appelle cette fonction pour obtenir des identifiants qui lui
 * sont propres : aucun partage d'état entre tests, aucun nettoyage requis en
 * cours de route — seul `nettoyerFoyer()` en fin de fichier efface tout.
 */
export async function nouveauFoyer(prisma: PrismaClient, suffixe: string): Promise<FoyerDeTest> {
  const family = await prisma.family.create({
    data: { nom: `Foyer d'épreuve — ${suffixe}` },
  });
  const child = await prisma.child.create({
    data: {
      familyId: family.id,
      prenom: `Enfant-${suffixe}`,
      dateNaissance: new Date("2019-11-29T00:00:00.000Z"),
      niveauScolaire: "CE1",
    },
  });
  const devoir = await prisma.homework.create({
    data: { childId: child.id, texteOcr: "épreuve d'intégration", saisieManuelle: true },
  });
  const exercices = await Promise.all(
    (["lecture", "maths"] as const).map((matiere, rang) =>
      prisma.exercise.create({
        data: {
          homeworkId: devoir.id,
          consigne: `épreuve ${matiere}`,
          type: "épreuve",
          contenu: "—",
          ordre: rang,
          matiere,
          dureeEstimeeMin: 5,
        },
      }),
    ),
  );
  const lecture = exercices.find((e) => e.matiere === "lecture");
  const maths = exercices.find((e) => e.matiere === "maths");
  if (lecture === undefined || maths === undefined) {
    throw new Error("nouveauFoyer() : les deux exercices d'épreuve n'ont pas été créés.");
  }
  return { familyId: family.id, childId: child.id, lecture: lecture.id, maths: maths.id };
}

/** Efface un foyer et tout ce qui en dépend (cascade Prisma). */
export async function nettoyerFoyer(prisma: PrismaClient, familyId: string): Promise<void> {
  await prisma.family.delete({ where: { id: familyId } }).catch(() => undefined);
}

/** Identifiant d'événement unique, lisible dans un journal de test. */
let compteur = 0;
export function idEvenement(): string {
  compteur += 1;
  return `00000000-0000-4000-9000-${String(compteur).padStart(12, "0")}`;
}
