<script setup lang="ts">
import { computed } from 'vue'

import { tr } from '@/i18n/tr'

export type ChoiceState = 'idle' | 'pending' | 'correct' | 'wrong' | 'reveal' | 'dimmed'

const props = defineProps<{
  letter: string
  text: string
  state: ChoiceState
  disabled?: boolean
}>()
defineEmits<{ select: [] }>()

const classes = computed(
  () =>
    ({
      idle: 'bg-surface ring-ink/10 hover:ring-primary hover:-translate-y-0.5',
      pending: 'bg-primary/10 ring-primary',
      correct: 'bg-success-soft ring-success-strong motion-safe:animate-pop',
      wrong: 'bg-danger-soft ring-danger-strong motion-safe:animate-shake',
      reveal: 'bg-success-soft ring-success-strong motion-safe:animate-blink',
      dimmed: 'bg-surface ring-ink/5 opacity-55',
    })[props.state],
)
const badge = computed(
  () =>
    ({
      idle: 'bg-primary text-white',
      pending: 'bg-primary text-white',
      correct: 'bg-success-strong text-white',
      wrong: 'bg-danger-strong text-white',
      reveal: 'bg-success-strong text-white',
      dimmed: 'bg-ink/10 text-ink-soft',
    })[props.state],
)
</script>

<template>
  <button
    type="button"
    class="flex min-h-14 w-full items-center gap-3 rounded-btn px-3 py-3 text-left text-base font-semibold ring-2 transition sm:text-lg"
    :class="classes"
    :disabled="disabled"
    :aria-label="tr.question.choiceLabel(letter, text)"
    :data-state="state"
    @click="$emit('select')"
  >
    <span class="grid size-9 shrink-0 place-items-center rounded-xl font-display text-base font-bold" :class="badge" aria-hidden="true">
      <template v-if="state === 'correct' || state === 'reveal'">✓</template>
      <template v-else-if="state === 'wrong'">✕</template>
      <template v-else>{{ letter }}</template>
    </span>
    <span class="flex-1">{{ text }}</span>
  </button>
</template>
