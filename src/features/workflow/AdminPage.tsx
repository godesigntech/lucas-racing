/* Workshop admin: staff-only settings and workflow tools (demonstrates future WordPress/WooCommerce admin). */
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/store';
import { Icon, Note, PageHead, Tabs } from '@/ui';
import { ReturnToCustomer, StaffGate } from './StaffGate';
import { OverviewTab, type AdminTab } from './admin/OverviewTab';
import { FilmsTab } from './admin/FilmsTab';
import { HelmetPricingTab } from './admin/HelmetPricingTab';
import { BespokeTab } from './admin/BespokeTab';
import { KartOrdersTab } from './admin/KartOrdersTab';
import { KartPricingTab } from './admin/KartPricingTab';
import { PartsTab } from './admin/PartsTab';
import { EnquiriesTab } from './admin/EnquiriesTab';
import { CleanupTab } from './admin/CleanupTab';
import { DataTab } from './admin/DataTab';
import { Boundary } from './shared';
import './workflow.css';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'bespoke', label: 'Bespoke & changes' },
  { id: 'kart-orders', label: 'Kart orders & proofs' },
  { id: 'films', label: 'Films' },
  { id: 'helmet-pricing', label: 'Helmet pricing' },
  { id: 'kart-pricing', label: 'Kart pricing' },
  { id: 'parts', label: 'Parts' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'cleanup', label: 'Draft cleanup' },
  { id: 'data', label: 'Data' },
];

export default function AdminPage() {
  return (
    <StaffGate area="Workshop admin">
      <Admin />
    </StaffGate>
  );
}

function Admin() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = (TABS.find((t) => t.id === sp.get('tab'))?.id || 'overview') as AdminTab;
  const go = (t: AdminTab, q: Record<string, string> = {}) => setSp(new URLSearchParams({ tab: t, ...q }));

  return (
    <div className="wrap page wf-page">
      <PageHead eyebrow={<>Staff · {user?.name}</>} title="Workshop admin" actions={
        <>
          <Link className="btn btn-ghost btn-sm" to="/production"><Icon name="wrench" />Production</Link>
          <ReturnToCustomer />
        </>
      }>
        Prices, films, bespoke quotes, post-payment changes, sticker proofs and enquiries in one place.
      </PageHead>
      <Note tone="info" className="" title="Demo:">These controls demonstrate what will become WordPress/WooCommerce admin settings.</Note>
      <div className="wf-tabs-wrap" style={{ marginTop: 14 }}>
        <Tabs label="Admin sections" tabs={TABS} value={tab} onChange={(t) => go(t)} />
      </div>
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        <Boundary label={TABS.find((t) => t.id === tab)?.label || 'This section'}>
        {tab === 'overview' && <OverviewTab go={go} />}
        {tab === 'films' && <FilmsTab />}
        {tab === 'helmet-pricing' && <HelmetPricingTab />}
        {tab === 'bespoke' && <BespokeTab />}
        {tab === 'kart-orders' && <KartOrdersTab />}
        {tab === 'kart-pricing' && <KartPricingTab />}
        {tab === 'parts' && <PartsTab />}
        {tab === 'enquiries' && <EnquiriesTab />}
        {tab === 'cleanup' && <CleanupTab />}
        {tab === 'data' && <DataTab />}
        </Boundary>
      </div>
    </div>
  );
}
