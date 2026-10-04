<script setup lang="ts">
import { RouterLink } from 'vue-router'

import CategoryIcon from './CategoryIcon.vue'
import type { Category } from '@/api'
import { tr } from '@/i18n/tr'

defineProps<{ category: Category }>()
</script>

<template>
  <RouterLink
    :to="{ name: 'ready', params: { slug: category.slug } }"
    class="card group relative flex items-center gap-4 overflow-hidden p-4 transition hover:-translate-y-0.5 sm:p-5"
    :style="{ '--cat': category.color, boxShadow: `0 12px 28px -14px ${category.color}66` }"
    :data-testid="`category-${category.slug}`"
  >
    <span
      class="absolute inset-y-0 left-0 w-1.5 bg-(--cat)"
      aria-hidden="true"
    />
    <span
      class="grid size-14 shrink-0 place-items-center rounded-2xl text-white transition group-hover:scale-105 group-hover:rotate-3"
      :style="{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }"
    >
      <CategoryIcon :name="category.icon ?? ''" class="size-8" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-display text-lg font-bold leading-tight">{{ category.name }}</span>
      <span class="mt-0.5 block text-sm text-ink-soft">{{ category.description }}</span>
    </span>
    <span class="hidden shrink-0 rounded-full bg-ink/5 px-3 py-1 text-sm font-bold text-ink lg:inline group-hover:bg-(--cat)/15">
      {{ tr.home.play }} →
    </span>
  </RouterLink>
</template>
