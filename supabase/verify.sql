-- Read-only migration/security assertions; run after all migrations.
do $$
begin
 if exists(select 1 from pg_tables where schemaname='public' and tablename like 'rahyar_%' and not rowsecurity) then raise exception 'Missing RLS'; end if;
 if has_table_privilege('anon','public.rahyar_road_reports','select') then raise exception 'Anonymous report access'; end if;
 if has_column_privilege('authenticated','public.rahyar_road_reports','source','insert') then raise exception 'Clients can forge provenance'; end if;
 if has_column_privilege('authenticated','public.rahyar_road_reports','expires_at','insert') then raise exception 'Clients can extend expiry'; end if;
 if has_table_privilege('authenticated','public.rahyar_road_reports','update') then raise exception 'Clients can moderate themselves'; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='rahyar_road_reports') then raise exception 'Realtime not enabled'; end if;
 if (select count(*) from public.rahyar_stations)<>212 then raise exception 'Government station registry incomplete'; end if;
end $$;
select 'Migration/RLS/publication/registry verification passed' as result;
