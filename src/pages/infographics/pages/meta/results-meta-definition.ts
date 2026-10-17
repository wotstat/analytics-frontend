import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-results',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/results',
  name: 'Инфографика/Результаты',
  summary: 'Урон, насвет и эффективность в боях.',
  examples: [
    { name: 'Результаты', url: 'https://wotstat.info/session/results' },
  ],
  meta: {
    title: 'Статистика результатов',
    description: 'Статистика результатов боёв',
    keywords: 'статистика результатов, статистика результатов боёв, статистика результатов в игре, статистика результатов в world of tanks',
    imageAlt: 'Результаты — WotStat Analytics',
  },
  props: {
    title: 'Результаты',
    subtitle: 'Урон, насвет и эффективность в боях',
    label: 'Инфографика',
  },
})
