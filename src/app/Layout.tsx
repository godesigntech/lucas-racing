import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { backendInfo, useAuth, useBasket, useMode, useToasts } from '@/store';
import { Icon, LogoMark } from '@/ui';

const MAIN = [
  { to: '/', label: 'Home', end: true },
  { to: '/helmet-builder', label: 'Helmet Builder' },
  { to: '/parts', label: 'Kart Parts' },
  { to: '/stickers', label: 'Sticker Kits' },
  { to: '/merchandise', label: 'Merchandise' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { mode, setMode } = useMode();
  const { user } = useAuth();
  const basket = useBasket();
  const toasts = useToasts();
  const info = useSyncExternalStore(backendInfo.sub, backendInfo.get);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <>
      <a className="sr-only" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="wrap hdr">
          <Link to="/" className="logo" aria-label="Lucas Racing home">
            <LogoMark />
            <span className="logo-word">LUCAS RACING<small>× HYDRO KARTS · DRAFT BRAND</small></span>
          </Link>
          <nav className={'main-nav' + (open ? ' open' : '')} aria-label="Main">
            {MAIN.map((m) => <NavLink key={m.to} to={m.to} end={m.end}>{m.label}</NavLink>)}
          </nav>
          <div className="hdr-actions">
            <Link to="/basket" className="icon-btn" aria-label={`Basket, ${basket.count} items`} style={{ position: 'relative' }}>
              <Icon name="basket" />
              {basket.count > 0 && <span className="badge dark" style={{ position: 'absolute', top: -7, right: -7, height: 18, padding: '0 5px' }}>{basket.count}</span>}
            </Link>
            <Link to="/account" className="avatar" aria-label={user ? `Account: ${user.name}` : 'Sign in'} title={user ? `${user.name}${user.role === 'admin' ? ' (workshop)' : ''}` : 'Sign in'}>
              {user ? user.name.slice(0, 2).toUpperCase() : <Icon name="user" size={18} />}
            </Link>
            <button className="icon-btn burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              <Icon name={open ? 'x' : 'menu'} />
            </button>
          </div>
        </div>
        <div className="demo-bar">
          <div className="wrap demo-bar-inner">
            <span className="demo-pill"><span className="dot" />Interactive project demo</span>
            <label className="row" style={{ gap: 8 }}>
              <span className="small" style={{ color: 'rgba(243,242,236,.8)' }}>Explore</span>
              <select className="mode-select" value={mode} onChange={(e) => setMode(e.target.value as 'launch' | 'full')} aria-label="Scope mode">
                <option value="launch">Launch experience</option>
                <option value="full">Full specification preview</option>
              </select>
            </label>
            <nav className="sub-nav" aria-label="Account and workshop">
              <NavLink to="/saved">Saved designs</NavLink>
              <NavLink to="/orders">My orders &amp; proofs</NavLink>
              <NavLink to="/admin">Workshop admin</NavLink>
              <NavLink to="/production">Production</NavLink>
              <NavLink to="/scope">Scope guide</NavLink>
              <NavLink to="/basket">Basket<span className="count">{basket.count}</span></NavLink>
            </nav>
          </div>
        </div>
        {info.note && <div className="storage-note"><div className="wrap">{info.note}</div></div>}
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="row" style={{ marginBottom: 12 }}><LogoMark /><span className="logo-word" style={{ color: '#fff' }}>LUCAS RACING</span></div>
              <p>UK karting team, exclusive UK distributor of MS Kart and home of Hydro Karts custom helmets.</p>
              <p className="tiny" style={{ marginTop: 10 }}>Draft branding and illustrative assets. Awaiting approved client logo and photography.</p>
            </div>
            <div><div className="foot-h">Design</div><div className="foot-links"><Link to="/helmet-builder">Helmet Builder</Link><Link to="/stickers">Sticker Kits</Link><Link to="/saved">Saved designs</Link><Link to="/scope">Scope guide</Link></div></div>
            <div><div className="foot-h">Shop</div><div className="foot-links"><Link to="/parts">Kart Parts</Link><Link to="/merchandise">Merchandise</Link><Link to="/basket">Basket</Link><Link to="/orders">Orders &amp; proofs</Link></div></div>
            <div><div className="foot-h">Team</div><div className="foot-links"><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/admin">Workshop admin</Link><Link to="/production">Production</Link></div></div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} Lucas Racing · Interactive prototype, not a live shop.</span>
            <span>Storage: {info.label} · Payments, emails and AI are simulated.</span>
          </div>
        </div>
      </footer>
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.tone}>{t.text}</div>)}</div>
    </>
  );
}
