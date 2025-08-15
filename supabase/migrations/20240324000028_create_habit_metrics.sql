-- Create habit_metrics table to track streaks and points per user
create table if not exists habit_metrics (
  user_id uuid primary key references profiles(id) on delete cascade,
  streak integer not null default 0,
  points integer not null default 0,
  updated_at timestamptz default now()
);

alter table habit_metrics enable row level security;

create policy "Users can view their habit metrics"
  on habit_metrics
  for select
  using (auth.uid() = user_id);

create policy "Users can update their habit metrics"
  on habit_metrics
  for update
  using (auth.uid() = user_id);

create policy "Users can insert their habit metrics"
  on habit_metrics
  for insert
  with check (auth.uid() = user_id);
