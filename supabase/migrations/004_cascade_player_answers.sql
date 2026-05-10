-- ============================================
-- 004_cascade_player_answers.sql
-- Quiz editöründe soruları silmeyi mümkün kıl
-- ============================================

-- player_answers.question_id → questions(id) CASCADE
alter table public.player_answers
drop constraint if exists player_answers_question_id_fkey;

alter table public.player_answers
add constraint player_answers_question_id_fkey
foreign key (question_id) references public.questions(id) on delete cascade;

-- player_answers.option_id → options(id) CASCADE
alter table public.player_answers
drop constraint if exists player_answers_option_id_fkey;

alter table public.player_answers
add constraint player_answers_option_id_fkey
foreign key (option_id) references public.options(id) on delete cascade;
