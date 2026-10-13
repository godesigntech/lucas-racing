/* Undo/redo history for the kart configurator. Rapid edits sharing a key (e.g. a slider) coalesce. */
import { useCallback, useRef, useState } from 'react';

interface H<T> { past: T[]; present: T; future: T[] }
export interface SetOpts {
  /** Edits with the same key within COALESCE_MS merge into one undo step. */
  key?: string;
  /** Replace the present without creating an undo step (e.g. continuing a drag). */
  transient?: boolean;
}

const LIMIT = 80;
const COALESCE_MS = 900;

export function useHistory<T>(init: () => T) {
  const [h, setH] = useState<H<T>>(() => ({ past: [], present: init(), future: [] }));
  const last = useRef<{ key: string | null; t: number }>({ key: null, t: 0 });

  const set = useCallback((next: T | ((p: T) => T), opts: SetOpts = {}) => {
    // Decide coalescing outside the updater so the updater stays pure (StrictMode safe).
    const now = Date.now();
    const coalesce = !!opts.transient || (!!opts.key && last.current.key === opts.key && now - last.current.t < COALESCE_MS);
    if (!opts.transient) last.current = { key: opts.key ?? null, t: now };
    setH((s) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next;
      if (Object.is(value, s.present)) return s;
      if (coalesce) return { ...s, present: value };
      return { past: [...s.past, s.present].slice(-LIMIT), present: value, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { key: null, t: 0 };
    setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = { key: null, t: 0 };
    setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  /** Start over from a value with an empty history (e.g. loading a saved design). */
  const reset = useCallback((value: T) => {
    last.current = { key: null, t: 0 };
    setH({ past: [], present: value, future: [] });
  }, []);

  return { value: h.present, set, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}
