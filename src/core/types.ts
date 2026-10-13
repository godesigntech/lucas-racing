/* Shared domain types for the Lucas Racing demo.
   Everything persisted goes through src/store (local or Supabase adapter). */

export type Mode = 'launch' | 'full';
/** Where a feature sits in the agreed scope. */
export type ScopeTag = 'launch' | 'future' | 'proposed';

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Films & paint                                                       */
/* ------------------------------------------------------------------ */

export type FilmPattern =
  | 'carbon' | 'forged' | 'hex' | 'camo' | 'marble' | 'holo' | 'flame' | 'wood'
  | 'stripe' | 'dots' | 'tiger' | 'snake' | 'geo' | 'galaxy' | 'brushed' | 'water'
  | 'digital' | 'check' | 'splatter' | 'wave';

export interface Film {
  id: ID;
  name: string;
  category: string;
  pattern: FilmPattern;
  /** Pattern colours, darkest first. */
  colors: string[];
  tintable: boolean;
  /** Per-zone surcharge (GBP) when used on a helmet. Admin-editable. */
  price: number;
  /** Shown in the library at all. */
  available: boolean;
  /** Held in stock: only stocked films qualify for automatic pricing. */
  stocked: boolean;
}

export type Paint =
  | { kind: 'solid'; color: string }
  | { kind: 'film'; filmId: ID; tint: string | null }
  /** Customer-uploaded hydro-dip imagery: always routes to quote. */
  | { kind: 'custom-film'; src: string; name: string };

export type Finish = 'gloss' | 'satin';

/* ------------------------------------------------------------------ */
/* Helmets                                                             */
/* ------------------------------------------------------------------ */

export interface HelmetModel {
  id: ID;
  brand: string;
  name: string;
  /** launch = SK6/KC7. catalogue = expanded preview slot. unconfirmed = placeholder slot. */
  status: 'launch' | 'catalogue' | 'unconfirmed';
  sizes: string[];
  /** Price of a brand-new helmet supplied by Lucas Racing (GBP). Admin-editable. */
  newPrice: number;
  /** Concept geometry parameters, NOT manufacturer-accurate. */
  shape: { length: number; height: number; chin: number; eyePort: number; tail: number };
  spoilerCompatible: boolean;
}

/** Editable graphic section of a template, drawn in helmet UV space (see core/uv.ts). */
export interface TemplateZone {
  id: ID;
  name: string;
  /** SVG path data in UV canvas space (UV_W x UV_H). */
  path: string;
  /** Default paint when the template is applied. */
  defaultPaint: Paint;
}

export interface HelmetTemplate {
  id: ID;
  name: string;
  /** In the five launch layouts. */
  launch: boolean;
  /** Starting price (GBP). Admin-editable. */
  startPrice: number;
  basePaint: Paint;
  zones: TemplateZone[];
  description: string;
}

export type FontId = 'barlow' | 'anton' | 'racing' | 'bebas' | 'marker' | 'inter';

export interface TextLayer {
  id: ID;
  kind: 'name' | 'number';
  text: string;
  font: FontId;
  color: string;
  outline: string | null;
  /** UV position 0..1 (u around helmet, v top→bottom). */
  u: number;
  v: number;
  /** Height as a fraction of UV height. */
  size: number;
  rotation: number;
  /** Mirror onto the opposite side of the helmet. */
  mirror: boolean;
}

export interface LogoLayer {
  id: ID;
  name: string;
  src: string; // data URL
  u: number;
  v: number;
  size: number;
  rotation: number;
  mirror: boolean;
}

/** Shapes/strokes for blank (from-scratch) mode, in UV canvas space. */
export type DrawLayer =
  | { id: ID; type: 'stroke'; points: [number, number][]; width: number; paint: Paint }
  | { id: ID; type: 'rect' | 'ellipse'; x: number; y: number; w: number; h: number; rotation: number; paint: Paint }
  | { id: ID; type: 'stripe'; x1: number; y1: number; x2: number; y2: number; width: number; paint: Paint };

export type DesignSource = 'template' | 'scratch' | 'ai' | 'upload';

export type HelmetSupply =
  | { kind: 'new'; size: string }
  | {
      kind: 'own';
      make: string;
      model: string;
      size: string;
      condition: 'new' | 'used';
      photos: { name: string; src: string }[];
      sendMethod: 'courier' | 'dropoff' | 'track-handover';
      returnMethod: 'delivery' | 'collection' | 'track-handover';
      notes: string;
    };

export interface HelmetDesign {
  id: ID;
  name: string;
  ownerId: ID | null;
  modelId: ID;
  source: DesignSource;
  templateId: ID | null;
  basePaint: Paint;
  zonePaints: Record<ID, Paint>;
  finish: Finish;
  chrome: boolean;
  texts: TextLayer[];
  logos: LogoLayer[];
  drawing: DrawLayer[];
  /** Complete uploaded artwork (routes to quote). */
  artwork: { src: string; name: string } | null;
  ai: { prompt: string; references: { name: string; src: string }[]; conceptId: ID | null } | null;
  trims: { baseRubber: string; eyeRubber: string; plastic: string };
  spoiler: { enabled: boolean; color: string };
  supply: HelmetSupply;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Helmet pricing & jobs                                               */
/* ------------------------------------------------------------------ */

export interface PriceLine { label: string; amount: number }

export type HelmetQuote =
  | { kind: 'standard'; lines: PriceLine[]; total: number }
  | { kind: 'quote'; reasons: string[]; indicative: PriceLine[] };

/** Immutable snapshot of a design at a revision. */
export interface Revision {
  no: number;
  design: HelmetDesign;
  hash: string;
  note: string;
  by: 'customer' | 'workshop';
  createdAt: ISODate;
}

export interface Approval {
  revisionNo: number;
  hash: string;
  approvedAt: ISODate;
  by: string;
}

export interface Message {
  id: ID;
  by: 'customer' | 'workshop';
  author: string;
  text: string;
  attachments: { name: string; src: string }[];
  at: ISODate;
}

export interface Invoice {
  id: ID;
  label: string;
  amount: number;
  kind: 'main' | 'additional' | 'design-service' | 'reorder';
  status: 'unpaid' | 'paid';
  createdAt: ISODate;
  paidAt: ISODate | null;
}

export type HelmetJobStatus =
  | 'submitted'        // bespoke brief received
  | 'in-discussion'    // workshop talking/revising
  | 'quoted'           // quote issued, awaiting approval
  | 'awaiting-payment' // approved, awaiting payment
  | 'paid'             // master locked, in queue
  | 'change-requested' // customer asked for a change after lock
  | 'change-authorised'// workshop agreed: new revision needed
  | 'in-production'
  | 'completed';

export interface HelmetJob {
  id: ID;
  ref: string; // human-readable, e.g. LR-H-1042
  kind: 'standard' | 'bespoke';
  ownerId: ID | null;
  customer: { name: string; email: string };
  designId: ID;
  revisions: Revision[];
  approvals: Approval[];
  /** Revision number of the locked production master, if any. */
  masterRevision: number | null;
  /** Previous masters, preserved after authorised changes. */
  previousMasters: number[];
  messages: Message[];
  quote: { lines: PriceLine[]; total: number; issuedAt: ISODate; note: string } | null;
  invoices: Invoice[];
  status: HelmetJobStatus;
  productionNotes: string;
  history: { at: ISODate; text: string }[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Kart sticker kits                                                   */
/* ------------------------------------------------------------------ */

export type PanelId = 'leftPod' | 'rightPod' | 'nassau' | 'frontBumper';

export type KartLayer =
  | { id: ID; type: 'rect' | 'ellipse' | 'triangle' | 'stripe'; x: number; y: number; w: number; h: number; rotation: number; color: string; name?: string }
  | { id: ID; type: 'text'; x: number; y: number; text: string; font: FontId; size: number; rotation: number; color: string; outline: string | null; name?: string }
  | { id: ID; type: 'image'; x: number; y: number; w: number; h: number; rotation: number; src: string; name?: string }
  | { id: ID; type: 'path'; points: [number, number][]; width: number; color: string; name?: string };

export interface KartPanelDesign {
  background: string;
  layers: KartLayer[];
}

export interface KartBodywork {
  id: ID;
  name: string;
  /** Illustrative outlines (SVG path in each panel's own 1000-unit box). */
  outlines: Record<PanelId, { path: string; w: number; h: number }>;
  accurate: false;
}

export interface KartTemplate {
  id: ID;
  name: string;
  build: (bw: KartBodywork, colors: [string, string, string]) => Record<PanelId, KartPanelDesign>;
  colors: [string, string, string];
}

export interface KartDesign {
  id: ID;
  name: string;
  ownerId: ID | null;
  bodyworkId: ID;
  templateId: ID | null;
  source: 'template' | 'custom' | 'upload' | 'ai';
  panels: Record<PanelId, KartPanelDesign>;
  /** Complete uploaded artwork per panel (does NOT force a quote). */
  uploads: Partial<Record<PanelId, { src: string; name: string }>>;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type KartMaterial = 'standard' | 'holographic';

export interface KartOrderItem {
  kind: 'kit' | PanelId;
  label: string;
  price: number;
  qty: number;
}

export type KartOrderStatus =
  | 'paid'             // payment taken before any artwork checking
  | 'artwork-check'
  | 'proof-sent'
  | 'changes-requested'
  | 'proof-approved'
  | 'sent-to-print'
  | 'dispatched';

export interface Proof {
  no: number;
  /** PNG data URL of the clean proof. */
  image: string;
  note: string;
  createdAt: ISODate;
  status: 'pending' | 'approved' | 'changes-requested' | 'superseded';
  customerComment: string;
  decidedAt: ISODate | null;
}

export interface KartOrder {
  id: ID;
  ref: string;
  ownerId: ID | null;
  guest: boolean;
  customer: { name: string; email: string };
  designId: ID;
  design: KartDesign; // snapshot at payment
  bodyworkId: ID;
  material: KartMaterial;
  options: string[];
  designService: boolean;
  items: KartOrderItem[];
  /** Reorders reference the original approved artwork. */
  reorderOf: { orderId: ID; ref: string; proofNo: number } | null;
  total: number;
  invoices: Invoice[];
  proofs: Proof[];
  status: KartOrderStatus;
  sentToPrintAt: ISODate | null;
  notifications: { at: ISODate; to: string; subject: string }[];
  postPrintNotes: { at: ISODate; text: string }[];
  history: { at: ISODate; text: string }[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Parts shop                                                          */
/* ------------------------------------------------------------------ */

export interface PartCustomSpec {
  kind: 'surface' | 'tray-sticker';
  /** Illustration SVG markup (viewBox 0 0 400 260) with the product outline. */
  art: string;
  /** Mask path (same viewBox) limiting customisation to the relevant surface. */
  mask: string;
  allowText: boolean;
  allowArtwork: boolean;
  /** Limited variation set, per Stephen's suggestion (e.g. 3 effects x 6 colours). */
  effects: ID[]; // film ids
  colors: string[];
}

export interface Product {
  id: ID;
  sku: string;
  name: string;
  category: string;
  price: number;
  description: string;
  icon: string; // key in ui/ProductArt
  sample: true;
  custom: PartCustomSpec | null;
}

export interface PartCustomisation {
  effect: ID | null; // film id
  color: string;
  text: string;
  textColor: string;
  artwork: { src: string; name: string } | null;
}

/* ------------------------------------------------------------------ */
/* Basket & orders                                                     */
/* ------------------------------------------------------------------ */

export type BasketItem =
  /** Standard helmet: only the exact approved version (approval.hash === designHash(design)) may be added. */
  | { id: ID; type: 'helmet'; designId: ID; design: HelmetDesign; name: string; approval: Approval; lines: PriceLine[]; price: number; qty: 1; thumb: string }
  | { id: ID; type: 'part'; productId: ID; name: string; price: number; qty: number; custom: PartCustomisation | null; customFee: number; needsQuote: boolean; thumb?: string }
  /** Kart kit or individual replacement panels. Reorders carry the original approved proof image. */
  | { id: ID; type: 'kart'; designId: ID; design: KartDesign; name: string; material: KartMaterial; options: string[]; designService: boolean; items: KartOrderItem[]; lines: PriceLine[]; price: number; qty: 1; reorderOf: KartOrder['reorderOf']; approvedProofImage?: string; thumb: string };

export interface PartOrder {
  id: ID;
  ref: string;
  ownerId: ID | null;
  guest: boolean;
  customer: { name: string; email: string };
  lines: { name: string; qty: number; price: number; custom: PartCustomisation | null; needsQuote: boolean }[];
  total: number;
  status: 'paid' | 'awaiting-quote' | 'dispatched';
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Enquiry {
  id: ID;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ShareLink {
  id: ID;
  kind: 'helmet' | 'kart';
  designSnapshot: HelmetDesign | KartDesign;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Simulated outbound email/notification log. */
export interface Notification {
  id: ID;
  to: string;
  subject: string;
  body: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Admin settings                                                      */
/* ------------------------------------------------------------------ */

export interface Settings {
  id: 'settings';
  helmet: {
    logoPrice: number;
    namePrice: number;
    numberPrice: number;
    chromePrice: number;
    satinPrice: number;
    baseRubberPrice: number;   // charged when not standard black
    eyeRubberPrice: number;
    plasticPrice: number;
    spoilerPrice: number;
    ownHelmetPrepFee: number;
    templatePrices: Record<ID, number>;
    modelPrices: Record<ID, number>;
  };
  films: Record<ID, { price: number; available: boolean; stocked: boolean; category: string }>;
  kart: {
    kitPrices: Record<ID, number>; // per bodywork
    materialSurcharge: Record<KartMaterial, number>;
    panelPrices: Record<PanelId, number>;
    options: { id: ID; label: string; price: number }[];
    designServiceFee: number;
  };
  parts: {
    prices: Record<ID, number>;
    /** Decision pending with client: shown in admin as TBC. */
    effectFee: number;
    traySticker: number;
    textFee: number;
    artworkHandling: 'quote' | 'fixed';
    artworkFee: number;
  };
  updatedAt: ISODate;
  createdAt: ISODate;
}

export interface User {
  id: ID;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}
