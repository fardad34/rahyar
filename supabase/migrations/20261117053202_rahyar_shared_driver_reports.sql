-- Additive staging foundation. No changes to auth/storage managed schemas.
create schema if not exists rahyar_private;
revoke all on schema rahyar_private from public, anon, authenticated;

create table public.rahyar_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=80),
 language text not null default 'en' check (language in ('en','fr','fa','hi','es','de')),
 created_at timestamptz not null default now()
);
create table public.rahyar_saved_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check (kind in ('vehicle','favorite','history','trip','preferences','feedback','bug','carrier_review','ai_usage')),
 client_id uuid not null,
 data jsonb not null check (jsonb_typeof(data)='object' and octet_length(data::text)<=100000),
 updated_at timestamptz not null default now(),
 unique(user_id,kind,client_id)
);
create index rahyar_saved_owner on public.rahyar_saved_records(user_id,kind);

create table public.rahyar_road_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 client_id uuid not null,
 category text not null check (category in ('police','closed','construction','weigh')),
 station_key text check (length(station_key)<=300),
 status text check (status in ('open','closed')),
 latitude double precision not null check (latitude between 24 and 84),
 longitude double precision not null check (longitude between -180 and -50),
 accuracy_m double precision not null check (accuracy_m between 0 and 100),
 heading double precision check (heading>=0 and heading<360),
 observed_at timestamptz not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 source text not null default 'driver' check (source='driver'),
 moderation text not null default 'visible' check (moderation in ('visible','hidden','review')),
 unique(user_id,client_id),
 check ((category='weigh' and station_key is not null and status is not null) or (category<>'weigh' and station_key is null and status is null))
);
create index rahyar_report_geo on public.rahyar_road_reports(latitude,longitude,expires_at);
create index rahyar_report_station on public.rahyar_road_reports(station_key,observed_at desc) where category='weigh';
create index rahyar_report_owner on public.rahyar_road_reports(user_id,created_at desc);

create function rahyar_private.guard_report() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or new.user_id<>auth.uid() then raise exception 'Sign in required' using errcode='42501'; end if;
 -- Serialize submissions by account; concurrent requests cannot bypass the limit.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.rahyar_road_reports where user_id=auth.uid() and client_id=new.client_id) then
  return null; -- replay of an offline submission; idempotent
 end if;
 if (select count(*) from public.rahyar_road_reports where user_id=auth.uid() and created_at>now()-interval '1 minute')>=6 then
  raise exception 'Report limit reached; retry in one minute' using errcode='P0001';
 end if;
 if new.observed_at>now()+interval '30 seconds' or new.observed_at<now()-interval '20 minutes' then
  raise exception 'Observation is stale or clock is incorrect' using errcode='22023';
 end if;
 if exists(select 1 from public.rahyar_road_reports where user_id=auth.uid()
  and category=new.category and station_key is not distinct from new.station_key and status is not distinct from new.status
  and abs(latitude-new.latitude)<0.001 and abs(longitude-new.longitude)<0.001
  and created_at>now()-interval '60 seconds') then
  return null; -- same driver's repeated nearby tap is not independent evidence
 end if;
 new.created_at=now(); new.source='driver'; new.moderation='visible';
 new.expires_at=new.observed_at+case when new.category='weigh' then interval '20 minutes' else interval '2 hours' end;
 return new;
end $$;
revoke all on function rahyar_private.guard_report() from public,anon,authenticated;
create trigger rahyar_report_guard before insert on public.rahyar_road_reports for each row execute function rahyar_private.guard_report();

create table public.rahyar_report_flags (
 report_id uuid not null references public.rahyar_road_reports(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 reason text not null check (reason in ('incorrect','unsafe','spam')),
 created_at timestamptz not null default now(), primary key(report_id,user_id)
);
create index rahyar_flags_owner on public.rahyar_report_flags(user_id);
alter table public.rahyar_profiles enable row level security;
alter table public.rahyar_saved_records enable row level security;
alter table public.rahyar_road_reports enable row level security;
alter table public.rahyar_report_flags enable row level security;

create policy profile_owner on public.rahyar_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy saved_owner on public.rahyar_saved_records for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Driver reports are intentionally shared among signed-in drivers, not private profile data.
create policy report_read on public.rahyar_road_reports for select to authenticated using (moderation='visible' and expires_at>now());
create policy report_insert on public.rahyar_road_reports for insert to authenticated with check ((select auth.uid())=user_id and moderation='visible' and source='driver');
create policy flag_owner on public.rahyar_report_flags for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.rahyar_profiles,public.rahyar_saved_records,public.rahyar_road_reports,public.rahyar_report_flags from anon,authenticated;
grant select,insert,update,delete on public.rahyar_profiles,public.rahyar_saved_records to authenticated;
grant select on public.rahyar_road_reports to authenticated;
grant insert(client_id,category,station_key,status,latitude,longitude,accuracy_m,heading,observed_at) on public.rahyar_road_reports to authenticated;
grant select,delete on public.rahyar_report_flags to authenticated;
grant insert(report_id,reason) on public.rahyar_report_flags to authenticated;
-- Only database administrators can hide/review reports. Clients cannot approve themselves.
alter publication supabase_realtime add table public.rahyar_road_reports;
