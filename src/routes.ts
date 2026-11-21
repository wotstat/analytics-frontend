import { type RouteRecordRaw, createRouter } from 'vue-router'
import { setupPageMeta } from './meta/pageMeta'
import infographics from './pages/infographics/Index.vue'
import Battle from './pages/infographics/pages/Battle.vue'
import Shots from './pages/infographics/pages/shots/Shots.vue'
import Damage from './pages/infographics/pages/Damage.vue'
import Results from './pages/infographics/pages/Results.vue'
import Maps from './pages/infographics/pages/Maps.vue'
import Vehicles from './pages/services/pages/vehicles/Vehicles.vue'
import Marks from './pages/services/pages/vehicleAchievements/Marks.vue'
import Mastery from './pages/services/pages/vehicleAchievements/Mastery.vue'
import CompareVersions from './pages/services/pages/archive/mt36.1/Index.vue'
import Coverage from './pages/infographics/pages/Coverage.vue'
import Lootbox from './pages/infographics/pages/lootbox/Index.vue'
import Install from './pages/install/Index.vue'
import { asyncPage } from './pages/shared/asyncPage'
import { debugRoutes } from './pages/debug/routes'
import { setupQueryStorage } from './shared/uiKit/queryStorage/useQueryStorage'
import { createDeferredWebHistory } from './shared/uiKit/queryStorage/utils/createDeferredWebHistory.ts'
import { setupPageNavigation } from './shared/uiKit/pageNavigation/pageNavigation'

const loadOnslaught = () => import('./pages/infographics/pages/onslaught/onslaught')

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
      { path: 'vehicles', component: Vehicles, meta: { hideTankList: true, customTitle: 'Статистика техники' } },
      { path: 'marks', component: Marks, meta: { hideTankList: true, customTitle: 'Отметки на стволах' } },
      { path: 'mastery', component: Mastery, meta: { hideTankList: true, customTitle: 'Знаки классности' } },
      { path: 'players', component: Coverage },
      { path: 'chuck-norris-tournament', component: asyncPage(() => import('./pages/infographics/pages/chuck/Chuck.vue')) },
      { path: 'lootbox', component: Lootbox, meta: { hideTankList: true } },
    ]
  },
  {
    path: '/services',
    component: asyncPage(() => import('./pages/services/Index.vue')),
    meta: { resetScroll: true },
    children: [
      { path: 'vehicles', alias: '', component: Vehicles, meta: { customTitle: 'Статистика техники' } },
      { path: 'mastery', component: Mastery, meta: { customTitle: 'Знаки классности' } },
      { path: 'marks', component: Marks, meta: { customTitle: 'Отметки на стволах' } },
      { path: 'compare-versions', component: CompareVersions, meta: { customTitle: 'Сравнение версий игры' } },
      {
        path: 'bb25',
        component: () => import('./pages/services/pages/archive/bob25/Index.vue'),
        meta: { customTitle: 'Битва блогеров 2025', titleClass: 'bob25-title' },
      },
    ]
  },
  {
    path: '/onslaught',
    component: asyncPage(() => loadOnslaught().then(module => module.Layout)),
    children: [
      { path: '', alias: 'general', component: asyncPage(() => loadOnslaught().then(module => module.General)), meta: { customTitle: 'Общая статистика Натиска' } },
      { path: 'leaderboard', component: asyncPage(() => loadOnslaught().then(module => module.Leaderboard)), meta: { customTitle: 'Таблица Лидеров' } },
      { path: 'personal', component: asyncPage(() => loadOnslaught().then(module => module.Personal)), meta: { customTitle: 'Персональная статистика Натиска' } },
    ]
  },
  {
    path: '/replays',
    component: asyncPage(() => import('./pages/replays/Index.vue')),
    meta: { sitemap: false },
    children: [
      { path: '', component: asyncPage(() => import('./pages/replays/search/Index.vue')) },
      { path: 'analyze', component: asyncPage(() => import('./pages/replays/localAnalyzer/Index.vue')) },
      { path: 'my', component: asyncPage(() => import('./pages/replays/my/Index.vue')) },
    ]
  },
  { path: '/bb25', redirect: '/services/bb25' },
  { path: '/services/fixed-match-detector', component: asyncPage(() => import('./pages/services/legacy/fixedMatchDetect/Index.vue')), meta: { sitemap: false } },
  { path: '/install', component: Install },

  { path: '/widgets/:widget*', component: asyncPage(() => import('./pages/widgets/Index.vue')) },

  {
    path: '/meta',
    component: () => import('./pages/metaStudio/Studio.vue'),
    meta: { clearPage: true, sitemap: false },
    children: [
      { path: '', component: () => import('./pages/metaStudio/Gallery.vue') },
      { path: 'backgrounds', component: () => import('./pages/metaStudio/backgrounds/Backgrounds.vue') },
      { path: 'cards/:id', component: () => import('./pages/metaStudio/CardEditor.vue') },
    ],
  },
] satisfies RouteRecordRaw[]

const history = createDeferredWebHistory()

export const router = createRouter({
  history,
  routes: [...routes, ...debugRoutes],
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return
    if (to.matched[0] === from.matched[0] && !to.meta.resetScroll && !from.meta.resetScroll) return

    return { top: 0 }
  },
})

const queryStorage = setupQueryStorage(router, history)
const navigation = setupPageNavigation(router, queryStorage.readyRoute)
setupPageMeta(router, navigation.readyRoute)

export const pageReadyRoute = navigation.readyRoute
