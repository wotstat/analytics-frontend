import type { MetaDefinition } from '@/meta/utils'
import VehicleMetaCard from './VehicleMetaCard.vue'

export default {
  id: 'debug-vehicle',
  priority: 100,
  match: '/debug/meta/vehicle',
  name: 'Название танка',
  summary: 'Debug-карточка с загрузкой названия из ClickHouse по tag в URL.',
  examples: [
    { name: 'ИС-7', url: 'https://wotstat.info/debug/meta/vehicle?tag=ussr:R45_IS-7' },
    { name: 'Неизвестный танк', url: 'https://wotstat.info/debug/meta/vehicle?tag=ussr:unknown' },
  ],
  component: VehicleMetaCard,
  meta: {
    title: 'Open Graph: название танка — WotStat Analytics',
    description: 'Тестовая карточка загружает название техники из ClickHouse.',
    imageAlt: 'Название танка из ClickHouse',
  },
  cache: { htmlSeconds: 0, imageSeconds: 0 },
} satisfies MetaDefinition
