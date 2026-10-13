/* Helmet UV canvas space.
   x: 0 = back centre → 512 = left side → 1024 = front (face) → 1536 = right side → 2048 = back.
   y: 0 = crown → 1024 = bottom rim.
   This matches THREE.SphereGeometry UVs with the helmet facing +X. */

export const UV_W = 2048;
export const UV_H = 1024;

/** Eye-port rectangle (concept geometry). */
export const EYE = { x0: 812, x1: 1236, y0: 470, y1: 668, r: 70 };

export type Pt = [number, number];

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
export function smoothPath(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2, p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2, p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export function polyPath(pts: Pt[]): string {
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z';
}

/** Mirror left-half points (x 0..1024) onto the right half (x 1024..2048). */
export const mirrorPts = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [UV_W - x, y] as Pt).reverse();

/** Path covering both sides of the helmet from left-half points. */
export function sym(pts: Pt[], smooth = true): string {
  const f = smooth ? smoothPath : polyPath;
  return f(pts) + ' ' + f(mirrorPts(pts));
}

/** Rounded-rect path for the eye port. */
export function eyePortPath(pad = 0): string {
  const { x0, x1, y0, y1, r } = EYE;
  const a = x0 - pad, b = x1 + pad, c = y0 - pad, d = y1 + pad, rr = r + pad;
  return `M${a + rr} ${c} L${b - rr} ${c} Q${b} ${c} ${b} ${c + rr} L${b} ${d - rr} Q${b} ${d} ${b - rr} ${d} L${a + rr} ${d} Q${a} ${d} ${a} ${d - rr} L${a} ${c + rr} Q${a} ${c} ${a + rr} ${c} Z`;
}

/** Where UI should place a layer when targeting a named side. */
export const SIDE_U = { left: 0.25, right: 0.75, front: 0.5, back: 0 };
