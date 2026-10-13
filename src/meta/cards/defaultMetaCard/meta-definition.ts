import type { MetaDefinition } from '@/meta/utils'
import DefaultMetaCard from './DefaultMetaCard.vue'

const defaultMetaCard = {
  id: 'default',
  priority: -1000,
  match: '*',
  name: 'Общая карточка',
  summary: 'Главная и все страницы без собственного превью.',
  examples: [
    { name: 'Главная', url: 'https://wotstat.info/' },
    { name: 'Техника без сравнения', url: 'https://wotstat.info/session/vehicles' }
  ],
  component: DefaultMetaCard,
  meta: {
    title: 'WotStat Analytics',
    description: 'Статистика и аналитика для игр «Мир танков» и World of Tanks.',
    imageAlt: 'WotStat Analytics — статистика и аналитика танковых боёв',
  },
  cache: { htmlSeconds: 300, imageSeconds: 86400 },
} satisfies MetaDefinition

export default defaultMetaCard
