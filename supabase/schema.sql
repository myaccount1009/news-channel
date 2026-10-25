-- =====================================================================
-- News portal schema  (Supabase → SQL Editor → New query → Paste → Run)
-- আবার চালালেও সমস্যা নেই (idempotent)।
-- =====================================================================

-- ---------- Categories ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references public.categories(id) on delete set null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Posts ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  excerpt       text,
  content       text not null default '',
  image_url     text,
  image_alt     text,
  category_id   uuid references public.categories(id) on delete set null,
  tags          text[] not null default '{}',
  author        text,
  source_url    text,                                   -- মূল খবরের লিংক (duplicate ঠেকাতে)
  source        text not null default 'admin' check (source in ('admin','api')),
  status        text not null default 'published' check (status in ('draft','published')),
  is_featured   boolean not null default false,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- একই source_url দিয়ে দুইবার পোস্ট হবে না
create unique index if not exists posts_source_url_key
  on public.posts (source_url) where source_url is not null;

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);
create index if not exists posts_category_idx
  on public.posts (category_id, published_at desc);
create index if not exists posts_tags_idx
  on public.posts using gin (tags);

-- updated_at নিজে নিজে আপডেট হবে
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- ওয়েবসাইট server থেকে service_role key দিয়ে ডাটা পড়ে/লেখে (RLS ডিঙিয়ে)।
-- নিচের policy গুলো শুধু নিরাপত্তার জন্য: anon key দিয়ে কেউ সরাসরি Supabase এ
-- গেলেও শুধু প্রকাশিত খবর পড়তে পারবে, কিছু লিখতে পারবে না।
alter table public.categories enable row level security;
alter table public.posts      enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

-- ---------- Storage bucket (ছবির জন্য) ----------
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

-- ---------- Seed: categories ----------
insert into public.categories (name, slug, sort_order) values
  ('জাতীয়',       'national',      1),
  ('রাজনীতি',      'politics',      2),
  ('অর্থনীতি',     'economy',       3),
  ('সারাদেশ',      'country',       4),
  ('আন্তর্জাতিক',  'international', 5),
  ('ফিচার',        'feature',       6),
  ('খেলা',         'sports',        7),
  ('বিনোদন',       'entertainment', 8),
  ('লাইফস্টাইল',   'lifestyle',     9),
  ('শিক্ষা',       'education',     10),
  ('ভিডিও',        'video',         11),
  ('ছবি',          'photo',         12)
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, sort_order)
select v.name, v.slug, p.id, v.ord
from (values
  ('অপরাধ','crime','national',1), ('স্বাস্থ্য','health','national',2),
  ('আইন-আদালত','law-court','national',3), ('নির্বাচন','election','national',4),
  ('পরিবেশ','environment','national',5), ('সংবাদ','news','national',6),

  ('বন্দর','port','economy',1), ('কাস্টমস','customs','economy',2),
  ('ব্যাংক','bank','economy',3), ('বাণিজ্য সংবাদ','business-news','economy',4),
  ('শেয়ারবাজার','stock-market','economy',5), ('শিল্প','industry','economy',6),
  ('কর্পোরেট','corporate','economy',7), ('বিশ্ববাণিজ্য','world-trade','economy',8),

  ('ঢাকা','dhaka','country',1), ('চট্টগ্রাম','chattogram','country',2),
  ('রাজশাহী','rajshahi','country',3), ('খুলনা','khulna','country',4),
  ('সিলেট','sylhet','country',5), ('বরিশাল','barishal','country',6),
  ('ময়মনসিংহ','mymensingh','country',7), ('রংপুর','rangpur','country',8),

  ('প্রবাস','expatriates','international',1), ('এশিয়া','asia','international',2),
  ('ইউরোপ','europe','international',3), ('আফ্রিকা','africa','international',4),
  ('লাতিন আমেরিকা','latin-america','international',5), ('অস্ট্রেলিয়া','australia','international',6),
  ('যুক্তরাষ্ট্র','usa','international',7), ('মধ্যপ্রাচ্য','middle-east','international',8),
  ('কানাডা','canada','international',9), ('পাকিস্তান','pakistan','international',10),
  ('ভারত','india','international',11), ('মালয়েশিয়া','malaysia','international',12),
  ('থাইল্যান্ড','thailand','international',13), ('চীন','china','international',14),

  ('প্রযুক্তি','technology','feature',1), ('শিল্প-সংস্কৃতি','art-culture','feature',2),
  ('সাহিত্য','literature','feature',3), ('ধর্ম','religion','feature',4),
  ('নারী ও শিশু','women-children','feature',5), ('গণমাধ্যম','media','feature',6),

  ('ক্রিকেট','cricket','sports',1), ('ফুটবল','football','sports',2), ('অন্যান্য','other-sports','sports',3),

  ('টেলিভিশন','television','entertainment',1), ('ঢালিউড','dhallywood','entertainment',2),
  ('বলিউড','bollywood','entertainment',3), ('হলিউড','hollywood','entertainment',4),
  ('ওটিটি','ott','entertainment',5), ('নাটক','drama','entertainment',6), ('গান','music','entertainment',7),

  ('চাকরি','jobs','lifestyle',1), ('খাবার','food','lifestyle',2), ('বেড়ানো','travel','lifestyle',3),
  ('ফ্যাশন','fashion','lifestyle',4), ('সাজগোজ','beauty','lifestyle',5), ('রান্না','cooking','lifestyle',6),

  ('ক্যাম্পাস','campus','education',1)
) as v(name, slug, parent_slug, ord)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;
