/* Shared UI kit. Feature code should build from these + the classes in styles.css. */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PriceLine, ScopeTag } from '@/core/types';
import { money, readFileAsDataURL } from '@/core/util';
import { PALETTE } from '@/core/color';
import { FILMS, FILM_CATEGORIES } from '@/data/films';
import { filmThumb } from '@/core/filmRender';
import { useSettings } from '@/store';

/* ---------------- icons ---------------- */
const ICONS: Record<string, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  rotate: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  reset: 'M4 4v6h6M4.6 15A8 8 0 1 0 6 6.3L4 10',
  zoomIn: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6',
  zoomOut: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  share: 'M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  basket: 'M5 8h14l-1.4 11.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8zM9 8a3 3 0 0 1 6 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  brush: 'M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2zM4 20c2 0 3-1 3-3',
  shape: 'M4 4h7v7H4zM17.5 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM4 20l3.5-6 3.5 6zM14 14h6v6h-6z',
  text: 'M5 6V4h14v2M12 4v16M9 20h6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.5',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  helmet: 'M3 15a9 9 0 0 1 18 0v2H11l-2-4H3zM14 9h7',
  kart: 'M3 15h4l2-4h7l3 3h2v3H3zM6 18a2 2 0 1 0 0 .01M18 18a2 2 0 1 0 0 .01',
};
export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ICONS.info} />
    </svg>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size * 1.13} viewBox="0 0 30 34" aria-hidden="true">
      <path d="M8 1h8L10.5 24H27l-2 9H1z" fill="#c8f031" />
      <path d="M8 1h8L10.5 24H27l-2 9H1z" fill="none" stroke="#121412" strokeWidth="1.6" />
    </svg>
  );
}

/* ---------------- badges & notes ---------------- */
const SCOPE_LABEL: Record<ScopeTag, string> = { launch: 'Launch', future: 'Future phase', proposed: 'Proposed · to confirm' };
export function ScopeBadge({ tag, children }: { tag: ScopeTag; children?: ReactNode }) {
  return <span className={'badge ' + tag}><span className="dot" />{children ?? SCOPE_LABEL[tag]}</span>;
}
export const SimBadge = ({ children = 'Simulated' }: { children?: ReactNode }) => <span className="badge sim">{children}</span>;

export function Note({ tone = 'warn', title, children, className = '' }: { tone?: 'warn' | 'info' | 'sim' | 'ok' | 'err'; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`note ${tone === 'warn' ? '' : tone} ${className}`} role={tone === 'err' ? 'alert' : undefined}>
      <Icon name={tone === 'ok' ? 'check' : tone === 'err' ? 'x' : 'info'} size={16} />
      <div>{title && <strong>{title} </strong>}{children}</div>
    </div>
  );
}

export const Money = ({ value }: { value: number }) => <>{money(value)}</>;

export function PriceLines({ lines, total, totalLabel = 'Total' }: { lines: PriceLine[]; total?: number; totalLabel?: string }) {
  return (
    <div className="lines">
      {lines.map((l, i) => (
        <div className="ln" key={i}><span>{l.label}</span><span className="nowrap">{money(l.amount)}</span></div>
      ))}
      {total !== undefined && <div className="total"><span>{totalLabel}</span><span>{money(total)}</span></div>}
    </div>
  );
}

/* ---------------- modal ---------------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="modal-head">
          <div className="h4">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- tabs / segmented ---------------- */
export function Tabs<T extends string>({ tabs, value, onChange, label = 'Sections' }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: { id: T; label: ReactNode; disabled?: boolean }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} disabled={o.disabled} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------------- colour swatches ---------------- */
export function Swatches({ colors = PALETTE, value, onChange, square, allowCustom = true, label }: { colors?: [string, string][]; value: string | null; onChange: (hex: string) => void; square?: boolean; allowCustom?: boolean; label?: string }) {
  const known = colors.some(([, h]) => h.toLowerCase() === (value || '').toLowerCase());
  return (
    <div className="swatches" role="group" aria-label={label}>
      {colors.map(([name, hex]) => (
        <button key={hex} type="button" className={'sw' + (square ? ' sq' : '')} style={{ background: hex }} title={name} aria-label={name}
          aria-pressed={(value || '').toLowerCase() === hex.toLowerCase()} onClick={() => onChange(hex)} />
      ))}
      {allowCustom && (
        <label className={'sw custom' + (square ? ' sq' : '')} title="Custom colour" aria-pressed={!!value && !known}
          style={value && !known ? { background: value } : undefined}>
          <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} aria-label="Custom colour" />
        </label>
      )}
    </div>
  );
}

/* ---------------- film library picker ---------------- */
export function FilmPicker({ value, onPick, tint, onTint, showTint = true, maxHeight = 360 }: {
  value: string | null; onPick: (filmId: string) => void; tint: string | null; onTint?: (hex: string | null) => void; showTint?: boolean; maxHeight?: number;
}) {
  const settings = useSettings();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [stockOnly, setStockOnly] = useState(false);
  const list = useMemo(() => FILMS.filter((f) => {
    const s = settings.films[f.id];
    if (s && !s.available) return false;
    if (stockOnly && !(s ? s.stocked : f.stocked)) return false;
    const c = s?.category || f.category;
    if (cat !== 'All' && c !== cat) return false;
    return !q || f.name.toLowerCase().includes(q.toLowerCase()) || c.toLowerCase().includes(q.toLowerCase());
  }), [q, cat, stockOnly, settings]);
  const selected = FILMS.find((f) => f.id === value);
  return (
    <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
      <div className="row nowrap">
        <div className="grow" style={{ position: 'relative' }}>
          <input className="input sm" placeholder={`Search ${FILMS.length} films…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search films" style={{ paddingLeft: 32 }} />
          <span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--dim)' }}><Icon name="search" size={16} /></span>
        </div>
        <select className="select sm" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Film category">
          <option>All</option>
          {FILM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="row between">
        <label className="check small"><input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} /> In stock only</label>
        <span className="tiny muted">{list.length} shown · illustrative swatches</span>
      </div>
      <div style={{ maxHeight, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8, paddingRight: 4 }}>
        {list.map((f) => {
          const s = settings.films[f.id];
          const stocked = s ? s.stocked : f.stocked;
          return (
            <button key={f.id} type="button" onClick={() => onPick(f.id)} title={`${f.name} · ${money(s?.price ?? f.price)}${stocked ? '' : ' · special order (quote)'}`}
              style={{ border: value === f.id ? '2px solid var(--ink)' : '1px solid var(--line)', borderRadius: 10, padding: 4, background: 'var(--card)', textAlign: 'left' }}>
              <img src={filmThumb(f, value === f.id ? tint : null)} alt="" width={96} height={96} style={{ width: '100%', aspectRatio: '1', borderRadius: 7 }} loading="lazy" />
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, lineHeight: 1.2, marginTop: 4 }}>{f.name}</span>
              <span style={{ display: 'block', fontSize: 10, color: stocked ? 'var(--muted)' : '#8a5a00' }}>{stocked ? money(s?.price ?? f.price) : 'Special order'}</span>
            </button>
          );
        })}
        {!list.length && <div className="muted small" style={{ gridColumn: '1/-1' }}>No films match.</div>}
      </div>
      {showTint && onTint && selected && (
        <div className="field">
          <span className="label">Tint {selected.tintable ? <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>· e.g. carbon + blue = blue carbon</span> : '· not tintable'}</span>
          {selected.tintable && (
            <div className="row">
              <button type="button" className="chip" aria-pressed={!tint} onClick={() => onTint(null)}>Natural</button>
              <Swatches value={tint} onChange={(h) => onTint(h)} label="Film tint" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- uploads ---------------- */
export function UploadButton({ onFiles, accept = 'image/*', multiple, children, className = 'btn btn-ghost btn-sm', maxDim = 1024 }: {
  onFiles: (files: { src: string; name: string }[]) => void; accept?: string; multiple?: boolean; children: ReactNode; className?: string; maxDim?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}><Icon name="upload" size={16} />{children}</button>
      <input ref={ref} type="file" accept={accept} multiple={multiple} hidden onChange={async (e) => {
        const files = Array.from(e.target.files || []);
        const out = await Promise.all(files.map(async (f) => ({ name: f.name, src: await readFileAsDataURL(f, maxDim) })));
        onFiles(out);
        e.target.value = '';
      }} />
    </>
  );
}

/* ---------------- misc ---------------- */
export function Empty({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="h4">{title}</div>
      {children && <p className="small" style={{ marginBottom: action ? 14 : 0 }}>{children}</p>}
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="tiny muted">{hint}</span>}
    </label>
  );
}

export function PageHead({ eyebrow, title, children, actions }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div style={{ maxWidth: 760 }}>
        {eyebrow && <div className="eyebrow lime">{eyebrow}</div>}
        <h1 className="h1" style={{ fontSize: 'clamp(36px,5vw,60px)' }}>{title}</h1>
        {children && <p className="lead" style={{ marginTop: 10 }}>{children}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

/** Trigger a browser download of a data URL. */
export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Line-art product illustrations (placeholder imagery). */
const ART: Record<string, string> = {
  kart: '<path d="M10 66h28l8-16h52l12 10h34l14 12H10z"/><circle cx="36" cy="74" r="12"/><circle cx="142" cy="74" r="12"/><path d="M80 50l6-16h14"/><circle cx="104" cy="28" r="8"/>',
  wheel: '<circle cx="90" cy="50" r="36"/><circle cx="90" cy="50" r="9"/><path d="M90 14v27M60 64l22-9M120 64l-22-9"/>',
  hub: '<rect x="56" y="28" width="68" height="44" rx="8"/><circle cx="90" cy="50" r="11"/><path d="M38 50h18M124 50h18"/>',
  trolley: '<path d="M20 56h140v8H20z"/><path d="M36 64v12M144 64v12"/><circle cx="36" cy="80" r="6"/><circle cx="144" cy="80" r="6"/><path d="M20 56L10 20"/>',
  disc: '<circle cx="90" cy="50" r="38"/><circle cx="90" cy="50" r="13"/><circle cx="90" cy="24" r="3"/><circle cx="90" cy="76" r="3"/><circle cx="64" cy="50" r="3"/><circle cx="116" cy="50" r="3"/>',
  seat: '<path d="M60 12c0 28 3 48 14 62h48c6-8 8-20 8-30"/><path d="M60 12c8-3 16 0 20 8l8 42h34"/>',
  sprocket: '<circle cx="90" cy="50" r="30"/><circle cx="90" cy="50" r="10"/><path d="M90 10v8M90 82v8M50 50h8M122 50h8M62 22l6 6M112 72l6 6M62 78l6-6M112 28l6-6"/>',
  axle: '<path d="M14 50h152"/><rect x="34" y="40" width="14" height="20" rx="3"/><rect x="132" y="40" width="14" height="20" rx="3"/><path d="M76 44h28v12H76z"/>',
  nose: '<path d="M14 70c10-30 50-48 110-50l30 2c10 4 12 18 8 32-4 14-10 20-22 22L30 80c-12 0-18-4-16-10z"/>',
  nassau: '<path d="M50 14c26-8 54-8 80 0l8 46c-8 22-34 32-48 32s-40-10-48-32z"/>',
  guard: '<path d="M14 64c4-18 26-26 56-26l80-1c14 1 22 10 21 24-1 12-9 18-21 19l-118 3c-12 0-20-8-18-19z"/>',
  tank: '<path d="M50 20h80q20 0 20 20v40q0 12-12 12H42q-12 0-12-12V40q0-20 20-20z"/><rect x="78" y="8" width="24" height="14" rx="4"/>',
};
export function ProductArt({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 180 100" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ART[icon] || ART.hub }} />
  );
}
