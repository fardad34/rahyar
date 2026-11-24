-- Runs entirely in a rollback transaction using the two existing synthetic staging identities.
begin;
select set_config('rahyar.test_a',(select id::text from auth.users where split_part(email,'@',2)='example.invalid' order by id limit 1),true);
select set_config('rahyar.test_b',(select id::text from auth.users where split_part(email,'@',2)='example.invalid' order by id offset 1 limit 1),true);
do $$ begin if current_setting('rahyar.test_a')='' or current_setting('rahyar.test_b')='' then raise exception 'Existing synthetic test identities required';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rahyar.test_a'),'role','authenticated','is_anonymous',false)::text,true);
insert into public.rahyar_trip_contacts(user_id,phone) values(auth.uid(),'+15550000001') on conflict(user_id) do update set phone=excluded.phone;
insert into public.rahyar_trip_journals(id,started_at,status,data) values('a1111111-1111-4111-8111-111111111111',now(),'completed','{"version":1,"test":true}');
insert into public.rahyar_trip_shares(id,payload) values('b1111111-1111-4111-8111-111111111111','{"version":1,"test":true}');
do $$ begin
 if public.rahyar_claim_admin() then raise exception 'Ordinary user escalated to admin';end if;
 begin insert into public.rahyar_admins(user_id) values(auth.uid());raise exception 'Self-grant unexpectedly succeeded';exception when insufficient_privilege then null;end;
 begin insert into public.rahyar_trip_journals(id,user_id,started_at,status,data) values('c1111111-1111-4111-8111-111111111111',current_setting('rahyar.test_b')::uuid,now(),'active','{}');raise exception 'Forged trip owner accepted';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rahyar.test_b'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 if exists(select 1 from public.rahyar_trip_journals where id='a1111111-1111-4111-8111-111111111111') then raise exception 'Cross-user private trip exposed';end if;
 if exists(select 1 from public.rahyar_trip_shares where id='b1111111-1111-4111-8111-111111111111') then raise exception 'Share enumeration exposed';end if;
end $$;
insert into public.rahyar_trip_contacts(user_id,phone) values(auth.uid(),'+15550000002') on conflict(user_id) do update set phone=excluded.phone;
select set_config('request.headers','{"x-rahyar-share":"b1111111-1111-4111-8111-111111111111"}',true);
do $$ begin if not exists(select 1 from public.rahyar_trip_shares where id='b1111111-1111-4111-8111-111111111111') then raise exception 'Valid registered recipient denied';end if;end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rahyar.test_a'),'role','authenticated','is_anonymous',false)::text,true);
update public.rahyar_trip_shares set revoked=true where id='b1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rahyar.test_b'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin if exists(select 1 from public.rahyar_trip_shares where id='b1111111-1111-4111-8111-111111111111') then raise exception 'Revoked share exposed';end if;end $$;
set local role postgres;
insert into public.rahyar_admins(user_id) values(current_setting('rahyar.test_b')::uuid) on conflict do nothing;
set local role authenticated;
do $$ begin if exists(select 1 from public.rahyar_trip_journals where id='a1111111-1111-4111-8111-111111111111') then raise exception 'Admin saw a non-consenting private trip';end if;end $$;
set local role postgres;
update public.rahyar_trip_journals set debug_consent=true where id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
do $$ begin if not exists(select 1 from public.rahyar_trip_journals where id='a1111111-1111-4111-8111-111111111111') then raise exception 'Admin cannot read opted-in debug trip';end if;end $$;
select 'PASS owner isolation, admin self-escalation denied, share token/contact gate, revocation and admin consent gate' as result;
rollback;
