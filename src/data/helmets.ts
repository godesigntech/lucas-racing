import type { HelmetModel, HelmetTemplate, Paint, TemplateZone } from '@/core/types';
import { sym, smoothPath, polyPath, mirrorPts, type Pt } from '@/core/uv';

/* Concept geometry only. These shapes do NOT accurately represent the
   manufacturers' helmets; real scanned/modelled assets will replace them. */
export const HELMET_MODELS: HelmetModel[] = [
  { id: 'arai-sk6', brand: 'Arai', name: 'SK-6', status: 'launch', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], newPrice: 520, shape: { length: 1.12, height: 1.0, chin: 0.22, eyePort: 1, tail: 0.1 }, spoilerCompatible: true },
  { id: 'bell-kc7', brand: 'Bell', name: 'KC7-CMR', status: 'launch', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], newPrice: 545, shape: { length: 1.15, height: 1.03, chin: 0.27, eyePort: 1.04, tail: 0.16 }, spoilerCompatible: true },
  { id: 'stilo-st5', brand: 'Stilo', name: 'ST5 (catalogue slot)', status: 'catalogue', sizes: ['S', 'M', 'L', 'XL'], newPrice: 610, shape: { length: 1.1, height: 0.98, chin: 0.24, eyePort: 1.02, tail: 0.12 }, spoilerCompatible: false },
  { id: 'arai-ck6', brand: 'Arai', name: 'CK-6 Youth (catalogue slot)', status: 'catalogue', sizes: ['XXS', 'XS', 'S'], newPrice: 430, shape: { length: 1.06, height: 0.96, chin: 0.2, eyePort: 1, tail: 0.08 }, spoilerCompatible: true },
  { id: 'slot-5', brand: 'TBC', name: 'Model slot 5 (unconfirmed)', status: 'unconfirmed', sizes: ['S', 'M', 'L'], newPrice: 0, shape: { length: 1.13, height: 1.01, chin: 0.25, eyePort: 1, tail: 0.14 }, spoilerCompatible: false },
  { id: 'slot-6', brand: 'TBC', name: 'Model slot 6 (unconfirmed)', status: 'unconfirmed', sizes: ['S', 'M', 'L'], newPrice: 0, shape: { length: 1.09, height: 0.99, chin: 0.21, eyePort: 1, tail: 0.11 }, spoilerCompatible: false },
];

export const modelById = (id: string) => HELMET_MODELS.find((m) => m.id === id) || HELMET_MODELS[0];
export const modelLabel = (m: HelmetModel) => `${m.brand} ${m.name}`;

/* ------------------------------------------------------------------ */
/* Templates: editable zones in UV space (left half, mirrored).        */
/* Original layouts inspired by classic racing-line styles.            */
/* ------------------------------------------------------------------ */

const solid = (color: string): Paint => ({ kind: 'solid', color });
const film = (filmId: string, tint: string | null = null): Paint => ({ kind: 'film', filmId, tint });
const W = '#f5f5f2', K = '#121412', L = '#c8f031', R = '#e3262b', B = '#1f6feb', Y = '#ffd000', N = '#14254d', O = '#ff6a13', S = '#a6abb3', P = '#7442d6';

const z = (id: string, name: string, path: string, defaultPaint: Paint): TemplateZone => ({ id, name, path, defaultPaint });
/** Band of given thickness offset along a centreline (left half). */
function band(line: Pt[], thick: number): Pt[] {
  const top = line.map(([x, y]) => [x, y - thick / 2] as Pt);
  const bot = line.map(([x, y]) => [x, y + thick / 2] as Pt).reverse();
  return [...top, ...bot];
}
/** Band that crosses the centre front, drawn as one shape across both halves. */
function frontBand(line: Pt[], thick: number): string {
  const full: Pt[] = [...line, ...mirrorPts(line).reverse().slice(1)];
  return polyPath(band(full, thick));
}

export const HELMET_TEMPLATES: HelmetTemplate[] = [
  {
    id: 't-velocity', name: 'Velocity', launch: true, startPrice: 245, basePaint: solid(W),
    description: 'Twin sweeping bands from chin to crown.',
    zones: [
      z('sweep', 'Main sweep', sym([[1030, 760], [1030, 900], [760, 820], [420, 600], [120, 420], [-10, 340], [-10, 220], [160, 300], [480, 470], [800, 650]]), solid(R)),
      z('pin', 'Pinstripe', sym(band([[-10, 170], [200, 240], [520, 400], [820, 590], [1030, 690]], 26)), solid(K)),
    ],
  },
  {
    id: 't-apex', name: 'Apex Lines', launch: true, startPrice: 275, basePaint: solid(K),
    description: 'Contrast crown with a forward side flash.',
    zones: [
      z('crown', 'Crown', smoothPath([[-10, -10], [2058, -10], [2058, 420], [1700, 330], [1290, 400], [1024, 420], [758, 400], [348, 330], [-10, 420]], 0.3), solid(L)),
      z('flash', 'Side flash', sym([[90, 520], [520, 470], [860, 560], [790, 610], [480, 600], [110, 640]]), solid(W)),
      z('edge', 'Crown edge', sym(band([[-10, 430], [348, 345], [758, 412], [1030, 432]], 22), false), solid(K)),
    ],
  },
  {
    id: 't-split', name: 'Split Second', launch: true, startPrice: 305, basePaint: solid(W),
    description: 'Diagonal split with a carbon lower half.',
    zones: [
      z('lower', 'Lower half', sym([[-10, 600], [300, 560], [640, 640], [1030, 760], [1030, 1034], [-10, 1034]], false), film('f-classic-carbon')),
      z('split', 'Split line', sym(band([[-10, 580], [300, 540], [640, 620], [1030, 740]], 24), false), solid(R)),
      z('cap', 'Rear cap', sym([[-10, -10], [300, -10], [200, 200], [-10, 260]]), solid(K)),
    ],
  },
  {
    id: 't-pulse', name: 'Pulse', launch: true, startPrice: 335, basePaint: solid(N),
    description: 'Triple pulse lines and a centre crown stripe.',
    zones: [
      z('p1', 'Pulse line 1', sym(band([[-10, 380], [260, 380], [330, 300], [400, 460], [470, 380], [880, 420], [1030, 430]], 26), false), solid(L)),
      z('p2', 'Pulse line 2', sym(band([[-10, 430], [260, 430], [330, 350], [400, 510], [470, 430], [860, 460], [1030, 470]], 14), false), solid(W)),
      z('centre', 'Centre stripe', polyPath([[960, -10], [1088, -10], [1078, 440], [970, 440]]) + ' ' + polyPath([[-10, -10], [70, -10], [70, 820], [-10, 820]]) + ' ' + polyPath([[1978, -10], [2058, -10], [2058, 820], [1978, 820]]), solid(W)),
    ],
  },
  {
    id: 't-overtake', name: 'Overtake', launch: true, startPrice: 365, basePaint: solid(Y),
    description: 'Big forward chevron with a contrast chin bar.',
    zones: [
      z('chev', 'Chevron', sym([[120, 260], [560, 520], [120, 780], [240, 780], [700, 520], [240, 260]], false), solid(K)),
      z('chev2', 'Chevron inner', sym([[330, 320], [690, 520], [330, 720], [400, 720], [780, 520], [400, 320]], false), solid(R)),
      z('chin', 'Chin bar', polyPath([[700, 700], [1348, 700], [1348, 1034], [700, 1034]]), solid(K)),
    ],
  },
  // ---------- expanded collection (full specification preview) ----------
  {
    id: 't-halo', name: 'Halo', launch: false, startPrice: 290, basePaint: solid(W), description: 'Crown ring with a lower fade.',
    zones: [
      z('ring', 'Halo ring', polyPath([[-10, 150], [2058, 150], [2058, 250], [-10, 250]]), solid(P)),
      z('ring2', 'Halo pinstripe', polyPath([[-10, 270], [2058, 270], [2058, 290], [-10, 290]]), solid(L)),
      z('base', 'Lower band', polyPath([[-10, 860], [2058, 860], [2058, 1034], [-10, 1034]]), solid(P)),
    ],
  },
  {
    id: 't-heritage', name: 'Heritage Band', launch: false, startPrice: 260, basePaint: solid(Y),
    description: 'Classic eye-line band all the way round.',
    zones: [
      z('band', 'Eye-line band', polyPath([[-10, 400], [2058, 400], [2058, 470], [-10, 470]]), solid(B)),
      z('band2', 'Lower band', polyPath([[-10, 690], [2058, 690], [2058, 740], [-10, 740]]), solid('#159a49')),
    ],
  },
  {
    id: 't-gills', name: 'Shark Gills', launch: false, startPrice: 320, basePaint: solid(S),
    description: 'Rear gill slashes and a nose fin.',
    zones: [
      z('gills', 'Gills', [0, 1, 2].map((i) => sym(band([[160 + i * 70, 380], [230 + i * 70, 720]], 26), false)).join(' '), solid(K)),
      z('fin', 'Crown fin', smoothPath([[950, -10], [1098, -10], [1060, 420], [988, 420]], 0.2) + ' ' + polyPath([[-10, -10], [90, -10], [60, 700], [-10, 700]]) + ' ' + polyPath([[1958, -10], [2058, -10], [2058, 700], [1988, 700]]), solid(B)),
    ],
  },
  {
    id: 't-bolt', name: 'Lightning', launch: false, startPrice: 340, basePaint: solid(K),
    description: 'Lightning bolt from crown to chin.',
    zones: [
      z('bolt', 'Bolt', sym([[180, 220], [520, 220], [420, 430], [640, 430], [300, 860], [380, 560], [170, 560]], false), solid(Y)),
      z('outline', 'Bolt shadow', sym([[205, 245], [545, 245], [445, 455], [665, 455], [325, 885], [405, 585], [195, 585]], false), solid(O)),
    ],
  },
  {
    id: 't-tristripe', name: 'Tri-Stripe', launch: false, startPrice: 285, basePaint: solid(W),
    description: 'Three stripes running front to back over the crown.',
    zones: [
      z('s1', 'Left stripe', polyPath([[880, -10], [940, -10], [940, 460], [880, 460]]) + ' ' + polyPath([[120, -10], [180, -10], [180, 760], [120, 760]]), solid(R)),
      z('s2', 'Centre stripe', polyPath([[990, -10], [1058, -10], [1058, 460], [990, 460]]) + ' ' + polyPath([[-10, -10], [40, -10], [40, 780], [-10, 780]]) + ' ' + polyPath([[2008, -10], [2058, -10], [2058, 780], [2008, 780]]), solid(N)),
      z('s3', 'Right stripe', polyPath([[1108, -10], [1168, -10], [1168, 460], [1108, 460]]) + ' ' + polyPath([[1868, -10], [1928, -10], [1928, 760], [1868, 760]]), solid(R)),
    ],
  },
  {
    id: 't-arrowhead', name: 'Arrowhead', launch: false, startPrice: 300, basePaint: solid(B),
    description: 'Forward arrows stacked along the side.',
    zones: [
      z('a1', 'Arrow 1', sym([[120, 420], [330, 520], [120, 620], [180, 620], [400, 520], [180, 420]], false), solid(W)),
      z('a2', 'Arrow 2', sym([[300, 420], [510, 520], [300, 620], [360, 620], [580, 520], [360, 420]], false), solid(W)),
      z('a3', 'Arrow 3', sym([[480, 420], [690, 520], [480, 620], [540, 620], [760, 520], [540, 420]], false), solid(Y)),
    ],
  },
  {
    id: 't-dagger', name: 'Dagger', launch: false, startPrice: 310, basePaint: solid(W),
    description: 'Long tapering blade from rear to eye-port.',
    zones: [
      z('blade', 'Blade', sym([[-10, 380], [300, 430], [800, 560], [300, 600], [-10, 640]]), solid(R)),
      z('edge', 'Blade edge', sym([[-10, 440], [300, 480], [700, 560], [300, 560], [-10, 580]]), solid(K)),
    ],
  },
  {
    id: 't-wings', name: 'Wings', launch: false, startPrice: 330, basePaint: solid(K),
    description: 'Swept wings rising to the crown.',
    zones: [
      z('w1', 'Wing', sym([[100, 700], [300, 300], [700, 120], [560, 300], [420, 520], [260, 760]]), solid(S)),
      z('w2', 'Wing tip', sym([[300, 300], [700, 120], [640, 200], [380, 330]]), solid(L)),
    ],
  },
  {
    id: 't-chequer', name: 'Chequer Top', launch: false, startPrice: 295, basePaint: solid(R),
    description: 'Chequered-flag crown with a clean lower half.',
    zones: [
      z('flag', 'Flag crown', smoothPath([[-10, -10], [2058, -10], [2058, 330], [1024, 360], [-10, 330]], 0.2), film('f-checkered-flag')),
      z('trim', 'Flag trim', polyPath([[-10, 330], [1024, 362], [2058, 330], [2058, 360], [1024, 392], [-10, 360]]), solid(W)),
    ],
  },
  {
    id: 't-fade', name: 'Fade Bands', launch: false, startPrice: 280, basePaint: solid(W),
    description: 'Stepped bands that fade towards the rear.',
    zones: [
      z('b1', 'Band 1', sym([[-10, 560], [1030, 640], [1030, 700], [-10, 620]], false), solid(B)),
      z('b2', 'Band 2', sym([[-10, 660], [1030, 730], [1030, 790], [-10, 720]], false), solid(N)),
      z('b3', 'Band 3', sym([[-10, 760], [1030, 820], [1030, 1034], [-10, 1034]], false), solid(K)),
    ],
  },
  {
    id: 't-comet', name: 'Comet', launch: false, startPrice: 315, basePaint: solid(N),
    description: 'Comet head on the side with a long tail.',
    zones: [
      z('head', 'Comet head', sym([[520, 470], [620, 430], [690, 520], [620, 610], [520, 570]]), solid(Y)),
      z('tail', 'Comet tail', sym([[-10, 380], [540, 470], [540, 570], [-10, 660]]), film('f-holographic')),
    ],
  },
  {
    id: 't-spear', name: 'Spear', launch: false, startPrice: 270, basePaint: solid(W),
    description: 'Front-pointing spear through the crown.',
    zones: [z('spear', 'Spear', frontBand([[-10, 300], [400, 260], [800, 360], [1024, 400]], 70), solid(L)), z('spear2', 'Spear outline', frontBand([[-10, 360], [400, 320], [800, 418], [1024, 455]], 16), solid(K))],
  },
  {
    id: 't-ribbon', name: 'Ribbon', launch: false, startPrice: 305, basePaint: solid(K),
    description: 'Twisting ribbon wrapping the helmet.',
    zones: [z('rib', 'Ribbon', sym(band([[-10, 700], [200, 600], [420, 460], [640, 420], [860, 380], [1030, 330]], 90)), solid(O)), z('rib2', 'Ribbon edge', sym(band([[-10, 770], [200, 670], [420, 530], [640, 490], [860, 450], [1030, 400]], 18)), solid(W))],
  },
  {
    id: 't-stinger', name: 'Stinger', launch: false, startPrice: 325, basePaint: solid(Y),
    description: 'Wasp-stripe rear with a sharp front point.',
    zones: [z('stripes', 'Rear stripes', [0, 1, 2, 3].map((i) => sym(band([[60 + i * 90, 200], [120 + i * 90, 860]], 40), false)).join(' '), solid(K)), z('point', 'Front point', polyPath([[880, 120], [1168, 120], [1024, 420]]), solid(K))],
  },
  {
    id: 't-boomerang', name: 'Boomerang', launch: false, startPrice: 290, basePaint: solid(W),
    description: 'Bent boomerang graphic on each side.',
    zones: [z('boom', 'Boomerang', sym([[160, 300], [520, 520], [160, 760], [240, 780], [640, 520], [240, 280]]), solid(B)), z('dot', 'Dot', sym([[680, 480], [740, 480], [740, 560], [680, 560]]), solid(R))],
  },
];

export const templateById = (id: string | null) => HELMET_TEMPLATES.find((t) => t.id === id) || null;
