/**
 * Taxonomie d'erreurs (P2, §10.1) — une union TypeScript FERMÉE, jamais des
 * chaînes libres. Chaque code porte trois choses : son statut HTTP, la clé de
 * contenu à afficher, et le public concerné.
 *
 * Deux règles opposables (P2, §10.1) :
 *  1. Aucun code technique n'est jamais affiché, ni à l'enfant ni au parent.
 *     Le code sert au journal serveur et au choix de la clé, rien d'autre.
 *  2. Aucune clé d'erreur destinée à l'enfant ne désigne l'enfant comme cause :
 *     le sujet est Pilou, le micro, ou la photo (PED-09).
 *
 * PRD-16 : chaque état a une clé de contenu et donc un écran avec un bouton.
 * Aucun état n'est une impasse — la correspondance est en P2 §10.2.
 *
 * `cleContenu` peut être une clé exacte ou une FAMILLE, suffixée `.*` : la
 * famille désigne le groupe titre/corps/bouton d'un même état, dont le tableau
 * de P2 §10.1 ne nomme pas les membres un par un. L'invariant I3 de
 * `scripts/verifier-socle.ts` vérifie que chaque clé et chaque famille est
 * réellement portée par `content/`.
 */

/** Public destinataire du message. `aucun` = jamais montré. */
export type PublicErreur = "enfant" | "parent" | "aucun";

/** Où l'erreur naît. Un code `client` ne traverse jamais le réseau (P2, §10.1). */
export type OrigineErreur = "serveur" | "client";

export interface DescriptionErreur {
  /** Statut HTTP, ou `null` pour un code purement client. */
  readonly http: number | null;
  readonly public: PublicErreur;
  /** Clé exacte, famille suffixée `.*`, ou `null` quand rien n'est montré. */
  readonly cleContenu: string | null;
  readonly origine: OrigineErreur;
}

export const CODES_ERREUR = {
  TIPI_VALIDATION: { http: 400, public: "parent", cleContenu: null, origine: "serveur" },
  TIPI_INTROUVABLE: { http: 404, public: "parent", cleContenu: "reglages.echec.sauvegarde", origine: "serveur" },
  TIPI_INTERNE: { http: 500, public: "aucun", cleContenu: null, origine: "serveur" },

  TIPI_FICHIER_TROP_GRAND: { http: 413, public: "parent", cleContenu: "parent.scan.envoi_echec.*", origine: "serveur" },
  TIPI_FORMAT_REFUSE: { http: 415, public: "parent", cleContenu: "parent.scan.envoi_echec.*", origine: "serveur" },
  TIPI_UPLOAD_ECHEC: { http: 502, public: "parent", cleContenu: "parent.scan.envoi_echec.*", origine: "serveur" },

  /**
   * AJOUTÉ PAR V2 — comblement d'un trou de l'architecture, déclaré.
   *
   * P2 §8.2 donne `409 TIPI_DEJA_ANALYSE` comme erreur de
   * `DELETE /api/devoirs/photo/{homeworkId}`, mais le tableau §10.1 ne le
   * déclare pas : le code était nommé par un contrat de route et absent de la
   * taxonomie fermée, donc inécrivable. Il rejoint ici la famille de
   * `TIPI_TRANSITION_INVALIDE` — aucun message, parce que c'est une garde et
   * non un état limite : l'écran parent ne propose plus de retirer une photo
   * une fois l'analyse faite. Un `cleContenu` inventé aurait créé une clé
   * fantôme que l'invariant I3 aurait signalée à juste titre.
   */
  TIPI_DEJA_ANALYSE: { http: 409, public: "aucun", cleContenu: null, origine: "serveur" },

  TIPI_OCR_VIDE: { http: 422, public: "parent", cleContenu: "parent.scan.illisible.*", origine: "serveur" },
  TIPI_OCR_CONFIANCE_BASSE: { http: 422, public: "parent", cleContenu: "parent.scan.illisible.*", origine: "serveur" },
  TIPI_AUCUN_EXERCICE: { http: 422, public: "parent", cleContenu: "parent.apercu.vide.*", origine: "serveur" },

  TIPI_IA_SORTIE_INVALIDE: { http: 502, public: "parent", cleContenu: "parent.scan.analyse_echec.*", origine: "serveur" },
  TIPI_IA_INDISPONIBLE: { http: 502, public: "parent", cleContenu: "parent.scan.analyse_echec.*", origine: "serveur" },
  TIPI_IA_TIMEOUT: { http: 504, public: "parent", cleContenu: "parent.scan.analyse_echec.*", origine: "serveur" },
  /** SEC-04 — l'appel n'est jamais émis. Rien n'est montré. */
  TIPI_PAYLOAD_NON_ANONYME: { http: 500, public: "aucun", cleContenu: null, origine: "serveur" },

  TIPI_SESSION_INTROUVABLE: { http: 404, public: "enfant", cleContenu: "enfant.accueil.souci.*", origine: "serveur" },
  TIPI_SESSION_DEJA_ACTIVE: { http: 409, public: "parent", cleContenu: "parent.apercu.lancement_echec.*", origine: "serveur" },
  TIPI_ETAPE_SANS_EXERCICE: { http: 400, public: "parent", cleContenu: "parent.apercu.vide.*", origine: "serveur" },
  TIPI_ETAPES_MEME_MATIERE: { http: 400, public: "parent", cleContenu: "parent.apercu.echec.*", origine: "serveur" },
  /** Aucun message : le client se recale sur le snapshot (P2, §10.1). */
  TIPI_TRANSITION_INVALIDE: { http: 409, public: "aucun", cleContenu: null, origine: "serveur" },
  TIPI_ABANDON_NON_AUTORISE: { http: 403, public: "parent", cleContenu: "reglages.code.refuse", origine: "serveur" },
  /** Code CLIENT : il naît d'une requête qui n'est jamais partie (P2, §9.4). */
  TIPI_TRANSITION_NON_DELIVREE: { http: null, public: "enfant", cleContenu: "bravo.pierres_plus_tard*", origine: "client" },

  TIPI_TTS_INDISPONIBLE: { http: 502, public: "enfant", cleContenu: "lecture.sans_voix.*", origine: "serveur" },
  TIPI_TTS_QUOTA: { http: 429, public: "enfant", cleContenu: "lecture.sans_voix.*", origine: "serveur" },
  TIPI_STT_INDISPONIBLE: { http: null, public: "enfant", cleContenu: "lecture.micro_absent.*", origine: "client" },
  TIPI_MICRO_REFUSE: { http: null, public: "enfant", cleContenu: "lecture.micro_absent.*", origine: "client" },
  TIPI_TRANSCRIPTION_VIDE: { http: null, public: "enfant", cleContenu: "lecture.pas_entendu.*", origine: "client" },
  TIPI_INDICES_INDISPONIBLES: { http: 502, public: "enfant", cleContenu: "maths.sans_indice.*", origine: "serveur" },

  TIPI_COSMETIQUE_VERROUILLE: { http: 403, public: "enfant", cleContenu: "coffre.cosmetiques.verrouille", origine: "serveur" },
  TIPI_COFFRE_INDISPONIBLE: { http: 502, public: "enfant", cleContenu: "coffre.souci.*", origine: "serveur" },

  TIPI_CODE_INVALIDE: { http: 401, public: "parent", cleContenu: "reglages.code.refuse", origine: "serveur" },
  TIPI_CODE_BLOQUE: { http: 423, public: "parent", cleContenu: "reglages.code.bloque.*", origine: "serveur" },
  /** Bascule en mode création : aucun message d'échec n'est montré. */
  TIPI_CODE_ABSENT: { http: 409, public: "parent", cleContenu: null, origine: "serveur" },
  TIPI_CODE_LONGUEUR: { http: 400, public: "parent", cleContenu: "reglages.code.creation.longueur", origine: "serveur" },
  TIPI_CODE_DISCORDANT: { http: 400, public: "parent", cleContenu: "reglages.code.creation.discordance", origine: "serveur" },
  TIPI_REGLAGES_EXPIRE: { http: 401, public: "parent", cleContenu: "reglages.session_expiree", origine: "serveur" },

  TIPI_AUDIO_PURGE: { http: 404, public: "parent", cleContenu: "parent.resume.audio_absent", origine: "serveur" },
  TIPI_EXPORT_ECHEC: { http: 502, public: "parent", cleContenu: "reglages.echec.export", origine: "serveur" },
  TIPI_SUPPRESSION_ECHEC: { http: 502, public: "parent", cleContenu: "reglages.echec.suppression", origine: "serveur" },
  TIPI_NON_IMPLEMENTE: { http: 501, public: "aucun", cleContenu: null, origine: "serveur" },
} as const satisfies Record<string, DescriptionErreur>;

export type CodeErreur = keyof typeof CODES_ERREUR;

export const TOUS_LES_CODES = Object.keys(CODES_ERREUR) as readonly CodeErreur[];

export function estCodeErreur(valeur: string): valeur is CodeErreur {
  return Object.prototype.hasOwnProperty.call(CODES_ERREUR, valeur);
}

export function descriptionDe(code: CodeErreur): DescriptionErreur {
  return CODES_ERREUR[code];
}
