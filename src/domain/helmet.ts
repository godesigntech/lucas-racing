/* Helmet pricing + approval/quotation workflow. Pure functions (no I/O). */
import type {
  Approval, HelmetDesign, HelmetJob, HelmetQuote, HelmetTemplate, Invoice, Paint, PriceLine, Revision, Settings,
} from '@/core/types';
import { clone, hashOf, nowISO, refNo, sum, uid } from '@/core/util';
import { filmById } from '@/data/films';
import { HELMET_TEMPLATES, modelById, templateById } from '@/data/helmets';
import { EYE, UV_H, UV_W } from '@/core/uv';

export const STANDARD_BLACK = '#121412';

/* ------------------------------------------------------------------ */
/* Design construction                                                 */
/* ------------------------------------------------------------------ */

export function newHelmetDesign(modelId = 'arai-sk6', templateId: string | null = HELMET_TEMPLATES[0].id): HelmetDesign {
  const t = nowISO();
  const d: HelmetDesign = {
    id: uid('hd_'),
    name: 'Untitled helmet',
    ownerId: null,
    modelId,
    source: 'template',
    templateId: null,
    basePaint: { kind: 'solid', color: '#f5f5f2' },
    zonePaints: {},
    finish: 'gloss',
    chrome: false,
    texts: [
      { id: uid('tx_'), kind: 'number', text: '29', font: 'anton', color: STANDARD_BLACK, outline: '#f5f5f2', u: 0.26, v: 0.56, size: 0.2, rotation: 0, mirror: true },
      { id: uid('tx_'), kind: 'name', text: 'DRIVER', font: 'barlow', color: STANDARD_BLACK, outline: null, u: 0.405, v: 0.83, size: 0.075, rotation: -6, mirror: true },
    ],
    logos: [],
    drawing: [],
    artwork: null,
    ai: null,
    trims: { baseRubber: STANDARD_BLACK, eyeRubber: STANDARD_BLACK, plastic: STANDARD_BLACK },
    spoiler: { enabled: false, color: STANDARD_BLACK },
    supply: { kind: 'new', size: 'M' },
    createdAt: t,
    updatedAt: t,
  };
  const tpl = templateById(templateId);
  return tpl ? applyTemplate(d, tpl) : d;
}

export function applyTemplate(design: HelmetDesign, tpl: HelmetTemplate): HelmetDesign {
  return {
    ...design,
    source: 'template',
    templateId: tpl.id,
    basePaint: clone(tpl.basePaint),
    zonePaints: Object.fromEntries(tpl.zones.map((z) => [z.id, clone(z.defaultPaint)])),
    drawing: [],
    artwork: null,
    ai: null,
  };
}

/** Switch to a true blank shell for from-scratch drawing. */
export function toScratch(design: HelmetDesign): HelmetDesign {
  return { ...design, source: 'scratch', templateId: null, zonePaints: {}, basePaint: { kind: 'solid', color: '#f5f5f2' } };
}

/** Identity of the exact visual + supply configuration (excludes name/owner/timestamps). */
export function designHash(d: HelmetDesign): string {
  const { id, name, ownerId, createdAt, updatedAt, ...rest } = d;
  return hashOf(rest);
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

const paints = (d: HelmetDesign): { where: string; paint: Paint }[] => {
  const tpl = templateById(d.templateId);
  const out = [{ where: 'Base', paint: d.basePaint }];
  for (const z of tpl?.zones || []) if (d.zonePaints[z.id]) out.push({ where: z.name, paint: d.zonePaints[z.id] });
  for (const l of d.drawing) out.push({ where: 'Drawn shape', paint: l.paint });
  return out;
};

const isStd = (hex: string) => hex.toLowerCase() === STANDARD_BLACK;

/** Reasons this design cannot be auto-priced (empty = standard). Logos alone never make it bespoke. */
export function bespokeReasons(d: HelmetDesign, settings: Settings): string[] {
  const r: string[] = [];
  const model = modelById(d.modelId);
  if (model.status === 'unconfirmed') r.push('Helmet model not yet confirmed');
  if (d.source === 'scratch') r.push('From-scratch design');
  if (d.source === 'ai') r.push('AI design concept');
  if (d.source === 'upload' || d.artwork) r.push('Uploaded complete design');
  if (d.source === 'template' && !templateById(d.templateId)) r.push('No template selected');
  if (d.drawing.length && d.source === 'template') r.push('Non-standard artwork (freehand shapes)');
  for (const { where, paint } of paints(d)) {
    if (paint.kind === 'custom-film') r.push(`Customer-uploaded hydro-dip imagery (${where})`);
    if (paint.kind === 'film') {
      const f = filmById(paint.filmId);
      const s = settings.films[paint.filmId];
      if (!f || (s && !s.available)) r.push(`Film unavailable (${where})`);
      else if (s ? !s.stocked : !f.stocked) r.push(`Special-order film: ${f.name}`);
    }
  }
  return Array.from(new Set(r));
}

export function priceLines(d: HelmetDesign, s: Settings): PriceLine[] {
  const h = s.helmet;
  const model = modelById(d.modelId);
  const lines: PriceLine[] = [];
  const tpl = templateById(d.templateId);
  if (tpl) lines.push({ label: `${tpl.name} template`, amount: h.templatePrices[tpl.id] ?? tpl.startPrice });
  if (d.supply.kind === 'new') lines.push({ label: `New ${model.brand} ${model.name} (${d.supply.size})`, amount: h.modelPrices[model.id] ?? model.newPrice });
  else lines.push({ label: 'Own helmet preparation', amount: h.ownHelmetPrepFee });
  for (const { where, paint } of paints(d)) {
    if (paint.kind !== 'film') continue;
    const f = filmById(paint.filmId);
    if (!f) continue;
    const price = s.films[f.id]?.price ?? f.price;
    lines.push({ label: `${f.name}${paint.tint ? ' (tinted)' : ''}: ${where}`, amount: price });
  }
  if (d.chrome) lines.push({ label: 'Chrome base', amount: h.chromePrice });
  if (d.finish === 'satin') lines.push({ label: 'Satin finish', amount: h.satinPrice });
  for (const t of d.texts) {
    if (!t.text.trim()) continue;
    lines.push(t.kind === 'name' ? { label: `Name: ${t.text}`, amount: h.namePrice } : { label: `Number: ${t.text}`, amount: h.numberPrice });
  }
  d.logos.forEach((l) => lines.push({ label: `Logo: ${l.name}`, amount: h.logoPrice }));
  if (!isStd(d.trims.baseRubber)) lines.push({ label: 'Coloured base rubber', amount: h.baseRubberPrice });
  if (!isStd(d.trims.eyeRubber)) lines.push({ label: 'Coloured eye-port rubber', amount: h.eyeRubberPrice });
  if (!isStd(d.trims.plastic)) lines.push({ label: 'Coloured plastics', amount: h.plasticPrice });
  if (d.spoiler.enabled && model.spoilerCompatible) lines.push({ label: 'Spoiler', amount: h.spoilerPrice });
  return lines;
}

export function quoteHelmet(d: HelmetDesign, s: Settings): HelmetQuote {
  const reasons = bespokeReasons(d, s);
  const lines = priceLines(d, s);
  if (reasons.length) return { kind: 'quote', reasons, indicative: lines };
  return { kind: 'standard', lines, total: sum(lines.map((l) => l.amount)) };
}

/* ------------------------------------------------------------------ */
/* Approval & checkout gate (standard)                                 */
/* ------------------------------------------------------------------ */

export function approveExactVersion(d: HelmetDesign, by: string, revisionNo = 1): Approval {
  return { revisionNo, hash: designHash(d), approvedAt: nowISO(), by };
}

/** Standard checkout is allowed only for the exact approved version. */
export function canCheckoutHelmet(d: HelmetDesign, approval: Approval | null, s: Settings): { ok: boolean; why?: string } {
  const q = quoteHelmet(d, s);
  if (q.kind !== 'standard') return { ok: false, why: 'This design needs a workshop quote.' };
  if (!approval) return { ok: false, why: 'Approve the final 3D design first.' };
  if (approval.hash !== designHash(d)) return { ok: false, why: 'The design changed after approval. Approve this version again.' };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

const rev = (no: number, design: HelmetDesign, by: Revision['by'], note: string): Revision => ({
  no, design: clone(design), hash: designHash(design), note, by, createdAt: nowISO(),
});
const inv = (label: string, amount: number, kind: Invoice['kind'], paid: boolean): Invoice => ({
  id: uid('inv_'), label, amount, kind, status: paid ? 'paid' : 'unpaid', createdAt: nowISO(), paidAt: paid ? nowISO() : null,
});
const log = (job: HelmetJob, text: string): HelmetJob => ({ ...job, history: [...job.history, { at: nowISO(), text }], updatedAt: nowISO() });

export class WorkflowError extends Error {}

export function createStandardJob(d: HelmetDesign, approval: Approval, lines: PriceLine[], customer: HelmetJob['customer'], ownerId: string | null): HelmetJob {
  if (approval.hash !== designHash(d)) throw new WorkflowError('Approval does not match this design version.');
  const t = nowISO();
  const job: HelmetJob = {
    id: uid('hj_'), ref: refNo('LR-H'), kind: 'standard', ownerId, customer, designId: d.id,
    revisions: [rev(1, d, 'customer', 'Approved in 3D builder')],
    approvals: [{ ...approval, revisionNo: 1 }],
    masterRevision: 1, previousMasters: [], messages: [], quote: null,
    invoices: [inv('Helmet order', sum(lines.map((l) => l.amount)), 'main', true)],
    status: 'paid', productionNotes: '', history: [], createdAt: t, updatedAt: t,
  };
  return log(job, 'Paid. Revision 1 locked as the production master.');
}

export function submitBespoke(d: HelmetDesign, brief: string, reasons: string[], customer: HelmetJob['customer'], ownerId: string | null, attachments: { name: string; src: string }[] = []): HelmetJob {
  const t = nowISO();
  const job: HelmetJob = {
    id: uid('hj_'), ref: refNo('LR-Q'), kind: 'bespoke', ownerId, customer, designId: d.id,
    revisions: [rev(1, d, 'customer', 'Initial brief')], approvals: [], masterRevision: null, previousMasters: [],
    messages: [{ id: uid('m_'), by: 'customer', author: customer.name, text: brief || '(no brief text)', attachments, at: t }],
    quote: null, invoices: [], status: 'submitted', productionNotes: '', history: [], createdAt: t, updatedAt: t,
  };
  return log(job, `Bespoke brief submitted (${reasons.join('; ') || 'custom'}).`);
}

export const isLocked = (j: HelmetJob) => j.masterRevision !== null && j.status !== 'change-authorised';
export const latestRevision = (j: HelmetJob) => j.revisions[j.revisions.length - 1];
export const masterOf = (j: HelmetJob) => j.revisions.find((r) => r.no === j.masterRevision) || null;

export function addMessage(j: HelmetJob, by: 'customer' | 'workshop', author: string, text: string, attachments: { name: string; src: string }[] = []): HelmetJob {
  const out = { ...j, messages: [...j.messages, { id: uid('m_'), by, author, text, attachments, at: nowISO() }] };
  if (by === 'workshop' && j.status === 'submitted') out.status = 'in-discussion';
  return log(out, `${by === 'workshop' ? 'Workshop' : 'Customer'} message.`);
}

/** Append an immutable revision. Blocked while a production master is locked. */
export function addRevision(j: HelmetJob, d: HelmetDesign, by: Revision['by'], note: string): HelmetJob {
  if (isLocked(j)) throw new WorkflowError('The production master is locked. A workshop-authorised change is required first.');
  const r = rev(latestRevision(j).no + 1, d, by, note);
  const status = j.status === 'change-authorised' ? 'change-authorised' : j.status === 'submitted' ? 'in-discussion' : j.status === 'quoted' ? 'in-discussion' : j.status;
  return log({ ...j, revisions: [...j.revisions, r], status }, `Revision ${r.no} added by ${by}.`);
}

export function issueQuote(j: HelmetJob, lines: PriceLine[], note: string): HelmetJob {
  if (j.kind !== 'bespoke') throw new WorkflowError('Only bespoke jobs are quoted.');
  if (isLocked(j)) throw new WorkflowError('Already locked.');
  return log({ ...j, quote: { lines, total: sum(lines.map((l) => l.amount)), issuedAt: nowISO(), note }, status: 'quoted' }, `Quote issued against revision ${latestRevision(j).no}.`);
}

/** Customer approves a specific revision. For bespoke first approval a quote must exist. */
export function approveRevision(j: HelmetJob, revisionNo: number, by: string): HelmetJob {
  const r = j.revisions.find((x) => x.no === revisionNo);
  if (!r) throw new WorkflowError('Unknown revision.');
  if (revisionNo !== latestRevision(j).no) throw new WorkflowError('Only the latest revision can be approved.');
  const approval: Approval = { revisionNo, hash: r.hash, approvedAt: nowISO(), by };
  if (j.status === 'change-authorised') {
    const prev = j.masterRevision;
    return log({ ...j, approvals: [...j.approvals, approval], previousMasters: prev ? [...j.previousMasters, prev] : j.previousMasters, masterRevision: revisionNo, status: 'paid' },
      `Revision ${revisionNo} approved as the new production master (previous master ${prev} preserved).`);
  }
  if (j.kind === 'bespoke' && !j.quote) throw new WorkflowError('A quote must be issued before final approval.');
  if (isLocked(j)) throw new WorkflowError('Already locked.');
  return log({ ...j, approvals: [...j.approvals, approval], status: 'awaiting-payment' }, `Revision ${revisionNo} given final approval; awaiting payment.`);
}

/** Simulated payment of the main quote. Locks the approved revision as the master. */
export function payQuote(j: HelmetJob): HelmetJob {
  if (j.status !== 'awaiting-payment' || !j.quote) throw new WorkflowError('Nothing to pay yet.');
  const last = j.approvals[j.approvals.length - 1];
  return log({ ...j, invoices: [...j.invoices, inv(`Quote ${j.ref}`, j.quote.total, 'main', true)], masterRevision: last.revisionNo, status: 'paid' },
    `Paid. Revision ${last.revisionNo} locked as the production master.`);
}

export function requestChange(j: HelmetJob, author: string, text: string): HelmetJob {
  if (j.masterRevision === null) throw new WorkflowError('Not locked yet; just add a revision.');
  return log({ ...addMessage(j, 'customer', author, text), status: 'change-requested' }, 'Customer requested a change to the locked master.');
}

/** Manual workshop decision on a post-payment change. Optional extra charge is invoiced manually. */
export function decideChange(j: HelmetJob, approve: boolean, extra: { amount: number; label: string } | null, note: string): HelmetJob {
  if (j.status !== 'change-requested') throw new WorkflowError('No change request pending.');
  let out = addMessage(j, 'workshop', 'Workshop', note || (approve ? 'Change authorised.' : 'Change declined.'));
  if (!approve) return log({ ...out, status: 'paid' }, 'Change declined; existing master stays locked.');
  if (extra && extra.amount > 0) out = { ...out, invoices: [...out.invoices, inv(extra.label || 'Additional change', extra.amount, 'additional', false)] };
  return log({ ...out, status: 'change-authorised' }, `Change authorised${extra?.amount ? ` with additional invoice £${extra.amount}` : ''}. New revision + fresh approval required.`);
}

export function payInvoice(j: HelmetJob, invoiceId: string): HelmetJob {
  return log({ ...j, invoices: j.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'paid' as const, paidAt: nowISO() } : i)) }, 'Invoice paid.');
}

export function setJobStatus(j: HelmetJob, status: HelmetJob['status']): HelmetJob {
  if ((status === 'in-production' || status === 'completed') && j.masterRevision === null) throw new WorkflowError('No locked master.');
  return log({ ...j, status }, `Status → ${status}.`);
}

/** Paid = has a paid main invoice. */
export const isPaidJob = (j: HelmetJob) => j.invoices.some((i) => i.kind === 'main' && i.status === 'paid');

/** Unpaid previews/exports are watermarked unless this exact version is a paid master. */
export function needsWatermark(d: HelmetDesign, jobs: HelmetJob[]): boolean {
  const h = designHash(d);
  return !jobs.some((j) => isPaidJob(j) && masterOf(j)?.hash === h);
}

/* Export metadata for production (concept only). */
export const UV_SPEC = { width: UV_W, height: UV_H, eyePort: EYE, note: 'Concept UV layout of placeholder geometry. NOT a full-size manufacturing pattern.' };
