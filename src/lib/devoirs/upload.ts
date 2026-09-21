/**
 * Étape 1 du pipeline (3.2) et PRD-03 — **SERVEUR UNIQUEMENT**.
 *
 * « Le parent prend une photo par consigne ; compression côté client, envoi
 * vers Supabase Storage. » La compression est dans
 * `src/lib/devoirs/compression.ts`, côté navigateur ; ce module-ci reçoit les
 * octets et les range.
 *
 * PRD-03 tient dans une propriété simple : **une photo = une ligne `homework`**,
 * et l'analyse en prend de une à dix. Rien dans le modèle ne suppose une photo
 * unique, et rien ne concatène deux consignes.
 *
 * Les trois codes d'erreur de P2 §8.2 sont rendus ici, et pas un de plus :
 * `413 TIPI_FICHIER_TROP_GRAND`, `415 TIPI_FORMAT_REFUSE`,
 * `502 TIPI_UPLOAD_ECHEC`.
 */
import { randomUUID } from "node:crypto";

import { detecterLangue, normaliserTexteOcr } from "@/lib/ocr/normalisation";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { enfantCourant } from "@/lib/enfant/courant";
import { garderServeur } from "@/lib/runtime/garde-serveur";
import {
  TYPES_PHOTO_ACCEPTES,
  cheminPhoto,
  supprimerPhoto,
  televerserPhoto,
} from "@/lib/storage/devoirs";
import { env } from "@/config/env";

garderServeur("src/lib/devoirs/upload.ts");

export interface PhotoRecue {
  readonly typeMime: string;
  readonly octets: Buffer;
}

export interface SaisieManuelle {
  readonly matiere: "lecture" | "maths";
  readonly consigne: string;
  readonly contenu: string;
}

/**
 * Range une photo et rend l'identifiant de son devoir.
 *
 * L'ordre des contrôles n'est pas indifférent : la **taille** est vérifiée
 * avant le **type**, parce qu'un fichier de 40 Mo au mauvais format doit
 * produire l'erreur qui dit « trop grand » — c'est celle qui mène le parent au
 * bon geste. L'ordre inverse lui ferait reprendre une photo au bon format et
 * toujours trop lourde.
 */
export async function ajouterPhoto(photo: PhotoRecue): Promise<{ homeworkId: string }> {
  garderServeur("src/lib/devoirs/upload.ts");
  const { UPLOAD_MAX_PHOTO_OCTETS } = env();

  if (photo.octets.byteLength > UPLOAD_MAX_PHOTO_OCTETS) {
    throw new AppError(
      "TIPI_FICHIER_TROP_GRAND",
      `${photo.octets.byteLength} octets pour un plafond de ${UPLOAD_MAX_PHOTO_OCTETS}`,
    );
  }
  const extension = TYPES_PHOTO_ACCEPTES[photo.typeMime];
  if (extension === undefined) {
    throw new AppError(
      "TIPI_FORMAT_REFUSE",
      `type « ${photo.typeMime} » ; acceptés : ${Object.keys(TYPES_PHOTO_ACCEPTES).join(", ")}`,
    );
  }

  const enfant = await enfantCourant();
  // L'identifiant est tiré AVANT le téléversement, pour que le chemin dans le
  // Storage et la ligne en base portent le même. Une photo téléversée dont la
  // ligne n'aurait pas été créée serait un objet orphelin ; l'ordre inverse
  // créerait une ligne sans photo, et l'analyse échouerait plus tard, loin du
  // geste qui l'a causée.
  const homeworkId = randomUUID();
  const chemin = cheminPhoto(enfant.id, homeworkId, extension);

  await televerserPhoto(chemin, photo.octets, photo.typeMime);

  try {
    await prisma.homework.create({
      data: { id: homeworkId, childId: enfant.id, photoUrl: chemin },
    });
  } catch (brute) {
    await supprimerPhoto(chemin);
    throw new AppError(
      "TIPI_UPLOAD_ECHEC",
      `ligne homework refusée : ${brute instanceof Error ? brute.message : String(brute)}`,
    );
  }

  return { homeworkId };
}

/**
 * Voie de secours toujours ouverte (PRD-16, P2 §8.2).
 *
 * Elle ne passe par aucun OCR : le parent a déjà lu le devoir. Le texte est
 * normalisé comme un texte d'OCR — mêmes règles, même caviardage ensuite — et
 * la langue est détectée localement. `confiance_ocr` reste **null**, qui est la
 * valeur juste : il n'y a pas eu de lecture automatique, donc pas de confiance
 * à mesurer. Y écrire 1 serait un chiffre inventé dans la table même qui sert à
 * régler les seuils (TEC-16).
 */
export async function ajouterSaisieManuelle(
  saisie: SaisieManuelle,
): Promise<{ homeworkId: string }> {
  garderServeur("src/lib/devoirs/upload.ts");
  const enfant = await enfantCourant();
  const texte = normaliserTexteOcr(`${saisie.consigne}\n${saisie.contenu}`);

  const devoir = await prisma.homework.create({
    data: {
      childId: enfant.id,
      texteOcr: texte,
      matiere: saisie.matiere,
      saisieManuelle: true,
      langueDetectee: detecterLangue(texte).langue,
    },
  });
  return { homeworkId: devoir.id };
}

/**
 * Retire une vignette avant analyse.
 *
 * `409 TIPI_DEJA_ANALYSE` dès qu'un exercice existe : retirer une photo déjà
 * découpée laisserait des exercices orphelins dans un programme que le parent
 * croit à jour. La garde est en base, pas dans l'écran.
 */
export async function retirerPhoto(homeworkId: string): Promise<void> {
  garderServeur("src/lib/devoirs/upload.ts");
  const enfant = await enfantCourant();
  const devoir = await prisma.homework.findFirst({
    where: { id: homeworkId, childId: enfant.id },
    include: { _count: { select: { exercises: true } } },
  });
  if (devoir === null) {
    throw new AppError("TIPI_INTROUVABLE", "devoir inconnu de cet enfant");
  }
  if (devoir._count.exercises > 0) {
    throw new AppError("TIPI_DEJA_ANALYSE", "le devoir porte déjà des exercices");
  }

  await prisma.homework.delete({ where: { id: devoir.id } });
  if (devoir.photoUrl !== null) await supprimerPhoto(devoir.photoUrl);
}
