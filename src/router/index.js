import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../pages/landing'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../pages/time-series')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
