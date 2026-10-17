import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export default defineMetaDefinition({
  id: 'infographics-chuck',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/chuck-norris-tournament',
  name: 'Инфографика/Очки Чака',
  summary: 'Результаты боёв по правилам Турнира Чака.',
  examples: [
    { name: 'Очки Чака', url: 'https://wotstat.info/session/chuck-norris-tournament' },
  ],
  meta: {
    title: 'Очки Чака',
    description: 'Подсчитывает очки по правилам Турнира Чака. Работает для любых боёв, ничего дополнительно настраивать не нужно. Работает и взводом и соло. Таблицы результатов эквивалентны турнирным таблицам.',
    keywords: 'очки чака, турнир чака, турнир чака, турнир чака правила, турнир чака таблица, турнир чака результаты',
    imageAlt: 'Очки Чака — WotStat Analytics',
  },
  props: {
    title: 'Очки Чака',
    subtitle: 'Результаты боёв по правилам Турнира Чака',
    label: 'Инфографика',
  },
})
