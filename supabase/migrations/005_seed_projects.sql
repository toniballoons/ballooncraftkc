-- ============================================================
-- BalloonCraft KC — Placeholder Portfolio Posts Seed
-- Run this in the Supabase SQL editor after 004_seed_testimonials.sql
-- All posts are published and fully editable from /admin/projects
-- Replace images and content with real event photos as you collect them.
-- ============================================================

INSERT INTO projects (
  title, slug, excerpt, content, featured_image, gallery_images,
  category, tags, service_types, event_types, geo_city,
  status, featured, publish_date, author,
  meta_title, meta_description, focus_keyword
) VALUES

(
  'Pink & Gold Balloon Arch — Overland Park Birthday Party',
  'pink-gold-balloon-arch-overland-park-birthday',
  'A stunning pink and gold organic balloon arch for Emma''s 7th birthday party in Overland Park. The arch framed the dessert table perfectly and became the centerpiece of every photo.',
  '## The Event

Emma''s parents wanted something magical for her 7th birthday — and that''s exactly what we delivered. We created a lush organic balloon arch in blush pink, rose gold, and white that stretched over 10 feet wide above the dessert table.

## The Design

The arch featured a mix of latex balloons in three sizes, with gold foil star accents and white cloud-shaped balloons woven throughout. We added a custom "Happy Birthday Emma" balloon letter set in the center.

## The Result

Every single guest stopped to take photos in front of the arch. The birthday girl was absolutely thrilled — she said it looked like a princess castle. This is exactly why we love what we do!

**Colors:** Blush pink, rose gold, white, champagne
**Size:** 10-foot wide organic arch
**Location:** Private residence, Overland Park, KS',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop'
  ],
  'birthday',
  ARRAY['balloon arch', 'birthday', 'pink', 'gold', 'overland park'],
  ARRAY['Balloon Arch'],
  ARRAY['Birthday'],
  'Overland Park',
  'published',
  true,
  '2026-03-15',
  'BalloonCraft KC',
  'Pink & Gold Balloon Arch — Overland Park Birthday Party | BalloonCraft KC',
  'Stunning pink and gold organic balloon arch for a 7th birthday party in Overland Park, KS. Custom balloon decorations by BalloonCraft KC.',
  'balloon arch Overland Park birthday'
),

(
  'Corporate Gala Balloon Columns — Kansas City Convention Center',
  'corporate-gala-balloon-columns-kansas-city',
  'Elegant white and gold balloon columns for a corporate awards gala at the Kansas City Convention Center. Six 8-foot columns flanked the stage and entrance, creating a sophisticated atmosphere.',
  '## The Event

A major Kansas City corporation hired us to transform their annual awards gala into an unforgettable experience. The brief: elegant, sophisticated, and impressive — without being over the top.

## The Design

We created six custom balloon columns in white and gold, each standing 8 feet tall. The columns featured a spiral pattern alternating between pearl white and metallic gold balloons, topped with a starburst crown of gold foil balloons.

Three columns flanked each side of the main stage, and two additional columns marked the entrance to the ballroom.

## The Result

The client told us it was the most impressive gala setup they had ever had. Employees were taking photos with the columns all night. We also provided a custom balloon backdrop behind the awards podium.

**Colors:** Pearl white, metallic gold
**Pieces:** 6 balloon columns + 1 backdrop
**Location:** Kansas City Convention Center',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop'
  ],
  'corporate',
  ARRAY['balloon columns', 'corporate', 'gala', 'gold', 'white', 'kansas city'],
  ARRAY['Balloon Column', 'Photo Backdrop'],
  ARRAY['Corporate', 'Gala'],
  'Kansas City',
  'published',
  true,
  '2026-02-20',
  'BalloonCraft KC',
  'Corporate Gala Balloon Columns — Kansas City Convention Center | BalloonCraft KC',
  'Elegant white and gold balloon columns for a corporate awards gala in Kansas City. Professional balloon decorations by BalloonCraft KC.',
  'balloon columns Kansas City corporate event'
),

(
  'Baby Blue Balloon Garland — Lee''s Summit Baby Shower',
  'baby-blue-balloon-garland-lees-summit-baby-shower',
  'A dreamy baby blue and white balloon garland for a baby boy shower in Lee''s Summit. The 15-foot garland draped beautifully across the gift table and created the perfect backdrop for photos.',
  '## The Event

A first-time mom-to-be wanted her baby shower to feel like a dream. She chose a soft blue and white cloud theme, and we brought it to life with a gorgeous organic balloon garland.

## The Design

The garland stretched 15 feet and featured baby blue, sky blue, white, and silver balloons in varying sizes. We added white cloud-shaped balloons and silver star foil accents throughout. The garland was installed along the back wall above the gift table.

## The Result

The mom-to-be cried happy tears when she saw it. Every photo from the shower looks absolutely beautiful. We love creating these special moments for families welcoming new babies.

**Colors:** Baby blue, sky blue, white, silver
**Size:** 15-foot organic garland
**Location:** Private residence, Lee''s Summit, MO',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop'
  ],
  'baby_shower',
  ARRAY['balloon garland', 'baby shower', 'blue', 'white', 'lees summit'],
  ARRAY['Balloon Garland'],
  ARRAY['Baby Shower'],
  'Lee''s Summit',
  'published',
  true,
  '2026-03-01',
  'BalloonCraft KC',
  'Baby Blue Balloon Garland — Lee''s Summit Baby Shower | BalloonCraft KC',
  'Beautiful baby blue and white organic balloon garland for a baby boy shower in Lee''s Summit, MO. Custom balloon decorations by BalloonCraft KC.',
  'balloon garland baby shower Lee''s Summit'
),

(
  'Wedding Balloon Arch — Olathe Wedding Reception',
  'wedding-balloon-arch-olathe-reception',
  'A romantic blush and ivory balloon arch for a wedding reception in Olathe. The arch framed the sweetheart table and created a breathtaking backdrop for the couple''s first dance photos.',
  '## The Event

Sarah and Michael wanted their wedding reception to feel like a fairytale. They chose a soft romantic palette of blush, ivory, and sage green — and we created the perfect balloon arch to match.

## The Design

The arch was a full 12-foot organic design featuring blush pink, ivory, and sage green balloons with eucalyptus greenery woven throughout. Delicate white rose foil balloons added an elegant touch. The arch framed the sweetheart table perfectly.

## The Result

The couple''s wedding photographer said it was one of the most beautiful setups she had ever photographed. The arch appeared in nearly every reception photo. Sarah told us it was exactly what she had dreamed of.

**Colors:** Blush pink, ivory, sage green
**Size:** 12-foot organic arch with greenery
**Location:** Private venue, Olathe, KS',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop'
  ],
  'wedding',
  ARRAY['balloon arch', 'wedding', 'blush', 'ivory', 'olathe'],
  ARRAY['Balloon Arch'],
  ARRAY['Wedding'],
  'Olathe',
  'published',
  false,
  '2026-02-14',
  'BalloonCraft KC',
  'Wedding Balloon Arch — Olathe Wedding Reception | BalloonCraft KC',
  'Romantic blush and ivory organic balloon arch for a wedding reception in Olathe, KS. Custom wedding balloon decorations by BalloonCraft KC.',
  'wedding balloon arch Olathe'
),

(
  'Graduation Balloon Wall — Independence High School',
  'graduation-balloon-wall-independence',
  'A bold navy and gold balloon wall for a high school graduation party in Independence. The 8x6 foot wall made the perfect photo backdrop and had every graduate lining up for pictures.',
  '## The Event

The Johnson family wanted to celebrate their son DeShawn''s high school graduation in style. His school colors were navy and gold — so we created a stunning balloon wall that showed his school pride.

## The Design

The balloon wall measured 8 feet wide by 6 feet tall, featuring navy blue and metallic gold balloons in a mosaic pattern. We added a custom "Class of 2026" balloon letter set across the center and gold star accents throughout.

## The Result

Every single graduate at the party wanted a photo in front of the wall. The family told us it was the highlight of the entire celebration. DeShawn said it was the coolest thing he had ever seen at a party.

**Colors:** Navy blue, metallic gold
**Size:** 8x6 foot balloon wall
**Location:** Private residence, Independence, MO',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop'
  ],
  'graduation',
  ARRAY['balloon wall', 'graduation', 'navy', 'gold', 'independence'],
  ARRAY['Balloon Wall'],
  ARRAY['Graduation'],
  'Independence',
  'published',
  false,
  '2026-05-20',
  'BalloonCraft KC',
  'Graduation Balloon Wall — Independence High School | BalloonCraft KC',
  'Bold navy and gold balloon wall for a high school graduation party in Independence, MO. Custom graduation balloon decorations by BalloonCraft KC.',
  'graduation balloon wall Independence MO'
),

(
  'Dinosaur Balloon Sculpture — Shawnee Birthday Party',
  'dinosaur-balloon-sculpture-shawnee-birthday',
  'A life-size dinosaur balloon sculpture for a 4-year-old''s birthday party in Shawnee. Little Tyler absolutely lost his mind with excitement when he saw his very own balloon T-Rex!',
  '## The Event

Tyler''s parents wanted something truly unique for his 4th birthday — he was obsessed with dinosaurs. We created a custom life-size T-Rex balloon sculpture that became the star of the entire party.

## The Design

The T-Rex sculpture stood approximately 4 feet tall and 3 feet wide, built from a combination of latex and specialty balloons in green, yellow, and brown. The sculpture was freestanding and could be moved around the party space.

We also created a matching balloon garland in jungle greens and yellows to complement the dinosaur theme throughout the party space.

## The Result

Tyler''s reaction when he walked in was priceless — he ran straight to the dinosaur and gave it a hug. His parents said it was the best birthday surprise they had ever pulled off.

**Colors:** Jungle green, yellow, brown
**Pieces:** 1 T-Rex sculpture + jungle garland
**Location:** Private residence, Shawnee, KS',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop'
  ],
  'birthday',
  ARRAY['balloon sculpture', 'dinosaur', 'birthday', 'kids', 'shawnee'],
  ARRAY['Balloon Sculpture', 'Balloon Garland'],
  ARRAY['Birthday'],
  'Shawnee',
  'published',
  false,
  '2026-03-22',
  'BalloonCraft KC',
  'Dinosaur Balloon Sculpture — Shawnee Birthday Party | BalloonCraft KC',
  'Custom life-size dinosaur balloon sculpture for a 4-year-old''s birthday party in Shawnee, KS. Unique balloon art by BalloonCraft KC.',
  'balloon sculpture birthday Shawnee Kansas'
),

(
  'Photo Backdrop — Prairie Village Brand Activation',
  'photo-backdrop-prairie-village-brand-activation',
  'A custom branded balloon photo backdrop for a retail brand activation event in Prairie Village. The backdrop featured the brand''s signature colors and drove massive social media engagement.',
  '## The Event

A local retail brand hired us to create a show-stopping photo backdrop for their grand opening event in Prairie Village. The goal was to drive social media sharing and create a memorable brand moment.

## The Design

We created a 10-foot wide by 8-foot tall balloon backdrop in the brand''s signature coral and teal colors. The backdrop featured an organic balloon design with the brand''s logo spelled out in balloon letters at the center.

We also added a custom hashtag sign at the bottom to encourage social media sharing.

## The Result

Over 200 photos were taken in front of the backdrop during the 4-hour event. The brand reported that their Instagram engagement tripled on the day of the event. They have already booked us for their next activation.

**Colors:** Coral, teal, white
**Size:** 10x8 foot balloon backdrop
**Location:** Prairie Village, KS',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop'
  ],
  'corporate',
  ARRAY['photo backdrop', 'brand activation', 'corporate', 'prairie village'],
  ARRAY['Photo Backdrop'],
  ARRAY['Brand Activation', 'Corporate'],
  'Prairie Village',
  'published',
  false,
  '2026-04-05',
  'BalloonCraft KC',
  'Photo Backdrop — Prairie Village Brand Activation | BalloonCraft KC',
  'Custom branded balloon photo backdrop for a brand activation event in Prairie Village, KS. Professional balloon installations by BalloonCraft KC.',
  'balloon photo backdrop Prairie Village brand activation'
);
