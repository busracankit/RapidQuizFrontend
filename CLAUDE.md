# Rapid Quiz — Frontend (CLAUDE.md)

Rapid Quiz'in Vue 3 web istemcisi. Tüm oyun kuralları backend'dedir; istemci yalnızca gösterir.

- **Proje dokümanı:** `../RapidQuizBackend/docs/rapid-quiz-proje-dokumani.md`
- **Backend reposu ve API sözleşmesi:** `../RapidQuizBackend` (`CLAUDE.md` › "API v1 sözleşmesi"; tam şema `/api/schema/`)
- **Git:** `origin` → https://github.com/busracankit/RapidQuizFrontend.git, dal `main`. Faz 3'e kadar yalnızca yerel commit.

## Teknoloji

Node 24 · Vue 3.5 (`<script setup>`, Composition API) · TypeScript 5.9 · Vite 8 · Vue Router 5 · Pinia 4 ·
Tailwind CSS 4 (`@tailwindcss/vite`) · Axios · Vitest 5 + Vue Test Utils · Playwright 1.63 · ESLint 10.
Fontlar `@fontsource` ile kendi sunucumuzdan (Space Grotesk 700, Plus Jakarta Sans 400/600/800).

**TypeScript 7 yerine 5.9:** Dokümandaki TS 7.0.2 (Go tabanlı yeni derleyici) klasik JS API'sini sunmuyor;
`typescript-eslint` (<6.1), `openapi-typescript` (^5) ve `vue-tsc` bununla çalışmıyor. Ekosistem TS 7'yi
destekleyince yükseltilecek.

## Komutlar

```bash
npm install
cp .env.example .env        # yerelde VITE_API_BASE_URL boş → /api Vite proxy ile localhost:8000'e gider
npm run dev                 # http://localhost:5173 (backend: docker compose up -d)
npm run build               # vue-tsc + vite build → dist/
npm run lint                # ESLint
npm test                    # Vitest (tests/unit)
npm run test:e2e            # Playwright (tests/e2e, API taklit edilir; backend gerekmez)
npm run gen:api             # OpenAPI → src/api/schema.d.ts (backend çalışırken; API_SCHEMA_URL ile değiştirilebilir)
```

`package-lock.json` tüm platformların native paketlerini (rolldown, lightningcss, tailwind oxide) içermeli.
Lock'u yeniden üretmek gerekirse: `rm -rf node_modules package-lock.json && npm install` (sadece
`npm install` mevcut node_modules ile tek platformluk lock üretebilir → Mac/DO build'i kırılır).

## Yapı

```
src/api/            client.ts (axios + ApiError + X-Session-Token), index.ts (api.*), types.ts, schema.d.ts (üretilir)
src/stores/quiz.ts  Pinia: oturum, soru, cevap, devam (sessionStorage 'rapidquiz.session'), sonuç, skor
src/composables/    useCountdown (5 sn sayaç, renk seviyesi), useCountUp (puan animasyonu)
src/router/         / · /kategori/:slug (hazır + 3-2-1) · /oyun · /sonuc · /skorlar/:slug?
src/views/          HomeView, ReadyView, QuestionView, ResultView, LeaderboardView
src/components/     CategoryCard, CategoryIcon, CountdownRing, ChoiceButton, ProgressBar, Podium, AppHeader, AppLogo, ErrorPanel
src/i18n/tr.ts      tüm arayüz metinleri (çoklu dil için tek dosya)
src/assets/styles/main.css   Tailwind tema token'ları (@theme) ve card/btn yardımcıları (@utility)
tests/unit/         Vitest; tests/e2e/ Playwright + mock-api.ts (sahte backend)
```

## Kurallar ve kararlar

- **Zamanlama:** Soru nesnesindeki `starts_in_ms` kadar beklenir (3-2-1 / 0,8 sn geri bildirim), sonra
  `remaining_ms`'den geri sayılır. Store her soru için `questionStartsAt` (performance.now) tutar; yenilemede
  kalan süre `remainingFor()` ile hesaplanır. Süre dolunca `choice_id: null` gönderilir. Puanı sunucu hesaplar.
- **Önemli:** `starts_in_ms` yanıtın alındığı ana göredir; başlangıç anı (`questionStartsAt`) yalnızca yanıt
  alındığında bir kez hesaplanır, sonradan yeniden hesaplanmaz (aksi halde geri bildirim süresi iki kez beklenir
  ve oyuncu her soruda ~0,8 sn kaybeder). Hazır ekranı soru ekranına 400 ms erken geçer ve soru ekranının kodunu
  3-2-1 sırasında önceden yükler.
- **Geliştirmede API:** `VITE_API_BASE_URL` boş → istekler `/api` üzerinden Vite proxy'siyle
  `VITE_API_PROXY_TARGET`'a (varsayılan http://localhost:8000) gider; CORS gerekmez. Production'da tam adres.
- **Şık kimlikleri** 1–4'tür (oturuma özel). Doğru şık yalnızca cevaptan sonra `correct_choice_id` ile gelir.
- **Hata yönetimi:** API hataları `ApiError(code, message, status)`; `session_not_found` /
  `invalid_session_token` / `session_expired` → oturum silinir, "ana sayfaya dön". `question_mismatch` ve ağ
  hatalarında `/current/` ile yeniden eşitlenir.
- **Tasarım:** açık zemin (krem), mobil öncelikli; renkler `@theme` token'larından. Renkli zeminde beyaz metin
  gereken yerde `*-strong` tonları (WCAG AA). Doğru/yanlış renk + ikon (✓/✕). `prefers-reduced-motion` tüm
  animasyonları kapatır. Klavye: 1–4 / A–D. Son 1 sn ve yanlış cevapta `navigator.vibrate`.
- Metinler yalnızca `src/i18n/tr.ts`'te; bileşenlere sabit Türkçe metin yazma.
- Yeni API alanı gerektiğinde önce backend şeması, sonra `npm run gen:api`.

## Yol haritası (Faz 2)

- [x] Kurulum, tema token'ları, OpenAPI tipleri + axios istemcisi
- [x] Ana sayfa, hazır ekranı, soru ekranı, sonuç + isim formu, skor tablosu (podyum)
- [x] Yenileme/devam, animasyonlar, erişilebilirlik
- [x] Vitest (23) ve Playwright (mobil + masaüstü) testleri
- [x] Gerçek backend ile uçtan uca doğrulandı (4 Ekim 2026)
