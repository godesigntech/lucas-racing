/* Launch-mode page: full-size kart sticker kits are a future phase. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { simulateEmail, toast } from '@/store';
import { Icon, Note, ScopeBadge, SimBadge } from '@/ui';
import { KART_TEMPLATES } from '@/data/kart';
import { ProcessSteps, useTemplateArt } from './KartBits';
import { useRenderTick } from './useKartRender';

const COMING = [
  { icon: 'kart', title: 'Pick your bodywork', text: 'Start from your kart’s bodywork so every panel is laid out on the right shape.' },
  { icon: 'layers', title: `${KART_TEMPLATES.length} kit templates`, text: 'Race-ready layouts for side pods, nassau and front bumper, recoloured in one tap.' },
  { icon: 'text', title: 'Colours, names, numbers & logos', text: 'Add your name and race number, upload sponsor logos, draw your own shapes.' },
  { icon: 'sparkle', title: 'Standard or Holographic', text: 'Printed vinyl with gloss laminate, or a holographic finish that catches the light.' },
  { icon: 'eye', title: 'Proofs before print', text: 'A clean digital proof for you to approve. Nothing is printed until you do.' },
  { icon: 'reset', title: 'Easy reorders', text: 'Crashed a pod? Reorder a single panel from your approved artwork in a couple of clicks.' },
];

export function ComingSoon() {
  const tick = useRenderTick(null);
  const art = useTemplateArt(['Velocity', 'Apex', 'Heritage'], tick);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast('Please enter a valid email address.', 'warn'); return; }
    await simulateEmail(email.trim(), 'You’re on the list: Lucas Racing kart sticker kits',
      'Thanks for your interest. We will email you as soon as full-size kart sticker kits open for orders.');
    setDone(true);
    toast('You’re on the list. We’ll email you when sticker kits launch (simulated email).');
  };

  return (
    <div className="wrap page kart-page">
      <section className="ks-hero dark-card on-dark">
        <div className="ks-hero-copy">
          <div className="row" style={{ marginBottom: 14 }}>
            <ScopeBadge tag="future" />
            <span className="eyebrow">Coming soon</span>
          </div>
          <h1 className="h1">Full-size kart sticker kits</h1>
          <p className="lead ks-lead">Design a complete sticker kit for your kart (side pods, nassau panel and front bumper) on your own bodywork, then approve a proof before anything is printed.</p>
          <form className="ks-notify" onSubmit={submit} aria-label="Get notified when sticker kits launch">
            {done ? (
              <div className="ks-done" role="status"><Icon name="check" />You’re on the list. We’ll be in touch.</div>
            ) : (
              <>
                <label className="sr-only" htmlFor="ks-email">Email address</label>
                <input id="ks-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <button className="btn btn-primary" type="submit"><Icon name="mail" />Notify me</button>
              </>
            )}
          </form>
          <div className="row" style={{ marginTop: 10 }}><SimBadge>Simulated email</SimBadge><span className="tiny muted">We only use your email to tell you about the launch.</span></div>
        </div>
        <div className="ks-hero-art" aria-hidden="true">
          {art.map((a, i) => <img key={a.name} src={a.src} alt="" className={'ks-pod p' + i} />)}
        </div>
      </section>

      <section className="ks-demo card pad">
        <div className="grow">
          <div className="row" style={{ marginBottom: 6 }}><ScopeBadge tag="future" /><SimBadge>Demo</SimBadge></div>
          <div className="h3">Preview the future configurator (demo)</div>
          <p className="small muted" style={{ marginTop: 4 }}>Try the planned kit designer now: templates, layers, freehand drawing, material choice and automatic pricing. Not open for orders at launch.</p>
        </div>
        <Link to="/stickers/build" className="btn btn-dark btn-lg">Open the configurator demo<Icon name="arrow" /></Link>
      </section>

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="eyebrow lime">What’s coming</div>
        <h2 className="h2" style={{ margin: '6px 0 20px' }}>Everything you need for a fresh kit</h2>
        <div className="grid g3">
          {COMING.map((c) => (
            <div key={c.title} className="card pad ks-feature">
              <span className="ks-ic"><Icon name={c.icon} size={20} /></span>
              <div className="h4" style={{ marginTop: 12 }}>{c.title}</div>
              <p className="small muted" style={{ marginTop: 6 }}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid g2 ks-how">
        <div>
          <div className="eyebrow lime">How ordering will work</div>
          <h2 className="h2" style={{ margin: '6px 0 12px' }}>Proof first. Print second.</h2>
          <p className="muted">Kits are priced automatically, even with your own artwork, logos or AI concepts. You pay first, the workshop checks your artwork, and you approve a clean digital proof. Printing stays blocked until the current proof is approved.</p>
          <Note tone="info" className="ks-note">Easy online reordering of single panels will be available on customer accounts.</Note>
        </div>
        <div className="card pad"><ProcessSteps /></div>
      </section>
    </div>
  );
}
