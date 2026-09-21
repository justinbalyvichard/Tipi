import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { EcranTransition } from "@/components/enfant/EcranTransition";
import { textePourSession } from "@/content/banque";
import { cleAnnonceTransition, cleFelicitationTransition } from "@/content/cles";
import { texteUi } from "@/content/loader";
import { etatAiguillage } from "@/lib/session/aiguillage";
import { lireSession } from "@/lib/session/service";

/**
 * `/enfant/session/transition` — PRD-10, la transition douce entre deux étapes.
 *
 * **Composant serveur**, pour la même raison que l'écran de pause : les textes
 * et le tirage restent côté serveur.
 *
 * ---------------------------------------------------------------------------
 * LA MATIÈRE N'EST JAMAIS INTERPOLÉE DANS UNE PHRASE GÉNÉRIQUE
 * ---------------------------------------------------------------------------
 * Les deux phrases viennent de la table 7.0 par `cleFelicitationTransition()` et
 * `cleAnnonceTransition()` : chaque couple de matières a **ses** clés, et la
 * situation de la banque est choisie par le sens du passage. « D'abord la
 * {matiere} » est interdit (ARB-14) : la phrase ne tiendrait pas au pluriel, et
 * un contrôleur ne pourrait pas lire le texte final.
 *
 * Règle de contrôle opposable de 7.0 : sur chacune des six configurations, un
 * contrôleur doit pouvoir dérouler la soirée et constater que Pilou **ne nomme
 * jamais une matière absente du programme du soir**. Ici, les deux matières
 * nommées sont exactement celles des étapes `etapeCourante` et
 * `etapeCourante + 1` du programme figé.
 */
export const dynamic = "force-dynamic";

export default async function PageTransition(): Promise<ReactElement> {
  const etat = await etatAiguillage();
  const active = etat.sessionActive;

  if (active === null) redirect("/enfant");
  if (active.etat !== "transition") redirect(active.route);

  const session = await lireSession(active.id);
  const index = session.etapeCourante;
  const terminee = index === null ? undefined : session.etapes[index];
  const suivante = index === null ? undefined : session.etapes[index + 1];

  // La machine refuse déjà `TRANSITION_VUE` sans étape suivante ; si l'écran
  // était atteint dans cet état, il renvoie à l'aiguillage plutôt que de
  // fabriquer une phrase sur une matière qui n'existe pas.
  if (terminee === undefined || suivante === undefined || index === null) {
    redirect("/enfant");
  }

  const situationId =
    terminee.matiere === "lecture"
      ? "transition_lecture_vers_maths"
      : "transition_maths_vers_lecture";

  return (
    <EcranTransition
      sessionId={active.id}
      nbEtapes={session.etapes.length}
      etapeCourante={index}
      textes={{
        felicitation: textePourSession(
          situationId,
          active.id,
          cleFelicitationTransition(terminee.matiere).cle,
        ),
        annonce: textePourSession(
          situationId,
          active.id,
          cleAnnonceTransition(suivante.matiere).cle,
        ),
        bouton: texteUi("transition.bouton"),
        attente: texteUi("enfant.attente.pilou"),
      }}
    />
  );
}
