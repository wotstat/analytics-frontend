import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-lootbox',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/lootbox',
  name: 'Инфографика/Коробки',
  summary: 'Награды и статистика открытия коробок.',
  examples: [
    { name: 'Коробки', url: 'https://wotstat.info/session/lootbox' },
  ],
  meta: {
    title: 'Статистика коробок',
    description: 'Статистика открытия коробок в игре World of Tanks и Мир Танков',
    keywords: 'статистика коробок, статистика коробок в игре, статистика коробок в world of tanks, статистика коробок в мир танков',
    imageAlt: 'Коробки — WotStat Analytics',
  },
  props: {
    title: 'Коробки',
    subtitle: 'Награды и статистика открытия коробок',
    label: 'Инфографика',
  },
})
