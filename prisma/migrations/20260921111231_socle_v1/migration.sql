-- CreateEnum
CREATE TYPE "EtatSession" AS ENUM ('idle', 'annonce', 'etape_lecture', 'transition', 'etape_maths', 'cloture', 'termine', 'pause', 'abandon_parent');

-- CreateEnum
CREATE TYPE "Matiere" AS ENUM ('lecture', 'maths');

-- CreateEnum
CREATE TYPE "LangueDetectee" AS ENUM ('fr', 'br', 'mixte');

-- CreateEnum
CREATE TYPE "StatutTentative" AS ENUM ('en_cours', 'terminee', 'passee', 'bloquee');

-- CreateEnum
CREATE TYPE "RaisonGem" AS ENUM ('etape_lecture_terminee', 'etape_maths_terminee', 'bonus_soiree_complete');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('pilou', 'apple');

-- CreateTable
CREATE TABLE "family" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_audio_jours" SMALLINT NOT NULL DEFAULT 7,
    "calibration_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" DATE NOT NULL,
    "niveau_scolaire" TEXT NOT NULL,
    "classe_bilingue" BOOLEAN NOT NULL DEFAULT false,
    "gem_balance" INTEGER NOT NULL DEFAULT 0,
    "theme_prefere" "Theme" NOT NULL DEFAULT 'pilou',
    "cosmetique_active" TEXT,
    "onboarding_termine_le" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "photo_url" TEXT,
    "texte_ocr" TEXT,
    "langue_detectee" "LangueDetectee",
    "matiere" "Matiere",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confiance_ocr" DOUBLE PRECISION,
    "saisie_manuelle" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" UUID NOT NULL,
    "homework_id" UUID NOT NULL,
    "consigne" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "indices" JSONB,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "etat" "EtatSession" NOT NULL DEFAULT 'idle',
    "etapes_prevues" JSONB NOT NULL,
    "etape_courante" INTEGER,
    "resume" TEXT,
    "evenements" JSONB NOT NULL DEFAULT '[]',
    "soir_leger" BOOLEAN NOT NULL DEFAULT false,
    "arret_parent" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "transcription_audio" TEXT,
    "audio_url" TEXT,
    "nb_indices_utilises" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutTentative" NOT NULL DEFAULT 'en_cours',
    "nb_sollicitations" INTEGER NOT NULL DEFAULT 0,
    "mots_hesitants" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gem_ledger" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "delta" SMALLINT NOT NULL,
    "raison" "RaisonGem" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gem_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_threshold" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "gems_requis" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "atteint_le" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_threshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_access" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "tentatives_echouees" SMALLINT NOT NULL DEFAULT 0,
    "bloque_jusqu_a" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_log" (
    "id" UUID NOT NULL,
    "homework_id" UUID NOT NULL,
    "texte_ocr_brut" TEXT NOT NULL,
    "confiance_ocr" DOUBLE PRECISION NOT NULL,
    "payload_ia" JSONB NOT NULL,
    "reponse_ia_brute" JSONB,
    "erreur_code" TEXT,
    "seuil_confiance_applique" DOUBLE PRECISION NOT NULL,
    "duree_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "child_family_id_idx" ON "child"("family_id");

-- CreateIndex
CREATE INDEX "homework_child_id_created_at_idx" ON "homework"("child_id", "created_at");

-- CreateIndex
CREATE INDEX "exercise_homework_id_ordre_idx" ON "exercise"("homework_id", "ordre");

-- CreateIndex
CREATE INDEX "session_child_id_date_idx" ON "session"("child_id", "date");

-- CreateIndex
CREATE INDEX "session_child_id_etat_idx" ON "session"("child_id", "etat");

-- CreateIndex
CREATE INDEX "attempt_session_id_idx" ON "attempt"("session_id");

-- CreateIndex
CREATE INDEX "attempt_exercise_id_idx" ON "attempt"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_session_id_exercise_id_key" ON "attempt"("session_id", "exercise_id");

-- CreateIndex
CREATE INDEX "gem_ledger_child_id_created_at_idx" ON "gem_ledger"("child_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gem_ledger_session_id_raison_key" ON "gem_ledger"("session_id", "raison");

-- CreateIndex
CREATE INDEX "reward_threshold_child_id_gems_requis_idx" ON "reward_threshold"("child_id", "gems_requis");

-- CreateIndex
CREATE UNIQUE INDEX "settings_access_family_id_key" ON "settings_access"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_log_homework_id_key" ON "calibration_log"("homework_id");

-- CreateIndex
CREATE INDEX "calibration_log_created_at_idx" ON "calibration_log"("created_at");

-- AddForeignKey
ALTER TABLE "child" ADD CONSTRAINT "child_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt" ADD CONSTRAINT "attempt_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt" ADD CONSTRAINT "attempt_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_ledger" ADD CONSTRAINT "gem_ledger_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_ledger" ADD CONSTRAINT "gem_ledger_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_threshold" ADD CONSTRAINT "reward_threshold_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_access" ADD CONSTRAINT "settings_access_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_log" ADD CONSTRAINT "calibration_log_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
