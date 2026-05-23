create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique(user_id, symbol)
);

alter table public.watchlists enable row level security;

drop policy if exists "Users can read own watchlist" on public.watchlists;
create policy "Users can read own watchlist" on public.watchlists
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own watchlist" on public.watchlists;
create policy "Users can insert own watchlist" on public.watchlists
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own watchlist" on public.watchlists;
create policy "Users can delete own watchlist" on public.watchlists
for delete using (auth.uid() = user_id);
