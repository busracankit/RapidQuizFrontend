<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { api, ApiError, type Category } from '@/api'
import AppLogo from '@/components/AppLogo.vue'
import CategoryCard from '@/components/CategoryCard.vue'
import ErrorPanel from '@/components/ErrorPanel.vue'
import { tr } from '@/i18n/tr'

const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    categories.value = await api.categories()
  } catch (e) {
    error.value = e instanceof ApiError && e.code === 'network_error' ? e.message : tr.home.loadError
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="pt-8 pb-6 text-center sm:pt-12">
    <h1 class="sr-only">{{ tr.app.name }}</h1>
    <AppLogo size="lg" />
    <p class="mx-auto mt-3 max-w-sm text-lg text-ink-soft">{{ tr.app.slogan }}</p>
  </section>

  <section aria-labelledby="pick">
    <h2 id="pick" class="mb-3 text-xl">{{ tr.home.pickCategory }}</h2>

    <ErrorPanel v-if="error" :message="error" retry @retry="load" />

    <ul v-else class="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <template v-if="loading">
        <li v-for="i in 5" :key="i" class="card h-[88px] animate-pulse bg-surface/60" aria-hidden="true" />
      </template>
      <li v-for="c in categories" v-else :key="c.slug">
        <CategoryCard :category="c" />
      </li>
    </ul>

    <div class="mt-6 text-center">
      <RouterLink :to="{ name: 'leaderboard' }" class="btn-ghost">🏆 {{ tr.app.leaderboard }}</RouterLink>
    </div>
  </section>
</template>
