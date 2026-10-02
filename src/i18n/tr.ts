/**
 * Arayüz metinleri. Çoklu dil için ileride aynı yapıda başka dosyalar eklenebilir.
 * Parametreli metinler fonksiyondur.
 */
export const tr = {
  app: {
    name: 'Rapid Quiz',
    slogan: '20 soru. Her biri 5 saniye. Ne kadar hızlısın?',
    leaderboard: 'Skor Tablosu',
    home: 'Ana sayfa',
  },
  home: {
    pickCategory: 'Bir kategori seç',
    play: 'Oyna',
    loadError: 'Kategoriler yüklenemedi.',
    retry: 'Tekrar dene',
  },
  ready: {
    title: (category: string) => `${category}`,
    rules: [
      '20 soru, her soru için 5 saniye',
      'Hızlı cevap = daha çok puan (soru başı 150’ye kadar)',
      'Süre dolarsa soru boş sayılır',
      'Geri dönüp cevap değiştiremezsin',
    ],
    getReady: 'Hazır ol!',
    starting: 'Oyun hazırlanıyor…',
    keyboardHint: 'İpucu: masaüstünde 1–4 veya A–D tuşlarıyla cevap verebilirsin.',
  },
  question: {
    progress: (index: number, total: number) => `${index}/${total}`,
    score: 'Puan',
    secondsLeft: (s: number) => `${s} saniye kaldı`,
    correct: 'Doğru!',
    wrong: 'Yanlış!',
    timeUp: 'Süre doldu!',
    correctAnswerWas: (text: string) => `Doğru cevap: ${text}`,
    points: (p: number) => `+${p}`,
    choiceLabel: (letter: string, text: string) => `${letter} şıkkı: ${text}`,
  },
  result: {
    title: 'Oyun bitti!',
    score: 'Puan',
    correct: 'Doğru',
    time: 'Toplam süre',
    seconds: (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} sn`,
    of: (n: number, total: number) => `${n}/${total}`,
    namePrompt: 'Skor tablosuna adını yaz',
    namePlaceholder: 'Adın (2–20 karakter)',
    nameTooShort: 'İsim en az 2 karakter olmalı.',
    save: 'Kaydet',
    saving: 'Kaydediliyor…',
    alreadySaved: (name: string) => `Skorun “${name}” adıyla kaydedildi.`,
    seeLeaderboard: 'Skor tablosunu gör',
    playAgain: 'Tekrar oyna',
    otherCategory: 'Başka kategori',
  },
  leaderboard: {
    title: 'Skor Tablosu',
    top10: 'İlk 10',
    empty: 'Henüz skor yok. İlk sen ol!',
    you: 'Sen',
    yourRank: (rank: number) => `Senin sıran: ${rank}.`,
    correct: (n: number) => `${n} doğru`,
    points: 'puan',
    loadError: 'Skor tablosu yüklenemedi.',
  },
  errors: {
    generic: 'Bir şeyler ters gitti. Lütfen tekrar dene.',
    network: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.',
    sessionLost: 'Oyun oturumu bulunamadı ya da süresi doldu. Yeni bir oyun başlat.',
    backHome: 'Ana sayfaya dön',
  },
} as const
