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
import Install from './pages/install/Index.vue'
import { AsyncComponentLoader, defineAsyncComponent } from 'vue'
import PageLoader from './shared/ui/loaders/pageLoader/PageLoader.vue'


function asyncPage(loader: AsyncComponentLoader): any {
  return defineAsyncComponent({
    loader,
    loadingComponent: PageLoader,
    delay: 200,
    suspensible: true,
  })
}

const routes = [
  { path: '/', component: () => import('./pages/Main.vue') },
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
      { path: 'chuck-norris-tournament', component: asyncPage(() => import('./pages/infographics/pages/chuck/Chuck.vue')) },
      { path: 'distribution', component: Distribution },
      { path: 'lootbox', component: Lootbox, meta: { hideTankList: true } },
      { path: 'widgets/:widget*', component: asyncPage(() => import('./pages/widgets/Index.vue')), meta: { hideTankList: true, customTitle: 'Виджеты' } },
    ]
  },
  {
    path: '/replays',
    component: asyncPage(() => import('./pages/replays/Index.vue')),
    children: [
      { path: '', component: asyncPage(() => import('./pages/replays/search/Index.vue')) },
      { path: 'analyze', component: asyncPage(() => import('./pages/replays/localAnalyzer/Index.vue')) },
      { path: 'my', component: asyncPage(() => import('./pages/replays/my/Index.vue')) },
    ]
  },
  { path: '/bb25', component: asyncPage(() => import('./pages/services/bob25/Index.vue')) },
  { path: '/mt-36-1', component: asyncPage(() => import('./pages/services/mt36.1/Index.vue')) },
  { path: '/services/fixed-match-detector', component: asyncPage(() => import('./pages/services/fixedMatchDetect/Index.vue')) },
  { path: '/install', component: Install },

  { path: '/widgets/:widget*', component: asyncPage(() => import('./pages/widgets/Index.vue')) },

  { path: '/damage', component: asyncPage(() => import('./pages/services/damageDistribution/Index.vue')) },
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return
    if (to.matched && from.matched && to.matched[0] == from.matched[0]) return

    return { top: 0 }
  },
})
