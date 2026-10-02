import type { Page, Route } from '@playwright/test'

/**
 * Bellek içi sahte backend: v1 API sözleşmesini (CLAUDE.md) taklit eder.
 * Her sorunun doğru şıkkı metni "Doğru" ile başlayan şıktır. Bekleme süreleri testler hızlı
 * olsun diye kısaltılmıştır (ilk soru 2000 ms, geri bildirim 300 ms).
 */
export const API = 'http://api.test/api/v1'

const categories = [
  { slug: 'yazilim', name: 'Yazılım', description: 'Kod ve algoritmalar.', icon: 'code', color: '#3B82F6', order: 1 },
  { slug: 'yapay-zeka', name: 'Yapay Zeka', description: 'ML ve derin öğrenme.', icon: 'brain', color: '#A855F7', order: 2 },
  { slug: 'bilgisayar-muhendisligi', name: 'Bilgisayar Mühendisliği', description: 'Donanım.', icon: 'cpu', color: '#F97316', order: 3 },
  { slug: 'ulkeler', name: 'Ülkeler', description: 'Başkentler.', icon: 'globe', color: '#10B981', order: 4 },
  { slug: 'fizik', name: 'Fizik', description: 'Mekanik.', icon: 'atom', color: '#06B6D4', order: 5 },
]

interface Answer {
  index: number
  is_correct: boolean
  timed_out: boolean
  points: number
  response_ms: number
}

interface MockSession {
  id: string
  token: string
  category: (typeof categories)[number]
  current: number
  servedAt: number
  score: number
  correct: number
  totalMs: number
  answers: Answer[]
  saved?: { id: number; name: string; rank: number }
}

const TOTAL = 20
const LIMIT = 5000
const FIRST_WAIT = 2000
const FEEDBACK = 300

function correctKey(index: number) {
  return ((index * 3) % 4) + 1
}

function question(s: MockSession, startsIn: number) {
  const i = s.current
  const correct = correctKey(i)
  return {
    index: i,
    id: 1000 + i,
    text: `${s.category.name} sorusu ${i}?`,
    difficulty: 1,
    choices: [1, 2, 3, 4].map((id) => ({ id, text: id === correct ? `Doğru ${i}` : `Yanlış ${i}-${id}` })),
    served_at: new Date(s.servedAt).toISOString(),
    starts_in_ms: Math.max(0, startsIn),
    remaining_ms: Math.max(0, Math.min(LIMIT, LIMIT - (Date.now() - s.servedAt))),
  }
}

export interface MockBackend {
  sessions: Map<string, MockSession>
  leaderboard: { id: number; player_name: string; score: number; correct_count: number; total_time_ms: number; created_at: string; slug: string }[]
}

export async function mockApi(page: Page): Promise<MockBackend> {
  const backend: MockBackend = { sessions: new Map(), leaderboard: [] }
  let seq = 0

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, x-session-token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify(body),
    })
  const err = (route: Route, status: number, code: string, message: string) =>
    json(route, status, { error: { code, message } })

  function board(slug: string) {
    return backend.leaderboard
      .filter((e) => e.slug === slug)
      .sort((a, b) => b.score - a.score || a.total_time_ms - b.total_time_ms || a.id - b.id)
  }
  function entries(slug: string) {
    return board(slug)
      .slice(0, 10)
      .map((e, i) => ({ ...e, rank: i + 1, slug: undefined }))
  }

  await page.route(`${API}/**`, async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return json(route, 200, {})
    const url = new URL(req.url())
    const path = url.pathname.replace('/api/v1', '')
    const body = req.postDataJSON?.() ?? null

    if (path === '/categories/') return json(route, 200, categories)

    if (path === '/leaderboard/') {
      const slug = url.searchParams.get('category')!
      const category = categories.find((c) => c.slug === slug)!
      return json(route, 200, { category: { slug, name: category.name, color: category.color }, entries: entries(slug) })
    }

    if (path === '/sessions/' && req.method() === 'POST') {
      const category = categories.find((c) => c.slug === body.category)
      if (!category) return err(route, 404, 'category_not_found', 'Kategori bulunamadı.')
      const s: MockSession = {
        id: `s${++seq}`,
        token: `tok_${seq}`,
        category,
        current: 1,
        servedAt: Date.now() + FIRST_WAIT,
        score: 0,
        correct: 0,
        totalMs: 0,
        answers: [],
      }
      backend.sessions.set(s.id, s)
      return json(route, 201, {
        session_id: s.id,
        session_token: s.token,
        category: { slug: category.slug, name: category.name, color: category.color },
        total_questions: TOTAL,
        time_limit_ms: LIMIT,
        question: question(s, FIRST_WAIT),
      })
    }

    const m = path.match(/^\/sessions\/([^/]+)\/(current|answers|result|score)\/$/)
    if (!m) return err(route, 404, 'not_found', 'Bulunamadı.')
    const s = backend.sessions.get(m[1]!)
    if (!s) return err(route, 404, 'session_not_found', 'Oturum bulunamadı.')
    if (req.headers()['x-session-token'] !== s.token)
      return err(route, 403, 'invalid_session_token', 'Oturum anahtarı geçersiz.')
    const finished = s.current > TOTAL
    const brief = { slug: s.category.slug, name: s.category.name, color: s.category.color }

    if (m[2] === 'current') {
      return json(route, 200, {
        session_id: s.id,
        status: finished ? 'completed' : 'in_progress',
        category: brief,
        total_questions: TOTAL,
        time_limit_ms: LIMIT,
        score: s.score,
        correct_count: s.correct,
        answered_count: s.answers.length,
        finished,
        question: finished ? null : question(s, s.servedAt - Date.now()),
        answers: s.answers,
      })
    }

    if (m[2] === 'answers') {
      if (body.question_id !== 1000 + s.current) return err(route, 409, 'question_mismatch', 'Güncel soru değil.')
      const elapsed = Math.max(0, Date.now() - s.servedAt)
      const timedOut = body.choice_id === null || elapsed > LIMIT + 750
      const ok = !timedOut && body.choice_id === correctKey(s.current)
      const r = timedOut ? LIMIT : Math.min(elapsed, LIMIT)
      const points = ok ? 100 + Math.floor((50 * (LIMIT - r)) / LIMIT) : 0
      const correctId = correctKey(s.current)
      s.answers.push({ index: s.current, is_correct: ok, timed_out: timedOut, points, response_ms: r })
      s.score += points
      s.correct += ok ? 1 : 0
      s.totalMs += r
      s.current += 1
      s.servedAt = Date.now() + FEEDBACK
      const done = s.current > TOTAL
      return json(route, 200, {
        is_correct: ok,
        timed_out: timedOut,
        correct_choice_id: correctId,
        selected_choice_id: timedOut ? null : body.choice_id,
        points,
        score: s.score,
        correct_count: s.correct,
        answered_count: s.answers.length,
        finished: done,
        next_question: done ? null : question(s, FEEDBACK),
      })
    }

    if (!finished) return err(route, 409, 'session_not_finished', 'Oturum henüz tamamlanmadı.')

    if (m[2] === 'result') {
      return json(route, 200, {
        session_id: s.id,
        category: brief,
        score: s.score,
        max_score: 3000,
        correct_count: s.correct,
        total_questions: TOTAL,
        total_time_ms: s.totalMs,
        finished_at: new Date().toISOString(),
        answers: s.answers,
        score_saved: !!s.saved,
        player_name: s.saved?.name ?? null,
        rank: s.saved?.rank ?? null,
      })
    }

    // score
    if (s.saved) return err(route, 409, 'score_already_saved', 'Bu oturumun skoru zaten kaydedildi.')
    const name = String(body.player_name ?? '').trim()
    if (name.length < 2 || name.length > 20 || /[<>]/.test(name))
      return err(route, 400, 'invalid_player_name', 'İsimde yalnızca harf, rakam, boşluk ve - _ . \' kullanılabilir.')
    const entry = {
      id: backend.leaderboard.length + 1,
      player_name: name,
      score: s.score,
      correct_count: s.correct,
      total_time_ms: s.totalMs,
      created_at: new Date().toISOString(),
      slug: s.category.slug,
    }
    backend.leaderboard.push(entry)
    const rank = board(s.category.slug).findIndex((e) => e.id === entry.id) + 1
    s.saved = { id: entry.id, name, rank }
    const top = entries(s.category.slug)
    return json(route, 201, {
      entry: { ...entry, rank, slug: undefined },
      rank,
      in_top: rank <= 10,
      leaderboard: { category: brief, entries: top },
    })
  })

  return backend
}

/** Testlerde kullanılmak üzere bir skor tablosu kaydı ekler. */
export function seedEntry(backend: MockBackend, slug: string, name: string, score: number) {
  backend.leaderboard.push({
    id: backend.leaderboard.length + 1,
    player_name: name,
    score,
    correct_count: Math.round(score / 140),
    total_time_ms: 20000,
    created_at: new Date().toISOString(),
    slug,
  })
}
