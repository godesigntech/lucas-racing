/* Choose a solid colour, a hydro-dip film (with tint) or, optionally, customer film imagery. */
import { useState } from 'react';
import type { Paint } from '@/core/types';
import { filmById } from '@/data/films';
import { filmThumb } from '@/core/filmRender';
import { money } from '@/core/util';
import { useSettings } from '@/store';
import { Modal, Seg, Swatches, UploadButton } from '@/ui';
import { SafeFilmPicker } from './SafeFilmPicker';
import { paintLabel } from '../shared';

type Kind = Paint['kind'];

export function PaintSwatch({ paint, size = 28 }: { paint: Paint; size?: number }) {
  const style = { width: size, height: size, borderRadius: 8, flex: 'none' as const, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)' };
  if (paint.kind === 'solid') return <span style={{ ...style, background: paint.color }} aria-hidden="true" />;
  const film = paint.kind === 'film' ? filmById(paint.filmId) : null;
  const src = paint.kind === 'film' ? (film ? filmThumb(film, paint.tint, 64) : '') : paint.src;
  return <img src={src} alt="" width={size} height={size} style={{ ...style, objectFit: 'cover' }} />;
}

/** Price / stock line for a film paint. */
export function FilmMeta({ filmId }: { filmId: string }) {
  const settings = useSettings();
  const f = filmById(filmId);
  if (!f) return <span className="badge err">Unknown film</span>;
  const s = settings.films[f.id];
  const stocked = s ? s.stocked : f.stocked;
  const available = s ? s.available : f.available;
  return (
    <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
      <span className="small">{money(s?.price ?? f.price)} per area</span>
      {!available ? <span className="badge err">Unavailable → quote</span> : !stocked ? <span className="badge warn">Special order → quote</span> : <span className="badge ok">In stock</span>}
    </span>
  );
}

export function PaintPicker({ value, onChange, allowCustomFilm = false, label = 'Paint' }: {
  value: Paint; onChange: (p: Paint) => void; allowCustomFilm?: boolean; label?: string;
}) {
  const [libOpen, setLibOpen] = useState(false);
  const [lastSolid, setLastSolid] = useState(value.kind === 'solid' ? value.color : '#f5f5f2');
  const [lastFilm, setLastFilm] = useState<Paint | null>(value.kind === 'film' ? value : null);

  const [wantCustom, setWantCustom] = useState(false);
  const shown: Kind = wantCustom ? 'custom-film' : value.kind;

  const choose = (k: Kind) => {
    setWantCustom(k === 'custom-film' && value.kind !== 'custom-film');
    if (k === value.kind) return;
    if (value.kind === 'solid') setLastSolid(value.color);
    if (value.kind === 'film') setLastFilm(value);
    if (k === 'solid') onChange({ kind: 'solid', color: lastSolid });
    if (k === 'film') {
      if (lastFilm) onChange(lastFilm);
      setLibOpen(true);
    }
    // 'custom-film' waits for an upload before the paint actually changes.
  };

  const options: { id: Kind; label: string }[] = [
    { id: 'solid', label: 'Colour' },
    { id: 'film', label: 'Hydro-dip film' },
  ];
  if (allowCustomFilm) options.push({ id: 'custom-film', label: 'Your film' });

  return (
    <div className="stack paint-picker" style={{ '--gap': '10px' } as React.CSSProperties}>
      <Seg options={options} value={shown} onChange={choose} label={`${label} type`} />
      {shown === 'solid' && value.kind === 'solid' && (
        <Swatches value={value.color} onChange={(c) => onChange({ kind: 'solid', color: c })} label={`${label} colour`} />
      )}
      {shown === 'film' && value.kind === 'film' && (
        <div className="paint-film">
          <PaintSwatch paint={value} size={48} />
          <div className="grow">
            <div style={{ fontWeight: 600 }}>{paintLabel(value)}</div>
            <FilmMeta filmId={value.filmId} />
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLibOpen(true)}>Change</button>
        </div>
      )}
      {value.kind === 'custom-film' && (
        <div className="paint-film">
          <PaintSwatch paint={value} size={48} />
          <div className="grow">
            <div style={{ fontWeight: 600 }}>{value.name}</div>
            <span className="badge warn">Customer film imagery → quote</span>
          </div>
        </div>
      )}
      {allowCustomFilm && shown === 'custom-film' && (
        <div className="row">
          <UploadButton onFiles={(f) => { if (f[0]) { setWantCustom(false); onChange({ kind: 'custom-film', src: f[0].src, name: f[0].name }); } }} className="btn btn-ghost btn-sm">
            {value.kind === 'custom-film' ? 'Replace film image' : 'Upload your hydro-dip film image'}
          </UploadButton>
          <span className="tiny muted">Customer-supplied film imagery always goes to a workshop quote.</span>
        </div>
      )}
      <Modal open={libOpen} onClose={() => setLibOpen(false)} title="Hydro-dip film library" wide
        footer={<button type="button" className="btn btn-dark" onClick={() => setLibOpen(false)}>Done</button>}>
        <SafeFilmPicker
          value={value.kind === 'film' ? value.filmId : null}
          tint={value.kind === 'film' ? value.tint : null}
          onPick={(filmId) => onChange({ kind: 'film', filmId, tint: value.kind === 'film' && filmById(filmId)?.tintable ? value.tint : null })}
          onTint={(tint) => value.kind === 'film' && onChange({ ...value, tint })}
          maxHeight={420}
        />
        <p className="tiny muted" style={{ marginTop: 10 }}>The 3D preview updates as you pick. Film swatches are illustrative until the real library is supplied.</p>
      </Modal>
    </div>
  );
}
