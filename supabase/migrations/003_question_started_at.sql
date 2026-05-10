-- ============================================
-- 003_question_started_at.sql
-- Adds question start timestamp for player state recovery
-- ============================================

alter table public.game_sessions
add column if not exists current_question_started_at timestamptz;
