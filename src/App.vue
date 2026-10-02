<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
// Ana sayfanın kendi büyük logosu var; oyun ekranında da dikkat dağıtmamak için üst menü gizlenir.
const showHeader = computed(() => route.name !== 'play' && route.name !== 'home')
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-8 sm:px-6">
    <AppHeader v-if="showHeader" />
    <main class="flex flex-1 flex-col">
      <RouterView />
    </main>
  </div>
</template>
