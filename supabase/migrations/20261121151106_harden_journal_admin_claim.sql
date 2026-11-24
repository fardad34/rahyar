create function rahyar_journal_private.claim_admin() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if exists(select 1 from auth.users u join rahyar_journal_private.admin_invites i on lower(u.email)=lower(i.email) where u.id=auth.uid() and u.email_confirmed_at is not null and u.is_anonymous is not true) then
  insert into public.rahyar_admins(user_id) values(auth.uid()) on conflict do nothing;
 end if;
 return exists(select 1 from public.rahyar_admins where user_id=auth.uid());
end $$;
revoke all on function rahyar_journal_private.claim_admin() from public,anon;
grant execute on function rahyar_journal_private.claim_admin() to authenticated;
create or replace function public.rahyar_claim_admin() returns boolean language sql security invoker set search_path='' as $$ select rahyar_journal_private.claim_admin(); $$;
revoke all on function public.rahyar_claim_admin() from public,anon;
grant execute on function public.rahyar_claim_admin() to authenticated;
