[🇬🇧 English](README.md) | 🇹🇷 Türkçe

# Rapid Quiz — Web

Hızlı bir bilgi yarışmasının web istemcisi: **20 soru, her soru için 5 saniye, üyelik yok** ve **kategori bazlı İlk 10 skor tablosu**. Vue 3 ve TypeScript ile yazıldı.

> **Rapid Quiz'in bir parçası**
>
> | Repo | Rolü |
> | --- | --- |
> | [RapidQuizBackend](https://github.com/busracankit/RapidQuizBackend) | Django REST API: oyun mantığı, puanlama, skor tabloları |
> | [RapidQuizFrontend](https://github.com/busracankit/RapidQuizFrontend) | Web istemcisi (Vue 3 + TypeScript, bu repo) |
> | [RapidQuizAndroid](https://github.com/busracankit/RapidQuizAndroid) | Android istemcisi (Kotlin + Jetpack Compose) |
>
> Canlı bir sunucu yok. Uygulama test amacıyla bir kez DigitalOcean App Platform'a kuruldu, ardından kapatıldı. Yerelde backend'e bağlanarak çalışır (bkz. [Kurulum ve çalıştırma](#kurulum-ve-çalıştırma)).

## Ekran görüntüleri

| Oyun | Sonuç | Skor Tablosu |
| --- | --- | --- |
| ![5 saniyelik sayaç halkası ve A–D şıklarıyla bir soru](docs/screenshots/game.png) | ![Puan, doğru sayısı, toplam süre ve isim formuyla sonuç ekranı](docs/screenshots/result.png) | ![Kategori sekmeleri ve podyumla skor tablosu](docs/screenshots/leaderboard.png) |

## Özellikler

- **Beş ekran:**
  - **Ana sayfa:** kategori kartları.
  - **Hazır:** kurallar ve 3-2-1 geri sayım.
  - **Soru:** 5 saniyelik dairesel sayaç, 20 parçalı ilerleme çubuğu, A–D şıklar, doğru/yanlış geri bildirimi ve kazanılan puan.
  - **Sonuç:** sayarak artan puan, doğru sayısı, toplam süre ve isimle skor kaydı.
  - **Skor Tablosu:** kategori sekmeleri, ilk 3 podyum, 4–10. sıralar, oyuncunun kendi satırı vurgulu, İlk 10 dışındaysa kendi sırası.
- Masaüstünde klavyeyle oyun: `1–4` ya da `A–D` tuşları şık seçer.
- Oyun ortasında sayfa yenilense de devam eder: oturum `sessionStorage`'da tutulur ve sunucuyla eşitlenir.
- Mobil öncelikli tasarım, destekleyen telefonlarda titreşim, `prefers-reduced-motion` açıkken süs animasyonları kapalı.
- Türkçe arayüz. Tüm metinler tek bir dosyada (`src/i18n/tr.ts`).

## Teknolojiler

| Alan | Araçlar |
| --- | --- |
| Çatı | Vue 3.5 (`<script setup>`, Composition API), TypeScript 5.9 |
| Build | Vite 8, Node 24 |
| Durum ve yönlendirme | Pinia 4, Vue Router 5 (history modu) |
| Stil | Tailwind CSS 4, Space Grotesk ve Plus Jakarta Sans (Fontsource ile) |
| API | Axios; tipler backend'in OpenAPI şemasından üretilir (`openapi-typescript`) |
| Kalite | ESLint 10, `vue-tsc`, Vitest 5 + Vue Test Utils, Playwright 1.63 |
| CI | GitHub Actions: lint, tip kontrolü, birim testleri, build ve uçtan uca testler |

## Mimari ve önemli tasarım kararları

- **Bilinçli olarak ince istemci.** Puanı, süreyi ve cevabın doğru olup olmadığını sunucu belirler. İstemci yalnızca sonucu gösterir, doğru cevap da ancak oyuncu cevap verdikten sonra gelir.
- **Tipli API sözleşmesi.** `src/api/schema.d.ts` backend'in OpenAPI şemasından üretilir (`npm run gen:api`). Böylece API'deki bir değişiklik çalışma anında hata olarak değil, TypeScript hatası olarak ortaya çıkar.
- **Süre sunucudan, ölçüm yerelde.** Her soru `starts_in_ms` ve `remaining_ms` ile gelir. İstemci başlangıç anını yanıt geldiği anda `performance.now()` ile bir kez hesaplar. Cihaz saatine hiç bağlı değildir.
- **Çift bekleme yok.** Cevaptan sonraki geri bildirim süresi sıradaki sorunun `starts_in_ms` değeridir, üstüne ek bekleme konmaz. Eski bir sürüm bu süreyi iki kez bekliyordu ve oyuncu her soruda yaklaşık 0,8 saniye kaybediyordu. Düzeltme testlerle güvence altında.
- **Açık bir oyun durum makinesi.** Pinia store'u `idle → ready → playing → answering → feedback → … → finished` aşamalarından geçer. Cevap yalnızca `playing` aşamasında kabul edilir, bu da çift tıklamayı engeller.
- **Tasarım gereği CORS yok.** API kök adresi görelidir (`/api/v1`). Geliştirmede Vite `/api` isteklerini backend'e aktarır. Production'da statik site ve API aynı kökenden sunuluyordu.
- **Oturum anahtarı başlıkta.** `X-Session-Token` bir başlık olarak gönderilir, cookie kullanılmaz. Token `sessionStorage`'da tutulur; bu depo sekmeye özeldir ve sekme kapanınca silinir.
- **Sunucusuz testler.** Playwright testleri API'yi `page.route` ile taklit eder. Böylece oyunun tamamı CI'da backend olmadan, mobil (Pixel 7) ve masaüstü görünümlerde çalışır.

## Kurulum ve çalıştırma

**Gerekenler:** Node 24 ve `http://localhost:8000` adresinde çalışan [backend](https://github.com/busracankit/RapidQuizBackend/blob/main/README.tr.md#kurulum-ve-çalıştırma).

```bash
git clone https://github.com/busracankit/RapidQuizFrontend.git
cd RapidQuizFrontend

npm install
cp .env.example .env    # isteğe bağlı: varsayılanlar /api'yi zaten http://localhost:8000'e aktarır
npm run dev             # http://localhost:5173
```

| Değişken | Varsayılan | Amacı |
| --- | --- | --- |
| `VITE_API_BASE_URL` | boş | Build sırasında koda gömülen API adresi. API aynı kökenden sunuluyorsa boş bırakılır. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Geliştirme sunucusunun `/api` isteklerini aktardığı adres |

Diğer komutlar:

```bash
npm run build      # tip kontrolü + dist/ içine production build
npm run preview    # production build'i yerelde sunar
npm run gen:api    # API tiplerini http://localhost:8000/api/schema/ adresinden yeniden üretir
```

## Testleri çalıştırma

```bash
npm test                               # birim testleri (Vitest): 23 test
npm run lint && npm run type-check     # ESLint + vue-tsc
npx playwright install chromium        # bir kez
npm run test:e2e                       # uçtan uca (Playwright): 5 senaryo × mobil ve masaüstü
```

Birim testleri quiz store'unu (başlatma, cevaplar, süre dolumu, geri bildirimin tek kez beklenmesi, çift tıklama koruması, yenilemeden sonra devam, süresi dolmuş oturum, skor kaydı), geri sayım composable'ını ve ana bileşenleri kapsar. Uçtan uca testler ana sayfadan İlk 10'a tam bir oyunu, yenilemeden sonra devam etmeyi, masaüstünde klavyeyle cevap vermeyi, skor tablosu sekmelerini ve boş durumu, ayrıca bulunamayan oturum hatasını kapsar.

## Proje yapısı

```
src/
├── api/            # Axios istemcisi, üretilen OpenAPI tipleri, API fonksiyonları
├── stores/quiz.ts  # oyun durum makinesi ve zamanlama (Pinia)
├── views/          # Home, Ready, Question, Result, Leaderboard
├── components/     # kategori kartı, şık butonu, sayaç halkası, ilerleme çubuğu, podyum…
├── composables/    # useCountdown, useCountUp
├── i18n/tr.ts      # arayüz metinleri (Türkçe)
├── router/         # rotalar (history modu)
└── assets/styles/  # Tailwind tema token'ları
tests/
├── unit/           # Vitest + Vue Test Utils
└── e2e/            # API'si taklit edilen Playwright testleri
docs/screenshots/   # bu README'deki görseller
```
