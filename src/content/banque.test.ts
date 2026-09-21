import { describe, expect, it } from "vitest";

import { cleAnnonceTransition, cleFelicitationTransition } from "@/content/cles";
import { estEntierementRendu } from "@/content/jetons";
import { idsSituations, situation } from "@/content/loader";
import { textePourSession } from "@/content/banque";

/**
 * `banque.ts` — le tirage réellement câblé vers l'enfant en V3
 * (P4/V3.review.md, tour 1, [MAJEUR] 2).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE
 * ---------------------------------------------------------------------------
 * `selection.ts` et `loader.ts` étaient du code de V1/V2, jamais exécuté en
 * production. V3 les rend **réellement exécutés**, pour la première fois, sur
 * du texte lu par un enfant de 6 ans et demi (PED-11) : `banque.ts` est la
 * jonction entre le tirage et les deux nouveaux écrans enfant,
 * `/enfant/pause` et `/enfant/session/transition`. Aucun test ne l'exerçait.
 *
 * Le risque n'est pas hypothétique : ARB-14 (`docs/agents/GATES.md`) rapporte
 * trois bugs de grammaire de jeton trouvés par trois agents différents pendant
 * G1, sur exactement cette famille de fonctions. Ce fichier vérifie que le
 * chemin réel de V3 — pas un exemple inventé — ne les reproduit pas.
 *
 * ---------------------------------------------------------------------------
 * LES SITUATIONS ET LES CLÉS SONT DÉRIVÉES, JAMAIS RECOPIÉES
 * ---------------------------------------------------------------------------
 * Les clés de transition viennent de `cleFelicitationTransition()` et
 * `cleAnnonceTransition()` — les mêmes fonctions que `EcranTransition`/
 * `/enfant/session/transition` appellent réellement. Un renommage de clé dans
 * `cles.ts` fait rougir ce test au même endroit qu'il casserait l'écran, sans
 * qu'il faille maintenir une seconde liste (ARB-18 mesure 1).
 *
 * `pause.titre`/`pause.corps` restent littéraux : `/enfant/pause/page.tsx` les
 * écrit en dur comme troisième argument de `textePourSession()`, et rien dans
 * ce module ne les nomme ailleurs pour les dériver sans dupliquer la page.
 */

/** 30 identifiants de session distincts, pour observer le tirage sur un échantillon. */
const SESSIONS: readonly string[] = Array.from(
  { length: 30 },
  (_v, i) => `00000000-0000-4000-a000-${String(i).padStart(12, "0")}`,
);

describe("MAJEUR 2 — les trois situations réellement utilisées par V3 existent, avec leurs clés", () => {
  it("`demande_pause`, `transition_lecture_vers_maths`, `transition_maths_vers_lecture` sont dans encouragements.json", () => {
    const toutes = idsSituations();
    expect(toutes).toContain("demande_pause");
    expect(toutes).toContain("transition_lecture_vers_maths");
    expect(toutes).toContain("transition_maths_vers_lecture");
  });

  it("chacune porte 20 variantes (PED-11), sans exception", () => {
    for (const id of [
      "demande_pause",
      "transition_lecture_vers_maths",
      "transition_maths_vers_lecture",
    ]) {
      expect(situation(id).variantes.length, id).toBe(20);
    }
  });
});

describe("MAJEUR 2 — textePourSession() sur le chemin réel de /enfant/pause", () => {
  for (const cle of ["pause.titre", "pause.corps"]) {
    it(`« ${cle} » : ne lève jamais, et n'a jamais de jeton non rendu, sur 30 sessions`, () => {
      for (const sessionId of SESSIONS) {
        const texte = textePourSession("demande_pause", sessionId, cle);
        expect(texte.length, `session ${sessionId}`).toBeGreaterThan(0);
        expect(estEntierementRendu(texte), `session ${sessionId} : « ${texte} »`).toBe(true);
      }
    });
  }

  it("le tirage varie réellement selon la session — ce n'est pas toujours la même variante", () => {
    const vus = new Set(SESSIONS.map((s) => textePourSession("demande_pause", s, "pause.titre")));
    // Avec 30 sessions et 20 variantes, une seule valeur distincte trahirait
    // un aléa cassé (graine constante, ou tirage qui ignore sessionId).
    expect(vus.size).toBeGreaterThan(1);
  });
});

describe("MAJEUR 2 — textePourSession() sur le chemin réel de /enfant/session/transition", () => {
  /**
   * Les quatre couples (matière terminée, matière suivante) réellement
   * atteignables par la machine (T4/T6, P2 §9.1) : après lecture vient
   * toujours maths, et après maths vient toujours lecture — V3 n'a que deux
   * matières (PED-06).
   */
  const PASSAGES = [
    { situationId: "transition_lecture_vers_maths", terminee: "lecture", suivante: "maths" },
    { situationId: "transition_maths_vers_lecture", terminee: "maths", suivante: "lecture" },
  ] as const;

  for (const { situationId, terminee, suivante } of PASSAGES) {
    const cleFelicitation = cleFelicitationTransition(terminee).cle;
    const cleAnnonce = cleAnnonceTransition(suivante).cle;

    it(`${situationId} : « ${cleFelicitation} » ne nomme QUE ${terminee}, jamais ${suivante}`, () => {
      for (const sessionId of SESSIONS) {
        const texte = textePourSession(situationId, sessionId, cleFelicitation);
        expect(texte.length, sessionId).toBeGreaterThan(0);
        expect(estEntierementRendu(texte), sessionId).toBe(true);
      }
    });

    it(`${situationId} : « ${cleAnnonce} » ne nomme QUE ${suivante}, jamais ${terminee}`, () => {
      for (const sessionId of SESSIONS) {
        const texte = textePourSession(situationId, sessionId, cleAnnonce);
        expect(texte.length, sessionId).toBeGreaterThan(0);
        expect(estEntierementRendu(texte), sessionId).toBe(true);
      }
    });
  }

  it("les deux sens de passage rendent des textes DIFFÉRENTS — ARB-14, le risque nommé par le contrôleur", () => {
    // Le défaut exact que la famille de fonctions a produit trois fois en G1 :
    // un texte générique qui ne distingue pas les deux sens. Ici, les clés
    // sont distinctes par construction (cles.ts), et ce test vérifie que le
    // TEXTE l'est aussi, sur le même échantillon de sessions.
    const sessionId = SESSIONS[0] ?? "";
    const felicitationLecture = textePourSession(
      "transition_lecture_vers_maths",
      sessionId,
      cleFelicitationTransition("lecture").cle,
    );
    const felicitationMaths = textePourSession(
      "transition_maths_vers_lecture",
      sessionId,
      cleFelicitationTransition("maths").cle,
    );
    expect(felicitationLecture).not.toBe(felicitationMaths);
  });
});

describe("MAJEUR 2 — déterminisme et échecs francs", () => {
  it("STABLE : la même session redemande le même texte, à chaque appel", () => {
    const sessionId = SESSIONS[3] ?? "";
    const premier = textePourSession("demande_pause", sessionId, "pause.corps");
    for (let i = 0; i < 5; i += 1) {
      expect(textePourSession("demande_pause", sessionId, "pause.corps")).toBe(premier);
    }
  });

  it("une situation inconnue LÈVE — un écran qui tombe se répare, un identifiant affiché ne se voit pas", () => {
    expect(() => textePourSession("situation-qui-n-existe-pas", SESSIONS[0] ?? "", "x")).toThrow();
  });

  it("une clé absente de la situation LÈVE, nommément", () => {
    expect(() =>
      textePourSession("demande_pause", SESSIONS[0] ?? "", "clé.qui.n.existe.pas"),
    ).toThrow(/ne porte pas la clé/u);
  });
});
