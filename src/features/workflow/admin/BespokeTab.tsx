/* Bespoke jobs & post-payment changes: messages, revisions, quote builder, change decisions, extra invoices, status. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { HelmetJob, HelmetJobStatus, PriceLine } from '@/core/types';
import { fmtDate, money, nowISO, sum, uid } from '@/core/util';
import {
  addMessage, decideChange, isLocked, isPaidJob, issueQuote, latestRevision, masterOf, priceLines, quoteHelmet, setJobStatus,
} from '@/domain/helmet';
import { simulateEmail, useCollection, useSettings } from '@/store';
import { Icon, Note, PriceLines, Seg } from '@/ui';
import { JOB_STATUS, attempt, jobSteps, saveJob, stamp, type D } from '../data';
import {
  Card, Composer, History, HelmetStage, InvoiceTable, KV, MessageThread, MoneyInput, StatusBadge, Stepper, designSpecRows, useUVLayout,
} from '../shared';
import { SearchBox } from './common';

const OPEN: HelmetJobStatus[] = ['submitted', 'in-discussion', 'quoted', 'awaiting-payment', 'change-requested', 'change-authorised'];
const FILTERS: { id: string; label: string; match: (j: HelmetJob) => boolean }[] = [
  { id: 'open', label: 'Needs attention', match: (j) => OPEN.includes(j.status) },
  { id: 'change-requested', label: 'Change requests', match: (j) => j.status === 'change-requested' || j.status === 'change-authorised' },
  { id: 'quoting', label: 'Quoting', match: (j) => ['submitted', 'in-discussion', 'quoted', 'awaiting-payment'].includes(j.status) },
  { id: 'production', label: 'Paid / production', match: (j) => ['paid', 'in-production', 'completed'].includes(j.status) },
  { id: 'all', label: 'All jobs', match: () => true },
];

export function BespokeTab() {
  const { items: jobs, loading } = useCollection<D<HelmetJob>>('jobs');
  const [sp, setSp] = useSearchParams();
  const filter = FILTERS.find((f) => f.id === sp.get('filter')) || FILTERS[0];
  const [q, setQ] = useState('');
  const list = jobs.filter((j) => filter.match(j) && (!q || `${j.ref} ${j.customer.name} ${j.customer.email}`.toLowerCase().includes(q.toLowerCase())));
  const selId = sp.get('job');
  const sel = jobs.find((j) => j.id === selId) || null;
  const setParam = (k: string, v: string | null) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  return (
    <div className="wf-split">
      <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <select className="select sm" value={filter.id} onChange={(e) => setParam('filter', e.target.value)} aria-label="Filter jobs">
          {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label} ({jobs.filter(f.match).length})</option>)}
        </select>
        <SearchBox value={q} onChange={setQ} placeholder="Search ref, customer" />
        <div className="wf-list wf-scroll" role="list">
          {loading && !jobs.length && <div className="muted small">Loading…</div>}
          {!loading && !list.length && <div className="wf-empty-inline">No jobs in this view.</div>}
          {list.map((j) => (
            <button key={j.id} role="listitem" className="wf-item" aria-current={j.id === selId} onClick={() => setParam('job', j.id)}>
              <span className="top"><span className="ref">{j.ref}</span><StatusBadge {...JOB_STATUS[j.status]} /></span>
              <span className="sub">{j.customer.name} · {j.kind} · R{latestRevision(j).no}{j.masterRevision ? ` · master R${j.masterRevision}` : ''}</span>
              <span className="sub">Updated {fmtDate(j.updatedAt)}{j.invoices.some((i) => i.status === 'unpaid') ? ' · unpaid invoice' : ''}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        {sel ? <AdminJob key={sel.id} job={sel} /> : <div className="empty"><div className="h4">Select a job</div><p className="small">Choose a bespoke brief or change request to reply, quote and decide.</p></div>}
      </div>
    </div>
  );
}

function AdminJob({ job }: { job: HelmetJob }) {
  const settings = useSettings();
  const latest = latestRevision(job);
  const master = masterOf(job);
  const locked = isLocked(job);
  const [viewNo, setViewNo] = useState(master?.no ?? latest.no);
  const viewing = job.revisions.find((r) => r.no === viewNo) || latest;
  const [mode, setMode] = useState<'3d' | 'uv'>('3d');
  const uv = useUVLayout(mode === 'uv' ? viewing.design : null, 0.45);
  useEffect(() => { setViewNo(master?.no ?? latestRevision(job).no); }, [job.revisions.length, job.masterRevision]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (fn: () => HelmetJob, ok: string, email?: [string, string]) => attempt(async () => {
    const next = fn();
    await saveJob(next);
    if (email) await simulateEmail(job.customer.email, email[0], email[1]);
  }, ok);

  const indicative = useMemo(() => priceLines(latest.design, settings), [latest, settings]);
  const auto = useMemo(() => quoteHelmet(latest.design, settings), [latest, settings]);

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <div className="wf-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow lime">{job.kind === 'bespoke' ? 'Bespoke job' : 'Standard order'}</div>
          <h2 className="ref">{job.ref}</h2>
          <div className="wf-meta"><span>{job.customer.name}</span><a href={`mailto:${job.customer.email}`}>{job.customer.email}</a><span>{job.ownerId ? 'Account' : 'Guest'}</span><span>Created {fmtDate(job.createdAt)}</span></div>
        </div>
        <div className="row"><StatusBadge {...JOB_STATUS[job.status]} />{isPaidJob(job) && <span className="badge ok">Paid</span>}</div>
      </div>
      <Stepper label="Job progress" {...jobSteps(job)} />

      {job.status === 'change-requested' && <ChangeDecision job={job} commit={commit} />}

      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Revisions" icon="layers" actions={
            <>
              <Seg label="Preview mode" value={mode} onChange={setMode} options={[{ id: '3d', label: '3D' }, { id: 'uv', label: 'UV' }]} />
            </>
          }>
            {mode === '3d' ? (
              <HelmetStage design={viewing.design} height={300} tag={<>R{viewing.no}{viewing.no === job.masterRevision ? ' · master' : ''}</>} />
            ) : uv ? <img className="wf-uv" src={uv} alt={`Concept UV layout of revision ${viewing.no}`} /> : <div className="wf-empty-inline">Rendering UV layout…</div>}
            <div className="wf-revs" style={{ marginTop: 12 }}>
              {[...job.revisions].reverse().map((r) => (
                <div key={r.no} className={'wf-rev' + (r.no === job.masterRevision ? ' master' : '')} aria-current={r.no === viewing.no}>
                  <span className="no">{r.no}</span>
                  <div className="info">
                    <div className="t">{r.note || '(no note)'}</div>
                    <div className="tiny muted">{r.by} · {fmtDate(r.createdAt)}{job.previousMasters.includes(r.no) ? ' · previous master' : ''}{job.approvals.some((a) => a.revisionNo === r.no) ? ' · approved' : ''}</div>
                    <div className="wf-hash">#{r.hash}</div>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={() => setViewNo(r.no)} aria-pressed={r.no === viewing.no}><Icon name="eye" size={14} />View</button>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              {locked ? (
                <span className="small muted"><Icon name="lock" size={13} /> Master locked: authorise a change before adding revisions.</span>
              ) : (
                <Link className="btn btn-dark btn-sm" to={`/helmet-builder?job=${job.id}`}><Icon name="pencil" />Create workshop revision</Link>
              )}
            </div>
          </Card>
          <Card title="Specification" icon="helmet" actions={<span className="tiny muted">Revision {viewing.no}</span>}>
            <KV rows={designSpecRows(viewing.design)} />
          </Card>
        </div>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Messages" icon="mail">
            <MessageThread messages={job.messages} me="workshop" />
            <div className="divider" />
            <Composer placeholder="Reply to the customer (simulated email)…" sendLabel="Send reply" onSend={(text, atts) =>
              commit(() => addMessage(job, 'workshop', 'Workshop', text, atts), 'Reply sent (simulated email).', [`Re: ${job.ref}`, text])} />
          </Card>

          {job.kind === 'bespoke' && job.masterRevision === null && <QuoteBuilder job={job} indicative={indicative} reasons={auto.kind === 'quote' ? auto.reasons : []} commit={commit} />}
          {job.quote && (
            <Card title="Issued quote" icon="info" actions={<span className="tiny muted">{fmtDate(job.quote.issuedAt)}</span>}>
              <PriceLines lines={job.quote.lines} total={job.quote.total} />
              {job.quote.note && <p className="small" style={{ marginTop: 8 }}><span className="muted">Note:</span> {job.quote.note}</p>}
            </Card>
          )}

          <Card title="Invoices" icon="basket"><InvoiceTable invoices={job.invoices} /><ExtraInvoice job={job} commit={commit} /></Card>

          <Card title="Status" icon="flag">
            <div className="row">
              <button className="btn btn-ghost btn-sm" disabled={job.status === 'in-production' || job.masterRevision === null}
                onClick={() => commit(() => setJobStatus(job, 'in-production'), 'Marked in production.', [`${job.ref} is in production`, 'Your helmet is now in production.'])}>Mark in production</button>
              <button className="btn btn-ghost btn-sm" disabled={job.status === 'completed' || job.masterRevision === null}
                onClick={() => commit(() => setJobStatus(job, 'completed'), 'Marked completed.', [`${job.ref} completed`, 'Your helmet is complete.'])}>Mark completed</button>
              {master && <Link className="btn btn-link small" to={`/production/helmet/${job.id}`}>Open production sheet</Link>}
            </div>
            {job.masterRevision === null && <p className="tiny muted" style={{ marginTop: 8 }}>Production statuses need a paid, locked master.</p>}
          </Card>

          <Card title="History" icon="flag"><History items={job.history} /></Card>
        </div>
      </div>
    </div>
  );
}

type Commit = (fn: () => HelmetJob, ok: string, email?: [string, string]) => Promise<boolean>;

function QuoteBuilder({ job, indicative, reasons, commit }: { job: HelmetJob; indicative: PriceLine[]; reasons: string[]; commit: Commit }) {
  const [lines, setLines] = useState<PriceLine[]>(() => job.quote?.lines.map((l) => ({ ...l })) ?? indicative.map((l) => ({ ...l })));
  const [note, setNote] = useState(job.quote?.note ?? '');
  const total = sum(lines.map((l) => l.amount || 0));
  const valid = lines.length > 0 && lines.every((l) => l.label.trim());
  return (
    <Card title={job.quote ? 'Revise quote' : 'Quote builder'} icon="pencil" actions={<span className="tiny muted">Against revision {latestRevision(job).no}</span>}>
      {reasons.length > 0 && (
        <Note tone="info" title="Why this is bespoke:">{reasons.join(' · ')}</Note>
      )}
      <div className="stack" style={{ '--gap': '8px', marginTop: 12 } as React.CSSProperties}>
        {lines.map((l, i) => (
          <div className="wf-quote-row" key={i}>
            <input className="input sm" value={l.label} placeholder="Line item" aria-label={`Line ${i + 1} label`} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <MoneyInput className="input sm" value={l.amount} onChange={(n) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: n } : x)))} label={`Line ${i + 1} amount`} />
            <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label={`Remove line ${i + 1}`}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        <div className="row">
          <button className="btn btn-ghost btn-xs" onClick={() => setLines([...lines, { label: '', amount: 0 }])}><Icon name="plus" size={14} />Add line</button>
          <button className="btn btn-ghost btn-xs" onClick={() => setLines(priceLinesCopy(indicative))}>Prefill indicative lines</button>
          <button className="btn btn-ghost btn-xs" onClick={() => setLines([...lines, { label: 'Bespoke artwork & design time', amount: 120 }])}>+ Design time</button>
        </div>
        <div className="row between" style={{ paddingTop: 6, borderTop: '1px solid var(--line)' }}>
          <span className="small muted">Indicative prices come from the current price list; adjust freely.</span>
          <span className="h4">Total {money(total)}</span>
        </div>
        <label className="field"><span className="label">Note to customer</span><textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Includes hand-finished pinstripe; 3-week lead time." /></label>
        <button className="btn btn-primary" disabled={!valid} onClick={() => commit(() => issueQuote(job, lines.map((l) => ({ label: l.label.trim(), amount: l.amount })), note.trim()),
          'Quote issued.', [`Your quote for ${job.ref}`, `Quote total ${money(total)}. ${note.trim()}`])}>
          <Icon name="mail" />{job.quote ? 'Re-issue quote' : 'Issue quote'} ({money(total)})
        </button>
      </div>
    </Card>
  );
}
const priceLinesCopy = (l: PriceLine[]) => l.map((x) => ({ ...x }));

function ChangeDecision({ job, commit }: { job: HelmetJob; commit: Commit }) {
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState('Post-payment design change');
  const [note, setNote] = useState('');
  const request = [...job.messages].reverse().find((m) => m.by === 'customer');
  return (
    <Card title="Change request: workshop decision" icon="pencil" className="">
      <Note tone="warn">
        The customer asked to change the locked master (revision {job.masterRevision}). This is a <strong>manual decision</strong>.
        Approving keeps the current master preserved, lets a new revision be created and requires fresh customer approval; you may attach an additional invoice.
      </Note>
      {request && <blockquote className="wf-msg" style={{ margin: '12px 0', maxWidth: '100%' }}><div className="who">{request.author} · {fmtDate(request.at)}</div><p>{request.text}</p></blockquote>}
      <div className="wf-fields">
        <label className="field"><span className="label">Additional invoice (optional)</span><MoneyInput className="input sm" value={amount} onChange={setAmount} label="Additional invoice amount" /></label>
        <label className="field"><span className="label">Invoice label</span><input className="input sm" value={label} onChange={(e) => setLabel(e.target.value)} /></label>
      </div>
      <label className="field" style={{ marginTop: 10 }}><span className="label">Note to customer</span><textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={() => commit(() => decideChange(job, true, amount > 0 ? { amount, label } : null, note.trim()),
          'Change authorised.', [`${job.ref}: change authorised`, `${note.trim() || 'Your change has been authorised.'}${amount > 0 ? ` Additional invoice: ${money(amount)}.` : ''}`])}>
          <Icon name="check" />Authorise change{amount > 0 ? ` + invoice ${money(amount)}` : ''}
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => commit(() => decideChange(job, false, null, note.trim()),
          'Change declined; master stays locked.', [`${job.ref}: change declined`, note.trim() || 'Your change request was declined.'])}>Decline</button>
      </div>
    </Card>
  );
}

function ExtraInvoice({ job, commit }: { job: HelmetJob; commit: Commit }) {
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState('Additional work');
  return (
    <div style={{ marginTop: 12 }}>
      <div className="wf-section-title">Manual additional invoice</div>
      <div className="wf-quote-row" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px auto' }}>
        <input className="input sm" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Invoice label" />
        <MoneyInput className="input sm" value={amount} onChange={setAmount} label="Invoice amount" />
        <button className="btn btn-ghost btn-sm" disabled={amount <= 0 || !label.trim()} onClick={async () => {
          const ok = await commit(() => stamp({
            ...job,
            invoices: [...job.invoices, { id: uid('inv_'), label: label.trim(), amount, kind: 'additional' as const, status: 'unpaid' as const, createdAt: nowISO(), paidAt: null }],
          }, `Additional invoice raised: ${label.trim()} £${amount}.`), 'Additional invoice raised.', [`${job.ref}: additional invoice`, `${label.trim()}: ${money(amount)}`]);
          if (ok) setAmount(0);
        }}>Raise</button>
      </div>
    </div>
  );
}
