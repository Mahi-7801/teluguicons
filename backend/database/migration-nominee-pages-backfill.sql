-- =====================================================================
-- Telugu Icon Awards - ONE-TIME backfill for nominee identity
-- PostgreSQL / Supabase. Idempotent: safe to run more than once.
--
-- Run AFTER backend/database/migration-nominee-pages.sql.
--
-- WHAT THIS DOES
--   1. Carries achievements + every social URL across from the nomination
--      instead of squashing them into `bio` / `social_handle`.
--   2. Rewrites messy slugs into clean, human-readable public URLs:
--        ananya-nagalla-k3f9a2   ->  ananya-nagalla
--      (a numeric suffix is only added if the clean form is already taken)
--   3. Assigns sequential internal IDs in the required TIC26-00001 format.
--
-- ⚠️  WARNING - READ BEFORE RUNNING
--   Step 2 CHANGES PUBLIC URLs. It is safe to run before the campaign goes
--   live (nothing has been shared yet). Once a nominee link, poster, QR code
--   or video has been distributed, do NOT re-run step 2: the old URL will 404
--   and you will have to re-print every campaign asset.
--
--   To skip URL rewriting entirely, comment out STEP 2 below. Step 1 and
--   Step 3 are always safe.
-- =====================================================================

-- ========== STEP 1 - backfill profile fields from the nomination ==========
UPDATE public.nominees n
   SET achievements = COALESCE(n.achievements, m.achievements),
       nomination_id = COALESCE(n.nomination_id, m.id),
       youtube_url   = COALESCE(n.youtube_url,   m.youtube_url),
       instagram_url = COALESCE(n.instagram_url, m.instagram_url),
       facebook_url  = COALESCE(n.facebook_url,  m.facebook_url),
       website_url   = COALESCE(n.website_url,   m.website_url),
       other_profile_url = COALESCE(n.other_profile_url, m.other_profile_url),
       social_handle = COALESCE(
         n.social_handle, m.instagram_url, m.youtube_url, m.facebook_url,
         m.other_profile_url, m.website_url
       )
  FROM public.nominations m
 WHERE n.nomination_id IS NULL
   AND LOWER(TRIM(m.creator_name)) = LOWER(TRIM(n.full_name))
   AND m.category_id = n.category_id
   AND NOT EXISTS (SELECT 1 FROM public.nominees x WHERE x.nomination_id = m.id);

-- ========== STEP 2 - clean public slugs ==========
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  attempt INTEGER;
BEGIN
  FOR r IN
    SELECT n.id,
           n.slug,
           n.full_name,
           -- strip any previously-appended numeric/random suffix, then re-slugify
           regexp_replace(
             regexp_replace(
               regexp_replace(lower(n.full_name), '[^a-z0-9]+', '-', 'g'),
               '-[a-z0-9]{1,12}$', ''
             ),
             '(^-+|-+$)', '', 'g'
           ) AS clean_base
      FROM public.nominees n
  LOOP
    base := NULLIF(r.clean_base, '');
    IF base IS NULL THEN
      base := 'nominee-' || r.id;
    END IF;
    base := left(base, 180);

    -- already clean? skip
    IF r.slug = base THEN
      CONTINUE;
    END IF;

    candidate := base;
    attempt := 1;
    WHILE attempt <= 60 LOOP
      IF NOT EXISTS (SELECT 1 FROM public.nominees x WHERE x.slug = candidate AND x.id <> r.id) THEN
        EXIT;
      END IF;
      attempt := attempt + 1;
      candidate := left(base, 180 - length('-' || attempt::TEXT)) || '-' || attempt::TEXT;
    END LOOP;

    IF candidate <> r.slug THEN
      RAISE NOTICE 'nominee % : % -> %', r.id, r.slug, candidate;
      UPDATE public.nominees SET slug = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- ========== STEP 3 - sequential TIC26-##### internal IDs ==========
DO $$
DECLARE
  r RECORD;
  candidate VARCHAR(20);
  attempt INTEGER;
  taken BOOLEAN;
BEGIN
  FOR r IN
    SELECT id FROM public.nominees
     ORDER BY id ASC
  LOOP
    IF EXISTS (SELECT 1 FROM public.nominees WHERE id = r.id AND nominee_code ~ '^TIC26-\d{5}$') THEN
      CONTINUE;
    END IF;

    attempt := 0;
    LOOP
      attempt := attempt + 1;
      EXIT WHEN attempt > 20;
      candidate := public.next_nominee_code();
      SELECT NOT EXISTS (
        SELECT 1 FROM public.nominees WHERE nominee_code = candidate
      ) INTO taken;
      IF taken THEN
        UPDATE public.nominees SET nominee_code = candidate WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================================
-- Sanity check: every nominee should now have a unique code and a clean slug
-- =====================================================================
SELECT id, full_name, slug, nominee_code, status
  FROM public.nominees
 ORDER BY id;
