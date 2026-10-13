import { useState } from 'react';
import type { Collection } from '@/store/backend';
import { toast, useCollection } from '@/store';
import { Icon, Modal, Note, SimBadge } from '@/ui';
import { downloadJson } from '../data';
import { Card } from '../shared';
import { useBackendInfo } from '../StaffGate';

const COLLECTIONS: { id: Collection; label: string }[] = [
  { id: 'helmetDesigns', label: 'Helmet designs' },
  { id: 'kartDesigns', label: 'Kart designs' },
  { id: 'jobs', label: 'Helmet jobs' },
  { id: 'kartOrders', label: 'Kart orders' },
  { id: 'partOrders', label: 'Parts orders' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'shares', label: 'Share links' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' },
];

export function DataTab() {
  const info = useBackendInfo();
  const data = {
    helmetDesigns: useCollection('helmetDesigns').items,
    kartDesigns: useCollection('kartDesigns').items,
    jobs: useCollection('jobs').items,
    kartOrders: useCollection('kartOrders').items,
    partOrders: useCollection('partOrders').items,
    enquiries: useCollection('enquiries').items,
    shares: useCollection('shares').items,
    notifications: useCollection('notifications').items,
    settings: useCollection('settings').items,
  } satisfies Record<Collection, unknown[]>;
  const [confirm, setConfirm] = useState(false);
  const size = (() => { try { return Math.round(new Blob([JSON.stringify(data)]).size / 1024); } catch { return 0; } })();

  const reset = () => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('lr:')) keys.push(k); }
      keys.forEach((k) => localStorage.removeItem(k));
      toast(`Cleared ${keys.length} demo storage keys. Reloading…`);
      setTimeout(() => { window.location.hash = '#/'; window.location.reload(); }, 600);
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Card title="Storage backend" icon="layers" actions={info.kind === 'local' ? <SimBadge>Simulated</SimBadge> : <span className="badge ok">Supabase</span>}>
        <dl className="wf-kv">
          <dt>Backend</dt><dd>{info.label}</dd>
          <dt>Kind</dt><dd className="mono">{info.kind}</dd>
          <dt>Approx. size</dt><dd>{size} KB visible to this account</dd>
        </dl>
        {info.note && <Note tone="warn" className="" >{info.note}</Note>}
        {info.kind === 'local' && <p className="small muted" style={{ marginTop: 10 }}>Data lives in this browser&apos;s localStorage only. In the live build this is replaced by WordPress/WooCommerce storage.</p>}
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table wf-table">
            <thead><tr><th>Collection</th><th className="num">Records</th></tr></thead>
            <tbody>{COLLECTIONS.map((c) => <tr key={c.id}><td>{c.label} <span className="mono muted">{c.id}</span></td><td className="num">{data[c.id].length}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="wf-layout">
        <Card title="Export JSON" icon="download">
          <p className="small" style={{ marginBottom: 10 }}>Download every collection visible to this account as one JSON file (useful for handover and migration planning).</p>
          <button className="btn btn-dark btn-sm" onClick={() => downloadJson({ exportedAt: new Date().toISOString(), backend: info, ...data }, `lucas-racing-demo-${new Date().toISOString().slice(0, 10)}.json`)}>
            <Icon name="download" />Export JSON
          </button>
        </Card>
        <Card title="Reset demo data" icon="reset">
          {info.kind === 'local' ? (
            <>
              <p className="small" style={{ marginBottom: 10 }}>Clears every <span className="mono">lr:*</span> key in this browser: designs, orders, settings, basket, simulated accounts and your session.</p>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Icon name="trash" />Reset demo data…</button>
            </>
          ) : <p className="small muted">Reset is only available for browser-local demo storage. Supabase data is managed in the Supabase dashboard.</p>}
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset all demo data?"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={reset}>Reset everything</button></>}>
        <p className="small">This permanently clears all browser-local demo data, including orders and production history, and signs you out. Consider exporting JSON first.</p>
      </Modal>
    </div>
  );
}
