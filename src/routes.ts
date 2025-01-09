import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

import infographics from './pages/infographics/Index.vue'
import Battle from './pages/infographics/pages/Battle.vue'
import Shots from './pages/infographics/pages/shots/Shots.vue'
import Damage from './pages/infographics/pages/Damage.vue'
import Results from './pages/infographics/pages/Results.vue'
import Maps from './pages/infographics/pages/Maps.vue'
import Coverage from './pages/infographics/pages/Coverage.vue'
import Distribution from './pages/services/damageDistribution/Content.vue'
import Lootbox from './pages/infographics/pages/lootbox/Index.vue'
import Widgets from './pages/widgets/Index.vue'
import FixedMatchDetect from "./pages/services/fixedMatchDetect/Index.vue";



const routes = [
  {
    path: '/',
    component: () => import('./pages/Main.vue')
  },
  {
    path: '/session',
    component: infographics,
    children: [
      { path: '', component: Battle },
      { path: 'shots', component: Shots },
      { path: 'damage', component: Damage },
      { path: 'results', component: Results },
      { path: 'maps', component: Maps },
      { path: 'players', component: Coverage },
      { path: 'chuck-norris-tournament', component: () => import('./pages/infographics/pages/Chuck.vue') },
      { path: 'distribution', component: Distribution },
      { path: 'lootbox', component: Lootbox, meta: { hideTankList: true } },
      { path: 'widgets/:widget*', component: Widgets, meta: { hideTankList: true, customTitle: 'Виджеты' } },
    ]
  },
  {
    path: '/replays',
    component: () => import('./pages/replays/Index.vue'),
    children: [
      { path: '', component: () => import('./pages/replays/search/Index.vue') },
      { path: 'analyze', component: () => import('./pages/replays/localAnalyzer/Index.vue') },
      { path: 'my', component: () => import('./pages/replays/my/Index.vue') },
    ]
  },
  { path: '/services/fixed-match-detector', component: FixedMatchDetect },

  { path: '/widgets', component: () => import('./pages/widgets/Index.vue') },
  { path: '/widgets/demo', redirect: t => window.location.href = 'https://widgets.wotstat.info/demo-widget' },

  { path: '/damage', component: () => import('./pages/services/damageDistribution/Index.vue') },
  { path: '/map', component: () => import('./pages/map/Index.vue') }
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return
    if (to.path.startsWith('/session/widgets') && from.path.startsWith('/session/widgets')) return

    return { top: 0 }
  },
})
