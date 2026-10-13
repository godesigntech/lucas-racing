/* Live 3D stage with view controls and status overlays. */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { HelmetDesign } from '@/core/types';
import { HelmetViewer, type HelmetViewerApi, type ViewName } from '@/three/HelmetViewer';
import { modelById, modelLabel } from '@/data/helmets';
import { Icon } from '@/ui';

const VIEWS: { id: ViewName; label: string }[] = [
  { id: 'front', label: 'Front' }, { id: 'side', label: 'Side' }, { id: 'rear', label: 'Rear' }, { id: 'top', label: 'Top' },
];
const VIEW_ANIM_MS = 450;
// Waits n animation frames, with a timer fallback because rAF pauses in hidden tabs.
const frames = (n: number) => new Promise<void>((res) => {
  const t = setTimeout(res, 40 * n + 60);
  const step = (k: number) => (k <= 0 ? (clearTimeout(t), res()) : requestAnimationFrame(() => step(k - 1)));
  step(n);
});

export interface ViewerPanelProps {
  design: HelmetDesign;
  kind: 'standard' | 'quote';
  unpaid: boolean;
  /** Paint the watermark into the texture (share pages). */
  textureWatermark?: string | null;
  defaultAutoRotate?: boolean;
  className?: string;
  extraTag?: React.ReactNode;
}

export const ViewerPanel = forwardRef<HelmetViewerApi, ViewerPanelProps>(function ViewerPanel(
  { design, kind, unpaid, textureWatermark = null, defaultAutoRotate = false, className = '', extraTag }, ref,
) {
  const [auto, setAuto] = useState(defaultAutoRotate);
  const stage = useRef<HTMLDivElement>(null);
  const local = useRef<HelmetViewerApi>(null);
  const model = modelById(design.modelId);

  /** Zoom via OrbitControls' own wheel handling (the viewer API has no zoom call).
      factor > 1 pulls the camera back, < 1 moves it closer (OrbitControls: 0.95^(|deltaY|/100) per event). */
  const zoomBy = useCallback((factor: number) => {
    const canvas = stage.current?.querySelector('canvas');
    if (!canvas || factor === 1) return;
    const r = canvas.getBoundingClientRect();
    const delta = (Math.log(factor) / Math.log(1 / 0.95)) * 100;
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: delta, deltaMode: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
  }, []);
  /** The preset camera distances frame the shell tightly; pull back so the whole helmet fits the stage. */
  const fitFactor = (aspect: number) => Math.min(1.75, Math.max(1.2, 1.25 / Math.max(0.3, aspect)));
  const fit = useCallback((delay: number) => window.setTimeout(() => {
    const r = stage.current?.getBoundingClientRect();
    if (r) zoomBy(fitFactor(r.width / Math.max(1, r.height)));
  }, delay), [zoomBy]);

  useEffect(() => {
    const t = fit(120);
    return () => window.clearTimeout(t);
  }, [fit]);

  useImperativeHandle(ref, () => ({
    setView(v, animate = true) {
      local.current?.setView(v, animate);
      fit(animate ? VIEW_ANIM_MS : 0);
    },
    reset() {
      local.current?.reset();
      fit(VIEW_ANIM_MS);
    },
    async snapshot(opts = {}) {
      const api = local.current;
      if (!api) return '';
      if (opts.view) {
        api.setView(opts.view, false);
        zoomBy(fitFactor((opts.width ?? 1) / (opts.height ?? 1)));
        await frames(2);
      }
      return api.snapshot({ width: opts.width, height: opts.height });
    },
  }), [fit, zoomBy]);

  const view = (v: ViewName) => { setAuto(false); local.current?.setView(v); fit(VIEW_ANIM_MS); };

  return (
    <div ref={stage} className={'viewer-stage hb-stage ' + className}>
      <HelmetViewer ref={local} design={design} autoRotate={auto} watermark={textureWatermark} />
      <div className="viewer-tag hb-tags">
        <span className={'hb-kind ' + (kind === 'standard' ? 'std' : 'quote')}>{kind === 'standard' ? 'Standard design' : 'Bespoke · quote'}</span>
        {extraTag}
      </div>
      {unpaid && <span className="wm-tag">Unpaid preview</span>}
      <div className="hb-model-tag">
        <strong>{modelLabel(model)}</strong>
        <span>Concept geometry, not manufacturer-accurate</span>
      </div>
      <div className="hb-toolbar" role="toolbar" aria-label="3D view controls">
        {VIEWS.map((v) => <button key={v.id} type="button" onClick={() => view(v.id)}>{v.label}</button>)}
        <span className="sep" aria-hidden="true" />
        <button type="button" className="ic" onClick={() => { local.current?.reset(); fit(VIEW_ANIM_MS); }} aria-label="Reset view" title="Reset view"><Icon name="reset" size={16} /></button>
        <button type="button" className="ic" aria-pressed={auto} onClick={() => setAuto(!auto)} aria-label="Auto-rotate" title="Auto-rotate"><Icon name="rotate" size={16} /></button>
        <button type="button" className="ic" onClick={() => zoomBy(1 / 1.15)} aria-label="Zoom in" title="Zoom in"><Icon name="zoomIn" size={16} /></button>
        <button type="button" className="ic" onClick={() => zoomBy(1.15)} aria-label="Zoom out" title="Zoom out"><Icon name="zoomOut" size={16} /></button>
      </div>
      <div className="hb-hint tiny" aria-hidden="true">Drag to rotate · scroll/pinch to zoom</div>
    </div>
  );
});
