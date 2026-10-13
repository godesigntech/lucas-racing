import { useState } from 'react';
import type { Enquiry } from '@/core/types';
import { fmtDate } from '@/core/util';
import { simulateEmail, useCollection } from '@/store';
import { Icon, SimBadge } from '@/ui';
import { ENQUIRY_STATUS, attempt, saveEnquiry, type D } from '../data';
import { Card, StatusBadge } from '../shared';

export function EnquiriesTab() {
  const { items, loading } = useCollection<D<Enquiry>>('enquiries');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [selId, setSelId] = useState<string | null>(null);
  const list = items.filter((e) => filter === 'all' || e.status !== 'closed');
  const sel = items.find((e) => e.id === selId) || null;
  return (
    <div className="wf-split">
      <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <select className="select sm" value={filter} onChange={(e) => setFilter(e.target.value as 'open' | 'all')} aria-label="Filter enquiries">
          <option value="open">Open ({items.filter((e) => e.status !== 'closed').length})</option>
          <option value="all">All ({items.length})</option>
        </select>
        <div className="wf-list wf-scroll" role="list">
          {loading && !items.length && <div className="muted small">Loading…</div>}
          {!loading && !list.length && <div className="wf-empty-inline">No enquiries.</div>}
          {list.map((e) => (
            <button key={e.id} role="listitem" className="wf-item" aria-current={e.id === selId} onClick={() => setSelId(e.id)}>
              <span className="top"><span className="ref">{e.name}</span><StatusBadge {...ENQUIRY_STATUS[e.status]} /></span>
              <span className="sub">{e.topic} · {fmtDate(e.createdAt)}</span>
              <span className="sub">{e.message}</span>
            </button>
          ))}
        </div>
      </div>
      <div>{sel ? <EnquiryDetail key={sel.id} e={sel} /> : <div className="empty"><div className="h4">Select an enquiry</div><p className="small">Messages from the contact form appear here.</p></div>}</div>
    </div>
  );
}

function EnquiryDetail({ e }: { e: Enquiry }) {
  const [reply, setReply] = useState('');
  const send = () => attempt(async () => {
    await simulateEmail(e.email, `Re: ${e.topic}`, reply.trim());
    await saveEnquiry({ ...e, status: 'replied' });
    setReply('');
  }, 'Reply sent (simulated email).');
  return (
    <Card title={e.topic} icon="mail" actions={<StatusBadge {...ENQUIRY_STATUS[e.status]} />}>
      <div className="wf-meta" style={{ marginTop: 0, marginBottom: 12 }}><span>{e.name}</span><a href={`mailto:${e.email}`}>{e.email}</a><span>{fmtDate(e.createdAt)}</span></div>
      <blockquote className="wf-msg" style={{ margin: 0, maxWidth: '100%' }}><p>{e.message}</p></blockquote>
      <label className="field" style={{ marginTop: 14 }}>
        <span className="label">Reply</span>
        <textarea className="textarea" rows={4} value={reply} onChange={(ev) => setReply(ev.target.value)} placeholder={`Hi ${e.name.split(' ')[0] || 'there'},`} />
      </label>
      <div className="row between" style={{ marginTop: 10 }}>
        <SimBadge>Simulated email</SimBadge>
        <div className="row">
          {e.status !== 'closed'
            ? <button className="btn btn-ghost btn-sm" onClick={() => attempt(() => saveEnquiry({ ...e, status: 'closed' }), 'Enquiry closed.')}>Close</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => attempt(() => saveEnquiry({ ...e, status: 'new' }), 'Enquiry reopened.')}>Reopen</button>}
          <button className="btn btn-dark btn-sm" disabled={!reply.trim()} onClick={send}><Icon name="mail" />Send reply</button>
        </div>
      </div>
    </Card>
  );
}
