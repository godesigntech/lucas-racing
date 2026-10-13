import { useMemo } from 'react';
import type { Enquiry, HelmetJob, KartOrder, Notification, PartOrder } from '@/core/types';
import { useCollection } from '@/store';
import { SimBadge } from '@/ui';
import type { D } from '../data';
import { Card, NotificationList } from '../shared';

export type AdminTab = 'overview' | 'films' | 'helmet-pricing' | 'bespoke' | 'kart-orders' | 'kart-pricing' | 'parts' | 'enquiries' | 'cleanup' | 'data';

export function OverviewTab({ go }: { go: (t: AdminTab, q?: Record<string, string>) => void }) {
  const jobs = useCollection<D<HelmetJob>>('jobs').items;
  const karts = useCollection<D<KartOrder>>('kartOrders').items;
  const parts = useCollection<D<PartOrder>>('partOrders').items;
  const enquiries = useCollection<D<Enquiry>>('enquiries').items;
  const notifs = useCollection<D<Notification>>('notifications').items;

  const s = useMemo(() => ({
    openBespoke: jobs.filter((j) => j.kind === 'bespoke' && ['submitted', 'in-discussion', 'quoted', 'awaiting-payment'].includes(j.status)).length,
    changes: jobs.filter((j) => j.status === 'change-requested').length,
    awaitingProof: karts.filter((o) => ['paid', 'artwork-check', 'changes-requested'].includes(o.status)).length,
    withCustomer: karts.filter((o) => o.status === 'proof-sent').length,
    readyToPrint: karts.filter((o) => o.status === 'proof-approved').length,
    unpaid: [...jobs.flatMap((j) => j.invoices), ...karts.flatMap((o) => o.invoices)].filter((i) => i.status === 'unpaid').length,
    partsQuote: parts.filter((p) => p.status === 'awaiting-quote').length,
    newEnquiries: enquiries.filter((e) => e.status === 'new').length,
  }), [jobs, karts, parts, enquiries]);

  const stats: { v: number; l: string; tab: AdminTab; q?: Record<string, string> }[] = [
    { v: s.openBespoke, l: 'Open bespoke', tab: 'bespoke', q: { filter: 'open' } },
    { v: s.changes, l: 'Change requests', tab: 'bespoke', q: { filter: 'change-requested' } },
    { v: s.awaitingProof, l: 'Awaiting proof', tab: 'kart-orders', q: { filter: 'needs-proof' } },
    { v: s.withCustomer, l: 'Proof with customer', tab: 'kart-orders', q: { filter: 'proof-sent' } },
    { v: s.readyToPrint, l: 'Ready to print', tab: 'kart-orders', q: { filter: 'proof-approved' } },
    { v: s.unpaid, l: 'Unpaid invoices', tab: 'bespoke', q: { filter: 'all' } },
    { v: s.partsQuote, l: 'Parts awaiting quote', tab: 'parts' },
    { v: s.newEnquiries, l: 'New enquiries', tab: 'enquiries' },
  ];
  const recent = [...notifs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-stats">
        {stats.map((x) => (
          <button key={x.l} type="button" className={'wf-stat' + (x.v > 0 && x.l !== 'Proof with customer' ? ' hot' : '')} onClick={() => go(x.tab, x.q)}>
            <span className="v">{x.v}</span><span className="l">{x.l}</span>
          </button>
        ))}
      </div>
      <Card title="Recent notifications" icon="mail" actions={<><SimBadge>Simulated email log</SimBadge><span className="tiny muted">{notifs.length} total</span></>}>
        <p className="tiny muted" style={{ marginBottom: 6 }}>Nothing is actually sent. In production these become WooCommerce / transactional emails.</p>
        <NotificationList items={recent.map((n) => ({ at: n.createdAt, to: n.to, subject: n.subject, body: n.body }))} />
      </Card>
    </div>
  );
}
