/* 20 kit templates with live thumbnails, plus kit colour recolouring. */
import { useMemo, useState } from 'react';
import type { KartDesign, KartTemplate } from '@/core/types';
import { renderPanelCanvas } from '@/core/kartRender';
import { colourName } from '@/core/color';
import { bodyworkById, KART_TEMPLATES } from '@/data/kart';
import { Icon, Swatches } from '@/ui';
import { replaceColour, topColours, type DesignUpdater } from './kartEdit';
import type { SetOpts } from './useHistory';

function templateThumbs(bodyworkId: string) {
  const bw = bodyworkById(bodyworkId);
  const t = new Date().toISOString();
  return Object.fromEntries(KART_TEMPLATES.map((tpl) => {
    const d: KartDesign = { id: 'thumb', name: tpl.name, ownerId: null, bodyworkId: bw.id, templateId: tpl.id, source: 'template', panels: tpl.build(bw, tpl.colors), uploads: {}, createdAt: t, updatedAt: t };
    const c = renderPanelCanvas(d, 'leftPod', 320);
    return [tpl.id, c.toDataURL('image/png')];
  }));
}

export function TemplatePicker({ design, tick, onApply, onChange }: {
  design: KartDesign; tick: number; onApply: (t: KartTemplate) => void; onChange: (fn: DesignUpdater, opts?: SetOpts) => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const thumbs = useMemo(() => templateThumbs(design.bodyworkId), [design.bodyworkId, tick]);
  const colours = useMemo(() => topColours(design, 3), [design]);
  const [slot, setSlot] = useState(0);
  const active = colours[Math.min(slot, colours.length - 1)] || null;

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="panel stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <span className="label">Kit colours</span>
          <span className="tiny muted">Recolours every panel</span>
        </div>
        {colours.length ? (
          <>
            <div className="ke-slots" role="group" aria-label="Choose a kit colour to change">
              {colours.map((c, i) => (
                <button key={i} type="button" className="ke-slot" aria-pressed={i === slot} onClick={() => setSlot(i)}>
                  <span className="ke-slot-sw" style={{ background: c }} />
                  <span className="tiny"><strong>Colour {i + 1}</strong><br /><span className="muted">{colourName(c)}</span></span>
                </button>
              ))}
            </div>
            {active && (
              <Swatches label={`Replace colour ${slot + 1}`} value={active} onChange={(hex) => {
                if (hex.toLowerCase() === active.toLowerCase()) return;
                onChange((d) => replaceColour(d, active, hex), { key: `recolour:${slot}` });
              }} />
            )}
          </>
        ) : <p className="tiny muted">Apply a template or add layers to recolour the kit.</p>}
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 10 }}>
          <span className="label">{KART_TEMPLATES.length} templates</span>
          <span className="tiny muted">Applying replaces all four panels (undo with Ctrl+Z)</span>
        </div>
        <div className="ke-tpls">
          {KART_TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="ke-tpl" aria-pressed={design.templateId === t.id} onClick={() => onApply(t)} aria-label={`Apply ${t.name} template`}>
              <img src={thumbs[t.id]} alt="" width={320} height={109} loading="lazy" />
              <span className="ke-tpl-meta">
                <span className="ke-tpl-name">{t.name}</span>
                <span className="ke-tpl-cols" aria-hidden="true">{t.colors.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              </span>
              {design.templateId === t.id && <span className="ke-tpl-on"><Icon name="check" size={13} /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
