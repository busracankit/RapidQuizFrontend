import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError } from '@/api'
import { sessionStore, useQuizStore } from '@/stores/quiz'

import { category, makeAnswer, makeStart, makeState } from './fixtures'

vi.mock('@/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/api')>()
  return {
    ...mod,
    api: {
      categories: vi.fn(),
      startSession: vi.fn(),
      current: vi.fn(),
      answer: vi.fn(),
      result: vi.fn(),
      saveScore: vi.fn(),
      leaderboard: vi.fn(),
    },
  }
})

const mocked = vi.mocked(api)

describe('quiz store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('start() opens a session, stores token in sessionStorage and schedules the first question', async () => {
    mocked.startSession.mockResolvedValue(makeStart())
    const quiz = useQuizStore()
    const before = performance.now()

    await quiz.start('yazilim')

    expect(mocked.startSession).toHaveBeenCalledWith('yazilim', 'web')
    expect(quiz.phase).toBe('ready')
    expect(quiz.question?.index).toBe(1)
    expect(quiz.questionStartsAt).toBeGreaterThanOrEqual(before + 3000)
    expect(sessionStore.load()).toEqual({ id: 'sess-1', token: 'tok_abc', category })
  })

  it('submit() records the answer and keeps the next question until advance()', async () => {
    mocked.startSession.mockResolvedValue(makeStart())
    mocked.answer.mockResolvedValue(makeAnswer())
    const quiz = useQuizStore()
    await quiz.start('yazilim')
    quiz.phase = 'playing'

    const res = await quiz.submit(2)

    expect(mocked.answer).toHaveBeenCalledWith('sess-1', 'tok_abc', 101, 2)
    expect(res.points).toBe(132)
    expect(quiz.phase).toBe('feedback')
    expect(quiz.score).toBe(132)
    expect(quiz.answers).toEqual([
      { index: 1, is_correct: true, timed_out: false, points: 132, response_ms: 0 },
    ])
    expect(quiz.question?.index).toBe(1)

    quiz.advance()
    expect(quiz.question?.index).toBe(2)
    expect(quiz.lastAnswer).toBeNull()
    expect(quiz.phase).toBe('playing')
  })

  it('advance() does not wait the feedback delay a second time', async () => {
    vi.useFakeTimers({ toFake: ['performance'] })
    try {
      mocked.startSession.mockResolvedValue(makeStart())
      mocked.answer.mockResolvedValue(makeAnswer()) // next_question.starts_in_ms = 800
      const quiz = useQuizStore()
      await quiz.start('yazilim')
      quiz.phase = 'playing'

      await quiz.submit(2)
      const startsAt = quiz.nextStartsAt()
      vi.advanceTimersByTime(800) // istemci geri bildirimi gösterdi
      quiz.advance()

      expect(quiz.questionStartsAt).toBe(startsAt)
      expect(quiz.remainingFor(quiz.question!)).toBe(5000)
      vi.advanceTimersByTime(1000)
      expect(quiz.remainingFor(quiz.question!)).toBe(4000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('submit(null) sends a timeout', async () => {
    mocked.startSession.mockResolvedValue(makeStart())
    mocked.answer.mockResolvedValue(makeAnswer({ is_correct: false, timed_out: true, points: 0 }))
    const quiz = useQuizStore()
    await quiz.start('yazilim')
    quiz.phase = 'playing'
    await quiz.submit(null)
    expect(mocked.answer).toHaveBeenCalledWith('sess-1', 'tok_abc', 101, null)
    expect(quiz.answers[0]?.timed_out).toBe(true)
  })

  it('cannot answer twice while a request is in flight', async () => {
    mocked.startSession.mockResolvedValue(makeStart())
    mocked.answer.mockResolvedValue(makeAnswer())
    const quiz = useQuizStore()
    await quiz.start('yazilim')
    quiz.phase = 'playing'
    const first = quiz.submit(1)
    await expect(quiz.submit(2)).rejects.toThrow()
    await first
    expect(mocked.answer).toHaveBeenCalledTimes(1)
  })

  it('advance() after the last question finishes the game', async () => {
    mocked.startSession.mockResolvedValue(makeStart())
    mocked.answer.mockResolvedValue(makeAnswer({ finished: true, next_question: null }))
    const quiz = useQuizStore()
    await quiz.start('yazilim')
    quiz.phase = 'playing'
    await quiz.submit(1)
    quiz.advance()
    expect(quiz.phase).toBe('finished')
    expect(quiz.question).toBeNull()
  })

  it('resume() restores a session from sessionStorage after a refresh', async () => {
    sessionStore.save({ id: 'sess-1', token: 'tok_abc', category })
    mocked.current.mockResolvedValue(makeState())
    const quiz = useQuizStore()

    expect(await quiz.resume()).toBe(true)

    expect(mocked.current).toHaveBeenCalledWith('sess-1', 'tok_abc')
    expect(quiz.phase).toBe('playing')
    expect(quiz.question?.index).toBe(2)
    expect(quiz.score).toBe(140)
    expect(quiz.remainingFor(quiz.question!)).toBeLessThanOrEqual(3200)
  })

  it('resume() without a saved session returns false', async () => {
    expect(await useQuizStore().resume()).toBe(false)
  })

  it('resume() clears an expired session', async () => {
    sessionStore.save({ id: 'sess-1', token: 'tok_abc', category })
    mocked.current.mockRejectedValue(new ApiError('session_expired', 'Süre doldu', 410))
    const quiz = useQuizStore()
    await expect(quiz.resume()).rejects.toBeInstanceOf(ApiError)
    expect(sessionStore.load()).toBeNull()
    expect(quiz.hasSession).toBe(false)
  })

  it('saveScore() marks the result as saved', async () => {
    sessionStore.save({ id: 'sess-1', token: 'tok_abc', category })
    mocked.result.mockResolvedValue({
      session_id: 'sess-1',
      category,
      score: 2000,
      max_score: 3000,
      correct_count: 15,
      total_questions: 20,
      total_time_ms: 30000,
      finished_at: '2026-10-01T12:03:00Z',
      answers: [],
      score_saved: false,
      player_name: null,
      rank: null,
    })
    mocked.saveScore.mockResolvedValue({
      entry: {
        id: 7,
        rank: 3,
        player_name: 'Ayşe',
        score: 2000,
        correct_count: 15,
        total_time_ms: 30000,
        created_at: '2026-10-01T12:03:10Z',
      },
      rank: 3,
      in_top: true,
      leaderboard: { category, entries: [] },
    })
    const quiz = useQuizStore()
    await quiz.loadResult()
    await quiz.saveScore('Ayşe')
    expect(mocked.saveScore).toHaveBeenCalledWith('sess-1', 'tok_abc', 'Ayşe')
    expect(quiz.result).toMatchObject({ score_saved: true, player_name: 'Ayşe', rank: 3 })
  })
})
