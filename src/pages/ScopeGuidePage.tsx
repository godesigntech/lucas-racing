import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import type { ScopeTag } from '@/core/types';
import { backendInfo, useMode } from '@/store';
import { Note, PageHead, ScopeBadge, SimBadge } from '@/ui';

const FEATURES: { area: string; items: [string, ScopeTag, string?][] }[] = [
  {
    area: 'Website',
    items: [
      ['Branded site: Home, About, Contact, navigation, mobile layouts', 'launch'],
      ['Kart Parts shop with search, categories, basket and checkout', 'launch', 'Sample catalogue until the MS Kart/ABRA feed is supplied'],
      ['Merchandise and Delta Racewear', 'future', 'Coming Soon page at launch'],
      ['Competition voting', 'launch', 'Runs on social media, not in the website (watermarked share images only)'],
    ],
  },
  {
    area: 'Helmet builder',
    items: [
      ['Arai SK6 and Bell KC7 with live 360° 3D, zoom and front/side/rear/top views', 'launch', 'Concept geometry until real models are supplied'],
      ['Five editable launch templates with different starting prices', 'launch'],
      ['Solid colours or films per zone, film tinting, chrome base, gloss/satin', 'launch'],
      ['Names, numbers, fonts, multiple sponsor logos, rubber/eye-port/plastic colours, spoiler', 'launch'],
      ['Buy a new helmet (size) or send your own (make, model, size, condition, photos, delivery)', 'launch'],
      ['Live itemised pricing → explicit 3D approval → checkout', 'launch'],
      ['Save, name, duplicate, share view-only 360° previews, watermarked downloads', 'launch'],
      ['~6 helmet model slots and 20 templates', 'future', 'Unconfirmed models are marked'],
      ['Blank from-scratch drawing, uploaded artwork, customer film imagery', 'future', 'Always routed to review/quote'],
      ['AI concepts with prompts, references and revisions', 'future', 'Simulated in this demo'],
      ['Bespoke journey: brief → messages → revisions → quote → approval → payment, locked master, post-payment changes', 'future'],
      ['~200 searchable films with admin-managed categories and prices', 'future', 'Illustrative procedural swatches'],
    ],
  },
  {
    area: 'Kart parts customisation',
    items: [
      ['2D effect/colour customiser on selected parts, masked to the relevant surface', 'proposed', 'Awaiting confirmation; vector files to be supplied'],
      ['Trolley floor-tray sticker customisation', 'proposed'],
      ['Parts customisation pricing and artwork handling', 'proposed', 'Configurable; decisions required'],
    ],
  },
  {
    area: 'Kart sticker kits',
    items: [
      ['Configurator: left pod, right pod, Nassau panel, front bumper', 'future', 'Coming Soon at launch with a demo entry point'],
      ['20 templates, shapes, text, logos, freehand, undo, uploads, simulated AI', 'future'],
      ['Automatic pricing (kit, Standard/Holographic material, options, optional upfront design service)', 'future'],
      ['Payment → artwork check → proof → approval → Sent to Print', 'future'],
      ['Account reorders of complete kits or individual panels', 'future'],
    ],
  },
  {
    area: 'Workshop & production',
    items: [
      ['Admin: films, prices, templates, options, quotes, proofs, invoices, enquiries, draft cleanup', 'launch', 'Demonstrates what becomes WordPress/WooCommerce admin'],
      ['Production area: locked artwork, multi-angle views, interactive 3D, panel views', 'launch', 'Exports are concept-only'],
    ],
  },
];

const SIMULATED = [
  'Payments: no money is taken; "Pay" buttons record a paid status.',
  'Emails and notifications: written to a log visible in Workshop admin.',
  'AI concepts: generated procedurally from your prompt; no AI service is connected.',
  'Helmet geometry: concept shapes, not manufacturer-accurate SK6/KC7 models.',
  'Films: about 200 procedural swatches, not the real film scans or colour proofs.',
  'Products and prices: sample data; no supplier connection.',
  'Kart panel outlines: illustrative, not dimensionally accurate cutting outlines.',
  'Exports: concept PNG/JSON, not validated full-size manufacturing patterns.',
];

const ASSETS = [
  'Approved Lucas Racing / Hydro Karts logo files and brand colours',
  'Team, workshop and product photography',
  'Accurate 3D models (GLB) or scans of the Arai SK6 and Bell KC7, plus any further confirmed models',
  'Helmet template references (multiple views) for the 5 launch and 15 further layouts',
  'Hydro-dip film library: scans/images, names, categories, prices and stock status',
  'Option prices: templates, films, chrome, logos, names, numbers, trims, spoiler, own-helmet prep',
  'MS Kart / ABRA product feed (API, XML or CSV) and confirmation of which parts are customisable',
  'Vector files for customisable parts and trolley trays (masks)',
  'Kart sticker cutting outlines per bodywork (e.g. MS Kart sticker shapes) with dimensions and bleed',
  'Kart kit, material, option, replacement-panel and design-service prices',
  'Payment provider (WooCommerce gateway) and transactional email service',
  'Production export requirements: formats, scale, bleed, cut contours, colour handling, holographic underprint',
  'Delta Racewear collection link/feed; business address, phone and policies',
];

export function ScopeGuidePage() {
  const { mode, setMode } = useMode();
  const info = useSyncExternalStore(backendInfo.sub, backendInfo.get);
  return (
    <div className="wrap page">
      <PageHead eyebrow="Scope guide" title="What's in launch, what's next">
        The demo has two modes. <b>Launch experience</b> shows what was agreed for Kartmania (SK6/KC7, five templates, website and parts shop). <b>Full specification preview</b> adds later-phase and proposed features.
      </PageHead>
      <div className="row" style={{ marginBottom: 20 }}>
        <div className="seg" role="group" aria-label="Scope mode">
          <button aria-pressed={mode === 'launch'} onClick={() => setMode('launch')}>Launch experience</button>
          <button aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Full specification preview</button>
        </div>
        <ScopeBadge tag="launch" /><ScopeBadge tag="future" /><ScopeBadge tag="proposed" />
      </div>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          {FEATURES.map((g) => (
            <div key={g.area} className="card pad">
              <div className="h4" style={{ marginBottom: 10 }}>{g.area}</div>
              <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
                {g.items.map(([t, tag, note]) => (
                  <div key={t} className="row nowrap" style={{ alignItems: 'flex-start' }}>
                    <div style={{ width: 150, flex: 'none' }}><ScopeBadge tag={tag} /></div>
                    <div className="grow"><div className="small" style={{ fontWeight: 600 }}>{t}</div>{note && <div className="tiny muted">{note}</div>}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="card pad">
            <div className="row between"><div className="h4">Simulated in this demo</div><SimBadge /></div>
            <ul className="scope-list">{SIMULATED.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="card pad">
            <div className="h4">Client assets &amp; integrations still needed</div>
            <ul className="scope-list">{ASSETS.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="card pad">
            <div className="h4">Storage</div>
            <p className="small" style={{ marginTop: 6 }}>Currently using: <b>{info.label}</b></p>
            {info.kind === 'local' ? (
              <Note tone="info" className="mt">Run <code>supabase/migrations/0001_lucas_racing.sql</code> in the Supabase SQL editor to switch to the shared database with real accounts. Until then designs, orders and settings are saved in this browser only.</Note>
            ) : (
              <Note tone="ok" className="mt">Connected to Supabase: accounts, designs, orders and settings are shared across devices. Staff access is granted by email in the <code>lr_admins</code> table.</Note>
            )}
          </div>
          <Note tone="warn" title="Not a WordPress/WooCommerce install.">This prototype demonstrates the journeys and rules. The code is modular so real models, film assets, the supplier feed, payments and WordPress/WooCommerce integration can replace the demo parts.</Note>
          <Link className="btn btn-dark" to="/helmet-builder">Try the helmet builder</Link>
        </div>
      </div>
      <style>{`.scope-list{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:14px}.scope-list li::marker{color:var(--lime-ink)}`}</style>
    </div>
  );
}
