/* Kart parts catalogue (SAMPLE data: no live MS Kart / ABRA supplier connection). */
import { useMemo, useState } from 'react';
import { PART_CATEGORIES, PRODUCTS } from '@/data/parts';
import { productPrice } from '@/domain/parts';
import { useSettings } from '@/store';
import { Empty, Icon, Note, PageHead, ScopeBadge, SimBadge } from '@/ui';
import { ProductCard } from './shopUi';
import './shop.css';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

export default function PartsPage() {
  const settings = useSettings();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [customOnly, setCustomOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('featured');

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of PRODUCTS) if (!customOnly || p.custom) m[p.category] = (m[p.category] || 0) + 1;
    return m;
  }, [customOnly]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = PRODUCTS.filter((p) =>
      (cat === 'All' || p.category === cat) &&
      (!customOnly || !!p.custom) &&
      (!needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)));
    const price = (id: string) => productPrice(PRODUCTS.find((p) => p.id === id)!, settings);
    if (sort === 'price-asc') out.sort((a, b) => price(a.id) - price(b.id));
    if (sort === 'price-desc') out.sort((a, b) => price(b.id) - price(a.id));
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [q, cat, customOnly, sort, settings]);

  const customCount = PRODUCTS.filter((p) => p.custom).length;
  const total = customOnly ? PRODUCTS.filter((p) => p.custom).length : PRODUCTS.length;

  return (
    <div className="wrap page shop">
      <PageHead eyebrow="MS Kart parts" title="Kart parts">
        Chassis, components and spares. Selected plastics, seats and the trolley floor tray can be personalised with a simple 2D customiser.
      </PageHead>

      <Note tone="sim" className="shop-banner">
        <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <SimBadge>Sample catalogue</SimBadge>
          <span>Sample catalogue: products, SKUs and prices are placeholders. There is no live MS Kart/ABRA supplier connection until an authorised feed is supplied.</span>
        </span>
      </Note>

      <div className="shop-toolbar">
        <div className="shop-search">
          <Icon name="search" size={16} className="shop-search-ico" />
          <input className="input" type="search" placeholder="Search parts, SKUs or categories" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parts" />
        </div>
        <label className="check shop-toggle">
          <input type="checkbox" checked={customOnly} onChange={(e) => setCustomOnly(e.target.checked)} />
          Customisable only <span className="muted">({customCount})</span>
        </label>
        <label className="shop-sort">
          <span className="sr-only">Sort</span>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
            <option value="featured">Sort: featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      <div className="chips shop-cats" role="group" aria-label="Filter by category">
        <button type="button" className="chip" aria-pressed={cat === 'All'} onClick={() => setCat('All')}>All <span className="chip-n">{total}</span></button>
        {PART_CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)} disabled={!counts[c]}>
            {c} <span className="chip-n">{counts[c] || 0}</span>
          </button>
        ))}
      </div>

      {customOnly && (
        <div className="row shop-proposed">
          <ScopeBadge tag="proposed" />
          <span className="small muted">2D part customisation is a proposed addition awaiting client confirmation.</span>
        </div>
      )}

      <div className="row between shop-count">
        <span className="small muted" aria-live="polite">{list.length} {list.length === 1 ? 'product' : 'products'}{cat !== 'All' ? ` in ${cat}` : ''}</span>
      </div>

      {list.length ? (
        <div className="shop-grid">
          {list.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}
        </div>
      ) : (
        <Empty title="No parts match" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setCat('All'); setCustomOnly(false); }}>Clear filters</button>}>
          Try a different search or category.
        </Empty>
      )}
    </div>
  );
}
