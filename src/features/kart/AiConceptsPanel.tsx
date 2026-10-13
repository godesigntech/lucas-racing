/* Simulated AI concept generator: prompt + reference images → three editable concepts. */
import { useState } from 'react';
import type { KartDesign } from '@/core/types';
import { renderKitSheet } from '@/core/kartRender';
import { Icon, Note, SimBadge, UploadButton } from '@/ui';
import { generateConcepts, type Concept } from './aiConcepts';
import { loadKartFonts } from './useKartRender';

const EXAMPLES = [
  'Aggressive black and lime with sharp chevrons, number 29',
  'Retro heritage stripes in navy, white and red',
  'Clean minimal white with orange accents, driver name Lucas',
];

export function AiConceptsPanel({ bodyworkId, keep, onUse }: {
  bodyworkId: string; keep: { name: string | null; number: string | null }; onUse: (d: KartDesign) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [refs, setRefs] = useState<{ src: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [concepts, setConcepts] = useState<(Concept & { thumb: string })[]>([]);

  const run = async () => {
    if (!prompt.trim() && !refs.length) return;
    setBusy(true);
    try {
      const n = nonce + 1;
      setNonce(n);
      const out = await generateConcepts({ prompt, references: refs, bodyworkId, nonce: n, keep });
      await loadKartFonts();
      setConcepts(out.map((c) => ({ ...c, thumb: renderKitSheet(c.design, { width: 560, title: c.design.name }).toDataURL('image/png') })));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <div className="row between">
        <strong>Describe your kit</strong>
        <SimBadge>Simulated AI: no AI service connected</SimBadge>
      </div>
      <label className="field">
        <span className="label">Prompt</span>
        <textarea className="textarea" rows={3} value={prompt} maxLength={300} onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Aggressive black and lime with sharp chevrons, number 29" />
      </label>
      <div className="chips" aria-label="Example prompts">
        {EXAMPLES.map((x) => <button key={x} type="button" className="chip ke-chip-wrap" onClick={() => setPrompt(x)}>{x}</button>)}
      </div>
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <span className="label">Reference images (optional)</span>
        <div className="row">
          {refs.map((r, i) => (
            <span key={i} className="ke-ref">
              <img src={r.src} alt={r.name} />
              <button type="button" aria-label={`Remove ${r.name}`} onClick={() => setRefs(refs.filter((_, k) => k !== i))}><Icon name="x" size={12} /></button>
            </span>
          ))}
          {refs.length < 4 && <UploadButton multiple maxDim={600} onFiles={(fs) => setRefs([...refs, ...fs].slice(0, 4))}>Add reference</UploadButton>}
        </div>
        <p className="tiny muted">Colours are sampled from your references. Up to four images.</p>
      </div>
      <button type="button" className="btn btn-dark" disabled={busy || (!prompt.trim() && !refs.length)} onClick={run}>
        <Icon name="sparkle" />{busy ? 'Generating concepts…' : concepts.length ? 'Generate a fresh set' : 'Generate 3 concepts'}
      </button>
      {busy && <div className="ke-shimmer" aria-live="polite"><span /><span /><span /></div>}
      {!busy && concepts.length > 0 && (
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties} aria-live="polite">
          {concepts.map((c) => (
            <div key={c.id} className="ke-concept">
              <img src={c.thumb} alt={`${c.templateName} concept preview`} />
              <div className="row between nowrap" style={{ padding: '10px 12px' }}>
                <div className="grow">
                  <strong className="small">{c.templateName}</strong>
                  <div className="tiny muted">{c.why}</div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onUse(c.design)}>Use</button>
              </div>
            </div>
          ))}
          <Note tone="sim">Concepts are a starting point: choose one, then refine every layer by hand in the Edit step.</Note>
        </div>
      )}
    </div>
  );
}
