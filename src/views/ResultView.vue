<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api'
import ErrorPanel from '@/components/ErrorPanel.vue'
import { useCountUp } from '@/composables/useCountUp'
import { tr } from '@/i18n/tr'
import { isSessionGone, useQuizStore } from '@/stores/quiz'

const quiz = useQuizStore()
const router = useRouter()
const counter = useCountUp()

const error = ref<string | null>(null)
const name = ref('')
const nameError = ref<string | null>(null)
const saving = ref(false)

const result = computed(() => quiz.result)
const slug = computed(() => result.value?.category.slug ?? quiz.category?.slug)

onMounted(async () => {
  try {
    const r = await quiz.loadResult()
    counter.run(r.score)
  } catch (e) {
    error.value = isSessionGone(e) ? tr.errors.sessionLost : e instanceof ApiError ? e.message : tr.errors.generic
  }
})

async function save() {
  nameError.value = null
  const trimmed = name.value.trim()
  if (trimmed.length < 2) {
    nameError.value = tr.result.nameTooShort
    return
  }
  saving.value = true
  try {
    const saved = await quiz.saveScore(trimmed)
    await router.push({
      name: 'leaderboard',
      params: { slug: slug.value },
      query: { vurgu: String(saved.entry.id), sira: String(saved.rank) },
    })
  } catch (e) {
    nameError.value = e instanceof ApiError ? e.message : tr.errors.generic
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ErrorPanel v-if="error" :message="error" />

  <section v-else-if="result" class="flex flex-col items-center py-4 text-center">
    <h1 class="text-3xl sm:text-4xl">{{ tr.result.title }}</h1>
    <p class="mt-1 inline-flex items-center gap-2 text-ink-soft">
      <span class="size-2.5 rounded-full" :style="{ background: result.category.color }" aria-hidden="true" />
      {{ result.category.name }}
    </p>

    <div class="card mt-6 w-full max-w-md p-6">
      <p class="text-sm font-bold uppercase tracking-widest text-ink-soft">{{ tr.result.score }}</p>
      <p class="font-display text-6xl font-bold text-accent-strong tabular-nums" data-testid="result-score" :aria-label="`${result.score}`">
        {{ counter.value.value }}
      </p>
      <p class="text-sm text-ink-soft">/ {{ result.max_score }}</p>

      <dl class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-btn bg-success-soft p-3">
          <dt class="text-sm text-ink-soft">{{ tr.result.correct }}</dt>
          <dd class="font-display text-2xl font-bold" data-testid="result-correct">
            {{ tr.result.of(result.correct_count, result.total_questions) }}
          </dd>
        </div>
        <div class="rounded-btn bg-primary/10 p-3">
          <dt class="text-sm text-ink-soft">{{ tr.result.time }}</dt>
          <dd class="font-display text-2xl font-bold">{{ tr.result.seconds(result.total_time_ms) }}</dd>
        </div>
      </dl>
    </div>

    <form v-if="!result.score_saved" class="card mt-4 w-full max-w-md p-5 text-left" novalidate @submit.prevent="save">
      <label for="player-name" class="font-bold">{{ tr.result.namePrompt }}</label>
      <div class="mt-2 flex gap-2">
        <input
          id="player-name"
          v-model="name"
          type="text"
          maxlength="20"
          autocomplete="nickname"
          :placeholder="tr.result.namePlaceholder"
          class="min-h-12 min-w-0 flex-1 rounded-btn bg-bg px-4 text-base ring-2 ring-ink/10 outline-none focus:ring-primary"
          :aria-invalid="!!nameError"
          aria-describedby="name-error"
        />
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? tr.result.saving : tr.result.save }}
        </button>
      </div>
      <p id="name-error" class="mt-2 min-h-5 text-sm font-semibold text-danger-strong" role="alert">{{ nameError }}</p>
    </form>

    <div v-else class="card mt-4 w-full max-w-md p-5">
      <p>{{ tr.result.alreadySaved(result.player_name ?? '') }}</p>
      <RouterLink
        class="btn-ghost mt-3"
        :to="{ name: 'leaderboard', params: { slug }, query: { sira: result.rank ? String(result.rank) : undefined } }"
      >
        {{ tr.result.seeLeaderboard }}
      </RouterLink>
    </div>

    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <RouterLink :to="{ name: 'ready', params: { slug } }" class="btn-primary">{{ tr.result.playAgain }}</RouterLink>
      <RouterLink :to="{ name: 'home' }" class="btn-ghost">{{ tr.result.otherCategory }}</RouterLink>
    </div>
  </section>

  <div v-else class="grid flex-1 place-items-center text-ink-soft">…</div>
</template>
