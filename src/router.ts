import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/home.vue')},
    { path: '/auth/callback', name: 'auth-callback', component: () => import('./views/callback.vue')},
  ],
})

export default router
