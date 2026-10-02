<script setup lang="ts">
import type { LeaderboardEntry } from '@/api'
import { tr } from '@/i18n/tr'

defineProps<{ entries: LeaderboardEntry[]; highlightId?: number | null }>()

// Görsel sıra: 2. – 1. – 3.
const order = [1, 0, 2]
const medal = ['bg-gold', 'bg-silver', 'bg-bronze']
const height = ['h-28', 'h-20', 'h-16']
</script>

<template>
  <ol class="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="İlk üç">
    <template v-for="pos in order" :key="pos">
      <li v-if="entries[pos]" class="flex flex-col items-center text-center" :style="{ order: order.indexOf(pos) }">
        <span class="mb-1 max-w-full truncate px-1 text-sm font-bold sm:text-base" :class="{ 'text-accent-strong': entries[pos]!.id === highlightId }">
          {{ entries[pos]!.player_name }}
          <span v-if="entries[pos]!.id === highlightId" class="block text-xs">({{ tr.leaderboard.you }})</span>
        </span>
        <span class="mb-2 font-display text-lg font-bold tabular-nums">{{ entries[pos]!.score }}</span>
        <span
          class="grid w-full place-items-start justify-center rounded-t-2xl pt-2 font-display text-2xl font-bold text-ink shadow-inner"
          :class="[medal[pos], height[pos], entries[pos]!.id === highlightId ? 'ring-4 ring-inset ring-accent' : '']"
          :data-testid="`podium-${pos + 1}`"
        >
          {{ pos + 1 }}
        </span>
      </li>
      <li v-else :style="{ order: order.indexOf(pos) }" aria-hidden="true" />
    </template>
  </ol>
</template>
