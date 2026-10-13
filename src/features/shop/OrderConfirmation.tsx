/* Post-payment confirmation (simulated): order refs + what happens next for each order type. */
import { Link } from 'react-router-dom';
import { money } from '@/core/util';
import { Icon, Note, SimBadge } from '@/ui';
import type { PlacedOrder } from './checkout';

const KIND: Record<PlacedOrder['kind'], { label: string; icon: string }> = {
  helmet: { label: 'Helmet', icon: 'helmet' },
  kart: { label: 'Sticker kit', icon: 'kart' },
  parts: { label: 'Kart parts', icon: 'wrench' },
};

export function OrderConfirmation({ orders, email, guest }: { orders: PlacedOrder[]; email: string; guest: boolean }) {
  const has = (k: PlacedOrder['kind']) => orders.some((o) => o.kind === k);
  const total = orders.reduce((a, o) => a + o.total, 0);
  const kartNew = orders.some((o) => o.kind === 'kart' && !o.status.includes('reusing'));
  const kartReorder = orders.some((o) => o.kind === 'kart' && o.status.includes('reusing'));
  const partsQuote = orders.some((o) => o.kind === 'parts' && o.status.includes('quote'));

  return (
    <div className="co-done stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div className="done-hero dark-card on-dark">
        <span className="done-tick" aria-hidden="true"><Icon name="check" size={28} /></span>
        <div>
          <div className="eyebrow">Payment simulated</div>
          <h1 className="h2">Thanks, your order{orders.length === 1 ? ' is' : 's are'} in.</h1>
          <p className="done-sub">A confirmation for each order has been logged as a simulated email to <strong>{email}</strong>. Total {money(total)}.</p>
        </div>
      </div>

      <section className="card pad stack" aria-labelledby="done-refs">
        <div className="row between">
          <h2 id="done-refs" className="h4">Your order references</h2>
          <SimBadge />
        </div>
        <ul className="done-list">
          {orders.map((o) => (
            <li key={o.id}>
              <span className="done-ico"><Icon name={KIND[o.kind].icon} /></span>
              <div className="grow">
                <div className="mono done-ref">{o.ref}</div>
                <div className="small">{KIND[o.kind].label}: {o.label}</div>
                <div className="tiny muted">{o.status}</div>
              </div>
              <span className="nowrap done-amt">{money(o.total)}</span>
            </li>
          ))}
        </ul>
        <div className="row">
          <Link to="/orders" className="btn btn-dark"><Icon name="layers" size={16} />Track in My orders</Link>
          <Link to="/parts" className="btn btn-ghost">Continue shopping</Link>
        </div>
        {guest && <Note tone="info">You checked out as a guest. Your orders are remembered in this browser under My orders. Create an account to save designs and reorder sticker panels later.</Note>}
      </section>

      <section className="card pad stack" aria-labelledby="done-next">
        <h2 id="done-next" className="h4">What happens next</h2>
        <ol className="done-steps">
          {has('helmet') && (
            <li><strong>Helmets</strong> go straight to the production queue. The exact version you approved is locked as the production master, so the workshop paints precisely what you signed off. Any later change needs to be requested and authorised as a new revision.</li>
          )}
          {kartNew && (
            <li><strong>Sticker kits</strong>: payment is taken first, then <em>artwork check → proof → your approval → Sent to Print</em>. Nothing is printed until you approve the proof; you'll be emailed when it is ready to review.</li>
          )}
          {kartReorder && (
            <li><strong>Sticker reorders</strong> reuse your previously approved artwork, so they can go straight to Sent to Print.</li>
          )}
          {has('parts') && (
            <li><strong>Kart parts</strong> are picked and dispatched by the workshop.{partsQuote ? ' Custom artwork on a part is quoted by the workshop first; we will contact you before it is produced.' : ''}</li>
          )}
        </ol>
      </section>
    </div>
  );
}
