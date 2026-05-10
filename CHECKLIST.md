# Quizify MVP — Faz Bazlı Checklist

> Durum: ✅ Tamamlandı · ⚠️ Kısmen yapıldı · ❌ Yapılmadı

---

## FAZ 0 — Setup & Altyapı

### Proje İskeleti
- [x] Next.js 14 (App Router) projesi oluşturuldu
- [x] TypeScript + Tailwind v4 kuruldu
- [x] Quizify design token'ları `globals.css`'e aktarıldı (`--grad-brand`, `--ans-*`, `--r-*`, animasyonlar)
- [x] Shared component kütüphanesi: `QuizifyMark`, `AnswerShape`, `Icon`, `Btn`, `Avatar`, `TimerBar`, `Confetti`, `CountUp`
- [x] `types/database.ts` — Supabase tablo tipleri
- [x] `types/game.ts` — Realtime event tipleri
- [x] `middleware.ts` — `/dashboard`, `/quiz`, `/oyun` rotaları auth koruması altında
- [x] `.env.example` oluşturuldu
- [x] `.env.local` şablonu oluşturuldu (değerler doldurulacak ← Supabase + Anthropic key'leri)

### Supabase Projesi
- [ ] **Supabase dashboard'da proje oluşturuldu**
- [ ] **`supabase/migrations/001_initial_schema.sql` SQL Editor'da çalıştırıldı**
- [ ] Auth → Email provider aktif edildi
- [ ] Auth → Google OAuth ayarlandı (Client ID + Secret)
- [ ] Realtime → `game_sessions` ve `players` tabloları publication'a eklendi (migration'da var, doğrulama gerekli)

### Test Altyapısı
- [x] `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react` kuruldu
- [x] `vitest.config.ts` oluşturuldu (jsdom, globals: true, @/* alias)
- [x] `vitest.setup.ts` oluşturuldu (@testing-library/jest-dom)
- [x] `package.json`'a `"test"` ve `"test:run"` scriptleri eklendi
- [x] `__tests__/lib/scoring.test.ts` — 8 unit test yazıldı ve geçiyor (`npm run test:run`)

---

## FAZ 1 — Auth + Quiz CRUD

### Kimlik Doğrulama
- [x] `/giris` — Login/Register toggle sayfası tasarlandı
- [x] E-posta + şifre ile giriş (`signInWithPassword`)
- [x] E-posta + şifre ile kayıt (`signUp`)
- [x] Auth trigger: `on_auth_user_created` → `public.users`'a kayıt (migration'da var)
- [ ] **Google OAuth butonu gerçekten çalışıyor** (`signInWithOAuth({ provider: 'google' })` çağrısı yok, sadece UI)
- [ ] Çıkış sonrası `/` yönlendirmesi (dashboard'da ✅, diğer sayfalarda yok)
- [ ] "Şifremi unuttum" akışı

### Quiz Editörü
- [x] `/dashboard` — Quiz listesi, stats grid, filter pill'ları
- [x] `/quiz/yeni` — Otomatik quiz oluştur + redirect
- [x] `/quiz/[id]/duzenle` — Soru editörü (metin, şıklar, süre, doğru işareti)
- [x] Quiz CRUD API: `GET/POST /api/quiz`, `GET/PUT/DELETE /api/quiz/[id]`
- [x] AI soru üretici modal (konu + count → Claude API)
- [x] `POST /api/quiz/ai-uret` — Claude `claude-sonnet-4-6` ile Türkçe soru üretimi
- [ ] **Görsel yükleme** — Supabase Storage entegrasyonu (şu an placeholder UI var)
- [ ] **Soru sürükleme sırası** — drag-and-drop (UI'da sıra numarası var, handler yok)
- [ ] Quiz yayınlama/taslağa çekme toggle'ı (API'de `status` alanı var, UI'da yok)
- [ ] Kaydetmeden çıkma uyarısı (`useBeforeUnload`)
- [ ] Quiz başlığı boş bırakılamaz — client-side validation ✅, server-side ✅
- [ ] **En az 1 soru + her soruda 1 doğru şık olmadan oyun başlatılamaz guard**

---

## FAZ 2 — Live Game Skeleton

### Oyun Oturumu & Lobi
- [x] `POST /api/oyun` — Benzersiz PIN + slug ile game session oluşturma
- [x] `lib/game/pinGenerator.ts` — 6 haneli PIN + slug üretimi
- [x] `GET /api/katil/[pin]` — PIN doğrulama + session bilgisi
- [x] `POST /api/oyuncu/katil` — Oyuncu kaydı + `PLAYER_JOINED` broadcast
- [x] `/katil` — PIN giriş ekranı (custom numpad + digit box'lar)
- [x] `/katil/[pin]` — Takmaadı + takım seçim ekranı
- [x] `/oyun/[id]/lobi` — Host lobi: 96px PIN, QR, oyuncu grid
- [x] `/oyna/[session]` — Oyuncu bekleme: glassmorphism avatar, player bubble'lar
- [ ] **Host lobi: sayfa açıldığında mevcut oyuncuları DB'den yükle** (şu an sadece sonradan katılanlar görünür)
- [ ] **`GET /api/oyun/[id]` lobi sayfasından çağrısı** — şu an session detayı yükleniyor ama player listesi yüklenmiyor
- [ ] Oyuncu `sessionStorage`'dan `player_id` kaybedince yeniden katılma akışı
- [ ] Aynı takmaadıyla iki kez katılma engeli

### Realtime Kanal
- [x] `lib/realtime/useGameChannel.ts` — Supabase Broadcast channel hook
- [x] `lib/realtime/serverBroadcast.ts` — Server-side REST broadcast
- [x] Tüm event type'ları dinleniyor: `PLAYER_JOINED`, `PLAYER_LEFT`, `GAME_STARTED`, `QUESTION_START`, `ANSWER_COUNT`, `QUESTION_END`, `LEADERBOARD_UPDATE`, `GAME_END`
- [ ] **`PLAYER_LEFT` broadcast** — Oyuncu sayfayı kapattığında tetiklenmesi (`beforeunload` hook)
- [ ] Channel reconnect — bağlantı kopunca otomatik yeniden bağlanma

---

## FAZ 3 — Question Lifecycle

### Soru Akışı (Host)
- [x] `POST /api/oyun/[id]/basla` — Oyunu başlat + `GAME_STARTED` broadcast
- [x] `POST /api/oyun/[id]/soru-basla` — Soruyu başlat + `QUESTION_START` broadcast
- [x] `POST /api/oyun/[id]/soru-bitir` — Soruyu bitir + `QUESTION_END` + `LEADERBOARD_UPDATE` broadcast
- [x] `POST /api/oyun/[id]/bitir` — Oyunu bitir + final sıralamaları kaydet + `GAME_END` broadcast
- [x] `/oyun/[id]/kontrol` — Cevap bar chart, ring timer, oyuncu sayısı
- [ ] **Otomatik soru süresi dolunca `soru-bitir` tetikleme** (şu an host manuel tıklıyor)
- [ ] Son soru bittikten sonra "Oyunu Bitir" otomatik prompt
- [ ] Host kontrol sayfası yenilenince state recovery

### Soru Akışı (Oyuncu)
- [x] `/oyna/[session]/soru` — Soru metni, 4 renkli şık, timer bar
- [x] `POST /api/oyun/[id]/cevap` — Cevap kaydet + puan hesapla + `ANSWER_COUNT` broadcast
- [x] `lib/scoring/scoring.ts` — Hız bazlı puanlama (500–1000 arası)
- [x] Float-up puan animasyonu (`qf-float-up`)
- [x] Doğru/yanlış renk geri bildirimi
- [ ] **`your_points` oyuncuya gönderilmiyor** — `soru-bitir` route'u bireysel puan göndermez, `QUESTION_END` event'i herkese aynı payload gönderilir
- [ ] **Süre dolduğunda şıklar otomatik kilitlenir** (`timeLeft <= 0` kontrol edilmiyor, disable edilmiyor)
- [ ] Süre dolduğunda cevap verilmediyse `null` option ile otomatik submit

### Skor & Sonuç
- [x] `/oyna/[session]/skor` — Ara sıralama, CountUp animasyonu, geri sayım
- [x] `/oyna/[session]/bitis` — Konfeti, podium, toplam puan
- [x] `/oyun/[id]/sonuclar` — Host sonuç: podium + tam sıralama tablosu
- [x] `GET /api/oyun/[id]/export` — CSV indirme (UTF-8 BOM)
- [ ] `/oyna/[session]/bitis` — Bireysel istatistik: Doğru/Hız/Seri (şu an sadece toplam puan)

---

## FAZ 4 — Polish + Edge Cases

### UX & Loading States
- [ ] **Tüm sayfalarda skeleton / loading state** (dashboard ✅, diğerleri ⚠️)
- [ ] **Global error boundary** (`app/error.tsx`)
- [ ] **404 sayfası** (`app/not-found.tsx`)
- [ ] Toast / snackbar notification sistemi (kayıt başarılı, hata, kopyalandı vb.)
- [ ] Boş state'ler: dashboard'da quiz yok ✅, lobide oyuncu yok ✅
- [ ] Form validation hata mesajları (giris sayfası ✅, editör ⚠️)

### Edge Cases
- [ ] **Oyun aktifken host sayfayı yenilerse** — kontrol sayfasına geri dönmeli
- [ ] **Oyuncu sayfayı yenilerse** — `sessionStorage` kaybolur, yeniden katılım akışı
- [ ] **PIN süresi dolmuş/kullanılmış** — hata ekranı
- [ ] **0 sorulu quiz ile oyun başlatma engeli**
- [ ] **Oyun zaten başlamışken lobi PIN'i girme** — "Oyun başladı" uyarısı (API ✅, UI ⚠️)
- [ ] **Supabase bağlantı hatası** — offline banner
- [ ] Aynı `player_id` ile çift cevap upsert (API'de `upsert` var ✅)
- [ ] Max oyuncu limiti (isteğe bağlı)

### Mobil & Erişilebilirlik
- [ ] Host ekranları mobilde çalışıyor mu? (dashboard sidebar kırılır)
- [ ] Klavye navigasyonu: PIN numpad → Enter tetikleme ✅ (form submit)
- [ ] `aria-label` eksik öğeler (butonlar, ikonlar)
- [ ] Renk kontrastı WCAG AA — özellikle glassmorphism kartlar

### Görsel Upload (Faz 1'den taşındı)
- [ ] Supabase Storage bucket `quiz-images` oluşturuldu
- [ ] `components/host/ImageUploader.tsx` — drag-drop + preview
- [ ] Editördeki placeholder gerçek upload ile değiştirildi
- [ ] Soru ekranında görsel gösterimi ✅ (UI var, `image_url` doluysa)

---

## FAZ 5 — Deploy

### Vercel
- [ ] `vercel` CLI veya GitHub entegrasyonu ile proje bağlandı
- [ ] Environment variables Vercel dashboard'a eklendi:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
- [ ] `next.config.ts` — production image domain'leri eklendi
- [ ] Build başarıyla tamamlanıyor (`npm run build` sıfır hata)

### Supabase Production
- [ ] Production Supabase projesi oluşturuldu (dev'den ayrı)
- [ ] Migration production'a uygulandı
- [ ] RLS politikaları test edildi (anon kullanıcı sadece izin verilen şeylere erişebilir)
- [ ] Realtime quotas kontrol edildi (free tier: 200 eşzamanlı bağlantı)
- [ ] Auth → Site URL production domain'ine güncellendi
- [ ] Auth → Redirect URL'ler eklendi

### Güvenlik & Performans
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sadece server-side route'larda kullanılıyor ✅ (client.ts'de yok)
- [ ] API rate limiting — `/api/oyuncu/katil` spam koruması
- [ ] Anthropic API key client'a sızmaması kontrol edildi ✅
- [ ] `npm run build` çıktısında bundle size kontrolü
- [ ] Lighthouse skoru: Performance ≥ 80, Accessibility ≥ 90

### İzleme
- [ ] Vercel Analytics aktif edildi
- [ ] Error tracking (Sentry veya Vercel'in built-in'i)
- [ ] Supabase dashboard alerts (DB boyutu, realtime bağlantı sayısı)

---

## Özet Tablo

| Faz | Tamamlanan | Kalan | Durum |
|-----|-----------|-------|-------|
| Faz 0 — Setup | 12/17 | 5 | ⚠️ |
| Faz 1 — Auth + Quiz CRUD | 11/16 | 5 | ⚠️ |
| Faz 2 — Live Game Skeleton | 13/17 | 4 | ⚠️ |
| Faz 3 — Question Lifecycle | 14/19 | 5 | ⚠️ |
| Faz 4 — Polish + Edge Cases | 5/20 | 15 | ❌ |
| Faz 5 — Deploy | 0/15 | 15 | ❌ |

**Kritik (çalışmak için zorunlu):**
1. `.env.local` doldurulması
2. Supabase SQL migration uygulanması
3. `your_points` bireysel gönderimi (Faz 3)
4. Otomatik soru süresi dolma kilidi (Faz 3)
5. Host lobi başlangıç player listesi (Faz 2)
