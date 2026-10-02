<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppLogo from './AppLogo.vue'
import { tr } from '@/i18n/tr'
</script>

<template>
  <header class="flex items-center justify-between py-4">
    <RouterLink :to="{ name: 'home' }" :aria-label="tr.app.home" class="rounded-btn">
      <AppLogo />
    </RouterLink>
    <RouterLink :to="{ name: 'leaderboard' }" class="btn-ghost min-h-10 px-4 text-sm">
      <svg viewBox="0 0 24 24" class="size-5 text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
      </svg>
      {{ tr.app.leaderboard }}
    </RouterLink>
  </header>
</template>
