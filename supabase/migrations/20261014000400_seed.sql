-- Lucas Racing: starting data. Prices are samples for the admin to replace.

insert into public.site_settings (
  id, business_name, partner_name, contact_email, contact_phone, location, address_note, opening_hours,
  event_name, event_dates, show_event_banner, social_links, delivery_methods
)
values (
  1, 'Lucas Racing', 'Hydro Karts', 'hello@lucasracing.co.uk', '+44 (0)1642 000 000', 'North East England',
  'Workshop address to be confirmed', 'Mon–Fri, 9:00–17:30', 'Kartmania', '14–15 November 2026', true,
  '[
    {"label": "Instagram", "icon": "instagram", "href": "https://www.instagram.com/"},
    {"label": "Facebook", "icon": "facebook", "href": "https://www.facebook.com/"},
    {"label": "YouTube", "icon": "youtube", "href": "https://www.youtube.com/"},
    {"label": "TikTok", "icon": "tiktok", "href": "https://www.tiktok.com/"}
  ]'::jsonb,
  '[
    {"id": "courier", "label": "Tracked UK courier", "description": "Sent 2–3 working days after your helmet is finished.", "price": 12, "requires_address": true, "active": true},
    {"id": "collection", "label": "Collect from the workshop", "description": "We will message you when it is ready to collect.", "price": 0, "requires_address": false, "active": true},
    {"id": "track", "label": "Track-side handover", "description": "Selected tracks in the North East and Yorkshire, arranged by message.", "price": 0, "requires_address": false, "active": true}
  ]'::jsonb
)
on conflict (id) do nothing;

insert into public.helmet_models (id, brand, name, short_name, summary, new_helmet_price, sort_order) values
  ('arai-sk6', 'Arai', 'Arai SK-6', 'SK-6', 'The shell most UK karters already race in. Our launch helmet.', 549, 1),
  ('bell-kc7', 'Bell', 'Bell KC7', 'KC7', 'Bell''s karting shell, with a sharper visor line and chin vent.', 499, 2)
on conflict (id) do nothing;

insert into public.films (id, name, category, pattern, price, sort_order) values
  ('none', 'Solid colour', 'Solid', 'none', 0, 0),
  ('carbon', 'Carbon weave', 'Carbon', 'carbon', 45, 1),
  ('forged', 'Forged carbon', 'Carbon', 'forged', 65, 2),
  ('hex', 'Hex', 'Patterns', 'hex', 55, 3),
  ('camo', 'Camo', 'Camouflage', 'camo', 50, 4)
on conflict (id) do nothing;

insert into public.configurator_options (option_group, value, label, hint, swatch, price, sort_order) values
  ('route', 'new', 'Supply a new helmet', 'We order it in your size', null, 0, 1),
  ('route', 'own', 'Send my own helmet', 'Post it or drop it off', null, 0, 2),
  ('finish', 'gloss', 'Gloss', null, null, 0, 1),
  ('finish', 'matte', 'Matte', null, null, 25, 2),
  ('finish', 'chrome', 'Chrome', 'In-house chrome base', null, 150, 3),
  ('base', '#f4f3ee', 'Paddock white', null, '#f4f3ee', 0, 1),
  ('base', '#111412', 'Carbon black', null, '#111412', 0, 2),
  ('base', '#d7261e', 'Race red', null, '#d7261e', 0, 3),
  ('base', '#1f5bd8', 'Grid blue', null, '#1f5bd8', 0, 4),
  ('base', '#ff6a13', 'Flag orange', null, '#ff6a13', 0, 5),
  ('base', '#c6f432', 'Lucas lime', null, '#c6f432', 0, 6),
  ('trim', '#111412', 'Black', null, '#111412', 0, 1),
  ('trim', '#f4f3ee', 'White', null, '#f4f3ee', 20, 2),
  ('trim', '#d7261e', 'Red', null, '#d7261e', 20, 3),
  ('trim', '#1f5bd8', 'Blue', null, '#1f5bd8', 20, 4),
  ('trim', '#c6f432', 'Lime', null, '#c6f432', 20, 5),
  ('spoiler', 'yes', 'Fitted', null, null, 35, 1),
  ('spoiler', 'no', 'None', null, null, 0, 2)
on conflict (option_group, value) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, sort_order) values
(
  'apex', 'Apex', 'One long sweep from brow to base.',
  'A single aggressive sweep that starts above the visor and pulls back over the shell, finished with a fine pinstripe. Easy to read from the grandstand and easy to make your own.',
  'racing-lines', array['arai-sk6', 'bell-kc7'], 295, 'Launch design',
  array['Sweep, pinstripe and base colour are each editable', 'Driver name and number positions built in', 'Works on both launch shells'],
  '[{"label": "Editable areas", "value": "Base, sweep, pinstripe"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}, {"label": "Handover", "value": "Courier, workshop collection or track-side"}]',
  '{"layout": "apex", "finish": "gloss", "base": "#f4f3ee", "graphic": "#111412", "accent": "#c6f432", "film": "none", "trim": "#111412", "spoiler": true, "number": "29", "name": "LUCAS"}',
  1
),
(
  'twin-stripe', 'Twin Stripe', 'Classic double centre stripes.',
  'Two parallel stripes run nose to tail over the crown. A timeless layout that looks right in team colours and suits a chrome or matte base.',
  'racing-lines', array['arai-sk6', 'bell-kc7'], 245, 'Launch design',
  array['Stripe width and spacing set for each shell', 'Choose a film for the stripes or keep them solid', 'Pairs with any rubber trim colour'],
  '[{"label": "Editable areas", "value": "Base, stripes"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}, {"label": "Handover", "value": "Courier, workshop collection or track-side"}]',
  '{"layout": "twin", "finish": "gloss", "base": "#1f5bd8", "graphic": "#f4f3ee", "accent": "#111412", "film": "none", "trim": "#f4f3ee", "spoiler": false, "number": "7"}',
  2
),
(
  'split-tone', 'Split Tone', 'Two colours, one hard edge.',
  'The shell splits front and rear with a sharp angled line and a lime pinstripe on the seam. Bold, simple and quick to turn around.',
  'racing-lines', array['arai-sk6', 'bell-kc7'], 225, 'Launch design',
  array['Front and rear colours set independently', 'Seam pinstripe in any colour', 'Quickest turnaround in the range'],
  '[{"label": "Editable areas", "value": "Front, rear, seam"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}, {"label": "Handover", "value": "Courier, workshop collection or track-side"}]',
  '{"layout": "split", "finish": "matte", "base": "#d7261e", "graphic": "#111412", "accent": "#c6f432", "film": "none", "trim": "#111412", "spoiler": true, "number": "14"}',
  3
),
(
  'shard', 'Shard', 'Broken glass shards in carbon.',
  'Angular shards break across the side of the shell, each one dipped in carbon film. Looks sharp up close and reads as pure speed from a distance.',
  'hydro-dip', array['arai-sk6', 'bell-kc7'], 325, 'Most popular',
  array['Shards dipped in any film from the library', 'Tint the film: carbon plus orange is orange carbon', 'Number panel kept clear for legibility'],
  '[{"label": "Editable areas", "value": "Base, shards, accent"}, {"label": "Film", "value": "Carbon weave as standard"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}]',
  '{"layout": "shard", "finish": "gloss", "base": "#ff6a13", "graphic": "#1b1d1b", "accent": "#f4f3ee", "film": "carbon", "trim": "#111412", "spoiler": true, "number": "88"}',
  4
),
(
  'forged-flow', 'Forged Flow', 'A wave of forged carbon.',
  'A flowing wave runs the length of the shell in forged-carbon film, set against a clean base. One of the most requested looks from the Hydro Karts workshop.',
  'hydro-dip', array['arai-sk6', 'bell-kc7'], 365, 'New',
  array['Forged carbon or any other library film', 'Wave edges masked by hand for a crisp line', 'Gloss or matte lacquer'],
  '[{"label": "Editable areas", "value": "Base, wave"}, {"label": "Film", "value": "Forged carbon as standard"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}]',
  '{"layout": "flow", "finish": "gloss", "base": "#f4f3ee", "graphic": "#2a2d2b", "accent": "#c6f432", "film": "forged", "trim": "#c6f432", "spoiler": false, "number": "3"}',
  5
),
(
  'hex-halo', 'Hex Halo', 'A hexagon band around the head.',
  'A wide halo band circles the helmet at brow height in hex-pattern film. A technical look that pairs well with team-colour rubbers.',
  'hydro-dip', array['arai-sk6'], 335, null,
  array['Halo band in hex, carbon or camo film', 'Upper and lower shell colours set separately', 'Arai SK-6 only at launch'],
  '[{"label": "Editable areas", "value": "Base, halo band"}, {"label": "Film", "value": "Hex as standard"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Approval", "value": "Digital proof signed off before we start"}]',
  '{"layout": "halo", "finish": "matte", "base": "#111412", "graphic": "#c6f432", "accent": "#f4f3ee", "film": "hex", "trim": "#c6f432", "spoiler": true, "number": "11"}',
  6
),
(
  'chrome-strike', 'Chrome Strike', 'Mirror chrome under a black sweep.',
  'A full chrome base, done in-house, with a black sweep and pinstripe laid over it. The chrome catches every light in the paddock.',
  'chrome', array['arai-sk6', 'bell-kc7'], 445, null,
  array['In-house chrome as the base finish', 'Graphics and candy tints sit over the chrome', 'Clear coat protects the mirror finish'],
  '[{"label": "Base", "value": "Chrome, applied in-house"}, {"label": "Editable areas", "value": "Sweep, pinstripe"}, {"label": "Approval", "value": "Digital proof signed off before we start"}, {"label": "Handover", "value": "Courier, workshop collection or track-side"}]',
  '{"layout": "apex", "finish": "chrome", "base": "#c9ccd1", "graphic": "#111412", "accent": "#d7261e", "film": "none", "trim": "#111412", "spoiler": true, "number": "1"}',
  7
),
(
  'blank-canvas', 'Blank Canvas', 'Your idea, designed with the workshop.',
  'Start from a plain shell and work with the Hydro Karts team on a design that is completely yours. You share references; we come back with proofs and a fixed quote.',
  'bespoke', array['arai-sk6', 'bell-kc7'], null, null,
  array['Send sketches, liveries or photos as references', 'Proofs and revisions before anything is painted', 'Priced on request once the design is agreed'],
  '[{"label": "Process", "value": "Brief, proof, revisions, quote"}, {"label": "Films", "value": "Full library, plus custom-printed film"}, {"label": "Clear coat", "value": "2K automotive lacquer, gloss or matte"}, {"label": "Handover", "value": "Courier, workshop collection or track-side"}]',
  '{"layout": "blank", "finish": "gloss", "base": "#e8e7e0", "graphic": "#111412", "accent": "#c6f432", "film": "none", "trim": "#111412", "spoiler": false}',
  8
)
on conflict (slug) do nothing;

insert into public.admin_users (email) values ('godesign.pk@gmail.com')
on conflict (email) do nothing;
