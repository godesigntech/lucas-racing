/* Supabase backend. Requires supabase/migrations/0001_lucas_racing.sql to have been run.
   Records live in one JSONB table (lr_records); permissions are enforced by RLS + RPCs. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/core/types';
import type { Backend, Collection, Doc } from './backend';

export async function createSupabaseBackend(url: string, key: string): Promise<Backend | { error: string }> {
  const sb: SupabaseClient = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  // Probe: is the migration installed?
  const probe = await sb.from('lr_records').select('id').limit(1);
  if (probe.error) return { error: probe.error.message };

  const listeners = new Set<(u: User | null) => void>();
  let user: User | null = null;

  async function toUser(s: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null): Promise<User | null> {
    if (!s?.user) return null;
    const { data: isAdmin } = await sb.rpc('lr_is_admin');
    return {
      id: s.user.id,
      email: s.user.email || '',
      name: String(s.user.user_metadata?.name || (s.user.email || '').split('@')[0]),
      role: isAdmin ? 'admin' : 'customer',
    };
  }
  const { data } = await sb.auth.getSession();
  user = await toUser(data.session);
  sb.auth.onAuthStateChange(async (_e, session) => {
    user = await toUser(session);
    listeners.forEach((l) => l(user));
  });

  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  };

  return {
    kind: 'supabase',
    label: 'Supabase database',
    async list<T extends Doc>(c: Collection) {
      const { data, error } = await sb.from('lr_records').select('data').eq('collection', c).order('updated_at', { ascending: false });
      fail(error);
      return (data || []).map((r) => r.data as T);
    },
    async get<T extends Doc>(_c: Collection, id: string) {
      const { data, error } = await sb.rpc('lr_get', { p_id: id });
      fail(error);
      return ((data as T) ?? null) as T | null;
    },
    async put<T extends Doc>(c: Collection, doc: T, opts?: { isPublic?: boolean }) {
      const { error } = await sb.rpc('lr_put', { p_id: doc.id, p_collection: c, p_data: doc, p_public: !!opts?.isPublic || c === 'shares' });
      fail(error);
      return doc;
    },
    async remove(_c: Collection, id: string) {
      const { error } = await sb.rpc('lr_delete', { p_id: id });
      fail(error);
    },
    auth: {
      current: () => user,
      async signUp(email, password, name) {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
        fail(error);
        if (!data.session) throw new Error('Check your email to confirm the account, then sign in.');
        user = await toUser(data.session);
        return user!;
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        fail(error);
        user = await toUser(data.session);
        return user!;
      },
      async signOut() {
        await sb.auth.signOut();
        user = null;
        listeners.forEach((l) => l(null));
      },
      onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
  };
}
