-- Lucas Racing: live chat between signed-in customers and the workshop team.
-- One conversation per customer; admins answer from the admin panel.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  last_message_at timestamptz,
  last_message_preview text not null default '',
  last_message_role text check (last_message_role in ('customer', 'admin')),
  customer_unread_count integer not null default 0 check (customer_unread_count >= 0),
  admin_unread_count integer not null default 0 check (admin_unread_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_last_message_at_idx on public.conversations (last_message_at desc nulls last);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  body text not null default '' check (char_length(body) <= 2000),
  attachment_path text,
  created_at timestamptz not null default now(),
  constraint messages_not_empty check (char_length(btrim(body)) > 0 or attachment_path is not null)
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

-- Keep the conversation's preview and unread counters in step with new messages.
-- Sending a message also counts as reading the thread.
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations c
  set
    last_message_at = new.created_at,
    last_message_preview = left(coalesce(nullif(btrim(new.body), ''), 'Sent a photo'), 140),
    last_message_role = new.sender_role,
    status = 'open',
    customer_unread_count = case when new.sender_role = 'admin' then c.customer_unread_count + 1 else 0 end,
    admin_unread_count = case when new.sender_role = 'customer' then c.admin_unread_count + 1 else 0 end,
    updated_at = now()
  where c.id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- Clears the unread counter for one side of a conversation.
create or replace function public.mark_conversation_read(p_conversation_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_role = 'admin' and public.is_admin() then
    update public.conversations set admin_unread_count = 0 where id = p_conversation_id and admin_unread_count > 0;
  elsif p_role = 'customer' then
    update public.conversations
    set customer_unread_count = 0
    where id = p_conversation_id and customer_id = auth.uid() and customer_unread_count > 0;
  else
    raise exception 'Not allowed' using errcode = '28000';
  end if;
end;
$$;

revoke all on function public.mark_conversation_read(uuid, text) from public;
grant execute on function public.mark_conversation_read(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Customers read own conversation" on public.conversations
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.is_admin()));
create policy "Customers start own conversation" on public.conversations
  for insert to authenticated with check (customer_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins update conversations" on public.conversations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Participants read messages" on public.messages
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = (select auth.uid()))
  );
create policy "Participants send messages" on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and (
      (sender_role = 'admin' and (select public.is_admin()))
      or (
        sender_role = 'customer'
        and exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = (select auth.uid()))
      )
    )
  );

-- Live updates for the chat widget and the admin inbox (Realtime applies the policies above).
alter publication supabase_realtime add table public.conversations, public.messages;

-- ---------------------------------------------------------------------------
-- Photo attachments: private bucket, one folder per customer.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Chat photos: customers read own, admins read all" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-attachments'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
create policy "Chat photos: customers upload own, admins upload any" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-attachments'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
