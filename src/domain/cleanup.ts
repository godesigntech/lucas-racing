/* Draft cleanup that never touches paid orders or production history. */
import type { HelmetDesign, HelmetJob, KartDesign, KartOrder, ShareLink } from '@/core/types';

export interface CleanupInput {
  helmetDesigns: HelmetDesign[];
  kartDesigns: KartDesign[];
  jobs: HelmetJob[];
  kartOrders: KartOrder[];
  shares: ShareLink[];
  olderThanDays: number;
  now?: Date;
}

export interface CleanupPlan {
  removeHelmetDesigns: string[];
  removeKartDesigns: string[];
  protected: { id: string; reason: string }[];
}

export function planDraftCleanup(i: CleanupInput): CleanupPlan {
  const cutoff = (i.now ?? new Date()).getTime() - i.olderThanDays * 864e5;
  const helmetRefs = new Map<string, string>();
  i.jobs.forEach((j) => helmetRefs.set(j.designId, `Referenced by job ${j.ref}`));
  const kartRefs = new Map<string, string>();
  i.kartOrders.forEach((o) => kartRefs.set(o.designId, `Referenced by order ${o.ref}`));
  i.shares.forEach((s) => {
    const id = (s.designSnapshot as { id: string }).id;
    (s.kind === 'helmet' ? helmetRefs : kartRefs).set(id, helmetRefs.get(id) || kartRefs.get(id) || 'Has a share link');
  });
  const plan: CleanupPlan = { removeHelmetDesigns: [], removeKartDesigns: [], protected: [] };
  for (const d of i.helmetDesigns) {
    if (helmetRefs.has(d.id)) plan.protected.push({ id: d.id, reason: helmetRefs.get(d.id)! });
    else if (new Date(d.updatedAt).getTime() < cutoff) plan.removeHelmetDesigns.push(d.id);
  }
  for (const d of i.kartDesigns) {
    if (kartRefs.has(d.id)) plan.protected.push({ id: d.id, reason: kartRefs.get(d.id)! });
    else if (new Date(d.updatedAt).getTime() < cutoff) plan.removeKartDesigns.push(d.id);
  }
  return plan;
}
