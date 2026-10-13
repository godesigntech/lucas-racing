/* Browser-local backend: SIMULATED accounts and storage (localStorage, this browser only). */
import type { User } from '@/core/types';
import { uid } from '@/core/util';
import { PROTECTED, type Backend, type Collection, type Doc } from './backend';

const K = (c: string) => 'lr:' + c;

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch (e) {
    console.warn('Local storage full or unavailable', e);
    throw new Error('Browser storage is full. Remove some saved designs or uploaded images and try again.');
  }
}

export function createLocalBackend(): Backend {
  const listeners = new Set<(u: User | null) => void>();
  let user: User | null = read<User | null>(K('session'), null);
  const setUser = (u: User | null) => {
    user = u;
    write(K('session'), u);
    listeners.forEach((l) => l(u));
  };
  const users = () => read<User[]>(K('users'), []);

  return {
    kind: 'local',
    label: 'Browser-local demo storage (simulated accounts)',
    async list<T extends Doc>(c: Collection) {
      return Object.values(read<Record<string, T>>(K(c), {}));
    },
    async get<T extends Doc>(c: Collection, id: string) {
      return (read<Record<string, T>>(K(c), {})[id] ?? null) as T | null;
    },
    async put<T extends Doc>(c: Collection, doc: T) {
      const all = read<Record<string, T>>(K(c), {});
      all[doc.id] = doc;
      write(K(c), all);
      return doc;
    },
    async remove(c: Collection, id: string) {
      if (PROTECTED.includes(c)) throw new Error('Production history cannot be deleted.');
      const all = read<Record<string, Doc>>(K(c), {});
      delete all[id];
      write(K(c), all);
    },
    auth: {
      current: () => user,
      async signUp(email, _password, name) {
        const e = email.trim().toLowerCase();
        if (users().some((u) => u.email === e)) throw new Error('An account with this email already exists. Sign in instead.');
        const u: User = { id: uid('u_'), email: e, name: name.trim() || e.split('@')[0], role: 'customer' };
        write(K('users'), [...users(), u]);
        setUser(u);
        return u;
      },
      async signIn(email) {
        const e = email.trim().toLowerCase();
        const u = users().find((x) => x.email === e);
        if (!u) throw new Error('No simulated account with that email. Create one first.');
        setUser(u);
        return u;
      },
      async signOut() {
        setUser(null);
      },
      onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      async setDemoRole(role) {
        if (!user) {
          // Create a demo staff identity on the fly.
          const u: User = { id: uid('u_'), email: 'workshop@lucasracing.demo', name: 'Workshop (demo)', role };
          write(K('users'), [...users().filter((x) => x.email !== u.email), u]);
          setUser(u);
          return u;
        }
        const u = { ...user, role };
        write(K('users'), users().map((x) => (x.id === u.id ? u : x)));
        setUser(u);
        return u;
      },
    },
  };
}
