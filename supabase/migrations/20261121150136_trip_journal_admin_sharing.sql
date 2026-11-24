-- Additive trip journal. Existing profiles/reports/stations are not changed.
create schema rahyar_journal_private;
revoke all on schema rahyar_journal_private from public,anon;
grant usage on schema rahyar_journal_private to authenticated;
create table rahyar_journal_private.admin_invites(email text primary key,created_at timestamptz not null default now());
revoke all on rahyar_journal_private.admin_invites from public,anon,authenticated;

create table public.rahyar_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.rahyar_admins enable row level security;
grant select on public.rahyar_admins to authenticated;
create policy admin_own_role on public.rahyar_admins for select to authenticated using ((select auth.uid())=user_id);

create table public.rahyar_trip_contacts(user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),updated_at timestamptz not null default now());
alter table public.rahyar_trip_contacts enable row level security;
grant select,insert,update on public.rahyar_trip_contacts to authenticated;
create policy contacts_own on public.rahyar_trip_contacts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');

-- Reads only the caller's verified Auth identity/contact. Never trusts editable user_metadata.
create function rahyar_journal_private.registered_contact() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users u join public.rahyar_trip_contacts c on c.user_id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and u.is_anonymous is not true);
$$;
revoke all on function rahyar_journal_private.registered_contact() from public,anon;
grant execute on function rahyar_journal_private.registered_contact() to authenticated;

create function public.rahyar_claim_admin() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if exists(select 1 from auth.users u join rahyar_journal_private.admin_invites i on lower(u.email)=lower(i.email) where u.id=auth.uid() and u.email_confirmed_at is not null and u.is_anonymous is not true) then
  insert into public.rahyar_admins(user_id) values(auth.uid()) on conflict do nothing;
 end if;
 return exists(select 1 from public.rahyar_admins where user_id=auth.uid());
end $$;
revoke all on function public.rahyar_claim_admin() from public,anon;
grant execute on function public.rahyar_claim_admin() to authenticated;

create table public.rahyar_trip_journals(
 id uuid primary key, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 started_at timestamptz not null,ended_at timestamptz,status text not null check(status in ('active','completed','cancelled')),
 debug_consent boolean not null default false,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=3000000),
 updated_at timestamptz not null default now(),check(ended_at is null or ended_at>=started_at)
);
create index trip_journal_owner_date on public.rahyar_trip_journals(user_id,started_at desc);
alter table public.rahyar_trip_journals enable row level security;
grant select,insert,update,delete on public.rahyar_trip_journals to authenticated;
create policy journal_read on public.rahyar_trip_journals for select to authenticated using ((select auth.uid())=user_id or (debug_consent and exists(select 1 from public.rahyar_admins a where a.user_id=(select auth.uid()))));
create policy journal_insert on public.rahyar_trip_journals for insert to authenticated with check ((select auth.uid())=user_id and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
create policy journal_update on public.rahyar_trip_journals for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy journal_delete on public.rahyar_trip_journals for delete to authenticated using ((select auth.uid())=user_id);

-- A share is an intentional snapshot. Its random ID is also required in a request header;
-- authenticated users cannot enumerate other people's share links.
create table public.rahyar_trip_shares(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=3000000),
 created_at timestamptz not null default now(),revoked boolean not null default false
);
alter table public.rahyar_trip_shares enable row level security;
grant select,insert,update,delete on public.rahyar_trip_shares to authenticated;
create policy shares_read on public.rahyar_trip_shares for select to authenticated using ((select auth.uid())=user_id or (not revoked and id::text=coalesce((nullif(current_setting('request.headers',true),'')::jsonb)->>'x-rahyar-share','') and (select rahyar_journal_private.registered_contact())));
create policy shares_insert on public.rahyar_trip_shares for insert to authenticated with check ((select auth.uid())=user_id and (select rahyar_journal_private.registered_contact()));
create policy shares_update on public.rahyar_trip_shares for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy shares_delete on public.rahyar_trip_shares for delete to authenticated using ((select auth.uid())=user_id);
