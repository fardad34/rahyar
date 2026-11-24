alter policy report_insert on public.rahyar_road_reports with check (
 (select auth.uid())=user_id and moderation='visible' and source='driver'
 and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true'
);
create function rahyar_private.guard_saved_record() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or new.user_id<>auth.uid() then raise exception 'Sign in required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 if tg_op='INSERT' and not exists(select 1 from public.rahyar_saved_records where user_id=auth.uid() and kind=new.kind and client_id=new.client_id)
 and (select count(*) from public.rahyar_saved_records where user_id=auth.uid())>=100 then
  raise exception 'Saved record limit reached' using errcode='P0001';
 end if;
 new.updated_at=now();return new;
end $$;
revoke all on function rahyar_private.guard_saved_record() from public,anon,authenticated;
create trigger rahyar_saved_guard before insert or update on public.rahyar_saved_records for each row execute function rahyar_private.guard_saved_record();
