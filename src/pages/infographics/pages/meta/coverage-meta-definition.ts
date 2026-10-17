import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-coverage',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/players',
  name: 'Инфографика/Охват игроков',
  summary: 'Игроки, с которыми вы встречались в боях.',
  examples: [
    { name: 'Охват игроков', url: 'https://wotstat.info/session/players' },
  ],
  meta: {
    title: 'Охват игроков',
    description: 'Статистика охвата игроков в боях',
    keywords: 'охват игроков, статистика охвата игроков, статистика игроков, статистика игроков в боях',
    imageAlt: 'Охват игроков — WotStat Analytics',
  },
  props: {
    title: 'Охват игроков',
    subtitle: 'Игроки, с которыми вы встречались в боях',
    label: 'Инфографика',
  },
})
