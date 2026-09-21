-- V2 « Capture & analyse IA » — DEUX colonnes sur `exercise`.
--
-- (Le titre disait « une seule colonne » au tour 1, alors que le corps en
-- documentait déjà deux : [MINEUR] N2. Une migration se relit longtemps après,
-- c'est ce fichier lui-même qui le dit.)
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

-- Seconde colonne, et son motif est un défaut trouvé en jouant le pipeline
-- contre une vraie base plutôt qu'en relisant le code :
-- `homework.matiere` ne suffit pas à ranger un exercice. La section 3.6
-- autorise le modèle à rendre DEUX étapes pour une seule photo — une page de
-- cahier porte souvent la lecture et les calculs du soir. Sans matière sur
-- l'exercice, la relecture de l'aperçu rangeait tous les exercices d'une telle
-- photo dans une seule étape, celle écrite en dernier sur le devoir.
--
-- Même précaution sur le défaut transitoire que ci-dessus : il n'existe aucune
-- ligne d'`exercise` avant V2, cette table n'ayant jamais été alimentée.
ALTER TABLE "exercise" ADD COLUMN "matiere" "Matiere" NOT NULL DEFAULT 'lecture';
ALTER TABLE "exercise" ALTER COLUMN "matiere" DROP DEFAULT;

-- L'ordre devient GLOBAL au programme et non plus local à l'étape : c'est lui
-- qui porte l'ordre des étapes entre elles à la relecture.
COMMENT ON COLUMN "exercise"."ordre" IS 'Rang dans le programme du soir, toutes étapes confondues (V2).';
