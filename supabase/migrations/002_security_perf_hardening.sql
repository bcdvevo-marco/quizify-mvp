-- ============================================
-- 002_security_perf_hardening.sql
-- Security + Performance hardening for production
-- ============================================

-- ===== SECURITY FIXES =====

-- 1) handle_new_user: set search_path + revoke EXECUTE from anon/authenticated
--    (only the trigger needs to call it, not RPC)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 2) quiz-images bucket: drop overly broad SELECT policy
--    Public bucket URL access doesn't require RLS; dropping prevents file listing.
drop policy if exists "Public can view quiz images" on storage.objects;

-- 3) Tighten INSERT-with-check-true policies on game-related tables.
--    Players can only be inserted into lobby-state sessions.
drop policy if exists "players_insert" on public.players;
create policy "players_insert" on public.players for insert
  with check (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = game_session_id
        and gs.status = 'lobby'
    )
  );

--    Player answers can only be inserted for active sessions where the player exists.
drop policy if exists "answers_insert" on public.player_answers;
create policy "answers_insert" on public.player_answers for insert
  with check (
    exists (
      select 1 from public.players p
      join public.game_sessions gs on gs.id = p.game_session_id
      where p.id = player_id
        and gs.status = 'active'
    )
  );

--    game_results: only host can insert via service role; revoke broad public access.
drop policy if exists "results_insert" on public.game_results;
create policy "results_insert" on public.game_results for insert
  with check (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = game_session_id
        and gs.host_id = (select auth.uid())
    )
  );

-- ===== PERFORMANCE FIXES =====

-- 4) Optimize auth.uid() RLS lookups with (select auth.uid())
drop policy if exists "users_self" on public.users;
create policy "users_self" on public.users for all using ((select auth.uid()) = id);

drop policy if exists "quizzes_host" on public.quizzes;
create policy "quizzes_host" on public.quizzes for all using ((select auth.uid()) = host_id);

drop policy if exists "questions_host" on public.questions;
create policy "questions_host" on public.questions for all using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and q.host_id = (select auth.uid()))
);

drop policy if exists "options_host" on public.options;
create policy "options_host" on public.options for all using (
  exists (
    select 1 from public.questions q
    join public.quizzes qz on qz.id = q.quiz_id
    where q.id = question_id and qz.host_id = (select auth.uid())
  )
);

drop policy if exists "sessions_host" on public.game_sessions;
create policy "sessions_host" on public.game_sessions for all using ((select auth.uid()) = host_id);

drop policy if exists "teams_host" on public.teams;
create policy "teams_host" on public.teams for all using (
  exists (select 1 from public.game_sessions gs where gs.id = game_session_id and gs.host_id = (select auth.uid()))
);

-- 5) Foreign key covering indexes (13 of them)
create index if not exists idx_quizzes_host_id           on public.quizzes(host_id);
create index if not exists idx_questions_quiz_id         on public.questions(quiz_id);
create index if not exists idx_options_question_id       on public.options(question_id);
create index if not exists idx_sessions_quiz_id          on public.game_sessions(quiz_id);
create index if not exists idx_sessions_host_id          on public.game_sessions(host_id);
create index if not exists idx_teams_session_id          on public.teams(game_session_id);
create index if not exists idx_players_session_id        on public.players(game_session_id);
create index if not exists idx_players_team_id           on public.players(team_id);
create index if not exists idx_players_user_id           on public.players(user_id);
create index if not exists idx_pa_question_id            on public.player_answers(question_id);
create index if not exists idx_pa_option_id              on public.player_answers(option_id);
create index if not exists idx_results_session_id        on public.game_results(game_session_id);
create index if not exists idx_results_player_id         on public.game_results(player_id);
