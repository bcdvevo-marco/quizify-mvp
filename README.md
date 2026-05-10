# Quizify — Gerçek Zamanlı Quiz Platformu

Kahoot benzeri Türkçe quiz platformu. Host quizleri oluşturur, oyuncular PIN ile katılır, soru cevaplarken hız bazlı puan kazanır.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase (Auth, DB, Realtime, Storage) · Anthropic Claude API · Vitest

---

## Geliştirme

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açılır.

Test komutları:
```bash
npm run test       # watch mode
npm run test:run   # tek seferlik
```

---

## Environment Variables

`.env.local` dosyasında olması gerekenler:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<sk-ant-...>   # AI soru üretici için (opsiyonel)
```

---

## Mimari

```
app/
  giris/                # Auth (login/register/şifre sıfırla)
  sifre-sifirla/        # Şifre sıfırlama (recovery token)
  dashboard/            # Quiz listesi + stats (host)
  quiz/[id]/duzenle/    # Soru editörü + AI üretici
  katil/                # PIN giriş ekranı (oyuncu)
  katil/[pin]/          # Takmaadı + takım seçim
  oyun/[id]/lobi/       # Host lobi (PIN + QR + oyuncular)
  oyun/[id]/kontrol/    # Host kontrol paneli (cevap dağılımı, timer)
  oyun/[id]/sonuclar/   # Host sonuç paneli (podium + sıralama + CSV)
  oyna/[session]/       # Oyuncu bekleme ekranı
  oyna/[session]/soru/  # Soru cevaplama
  oyna/[session]/skor/  # Ara sıralama
  oyna/[session]/bitis/ # Sonuç + podium

  api/
    quiz/               # Quiz CRUD
    quiz/ai-uret/       # Claude API ile soru üretimi
    oyun/               # Game session lifecycle
    oyun/[id]/cevap/    # Cevap kaydı + auto-end
    oyun/[id]/export/   # CSV indirme
    katil/[pin]/        # PIN doğrulama
    oyuncu/             # katil/ayril (oyuncu lifecycle)

components/
  shared/               # Tüm uygulama (Btn, Toast, OfflineBanner, ...)
  host/                 # Host-specific (ImageUploader)

lib/
  supabase/             # SSR + client adapters
  realtime/             # useGameChannel hook + serverBroadcast
  game/                 # endQuestion, pinGenerator
  scoring/              # Hız bazlı puanlama
  ai/                   # Claude question generator
  rateLimit.ts          # In-memory IP rate limiter

supabase/migrations/    # 001_initial_schema, 002_security_perf_hardening
```

---

## Production Deploy (Vercel)

### 1. Supabase production hazırlığı

- [ ] Production proje oluştur (dev'den ayrı önerilir, eğer henüz değilse)
- [ ] `supabase/migrations/001_initial_schema.sql` ve `002_security_perf_hardening.sql` uygula
- [ ] Auth → URL Configuration → Site URL: `https://<vercel-domain>`
- [ ] Auth → URL Configuration → Redirect URLs ekle:
  - `https://<vercel-domain>/sifre-sifirla`
  - `https://<vercel-domain>/auth/callback` (Google OAuth kullanılıyorsa)
- [ ] Auth → Providers → Leaked Password Protection: **enable**
- [ ] Storage → `quiz-images` bucket'ı kontrol et (public, 5MB limit)

### 2. Vercel kurulum

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel deploy --prod
```

Veya Vercel dashboard'undan GitHub repo'yu bağlayıp Environment Variables'ları
GUI'den ekleyebilirsin.

### 3. Deploy sonrası

- [ ] `https://<vercel-domain>` üzerinden:
  - [ ] Yeni hesap aç → quiz oluştur → AI ile 5 soru üret → yayınla
  - [ ] Oyun başlat → mobilden PIN ile katıl → soruyu cevapla → bitiş ekranı
  - [ ] CSV export indir
  - [ ] Şifre sıfırlama akışı (mail gelir mi, link çalışıyor mu)
- [ ] Lighthouse skorları (≥80 perf, ≥90 a11y)

---

## Güvenlik Notları

- API rate limiting `lib/rateLimit.ts`'de in-memory, **Vercel multi-instance'da
  güvenilir değildir**. Production trafik artarsa **Upstash Redis** kullan.
- RLS politikaları: oyuncuların sadece `lobby` durumdaki sessionlara katılabilmesi,
  cevapların sadece `active` sessionlarda kaydedilmesi gibi kısıtlar Faz 5'te eklendi.
- `SUPABASE_SERVICE_ROLE_KEY` server-only — client tarafına asla geçirme.
