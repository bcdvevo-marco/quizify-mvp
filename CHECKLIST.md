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

## FAZ 1 — Auth + Quiz CRUD ✅

### Kimlik Doğrulama
- [x] `/giris` — Login/Register toggle sayfası
- [x] E-posta + şifre ile giriş (`signInWithPassword`)
- [x] E-posta + şifre ile kayıt (`signUp`)
- [x] Auth trigger: `on_auth_user_created` → `public.users`'a kayıt
- [x] Google OAuth butonu bağlandı (`signInWithOAuth({ provider: 'google' })`)
- [x] Çıkış sonrası `/` yönlendirmesi (dashboard'da logout butonu)
- [x] "Şifremi unuttum" akışı (`resetPasswordForEmail` + geri dön linki)

### Quiz Editörü
- [x] `/dashboard` — Quiz listesi, stats grid, filter pill'ları, publish toggle
- [x] `/quiz/yeni` — Otomatik quiz oluştur + redirect
- [x] `/quiz/[id]/duzenle` — Soru editörü (metin, şıklar, süre, doğru işareti)
- [x] Quiz CRUD API: `GET/POST /api/quiz`, `GET/PUT/DELETE /api/quiz/[id]`
- [x] AI soru üretici modal (konu + count → Claude API)
- [x] `POST /api/quiz/ai-uret` — Claude `claude-sonnet-4-6` ile Türkçe soru üretimi
- [x] Quiz yayınlama/taslağa çekme toggle'ı (dashboard kart + API)
- [x] En az 1 soru + her soruda 1 doğru şık olmadan oyun başlatılamaz (`POST /api/oyun` guard)
- [x] Görsel yükleme — Supabase Storage (Faz 4'te tamamlandı, `ImageUploader`)
- [ ] Soru sürükleme sırası — drag-and-drop (post-MVP)
- [ ] Kaydetmeden çıkma uyarısı (`useBeforeUnload`) (post-MVP)

---

## FAZ 2 — Live Game Skeleton ✅

### Oyun Oturumu & Lobi
- [x] `POST /api/oyun` — Benzersiz PIN + slug ile game session oluşturma
- [x] `lib/game/pinGenerator.ts` — 6 haneli PIN + slug üretimi
- [x] `GET /api/katil/[pin]` — PIN doğrulama + session bilgisi
- [x] `POST /api/oyuncu/katil` — Oyuncu kaydı + `PLAYER_JOINED` broadcast + duplicate nickname engeli
- [x] `POST /api/oyuncu/ayril` — Oyuncu ayrılma + `PLAYER_LEFT` broadcast
- [x] `/katil` — PIN giriş ekranı (custom numpad + digit box'lar)
- [x] `/katil/[pin]` — Takmaadı + takım seçim ekranı
- [x] `/oyun/[id]/lobi` — Host lobi: 96px PIN, QR, oyuncu grid; DB'den mevcut oyuncular yükleniyor
- [x] `/oyna/[session]` — Oyuncu bekleme: glassmorphism avatar, player bubble'lar
- [x] Oyuncu `sessionStorage` kaybedince `/katil`'e yönlendirme

### Realtime Kanal
- [x] `lib/realtime/useGameChannel.ts` — Supabase Broadcast channel hook
- [x] `lib/realtime/serverBroadcast.ts` — Server-side REST broadcast
- [x] Tüm event type'ları dinleniyor
- [x] `PLAYER_LEFT` broadcast — `beforeunload` + `navigator.sendBeacon`
- [x] Channel reconnect — `CHANNEL_ERROR`/`TIMED_OUT` sonrası 3s bekleyip otomatik yeniden bağlanma

---

## FAZ 3 — Question Lifecycle ✅

### Soru Akışı (Host)
- [x] `POST /api/oyun/[id]/basla` — Oyunu başlat + `GAME_STARTED` broadcast
- [x] `POST /api/oyun/[id]/soru-basla` — Soruyu başlat + `QUESTION_START` broadcast
- [x] `POST /api/oyun/[id]/soru-bitir` — Soruyu bitir (`endQuestion()` lib kullanıyor)
- [x] `POST /api/oyun/[id]/bitir` — Oyunu bitir + final sıralamaları + `GAME_END` broadcast
- [x] `lib/game/endQuestion.ts` — Paylaşımlı soru bitirme fonksiyonu (atomik race condition koruması)
- [x] `/oyun/[id]/kontrol` — Cevap bar chart, ring timer, oyuncu sayısı
- [x] Otomatik soru süresi dolunca `soru-bitir` tetikleme — host timer (`autoEndedRef` ile tek tetik)
- [x] Son soru bittikten sonra "Oyunu Bitir & Sonuçları Gör" butonu çıkıyor
- [x] Host kontrol sayfası yenilenince state recovery (`GET /api/oyun/[id]/soru-aktif`)

### Soru Akışı (Oyuncu)
- [x] `/oyna/[session]/soru` — Soru metni, 4 renkli şık, timer bar
- [x] `POST /api/oyun/[id]/cevap` — Cevap kaydet + puan hesapla + `ANSWER_COUNT` broadcast
- [x] Tüm oyuncular cevap verince soru otomatik bitiyor (`endQuestion()` tetikleniyor)
- [x] `lib/scoring/scoring.ts` — Hız bazlı puanlama (500–1000 arası)
- [x] Float-up puan animasyonu + doğru/yanlış renk geri bildirimi
- [x] Bireysel puan — `QUESTION_END` event'inde `player_points` map
- [x] Süre dolunca şıklar kilitleniyor + null submit otomatik gönderiliyor

### Skor & Sonuç
- [x] `/oyna/[session]/skor` — Ara sıralama, CountUp animasyonu, geri sayım
- [x] `/oyna/[session]/bitis` — Konfeti, podium, toplam puan + bireysel istatistik (doğru sayısı, isabet%, sıra)
- [x] `/oyun/[id]/sonuclar` — Host sonuç: podium + tam sıralama tablosu
- [x] `GET /api/oyun/[id]/export` — CSV indirme (UTF-8 BOM)

---

## FAZ 4 — Polish + Edge Cases ✅

### UX & Loading States
- [x] Global error boundary (`app/error.tsx`)
- [x] 404 sayfası (`app/not-found.tsx`)
- [x] Toast / snackbar notification sistemi (`ToastProvider` + `useToast` hook)
- [x] Form validation hata mesajları — `joinError` katıl ekranında, editor `alert` → toast

### Edge Cases
- [x] Oyun aktifken host sayfayı yenilerse → kontrol sayfasına redirect
- [x] Oyuncu sayfayı yenilerse → sessionStorage kaybolur, `/katil`'e yönlendirme
- [x] PIN süresi dolmuş/kullanılmış → hata ekranı (`fetchError` screen)
- [x] Oyun başlamışken lobi PIN'i girme → "Oyun başladı" uyarısı (API ✅, UI ✅)
- [x] Supabase bağlantı hatası → offline banner (`OfflineBanner` window event listener)
- [x] Channel reconnect otomatik (3s retry)
- [x] Host tarafı timer → süre dolunca `soru-bitir` otomatik tetikleme (`autoEndedRef`)
- [x] Son soru sonrası "Oyunu Bitir" otomatik prompt
- [x] Oyuncu yeniden katılım akışı (sessionStorage kaybı → `/katil` redirect)

### Görsel Upload
- [x] Supabase Storage bucket `quiz-images` oluşturuldu (5MB limit, public read)
- [x] `components/host/ImageUploader.tsx` — drag-drop + preview + kaldır
- [x] Editördeki placeholder gerçek upload ile değiştirildi
- [x] Host kontrol sayfasında soru görseli gösterimi

### Mobil
- [x] Dashboard sidebar mobilde hamburger menü + overlay drawer
- [x] Stats grid 2-kolon, quiz kart grid responsive
- [x] `aria-label` — hamburger butona eklendi

---

## FAZ 5 — Deploy ⚠️

### Vercel (kod hazırlığı)
- [x] `vercel.json` eklendi (AI endpoint için 60s timeout)
- [x] `README.md` deploy talimatları ile yenilendi
- [x] `npm run build` sıfır hata (31 route, build output temiz)
- [ ] Vercel'e bağlandı *(kullanıcı aksiyonu)*
- [ ] Environment variables eklendi *(kullanıcı aksiyonu)*

### Supabase Production
- [x] `002_security_perf_hardening.sql` migration uygulandı
  - `handle_new_user`: search_path locked, EXECUTE revoked
  - INSERT politikalarına state checkleri eklendi (lobby/active)
  - `auth.uid()` → `(select auth.uid())` performans
  - 13 foreign key index eklendi
- [x] `quiz-images` bucket SELECT policy daraltıldı (LIST kapatıldı)
- [ ] Production proje (dev'den ayrı) *(kullanıcı kararı — MVP için dev kullanılabilir)*
- [ ] Auth → Site URL + Redirect URL'ler *(kullanıcı aksiyonu)*
- [ ] Auth → Leaked Password Protection: enable *(kullanıcı dashboard)*

### Güvenlik
- [x] API rate limiting — `lib/rateLimit.ts` (in-memory IP tabanlı)
  - `/api/oyuncu/katil`: 10/dk
  - `/api/katil/[pin]`: 30/dk
  - `/api/quiz/ai-uret`: 5/dk
- [x] Supabase advisor: 8 → 1 security warning (kalan: leaked_password_protection)
- [ ] Lighthouse skoru: Performance ≥ 80, Accessibility ≥ 90 *(deploy sonrası)*

---

## Özet Tablo

| Faz | Durum | Not |
|-----|-------|-----|
| Faz 0 — Setup | ✅ | Tamamlandı |
| Faz 1 — Auth + Quiz CRUD | ✅ | Tamamlandı (drag-drop & `useBeforeUnload` post-MVP) |
| Faz 2 — Live Game Skeleton | ✅ | Tamamlandı |
| Faz 3 — Question Lifecycle | ✅ | Tamamlandı |
| Faz 4 — Polish + Edge Cases | ✅ | Tamamlandı |
| Faz 5 — Deploy | ⚠️ | Kod tarafı hazır, Vercel + Supabase config kullanıcı aksiyonu |

---

## Post-MVP (Faz 6+)

### Editör İyileştirmeleri
- [ ] Soru sürükleme sırası — drag-and-drop (`@dnd-kit/core`)
- [ ] Kaydetmeden çıkma uyarısı — `beforeunload` listener
- [ ] Soru kopyala/çoğalt butonu

### Oyun Akışı
- [ ] Hazır quiz şablonları kütüphanesi
- [ ] Multimedya: video/ses ekleme
- [ ] Çoktan seçmeli + true/false + open-ended soru tipleri
- [ ] Takım oyunu özel skor stratejileri (toplam, ortalama, en yüksek)

### Analitik
- [ ] Quiz başına performans istatistikleri (en zor soru, ortalama skor)
- [ ] Geçmiş oyunlar listesi + tekrar oynat
- [ ] Oyuncu profil ekranı (kendi geçmişi)

### Sosyal
- [ ] Quiz paylaşma (link, sosyal medya)
- [ ] Topluluk quiz galerisi
- [ ] Yorum + beğeni sistemi
