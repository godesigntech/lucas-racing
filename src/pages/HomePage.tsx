import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HelmetViewer } from '@/three/HelmetViewer';
import { newHelmetDesign } from '@/domain/helmet';
import { useMode, useSettings } from '@/store';
import { Icon, ProductArt, ScopeBadge } from '@/ui';
import { PRODUCTS } from '@/data/parts';
import { productPrice } from '@/domain/parts';
import { money } from '@/core/util';
import { FILMS } from '@/data/films';
import { filmThumb } from '@/core/filmRender';
import { HELMET_TEMPLATES } from '@/data/helmets';
import './home.css';

export function HomePage() {
  const { full } = useMode();
  const settings = useSettings();
  const hero = useMemo(() => {
    const d = newHelmetDesign('arai-sk6', 't-apex');
    d.zonePaints.crown = { kind: 'film', filmId: 'f-lime-carbon', tint: null };
    d.texts[0].text = '29';
    d.texts[1].text = 'LUCAS';
    d.spoiler = { enabled: true, color: '#121412' };
    return d;
  }, []);
  const featured = PRODUCTS.filter((p) => ['p-prokart', 'p-trolley', 'p-seat', 'p-wheel'].includes(p.id));
  const films = FILMS.filter((_, i) => i % 17 === 3).slice(0, 10);
  const launchTemplates = HELMET_TEMPLATES.filter((t) => t.launch);

  return (
    <>
      <section className="wrap home-hero-wrap">
        <div className="home-hero dark-card on-dark">
          <div className="home-hero-copy">
            <div className="eyebrow">Lucas Racing × Hydro Karts</div>
            <h1 className="h1 home-title">Built for the grid.<br />Designed <span className="accent">by you.</span></h1>
            <p className="home-lead">Design your Arai SK6 or Bell KC7 on a live 360° model: racing-line templates, hydro-dip films, in-house chrome, your name, number and logos. Then shop MS Kart parts from the UK's exclusive distributor.</p>
            <div className="row" style={{ marginTop: 26 }}>
              <Link to="/helmet-builder" className="btn btn-primary btn-lg">Design your helmet <Icon name="arrow" /></Link>
              <Link to="/parts" className="btn btn-ghost btn-lg">Explore kart parts</Link>
            </div>
            <div className="row home-pills">
              <span className="pill">360° live design</span>
              <span className="pill">{FILMS.length} sample films</span>
              <span className="pill">No tool subscription</span>
            </div>
          </div>
          <div className="home-hero-viewer">
            <div className="viewer-stage dark-stage" style={{ height: '100%' }}>
              <span className="viewer-tag" style={{ left: 16, top: 14, color: 'var(--lime)' }}>Live 3D · drag to rotate</span>
              <HelmetViewer design={hero} autoRotate />
              <span className="viewer-tag" style={{ left: 16, bottom: 12, color: 'rgba(243,242,236,.6)', fontSize: 11 }}>Concept geometry · illustrative</span>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="grid g3 home-paths">
          <Link to="/helmet-builder" className="path-card card">
            <div className="row between"><span className="eyebrow lime">01 · Helmets</span><ScopeBadge tag="launch" /></div>
            <h2 className="h3">Helmet Builder</h2>
            <p className="muted">{full ? '6 model slots, 20 templates, blank drawing mode, artwork uploads and AI concepts.' : 'Arai SK6 & Bell KC7 with five editable racing-line templates.'}</p>
            <span className="go">Start designing <Icon name="arrow" size={16} /></span>
          </Link>
          <Link to="/parts" className="path-card card">
            <div className="row between"><span className="eyebrow lime">02 · MS Kart</span><ScopeBadge tag="launch" /></div>
            <h2 className="h3">Kart Parts Shop</h2>
            <p className="muted">Chassis, frame components, trolleys and spares. Selected parts get a proposed 2D effect and colour customiser.</p>
            <span className="go">Shop parts <Icon name="arrow" size={16} /></span>
          </Link>
          <Link to="/stickers" className="path-card card">
            <div className="row between"><span className="eyebrow lime">03 · Sticker kits</span><ScopeBadge tag="future" /></div>
            <h2 className="h3">Full-Size Sticker Kits</h2>
            <p className="muted">Side pods, Nassau panel and front bumper designed around your colours, with proofs before print and single-panel reorders.</p>
            <span className="go">{full ? 'Open the configurator' : 'Coming soon: preview it'} <Icon name="arrow" size={16} /></span>
          </Link>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="home-split card">
          <div className="home-split-copy">
            <div className="eyebrow lime">How the helmet journey works</div>
            <h2 className="h2" style={{ marginTop: 8 }}>Approve every detail before we dip a thing.</h2>
            <ol className="home-steps">
              <li><b>Choose your helmet</b><span>Buy a new SK6 or KC7 in your size, or send your own (photos needed for used helmets).</span></li>
              <li><b>Design it your way</b><span>Templates with editable sections, solid colours or hydro-dip films, chrome, names, numbers, logos, trims and spoiler.</span></li>
              <li><b>Inspect in 360°</b><span>Rotate, zoom and check front, side, rear and top views as you go.</span></li>
              <li><b>Approve the exact version</b><span>Standard designs show live pricing and go to checkout. Bespoke work goes to the workshop for a quote.</span></li>
            </ol>
          </div>
          <div className="home-templates">
            {launchTemplates.map((t) => (
              <Link key={t.id} to="/helmet-builder" className="tpl-chip">
                <span className="tpl-name">{t.name}</span>
                <span className="tpl-price">From {money(settings.helmet.templatePrices[t.id] ?? t.startPrice)}</span>
              </Link>
            ))}
            <p className="tiny muted" style={{ gridColumn: '1/-1' }}>Five launch layouts. {full ? 'The full preview adds 15 more.' : 'Switch to the full specification preview to see all 20.'}</p>
          </div>
        </div>
      </section>

      <section className="dark on-dark section">
        <div className="wrap">
          <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 22 }}>
            <div>
              <div className="eyebrow">Hydro-dip film library</div>
              <h2 className="h2" style={{ marginTop: 8 }}>More than just carbon.</h2>
              <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>Every zone can be a solid colour or a film, and most films take a tint: carbon + blue = blue carbon. Chrome is done in-house, under your graphics.</p>
            </div>
            <Link to="/helmet-builder" className="btn btn-primary">Try films on a helmet</Link>
          </div>
          <div className="film-strip">
            {films.map((f) => (
              <div key={f.id} className="film-tile">
                <img src={filmThumb(f, null, 160)} alt="" width={160} height={160} />
                <span>{f.name}</span>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 12 }}>Swatches are illustrative procedural previews, not colour proofs. The client's real film scans replace them.</p>
        </div>
      </section>

      <section className="wrap section">
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div className="eyebrow lime">Exclusive UK MS Kart distributor</div>
            <h2 className="h2" style={{ marginTop: 8 }}>Kart parts, ready to race.</h2>
          </div>
          <Link to="/parts" className="btn btn-dark">View all parts <Icon name="arrow" /></Link>
        </div>
        <div className="grid g4">
          {featured.map((p) => (
            <Link key={p.id} to={`/parts/${p.id}`} className="card home-product">
              <div className="home-product-art"><ProductArt icon={p.icon} /></div>
              <div style={{ padding: 14 }}>
                <div className="row between"><span className="tiny muted">{p.category}</span>{p.custom && <ScopeBadge tag="proposed">Customisable</ScopeBadge>}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{p.name}</div>
                <div className="h4" style={{ marginTop: 6 }}>{money(productPrice(p, settings))}</div>
              </div>
            </Link>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>Sample products and prices. No live supplier feed is connected yet.</p>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="grid g2">
          <div className="card pad home-promo">
            <ScopeBadge tag="future" />
            <h3 className="h3" style={{ marginTop: 10 }}>Sticker kits are on the way</h3>
            <p className="muted" style={{ margin: '8px 0 16px' }}>Pick your bodywork, edit all four panels, choose Standard or Holographic, approve a proof, and reorder a single side pod whenever you need one.</p>
            <Link to="/stickers" className="btn btn-ghost">See what's coming</Link>
          </div>
          <div className="card pad home-promo">
            <span className="badge">Coming soon</span>
            <h3 className="h3" style={{ marginTop: 10 }}>Team merchandise</h3>
            <p className="muted" style={{ margin: '8px 0 16px' }}>Lucas Racing team wear and a Delta Racewear collection made for the team.</p>
            <Link to="/merchandise" className="btn btn-ghost">Get notified</Link>
          </div>
        </div>
      </section>
    </>
  );
}
