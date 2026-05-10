# Kahoot MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerçek zamanlı çok oyunculu Türkçe quiz platformu — host quiz oluşturur, oyuncular PIN/link ile katılır, hız bazlı puanlama ve canlı skor tablosu ile oynanır.

**Architecture:** Next.js 14 App Router (tek repo, hem frontend hem API routes). Supabase Realtime Broadcast kanalı `game:{session_id}` üzerinden WebSocket. Oyun state'i bellek + DB hibrit: aktif oyun broadcast'te, kalıcı sonuçlar PostgreSQL'de.

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL + Realtime + Storage) · Anthropic Claude API · Vitest

---

## Dosya Haritası

```
kahoot-mvp/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing
│   ├── giris/page.tsx                    # Host login/register
│   ├── dashboard/page.tsx                # Quiz listesi
│   ├── quiz/yeni/page.tsx
│   ├── quiz/[id]/duzenle/page.tsx        # Quiz editörü
│   ├── oyun/[id]/lobi/page.tsx
│   ├── oyun/[id]/kontrol/page.tsx
│   ├── oyun/[id]/sonuclar/page.tsx
│   ├── katil/page.tsx                    # PIN girişi
│   ├── katil/[pin]/page.tsx              # Takmaadı + takım
│   └── oyna/[session]/
│       ├── page.tsx                      # Bekleme lobisi
│       ├── soru/page.tsx
│       ├── skor/page.tsx
│       └── bitis/page.tsx
├── app/api/
│   ├── quiz/route.ts
│   ├── quiz/[id]/route.ts
│   ├── quiz/ai-uret/route.ts
│   ├── oyun/route.ts
│   ├── oyun/[id]/basla/route.ts
│   ├── oyun/[id]/soru-basla/route.ts
│   ├── oyun/[id]/cevap/route.ts
│   ├── oyun/[id]/soru-bitir/route.ts
│   ├── oyun/[id]/bitir/route.ts
│   └── katil/[pin]/route.ts
├── components/
│   ├── host/QuizEditor.tsx
│   ├── host/QuestionEditor.tsx
│   ├── host/AIQuestionGenerator.tsx
│   ├── host/ImageUploader.tsx
│   ├── host/LobbiPanel.tsx
│   ├── host/GameControlPanel.tsx
│   ├── host/ResultsDashboard.tsx
│   ├── player/JoinScreen.tsx
│   ├── player/NicknameScreen.tsx
│   ├── player/WaitingLobby.tsx
│   ├── player/QuestionScreen.tsx
│   ├── player/AnswerFeedback.tsx
│   ├── player/LeaderboardScreen.tsx
│   ├── player/FinalResultScreen.tsx
│   ├── shared/Timer.tsx
│   ├── shared/Leaderboard.tsx
│   └── shared/PinDisplay.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── realtime/gameChannel.ts
│   ├── scoring/scoring.ts
│   └── ai/questionGenerator.ts
├── types/
│   ├── database.ts
│   └── game.ts
└── supabase/migrations/001_initial_schema.sql
```

---

## FAZ 1 — Temel Altyapı

### Task 1: Next.js Projesi Kur

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.example`

- [ ] **Step 1: Proje oluştur**

```bash
cd /Users/bcd/Desktop
npx create-next-app@latest kahoot-mvp \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd kahoot-mvp
```

- [ ] **Step 2: Bağımlılıkları yükle**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: `.env.example` oluştur**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

`.env.local` dosyasını `.gitignore`'a ekle (create-next-app zaten ekler).

- [ ] **Step 4: `vitest.config.ts` oluştur**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 5: `vitest.setup.ts` oluştur**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: `package.json` test script ekle**

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: proje altyapısı kuruldu"
```

---

### Task 2: TypeScript Tipleri

**Files:**
- Create: `types/database.ts`, `types/game.ts`

- [ ] **Step 1: `types/database.ts` oluştur**

```typescript
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
```

- [ ] **Step 2: `types/game.ts` oluştur**

```typescript
// Supabase Broadcast kanal olayları
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
  start_timestamp: number   // Date.now() — istemci farkı hesaplar
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
  your_points?: number      // sadece o oyuncuya gönderilir
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
```

- [ ] **Step 3: Commit**

```bash
git add types/ && git commit -m "feat: TypeScript tip tanımları"
```

---

### Task 3: Puanlama Modülü (TDD)

**Files:**
- Create: `lib/scoring/scoring.ts`, `__tests__/lib/scoring.test.ts`

- [ ] **Step 1: Önce testi yaz**

```typescript
// __tests__/lib/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePoints, MAX_POINTS } from '@/lib/scoring/scoring'

describe('calculatePoints', () => {
  it('yanlış cevap 0 puan verir', () => {
    expect(calculatePoints(false, 5000, 20000)).toBe(0)
  })

  it('doğru cevap en hızlı ~1000 puan verir', () => {
    expect(calculatePoints(true, 100, 20000)).toBe(1000)
  })

  it('doğru cevap en geç ~500 puan verir', () => {
    expect(calculatePoints(true, 20000, 20000)).toBe(500)
  })

  it('doğru cevap ortada ~750 puan verir', () => {
    const points = calculatePoints(true, 10000, 20000)
    expect(points).toBeGreaterThan(700)
    expect(points).toBeLessThan(800)
  })

  it('MAX_POINTS 1000 olmalı', () => {
    expect(MAX_POINTS).toBe(1000)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
npm run test:run
```
Beklenen: FAIL — "Cannot find module '@/lib/scoring/scoring'"

- [ ] **Step 3: Implementasyonu yaz**

```typescript
// lib/scoring/scoring.ts
export const MAX_POINTS = 1000
const MIN_POINTS = 500

export function calculatePoints(
  isCorrect: boolean,
  answeredMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0
  const clampedMs = Math.min(answeredMs, timeLimitMs)
  const timeRatio = 1 - clampedMs / timeLimitMs
  return Math.floor(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * timeRatio)
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
npm run test:run
```
Beklenen: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/ __tests__/ && git commit -m "feat: hız bazlı puanlama formülü (TDD)"
```

---

### Task 4: Supabase Clients

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: Browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: `middleware.ts` kök dizine ekle**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/quiz', '/oyun']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/ middleware.ts && git commit -m "feat: Supabase client + auth middleware"
```

---

### Task 5: Veritabanı Şeması

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Migration dosyasını oluştur**

```sql
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

-- Users: kendi profilini okuyabilir/güncelleyebilir
create policy "users_self" on public.users for all using (auth.uid() = id);

-- Quizzes: host kendi quizlerini yönetir, herkes yayınlanmış quizleri okur
create policy "quizzes_host" on public.quizzes for all using (auth.uid() = host_id);
create policy "quizzes_published_read" on public.quizzes for select using (status = 'published');

-- Questions + Options: quiz sahibi yönetir, herkes okur
create policy "questions_host" on public.questions for all using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and q.host_id = auth.uid())
);
create policy "questions_read" on public.questions for select using (true);
create policy "options_host" on public.options for all using (
  exists (select 1 from public.questions q join public.quizzes qz on qz.id = q.quiz_id where q.id = question_id and qz.host_id = auth.uid())
);
create policy "options_read" on public.options for select using (true);

-- Game Sessions: host yönetir, herkes pin/slug ile okur
create policy "sessions_host" on public.game_sessions for all using (auth.uid() = host_id);
create policy "sessions_read" on public.game_sessions for select using (true);

-- Teams: herkes okur, host yönetir
create policy "teams_read" on public.teams for select using (true);
create policy "teams_host" on public.teams for all using (
  exists (select 1 from public.game_sessions gs where gs.id = game_session_id and gs.host_id = auth.uid())
);

-- Players: herkes eklenebilir (join), herkes okuyabilir
create policy "players_insert" on public.players for insert with check (true);
create policy "players_read" on public.players for select using (true);

-- Player Answers: oyuncu kendi cevabını gönderir
create policy "answers_insert" on public.player_answers for insert with check (true);
create policy "answers_read" on public.player_answers for select using (true);

-- Game Results: herkes okur
create policy "results_read" on public.game_results for select using (true);
create policy "results_insert" on public.game_results for insert with check (true);

-- Trigger: auth.users → public.users senkron
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime için publication
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.players;
```

- [ ] **Step 2: Supabase dashboard'unda SQL Editor'a yapıştır ve çalıştır**

Supabase Dashboard → SQL Editor → New query → Yukarıdaki SQL'i yapıştır → Run

- [ ] **Step 3: Commit**

```bash
git add supabase/ && git commit -m "feat: veritabanı şeması ve RLS politikaları"
```

---

## FAZ 2 — Quiz Editörü

### Task 6: Quiz CRUD API

**Files:**
- Create: `app/api/quiz/route.ts`, `app/api/quiz/[id]/route.ts`

- [ ] **Step 1: `app/api/quiz/route.ts` oluştur**

```typescript
// app/api/quiz/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(count)')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await request.json()
  const { title, description } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('quizzes')
    .insert({ host_id: user.id, title: title.trim(), description })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: `app/api/quiz/[id]/route.ts` oluştur**

```typescript
// app/api/quiz/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(*, options(*))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Quiz bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await request.json()
  const { title, description, status, questions } = body

  const { error: quizError } = await supabase
    .from('quizzes')
    .update({ title, description, status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })

  // Sorular güncelleme: mevcut sil, yeniden ekle (upsert)
  if (questions) {
    await supabase.from('questions').delete().eq('quiz_id', id)
    for (const q of questions) {
      const { data: question } = await supabase
        .from('questions')
        .insert({ quiz_id: id, text: q.text, image_url: q.image_url, time_limit: q.time_limit ?? 20, position: q.position })
        .select()
        .single()
      if (question && q.options?.length) {
        await supabase.from('options').insert(
          q.options.map((o: { text: string; is_correct: boolean }, i: number) => ({
            question_id: question.id,
            text: o.text,
            is_correct: o.is_correct,
            position: i,
          }))
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { error } = await supabase.from('quizzes').delete().eq('id', id).eq('host_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/quiz/ && git commit -m "feat: quiz CRUD API rotaları"
```

---

### Task 7: AI Soru Üretici

**Files:**
- Create: `lib/ai/questionGenerator.ts`, `app/api/quiz/ai-uret/route.ts`

- [ ] **Step 1: `lib/ai/questionGenerator.ts` oluştur**

```typescript
// lib/ai/questionGenerator.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface GeneratedQuestion {
  text: string
  options: { text: string; is_correct: boolean }[]
  explanation: string
}

export async function generateQuestions(
  topic: string,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Sen bir eğitim içeriği uzmanısın. Verilen konuya göre Türkçe çoktan seçmeli sorular üretiyorsun.
Her soru için tam olarak 4 şık üret, yalnızca 1 tanesi doğru olsun.
Yanıtını geçerli bir JSON dizisi olarak ver, başka açıklama ekleme.
Format: [{"text": "soru metni", "options": [{"text": "şık A", "is_correct": false}, ...], "explanation": "kısa açıklama"}]`,
    messages: [
      {
        role: 'user',
        content: `Şu konu hakkında ${count} adet soru üret: ${topic}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Beklenmeyen yanıt tipi')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('JSON bulunamadı')

  return JSON.parse(jsonMatch[0]) as GeneratedQuestion[]
}
```

- [ ] **Step 2: `app/api/quiz/ai-uret/route.ts` oluştur**

```typescript
// app/api/quiz/ai-uret/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuestions } from '@/lib/ai/questionGenerator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { topic, count = 5 } = await request.json()
  if (!topic?.trim()) return NextResponse.json({ error: 'Konu gerekli' }, { status: 400 })

  try {
    const questions = await generateQuestions(topic.trim(), Math.min(count, 10))
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('AI üretim hatası:', err)
    return NextResponse.json({ error: 'Soru üretilemedi, tekrar dene' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/ app/api/quiz/ai-uret/ && git commit -m "feat: Claude API ile AI soru üretimi"
```

---

## FAZ 3 — Oyun Motoru

### Task 8: Oyun Oturumu API

**Files:**
- Create: `app/api/oyun/route.ts`, `app/api/katil/[pin]/route.ts`

- [ ] **Step 1: PIN üretici yardımcısı**

```typescript
// lib/game/pinGenerator.ts
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10)
}
```

- [ ] **Step 2: `app/api/oyun/route.ts` oluştur**

```typescript
// app/api/oyun/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePin, generateSlug } from '@/lib/game/pinGenerator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { quiz_id, allow_anonymous = true } = await request.json()

  // Aktif oturumu kapat
  await supabase
    .from('game_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('quiz_id', quiz_id)
    .eq('host_id', user.id)
    .eq('status', 'lobby')

  let pin = generatePin()
  let slug = generateSlug()
  let attempts = 0

  // Benzersiz PIN bul
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('pin', pin)
      .neq('status', 'ended')
      .maybeSingle()

    if (!existing) break
    pin = generatePin()
    attempts++
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({ quiz_id, host_id: user.id, pin, join_slug: slug, allow_anonymous })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 3: `app/api/katil/[pin]/route.ts` oluştur**

```typescript
// app/api/katil/[pin]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, status, allow_anonymous, quiz_id, quizzes(title), teams(id, name, color)')
    .eq('pin', pin)
    .neq('status', 'ended')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Geçersiz PIN' }, { status: 404 })
  if (data.status !== 'lobby') return NextResponse.json({ error: 'Oyun zaten başladı' }, { status: 400 })

  return NextResponse.json(data)
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/oyun/ app/api/katil/ lib/game/ && git commit -m "feat: oyun oturumu oluşturma ve PIN sistemi"
```

---

### Task 9: Oyun Kontrol API'leri

**Files:**
- Create: `app/api/oyun/[id]/basla/route.ts`, `app/api/oyun/[id]/soru-basla/route.ts`, `app/api/oyun/[id]/cevap/route.ts`, `app/api/oyun/[id]/soru-bitir/route.ts`, `app/api/oyun/[id]/bitir/route.ts`

- [ ] **Step 1: Realtime yardımcısı (server-side broadcast)**

```typescript
// lib/realtime/serverBroadcast.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { GameEvent } from '@/types/game'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function broadcastGameEvent(sessionId: string, event: GameEvent) {
  const supabase = getAdminClient()
  await supabase.channel(`game:${sessionId}`).send({
    type: 'broadcast',
    event: event.type,
    payload: event,
  })
}
```

- [ ] **Step 2: `basla` route**

```typescript
// app/api/oyun/[id]/basla/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: session, error } = await supabase
    .from('game_sessions')
    .update({ status: 'active', started_at: new Date().toISOString(), current_question_index: 0 })
    .eq('id', id)
    .eq('host_id', user.id)
    .eq('status', 'lobby')
    .select('*, quizzes(title, questions(count))')
    .single()

  if (error || !session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  await broadcastGameEvent(id, {
    type: 'GAME_STARTED',
    quiz_title: (session.quizzes as any).title,
    question_count: (session.quizzes as any).questions[0].count,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: `soru-basla` route**

```typescript
// app/api/oyun/[id]/soru-basla/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: session } = await supabase
    .from('game_sessions')
    .select('current_question_index, quiz_id')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', session.quiz_id)
    .order('position')

  if (!questions) return NextResponse.json({ error: 'Sorular bulunamadı' }, { status: 404 })

  const idx = session.current_question_index
  const question = questions[idx]
  if (!question) return NextResponse.json({ error: 'Soru yok' }, { status: 400 })

  const totalQuestions = questions.length

  await broadcastGameEvent(id, {
    type: 'QUESTION_START',
    question_id: question.id,
    text: question.text,
    image_url: question.image_url,
    options: question.options.map((o: any) => ({ id: o.id, text: o.text, position: o.position })),
    time_limit: question.time_limit,
    start_timestamp: Date.now(),
    question_number: idx + 1,
    total_questions: totalQuestions,
  })

  return NextResponse.json({ ok: true, question_number: idx + 1, total_questions: totalQuestions })
}
```

- [ ] **Step 4: `cevap` route**

```typescript
// app/api/oyun/[id]/cevap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'
import { calculatePoints } from '@/lib/scoring/scoring'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { player_id, question_id, option_id, answered_ms } = await request.json()
  const supabase = await createClient()

  // Doğru cevabı bul
  const { data: correctOption } = await supabase
    .from('options')
    .select('id, question_id, is_correct')
    .eq('question_id', question_id)
    .eq('is_correct', true)
    .single()

  const { data: question } = await supabase
    .from('questions')
    .select('time_limit')
    .eq('id', question_id)
    .single()

  const isCorrect = correctOption?.id === option_id
  const timeLimitMs = (question?.time_limit ?? 20) * 1000
  const points = calculatePoints(isCorrect, answered_ms, timeLimitMs)

  const { error } = await supabase
    .from('player_answers')
    .upsert({ player_id, question_id, option_id, answered_ms, points_earned: points })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kaç kişi cevapladı?
  const { count } = await supabase
    .from('player_answers')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', question_id)
    .in('player_id', supabase.from('players').select('id').eq('game_session_id', id))

  const { count: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('game_session_id', id)

  await broadcastGameEvent(id, {
    type: 'ANSWER_COUNT',
    answered: count ?? 0,
    total: totalPlayers ?? 0,
  })

  return NextResponse.json({ points_earned: points })
}
```

- [ ] **Step 5: `soru-bitir` route**

```typescript
// app/api/oyun/[id]/soru-bitir/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { question_id } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // Doğru cevap
  const { data: correctOption } = await supabase
    .from('options')
    .select('id')
    .eq('question_id', question_id)
    .eq('is_correct', true)
    .single()

  // Cevap istatistikleri
  const { data: answers } = await supabase
    .from('player_answers')
    .select('option_id')
    .eq('question_id', question_id)

  const stats: Record<string, number> = {}
  answers?.forEach(a => {
    if (a.option_id) stats[a.option_id] = (stats[a.option_id] ?? 0) + 1
  })

  await broadcastGameEvent(id, {
    type: 'QUESTION_END',
    correct_option_id: correctOption?.id ?? '',
    answer_stats: Object.entries(stats).map(([option_id, count]) => ({ option_id, count })),
  })

  // Sıradaki soruya ilerle
  await supabase
    .from('game_sessions')
    .update({ current_question_index: supabase.rpc('increment', { x: 1 }) as any })
    .eq('id', id)

  // Leaderboard güncelle
  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', id)

  const { data: allAnswers } = await supabase
    .from('player_answers')
    .select('player_id, points_earned')
    .in('player_id', (players ?? []).map(p => p.id))

  const totals: Record<string, number> = {}
  allAnswers?.forEach(a => {
    totals[a.player_id] = (totals[a.player_id] ?? 0) + a.points_earned
  })

  const rankings = (players ?? [])
    .map(p => ({ player_id: p.id, nickname: p.nickname, team_id: p.team_id, total_points: totals[p.id] ?? 0, rank: 0 }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  await broadcastGameEvent(id, { type: 'LEADERBOARD_UPDATE', rankings })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: `bitir` route**

```typescript
// app/api/oyun/[id]/bitir/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await supabase
    .from('game_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', id)

  const { data: answers } = await supabase
    .from('player_answers')
    .select('player_id, points_earned, option_id')
    .in('player_id', (players ?? []).map(p => p.id))

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', supabase.from('game_sessions').select('quiz_id').eq('id', id) as any)

  const totalQuestions = questions?.length ?? 0

  const statsMap: Record<string, { points: number; correct: number }> = {}
  answers?.forEach(a => {
    if (!statsMap[a.player_id]) statsMap[a.player_id] = { points: 0, correct: 0 }
    statsMap[a.player_id].points += a.points_earned
    if (a.option_id && a.points_earned > 0) statsMap[a.player_id].correct++
  })

  const finalRankings = (players ?? [])
    .map(p => ({ player_id: p.id, nickname: p.nickname, total_points: statsMap[p.id]?.points ?? 0, correct_count: statsMap[p.id]?.correct ?? 0, rank: 0 }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  // Sonuçları kaydet
  if (finalRankings.length > 0) {
    await supabase.from('game_results').insert(
      finalRankings.map(r => ({
        game_session_id: id,
        player_id: r.player_id,
        total_points: r.total_points,
        rank: r.rank,
        correct_count: r.correct_count,
        total_questions: totalQuestions,
      }))
    )
  }

  await broadcastGameEvent(id, {
    type: 'GAME_END',
    final_rankings: finalRankings,
    session_id: id,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/oyun/ lib/realtime/ lib/game/ && git commit -m "feat: oyun kontrol API'leri ve realtime broadcast"
```

---

### Task 10: Realtime Client Hook

**Files:**
- Create: `lib/realtime/useGameChannel.ts`

- [ ] **Step 1: Hook oluştur**

```typescript
// lib/realtime/useGameChannel.ts
'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameEvent, GameEventType } from '@/types/game'

type EventHandler = (event: GameEvent) => void

export function useGameChannel(sessionId: string | null) {
  const handlersRef = useRef<Map<GameEventType, EventHandler>>(new Map())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    const channel = supabase.channel(`game:${sessionId}`)

    const eventTypes: GameEventType[] = [
      'PLAYER_JOINED', 'PLAYER_LEFT', 'GAME_STARTED', 'QUESTION_START',
      'ANSWER_COUNT', 'QUESTION_END', 'LEADERBOARD_UPDATE', 'GAME_END',
    ]

    eventTypes.forEach(type => {
      channel.on('broadcast', { event: type }, ({ payload }) => {
        handlersRef.current.get(type)?.(payload as GameEvent)
      })
    })

    channel.subscribe()
    channelRef.current = channel

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const on = useCallback(<T extends GameEventType>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ) => {
    handlersRef.current.set(type, handler as EventHandler)
    return () => { handlersRef.current.delete(type) }
  }, [])

  return { on }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/realtime/useGameChannel.ts && git commit -m "feat: realtime client hook"
```

---

## FAZ 4 — Sayfalar & Bileşenler

### Task 11: Auth Sayfası

**Files:**
- Create: `app/giris/page.tsx`

- [ ] **Step 1: Giriş/kayıt sayfası oluştur**

```tsx
// app/giris/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'giris') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } },
      })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2">Quizify</h1>
        <p className="text-gray-500 text-center mb-6">
          {mode === 'giris' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'kayit' && (
            <input
              type="text" placeholder="Adın" value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          )}
          <input
            type="email" placeholder="E-posta" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password" placeholder="Şifre" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Yükleniyor...' : mode === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          {mode === 'giris' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
          <button onClick={() => setMode(mode === 'giris' ? 'kayit' : 'giris')} className="text-indigo-600 font-medium">
            {mode === 'giris' ? 'Kayıt ol' : 'Giriş yap'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/giris/ && git commit -m "feat: host giriş/kayıt sayfası"
```

---

### Task 12: Oyuncu Katılım Akışı

**Files:**
- Create: `app/katil/page.tsx`, `app/katil/[pin]/page.tsx`

- [ ] **Step 1: PIN giriş sayfası**

```tsx
// app/katil/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KatilPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 6) { setError('PIN 6 haneli olmalı'); return }
    setLoading(true)
    const res = await fetch(`/api/katil/${pin}`)
    if (!res.ok) {
      const { error } = await res.json()
      setError(error)
      setLoading(false)
      return
    }
    router.push(`/katil/${pin}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-4xl font-black mb-2 tracking-tight">Quizify</h1>
      <p className="text-white/70 mb-8">Oyuna katılmak için PIN'ini gir</p>

      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
        <input
          type="number" placeholder="Oyun PIN'i"
          value={pin} onChange={e => setPin(e.target.value.slice(0, 6))}
          className="w-full text-center text-3xl font-bold tracking-widest border-4 border-white/30 bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-5 focus:outline-none focus:border-white"
          inputMode="numeric"
        />
        {error && <p className="text-red-300 text-center text-sm">{error}</p>}
        <button
          type="submit" disabled={loading || pin.length !== 6}
          className="w-full bg-white text-indigo-700 font-black text-xl rounded-2xl py-4 hover:bg-indigo-50 disabled:opacity-40 transition"
        >
          {loading ? 'Kontrol ediliyor...' : 'Katıl →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Takmaadı + takım seçimi sayfası**

```tsx
// app/katil/[pin]/page.tsx
'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Team { id: string; name: string; color: string }
interface SessionInfo { id: string; teams: Team[]; quizzes: { title: string } }

const TEAM_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']

export default function NicknamePage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [nickname, setNickname] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/katil/${pin}`)
      .then(r => r.json())
      .then(setSession)
  }, [pin])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    setLoading(true)

    const res = await fetch('/api/oyuncu/katil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_session_id: session!.id, nickname: nickname.trim(), team_id: selectedTeam }),
    })
    const { player_id } = await res.json()
    sessionStorage.setItem('player_id', player_id)
    sessionStorage.setItem('nickname', nickname.trim())
    router.push(`/oyna/${session!.id}`)
  }

  if (!session) return <div className="min-h-screen bg-indigo-600 flex items-center justify-center"><div className="text-white text-xl">Yükleniyor...</div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <h2 className="text-white/70 text-lg mb-1">{session.quizzes?.title}</h2>
      <h1 className="text-white text-3xl font-black mb-8">Takmaadını seç</h1>

      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
        <input
          type="text" placeholder="Takmaadın"
          value={nickname} onChange={e => setNickname(e.target.value)}
          maxLength={20}
          className="w-full text-center text-xl font-bold border-4 border-white/30 bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:border-white"
        />

        {session.teams?.length > 0 && (
          <div>
            <p className="text-white/70 text-center text-sm mb-3">Takım seç</p>
            <div className="grid grid-cols-2 gap-3">
              {session.teams.map((team, i) => (
                <button
                  key={team.id} type="button"
                  onClick={() => setSelectedTeam(team.id)}
                  className={`${TEAM_COLORS[i % TEAM_COLORS.length]} rounded-xl py-3 font-bold text-white transition-all ${selectedTeam === team.id ? 'ring-4 ring-white scale-105' : 'opacity-70 hover:opacity-90'}`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit" disabled={loading || !nickname.trim()}
          className="w-full bg-white text-indigo-700 font-black text-xl rounded-2xl py-4 hover:bg-indigo-50 disabled:opacity-40 transition"
        >
          {loading ? 'Katılınıyor...' : 'Oyuna Gir →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Oyuncu katılım API'si ekle**

```typescript
// app/api/oyuncu/katil/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(request: NextRequest) {
  const { game_session_id, nickname, team_id } = await request.json()
  const supabase = await createClient()

  if (!nickname?.trim()) return NextResponse.json({ error: 'Takmaadı gerekli' }, { status: 400 })

  const { data: player, error } = await supabase
    .from('players')
    .insert({ game_session_id, nickname: nickname.trim(), team_id: team_id ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await broadcastGameEvent(game_session_id, {
    type: 'PLAYER_JOINED',
    player_id: player.id,
    nickname: player.nickname,
    team_id: player.team_id,
  })

  return NextResponse.json({ player_id: player.id })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/katil/ app/api/oyuncu/ && git commit -m "feat: oyuncu katılım akışı (PIN + takmaadı)"
```

---

### Task 13: Oyuncu Oyun Ekranı

**Files:**
- Create: `app/oyna/[session]/page.tsx`, `app/oyna/[session]/soru/page.tsx`

- [ ] **Step 1: Bekleme lobisi**

```tsx
// app/oyna/[session]/page.tsx
'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'

export default function WaitingPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [players, setPlayers] = useState<{ id: string; nickname: string }[]>([])
  const router = useRouter()
  const { on } = useGameChannel(session)

  useEffect(() => {
    const off1 = on('PLAYER_JOINED', (e) => {
      setPlayers(prev => [...prev, { id: e.player_id, nickname: e.nickname }])
    })
    const off2 = on('PLAYER_LEFT', (e) => {
      setPlayers(prev => prev.filter(p => p.id !== e.player_id))
    })
    const off3 = on('GAME_STARTED', () => {
      router.push(`/oyna/${session}/soru`)
    })
    return () => { off1(); off2(); off3() }
  }, [on, session, router])

  const nickname = typeof window !== 'undefined' ? sessionStorage.getItem('nickname') : ''

  return (
    <div className="min-h-screen bg-indigo-700 flex flex-col items-center justify-center p-4">
      <div className="text-white/60 text-lg mb-2">Hoş geldin!</div>
      <div className="text-white text-4xl font-black mb-8">{nickname}</div>
      <div className="bg-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
        <p className="text-white/70 text-sm mb-1">Katılan oyuncular</p>
        <p className="text-white text-3xl font-bold mb-4">{players.length}</p>
        <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
          {players.map(p => (
            <span key={p.id} className="bg-white/20 text-white text-sm rounded-full px-3 py-1">{p.nickname}</span>
          ))}
        </div>
      </div>
      <p className="text-white/50 text-sm mt-8 animate-pulse">Host oyunu başlatmayı bekliyor...</p>
    </div>
  )
}
```

- [ ] **Step 2: Soru ekranı**

```tsx
// app/oyna/[session]/soru/page.tsx
'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import type { QuestionStartEvent } from '@/types/game'

const OPTION_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', label: 'A' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', label: 'B' },
  { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', label: 'C' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', label: 'D' },
]

export default function QuestionPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [question, setQuestion] = useState<QuestionStartEvent | null>(null)
  const [answered, setAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [startMs, setStartMs] = useState(0)
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null)
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const router = useRouter()
  const { on } = useGameChannel(session)

  useEffect(() => {
    const off1 = on('QUESTION_START', (e) => {
      setQuestion(e)
      setAnswered(false)
      setSelectedOption(null)
      setCorrectOptionId(null)
      setEarnedPoints(null)
      setStartMs(e.start_timestamp)
      setTimeLeft(e.time_limit)
    })
    const off2 = on('QUESTION_END', (e) => {
      setCorrectOptionId(e.correct_option_id)
      if (e.your_points !== undefined) setEarnedPoints(e.your_points)
    })
    const off3 = on('LEADERBOARD_UPDATE', () => {
      router.push(`/oyna/${session}/skor`)
    })
    const off4 = on('GAME_END', () => {
      router.push(`/oyna/${session}/bitis`)
    })
    return () => { off1(); off2(); off3(); off4() }
  }, [on, session, router])

  useEffect(() => {
    if (!question || answered) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000
      const left = Math.max(0, question.time_limit - elapsed)
      setTimeLeft(left)
      if (left <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [question, startMs, answered])

  const handleAnswer = useCallback(async (optionId: string) => {
    if (answered || !question) return
    setAnswered(true)
    setSelectedOption(optionId)
    const answeredMs = Date.now() - startMs
    const playerId = sessionStorage.getItem('player_id')
    await fetch(`/api/oyun/${session}/cevap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, question_id: question.question_id, option_id: optionId, answered_ms: answeredMs }),
    })
  }, [answered, question, startMs, session])

  if (!question) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">Soru bekleniyor...</p>
      </div>
    )
  }

  const progress = (timeLeft / question.time_limit) * 100

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Timer bar */}
      <div className="h-2 bg-gray-700">
        <div
          className="h-full bg-indigo-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col p-4">
        <div className="text-center mb-2">
          <span className="text-gray-400 text-sm">{question.question_number}/{question.total_questions}</span>
          <span className="text-white text-2xl font-bold ml-4">{Math.ceil(timeLeft)}</span>
        </div>

        {question.image_url && (
          <img src={question.image_url} alt="" className="w-full max-h-40 object-cover rounded-xl mb-4" />
        )}

        <div className="bg-white rounded-2xl p-6 mb-6 text-center shadow-lg">
          <p className="text-gray-800 text-xl font-semibold">{question.text}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {question.options.sort((a, b) => a.position - b.position).map((opt, i) => {
            const color = OPTION_COLORS[i]
            const isSelected = selectedOption === opt.id
            const isCorrect = correctOptionId === opt.id
            const isWrong = answered && isSelected && !isCorrect

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                disabled={answered}
                className={`
                  ${color.bg} ${!answered ? color.hover : ''} 
                  ${isCorrect ? 'ring-4 ring-white' : ''}
                  ${isWrong ? 'opacity-50' : ''}
                  text-white font-bold rounded-2xl p-4 min-h-[80px] transition-all
                  flex flex-col items-center justify-center gap-1
                  disabled:cursor-default
                `}
              >
                <span className="text-white/70 text-sm">{color.label}</span>
                <span className="text-sm leading-tight text-center">{opt.text}</span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="mt-4 text-center">
            {earnedPoints !== null ? (
              <p className="text-white text-2xl font-black">+{earnedPoints} puan!</p>
            ) : (
              <p className="text-white/70">Cevap bekleniyor...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/oyna/ && git commit -m "feat: oyuncu soru ve bekleme ekranları"
```

---

## FAZ 5 — CSV Export & Son Düzenlemeler

### Task 14: CSV Export

**Files:**
- Create: `app/api/oyun/[id]/export/route.ts`

- [ ] **Step 1: Export API oluştur**

```typescript
// app/api/oyun/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: results } = await supabase
    .from('game_results')
    .select('rank, total_points, correct_count, total_questions, players(nickname, teams(name))')
    .eq('game_session_id', id)
    .order('rank')

  if (!results) return NextResponse.json({ error: 'Sonuç bulunamadı' }, { status: 404 })

  const headers = ['Sıra', 'Takmaad', 'Takım', 'Puan', 'Doğru', 'Toplam Soru']
  const rows = results.map(r => [
    r.rank,
    (r.players as any)?.nickname ?? '',
    (r.players as any)?.teams?.name ?? '-',
    r.total_points,
    r.correct_count,
    r.total_questions,
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const bom = '﻿' // UTF-8 BOM for Excel

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sonuclar-${id.slice(0, 8)}.csv"`,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/oyun/[id]/export/ && git commit -m "feat: CSV sonuç export"
```

---

## Kritik Kod Düzeltmeleri (Self-Review)

### Düzeltme 1: `lib/realtime/serverBroadcast.ts` — REST API kullan

Supabase JS client server-side'da channel subscribe gerektirmeden broadcast yapamaz. REST endpoint kullan:

```typescript
// lib/realtime/serverBroadcast.ts  — DOĞRU VERSIYON
import type { GameEvent } from '@/types/game'

export async function broadcastGameEvent(sessionId: string, event: GameEvent): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    body: JSON.stringify({
      messages: [{
        topic: `realtime:game:${sessionId}`,
        event: event.type,
        payload: event,
      }],
    }),
  })
}
```

### Düzeltme 2: `soru-bitir` route — current_question_index artırma

`.rpc('increment')` migration'da tanımlı değil. Önce mevcut değeri oku, sonra +1 yaz:

```typescript
// soru-bitir içinde — DOĞRU VERSIYON
const { data: sess } = await supabase
  .from('game_sessions')
  .select('current_question_index')
  .eq('id', id)
  .single()

await supabase
  .from('game_sessions')
  .update({ current_question_index: (sess?.current_question_index ?? 0) + 1 })
  .eq('id', id)
```

### Düzeltme 3: `bitir` route — quiz_id subquery

Subquery yerine önce session'ı oku, sonra quiz_id ile questions'ı sorgula:

```typescript
// bitir içinde — DOĞRU VERSIYON
const { data: session } = await supabase
  .from('game_sessions')
  .select('quiz_id')
  .eq('id', id)
  .single()

const { count: totalQuestions } = await supabase
  .from('questions')
  .select('id', { count: 'exact', head: true })
  .eq('quiz_id', session!.quiz_id)
```

### Eksik Sayfalar (Stub olarak eklenecek)

Bu sayfaların temel iskelet implementasyonu gerekiyor — API'ler hazır, sadece UI bağlantısı kurulacak:
- `app/dashboard/page.tsx` — quiz listesi, GET /api/quiz
- `app/oyun/[id]/lobi/page.tsx` — LobbiPanel, POST /api/oyun, realtime PLAYER_JOINED
- `app/oyun/[id]/kontrol/page.tsx` — soru ilerletme butonları, POST /api/oyun/[id]/soru-basla + soru-bitir + bitir
- `app/oyun/[id]/sonuclar/page.tsx` — game_results tablosu, CSV export linki
- `app/oyna/[session]/skor/page.tsx` — LEADERBOARD_UPDATE dinle, sıralama göster
- `app/oyna/[session]/bitis/page.tsx` — GAME_END dinle, final skor göster

---

## Doğrulama

### Uçtan Uca Test Senaryosu

- [ ] `npm run dev` — geliştirme sunucusu başlat
- [ ] `/giris` → Kayıt ol, dashboard'a git
- [ ] Quiz oluştur: başlık gir, 3 soru ekle (1 görselli), AI ile 2 soru üret
- [ ] Quiz kaydet → "Oyun Başlat" → lobi ekranı açılır, PIN görünür
- [ ] 2 farklı sekme: `/katil/[PIN]` → takmaadı gir → bekleme lobisine geç
- [ ] Host "Başlat" → her iki sekme soru ekranına geçer
- [ ] Her sekme farklı hızda cevaplar → skor tablosu güncellenir
- [ ] Tüm sorular → final ekranı
- [ ] `/oyun/[id]/sonuclar` → CSV indir

### Unit Test

```bash
npm run test:run
```
Beklenen: scoring.test.ts → 5 test PASS

### Realtime Smoke Test

İki sekme aynı anda açıkken: birinde cevap ver, diğerinde ANSWER_COUNT barının dolduğunu gözlemle.
