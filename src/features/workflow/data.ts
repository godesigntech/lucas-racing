/* Typed persistence helpers + labels for the workflow area. */
import type {
  Enquiry, HelmetJob, HelmetJobStatus, KartOrder, KartOrderStatus, Notification, PartOrder, Settings,
} from '@/core/types';
import type { Doc } from '@/store/backend';
import { putDoc, toast } from '@/store';
import { nowISO } from '@/core/util';

export type D<T> = T & Doc;
export const asDoc = <T,>(x: T) => x as D<T>;

export const saveJob = (j: HelmetJob) => putDoc('jobs', asDoc(j));
export const saveKartOrder = (o: KartOrder) => putDoc('kartOrders', asDoc(o));
export const savePartOrder = (o: PartOrder) => putDoc('partOrders', asDoc(o));
export const saveEnquiry = (e: Enquiry) => putDoc('enquiries', asDoc(e));

export type { Notification, Settings };

/** Run a workflow step: any thrown WorkflowError / KartWorkflowError / storage error becomes an error toast. */
export async function attempt(fn: () => unknown, ok?: string): Promise<boolean> {
  try {
    await fn();
    if (ok) toast(ok);
    return true;
  } catch (e) {
    toast((e as Error)?.message || 'Something went wrong.', 'err');
    return false;
  }
}

export const WORKSHOP_INBOX = 'workshop@lucasracing.demo';

export type Tone = 'ok' | 'warn' | 'err' | 'sim' | 'dark' | '';

export const JOB_STATUS: Record<HelmetJobStatus, { label: string; tone: Tone }> = {
  submitted: { label: 'Brief submitted', tone: 'warn' },
  'in-discussion': { label: 'In discussion', tone: 'warn' },
  quoted: { label: 'Quoted', tone: 'warn' },
  'awaiting-payment': { label: 'Awaiting payment', tone: 'warn' },
  paid: { label: 'Paid · master locked', tone: 'ok' },
  'change-requested': { label: 'Change requested', tone: 'err' },
  'change-authorised': { label: 'Change authorised', tone: 'warn' },
  'in-production': { label: 'In production', tone: 'dark' },
  completed: { label: 'Completed', tone: 'ok' },
};

export const KART_STATUS: Record<KartOrderStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Paid · awaiting check', tone: 'warn' },
  'artwork-check': { label: 'Artwork check', tone: 'warn' },
  'proof-sent': { label: 'Proof sent', tone: 'warn' },
  'changes-requested': { label: 'Changes requested', tone: 'err' },
  'proof-approved': { label: 'Proof approved', tone: 'ok' },
  'sent-to-print': { label: 'Sent to Print', tone: 'dark' },
  dispatched: { label: 'Dispatched', tone: 'ok' },
};

export const PART_STATUS: Record<PartOrder['status'], { label: string; tone: Tone }> = {
  paid: { label: 'Paid', tone: 'ok' },
  'awaiting-quote': { label: 'Awaiting quote', tone: 'warn' },
  dispatched: { label: 'Dispatched', tone: 'ok' },
};

export const ENQUIRY_STATUS: Record<Enquiry['status'], { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'warn' },
  replied: { label: 'Replied', tone: 'ok' },
  closed: { label: 'Closed', tone: 'sim' },
};

/** Stepper positions. */
export function jobSteps(j: HelmetJob): { steps: string[]; current: number; alert: boolean } {
  if (j.kind === 'standard') {
    const steps = ['Approved in 3D', 'Paid · locked', 'In production', 'Completed'];
    const map: Partial<Record<HelmetJobStatus, number>> = { 'in-production': 2, completed: 3 };
    return { steps, current: map[j.status] ?? 1, alert: j.status === 'change-requested' || j.status === 'change-authorised' };
  }
  const steps = ['Brief submitted', 'In discussion', 'Quoted', 'Approved', 'Paid · locked', 'In production', 'Completed'];
  const map: Record<HelmetJobStatus, number> = {
    submitted: 0, 'in-discussion': 1, quoted: 2, 'awaiting-payment': 3, paid: 4, 'change-requested': 4, 'change-authorised': 4, 'in-production': 5, completed: 6,
  };
  return { steps, current: map[j.status], alert: j.status === 'change-requested' || j.status === 'change-authorised' };
}

export function kartSteps(o: KartOrder): { steps: string[]; current: number; alert: boolean } {
  const steps = ['Paid', 'Artwork check', 'Proof sent', 'Approved', 'Sent to Print', 'Dispatched'];
  const map: Record<KartOrderStatus, number> = {
    paid: 0, 'artwork-check': 1, 'proof-sent': 2, 'changes-requested': 2, 'proof-approved': 3, 'sent-to-print': 4, dispatched: 5,
  };
  return { steps, current: map[o.status], alert: o.status === 'changes-requested' };
}

export const stamp = <T extends { history: { at: string; text: string }[]; updatedAt: string }>(x: T, text: string): T =>
  ({ ...x, history: [...x.history, { at: nowISO(), text }], updatedAt: nowISO() });

/** Download a JSON object as a file. */
export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
