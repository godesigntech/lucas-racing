/* Staff-only access handling shared by Workshop admin and Production. */
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { backendInfo, toast, useAuth } from '@/store';
import { Icon, Note, PageHead, SimBadge } from '@/ui';

export function useBackendInfo() {
  return useSyncExternalStore(backendInfo.sub, backendInfo.get);
}

export function StaffGate({ area, children }: { area: string; children: ReactNode }) {
  const { user, isAdmin, setDemoRole } = useAuth();
  const info = useBackendInfo();
  const [busy, setBusy] = useState(false);
  if (isAdmin) return <>{children}</>;
  const switchRole = async () => {
    if (!setDemoRole) return;
    setBusy(true);
    try {
      await setDemoRole('admin');
      toast('Switched to the demo workshop role (simulated).');
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wrap page wf-page">
      <PageHead eyebrow="Staff only" title={area}>
        This area is for Lucas Racing workshop staff. Customers manage their orders and proofs from <a href="#/orders">My orders &amp; proofs</a>.
      </PageHead>
      <div className="wf-gate stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="wf-card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <span className="icon-btn" aria-hidden="true" style={{ background: 'var(--char)', color: 'var(--lime)', borderColor: 'var(--char)' }}><Icon name="lock" /></span>
            <div>
              <div className="h4">Workshop access required</div>
              <div className="small muted">{user ? `Signed in as ${user.name} (customer role).` : 'You are not signed in.'}</div>
            </div>
          </div>
          {info.kind === 'local' ? (
            <>
              <p className="small">
                In the live site this would be restricted to WordPress administrator / shop manager accounts. In this browser-local demo you can
                switch the current visitor into a simulated workshop role to explore the staff tools.
              </p>
              <div className="row">
                <button className="btn btn-dark" onClick={switchRole} disabled={busy || !setDemoRole}><Icon name="wrench" />Switch to demo workshop role (simulated)</button>
                <SimBadge />
              </div>
              {!user && <p className="tiny muted">A demo staff identity (workshop@lucasracing.demo) is created in this browser only.</p>}
            </>
          ) : (
            <Note tone="info" title="Supabase mode:">
              Staff access is granted by listing the user&apos;s id in the <code>lr_admins</code> table. Ask the project owner to add your account, then sign in again.
            </Note>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Return to customer role" for the simulated local demo. */
export function ReturnToCustomer() {
  const { setDemoRole, isAdmin } = useAuth();
  const info = useBackendInfo();
  if (info.kind !== 'local' || !setDemoRole || !isAdmin) return null;
  return (
    <button className="btn btn-ghost btn-sm" onClick={async () => {
      try { await setDemoRole('customer'); toast('Returned to the customer role.'); } catch (e) { toast((e as Error).message, 'err'); }
    }}><Icon name="user" />Return to customer role</button>
  );
}
