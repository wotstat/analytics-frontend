import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-damage',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/damage',
  name: 'Инфографика/Урон',
  summary: 'Нанесённый и полученный урон в деталях.',
  examples: [
    { name: 'Урон', url: 'https://wotstat.info/session/damage' },
  ],
  meta: {
    title: 'Инфографика урона',
    description: 'Инфографика урона в боях',
    keywords: 'инфографика урона, статистика урона, статистика урона в боях',
    imageAlt: 'Урон — WotStat Analytics',
  },
  props: {
    title: 'Урон',
    subtitle: 'Нанесённый и полученный урон в деталях',
    label: 'Инфографика',
  },
})
