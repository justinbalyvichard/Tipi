/**
 * Variables d'environnement — **SERVEUR UNIQUEMENT** (TEC-13).
 *
 * Ce module ne doit jamais être atteint par un composant client. Il n'existe
 * pas de paquet `server-only` dans les dépendances validées (architecture P2,
 * §15.1) : la garde est donc explicite et exécutable, `garderServeur()`.
 * Un import fautif casse au premier rendu navigateur, jamais en silence.
 *
 * Classement, décision d'architecture (P2, §11) :
 *  - CRITIQUES   : leur absence REFUSE le démarrage, avec le nom de la
 *                  variable dans le message. Six variables.
 *  - DÉGRADABLES : leur absence bascule une fonctionnalité en repli
 *                  bienveillant. Une clé d'IA manquante ne doit pas empêcher
 *                  un enfant de faire sa lecture.
 *
 * Les 27 variables sont celles du tableau P2 §11 et de `.env.example`.
 */
import { z } from "zod";

import { garderServeur } from "@/lib/runtime/garde-serveur";

garderServeur("src/config/env.ts");

/**
 * ---------------------------------------------------------------------------
 * UNE CONFIGURATION NEUTRE EST UNE PROTECTION DÉBRANCHÉE — leçon du tour 2
 * ---------------------------------------------------------------------------
 * `controle-code` a neutralisé le caviardage de SEC-04 en lui passant une liste
 * d'interdits **vide** : la fonction a tourné, elle n'avait rien à retirer, et
 * tous les instruments sont restés verts ([MAJEUR] M5). La faute n'est pas
 * propre à cette liste — **elle est propre à toute valeur dont la neutralité
 * éteint une garde en silence.**
 *
 * L'Orchestrateur a demandé de chercher la même faute ailleurs plutôt que de
 * corriger seulement celle-ci. Voici ce que j'ai trouvé dans ce fichier, et
 * chaque borne ci-dessous dit **ce que la valeur neutre éteindrait** :
 *
 *   OCR_CONFIANCE_MIN = 0        toute photo, si illisible soit-elle, passe.
 *                                L'état « illisible » de PRD-16 devient
 *                                inatteignable.
 *   LECTURE_TOLERANCE_MOT = 0    plus aucune tolérance : V4 jugerait faux tout
 *                                ce qui n'est pas identique au signe près.
 *   LECTURE_SEUIL_MOTS_OK = 0    toute lecture est « réussie », donc PED-09
 *                                n'a plus rien à juger.
 *   CALIBRATION_NB_PHOTOS = 0    `calibration_log` n'est jamais écrit, donc la
 *                                preuve de SEC-04 en base (P2 §6) disparaît
 *                                sans un mot. Pour couper la calibration, il
 *                                existe `family.calibration_active`.
 *   BLOCAGE_NB_SOLLICITATIONS=0  PED-08 ne détecte plus aucun blocage.
 *   AI_TIMEOUT_MS = 0            tout appel est abandonné avant de partir.
 *   CODE_MAX_TENTATIVES = 0      SEC-02 n'a plus de palier.
 *   PARENT_SESSION_TTL_MIN = 0   la session parent expire avant d'exister.
 *   DUREE_SECOURS_ETAPE_MIN = 0  une étape de zéro minute, refusée plus tard
 *                                par `EtapePrevue` — donc un défaut qui
 *                                n'apparaîtrait qu'au lancement de la soirée.
 *   UPLOAD_MAX_*_OCTETS = 0      plus aucune photo n'est acceptée.
 *
 * Une seule valeur neutre reste **légitime** et n'est donc pas bornée :
 * `AUDIO_RETENTION_JOURS_DEFAUT = 0`, que `prisma/schema.prisma` documente
 * explicitement comme « ne rien conserver » (SEC-05). Une exception nommée
 * n'est pas un trou ; une exception tacite en serait un.
 */

/** Entier écrit en chaîne. `min` refuse la valeur qui éteindrait une garde. */
const entier = (defaut: number, min = 1) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? String(defaut) : v))
    .pipe(z.coerce.number().int().min(min));

/**
 * Nombre décimal dans `]0,1]`, pour les seuils de confiance et de tolérance.
 * **Strictement positif** : voir l'encadré ci-dessus.
 */
const unitaire = (defaut: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? String(defaut) : v))
    .pipe(z.coerce.number().gt(0).max(1));

/** Chaîne non vide, avec valeur de repli. */
const texte = (defaut: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? defaut : v));

/** Chaîne non vide SANS repli : son absence est une erreur. */
const obligatoire = z.string().min(1);

const schemaEnv = z.object({
  // --- Critiques : sans elles, le serveur ne démarre pas -------------------
  DATABASE_URL: obligatoire,
  DIRECT_URL: obligatoire,
  SUPABASE_URL: obligatoire,
  SUPABASE_SERVICE_ROLE_KEY: obligatoire,
  PARENT_SESSION_SECRET: obligatoire,
  CRON_SECRET: obligatoire,

  // --- Dégradables : absence = repli bienveillant --------------------------
  UPLOAD_MAX_PHOTO_OCTETS: entier(8_388_608),
  UPLOAD_MAX_AUDIO_OCTETS: entier(10_485_760),

  AI_PROVIDER: texte("deepseek"),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: texte("https://api.deepseek.com"),
  DEEPSEEK_MODEL: texte("deepseek-chat"),
  AI_TIMEOUT_MS: entier(20_000, 1_000),

  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  /**
   * AJOUTÉE PAR V2, hors des 27 variables du tableau P2 §11 — écart déclaré.
   *
   * §11 suppose que l'absence de `GOOGLE_SERVICE_ACCOUNT_JSON` suffit à
   * dégrader l'OCR. C'est vrai d'une dégradation en production, faux d'un
   * développement : sans compte externe (ESC-000), un pipeline qui ne sait
   * qu'échouer n'est testable sur aucun de ses cinq étages. §5.4 de la même
   * architecture pose `OcrProvider` en prévoyant un remplacement après
   * calibration — une fabrique sans sélecteur n'en est pas une.
   *
   * Valeurs : `google-vision` (défaut, TEC-05) ou `bouchon`.
   */
  OCR_PROVIDER: texte("google-vision"),
  VOICE_PROVIDER: texte("google-chirp3"),

  PARENT_SESSION_TTL_MIN: entier(5),
  CODE_MAX_TENTATIVES: entier(5),
  /**
   * DOUZIÈME VALEUR NEUTRALISABLE, trouvée par `controle-code` au tour 3
   * ([MAJEUR] M6 b) dans le fichier que le tour 3 déclarait avoir balayé.
   *
   * La validation du tour 3 contrôlait la **forme** de la liste et jamais ses
   * valeurs : `"0"` et `"0,0,0,0"` étaient acceptés, et **SEC-02 devenait un
   * blocage de zéro seconde, c'est-à-dire aucun blocage** — sur le seul verrou
   * qui sépare l'enfant des Réglages. C'est la forme exacte de l'attaque du
   * tour 2, portée sur une autre exigence : une liste non vide dont le contenu
   * est neutre. Et la valeur est plausible : c'est ce qu'on écrit pour
   * désactiver le blocage pendant une mise au point, et que V7 hériterait sans
   * le savoir.
   */
  CODE_BLOCAGE_PALIERS_SEC: texte("60,300,900,3600")
    .pipe(
      z
        .string()
        .regex(
          /^\d+(,\d+)*$/u,
          "CODE_BLOCAGE_PALIERS_SEC : liste d'entiers séparés par des virgules.",
        ),
    )
    .refine(
      (v) => v.split(",").every((palier) => Number.parseInt(palier, 10) >= 1),
      "CODE_BLOCAGE_PALIERS_SEC : chaque palier vaut au moins 1 seconde. Un palier nul éteint le blocage progressif de SEC-02.",
    ),

  OCR_CONFIANCE_MIN: unitaire(0.7),
  LECTURE_TOLERANCE_MOT: unitaire(0.34),
  LECTURE_SEUIL_MOTS_OK: unitaire(0.6),
  BLOCAGE_NB_SOLLICITATIONS: entier(3),
  CALIBRATION_NB_PHOTOS: entier(20),
  /**
   * AJOUTÉE PAR V2, hors des 27 variables du tableau P2 §11 — écart déclaré.
   *
   * Durée estimée d'une étape lorsque **aucun modèle ne l'a estimée** : c'est
   * le cas de la saisie manuelle jouée sans fournisseur d'IA, que P2 §11 pose
   * nommément comme devant rester possible (« une soirée reste possible »).
   * Le contrat de `POST /api/devoirs/analyse` exige une durée ; il fallait donc
   * un nombre, et TEC-16 exige qu'un nombre réglable vive en configuration et
   * non en constante dispersée. Valeur de départ, à régler sur du réel comme
   * les cinq autres.
   */
  DUREE_SECOURS_ETAPE_MIN: entier(10),

  // Seule valeur neutre légitime du fichier : 0 = ne rien conserver (SEC-05).
  AUDIO_RETENTION_JOURS_DEFAUT: entier(7, 0),
});


/**
 * ---------------------------------------------------------------------------
 * LE DÉNOMINATEUR — CLASSEMENT DE NEUTRALITÉ DES 26 VARIABLES SERVEUR
 * ---------------------------------------------------------------------------
 * AJOUTÉ AU TOUR 4 de G4.V2, et ces tables vivent **ici** plutôt que dans le
 * fichier de tests pour deux raisons, la seconde étant la bonne :
 *
 *  1. `src/config/env.ts` est, avec `src/lib/ai/providers/` et
 *     `src/lib/ai/index.ts`, l'un des trois fichiers que la règle de P2 §5.1
 *     autorise à nommer le fournisseur — et un classement exhaustif doit
 *     nommer `DEEPSEEK_API_KEY` comme les autres. Le contrôle C1 a d'ailleurs
 *     mordu quand ces tables étaient dans le test, et il avait raison ;
 *  2. surtout : c'est ici que viendra la verticale qui ajoutera une variable.
 *     Le classement doit être sous ses yeux au moment où elle écrit la ligne,
 *     pas dans un fichier de tests qu'elle ouvrira peut-être.
 *
 * `src/config/neutralisations.test.ts` les compare à `.env.example` — seul
 * document qui déclare toutes les variables — et aux cas réellement exécutés.
 * **Une variable ajoutée sans classement fait rougir le test**, et un classement
 * dont la variable a disparu aussi.
 *
 * Pourquoi un dénominateur : `controle-code` a relevé aux tours 1, 2 et 3 trois
 * écarts de la même famille — « onze valeurs quand il y en a douze », « deux
 * tables gardées sur sept », « une forme de lint sur trois ». Tous du même
 * motif : **mesurer ce qu'on a couvert, et non ce qu'il y avait à couvrir.**
 * Corriger la douzième valeur ne corrige pas la famille ; un dénominateur
 * dérivé, si.
 */

export const REFUSENT_LE_NEUTRE: Readonly<Record<string, string>> = Object.freeze({
  UPLOAD_MAX_PHOTO_OCTETS: "Zéro refuserait toute photo : PRD-03 deviendrait injouable.",
  UPLOAD_MAX_AUDIO_OCTETS: "Zéro refuserait tout enregistrement : l'étape lecture de V4 perdrait sa trace.",
  AI_TIMEOUT_MS: "Zéro abandonnerait chaque appel avant qu'il ne parte.",
  PARENT_SESSION_TTL_MIN: "Zéro ferait expirer la session parent avant qu'elle n'existe (PRD-15).",
  CODE_MAX_TENTATIVES: "Zéro priverait SEC-02 de tout palier de tentatives.",
  CODE_BLOCAGE_PALIERS_SEC: "Des paliers nuls font un blocage de zéro seconde : SEC-02 sans blocage.",
  OCR_CONFIANCE_MIN: "Zéro accepterait toute photo, si illisible soit-elle : l'état « illisible » de PRD-16 deviendrait inatteignable.",
  LECTURE_TOLERANCE_MOT: "Zéro supprimerait la tolérance de lecture souhaitée par 3.4.",
  LECTURE_SEUIL_MOTS_OK: "Zéro déclarerait toute lecture réussie : PED-09 n'aurait plus rien à juger.",
  BLOCAGE_NB_SOLLICITATIONS: "Zéro éteindrait la détection de blocage de PED-08.",
  CALIBRATION_NB_PHOTOS: "Zéro n'écrirait jamais calibration_log, donc supprimerait la preuve de SEC-04 en base (P2 §6).",
  DUREE_SECOURS_ETAPE_MIN: "Zéro produirait une étape de zéro minute, refusée bien plus tard par V3.",
});

export const NEUTRE_LEGITIME: Readonly<Record<string, string>> = Object.freeze({
  AUDIO_RETENTION_JOURS_DEFAUT:
    "Zéro signifie « ne rien conserver » (SEC-05), et jamais « purge désactivée » : la lecture est fixée par le test de la section 3, qui la dérive du schéma.",
});

export const SANS_VALEUR_NEUTRE: Readonly<Record<string, string>> = Object.freeze({
  DATABASE_URL: "Chaîne de connexion. Son absence refuse le démarrage ; une chaîne vide n'est pas une valeur neutre, c'est une absence.",
  DIRECT_URL: "Chaîne de connexion directe. Même raisonnement, et c'est le rôle sous lequel policies.sql est joué.",
  SUPABASE_URL: "Point d'entrée Storage. Son absence refuse le démarrage.",
  SUPABASE_SERVICE_ROLE_KEY: "Secret d'accès total. Son absence refuse le démarrage ; aucune valeur intermédiaire n'éteint de garde.",
  PARENT_SESSION_SECRET: "Secret de signature. Son absence refuse le démarrage, précisément pour qu'aucun défaut ne serve de valeur neutre.",
  CRON_SECRET: "Secret de la route de purge. Son absence refuse le démarrage, sans quoi la route serait ouverte.",
  DEEPSEEK_API_KEY: "Clé du fournisseur. Son absence est un repli déclaré par P2 §11 — TIPI_IA_INDISPONIBLE et saisie manuelle — et non une garde éteinte en silence.",
  GOOGLE_SERVICE_ACCOUNT_JSON: "Compte de service. Même repli déclaré : OCR indisponible, saisie manuelle ouverte.",
  AI_PROVIDER: "Nom d'implémentation. Une valeur inconnue LÈVE, elle ne se replie pas en silence sur un défaut.",
  OCR_PROVIDER: "Nom d'implémentation. Même comportement : une valeur inconnue lève.",
  VOICE_PROVIDER: "Nom d'implémentation, consommé par V4. Une valeur inconnue lèvera de même.",
  DEEPSEEK_BASE_URL: "Adresse du point d'entrée. Une adresse injoignable produit TIPI_IA_INDISPONIBLE, chemin d'erreur déclaré et éprouvé.",
  DEEPSEEK_MODEL: "Nom du modèle appelé. Sa neutralité n'éteint aucune garde ; sa forme est contrôlée là où elle compte, dans le vocabulaire de (A).",
});

export type Env = z.infer<typeof schemaEnv>;

/**
 * Les six variables dont l'absence refuse le démarrage. Déclarées ici comme
 * une donnée, et non dispersées dans des `if` : c'est cette liste que le
 * message d'erreur nomme, et c'est elle qu'un contrôleur relit.
 */
export const VARIABLES_CRITIQUES = [
  "DATABASE_URL",
  "DIRECT_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PARENT_SESSION_SECRET",
  "CRON_SECRET",
] as const;

let cache: Env | undefined;

/**
 * Parse et gèle l'environnement serveur. Le premier appel valide ; les
 * suivants rendent le même objet gelé.
 *
 * Échec = `Error` nommant chaque variable fautive. Jamais une valeur : un
 * message d'erreur ne doit pas imprimer un secret (SEC-01, SEC-08).
 */
export function env(): Env {
  garderServeur("src/config/env.ts");
  if (cache !== undefined) return cache;

  const resultat = schemaEnv.safeParse(process.env);
  if (!resultat.success) {
    const noms = resultat.error.issues
      .map((i) => i.path.join("."))
      .filter((n, i, t) => n !== "" && t.indexOf(n) === i)
      .sort();
    throw new Error(
      `Configuration invalide. Variables d'environnement à corriger : ${noms.join(
        ", ",
      )}. Voir .env.example et docs/agents/P2/architecture.out.md §11.`,
    );
  }

  cache = Object.freeze(resultat.data);
  return cache;
}

/** Remet le cache à zéro. Réservé aux tests ; aucun appel applicatif. */
export function reinitialiserEnvPourTest(): void {
  cache = undefined;
}
