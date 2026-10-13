/* Guards the shared FilmPicker: if any procedural swatch fails to render, fall back to a
   simple grid of the films that do render instead of taking down the whole builder. */
import { Component, useMemo, useState, type ReactNode } from 'react';
import type { Film } from '@/core/types';
import { filmThumb, filmTile } from '@/core/filmRender';
import { money } from '@/core/util';
import { FILMS } from '@/data/films';
import { useSettings } from '@/store';
import { FilmPicker, Swatches } from '@/ui';

const renders = new Map<string, boolean>();
/** True when the film's swatch tile can be painted (cached). */
export function filmRenders(f: Film): boolean {
  let ok = renders.get(f.id);
  if (ok === undefined) {
    try { filmTile(f, null); ok = true; } catch { ok = false; }
    renders.set(f.id, ok);
  }
  return ok;
}

type Props = { value: string | null; onPick: (id: string) => void; tint: string | null; onTint: (t: string | null) => void; maxHeight?: number };

function FallbackPicker({ value, onPick, tint, onTint, maxHeight = 420 }: Props) {
  const settings = useSettings();
  const [q, setQ] = useState('');
  const list = useMemo(() => FILMS.filter((f) => {
    const s = settings.films[f.id];
    if (s && !s.available) return false;
    if (!filmRenders(f)) return false;
    return !q || (f.name + ' ' + f.category).toLowerCase().includes(q.toLowerCase());
  }), [q, settings]);
  const selected = FILMS.find((f) => f.id === value);
  return (
    <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
      <input className="input sm" placeholder="Search films…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search films" />
      <div style={{ maxHeight, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
        {list.map((f) => {
          const s = settings.films[f.id];
          const stocked = s ? s.stocked : f.stocked;
          return (
            <button key={f.id} type="button" onClick={() => onPick(f.id)} aria-pressed={value === f.id}
              style={{ border: value === f.id ? '2px solid var(--ink)' : '1px solid var(--line)', borderRadius: 10, padding: 4, background: 'var(--card)', textAlign: 'left' }}>
              <img src={filmThumb(f, value === f.id ? tint : null)} alt="" width={96} height={96} style={{ width: '100%', aspectRatio: '1', borderRadius: 7 }} />
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, lineHeight: 1.2, marginTop: 4 }}>{f.name}</span>
              <span style={{ display: 'block', fontSize: 10, color: stocked ? 'var(--muted)' : '#8a5a00' }}>{stocked ? money(s?.price ?? f.price) : 'Special order'}</span>
            </button>
          );
        })}
      </div>
      {selected?.tintable && (
        <div className="row">
          <button type="button" className="chip" aria-pressed={!tint} onClick={() => onTint(null)}>Natural</button>
          <Swatches value={tint} onChange={onTint} label="Film tint" />
        </div>
      )}
    </div>
  );
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.warn('[helmet] FilmPicker failed, using fallback grid', e); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function SafeFilmPicker(p: Props) {
  return (
    <Boundary fallback={<FallbackPicker {...p} />}>
      <FilmPicker value={p.value} onPick={p.onPick} tint={p.tint} onTint={p.onTint} maxHeight={p.maxHeight} />
    </Boundary>
  );
}
