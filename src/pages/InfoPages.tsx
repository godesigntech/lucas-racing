import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Enquiry } from '@/core/types';
import { nowISO, uid } from '@/core/util';
import { putDoc, simulateEmail, toast, useAuth } from '@/store';
import { Field, Icon, Note, PageHead, ScopeBadge, SimBadge } from '@/ui';

export function AboutPage() {
  return (
    <div className="wrap page">
      <PageHead eyebrow="About the team" title={<>Built by racers, <span className="accent">for racers.</span></>}>
        Lucas Racing is a UK karting team and the exclusive UK distributor of MS Kart. Hydro Karts, the twins' hydro-dipping and chrome business, is now part of the team.
      </PageHead>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="card pad">
            <div className="eyebrow lime">Lucas Racing</div>
            <h2 className="h3" style={{ margin: '6px 0 8px' }}>Race team &amp; MS Kart UK</h2>
            <p className="muted">Race-winning chassis and paddock know-how to help drivers go faster, get on the podium and stay there. Team services include race-day support, test days, awning space, maintenance packages and transport.</p>
          </div>
          <div className="card pad">
            <div className="eyebrow lime">Hydro Karts</div>
            <h2 className="h3" style={{ margin: '6px 0 8px' }}>Helmets, dipping &amp; chrome</h2>
            <p className="muted">Hydro dipping with a library of around 200 films, plus in-house chrome. Every helmet design is approved by the customer before production starts.</p>
          </div>
          <div className="grid g3">
            {[['MS Kart', 'Exclusive UK distributor'], ['In-house', 'Dipping & chrome'], ['Trackside', 'Race-day support']].map(([a, b]) => (
              <div key={a} className="panel"><div className="h4">{a}</div><div className="small muted">{b}</div></div>
            ))}
          </div>
        </div>
        <div className="card about-photo" aria-label="Team photo placeholder">
          <div className="about-photo-inner">
            <Icon name="image" size={36} />
            <div className="h4" style={{ marginTop: 10 }}>Team photography</div>
            <p className="small muted">Placeholder: awaiting approved client photos of the team, the twins and the workshop.</p>
          </div>
        </div>
      </div>
      <style>{`.about-photo{min-height:420px;display:grid;place-items:center;background:repeating-linear-gradient(135deg,#ecebe4 0 18px,#e4e3db 18px 36px)}.about-photo-inner{text-align:center;max-width:280px;padding:20px}`}</style>
    </div>
  );
}

export function ContactPage() {
  const { user } = useAuth();
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', topic: 'Helmet design', message: '' });
  const [sent, setSent] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = nowISO();
    const enq: Enquiry = { id: uid('enq_'), ...f, status: 'new', createdAt: t, updatedAt: t };
    try {
      await putDoc('enquiries', enq as unknown as Enquiry & { [k: string]: unknown });
      await simulateEmail('workshop@lucasracing.demo', `New enquiry: ${f.topic}`, `${f.name} <${f.email}>: ${f.message}`);
      setSent(f.email);
      toast('Thanks! Your enquiry has been logged (no real email sent).');
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };
  return (
    <div className="wrap page">
      <PageHead eyebrow="Contact" title="Talk to the team">Questions about a helmet design, a parts order, sticker kits or team services. Enquiries appear in Workshop admin.</PageHead>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        {sent ? (
          <div className="card pad stack">
            <Note tone="ok" title="Enquiry received.">We'd reply to {sent}. <SimBadge>Email simulated</SimBadge></Note>
            <button className="btn btn-ghost" onClick={() => { setSent(null); setF({ ...f, message: '' }); }}>Send another</button>
          </div>
        ) : (
          <form className="card pad stack" onSubmit={submit} style={{ '--gap': '14px' } as React.CSSProperties}>
            <div className="grid g2">
              <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Email"><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            </div>
            <Field label="Topic">
              <select className="select" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
                {['Helmet design', 'Kart parts', 'Sticker kits', 'Team services', 'Merchandise', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Message"><textarea className="textarea" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
            <div className="row between"><SimBadge>Notifications simulated</SimBadge><button className="btn btn-primary">Send enquiry</button></div>
          </form>
        )}
        <div className="stack">
          <div className="card pad">
            <div className="h4">Visit us</div>
            <p className="muted small" style={{ marginTop: 6 }}>Address, phone and opening hours to be supplied by the client.</p>
          </div>
          <div className="card pad">
            <div className="h4">Kartmania 2026</div>
            <p className="muted small" style={{ marginTop: 6 }}>Find us on the stand, 14–15 November 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MerchandisePage() {
  const [email, setEmail] = useState('');
  return (
    <div className="wrap page">
      <div className="dark-card on-dark merch-hero">
        <div>
          <span className="badge dark">Coming soon</span>
          <h1 className="h1" style={{ marginTop: 14, color: '#f3f2ec' }}>Team merch is <span className="accent">on the grid.</span></h1>
          <p className="muted" style={{ marginTop: 12, maxWidth: 520 }}>Official Lucas Racing team wear and a Delta Racewear collection made for the team. Merchandise customisation will follow in a later phase.</p>
          <form className="row" style={{ marginTop: 22, maxWidth: 480 }} onSubmit={async (e) => { e.preventDefault(); await simulateEmail(email, 'Merch launch alert', 'You will hear first.'); toast("You're on the list (simulated)."); setEmail(''); }}>
            <input className="input grow" type="email" required placeholder="Email me at launch" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <button className="btn btn-primary">Notify me</button>
          </form>
        </div>
        <div className="merch-art" aria-hidden="true">
          <svg viewBox="0 0 200 180"><path d="M62 20 30 36l10 28 16-6v104h88V58l16 6 10-28-32-16c-6 12-20 18-38 18S68 32 62 20z" fill="#c8f031" /><path d="M84 92h32M80 104h40" stroke="#121412" strokeWidth="6" strokeLinecap="round" /></svg>
        </div>
      </div>
      <div className="grid g3" style={{ marginTop: 20 }}>
        {[['Team wear', 'Hoodies, tees and caps in team colours.'], ['Delta Racewear', 'A collection built for the team (feed/link from Delta to be supplied).'], ['Customisation', 'Personalised merch is a later phase.']].map(([a, b]) => (
          <div key={a} className="card pad"><div className="h4">{a}</div><p className="small muted" style={{ marginTop: 6 }}>{b}</p><div style={{ marginTop: 10 }}><ScopeBadge tag="future" /></div></div>
        ))}
      </div>
      <style>{`.merch-hero{display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:center;padding:40px}.merch-art svg{width:min(280px,100%);margin:auto}@media(max-width:800px){.merch-hero{grid-template-columns:1fr;padding:26px 20px}.merch-art{display:none}}`}</style>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="wrap page">
      <div className="empty"><div className="h4">Page not found</div><p className="small">That page isn't part of the demo.</p><Link className="btn btn-dark" to="/" style={{ marginTop: 12 }}>Back home</Link></div>
    </div>
  );
}
