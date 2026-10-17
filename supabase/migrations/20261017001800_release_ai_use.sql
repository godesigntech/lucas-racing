-- Gives back an AI image attempt that never started (for example OpenAI was
-- unavailable), so failures don't use up a visitor's hourly limit.
create or replace function public.release_ai_use(p_visitor text, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.ai_usage
  where id = (
    select u.id from public.ai_usage u
    where u.visitor_key = p_visitor and u.kind = p_kind and u.created_at > now() - interval '5 minutes'
    order by u.created_at desc
    limit 1
  );
$$;

revoke all on function public.release_ai_use(text, text) from public;
grant execute on function public.release_ai_use(text, text) to anon, authenticated;
