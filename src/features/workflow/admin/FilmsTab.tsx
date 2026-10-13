import { useMemo, useState } from 'react';
import { FILMS, FILM_CATEGORIES } from '@/data/films';
import { Note } from '@/ui';
import { FilmThumb, MoneyInput, useStagger } from '../shared';
import { SaveBar, SearchBox, useSettingsDraft } from './common';

export function FilmsTab() {
  const { draft, setDraft, dirty, saving, save, discard } = useSettingsDraft('films');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [show, setShow] = useState<'all' | 'unstocked' | 'unavailable'>('all');
  const [bulkPrice, setBulkPrice] = useState(0);

  const row = (id: string) => {
    const f = FILMS.find((x) => x.id === id)!;
    return draft[id] ?? { price: f.price, available: f.available, stocked: f.stocked, category: f.category };
  };
  const list = useMemo(() => FILMS.filter((f) => {
    const r = draft[f.id] ?? f;
    if (cat !== 'All' && r.category !== cat) return false;
    if (show === 'unstocked' && r.stocked) return false;
    if (show === 'unavailable' && r.available) return false;
    const s = q.trim().toLowerCase();
    return !s || f.name.toLowerCase().includes(s) || r.category.toLowerCase().includes(s) || f.id.includes(s);
  }), [draft, q, cat, show]);

  const shown = useStagger(FILMS.length);
  const patch = (id: string, p: Partial<ReturnType<typeof row>>) => setDraft({ ...draft, [id]: { ...row(id), ...p } });
  const bulk = (p: Partial<ReturnType<typeof row>>) => {
    const next = { ...draft };
    list.forEach((f) => { next[f.id] = { ...row(f.id), ...p }; });
    setDraft(next);
  };
  const counts = useMemo(() => {
    const rows = FILMS.map((f) => draft[f.id] ?? f);
    return { total: rows.length, unstocked: rows.filter((r) => !r.stocked).length, unavailable: rows.filter((r) => !r.available).length };
  }, [draft]);

  return (
    <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <Note tone="info">
        {counts.total} films · {counts.unstocked} special-order · {counts.unavailable} hidden. <strong>Unstocked films</strong> stay selectable but any helmet that uses one is routed to a workshop quote instead of automatic checkout.
        Swatches are illustrative placeholders until the real film photography is supplied.
      </Note>
      <div className="wf-toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search films" />
        <select className="select sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option>All</option>
          {FILM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="select sm" value={show} onChange={(e) => setShow(e.target.value as typeof show)} aria-label="Filter by stock">
          <option value="all">All films</option>
          <option value="unstocked">Special order only</option>
          <option value="unavailable">Hidden only</option>
        </select>
      </div>
      <div className="panel row" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="small"><strong>Bulk edit {list.length} shown:</strong></span>
        <button className="btn btn-ghost btn-xs" onClick={() => bulk({ stocked: true })}>Mark stocked</button>
        <button className="btn btn-ghost btn-xs" onClick={() => bulk({ stocked: false })}>Mark special order</button>
        <button className="btn btn-ghost btn-xs" onClick={() => bulk({ available: true })}>Show</button>
        <button className="btn btn-ghost btn-xs" onClick={() => bulk({ available: false })}>Hide</button>
        <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <MoneyInput value={bulkPrice} onChange={setBulkPrice} label="Bulk price" />
          <button className="btn btn-ghost btn-xs" onClick={() => bulk({ price: bulkPrice })}>Set price</button>
        </span>
      </div>
      <div className="table-wrap" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <table className="table wf-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr><th><span className="sr-only">Swatch</span></th><th>Film</th><th>Category</th><th>Price / zone</th><th>Available</th><th>Stocked</th></tr>
          </thead>
          <tbody>
            {list.map((f, idx) => {
              const r = row(f.id);
              return (
                <tr key={f.id} style={{ opacity: r.available ? 1 : 0.55 }}>
                  <td><FilmThumb film={f} className="wf-thumb" show={idx < shown} /></td>
                  <td><strong>{f.name}</strong><div className="tiny muted">{f.pattern}{f.tintable ? ' · tintable' : ''}</div></td>
                  <td>
                    <select className="select sm" value={r.category} onChange={(e) => patch(f.id, { category: e.target.value })} aria-label={`Category for ${f.name}`}>
                      {FILM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><MoneyInput value={r.price} onChange={(n) => patch(f.id, { price: n })} label={`Price for ${f.name}`} /></td>
                  <td><label className="check small"><input type="checkbox" checked={r.available} onChange={(e) => patch(f.id, { available: e.target.checked })} />{r.available ? 'Shown' : 'Hidden'}</label></td>
                  <td>
                    <label className="check small"><input type="checkbox" checked={r.stocked} onChange={(e) => patch(f.id, { stocked: e.target.checked })} />
                      {r.stocked ? 'In stock' : <span className="badge warn">Special order → quote</span>}
                    </label>
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={6} className="muted small" style={{ textAlign: 'center' }}>No films match.</td></tr>}
          </tbody>
        </table>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
