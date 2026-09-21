/**
 * Client Supabase — **SERVEUR UNIQUEMENT**, Storage uniquement (TEC-02, TEC-13).
 *
 * C'est la décision D1 de l'architecture, et elle est structurelle : le
 * navigateur ne parle qu'à Next.js, jamais à Supabase. Il n'existe dans le
 * bundle **aucune** clé Supabase, pas même la clé `anon`. Les photos
 * transitent par une route serveur, les audios aussi, et les URL de lecture
 * sont signées côté serveur.
 *
 * Une seule exception, bornée et mesurée : le client va chercher directement,
 * **sans aucune clé**, les clips du bucket public `tts-cache`, qui ne contient
 * que des phrases de Pilou sans jeton — ni prénom, ni texte de devoir
 * (P2, §12.2). Son préfixe est `NEXT_PUBLIC_TTS_CACHE_URL`, une URL, pas un
 * secret. Tout clip personnel passe par le serveur.
 *
 * Ce module ne fait QUE fabriquer le client. L'upload, les URL signées et la
 * purge (SEC-05) sont livrés par les verticales qui en ont besoin — V2 pour
 * les photos, V4 pour les audios. V1 câble la connexion, rien de plus.
 *
 * Base de données : ce client ne l'atteint jamais. Postgres passe par Prisma
 * avec `DATABASE_URL` (`src/lib/db/prisma.ts`). Deux chemins, deux
 * responsabilités.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/storage/supabase.ts");

/** Les trois buckets du projet (P2, §12.2 et supabase/policies.sql, partie C). */
export const BUCKETS = Object.freeze({
  /** Privé — photos de devoirs. URL signées uniquement. */
  devoirs: "devoirs",
  /** Privé — enregistrements de l'enfant. Purgés par SEC-05. */
  audios: "audios",
  /** PUBLIC — clips TTS sans aucun jeton. Le seul accès direct du client. */
  ttsCache: "tts-cache",
  /** Privé — clips TTS prononçant le prénom de l'enfant (SEC-04). */
  ttsPrive: "tts-prive",
});

let cache: SupabaseClient | undefined;

/**
 * Le client de service. `SUPABASE_SERVICE_ROLE_KEY` donne un accès total au
 * projet : elle ne doit apparaître dans aucun composant, aucun hook, aucun
 * fichier importé par le client. La garde de ce module le rend exécutable ;
 * l'invariant I1 de `scripts/verifier-socle.mjs` le vérifie sur l'artefact.
 *
 * `persistSession: false` : il n'y a pas d'utilisateur Supabase dans Tipi, et
 * aucune session à conserver entre deux requêtes serveur.
 */
export function supabase(): SupabaseClient {
  garderServeur("src/lib/storage/supabase.ts");
  if (cache !== undefined) return cache;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env();
  cache = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cache;
}

/** Remet le client à zéro. Réservé aux tests. */
export function reinitialiserSupabasePourTest(): void {
  cache = undefined;
}
