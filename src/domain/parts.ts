/* PROPOSED 2D parts customisation pricing. Every value here is a decision awaiting
   client confirmation, kept separate from helmet and kart-sticker pricing rules. */
import type { PartCustomisation, Product, Settings } from '@/core/types';

export function partCustomFee(p: Product, c: PartCustomisation | null, s: Settings): { fee: number; needsQuote: boolean; lines: { label: string; amount: number }[] } {
  if (!p.custom || !c) return { fee: 0, needsQuote: false, lines: [] };
  const lines: { label: string; amount: number }[] = [];
  if (p.custom.kind === 'tray-sticker') lines.push({ label: 'Floor-tray sticker', amount: s.parts.traySticker });
  else if (c.effect) lines.push({ label: 'Hydro-dip effect', amount: s.parts.effectFee });
  if (c.text.trim() && p.custom.allowText) lines.push({ label: 'Custom text', amount: s.parts.textFee });
  let needsQuote = false;
  if (c.artwork) {
    if (s.parts.artworkHandling === 'quote') needsQuote = true;
    else lines.push({ label: 'Artwork handling', amount: s.parts.artworkFee });
  }
  return { fee: lines.reduce((a, l) => a + l.amount, 0), needsQuote, lines };
}

export const productPrice = (p: Product, s: Settings) => s.parts.prices[p.id] ?? p.price;
