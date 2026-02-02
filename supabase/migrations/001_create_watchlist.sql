-- Create watchlist table
create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  notes text,
  added_at timestamptz default now() not null,
  unique(user_id, symbol)
);

-- Enable Row Level Security
alter table watchlists enable row level security;

-- Policy: Users can view their own watchlist
create policy "Users can view own watchlist"
  on watchlists for select
  using (auth.uid() = user_id);

-- Policy: Users can add to their own watchlist
create policy "Users can add to watchlist"
  on watchlists for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own watchlist items
create policy "Users can update own watchlist"
  on watchlists for update
  using (auth.uid() = user_id);

-- Policy: Users can remove from their own watchlist
create policy "Users can remove from watchlist"
  on watchlists for delete
  using (auth.uid() = user_id);

-- Index for fast user lookups
create index if not exists watchlists_user_id_idx on watchlists(user_id);
