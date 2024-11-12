import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../Game.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Game',
      component: GameView,
    },
    {
      path: '/debug',
      name: 'Debug',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../Debug.vue'),
    },
  ],
})

export default router
