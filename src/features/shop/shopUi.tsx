/* Small shop building blocks shared by the catalogue, product and basket pages. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Settings } from '@/core/types';
import { money, uid } from '@/core/util';
import { productPrice } from '@/domain/parts';
import { toast, useBasket } from '@/store';
import { Icon, ProductArt, ScopeBadge } from '@/ui';

export function QtyStepper({ value, onChange, min = 1, max = 99, label = 'Quantity', size = 'md' }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; label?: string; size?: 'sm' | 'md';
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n) || min));
  return (
    <div className={'qty' + (size === 'sm' ? ' sm' : '')} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease quantity"><Icon name="minus" size={14} /></button>
      <input type="number" inputMode="numeric" min={min} max={max} value={value} aria-label={label}
        onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase quantity"><Icon name="plus" size={14} /></button>
    </div>
  );
}

/** Add a standard (uncustomised) part, merging with an existing standard line of the same product. */
export function useAddStandardPart() {
  const basket = useBasket();
  return (p: Product, settings: Settings, qty: number) => {
    const existing = basket.items.find((i) => i.type === 'part' && i.productId === p.id && !i.custom);
    if (existing) basket.setQty(existing.id, existing.qty + qty);
    else basket.add({ type: 'part', id: uid('bi_'), productId: p.id, name: p.name, price: productPrice(p, settings), qty, custom: null, customFee: 0, needsQuote: false });
    toast(`${qty} × ${p.name} added to basket`);
  };
}

export function ProductCard({ product: p, settings }: { product: Product; settings: Settings }) {
  const [qty, setQty] = useState(1);
  const add = useAddStandardPart();
  const href = `/parts/${p.id}`;
  return (
    <article className="p-card card">
      <Link to={href} className="p-art" aria-label={`${p.name}: view details`}>
        <ProductArt icon={p.icon} className="p-art-svg" />
        <span className="p-flags">
          {p.custom && <span className="badge dark"><Icon name="brush" size={12} />Customisable</span>}
        </span>
      </Link>
      <div className="p-body">
        <div className="tiny muted mono">{p.sku} · {p.category}</div>
        <h3 className="p-name"><Link to={href}>{p.name}</Link></h3>
        {p.custom && <div><ScopeBadge tag="proposed">2D customiser · proposed</ScopeBadge></div>}
        <div className="p-price-row">
          <span className="p-price">{money(productPrice(p, settings))}</span>
          <span className="tiny muted">sample price</span>
        </div>
      </div>
      <div className="p-foot">
        {p.custom ? (
          <Link to={href} className="btn btn-primary btn-sm btn-block"><Icon name="brush" size={15} />Customise</Link>
        ) : (
          <div className="row nowrap p-buy">
            <QtyStepper value={qty} onChange={setQty} size="sm" label={`Quantity of ${p.name}`} />
            <button type="button" className="btn btn-dark btn-sm grow" onClick={() => { add(p, settings, qty); setQty(1); }}>
              <Icon name="basket" size={15} />Add
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
