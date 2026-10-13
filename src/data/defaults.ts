import type { Settings } from '@/core/types';
import { FILMS } from './films';
import { HELMET_MODELS, HELMET_TEMPLATES } from './helmets';
import { BODYWORK } from './kart';
import { PRODUCTS } from './parts';

/** Default admin settings. Every price here is a SAMPLE value, editable in Workshop Admin. */
export function defaultSettings(): Settings {
  const t = new Date(0).toISOString();
  return {
    id: 'settings',
    helmet: {
      logoPrice: 12,
      namePrice: 15,
      numberPrice: 10,
      chromePrice: 180,
      satinPrice: 25,
      baseRubberPrice: 20,
      eyeRubberPrice: 20,
      plasticPrice: 25,
      spoilerPrice: 45,
      ownHelmetPrepFee: 40,
      templatePrices: Object.fromEntries(HELMET_TEMPLATES.map((x) => [x.id, x.startPrice])),
      modelPrices: Object.fromEntries(HELMET_MODELS.map((m) => [m.id, m.newPrice])),
    },
    films: Object.fromEntries(FILMS.map((f) => [f.id, { price: f.price, available: f.available, stocked: f.stocked, category: f.category }])),
    kart: {
      kitPrices: Object.fromEntries(BODYWORK.map((b, i) => [b.id, 149 + i * 10])),
      materialSurcharge: { standard: 0, holographic: 45 },
      panelPrices: { leftPod: 45, rightPod: 45, nassau: 30, frontBumper: 35 },
      options: [
        { id: 'matte', label: 'Matte laminate', price: 15 },
        { id: 'thick', label: 'Heavy-duty 120µm vinyl', price: 20 },
        { id: 'spare-numbers', label: 'Spare number set', price: 12 },
      ],
      designServiceFee: 60,
    },
    parts: {
      prices: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price])),
      effectFee: 35,
      traySticker: 49,
      textFee: 10,
      artworkHandling: 'quote',
      artworkFee: 25,
    },
    createdAt: t,
    updatedAt: t,
  };
}
