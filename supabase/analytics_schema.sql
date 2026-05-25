-- ══════════════════════════════════════════════════════
-- AI Football Hub — Analytics + Monetization Schema
-- Run in Supabase SQL Editor AFTER schema.sql
-- ══════════════════════════════════════════════════════

-- ANALYTICS EVENTS TABLE
create table if not exists public.analytics_events (
  id          uuid default gen_random_uuid() primary key,
  event_name  text not null,
  user_id     uuid references public.profiles(id) on delete set null,
  properties  jsonb default '{}',
  page_url    text,
  user_agent  text,
  created_at  timestamptz default now()
);
alter table public.analytics_events enable row level security;
create policy "Service role writes analytics" on public.analytics_events
  for insert with check (true);
create policy "Admins read analytics" on public.analytics_events
  for select using (auth.role() = 'service_role');
create index idx_analytics_event on public.analytics_events(event_name, created_at desc);
create index idx_analytics_user  on public.analytics_events(user_id, created_at desc);

-- ADMIN ANALYTICS VIEW
create or replace view public.analytics_summary as
select
  date_trunc('day', created_at) as day,
  event_name,
  count(*) as total,
  count(distinct user_id) as unique_users
from public.analytics_events
where created_at >= now() - interval '30 days'
group by 1, 2
order by 1 desc, 3 desc;

-- REVENUE SUMMARY VIEW
create or replace view public.revenue_summary as
select
  date_trunc('day', started_at) as day,
  tier,
  count(*) as new_subs,
  sum(amount_ghs) as revenue_ghs
from public.subscriptions
where status = 'active'
group by 1, 2
order by 1 desc;

-- AD IMPRESSIONS TABLE (for your own tracking)
create table if not exists public.ad_impressions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  slot_format text not null,
  page_url    text,
  created_at  timestamptz default now()
);
alter table public.ad_impressions enable row level security;
create policy "Anyone inserts ad impression" on public.ad_impressions
  for insert with check (true);
create index idx_ad_impressions_day on public.ad_impressions(created_at desc);

-- PAYWALL EVENTS (track conversion funnel)
create table if not exists public.paywall_events (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  event_type  text not null check (event_type in ('view','click','started','completed','abandoned')),
  plan_tier   text,
  plan_period text,
  created_at  timestamptz default now()
);
alter table public.paywall_events enable row level security;
create policy "Anyone inserts paywall event" on public.paywall_events
  for insert with check (true);
