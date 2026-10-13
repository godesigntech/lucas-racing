/* Material & options, and the Review step (save, share, download, basket). */
import { Link } from 'react-router-dom';
import type { KartDesign, KartMaterial, PriceLine } from '@/core/types';
import { money } from '@/core/util';
import { KART_MATERIALS } from '@/data/kart';
import { useSettings } from '@/store';
import { Icon, Note, PriceLines, ScopeBadge } from '@/ui';
import { ProcessSteps } from './KartBits';
import { UNPAID_WATERMARK, useKitSheet } from './useKartRender';

export function MaterialPanel({ material, setMaterial, options, setOptions, designService, setDesignService, lines, total }: {
  material: KartMaterial; setMaterial: (m: KartMaterial) => void;
  options: string[]; setOptions: (o: string[]) => void;
  designService: boolean; setDesignService: (v: boolean) => void;
  lines: PriceLine[]; total: number;
}) {
  const s = useSettings().kart;
  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="label">Material</span>
        <div className="km-mats" role="radiogroup" aria-label="Material">
          {KART_MATERIALS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={material === m.id} className={'km-mat ' + m.id} onClick={() => setMaterial(m.id)}>
              <span className="km-mat-sw" aria-hidden="true" />
              <span className="grow">
                <strong>{m.name}</strong>
                <span className="tiny muted" style={{ display: 'block' }}>{m.note}</span>
              </span>
              <span className="small nowrap">{s.materialSurcharge[m.id] ? '+' + money(s.materialSurcharge[m.id]) : 'Included'}</span>
            </button>
          ))}
        </div>
        {material === 'holographic' && <p className="tiny muted">The preview shows an illustrative holographic sheen. The printed effect varies with light and angle.</p>}
      </div>

      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="label">Production options</span>
        {s.options.map((o) => (
          <label key={o.id} className="km-opt">
            <input type="checkbox" checked={options.includes(o.id)} onChange={(e) => setOptions(e.target.checked ? [...options, o.id] : options.filter((x) => x !== o.id))} />
            <span className="grow">{o.label}</span>
            <span className="small">+{money(o.price)}</span>
          </label>
        ))}
      </div>

      <div className={'km-service' + (designService ? ' on' : '')}>
        <label className="km-opt" style={{ border: 0, padding: 0, background: 'none' }}>
          <input type="checkbox" checked={designService} onChange={(e) => setDesignService(e.target.checked)} />
          <span className="grow"><strong>Ask the workshop to design it for me</strong></span>
          <span className="small">+{money(s.designServiceFee)}</span>
        </label>
        <p className="tiny muted" style={{ marginTop: 6 }}>Our designers create or finish the artwork for you, based on your layout and notes. The design fee is <strong>paid upfront</strong> with your order, and only charged when you ask for it.</p>
      </div>

      <div className="panel">
        <PriceLines lines={lines} total={total} />
        <p className="tiny muted" style={{ marginTop: 8 }}>Automatic kit pricing: your own artwork, logos or AI concepts never turn a kit into a quote.</p>
      </div>
    </div>
  );
}

export function ReviewPanel({ design, holographic, signedIn, lines, total, busy, onName, onSave, onDuplicate, onShare, onDownload, onBasket }: {
  design: KartDesign; holographic: boolean; signedIn: boolean; lines: PriceLine[]; total: number; busy: string | null;
  onName: (n: string) => void; onSave: () => void; onDuplicate: () => void; onShare: () => void; onDownload: () => void; onBasket: () => void;
}) {
  const preview = useKitSheet(design, { holographic, width: 900, watermark: UNPAID_WATERMARK });
  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <label className="field">
        <span className="label">Design name</span>
        <input className="input" value={design.name} maxLength={60} onChange={(e) => onName(e.target.value)} />
      </label>

      <div className="kr-preview">
        {preview ? <img src={preview} alt="Watermarked kit preview" /> : <div className="kv-loading">Rendering preview…</div>}
        <span className="wm-tag">Unpaid preview</span>
      </div>

      <div className="panel">
        <PriceLines lines={lines} total={total} />
      </div>

      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <div className="row between"><span className="label">What happens after you order</span><ScopeBadge tag="future" /></div>
        <ProcessSteps />
        <Note tone="info">Printing is blocked until you approve the current proof. If you ask for changes, a new proof replaces the old one.</Note>
      </div>

      <div className="kr-actions">
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onBasket} disabled={busy === 'basket'}>
          <Icon name="basket" />{busy === 'basket' ? 'Adding…' : `Add to basket · ${money(total)}`}
        </button>
        <div className="kr-grid">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onSave} disabled={busy === 'save'}><Icon name="heart" />{busy === 'save' ? 'Saving…' : 'Save design'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate}><Icon name="copy" />Duplicate</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onShare} disabled={busy === 'share'}><Icon name="share" />Share view-only</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDownload} disabled={busy === 'download'}><Icon name="download" />Download preview</button>
        </div>
        <p className="tiny muted">Downloads before payment are always watermarked. Your clean proof arrives after the artwork check.</p>
      </div>

      {!signedIn && (
        <Note>
          Guest checkout is fine. Guest orders can't use easy online reordering of single panels — <Link to="/account">create an account</Link> to reorder later. Saving designs also needs an account.
        </Note>
      )}
    </div>
  );
}
