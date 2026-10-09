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
--        ananya-nagalla-447   ->  ananya-nagalla
--        prasad-tech-in-telugu-447 -> prasad-tech-in-telugu
--      (a numeric suffix is only removed when it really looks generated)
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
-- The slug is always recomputed from full_name, so re-running this after a
-- change to the rule below simply repairs whatever the previous rule produced.
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
           -- 1. lowercase, any run of non-alphanumerics becomes a single dash
           regexp_replace(
             regexp_replace(lower(n.full_name), '[^a-z0-9]+', '-', 'g'),
             '(^-+|-+$)', '', 'g'
           ) AS from_name
      FROM public.nominees n
  LOOP
    base := NULLIF(r.from_name, '');
    IF base IS NULL THEN
      base := 'nominee-' || r.id;
    END IF;
    base := left(base, 180);

    -- 2. Drop ONE trailing segment only when it is purely numeric.
    --    That is the shape the old generator appended (random 0-999 int).
    --    Do NOT strip alphanumeric segments: they are usually part of the
    --    real name ("Prasad Tech in Telugu" -> not "...-in").
    IF base ~ '-[0-9]+$' THEN
      base := regexp_replace(base, '-[0-9]+$', '');
      base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    END IF;

    IF base = '' THEN
      base := 'nominee-' || r.id;
    END IF;

    -- already correct and unique? nothing to do
    IF r.slug = base THEN
      CONTINUE;
    END IF;

    -- 3. Only if the clean form is taken do we add a numeric suffix
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
-- Renumbers every nominee to TIC26-00001.. in id order, then parks the
-- sequence just past the highest one so the next insert continues cleanly.
DO $$
DECLARE
  counter INTEGER := 0;
  r RECORD;
  candidate VARCHAR(20);
  attempt INTEGER;
  taken BOOLEAN;
BEGIN
  FOR r IN
    SELECT id FROM public.nominees
     ORDER BY id ASC
  LOOP
    counter := counter + 1;
    candidate := 'TIC26-' || LPAD(counter::TEXT, 5, '0');
    -- skip if another row already holds it
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      EXIT WHEN attempt > 100;
      SELECT NOT EXISTS (
        SELECT 1 FROM public.nominees WHERE nominee_code = candidate AND id <> r.id
      ) INTO taken;
      IF taken THEN
        UPDATE public.nominees SET nominee_code = candidate WHERE id = r.id;
        EXIT;
      END IF;
      counter := counter + 1;
      candidate := 'TIC26-' || LPAD(counter::TEXT, 5, '0');
    END LOOP;
  END LOOP;

  PERFORM setval('public.nominee_code_seq', GREATEST(counter, 1));
END $$;

-- =====================================================================
-- Sanity check: every nominee should now have a unique code and a clean slug
-- =====================================================================
SELECT id, full_name, slug, nominee_code, status
  FROM public.nominees
 ORDER BY id;