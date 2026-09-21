/**
 * Les TROIS variables publiques de Tipi, et rien d'autre (P2, §11).
 *
 * Une variable préfixée `NEXT_PUBLIC_` est inlinée dans le bundle par Next.js.
 * Aucune n'est un secret : une URL de fichiers audio publics, le nom d'une
 * implémentation de `SpeechProvider`, un numéro de version.
 *
 * Contrainte de compilation, volontaire : `process.env.X` est écrit en toutes
 * lettres, jamais `process.env[nom]`. Next.js ne remplace que la forme
 * littérale ; une lecture dynamique rendrait `undefined` en production sans
 * prévenir.
 *
 * Ce fichier est importable côté client. `src/config/env.ts` ne l'est pas.
 */
import { z } from "zod";

const schemaEnvClient = z.object({
  ttsCacheUrl: z.string().optional(),
  speechProvider: z.string().min(1),
  appVersion: z.string().min(1),
});

export type EnvClient = z.infer<typeof schemaEnvClient>;

/**
 * `NEXT_PUBLIC_TTS_CACHE_URL` reste facultative : absente, le client ne tente
 * pas le cache direct et passe par `POST /api/voix`. Plus lent, jamais cassé
 * (P2 §11).
 */
export const ENV_CLIENT: Readonly<EnvClient> = Object.freeze(
  schemaEnvClient.parse({
    ttsCacheUrl: process.env.NEXT_PUBLIC_TTS_CACHE_URL,
    speechProvider: process.env.NEXT_PUBLIC_SPEECH_PROVIDER ?? "web-speech",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  }),
);
