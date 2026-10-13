/* App-wide store: picks a backend, caches collections and exposes React hooks.
   Swap points for the real platform (e.g. WordPress/WooCommerce REST) live in ./backend. */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { BasketItem, Mode, Settings, User } from '@/core/types';
import { defaultSettings } from '@/data/defaults';
import type { Backend, Collection, Doc } from './backend';
import { createLocalBackend } from './localBackend';
import { createSupabaseBackend } from './supabaseBackend';

/* ---------------- tiny observable ---------------- */
function observable<T>(initial: T) {
  let v = initial;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (n: T) => { v = n; subs.forEach((s) => s()); },
    sub: (s: () => void) => { subs.add(s); return () => { subs.delete(s); }; },
  };
}

/* ---------------- backend selection ---------------- */
export const backendInfo = observable<{ kind: 'local' | 'supabase'; label: string; note: string | null }>({
  kind: 'local', label: 'Browser-local demo storage', note: null,
});
let backend: Backend = createLocalBackend();
let ready: Promise<void> | null = null;

export function initBackend(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    const forceLocal = (() => { try { return localStorage.getItem('lr:forceLocal') === '1'; } catch { return false; } })();
    if (url && key && !forceLocal) {
      try {
        const sb = await createSupabaseBackend(url, key);
        if ('error' in sb) {
          backendInfo.set({ kind: 'local', label: 'Browser-local demo storage', note: `Supabase is configured but the database migration has not been run yet (${sb.error}). Using browser storage.` });
        } else {
          backend = sb;
          backendInfo.set({ kind: 'supabase', label: sb.label, note: null });
        }
      } catch (e) {
        backendInfo.set({ kind: 'local', label: 'Browser-local demo storage', note: `Could not reach Supabase (${(e as Error).message}). Using browser storage.` });
      }
    }
    authState.set(backend.auth.current());
    backend.auth.onChange((u) => authState.set(u));
    collections.forEach((_, c) => void refresh(c));
  })();
  return ready;
}
export const getBackend = () => backend;

/* ---------------- auth ---------------- */
const authState = observable<User | null>(null);
export function useAuth() {
  const user = useSyncExternalStore(authState.sub, authState.get);
  return {
    user,
    isAdmin: user?.role === 'admin',
    signIn: (e: string, p: string) => backend.auth.signIn(e, p),
    signUp: (e: string, p: string, n: string) => backend.auth.signUp(e, p, n),
    signOut: () => backend.auth.signOut(),
    setDemoRole: backend.auth.setDemoRole ? (r: User['role']) => backend.auth.setDemoRole!(r) : null,
  };
}
export const currentUser = () => authState.get();

/* ---------------- collections ---------------- */
type CState = { items: Doc[]; loading: boolean; error: string | null };
const collections = new Map<Collection, ReturnType<typeof observable<CState>>>();
function col(c: Collection) {
  let o = collections.get(c);
  if (!o) {
    o = observable<CState>({ items: [], loading: true, error: null });
    collections.set(c, o);
    void initBackend().then(() => refresh(c));
  }
  return o;
}
export async function refresh(c: Collection) {
  const o = col(c);
  try {
    const items = await backend.list(c);
    items.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    o.set({ items, loading: false, error: null });
  } catch (e) {
    o.set({ ...o.get(), loading: false, error: (e as Error).message });
  }
}
// Refresh everything when the signed-in user changes.
authState.sub(() => collections.forEach((_, c) => void refresh(c)));

export function useCollection<T extends Doc>(c: Collection) {
  const o = col(c);
  const s = useSyncExternalStore(o.sub, o.get);
  return { items: s.items as T[], loading: s.loading, error: s.error, refresh: () => refresh(c) };
}

export async function getDoc<T extends Doc>(c: Collection, id: string): Promise<T | null> {
  await initBackend();
  const cached = col(c).get().items.find((x) => x.id === id) as T | undefined;
  return cached ?? backend.get<T>(c, id);
}

export async function putDoc<T extends Doc>(c: Collection, doc: T, opts?: { isPublic?: boolean }): Promise<T> {
  await initBackend();
  const stamped = { ...doc, updatedAt: new Date().toISOString() } as T;
  await backend.put(c, stamped, opts);
  const o = col(c);
  const items = o.get().items.filter((x) => x.id !== doc.id);
  o.set({ ...o.get(), items: [stamped, ...items] });
  if (!currentUser() && c !== 'settings') rememberGuest(c, doc.id);
  return stamped;
}

export async function removeDoc(c: Collection, id: string) {
  await initBackend();
  await backend.remove(c, id);
  const o = col(c);
  o.set({ ...o.get(), items: o.get().items.filter((x) => x.id !== id) });
}

/* Guest orders: remembered in this browser so "My orders" can find them. */
function rememberGuest(c: Collection, id: string) {
  try {
    const k = 'lr:guest:' + c;
    const ids: string[] = JSON.parse(localStorage.getItem(k) || '[]');
    if (!ids.includes(id)) localStorage.setItem(k, JSON.stringify([...ids, id]));
  } catch { /* ignore */ }
}
export function guestIds(c: Collection): string[] {
  try { return JSON.parse(localStorage.getItem('lr:guest:' + c) || '[]'); } catch { return []; }
}

/** Records the current visitor owns (account) plus guest records created in this browser. */
export function useMine<T extends Doc & { ownerId?: string | null }>(c: Collection) {
  const { items, loading, refresh: r } = useCollection<T>(c);
  const { user } = useAuth();
  const [guestDocs, setGuestDocs] = useState<T[]>([]);
  const gids = guestIds(c).join(',');
  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = gids ? gids.split(',') : [];
      const docs = await Promise.all(ids.map((id) => getDoc<T>(c, id).catch(() => null)));
      if (alive) setGuestDocs(docs.filter(Boolean) as T[]);
    })();
    return () => { alive = false; };
  }, [c, gids, items]);
  const mine = useMemo(() => {
    const own = user ? items.filter((x) => x.ownerId === user.id) : [];
    const map = new Map<string, T>();
    [...own, ...guestDocs.filter((g) => !g.ownerId)].forEach((x) => map.set(x.id, items.find((i) => i.id === x.id) || x));
    return [...map.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }, [items, guestDocs, user]);
  return { items: mine, loading, refresh: r };
}

/* ---------------- settings (admin-editable) ---------------- */
export function useSettings(): Settings {
  const { items } = useCollection<Settings & Doc>('settings');
  return useMemo(() => mergeSettings(items.find((x) => x.id === 'settings') as Settings | undefined), [items]);
}
export function mergeSettings(saved?: Settings): Settings {
  const d = defaultSettings();
  if (!saved) return d;
  return {
    ...d, ...saved,
    helmet: { ...d.helmet, ...saved.helmet, templatePrices: { ...d.helmet.templatePrices, ...saved.helmet?.templatePrices }, modelPrices: { ...d.helmet.modelPrices, ...saved.helmet?.modelPrices } },
    films: { ...d.films, ...saved.films },
    kart: { ...d.kart, ...saved.kart, kitPrices: { ...d.kart.kitPrices, ...saved.kart?.kitPrices }, panelPrices: { ...d.kart.panelPrices, ...saved.kart?.panelPrices }, materialSurcharge: { ...d.kart.materialSurcharge, ...saved.kart?.materialSurcharge } },
    parts: { ...d.parts, ...saved.parts, prices: { ...d.parts.prices, ...saved.parts?.prices } },
  };
}
export const saveSettings = (s: Settings) => putDoc('settings', s as unknown as Doc);

/* ---------------- basket (per browser) ---------------- */
const basketState = observable<BasketItem[]>((() => { try { return JSON.parse(localStorage.getItem('lr:basket') || '[]'); } catch { return []; } })());
basketState.sub(() => { try { localStorage.setItem('lr:basket', JSON.stringify(basketState.get())); } catch { /* full */ } });
export function useBasket() {
  const items = useSyncExternalStore(basketState.sub, basketState.get);
  return {
    items,
    count: items.reduce((a, i) => a + i.qty, 0),
    total: items.reduce((a, i) => a + (i.price + (i.type === 'part' ? i.customFee : 0)) * i.qty, 0),
    add: (i: BasketItem) => basketState.set([...basketState.get().filter((x) => !(x.type === 'helmet' && i.type === 'helmet' && x.designId === i.designId)), i]),
    remove: (id: string) => basketState.set(basketState.get().filter((x) => x.id !== id)),
    setQty: (id: string, qty: number) => basketState.set(basketState.get().map((x) => (x.id === id && x.type === 'part' ? { ...x, qty: Math.max(1, qty) } : x))),
    clear: () => basketState.set([]),
  };
}

/* ---------------- scope mode ---------------- */
const modeState = observable<Mode>((() => { try { return (localStorage.getItem('lr:mode') as Mode) || 'launch'; } catch { return 'launch'; } })());
modeState.sub(() => { try { localStorage.setItem('lr:mode', modeState.get()); } catch { /* ignore */ } });
export function useMode() {
  const mode = useSyncExternalStore(modeState.sub, modeState.get);
  return { mode, setMode: modeState.set, full: mode === 'full' };
}

/* ---------------- toasts ---------------- */
export const toastState = observable<{ id: number; text: string; tone: 'ok' | 'warn' | 'err' }[]>([]);
let tid = 0;
export function toast(text: string, tone: 'ok' | 'warn' | 'err' = 'ok') {
  const id = ++tid;
  toastState.set([...toastState.get(), { id, text, tone }]);
  setTimeout(() => toastState.set(toastState.get().filter((t) => t.id !== id)), 3800);
}
export function useToasts() {
  return useSyncExternalStore(toastState.sub, toastState.get);
}

/** Simulated email/notification: logged to the notifications collection, nothing is sent. */
export async function simulateEmail(to: string, subject: string, body: string) {
  const t = new Date().toISOString();
  await putDoc('notifications', { id: 'n_' + Math.random().toString(36).slice(2, 10), to, subject, body, createdAt: t, updatedAt: t });
}
