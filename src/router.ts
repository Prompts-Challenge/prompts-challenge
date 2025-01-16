import { createRouter, createWebHistory } from 'vue-router'
import { isGithubLoggedIn } from './auth/login'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: () => import('./views/home.vue')
    },
    { 
      path: '/auth/callback', 
      name: 'auth-callback', 
      component: () => import('./views/callback.vue')
    },
    { 
      path: '/question/:id', 
      component: () => import('./views/question.vue'),
      props: true,
      beforeEnter: (_, __, next) => {
        if (!isGithubLoggedIn()) {
          next('/')
        } else {
          next()
        }
      }
    },
  ],
})

export default router
