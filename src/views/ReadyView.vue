<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api'
import ErrorPanel from '@/components/ErrorPanel.vue'
import { tr } from '@/i18n/tr'
import { useQuizStore } from '@/stores/quiz'

const props = defineProps<{ slug: string }>()
const quiz = useQuizStore()
const router = useRouter()

const error = ref<string | null>(null)
const countdown = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const accent = computed(() => quiz.category?.color ?? 'var(--color-primary)')

function tick() {
  const left = quiz.questionStartsAt - performance.now()
  if (left <= 0) {
    clearInterval(timer)
    router.replace({ name: 'play' })
    return
  }
  countdown.value = Math.ceil(left / 1000)
}

async function begin() {
  error.value = null
  countdown.value = null
  try {
    await quiz.start(props.slug)
    tick()
    timer = setInterval(tick, 100)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : tr.errors.generic
  }
}

onMounted(begin)
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <ErrorPanel v-if="error" :message="error" retry @retry="begin" />

  <section v-else class="flex flex-1 flex-col items-center justify-center py-6 text-center">
    <p class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
      <span class="size-2.5 rounded-full" :style="{ background: accent }" aria-hidden="true" />
      {{ tr.ready.getReady }}
    </p>
    <h1 class="mt-1 text-3xl sm:text-4xl">{{ quiz.category?.name ?? '…' }}</h1>

    <ul class="card mt-6 w-full max-w-md space-y-3 p-5 text-left">
      <li v-for="rule in tr.ready.rules" :key="rule" class="flex gap-3">
        <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-sm text-primary" aria-hidden="true">⚡</span>
        <span>{{ rule }}</span>
      </li>
    </ul>

    <div class="mt-8 grid h-32 place-items-center" aria-live="assertive">
      <span
        v-if="countdown"
        :key="countdown"
        class="grid size-28 place-items-center rounded-full font-display text-6xl font-bold text-ink motion-safe:animate-count"
        :style="{ background: accent }"
        data-testid="ready-countdown"
      >
        {{ countdown }}
      </span>
      <span v-else class="text-ink-soft">{{ tr.ready.starting }}</span>
    </div>

    <p class="mt-4 hidden text-sm text-ink-soft sm:block">{{ tr.ready.keyboardHint }}</p>
  </section>
</template>
