import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { PauseGuidee } from "@/components/enfant/PauseGuidee";
import { textePourSession } from "@/content/banque";
import { texteUi } from "@/content/loader";
import { etatAiguillage } from "@/lib/session/aiguillage";

/**
 * `/enfant/pause` — PRD-12.
 *
 * **Composant serveur.** Les textes sont résolus ici, pas dans le navigateur :
 * c'est ce qui garde `content/` et le rendu des jetons hors du bundle client
 * (SEC-04, P2 §2). Le composant client ne reçoit que des chaînes prêtes.
 *
 * L'écran ne se fie pas à la navigation : il relit l'état en base et redirige
 * si la session n'est pas en `pause`. Un enfant qui reviendrait par l'historique
 * du navigateur, ou qui rouvrirait l'application, retombe sur **son** écran
 * (PRD-18) — jamais sur une pause qui n'a pas lieu d'être.
 */
export const dynamic = "force-dynamic";

export default async function PagePause(): Promise<ReactElement> {
  const etat = await etatAiguillage();
  const active = etat.sessionActive;

  if (active === null) redirect("/enfant");
  if (active.etat !== "pause") redirect(active.route);

  return (
    <PauseGuidee
      sessionId={active.id}
      textes={{
        titre: textePourSession("demande_pause", active.id, "pause.titre"),
        corps: textePourSession("demande_pause", active.id, "pause.corps"),
        inspire: texteUi("pause.inspire"),
        expire: texteUi("pause.expire"),
        rassurance: texteUi("pause.rassurance"),
        bouton: texteUi("pause.bouton"),
        attente: texteUi("enfant.attente.pilou"),
      }}
    />
  );
}
