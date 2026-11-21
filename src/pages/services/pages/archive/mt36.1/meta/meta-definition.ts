import { defineMetaDefinition } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

export default defineMetaDefinition({
  id: 'services-compare-versions',
  component: MetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/services/compare-versions',
  name: 'Архив/Сравнение версий',
  summary: 'Сравнение игровых показателей между версиями.',
  examples: [
    { name: 'Сравнение версий', url: 'https://wotstat.info/services/compare-versions' },
  ],
  meta: {
    title: 'Сравнение версий игры — WotStat Analytics',
    description: 'Сравните версии игры по длительности боёв, разбросу снарядов и распределению урона. Страница была сделана для обновления 1.36.1 «Разворот».',
    imageAlt: 'Сравнение версий игры — WotStat Analytics',
  },
  props: {
    title: 'Сравнение версий',
    subtitle: 'Длительность боёв, разброс снарядов и распределение урона',
    label: 'Архив',
    footer: 'Мир танков',
  },
})
