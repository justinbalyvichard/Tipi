/**
 * Transport d'IA **bouchonné** — `AI_PROVIDER="bouchon"`.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI IL EXISTE, ET POURQUOI IL EST STRUCTUREL
 * ---------------------------------------------------------------------------
 * Aucun compte externe n'existe (ESC-000). Le bouchonnage est donc **une
 * implémentation de plus derrière l'interface**, choisie par configuration, et
 * jamais un `if (pas de clé)` dans le code applicatif. La leçon vient de V1 :
 * un repli conditionnel disperse la décision dans le produit, et personne ne
 * sait plus, en lisant un écran, contre quoi il tourne.
 *
 * Conséquence directe, et c'est le but : **le bouchon emprunte exactement le
 * même chemin que le vrai fournisseur.** Le payload est scellé de la même
 * façon, l'invariant de dérivabilité de SEC-04 s'applique, la sortie est
 * validée par le même schéma Zod, une sortie non conforme est rejouée une fois.
 * Brancher DeepSeek le jour où la clé existe est un changement de valeur dans
 * `.env.local`, pas une réécriture.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL PRODUIT
 * ---------------------------------------------------------------------------
 * Des sorties déterministes, dérivées du texte reçu. Ce ne sont pas des textes
 * de produit : ils tiennent la place de ce qu'un modèle rendrait, comme la
 * photo d'épreuve tient la place d'une vraie photo. Ils ne passent pas par
 * `content/` pour la même raison qu'une sortie de modèle n'y passe pas —
 * `content/` porte les textes **que le produit écrit**, pas ceux qu'il reçoit.
 *
 * Les quatre indices respectent PED-01 et PED-02 : ils ne contiennent aucun
 * nombre absent de l'énoncé, donc jamais le résultat.
 */
import { z } from "zod";

import type { CorpsIa, PayloadIa } from "@/lib/ai/anonymisation";
import { PROMPT_1_STRUCTURATION } from "@/lib/ai/prompts/prompt-1-structuration";
import { PROMPT_2_INDICES } from "@/lib/ai/prompts/prompt-2-indices";
import { PROMPT_3_QUESTIONS } from "@/lib/ai/prompts/prompt-3-questions";
import type { AiTransport } from "@/lib/ai/transport";

export const NOM_TRANSPORT_BOUCHON = "bouchon";

/** Le corps que le bouchon fabrique a la même forme que celui du vrai transport. */
const CorpsAttendu = z.object({
  messages: z
    .array(z.object({ role: z.enum(["system", "user"]), content: z.string() }))
    .length(2),
});

/** Indices de matière, en français et en breton (PED-13). */
const INDICES_MATHS = [
  "calcul",
  "calcule",
  "combien",
  "addition",
  "additions",
  "soustraction",
  "soustractions",
  "resultat",
  "nombre",
  "nombres",
  "compte",
  "compter",
  "kont",
  "niver",
];

function replier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function estMaths(ligne: string): boolean {
  const plat = replier(ligne);
  if (/\d\s*[+\-x×÷*/=]\s*\d/u.test(plat)) return true;
  return INDICES_MATHS.some((mot) => new RegExp(`(?:^| )${mot}(?:$| )`, "u").test(plat));
}

function estBreton(texte: string): boolean {
  const plat = replier(texte);
  return /c'h|\bar\b|\ban\b|\bul\b|\bur\b|\bha\b|\bgant\b|\bpelec'h\b/u.test(plat);
}

function lignesUtiles(texte: string): readonly string[] {
  return texte
    .split(/\n+/u)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
}

function structurer(texte: string): unknown {
  const lignes = lignesUtiles(texte);
  const maths = lignes.filter(estMaths);
  const lecture = lignes.filter((l) => !estMaths(l));

  const etapes: unknown[] = [];
  if (lecture.length > 0) {
    etapes.push({
      matiere: "lecture",
      duree_estimee_min: Math.min(15, 3 + lecture.length),
      exercices: lecture.map((l) => ({
        consigne: l,
        type: "lecture à voix haute",
        contenu: l,
      })),
    });
  }
  if (maths.length > 0) {
    etapes.push({
      matiere: "maths",
      duree_estimee_min: Math.min(15, 3 + maths.length * 2),
      exercices: maths.map((l) => ({
        consigne: l,
        type: "calcul",
        contenu: l,
      })),
    });
  }

  const brBr = estBreton(texte);
  const frFr = lignes.some((l) => !estBreton(l));
  return {
    langue_detectee: brBr && frFr ? "mixte" : brBr ? "br" : "fr",
    // PED-06 : deux étapes au maximum. Avec deux matières, le découpage en
    // produit au plus deux ; la borne est répétée ici parce qu'un bouchon qui
    // rendrait une sortie hors contrat ne bouchonnerait rien.
    etapes: etapes.slice(0, 2),
  };
}

function indices(texte: string): unknown {
  const enonce = texte.trim().split(/\n/u)[0]?.trim() ?? texte.trim();
  return {
    indices: [
      `Relis l'énoncé avec moi : ${enonce}. Qu'est-ce qu'on te demande de trouver ?`,
      "Tu peux compter sur tes doigts, ou dessiner les objets un par un sur ton cahier.",
      "Essaie d'abord la même chose avec des tout petits nombres, pour voir comment ça marche.",
      "On y va ensemble, doucement : tu pars de ce que tu connais, puis tu avances pas à pas. Dis-moi ce que tu trouves.",
    ],
  };
}

function questions(texte: string): unknown {
  const mots = [
    ...new Set(
      replier(texte)
        .split(/[^a-z0-9']+/u)
        .filter((m) => m.length > 3),
    ),
  ];
  const cles = mots.slice(0, 3);
  return {
    questions: [
      {
        question: "De quoi parle ce texte ?",
        mots_cles: cles.length > 0 ? cles : ["texte"],
      },
      {
        question: "Qu'est-ce qui se passe à la fin ?",
        mots_cles: mots.slice(-3).length > 0 ? mots.slice(-3) : ["fin"],
      },
    ],
  };
}

export function transportBouchon(): AiTransport {
  return {
    nom: NOM_TRANSPORT_BOUCHON,
    vocabulaire: [NOM_TRANSPORT_BOUCHON],

    corps(payload: PayloadIa): CorpsIa {
      return {
        model: NOM_TRANSPORT_BOUCHON,
        messages: payload.messages(),
        response_format: { type: "json_object" },
        temperature: 0,
        stream: false,
      };
    },

    emettre(corps: CorpsIa): Promise<string> {
      const lu = CorpsAttendu.safeParse(corps);
      if (!lu.success) {
        return Promise.reject(new Error("corps hors contrat remis au bouchon"));
      }
      const systeme = lu.data.messages[0]?.content ?? "";
      const utilisateur = lu.data.messages[1]?.content ?? "";

      if (systeme === PROMPT_1_STRUCTURATION.texte) {
        return Promise.resolve(JSON.stringify(structurer(utilisateur)));
      }
      if (systeme === PROMPT_2_INDICES.texte) {
        return Promise.resolve(JSON.stringify(indices(utilisateur)));
      }
      if (systeme === PROMPT_3_QUESTIONS.texte) {
        return Promise.resolve(JSON.stringify(questions(utilisateur)));
      }
      return Promise.reject(new Error("prompt inconnu du bouchon"));
    },
  };
}
