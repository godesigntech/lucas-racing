import type { ID } from './types';

export const uid = (prefix = ''): ID =>
  prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const nowISO = () => new Date().toISOString();

export const money = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Stable JSON (sorted keys) for hashing snapshots. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stableStringify(o[k])).join(',') + '}';
}

/** Small non-cryptographic hash (FNV-1a, 2x32 bit) — identifies an exact design version. */
export function hashOf(v: unknown): string {
  const s = stableStringify(v);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export function refNo(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function readFileAsDataURL(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => {
      const src = String(r.result);
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return resolve(src);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (s === 1) return resolve(src);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    r.readAsDataURL(file);
  });
}

export const FONT_CSS: Record<string, string> = {
  barlow: "800 italic {s}px 'Barlow Condensed', 'Arial Narrow', sans-serif",
  anton: "400 {s}px Anton, Impact, sans-serif",
  racing: "400 {s}px 'Racing Sans One', Impact, sans-serif",
  bebas: "400 {s}px 'Bebas Neue', Impact, sans-serif",
  marker: "400 {s}px 'Permanent Marker', cursive",
  inter: "700 {s}px Inter, Arial, sans-serif",
};
export const FONT_LABEL: Record<string, string> = {
  barlow: 'Barlow Italic', anton: 'Anton', racing: 'Racing Sans', bebas: 'Bebas', marker: 'Marker', inter: 'Inter Bold',
};
export const fontCss = (font: string, px: number) => (FONT_CSS[font] || FONT_CSS.barlow).replace('{s}', String(Math.round(px)));
