/* Procedural, seamlessly tiling film swatches drawn on canvas.
   ILLUSTRATIVE ONLY: real film scans replace these when supplied. */
import type { Film, Paint } from './types';
import { hexToRgb, tintPalette } from './color';
import { filmById } from '@/data/films';

export const TILE = 256;

/* ---------- seeded random & periodic noise ---------- */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5 >>> 0) / 4294967296);
}
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function makeNoise(seed: number) {
  const r = rng(seed);
  const P = 64;
  const grid = new Float32Array(P * P).map(() => r());
  // periodic value noise; period = `cells` across the tile
  return (x: number, y: number, cells: number) => {
    const fx = (x / TILE) * cells, fy = (y / TILE) * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const g = (i: number, j: number) => grid[(((j % cells) + cells) % cells) * P + (((i % cells) + cells) % cells)];
    const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(noise: ReturnType<typeof makeNoise>, x: number, y: number, base: number, oct = 4) {
  let v = 0, amp = 0.5, cells = base, norm = 0;
  for (let o = 0; o < oct; o++) { v += noise(x, y, cells) * amp; norm += amp; amp *= 0.5; cells *= 2; }
  return v / norm;
}

function lerpColor(stops: [number, number, number][], t: number): [number, number, number] {
  t = Math.max(0, Math.min(0.9999, t));
  const p = t * (stops.length - 1);
  const i = Math.floor(p), f = p - i;
  const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

type Ctx = CanvasRenderingContext2D;

/** Draw a shape at the 9 wrap offsets so the tile repeats seamlessly. */
function wrapped(ctx: Ctx, draw: (ox: number, oy: number) => void) {
  for (const ox of [-TILE, 0, TILE]) for (const oy of [-TILE, 0, TILE]) draw(ox, oy);
}

function pixels(ctx: Ctx, fn: (x: number, y: number) => [number, number, number]) {
  const img = ctx.createImageData(TILE, TILE);
  const d = img.data;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const c = fn(x, y);
    const k = (y * TILE + x) * 4;
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function drawFilm(ctx: Ctx, film: Film, cols: string[], seed: number) {
  const R = rng(seed);
  const rgb = cols.map(hexToRgb);
  const noise = makeNoise(seed);
  const c = (i: number) => cols[Math.min(cols.length - 1, i)];
  ctx.fillStyle = c(0);
  ctx.fillRect(0, 0, TILE, TILE);

  switch (film.pattern) {
    case 'carbon': {
      const cell = film.name.includes('Fine') ? 8 : film.name.includes('Wide') ? 32 : 16;
      for (let y = 0; y < TILE; y += cell) for (let x = 0; x < TILE; x += cell) {
        const odd = ((x / cell + y / cell) % 2) === 0;
        const g = odd ? ctx.createLinearGradient(x, y, x, y + cell) : ctx.createLinearGradient(x, y, x + cell, y);
        g.addColorStop(0, c(odd ? 2 : 1)); g.addColorStop(0.5, c(1)); g.addColorStop(1, c(0));
        ctx.fillStyle = g;
        ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }
      break;
    }
    case 'forged':
      for (let i = 0; i < 240; i++) {
        const x = R() * TILE, y = R() * TILE, s = 6 + R() * 22, a = R() * Math.PI;
        ctx.fillStyle = c(1 + Math.floor(R() * (cols.length - 1)));
        ctx.globalAlpha = 0.55 + R() * 0.45;
        const pts = Array.from({ length: 4 + Math.floor(R() * 3) }, (_, k) => {
          const t = a + (k / 5) * Math.PI * 2 + R() * 0.6;
          const rr = s * (0.4 + R() * 0.6);
          return [Math.cos(t) * rr, Math.sin(t) * rr];
        });
        wrapped(ctx, (ox, oy) => {
          ctx.beginPath();
          pts.forEach(([px, py], k) => (k ? ctx.lineTo(x + px + ox, y + py + oy) : ctx.moveTo(x + px + ox, y + py + oy)));
          ctx.closePath(); ctx.fill();
        });
      }
      ctx.globalAlpha = 1;
      break;
    case 'hex': {
      const r = TILE / (Math.sqrt(3) * 8);
      const w = Math.sqrt(3) * r;
      ctx.strokeStyle = c(2); ctx.lineWidth = Math.max(1.5, r * 0.18);
      ctx.fillStyle = c(1);
      for (let row = -1; row < TILE / (1.5 * r) + 1; row++) for (let col = -1; col < 9; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * 1.5 * r;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const t = Math.PI / 6 + (k * Math.PI) / 3;
          const px = cx + Math.cos(t) * r * 0.9, py = cy + Math.sin(t) * r * 0.9;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'camo':
      for (let layer = 1; layer < cols.length; layer++) {
        ctx.fillStyle = c(layer);
        for (let i = 0; i < 14 - layer * 2; i++) {
          const x = R() * TILE, y = R() * TILE, rx = 18 + R() * 34, ry = 10 + R() * 22, a = R() * Math.PI;
          const pts = Array.from({ length: 9 }, (_, k) => {
            const t = (k / 9) * Math.PI * 2;
            const m = 0.65 + R() * 0.5;
            return [Math.cos(t) * rx * m, Math.sin(t) * ry * m];
          });
          wrapped(ctx, (ox, oy) => {
            ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(a);
            ctx.beginPath();
            pts.forEach(([px, py], k) => {
              const [nx, ny] = pts[(k + 1) % pts.length];
              if (!k) ctx.moveTo((px + nx) / 2, (py + ny) / 2);
              ctx.quadraticCurveTo(nx, ny, (nx + pts[(k + 2) % pts.length][0]) / 2, (ny + pts[(k + 2) % pts.length][1]) / 2);
            });
            ctx.closePath(); ctx.fill(); ctx.restore();
          });
        }
      }
      break;
    case 'digital': {
      const px = 8;
      for (let y = 0; y < TILE; y += px) for (let x = 0; x < TILE; x += px) {
        const n = fbm(noise, x, y, 4, 3);
        ctx.fillStyle = c(Math.min(cols.length - 1, Math.floor(n * cols.length * 1.1)));
        ctx.fillRect(x, y, px, px);
      }
      break;
    }
    case 'marble':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 2, 5);
        const v = Math.abs(Math.sin((x / TILE) * Math.PI * 2 + n * 9));
        const vein = Math.pow(v, 0.25);
        return lerpColor([rgb[rgb.length - 1], rgb[Math.max(0, rgb.length - 2)], rgb[0]], 1 - vein + n * 0.15);
      });
      break;
    case 'holo':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 2, 3);
        const t = ((x + y) / (TILE * 2) + n * 0.6 + Math.sin((x / TILE) * Math.PI * 4) * 0.08) % 1;
        const base = lerpColor(rgb.concat([rgb[0]]), (t + 1) % 1);
        const sh = Math.pow(Math.abs(Math.sin(((x - y) / TILE) * Math.PI * 6)), 18) * 70;
        return [base[0] + sh, base[1] + sh, base[2] + sh];
      });
      break;
    case 'galaxy':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 2, 5);
        const neb = Math.pow(Math.max(0, n - 0.35) / 0.65, 1.6);
        return lerpColor([rgb[0], rgb[1], rgb[2] || rgb[1]], neb);
      });
      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + R() * 0.6) + ')';
        const s = R() < 0.9 ? 1 : 2;
        ctx.fillRect(Math.floor(R() * TILE), Math.floor(R() * TILE), s, s);
      }
      break;
    case 'wood':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 2, 4);
        const ring = (Math.sin((y / TILE) * Math.PI * 2 * 6 + n * 14) + 1) / 2;
        const grain = noise(x, y, 64) * 0.18;
        return lerpColor(rgb, ring * 0.85 + grain);
      });
      break;
    case 'tiger':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 2, 4);
        const s = Math.sin((x / TILE) * Math.PI * 2 * 7 + n * 10 + Math.sin((y / TILE) * Math.PI * 2) * 2);
        return s > 0.35 ? rgb[0] : lerpColor([rgb[1], rgb[2] || rgb[1]], noise(x, y, 8));
      });
      break;
    case 'dots':
      ctx.fillStyle = c(cols.length > 2 ? 2 : 1);
      ctx.fillRect(0, 0, TILE, TILE);
      for (let i = 0; i < 60; i++) {
        const x = R() * TILE, y = R() * TILE, r = 5 + R() * 9, rot = R() * 3;
        wrapped(ctx, (ox, oy) => {
          ctx.fillStyle = c(0);
          ctx.beginPath(); ctx.ellipse(x + ox, y + oy, r * 1.15, r, rot, 0, Math.PI * 2); ctx.fill();
          if (cols.length > 2 && film.name !== 'Dalmatian' && film.name !== 'Polka Dots') {
            ctx.fillStyle = c(1);
            ctx.beginPath(); ctx.ellipse(x + ox, y + oy, r * 0.55, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
      break;
    case 'snake': {
      const s = 16;
      for (let row = -1; row < TILE / (s * 0.75) + 1; row++) for (let col = -1; col < TILE / s + 1; col++) {
        const x = col * s + (row % 2 ? s / 2 : 0), y = row * s * 0.75;
        const n = fbm(noise, ((x % TILE) + TILE) % TILE, ((y % TILE) + TILE) % TILE, 4, 2);
        const g = ctx.createRadialGradient(x, y - s * 0.2, 1, x, y, s * 0.7);
        g.addColorStop(0, c(2)); g.addColorStop(0.7, c(n > 0.5 ? 1 : 2)); g.addColorStop(1, c(0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y, s * 0.56, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'geo': {
      const n = 8, s = TILE / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        for (const tri of [0, 1]) {
          ctx.fillStyle = c(Math.floor(R() * cols.length));
          ctx.beginPath();
          if (tri) { ctx.moveTo(x * s, y * s); ctx.lineTo((x + 1) * s, y * s); ctx.lineTo(x * s, (y + 1) * s); }
          else { ctx.moveTo((x + 1) * s, y * s); ctx.lineTo((x + 1) * s, (y + 1) * s); ctx.lineTo(x * s, (y + 1) * s); }
          ctx.closePath(); ctx.fill();
        }
      }
      break;
    }
    case 'check': {
      const n = 8, s = TILE / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? c(0) : c(1);
        ctx.fillRect(x * s, y * s, s, s);
      }
      break;
    }
    case 'stripe': {
      const p = TILE / 8;
      ctx.save();
      for (let k = -16; k < 24; k++) {
        ctx.fillStyle = c(1 + (k & 1 ? 1 : 0));
        ctx.beginPath();
        ctx.moveTo(k * p, 0); ctx.lineTo(k * p + p * 0.45, 0); ctx.lineTo(k * p + p * 0.45 - TILE, TILE); ctx.lineTo(k * p - TILE, TILE);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'brushed':
      pixels(ctx, (x, y) => {
        const n = noise(x * 0.02, y, 128) * 0.6 + noise(x, y, 4) * 0.4;
        return lerpColor(rgb, n);
      });
      break;
    case 'water':
      pixels(ctx, (x, y) => {
        const n = fbm(noise, x, y, 3, 4);
        const v = Math.pow(1 - Math.abs(Math.sin(n * Math.PI * 5)), 6);
        return lerpColor(rgb, Math.min(1, n * 0.6 + v * 0.7));
      });
      break;
    case 'wave':
      pixels(ctx, (x, y) => {
        const t = (y / TILE + Math.sin((x / TILE) * Math.PI * 2 * 2) * 0.08 + fbm(noise, x, y, 2, 2) * 0.05) * 4;
        return rgb[Math.floor(((t % 1) + 1) % 1 * rgb.length) % rgb.length];
      });
      break;
    case 'flame': {
      ctx.fillStyle = c(0); ctx.fillRect(0, 0, TILE, TILE);
      const layers = cols.slice(1);
      layers.forEach((col, li) => {
        ctx.fillStyle = col;
        for (let i = 0; i < 7; i++) {
          const x = (i / 7) * TILE + R() * 10, len = 90 + R() * 110 - li * 22, w = 22 - li * 4, y = TILE * 0.95;
          wrapped(ctx, (ox, oy) => {
            ctx.beginPath();
            ctx.moveTo(x + ox - w, y + oy);
            ctx.bezierCurveTo(x + ox - w, y + oy - len * 0.5, x + ox + w * 1.6, y + oy - len * 0.6, x + ox + w * 0.4, y + oy - len);
            ctx.bezierCurveTo(x + ox + w * 2.2, y + oy - len * 0.55, x + ox + w * 1.2, y + oy - len * 0.2, x + ox + w, y + oy);
            ctx.closePath(); ctx.fill();
          });
        }
      });
      break;
    }
    case 'splatter':
      ctx.fillStyle = c(0); ctx.fillRect(0, 0, TILE, TILE);
      for (let i = 0; i < 70; i++) {
        const x = R() * TILE, y = R() * TILE, r = R() < 0.8 ? 2 + R() * 6 : 10 + R() * 18;
        ctx.fillStyle = c(1 + Math.floor(R() * (cols.length - 1)));
        const drops = r > 9 ? Array.from({ length: 6 }, () => { const t = R() * Math.PI * 2, d = r + 4 + R() * 14; return [Math.cos(t) * d, Math.sin(t) * d, 1 + R() * 3]; }) : [];
        wrapped(ctx, (ox, oy) => {
          ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2); ctx.fill();
          for (const [dx, dy, dr] of drops) { ctx.beginPath(); ctx.arc(x + ox + dx, y + oy + dy, dr, 0, Math.PI * 2); ctx.fill(); }
        });
      }
      break;
  }
}

const tileCache = new Map<string, HTMLCanvasElement>();

/** Seamless swatch tile for a film + optional tint. */
export function filmTile(film: Film, tint: string | null): HTMLCanvasElement {
  const key = film.id + '|' + (tint || '');
  const hit = tileCache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d')!;
  drawFilm(ctx, film, film.tintable ? tintPalette(film.colors, tint) : film.colors, hashStr(film.id));
  tileCache.set(key, cv);
  return cv;
}

/** Small preview data URL for UI lists. */
const thumbCache = new Map<string, string>();
export function filmThumb(film: Film, tint: string | null = null, size = 96): string {
  const key = film.id + '|' + (tint || '') + '|' + size;
  const hit = thumbCache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(filmTile(film, tint), 0, 0, TILE * 0.6, TILE * 0.6, 0, 0, size, size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const url = cv.toDataURL('image/png');
  thumbCache.set(key, url);
  return url;
}

const imgCache = new Map<string, HTMLImageElement>();
/** Load (and cache) an image for canvas drawing; resolves immediately if loaded. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imgCache.get(src);
  if (hit && hit.complete) return Promise.resolve(hit);
  return new Promise((res) => {
    const img = hit || new Image();
    imgCache.set(src, img);
    img.onload = () => res(img);
    img.onerror = () => res(img);
    if (!hit) img.src = src;
  });
}
export const cachedImage = (src: string) => {
  const i = imgCache.get(src);
  return i && i.complete && i.naturalWidth ? i : null;
};

/** Canvas fill style for any Paint. `scale` controls pattern size. */
export function paintStyle(ctx: CanvasRenderingContext2D, paint: Paint, scale = 1): string | CanvasPattern {
  if (paint.kind === 'solid') return paint.color;
  if (paint.kind === 'film') {
    const film = filmById(paint.filmId);
    if (!film) return '#888';
    const pat = ctx.createPattern(filmTile(film, paint.tint), 'repeat')!;
    pat.setTransform(new DOMMatrix().scale(scale));
    return pat;
  }
  const img = cachedImage(paint.src);
  if (!img) { loadImage(paint.src); return '#9aa0a6'; }
  const pat = ctx.createPattern(img, 'repeat')!;
  pat.setTransform(new DOMMatrix().scale((scale * 256) / Math.max(img.width, 1)));
  return pat;
}
