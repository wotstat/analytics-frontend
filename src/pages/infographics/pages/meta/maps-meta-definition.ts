import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-maps',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/maps',
  name: 'Инфографика/Карты',
  summary: 'Результаты боёв на разных картах.',
  examples: [
    { name: 'Карты', url: 'https://wotstat.info/session/maps' },
  ],
  meta: {
    title: 'Статистика карт',
    description: 'Статистика по картам в боях',
    keywords: 'статистика карт, статистика карт в боях, статистика карт в игре, статистика карт в world of tanks',
    imageAlt: 'Карты — WotStat Analytics',
  },
  props: {
    title: 'Карты',
    subtitle: 'Результаты боёв на разных картах',
    label: 'Инфографика',
  },
})
