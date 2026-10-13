import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/data/defaults';
import { HELMET_MODELS, HELMET_TEMPLATES } from '@/data/helmets';
import {
  addRevision, approveExactVersion, approveRevision, bespokeReasons, canCheckoutHelmet, createStandardJob, decideChange,
  designHash, isLocked, issueQuote, needsWatermark, newHelmetDesign, payQuote, quoteHelmet, requestChange, submitBespoke, toScratch,
  WorkflowError,
} from './helmet';
import {
  canSendToPrint, createPaidKartOrder, decideProof, issueProof, KartWorkflowError, newKartDesign, postPrintChange, priceKart,
  reorderEligibility, sendToPrint, startArtworkCheck,
} from './kart';
import { planDraftCleanup } from './cleanup';
import { partCustomFee } from './parts';
import { PRODUCTS } from '@/data/parts';
import type { HelmetDesign, User } from '@/core/types';

const S = defaultSettings();
const cust = { name: 'Test Driver', email: 'driver@example.test' };
const user: User = { id: 'u1', email: 'driver@example.test', name: 'Driver', role: 'customer' };

describe('scope data', () => {
  it('launch mode has exactly two helmet models and five templates', () => {
    expect(HELMET_MODELS.filter((m) => m.status === 'launch').map((m) => m.id)).toEqual(['arai-sk6', 'bell-kc7']);
    expect(HELMET_TEMPLATES.filter((t) => t.launch)).toHaveLength(5);
    expect(HELMET_TEMPLATES).toHaveLength(20);
  });
});

describe('helmet pricing', () => {
  it('standard template with stocked films is auto-priced with itemised lines', () => {
    const d = newHelmetDesign('arai-sk6', 't-split'); // uses classic carbon (stocked)
    const q = quoteHelmet(d, S);
    expect(q.kind).toBe('standard');
    if (q.kind !== 'standard') return;
    const sum = q.lines.reduce((a, l) => a + l.amount, 0);
    expect(q.total).toBe(sum);
    expect(q.lines.find((l) => l.label.includes('Split Second'))?.amount).toBe(305);
    expect(q.lines.some((l) => l.label.startsWith('Classic Carbon'))).toBe(true);
    expect(q.lines.some((l) => l.label.startsWith('New Arai'))).toBe(true);
  });

  it('different templates have different starting prices', () => {
    const prices = HELMET_TEMPLATES.filter((t) => t.launch).map((t) => S.helmet.templatePrices[t.id]);
    expect(new Set(prices).size).toBe(5);
  });

  it('admin price changes flow into live pricing', () => {
    const s2 = defaultSettings();
    s2.helmet.templatePrices['t-velocity'] = 999;
    const q = quoteHelmet(newHelmetDesign('arai-sk6', 't-velocity'), s2);
    expect(q.kind === 'standard' && q.lines[0].amount).toBe(999);
  });

  it('an ordinary sponsor logo does NOT make the helmet bespoke', () => {
    const d = newHelmetDesign();
    d.logos.push({ id: 'l1', name: 'Sponsor', src: 'data:image/png;base64,xx', u: 0.3, v: 0.4, size: 0.1, rotation: 0, mirror: true });
    const q = quoteHelmet(d, S);
    expect(q.kind).toBe('standard');
    expect(q.kind === 'standard' && q.lines.some((l) => l.label.startsWith('Logo'))).toBe(true);
  });

  it.each([
    ['from scratch', (d: HelmetDesign) => toScratch(d)],
    ['AI design', (d: HelmetDesign) => ({ ...d, source: 'ai' as const, ai: { prompt: 'x', references: [], conceptId: 'c' } })],
    ['uploaded complete design', (d: HelmetDesign) => ({ ...d, source: 'upload' as const, artwork: { src: 'data:x', name: 'a.png' } })],
    ['customer film imagery', (d: HelmetDesign) => ({ ...d, basePaint: { kind: 'custom-film' as const, src: 'data:x', name: 'f.png' } })],
    ['unstocked film', (d: HelmetDesign) => ({ ...d, basePaint: { kind: 'film' as const, filmId: Object.entries(S.films).find(([, f]) => !f.stocked)![0], tint: null } })],
    ['unconfirmed model', (d: HelmetDesign) => ({ ...d, modelId: 'slot-5' })],
  ])('%s routes to quote', (_n, mut) => {
    const d = mut(newHelmetDesign());
    expect(quoteHelmet(d, S).kind).toBe('quote');
    expect(bespokeReasons(d, S).length).toBeGreaterThan(0);
  });
});

describe('standard helmet approval gate', () => {
  it('requires explicit approval of the exact version before checkout', () => {
    const d = newHelmetDesign();
    expect(canCheckoutHelmet(d, null, S).ok).toBe(false);
    const a = approveExactVersion(d, 'me');
    expect(canCheckoutHelmet(d, a, S).ok).toBe(true);
    const changed = { ...d, finish: 'satin' as const };
    expect(canCheckoutHelmet(changed, a, S).ok).toBe(false);
  });

  it('bespoke designs cannot use standard checkout', () => {
    const d = toScratch(newHelmetDesign());
    expect(canCheckoutHelmet(d, approveExactVersion(d, 'me'), S).ok).toBe(false);
  });

  it('name/owner changes do not invalidate approval', () => {
    const d = newHelmetDesign();
    const a = approveExactVersion(d, 'me');
    expect(canCheckoutHelmet({ ...d, name: 'Renamed', ownerId: 'u9' }, a, S).ok).toBe(true);
  });

  it('standard job locks revision 1 as the paid master', () => {
    const d = newHelmetDesign();
    const q = quoteHelmet(d, S);
    const job = createStandardJob(d, approveExactVersion(d, 'me'), q.kind === 'standard' ? q.lines : [], cust, 'u1');
    expect(job.masterRevision).toBe(1);
    expect(isLocked(job)).toBe(true);
    expect(() => createStandardJob({ ...d, chrome: true }, approveExactVersion(d, 'me'), [], cust, null)).toThrow(WorkflowError);
  });
});

describe('bespoke helmet workflow', () => {
  const start = () => submitBespoke(toScratch(newHelmetDesign()), 'Make it fast', ['From-scratch design'], cust, 'u1');

  it('goes brief → revisions → quote → approval → payment, preserving every revision', () => {
    let j = start();
    expect(j.status).toBe('submitted');
    expect(() => approveRevision(j, 1, 'me')).toThrow(WorkflowError); // no quote yet
    j = addRevision(j, { ...j.revisions[0].design, finish: 'satin' }, 'workshop', 'Satin version');
    expect(j.revisions.map((r) => r.no)).toEqual([1, 2]);
    j = issueQuote(j, [{ label: 'Bespoke design', amount: 650 }], 'Includes artwork');
    expect(j.status).toBe('quoted');
    expect(() => approveRevision(j, 1, 'me')).toThrow(WorkflowError); // only latest
    j = approveRevision(j, 2, 'me');
    expect(j.status).toBe('awaiting-payment');
    j = payQuote(j);
    expect(j.masterRevision).toBe(2);
    expect(isLocked(j)).toBe(true);
    expect(j.revisions[0].design.finish).toBe('gloss'); // immutable earlier revision
  });

  it('locked master blocks revisions until the workshop authorises a change, then preserves the old master', () => {
    let j = payQuote(approveRevision(issueQuote(start(), [{ label: 'Q', amount: 500 }], ''), 1, 'me'));
    expect(() => addRevision(j, j.revisions[0].design, 'customer', 'tweak')).toThrow(WorkflowError);
    j = requestChange(j, 'Driver', 'Change the number please');
    expect(j.status).toBe('change-requested');
    j = decideChange(j, true, { amount: 45, label: 'Number change' }, 'OK');
    expect(j.status).toBe('change-authorised');
    expect(j.invoices.find((i) => i.kind === 'additional')?.amount).toBe(45);
    j = addRevision(j, { ...j.revisions[0].design, chrome: true }, 'customer', 'New number');
    j = approveRevision(j, 2, 'me');
    expect(j.masterRevision).toBe(2);
    expect(j.previousMasters).toEqual([1]);
    expect(j.invoices.filter((i) => i.kind === 'main' && i.status === 'paid')).toHaveLength(1); // payment history kept
    expect(isLocked(j)).toBe(true);
  });
});

describe('watermarks', () => {
  it('unpaid designs are watermarked; the paid master version is not', () => {
    const d = newHelmetDesign();
    expect(needsWatermark(d, [])).toBe(true);
    const q = quoteHelmet(d, S);
    const job = createStandardJob(d, approveExactVersion(d, 'me'), q.kind === 'standard' ? q.lines : [], cust, 'u1');
    expect(needsWatermark(d, [job])).toBe(false);
    expect(needsWatermark({ ...d, chrome: true }, [job])).toBe(true);
  });
});

describe('kart stickers', () => {
  const design = () => newKartDesign('bw-ms', 'kt-velocity');

  it('custom, uploaded or AI artwork keeps automatic kit pricing', () => {
    const base = priceKart({ bodyworkId: 'bw-ms', material: 'standard', options: [], designService: false }, S);
    expect(base.total).toBe(S.kart.kitPrices['bw-ms']);
    const holo = priceKart({ bodyworkId: 'bw-ms', material: 'holographic', options: ['matte'], designService: false }, S);
    expect(holo.total).toBe(S.kart.kitPrices['bw-ms'] + 45 + 15);
  });

  it('design-service fee only applies when requested and is paid upfront', () => {
    const p = priceKart({ bodyworkId: 'bw-ms', material: 'standard', options: [], designService: true }, S);
    expect(p.upfrontDesignFee).toBe(S.kart.designServiceFee);
    const o = createPaidKartOrder({ design: design(), material: 'standard', options: [], designService: true, items: p.items, lines: p.lines, customer: cust, ownerId: 'u1' });
    expect(o.invoices.find((i) => i.kind === 'design-service')?.status).toBe('paid');
  });

  const paidOrder = () => {
    const p = priceKart({ bodyworkId: 'bw-ms', material: 'standard', options: [], designService: false }, S);
    return createPaidKartOrder({ design: design(), material: 'standard', options: [], designService: false, items: p.items, lines: p.lines, customer: cust, ownerId: 'u1' });
  };

  it('payment precedes proofing and printing needs the CURRENT proof approved', () => {
    let o = paidOrder();
    expect(o.status).toBe('paid');
    expect(o.invoices.every((i) => i.status === 'paid')).toBe(true);
    expect(() => issueProof(o, 'img', '')).toThrow(KartWorkflowError); // check first
    o = startArtworkCheck(o);
    expect(canSendToPrint(o).ok).toBe(false);
    o = issueProof(o, 'p1', 'first');
    expect(canSendToPrint(o).ok).toBe(false);
    o = decideProof(o, 1, true, '');
    expect(canSendToPrint(o).ok).toBe(true);
    o = issueProof(o, 'p2', 'tweak'); // new proof supersedes the approved one
    expect(canSendToPrint(o).ok).toBe(false);
    expect(() => decideProof(o, 1, true, '')).toThrow(KartWorkflowError);
    o = decideProof(o, 2, false, 'bigger number');
    expect(canSendToPrint(o).ok).toBe(false);
    expect(() => sendToPrint(o)).toThrow(KartWorkflowError);
    o = decideProof(issueProof(o, 'p3', 'bigger'), 3, true, '');
    o = sendToPrint(o);
    expect(o.status).toBe('sent-to-print');
    expect(o.sentToPrintAt).toBeTruthy();
    expect(o.notifications.some((n) => /sent to print/i.test(n.subject))).toBe(true);
    expect(o.proofs.map((p) => p.no)).toEqual([1, 2, 3]); // history kept
    expect(() => issueProof(o, 'p4', '')).toThrow(KartWorkflowError); // editing closed
    o = postPrintChange(o, 'Customer wants new pods', 30);
    expect(o.invoices.find((i) => i.kind === 'additional')?.status).toBe('unpaid');
  });

  it('left and right pods can be reordered independently, by account customers only', () => {
    let o = paidOrder();
    o = sendToPrint(decideProof(issueProof(startArtworkCheck(o), 'p1', ''), 1, true, ''));
    expect(reorderEligibility(o, user).ok).toBe(true);
    expect(reorderEligibility(o, null).ok).toBe(false);
    const left = priceKart({ bodyworkId: 'bw-ms', material: 'standard', options: [], designService: false, panels: ['leftPod'] }, S);
    expect(left.items.map((i) => i.kind)).toEqual(['leftPod']);
    expect(left.total).toBe(S.kart.panelPrices.leftPod);
    const right = priceKart({ bodyworkId: 'bw-ms', material: 'standard', options: [], designService: false, panels: ['rightPod'] }, S);
    expect(right.items.map((i) => i.kind)).toEqual(['rightPod']);
    const re = createPaidKartOrder({ design: o.design, material: 'standard', options: [], designService: false, items: left.items, lines: left.lines, customer: cust, ownerId: 'u1', reorderOf: { orderId: o.id, ref: o.ref, proofNo: 1 }, approvedProofImage: 'p1' });
    expect(re.reorderOf?.ref).toBe(o.ref);
    expect(re.proofs[0].status).toBe('approved');
    const guest = { ...paidOrder(), ownerId: null, guest: true };
    expect(reorderEligibility(guest, user).ok).toBe(false);
  });
});

describe('parts (proposed) pricing is configurable and separate', () => {
  it('artwork handling follows the admin decision', () => {
    const tray = PRODUCTS.find((p) => p.id === 'p-trolley')!;
    const c = { effect: null, color: '#121412', text: 'TEAM', textColor: '#fff', artwork: { src: 'x', name: 'a' } };
    expect(partCustomFee(tray, c, S).needsQuote).toBe(true);
    const s2 = defaultSettings();
    s2.parts.artworkHandling = 'fixed';
    const r = partCustomFee(tray, c, s2);
    expect(r.needsQuote).toBe(false);
    expect(r.fee).toBe(s2.parts.traySticker + s2.parts.textFee + s2.parts.artworkFee);
  });
});

describe('draft cleanup', () => {
  it('never removes designs referenced by paid orders, jobs or shares', () => {
    const old = new Date('2020-01-01').toISOString();
    const paidDesign = { ...newHelmetDesign(), id: 'paid', updatedAt: old };
    const draft = { ...newHelmetDesign(), id: 'draft', updatedAt: old };
    const fresh = { ...newHelmetDesign(), id: 'fresh' };
    const q = quoteHelmet(paidDesign, S);
    const job = createStandardJob(paidDesign, approveExactVersion(paidDesign, 'me'), q.kind === 'standard' ? q.lines : [], cust, 'u1');
    const plan = planDraftCleanup({ helmetDesigns: [paidDesign, draft, fresh], kartDesigns: [], jobs: [job], kartOrders: [], shares: [], olderThanDays: 30 });
    expect(plan.removeHelmetDesigns).toEqual(['draft']);
    expect(plan.protected.map((p) => p.id)).toContain('paid');
    expect(designHash(paidDesign)).toBe(job.revisions[0].hash);
  });
});
