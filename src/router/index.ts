import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/kategori/:slug',
      name: 'ready',
      component: () => import('@/views/ReadyView.vue'),
      props: true,
    },
    { path: '/oyun', name: 'play', component: () => import('@/views/QuestionView.vue') },
    { path: '/sonuc', name: 'result', component: () => import('@/views/ResultView.vue') },
    {
      path: '/skorlar/:slug?',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      props: true,
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
