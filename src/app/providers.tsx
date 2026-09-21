"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactElement, type ReactNode } from "react";

/**
 * TanStack Query pour les données serveur (TEC-04).
 *
 * Le `QueryClient` est créé dans un `useState` et non au niveau du module :
 * au rendu serveur, un client de module serait partagé entre deux requêtes de
 * deux visiteurs. Tipi n'a qu'un foyer (TEC-18), mais un cache partagé entre
 * requêtes est un défaut de sécurité qui ne se voit qu'en production.
 *
 * Réglages par défaut, et leurs motifs :
 *  - `retry: 1` — une seule reprise. PRD-16 veut un chemin de récupération
 *    montré à l'humain, pas une boucle silencieuse qui fait attendre un enfant
 *    fatigué devant un écran figé.
 *  - `refetchOnWindowFocus: false` — revenir sur l'onglet ne doit pas
 *    recharger une étape en cours. La reprise est portée par `GET /api/etat`
 *    (V3), qui relit la base, pas par un rafraîchissement d'opportunité.
 *  - `staleTime` court — l'état de session vit en base (D2) ; une donnée d'une
 *    minute est encore bonne pour un écran, jamais pour une transition, qui
 *    passe toujours par la route serveur.
 *
 * Zustand n'a pas de fournisseur : son store est un module. Les deux
 * bibliothèques de TEC-04 sont donc câblées, chacune à sa place — l'une pour
 * les données serveur, l'autre pour l'affichage.
 */
export function Providers({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
