-- V2 « Capture & analyse IA » — une seule colonne.
--
-- MOTIF, et il est écrit ici parce qu'une migration se relit longtemps après :
-- la section 3.6 du prompt maître fait estimer au modèle une durée PAR ÉTAPE,
-- et le contrat de `GET /api/devoirs/programme` (P2 §8.2) exige de rendre cette
-- durée après un simple rafraîchissement de l'aperçu. Aucune colonne ne la
-- portait. La relecture aurait donc dû réinventer un nombre, différent de celui
-- affiché une seconde plus tôt au même parent.
--
-- La durée d'une étape est désormais DÉFINIE comme la somme des durées de ses
-- exercices — à l'analyse comme à la relecture. Une seule définition, donc
-- aucune divergence possible entre les deux chemins.
--
-- `DEFAULT 1` puis `DROP DEFAULT` : la colonne est obligatoire et sans valeur
-- par défaut dans le modèle. Le défaut transitoire ne sert qu'à faire passer
-- l'ALTER sur une table qui porterait déjà des lignes ; le schéma final est
-- exactement celui de `prisma/schema.prisma`, ce que `pnpm db:diff` vérifie.
ALTER TABLE "exercise" ADD COLUMN "duree_estimee_min" SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE "exercise" ALTER COLUMN "duree_estimee_min" DROP DEFAULT;
