# Kahoot Benzeri Quiz Platformu — MVP Tasarım & İmplementasyon Planı

## Context

Gerçek zamanlı, çok oyunculu bir quiz/oyun platformu geliştiriyoruz. Kahoot.com'un temel deneyimini model alıyoruz: host quiz oluşturur, lobi açar, oyuncular PIN veya link ile katılır, sorular her iki ekranda da gösterilir, hız bazlı puanlama yapılır, canlı skor tablosu takip edilir. Platform; eğitim, kurumsal, etkinlik bağlamlarında kullanılabilecek genel bir SaaS olarak tasarlanmıştır.

**Neden bu değişiklik:** Sıfırdan inşa ediliyor — mevcut kod yok. Temel motivasyon: Kahoot'un ücretli özelliklerini Türkçe, açık ve erişilebilir bir platformda sunmak.

---

## Kararlaştırılan Tasarım Kararları

| Karar | Seçim | Gerekçe |
|---|---|---|
| Platform tipi | Genel SaaS | Herkese açık, dikey değil |
| Oyuncu auth | Host konfigüre eder | Anonim veya kayıtlı seçeneği sunulur |
| Oyun formatı | Her iki ekranda soru + canlı skor + takım modu | Klasik Kahoot + takım özelliği |
| Soru tipleri | Çoktan seçmeli (4 şık) + görselli | MVP kapsamı |
| Puanlama | Hız bazlı | Doğru cevap + süreye göre puan |
| Quiz editörü | AI destekli + pratik UI | Claude API ile soru üretimi |
| Katılım | PIN + Link | İkisi de destekleniyor |
| Ölçek hedefi | 10–50 eşzamanlı oyuncu/oturum | MVP sınırı |
| Platform dili | Türkçe | Hedef kitle Türkiye |
| Stack | Next.js 14 + Supabase + Tailwind | Tek proje, hızlı MVP |
| Ücretlendirme | MVP tamamen ücretsiz | Sonraki aşamada freemium |

---

## Teknoloji Stack

```
Frontend:  Next.js 14 (App Router) · TypeScript · Tailwind CSS
Backend:   Next.js API Routes (REST) · Supabase Realtime (WebSocket/Broadcast)
Veritabanı: Supabase PostgreSQL
Auth:      Supabase Auth (host hesapları)
Storage:   Supabase Storage (soru görselleri)
AI:        Anthropic Claude API — structured output ile soru üretimi
Deploy:    Vercel (frontend + API routes)
```

---

## Veri Modeli

### Tablolar

```sql
-- Host hesapları (Supabase Auth ile yönetilir)
users (
  id uuid PK,
  email text UNIQUE,
  name text,
  avatar_url text,
  created_at timestamptz
)

-- Quiz tanımları
quizzes (
  id uuid PK,
  host_id uuid FK→users,
  title text NOT NULL,
  description text,
  cover_image_url text,
  status text DEFAULT 'draft',  -- draft | published
  created_at timestamptz,
  updated_at timestamptz
)

-- Sorular
questions (
  id uuid PK,
  quiz_id uuid FK→quizzes,
  text text NOT NULL,
  image_url text,
  time_limit int DEFAULT 20,    -- saniye
  position int NOT NULL,
  created_at timestamptz
)

-- Cevap şıkları
options (
  id uuid PK,
  question_id uuid FK→questions,
  text text NOT NULL,
  is_correct boolean DEFAULT false,
  position int NOT NULL          -- 0=A, 1=B, 2=C, 3=D
)

-- Oyun oturumları
game_sessions (
  id uuid PK,
  quiz_id uuid FK→quizzes,
  host_id uuid FK→users,
  pin varchar(6) UNIQUE NOT NULL,
  join_slug text UNIQUE,
  status text DEFAULT 'lobby',   -- lobby | active | ended
  allow_anonymous boolean DEFAULT true,
  current_question_index int DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz
)

-- Takımlar (opsiyonel; host oluşturur)
teams (
  id uuid PK,
  game_session_id uuid FK→game_sessions,
  name text NOT NULL,
  color text                     -- hex renk kodu
)

-- Oyuncular
players (
  id uuid PK,
  game_session_id uuid FK→game_sessions,
  team_id uuid FK→teams,         -- NULL → bireysel mod
  user_id uuid FK→users,         -- NULL → anonim
  nickname text NOT NULL,
  joined_at timestamptz
)

-- Oyuncu cevapları
player_answers (
  id uuid PK,
  player_id uuid FK→players,
  question_id uuid FK→questions,
  option_id uuid FK→options,
  answered_ms int NOT NULL,      -- sorunun başından itibaren kaç ms sonra cevaplandı
  points_earned int DEFAULT 0
)

-- Final sonuçlar (oyun bitince yazılır)
game_results (
  id uuid PK,
  game_session_id uuid FK→game_sessions,
  player_id uuid FK→players,
  total_points int DEFAULT 0,
  rank int,
  correct_count int DEFAULT 0,
  total_questions int
)
```

### Puanlama Formülü
```
MAX_POINTS = 1000
time_bonus = (time_limit_ms - answered_ms) / time_limit_ms
points = floor(MAX_POINTS * (0.5 + 0.5 * time_bonus))
-- Yanlış cevap = 0 puan
-- Doğru ama en geç = ~500 puan
-- Doğru ve en hızlı = ~1000 puan
```

---

## Gerçek Zamanlı Mimari

### Supabase Broadcast Kanalı: `game:{session_id}`

Her oturum için bir kanal açılır. Host ve tüm oyuncular bu kanala subscribe olur.

```typescript
// Olay tipleri ve payload'ları

PLAYER_JOINED     { player_id, nickname, team_id, avatar }
PLAYER_LEFT       { player_id }
GAME_STARTED      { quiz_title, question_count }
QUESTION_START    { question_id, text, image_url, options: [{id, text, position}],
                    time_limit, start_timestamp }
ANSWER_COUNT      { answered: number, total: number }  // bireysel kimlik yok
QUESTION_END      { correct_option_id, answer_stats: [{option_id, count}] }
LEADERBOARD_UPDATE { rankings: [{player_id, nickname, team_id, total_points, rank}] }
GAME_END          { final_rankings, session_id }
```

### Oyun Döngüsü (Host API Route Yönetir)
```
POST /api/oyun/[id]/basla        → GAME_STARTED broadcast
POST /api/oyun/[id]/soru-basla   → QUESTION_START broadcast + DB timer
POST /api/oyun/[id]/cevap        → player_answers DB write + ANSWER_COUNT broadcast
POST /api/oyun/[id]/soru-bitir   → puan hesapla + QUESTION_END + LEADERBOARD_UPDATE
POST /api/oyun/[id]/bitir        → game_results yaz + GAME_END broadcast
```

---

## Sayfa Yapısı (Next.js App Router)

### Host Rotaları
```
/                             Landing sayfası
/giris                        Giriş / Kayıt (Supabase Auth)
/dashboard                    Quiz listesi + istatistikler
/quiz/yeni                    Yeni quiz oluştur
/quiz/[id]/duzenle            Quiz editörü (sorular, şıklar, görseller, AI)
/oyun/[id]/lobi               Lobi — PIN göster, oyuncuları gör, başlat
/oyun/[id]/kontrol            Oyun kontrol paneli (soru ilerlet, durdur)
/oyun/[id]/sonuclar           Analiz, soru bazında istatistik, PDF/CSV export
```

### Oyuncu Rotaları
```
/katil                        PIN girişi veya link yönlendirmesi
/katil/[pin]                  Takmaadı + takım seçimi
/oyna/[session]               Bekleme lobisi (host başlatana kadar)
/oyna/[session]/soru          Soru + A/B/C/D şık ekranı (geri sayımlı)
/oyna/[session]/skor          Soru arası kişisel puan + sıralama
/oyna/[session]/bitis         Kişisel final sonucu
```

---

## AI Soru Üretimi (Claude API)

### Akış
```
1. Host "AI ile Soru Üret" butonuna basar
2. Konu metni / döküman veya konu başlığı girer
3. POST /api/quiz/ai-uret → Claude API çağrısı
4. Structured output: { questions: [{ text, options: [{ text, is_correct }], explanation }] }
5. Sorular editöre yüklenir → host gözden geçirir, düzenler, onaylar
```

### Claude Prompt Yapısı
```
System: "Sen bir eğitim içeriği uzmanısın. Verilen konuya göre Türkçe çoktan seçmeli 
         sorular üretiyorsun. Her soru 4 şık içermeli, sadece 1 doğru cevap olmalı."
User:   "{konu_metni}"
Output: JSON schema — questions array
```

---

## Ana Bileşenler

### Host Tarafı
- `QuizEditor` — Soru listesi (sol), soru düzenleyici (sağ), drag-drop sıralama
- `AIQuestionGenerator` — Konu girişi modal, üretilen sorular review ekranı
- `ImageUploader` — Supabase Storage'a sürükle-bırak yükleme
- `LobbiPanel` — Büyük PIN gösterimi, katılan oyuncu listesi, takım dağılımı
- `GameControlPanel` — Soru ilerletme, geri sayım progress, cevap sayacı
- `ResultsDashboard` — Skor tablosu, soru bazında bar chart, PDF export

### Oyuncu Tarafı
- `JoinScreen` — PIN input, büyük ve net mobil UI
- `NicknameScreen` — Takmaadı + takım seçimi
- `WaitingLobby` — Diğer oyuncuların katılmasını bekle, canlı oyuncu listesi
- `QuestionScreen` — Soru metni + görsel + 4 renkli şık butonu + geri sayım
- `AnswerFeedback` — Doğru/yanlış animasyon + kazanılan puan
- `LeaderboardScreen` — Sıralama kartları (animasyonlu)
- `FinalResultScreen` — Kişisel skor, doğru/yanlış özeti

---

## Hata Yönetimi

| Senaryo | Davranış |
|---|---|
| Oyuncu bağlantı kesilirse | Reconnect denemesi, lobi/oyun state'i korunur |
| Host bağlantı kesilirse | Oyun duraklatılır, host yeniden bağlanınca devam |
| Geçersiz PIN | Anlaşılır hata mesajı, tekrar deneme |
| Cevap süre aşımı | 0 puan, player_answers'a NULL option_id yazılır |
| AI üretim hatası | Toast uyarısı, manuel eklemeye yönlendirme |

---

## İmplementasyon Fazları

### Faz 1 — Temel Altyapı (2-3 gün)
- [ ] Next.js 14 projesi oluştur (TypeScript + Tailwind + ESLint)
- [ ] Supabase projesi kur: veritabanı şeması, RLS politikaları, Storage bucket
- [ ] Supabase Auth entegrasyonu (host kayıt/giriş)
- [ ] Landing sayfası + Dashboard iskelet yapısı

### Faz 2 — Quiz Editörü (2-3 gün)
- [ ] Quiz CRUD API rotaları
- [ ] QuizEditor bileşeni (soru listesi + editör)
- [ ] ImageUploader (Supabase Storage)
- [ ] Claude API entegrasyonu (AI soru üretimi)
- [ ] Soru önizleme

### Faz 3 — Oyun Motoru (3-4 gün)
- [ ] game_sessions oluşturma + PIN üretimi
- [ ] Supabase Realtime kanal kurulumu
- [ ] LobbiPanel (host) + JoinScreen + WaitingLobby (oyuncu)
- [ ] Takım modu (opsiyonel, sonraya bırakılabilir)
- [ ] GameControlPanel + QuestionScreen senkronizasyonu
- [ ] Cevap toplama + puanlama API'si
- [ ] LeaderboardScreen (soru arası)

### Faz 4 — Sonuçlar & Analiz (1-2 gün)
- [ ] FinalResultScreen (oyuncu)
- [ ] ResultsDashboard (host) — soru bazında istatistik
- [ ] PDF/CSV export (react-pdf veya simple-csv)
- [ ] game_results DB yazımı

### Faz 5 — Cilalama (1-2 gün)
- [ ] Mobil responsive test + düzeltmeler
- [ ] Animasyonlar (doğru/yanlış feedback, skor tablosu)
- [ ] Hata yönetimi ve loading state'leri
- [ ] Temel SEO + Open Graph

---

## Kritik Dosyalar (İmplementasyon Başlarken)

```
/app                          → Next.js App Router
/app/api                      → API rotaları
/components/host              → Host bileşenleri
/components/player            → Oyuncu bileşenleri
/components/shared            → Ortak bileşenler (Leaderboard, Timer vb.)
/lib/supabase                 → Supabase client + tip tanımları
/lib/realtime                 → Broadcast kanal yöneticisi
/lib/scoring                  → Puanlama formülü
/lib/ai                       → Claude API soru üretici
/types                        → TypeScript tip tanımları (DB şeması)
```

---

## Doğrulama (Verification)

### Uçtan Uca Test Senaryosu
1. Host kayıt olur → dashboard'a yönlendirilir
2. "Yeni Quiz" oluşturur → 5 soru ekler (2 AI üretimli + 3 manuel + 1 görselli)
3. Quiz yayınlar → "Oyun Başlat" tıklar → lobi açılır (PIN görünür)
4. 3 farklı tarayıcı sekmesinden /katil/[PIN] ile katılır → takmaadı girer
5. Host "Başlat" tıklar → tüm sekmeler aynı anda soru ekranına geçer
6. Her sekme farklı sürede cevap verir → soru bitince skor tablosu güncellenir
7. Tüm sorular tamamlanır → final ekranı + analiz paneli açılır
8. PDF export indirilir

### Otomatik Testler
- Puanlama formülü (unit test)
- API rotaları (integration test — Supabase test ortamı)
- Realtime olay akışı (E2E — Playwright)
