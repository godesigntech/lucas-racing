/* Basket + SIMULATED checkout for every item type (helmets, sticker kits/reorders, kart parts). */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '@/core/util';
import { toast, useAuth, useBasket, useSettings } from '@/store';
import { Empty, Icon, Note, PageHead, SimBadge } from '@/ui';
import { BasketLine } from './BasketLine';
import { CheckoutForm, emptyDetails } from './CheckoutForm';
import { OrderConfirmation } from './OrderConfirmation';
import { itemIssues, lineTotal, placeOrders, type CheckoutDetails, type PlacedOrder } from './checkout';
import './shop.css';

type Step = 'basket' | 'checkout' | 'done';

export default function BasketPage() {
  const basket = useBasket();
  const settings = useSettings();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('basket');
  const [details, setDetails] = useState<CheckoutDetails>(() => emptyDetails(user));
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ orders: PlacedOrder[]; email: string; guest: boolean } | null>(null);

  // Prefill from the signed-in user (without overwriting anything typed).
  useEffect(() => {
    if (!user) return;
    setDetails((d) => ({ ...d, name: d.name || user.name, email: d.email || user.email }));
  }, [user]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const issues = useMemo(() => Object.fromEntries(basket.items.map((i) => [i.id, itemIssues(i, user, settings)])), [basket.items, user, settings]);
  const blockedCount = Object.values(issues).filter((x) => x.length).length;
  const quoteParts = basket.items.some((i) => i.type === 'part' && i.needsQuote);

  if (step === 'done' && placed) {
    return <div className="wrap page shop"><OrderConfirmation orders={placed.orders} email={placed.email} guest={placed.guest} /></div>;
  }

  if (!basket.items.length) {
    return (
      <div className="wrap page shop">
        <PageHead eyebrow="Basket" title="Your basket" />
        <Empty title="Your basket is empty" action={
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/helmet-builder" className="btn btn-dark btn-sm"><Icon name="helmet" size={15} />Helmet Builder</Link>
            <Link to="/parts" className="btn btn-ghost btn-sm"><Icon name="wrench" size={15} />Kart Parts</Link>
            <Link to="/stickers" className="btn btn-ghost btn-sm"><Icon name="kart" size={15} />Sticker Kits</Link>
          </div>
        }>
          Design a helmet, build a sticker kit or pick up some parts.
        </Empty>
      </div>
    );
  }

  const pay = async () => {
    setBusy(true);
    try {
      const orders = await placeOrders(basket.items, details, user, settings);
      basket.clear();
      setPlaced({ orders, email: details.email.trim(), guest: !user });
      setStep('done');
      toast(`Payment simulated: ${orders.length} order${orders.length === 1 ? '' : 's'} created`);
    } catch (e) {
      toast((e as Error).message || 'Checkout failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  const summary = (
    <aside className="b-summary card pad stack" aria-label="Order summary">
      <h2 className="h4">Order summary</h2>
      <div className="lines">
        {basket.items.map((i) => (
          <div className="ln" key={i.id}><span>{i.qty > 1 ? `${i.qty} × ` : ''}{i.name}</span><span className="nowrap">{money(lineTotal(i))}</span></div>
        ))}
        <div className="ln muted"><span>Delivery</span><span>Not modelled</span></div>
        <div className="total"><span>Total</span><span>{money(basket.total)}</span></div>
      </div>
      {quoteParts && <Note tone="info">Custom artwork on parts goes to the workshop for a quote after checkout; it is not included in this total.</Note>}
      {blockedCount > 0 && <Note tone="err">{blockedCount} item{blockedCount === 1 ? '' : 's'} must be resolved before checkout.</Note>}
      {step === 'basket' && (
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled={blockedCount > 0} onClick={() => setStep('checkout')}>
          Checkout<Icon name="arrow" />
        </button>
      )}
      <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
        <SimBadge>Simulated checkout</SimBadge>
        <span className="tiny muted">No real payment is taken.</span>
      </div>
    </aside>
  );

  return (
    <div className="wrap page shop">
      <PageHead eyebrow={step === 'basket' ? 'Basket' : 'Checkout'} title={step === 'basket' ? 'Your basket' : 'Checkout'}>
        {step === 'basket'
          ? `${basket.count} item${basket.count === 1 ? '' : 's'}. Helmets are checked against the exact version you approved before payment.`
          : user ? `Signed in as ${user.email}.` : 'Checking out as a guest.'}
      </PageHead>

      <ol className="co-steps" aria-label="Checkout progress">
        <li className={step === 'basket' ? 'on' : 'done'}>Basket</li>
        <li className={step === 'checkout' ? 'on' : ''}>Details &amp; payment</li>
        <li>Confirmation</li>
      </ol>

      <div className="b-layout">
        <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
          {step === 'basket' ? (
            <>
              <div className="b-list card">
                {basket.items.map((i) => <BasketLine key={i.id} item={i} issues={issues[i.id] || []} settings={settings} />)}
              </div>
              <div className="row between">
                <Link to="/parts" className="btn btn-ghost btn-sm"><Icon name="back" size={14} />Continue shopping</Link>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Remove everything from your basket?')) basket.clear(); }}>
                  <Icon name="trash" size={14} />Empty basket
                </button>
              </div>
            </>
          ) : (
            <>
              {blockedCount > 0 && (
                <div className="b-list card">
                  {basket.items.filter((i) => issues[i.id]?.length).map((i) => <BasketLine key={i.id} item={i} issues={issues[i.id]} settings={settings} />)}
                </div>
              )}
              <CheckoutForm details={details} onChange={setDetails} user={user} total={basket.total} busy={busy} blocked={blockedCount > 0}
                onPay={pay} onBack={() => setStep('basket')} />
            </>
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}
