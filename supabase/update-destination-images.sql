-- Update image paths for the existing destination rows only.
-- DML only: no schema, RLS, or policy changes.
begin;

do $$
declare
  existing_count integer;
begin
  select count(*) into existing_count
  from public.destinations
  where name in (
    'Shillong', 'Dawki & Umngot', 'Kaziranga', 'Majuli', 'Tawang', 'Ziro Valley',
    'Dzükōu Valley', 'Loktak Lake', 'Reiek', 'Unakoti', 'Gangtok', 'Lachung'
  );
  if existing_count <> 12 then
    raise exception 'Expected 12 existing destination rows, found %; no image updates applied.', existing_count;
  end if;
end $$;

update public.destinations as destination
set image_url = update_data.image_url,
    details = jsonb_set(coalesce(destination.details, '{}'::jsonb), '{image}', to_jsonb(update_data.image_url), true)
from (values
  ('Shillong', '/assets/images/destinations/shillong.webp'),
  ('Dawki & Umngot', '/assets/images/destinations/dawki-umngot.webp'),
  ('Kaziranga', '/assets/images/destinations/kaziranga.webp'),
  ('Majuli', '/assets/images/destinations/majuli.webp'),
  ('Tawang', '/assets/images/destinations/tawang.webp'),
  ('Ziro Valley', '/assets/images/destinations/ziro-valley.webp'),
  ('Dzükōu Valley', '/assets/images/destinations/dzukou-valley.webp'),
  ('Loktak Lake', '/assets/images/destinations/loktak-lake.webp'),
  ('Reiek', '/assets/images/destinations/reiek.webp'),
  ('Unakoti', '/assets/images/destinations/unakoti.webp'),
  ('Gangtok', '/assets/images/destinations/gangtok.webp'),
  ('Lachung', '/assets/images/destinations/lachung.webp')
) as update_data(name, image_url)
where destination.name = update_data.name;

commit;
