/* Step 2: design source: templates, from scratch, uploaded artwork, simulated AI concepts. */
import { useState } from 'react';
import type { DesignSource, HelmetDesign, Paint } from '@/core/types';
import { HELMET_TEMPLATES, templateById } from '@/data/helmets';
import { applyTemplate, newHelmetDesign, toScratch } from '@/domain/helmet';
import { renderUVLayout } from '@/core/helmetPaint';
import { money } from '@/core/util';
import { useMode, useSettings } from '@/store';
import { downloadDataUrl, Icon, Note, ScopeBadge, SimBadge, Tabs, UploadButton } from '@/ui';
import { templateThumb, useHelmetThumb } from '../thumbs';
import { generateConcepts, type AiConcept } from '../aiConcepts';
import { ZoneEditor } from './ZoneEditor';
import { DrawingBoard, LayerList } from './DrawingBoard';
import { PaintPicker } from './PaintPicker';

type Tab = 'templates' | 'scratch' | 'upload' | 'ai';
const tabFor = (s: DesignSource): Tab => (s === 'template' ? 'templates' : s === 'scratch' ? 'scratch' : s === 'upload' ? 'upload' : 'ai');

/** Keep the customer's personalisation when the visual source changes. */
const keepPersonal = (from: HelmetDesign, to: HelmetDesign): HelmetDesign => ({
  ...to, id: from.id, name: from.name, ownerId: from.ownerId, modelId: from.modelId, texts: from.texts, logos: from.logos,
  trims: from.trims, spoiler: from.spoiler, supply: from.supply, finish: from.finish, chrome: from.chrome, createdAt: from.createdAt,
});

export function StepDesign({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const { full } = useMode();
  const [picked, setTab] = useState<Tab>(() => tabFor(design.source));
  // AI concepts only exist in the full-specification preview.
  const tab: Tab = picked === 'ai' && !full ? 'templates' : picked;
  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: 'templates', label: 'Templates' },
    { id: 'scratch', label: 'From scratch' },
    { id: 'upload', label: 'Upload artwork' },
  ];
  if (full) tabs.push({ id: 'ai', label: <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>AI concepts <ScopeBadge tag="future" /></span> });

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Design source" />
      {tab === 'templates' && <TemplatesTab design={design} onChange={onChange} />}
      {tab === 'scratch' && <ScratchTab design={design} onChange={onChange} />}
      {tab === 'upload' && <UploadTab design={design} onChange={onChange} />}
      {tab === 'ai' && <AiTab design={design} onChange={onChange} />}
    </div>
  );
}

/* ---------------- templates ---------------- */
function TemplatesTab({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const { full } = useMode();
  const settings = useSettings();
  const list = HELMET_TEMPLATES.filter((t) => full || t.launch);
  const active = design.source === 'template' ? design.templateId : null;
  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <div className="row between">
        <span className="small muted">{list.length} {full ? 'layouts in the full collection' : 'launch layouts'} · names, logos and trims are kept when you switch</span>
      </div>
      <div className="tpl-grid">
        {list.map((t) => (
          <button key={t.id} type="button" className="tpl-card" aria-pressed={active === t.id} onClick={() => onChange(applyTemplate(design, t))}>
            <img src={templateThumb(t)} alt="" width={200} height={164} />
            <span className="tpl-meta">
              <strong>{t.name}</strong>
              <span className="tiny muted">From {money(settings.helmet.templatePrices[t.id] ?? t.startPrice)}</span>
            </span>
            {!t.launch && <span className="badge future tpl-badge">Full collection</span>}
          </button>
        ))}
      </div>
      {active ? (
        <>
          <div>
            <h3 className="h4">Edit zones · {templateById(active)?.name}</h3>
            <p className="small muted">{templateById(active)?.description} Click a zone on the flat layout or in the list, then pick a colour or film.</p>
          </div>
          <ZoneEditor design={design} onChange={onChange} />
          <div className="panel">
            <div className="label" style={{ marginBottom: 8 }}>Base paint</div>
            <PaintPicker label="Base" value={design.basePaint} onChange={(p) => onChange({ ...design, basePaint: p })} />
          </div>
        </>
      ) : (
        <Note tone="info">Your current design isn't template-based. Choosing a template replaces the graphic (names, numbers, logos and trims stay).</Note>
      )}
    </div>
  );
}

/* ---------------- from scratch ---------------- */
function ScratchTab({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  if (design.source !== 'scratch') {
    return (
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <div className="card pad flat stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <h3 className="h4">Design it yourself</h3>
          <p className="small muted">Start with a blank shell and draw freehand strokes, stripes, rectangles and ellipses in colour or hydro-dip film. Every mark appears on the 3D helmet as you draw.</p>
          <div><button type="button" className="btn btn-dark" onClick={() => onChange(toScratch(design))}><Icon name="brush" />Start from a blank shell</button></div>
        </div>
        <Note>From-scratch designs go to workshop review and are priced by quote.</Note>
      </div>
    );
  }
  return (
    <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <Note>From-scratch designs go to workshop review and are priced by quote. The flat board is the helmet unwrapped: rear at both ends, the face in the middle.</Note>
      <DrawingBoard design={design} onChange={onChange} />
      <div className="panel">
        <div className="label" style={{ marginBottom: 8 }}>Shell base</div>
        <PaintPicker label="Base" value={design.basePaint} onChange={(p) => onChange({ ...design, basePaint: p })} allowCustomFilm />
      </div>
    </div>
  );
}

/* ---------------- uploads ---------------- */
function UploadTab({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const tpl = templateById(design.templateId);
  const [target, setTarget] = useState<string>('base');
  const uvTemplate = () => {
    const blank = { ...newHelmetDesign(design.modelId, null), texts: [] };
    downloadDataUrl(renderUVLayout(blank, { labels: true, scale: 1 }).toDataURL('image/png'), 'lucas-racing-helmet-uv-template.png');
  };
  const setArtwork = (src: string, name: string) => onChange({ ...design, source: 'upload', templateId: null, zonePaints: {}, drawing: [], ai: null, artwork: { src, name } });
  const removeArtwork = () => onChange(applyTemplate({ ...design, artwork: null }, HELMET_TEMPLATES[0]));
  const applyFilm = (p: Paint) => {
    if (target === 'base' || !tpl || design.source !== 'template') onChange({ ...design, basePaint: p });
    else onChange({ ...design, zonePaints: { ...design.zonePaints, [target]: p } });
  };

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <section className="card pad flat stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <h3 className="h4">Upload a complete design</h3>
        <p className="small muted">Your image wraps the whole shell using the flat layout (2:1, rear at both edges, face in the centre). Names, numbers and logos still sit on top.</p>
        {design.artwork ? (
          <div className="paint-film">
            <img src={design.artwork.src} alt="" width={96} height={48} style={{ width: 96, height: 48, objectFit: 'cover', borderRadius: 6 }} />
            <div className="grow"><strong className="small">{design.artwork.name}</strong><div className="tiny muted">Wrapped over the full shell</div></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={removeArtwork}>Remove</button>
          </div>
        ) : null}
        <div className="row">
          <UploadButton className="btn btn-dark btn-sm" maxDim={2048} onFiles={(f) => f[0] && setArtwork(f[0].src, f[0].name)}>{design.artwork ? 'Replace artwork' : 'Upload artwork'}</UploadButton>
          <button type="button" className="btn btn-ghost btn-sm" onClick={uvTemplate}><Icon name="download" />UV layout guide</button>
        </div>
        <Note>Uploaded complete designs go to the workshop for review and a quote.</Note>
      </section>

      <section className="card pad flat stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <h3 className="h4">Use your own hydro-dip film imagery</h3>
        <p className="small muted">Have a film print you want us to source or print? Upload the pattern and preview it on the base or a template zone.</p>
        <label className="field">
          <span className="label">Apply to</span>
          <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="base">Whole base</option>
            {design.source === 'template' && tpl?.zones.map((z) => <option key={z.id} value={z.id}>Zone: {z.name}</option>)}
          </select>
        </label>
        <div><UploadButton onFiles={(f) => f[0] && applyFilm({ kind: 'custom-film', src: f[0].src, name: f[0].name })}>Upload film image</UploadButton></div>
        <Note>Customer-supplied film imagery always routes to a workshop quote.</Note>
      </section>
    </div>
  );
}

/* ---------------- AI (simulated, future phase) ---------------- */
function ConceptCard({ c, active, onUse }: { c: AiConcept; active: boolean; onUse: () => void }) {
  const thumb = useHelmetThumb(c.design, 220);
  return (
    <div className="tpl-card as-div" aria-current={active || undefined}>
      <img src={thumb} alt="" width={220} height={180} />
      <span className="tpl-meta">
        <strong>{c.name}</strong>
        <span className="tiny muted">{c.blurb}</span>
      </span>
      <button type="button" className={'btn btn-sm ' + (active ? 'btn-ghost' : 'btn-primary')} onClick={onUse} disabled={active}>{active ? 'In use' : 'Use this concept'}</button>
    </div>
  );
}

function AiTab({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const [prompt, setPrompt] = useState(design.ai?.prompt ?? '');
  const [refs, setRefs] = useState<{ name: string; src: string }[]>(design.ai?.references ?? []);
  const [concepts, setConcepts] = useState<AiConcept[]>([]);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const run = (r: number) => {
    setBusy(true);
    setRound(r);
    window.setTimeout(() => {
      setConcepts(generateConcepts(prompt, design, refs, r));
      setBusy(false);
    }, 700);
  };
  const use = (c: AiConcept) => onChange(keepPersonal(design, c.design));
  const inUse = design.source === 'ai' ? design.ai?.conceptId : null;

  return (
    <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <Note tone="sim" title={<span className="row" style={{ '--gap': '6px', display: 'inline-flex' } as React.CSSProperties}><SimBadge>Simulated AI</SimBadge></span>}>
        No AI service is connected. Concepts are generated procedurally from your prompt's colours and film keywords so the future-phase journey can be reviewed.
      </Note>
      <label className="field">
        <span className="label">Describe your helmet</span>
        <textarea className="textarea" rows={3} value={prompt} placeholder="e.g. aggressive red and black with carbon, sharp chevrons, number 29"
          onChange={(e) => setPrompt(e.target.value)} />
      </label>
      <div className="field">
        <span className="label">Reference images · optional</span>
        <div className="row">
          <UploadButton multiple maxDim={800} onFiles={(f) => setRefs([...refs, ...f])}>Add references</UploadButton>
          {refs.map((r, i) => (
            <figure key={i} className="photo sm">
              <img src={r.src} alt={r.name} />
              <button type="button" className="photo-x" aria-label={`Remove ${r.name}`} onClick={() => setRefs(refs.filter((_, j) => j !== i))}><Icon name="x" size={12} /></button>
            </figure>
          ))}
        </div>
      </div>
      <div className="row">
        <button type="button" className="btn btn-dark" disabled={busy || !prompt.trim()} onClick={() => run(concepts.length ? round + 1 : 0)}>
          <Icon name="sparkle" />{busy ? 'Generating…' : concepts.length ? 'Revise concepts' : 'Generate concepts'}
        </button>
        {!prompt.trim() && <span className="tiny muted">Add a short description first.</span>}
      </div>
      {busy && <div className="ai-busy" role="status"><span /><span /><span /> Sketching three concepts…</div>}
      {!busy && concepts.length > 0 && (
        <div className="tpl-grid ai">
          {concepts.map((c) => <ConceptCard key={c.id} c={c} active={inUse === c.id} onUse={() => { use(c); setSelected(null); }} />)}
        </div>
      )}
      {design.source === 'ai' && (
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <h3 className="h4">Refine the chosen concept</h3>
          <p className="small muted">Recolour any shape below or open the drawing board to add and remove shapes. AI concepts are reviewed and quoted by the workshop.</p>
          <div className="panel">
            <div className="label" style={{ marginBottom: 8 }}>Base</div>
            <PaintPicker label="Concept base" value={design.basePaint} onChange={(p) => onChange({ ...design, basePaint: p })} />
          </div>
          <LayerList layers={design.drawing} selected={selected} onSelect={setSelected}
            onDelete={(id) => onChange({ ...design, drawing: design.drawing.filter((l) => l.id !== id) })}
            onPaint={(id, p) => onChange({ ...design, drawing: design.drawing.map((l) => (l.id === id ? { ...l, paint: p } : l)) })} />
          <details className="db-details">
            <summary className="small" style={{ fontWeight: 600 }}>Open the drawing board</summary>
            <div style={{ marginTop: 10 }}><DrawingBoard design={design} onChange={onChange} /></div>
          </details>
        </div>
      )}
    </div>
  );
}
