/* Checkout form: contact, delivery and a clearly SIMULATED payment step.
   No card details are collected or validated; the demo card is display-only. */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/core/types';
import { money } from '@/core/util';
import { Field, Icon, Note, Seg, SimBadge } from '@/ui';
import type { CheckoutDetails } from './checkout';

export const emptyDetails = (user: User | null): CheckoutDetails => ({
  name: user?.name || '',
  email: user?.email || '',
  delivery: 'delivery',
  address: { line1: '', line2: '', city: '', postcode: '', country: 'United Kingdom' },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDetails(d: CheckoutDetails): Partial<Record<'name' | 'email' | 'line1' | 'city' | 'postcode', string>> {
  const e: ReturnType<typeof validateDetails> = {};
  if (!d.name.trim()) e.name = 'Enter your name.';
  if (!EMAIL.test(d.email.trim())) e.email = 'Enter a valid email address for your confirmation.';
  if (d.delivery === 'delivery') {
    if (!d.address.line1.trim()) e.line1 = 'Enter the first line of your address.';
    if (!d.address.city.trim()) e.city = 'Enter a town or city.';
    if (!d.address.postcode.trim()) e.postcode = 'Enter a postcode.';
  }
  return e;
}

export function CheckoutForm({ details, onChange, user, total, busy, blocked, onPay, onBack }: {
  details: CheckoutDetails;
  onChange: (d: CheckoutDetails) => void;
  user: User | null;
  total: number;
  busy: boolean;
  blocked: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  const [tried, setTried] = useState(false);
  const errors = validateDetails(details);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);
  const set = (patch: Partial<CheckoutDetails>) => onChange({ ...details, ...patch });
  const setAddr = (patch: Partial<CheckoutDetails['address']>) => onChange({ ...details, address: { ...details.address, ...patch } });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length || blocked || busy) {
      const first = document.querySelector<HTMLElement>('.co-form [aria-invalid="true"]');
      first?.focus();
      return;
    }
    onPay();
  };

  return (
    <form className="co-form stack" style={{ '--gap': '18px' } as React.CSSProperties} onSubmit={submit} noValidate>
      <section className="card pad stack co-sec" aria-labelledby="co-contact">
        <div className="row between">
          <h2 id="co-contact" className="h4">1. Contact</h2>
          {user ? <span className="badge ok"><Icon name="user" size={12} />Signed in</span> : <span className="badge">Guest checkout</span>}
        </div>
        {!user && (
          <Note tone="info">
            Guest checkout is fine for straightforward purchases; an account is needed to save designs and reorder sticker panels.{' '}
            <Link to="/account" className="btn-link">Sign in or create an account</Link>
          </Note>
        )}
        <div className="grid g2">
          <Field label="Full name"><TextIn value={details.name} onChange={(name) => set({ name })} autoComplete="name" error={show('name')} /></Field>
          <Field label="Email"><TextIn type="email" value={details.email} onChange={(email) => set({ email })} autoComplete="email" error={show('email')} /></Field>
        </div>
      </section>

      <section className="card pad stack co-sec" aria-labelledby="co-delivery">
        <h2 id="co-delivery" className="h4">2. Delivery</h2>
        <Seg label="Delivery method" value={details.delivery} onChange={(delivery) => set({ delivery })}
          options={[{ id: 'delivery', label: 'Deliver to me' }, { id: 'collect', label: 'Collect from workshop' }]} />
        {details.delivery === 'delivery' ? (
          <div className="grid g2">
            <Field label="Address line 1"><TextIn value={details.address.line1} onChange={(line1) => setAddr({ line1 })} autoComplete="address-line1" error={show('line1')} /></Field>
            <Field label="Address line 2 (optional)"><TextIn value={details.address.line2} onChange={(line2) => setAddr({ line2 })} autoComplete="address-line2" /></Field>
            <Field label="Town / city"><TextIn value={details.address.city} onChange={(city) => setAddr({ city })} autoComplete="address-level2" error={show('city')} /></Field>
            <Field label="Postcode"><TextIn value={details.address.postcode} onChange={(postcode) => setAddr({ postcode })} autoComplete="postal-code" error={show('postcode')} /></Field>
            <Field label="Country">
              <select className="select" value={details.address.country} onChange={(e) => setAddr({ country: e.target.value })} autoComplete="country-name">
                {['United Kingdom', 'Ireland', 'France', 'Belgium', 'Netherlands', 'Germany', 'Spain', 'Italy'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <p className="small muted">Collect from the Lucas Racing workshop. We'll email when your order is ready. Track-side handover can be arranged with the workshop.</p>
        )}
        <span className="tiny muted">Delivery charges are not modelled in this demo.</span>
      </section>

      <section className="card pad stack co-sec" aria-labelledby="co-pay">
        <div className="row between">
          <h2 id="co-pay" className="h4">3. Payment</h2>
          <SimBadge>Simulated payment</SimBadge>
        </div>
        <Note tone="sim"><strong>No real payment is taken.</strong> This demo does not collect card details. Pressing Pay creates your order records and a simulated confirmation email.</Note>
        <div className="fake-card" aria-hidden="true">
          <div className="row between"><span className="fake-chip" /><span className="fake-brand">DEMO</span></div>
          <div className="fake-num">4242 4242 4242 4242</div>
          <div className="row between tiny"><span>TEST CARD · DISPLAY ONLY</span><span>12/34</span></div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || blocked}>
          {busy ? 'Processing…' : <><Icon name="lock" />Pay {money(total)} (simulated)</>}
        </button>
        {blocked && <p className="small co-blocked" role="alert">Resolve the highlighted basket items before paying.</p>}
        <button type="button" className="btn btn-link co-back" onClick={onBack}><Icon name="back" size={14} />Back to basket</button>
      </section>
    </form>
  );
}

function TextIn({ value, onChange, error, type = 'text', autoComplete }: { value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string }) {
  return (
    <>
      <input className={'input' + (error ? ' invalid' : '')} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={!!error} />
      {error && <span className="tiny co-err">{error}</span>}
    </>
  );
}
