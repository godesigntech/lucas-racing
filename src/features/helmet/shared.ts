/* Helpers shared by the helmet builder, share page and saved designs. */
import { useEffect, useRef, useState } from 'react';
import type { HelmetDesign, HelmetJob, Paint, ShareLink } from '@/core/types';
import { clone, nowISO, uid } from '@/core/util';
import { colourName } from '@/core/color';
import { filmById } from '@/data/films';
import { newHelmetDesign } from '@/domain/helmet';
import { putDoc, useCollection } from '@/store';
import type { Collection, Doc } from '@/store/backend';

export const WIP_KEY = 'lr:wip-helmet';

/** Typed wrapper: domain interfaces have no index signature, the store's Doc does. */
export function saveDoc<T>(c: Collection, doc: T, opts?: { isPublic?: boolean }): Promise<T> {
  return putDoc(c, doc as unknown as Doc, opts) as unknown as Promise<T>;
}

export type JobDoc = HelmetJob & Doc;
export type DesignDoc = HelmetDesign & Doc;

export function useJobs(): HelmetJob[] {
  return useCollection<JobDoc>('jobs').items;
}

/** Load the in-progress working design (browser convenience only, not "saving"). */
export function loadWip(): HelmetDesign | null {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HelmetDesign>;
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.modelId) return null;
    const base = newHelmetDesign(parsed.modelId);
    return { ...base, ...parsed, trims: { ...base.trims, ...parsed.trims }, spoiler: { ...base.spoiler, ...parsed.spoiler } } as HelmetDesign;
  } catch {
    return null;
  }
}

export function storeWip(d: HelmetDesign) {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify(d));
  } catch {
    /* quota exceeded (large uploads): the working copy just won't survive a refresh */
  }
}

/** A fresh copy of a design with a new identity. */
export function copyDesign(d: HelmetDesign, name = d.name, ownerId: string | null = d.ownerId): HelmetDesign {
  const t = nowISO();
  return { ...clone(d), id: uid('hd_'), name, ownerId, createdAt: t, updatedAt: t };
}

export const shareUrl = (id: string) => `${location.origin}${location.pathname}#/share/${id}`;

export async function createHelmetShare(d: HelmetDesign): Promise<string> {
  const t = nowISO();
  const link: ShareLink = { id: uid('sh_'), kind: 'helmet', designSnapshot: clone(d), createdAt: t, updatedAt: t };
  await saveDoc('shares', link, { isPublic: true });
  return link.id;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function paintLabel(p: Paint): string {
  if (p.kind === 'solid') return colourName(p.color);
  if (p.kind === 'film') {
    const f = filmById(p.filmId);
    return (f?.name || 'Unknown film') + (p.tint ? ' · tinted' : '');
  }
  return 'Your film: ' + p.name;
}

/** Throttle a fast-changing value (e.g. slider drags) before it reaches the 3D texture painter. */
export function useThrottled<T>(value: T, ms = 90): T {
  const [v, setV] = useState(value);
  const last = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const wait = Math.max(0, ms - (performance.now() - last.current));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      last.current = performance.now();
      setV(value);
    }, wait);
    return () => window.clearTimeout(timer.current);
  }, [value, ms]);
  return v;
}
