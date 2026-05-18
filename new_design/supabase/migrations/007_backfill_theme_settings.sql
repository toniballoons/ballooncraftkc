-- ============================================================
-- Backfill new_design_theme_settings from legacy site_themes
-- ------------------------------------------------------------
-- The new theme picker persists to public.site_content under
-- page_key = 'new_design_theme_settings'. Older environments
-- may still only have the active theme stored in public.site_themes.
-- This migration bridges the legacy value into the new store.
-- ============================================================

WITH active_legacy_theme AS (
  SELECT
    CASE key
      WHEN 'black_tie' THEN 'black_tie_gala'
      WHEN 'circus_fun' THEN 'carnival_big_top'
      WHEN 'corporate_clean' THEN 'corporate_pro'
      WHEN 'neon_party' THEN 'neon_underground'
      WHEN 'unicorn_dream' THEN 'unicorn_dreams'
      WHEN 'raspberry_sorbet_v1' THEN 'pink_lemonade'
      WHEN 'vintage_gold_v1' THEN 'art_deco_gold'
      WHEN 'tech_modern' THEN 'future_tech'
      WHEN 'dinosaur_bash' THEN 'deep_jungle'
      WHEN 'cartoon_pop' THEN 'pop_art'
      ELSE NULL
    END AS theme_id
  FROM public.site_themes
  WHERE active = true
  ORDER BY updated_at DESC
  LIMIT 1
)
INSERT INTO public.site_content (page_key, content_json)
SELECT
  'new_design_theme_settings',
  json_build_object('theme_id', active_legacy_theme.theme_id)::text
FROM active_legacy_theme
WHERE active_legacy_theme.theme_id IS NOT NULL
ON CONFLICT (page_key) DO UPDATE
SET
  content_json = EXCLUDED.content_json,
  updated_at = now();
