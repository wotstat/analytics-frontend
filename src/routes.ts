import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'


const routes = [
  {
    path: '/',
    component: () => import('./pages/Main.vue')
  },
  {
    path: '/session',
    component: () => import('./pages/SessionInfographics.vue')
  }
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
