/* Customer view of a parts order. */
import { Link } from 'react-router-dom';
import type { PartOrder } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import { filmById } from '@/data/films';
import { Icon, Note } from '@/ui';
import { PART_STATUS } from './data';
import { Card, StatusBadge, Swatch } from './shared';

export function PartOrderDetail({ order }: { order: PartOrder }) {
  const quoteNeeded = order.lines.some((l) => l.needsQuote);
  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-head">
        <div>
          <Link to="/orders" className="wf-back"><Icon name="back" size={14} />All orders</Link>
          <div className="eyebrow lime">Kart parts</div>
          <h1 className="ref">{order.ref}</h1>
          <div className="wf-meta"><span>Placed {fmtDate(order.createdAt)}</span><span>Updated {fmtDate(order.updatedAt)}</span>{order.guest && <span>Guest checkout</span>}</div>
        </div>
        <div className="row"><StatusBadge {...PART_STATUS[order.status]} />{quoteNeeded && <span className="badge proposed">Quote needed</span>}</div>
      </div>
      {quoteNeeded && (
        <Note tone="warn" title="Quote needed.">
          One or more customised items include uploaded artwork, which is priced by the workshop. You&apos;ll receive a quote by email before those items are made.
          <span className="badge proposed" style={{ marginLeft: 6 }}>Proposed rule · to confirm</span>
        </Note>
      )}
      <Card title="Items" icon="basket">
        <div className="table-wrap">
          <table className="table wf-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Customisation</th><th className="num">Price</th><th>Quote</th></tr></thead>
            <tbody>
              {order.lines.map((l, i) => {
                const f = l.custom?.effect ? filmById(l.custom.effect) : null;
                return (
                  <tr key={i}>
                    <td className="wrap"><strong>{l.name}</strong></td>
                    <td>{l.qty}</td>
                    <td className="wrap small">
                      {l.custom ? (
                        <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                          {f && <span>Effect: {f.name}</span>}
                          <span><Swatch hex={l.custom.color} />Colour {l.custom.color}</span>
                          {l.custom.text && <span>Text: “{l.custom.text}”</span>}
                          {l.custom.artwork && <span>Artwork: {l.custom.artwork.name}</span>}
                        </span>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td className="num">{money(l.price * l.qty)}</td>
                    <td>{l.needsQuote ? <span className="badge warn">Quote</span> : <span className="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row between" style={{ marginTop: 12 }}>
          <span className="small muted">Sample catalogue · no live supplier connection</span>
          <span className="h4">Total {money(order.total)}</span>
        </div>
      </Card>
    </div>
  );
}
