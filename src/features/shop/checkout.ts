/* Basket validation + SIMULATED checkout. No real payment is taken: paying creates the
   order records (helmet jobs, kart sticker orders, part orders) and logs simulated emails. */
import type { BasketItem, HelmetDesign, KartDesign, PartOrder, Settings, User } from '@/core/types';
import { money, nowISO, refNo, uid } from '@/core/util';
import { canCheckoutHelmet, createStandardJob, designHash } from '@/domain/helmet';
import { createPaidKartOrder } from '@/domain/kart';
import { putDoc, simulateEmail } from '@/store';
import type { Doc } from '@/store/backend';

export const lineTotal = (i: BasketItem) => (i.price + (i.type === 'part' ? i.customFee : 0)) * i.qty;

/** Blocking problems per basket item (empty = OK to check out). */
export function itemIssues(i: BasketItem, user: User | null, settings: Settings): string[] {
  if (i.type === 'helmet') {
    if (!i.approval || i.approval.hash !== designHash(i.design)) return ['Approval no longer matches — re-approve in the builder.'];
    const ok = canCheckoutHelmet(i.design, i.approval, settings);
    return ok.ok ? [] : [ok.why || 'This helmet cannot be checked out as a standard order.'];
  }
  if (i.type === 'kart' && i.reorderOf && !user) {
    return ['Sign in to reorder: easy reordering of sticker panels is only available on accounts, so guests cannot check out a reorder.'];
  }
  return [];
}

export interface CheckoutDetails {
  name: string;
  email: string;
  delivery: 'delivery' | 'collect';
  address: { line1: string; line2: string; city: string; postcode: string; country: string };
}

export interface PlacedOrder {
  kind: 'helmet' | 'kart' | 'parts';
  id: string;
  ref: string;
  label: string;
  total: number;
  status: string;
}

const addressText = (d: CheckoutDetails) =>
  d.delivery === 'collect'
    ? 'Collect from the Lucas Racing workshop'
    : [d.address.line1, d.address.line2, d.address.city, d.address.postcode, d.address.country].filter((x) => x.trim()).join(', ');

/** Creates every order record for the basket. Throws if any item fails validation. */
export async function placeOrders(items: BasketItem[], details: CheckoutDetails, user: User | null, settings: Settings): Promise<PlacedOrder[]> {
  const blocked = items.flatMap((i) => itemIssues(i, user, settings));
  if (blocked.length) throw new Error(blocked[0]);

  const customer = { name: details.name.trim(), email: details.email.trim() };
  const ownerId = user?.id ?? null;
  const placed: PlacedOrder[] = [];
  const ship = addressText(details);

  for (const item of items) {
    if (item.type === 'helmet') {
      const job = createStandardJob(item.design, item.approval, item.lines, customer, ownerId);
      await putDoc('jobs', job as unknown as Doc);
      if (user) await putDoc('helmetDesigns', { ...item.design, ownerId: user.id } as HelmetDesign as unknown as Doc);
      placed.push({ kind: 'helmet', id: job.id, ref: job.ref, label: item.name, total: item.price, status: 'Paid · master locked' });
      await simulateEmail(customer.email, `Helmet order ${job.ref} confirmed`,
        `Hi ${customer.name},\n\nThanks for your order. We've received your payment of ${money(item.price)} (simulated) for "${item.name}".\n` +
        `The exact version you approved (revision ${item.approval.revisionNo}, hash ${item.approval.hash.slice(0, 10)}) is now locked as the production master.\n` +
        `Delivery: ${ship}.\n\nLucas Racing`);
    } else if (item.type === 'kart') {
      const order = createPaidKartOrder({
        design: item.design, material: item.material, options: item.options, designService: item.designService,
        items: item.items, lines: item.lines, customer, ownerId,
        reorderOf: item.reorderOf ?? undefined, approvedProofImage: item.approvedProofImage,
      });
      await putDoc('kartOrders', order as unknown as Doc);
      if (user) await putDoc('kartDesigns', { ...item.design, ownerId: user.id } as KartDesign as unknown as Doc);
      placed.push({ kind: 'kart', id: order.id, ref: order.ref, label: item.name, total: order.total, status: order.reorderOf ? 'Paid · reusing approved artwork' : 'Paid · awaiting artwork check' });
      await simulateEmail(customer.email, `Sticker kit order ${order.ref} confirmed`,
        `Hi ${customer.name},\n\nPayment of ${money(order.total)} received (simulated) for "${item.name}".\n` +
        (order.reorderOf
          ? `This reorder reuses the approved artwork from ${order.reorderOf.ref} (proof ${order.reorderOf.proofNo}).\n`
          : `Next: the workshop checks your artwork and sends a proof for your approval. Nothing is printed until you approve it.\n`) +
        `Delivery: ${ship}.\n\nLucas Racing`);
    }
  }

  const parts = items.filter((i): i is Extract<BasketItem, { type: 'part' }> => i.type === 'part');
  if (parts.length) {
    const t = nowISO();
    const needsQuote = parts.some((p) => p.needsQuote);
    const order: PartOrder = {
      id: uid('po_'), ref: refNo('LR-P'), ownerId, guest: !user, customer,
      lines: parts.map((p) => ({ name: p.name, qty: p.qty, price: p.price + p.customFee, custom: p.custom, needsQuote: p.needsQuote })),
      total: parts.reduce((a, p) => a + lineTotal(p), 0),
      status: needsQuote ? 'awaiting-quote' : 'paid',
      createdAt: t, updatedAt: t,
    };
    await putDoc('partOrders', order as unknown as Doc);
    placed.push({ kind: 'parts', id: order.id, ref: order.ref, label: `${parts.reduce((a, p) => a + p.qty, 0)} kart part${parts.length === 1 && parts[0].qty === 1 ? '' : 's'}`, total: order.total, status: needsQuote ? 'Paid · artwork awaiting quote' : 'Paid' });
    await simulateEmail(customer.email, `Parts order ${order.ref} confirmed`,
      `Hi ${customer.name},\n\nPayment of ${money(order.total)} received (simulated) for:\n` +
      parts.map((p) => `- ${p.qty} × ${p.name}${p.custom ? ' (customised)' : ''}`).join('\n') +
      (needsQuote ? `\n\nYour custom artwork has gone to the workshop for a quote. We'll be in touch before it is produced.` : '') +
      `\nDelivery: ${ship}.\n\nLucas Racing`);
  }

  return placed;
}
