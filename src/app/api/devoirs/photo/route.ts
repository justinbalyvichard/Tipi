/**
 * `POST /api/devoirs/photo` — `multipart/form-data`, PRD-03 (P2, §8.2).
 *
 * Une photo par consigne : cette route est appelée autant de fois que le parent
 * prend de photos, et chaque appel crée **une** ligne `homework`.
 *
 * La route valide, appelle `src/lib`, et mappe les erreurs. Elle ne contient
 * aucune règle métier — c'est la responsabilité que P2 §2 lui donne, et rien
 * de plus.
 */
import { z } from "zod";

import { ajouterPhoto } from "@/lib/devoirs/upload";
import { handler, versReponse } from "@/lib/errors/route";

export const dynamic = "force-dynamic";

/**
 * L'entrée est un `File`, que Zod ne sait pas décrire. On valide donc la forme
 * **extraite** : un type MIME non vide et des octets non vides. Les règles de
 * taille et de format, elles, produisent `413` et `415` et non `400` — elles
 * appartiennent à `src/lib/devoirs/upload.ts`, avec leur motif.
 */
const Entree = z.object({
  typeMime: z.string().min(1),
  taille: z.number().int().positive(),
});

export async function POST(requete: Request): Promise<Response> {
  let typeMime = "";
  let octets = Buffer.alloc(0);
  try {
    const formulaire = await requete.formData();
    const photo = formulaire.get("photo");
    if (photo !== null && typeof photo !== "string") {
      typeMime = photo.type;
      octets = Buffer.from(await photo.arrayBuffer());
    }
  } catch {
    // Corps illisible : `Entree` refusera ci-dessous et rendra
    // `400 TIPI_VALIDATION`, comme toute entrée non conforme.
  }

  const reponse = await handler(
    Entree,
    { typeMime, taille: octets.byteLength },
    () => ajouterPhoto({ typeMime, octets }),
  );
  return versReponse(reponse);
}
