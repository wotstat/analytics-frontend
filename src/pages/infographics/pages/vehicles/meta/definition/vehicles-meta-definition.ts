import { defineMetaDefinition, everyDays } from '@/meta/utils'
import VehiclesTableMetaCard from '../table/VehiclesTableMetaCard.vue'
import VehiclesCompareMetaCard from '../compare/VehiclesCompareMetaCard.vue'

const examples = import.meta.env.VITE_META_SERVER ? undefined : await import('./examples')

const vehiclesPage = (url: URL) => /^\/session\/vehicles\/?$/.test(url.pathname)
const vehiclesMetaCache = { revisionKey: () => everyDays(1), cache: { htmlSeconds: 10, imageSeconds: 3600 } }

export default defineMetaDefinition({
  id: 'infographics-vehicles', component: VehiclesTableMetaCard, priority: 10,
  match: vehiclesPage,
  name: 'Сравнение техники/Техника',
  summary: 'Крупный заголовок, полные строки и рамка таблицы, продолжающаяся до нижнего края карточки.',
  examples: examples?.tableExamples(),
  meta: {
    title: 'Статистика техники — WotStat Analytics',
    description: 'Статистика техники, уровней и типов по выбранным фильтрам и показателям.',
    imageAlt: 'Статистика техники по выбранным фильтрам — WotStat Analytics',
  },
  ...vehiclesMetaCache,
})

export const compare = defineMetaDefinition({
  id: 'infographics-vehicles-compare', component: VehiclesCompareMetaCard, priority: 100,
  match: url => vehiclesPage(url) && Boolean(url.searchParams.get('compare')?.trim()),
  name: 'Сравнение техники/Сравнение',
  summary: 'Один-два танка без легенды; три и более источника или категории — панорама с легендой.',
  examples: examples?.compareExamples(),
  meta: {
    title: 'Сравнение техники — WotStat Analytics',
    description: 'Дневная динамика выбранного показателя с 2024 года. Реальные данные по источникам сравнения.',
    imageAlt: 'График сравнения техники — WotStat Analytics',
  },
  ...vehiclesMetaCache,
})
