/* Edit tools for the selected panel: add shapes/text/logos, freehand, layer list and properties, panel background, artwork upload. */
import type { FontId, KartDesign, KartLayer, PanelId } from '@/core/types';
import { FONT_LABEL, uid } from '@/core/util';
import { PALETTE } from '@/core/color';
import { PANEL_BOX, PANELS } from '@/data/kart';
import { Icon, Note, Swatches, UploadButton } from '@/ui';
import {
  addLayer, contrastOn, duplicateLayer, imageAspect, LAYER_TYPE_ICON, layerColor, layerLabel, mapLayer, mapPanel, NAME_LAYER, newImage, newShape, newText,
  NUMBER_LAYER, removeLayer, reorderLayer, type DesignUpdater,
} from './kartEdit';
import type { SetOpts } from './useHistory';
import type { Tool } from './PanelEditor';

interface Props {
  design: KartDesign;
  panel: PanelId;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (fn: DesignUpdater, opts?: SetOpts) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  brush: { width: number; color: string };
  setBrush: (b: { width: number; color: string }) => void;
  onMirror: () => void;
}

export function Range({ label, value, min, max, step = 1, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="ke-range">
      <span className="label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      <output className="tiny mono">{Math.round(value)}{unit}</output>
    </label>
  );
}

export function LayerPanel({ design, panel, selectedId, onSelect, onChange, tool, setTool, brush, setBrush, onMirror }: Props) {
  const pd = design.panels[panel];
  const box = PANEL_BOX[panel];
  const selected = pd.layers.find((l) => l.id === selectedId) || null;
  const accent = contrastOn(pd.background, '#e3262b', '#c8f031');

  const add = (l: KartLayer) => {
    onChange((d) => addLayer(d, panel, l));
    onSelect(l.id);
    setTool('select');
  };

  const patch = (prop: string, fn: (l: KartLayer) => KartLayer) => {
    if (!selected) return;
    onChange((d) => mapLayer(d, panel, selected.id, fn), { key: `${selected.id}:${prop}` });
  };

  const panelName = PANELS.find((p) => p.id === panel)!.name;
  const upload = design.uploads[panel];

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      {/* ---------- add ---------- */}
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <div className="label">Add to {panelName.toLowerCase()}</div>
        <div className="ke-addgrid">
          <button type="button" className="ke-add" onClick={() => add(newShape('rect', panel, accent))}><span className="ke-glyph g-rect" aria-hidden="true" />Rectangle</button>
          <button type="button" className="ke-add" onClick={() => add(newShape('ellipse', panel, accent))}><span className="ke-glyph g-ellipse" aria-hidden="true" />Ellipse</button>
          <button type="button" className="ke-add" onClick={() => add(newShape('triangle', panel, accent))}><span className="ke-glyph g-tri" aria-hidden="true" />Chevron</button>
          <button type="button" className="ke-add" onClick={() => add(newShape('stripe', panel, accent))}><span className="ke-glyph g-stripe" aria-hidden="true" />Stripe</button>
          <button type="button" className="ke-add" onClick={() => add(newText(panel, 'TEXT', contrastOn(pd.background)))}><Icon name="text" />Text</button>
          <UploadButton className="ke-add" onFiles={async (fs) => {
            const f = fs[0];
            if (!f) return;
            add(newImage(panel, f.src, await imageAspect(f.src), f.name));
          }}>Logo</UploadButton>
          <button type="button" className="ke-add" aria-pressed={tool === 'draw'} onClick={() => { setTool(tool === 'draw' ? 'select' : 'draw'); onSelect(null); }}><Icon name="brush" />{tool === 'draw' ? 'Drawing…' : 'Draw'}</button>
        </div>
      </div>

      {tool === 'draw' && (
        <div className="panel stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="row between"><strong className="small">Freehand brush</strong><button type="button" className="btn btn-dark btn-xs" onClick={() => setTool('select')}><Icon name="check" />Done</button></div>
          <Range label="Brush width" value={brush.width} min={2} max={80} onChange={(w) => setBrush({ ...brush, width: w })} />
          <Swatches label="Brush colour" value={brush.color} onChange={(c) => setBrush({ ...brush, color: c })} />
          <p className="tiny muted">Drag on the panel to draw. Each stroke becomes its own layer you can move, resize or remove.</p>
        </div>
      )}

      {/* ---------- selected layer ---------- */}
      {selected && tool === 'select' && (
        <div className="panel stack ke-props" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div className="row between nowrap">
            <strong className="small ke-ellipsis">{layerLabel(selected)}</strong>
            <div className="row nowrap" style={{ '--gap': '4px' } as React.CSSProperties}>
              <button type="button" className="icon-btn ke-ib" title="Bring forward" aria-label="Bring forward" onClick={() => onChange((d) => reorderLayer(d, panel, selected.id, 1))}><Icon name="arrow" className="rot-up" /></button>
              <button type="button" className="icon-btn ke-ib" title="Send backward" aria-label="Send backward" onClick={() => onChange((d) => reorderLayer(d, panel, selected.id, -1))}><Icon name="arrow" className="rot-down" /></button>
              <button type="button" className="icon-btn ke-ib" title="Duplicate" aria-label="Duplicate layer" onClick={() => {
                const newId = uid('l');
                onChange((d) => duplicateLayer(d, panel, selected.id, newId));
                onSelect(newId);
              }}><Icon name="copy" /></button>
              <button type="button" className="icon-btn ke-ib danger" title="Remove layer" aria-label="Remove layer" onClick={() => { onChange((d) => removeLayer(d, panel, selected.id)); onSelect(null); }}><Icon name="trash" /></button>
            </div>
          </div>

          {selected.type === 'text' && (
            <>
              <label className="field">
                <span className="label">Text{selected.name === NAME_LAYER || selected.name === NUMBER_LAYER ? ` (${selected.name.toLowerCase()})` : ''}</span>
                <input className="input sm" value={selected.text} maxLength={40} onChange={(e) => patch('text', (l) => (l.type === 'text' ? { ...l, text: e.target.value } : l))} />
              </label>
              <label className="field">
                <span className="label">Font</span>
                <select className="select sm" value={selected.font} onChange={(e) => patch('font', (l) => (l.type === 'text' ? { ...l, font: e.target.value as FontId } : l))}>
                  {Object.entries(FONT_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <Range label="Size" value={selected.size} min={12} max={Math.round(box.h * 0.9)} onChange={(v) => patch('size', (l) => (l.type === 'text' ? { ...l, size: v } : l))} />
            </>
          )}

          {(selected.type === 'rect' || selected.type === 'ellipse' || selected.type === 'triangle' || selected.type === 'stripe') && (
            <>
              <Range label="Width" value={selected.w} min={6} max={Math.round(box.w * 1.3)} onChange={(v) => patch('w', (l) => ('w' in l ? { ...l, w: v } : l))} />
              <Range label="Height" value={selected.h} min={4} max={Math.round(box.h * 1.3)} onChange={(v) => patch('h', (l) => ('h' in l ? { ...l, h: v } : l))} />
            </>
          )}

          {selected.type === 'image' && (
            <Range label="Size" value={selected.w} min={20} max={Math.round(box.w)} onChange={(v) => patch('w', (l) => (l.type === 'image' ? { ...l, w: v, h: Math.round((l.h / Math.max(1, l.w)) * v) } : l))} />
          )}

          {selected.type === 'path' && (
            <Range label="Line width" value={selected.width} min={2} max={80} onChange={(v) => patch('width', (l) => (l.type === 'path' ? { ...l, width: v } : l))} />
          )}

          {selected.type !== 'path' && (
            <>
              <Range label="Rotation" value={selected.rotation} min={-180} max={180} unit="°" onChange={(v) => patch('rotation', (l) => (l.type === 'path' ? l : { ...l, rotation: v }))} />
              <div className="grid g2" style={{ '--gap': '10px' } as React.CSSProperties}>
                <Range label="Position X" value={selected.x} min={0} max={box.w} onChange={(v) => patch('x', (l) => (l.type === 'path' ? l : { ...l, x: v }))} />
                <Range label="Position Y" value={selected.y} min={0} max={box.h} onChange={(v) => patch('y', (l) => (l.type === 'path' ? l : { ...l, y: v }))} />
              </div>
            </>
          )}

          {selected.type !== 'image' && (
            <div className="field">
              <span className="label">Colour</span>
              <Swatches label="Layer colour" value={selected.color} onChange={(c) => patch('color', (l) => (l.type === 'image' ? l : { ...l, color: c }))} />
            </div>
          )}

          {selected.type === 'text' && (
            <div className="field">
              <label className="check small">
                <input type="checkbox" checked={!!selected.outline} onChange={(e) => patch('outline-on', (l) => (l.type === 'text' ? { ...l, outline: e.target.checked ? contrastOn(l.color) : null } : l))} />
                Outline
              </label>
              {selected.outline && <Swatches label="Outline colour" value={selected.outline} onChange={(c) => patch('outline', (l) => (l.type === 'text' ? { ...l, outline: c } : l))} />}
            </div>
          )}
          <p className="tiny muted">Tip: drag on the canvas to move, use the corner handle to resize and the round handle to rotate (hold Shift to snap).</p>
        </div>
      )}

      {/* ---------- layers ---------- */}
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <div className="row between"><span className="label">Layers ({pd.layers.length})</span>{selected && <button type="button" className="btn-link tiny" onClick={() => onSelect(null)}>Deselect</button>}</div>
        {pd.layers.length ? (
          <ul className="ke-layers" aria-label={`${panelName} layers, top first`}>
            {[...pd.layers].reverse().map((l) => {
              const c = layerColor(l);
              return (
                <li key={l.id}>
                  <button type="button" aria-pressed={l.id === selectedId} onClick={() => { setTool('select'); onSelect(l.id); }}>
                    <Icon name={LAYER_TYPE_ICON[l.type]} size={15} />
                    <span className="grow ke-ellipsis">{layerLabel(l)}</span>
                    {c ? <span className="ke-dot" style={{ background: c }} aria-hidden="true" /> : <img src={(l as { src: string }).src} alt="" className="ke-mini" />}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p className="tiny muted">No layers yet: add a shape, text or logo above, or apply a template.</p>}
      </div>

      {/* ---------- panel ---------- */}
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="label">{panelName} background</span>
        <Swatches label="Panel background" colors={PALETTE} value={pd.background} onChange={(c) => onChange((d) => mapPanel(d, panel, (p) => ({ ...p, background: c })), { key: `bg:${panel}` })} />
        {(panel === 'leftPod' || panel === 'rightPod') && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onMirror}><Icon name="copy" />Copy left pod to right pod (mirrored)</button>
        )}
      </div>

      <div className="stack ke-upload" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="label">Complete artwork for this panel</span>
        <p className="tiny muted">Already have finished artwork? Upload it for the {panelName.toLowerCase()}: it fills the panel underneath any layers.</p>
        {upload ? (
          <div className="row nowrap">
            <img src={upload.src} alt="" className="ke-upthumb" />
            <span className="grow small ke-ellipsis">{upload.name}</span>
            <button type="button" className="btn btn-danger btn-xs" onClick={() => onChange((d) => { const u = { ...d.uploads }; delete u[panel]; return { ...d, uploads: u }; })}>Remove</button>
          </div>
        ) : (
          <UploadButton maxDim={1600} onFiles={(fs) => fs[0] && onChange((d) => ({ ...d, source: 'upload', uploads: { ...d.uploads, [panel]: { src: fs[0].src, name: fs[0].name } } }))}>Upload artwork</UploadButton>
        )}
        <Note tone="info">Your own artwork keeps automatic kit pricing; we check it after payment.</Note>
      </div>
    </div>
  );
}
