/* Shared presentational pieces for orders, admin and production. */
import { Component, forwardRef, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Film, HelmetDesign, Invoice, Message, Paint, Proof } from '@/core/types';
import { fmtDate, money, FONT_LABEL } from '@/core/util';
import { colourName } from '@/core/color';
import { filmById } from '@/data/films';
import { modelById, modelLabel, templateById } from '@/data/helmets';
import { filmThumb, loadImage } from '@/core/filmRender';
import { drawWatermark, preloadDesignImages, renderUVLayout } from '@/core/helmetPaint';
import { HelmetViewer, type HelmetViewerApi, type ViewName } from '@/three/HelmetViewer';
import { Icon, Modal, UploadButton, downloadDataUrl } from '@/ui';
import type { Tone } from './data';

/* ---------------- badges & stepper ---------------- */
export function StatusBadge({ label, tone }: { label: ReactNode; tone: Tone }) {
  return <span className={'badge ' + tone}>{label}</span>;
}

export function Stepper({ steps, current, alert, label }: { steps: string[]; current: number; alert?: boolean; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    // On narrow screens keep the current step in view.
    const ol = ref.current;
    const li = ol?.children[current] as HTMLElement | undefined;
    if (ol && li && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, li.offsetLeft - ol.offsetLeft - ol.clientWidth / 2 + li.offsetWidth / 2);
  }, [current]);
  return (
    <ol ref={ref} className="wf-steps" aria-label={label}>
      {steps.map((s, i) => {
        const cls = i < current ? 'done' : i === current ? 'current' + (alert ? ' alert' : '') : '';
        return (
          <li key={s} className={cls} aria-current={i === current ? 'step' : undefined}>
            <span className="n">{i < current ? <Icon name="check" size={13} /> : i + 1}</span>
            <span>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Card({ title, icon, actions, children, className = '' }: { title?: ReactNode; icon?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={'wf-card ' + className}>
      {(title || actions) && (
        <div className="wf-card-head">
          {title && <h2 className="h4">{icon && <Icon name={icon} size={18} />}{title}</h2>}
          {actions && <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="wf-kv">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------- paint / design spec ---------------- */
/** filmThumb that never throws (a renderer bug in one pattern must not take down admin pages). */
export function safeFilmThumb(f: Film, tint: string | null = null): string | null {
  try { return filmThumb(f, tint); } catch { return null; }
}
/** Film swatch thumbnail. `show=false` renders a cheap gradient placeholder (used to stagger large tables). */
export function FilmThumb({ film, tint = null, className = 'wf-film', show = true }: { film: Film; tint?: string | null; className?: string; show?: boolean }) {
  const src = show ? safeFilmThumb(film, tint) : null;
  return src ? <img className={className} src={src} alt="" />
    : <span className={className} aria-hidden="true" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${film.colors.join(', ')})` }} />;
}

/** Count that grows in steps on timers so heavy per-row work is spread over several frames. */
export function useStagger(total: number, step = 16, delay = 30) {
  const [n, setN] = useState(step);
  useEffect(() => {
    if (n >= total) return;
    const t = setTimeout(() => setN((x) => x + step), delay);
    return () => clearTimeout(t);
  }, [n, total, step, delay]);
  return n;
}

export function Swatch({ hex }: { hex: string }) {
  return <span className="wf-swatch" style={{ background: hex }} aria-hidden="true" />;
}

export function PaintView({ paint }: { paint: Paint }) {
  if (paint.kind === 'solid') {
    return <span className="wf-paint"><Swatch hex={paint.color} />{colourName(paint.color)} <span className="mono muted">{paint.color}</span></span>;
  }
  if (paint.kind === 'film') {
    const f = filmById(paint.filmId);
    if (!f) return <span className="wf-paint">Unknown film <span className="mono muted">{paint.filmId}</span></span>;
    return (
      <span className="wf-paint">
        <FilmThumb film={f} tint={paint.tint} />
        <strong>{f.name}</strong> <span className="muted small">({f.category})</span>
        {paint.tint ? <span className="small"> · tint <Swatch hex={paint.tint} />{colourName(paint.tint)} <span className="mono muted">{paint.tint}</span></span> : <span className="small muted"> · natural</span>}
      </span>
    );
  }
  return (
    <span className="wf-paint">
      <img className="wf-film" src={paint.src} alt="" style={{ objectFit: 'cover' }} />
      <strong>{paint.name}</strong> <span className="badge warn">Customer hydro-dip upload</span>
    </span>
  );
}

const SEND: Record<string, string> = { courier: 'Courier to workshop', dropoff: 'Drop-off at workshop', 'track-handover': 'Handover at track' };
const RET: Record<string, string> = { delivery: 'Delivery', collection: 'Collection', 'track-handover': 'Handover at track' };

/** Every production-relevant material/option of a helmet design. */
export function designSpecRows(d: HelmetDesign): [ReactNode, ReactNode][] {
  const model = modelById(d.modelId);
  const tpl = templateById(d.templateId);
  const rows: [ReactNode, ReactNode][] = [];
  rows.push(['Helmet model', <>{modelLabel(model)} {model.status !== 'launch' && <span className="badge proposed">{model.status}</span>}</>]);
  if (d.supply.kind === 'new') rows.push(['Supply', <>New helmet supplied by Lucas Racing · size <strong>{d.supply.size}</strong></>]);
  else {
    const s = d.supply;
    rows.push(['Supply', <>Customer&apos;s own helmet: <strong>{s.make} {s.model}</strong> · size {s.size} · {s.condition}</>]);
    rows.push(['Send / return', <>{SEND[s.sendMethod] || s.sendMethod} → {RET[s.returnMethod] || s.returnMethod}</>]);
    if (s.notes) rows.push(['Helmet notes', s.notes]);
    if (s.photos.length) rows.push(['Helmet photos', <div className="wf-photo-row">{s.photos.map((p, i) => <a key={i} href={p.src} target="_blank" rel="noreferrer" title={p.name}><img src={p.src} alt={p.name} /></a>)}</div>]);
  }
  rows.push(['Design source', d.source]);
  rows.push(['Template', tpl ? <>{tpl.name} {tpl.launch && <span className="badge launch">Launch</span>}</> : <span className="muted">None (no template)</span>]);
  rows.push(['Base', <PaintView paint={d.basePaint} />]);
  if (tpl) {
    for (const z of tpl.zones) {
      const p = d.zonePaints[z.id];
      if (p) rows.push([`Zone · ${z.name}`, <PaintView paint={p} />]);
    }
  }
  if (d.drawing.length) rows.push(['Drawn shapes', `${d.drawing.length} freehand / shape layers`]);
  rows.push(['Chrome base', d.chrome ? <span className="badge warn">Yes</span> : 'No']);
  rows.push(['Finish', d.finish === 'satin' ? 'Satin' : 'Gloss']);
  rows.push(['Trims', (
    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
      <span><Swatch hex={d.trims.baseRubber} />Base rubber · {colourName(d.trims.baseRubber)}</span>
      <span><Swatch hex={d.trims.eyeRubber} />Eye-port rubber · {colourName(d.trims.eyeRubber)}</span>
      <span><Swatch hex={d.trims.plastic} />Plastics · {colourName(d.trims.plastic)}</span>
    </span>
  )]);
  rows.push(['Spoiler', d.spoiler.enabled ? (model.spoilerCompatible ? <><Swatch hex={d.spoiler.color} />{colourName(d.spoiler.color)}</> : <span className="badge err">Selected but model not compatible</span>) : 'None']);
  const texts = d.texts.filter((t) => t.text.trim());
  rows.push(['Names & numbers', texts.length ? (
    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
      {texts.map((t) => (
        <span key={t.id}>
          <strong>{t.kind === 'name' ? 'Name' : 'Number'}: “{t.text}”</strong> · {FONT_LABEL[t.font] || t.font} · <Swatch hex={t.color} />{colourName(t.color)}
          {t.outline && <> · outline <Swatch hex={t.outline} /></>}{t.mirror && ' · mirrored both sides'}
        </span>
      ))}
    </span>
  ) : 'None']);
  rows.push(['Logos', d.logos.length ? (
    <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
      {d.logos.map((l) => <a key={l.id} className="wf-att" href={l.src} target="_blank" rel="noreferrer"><img src={l.src} alt="" /><span>{l.name}{l.mirror ? ' (mirrored)' : ''}</span></a>)}
    </span>
  ) : 'None']);
  if (d.artwork) rows.push(['Uploaded artwork', <a className="wf-att" href={d.artwork.src} target="_blank" rel="noreferrer"><img src={d.artwork.src} alt="" /><span>{d.artwork.name}</span></a>]);
  if (d.ai) rows.push(['AI concept brief', <span>{d.ai.prompt || '—'}{d.ai.references.length ? ` · ${d.ai.references.length} reference image(s)` : ''}</span>]);
  return rows;
}

/* ---------------- 3D stage ---------------- */
export const HelmetStage = forwardRef<HelmetViewerApi, { design: HelmetDesign; height?: number; watermark?: string | null; tag?: ReactNode; onReady?: () => void; autoRotate?: boolean }>(
  function HelmetStage({ design, height = 380, watermark = null, tag, onReady, autoRotate }, ref) {
    return (
      <div className="viewer-stage" style={{ height }}>
        {tag && <div className="viewer-tag" style={{ left: 14, top: 14 }}>{tag}</div>}
        {watermark && <div className="wm-tag">Watermarked preview</div>}
        <HelmetViewer ref={ref} design={design} watermark={watermark} onReady={onReady} autoRotate={autoRotate} />
      </div>
    );
  },
);

export const ANGLES: { view: ViewName; label: string }[] = [
  { view: 'front', label: 'Front' },
  { view: 'side', label: 'Left side' },
  { view: 'right', label: 'Right side' },
  { view: 'rear', label: 'Rear' },
  { view: 'top', label: 'Top' },
  { view: 'three-quarter', label: 'Three-quarter' },
];

/** Capture the six standard views from a mounted viewer. */
export function useAngleShots(viewer: RefObject<HelmetViewerApi>) {
  const [shots, setShots] = useState<{ view: ViewName; label: string; src: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const capture = async () => {
    const api = viewer.current;
    if (!api) return [];
    setBusy(true);
    const out: { view: ViewName; label: string; src: string }[] = [];
    try {
      for (const a of ANGLES) {
        const src = await api.snapshot({ view: a.view, width: 900, height: 700 });
        if (src) out.push({ ...a, src });
      }
      setShots(out);
    } finally {
      setBusy(false);
    }
    return out;
  };
  return { shots, busy, capture, clear: () => setShots([]) };
}

export function ShotGrid({ shots, prefix }: { shots: { view: ViewName; label: string; src: string }[]; prefix: string }) {
  if (!shots.length) return null;
  return (
    <div className="wf-shots">
      {shots.map((s) => (
        <figure key={s.view} className="wf-shot" style={{ margin: 0 }}>
          <img src={s.src} alt={`${s.label} view`} />
          <figcaption className="cap">
            <span>{s.label}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => downloadDataUrl(s.src, `${prefix}-${s.view}.png`)} aria-label={`Download ${s.label} view PNG`}><Icon name="download" size={14} />PNG</button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Paint a watermark over a PNG data URL (customer previews before payment). */
export async function watermarkImage(src: string, text: string): Promise<string> {
  const img = await loadImage(src);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#efeee8';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  drawWatermark(ctx, c.width, c.height, text, 0.35);
  return c.toDataURL('image/png');
}

/** Concept UV layout of a design as a data URL (after images load). */
export function useUVLayout(design: HelmetDesign | null, scale = 0.5, watermark: string | null = null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (!design) return;
    preloadDesignImages(design).catch(() => undefined).then(() => {
      if (!alive) return;
      try {
        setSrc(renderUVLayout(design, { labels: true, scale, watermark }).toDataURL('image/png'));
      } catch {
        setSrc(null);
      }
    });
    return () => { alive = false; };
  }, [design, scale, watermark]);
  return src;
}

export async function uvLayoutPng(design: HelmetDesign, scale = 1, watermark: string | null = null) {
  await preloadDesignImages(design).catch(() => undefined);
  return renderUVLayout(design, { labels: true, scale, watermark }).toDataURL('image/png');
}

/* ---------------- messages ---------------- */
export function MessageThread({ messages, me }: { messages: Message[]; me: 'customer' | 'workshop' }) {
  if (!messages.length) return <div className="wf-empty-inline">No messages yet.</div>;
  return (
    <div className="wf-msgs" aria-live="polite">
      {messages.map((m) => (
        <article key={m.id} className={'wf-msg ' + m.by} aria-label={`${m.by === me ? 'You' : m.author}, ${fmtDate(m.at)}`}>
          <div className="who"><span>{m.by === 'workshop' ? 'Workshop' : 'Customer'} · {m.author}</span><span>{fmtDate(m.at)}</span></div>
          <p>{m.text}</p>
          {m.attachments.length > 0 && <Attachments items={m.attachments} />}
        </article>
      ))}
    </div>
  );
}

export function Attachments({ items, onRemove }: { items: { name: string; src: string }[]; onRemove?: (i: number) => void }) {
  return (
    <div className="wf-atts">
      {items.map((a, i) => (
        <span key={i} className="wf-att">
          {a.src.startsWith('data:image') ? <img src={a.src} alt="" /> : <Icon name="image" size={16} />}
          <a href={a.src} target="_blank" rel="noreferrer" download={a.name} style={{ textDecoration: 'none', minWidth: 0 }}><span>{a.name}</span></a>
          {onRemove && <button type="button" className="btn-link" style={{ color: 'var(--red)' }} onClick={() => onRemove(i)} aria-label={`Remove ${a.name}`}><Icon name="x" size={13} /></button>}
        </span>
      ))}
    </div>
  );
}

export function Composer({ onSend, placeholder, sendLabel = 'Send message' }: { onSend: (text: string, atts: { name: string; src: string }[]) => Promise<boolean | void> | void; placeholder: string; sendLabel?: string }) {
  const [text, setText] = useState('');
  const [atts, setAtts] = useState<{ name: string; src: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim() && !atts.length) return;
    setBusy(true);
    const ok = await onSend(text.trim() || '(attachment)', atts);
    setBusy(false);
    if (ok !== false) { setText(''); setAtts([]); }
  };
  return (
    <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
      <label className="sr-only" htmlFor={'composer-' + sendLabel}>{placeholder}</label>
      <textarea id={'composer-' + sendLabel} className="textarea" rows={3} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      {atts.length > 0 && <Attachments items={atts} onRemove={(i) => setAtts(atts.filter((_, j) => j !== i))} />}
      <div className="row between">
        <UploadButton multiple onFiles={(f) => setAtts([...atts, ...f])} maxDim={1400}>Attach images</UploadButton>
        <button className="btn btn-dark btn-sm" disabled={busy || (!text.trim() && !atts.length)} onClick={send}><Icon name="mail" size={16} />{sendLabel}</button>
      </div>
    </div>
  );
}

/* ---------------- money & invoices ---------------- */
export function MoneyInput({ value, onChange, label, className = 'input sm price-in', min = 0 }: { value: number; onChange: (n: number) => void; label: string; className?: string; min?: number }) {
  return (
    <span className="wf-money">
      <input className={className} type="number" inputMode="decimal" min={min} step="0.01" value={Number.isFinite(value) ? value : 0} aria-label={label}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Math.max(min, Number(e.target.value)))} />
    </span>
  );
}

export function InvoiceTable({ invoices, onPay }: { invoices: Invoice[]; onPay?: (id: string) => void }) {
  if (!invoices.length) return <div className="wf-empty-inline">No invoices yet.</div>;
  return (
    <div className="table-wrap">
      <table className="table wf-table">
        <thead><tr><th>Invoice</th><th className="num">Amount</th><th>Status</th></tr></thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="wrap" style={{ minWidth: 140 }}>{i.label}<div className="tiny muted">{i.kind} · {fmtDate(i.createdAt)}</div></td>
              <td className="num">{money(i.amount)}</td>
              <td>
                {i.status === 'paid' ? <span className="badge ok">Paid</span>
                  : onPay ? <button className="btn btn-primary btn-xs" onClick={() => onPay(i.id)}>Pay (simulated)</button>
                    : <span className="badge err">Unpaid</span>}
                {i.paidAt && <div className="tiny muted">{fmtDate(i.paidAt)}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function History({ items }: { items: { at: string; text: string }[] }) {
  if (!items.length) return <div className="wf-empty-inline">No history yet.</div>;
  return (
    <div className="timeline">
      {[...items].reverse().map((h, i) => (
        <div className="ev" key={i}><span className="tiny muted">{fmtDate(h.at)}</span><div>{h.text}</div></div>
      ))}
    </div>
  );
}

export function NotificationList({ items }: { items: { at: string; to: string; subject: string; body?: string }[] }) {
  if (!items.length) return <div className="wf-empty-inline">No notifications yet.</div>;
  return (
    <div className="wf-notifs">
      {items.map((n, i) => (
        <div className="wf-notif" key={i}>
          <div className="s"><Icon name="mail" size={14} /> {n.subject}</div>
          <div className="when">{fmtDate(n.at)}</div>
          <div className="to">To {n.to}{n.body ? ` · ${n.body.slice(0, 140)}${n.body.length > 140 ? '…' : ''}` : ''}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- proofs ---------------- */
const PROOF_TONE: Record<Proof['status'], Tone> = { pending: 'warn', approved: 'ok', 'changes-requested': 'err', superseded: 'sim' };
export function ProofStatus({ p }: { p: Proof }) {
  return <StatusBadge tone={PROOF_TONE[p.status]} label={p.status === 'changes-requested' ? 'Changes requested' : p.status} />;
}

export function ProofHistory({ proofs }: { proofs: Proof[] }) {
  const [zoom, setZoom] = useState<Proof | null>(null);
  if (!proofs.length) return <div className="wf-empty-inline">No proofs issued yet.</div>;
  return (
    <>
      <div className="wf-proofs">
        {[...proofs].reverse().map((p) => (
          <div className="wf-proof-row" key={p.no}>
            <button type="button" style={{ padding: 0, border: 0, background: 'none' }} onClick={() => setZoom(p)} aria-label={`Enlarge proof ${p.no}`}>
              <img src={p.image} alt={`Proof ${p.no}`} />
            </button>
            <div className="stack" style={{ '--gap': '4px', minWidth: 0 } as React.CSSProperties}>
              <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}><strong>Proof {p.no}</strong><ProofStatus p={p} /></div>
              <div className="tiny muted">Issued {fmtDate(p.createdAt)}{p.decidedAt ? ` · decided ${fmtDate(p.decidedAt)}` : ''}</div>
              {p.note && <div className="small"><span className="muted">Workshop note:</span> {p.note}</div>}
              {p.customerComment && <div className="small"><span className="muted">Customer comment:</span> {p.customerComment}</div>}
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!zoom} onClose={() => setZoom(null)} title={zoom ? `Proof ${zoom.no}` : ''} wide
        footer={zoom && <button className="btn btn-ghost btn-sm" onClick={() => downloadDataUrl(zoom.image, `proof-${zoom.no}.${zoom.image.startsWith('data:image/jpeg') ? 'jpg' : 'png'}`)}><Icon name="download" />Download proof</button>}>
        {zoom && <img className="wf-proof" src={zoom.image} alt={`Proof ${zoom.no}`} />}
      </Modal>
    </>
  );
}

export const CONCEPT_EXPORT = 'Concept export — not a validated full-size manufacturing pattern';
export const PRODUCTION_CHECKLIST = 'Before production use confirm dimensions, bleed, cut contours, colour handling, holographic underprint and required export formats.';

/** Keeps a failure inside one panel from blanking the whole app. */
export class Boundary extends Component<{ children: ReactNode; label: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { label: string }) { if (prev.label !== this.props.label && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="note err" role="alert">
        <Icon name="x" size={16} />
        <div><strong>{this.props.label} could not be displayed.</strong> {this.state.error.message}
          <div style={{ marginTop: 8 }}><button className="btn btn-ghost btn-xs" onClick={() => this.setState({ error: null })}>Try again</button></div>
        </div>
      </div>
    );
  }
}
