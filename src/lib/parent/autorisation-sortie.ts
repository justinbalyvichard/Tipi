/**
 * PRD-13 — l'autorisation de la sortie anticipée — **SERVEUR UNIQUEMENT**.
 *
 * ---------------------------------------------------------------------------
 * UN BOUCHON STRUCTUREL, ET NON CONDITIONNEL (ESC-000, ARB-09)
 * ---------------------------------------------------------------------------
 * `ABANDON_PARENT` exige un cookie parent de portée `sortie_session`, signé
 * avec `PARENT_SESSION_SECRET`, obtenu par `POST /api/reglages/code/verifier`.
 * **Ce mécanisme appartient à V7** (PRD-15, SEC-01, SEC-02), et ARB-09 pose
 * que la clôture normale d'une session ne dépend d'aucun élément de V7.
 *
 * V3 livre donc l'**interface**, et une implémentation qui **refuse toujours**.
 * Ce n'est pas un `if (process.env.NODE_ENV === "test")` ni un drapeau : c'est
 * une implémentation nommée, `RefusTantQueV7Manque`, qu'une autre remplace en
 * V7 sans qu'aucune ligne de la machine, du service ou de la route ne change.
 * Un bouchon conditionnel aurait laissé une porte ouverte derrière une
 * variable ; celui-ci laisse une porte fermée derrière un type.
 *
 * Conséquence assumée et déclarée : **T10 est implémentée, testée, et
 * inatteignable depuis HTTP tant que V7 n'a pas livré le cookie.** Elle est
 * atteignable depuis le service, ce qui est exactement ce dont les tests et le
 * rattrapage ont besoin.
 */
import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/lib/parent/autorisation-sortie.ts");

/**
 * La porte de PRD-13. Elle ne rend pas un booléen nu mais un verdict motivé :
 * une autorisation qui se réduit à `true`/`false` se neutralise en une ligne,
 * et le motif est ce qu'un contrôleur lit.
 */
export interface AutorisationSortie {
  readonly nom: string;
  /** `null` = autorisé. Une chaîne = le motif du refus, pour le journal serveur. */
  autoriserSortieSession(requete: Request): Promise<string | null>;
}

/**
 * L'implémentation de V3. Refuse **toujours**, en nommant la raison.
 *
 * Elle ne lit pas la requête : il n'y a rien à y lire tant qu'aucun cookie
 * n'est émis. La signature la reçoit quand même, pour que V7 n'ait pas à
 * changer l'interface — seulement à fournir une autre implémentation.
 */
export const REFUS_TANT_QUE_V7_MANQUE: AutorisationSortie = Object.freeze({
  nom: "RefusTantQueV7Manque",
  autoriserSortieSession(_requete: Request): Promise<string | null> {
    return Promise.resolve(
      "PRD-13 exige un cookie parent de portée sortie_session ; il est émis par V7, qui n'est pas livrée (ARB-09).",
    );
  },
});

/**
 * L'autorisation en vigueur. Une seule fabrique, pour que le jour où V7 livre
 * le cookie, **un seul fichier** change — et que ce changement soit un diff
 * visible, pas un drapeau qui bascule.
 */
export function autorisationSortie(): AutorisationSortie {
  return REFUS_TANT_QUE_V7_MANQUE;
}
