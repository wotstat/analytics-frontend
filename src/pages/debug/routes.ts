import PageLoader from '@/shared/ui/loaders/pageLoader/PageLoader.vue'
import { defineAsyncComponent, type AsyncComponentLoader } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const debugGroups = [
  { value: 'uiKit', title: 'UI-компоненты' },
  { value: 'chart', title: 'Графики' },
  { value: 'game', title: 'Игровой домен' },
] as const

export type DebugGroup = typeof debugGroups[number]['value']

type Entry = {
  path: string
  title: string
  description: string
  group: DebugGroup
  component: AsyncComponentLoader
}

const entries = [
  {
    path: 'popover',
    title: 'Popover',
    description: 'Позиционирование и флип у краёв viewport, виртуальная цель, автозакрытие, стилизованная карточка.',
    group: 'uiKit',
    component: () => import('./pages/popover/Index.vue'),
  },
  {
    path: 'tooltip',
    title: 'Тултипы',
    description: 'Директивы с текстом, произвольное содержимое через useTooltip, поведение на тач-устройствах.',
    group: 'uiKit',
    component: () => import('./pages/tooltip/Index.vue'),
  },
  {
    path: 'tip-bubble',
    title: 'TipBubble',
    description: 'Обучающие подсказки: очередь внутри группы, autoExtend, запоминание показов.',
    group: 'uiKit',
    component: () => import('./pages/tipBubble/Index.vue'),
  },
  {
    path: 'context-menu',
    title: 'Контекстное меню',
    description: 'Строки меню, вложенные подменю, чекмарки, программное открытие.',
    group: 'uiKit',
    component: () => import('./pages/contextMenu/Index.vue'),
  },
  {
    path: 'modal-window',
    title: 'Модальные окна',
    description: 'Модальное окно, его содержимое и кнопки, блокировка скролла страницы.',
    group: 'uiKit',
    component: () => import('./pages/modalWindow/Index.vue'),
  },
  {
    path: 'focus-effect',
    title: 'FocusEffect',
    description: 'Подсветка элемента поверх затемнённой страницы.',
    group: 'uiKit',
    component: () => import('./pages/focusEffect/Index.vue'),
  },
  {
    path: 'table-view',
    title: 'TableView',
    description: 'Виртуализированная таблица: секции, переиспользование строк, шапка и футер, выделение.',
    group: 'uiKit',
    component: () => import('./pages/tableView/Index.vue'),
  },
  {
    path: 'misc',
    title: 'Мелкие компоненты',
    description: 'DropDown, подсветка поиска, картинка с фолбэком, бейдж «новое», спрайт-атлас, лоадеры.',
    group: 'uiKit',
    component: () => import('./pages/misc/Index.vue'),
  },
  {
    path: 'tween',
    title: 'Анимация чисел',
    description: 'TweenValue и SimpleTweenValue, кривые easing, процессоры форматирования.',
    group: 'uiKit',
    component: () => import('./pages/tween/Index.vue'),
  },
  {
    path: 'chart/plots',
    title: 'Типы графиков',
    description: 'Линии и сглаживание, заливки, столбцы grouped и stacked, маркеры, прямоугольные области.',
    group: 'chart',
    component: () => import('./pages/chart/plots/Index.vue'),
  },
  {
    path: 'chart/axis',
    title: 'Оси и подписи',
    description: 'Оси, тики по значениям и по подписям, стратегии автоподписей classic / interval / cell.',
    group: 'chart',
    component: () => import('./pages/chart/axis/Index.vue'),
  },
  {
    path: 'chart/interaction',
    title: 'Интерактив графиков',
    description: 'Автомат ввода, курсорные линии на selections, поиск точек линии и маркеры, кадр интерактива в две фазы, зум и пан рядом.',
    group: 'chart',
    component: () => import('./pages/chart/interaction/Index.vue'),
  },
  {
    path: 'game/vehicles',
    title: 'Танки',
    description: 'Иконки техники, флаги наций, типы и уровни.',
    group: 'game',
    component: () => import('./pages/game/vehicles/Index.vue'),
  },
  {
    path: 'game/arenas',
    title: 'Карты',
    description: 'Список арен и миникарта с базами, спавнами и точками интереса.',
    group: 'game',
    component: () => import('./pages/game/arenas/Index.vue'),
  },
  {
    path: 'game/mini-replay',
    title: 'Мини-реплей',
    description: 'Экспериментальный проигрыватель боя: техника, трассеры, таймлайн и результаты игроков.',
    group: 'game',
    component: () => import('./pages/game/miniReplay/Index.vue'),
  },
  {
    path: 'game/selectors',
    title: 'Селекторы',
    description: 'Выбор техники, карт, игры и версии игры; бейджи выбранного и строка поиска.',
    group: 'game',
    component: () => import('./pages/game/selectors/Index.vue'),
  },
  {
    path: 'game/comp7',
    title: 'Натиск',
    description: 'Иконки рангов и навыков.',
    group: 'game',
    component: () => import('./pages/game/comp7/Index.vue'),
  },
  {
    path: 'game/efficiency-icons',
    title: 'Иконки эффективности',
    description: 'Галерея всех иконок метрик с их подписями.',
    group: 'game',
    component: () => import('./pages/game/efficiencyIcons/Index.vue'),
  },
] as const satisfies readonly Entry[]

export type DebugPage = {
  path: string
  title: string
  description: string
  group: DebugGroup
}

export const debugPages: DebugPage[] = entries.map(({ path, title, description, group }) => ({
  path: `/debug/${path}`,
  title,
  description,
  group,
}))

function asyncPage(loader: AsyncComponentLoader): any {
  return defineAsyncComponent({
    loader,
    loadingComponent: PageLoader,
    delay: 200,
    suspensible: true,
  })
}

export const debugRoutes = [
  {
    path: '/debug',
    component: asyncPage(() => import('./Debug.vue')),
    children: [
      { path: '', component: asyncPage(() => import('./Index.vue')) },
      ...entries.map(entry => ({ path: entry.path, component: asyncPage(entry.component) })),
    ],
  },
] satisfies RouteRecordRaw[]
