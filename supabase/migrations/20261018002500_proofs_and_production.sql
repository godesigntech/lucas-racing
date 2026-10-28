-- Phase 8: the 16-step helmet journey, part 4 of 4 — proofs, production tracking, fixes.
--
-- Proof approval has always been real work done over email: ~20 places in the UI promise
-- the customer a proof, but nothing recorded one. This gives it a data model, so the
-- workshop can upload a proof against an order, the customer can approve it or ask for
-- changes, and production cannot start until they have.

-- ---------------------------------------------------------------------------
-- Order statuses for the production workflow.
-- The original seven are kept so existing orders stay valid. 'ready' now means ready
-- for collection and 'shipped' means dispatched; both already read that way to customers.
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending',                 -- Order placed
    'awaiting_design_review',  -- With the workshop to check the artwork
    'awaiting_proof_approval', -- Proof sent, waiting on the customer
    'approved_for_production', -- Customer approved the proof
    'scheduled',               -- Slot booked, waiting for its start date
    'confirmed',               -- Legacy: kept so existing orders remain valid
    'in_production',
    'quality_check',
    'ready',                   -- Ready for collection
    'shipped',                 -- Dispatched
    'completed',
    'cancelled'
  ));

-- ---------------------------------------------------------------------------
-- Proofs and completed-helmet photographs.
-- ---------------------------------------------------------------------------
create table public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Null when the proof covers the whole order rather than one helmet.
  order_item_id uuid references public.order_items (id) on delete cascade,
  kind text not null default 'design_proof' check (kind in ('design_proof', 'production_photo')),
  version integer not null default 1 check (version >= 1),
  -- Path in the private 'order-proofs' bucket: <order id>/<uuid>.<ext>
  image_path text not null,
  caption text not null default '',
  -- Only meaningful for a design_proof.
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested')),
  customer_note text not null default '',
  responded_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_proofs_order_idx on public.order_proofs (order_id, kind, version desc);

create trigger order_proofs_updated_at
  before update on public.order_proofs
  for each row execute function public.set_updated_at();

alter table public.order_proofs enable row level security;

create policy "Customers read own proofs" on public.order_proofs
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

-- Staff who handle orders upload and manage proofs.
create policy "Staff manage proofs" on public.order_proofs
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-proofs', 'order-proofs', false, 10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

create policy "Order proofs: staff upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'order-proofs' and (select public.is_admin()));

create policy "Order proofs: staff manage" on storage.objects
  for update to authenticated
  using (bucket_id = 'order-proofs' and (select public.is_admin()));

create policy "Order proofs: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'order-proofs' and (select public.is_admin()));

-- The first folder of the path is the order id, so a customer can read the proofs
-- for their own orders and nobody else's.
create policy "Order proofs: owner reads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'order-proofs'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.orders o
        where o.user_id = (select auth.uid())
          and o.id::text = (storage.foldername(name))[1]
      )
    )
  );

/**
 * The customer's answer to a proof. Approving moves the order on to
 * 'approved_for_production'; asking for changes sends it back to the workshop.
 * Both write an order_status_events row, so the history reads as one story.
 */
create or replace function public.respond_to_proof(
  p_proof_id uuid,
  p_approved boolean,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_proof public.order_proofs;
  v_order public.orders;
  v_status text;
begin
  if v_user is null then
    raise exception 'Please sign in.' using errcode = '28000';
  end if;

  select * into v_proof from public.order_proofs where id = p_proof_id;
  if not found or v_proof.kind <> 'design_proof' then
    raise exception 'That proof is no longer available.' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = v_proof.order_id;
  if not found or v_order.user_id is distinct from v_user then
    raise exception 'That proof is no longer available.' using errcode = '22023';
  end if;

  if v_proof.status <> 'pending' then
    raise exception 'You have already answered this proof.' using errcode = '22023';
  end if;

  v_status := case when p_approved then 'approved' else 'changes_requested' end;

  update public.order_proofs
  set status = v_status,
      customer_note = left(coalesce(p_note, ''), 1000),
      responded_at = now()
  where id = p_proof_id;

  update public.orders
  set status = case when p_approved then 'approved_for_production' else 'awaiting_design_review' end
  where id = v_proof.order_id;

  insert into public.order_status_events (order_id, status, payment_status, note, created_by)
  values (
    v_proof.order_id,
    case when p_approved then 'approved_for_production' else 'awaiting_design_review' end,
    v_order.payment_status,
    case when p_approved then 'Proof approved by the customer.' else 'Customer asked for changes to the proof.' end,
    v_user
  );
end;
$$;

revoke all on function public.respond_to_proof(uuid, boolean, text) from public, anon;
grant execute on function public.respond_to_proof(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Two fixes to existing schema.
-- ---------------------------------------------------------------------------

-- order_items.quantity still carried the helmet-only limit of 10, while shop product
-- lines have allowed up to 99 since migration 1100. Any basket with 11 or more of a
-- shop product would abort the whole order at insert time.
alter table public.order_items drop constraint order_items_quantity_check;
alter table public.order_items
  add constraint order_items_quantity_check check (quantity between 1 and 99);

-- A 16-step build carries per-region treatments, personalisation and logo transforms,
-- which no longer fit in 4 KB.
alter table public.saved_designs drop constraint saved_designs_config_check;
alter table public.saved_designs
  add constraint saved_designs_config_check check (pg_column_size(config) <= 16000);
