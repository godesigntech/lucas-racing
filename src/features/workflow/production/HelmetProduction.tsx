/* Helmet production sheet: locked master only, unwatermarked concept exports. */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HelmetJob } from '@/core/types';
import { fmtDate } from '@/core/util';
import { UV_SPEC, masterOf, setJobStatus } from '@/domain/helmet';
import { modelById, modelLabel } from '@/data/helmets';
import type { HelmetViewerApi } from '@/three/HelmetViewer';
import { Icon, Note, downloadDataUrl } from '@/ui';
import { JOB_STATUS, attempt, downloadJson, saveJob, slug } from '../data';
import {
  CONCEPT_EXPORT, Card, HelmetStage, KV, PRODUCTION_CHECKLIST, ShotGrid, StatusBadge, designSpecRows, useAngleShots, useUVLayout, uvLayoutPng,
} from '../shared';

export function HelmetProduction({ job }: { job: HelmetJob }) {
  const master = masterOf(job)!;
  const d = master.design;
  const viewer = useRef<HelmetViewerApi>(null);
  const angles = useAngleShots(viewer);
  const uv = useUVLayout(d, 0.5);
  const [notes, setNotes] = useState(job.productionNotes);
  const autoShot = useRef(false);
  const prefix = `${slug(job.ref)}-r${master.no}`;
  const approval = [...job.approvals].reverse().find((a) => a.revisionNo === master.no);

  const onReady = () => {
    if (autoShot.current) return;
    autoShot.current = true;
    // Give textures a moment to paint before capturing the standard views.
    setTimeout(() => { void angles.capture(); }, 700);
  };

  const spec = () => ({
    label: CONCEPT_EXPORT,
    checklist: PRODUCTION_CHECKLIST,
    order: { ref: job.ref, kind: job.kind, customer: job.customer, status: job.status },
    approvedRevision: master.no, revisionHash: master.hash, approval,
    previousMasters: job.previousMasters,
    model: modelLabel(modelById(d.modelId)),
    supply: d.supply.kind === 'own' ? { ...d.supply, photos: d.supply.photos.map((p) => p.name) } : d.supply,
    uv: UV_SPEC,
    productionNotes: job.productionNotes,
    design: { ...d, logos: d.logos.map((l) => ({ ...l, src: `[embedded image: ${l.name}]` })) },
    exportedAt: new Date().toISOString(),
  });

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-head">
        <div>
          <Link to="/production" className="wf-back"><Icon name="back" size={14} />Production queue</Link>
          <div className="eyebrow lime">Helmet production sheet · {job.kind}</div>
          <h1 className="ref">{job.ref}</h1>
          <div className="wf-meta"><span>{job.customer.name}</span><a href={`mailto:${job.customer.email}`}>{job.customer.email}</a><span>Approved {fmtDate(approval?.approvedAt)}</span></div>
        </div>
        <div className="row">
          <StatusBadge {...JOB_STATUS[job.status]} />
          <span className="badge dark"><Icon name="lock" size={11} />Locked artwork · revision {master.no}</span>
        </div>
      </div>
      {job.status === 'change-requested' && <Note tone="err" title="Change requested.">The customer has asked for a change. Confirm the workshop decision before cutting or printing.</Note>}
      {job.status === 'change-authorised' && <Note tone="err" title="Change authorised.">A new revision is pending approval. Do not produce revision {master.no} until the new master is approved.</Note>}

      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Interactive 3D · locked master" icon="rotate" actions={<span className="badge ok">Paid · no watermark</span>}>
            <HelmetStage ref={viewer} design={d} height={420} tag={<>Revision {master.no} · master</>} onReady={onReady} />
            <p className="tiny muted" style={{ marginTop: 8 }}>Concept geometry, not manufacturer-accurate. Hash <span className="mono">#{master.hash}</span></p>
          </Card>
          <Card title="Multi-angle views" icon="image" actions={
            <button className="btn btn-ghost btn-xs" disabled={angles.busy} onClick={() => angles.capture()}><Icon name="rotate" size={14} />{angles.busy ? 'Rendering…' : 'Re-render'}</button>
          }>
            {angles.shots.length ? <ShotGrid shots={angles.shots} prefix={prefix} /> : <div className="wf-empty-inline">{angles.busy ? 'Rendering views…' : 'Views render once the 3D viewer is ready.'}</div>}
          </Card>
          <Card title="Concept UV layout" icon="layers" actions={<button className="btn btn-ghost btn-xs" onClick={async () => downloadDataUrl(await uvLayoutPng(d, 1), `${prefix}-uv-concept.png`)}><Icon name="download" size={14} />PNG (2048px)</button>}>
            {uv ? <img className="wf-uv" src={uv} alt="Concept UV layout of the locked master" /> : <div className="wf-empty-inline">Rendering…</div>}
            <p className="tiny muted" style={{ marginTop: 8 }}>{UV_SPEC.note} Canvas {UV_SPEC.width}×{UV_SPEC.height}; dashed box marks the eye port.</p>
          </Card>
        </div>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Downloads" icon="download">
            <Note tone="warn" title="Concept export —">not a validated full-size manufacturing pattern.</Note>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-dark btn-sm" disabled={!angles.shots.length} onClick={() => angles.shots.forEach((s, i) => setTimeout(() => downloadDataUrl(s.src, `${prefix}-${s.view}.png`), i * 250))}>
                <Icon name="download" />All views (PNG)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={async () => downloadDataUrl(await uvLayoutPng(d, 1), `${prefix}-uv-concept.png`)}><Icon name="download" />UV layout PNG</button>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadJson(spec(), `${prefix}-spec.json`)}><Icon name="download" />JSON spec</button>
            </div>
            <Note tone="sim" className="" title="Before production use">confirm dimensions, bleed, cut contours, colour handling, holographic underprint and required export formats.</Note>
          </Card>

          <Card title="Materials & options" icon="helmet" actions={<span className="tiny muted">From master revision {master.no}</span>}>
            <KV rows={[['Order', `${job.ref} · ${job.kind}`], ['Customer', job.customer.name], ['Approved revision', <strong key="r">Revision {master.no}</strong>],
              ...(job.previousMasters.length ? [['Previous masters', job.previousMasters.map((n) => `R${n}`).join(', ')] as [string, string]] : []),
              ...designSpecRows(d)]} />
          </Card>

          <Card title="Production notes" icon="pencil">
            <label className="sr-only" htmlFor="prod-notes">Production notes</label>
            <textarea id="prod-notes" className="textarea" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Film batch, dip order, masking notes, QC sign-off…" />
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="tiny muted">{notes !== job.productionNotes ? 'Unsaved' : 'Saved'}</span>
              <button className="btn btn-dark btn-sm" disabled={notes === job.productionNotes} onClick={() => attempt(() => saveJob({ ...job, productionNotes: notes }), 'Production notes saved.')}>Save notes</button>
            </div>
          </Card>

          <Card title="Status" icon="flag">
            <div className="row">
              <button className="btn btn-ghost btn-sm" disabled={job.status === 'in-production'} onClick={() => attempt(() => saveJob(setJobStatus(job, 'in-production')), 'Marked in production.')}>Mark in production</button>
              <button className="btn btn-ghost btn-sm" disabled={job.status === 'completed'} onClick={() => attempt(() => saveJob(setJobStatus(job, 'completed')), 'Marked completed.')}>Mark completed</button>
              <Link className="btn-link small" to={`/admin?tab=bespoke&filter=all&job=${job.id}`}>Open in admin</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
