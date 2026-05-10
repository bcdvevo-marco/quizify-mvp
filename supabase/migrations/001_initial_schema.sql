-- supabase/migrations/001_initial_schema.sql

-- Users (Supabase Auth ile senkron)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Quizzes
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  text text not null,
  image_url text,
  time_limit int not null default 20,
  position int not null,
  created_at timestamptz default now()
);

-- Options
create table public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  position int not null
);

-- Game Sessions
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id),
  host_id uuid not null references public.users(id),
  pin varchar(6) unique not null,
  join_slug text unique not null,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'ended')),
  allow_anonymous boolean not null default true,
  current_question_index int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1'
);

-- Players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  team_id uuid references public.teams(id),
  user_id uuid references public.users(id),
  nickname text not null,
  joined_at timestamptz default now()
);

-- Player Answers
create table public.player_answers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  option_id uuid references public.options(id),
  answered_ms int not null,
  points_earned int not null default 0,
  unique(player_id, question_id)
);

-- Game Results
create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id),
  total_points int not null default 0,
  rank int not null default 0,
  correct_count int not null default 0,
  total_questions int not null default 0
);

-- RLS Politikaları
alter table public.users enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.game_sessions enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.player_answers enable row level security;
alter table public.game_results enable row level security;

create policy "users_self" on public.users for all using (auth.uid() = id);

create policy "quizzes_host" on public.quizzes for all using (auth.uid() = host_id);
create policy "quizzes_published_read" on public.quizzes for select using (status = 'published');

create policy "questions_host" on public.questions for all using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and q.host_id = auth.uid())
);
create policy "questions_read" on public.questions for select using (true);

create policy "options_host" on public.options for all using (
  exists (
    select 1 from public.questions q
    join public.quizzes qz on qz.id = q.quiz_id
    where q.id = question_id and qz.host_id = auth.uid()
  )
);
create policy "options_read" on public.options for select using (true);

create policy "sessions_host" on public.game_sessions for all using (auth.uid() = host_id);
create policy "sessions_read" on public.game_sessions for select using (true);

create policy "teams_read" on public.teams for select using (true);
create policy "teams_host" on public.teams for all using (
  exists (select 1 from public.game_sessions gs where gs.id = game_session_id and gs.host_id = auth.uid())
);

create policy "players_insert" on public.players for insert with check (true);
create policy "players_read" on public.players for select using (true);

create policy "answers_insert" on public.player_answers for insert with check (true);
create policy "answers_read" on public.player_answers for select using (true);

create policy "results_read" on public.game_results for select using (true);
create policy "results_insert" on public.game_results for insert with check (true);

-- Trigger: auth.users → public.users senkron
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.players;
