-- Validate coordinates without excluding Hawaii or Alaska's dateline islands.
-- Display/route relevance remains geographically filtered by the application.
alter table public.rahyar_road_reports drop constraint rahyar_road_reports_latitude_check;
alter table public.rahyar_road_reports add constraint rahyar_road_reports_latitude_check check(latitude between -90 and 90);
alter table public.rahyar_road_reports drop constraint rahyar_road_reports_longitude_check;
alter table public.rahyar_road_reports add constraint rahyar_road_reports_longitude_check check(longitude between -180 and 180);
