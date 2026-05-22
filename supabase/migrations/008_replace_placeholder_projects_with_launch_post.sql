-- ============================================================
-- BalloonCraft KC — Replace placeholder portfolio entries
-- with a single launch announcement post
-- ============================================================

DELETE FROM public.projects;

INSERT INTO public.projects (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  gallery_images,
  category,
  tags,
  meta_title,
  meta_description,
  og_image,
  status,
  featured,
  event_location,
  publish_date,
  author,
  focus_keyword,
  service_types,
  event_types,
  geo_city
) VALUES (
  'BalloonCraft KC Is Open for Business in Kansas City',
  'ballooncraft-kc-launch-kansas-city',
  'We are proud to officially launch BalloonCraft KC with custom balloon arches, garlands, walls, and backdrops for Kansas City, Overland Park, Olathe, Lee''s Summit, and the surrounding metro.',
  $$<h2>We''re officially live</h2>
<p>BalloonCraft KC is proud to be launching in the Kansas City metro. We''re ready to create custom balloon arches, garlands, walls, backdrops, and statement installs for birthdays, weddings, baby showers, graduations, school events, grand openings, and corporate celebrations.</p>
<h2>Ready for business across the KC metro</h2>
<p>We serve Kansas City, Overland Park, Olathe, Lee''s Summit, Lenexa, Leawood, Shawnee, Prairie Village, Independence, and nearby communities. Whether you need a polished photo backdrop, a front-entry balloon arch, or a full custom installation, we''re excited to help make your event feel memorable and easy to pull off.</p>
<h2>Proud to be launching</h2>
<p>This launch marks the start of something we''ve been building with a lot of care. We''re proud to be opening our doors, sharing our work, and helping local families, planners, schools, and businesses celebrate well.</p>
<p>If you''re planning an upcoming event, we''d love to hear from you and put together something custom.</p>$$,
  '/logo.png',
  ARRAY[]::text[],
  'announcement',
  ARRAY['launch', 'kansas city', 'balloon decor', 'grand opening'],
  'BalloonCraft KC Is Open for Business in Kansas City | BalloonCraft KC',
  'BalloonCraft KC is officially launching with custom balloon decor for Kansas City, Overland Park, Olathe, Lee''s Summit, and the surrounding metro.',
  '/logo.png',
  'published',
  true,
  'Kansas City Metro',
  '2026-05-22',
  'BalloonCraft KC',
  'balloon decor Kansas City',
  ARRAY['Balloon Arch', 'Balloon Garland', 'Custom Installation'],
  ARRAY['Community Event', 'Grand Opening'],
  'Kansas City'
);
