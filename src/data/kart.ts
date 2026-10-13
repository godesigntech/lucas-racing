import type { KartBodywork, KartLayer, KartPanelDesign, KartTemplate, PanelId } from '@/core/types';
import { uid } from '@/core/util';

/* ILLUSTRATIVE panel outlines — not dimensionally accurate.
   Replace with supplied cutting outlines (e.g. MS Kart sticker shapes) before production. */

export const PANELS: { id: PanelId; name: string; short: string }[] = [
  { id: 'leftPod', name: 'Left side pod', short: 'Left pod' },
  { id: 'rightPod', name: 'Right side pod', short: 'Right pod' },
  { id: 'nassau', name: 'Nassau panel', short: 'Nassau' },
  { id: 'frontBumper', name: 'Front bumper', short: 'Bumper' },
];

export const PANEL_BOX: Record<PanelId, { w: number; h: number }> = {
  leftPod: { w: 1000, h: 340 },
  rightPod: { w: 1000, h: 340 },
  nassau: { w: 640, h: 520 },
  frontBumper: { w: 1000, h: 300 },
};

function pod(p: { nose: number; tail: number; dip: number }, mirror: boolean) {
  // side pod seen from the side; nose at x=1000 (front) for the left pod
  const pts = `M40 ${110 + p.tail} C120 60 300 40 520 46 C700 52 860 70 ${960 - p.nose} 120 C990 150 990 230 ${950 - p.nose} 270 C760 300 420 310 120 300 C60 296 30 260 30 ${200 + p.dip} Z`;
  return mirror ? `<g transform="translate(1000 0) scale(-1 1)"><path d="${pts}"/></g>` : pts;
}
const nassau = (round: number) =>
  `M70 70 C${200 - round} 30 ${440 + round} 30 570 70 L600 300 C${560 - round} 430 ${360} 490 320 494 C280 490 ${80 + round} 430 40 300 Z`;
const bumper = (lip: number) =>
  `M30 210 C60 120 200 60 420 52 L760 50 C880 54 950 100 975 170 C985 220 960 ${250 + lip} 900 ${262 + lip} L120 ${262 + lip} C60 260 26 246 30 210 Z`;

function bodywork(id: string, name: string, p: { nose: number; tail: number; dip: number; round: number; lip: number }): KartBodywork {
  const left = pod(p, false);
  return {
    id, name, accurate: false,
    outlines: {
      leftPod: { path: left, w: 1000, h: 340 },
      // right pod is the mirror image, stored as a path in its own box
      rightPod: { path: left.replace(/(-?\d+(\.\d+)?) (-?\d+(\.\d+)?)/g, (_, x, __, y) => `${1000 - Number(x)} ${y}`), w: 1000, h: 340 },
      nassau: { path: nassau(p.round), w: 640, h: 520 },
      frontBumper: { path: bumper(p.lip), w: 1000, h: 300 },
    },
  };
}

export const BODYWORK: KartBodywork[] = [
  bodywork('bw-ms', 'MS Kart standard bodywork (illustrative)', { nose: 0, tail: 0, dip: 0, round: 0, lip: 0 }),
  bodywork('bw-kg', 'KG-style bodywork (illustrative)', { nose: 30, tail: 14, dip: 18, round: 30, lip: 10 }),
  bodywork('bw-otk', 'M-series-style bodywork (illustrative)', { nose: 12, tail: -10, dip: -12, round: -20, lip: 18 }),
];
export const bodyworkById = (id: string) => BODYWORK.find((b) => b.id === id) || BODYWORK[0];

/* ------------------------------------------------------------------ */
/* Templates (20). Each builds editable layers per panel.              */
/* ------------------------------------------------------------------ */

const rect = (x: number, y: number, w: number, h: number, color: string, rotation = 0, name = 'Shape'): KartLayer => ({ id: uid('l'), type: 'rect', x, y, w, h, rotation, color, name });
const stripe = (x: number, y: number, w: number, h: number, color: string, rotation = 0, name = 'Stripe'): KartLayer => ({ id: uid('l'), type: 'stripe', x, y, w, h, rotation, color, name });
const tri = (x: number, y: number, w: number, h: number, color: string, rotation = 0, name = 'Chevron'): KartLayer => ({ id: uid('l'), type: 'triangle', x, y, w, h, rotation, color, name });
const ell = (x: number, y: number, w: number, h: number, color: string, name = 'Circle'): KartLayer => ({ id: uid('l'), type: 'ellipse', x, y, w, h, rotation: 0, color, name });
const txt = (x: number, y: number, text: string, size: number, color: string, outline: string | null = null, name = 'Text', font: 'barlow' | 'anton' | 'racing' = 'barlow'): KartLayer => ({ id: uid('l'), type: 'text', x, y, text, size, rotation: 0, color, outline, font, name });

type Build = (c: [string, string, string]) => Record<PanelId, KartPanelDesign>;

const pods = (bg: string, layers: () => KartLayer[]) => ({
  leftPod: { background: bg, layers: layers() },
  rightPod: { background: bg, layers: layers().map((l) => ('x' in l ? { ...l, x: 1000 - l.x, rotation: 'rotation' in l ? -l.rotation : 0 } : l)) as KartLayer[] },
});
const numberPlate = (c: string, t: string): KartLayer[] => [ell(320, 260, 330, 330, c, 'Number disc'), txt(320, 260, '29', 220, t, null, 'Race number', 'anton')];

const T = (name: string, colors: [string, string, string], build: Build): KartTemplate => ({
  id: 'kt-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, colors,
  build: (_bw, c) => build(c),
});

export const KART_TEMPLATES: KartTemplate[] = [
  T('Velocity', ['#121412', '#c8f031', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [stripe(560, 170, 900, 70, b, -8, 'Main stripe'), stripe(600, 240, 800, 20, c, -8, 'Pinstripe'), txt(560, 120, 'DRIVER NAME', 60, c, null, 'Driver name')]),
    nassau: { background: a, layers: [...numberPlate(b, a), stripe(320, 470, 640, 40, c)] },
    frontBumper: { background: a, layers: [stripe(500, 150, 1000, 60, b, -4), txt(500, 150, 'LUCAS RACING', 54, a, null, 'Team name')] },
  })),
  T('Apex', ['#f5f5f2', '#e3262b', '#121412'], ([a, b, c]) => ({
    ...pods(a, () => [tri(700, 170, 420, 300, b, 90, 'Apex chevron'), tri(520, 170, 300, 220, c, 90, 'Inner chevron'), txt(300, 175, 'DRIVER', 70, c, null, 'Driver name')]),
    nassau: { background: a, layers: [rect(320, 80, 640, 120, b, 0, 'Top band'), ...numberPlate(c, a)] },
    frontBumper: { background: b, layers: [tri(500, 160, 300, 200, a, 90), txt(500, 160, 'TEAM', 60, c)] },
  })),
  T('Split', ['#14254d', '#ffd000', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [rect(500, 260, 1000, 160, b, -6, 'Lower split'), stripe(500, 178, 1000, 18, c, -6, 'Split line'), txt(560, 110, 'DRIVER NAME', 58, c)]),
    nassau: { background: a, layers: [rect(320, 420, 640, 220, b, -8), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [rect(500, 230, 1000, 120, b, -3)] },
  })),
  T('Pulse', ['#121412', '#ec4c9b', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [stripe(500, 150, 1000, 22, b), stripe(500, 190, 1000, 10, c), stripe(500, 225, 1000, 22, b), txt(500, 90, 'DRIVER NAME', 52, c)]),
    nassau: { background: a, layers: [stripe(320, 100, 640, 22, b), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [stripe(500, 150, 1000, 22, b), stripe(500, 190, 1000, 10, c)] },
  })),
  T('Overtake', ['#ffd000', '#121412', '#e3262b'], ([a, b, c]) => ({
    ...pods(a, () => [tri(520, 170, 520, 320, b, 90, 'Big chevron'), tri(420, 170, 360, 220, c, 90, 'Inner chevron'), txt(820, 170, '29', 150, b, null, 'Race number', 'anton')]),
    nassau: { background: a, layers: [tri(320, 140, 400, 160, b, 180), ...numberPlate(b, a)] },
    frontBumper: { background: b, layers: [tri(500, 150, 260, 180, a, 90)] },
  })),
  T('Heritage', ['#f5f5f2', '#1f6feb', '#e3262b'], ([a, b, c]) => ({
    ...pods(a, () => [stripe(500, 150, 1000, 50, b, 0, 'Blue band'), stripe(500, 205, 1000, 50, c, 0, 'Red band'), txt(560, 270, 'DRIVER NAME', 44, b)]),
    nassau: { background: a, layers: [stripe(320, 90, 640, 40, b), stripe(320, 135, 640, 40, c), ...numberPlate(b, a)] },
    frontBumper: { background: a, layers: [stripe(500, 140, 1000, 40, b), stripe(500, 185, 1000, 40, c)] },
  })),
  T('Shards', ['#121412', '#a6abb3', '#c8f031'], ([a, b, c]) => ({
    ...pods(a, () => [tri(300, 200, 260, 180, b, 30), tri(520, 140, 240, 160, c, -20), tri(760, 210, 260, 200, b, 60), txt(520, 270, 'DRIVER', 50, c)]),
    nassau: { background: a, layers: [tri(200, 120, 200, 140, b, 20), tri(470, 140, 200, 140, c, -30), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [tri(300, 150, 220, 140, b, 30), tri(700, 150, 220, 140, c, -30)] },
  })),
  T('Flag', ['#f5f5f2', '#121412', '#e3262b'], ([a, b, c]) => ({
    ...pods(a, () => [...[0, 1, 2, 3, 4].flatMap((i) => [rect(80 + i * 80, 100, 40, 40, b), rect(120 + i * 80, 140, 40, 40, b), rect(80 + i * 80, 180, 40, 40, b)]), stripe(760, 160, 480, 30, c), txt(760, 230, 'DRIVER', 56, b)]),
    nassau: { background: a, layers: [...[0, 1, 2, 3, 4, 5, 6].map((i) => rect(60 + i * 80, 90, 40, 40, b)), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(120 + i * 100, 140, 50, 50, b))] },
  })),
  T('Bolt', ['#121412', '#ffd000', '#ff6a13'], ([a, b, c]) => ({
    ...pods(a, () => [tri(420, 150, 360, 120, b, 15, 'Bolt top'), tri(600, 200, 360, 120, b, 195, 'Bolt bottom'), stripe(500, 270, 1000, 14, c)]),
    nassau: { background: a, layers: [tri(320, 120, 260, 120, b, 15), ...numberPlate(b, a)] },
    frontBumper: { background: a, layers: [tri(500, 150, 320, 110, b, 15)] },
  })),
  T('Fade', ['#f5f5f2', '#159a49', '#14254d'], ([a, b, c]) => ({
    ...pods(a, () => [rect(500, 200, 1000, 40, b), rect(500, 240, 1000, 40, c), rect(500, 285, 1000, 50, b), txt(520, 120, 'DRIVER NAME', 56, c)]),
    nassau: { background: a, layers: [rect(320, 380, 640, 60, b), rect(320, 440, 640, 60, c), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [rect(500, 210, 1000, 40, b), rect(500, 250, 1000, 40, c)] },
  })),
  T('Comet', ['#14254d', '#ffd000', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [ell(740, 170, 140, 140, b, 'Comet head'), stripe(420, 170, 600, 70, b, 0, 'Tail'), stripe(380, 170, 560, 20, c), txt(380, 260, 'DRIVER', 50, c)]),
    nassau: { background: a, layers: [ell(320, 120, 120, 120, b), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [ell(700, 150, 110, 110, b), stripe(420, 150, 520, 50, b)] },
  })),
  T('Wings', ['#121412', '#f5f5f2', '#e3262b'], ([a, b, c]) => ({
    ...pods(a, () => [tri(380, 150, 520, 160, b, -10, 'Wing'), tri(420, 210, 420, 100, c, -10, 'Wing accent'), txt(800, 200, '29', 140, b, null, 'Race number', 'anton')]),
    nassau: { background: a, layers: [tri(180, 140, 220, 120, b, -20), tri(460, 140, 220, 120, b, 20), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [tri(300, 150, 300, 120, b, -10), tri(700, 150, 300, 120, b, 10)] },
  })),
  T('Ribbon', ['#f5f5f2', '#ff6a13', '#121412'], ([a, b, c]) => ({
    ...pods(a, () => [stripe(300, 220, 600, 90, b, -14), stripe(720, 140, 600, 90, b, 10), stripe(500, 300, 1000, 14, c), txt(520, 90, 'DRIVER NAME', 50, c)]),
    nassau: { background: a, layers: [stripe(320, 110, 640, 80, b, -8), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [stripe(500, 150, 1000, 80, b, -6)] },
  })),
  T('Stinger', ['#ffd000', '#121412', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [...[0, 1, 2, 3, 4].map((i) => stripe(140 + i * 90, 180, 40, 300, b, 20)), tri(800, 180, 260, 200, b, 90), txt(780, 290, 'DRIVER', 40, b)]),
    nassau: { background: a, layers: [...[0, 1, 2].map((i) => stripe(160 + i * 160, 100, 50, 160, b, 20)), ...numberPlate(b, a)] },
    frontBumper: { background: a, layers: [...[0, 1, 2, 3, 4, 5].map((i) => stripe(150 + i * 140, 150, 40, 240, b, 20))] },
  })),
  T('Hex Tech', ['#121412', '#2a2d32', '#c8f031'], ([a, b, c]) => ({
    ...pods(a, () => [...[0, 1, 2, 3, 4, 5].map((i) => rect(140 + i * 130, 160 + (i % 2) * 40, 90, 90, b, 30)), stripe(500, 280, 1000, 18, c), txt(520, 90, 'DRIVER NAME', 52, c)]),
    nassau: { background: a, layers: [...[0, 1, 2].map((i) => rect(160 + i * 160, 110, 80, 80, b, 30)), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [stripe(500, 150, 1000, 18, c)] },
  })),
  T('Dagger', ['#f5f5f2', '#7442d6', '#121412'], ([a, b, c]) => ({
    ...pods(a, () => [tri(520, 170, 160, 860, b, 90, 'Dagger'), stripe(140, 170, 120, 40, c, 90, 'Hilt'), txt(560, 270, 'DRIVER', 50, c)]),
    nassau: { background: a, layers: [tri(320, 140, 120, 400, b, 90), ...numberPlate(b, a)] },
    frontBumper: { background: a, layers: [tri(500, 150, 120, 700, b, 90)] },
  })),
  T('Halo', ['#121412', '#0fa3a3', '#f5f5f2'], ([a, b, c]) => ({
    ...pods(a, () => [ell(500, 170, 700, 200, b, 'Halo'), ell(500, 170, 620, 140, a, 'Halo inner'), txt(500, 172, 'DRIVER NAME', 60, c)]),
    nassau: { background: a, layers: [ell(320, 260, 420, 420, b), ...numberPlate(a, c)] },
    frontBumper: { background: a, layers: [ell(500, 150, 600, 140, b), ell(500, 150, 520, 90, a)] },
  })),
  T('Boomerang', ['#1f6feb', '#f5f5f2', '#e3262b'], ([a, b, c]) => ({
    ...pods(a, () => [tri(420, 120, 420, 120, b, 20), tri(420, 230, 420, 120, b, 160), ell(700, 175, 70, 70, c), txt(820, 260, 'DRIVER', 44, b)]),
    nassau: { background: a, layers: [tri(320, 110, 300, 90, b, 0), ...numberPlate(b, a)] },
    frontBumper: { background: a, layers: [tri(500, 150, 360, 110, b, 90)] },
  })),
  T('Tri-Stripe', ['#f5f5f2', '#e3262b', '#14254d'], ([a, b, c]) => ({
    ...pods(a, () => [stripe(500, 130, 1000, 30, b), stripe(500, 175, 1000, 30, c), stripe(500, 220, 1000, 30, b), txt(520, 285, 'DRIVER NAME', 44, c)]),
    nassau: { background: a, layers: [stripe(240, 260, 40, 520, b), stripe(320, 260, 40, 520, c), stripe(400, 260, 40, 520, b), ...numberPlate(c, a)] },
    frontBumper: { background: a, layers: [stripe(440, 150, 40, 300, b), stripe(500, 150, 40, 300, c), stripe(560, 150, 40, 300, b)] },
  })),
  T('Clean', ['#f5f5f2', '#121412', '#c8f031'], ([a, b, c]) => ({
    ...pods(a, () => [txt(500, 175, 'DRIVER NAME', 80, b), stripe(500, 260, 700, 12, c)]),
    nassau: { background: a, layers: numberPlate(b, a) },
    frontBumper: { background: a, layers: [txt(500, 150, 'LUCAS RACING', 60, b)] },
  })),
];

export const kartTemplateById = (id: string | null) => KART_TEMPLATES.find((t) => t.id === id) || null;

export const KART_MATERIALS: { id: 'standard' | 'holographic'; name: string; note: string }[] = [
  { id: 'standard', name: 'Standard', note: 'Printed vinyl with gloss laminate' },
  { id: 'holographic', name: 'Holographic', note: 'Holographic underprint (production handling to be confirmed)' },
];
