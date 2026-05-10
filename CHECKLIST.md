# Quizify MVP — Faz Bazlı Checklist

> Durum: ✅ Tamamlandı · ⚠️ Kısmen yapıldı · ❌ Yapılmadı

---

## FAZ 0 — Setup & Altyapı ✅

### Proje İskeleti
- [x] Next.js 16.2.6 (App Router) projesi oluşturuldu
- [x] TypeScript + Tailwind v4 kuruldu
- [x] Quizify design token'ları `globals.css`'e aktarıldı (`--grad-brand`, `--ans-*`, `--r-*`, animasyonlar)
- [x] Shared component kütüphanesi: `QuizifyMark`, `AnswerShape`, `Icon`, `Btn`, `Avatar`, `TimerBar`, `Confetti`, `CountUp`
- [x] `types/database.ts` — Supabase tablo tipleri
- [x] `types/game.ts` — Realtime event tipleri
- [x] `proxy.ts` — `/dashboard`, `/quiz`, `/oyun` rotaları auth koruması (Next.js 16 convention)
- [x] `.env.local` dolduruldu (Supabase URL, anon key, service role key)

### Supabase Projesi
- [x] Supabase dashboard'da proje oluşturuldu (`oujcggftklacfyyylbrg`, eu-central-1)
- [x] `supabase/migrations/001_initial_schema.sql` uygulandı (MCP ile)
- [ ] Auth → Google OAuth ayarlandı (Client ID + Secret) — opsiyonel
- [x] Realtime → `game_sessions` ve `players` tabloları publication'a eklendi (migration'da)

### Test Altyapısı
- [x] `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react` kuruldu
- [x] `vitest.config.ts` oluşturuldu (jsdom, globals: true, @/* alias)
- [x] `vitest.setup.ts` oluşturuldu (@testing-library/jest-dom)
- [x] `package.json`'a `"test"` ve `"test:run"` scriptleri eklendi
- [x] `__tests__/lib/scoring.test.ts` — 8 unit test, hepsi geçiyor

---

## FAZ 1 — Auth + Quiz CRUD ⚠️

### Kimlik Doğrulama
- [x] `/giris` — Login/Register toggle sayfası
- [x] E-posta + şifre ile giriş (`signInWithPassword`)
- [x] E-posta + şifre ile kayıt (`signUp`)
- [x] Auth trigger: `on_auth_user_created` → `public.users`'a kayıt
- [x] Google OAuth butonu bağlandı (`signInWithOAuth({ provider: 'google' })`)
- [x] Çıkış sonrası `/` yönlendirmesi (dashboard'da logout butonu)
- [ ] "Şifremi unuttum" akışı — opsiyonel

### Quiz Editörü
- [x] `/dashboard` — Quiz listesi, stats grid, filter pill'ları, publish toggle
- [x] `/quiz/yeni` — Otomatik quiz oluştur + redirect
- [x] `/quiz/[id]/duzenle` — Soru editörü (metin, şıklar, süre, doğru işareti)
- [x] Quiz CRUD API: `GET/POST /api/quiz`, `GET/PUT/DELETE /api/quiz/[id]`
- [x] AI soru üretici modal (konu + count → Claude API)
- [x] `POST /api/quiz/ai-uret` — Claude `claude-sonnet-4-6` ile Türkçe soru üretimi
- [x] Quiz yayınlama/taslağa çekme toggle'ı (dashboard kart + API)
- [x] **En az 1 soru + her soruda 1 doğru şık olmadan oyun başlatılamaz** (`POST /api/oyun` guard)
- [ ] Görsel yükleme — Supabase Storage (Faz 4'e taşındı)
- [ ] Soru sürükleme sırası — drag-and-drop (Faz 4'e taşındı)
- [ ] Kaydetmeden çıkma uyarısı (`useBeforeUnload`) — opsiyonel

---

## FAZ 2 — Live Game Skeleton ⚠️

### Oyun Oturumu & Lobi
- [x] `POST /api/oyun` — Benzersiz PIN + slug ile game session oluşturma
- [x] `lib/game/pinGenerator.ts` — 6 haneli PIN + slug üretimi
- [x] `GET /api/katil/[pin]` — PIN doğrulama + session bilgisi
- [x] `POST /api/oyuncu/katil` — Oyuncu kaydı + `PLAYER_JOINED` broadcast + duplicate nickname engeli
- [x] `POST /api/oyuncu/ayril` — Oyuncu ayrılma + `PLAYER_LEFT` broadcast
- [x] `/katil` — PIN giriş ekranı (custom numpad + digit box'lar)
- [x] `/katil/[pin]` — Takmaadı + takım seçim ekranı
- [x] `/oyun/[id]/lobi` — Host lobi: 96px PIN, QR, oyuncu grid; **DB'den mevcut oyuncular yükleniyor**
- [x] `/oyna/[session]` — Oyuncu bekleme: glassmorphism avatar, player bubble'lar
- [ ] Oyuncu `sessionStorage`'dan `player_id` kaybedince yeniden katılma akışı — Faz 4

### Realtime Kanal
- [x] `lib/realtime/useGameChannel.ts` — Supabase Broadcast channel hook
- [x] `lib/realtime/serverBroadcast.ts` — Server-side REST broadcast
- [x] Tüm event type'ları dinleniyor
- [x] `PLAYER_LEFT` broadcast — `beforeunload` + `navigator.sendBeacon`
- [ ] Channel reconnect — bağlantı kopunca otomatik yeniden bağlanma — Faz 4

---

## FAZ 3 — Question Lifecycle ⚠️

### Soru Akışı (Host)
- [x] `POST /api/oyun/[id]/basla` — Oyunu başlat + `GAME_STARTED` broadcast
- [x] `POST /api/oyun/[id]/soru-basla` — Soruyu başlat + `QUESTION_START` broadcast
- [x] `POST /api/oyun/[id]/soru-bitir` — Soruyu bitir (artık `endQuestion()` lib kullanıyor)
- [x] `POST /api/oyun/[id]/bitir` — Oyunu bitir + final sıralamaları + `GAME_END` broadcast
- [x] `lib/game/endQuestion.ts` — Paylaşımlı soru bitirme fonksiyonu (atomik race condition koruması)
- [x] `/oyun/[id]/kontrol` — Cevap bar chart, ring timer, oyuncu sayısı
- [ ] Otomatik soru süresi dolunca `soru-bitir` tetikleme — host tarafı timer (Faz 4)
- [ ] Son soru bittikten sonra "Oyunu Bitir" otomatik prompt
- [ ] Host kontrol sayfası yenilenince state recovery — Faz 4

### Soru Akışı (Oyuncu)
- [x] `/oyna/[session]/soru` — Soru metni, 4 renkli şık, timer bar
- [x] `POST /api/oyun/[id]/cevap` — Cevap kaydet + puan hesapla + `ANSWER_COUNT` broadcast
- [x] **Tüm oyuncular cevap verince soru otomatik bitiyor** (cevap route'unda `endQuestion()` tetikleniyor)
- [x] `lib/scoring/scoring.ts` — Hız bazlı puanlama (500–1000 arası)
- [x] Float-up puan animasyonu
- [x] Doğru/yanlış renk geri bildirimi
- [x] **Bireysel puan** — `QUESTION_END` event'inde `player_points` map ile her oyuncuya kendi puanı
- [x] **Süre dolunca şıklar kilitleniyor + null submit** otomatik gönderiliyor

### Skor & Sonuç
- [x] `/oyna/[session]/skor` — Ara sıralama, CountUp animasyonu, geri sayım
- [x] `/oyna/[session]/bitis` — Konfeti, podium, toplam puan
- [x] `/oyun/[id]/sonuclar` — Host sonuç: podium + tam sıralama tablosu
- [x] `GET /api/oyun/[id]/export` — CSV indirme (UTF-8 BOM)
- [ ] `/oyna/[session]/bitis` — Bireysel istatistik: Doğru/Hız/Seri — Faz 4

---

## FAZ 4 — Polish + Edge Cases ❌

### UX & Loading States
- [ ] Global error boundary (`app/error.tsx`)
- [ ] 404 sayfası (`app/not-found.tsx`)
- [ ] Toast / snackbar notification sistemi
- [ ] Form validation hata mesajları (editör ⚠️)

### Edge Cases
- [ ] Oyun aktifken host sayfayı yenilerse → kontrol sayfasına redirect
- [ ] Oyuncu sayfayı yenilerse → sessionStorage kaybolur, yeniden katılım akışı
- [ ] PIN süresi dolmuş/kullanılmış → hata ekranı
- [ ] Oyun başlamışken lobi PIN'i girme → "Oyun başladı" uyarısı (API ✅, UI ⚠️)
- [ ] Supabase bağlantı hatası → offline banner
- [ ] Channel reconnect otomatik
- [ ] Host tarafı timer → süre dolunca `soru-bitir` otomatik tetikleme
- [ ] Son soru sonrası "Oyunu Bitir" otomatik prompt
- [ ] Oyuncu yeniden katılım akışı (sessionStorage kaybı)

### Görsel Upload
- [ ] Supabase Storage bucket `quiz-images` oluşturuldu
- [ ] `components/host/ImageUploader.tsx` — drag-drop + preview
- [ ] Editördeki placeholder gerçek upload ile değiştirildi

### Mobil
- [ ] Dashboard sidebar mobilde çalışıyor mu?
- [ ] `aria-label` eksik öğeler

---

## FAZ 5 — Deploy ❌

### Vercel
- [ ] Vercel'e bağlandı
- [ ] Environment variables eklendi
- [ ] `npm run build` sıfır hata

### Supabase Production
- [ ] Production proje (dev'den ayrı)
- [ ] RLS politikaları test edildi
- [ ] Auth → Site URL + Redirect URL'ler güncellendi

### Güvenlik
- [ ] API rate limiting — `/api/oyuncu/katil` spam koruması
- [ ] Lighthouse skoru: Performance ≥ 80, Accessibility ≥ 90

---

## Özet Tablo

| Faz | Durum | Not |
|-----|-------|-----|
| Faz 0 — Setup | ✅ | Tamamlandı |
| Faz 1 — Auth + Quiz CRUD | ⚠️ | Temel akış çalışıyor, görsel upload + drag-drop kaldı |
| Faz 2 — Live Game Skeleton | ⚠️ | Temel akış çalışıyor, reconnect + yeniden katılım kaldı |
| Faz 3 — Question Lifecycle | ⚠️ | Temel akış çalışıyor, host timer + son soru prompt kaldı |
| Faz 4 — Polish + Edge Cases | ❌ | Başlanmadı |
| Faz 5 — Deploy | ❌ | Başlanmadı |
