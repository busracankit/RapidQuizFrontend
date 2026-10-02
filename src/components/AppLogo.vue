<script setup lang="ts">
withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <span class="inline-flex items-center gap-2 font-display font-bold" :class="size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-xl'">
    <span
      class="grid place-items-center rounded-xl bg-primary text-accent shadow-[0_6px_16px_-6px_rgb(124_58_237/0.7)]"
      :class="size === 'lg' ? 'size-14' : 'size-9'"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" :class="size === 'lg' ? 'size-9' : 'size-6'" fill="currentColor">
        <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z" />
      </svg>
    </span>
    <span><span class="text-accent-strong">Rapid</span> <span class="text-ink">Quiz</span></span>
  </span>
</template>
