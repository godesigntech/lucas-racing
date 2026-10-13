import type { PartCustomSpec, Product } from '@/core/types';

/* SAMPLE catalogue: names, SKUs and prices are placeholders.
   No live MS Kart / ABRA supplier connection exists until an authorised feed is supplied. */

export const PART_CATEGORIES = [
  'Racing Karts', 'Frame Components', 'Steering', 'Brakes', 'Wheels & Hubs', 'Seats', 'Bodywork', 'Trolleys & Stands', 'Engine & Drive',
];

const LIMITED_EFFECTS = ['f-classic-carbon', 'f-hex-mesh', 'f-forged-carbon'];
const LIMITED_COLOURS = ['#121412', '#f5f5f2', '#e3262b', '#1f6feb', '#c8f031', '#ffd000'];

const spec = (kind: PartCustomSpec['kind'], art: string, mask: string, opts: Partial<PartCustomSpec> = {}): PartCustomSpec => ({
  kind, art, mask, allowText: true, allowArtwork: true, effects: LIMITED_EFFECTS, colors: LIMITED_COLOURS, ...opts,
});

/* Illustrations in a 400x260 viewBox. `mask` limits customisation to the surface. */
const TROLLEY_ART = `<rect x="40" y="40" width="320" height="170" rx="18" fill="#2b2f2c" stroke="#121412" stroke-width="6"/>
<rect x="62" y="60" width="276" height="130" rx="10" fill="#3a3f3b"/>
<path d="M360 80 L392 60 M360 170 L392 190 M392 60 L392 190" stroke="#121412" stroke-width="8" stroke-linecap="round" fill="none"/>
<circle cx="70" cy="222" r="16" fill="#121412"/><circle cx="330" cy="222" r="16" fill="#121412"/><circle cx="70" cy="28" r="16" fill="#121412"/><circle cx="330" cy="28" r="16" fill="#121412"/>`;
const TROLLEY_MASK = 'M72 60 H328 Q338 60 338 70 V180 Q338 190 328 190 H72 Q62 190 62 180 V70 Q62 60 72 60 Z';

const SEAT_MASK = 'M120 30 C150 20 190 24 206 50 L232 170 C236 186 250 196 270 198 L330 200 C350 202 356 222 340 232 L150 236 C126 236 110 222 106 200 L92 70 C90 48 100 36 120 30 Z';
const SEAT_ART = `<path d="${SEAT_MASK}" fill="#3a3f3b" stroke="#121412" stroke-width="6"/><circle cx="140" cy="90" r="7" fill="#121412"/><circle cx="160" cy="170" r="7" fill="#121412"/>`;

const NOSE_MASK = 'M20 190 C40 120 140 70 280 64 L360 66 C384 70 392 100 388 140 C384 178 370 200 340 206 L60 212 C34 212 16 204 20 190 Z';
const NOSE_ART = `<path d="${NOSE_MASK}" fill="#3a3f3b" stroke="#121412" stroke-width="6"/><path d="M60 196 L340 192" stroke="#121412" stroke-width="3" opacity=".5"/>`;

const NASSAU_MASK = 'M90 40 C160 20 240 20 310 40 L330 160 C310 220 240 244 200 246 C160 244 90 220 70 160 Z';
const NASSAU_ART = `<path d="${NASSAU_MASK}" fill="#3a3f3b" stroke="#121412" stroke-width="6"/><circle cx="200" cy="40" r="10" fill="#121412"/>`;

const GUARD_MASK = 'M30 150 C40 110 90 92 160 90 L330 88 C360 90 378 110 376 140 C374 168 356 182 330 184 L70 190 C44 190 26 176 30 150 Z';
const GUARD_ART = `<path d="${GUARD_MASK}" fill="#3a3f3b" stroke="#121412" stroke-width="6"/><circle cx="90" cy="140" r="9" fill="#121412"/><circle cx="320" cy="136" r="9" fill="#121412"/>`;

const WHEEL_MASK = 'M200 22 A108 108 0 1 1 199.9 22 Z M200 62 A68 68 0 1 0 200.1 62 Z';
const WHEEL_ART = `<path d="${WHEEL_MASK}" fill="#3a3f3b" fill-rule="evenodd" stroke="#121412" stroke-width="6"/><path d="M200 130 L200 196 M200 130 L136 160 M200 130 L264 160" stroke="#121412" stroke-width="14" stroke-linecap="round"/><circle cx="200" cy="130" r="26" fill="#121412"/>`;

const TANK_MASK = 'M110 50 H290 Q330 50 330 90 V200 Q330 230 300 230 H100 Q70 230 70 200 V90 Q70 50 110 50 Z';
const TANK_ART = `<path d="${TANK_MASK}" fill="#3a3f3b" stroke="#121412" stroke-width="6"/><rect x="170" y="26" width="60" height="30" rx="8" fill="#121412"/>`;

export const PRODUCTS: Product[] = [
  { id: 'p-prokart', sku: 'MS-PK-01', name: 'ProKart racing chassis (sample)', category: 'Racing Karts', price: 3450, description: 'Complete rolling chassis. Sample listing until the supplier feed is connected.', icon: 'kart', sample: true, custom: null },
  { id: 'p-cadet', sku: 'MS-CD-02', name: 'Cadet chassis (sample)', category: 'Racing Karts', price: 2890, description: 'Junior chassis for cadet classes.', icon: 'kart', sample: true, custom: null },
  { id: 'p-axle', sku: 'MS-AX-50M', name: 'Rear axle 50mm, medium (sample)', category: 'Frame Components', price: 149, description: 'Hollow steel rear axle.', icon: 'axle', sample: true, custom: null },
  { id: 'p-bearing', sku: 'MS-BR-50', name: 'Axle bearing 50mm (sample)', category: 'Frame Components', price: 38, description: 'Sealed axle bearing.', icon: 'hub', sample: true, custom: null },
  { id: 'p-spindle', sku: 'MS-SP-25', name: 'Front spindle pair 25mm (sample)', category: 'Frame Components', price: 96, description: 'Forged front spindles.', icon: 'hub', sample: true, custom: null },
  { id: 'p-wheel', sku: 'MS-SW-320', name: 'Steering wheel 320mm (sample)', category: 'Steering', price: 89, description: 'Suede-grip steering wheel.', icon: 'wheel', sample: true, custom: spec('surface', WHEEL_ART, WHEEL_MASK, { allowText: false }) },
  { id: 'p-column', sku: 'MS-SC-20', name: 'Steering column (sample)', category: 'Steering', price: 54, description: 'Steel steering column.', icon: 'axle', sample: true, custom: null },
  { id: 'p-disc', sku: 'MS-BD-V', name: 'Rear brake disc, vented (sample)', category: 'Brakes', price: 72, description: 'Vented cast-iron disc.', icon: 'disc', sample: true, custom: null },
  { id: 'p-caliper', sku: 'MS-BC-R', name: 'Rear brake caliper (sample)', category: 'Brakes', price: 189, description: 'Hydraulic rear caliper.', icon: 'disc', sample: true, custom: null },
  { id: 'p-pads', sku: 'MS-BP-R', name: 'Brake pads, rear (sample)', category: 'Brakes', price: 29, description: 'Rear pad set.', icon: 'disc', sample: true, custom: null },
  { id: 'p-hubf', sku: 'MS-FH-25', name: 'Front hub kit 25mm (sample)', category: 'Wheels & Hubs', price: 64, description: 'Front hub pair.', icon: 'hub', sample: true, custom: null },
  { id: 'p-rims', sku: 'MS-RM-SET', name: 'Magnesium rim set (sample)', category: 'Wheels & Hubs', price: 320, description: 'Four-rim set.', icon: 'disc', sample: true, custom: null },
  { id: 'p-seat', sku: 'MS-ST-M', name: 'Fibreglass seat, medium (sample)', category: 'Seats', price: 118, description: 'Medium fibreglass seat.', icon: 'seat', sample: true, custom: spec('surface', SEAT_ART, SEAT_MASK) },
  { id: 'p-seatstay', sku: 'MS-SS-2', name: 'Seat stay pair (sample)', category: 'Seats', price: 22, description: 'Seat stays.', icon: 'axle', sample: true, custom: null },
  { id: 'p-nose', sku: 'MS-NC-01', name: 'Front nose cone (sample)', category: 'Bodywork', price: 85, description: 'Plastic front nose cone.', icon: 'nose', sample: true, custom: spec('surface', NOSE_ART, NOSE_MASK) },
  { id: 'p-nassau', sku: 'MS-NP-01', name: 'Nassau panel (sample)', category: 'Bodywork', price: 59, description: 'Front Nassau panel.', icon: 'nassau', sample: true, custom: spec('surface', NASSAU_ART, NASSAU_MASK) },
  { id: 'p-pods', sku: 'MS-SP-PR', name: 'Side pod pair (sample)', category: 'Bodywork', price: 139, description: 'Left and right side pods.', icon: 'nose', sample: true, custom: null },
  { id: 'p-guard', sku: 'MS-CG-01', name: 'Chain guard (sample)', category: 'Engine & Drive', price: 42, description: 'Plastic chain guard.', icon: 'guard', sample: true, custom: spec('surface', GUARD_ART, GUARD_MASK) },
  { id: 'p-tank', sku: 'MS-FT-8', name: 'Fuel tank 8L (sample)', category: 'Engine & Drive', price: 64, description: 'Fuel tank.', icon: 'tank', sample: true, custom: spec('surface', TANK_ART, TANK_MASK, { allowText: false }) },
  { id: 'p-sprocket', sku: 'MS-SK-219', name: 'Rear sprocket 219 (sample)', category: 'Engine & Drive', price: 19, description: '219-pitch sprocket.', icon: 'sprocket', sample: true, custom: null },
  { id: 'p-chain', sku: 'MS-CH-219', name: 'Chain 219 (sample)', category: 'Engine & Drive', price: 34, description: '219 chain.', icon: 'sprocket', sample: true, custom: null },
  { id: 'p-trolley', sku: 'MS-TR-01', name: 'Kart transport trolley (sample)', category: 'Trolleys & Stands', price: 215, description: 'Folding trolley with floor tray.', icon: 'trolley', sample: true, custom: spec('tray-sticker', TROLLEY_ART, TROLLEY_MASK, { effects: ['f-classic-carbon', 'f-checkered-flag', 'f-hex-mesh'] }) },
  { id: 'p-stand', sku: 'MS-KS-01', name: 'Kart stand (sample)', category: 'Trolleys & Stands', price: 129, description: 'Lift stand.', icon: 'trolley', sample: true, custom: null },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
