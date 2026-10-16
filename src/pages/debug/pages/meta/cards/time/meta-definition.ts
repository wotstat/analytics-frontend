import { defineMetaDefinition, everySeconds } from '@/meta/utils'
import TimeMetaCard from './TimeMetaCard.vue'

export default defineMetaDefinition({
  id: 'debug-time',
  component: TimeMetaCard,
  priority: 100,
  match: '/debug/meta/time',
  name: 'Debug/Текущее время',
  summary: 'Текущее время UTC для проверки кеширования по постоянному URL.',
  examples: [
    { name: 'Текущее время', url: 'https://wotstat.info/debug/meta/time' },
  ],
  meta: {
    title: 'Open Graph: текущее время — WotStat Analytics',
    description: 'Текущее время UTC на момент создания карточки. Каждый запрос изображения создаёт новую карточку.',
    imageAlt: 'Текущее время и дата в UTC.',
  },
  revisionKey: () => everySeconds(1),
  cache: { htmlSeconds: 1, imageSeconds: 1 },
})
