<script setup lang="ts">
import { computed } from 'vue'

import type { AnswerSummary } from '@/api'

const props = defineProps<{ total: number; answers: AnswerSummary[]; current: number }>()

const segments = computed(() => {
  const byIndex = new Map(props.answers.map((a) => [a.index, a]))
  return Array.from({ length: props.total }, (_, i) => {
    const a = byIndex.get(i + 1)
    if (a) return a.is_correct ? 'correct' : 'wrong'
    return i + 1 === props.current ? 'current' : 'todo'
  })
})
</script>

<template>
  <div class="flex gap-1" role="progressbar" :aria-valuemin="0" :aria-valuemax="total" :aria-valuenow="answers.length">
    <span
      v-for="(s, i) in segments"
      :key="i"
      class="h-2 flex-1 rounded-full transition-colors"
      :class="{
        'bg-success': s === 'correct',
        'bg-danger': s === 'wrong',
        'bg-primary motion-safe:animate-pulse': s === 'current',
        'bg-ink/10': s === 'todo',
      }"
      :data-segment="s"
    />
  </div>
</template>
