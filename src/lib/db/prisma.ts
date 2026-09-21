/**
 * Singleton Prisma — **SERVEUR UNIQUEMENT** (TEC-03, TEC-13, P2 D1).
 *
 * Le navigateur ne parle jamais à Postgres : toutes les lectures et écritures
 * passent par une route serveur Next.js. La garde de `garderServeur` rend
 * l'interdit exécutable plutôt que déclaratif.
 *
 * Pourquoi un singleton : en développement, Next.js recharge les modules à
 * chaud et créerait une connexion par rechargement, jusqu'à épuiser le pooler
 * Supabase. L'instance est donc portée par `globalThis` hors production.
 *
 * ---------------------------------------------------------------------------
 * CORRIGÉ PAR V2 : LA CONNEXION EST **DIFFÉRÉE**, PAS SUPPRIMÉE
 * ---------------------------------------------------------------------------
 * V1 écrivait ici : « `env()` est appelée à l'import, et c'est volontaire :
 * importer ce module fait valider l'environnement. » L'intention est juste et
 * elle est **conservée** — une `DATABASE_URL` absente doit être refusée avec le
 * nom de la variable, jamais par une panne silencieuse en pleine soirée.
 *
 * Mais l'effet de bord était à l'import, et V1 n'avait livré aucune route pour
 * s'en apercevoir. Dès que V2 en a livré cinq, `next build` a échoué : la phase
 * « Collecting page data » **importe chaque module de route**, donc appelait
 * `env()`, donc exigeait les six variables critiques pour construire. `pnpm
 * build` est l'une des quatre commandes de TEC-14 : elle ne peut pas dépendre
 * des secrets de production.
 *
 * La validation a donc lieu au **premier usage** et non au premier import. Le
 * message d'erreur est le même, au même endroit, avec le même nom de variable ;
 * ce qui change est l'instant, et il reste bien avant toute requête servie.
 * Sortie réelle de l'échec de build en §0 de `docs/agents/P4/V2.out.md`.
 */
import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/db/prisma.ts");

const globalPourPrisma = globalThis as typeof globalThis & {
  prismaTipi?: PrismaClient;
};

function creer(): PrismaClient {
  const { DATABASE_URL } = env();
  return new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
    // `query` n'est jamais journalisée : une requête contient le prénom de
    // l'enfant et, en Réglages, le hash du code parent (SEC-01, SEC-08).
    log: ["warn", "error"],
  });
}

function client(): PrismaClient {
  const existant = globalPourPrisma.prismaTipi;
  if (existant !== undefined) return existant;
  const cree = creer();
  if (process.env.NODE_ENV !== "production") {
    globalPourPrisma.prismaTipi = cree;
  }
  return cree;
}

let horsDev: PrismaClient | undefined;

function instance(): PrismaClient {
  garderServeur("src/lib/db/prisma.ts");
  if (process.env.NODE_ENV !== "production") return client();
  horsDev ??= client();
  return horsDev;
}

/**
 * Le client, atteint paresseusement.
 *
 * Un `Proxy` plutôt qu'une fonction `prismaClient()` : les sept modules qui
 * écrivent `prisma.homework.findMany(…)` n'ont pas à changer, et surtout le
 * jour où un huitième s'ajoutera, il n'aura pas à savoir que la connexion est
 * différée. Les méthodes sont **liées à la vraie instance** — `$transaction`
 * s'appuie sur son `this`, et une fonction rendue nue casserait dessus sans
 * prévenir.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_cible, propriete, _recepteur): unknown {
    const reel = instance();
    const valeur: unknown = Reflect.get(reel, propriete, reel);
    return typeof valeur === "function" ? valeur.bind(reel) : valeur;
  },
  has(_cible, propriete): boolean {
    return Reflect.has(instance(), propriete);
  },
});
