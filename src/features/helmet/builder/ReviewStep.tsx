/* Step 5: summary, save/share/export, then approval + basket (standard),
   workshop submission (bespoke) or a new revision (editing an existing job). */
import { useEffect, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Approval, HelmetDesign, HelmetJob, HelmetQuote } from '@/core/types';
import type { HelmetViewerApi } from '@/three/HelmetViewer';
import { colourName } from '@/core/color';
import { drawWatermark } from '@/core/helmetPaint';
import { clone, money, uid } from '@/core/util';
import { modelById, modelLabel, templateById } from '@/data/helmets';
import {
  addRevision, approveExactVersion, canCheckoutHelmet, isLocked, latestRevision, submitBespoke, WorkflowError,
} from '@/domain/helmet';
import { simulateEmail, toast, useAuth, useBasket, useSettings } from '@/store';
import { downloadDataUrl, Icon, Note, PriceLines, SimBadge, UploadButton } from '@/ui';
import { copyText, createHelmetShare, paintLabel, saveDoc, shareUrl } from '../shared';
import { helmetThumb } from '../thumbs';

const SOURCE_LABEL: Record<HelmetDesign['source'], string> = {
  template: 'Template', scratch: 'From scratch', upload: 'Uploaded artwork', ai: 'AI concept (simulated)',
};

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** 1200x1200 social image from the three-quarter view, watermarked when unpaid. */
async function socialImage(api: HelmetViewerApi, d: HelmetDesign, unpaid: boolean): Promise<string> {
  const shot = await loadImg(await api.snapshot({ view: 'three-quarter', width: 1200, height: 1200 }));
  const S = 1200;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S * 0.42, 40, S / 2, S / 2, S * 0.75);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#e9e8e1'); g.addColorStop(1, '#d4d3ca');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.drawImage(shot, 0, -40, S, S);
  ctx.fillStyle = '#1b211d';
  ctx.fillRect(0, S - 150, S, 150);
  ctx.fillStyle = '#c8f031';
  ctx.fillRect(0, S - 150, 14, 150);
  ctx.font = "800 30px 'Barlow Condensed', Arial, sans-serif";
  ctx.fillText('LUCAS RACING', 50, S - 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = "800 54px 'Barlow Condensed', Arial, sans-serif";
  ctx.fillText(d.name.toUpperCase().slice(0, 34), 50, S - 46);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '500 22px Inter, Arial, sans-serif';
  ctx.fillText(modelLabel(modelById(d.modelId)) + ' · concept preview', S - 40, S - 54);
  ctx.textAlign = 'left';
  if (unpaid) drawWatermark(ctx, S, S, 'LUCAS RACING · UNPAID PREVIEW', 0.2);
  return c.toDataURL('image/png');
}

function Summary({ design }: { design: HelmetDesign }) {
  const model = modelById(design.modelId);
  const tpl = templateById(design.templateId);
  const s = design.supply;
  const rows: [string, React.ReactNode][] = [
    ['Helmet', <>{modelLabel(model)} · {s.kind === 'new' ? `new, size ${s.size}` : `your own ${[s.make, s.model].filter(Boolean).join(' ') || 'helmet'} (${s.condition}${s.photos.length ? `, ${s.photos.length} photo${s.photos.length > 1 ? 's' : ''}` : ''})`}</>],
    ['Design', <>{SOURCE_LABEL[design.source]}{design.source === 'template' && tpl ? `: ${tpl.name}` : ''}{design.artwork ? `: ${design.artwork.name}` : ''}{design.drawing.length ? ` · ${design.drawing.length} shapes` : ''}</>],
    ['Base', <>{paintLabel(design.basePaint)}{design.chrome ? ' over chrome' : ''} · {design.finish}</>],
  ];
  if (design.source === 'template' && tpl) rows.push(['Zones', tpl.zones.map((z) => `${z.name}: ${paintLabel(design.zonePaints[z.id] ?? z.defaultPaint)}`).join(' · ')]);
  rows.push(['Names & numbers', design.texts.filter((t) => t.text.trim()).map((t) => t.text).join(', ') || 'None']);
  rows.push(['Logos', design.logos.length ? design.logos.map((l) => l.name).join(', ') : 'None']);
  rows.push(['Trims', `Base ${colourName(design.trims.baseRubber)} · Eye-port ${colourName(design.trims.eyeRubber)} · Plastics ${colourName(design.trims.plastic)}`]);
  rows.push(['Spoiler', design.spoiler.enabled && model.spoilerCompatible ? colourName(design.spoiler.color) : 'None']);
  return (
    <dl className="hb-summary">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

export interface ReviewProps {
  design: HelmetDesign;
  onChange: (d: HelmetDesign) => void;
  hash: string;
  quote: HelmetQuote;
  approval: Approval | null;
  setApproval: (a: Approval | null) => void;
  viewer: RefObject<HelmetViewerApi>;
  unpaid: boolean;
  job: HelmetJob | null;
  setJob: (j: HelmetJob) => void;
  onSaved: (d: HelmetDesign) => void;
  onDuplicate: () => void;
}

export function ReviewStep(p: ReviewProps) {
  const { design, onChange, quote, viewer, unpaid, job } = p;
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [share, setShare] = useState<string | null>(null);
  useEffect(() => setShare(null), [p.hash]);

  const save = async () => {
    if (!user) return;
    setBusy('save');
    try {
      const doc = { ...design, ownerId: user.id, id: design.ownerId && design.ownerId !== user.id ? uid('hd_') : design.id };
      const saved = await saveDoc('helmetDesigns', doc);
      p.onSaved(saved);
      toast(`Saved "${saved.name}" to your designs`);
    } catch (e) {
      toast('Could not save: ' + (e as Error).message, 'err');
    } finally { setBusy(null); }
  };
  const doShare = async () => {
    setBusy('share');
    try {
      const id = await createHelmetShare(design);
      setShare(shareUrl(id));
    } catch (e) {
      toast('Could not create share link: ' + (e as Error).message, 'err');
    } finally { setBusy(null); }
  };
  const download = async () => {
    if (!viewer.current) return;
    setBusy('img');
    try {
      const url = await socialImage(viewer.current, design, unpaid);
      downloadDataUrl(url, `lucas-racing-${design.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'helmet'}.png`);
    } finally { setBusy(null); }
  };

  return (
    <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <label className="field">
          <span className="label">Design name</span>
          <input className="input" value={design.name} maxLength={60} onChange={(e) => onChange({ ...design, name: e.target.value })} />
        </label>
        <Summary design={design} />
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <h3 className="h4">{quote.kind === 'standard' ? 'Price' : 'Workshop quote required'}</h3>
        {quote.kind === 'standard'
          ? <PriceLines lines={quote.lines} total={quote.total} />
          : (
            <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
              <ul className="hb-reasons">{quote.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="tiny muted">Indicative components so far: {quote.indicative.map((l) => `${l.label} ${money(l.amount)}`).join(' · ')}. The workshop sets the final price.</p>
            </div>
          )}
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <button type="button" className="btn btn-dark btn-sm" onClick={save} disabled={!user || busy === 'save'}><Icon name="heart" />{busy === 'save' ? 'Saving…' : 'Save design'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={p.onDuplicate}><Icon name="copy" />Duplicate</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={doShare} disabled={busy === 'share'}><Icon name="share" />Share view-only preview</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={download} disabled={busy === 'img'}><Icon name="download" />{busy === 'img' ? 'Rendering…' : 'Download social image'}</button>
        </div>
        {!user && <Note tone="info">Saving designs needs an account. <Link to="/account" className="btn-link">Sign in or create one</Link>. Guest checkout is still available.</Note>}
        {unpaid && <p className="tiny muted">Watermarked: unpaid preview. Exports are clean once this exact version is a paid production master.</p>}
        {share && (
          <div className="share-box">
            <input className="input sm" readOnly value={share} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn-primary btn-sm" onClick={async () => toast((await copyText(share)) ? 'Link copied' : 'Copy failed: select the link and copy it manually', 'ok')}><Icon name="copy" />Copy</button>
            <a className="btn btn-ghost btn-sm" href={share} target="_blank" rel="noreferrer"><Icon name="eye" />Open</a>
          </div>
        )}
      </section>

      {job ? <JobRevisionPanel {...p} job={job} />
        : quote.kind === 'standard' ? <ApprovalPanel {...p} />
        : <BespokePanel {...p} />}
    </div>
  );
}

/* ---------------- standard: approve exact version, then basket ---------------- */
function ApprovalPanel({ design, hash, quote, approval, setApproval, viewer }: ReviewProps) {
  const { user } = useAuth();
  const settings = useSettings();
  const basket = useBasket();
  const navigate = useNavigate();
  const [inspected, setInspected] = useState(false);
  const [adding, setAdding] = useState(false);
  const valid = !!approval && approval.hash === hash;
  const stale = !!approval && !valid;
  const gate = canCheckoutHelmet(design, approval, settings);

  const add = async () => {
    if (!gate.ok || !approval || quote.kind !== 'standard') return;
    setAdding(true);
    let thumb = '';
    try { thumb = (await viewer.current?.snapshot({ view: 'three-quarter', width: 320, height: 320 })) || ''; } catch { /* fall back */ }
    basket.add({
      id: uid('bi_'), type: 'helmet', designId: design.id, design: clone(design), name: design.name, approval,
      lines: quote.lines, price: quote.total, qty: 1, thumb: thumb || helmetThumb(design),
    });
    toast('Approved helmet added to basket');
    navigate('/basket');
  };

  return (
    <section className="card pad flat stack hb-approve" style={{ '--gap': '12px' } as React.CSSProperties}>
      <div className="row between">
        <h3 className="h4">Approve &amp; order</h3>
        {valid && <span className="badge ok"><Icon name="check" size={12} />Approved</span>}
      </div>
      <p className="small muted">We paint exactly what you approve. Check every angle with the view buttons, then approve this exact version. Any later change needs a fresh approval.</p>
      {stale && <Note tone="err">Design changed since approval: approve again.</Note>}
      {valid && approval && <Note tone="ok">Approved version <span className="mono">{approval.hash.slice(0, 8)}</span> by {approval.by}.</Note>}
      <label className="check small">
        <input type="checkbox" checked={inspected} onChange={(e) => setInspected(e.target.checked)} />
        I have inspected the 3D design from every angle
      </label>
      <div className="row">
        <button type="button" className="btn btn-dark" disabled={!inspected || valid} onClick={() => setApproval(approveExactVersion(design, user?.email || 'guest'))}>
          <Icon name="check" />{valid ? 'Version approved' : 'Approve this exact version'}
        </button>
        <button type="button" className="btn btn-primary" disabled={!gate.ok || adding} onClick={add}>
          <Icon name="basket" />{adding ? 'Adding…' : `Add to basket · ${money(quote.kind === 'standard' ? quote.total : 0)}`}
        </button>
      </div>
      {!gate.ok && gate.why && <p className="tiny muted">{gate.why}</p>}
    </section>
  );
}

/* ---------------- bespoke: submit brief for workshop review ---------------- */
const JOURNEY = ['Brief', 'Discussion', 'Revisions', 'Quote', 'Final approval', 'Payment'];

function BespokePanel({ design, quote }: ReviewProps) {
  const { user } = useAuth();
  const [brief, setBrief] = useState('');
  const [files, setFiles] = useState<{ name: string; src: string }[]>([]);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<HelmetJob | null>(null);
  useEffect(() => { if (user) { setName((n) => n || user.name); setEmail((e) => e || user.email); } }, [user]);
  const reasons = quote.kind === 'quote' ? quote.reasons : [];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!name.trim() || !emailOk) return;
    setBusy(true);
    try {
      const customer = { name: name.trim(), email: email.trim() };
      const job = submitBespoke(design, brief.trim(), reasons, customer, user?.id ?? null, files);
      await saveDoc('jobs', job);
      await simulateEmail(customer.email, `We've received your helmet brief (${job.ref})`,
        `Hi ${customer.name},\n\nThanks for your bespoke helmet brief "${design.name}". The workshop will review it and get back to you to discuss the design.\n\nReference: ${job.ref}\nWhy it needs a quote: ${reasons.join('; ')}\n\nLucas Racing`);
      await simulateEmail('workshop@lucasracing.demo', `New bespoke helmet brief ${job.ref}`,
        `${customer.name} <${customer.email}> submitted "${design.name}" (${modelLabel(modelById(design.modelId))}).\nReasons: ${reasons.join('; ')}\nBrief: ${brief || '(none)'}\nAttachments: ${files.length}`);
      setDone(job);
      toast(`Brief ${job.ref} submitted to the workshop`);
    } catch (e) {
      toast('Could not submit: ' + (e as Error).message, 'err');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <section className="card pad flat stack hb-approve" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="badge ok" style={{ alignSelf: 'flex-start' }}><Icon name="check" size={12} />Submitted</span>
        <h3 className="h3">Brief {done.ref} is with the workshop</h3>
        <p className="small muted">Confirmation sent to {done.customer.email} <SimBadge>Simulated email</SimBadge>. You'll discuss the design, review revisions and receive a quote before anything is paid.</p>
        <div className="row"><Link to="/orders" className="btn btn-dark"><Icon name="arrow" />Track it in My orders</Link></div>
      </section>
    );
  }

  return (
    <section className="card pad flat stack hb-approve" style={{ '--gap': '12px' } as React.CSSProperties}>
      <h3 className="h4">Submit for workshop review</h3>
      <ol className="journey" aria-label="Bespoke journey">
        {JOURNEY.map((j, i) => <li key={j} className={i === 0 ? 'on' : ''}><span>{i + 1}</span>{j}</li>)}
      </ol>
      <p className="small muted">Bespoke designs aren't paid up front. The workshop reviews your brief, discusses it with you, issues revisions and a quote; you then give final approval and pay.</p>
      <label className="field">
        <span className="label">Your brief</span>
        <textarea className="textarea" rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What you want, colours, inspiration, deadlines, race series…" />
      </label>
      <div className="field">
        <span className="label">Attachments · optional</span>
        <div className="row">
          <UploadButton multiple accept="image/*,application/pdf" onFiles={(f) => setFiles([...files, ...f])}>Add files</UploadButton>
          {files.map((f, i) => (
            <span key={i} className="chip row" style={{ '--gap': '6px', display: 'inline-flex' } as React.CSSProperties}>
              {f.name.slice(0, 22)}
              <button type="button" className="btn-link" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="x" size={12} /></button>
            </span>
          ))}
        </div>
      </div>
      <div className="grid g2" style={{ '--gap': '10px' } as React.CSSProperties}>
        <label className="field"><span className="label">Your name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label className="field"><span className="label">Email</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      </div>
      {!user && <p className="tiny muted">No account needed. <Link to="/account" className="btn-link">Sign in</Link> to see the job in your account; guest briefs are remembered in this browser.</p>}
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={busy || !name.trim() || !emailOk} onClick={submit}>
          <Icon name="mail" />{busy ? 'Submitting…' : 'Submit for workshop review'}
        </button>
        {(!name.trim() || !emailOk) && <span className="tiny muted">Name and a valid email are needed.</span>}
      </div>
    </section>
  );
}

/* ---------------- editing a revision of an existing bespoke job ---------------- */
function JobRevisionPanel({ design, job, setJob }: ReviewProps & { job: HelmetJob }) {
  const { isAdmin } = useAuth();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = isLocked(job);
  const next = latestRevision(job).no + 1;

  const save = async () => {
    setBusy(true);
    try {
      const updated = addRevision(job, design, isAdmin ? 'workshop' : 'customer', note.trim() || `Revision ${next} from the 3D builder`);
      await saveDoc('jobs', updated);
      setJob(updated);
      setNote('');
      toast(`Revision ${next} saved to ${job.ref}`);
    } catch (e) {
      if (e instanceof WorkflowError) toast(e.message, 'err');
      else toast('Could not save revision: ' + (e as Error).message, 'err');
    } finally { setBusy(false); }
  };

  return (
    <section className="card pad flat stack hb-approve" style={{ '--gap': '12px' } as React.CSSProperties}>
      <h3 className="h4">Save a new revision · {job.ref}</h3>
      {locked && (
        <Note tone="err" title="Production master locked.">
          Revision {job.masterRevision} is locked for production. Changes now need a workshop-authorised change request from My orders before a new revision can be added.
        </Note>
      )}
      <p className="small muted">Revisions are immutable snapshots. Saving as {isAdmin ? 'the workshop' : 'the customer'}; the latest revision is what gets quoted and approved.</p>
      <label className="field">
        <span className="label">What changed</span>
        <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Swapped the side flash to blue carbon, moved the number forward" />
      </label>
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={save}><Icon name="layers" />Save as revision {next}</button>
        <Link to="/orders" className="btn btn-ghost">Back to My orders</Link>
      </div>
    </section>
  );
}
