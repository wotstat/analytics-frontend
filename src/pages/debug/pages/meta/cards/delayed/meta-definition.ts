import { defineMetaDefinition, everySeconds } from '@/meta/utils'
import DelayedMetaCard from './DelayedMetaCard.vue'

export default defineMetaDefinition({
  id: 'debug-delayed',
  component: DelayedMetaCard,
  priority: 100,
  match: '/debug/meta/delayed',
  name: 'Debug/Задержка 5 секунд',
  summary: 'Debug-карточка с асинхронной подготовкой через useMetaReady.',
  examples: [
    { name: 'Задержка 5 секунд', url: 'https://wotstat.info/debug/meta/delayed' },
  ],
  meta: {
    title: 'Open Graph: задержка 5 секунд — WotStat Analytics',
    description: 'Тестовая карточка сообщает о готовности к рендеру через 5 секунд.',
    imageAlt: 'Карточка готова к рендеру после задержки 5 секунд.',
  },
  revisionKey: () => everySeconds(1),
  cache: { htmlSeconds: 0, imageSeconds: 0 },
})
