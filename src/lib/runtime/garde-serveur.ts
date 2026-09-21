/**
 * Garde d'exécution serveur (TEC-13, architecture P2, D1).
 *
 * D1 pose que le navigateur ne parle qu'à Next.js, et qu'aucune clé n'existe
 * dans le bundle client. Cette garde rend la règle **exécutable** : un module
 * serveur importé par mégarde depuis un composant client lève immédiatement,
 * avec le nom du module fautif, au lieu de laisser la valeur se faire inliner
 * par le compilateur.
 *
 * Pourquoi pas le paquet `server-only` de Next : il n'est pas dans les
 * dépendances validées en P2 (§15.1), et l'architecture refuse toute
 * dépendance sans exigence qui la justifie. Une fonction de quatre lignes
 * couvre le même besoin.
 *
 * Ce que cette garde NE prouve PAS : qu'aucun secret ne se trouve dans le
 * bundle. Seul l'artefact construit le prouve — c'est l'invariant I1 de
 * `scripts/verifier-socle.mjs`, qui lit `.next/static`.
 */
export function garderServeur(module: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${module} est un module serveur (TEC-13). Il ne doit être importé ni par un composant client, ni par un hook.`,
    );
  }
}
