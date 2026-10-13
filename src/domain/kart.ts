/* Kart sticker kits: pricing, payment-first proofing, Sent to Print and reorders. Pure functions. */
import type { KartDesign, KartMaterial, KartOrder, KartOrderItem, PanelId, PriceLine, Settings, User } from '@/core/types';
import { clone, nowISO, refNo, sum, uid } from '@/core/util';
import { BODYWORK, PANELS, bodyworkById, kartTemplateById } from '@/data/kart';

export class KartWorkflowError extends Error {}

export function newKartDesign(bodyworkId = BODYWORK[0].id, templateId: string | null = null): KartDesign {
  const t = nowISO();
  const bw = bodyworkById(bodyworkId);
  const tpl = kartTemplateById(templateId);
  const empty = { background: '#f5f5f2', layers: [] };
  return {
    id: uid('kd_'), name: 'Untitled kart kit', ownerId: null, bodyworkId: bw.id, templateId: tpl?.id ?? null,
    source: tpl ? 'template' : 'custom',
    panels: tpl ? tpl.build(bw, tpl.colors) : { leftPod: clone(empty), rightPod: clone(empty), nassau: clone(empty), frontBumper: clone(empty) },
    uploads: {}, createdAt: t, updatedAt: t,
  };
}

export interface KartPriceInput {
  bodyworkId: string;
  material: KartMaterial;
  options: string[];
  designService: boolean;
  /** Omit for a complete kit; pass panels for individual replacements. */
  panels?: PanelId[];
}

/** Automatic pricing. Customer-created, uploaded or AI artwork does NOT force a quote. */
export function priceKart(input: KartPriceInput, s: Settings): { items: KartOrderItem[]; lines: PriceLine[]; total: number; upfrontDesignFee: number } {
  const k = s.kart;
  const bw = bodyworkById(input.bodyworkId);
  const items: KartOrderItem[] = input.panels?.length
    ? input.panels.map((p) => ({ kind: p, label: PANELS.find((x) => x.id === p)!.name, price: k.panelPrices[p], qty: 1 }))
    : [{ kind: 'kit', label: `Complete kit: ${bw.name}`, price: k.kitPrices[bw.id] ?? 0, qty: 1 }];
  const lines: PriceLine[] = items.map((i) => ({ label: i.label, amount: i.price * i.qty }));
  const sur = k.materialSurcharge[input.material] || 0;
  // Material surcharge: full for a kit, pro-rata per panel (of 4) for individual replacements.
  if (sur) lines.push({ label: `${input.material === 'holographic' ? 'Holographic' : 'Standard'} material`, amount: input.panels?.length ? Math.round((sur * input.panels.length * 100) / 4) / 100 : sur });
  for (const o of input.options) {
    const opt = k.options.find((x) => x.id === o);
    if (opt) lines.push({ label: opt.label, amount: opt.price });
  }
  const upfrontDesignFee = input.designService ? k.designServiceFee : 0;
  if (upfrontDesignFee) lines.push({ label: 'Workshop design service (paid upfront)', amount: upfrontDesignFee });
  return { items, lines, total: sum(lines.map((l) => l.amount)), upfrontDesignFee };
}

const note = (o: KartOrder, text: string): KartOrder => ({ ...o, history: [...o.history, { at: nowISO(), text }], updatedAt: nowISO() });
const notify = (o: KartOrder, subject: string): KartOrder => ({ ...o, notifications: [...o.notifications, { at: nowISO(), to: o.customer.email, subject }] });

/** Payment is taken first; the order then enters manual artwork checking. */
export function createPaidKartOrder(args: {
  design: KartDesign; material: KartMaterial; options: string[]; designService: boolean; items: KartOrderItem[]; lines: PriceLine[];
  customer: KartOrder['customer']; ownerId: string | null; reorderOf?: KartOrder['reorderOf']; approvedProofImage?: string;
}): KartOrder {
  const t = nowISO();
  const total = sum(args.lines.map((l) => l.amount));
  const designFee = args.designService ? args.lines.find((l) => l.label.startsWith('Workshop design service'))?.amount || 0 : 0;
  let o: KartOrder = {
    id: uid('ko_'), ref: refNo(args.reorderOf ? 'LR-KR' : 'LR-K'), ownerId: args.ownerId, guest: !args.ownerId, customer: args.customer,
    designId: args.design.id, design: clone(args.design), bodyworkId: args.design.bodyworkId, material: args.material, options: args.options,
    designService: args.designService, items: args.items, reorderOf: args.reorderOf ?? null, total,
    invoices: [
      { id: uid('inv_'), label: args.reorderOf ? 'Replacement panels' : 'Sticker kit', amount: total - designFee, kind: args.reorderOf ? 'reorder' : 'main', status: 'paid', createdAt: t, paidAt: t },
      ...(designFee ? [{ id: uid('inv_'), label: 'Design service (upfront)', amount: designFee, kind: 'design-service' as const, status: 'paid' as const, createdAt: t, paidAt: t }] : []),
    ],
    proofs: [], status: 'paid', sentToPrintAt: null, notifications: [], postPrintNotes: [], history: [], createdAt: t, updatedAt: t,
  };
  o = notify(note(o, 'Payment received. Awaiting artwork check.'), `Order ${o.ref} confirmed`);
  if (args.reorderOf && args.approvedProofImage) {
    // Reorders reuse the original approved artwork: carried over as an approved proof.
    o = {
      ...o, status: 'proof-approved',
      proofs: [{ no: 1, image: args.approvedProofImage, note: `Approved artwork from ${args.reorderOf.ref} (proof ${args.reorderOf.proofNo})`, createdAt: t, status: 'approved', customerComment: '', decidedAt: t }],
    };
    o = note(o, `Reorder references approved artwork from ${args.reorderOf.ref}.`);
  }
  return o;
}

export const currentProof = (o: KartOrder) => o.proofs[o.proofs.length - 1] || null;
export const proofEditingOpen = (o: KartOrder) => o.status !== 'sent-to-print' && o.status !== 'dispatched';

export function startArtworkCheck(o: KartOrder): KartOrder {
  if (o.status !== 'paid') throw new KartWorkflowError('Artwork checking starts only after payment.');
  return note({ ...o, status: 'artwork-check' }, 'Staff artwork check started.');
}

export function issueProof(o: KartOrder, image: string, proofNote: string): KartOrder {
  if (!proofEditingOpen(o)) throw new KartWorkflowError('Proof editing is closed after Sent to Print.');
  if (o.status === 'paid') throw new KartWorkflowError('Start the artwork check first.');
  if (!['artwork-check', 'changes-requested', 'proof-sent', 'proof-approved'].includes(o.status)) throw new KartWorkflowError('Cannot issue a proof now.');
  const proofs = o.proofs.map((p) => (p.status === 'pending' || p.status === 'approved' ? { ...p, status: 'superseded' as const } : p));
  const no = o.proofs.length + 1;
  const out = { ...o, proofs: [...proofs, { no, image, note: proofNote, createdAt: nowISO(), status: 'pending' as const, customerComment: '', decidedAt: null }], status: 'proof-sent' as const };
  return notify(note(out, `Proof ${no} sent to customer.`), `Proof ${no} ready for approval (${o.ref})`);
}

export function decideProof(o: KartOrder, proofNo: number, approve: boolean, comment: string): KartOrder {
  if (!proofEditingOpen(o)) throw new KartWorkflowError('Proof editing is closed after Sent to Print.');
  const cur = currentProof(o);
  if (!cur || cur.no !== proofNo) throw new KartWorkflowError('Only the current proof can be approved.');
  if (cur.status !== 'pending') throw new KartWorkflowError('This proof has already been decided.');
  const proofs = o.proofs.map((p) => (p.no === proofNo ? { ...p, status: approve ? ('approved' as const) : ('changes-requested' as const), customerComment: comment, decidedAt: nowISO() } : p));
  return note({ ...o, proofs, status: approve ? 'proof-approved' : 'changes-requested' }, approve ? `Proof ${proofNo} approved by customer.` : `Changes requested on proof ${proofNo}.`);
}

/** Printing is blocked until the CURRENT proof is explicitly approved. */
export function canSendToPrint(o: KartOrder): { ok: boolean; why?: string } {
  const cur = currentProof(o);
  if (!cur) return { ok: false, why: 'No proof issued yet.' };
  if (cur.status !== 'approved') return { ok: false, why: `Current proof ${cur.no} is not approved.` };
  if (!proofEditingOpen(o)) return { ok: false, why: 'Already sent to print.' };
  return { ok: true };
}

export function sendToPrint(o: KartOrder): KartOrder {
  const c = canSendToPrint(o);
  if (!c.ok) throw new KartWorkflowError(c.why);
  const out = { ...o, status: 'sent-to-print' as const, sentToPrintAt: nowISO() };
  return notify(note(out, 'Sent to Print. Ordinary proof editing closed (cutoff recorded).'), `Your stickers have been sent to print (${o.ref})`);
}

/** After the cutoff, changes are handled manually (note + optional extra invoice or a replacement order). */
export function postPrintChange(o: KartOrder, text: string, extra: number): KartOrder {
  if (proofEditingOpen(o)) throw new KartWorkflowError('Before print, use the proof workflow.');
  let out: KartOrder = { ...o, postPrintNotes: [...o.postPrintNotes, { at: nowISO(), text }] };
  if (extra > 0) out = { ...out, invoices: [...out.invoices, { id: uid('inv_'), label: 'Post-print change', amount: extra, kind: 'additional', status: 'unpaid', createdAt: nowISO(), paidAt: null }] };
  return note(out, `Post-print change logged${extra > 0 ? ` with additional invoice £${extra}` : ''}.`);
}

/* ------------------------------------------------------------------ */
/* Reorders (kart stickers only, account customers only)               */
/* ------------------------------------------------------------------ */

export function reorderEligibility(o: KartOrder, user: User | null): { ok: boolean; why?: string } {
  if (!user) return { ok: false, why: 'Sign in: easy reordering is only available on accounts (guest orders cannot be reordered online).' };
  if (o.ownerId !== user.id) return { ok: false, why: 'This order belongs to another account.' };
  if (o.guest) return { ok: false, why: 'Guest orders cannot be reordered online.' };
  const approved = [...o.proofs].reverse().find((p) => p.status === 'approved');
  if (!approved || !(o.status === 'sent-to-print' || o.status === 'dispatched')) return { ok: false, why: 'Reorders need paid, approved and printed artwork.' };
  return { ok: true };
}

export function approvedProofOf(o: KartOrder) {
  return [...o.proofs].reverse().find((p) => p.status === 'approved') || null;
}
