/**
 * Photos de devoirs dans Supabase Storage — **SERVEUR UNIQUEMENT**
 * (PRD-03, TEC-02, TEC-13).
 *
 * V1 a câblé la connexion et déclaré que l'upload des photos serait livré par
 * V2 (`src/lib/storage/supabase.ts`, en-tête). C'est ce fichier.
 *
 * Le bucket `devoirs` est **privé**. Rien ici ne rend d'URL publique : une
 * photo de cahier porte l'écriture de l'enfant, souvent son prénom, parfois le
 * nom de son école. Le chemin est déterministe et dérivé des identifiants, donc
 * jamais devinable depuis l'extérieur — et de toute façon inatteignable sans
 * clé de service.
 *
 * **Rien de ce module ne remonte jamais vers `src/lib/ai/**`** : les octets
 * lus ici partent vers l'OCR et s'arrêtent là (TEC-05, SEC-04 partie C).
 */
import { AppError } from "@/lib/errors/app-error";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import { BUCKETS, supabase } from "@/lib/storage/supabase";

garderServeur("src/lib/storage/devoirs.ts");

/** Les trois types acceptés par la route photo (P2, §8.2). */
export const TYPES_PHOTO_ACCEPTES: Readonly<Record<string, string>> = Object.freeze({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
});

/**
 * Chemin dans le bucket. `<childId>/<homeworkId>.<ext>` : un dossier par
 * enfant, pour que la suppression de compte de SEC-07 soit un préfixe et non
 * un balayage.
 */
export function cheminPhoto(childId: string, homeworkId: string, extension: string): string {
  return `${childId}/${homeworkId}.${extension}`;
}

export async function televerserPhoto(
  chemin: string,
  octets: Buffer,
  typeMime: string,
): Promise<void> {
  garderServeur("src/lib/storage/devoirs.ts");
  const { error } = await supabase()
    .storage.from(BUCKETS.devoirs)
    .upload(chemin, octets, { contentType: typeMime, upsert: true });
  if (error !== null) {
    throw new AppError("TIPI_UPLOAD_ECHEC", `téléversement refusé : ${error.message}`);
  }
}

export async function telechargerPhoto(chemin: string): Promise<Buffer> {
  garderServeur("src/lib/storage/devoirs.ts");
  const { data, error } = await supabase().storage.from(BUCKETS.devoirs).download(chemin);
  if (error !== null || data === null) {
    throw new AppError(
      "TIPI_UPLOAD_ECHEC",
      `photo illisible dans le Storage : ${error?.message ?? "objet absent"}`,
    );
  }
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Supprime la photo. **Une erreur de Storage n'est pas remontée** : la ligne
 * `homework` est déjà partie, et refuser le retrait d'une vignette parce qu'un
 * objet distant résiste laisserait le parent bloqué devant un écran qui ne
 * bouge plus (PRD-16). L'objet orphelin sera repris par la purge de SEC-05.
 */
export async function supprimerPhoto(chemin: string): Promise<boolean> {
  garderServeur("src/lib/storage/devoirs.ts");
  const { error } = await supabase().storage.from(BUCKETS.devoirs).remove([chemin]);
  return error === null;
}
