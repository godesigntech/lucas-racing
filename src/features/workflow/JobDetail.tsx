/* Customer view of a helmet job: timeline, locked master, immutable revisions, quote, payment, changes, messages. */
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HelmetJob } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import {
  addMessage, approveRevision, isLocked, isPaidJob, latestRevision, masterOf, needsWatermark, payInvoice, payQuote, requestChange,
} from '@/domain/helmet';
import { simulateEmail, useAuth } from '@/store';
import type { HelmetViewerApi } from '@/three/HelmetViewer';
import { Icon, Note, PriceLines, SimBadge, downloadDataUrl } from '@/ui';
import { JOB_STATUS, WORKSHOP_INBOX, attempt, jobSteps, saveJob, slug } from './data';
import {
  Card, Composer, History, HelmetStage, InvoiceTable, KV, MessageThread, ShotGrid, StatusBadge, Stepper, CONCEPT_EXPORT,
  designSpecRows, useAngleShots, uvLayoutPng, watermarkImage,
} from './shared';

const WM = 'LUCAS RACING · PREVIEW';

export function JobDetail({ job, allMine }: { job: HelmetJob; allMine: HelmetJob[] }) {
  const { user } = useAuth();
  const me = user?.name || job.customer.name || 'Customer';
  const latest = latestRevision(job);
  const master = masterOf(job);
  const locked = isLocked(job);
  const paid = isPaidJob(job);
  const [viewNo, setViewNo] = useState<number>(job.status === 'change-authorised' ? latest.no : master?.no ?? latest.no);
  const viewing = job.revisions.find((r) => r.no === viewNo) || master || latest;
  const watermarked = useMemo(() => needsWatermark(viewing.design, allMine), [viewing, allMine]);
  const viewer = useRef<HelmetViewerApi>(null);
  const angles = useAngleShots(viewer);
  const [changeText, setChangeText] = useState('');
  const [showChange, setShowChange] = useState(false);
  const st = JOB_STATUS[job.status];
  const steps = jobSteps(job);
  const unpaid = job.invoices.filter((i) => i.status === 'unpaid');
  const approvedNos = new Set(job.approvals.map((a) => a.revisionNo));
  const hasNewRevision = job.status === 'change-authorised' && job.masterRevision !== null && latest.no > job.masterRevision;

  const save = (fn: () => HelmetJob, ok: string, email?: [string, string]) => attempt(async () => {
    const next = fn();
    await saveJob(next);
    if (email) await simulateEmail(WORKSHOP_INBOX, email[0], email[1]);
  }, ok);

  const approve = () => save(() => approveRevision(job, latest.no, me), `Revision ${latest.no} approved.`,
    [`${job.ref}: revision ${latest.no} approved`, `${me} approved revision ${latest.no}.`]);

  const downloadPreview = async () => {
    const api = viewer.current;
    if (!api) return;
    const src = await api.snapshot({ width: 1200, height: 900 });
    if (!src) return;
    downloadDataUrl(await watermarkImage(src, WM), `${job.ref}-rev${viewing.no}-preview.png`);
  };

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-head">
        <div>
          <Link to="/orders" className="wf-back"><Icon name="back" size={14} />All orders</Link>
          <div className="eyebrow lime">Helmet · {job.kind === 'bespoke' ? 'Bespoke quote' : 'Standard order'}</div>
          <h1 className="ref">{job.ref}</h1>
          <div className="wf-meta">
            <span>Created {fmtDate(job.createdAt)}</span><span>Updated {fmtDate(job.updatedAt)}</span><span>{job.revisions.length} revision{job.revisions.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="row"><StatusBadge {...st} /><span className={'badge ' + (job.kind === 'bespoke' ? 'proposed' : 'launch')}>{job.kind}</span></div>
      </div>
      <Stepper label="Helmet job progress" {...steps} />

      <div className="wf-layout">
        {/* ---------- left: design ---------- */}
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          {master ? (
            <div className="wf-lock" role="status">
              <Icon name="lock" />
              <span className="badge">Production master · locked</span>
              <span>Revision {master.no} · approved {fmtDate(job.approvals.find((a) => a.revisionNo === master.no)?.approvedAt)}</span>
            </div>
          ) : (
            <Note tone="info">No production master yet. A revision is locked as the master once it is approved{job.kind === 'bespoke' ? ' against a quote' : ''} and paid.</Note>
          )}
          <div>
            <HelmetStage ref={viewer} design={viewing.design} height={400} watermark={watermarked ? WM : null}
              tag={<>Revision {viewing.no}{viewing.no === job.masterRevision ? ' · master' : ''}</>} />
            <div className="row between" style={{ marginTop: 10 }}>
              <span className="tiny muted">Concept geometry · drag to rotate</span>
              {watermarked ? (
                <button className="btn btn-ghost btn-sm" onClick={downloadPreview}><Icon name="download" />Download watermarked preview</button>
              ) : (
                <span className="badge ok">Paid master · unwatermarked</span>
              )}
            </div>
          </div>

          <Card title="Revision history" icon="layers" actions={<span className="tiny muted">Immutable · every revision is kept</span>}>
            <div className="wf-revs">
              {[...job.revisions].reverse().map((r) => {
                const isMaster = r.no === job.masterRevision;
                const wasMaster = job.previousMasters.includes(r.no);
                return (
                  <div key={r.no} className={'wf-rev' + (isMaster ? ' master' : '')} aria-current={r.no === viewing.no}>
                    <span className="no">{r.no}</span>
                    <div className="info">
                      <div className="t">{r.note || '(no note)'}</div>
                      <div className="tiny muted">By {r.by} · {fmtDate(r.createdAt)}</div>
                      <div className="row" style={{ '--gap': '4px', marginTop: 3 } as React.CSSProperties}>
                        {isMaster && <span className="badge dark"><Icon name="lock" size={11} />Master</span>}
                        {wasMaster && <span className="badge sim">Previous master</span>}
                        {approvedNos.has(r.no) && <span className="badge ok">Approved</span>}
                        {r.no === latest.no && <span className="badge">Latest</span>}
                      </div>
                      <div className="wf-hash">#{r.hash}</div>
                    </div>
                    <button className="btn btn-ghost btn-xs" onClick={() => setViewNo(r.no)} aria-pressed={r.no === viewing.no}>
                      <Icon name="eye" size={14} />{r.no === viewing.no ? 'Viewing' : 'View'}
                    </button>
                  </div>
                );
              })}
            </div>
            {job.previousMasters.length > 0 && (
              <p className="tiny muted" style={{ marginTop: 10 }}>Previous masters preserved: {job.previousMasters.map((n) => `revision ${n}`).join(', ')}.</p>
            )}
          </Card>

          <Card title="Design specification" icon="helmet" actions={<span className="tiny muted">Revision {viewing.no}</span>}>
            <KV rows={designSpecRows(viewing.design)} />
          </Card>

          {paid && master && (
            <Card title="Final diagrams & 360 views" icon="download" actions={<span className="badge sim">{CONCEPT_EXPORT.split(' — ')[0]}</span>}>
              <p className="small muted" style={{ marginBottom: 10 }}>
                Paid customers can download multi-angle renders of the locked master and the flat concept layout. {CONCEPT_EXPORT}.
              </p>
              <div className="row" style={{ marginBottom: 12 }}>
                <button className="btn btn-dark btn-sm" disabled={angles.busy || viewing.no !== master.no} onClick={() => angles.capture()}>
                  <Icon name="rotate" />{angles.busy ? 'Rendering…' : 'Generate multi-angle views'}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={viewing.no !== master.no} onClick={async () => downloadDataUrl(await uvLayoutPng(master.design, 1), `${job.ref}-master-r${master.no}-uv-concept.png`)}>
                  <Icon name="download" />UV layout (concept)
                </button>
                {viewing.no !== master.no && <button className="btn-link small" onClick={() => setViewNo(master.no)}>View the master to export</button>}
              </div>
              <ShotGrid shots={angles.shots} prefix={`${slug(job.ref)}-r${master.no}`} />
            </Card>
          )}
        </div>

        {/* ---------- right: workflow ---------- */}
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Next step" icon="flag">
            <NextStep job={job} latestNo={latest.no} onApprove={approve}
              onPay={() => save(() => payQuote(job), 'Payment recorded (simulated). Your approved revision is now the locked production master.',
                [`${job.ref}: quote paid`, `Quote ${money(job.quote?.total || 0)} paid (simulated).`])}
              hasNewRevision={hasNewRevision} showChange={() => setShowChange(true)} />
          </Card>

          {showChange && locked && job.status !== 'change-requested' && (
            <Card title="Request a change" icon="pencil">
              <Note tone="warn">
                Your master is locked for production. A change after payment needs a <strong>manual workshop decision</strong>; if approved,
                the workshop will create a new revision for your approval and <strong>may issue an additional invoice</strong>.
                The current master stays preserved either way.
              </Note>
              <label className="field" style={{ marginTop: 12 }}>
                <span className="label">What would you like to change?</span>
                <textarea className="textarea" value={changeText} onChange={(e) => setChangeText(e.target.value)} placeholder="e.g. Change the number from 29 to 92 and make the outline lime." />
              </label>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-dark btn-sm" disabled={!changeText.trim()} onClick={async () => {
                  const ok = await save(() => requestChange(job, me, changeText.trim()), 'Change request sent to the workshop.',
                    [`${job.ref}: change requested`, changeText.trim()]);
                  if (ok) { setChangeText(''); setShowChange(false); }
                }}>Send change request</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowChange(false)}>Cancel</button>
              </div>
            </Card>
          )}

          {job.quote && (
            <Card title="Quote" icon="info" actions={<span className="tiny muted">Issued {fmtDate(job.quote.issuedAt)}</span>}>
              <PriceLines lines={job.quote.lines} total={job.quote.total} />
              {job.quote.note && <p className="small" style={{ marginTop: 10 }}><span className="muted">Workshop note:</span> {job.quote.note}</p>}
            </Card>
          )}

          <Card title="Invoices" icon="basket" actions={unpaid.length ? <span className="badge err">{unpaid.length} unpaid</span> : undefined}>
            <InvoiceTable invoices={job.invoices} onPay={(id) => save(() => payInvoice(job, id), 'Invoice paid (simulated).', [`${job.ref}: invoice paid`, 'Additional invoice paid (simulated).'])} />
            <p className="tiny muted" style={{ marginTop: 8 }}><SimBadge>Simulated payments</SimBadge> No card is charged in this demo.</p>
          </Card>

          <Card title="Project messages" icon="mail">
            <MessageThread messages={job.messages} me="customer" />
            <div className="divider" />
            <Composer placeholder="Message the workshop…" onSend={(text, atts) =>
              save(() => addMessage(job, 'customer', me, text, atts), 'Message sent.', [`${job.ref}: new customer message`, text])} />
          </Card>

          <Card title="Approvals" icon="check">
            {job.approvals.length ? (
              <div className="table-wrap">
                <table className="table wf-table">
                  <thead><tr><th>Revision</th><th>Approved</th><th>By</th><th>Hash</th></tr></thead>
                  <tbody>
                    {job.approvals.map((a, i) => (
                      <tr key={i}><td>Revision {a.revisionNo}</td><td>{fmtDate(a.approvedAt)}</td><td>{a.by}</td><td className="mono">{a.hash}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="wf-empty-inline">No approvals yet.</div>}
          </Card>

          <Card title="Status history" icon="flag"><History items={job.history} /></Card>
        </div>
      </div>
    </div>
  );
}

function NextStep({ job, latestNo, onApprove, onPay, hasNewRevision, showChange }: {
  job: HelmetJob; latestNo: number; onApprove: () => void; onPay: () => void; hasNewRevision: boolean; showChange: () => void;
}) {
  switch (job.status) {
    case 'submitted':
    case 'in-discussion':
      return (
        <div className="stack">
          <p className="small">The workshop is reviewing your brief{job.status === 'in-discussion' ? ' and discussing revisions with you' : ''}. You&apos;ll be able to give final approval once a quote has been issued.</p>
          <button className="btn btn-primary" disabled title="A quote must be issued before final approval">Approve revision {latestNo}</button>
          <span className="tiny muted">Awaiting workshop quote.</span>
        </div>
      );
    case 'quoted':
      return (
        <div className="stack">
          <p className="small">Your quote is ready. Approving locks in <strong>revision {latestNo}</strong> as the version to be produced once paid. If you&apos;d like changes first, message the workshop.</p>
          <button className="btn btn-primary" onClick={onApprove}><Icon name="check" />Approve revision {latestNo}</button>
        </div>
      );
    case 'awaiting-payment':
      return (
        <div className="stack">
          <p className="small">Revision {job.approvals[job.approvals.length - 1]?.revisionNo} approved. Pay the quote to lock it as the production master.</p>
          <button className="btn btn-primary" onClick={onPay}>Pay quote {money(job.quote?.total || 0)} (simulated)</button>
          <span className="tiny muted">Simulated payment: nothing is charged.</span>
        </div>
      );
    case 'change-requested':
      return <Note tone="info" title="Change request pending.">The workshop will review it manually and reply here. Your locked master is unchanged until a change is authorised.</Note>;
    case 'change-authorised':
      return (
        <div className="stack">
          <Note tone="ok" title="Change authorised.">Create a new revision with the requested changes, then approve it to replace the master (the previous master is preserved).</Note>
          <Link className="btn btn-dark" to={`/helmet-builder?job=${job.id}`}><Icon name="pencil" />Create new revision in builder</Link>
          {hasNewRevision ? (
            <button className="btn btn-primary" onClick={onApprove}><Icon name="check" />Approve revision {latestNo} as new master</button>
          ) : <span className="tiny muted">No new revision yet. The workshop may also add one for you.</span>}
          {job.invoices.some((i) => i.status === 'unpaid') && <span className="tiny muted">An additional invoice is attached to this change (see Invoices).</span>}
        </div>
      );
    case 'paid':
    case 'in-production':
    case 'completed':
      return (
        <div className="stack">
          <p className="small">
            {job.status === 'paid' ? 'Paid. Your master is locked and queued for production.' : job.status === 'in-production' ? 'Your helmet is in production.' : 'Completed. Thanks for racing with Lucas Racing.'}
          </p>
          {job.status !== 'completed' && <button className="btn btn-ghost btn-sm" onClick={showChange}><Icon name="pencil" />Request a change</button>}
          <span className="tiny muted">Changes after payment need a manual workshop decision and may incur an additional invoice.</span>
        </div>
      );
  }
}
