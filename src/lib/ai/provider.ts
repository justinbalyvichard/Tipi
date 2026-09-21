/**
 * `AiProvider` — la frontière de TEC-17 (P2, §5.1).
 *
 * **Ce fichier ne mentionne aucun fournisseur**, et c'est lui, pas l'absence de
 * SDK, qui porte le confinement : un `fetch` brut fuit aussi bien qu'un SDK
 * s'il est écrit ailleurs.
 *
 * Il ne mentionne pas davantage l'enfant. Aucune signature n'accepte un
 * `Child`, un `prenom`, un `childId`, un `Buffer` ni une URL : la barrière 1 de
 * SEC-04 est une propriété du **type**, pas une consigne de revue. Envoyer la
 * photo au modèle de langage — ce que TEC-05 interdit nommément, parce que le
 * modèle vision réduit chaque image à environ 1024 jetons et n'est pas fiable
 * sur de l'écriture manuscrite d'enfant photographiée au smartphone — exige de
 * changer cette interface, donc un diff que personne ne signe par distraction.
 *
 * ---------------------------------------------------------------------------
 * UN ÉCART DÉCLARÉ PAR RAPPORT À P2 §5.1 : LA TRACE
 * ---------------------------------------------------------------------------
 * L'architecture écrit `structurerDevoir(texteOcr: string): Promise<DevoirStructure>`.
 * Cette signature est **incompatible avec TEC-16**, qui exige de journaliser
 * « le payload d'IA anonymisé réellement envoyé, la réponse brute, le code
 * d'erreur éventuel, le seuil en vigueur et la durée ». Une méthode qui ne rend
 * que la valeur métier ne permet pas de journaliser ce qui est parti : il
 * faudrait le reconstruire, c'est-à-dire journaliser une **re-dérivation** de
 * ce qu'on croit avoir envoyé — exactement ce que `40-protocole-agents.mdc`
 * demande d'éviter, et exactement ce que la preuve de SEC-04 en P2 §6 refuse
 * (« le test n'a pas besoin de faire confiance au code : il lit en base ce qui
 * est réellement parti »).
 *
 * Les trois méthodes rendent donc `ResultatIa<T>` : la valeur validée **et** la
 * trace de l'appel. L'entrée, elle, est inchangée — la propriété qui compte,
 * « aucune donnée identifiante n'entre », est intacte.
 */
import type { CorpsIa, TexteAnonymise } from "@/lib/ai/anonymisation";
import type {
  DevoirStructure,
  QuatreIndices,
  QuestionsLecture,
} from "@/lib/ai/schemas";

/** Ce qu'un exercice de maths donne à lire au modèle. Trois chaînes, rien d'autre. */
export interface TexteExercice {
  readonly consigne: string;
  readonly contenu: string;
  readonly type?: string;
}

/**
 * Ce qui est réellement parti et ce qui est réellement revenu (TEC-16).
 * `payload` est le corps émis **au signe près**, tel qu'il sera écrit dans
 * `calibration_log.payload_ia`.
 */
export interface TraceAppelIa {
  readonly promptId: string;
  readonly promptVersion: string;
  readonly payload: CorpsIa;
  /** Réponse brute du fournisseur, avant validation Zod. `null` si rien n'est revenu. */
  readonly reponseBrute: string | null;
  /** 1 ou 2. Une sortie non conforme est rejouée **une fois** (3.2, étape 4). */
  readonly tentatives: number;
  readonly dureeMs: number;
  /**
   * Code applicatif si cet appel a échoué, `null` sinon. AJOUTÉ AU TOUR 2 :
   * TEC-16 demande de journaliser « le code d'erreur éventuel », et une trace
   * qui ne le porte pas oblige l'appelant à le reconstituer.
   */
  readonly erreurCode: string | null;
}

export interface ResultatIa<T> {
  readonly valeur: T;
  readonly trace: TraceAppelIa;
}

/**
 * ---------------------------------------------------------------------------
 * SECOND ÉCART DÉCLARÉ SUR CETTE INTERFACE — CORRECTION DU [BLOQUANT] B1
 * ---------------------------------------------------------------------------
 * Les trois méthodes prenaient une `string` (et `TexteExercice` pour la
 * deuxième), comme P2 §5.1 l'écrit. Elles prennent désormais un
 * `TexteAnonymise`. Ce n'est pas un affaiblissement de la barrière 1, c'est son
 * **renforcement** : la frontière n'accepte plus seulement « aucune donnée
 * identifiante », elle n'accepte plus qu'un texte **dont le passage par le
 * caviardage est prouvé par son type**.
 *
 * `TexteExercice` n'est pas supprimé : il reste la forme structurée que
 * l'appelant compose (`texteDePrompt`) **avant** d'anonymiser. La structure
 * existe toujours, une couche plus tôt — du côté qui connaît le foyer.
 */
export interface AiProvider {
  readonly nom: string;
  /** Prompt 1 — texte OCR normalisé, anonymisé par construction. */
  structurerDevoir(texteOcr: TexteAnonymise): Promise<ResultatIa<DevoirStructure>>;
  /** Prompt 2 — PED-01, PED-02, TEC-07. */
  genererIndices(exercice: TexteAnonymise): Promise<ResultatIa<QuatreIndices>>;
  /**
   * Prompt 3 — 3.4. Consommé par V4 ; aucune colonne ne le stocke en V2.
   * [MINEUR] N5 : il héritait de B1 et l'aurait rouvert en V4 sur un chemin
   * **nominal**. Il est couvert par le même type, donc par le même correctif.
   */
  genererQuestions(texte: TexteAnonymise): Promise<ResultatIa<QuestionsLecture>>;
}
