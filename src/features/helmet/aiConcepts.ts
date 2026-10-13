/* SIMULATED AI concept generator (future phase). No AI service is connected:
   concepts are procedural layouts seeded from the prompt text, with a palette taken
   from colour words and hydro-dip films picked from the real film library. */
import type { DrawLayer, Film, HelmetDesign, Paint } from '@/core/types';
import { UV_W } from '@/core/uv';
import { uid, hashOf } from '@/core/util';
import { PALETTE } from '@/core/color';
import { FILMS } from '@/data/films';
import { filmRenders } from './builder/SafeFilmPicker';

export interface AiConcept {
  id: string;
  name: string;
  blurb: string;
  design: HelmetDesign;
}

const COLOUR_WORDS: [RegExp, string, string][] = [
  [/\b(red|crimson|scarlet|ferrari)\b/, '#e3262b', 'red'],
  [/\b(navy|midnight)\b/, '#14254d', 'navy'],
  [/\b(blue|cobalt|azure)\b/, '#1f6feb', 'blue'],
  [/\b(lime|neon|acid)\b/, '#c8f031', 'lime'],
  [/\b(green|emerald|racing green)\b/, '#159a49', 'green'],
  [/\b(yellow|sunshine)\b/, '#ffd000', 'yellow'],
  [/\b(orange|papaya)\b/, '#ff6a13', 'orange'],
  [/\b(purple|violet)\b/, '#7442d6', 'purple'],
  [/\b(pink|magenta)\b/, '#ec4c9b', 'pink'],
  [/\b(white|snow|clean)\b/, '#f5f5f2', 'white'],
  [/\b(black|dark|stealth)\b/, '#121412', 'black'],
  [/\b(silver|grey|gray|chrome)\b/, '#a6abb3', 'silver'],
  [/\b(gold|golden)\b/, '#c9a23c', 'gold'],
  [/\b(teal|cyan|turquoise)\b/, '#0fa3a3', 'teal'],
  [/\b(gunmetal)\b/, '#4a4f57', 'gunmetal'],
  [/\b(burgundy|maroon|wine)\b/, '#7a1530', 'burgundy'],
];

const FILM_WORDS: [RegExp, Film['pattern'][]][] = [
  [/carbon|kevlar|weave/, ['carbon']],
  [/forged/, ['forged']],
  [/hex|honeycomb/, ['hex']],
  [/camo|military|army/, ['camo', 'digital']],
  [/marble|stone/, ['marble']],
  [/holo|rainbow|iridescent|prism/, ['holo']],
  [/flame|fire|hot ?rod/, ['flame']],
  [/wood|timber/, ['wood']],
  [/tiger|stripe/, ['tiger']],
  [/snake|python|reptile|scale/, ['snake']],
  [/galaxy|space|star|cosmic|nebula/, ['galaxy']],
  [/brushed|metal|steel|aluminium/, ['brushed']],
  [/water|ocean|wave|sea/, ['water', 'wave']],
  [/digital|pixel/, ['digital']],
  [/check|chequer|flag/, ['check']],
  [/splatter|paint ?splash|graffiti/, ['splatter']],
];

const STYLES = ['sweep', 'stripes', 'chevrons', 'bands', 'bubbles', 'flames', 'split'] as const;
type Style = (typeof STYLES)[number];
const STYLE_NAME: Record<Style, string> = {
  sweep: 'Sweep', stripes: 'Crown Stripes', chevrons: 'Chevrons', bands: 'Eye-line Bands', bubbles: 'Pop Dots', flames: 'Flame Licks', split: 'Hard Split',
};

function rng(seed: string) {
  let s = parseInt(hashOf(seed).slice(0, 8), 16) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const solid = (color: string): Paint => ({ kind: 'solid', color });
const filmPaint = (f: Film): Paint => ({ kind: 'film', filmId: f.id, tint: null });

/** Mirror a layer from the left side of UV space onto the right side. */
export function mirrorLayer(l: DrawLayer): DrawLayer {
  const id = uid('dl_');
  if (l.type === 'stroke') return { ...l, id, points: l.points.map(([x, y]) => [UV_W - x, y] as [number, number]) };
  if (l.type === 'stripe') return { ...l, id, x1: UV_W - l.x1, x2: UV_W - l.x2 };
  return { ...l, id, x: UV_W - l.x - l.w, rotation: -l.rotation };
}

function bezier(p0: number[], p1: number[], p2: number[], p3: number[], n = 24): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

function layout(style: Style, r: () => number, main: Paint, second: Paint, accent: Paint): DrawLayer[] {
  const L: DrawLayer[] = [];
  const j = (n: number) => (r() - 0.5) * n;
  const stroke = (pts: [number, number][], width: number, paint: Paint) => L.push({ id: uid('dl_'), type: 'stroke', points: pts, width, paint });
  const stripe = (x1: number, y1: number, x2: number, y2: number, width: number, paint: Paint) => L.push({ id: uid('dl_'), type: 'stripe', x1, y1, x2, y2, width, paint });
  switch (style) {
    case 'sweep': {
      const lift = j(120);
      stroke(bezier([-20, 760 + lift], [260, 720], [520, 420 + lift], [930, 380]), 120 + j(40), main);
      stroke(bezier([-20, 640 + lift], [260, 610], [520, 330 + lift], [900, 300]), 26, accent);
      stroke(bezier([-20, 870], [300, 860], [600, 640], [960, 720]), 50, second);
      break;
    }
    case 'stripes': {
      const w = 70 + j(30);
      stripe(1024, -20, 1024, 440, w, main);
      stripe(0, -20, 0, 820, w, main);
      stripe(UV_W, -20, UV_W, 820, w, main);
      stripe(1024 - w * 1.2, -20, 1024 - w * 1.2, 440, w * 0.3, accent);
      stripe(1024 + w * 1.2, -20, 1024 + w * 1.2, 440, w * 0.3, accent);
      stripe(w * 1.2, -20, w * 1.2, 800, w * 0.3, accent);
      L.push({ id: uid('dl_'), type: 'rect', x: -10, y: 820, w: 1040, h: 220, rotation: 0, paint: second });
      break;
    }
    case 'chevrons': {
      const n = 3;
      const x0 = 150 + j(80);
      for (let i = 0; i < n; i++) {
        const x = x0 + i * 170, p = i === n - 1 ? accent : main;
        stripe(x, 290, x + 210, 520, 56, p);
        stripe(x + 210, 520, x, 750, 56, p);
      }
      L.push({ id: uid('dl_'), type: 'rect', x: 700, y: 760, w: 340, h: 280, rotation: 0, paint: second });
      break;
    }
    case 'bands': {
      const y = 360 + j(60);
      L.push({ id: uid('dl_'), type: 'rect', x: -10, y, w: 1040, h: 90, rotation: 0, paint: main });
      L.push({ id: uid('dl_'), type: 'rect', x: -10, y: y + 104, w: 1040, h: 20, rotation: 0, paint: accent });
      L.push({ id: uid('dl_'), type: 'rect', x: -10, y: 740, w: 1040, h: 300, rotation: 0, paint: second });
      break;
    }
    case 'bubbles': {
      L.push({ id: uid('dl_'), type: 'rect', x: -10, y: 700, w: 1040, h: 340, rotation: 0, paint: second });
      for (let i = 0; i < 9; i++) {
        const s = 60 + r() * 150;
        L.push({ id: uid('dl_'), type: 'ellipse', x: 60 + r() * 640, y: 160 + r() * 500, w: s, h: s, rotation: 0, paint: i % 3 === 0 ? accent : main });
      }
      break;
    }
    case 'flames': {
      L.push({ id: uid('dl_'), type: 'rect', x: 600, y: 700, w: 440, h: 340, rotation: 0, paint: main });
      for (let i = 0; i < 5; i++) {
        const y = 520 + i * 70 + j(30), len = 420 + r() * 300;
        stroke(bezier([1000, 900], [800, y + 40], [700 - len * 0.2, y - 80], [Math.max(40, 900 - len), y - 40 - r() * 120]), 70 - i * 6, i % 2 ? accent : main);
      }
      break;
    }
    case 'split': {
      stripe(-20, 560 + j(80), 1040, 700 + j(80), 640, second);
      stripe(-20, 250 + j(40), 1040, 380 + j(40), 30, accent);
      stripe(-20, 300 + j(40), 1040, 430 + j(40), 90, main);
      break;
    }
  }
  return [...L, ...L.map(mirrorLayer)];
}

function pickFilm(prompt: string, r: () => number, colourWords: string[]): Film | null {
  const patterns = FILM_WORDS.filter(([re]) => re.test(prompt)).flatMap(([, p]) => p);
  if (!patterns.length) return null;
  let pool = FILMS.filter((f) => f.available && patterns.includes(f.pattern) && filmRenders(f));
  const byColour = pool.filter((f) => colourWords.some((c) => f.name.toLowerCase().includes(c)));
  if (byColour.length) pool = byColour;
  const stocked = pool.filter((f) => f.stocked);
  if (stocked.length) pool = stocked;
  return pool.length ? pool[Math.floor(r() * pool.length)] : null;
}

/** Produce three concept designs from a prompt. `round` re-rolls for "Revise". */
export function generateConcepts(
  prompt: string, base: HelmetDesign, references: { name: string; src: string }[], round = 0,
): AiConcept[] {
  const p = prompt.toLowerCase();
  const r = rng(p + '|' + round + '|' + references.length);
  const hits = COLOUR_WORDS.filter(([re]) => re.test(p));
  let colours = hits.map(([, hex]) => hex);
  const colourWords = hits.map(([, , w]) => w);
  // Fill the palette from the house set when the prompt names fewer than three colours.
  const fill = PALETTE.map(([, h]) => h).filter((h) => !colours.includes(h));
  while (colours.length < 4) colours.push(fill.splice(Math.floor(r() * fill.length), 1)[0]);
  if (/\b(retro|classic|heritage|vintage)\b/.test(p)) colours = [colours[0], '#f5f5f2', colours[1], colours[2]];
  const film = pickFilm(p, r, colourWords);

  // Choose three distinct styles, nudged by mood words.
  const preferred: Style[] = [];
  if (/aggress|fast|speed|sharp|attack/.test(p)) preferred.push('chevrons', 'split');
  if (/flame|fire|hot/.test(p)) preferred.push('flames');
  if (/retro|classic|heritage|vintage/.test(p)) preferred.push('bands', 'stripes');
  if (/fun|pop|kid|playful|dots?/.test(p)) preferred.push('bubbles');
  if (/flow|smooth|wave|swoosh|sweep/.test(p)) preferred.push('sweep');
  const order = [...new Set([...preferred, ...[...STYLES].sort(() => r() - 0.5)])].slice(0, 3);

  return order.map((style, i) => {
    const c = [...colours.slice(i % 2), ...colours.slice(0, i % 2)];
    const useFilmOnBase = film && (i === 0 || (i === 2 && r() > 0.4));
    const basePaint: Paint = useFilmOnBase && film ? filmPaint(film) : solid(c[0]);
    const main = film && !useFilmOnBase && i === 1 ? filmPaint(film) : solid(c[1]);
    const conceptId = uid('ai_');
    const design: HelmetDesign = {
      ...base,
      source: 'ai',
      templateId: null,
      zonePaints: {},
      basePaint,
      drawing: layout(style, r, main, solid(c[2]), solid(c[3])),
      artwork: null,
      ai: { prompt, references, conceptId },
    };
    const label = String.fromCharCode(65 + i);
    const bits = [STYLE_NAME[style].toLowerCase(), basePaint.kind === 'film' && film ? `${film.name} base` : null, main.kind === 'film' && film ? `${film.name} graphic` : null].filter(Boolean);
    return { id: conceptId, name: `Concept ${label} · ${STYLE_NAME[style]}`, blurb: bits.join(' · '), design };
  });
}
