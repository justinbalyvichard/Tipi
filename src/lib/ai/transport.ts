/**
 * `AiTransport` — la seule chose qu'un fournisseur a le droit d'être.
 *
 * P2 §6, barrière 2 : « `providers/deepseek.ts` n'a pas le droit de construire
 * son corps de requête lui-même ; il reçoit un `PayloadIa` déjà scellé. » Cette
 * interface **rend la phrase exécutable**, et va un pas plus loin, parce que la
 * phrase seule ne suffisait pas : un transport qui reçoit un payload scellé
 * peut toujours ajouter un champ à son corps avant d'appeler `fetch`.
 *
 * D'où la séparation en **deux méthodes** :
 *
 *  - `corps()` fabrique le corps et ne touche pas au réseau ;
 *  - `emettre()` touche au réseau et ne fabrique rien.
 *
 * Entre les deux, `src/lib/ai/execution.ts` fait passer l'invariant de
 * dérivabilité de SEC-04. Le réseau est donc **physiquement inatteignable**
 * avant que l'invariant ne soit vert : ce n'est pas un ordre d'appel qu'on
 * recommande, c'est le seul ordre que les types permettent.
 *
 * Ce qu'un transport connaît, et c'est tout : la forme du corps de requête, le
 * nom du modèle, la forme de la réponse, l'adresse du point d'entrée. Ce qu'il
 * ne connaît pas : les prompts, les schémas de sortie, la relance, la
 * journalisation de calibration, et bien sûr le foyer.
 *
 * Conséquence pour TEC-17 : passer à un modèle hébergé en UE, c'est écrire un
 * fichier dans `src/lib/ai/providers/`, l'enregistrer dans la fabrique, changer
 * `AI_PROVIDER`. Zéro ligne modifiée ailleurs.
 */
import type { CorpsIa, PayloadIa } from "@/lib/ai/anonymisation";

export interface AiTransport {
  readonly nom: string;
  /**
   * Valeurs de configuration légitimes qui apparaissent dans le corps — le nom
   * du modèle, typiquement. Elles élargissent le vocabulaire autorisé par
   * l'invariant de dérivabilité de SEC-04, et **uniquement lui**. Elles
   * viennent de l'environnement du serveur, jamais d'une requête, et
   * `src/lib/ai/**` n'a aucun chemin d'accès à la base (invariant C2 de
   * `scripts/verifier-confinement.ts`).
   */
  readonly vocabulaire: readonly string[];

  /** Fabrique le corps à partir du payload scellé. **Aucun accès réseau.** */
  corps(payload: PayloadIa): CorpsIa;

  /**
   * Émet le corps **déjà contrôlé** et rend la réponse brute.
   * **Ne fabrique aucun contenu.**
   */
  emettre(corps: CorpsIa, signal: AbortSignal): Promise<string>;
}
