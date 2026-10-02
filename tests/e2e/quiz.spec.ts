import { expect, test, type Page } from '@playwright/test'

import { mockApi, seedEntry } from './mock-api'

async function answerCorrect(page: Page) {
  const q = page.getByTestId('question-text')
  await expect(q).toBeVisible()
  const text = await q.textContent()
  const index = Number(text!.match(/sorusu (\d+)/)![1])
  await page.getByRole('button', { name: new RegExp(`Doğru ${index}$`) }).click()
  await expect(page.getByTestId('feedback')).toContainText('Doğru!')
  return index
}

test('ana sayfa → 20 soru → isim → Top 10', async ({ page }) => {
  const backend = await mockApi(page)
  seedEntry(backend, 'yazilim', 'Usta', 2950)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Bir kategori seç' })).toBeVisible()
  await page.getByTestId('category-yazilim').click()

  // Hazır ekranı: kurallar + 3-2-1
  await expect(page.getByText('20 soru, her soru için 5 saniye')).toBeVisible()
  await expect(page.getByTestId('ready-countdown')).toBeVisible()

  // Soru ekranı
  await expect(page).toHaveURL(/\/oyun$/)
  await expect(page.getByTestId('progress-text')).toHaveText('1/20')

  // 1. soruyu bilerek yanlış cevapla: doğru şık gösterilmeli
  await expect(page.getByTestId('question-text')).toBeVisible()
  await page.getByRole('button', { name: /Yanlış 1-/ }).first().click()
  await expect(page.getByTestId('feedback')).toContainText('Yanlış! Doğru cevap: Doğru 1')
  await expect(page.locator('[data-state="reveal"]')).toHaveCount(1)
  await expect(page.locator('[data-state="wrong"]')).toHaveCount(1)

  // 2. soruda süreyi doldur
  await expect(page.getByTestId('progress-text')).toHaveText('2/20')
  await expect(page.getByTestId('feedback')).toContainText('Süre doldu!', { timeout: 8000 })

  // Kalan 18 soruyu doğru cevapla
  for (let i = 3; i <= 20; i++) {
    await expect(page.getByTestId('progress-text')).toHaveText(`${i}/20`)
    await answerCorrect(page)
  }

  // Sonuç ekranı
  await expect(page).toHaveURL(/\/sonuc$/)
  await expect(page.getByRole('heading', { name: 'Oyun bitti!' })).toBeVisible()
  await expect(page.getByTestId('result-correct')).toHaveText('18/20')

  // Geçersiz isim: sunucunun mesajı gösterilir
  await page.getByLabel('Skor tablosuna adını yaz').fill('<b>')
  await page.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByRole('alert')).toContainText('yalnızca harf')

  await page.getByLabel('Skor tablosuna adını yaz').fill('Ayşe')
  await page.getByRole('button', { name: 'Kaydet' }).click()

  // Skor tablosu: kullanıcı vurgulanır
  await expect(page).toHaveURL(/\/skorlar\/yazilim\?vurgu=2&sira=2/)
  await expect(page.getByTestId('podium-2')).toHaveClass(/ring-accent/)
  await expect(page.getByText('(Sen)')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tekrar oyna' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Başka kategori' })).toBeVisible()
})

test('sayfa yenilenince oyun kaldığı yerden devam eder', async ({ page }) => {
  await mockApi(page)
  await page.goto('/kategori/fizik')
  await expect(page).toHaveURL(/\/oyun$/)
  await answerCorrect(page)
  await expect(page.getByTestId('progress-text')).toHaveText('2/20')
  await answerCorrect(page)
  const score = await page.getByTestId('score').textContent()

  await page.reload()

  await expect(page.getByTestId('progress-text')).toHaveText('3/20')
  await expect(page.getByTestId('score')).toHaveText(score!)
  await expect(page.locator('[data-segment="correct"]')).toHaveCount(2)
  await answerCorrect(page)
})

test('masaüstünde 1–4 tuşlarıyla cevap verilir', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Klavye kısayolu masaüstü içindir')
  await mockApi(page)
  await page.goto('/kategori/ulkeler')
  await expect(page.getByTestId('question-text')).toBeVisible()
  // 1. sorunun doğru şıkkı 4. sırada (correctKey(1) = 4)
  await page.keyboard.press('4')
  await expect(page.getByTestId('feedback')).toContainText('Doğru!')
  await expect(page.getByTestId('progress-text')).toHaveText('2/20')
})

test('skor tablosu kategori sekmeleri ve boş durum', async ({ page }) => {
  const backend = await mockApi(page)
  seedEntry(backend, 'fizik', 'Newton', 2800)
  await page.goto('/')
  await page.getByRole('link', { name: /Skor Tablosu/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Skor Tablosu' })).toBeVisible()
  await expect(page.getByTestId('leaderboard-empty')).toBeVisible()
  await page.getByRole('link', { name: 'Fizik' }).click()
  await expect(page).toHaveURL(/\/skorlar\/fizik$/)
  await expect(page.getByText('Newton')).toBeVisible()
})

test('bulunamayan oturum anlaşılır hata gösterir', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.evaluate(() =>
    sessionStorage.setItem(
      'rapidquiz.session',
      JSON.stringify({ id: 'yok', token: 'tok_x', category: { slug: 'fizik', name: 'Fizik', color: '#06B6D4' } }),
    ),
  )
  await page.goto('/oyun')
  await expect(page.getByRole('alert')).toContainText('Oyun oturumu bulunamadı')
  await page.getByRole('link', { name: 'Ana sayfaya dön' }).click()
  await expect(page).toHaveURL(/\/$/)
})
