-- =============================================================================
-- Tipi — Row Level Security, contraintes et Storage
-- =============================================================================
-- À appliquer sur le projet Supabase (région UE, TEC-02) APRÈS
-- `prisma migrate deploy`, qui crée les tables.
--
-- Couvre : SEC-03 (RLS sur toutes les tables), SEC-06 et TEC-11 (aucune
-- écriture de pierres depuis le client), ETH-04 (aucun delta négatif au niveau
-- du schéma), SEC-05 (purge des audios), PRD-18 (une seule session active).
--
-- -----------------------------------------------------------------------------
-- MODÈLE D'ACCÈS, à lire avant de juger les politiques ci-dessous
-- -----------------------------------------------------------------------------
-- Tipi n'a AUCUN client Supabase dans le navigateur. Il n'existe ni clé anon ni
-- clé service dans le bundle (TEC-13). Tout passe par une route serveur
-- Next.js, qui parle à Postgres via Prisma avec `DATABASE_URL`, et à Storage
-- via `SUPABASE_SERVICE_ROLE_KEY`, toutes deux strictement serveur.
--
-- Les rôles `anon` et `authenticated` existent quand même : ils sont exposés en
-- permanence par l'API PostgREST du projet Supabase, que Tipi les utilise ou
-- non. C'est exactement la surface d'attaque n°4 de `red-team`. La politique
-- retenue pour ces deux rôles est donc le REFUS TOTAL, sur toutes les tables :
--   1. RLS activée sur chaque table ;
--   2. AUCUNE policy créée pour `anon` ni `authenticated` — en Postgres, RLS
--      activée sans policy applicable signifie « zéro ligne visible, zéro
--      écriture permise » ;
--   3. et, en amont de RLS, REVOKE de tous les privilèges de table, pour que
--      la requête échoue avant même l'évaluation des policies.
--
-- Pourquoi PAS de `FORCE ROW LEVEL SECURITY` : FORCE soumet aussi le
-- propriétaire des tables à RLS. Comme aucune policy n'existe (et qu'aucune ne
-- doit exister tant qu'il n'y a pas d'authentification utilisateur, TEC-18),
-- FORCE verrouillerait l'application elle-même. Le propriétaire est une
-- connexion serveur de confiance ; ce n'est pas une surface exposée.
-- Le jour où Tipi passe à deux appareils et à une vraie authentification, ce
-- fichier gagne des policies `family_id`-scopées et FORCE devient pertinent.
-- Le chemin d'évolution est décrit en partie E.
-- =============================================================================


-- =============================================================================
-- PARTIE A — RLS, table par table
-- =============================================================================
-- Chaque bloc est identique par construction : c'est voulu. Une table qui
-- aurait une politique particulière serait une exception à justifier.

-- -- family : le foyer. Contient la durée de rétention audio (SEC-05).
ALTER TABLE public.family ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family FROM anon, authenticated;
COMMENT ON TABLE public.family IS
  'RLS activée, aucune policy : anon et authenticated ne lisent ni n''écrivent rien (SEC-03).';

-- -- child : profil enfant. gem_balance y vit : lecture seule côté client, via
-- -- la route serveur GET /api/coffre. Aucune écriture client possible (SEC-06).
ALTER TABLE public.child ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.child FROM anon, authenticated;
COMMENT ON TABLE public.child IS
  'RLS activée, aucune policy. gem_balance n''est écrit que par le service pierres, en transaction, depuis un recalcul de gem_ledger (TEC-11, SEC-06).';

-- -- homework : photo, texte OCR. Donnée scolaire, jamais exposée au client
-- -- autrement que par une URL signée émise côté serveur.
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.homework FROM anon, authenticated;
COMMENT ON TABLE public.homework IS
  'RLS activée, aucune policy (SEC-03).';

-- -- exercise : consignes et indices pré-générés (TEC-07).
ALTER TABLE public.exercise ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exercise FROM anon, authenticated;
COMMENT ON TABLE public.exercise IS
  'RLS activée, aucune policy. Les 4 indices sont servis un par un par la route serveur : le client ne reçoit jamais le tableau complet d''avance (PED-02).';

-- -- session : état de la machine à états, persisté à chaque transition.
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session FROM anon, authenticated;
COMMENT ON TABLE public.session IS
  'RLS activée, aucune policy. L''état ne se modifie que par POST /api/session/:id/transition (TEC-10, PRD-18).';

-- -- attempt : transcriptions et audios de l'enfant. Donnée la plus sensible
-- -- du produit : voix d'un mineur (SEC-05).
ALTER TABLE public.attempt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.attempt FROM anon, authenticated;
COMMENT ON TABLE public.attempt IS
  'RLS activée, aucune policy. audio_url pointe un objet du bucket privé `audios`, purgé selon family.retention_audio_jours (SEC-05).';

-- -- gem_ledger : source de vérité du solde. Table la plus protégée du schéma.
ALTER TABLE public.gem_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gem_ledger FROM anon, authenticated;
COMMENT ON TABLE public.gem_ledger IS
  'RLS activée, aucune policy. Écriture uniquement par le service pierres côté serveur. delta > 0 garanti par CHECK (ETH-04). Une raison par session, garanti par l''unique (session_id, raison).';

-- -- reward_threshold : paliers définis par le parent (PRD-14, ETH-05).
ALTER TABLE public.reward_threshold ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reward_threshold FROM anon, authenticated;
COMMENT ON TABLE public.reward_threshold IS
  'RLS activée, aucune policy. description est du texte libre parent : jamais rendu sur un écran enfant (ETH-05).';

-- -- settings_access : hash du code parent (SEC-01) et compteur d'essais (SEC-02).
ALTER TABLE public.settings_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.settings_access FROM anon, authenticated;
COMMENT ON TABLE public.settings_access IS
  'RLS activée, aucune policy. code_hash ne sort jamais d''une route (SEC-01, SEC-08).';

-- -- calibration_log : journal de calibration OCR (TEC-16).
ALTER TABLE public.calibration_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.calibration_log FROM anon, authenticated;
COMMENT ON TABLE public.calibration_log IS
  'RLS activée, aucune policy. payload_ia est le payload anonymisé réellement envoyé au fournisseur : il ne contient ni prénom ni photo (SEC-04).';

-- Privilèges futurs : aucune table créée plus tard ne doit hériter de droits.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Ceinture et bretelles : sans USAGE sur le schéma, PostgREST ne résout même
-- pas le nom de la table.
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;


-- =============================================================================
-- PARTIE B — Contraintes non exprimables dans schema.prisma
-- =============================================================================
-- Prisma ne sait pas déclarer un CHECK ni un index unique partiel. Ces
-- contraintes sont pourtant exigées AU NIVEAU DU SCHÉMA, pas seulement du code.
-- Elles sont rejouables à l'infini (IF NOT EXISTS / DO $$).

-- ETH-04 — aucun delta négatif, jamais. Une pierre ne se perd pas.
-- Une tentative d'écriture d'un delta <= 0 échoue au niveau de Postgres, même
-- si le code applicatif était fautif ou contourné.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gem_ledger_delta_positif'
  ) THEN
    ALTER TABLE public.gem_ledger
      ADD CONSTRAINT gem_ledger_delta_positif CHECK (delta > 0);
  END IF;
END $$;

-- Barème de 3.7 : +1 par étape, +1 bonus. Aucun crédit ne dépasse 1.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gem_ledger_delta_max_un'
  ) THEN
    ALTER TABLE public.gem_ledger
      ADD CONSTRAINT gem_ledger_delta_max_un CHECK (delta <= 1);
  END IF;
END $$;

-- SEC-06 — le solde ne peut pas devenir négatif par un chemin quelconque.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'child_gem_balance_positif'
  ) THEN
    ALTER TABLE public.child
      ADD CONSTRAINT child_gem_balance_positif CHECK (gem_balance >= 0);
  END IF;
END $$;

-- SEC-02 — compteur de tentatives toujours sensé.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_access_tentatives_positif'
  ) THEN
    ALTER TABLE public.settings_access
      ADD CONSTRAINT settings_access_tentatives_positif CHECK (tentatives_echouees >= 0);
  END IF;
END $$;

-- PRD-14 — un palier se définit sur un nombre de pierres strictement positif.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reward_threshold_gems_positif'
  ) THEN
    ALTER TABLE public.reward_threshold
      ADD CONSTRAINT reward_threshold_gems_positif CHECK (gems_requis > 0);
  END IF;
END $$;

-- SEC-05 — durée de rétention audio bornée : 0 (ne rien conserver) à 365 jours.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_retention_audio_bornee'
  ) THEN
    ALTER TABLE public.family
      ADD CONSTRAINT family_retention_audio_bornee
      CHECK (retention_audio_jours BETWEEN 0 AND 365);
  END IF;
END $$;

-- PRD-18, TEC-10 — une seule session active par enfant à la fois.
-- Sans cette contrainte, deux onglets ou un double lancement créeraient deux
-- sessions concurrentes et la reprise deviendrait ambiguë.
CREATE UNIQUE INDEX IF NOT EXISTS session_une_active_par_enfant
  ON public.session (child_id)
  WHERE etat NOT IN ('termine', 'abandon_parent');

-- TEC-10 — `etape_courante` n'a de sens que dans un état qui joue une étape.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_etape_courante_coherente'
  ) THEN
    ALTER TABLE public.session
      ADD CONSTRAINT session_etape_courante_coherente
      CHECK (
        -- avant l'entrée dans la première étape, aucune étape courante
        (etat NOT IN ('idle', 'annonce') OR etape_courante IS NULL)
        -- dans une étape, en transition ou en pause, une étape courante existe
        AND (etat NOT IN ('etape_lecture', 'etape_maths', 'transition', 'pause')
             OR etape_courante IS NOT NULL)
      );
  END IF;
END $$;


-- =============================================================================
-- PARTIE C — Storage
-- =============================================================================
-- Trois buckets, deux privés et un public. Le client n'a aucune clé Supabase :
-- il n'atteint les buckets privés que par une URL signée émise par une route
-- serveur, et le bucket public que par son URL publique.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- PRD-03 — photos de devoirs. Privé. 8 Mo, l'image est compressée côté client.
  ('devoirs', 'devoirs', false, 8388608, ARRAY['image/jpeg','image/png','image/webp']),
  -- SEC-05 — enregistrements vocaux de l'enfant. Privé. Purge planifiée.
  ('audios', 'audios', false, 10485760, ARRAY['audio/webm','audio/mpeg','audio/mp4','audio/ogg']),
  -- TEC-09b — cache TTS des phrases de Pilou. PUBLIC en lecture, et c'est un
  -- choix assumé : le contenu est la voix de Pilou disant des phrases de la
  -- banque de contenu, identiques pour tous, sans aucune donnée identifiante.
  -- Le chemin est un sha256 du texte rendu : il n'est pas énumérable et ne
  -- révèle rien. Public en lecture = zéro appel serveur sur un cache touché,
  -- donc le budget de latence de 3.8 tient sans clé côté client.
  ('tts-cache', 'tts-cache', true, 5242880, ARRAY['audio/mpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS de storage.objects : Supabase l'active déjà. On enlève tout ce qui
-- pourrait traîner et on ne pose qu'UNE policy, en lecture, sur le seul bucket
-- public.
DROP POLICY IF EXISTS "tts_cache_lecture_publique" ON storage.objects;
CREATE POLICY "tts_cache_lecture_publique"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tts-cache');

-- Aucune policy d'INSERT, d'UPDATE ni de DELETE pour anon et authenticated, sur
-- aucun bucket : un client ne peut donc ni téléverser, ni écraser, ni supprimer
-- un objet, y compris dans `tts-cache`. Les écritures passent toutes par
-- `SUPABASE_SERVICE_ROLE_KEY`, côté serveur (TEC-13).
-- Les buckets `devoirs` et `audios` n'ont aucune policy du tout : ils sont
-- injoignables sans URL signée.

-- Conventions de chemin, opposables en revue :
--   devoirs/<child_id>/<homework_id>.<ext>
--   audios/<child_id>/<session_id>/<attempt_id>.<ext>
--   tts-cache/<voix_id>/<sha256(texte_rendu)>.mp3   (TEC-09b)


-- =============================================================================
-- PARTIE D — Requêtes de preuve, rejouables par `securite-rgpd` et `red-team`
-- =============================================================================
-- Ces requêtes ne modifient rien. Elles servent aux tests de SEC-03 : leur
-- sortie est une preuve, pas une affirmation.

-- D1. Toutes les tables du schéma public ont RLS activée. Attendu : 0 ligne.
-- SELECT tablename FROM pg_tables
--  WHERE schemaname = 'public' AND rowsecurity IS FALSE;

-- D2. Aucune policy n'accorde quoi que ce soit à anon ou authenticated sur une
-- table métier. Attendu : 0 ligne.
-- SELECT schemaname, tablename, policyname, roles FROM pg_policies
--  WHERE schemaname = 'public';

-- D3. anon et authenticated n'ont aucun privilège de table. Attendu : 0 ligne.
-- SELECT table_name, privilege_type FROM information_schema.role_table_grants
--  WHERE grantee IN ('anon', 'authenticated') AND table_schema = 'public';

-- D4. ETH-04 : la contrainte de delta positif existe. Attendu : 1 ligne.
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conname = 'gem_ledger_delta_positif';

-- D5. ETH-04, preuve destructive à jouer dans une transaction annulée.
-- Attendu : ERROR  new row violates check constraint.
-- BEGIN;
--   INSERT INTO public.gem_ledger (id, child_id, session_id, delta, raison)
--   VALUES (gen_random_uuid(), '<child_id>', NULL, -1, 'etape_lecture_terminee');
-- ROLLBACK;

-- D6. Invariant du solde (3.7) : attendu 0 ligne.
-- SELECT c.id, c.gem_balance, COALESCE(SUM(g.delta), 0) AS somme_ledger
--   FROM public.child c LEFT JOIN public.gem_ledger g ON g.child_id = c.id
--  GROUP BY c.id, c.gem_balance
-- HAVING c.gem_balance <> COALESCE(SUM(g.delta), 0);


-- =============================================================================
-- PARTIE E — Ce que ce fichier deviendra, et ce qu'il ne fait pas aujourd'hui
-- =============================================================================
-- TEC-18 : il n'y a pas de synchronisation multi-appareils en V1, donc pas
-- d'authentification Supabase, donc pas de `auth.uid()` à qui rattacher une
-- ligne. Écrire aujourd'hui des policies `family_id = auth.jwt() ->> ...` serait
-- du code mort qui donnerait une fausse impression de sécurité : elles ne
-- seraient jamais évaluées, donc jamais testées.
-- Le jour où un second appareil arrive :
--   1. activer Supabase Auth, une identité par parent ;
--   2. ajouter une table de liaison identité -> family_id ;
--   3. remplacer, dans la partie A, chaque REVOKE par un GRANT restreint plus
--      une policy `USING (family_id = tipi.famille_courante())` ;
--   4. passer les tables en FORCE ROW LEVEL SECURITY et donner à la connexion
--      applicative un rôle non propriétaire.
-- L'état de session vit déjà en base (TEC-18) : cette évolution ne touche ni le
-- moteur de session, ni le service pierres, ni les routes.
