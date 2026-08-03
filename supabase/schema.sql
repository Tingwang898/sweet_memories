create extension if not exists pgcrypto;

create table if not exists public.travel_cities (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  travel_date_label text not null,
  longitude numeric not null,
  latitude numeric not null,
  status text not null check (status in ('visited', 'wish')),
  region text not null check (region in ('domestic', 'overseas')),
  checkin_type text not null,
  members text[] not null default array['我', '对象'],
  days integer not null default 1 check (days > 0),
  feature text,
  note text,
  food text,
  dog boolean not null default false,
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_travel_cities_updated_at on public.travel_cities;
create trigger set_travel_cities_updated_at
before update on public.travel_cities
for each row
execute function public.set_updated_at();

alter table public.travel_cities enable row level security;

drop policy if exists "Public can read travel cities" on public.travel_cities;
create policy "Public can read travel cities"
on public.travel_cities
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert travel cities" on public.travel_cities;
create policy "Authenticated users can insert travel cities"
on public.travel_cities
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update travel cities" on public.travel_cities;
create policy "Authenticated users can update travel cities"
on public.travel_cities
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete travel cities" on public.travel_cities;
create policy "Authenticated users can delete travel cities"
on public.travel_cities
for delete
to authenticated
using (true);

insert into public.travel_cities (
  id, name, travel_date_label, longitude, latitude, status, region, checkin_type,
  members, days, feature, note, food, dog, sort_order
) values
  ('shanghai', '上海', '2023.05.20', 121.4737, 31.2304, 'visited', 'domestic', '城市美食打卡', array['我', '对象', '帕恰'], 3, '梧桐夜风', '在黄昏的外滩等灯光亮起，帕恰把每一步都踩得像小小邮戳。', '葱油拌面、蟹粉小笼、路边咖啡', true, 1),
  ('kyoto', '京都', '2024.11.03', 135.7681, 35.0116, 'visited', 'overseas', '自然风光打卡', array['我', '对象'], 4, '枫叶与神社', '红叶落在石阶上，像一条安静的时间线，从清水寺延伸到傍晚。', '抹茶蕨饼、汤豆腐、鳗鱼饭', false, 2),
  ('tokyo', '东京', '2025.04.12', 139.6917, 35.6895, 'visited', 'overseas', '城市美食打卡', array['我', '对象', '帕恰'], 5, '夜樱与拉面', '便利店的热茶、街角的夜樱，还有一只认真闻每个路口的小小旅伴。', '豚骨拉面、寿司、草莓蛋糕', true, 3),
  ('paris', '巴黎', '2025.06.18', 2.3522, 48.8566, 'visited', 'overseas', '城市美食打卡', array['我', '对象'], 6, '塞纳河夜色', '金色路灯沿着河面铺开，晚风把所有普通散步都变成纪念。', '可颂、鹅肝、热巧克力', false, 4),
  ('santorini', '圣托里尼', '心愿 · 2026', 25.4615, 36.3932, 'wish', 'overseas', '自然风光打卡', array['我', '对象'], 5, '爱琴海日落', '想把下一次日落存在这里，等某天一起解锁。', '海鲜、酸奶、葡萄酒', false, 5),
  ('lijiang', '丽江', '心愿 · 2026', 100.233, 26.872, 'wish', 'domestic', '自然风光打卡', array['我', '对象', '帕恰'], 4, '雪山与古城', '想带帕恰在清晨古城里慢慢走，把爪印留给玉龙雪山。', '腊排骨、鲜花饼、米线', true, 6),
  ('reykjavik', '雷克雅未克', '心愿 · 极光季', -21.9426, 64.1466, 'wish', 'overseas', '自然风光打卡', array['我', '对象'], 7, '极光与温泉', '把地图上最冷的一点，留给最暖的一次拥抱。', '羊肉汤、黑麦面包、热可可', false, 7)
on conflict (id) do nothing;
