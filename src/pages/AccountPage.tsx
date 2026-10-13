import { useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { backendInfo, toast, useAuth } from '@/store';
import { Field, Note, PageHead, SimBadge } from '@/ui';

export function AccountPage() {
  const { user, signIn, signUp, signOut, setDemoRole } = useAuth();
  const info = useSyncExternalStore(backendInfo.sub, backendInfo.get);
  const local = info.kind === 'local';
  const [tab, setTab] = useState<'in' | 'up'>('up');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === 'up') await signUp(f.email, f.password, f.name);
      else await signIn(f.email, f.password);
      toast('Signed in.');
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="wrap page" style={{ maxWidth: 760 }}>
        <PageHead eyebrow="Account" title={`Hi, ${user.name}`}>{user.email} · {user.role === 'admin' ? 'Workshop staff' : 'Customer'}</PageHead>
        <div className="grid g3">
          <Link className="card pad" to="/saved" style={{ textDecoration: 'none' }}><div className="h4">Saved designs</div><p className="small muted">Name, reopen, duplicate and share.</p></Link>
          <Link className="card pad" to="/orders" style={{ textDecoration: 'none' }}><div className="h4">Orders &amp; proofs</div><p className="small muted">Approvals, quotes, proofs and reorders.</p></Link>
          {user.role === 'admin'
            ? <Link className="card pad" to="/admin" style={{ textDecoration: 'none' }}><div className="h4">Workshop admin</div><p className="small muted">Prices, films, quotes and proofs.</p></Link>
            : <Link className="card pad" to="/helmet-builder" style={{ textDecoration: 'none' }}><div className="h4">Helmet builder</div><p className="small muted">Start a new design.</p></Link>}
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          {local && setDemoRole && (
            <button className="btn btn-ghost" onClick={() => setDemoRole(user.role === 'admin' ? 'customer' : 'admin')}>
              Switch to {user.role === 'admin' ? 'customer' : 'workshop staff'} role <SimBadge>Demo</SimBadge>
            </button>
          )}
          <button className="btn btn-dark" onClick={() => signOut()}>Sign out</button>
        </div>
        {local && <Note tone="sim" className="mt" title="Simulated account.">Stored in this browser only. No password is checked in local demo mode.</Note>}
      </div>
    );
  }

  return (
    <div className="wrap page" style={{ maxWidth: 520 }}>
      <PageHead eyebrow="Account" title="Save your designs">An account lets you save, name, duplicate and share designs, and reorder sticker panels. Guest checkout is fine for straightforward purchases.</PageHead>
      <div className="card pad stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="seg" role="group" aria-label="Sign in or create account">
          <button type="button" aria-pressed={tab === 'up'} onClick={() => setTab('up')}>Create account</button>
          <button type="button" aria-pressed={tab === 'in'} onClick={() => setTab('in')}>Sign in</button>
        </div>
        <form className="stack" onSubmit={submit} style={{ '--gap': '12px' } as React.CSSProperties}>
          {tab === 'up' && <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>}
          <Field label="Email"><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
          <Field label="Password" hint={local ? 'Local demo mode: any password works (simulated account).' : 'At least 6 characters.'}>
            <input className="input" type="password" required={!local} minLength={local ? 0 : 6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={tab === 'up' ? 'new-password' : 'current-password'} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{tab === 'up' ? 'Create account' : 'Sign in'}</button>
        </form>
        {local ? (
          <Note tone="sim" title="Simulated accounts.">Supabase isn't active yet, so accounts and saves live in this browser only.</Note>
        ) : (
          <Note tone="info" title="Live accounts.">Accounts are stored in the connected Supabase project.</Note>
        )}
        {local && setDemoRole && (
          <button className="btn btn-ghost" onClick={() => setDemoRole('admin')}>Enter as demo workshop staff <SimBadge>Demo</SimBadge></button>
        )}
      </div>
    </div>
  );
}
