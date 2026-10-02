<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { tr } from '@/i18n/tr'

defineProps<{ message: string; retry?: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="card mx-auto mt-10 max-w-md p-6 text-center" role="alert">
    <p class="text-lg font-semibold">{{ message }}</p>
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      <button v-if="retry" type="button" class="btn-primary" @click="$emit('retry')">{{ tr.home.retry }}</button>
      <RouterLink :to="{ name: 'home' }" class="btn-ghost">{{ tr.errors.backHome }}</RouterLink>
    </div>
  </div>
</template>
