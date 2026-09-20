-- =============================================================================
-- Tipi — Row Level Security, contraintes et Storage
-- =============================================================================
-- À appliquer sur le projet Supabase (région UE, TEC-02) APRÈS
-- `prisma migrate deploy`, qui crée les tables.
--
-- RÔLE D'EXÉCUTION, obligatoire : ce fichier doit être joué **sous le même rôle
-- que les migrations Prisma**, c'est-à-dire le rôle de `DIRECT_URL`. Deux
-- raisons : les `ALTER TABLE` exigent d'être propriétaire, et surtout
-- `ALTER DEFAULT PRIVILEGES` sans clause `FOR ROLE` ne s'applique qu'aux objets
-- créés par le rôle courant — joué sous un autre rôle que celui des migrations,
-- il ne couvrirait aucune table future. La partie A l'écrit explicitement avec
-- `FOR ROLE`, à partir du rôle courant, et imprime ce rôle par un RAISE NOTICE
-- pour que l'opérateur constate sous quel rôle la garantie a été posée.
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
  'RLS activée, aucune policy. Écriture uniquement par le service pierres côté serveur. delta > 0 garanti par CHECK (ETH-04). Une raison par session, garanti par l''unique (session_id, raison) sur une colonne session_id OBLIGATOIRE.';

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

-- -- _prisma_migrations : créée par `prisma migrate deploy`, pas par le schéma.
-- -- SEC-03 dit « toutes les tables », pas « toutes les tables métier ». Elle ne
-- -- contient aucune donnée personnelle, mais elle révèle la structure et
-- -- l'historique du schéma, et surtout : sans elle, la vérification V1 de la
-- -- partie D échoue. Traitée exactement comme les dix autres.
-- -- Le DO protège le cas où le fichier serait joué avant la première migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations') THEN
    EXECUTE 'ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public._prisma_migrations FROM anon, authenticated';
    EXECUTE 'COMMENT ON TABLE public._prisma_migrations IS ''RLS activée, aucune policy. Table technique de Prisma, couverte au même titre que les tables métier (SEC-03).''';
  ELSE
    RAISE NOTICE 'public._prisma_migrations absente : jouez d''abord prisma migrate deploy.';
  END IF;
END $$;

-- Privilèges futurs : aucune table créée plus tard par le rôle des migrations
-- ne doit hériter de droits. `FOR ROLE current_user` rend explicite ce que la
-- forme sans clause laissait implicite (et faux si le fichier est joué sous un
-- autre rôle que les migrations — voir l'en-tête et le RAISE NOTICE ci-dessous).
DO $$
DECLARE r text := current_user;
BEGIN
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated', r);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated', r);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated', r);
  RAISE NOTICE 'ALTER DEFAULT PRIVILEGES posé pour le rôle %. Ce rôle doit être celui de DIRECT_URL.', r;
END $$;

-- Ceinture et bretelles : sans USAGE sur le schéma, PostgREST ne résout même
-- pas le nom de la table.
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;


-- =============================================================================
-- PARTIE B — Contraintes non exprimables dans schema.prisma
-- =============================================================================
-- Prisma ne sait déclarer ni un CHECK ni un index unique partiel. Ces
-- contraintes sont pourtant exigées AU NIVEAU DU SCHÉMA, pas seulement du code.
-- Elles sont rejouables à l'infini (IF NOT EXISTS / DO $$).
-- Les huit sont listées en tête de prisma/schema.prisma, pour que `dev-feature`
-- les voie sans ouvrir ce fichier.

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
-- Deux niveaux volontairement distincts : ce CHECK est une borne de schéma,
-- qui interdit l'absurde ; la route PATCH /api/reglages/audio n'accepte que les
-- trois valeurs offertes au parent en 7.14 (0, 7, 30). Ajouter une quatrième
-- option d'interface ne demandera donc pas de migration.
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
-- Le pendant applicatif obligatoire est la fermeture automatique d'une session
-- périmée (transition T12), sans laquelle cette contrainte transformerait une
-- soirée abandonnée en blocage de toutes les soirées suivantes.
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
-- Quatre buckets, trois privés et un public.
-- Le client n'a aucune clé Supabase : il n'atteint les buckets privés que par
-- une URL signée émise par une route serveur, et le bucket public que par son
-- URL publique.
--
-- RÈGLE DE SÉPARATION DU CACHE TTS, opposable (SEC-04, TEC-09b) :
--   un clip dont le texte rendu contient le prénom de l'enfant ne va JAMAIS
--   dans le bucket public. La clé de cache étant un sha256 du texte rendu, et
--   `content/encouragements.json` étant versionné dans le dépôt, un chemin
--   public serait un oracle : il suffirait de calculer le sha256 pour un prénom
--   deviné et de lire le code HTTP pour confirmer le prénom de l'enfant. Un
--   sha256 d'un corpus public n'est pas un secret, c'est un index.
--   Mesure sur le corpus livré : 460 clips sans prénom (public), 14 clips avec
--   prénom (privé). Le détail est en section 12.2 de architecture.out.md.
--
-- Les deux tailles maximales ci-dessous sont la SEULE duplication assumée du
-- livrable : Storage ne peut pas lire le code applicatif. Elles doivent rester
-- égales à UPLOAD_MAX_PHOTO_OCTETS et UPLOAD_MAX_AUDIO_OCTETS de .env.example,
-- sans quoi un fichier accepté par la route serait rejeté silencieusement par
-- Storage. La vérification V7 de la partie D les relit et les affiche.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- PRD-03 — photos de devoirs. Privé. 8 Mo = UPLOAD_MAX_PHOTO_OCTETS.
  ('devoirs', 'devoirs', false, 8388608, ARRAY['image/jpeg','image/png','image/webp']),
  -- SEC-05 — enregistrements vocaux de l'enfant. Privé. Purge planifiée.
  -- 10 Mo = UPLOAD_MAX_AUDIO_OCTETS.
  ('audios', 'audios', false, 10485760, ARRAY['audio/webm','audio/mpeg','audio/mp4','audio/ogg']),
  -- TEC-09b — cache TTS des phrases SANS donnée identifiante. Public en
  -- lecture. Contenu : la voix de Pilou disant des phrases de la banque de
  -- contenu, rigoureusement les mêmes pour tout enfant, ou une matière
  -- (« la lecture », « les maths »). Aucun prénom, aucune donnée de devoir.
  -- Public en lecture = zéro appel serveur sur un cache touché, donc le budget
  -- de latence de la section 12 de architecture.out.md tient sans clé côté
  -- client.
  ('tts-cache', 'tts-cache', true, 5242880, ARRAY['audio/mpeg']),
  -- TEC-09b + SEC-04 — cache TTS des clips PERSONNELS : ceux qui prononcent le
  -- prénom de l'enfant, et ceux qui disent le texte d'un devoir. Privé, servi
  -- par URL signée de courte durée via POST /api/voix. Le cache joue son rôle
  -- d'économie de quota (une synthèse par phrase et par enfant) sans rien
  -- exposer.
  ('tts-prive', 'tts-prive', false, 5242880, ARRAY['audio/mpeg'])
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
-- Les buckets `devoirs`, `audios` et `tts-prive` n'ont aucune policy du tout :
-- ils sont injoignables sans URL signée.

-- Conventions de chemin, opposables en revue :
--   devoirs/<child_id>/<homework_id>.<ext>
--   audios/<child_id>/<session_id>/<attempt_id>.<ext>
--   tts-cache/<voix_id>/<sha256(texte_rendu)>.mp3            (aucun jeton {prenom})
--   tts-prive/<child_id>/<voix_id>/<sha256(texte_rendu)>.mp3 (prénom ou devoir)


-- =============================================================================
-- PARTIE D — Vérifications exécutables
-- =============================================================================
-- Ce ne sont plus des commentaires : chaque bloc S'EXÉCUTE à l'application du
-- fichier et LÈVE UNE EXCEPTION si l'invariant est faux. Appliquer ce fichier
-- sur une base non conforme échoue donc bruyamment, au lieu de laisser une
-- consigne que personne ne joue.
-- `securite-rgpd` en fera en P7 des tests d'intégration avec un client anonyme
-- réel ; ces vérifications-ci prouvent l'état du catalogue, pas le
-- comportement de PostgREST, et c'est une limite assumée.

-- V1 — RLS activée sur TOUTES les tables du schéma public, sans exception et
-- sans liste en dur : une table future non couverte fait échouer ce bloc.
DO $$
DECLARE manquantes text;
BEGIN
  SELECT string_agg(tablename, ', ') INTO manquantes
    FROM pg_tables WHERE schemaname = 'public' AND rowsecurity IS FALSE;
  IF manquantes IS NOT NULL THEN
    RAISE EXCEPTION 'SEC-03 : RLS absente sur : %', manquantes;
  END IF;
  RAISE NOTICE 'V1 OK — RLS activée sur toutes les tables de public.';
END $$;

-- V2 — aucune policy n'accorde quoi que ce soit à anon ou authenticated sur une
-- table métier du schéma public.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_policies WHERE schemaname = 'public';
  IF n > 0 THEN
    RAISE EXCEPTION 'SEC-03 : % policy(ies) inattendue(s) dans public', n;
  END IF;
  RAISE NOTICE 'V2 OK — aucune policy sur les tables métier.';
END $$;

-- V3 — anon et authenticated n'ont aucun privilège de table dans public.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM information_schema.role_table_grants
    WHERE grantee IN ('anon', 'authenticated') AND table_schema = 'public';
  IF n > 0 THEN
    RAISE EXCEPTION 'SEC-03 : % privilège(s) de table restant(s) pour anon/authenticated', n;
  END IF;
  RAISE NOTICE 'V3 OK — aucun privilège de table pour anon ni authenticated.';
END $$;

-- V4 — les huit contraintes de la partie B existent réellement.
DO $$
DECLARE attendues text[] := ARRAY[
  'gem_ledger_delta_positif', 'gem_ledger_delta_max_un', 'child_gem_balance_positif',
  'settings_access_tentatives_positif', 'reward_threshold_gems_positif',
  'family_retention_audio_bornee', 'session_etape_courante_coherente'];
  c text; manquantes text := '';
BEGIN
  FOREACH c IN ARRAY attendues LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c) THEN
      manquantes := manquantes || c || ' ';
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                 WHERE schemaname = 'public' AND indexname = 'session_une_active_par_enfant') THEN
    manquantes := manquantes || 'session_une_active_par_enfant ';
  END IF;
  IF manquantes <> '' THEN
    RAISE EXCEPTION 'Contraintes manquantes : %', manquantes;
  END IF;
  RAISE NOTICE 'V4 OK — les 8 contraintes de la partie B sont en place.';
END $$;

-- V5 — ETH-04, preuve destructive : un delta négatif DOIT être refusé.
-- Le bloc tente l'insertion interdite et échoue si elle passe.
DO $$
DECLARE un_child uuid; un_session uuid;
BEGIN
  SELECT id INTO un_child FROM public.child LIMIT 1;
  SELECT id INTO un_session FROM public.session LIMIT 1;
  IF un_child IS NULL OR un_session IS NULL THEN
    RAISE NOTICE 'V5 ignorée — base vide, rejouer après le seed.';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO public.gem_ledger (id, child_id, session_id, delta, raison)
    VALUES (gen_random_uuid(), un_child, un_session, -1, 'etape_lecture_terminee');
    RAISE EXCEPTION 'ETH-04 VIOLÉE : un delta négatif a été accepté.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'V5 OK — delta négatif refusé par la base.';
  END;
  RAISE EXCEPTION 'V5 : annulation volontaire de la transaction de test.';
END $$;
-- NOTE : V5 se termine par une exception volontaire pour ne rien laisser en
-- base. Jouez-la donc SÉPARÉMENT (psql -c), pas dans la même transaction que le
-- reste du fichier. Commentez ce bloc pour une application non interactive.

-- V6 — invariant du solde (3.7) : gem_balance == SUM(gem_ledger.delta).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM (
    SELECT c.id FROM public.child c
      LEFT JOIN public.gem_ledger g ON g.child_id = c.id
     GROUP BY c.id, c.gem_balance
    HAVING c.gem_balance <> COALESCE(SUM(g.delta), 0)
  ) x;
  IF n > 0 THEN
    RAISE EXCEPTION 'SEC-06 : % enfant(s) dont le solde diffère de la somme du ledger', n;
  END IF;
  RAISE NOTICE 'V6 OK — solde == somme du ledger pour tous les enfants.';
END $$;

-- V7 — les tailles de Storage sont celles attendues par les routes.
-- À comparer avec UPLOAD_MAX_PHOTO_OCTETS et UPLOAD_MAX_AUDIO_OCTETS.
DO $$
DECLARE p bigint; a bigint;
BEGIN
  SELECT file_size_limit INTO p FROM storage.buckets WHERE id = 'devoirs';
  SELECT file_size_limit INTO a FROM storage.buckets WHERE id = 'audios';
  RAISE NOTICE 'V7 — devoirs: % octets, audios: % octets (doivent égaler UPLOAD_MAX_PHOTO_OCTETS et UPLOAD_MAX_AUDIO_OCTETS).', p, a;
END $$;

-- V8 — SEC-04 : le bucket public ne doit contenir aucun clip personnel.
-- Contrôle structurel : `tts-prive` existe et n'est pas public.
DO $$
DECLARE est_public boolean;
BEGIN
  SELECT public INTO est_public FROM storage.buckets WHERE id = 'tts-prive';
  IF est_public IS NULL THEN
    RAISE EXCEPTION 'SEC-04 : bucket tts-prive absent ; les clips à prénom n''ont nulle part où aller.';
  END IF;
  IF est_public THEN
    RAISE EXCEPTION 'SEC-04 : bucket tts-prive marqué public.';
  END IF;
  RAISE NOTICE 'V8 OK — tts-prive existe et est privé.';
END $$;


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
--   3. CRÉER D'ABORD les policies, ENSUITE seulement rendre le schéma
--      atteignable : `GRANT USAGE ON SCHEMA public` et les `GRANT` de table
--      doivent être les DERNIÈRES commandes jouées. Dans l'ordre inverse, il
--      existerait une fenêtre pendant laquelle le schéma est atteignable et
--      aucune policy n'existe : tout serait ouvert. Cette séquence est la seule
--      partie délicate de la migration ;
--   4. passer les tables en FORCE ROW LEVEL SECURITY et donner à la connexion
--      applicative un rôle non propriétaire.
-- L'état de session vit déjà en base (TEC-18) : cette évolution ne touche ni le
-- moteur de session, ni le service pierres, ni les routes.
