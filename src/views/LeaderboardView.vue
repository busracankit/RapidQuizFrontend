<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { api, type Category, type Leaderboard } from '@/api'
import ErrorPanel from '@/components/ErrorPanel.vue'
import Podium from '@/components/Podium.vue'
import { tr } from '@/i18n/tr'

const props = defineProps<{ slug?: string }>()
const route = useRoute()

const categories = ref<Category[]>([])
const board = ref<Leaderboard | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const active = computed(() => props.slug || categories.value[0]?.slug)
const highlightId = computed(() => Number(route.query.vurgu) || null)
const myRank = computed(() => Number(route.query.sira) || null)
const fromGame = computed(() => !!route.query.vurgu || !!route.query.sira)
const highlightInList = computed(() => board.value?.entries.some((e) => e.id === highlightId.value))
const rest = computed(() => board.value?.entries.slice(3) ?? [])

async function loadBoard() {
  if (!active.value) return
  loading.value = true
  error.value = null
  try {
    board.value = await api.leaderboard(active.value)
  } catch {
    error.value = tr.leaderboard.loadError
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = await api.categories()
  } catch {
    error.value = tr.leaderboard.loadError
    loading.value = false
    return
  }
  await loadBoard()
})
watch(active, loadBoard)
</script>

<template>
  <section class="py-2">
    <h1 class="text-3xl">{{ tr.leaderboard.title }}</h1>

    <nav class="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2" :aria-label="tr.leaderboard.title">
      <RouterLink
        v-for="c in categories"
        :key="c.slug"
        :to="{ name: 'leaderboard', params: { slug: c.slug }, query: c.slug === active ? route.query : {} }"
        replace
        class="shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ring-2 transition"
        :class="c.slug === active ? 'bg-ink text-white ring-ink' : 'bg-surface text-ink ring-ink/10 hover:ring-ink/30'"
        :aria-current="c.slug === active ? 'page' : undefined"
      >
        <span class="mr-1.5 inline-block size-2 rounded-full align-middle" :style="{ background: c.color }" aria-hidden="true" />
        {{ c.name }}
      </RouterLink>
    </nav>

    <ErrorPanel v-if="error" :message="error" retry @retry="loadBoard" />

    <div v-else-if="loading && !board" class="card mt-4 h-64 animate-pulse" aria-hidden="true" />

    <template v-else-if="board">
      <p v-if="board.entries.length === 0" class="card mt-4 p-8 text-center text-lg" data-testid="leaderboard-empty">
        {{ tr.leaderboard.empty }}
      </p>

      <template v-else>
        <div class="card mt-4 px-4 pt-6 sm:px-8">
          <Podium :entries="board.entries.slice(0, 3)" :highlight-id="highlightId" />
        </div>

        <ol v-if="rest.length" class="mt-3 space-y-2" :start="4" data-testid="leaderboard-list">
          <li
            v-for="e in rest"
            :key="e.id"
            class="card flex items-center gap-3 px-4 py-3"
            :class="{ 'ring-3 ring-accent': e.id === highlightId }"
            :data-highlight="e.id === highlightId || undefined"
          >
            <span class="w-7 font-display text-lg font-bold text-ink-soft tabular-nums">{{ e.rank }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold">
              {{ e.player_name }}
              <span v-if="e.id === highlightId" class="text-sm text-accent-strong">({{ tr.leaderboard.you }})</span>
            </span>
            <span class="hidden text-sm text-ink-soft sm:inline">{{ tr.leaderboard.correct(e.correct_count) }}</span>
            <span class="font-display font-bold tabular-nums">{{ e.score }}</span>
          </li>
        </ol>
      </template>

      <p
        v-if="myRank && !highlightInList"
        class="card mt-3 p-4 text-center font-bold text-accent-strong ring-3 ring-accent"
        data-testid="my-rank"
      >
        {{ tr.leaderboard.yourRank(myRank) }}
      </p>

      <div v-if="fromGame" class="mt-6 flex flex-wrap justify-center gap-3">
        <RouterLink :to="{ name: 'ready', params: { slug: active } }" class="btn-primary">{{ tr.result.playAgain }}</RouterLink>
        <RouterLink :to="{ name: 'home' }" class="btn-ghost">{{ tr.result.otherCategory }}</RouterLink>
      </div>
    </template>
  </section>
</template>
