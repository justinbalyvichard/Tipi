import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Vitest (TEC-14, `10-stack.mdc`).
 *
 * V1 n'apporte qu'un fichier de test, celui de PRD-02, et la configuration
 * minimale pour l'exécuter. La suite complète, Testing Library et msw sont
 * livrées par la phase P5 : cette configuration est faite pour être étendue,
 * pas remplacée.
 *
 * `environment: "node"` : le calcul d'âge ne touche pas au DOM. P5 ajoutera un
 * environnement `jsdom` pour les tests de composants.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@content": fileURLToPath(new URL("./content", import.meta.url)),
    },
  },
});
