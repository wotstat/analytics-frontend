import { defineMetaDefinition } from '@/meta/utils'
import Bob25MetaCard from './Bob25MetaCard.vue'

export default defineMetaDefinition({
  id: 'services-bb25',
  component: Bob25MetaCard,
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
    imageAlt: 'Итоги Битвы блогеров 2025. Near_You — 1-е место, LeBwa — 2-е, Jove — 3-е, Yusha — 4-е.',
  },
})
