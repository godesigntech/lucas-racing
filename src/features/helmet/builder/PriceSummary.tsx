/* Live price summary, sticky at the bottom of the configuration panel. */
import type { HelmetQuote } from '@/core/types';
import { money } from '@/core/util';
import { PriceLines } from '@/ui';

export function PriceSummary({ quote }: { quote: HelmetQuote }) {
  if (quote.kind === 'standard') {
    return (
      <details className="hb-price std">
        <summary>
          <span className="stack" style={{ '--gap': '0px' } as React.CSSProperties}>
            <span className="eyebrow" style={{ fontSize: 11 }}>Standard design · fixed price</span>
            <span className="tiny muted">{quote.lines.length} items · tap for breakdown</span>
          </span>
          <span className="hb-total" aria-live="polite">{money(quote.total)}</span>
        </summary>
        <div className="hb-price-body"><PriceLines lines={quote.lines} total={quote.total} /></div>
      </details>
    );
  }
  return (
    <details className="hb-price quote">
      <summary>
        <span className="stack" style={{ '--gap': '0px' } as React.CSSProperties}>
          <span className="eyebrow" style={{ fontSize: 11, color: '#8a5a00' }}>Bespoke design</span>
          <span className="small" style={{ fontWeight: 700 }}>Workshop quote required</span>
        </span>
        <span className="tiny muted nowrap">{quote.reasons.length} reason{quote.reasons.length === 1 ? '' : 's'} ▾</span>
      </summary>
      <div className="hb-price-body stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <ul className="hb-reasons">{quote.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        {quote.indicative.length > 0 && (
          <>
            <div className="label">Indicative components (not a price)</div>
            <PriceLines lines={quote.indicative} />
          </>
        )}
      </div>
    </details>
  );
}
