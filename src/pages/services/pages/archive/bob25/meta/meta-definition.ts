import { defineMetaDefinition } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

export default defineMetaDefinition({
  id: 'services-bb25',
  component: MetaCard,
  priority: 10,
  match: url => /^\/(?:services\/)?bb25\/?$/.test(url.pathname),
  name: 'Архив/Битва блогеров 2025',
  summary: 'Результаты команд и статистика боёв события.',
  examples: [
    { name: 'Битва блогеров 2025', url: 'https://wotstat.info/services/bb25' },
  ],
  meta: {
    title: 'Статистика Битвы блогеров 2025',
    description: 'Результаты Битвы блогеров 2025 в «Мире танков». Очки, винрейт и статистика боёв команд Near_You, LeBwa, Jove и Yusha.',
    keywords: 'битва блогеров, блогеры, статистика, wot, Джов, Юша, Левша, Нирю, Jove, Yusha, Lebwa, Nearyou',
    imageAlt: 'Битва блогеров 2025 — WotStat Analytics',
  },
  props: {
    title: 'Битва блогеров 2025',
    subtitle: 'Результаты команд и статистика боёв',
    label: 'Архив',
    footer: 'Мир танков',
  },
})
