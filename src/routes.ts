import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

import SessionInfographics from './pages/sessionInfographics/Index.vue'
import Battle from './pages/sessionInfographics/Battle.vue'
import Shots from './pages/sessionInfographics/Shots.vue'
import Damage from './pages/sessionInfographics/Damage.vue'
import Results from './pages/sessionInfographics/Results.vue'
import Maps from './pages/sessionInfographics/Maps.vue'
import Coverage from './pages/sessionInfographics/Coverage.vue'
import Distribution from './pages/damageDistribution/Content.vue'
import Lootbox from './pages/lootbox/Index.vue'
import Widgets from './pages/sessionInfographics/widgets/Index.vue'
import FixedMatchDetect from "./pages/services/fixedMatchDetect/Index.vue";



const routes = [
  {
    path: '/',
    component: () => import('./pages/Main.vue')
  },
  {
    path: '/session',
    component: SessionInfographics,
    children: [
      { path: '', component: Battle },
      { path: 'shots', component: Shots },
      { path: 'damage', component: Damage },
      { path: 'results', component: Results },
      { path: 'maps', component: Maps },
      { path: 'players', component: Coverage },
      { path: 'chuck-norris-tournament', component: () => import('./pages/sessionInfographics/Chuck.vue') },
      { path: 'old-layout', component: () => import('./pages/sessionInfographics/Old.vue') },
      { path: 'distribution', component: Distribution },
      { path: 'lootbox', component: Lootbox, meta: { hideTankList: true } },
      { path: 'widgets/:widget*', component: Widgets, meta: { hideTankList: true, customTitle: 'Виджеты' } },
    ]
  },
  { path: '/services/fixed-match-detector', component: FixedMatchDetect },

  { path: '/widgets', redirect: '/session/widgets' },
  { path: '/widgets/demo', redirect: t => window.location.href = 'https://widgets.wotstat.info/demo-widget' },

  { path: '/damage', component: () => import('./pages/damageDistribution/Index.vue') },
  { path: '/map', component: () => import('./pages/map/Index.vue') },
  { path: '/widget/chuck-norris', component: () => import('./pages/obs/ChuckNorris.vue'), meta: { clearPage: true } },
  { path: '/widget/tank-seesaw', component: () => import('./pages/obs/TankSeesaw.vue'), meta: { clearPage: true } },
  { path: '/widget/gleborg-chuck-gold', component: () => import('./pages/obs/ChuckGold.vue'), meta: { clearPage: true } },
  { path: '/widget/rtk', component: () => import('./pages/obs/RTK.vue'), meta: { clearPage: true } },
  { path: '/widget/rtk-big', component: () => import('./pages/obs/RTKBig.vue'), meta: { clearPage: true } },
  { path: '/widget/sum-dmg', component: () => import('./pages/obs/SumDmg.vue'), meta: { clearPage: true } },
  { path: '/widget/sum-radio', component: () => import('./pages/obs/SumRadio.vue'), meta: { clearPage: true } },
  { path: '/widget/sum-block', component: () => import('./pages/obs/SumBlock.vue'), meta: { clearPage: true } },
  { path: '/widget/lootbox-info', component: () => import('./pages/obs/LootboxInfo.vue'), meta: { clearPage: true } }
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
