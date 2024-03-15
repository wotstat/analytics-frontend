import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'


const routes = [
  {
    path: '/',
    component: () => import('./pages/Main.vue')
  },
  {
    path: '/session',
    component: () => import('./pages/sessionInfographics/Index.vue'),
    children: [
      {
        path: '',
        component: () => import('./pages/sessionInfographics/Battle.vue')
      },
      {
        path: 'shots',
        component: () => import('./pages/sessionInfographics/Shots.vue')
      },
      {
        path: 'damage',
        component: () => import('./pages/sessionInfographics/Damage.vue')
      },
      {
        path: 'results',
        component: () => import('./pages/sessionInfographics/Results.vue')
      },
      {
        path: 'maps',
        component: () => import('./pages/sessionInfographics/Maps.vue')
      },
      {
        path: 'players',
        component: () => import('./pages/sessionInfographics/Coverage.vue')
      },
      {
        path: 'old-layout',
        component: () => import('./pages/sessionInfographics/Old.vue')
      },
      {
        path: 'distribution',
        component: () => import('./pages/damageDistribution/Content.vue')
      }
    ]
  },
  {
    path: '/damage',
    component: () => import('./pages/damageDistribution/Index.vue')
  },
  {
    path: '/map',
    component: () => import('./pages/map/Index.vue')
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
