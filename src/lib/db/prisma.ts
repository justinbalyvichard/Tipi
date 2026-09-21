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
 * `env()` est appelée ici, et c'est volontaire : importer ce module fait
 * valider l'environnement. Une `DATABASE_URL` absente est refusée au démarrage
 * avec le nom de la variable, jamais par une panne silencieuse en pleine
 * soirée (P2, §11).
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

export const prisma: PrismaClient = globalPourPrisma.prismaTipi ?? creer();

if (process.env.NODE_ENV !== "production") {
  globalPourPrisma.prismaTipi = prisma;
}
