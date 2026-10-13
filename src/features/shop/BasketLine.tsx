/* One basket line: helmet (approved version), part (qty, customisation) or kart sticker kit / reorder. */
import { Link } from 'react-router-dom';
import type { BasketItem, Settings } from '@/core/types';
import { colourName } from '@/core/color';
import { fmtDate, money } from '@/core/util';
import { filmById } from '@/data/films';
import { modelById, modelLabel } from '@/data/helmets';
import { productById } from '@/data/parts';
import { useBasket } from '@/store';
import { Icon, Note, PriceLines, ProductArt, ScopeBadge } from '@/ui';
import { lineTotal } from './checkout';
import { QtyStepper } from './shopUi';

const KIND_LABEL: Record<BasketItem['type'], string> = { helmet: 'Custom helmet', part: 'Kart part', kart: 'Sticker kit' };

export function BasketLine({ item, issues, settings, readOnly }: { item: BasketItem; issues: string[]; settings: Settings; readOnly?: boolean }) {
  const basket = useBasket();
  const product = item.type === 'part' ? productById(item.productId) : undefined;
  const thumb = item.thumb;

  return (
    <article className={'b-line' + (issues.length ? ' blocked' : '')} aria-label={item.name}>
      <div className={'b-thumb' + (item.type === 'kart' ? ' wide' : '')}>
        {thumb ? <img src={thumb} alt="" /> : <ProductArt icon={product?.icon || 'hub'} className="b-thumb-art" />}
      </div>

      <div className="b-main">
        <div className="b-top">
          <div className="grow">
            <div className="eyebrow b-kind">{KIND_LABEL[item.type]}</div>
            <h3 className="b-name">
              {item.type === 'part' && product ? <Link to={`/parts/${product.id}`}>{item.name}</Link> : item.name}
            </h3>
          </div>
          <div className="b-amount">
            <div className="b-total">{money(lineTotal(item))}</div>
            {item.type === 'part' && item.qty > 1 && <div className="tiny muted">{money(item.price + item.customFee)} each</div>}
          </div>
        </div>

        {item.type === 'helmet' && <HelmetDetails item={item} mismatch={issues.some((t) => t.startsWith('Approval'))} />}
        {item.type === 'part' && <PartDetails item={item} sku={product?.sku} />}
        {item.type === 'kart' && <KartDetails item={item} settings={settings} />}

        {issues.map((t) => <Note key={t} tone="err">{t}{item.type === 'helmet' && <> <Link to="/helmet-builder" className="btn-link">Open the builder</Link></>}{item.type === 'kart' && item.reorderOf && <> <Link to="/account" className="btn-link">Sign in</Link></>}</Note>)}

        {!readOnly && (
          <div className="b-actions">
            {item.type === 'part' && (
              <QtyStepper value={item.qty} onChange={(n) => basket.setQty(item.id, n)} size="sm" label={`Quantity of ${item.name}`} />
            )}
            <button type="button" className="btn btn-ghost btn-xs b-remove" onClick={() => basket.remove(item.id)} aria-label={`Remove ${item.name} from basket`}>
              <Icon name="trash" size={14} />Remove
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function HelmetDetails({ item, mismatch }: { item: Extract<BasketItem, { type: 'helmet' }>; mismatch: boolean }) {
  const d = item.design;
  const model = modelById(d.modelId);
  const supply = d.supply.kind === 'new' ? `New ${modelLabel(model)} · size ${d.supply.size}` : `Your own ${d.supply.make} ${d.supply.model} · size ${d.supply.size}`;
  return (
    <div className="b-details">
      <div className="small">{supply} · {d.finish === 'satin' ? 'Satin' : 'Gloss'} finish</div>
      <div className="row b-meta">
        {mismatch
          ? <span className="badge err"><Icon name="x" size={12} />Approval out of date</span>
          : <span className="badge ok"><Icon name="lock" size={12} />Approved version</span>}
        <span className="tiny muted">Revision {item.approval.revisionNo} · hash <span className="mono">{item.approval.hash.slice(0, 10)}…</span> · {fmtDate(item.approval.approvedAt)}</span>
      </div>
      <details className="b-more">
        <summary>Price breakdown ({item.lines.length} {item.lines.length === 1 ? 'line' : 'lines'})</summary>
        <PriceLines lines={item.lines} />
      </details>
    </div>
  );
}

function PartDetails({ item, sku }: { item: Extract<BasketItem, { type: 'part' }>; sku?: string }) {
  const c = item.custom;
  const film = c?.effect ? filmById(c.effect) : null;
  return (
    <div className="b-details">
      <div className="tiny muted mono">{sku}{item.customFee > 0 ? ` · part ${money(item.price)} + customisation ${money(item.customFee)}` : ''}</div>
      {c ? (
        <>
          <div className="row b-meta">
            <ScopeBadge tag="proposed">Customised · proposed</ScopeBadge>
            {item.needsQuote && <span className="badge warn">Artwork: quote</span>}
          </div>
          <ul className="b-spec small">
            <li><span className="b-dot" style={{ background: c.color }} />{film ? `${film.name}, tinted ${colourName(c.color)}` : `Solid ${colourName(c.color)}`}</li>
            {c.text.trim() && <li><Icon name="text" size={14} />“{c.text.trim()}” in {colourName(c.textColor)}</li>}
            {c.artwork && <li><Icon name="image" size={14} />{c.artwork.name}{item.needsQuote ? ' (workshop to quote)' : ''}</li>}
          </ul>
        </>
      ) : <div className="small muted">Standard finish</div>}
    </div>
  );
}

function KartDetails({ item, settings }: { item: Extract<BasketItem, { type: 'kart' }>; settings: Settings }) {
  const opts = item.options.map((o) => settings.kart.options.find((x) => x.id === o)?.label || o);
  return (
    <div className="b-details">
      <div className="small">
        {item.material === 'holographic' ? 'Holographic' : 'Standard'} material
        {opts.length > 0 && <> · {opts.join(', ')}</>}
        {item.designService && <> · Workshop design service</>}
      </div>
      {item.reorderOf && (
        <div className="b-reorder">
          {item.approvedProofImage && <img src={item.approvedProofImage} alt={`Approved proof from ${item.reorderOf.ref}`} />}
          <div className="small">
            <strong>Reorder of {item.reorderOf.ref}</strong>
            <div className="tiny muted">Reuses approved artwork (proof {item.reorderOf.proofNo}). No new proof needed.</div>
          </div>
        </div>
      )}
      <ul className="b-spec small">
        {item.items.map((it, i) => <li key={i}><Icon name="check" size={14} />{it.qty > 1 ? `${it.qty} × ` : ''}{it.label}<span className="muted"> · {money(it.price * it.qty)}</span></li>)}
      </ul>
      <details className="b-more">
        <summary>Price breakdown ({item.lines.length} {item.lines.length === 1 ? 'line' : 'lines'})</summary>
        <PriceLines lines={item.lines} />
      </details>
    </div>
  );
}
