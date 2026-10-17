import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-battle',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session',
  name: 'Инфографика/Бои',
  summary: 'Винрейт, время в бою и выживаемость.',
  examples: [
    { name: 'Бои', url: 'https://wotstat.info/session' },
  ],
  meta: {
    title: 'Сессионная инфографика',
    description: 'Серверная статистика по сессии игрока в Мир Танков и World of Tanks',
    keywords: 'инфографика, сессия, игрок, статистика, World of Tanks',
    imageAlt: 'Бои — WotStat Analytics',
  },
  props: {
    title: 'Бои',
    subtitle: 'Винрейт, время в бою и выживаемость',
    label: 'Инфографика',
  },
})
