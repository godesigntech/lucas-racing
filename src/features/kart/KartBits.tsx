/* Small shared pieces for the kart feature. */
import { useMemo } from 'react';
import type { KartDesign } from '@/core/types';
import { renderPanelCanvas } from '@/core/kartRender';
import { BODYWORK, KART_TEMPLATES } from '@/data/kart';
import { Icon } from '@/ui';

export const PROCESS = [
  { icon: 'lock', title: 'Payment', text: 'Pay online at the automatic kit price. Nothing is printed yet.' },
  { icon: 'eye', title: 'Staff artwork check', text: 'The workshop checks your artwork against the real cutting outlines.' },
  { icon: 'image', title: 'Clean digital proof', text: 'You receive a clean, unwatermarked proof of every panel.' },
  { icon: 'check', title: 'Your approval', text: 'Approve it, or ask for changes and get a new proof.' },
  { icon: 'print', title: 'Sent to Print', text: 'Only the approved current proof is printed.' },
];

export function ProcessSteps({ compact }: { compact?: boolean }) {
  return (
    <ol className={'kp-steps' + (compact ? ' compact' : '')}>
      {PROCESS.map((s, i) => (
        <li key={s.title}>
          <span className="kp-step-n"><Icon name={s.icon} size={16} /></span>
          <div>
            <div className="kp-step-t"><span className="muted">{i + 1}.</span> {s.title}</div>
            {!compact && <div className="tiny muted">{s.text}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Left-pod renders of a few templates (marketing art). */
export function useTemplateArt(names: string[], tick: number, width = 520) {
  return useMemo(() => {
    const bw = BODYWORK[0];
    const t = new Date().toISOString();
    return names.map((n) => {
      const tpl = KART_TEMPLATES.find((x) => x.name === n) || KART_TEMPLATES[0];
      const d: KartDesign = { id: 'art', name: tpl.name, ownerId: null, bodyworkId: bw.id, templateId: tpl.id, source: 'template', panels: tpl.build(bw, tpl.colors), uploads: {}, createdAt: t, updatedAt: t };
      return { name: tpl.name, src: renderPanelCanvas(d, 'leftPod', width).toDataURL('image/png') };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join(), tick, width]);
}
