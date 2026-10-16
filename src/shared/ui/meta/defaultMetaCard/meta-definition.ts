import { defineMetaDefinition, everyDays } from '@/meta/utils'
import DefaultMetaCard from './DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'default',
  component: DefaultMetaCard,
  priority: -1000,
  match: '*',
  name: 'По умолчанию/Общая карточка',
  summary: 'Главная и все страницы без собственного превью.',
  examples: [
    { name: 'Главная', url: 'https://wotstat.info/' },
  ],
  meta: {
    title: 'WotStat Analytics',
    description: 'Статистика и аналитика для игр «Мир танков» и World of Tanks.',
    imageAlt: 'WotStat Analytics — статистика и аналитика танковых боёв',
  },
  revisionKey: () => everyDays(1),
})
