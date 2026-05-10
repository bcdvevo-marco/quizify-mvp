export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; name: string; avatar_url: string | null; created_at: string }
        Insert: { id?: string; email: string; name: string; avatar_url?: string | null }
        Update: { name?: string; avatar_url?: string | null }
      }
      quizzes: {
        Row: { id: string; host_id: string; title: string; description: string | null; cover_image_url: string | null; status: 'draft' | 'published'; created_at: string; updated_at: string }
        Insert: { host_id: string; title: string; description?: string | null; cover_image_url?: string | null; status?: 'draft' | 'published' }
        Update: { title?: string; description?: string | null; cover_image_url?: string | null; status?: 'draft' | 'published'; updated_at?: string }
      }
      questions: {
        Row: { id: string; quiz_id: string; text: string; image_url: string | null; time_limit: number; position: number; created_at: string }
        Insert: { quiz_id: string; text: string; image_url?: string | null; time_limit?: number; position: number }
        Update: { text?: string; image_url?: string | null; time_limit?: number; position?: number }
      }
      options: {
        Row: { id: string; question_id: string; text: string; is_correct: boolean; position: number }
        Insert: { question_id: string; text: string; is_correct?: boolean; position: number }
        Update: { text?: string; is_correct?: boolean; position?: number }
      }
      game_sessions: {
        Row: { id: string; quiz_id: string; host_id: string; pin: string; join_slug: string; status: 'lobby' | 'active' | 'ended'; allow_anonymous: boolean; current_question_index: number; started_at: string | null; ended_at: string | null; created_at: string }
        Insert: { quiz_id: string; host_id: string; pin: string; join_slug: string; allow_anonymous?: boolean }
        Update: { status?: 'lobby' | 'active' | 'ended'; current_question_index?: number; started_at?: string; ended_at?: string }
      }
      teams: {
        Row: { id: string; game_session_id: string; name: string; color: string }
        Insert: { game_session_id: string; name: string; color: string }
        Update: { name?: string; color?: string }
      }
      players: {
        Row: { id: string; game_session_id: string; team_id: string | null; user_id: string | null; nickname: string; joined_at: string }
        Insert: { game_session_id: string; team_id?: string | null; user_id?: string | null; nickname: string }
        Update: { team_id?: string | null }
      }
      player_answers: {
        Row: { id: string; player_id: string; question_id: string; option_id: string | null; answered_ms: number; points_earned: number }
        Insert: { player_id: string; question_id: string; option_id?: string | null; answered_ms: number; points_earned?: number }
        Update: never
      }
      game_results: {
        Row: { id: string; game_session_id: string; player_id: string; total_points: number; rank: number; correct_count: number; total_questions: number }
        Insert: { game_session_id: string; player_id: string; total_points?: number; rank?: number; correct_count?: number; total_questions?: number }
        Update: never
      }
    }
  }
}

export type QuizRow = Database['public']['Tables']['quizzes']['Row']
export type QuestionRow = Database['public']['Tables']['questions']['Row']
export type OptionRow = Database['public']['Tables']['options']['Row']
export type GameSessionRow = Database['public']['Tables']['game_sessions']['Row']
export type PlayerRow = Database['public']['Tables']['players']['Row']
export type TeamRow = Database['public']['Tables']['teams']['Row']
export type PlayerAnswerRow = Database['public']['Tables']['player_answers']['Row']
export type GameResultRow = Database['public']['Tables']['game_results']['Row']

export type QuestionWithOptions = QuestionRow & { options: OptionRow[] }
export type QuizWithQuestions = QuizRow & { questions: QuestionWithOptions[] }
