export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Recolour a palette onto a tint, keeping each colour's lightness (carbon + blue = blue carbon). */
export function tintPalette(colors: string[], tint: string | null): string[] {
  if (!tint) return colors;
  return colors.map((c) => {
    const l = luminance(c);
    return l < 0.5 ? mix('#000000', tint, Math.min(1, l * 2 * 0.95 + 0.05)) : mix(tint, '#ffffff', (l - 0.5) * 2 * 0.85);
  });
}

export const readableOn = (hex: string) => (luminance(hex) > 0.6 ? '#111311' : '#ffffff');

/** Standard swatch set used across configurators. */
export const PALETTE: [string, string][] = [
  ['White', '#f5f5f2'], ['Black', '#121412'], ['Lime', '#c8f031'], ['Racing Red', '#e3262b'],
  ['Electric Blue', '#1f6feb'], ['Navy', '#14254d'], ['Signal Yellow', '#ffd000'], ['Orange', '#ff6a13'],
  ['Green', '#159a49'], ['Purple', '#7442d6'], ['Pink', '#ec4c9b'], ['Silver', '#a6abb3'],
  ['Gunmetal', '#4a4f57'], ['Gold', '#c9a23c'], ['Teal', '#0fa3a3'], ['Burgundy', '#7a1530'],
];

/** About five rubber/plastic colours, per the client. */
export const TRIM_COLOURS: [string, string][] = [
  ['Black', '#121412'], ['Red', '#e3262b'], ['Blue', '#1f6feb'], ['Yellow', '#ffd000'], ['White', '#f5f5f2'],
];

export const colourName = (hex: string) =>
  (PALETTE.find(([, h]) => h.toLowerCase() === hex.toLowerCase()) || TRIM_COLOURS.find(([, h]) => h.toLowerCase() === hex.toLowerCase()) || ['Custom'])[0];
