/* SIMULATED AI concepts: no AI service is connected. Concepts are assembled procedurally from
   keywords in the prompt and colours sampled from reference images, using the 20 kit templates. */
import type { KartDesign } from '@/core/types';
import { hashOf, nowISO, uid } from '@/core/util';
import { luminance } from '@/core/color';
import { bodyworkById, KART_TEMPLATES } from '@/data/kart';
import { newKartDesign } from '@/domain/kart';
import { NAME_LAYER, NUMBER_LAYER, setQuick } from './kartEdit';

export interface Concept {
  id: string;
  design: KartDesign;
  templateName: string;
  colors: [string, string, string];
  why: string;
}

const COLOUR_WORDS: [RegExp, string, string][] = [
  [/\b(black|dark|stealth|night)\b/, 'black', '#121412'],
  [/\b(white|clean|ice|snow)\b/, 'white', '#f5f5f2'],
  [/\b(lime|neon|acid|fluo|fluro)\b/, 'lime', '#c8f031'],
  [/\b(red|fire|ferrari|scarlet)\b/, 'red', '#e3262b'],
  [/\b(blue|electric|ocean|cobalt)\b/, 'blue', '#1f6feb'],
  [/\b(navy|midnight)\b/, 'navy', '#14254d'],
  [/\b(yellow|sun|gold(en)?\s?yellow)\b/, 'yellow', '#ffd000'],
  [/\b(orange|papaya|mclaren)\b/, 'orange', '#ff6a13'],
  [/\b(green|racing green|forest)\b/, 'green', '#159a49'],
  [/\b(purple|violet)\b/, 'purple', '#7442d6'],
  [/\b(pink|magenta)\b/, 'pink', '#ec4c9b'],
  [/\b(silver|grey|gray|chrome)\b/, 'silver', '#a6abb3'],
  [/\b(gunmetal|graphite|carbon)\b/, 'gunmetal', '#4a4f57'],
  [/\b(gold|champagne)\b/, 'gold', '#c9a23c'],
  [/\b(teal|turquoise|aqua)\b/, 'teal', '#0fa3a3'],
  [/\b(burgundy|maroon|wine)\b/, 'burgundy', '#7a1530'],
];

const STYLE_WORDS: [RegExp, string, string[]][] = [
  [/\b(aggressive|sharp|angular|attack|edgy)\b/, 'aggressive', ['Apex', 'Shards', 'Dagger', 'Overtake', 'Stinger']],
  [/\b(retro|classic|heritage|vintage|old school|gulf)\b/, 'heritage', ['Heritage', 'Tri-Stripe', 'Flag', 'Split']],
  [/\b(clean|minimal|simple|subtle)\b/, 'minimal', ['Clean', 'Split', 'Fade', 'Halo']],
  [/\b(fast|speed|lightning|electric|bolt)\b/, 'speed', ['Velocity', 'Bolt', 'Comet', 'Pulse']],
  [/\b(tech|digital|future|cyber|hex)\b/, 'tech', ['Hex Tech', 'Pulse', 'Shards']],
  [/\b(stripe|stripes|line|lines)\b/, 'stripes', ['Tri-Stripe', 'Pulse', 'Heritage', 'Ribbon']],
  [/\b(flag|chequer|checker|check)\b/, 'chequered', ['Flag']],
  [/\b(wing|wings|bird|eagle)\b/, 'wings', ['Wings', 'Boomerang']],
  [/\b(wave|flow|ribbon|swoosh)\b/, 'flow', ['Ribbon', 'Boomerang', 'Fade']],
];

function rng(seed: string) {
  let h = parseInt(hashOf(seed).slice(0, 8), 16) || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

const dist = (a: string, b: string) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/** Dominant colours from an image (simple quantised histogram). */
export async function samplePalette(src: string, max = 4): Promise<string[]> {
  const img = await new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  if (!img) return [];
  const c = document.createElement('canvas');
  c.width = 48; c.height = 48;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 48, 48);
  let data: Uint8ClampedArray;
  try { data = ctx.getImageData(0, 0, 48, 48).data; } catch { return []; }
  const counts = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const q = (v: number) => Math.min(255, Math.round(v / 32) * 32);
    const hex = '#' + [q(data[i]), q(data[i + 1]), q(data[i + 2])].map((v) => v.toString(16).padStart(2, '0')).join('');
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const out: string[] = [];
  for (const [hex] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    if (out.every((o) => dist(o, hex) > 70)) out.push(hex);
    if (out.length >= max) break;
  }
  return out;
}

export function parsePrompt(prompt: string) {
  const p = prompt.toLowerCase();
  const colours = COLOUR_WORDS.filter(([re]) => re.test(p)).map(([, name, hex]) => ({ name, hex }));
  const styles = STYLE_WORDS.filter(([re]) => re.test(p)).map(([, name, tpls]) => ({ name, tpls }));
  const num = prompt.match(/(?:#|\bno\.?\s*|\bnumber\s*)(\d{1,3})\b/i)?.[1] ?? null;
  const name = prompt.match(/\b(?:name|driver)\s*[:=]?\s*["']?([A-Za-z][A-Za-z.'-]{1,18}(?:\s[A-Za-z][A-Za-z.'-]{1,18})?)/i)?.[1] ?? null;
  return { colours, styles, num, name: name ? name.toUpperCase() : null };
}

function triad(pool: string[], r: () => number, fallback: [string, string, string]): [string, string, string] {
  const p = [...new Set(pool.map((c) => c.toLowerCase()))];
  const pick = (exclude: string[], minDist: number) => {
    const cands = p.filter((c) => exclude.every((e) => dist(c, e) > minDist));
    return cands.length ? cands[Math.floor(r() * cands.length)] : null;
  };
  const a = p.length ? p[Math.floor(r() * Math.min(p.length, 2))] : fallback[0];
  const b = pick([a], 90) || (luminance(a) > 0.5 ? (dist(a, fallback[1]) > 90 ? fallback[1] : '#121412') : (dist(a, fallback[1]) > 90 ? fallback[1] : '#c8f031'));
  const c = pick([a, b], 60) || (luminance(a) > 0.5 ? '#121412' : '#f5f5f2');
  return [a, b, c];
}

/** Generate three concepts. `nonce` lets the user ask for a fresh set with the same prompt. */
export async function generateConcepts(args: {
  prompt: string; references: { src: string; name: string }[]; bodyworkId: string; nonce: number;
  keep: { name: string | null; number: string | null };
}): Promise<Concept[]> {
  const parsed = parsePrompt(args.prompt);
  const refColours = (await Promise.all(args.references.slice(0, 4).map((r) => samplePalette(r.src)))).flat();
  // Simulated "thinking" time.
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));
  const r = rng(`${args.prompt}|${refColours.join()}|${args.nonce}`);
  const styled = [...new Set(parsed.styles.flatMap((s) => s.tpls))];
  const pool = [...parsed.colours.map((c) => c.hex), ...refColours];

  const chosen: typeof KART_TEMPLATES = [];
  const byName = (n: string) => KART_TEMPLATES.find((t) => t.name === n);
  const shuffled = <T,>(xs: T[]) => xs.map((x) => [r(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
  for (const n of shuffled(styled)) { const t = byName(n); if (t && chosen.length < 2) chosen.push(t); }
  for (const t of shuffled(KART_TEMPLATES)) { if (chosen.length >= 3) break; if (!chosen.includes(t)) chosen.push(t); }

  const bw = bodyworkById(args.bodyworkId);
  const name = parsed.name || args.keep.name;
  const num = parsed.num || args.keep.number;
  const t = nowISO();

  return chosen.map((tpl, i) => {
    const colors = triad(pool.length ? shuffled(pool) : [], r, tpl.colors);
    let d: KartDesign = {
      ...newKartDesign(bw.id, null),
      name: `AI concept ${i + 1}: ${tpl.name}`,
      templateId: tpl.id,
      source: 'ai',
      panels: tpl.build(bw, colors),
      createdAt: t, updatedAt: t,
    };
    if (name) d = setQuick(d, NAME_LAYER, name);
    if (num) d = setQuick(d, NUMBER_LAYER, num);
    const bits = [
      parsed.styles.length && styled.includes(tpl.name) ? `${parsed.styles.map((s) => s.name).join(' / ')} layout` : 'wildcard layout',
      parsed.colours.length ? `colours from "${parsed.colours.map((c) => c.name).join(', ')}"` : refColours.length ? 'colours sampled from your references' : 'template colours',
    ];
    return { id: uid('ac_'), design: d, templateName: tpl.name, colors, why: bits.join(' · ') };
  });
}
