/* Controls for the PROPOSED 2D parts customiser (limited variations: a few effects x a few colours).
   Pricing values come from domain/parts (decisions awaiting client confirmation). */
import type { FontId, PartCustomSpec, PartCustomisation, Settings } from '@/core/types';
import { colourName } from '@/core/color';
import { filmThumb } from '@/core/filmRender';
import { money } from '@/core/util';
import { filmById } from '@/data/films';
import { Field, Icon, Note, Seg, Swatches, UploadButton } from '@/ui';
import { maskInfo, type PartLayout } from './partCanvas';

const FONTS: { id: FontId; label: string }[] = [
  { id: 'barlow', label: 'Barlow' },
  { id: 'anton', label: 'Anton' },
  { id: 'racing', label: 'Racing' },
];

export function PartCustomiser({ spec, custom, onChange, layout, onLayout, settings }: {
  spec: PartCustomSpec;
  custom: PartCustomisation;
  onChange: (c: PartCustomisation) => void;
  layout: PartLayout;
  onLayout: (l: PartLayout) => void;
  settings: Settings;
}) {
  const tray = spec.kind === 'tray-sticker';
  const colors: [string, string][] = spec.colors.map((h) => [colourName(h), h]);
  const set = (patch: Partial<PartCustomisation>) => onChange({ ...custom, ...patch });
  const { bbox } = maskInfo(spec.mask);
  const quoteArtwork = settings.parts.artworkHandling === 'quote';
  const effectFeeLabel = tray ? 'included in sticker price' : `+${money(settings.parts.effectFee)}`;

  return (
    <div className="stack pc" style={{ '--gap': '18px' } as React.CSSProperties}>
      <section className="pc-group" aria-labelledby="pc-colour">
        <div className="pc-head">
          <span id="pc-colour" className="label">{tray ? 'Sticker background colour' : 'Colour'}</span>
          <span className="tiny muted">{colourName(custom.color)}</span>
        </div>
        <Swatches colors={colors} value={custom.color} onChange={(color) => set({ color })} allowCustom={false} label={tray ? 'Sticker background colour' : 'Part colour'} />
      </section>

      <section className="pc-group" aria-labelledby="pc-effect">
        <div className="pc-head">
          <span id="pc-effect" className="label">{tray ? 'Background effect' : 'Hydro-dip effect'}</span>
          <span className="tiny muted">{custom.effect ? effectFeeLabel : 'Solid colour'}</span>
        </div>
        <div className="pc-effects" role="group" aria-label="Effect">
          <button type="button" className="pc-effect" aria-pressed={!custom.effect} onClick={() => set({ effect: null })}>
            <span className="pc-effect-sw" style={{ background: custom.color }} />
            <span>Solid</span>
          </button>
          {spec.effects.map((id) => {
            const f = filmById(id);
            if (!f) return null;
            return (
              <button key={id} type="button" className="pc-effect" aria-pressed={custom.effect === id} onClick={() => set({ effect: id })}>
                <img className="pc-effect-sw" src={filmThumb(f, custom.color, 96)} alt="" width={48} height={48} />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>
        <span className="tiny muted">Effects are tinted with your colour, e.g. carbon + blue = blue carbon. Swatches are illustrative.</span>
      </section>

      {spec.allowText && (
        <section className="pc-group" aria-labelledby="pc-text">
          <div className="pc-head">
            <span id="pc-text" className="label">{tray ? 'Team name / text' : 'Custom text'}</span>
            <span className="tiny muted">{custom.text.trim() ? `+${money(settings.parts.textFee)}` : 'Optional'}</span>
          </div>
          <input className="input" value={custom.text} maxLength={24} placeholder={tray ? 'e.g. LUCAS RACING' : 'e.g. driver name or number'}
            onChange={(e) => set({ text: e.target.value })} aria-label="Custom text" />
          {custom.text.trim() && (
            <>
              <div className="row">
                <Seg options={FONTS} value={layout.textFont} onChange={(textFont) => onLayout({ ...layout, textFont })} label="Text font" />
              </div>
              <div className="field">
                <span className="label">Text colour</span>
                <Swatches colors={colors} value={custom.textColor} onChange={(textColor) => set({ textColor })} allowCustom={false} label="Text colour" />
              </div>
              <div className="pc-sliders">
                <Slider label="Text size" min={12} max={80} value={layout.textSize} onChange={(v) => onLayout({ ...layout, textSize: v })} />
                <Slider label="Left / right" min={bbox.x} max={bbox.x + bbox.w} value={layout.textX} onChange={(v) => onLayout({ ...layout, textX: v })} />
                <Slider label="Up / down" min={bbox.y} max={bbox.y + bbox.h} value={layout.textY} onChange={(v) => onLayout({ ...layout, textY: v })} />
              </div>
            </>
          )}
        </section>
      )}

      {spec.allowArtwork && (
        <section className="pc-group" aria-labelledby="pc-art">
          <div className="pc-head">
            <span id="pc-art" className="label">{tray ? 'Logo / artwork' : 'Custom artwork'}</span>
            <span className="tiny muted">{custom.artwork ? (quoteArtwork ? 'Workshop quote' : `+${money(settings.parts.artworkFee)}`) : 'Optional'}</span>
          </div>
          {custom.artwork ? (
            <>
              <div className="row nowrap pc-art-row">
                <img src={custom.artwork.src} alt="" className="pc-art-thumb" width={44} height={44} />
                <span className="grow small pc-art-name">{custom.artwork.name}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => set({ artwork: null })}><Icon name="trash" size={14} />Remove</button>
              </div>
              <div className="pc-sliders">
                <Slider label="Artwork size" min={24} max={Math.max(60, Math.round(bbox.w))} value={layout.artSize} onChange={(v) => onLayout({ ...layout, artSize: v })} />
                <Slider label="Left / right" min={bbox.x} max={bbox.x + bbox.w} value={layout.artX} onChange={(v) => onLayout({ ...layout, artX: v })} />
                <Slider label="Up / down" min={bbox.y} max={bbox.y + bbox.h} value={layout.artY} onChange={(v) => onLayout({ ...layout, artY: v })} />
              </div>
            </>
          ) : (
            <div>
              <UploadButton onFiles={(f) => f[0] && set({ artwork: f[0] })} maxDim={800}>Upload logo or artwork</UploadButton>
            </div>
          )}
          {quoteArtwork
            ? <Note tone="info">Custom artwork goes to the workshop for a quote. You can still check out; the artwork element is confirmed and priced by the workshop afterwards.</Note>
            : <span className="tiny muted">Artwork is clipped to the printable surface and checked by the workshop before production.</span>}
        </section>
      )}
    </div>
  );
}

function Slider({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input type="range" min={Math.round(min)} max={Math.round(max)} step={1} value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  );
}
