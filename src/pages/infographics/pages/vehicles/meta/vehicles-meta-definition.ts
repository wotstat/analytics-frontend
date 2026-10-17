import { defineMetaDefinition } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-vehicles',
  component: MetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/vehicles',
  name: 'Инфографика/Техника',
  summary: 'Статистика танков и динамика показателей.',
  examples: [
    { name: 'Техника', url: 'https://wotstat.info/session/vehicles' },
  ],
  meta: {
    title: 'Статистика танков',
    description: 'Статистика всех танков игры',
    keywords: 'статистика танков, статистика танков в боях, статистика танков в игре, статистика танков в world of tanks',
    imageAlt: 'Техника — WotStat Analytics',
  },
  props: {
    title: 'Техника',
    subtitle: 'Статистика танков и динамика показателей',
    label: 'Инфографика',
    footer: 'Мир танков · World of Tanks',
  },
})
