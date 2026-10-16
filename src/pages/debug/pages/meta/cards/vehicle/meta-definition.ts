import { defineMetaDefinition, everySeconds } from '@/meta/utils'
import { vehicleNames } from '@/shared/ui/meta/contexts/vehicleNames'
import VehicleMetaCard from './VehicleMetaCard.vue'

export default defineMetaDefinition({
  id: 'debug-vehicle',
  component: VehicleMetaCard,
  priority: 100,
  match: '/debug/meta/vehicle',
  name: 'Debug/Название танка',
  summary: 'Название из общего контекста в title и отдельный запрос ClickHouse для PNG.',
  examples: [
    { name: 'ИС-7', url: 'https://wotstat.info/debug/meta/vehicle?tag=ussr:R45_IS-7' },
    { name: 'Неизвестный танк', url: 'https://wotstat.info/debug/meta/vehicle?tag=ussr:unknown' },
  ],
  contexts: { vehicleNames },

  meta: (url, { vehicleNames }) => {
    const tag = url.searchParams.get('tag') ?? ''
    const title = (() => {
      if (tag && vehicleNames?.[tag]) return `${vehicleNames[tag]} — WotStat Analytics`
      return 'Название танка — WotStat Analytics'
    })()

    return {
      title: title,
      description: 'Тестовая карточка загружает название техники из ClickHouse.',
      imageAlt: 'Название танка из ClickHouse',
    }
  },
  revisionKey: () => everySeconds(1),
  cache: { htmlSeconds: 0, imageSeconds: 0 },
})
