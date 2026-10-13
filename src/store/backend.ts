import type { User } from '@/core/types';

export type Collection =
  | 'helmetDesigns' | 'kartDesigns' | 'jobs' | 'kartOrders' | 'partOrders'
  | 'enquiries' | 'shares' | 'notifications' | 'settings';

/** Collections a signed-out guest may create (guest checkout, enquiries, shares). */
export const GUEST_WRITABLE: Collection[] = ['jobs', 'kartOrders', 'partOrders', 'enquiries', 'notifications', 'shares'];
/** Production history: never deleted, even by draft cleanup. */
export const PROTECTED: Collection[] = ['jobs', 'kartOrders', 'partOrders'];

export interface Doc { id: string; [k: string]: unknown }

export interface Backend {
  kind: 'local' | 'supabase';
  label: string;
  list<T extends Doc>(c: Collection): Promise<T[]>;
  get<T extends Doc>(c: Collection, id: string): Promise<T | null>;
  put<T extends Doc>(c: Collection, doc: T, opts?: { isPublic?: boolean }): Promise<T>;
  remove(c: Collection, id: string): Promise<void>;
  auth: {
    current(): User | null;
    signUp(email: string, password: string, name: string): Promise<User>;
    signIn(email: string, password: string): Promise<User>;
    signOut(): Promise<void>;
    onChange(cb: (u: User | null) => void): () => void;
    /** Local demo only: switch the simulated user's role. */
    setDemoRole?(role: User['role']): Promise<User | null>;
  };
}
