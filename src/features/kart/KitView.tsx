/* "Complete kit" preview: the full kit sheet plus clickable panel thumbnails. */
import { useMemo } from 'react';
import type { KartDesign, PanelId } from '@/core/types';
import { renderPanelCanvas } from '@/core/kartRender';
import { PANELS } from '@/data/kart';
import { useKitSheet } from './useKartRender';

export function KitView({ design, holographic, tick, onPick }: { design: KartDesign; holographic: boolean; tick: number; onPick: (p: PanelId) => void }) {
  const sheet = useKitSheet(design, { holographic, width: 1400 });
  const thumbs = useMemo(
    () => Object.fromEntries(PANELS.map((p) => [p.id, renderPanelCanvas(design, p.id, 360, { holographic }).toDataURL('image/png')])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, holographic, tick],
  );
  return (
    <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
      <div className="kv-sheet">
        {sheet ? <img src={sheet} alt={`Complete kit preview: ${design.name}`} /> : <div className="kv-loading">Rendering kit…</div>}
        {holographic && <span className="wm-tag">Holographic preview</span>}
      </div>
      <div className="kv-thumbs" role="group" aria-label="Choose a panel to edit">
        {PANELS.map((p) => (
          <button key={p.id} type="button" className="kv-thumb" onClick={() => onPick(p.id)}>
            <span className="kv-thumb-img"><img src={thumbs[p.id]} alt="" /></span>
            <span className="tiny"><strong>{p.short}</strong> · edit</span>
          </button>
        ))}
      </div>
    </div>
  );
}
