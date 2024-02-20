import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'


const routes = [
  {
    path: '/',
    component: () => import('./pages/Main.vue')
  },
  {
    path: '/session',
    component: () => import('./pages/sessionInfographics/Index.vue')
  },
  {
    path: '/damage',
    component: () => import('./pages/damageDistribution/Index.vue')
  }
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return
    return { top: 0 }
  },
})
