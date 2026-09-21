"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SEUIL_ATTENTE_PILOU_MS } from "@/config/ui.config";
import { routeDe } from "@/lib/session/routes";
import type { EtatSession, Evenement, Snapshot } from "@/lib/session/types";

/**
 * Le hook qui fait avancer la machine, côté écran (TEC-04, TEC-12, PRD-16).
 *
 * ---------------------------------------------------------------------------
 * `evenementId` EST STABLE PAR ACTION, ET C'EST CE QUI REND LE RÉESSAI SÛR
 * ---------------------------------------------------------------------------
 * La route est idempotente sur `evenementId` : un identifiant déjà vu rend le
 * snapshot **sans aucun effet de bord** (P2 §8.3). Un identifiant tiré à chaque
 * envoi annulerait cette garantie — deux appuis rapides deviendraient deux
 * transitions. Il est donc mémorisé par action, et un réessai réemploie
 * exactement le même : c'est ce que P2 §9.4 décrit pour la transition non
 * délivrée.
 *
 * ---------------------------------------------------------------------------
 * PRD-16 : CE QU'UN ÉCHEC FAIT, ET CE QU'IL NE FAIT PAS
 * ---------------------------------------------------------------------------
 * Un échec ne montre **jamais** un message technique à l'enfant. Il ne fait pas
 * non plus disparaître le bouton : l'action reste offerte, et la réessayer est
 * sans risque puisque la route est idempotente. Aucun texte n'est inventé ici —
 * les clés d'état limite appartiennent à `content/` (ARB-10) et l'écran de
 * clôture qui joue `bravo.pierres_plus_tard` est livré par V9.
 *
 * TEC-12 : au-delà de `SEUIL_ATTENTE_PILOU_MS`, `attenteAffichee` passe à vrai
 * et l'écran monte « Pilou réfléchit ». En deçà, rien ne clignote.
 */
export interface DemandeTransitionClient {
  readonly sessionId: string;
  readonly evenement: Evenement;
  readonly etatAttendu: EtatSession;
}

interface ReponseTransition {
  readonly session: Snapshot;
  readonly pierresCreditees: number;
}

function estReponse(valeur: unknown): valeur is ReponseTransition {
  return typeof valeur === "object" && valeur !== null && "session" in valeur;
}

export interface TransitionSession {
  readonly envoyer: (demande: DemandeTransitionClient) => void;
  readonly enCours: boolean;
  /** TEC-12 — vrai seulement au-delà du seuil de 400 ms. */
  readonly attenteAffichee: boolean;
  readonly enEchec: boolean;
}

export function useTransitionSession(): TransitionSession {
  const routeur = useRouter();
  const identifiants = useRef(new Map<string, string>());
  const [attenteAffichee, setAttenteAffichee] = useState(false);

  const mutation = useMutation({
    mutationFn: async (demande: DemandeTransitionClient): Promise<ReponseTransition> => {
      const cle = `${demande.sessionId}:${demande.evenement}:${demande.etatAttendu}`;
      const existant = identifiants.current.get(cle) ?? crypto.randomUUID();
      identifiants.current.set(cle, existant);

      const reponse = await fetch(`/api/session/${demande.sessionId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          evenementId: existant,
          evenement: demande.evenement,
          etatAttendu: demande.etatAttendu,
        }),
      });
      const corps: unknown = await reponse.json().catch(() => undefined);
      if (!reponse.ok || !estReponse(corps)) {
        // Le détail reste au journal du navigateur ; l'enfant ne voit rien
        // d'autre que son bouton, toujours là.
        throw new Error(String(reponse.status));
      }
      return corps;
    },
    onSuccess: (reponse) => {
      routeur.push(routeDe(reponse.session.etat));
      routeur.refresh();
    },
  });

  const { isPending } = mutation;

  useEffect(() => {
    if (!isPending) {
      setAttenteAffichee(false);
      return;
    }
    const minuteur = setTimeout(() => setAttenteAffichee(true), SEUIL_ATTENTE_PILOU_MS);
    return () => clearTimeout(minuteur);
  }, [isPending]);

  const envoyer = useCallback(
    (demande: DemandeTransitionClient) => {
      mutation.mutate(demande);
    },
    [mutation],
  );

  return {
    envoyer,
    enCours: isPending,
    attenteAffichee,
    enEchec: mutation.isError,
  };
}
