/* Kart sticker kit configurator (future phase): panel editor + tool steps + always-visible price. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { KartDesign, KartMaterial, KartTemplate, PanelId, ShareLink } from '@/core/types';
import type { Doc } from '@/store/backend';
import { clone, money, nowISO, uid } from '@/core/util';
import { BODYWORK, bodyworkById, KART_TEMPLATES, PANELS } from '@/data/kart';
import { newKartDesign, priceKart } from '@/domain/kart';
import { getDoc, putDoc, toast, useAuth, useBasket, useMode, useSettings } from '@/store';
import { downloadDataUrl, Icon, Modal, Note, PriceLines, ScopeBadge, Seg, SimBadge } from '@/ui';
import { getQuick, mirrorLeftToRight, flipImageH, NAME_LAYER, NUMBER_LAYER, removeLayer, setQuick, type DesignUpdater } from './kartEdit';
import { useHistory, type SetOpts } from './useHistory';
import { useRenderTick, kitThumb, watermarkedKit } from './useKartRender';
import { PanelEditor, type Tool } from './PanelEditor';
import { LayerPanel } from './LayerPanel';
import { TemplatePicker } from './TemplatePicker';
import { AiConceptsPanel } from './AiConceptsPanel';
import { KitView } from './KitView';
import { MaterialPanel, ReviewPanel } from './OrderPanels';

const WIP_KEY = 'lr:wip-kart';
type Section = 'kart' | 'templates' | 'ai' | 'edit' | 'material' | 'review';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'kart', label: 'Kart' },
  { id: 'templates', label: 'Templates' },
  { id: 'ai', label: 'AI concepts' },
  { id: 'edit', label: 'Edit' },
  { id: 'material', label: 'Material & options' },
  { id: 'review', label: 'Review' },
];
const TEMPLATE_DEFAULT_TEXT = new Set(['DRIVER NAME', 'DRIVER', '29', 'TEAM', 'LUCAS RACING']);

interface Wip { design: KartDesign; material: KartMaterial; options: string[]; designService: boolean }

function loadWip(): Wip | null {
  try {
    const w = JSON.parse(localStorage.getItem(WIP_KEY) || 'null') as Wip | null;
    if (w && w.design && w.design.panels && w.design.panels.leftPod) return { design: w.design, material: w.material === 'holographic' ? 'holographic' : 'standard', options: Array.isArray(w.options) ? w.options : [], designService: !!w.designService };
  } catch { /* ignore */ }
  return null;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kart-kit';

export function Configurator() {
  const wip = useMemo(loadWip, []);
  const hist = useHistory<KartDesign>(() => wip?.design || { ...newKartDesign(BODYWORK[0].id, KART_TEMPLATES[0].id) });
  const design = hist.value;
  const [material, setMaterial] = useState<KartMaterial>(wip?.material || 'standard');
  const [options, setOptions] = useState<string[]>(wip?.options || []);
  const [designService, setDesignService] = useState(!!wip?.designService);
  const [panel, setPanel] = useState<PanelId>('leftPod');
  const [view, setView] = useState<'panel' | 'kit'>('panel');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [brush, setBrush] = useState({ width: 14, color: '#e3262b' });
  const [section, setSection] = useState<Section>('kart');
  const [busy, setBusy] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showLines, setShowLines] = useState(false);
  const toolsRef = useRef<HTMLElement>(null);

  const { user } = useAuth();
  const { full } = useMode();
  const settings = useSettings();
  const basket = useBasket();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tick = useRenderTick(design);
  const holographic = material === 'holographic';

  const change = useCallback((fn: DesignUpdater, opts?: SetOpts) => hist.set(fn, opts), [hist.set]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- reopen a saved design (?design=<id>) ---------- */
  const designParam = params.get('design');
  useEffect(() => {
    if (!designParam || designParam === design.id) return;
    let alive = true;
    void getDoc<Doc>('kartDesigns', designParam).then((doc) => {
      if (!alive) return;
      if (!doc) { toast('That saved kart design could not be found.', 'warn'); return; }
      hist.reset(clone(doc) as unknown as KartDesign);
      setSelectedId(null);
      setView('panel');
      toast(`Opened “${String(doc.name || 'saved design')}”.`);
    }).catch(() => toast('Could not open that design.', 'err'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designParam]);

  /* ---------- keep the sticky tool panel below the (variable-height) site header ---------- */
  const [headerH, setHeaderH] = useState(76);
  useEffect(() => {
    const el = document.querySelector('.site-header');
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- persist the working design ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(WIP_KEY, JSON.stringify({ design, material, options, designService })); } catch { /* storage full: keep working in memory */ }
    }, 350);
    return () => clearTimeout(t);
  }, [design, material, options, designService]);

  /* ---------- keyboard: undo / redo ---------- */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'checkbox') return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); hist.undo(); }
      else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); hist.redo(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [hist.undo, hist.redo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop a stale selection (undo, template change, panel switch).
  useEffect(() => {
    if (selectedId && !design.panels[panel].layers.some((l) => l.id === selectedId)) setSelectedId(null);
  }, [design, panel, selectedId]);

  const price = useMemo(() => priceKart({ bodyworkId: design.bodyworkId, material, options, designService }, settings), [design.bodyworkId, material, options, designService, settings]);

  /* ---------- actions ---------- */
  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) { setTool('select'); setSection('edit'); }
  };
  const pickPanel = (p: PanelId) => { setPanel(p); setSelectedId(null); setView('panel'); };

  const applyTemplate = (t: KartTemplate) => {
    const name = getQuick(design, NAME_LAYER);
    const num = getQuick(design, NUMBER_LAYER);
    change((d) => {
      let n: KartDesign = { ...d, templateId: t.id, source: 'template', panels: t.build(bodyworkById(d.bodyworkId), t.colors) };
      if (name && !TEMPLATE_DEFAULT_TEXT.has(name.toUpperCase())) n = setQuick(n, NAME_LAYER, name);
      if (num && !TEMPLATE_DEFAULT_TEXT.has(num)) n = setQuick(n, NUMBER_LAYER, num);
      return n;
    });
    setSelectedId(null);
    toast(`${t.name} applied to all four panels. Ctrl+Z to undo.`);
  };

  const applyConcept = (c: KartDesign) => {
    change((d) => ({
      ...d, templateId: c.templateId, source: 'ai', panels: clone(c.panels), uploads: {},
      name: d.name === 'Untitled kart kit' || d.name.startsWith('AI concept') ? c.name : d.name,
    }));
    setSelectedId(null);
    setView('panel');
    setSection('edit');
    toast('Concept loaded. Refine it by hand: every layer is editable.');
  };

  const mirror = async () => {
    const up = design.uploads.leftPod;
    let flipped: { src: string; name: string } | null = null;
    if (up) { try { flipped = { src: await flipImageH(up.src), name: up.name.replace(/(\.[a-z0-9]+)?$/i, ' (mirrored)$1') }; } catch { flipped = null; } }
    change((d) => mirrorLeftToRight(d, flipped));
    setPanel('rightPod');
    setSelectedId(null);
    toast('Right pod now mirrors the left pod.');
  };

  const save = async () => {
    if (!user) { toast('Sign in or create an account to save designs.', 'warn'); return; }
    setBusy('save');
    try {
      const own = !design.ownerId || design.ownerId === user.id;
      const doc: KartDesign = { ...design, id: own ? design.id : uid('kd_'), ownerId: user.id, updatedAt: nowISO() };
      await putDoc('kartDesigns', doc as unknown as Doc);
      hist.set(doc, { transient: true });
      setParams((p) => { const n = new URLSearchParams(p); n.set('design', doc.id); return n; }, { replace: true });
      toast(`Saved “${doc.name}” to your designs.`);
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`, 'err');
    } finally { setBusy(null); }
  };

  const duplicate = () => {
    const t = nowISO();
    const copy: KartDesign = { ...clone(design), id: uid('kd_'), name: `${design.name} (copy)`, ownerId: null, createdAt: t, updatedAt: t };
    change(() => copy);
    setParams((p) => { const n = new URLSearchParams(p); n.delete('design'); return n; }, { replace: true });
    toast('Duplicated. You are now editing the copy (save it to keep it).');
  };

  const share = async () => {
    setBusy('share');
    try {
      const t = nowISO();
      const link: ShareLink = { id: uid('ks_'), kind: 'kart', designSnapshot: clone(design), createdAt: t, updatedAt: t };
      await putDoc('shares', link as unknown as Doc, { isPublic: true });
      setShareUrl(`${window.location.origin}${window.location.pathname}#/kart-share/${link.id}`);
    } catch (e) {
      toast(`Could not create a share link: ${(e as Error).message}`, 'err');
    } finally { setBusy(null); }
  };

  const download = async () => {
    setBusy('download');
    try {
      downloadDataUrl(await watermarkedKit(design, holographic), `${slug(design.name)}-unpaid-preview.png`);
      toast('Watermarked preview downloaded.');
    } finally { setBusy(null); }
  };

  const addToBasket = async () => {
    setBusy('basket');
    try {
      const thumb = await kitThumb(design, holographic);
      basket.add({
        type: 'kart', id: uid('bi_'), designId: design.id, design: clone(design), name: design.name,
        material, options: [...options], designService, items: price.items, lines: price.lines, price: price.total, qty: 1, reorderOf: null, thumb,
      });
      toast(`${design.name} added to your basket.`);
      navigate('/basket');
    } catch (e) {
      toast(`Could not add to basket: ${(e as Error).message}`, 'err');
      setBusy(null);
    }
  };

  const goSection = (s: Section) => {
    setSection(s);
    if (window.innerWidth < 980) toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const idx = SECTIONS.findIndex((s) => s.id === section);
  const next = SECTIONS[idx + 1];

  const selected = design.panels[panel].layers.find((l) => l.id === selectedId) || null;
  const bw = bodyworkById(design.bodyworkId);
  const quickName = getQuick(design, NAME_LAYER) ?? '';
  const quickNum = getQuick(design, NUMBER_LAYER) ?? '';

  return (
    <div className="wrap page kart-page" style={{ '--kc-top': `${headerH}px` } as React.CSSProperties}>
      <div className="kc-head">
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="eyebrow lime">Kart sticker kits</span>
            <ScopeBadge tag="future" />
            {!full && <SimBadge>Demo preview</SimBadge>}
          </div>
          <h1 className="h2">Kit configurator</h1>
        </div>
        <div className="kc-head-name">
          <span className="tiny muted">{bw.name}</span>
          <strong className="ke-ellipsis">{design.name}</strong>
        </div>
      </div>
      <Note className="kc-banner">Panel outlines are illustrative and NOT dimensionally accurate. Supplied cutting outlines (e.g. MS Kart sticker shapes) replace them before production.</Note>

      <div className="kc-layout">
        {/* ---------------- stage ---------------- */}
        <section className="kc-stage card" aria-label="Design canvas">
          <div className="kc-panels" role="tablist" aria-label="Panels">
            {PANELS.map((p) => (
              <button key={p.id} role="tab" aria-selected={view === 'panel' && panel === p.id} onClick={() => pickPanel(p.id)}>
                {p.short}{design.uploads[p.id] && <span className="kc-dot" title="Has uploaded artwork" />}
              </button>
            ))}
            <button role="tab" aria-selected={view === 'kit'} className="kc-kit-tab" onClick={() => { setView('kit'); setSelectedId(null); setTool('select'); }}>
              <Icon name="layers" size={15} /><span className="kc-kit-label">Complete kit</span><span className="kc-kit-short">Kit</span>
            </button>
          </div>

          {view === 'panel' ? (
            <>
              <div className="kc-toolbar">
                <Seg label="Canvas tool" value={tool} onChange={(t) => { setTool(t); if (t === 'draw') { setSelectedId(null); setSection('edit'); } }}
                  options={[{ id: 'select', label: <><Icon name="arrow" size={14} className="rot-select" /> Select</> }, { id: 'draw', label: <><Icon name="brush" size={14} /> Draw</> }]} />
                <div className="row nowrap" style={{ '--gap': '6px' } as React.CSSProperties}>
                  <button type="button" className="icon-btn" onClick={hist.undo} disabled={!hist.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Icon name="undo" /></button>
                  <button type="button" className="icon-btn flip-x" onClick={hist.redo} disabled={!hist.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Icon name="undo" /></button>
                  {selected && <button type="button" className="icon-btn danger" title="Remove selected layer" aria-label="Remove selected layer" onClick={() => { change((d) => removeLayer(d, panel, selected.id)); setSelectedId(null); }}><Icon name="trash" /></button>}
                </div>
              </div>
              <PanelEditor design={design} panel={panel} selectedId={selectedId} onSelect={select} tool={tool} brush={brush} holographic={holographic} tick={tick} onChange={change} />
              <div className="kc-hint tiny muted">
                {tool === 'draw' ? 'Draw mode: drag on the panel to draw. Switch back to Select to move strokes.' : 'Tap a layer to select · drag to move · corner handle resizes · round handle rotates · Ctrl+Z undoes'}
                {holographic && <span className="badge future" style={{ marginLeft: 8 }}>Holographic preview</span>}
              </div>
            </>
          ) : (
            <div style={{ padding: 14 }}>
              <KitView design={design} holographic={holographic} tick={tick} onPick={pickPanel} />
            </div>
          )}
        </section>

        {/* ---------------- tools ---------------- */}
        <aside className="kc-tools card" ref={toolsRef} aria-label="Configurator steps">
          <div className="kc-steps" role="tablist" aria-label="Steps">
            {SECTIONS.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={section === s.id} onClick={() => setSection(s.id)}>
                <span className="kc-step-n">{i + 1}</span>{s.label}
              </button>
            ))}
          </div>
          <div className="kc-tools-body">
            {section === 'kart' && (
              <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
                <label className="field">
                  <span className="label">Bodywork</span>
                  <select className="select" value={design.bodyworkId} onChange={(e) => change((d) => ({ ...d, bodyworkId: e.target.value }))}>
                    {BODYWORK.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <span className="tiny muted">All three bodyworks are illustrative. Real cutting outlines are supplied before production.</span>
                </label>
                <div className="grid g2" style={{ '--gap': '12px' } as React.CSSProperties}>
                  <label className="field">
                    <span className="label">Driver name</span>
                    <input className="input" value={quickName} maxLength={24} placeholder="e.g. L. HAMILTON" onChange={(e) => change((d) => setQuick(d, NAME_LAYER, e.target.value), { key: 'quick-name' })} />
                  </label>
                  <label className="field">
                    <span className="label">Race number</span>
                    <input className="input" value={quickNum} maxLength={3} inputMode="numeric" placeholder="e.g. 29" onChange={(e) => change((d) => setQuick(d, NUMBER_LAYER, e.target.value.replace(/[^0-9]/g, '')), { key: 'quick-num' })} />
                  </label>
                </div>
                <p className="tiny muted">Name and number update every matching text layer across all four panels.</p>
                <label className="field">
                  <span className="label">Design name</span>
                  <input className="input" value={design.name} maxLength={60} onChange={(e) => change((d) => ({ ...d, name: e.target.value }), { key: 'name' })} />
                </label>
                <div className="kc-start">
                  <button type="button" className="kc-start-btn" onClick={() => setSection('templates')}><Icon name="layers" /><span><strong>Start from a template</strong><span className="tiny muted">{KART_TEMPLATES.length} race layouts</span></span></button>
                  <button type="button" className="kc-start-btn" onClick={() => setSection('ai')}><Icon name="sparkle" /><span><strong>AI concepts</strong><span className="tiny muted">Describe it (simulated)</span></span></button>
                  <button type="button" className="kc-start-btn" onClick={() => { setSection('edit'); }}><Icon name="upload" /><span><strong>Upload artwork</strong><span className="tiny muted">Per panel, auto-priced</span></span></button>
                </div>
              </div>
            )}
            {section === 'templates' && <TemplatePicker design={design} tick={tick} onApply={applyTemplate} onChange={change} />}
            {section === 'ai' && <AiConceptsPanel bodyworkId={design.bodyworkId} keep={{ name: quickName || null, number: quickNum || null }} onUse={applyConcept} />}
            {section === 'edit' && (
              view === 'kit' ? (
                <div className="stack">
                  <p className="small muted">Pick a panel to edit its layers.</p>
                  <div className="chips">{PANELS.map((p) => <button key={p.id} type="button" className="chip" onClick={() => pickPanel(p.id)}>{p.name}</button>)}</div>
                </div>
              ) : (
                <LayerPanel design={design} panel={panel} selectedId={selectedId} onSelect={select} onChange={change} tool={tool} setTool={setTool} brush={brush} setBrush={setBrush} onMirror={mirror} />
              )
            )}
            {section === 'material' && (
              <MaterialPanel material={material} setMaterial={setMaterial} options={options} setOptions={setOptions} designService={designService} setDesignService={setDesignService} lines={price.lines} total={price.total} />
            )}
            {section === 'review' && (
              <ReviewPanel design={design} holographic={holographic} signedIn={!!user} lines={price.lines} total={price.total} busy={busy}
                onName={(n) => change((d) => ({ ...d, name: n }), { key: 'name' })} onSave={save} onDuplicate={duplicate} onShare={share} onDownload={download} onBasket={addToBasket} />
            )}
            {next && (
              <div className="kc-next">
                <button type="button" className="btn btn-dark btn-sm" onClick={() => goSection(next.id)}>Next: {next.label}<Icon name="arrow" /></button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ---------------- always-visible price ---------------- */}
      <div className="kc-pricebar" role="region" aria-label="Price summary">
        {showLines && <div className="kc-pricelines"><PriceLines lines={price.lines} total={price.total} /></div>}
        <div className="kc-pricebar-row">
          <button type="button" className="kc-price-toggle" aria-expanded={showLines} onClick={() => setShowLines(!showLines)}>
            <span className="tiny">Complete kit · {material === 'holographic' ? 'Holographic' : 'Standard'}{options.length ? ` · ${options.length} option${options.length > 1 ? 's' : ''}` : ''}{designService ? ' · design service' : ''}</span>
            <span className="kc-total">{money(price.total)}<Icon name="arrow" size={14} className={showLines ? 'rot-down' : 'rot-up'} /></span>
          </button>
          <div className="row nowrap" style={{ '--gap': '8px' } as React.CSSProperties}>
            {section !== 'review' && <button type="button" className="btn btn-ghost btn-sm kc-hide-sm" onClick={() => goSection('review')}>Review</button>}
            <button type="button" className="btn btn-primary" onClick={addToBasket} disabled={busy === 'basket'}><Icon name="basket" /><span className="kc-hide-xs">Add to basket</span><span className="kc-show-xs">Add</span></button>
          </div>
        </div>
      </div>

      <Modal open={!!shareUrl} onClose={() => setShareUrl(null)} title="View-only share link"
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={() => setShareUrl(null)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={async () => {
            try { await navigator.clipboard.writeText(shareUrl || ''); toast('Link copied.'); } catch { toast('Copy failed: select the link and copy it manually.', 'warn'); }
          }}><Icon name="copy" />Copy link</button>
        </>}>
        <div className="stack">
          <p className="small">Anyone with this link can view a watermarked snapshot of this kit. They can’t edit it, and later changes you make won’t appear.</p>
          <input className="input mono" readOnly value={shareUrl || ''} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
          {shareUrl && <a className="btn-link small" href={shareUrl} target="_blank" rel="noreferrer">Open the share page</a>}
        </div>
      </Modal>
    </div>
  );
}
