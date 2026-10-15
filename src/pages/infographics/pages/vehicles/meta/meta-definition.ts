import { defineMetaDefinition } from '@/meta/utils'
import CompareMetaCard from './CompareMetaCard.vue'

export default defineMetaDefinition({
  id: 'vehicles-compare',
  component: CompareMetaCard,
  priority: 100,
  match: url => /^\/session\/vehicles\/?$/.test(url.pathname) && Boolean(url.searchParams.get('compare')?.trim()),
  name: 'Сравнение техники',
  summary: 'Страница статистики с выбранными источниками сравнения.',
  examples: [
    { name: 'ИС-7', url: 'https://wotstat.info/session/vehicles?region=RU&compare=HpeZ' },
    { name: 'Два танка', url: 'https://wotstat.info/session/vehicles?region=RU&metric=winrate&compare=4u2COGR' }
  ],
  meta: {
    title: 'Сравнение техники — WotStat Analytics',
    description: 'Сравнение статистики техники в «Мире танков» и World of Tanks.',
    imageAlt: 'Здесь будет сравнение техники — WotStat Analytics',
  },
  cache: { htmlSeconds: 300, imageSeconds: 86400 },
})
