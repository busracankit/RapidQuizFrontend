<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api'
import ChoiceButton, { type ChoiceState } from '@/components/ChoiceButton.vue'
import CountdownRing from '@/components/CountdownRing.vue'
import ErrorPanel from '@/components/ErrorPanel.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { useCountdown } from '@/composables/useCountdown'
import { tr } from '@/i18n/tr'
import { isSessionGone, useQuizStore } from '@/stores/quiz'

const LETTERS = ['A', 'B', 'C', 'D']
/** Son soru sonrası geri bildirimin ekranda kalma süresi (sonraki soru olmadığında). */
const FINAL_FEEDBACK_MS = 900

const quiz = useQuizStore()
const router = useRouter()

const error = ref<string | null>(null)
const visible = ref(false) // sorunun sayacı başladı mı (3-2-1 / geri bildirim bitti mi)
const selected = ref<number | null>(null)
let waitTimer: ReturnType<typeof setTimeout> | undefined
let buzzed = false

const countdown = useCountdown({ onExpire: () => choose(null) })

const q = computed(() => quiz.question)
const answer = computed(() => quiz.lastAnswer)
const locked = computed(() => !visible.value || quiz.phase !== 'playing')

function vibrate(ms: number) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(ms)
}

function choiceState(id: number): ChoiceState {
  const a = answer.value
  if (a) {
    if (id === a.correct_choice_id) return a.selected_choice_id === id ? 'correct' : 'reveal'
    if (id === a.selected_choice_id) return 'wrong'
    return 'dimmed'
  }
  if (quiz.phase === 'answering') return id === selected.value ? 'pending' : 'dimmed'
  return 'idle'
}

/** Sorunun sayacı başlayınca (starts_in_ms sonra) soruyu göster ve geri sayımı başlat. */
function showWhenReady() {
  clearTimeout(waitTimer)
  const question = q.value
  if (!question) return
  const wait = quiz.questionStartsAt - performance.now()
  if (wait > 0) {
    visible.value = false
    waitTimer = setTimeout(showWhenReady, wait)
    return
  }
  selected.value = null
  buzzed = false
  visible.value = true
  countdown.start(quiz.timeLimitMs, quiz.remainingFor(question))
}

async function resync() {
  try {
    await quiz.resume()
    if (quiz.phase === 'finished') return router.replace({ name: 'result' })
    showWhenReady()
  } catch (e) {
    error.value = isSessionGone(e) ? tr.errors.sessionLost : e instanceof ApiError ? e.message : tr.errors.generic
  }
}

async function choose(choiceId: number | null) {
  if (locked.value) return
  countdown.stop()
  selected.value = choiceId
  try {
    const res = await quiz.submit(choiceId)
    if (!res.is_correct) vibrate(80)
    clearTimeout(waitTimer)
    // Geri bildirim, sunucunun sonraki soru için tanıdığı süre (starts_in_ms) boyunca gösterilir.
    const wait = res.next_question ? quiz.nextStartsAt() - performance.now() : FINAL_FEEDBACK_MS
    waitTimer = setTimeout(next, Math.max(0, wait))
  } catch (e) {
    if (isSessionGone(e)) {
      error.value = tr.errors.sessionLost
      return
    }
    // question_mismatch, ağ hatası vb.: sunucudaki duruma göre yeniden eşitlen.
    await resync()
  }
}

function next() {
  quiz.advance()
  if (quiz.phase === 'finished') {
    router.replace({ name: 'result' })
    return
  }
  showWhenReady()
}

function onKey(e: KeyboardEvent) {
  if (!q.value || locked.value || e.metaKey || e.ctrlKey || e.altKey) return
  const key = e.key.toUpperCase()
  const index = /^[1-4]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key)
  const choice = index >= 0 ? q.value.choices[index] : undefined
  if (choice) {
    e.preventDefault()
    choose(choice.id)
  }
}

watch(countdown.level, (level) => {
  if (level === 'danger' && countdown.running.value && !buzzed) {
    buzzed = true
    vibrate(30)
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  if (quiz.phase === 'playing' && quiz.question) showWhenReady()
  else await resync()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(waitTimer)
  countdown.stop()
})

const feedbackText = computed(() => {
  const a = answer.value
  if (!a || !q.value) return ''
  if (a.timed_out) return tr.question.timeUp
  if (a.is_correct) return `${tr.question.correct} ${tr.question.points(a.points)}`
  const right = q.value.choices.find((c) => c.id === a.correct_choice_id)
  return `${tr.question.wrong} ${right ? tr.question.correctAnswerWas(right.text) : ''}`
})
</script>

<template>
  <ErrorPanel v-if="error" :message="error" />

  <section v-else-if="q" class="flex flex-1 flex-col pt-4" data-testid="question-view">
    <!-- Üst bilgi: çıkış, ilerleme, puan -->
    <div class="flex items-center justify-between gap-3">
      <RouterLink :to="{ name: 'home' }" class="grid size-10 place-items-center rounded-full bg-surface text-ink-soft ring-1 ring-ink/10" :aria-label="tr.app.home">
        ✕
      </RouterLink>
      <span class="font-display text-lg font-bold tabular-nums" data-testid="progress-text">
        {{ tr.question.progress(q.index, quiz.totalQuestions) }}
      </span>
      <span class="relative min-w-20 rounded-full bg-surface px-3 py-1 text-right font-display font-bold tabular-nums ring-1 ring-ink/10">
        <span class="sr-only">{{ tr.question.score }}: </span>
        <span data-testid="score">{{ quiz.score }}</span>
        <span
          v-if="answer?.is_correct"
          :key="q.index"
          class="pointer-events-none absolute top-1 right-full mr-2 font-display text-lg font-bold text-accent-strong motion-safe:animate-float-up"
          aria-hidden="true"
        >
          {{ tr.question.points(answer.points) }}
        </span>
      </span>
    </div>

    <ProgressBar class="mt-3" :total="quiz.totalQuestions" :answers="quiz.answers" :current="q.index" />

    <div class="mt-6 flex justify-center">
      <CountdownRing
        :fraction="visible ? countdown.fraction.value : 1"
        :seconds="visible ? countdown.seconds.value : Math.round(quiz.timeLimitMs / 1000)"
        :level="visible ? countdown.level.value : 'safe'"
      />
    </div>

    <div class="card mt-5 p-5 sm:p-6" :class="{ invisible: !visible }">
      <h1 class="text-center font-sans text-xl leading-snug font-extrabold sm:text-2xl" data-testid="question-text">
        {{ q.text }}
      </h1>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2" :class="{ 'invisible': !visible }">
      <ChoiceButton
        v-for="(c, i) in q.choices"
        :key="`${q.index}-${c.id}`"
        :letter="LETTERS[i]!"
        :text="c.text"
        :state="choiceState(c.id)"
        :disabled="locked"
        @select="choose(c.id)"
      />
    </div>

    <p
      class="mt-4 min-h-7 text-center text-lg font-bold"
      :class="answer?.is_correct ? 'text-success-strong' : 'text-danger-strong'"
      aria-live="polite"
      data-testid="feedback"
    >
      {{ feedbackText }}
    </p>
  </section>

  <div v-else class="grid flex-1 place-items-center text-ink-soft">…</div>
</template>
