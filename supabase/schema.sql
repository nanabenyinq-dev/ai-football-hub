-- ══════════════════════════════════════════════════════
-- AI Football Hub — Full Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════

-- 1. USERS PROFILE (extends Supabase auth.users)
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text,
  full_name       text not null default '',
  avatar_url      text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','premium','vip')),
  subscription_expires_at timestamptz,
  streak_days     int not null default 0,
  xp_points       int not null default 0,
  level           int not null default 1,
  referral_code   text unique not null default 'REF'||upper(substr(md5(random()::text),1,6)),
  referred_by     uuid references public.profiles(id),
  created_at      timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Public read leaderboard"  on public.profiles for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PREDICTIONS (written by Python ML script)
create table if not exists public.predictions (
  id              text primary key,
  home_team       text not null,
  away_team       text not null,
  league          text not null,
  league_flag     text default '⚽',
  match_date      date not null,
  match_time      text not null default '18:00',
  prediction_type text not null,
  pick_label      text not null,
  home_odds       numeric(5,2) default 2.00,
  draw_odds       numeric(5,2) default 3.20,
  away_odds       numeric(5,2) default 3.50,
  best_odds       numeric(5,2) default 2.00,
  confidence      int not null check (confidence between 1 and 99),
  home_win_pct    numeric(5,1) default 33,
  draw_pct        numeric(5,1) default 33,
  away_win_pct    numeric(5,1) default 33,
  btts_pct        numeric(5,1) default 50,
  over25_pct      numeric(5,1) default 50,
  analysis        text default '',
  home_form       text[] default '{}',
  away_form       text[] default '{}',
  is_vip          boolean not null default false,
  is_featured     boolean not null default false,
  source          text default 'ml_engine',
  result          text default 'pending' check (result in ('pending','won','lost','void')),
  admin_override  boolean default false,
  created_at      timestamptz default now()
);
alter table public.predictions enable row level security;
-- Free users see free predictions; VIP users see all
create policy "Public read free predictions" on public.predictions
  for select using (is_vip = false);
create policy "VIP read all predictions" on public.predictions
  for select using (
    is_vip = false or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and subscription_tier in ('vip','premium')
    )
  );
create index idx_predictions_date on public.predictions(match_date desc);
create index idx_predictions_league on public.predictions(league);

-- 3. HUMAN FACTORS (written by Python script + admin)
create table if not exists public.human_factors (
  id              text primary key,
  player_name     text,
  team            text not null,
  type            text not null,
  headline        text not null,
  detail          text default '',
  impact_level    text not null default 'low' check (impact_level in ('critical','high','medium','low')),
  impact_direction text not null default 'neutral' check (impact_direction in ('negative','positive','neutral')),
  odds_shift_estimate numeric(4,2) default 0,
  source          text default 'reddit',
  source_url      text,
  verified        boolean default false,
  detected_at     timestamptz default now(),
  match_ids       text[] default '{}',
  sentiment_score numeric(3,2) default 0,
  social_buzz     int default 0,
  created_at      timestamptz default now()
);
alter table public.human_factors enable row level security;
create policy "Anyone reads human factors" on public.human_factors for select using (true);
create index idx_hf_team on public.human_factors(team);
create index idx_hf_detected on public.human_factors(detected_at desc);

-- 4. BET ENTRIES (user bet tracker)
create table if not exists public.bet_entries (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  match_label     text not null,
  bet_type        text not null,
  odds            numeric(5,2) not null,
  stake           numeric(10,2) not null,
  potential_return numeric(10,2) not null,
  result          text not null default 'pending' check (result in ('pending','won','lost','void')),
  profit_loss     numeric(10,2) default 0,
  prediction_id   text references public.predictions(id),
  created_at      timestamptz default now()
);
alter table public.bet_entries enable row level security;
create policy "Users manage own bets" on public.bet_entries
  for all using (auth.uid() = user_id);
create index idx_bets_user on public.bet_entries(user_id, created_at desc);

-- 5. SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null unique,
  tier            text not null check (tier in ('free','premium','vip')),
  status          text not null default 'active' check (status in ('active','cancelled','expired','pending')),
  amount_ghs      numeric(8,2) not null default 0,
  payment_method  text default 'card',
  paystack_ref    text unique,
  started_at      timestamptz default now(),
  expires_at      timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "Users read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- 6. REFERRALS
create table if not exists public.referrals (
  id              uuid default gen_random_uuid() primary key,
  referrer_id     uuid references public.profiles(id) not null,
  referred_id     uuid references public.profiles(id) not null,
  status          text not null default 'pending' check (status in ('pending','converted')),
  reward_amount   numeric(8,2) default 10.00,
  created_at      timestamptz default now()
);
alter table public.referrals enable row level security;
create policy "Users read own referrals" on public.referrals
  for select using (auth.uid() = referrer_id);

-- 7. NOTIFICATIONS
create table if not exists public.notifications (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  title           text not null,
  body            text not null,
  type            text default 'tip',
  read            boolean default false,
  prediction_id   text references public.predictions(id),
  created_at      timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id or user_id is null);

-- 8. LEADERBOARD VIEW
create or replace view public.leaderboard_weekly as
select
  p.id as user_id,
  p.full_name as display_name,
  p.level,
  count(b.id) filter (where b.result = 'won') * 10 +
  count(b.id) filter (where b.result = 'won' and b.odds >= 2.0) * 5 +
  p.streak_days * 3 as points,
  round(
    count(b.id) filter (where b.result = 'won')::numeric /
    nullif(count(b.id) filter (where b.result in ('won','lost')), 0) * 100, 1
  ) as win_rate
from public.profiles p
left join public.bet_entries b on b.user_id = p.id
  and b.created_at >= now() - interval '7 days'
group by p.id, p.full_name, p.level, p.streak_days
order by points desc
limit 50;

-- 9. ADMIN PREDICTIONS OVERRIDE TABLE
create table if not exists public.admin_overrides (
  id              uuid default gen_random_uuid() primary key,
  prediction_id   text references public.predictions(id),
  analyst_name    text not null default 'AI Football Hub Analyst',
  override_pick   text not null,
  override_confidence int,
  override_analysis text,
  vip_only        boolean default true,
  applied         boolean default false,
  created_at      timestamptz default now()
);
alter table public.admin_overrides enable row level security;
create policy "Admins manage overrides" on public.admin_overrides
  for all using (auth.role() = 'service_role');
