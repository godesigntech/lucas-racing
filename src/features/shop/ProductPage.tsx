/* Product detail + PROPOSED 2D customiser for selected parts (incl. trolley floor-tray sticker). */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PartCustomisation, Product } from '@/core/types';
import { colourName } from '@/core/color';
import { loadImage } from '@/core/filmRender';
import { money, uid } from '@/core/util';
import { PRODUCTS, productById } from '@/data/parts';
import { partCustomFee, productPrice } from '@/domain/parts';
import { toast, useBasket, useSettings } from '@/store';
import { Empty, Icon, Note, ProductArt, ScopeBadge, Seg, SimBadge } from '@/ui';
import { PartCustomiser } from './PartCustomiser';
import { PartStage } from './PartStage';
import { defaultCustomisation, defaultLayout, partThumb, type PartLayout } from './partCanvas';
import { ProductCard, QtyStepper, useAddStandardPart } from './shopUi';
import './shop.css';

export default function ProductPage() {
  const { id = '' } = useParams();
  const product = productById(id);
  if (!product) {
    return (
      <div className="wrap page shop">
        <Empty title="Part not found" action={<Link to="/parts" className="btn btn-dark btn-sm">Back to parts</Link>}>
          This sample product does not exist or has been removed.
        </Empty>
      </div>
    );
  }
  // Keyed so state resets when navigating between products.
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product: p }: { product: Product }) {
  const settings = useSettings();
  const basket = useBasket();
  const addStandard = useAddStandardPart();
  const spec = p.custom;
  const tray = spec?.kind === 'tray-sticker';

  const [mode, setMode] = useState<'standard' | 'custom'>(spec ? 'custom' : 'standard');
  const [custom, setCustom] = useState<PartCustomisation | null>(spec ? defaultCustomisation(spec) : null);
  const [layout, setLayout] = useState<PartLayout | null>(spec ? defaultLayout(spec) : null);
  const [artImg, setArtImg] = useState<HTMLImageElement | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const artSrc = custom?.artwork?.src || null;
  useEffect(() => {
    let alive = true;
    if (!artSrc) { setArtImg(null); return; }
    loadImage(artSrc).then((img) => alive && setArtImg(img));
    return () => { alive = false; };
  }, [artSrc]);

  const active = spec && mode === 'custom' ? custom : null;
  const base = productPrice(p, settings);
  const fee = useMemo(() => partCustomFee(p, active, settings), [p, active, settings]);
  const unit = base + fee.fee;

  const addToBasket = () => {
    if (!spec || !active || !layout) {
      addStandard(p, settings, qty);
    } else {
      basket.add({
        type: 'part', id: uid('bi_'), productId: p.id, name: p.name, price: base, qty,
        custom: active, customFee: fee.fee, needsQuote: fee.needsQuote,
        thumb: partThumb({ spec, custom: active, layout, artwork: artImg }),
      });
      toast(`${p.name} (customised) added to basket${fee.needsQuote ? ': artwork to be quoted' : ''}`);
    }
    setAdded(true);
  };

  const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const stageLabel = spec
    ? `${p.name} preview${active ? `: ${active.effect ? 'effect tinted' : 'solid'} ${colourName(active.color)}${active.text ? `, text "${active.text}"` : ''}${active.artwork ? ', with artwork' : ''}` : ''}`
    : p.name;

  return (
    <div className="wrap page shop">
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link to="/parts"><Icon name="back" size={14} />Kart parts</Link>
        <span aria-hidden="true">/</span>
        <span className="muted">{p.category}</span>
      </nav>

      <div className="pd-layout">
        <div className="pd-media">
          <div className={'pd-stage' + (tray ? ' tray' : '')}>
            {spec && layout ? (
              <PartStage spec={spec} custom={active} layout={layout} onLayout={setLayout} artwork={artImg} label={stageLabel} />
            ) : (
              <div className="pd-art"><ProductArt icon={p.icon} /></div>
            )}
            <span className="pd-stage-tag">{spec ? (tray ? 'Floor-tray sticker preview' : '2D preview') : 'Illustration'}</span>
          </div>
          <p className="tiny muted pd-media-note">
            {spec
              ? 'Illustrative 2D preview of the customisable surface. Final colours and effects are confirmed by the workshop.'
              : 'Placeholder illustration. Supplier imagery replaces this when a feed is connected.'}
          </p>
        </div>

        <div className="pd-info stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
            <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
              <span className="tiny muted mono">{p.sku}</span>
              <SimBadge>Sample listing</SimBadge>
            </div>
            <h1 className="h2">{p.name}</h1>
            <div className="row">
              <span className="pd-price">{money(base)}</span>
              <span className="tiny muted">sample price, inc. VAT</span>
            </div>
            <p className="muted">{p.description}</p>
          </div>

          {spec && (
            <div className="pd-custom card flat">
              <div className="pd-custom-head">
                <div className="row between">
                  <div className="h4">{tray ? 'Trolley floor-tray sticker' : 'Customise this part'}</div>
                  <ScopeBadge tag="proposed" />
                </div>
                <Note>
                  <strong>Proposed addition — awaiting confirmation.</strong> Limited variations (e.g. 3 effects × 6 colours). No 3D model needed.
                </Note>
                <Seg
                  label="Finish"
                  value={mode}
                  onChange={setMode}
                  options={tray
                    ? [{ id: 'standard', label: 'Trolley only' }, { id: 'custom', label: 'Add floor-tray sticker' }]
                    : [{ id: 'standard', label: 'Standard finish' }, { id: 'custom', label: 'Customise' }]}
                />
              </div>
              {mode === 'custom' && custom && layout && (
                <div className="pd-custom-body">
                  {tray && <p className="small muted" style={{ marginBottom: 14 }}>A printed sticker for the trolley's floor tray: pick a background colour or effect, then add your team name and logo.</p>}
                  <PartCustomiser spec={spec} custom={custom} onChange={setCustom} layout={layout} onLayout={setLayout} settings={settings} />
                </div>
              )}
            </div>
          )}

          <div className="pd-buy card pad">
            <div className="lines">
              <div className="ln"><span>{p.name}</span><span className="nowrap">{money(base)}</span></div>
              {fee.lines.map((l) => (
                <div className="ln" key={l.label}>
                  <span>{l.label} <span className="badge warn" title="Proposed fee: a decision requiring client confirmation. Configurable in Workshop admin.">TBC</span></span>
                  <span className="nowrap">+{money(l.amount)}</span>
                </div>
              ))}
              {fee.needsQuote && (
                <div className="ln"><span>Custom artwork <span className="badge proposed">Quote</span></span><span className="nowrap muted">Quoted later</span></div>
              )}
              <div className="total"><span>{qty > 1 ? `${qty} × ${money(unit)}` : 'Price'}</span><span>{money(unit * qty)}</span></div>
            </div>
            {(fee.lines.length > 0 || fee.needsQuote) && (
              <p className="tiny muted pd-tbc">
                <span className="badge warn">TBC</span> Customisation fees are proposed values awaiting client confirmation (configurable in Workshop admin), kept separate from helmet and sticker-kit pricing.
              </p>
            )}
            <div className="row nowrap pd-buy-row">
              <QtyStepper value={qty} onChange={setQty} label="Quantity" />
              <button type="button" className="btn btn-primary btn-lg grow" onClick={addToBasket}>
                <Icon name="basket" />Add to basket
              </button>
            </div>
            {added && (
              <div className="row between pd-added" role="status">
                <span className="small"><Icon name="check" size={14} className="inline-ico" /> Added to your basket.</span>
                <Link to="/basket" className="btn btn-ghost btn-sm">View basket<Icon name="arrow" size={14} /></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pd-related">
          <h2 className="h3">More in {p.category}</h2>
          <div className="shop-grid">
            {related.map((r) => <ProductCard key={r.id} product={r} settings={settings} />)}
          </div>
        </section>
      )}
    </div>
  );
}
