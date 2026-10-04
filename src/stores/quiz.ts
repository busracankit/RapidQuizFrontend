import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api, ApiError } from '@/api'
import type {
  AnswerResult,
  AnswerSummary,
  CategoryBrief,
  ClientType,
  Question,
  Result,
  ScoreResult,
  SessionState,
} from '@/api'

const STORAGE_KEY = 'rapidquiz.session'

interface SavedSession {
  id: string
  token: string
  category: CategoryBrief
}

export type Phase = 'idle' | 'ready' | 'playing' | 'answering' | 'feedback' | 'finished'

/** Oturumu sekme kapanana kadar saklar (sayfa yenilemede oyuna devam için). */
export const sessionStore = {
  load(): SavedSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SavedSession) : null
    } catch {
      return null
    }
  },
  save(s: SavedSession) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* gizli mod vb. — yenilemede devam edilemez ama oyun oynanır */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* yoksay */
    }
  },
}

/** Oturumun artık kullanılamadığını gösteren API hataları. */
export function isSessionGone(e: unknown): boolean {
  return (
    e instanceof ApiError &&
    ['session_not_found', 'invalid_session_token', 'session_expired'].includes(e.code)
  )
}

function clientType(): ClientType {
  return 'web'
}

export const useQuizStore = defineStore('quiz', () => {
  const sessionId = ref<string | null>(null)
  const token = ref<string | null>(null)
  const category = ref<CategoryBrief | null>(null)
  const totalQuestions = ref(20)
  const timeLimitMs = ref(5000)

  const question = ref<Question | null>(null)
  /** Sorunun sayacının istemci saatine göre başlayacağı an (performance.now()). */
  const questionStartsAt = ref(0)
  const nextQuestion = ref<Question | null>(null)
  /** Sonraki sorunun sayacının başlayacağı an; cevap yanıtı alındığında bir kez hesaplanır. */
  const nextQuestionStartsAt = ref(0)
  const lastAnswer = ref<AnswerResult | null>(null)
  const answers = ref<AnswerSummary[]>([])
  const score = ref(0)
  const correctCount = ref(0)
  const phase = ref<Phase>('idle')
  const result = ref<Result | null>(null)

  const hasSession = computed(() => !!sessionId.value && !!token.value)
  const answeredCount = computed(() => answers.value.length)

  function reset() {
    sessionId.value = null
    token.value = null
    category.value = null
    question.value = null
    nextQuestion.value = null
    lastAnswer.value = null
    answers.value = []
    score.value = 0
    correctCount.value = 0
    phase.value = 'idle'
    result.value = null
  }

  /** `starts_in_ms` yanıtın alındığı ana göredir; bu yüzden başlangıç anı yalnızca alındığında hesaplanır. */
  function setQuestion(q: Question | null, startsAt?: number) {
    question.value = q
    questionStartsAt.value = q ? (startsAt ?? performance.now() + q.starts_in_ms) : 0
  }

  /** Kalan süre (istemci saatiyle), sayaç henüz başlamadıysa tam süre. */
  function remainingFor(q: Question, startsAt = questionStartsAt.value): number {
    const elapsed = Math.max(0, performance.now() - startsAt)
    return Math.max(0, q.remaining_ms - elapsed)
  }

  function applyState(state: SessionState) {
    category.value = state.category
    totalQuestions.value = state.total_questions
    timeLimitMs.value = state.time_limit_ms
    score.value = state.score
    correctCount.value = state.correct_count
    answers.value = state.answers
    setQuestion(state.question)
    nextQuestion.value = null
    lastAnswer.value = null
    phase.value = state.finished ? 'finished' : 'playing'
  }

  async function start(slug: string) {
    reset()
    const data = await api.startSession(slug, clientType())
    sessionId.value = data.session_id
    token.value = data.session_token
    category.value = data.category
    totalQuestions.value = data.total_questions
    timeLimitMs.value = data.time_limit_ms
    setQuestion(data.question)
    phase.value = 'ready'
    sessionStore.save({ id: data.session_id, token: data.session_token, category: data.category })
    return data
  }

  /** Kaydedilmiş oturumu sunucudan yükler. Oturum yoksa `false`. */
  async function resume(): Promise<boolean> {
    if (!hasSession.value) {
      const saved = sessionStore.load()
      if (!saved) return false
      sessionId.value = saved.id
      token.value = saved.token
      category.value = saved.category
    }
    try {
      applyState(await api.current(sessionId.value!, token.value!))
      return true
    } catch (e) {
      if (isSessionGone(e)) {
        sessionStore.clear()
        reset()
      }
      throw e
    }
  }

  /** Cevabı gönderir. `choiceId = null` → süre doldu. */
  async function submit(choiceId: number | null): Promise<AnswerResult> {
    if (!question.value || !sessionId.value || !token.value) throw new Error('Aktif soru yok')
    if (phase.value !== 'playing') throw new Error('Şu an cevap verilemez')
    phase.value = 'answering'
    const q = question.value
    try {
      const res = await api.answer(sessionId.value, token.value, q.id, choiceId)
      lastAnswer.value = res
      score.value = res.score
      correctCount.value = res.correct_count
      answers.value = [
        ...answers.value.filter((a) => a.index !== q.index),
        {
          index: q.index,
          is_correct: res.is_correct,
          timed_out: res.timed_out,
          points: res.points,
          response_ms: 0,
        },
      ]
      nextQuestion.value = res.next_question
      nextQuestionStartsAt.value = res.next_question
        ? performance.now() + res.next_question.starts_in_ms
        : 0
      phase.value = 'feedback'
      return res
    } catch (e) {
      phase.value = 'playing'
      throw e
    }
  }

  /** Geri bildirimden sonra sıradaki soruya geçer (ya da oyunu bitirir). */
  function advance() {
    lastAnswer.value = null
    if (nextQuestion.value) {
      // Geri bildirim süresi zaten beklendi; sayaç sunucudaki served_at ile aynı anda başlar.
      setQuestion(nextQuestion.value, nextQuestionStartsAt.value)
      nextQuestion.value = null
      phase.value = 'playing'
    } else {
      setQuestion(null)
      phase.value = 'finished'
    }
  }

  /** Bir sonraki sorunun sayacının başlayacağı an (geri bildirim süresi). */
  function nextStartsAt(): number {
    return nextQuestion.value ? nextQuestionStartsAt.value : performance.now()
  }

  async function loadResult(): Promise<Result> {
    if (!hasSession.value) {
      const saved = sessionStore.load()
      if (!saved) throw new ApiError('session_not_found', '', 404)
      sessionId.value = saved.id
      token.value = saved.token
      category.value = saved.category
    }
    result.value = await api.result(sessionId.value!, token.value!)
    category.value = result.value.category
    phase.value = 'finished'
    return result.value
  }

  async function saveScore(name: string): Promise<ScoreResult> {
    const saved = await api.saveScore(sessionId.value!, token.value!, name)
    if (result.value) {
      result.value = {
        ...result.value,
        score_saved: true,
        player_name: saved.entry.player_name,
        rank: saved.rank,
      }
    }
    return saved
  }

  return {
    sessionId,
    token,
    category,
    totalQuestions,
    timeLimitMs,
    question,
    questionStartsAt,
    nextQuestion,
    lastAnswer,
    answers,
    score,
    correctCount,
    phase,
    result,
    hasSession,
    answeredCount,
    reset,
    start,
    resume,
    submit,
    advance,
    nextStartsAt,
    remainingFor,
    loadResult,
    saveScore,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useQuizStore, import.meta.hot))
