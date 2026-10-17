import { defineMetaDefinition } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-shots',
  component: MetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/shots',
  name: 'Инфографика/Стрельба',
  summary: 'Попадания, пробития и точность выстрелов.',
  examples: [
    { name: 'Стрельба', url: 'https://wotstat.info/session/shots' },
  ],
  meta: {
    title: 'Статистика стрельбы',
    description: 'Статистика стрельбы в боях',
    keywords: 'статистика стрельбы, статистика стрельбы в боях, статистика стрельбы в игре, статистика стрельбы в world of tanks',
    imageAlt: 'Стрельба — WotStat Analytics',
  },
  props: {
    title: 'Стрельба',
    subtitle: 'Попадания, пробития и точность выстрелов',
    label: 'Инфографика',
    footer: 'Мир танков · World of Tanks',
  },
})
