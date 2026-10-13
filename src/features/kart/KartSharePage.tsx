/* /kart-share/:id: view-only, watermarked snapshot of a shared kart sticker kit. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { KartDesign, ShareLink } from '@/core/types';
import type { Doc } from '@/store/backend';
import { fmtDate } from '@/core/util';
import { bodyworkById, PANELS } from '@/data/kart';
import { getDoc } from '@/store';
import { Empty, Icon, Note, ScopeBadge } from '@/ui';
import { panelDataUrl, UNPAID_WATERMARK, useKitSheet, useRenderTick } from './useKartRender';
import './kart.css';

export default function KartSharePage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<{ status: 'loading' | 'missing' | 'ok'; link?: ShareLink }>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    getDoc<Doc>('shares', id)
      .then((d) => {
        if (!alive) return;
        const link = d as unknown as ShareLink | null;
        if (!link || link.kind !== 'kart' || !link.designSnapshot) setState({ status: 'missing' });
        else setState({ status: 'ok', link });
      })
      .catch(() => alive && setState({ status: 'missing' }));
    return () => { alive = false; };
  }, [id]);

  const design = state.link ? (state.link.designSnapshot as KartDesign) : null;
  const tick = useRenderTick(design);
  const sheet = useKitSheet(design, { width: 1600, watermark: UNPAID_WATERMARK });
  const panels = useMemo(
    () => (design ? PANELS.map((p) => ({ ...p, src: panelDataUrl(design, p.id, 720, { watermark: UNPAID_WATERMARK }) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, tick],
  );

  if (state.status === 'loading') return <div className="wrap page"><div className="muted">Loading shared kit…</div></div>;
  if (state.status === 'missing' || !design) {
    return (
      <div className="wrap page">
        <Empty title="Shared kit not found" action={<Link to="/stickers/build" className="btn btn-primary">Create your own<Icon name="arrow" /></Link>}>
          This link may be mistyped, or the snapshot was removed.
        </Empty>
      </div>
    );
  }

  return (
    <div className="wrap page kart-page">
      <div className="page-head">
        <div style={{ maxWidth: 760 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="badge dark"><Icon name="eye" size={13} />View only</span>
            <ScopeBadge tag="future" />
          </div>
          <h1 className="h2">{design.name}</h1>
          <p className="small muted" style={{ marginTop: 6 }}>Kart sticker kit · {bodyworkById(design.bodyworkId).name} · shared {fmtDate(state.link!.createdAt)}</p>
        </div>
        <Link to="/stickers/build" className="btn btn-primary btn-lg">Create your own<Icon name="arrow" /></Link>
      </div>

      <div className="kv-sheet card" style={{ padding: 12 }}>
        {sheet ? <img src={sheet} alt={`Complete kit: ${design.name}`} /> : <div className="kv-loading">Rendering kit…</div>}
        <span className="wm-tag">Watermarked preview</span>
      </div>

      <h2 className="h4" style={{ margin: '28px 0 12px' }}>Panels</h2>
      <div className="grid g2 ksh-panels">
        {panels.map((p) => (
          <figure key={p.id} className="card ksh-panel">
            <img src={p.src} alt={`${p.name} preview`} />
            <figcaption className="small"><strong>{p.name}</strong></figcaption>
          </figure>
        ))}
      </div>

      <Note tone="info" className="ksh-note">This is a read-only snapshot. Panel outlines are illustrative and not dimensionally accurate; supplied cutting outlines replace them before production.</Note>
    </div>
  );
}
