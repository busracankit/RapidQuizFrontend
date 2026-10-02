<script setup lang="ts">
import { computed } from 'vue'

import { tr } from '@/i18n/tr'

const props = defineProps<{
  fraction: number
  seconds: number
  level: 'safe' | 'warn' | 'danger'
}>()

const RADIUS = 44
const CIRC = 2 * Math.PI * RADIUS
const dashOffset = computed(() => CIRC * (1 - Math.min(1, Math.max(0, props.fraction))))
const color = computed(
  () => ({ safe: 'var(--color-success)', warn: 'var(--color-warning)', danger: 'var(--color-danger)' })[props.level],
)
</script>

<template>
  <div
    class="relative grid size-24 place-items-center"
    :class="{ 'motion-safe:animate-wiggle': level === 'danger' && seconds > 0 }"
    role="timer"
    :aria-label="tr.question.secondsLeft(seconds)"
    data-testid="countdown"
    :data-level="level"
  >
    <svg viewBox="0 0 100 100" class="absolute inset-0 -rotate-90">
      <circle cx="50" cy="50" :r="RADIUS" fill="var(--color-surface)" stroke="rgb(30 27 75 / 0.08)" stroke-width="9" />
      <circle
        cx="50"
        cy="50"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        stroke-width="9"
        stroke-linecap="round"
        :stroke-dasharray="CIRC"
        :stroke-dashoffset="dashOffset"
        style="transition: stroke-dashoffset 60ms linear, stroke 200ms"
      />
    </svg>
    <span class="relative font-display text-4xl font-bold tabular-nums" aria-hidden="true">{{ seconds }}</span>
  </div>
</template>
