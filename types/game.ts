export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_STARTED'
  | 'QUESTION_START'
  | 'ANSWER_COUNT'
  | 'QUESTION_END'
  | 'LEADERBOARD_UPDATE'
  | 'GAME_END'

export interface PlayerJoinedEvent {
  type: 'PLAYER_JOINED'
  player_id: string
  nickname: string
  team_id: string | null
}

export interface PlayerLeftEvent {
  type: 'PLAYER_LEFT'
  player_id: string
}

export interface GameStartedEvent {
  type: 'GAME_STARTED'
  quiz_title: string
  question_count: number
}

export interface QuestionStartEvent {
  type: 'QUESTION_START'
  question_id: string
  text: string
  image_url: string | null
  options: { id: string; text: string; position: number }[]
  time_limit: number
  start_timestamp: number
  question_number: number
  total_questions: number
}

export interface AnswerCountEvent {
  type: 'ANSWER_COUNT'
  answered: number
  total: number
}

export interface QuestionEndEvent {
  type: 'QUESTION_END'
  correct_option_id: string
  answer_stats: { option_id: string; count: number }[]
  your_points?: number
}

export interface LeaderboardUpdateEvent {
  type: 'LEADERBOARD_UPDATE'
  rankings: { player_id: string; nickname: string; team_id: string | null; total_points: number; rank: number }[]
}

export interface GameEndEvent {
  type: 'GAME_END'
  final_rankings: { player_id: string; nickname: string; total_points: number; rank: number }[]
  session_id: string
}

export type GameEvent =
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | QuestionStartEvent
  | AnswerCountEvent
  | QuestionEndEvent
  | LeaderboardUpdateEvent
  | GameEndEvent
