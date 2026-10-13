import type { MetaDefinition } from '@/meta/utils'
import DelayedMetaCard from './DelayedMetaCard.vue'

export default {
  id: 'debug-delayed',
  priority: 100,
  match: '/debug/meta/delayed',
  name: 'Задержка 5 секунд',
  summary: 'Debug-карточка с асинхронной подготовкой через useMetaReady.',
  examples: [
    { name: 'Задержка 5 секунд', url: 'https://wotstat.info/debug/meta/delayed' },
  ],
  component: DelayedMetaCard,
  meta: {
    title: 'Open Graph: задержка 5 секунд — WotStat Analytics',
    description: 'Тестовая карточка сообщает о готовности к рендеру через 5 секунд.',
    imageAlt: 'Карточка готова к рендеру после задержки 5 секунд.',
  },
  cache: { htmlSeconds: 0, imageSeconds: 0 },
} satisfies MetaDefinition
