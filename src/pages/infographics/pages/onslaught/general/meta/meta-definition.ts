import { defineMetaDefinition, everyMinutes } from '@/meta/utils'
import { onslaughtSeasons } from '../../meta/utils/seasons'
import { onslaughtMetaTags } from '../../meta/utils/params'
import GeneralMetaCard from './GeneralMetaCard.vue'

export default defineMetaDefinition({
  id: 'onslaught-general',
  component: GeneralMetaCard,
  priority: 100,
  match: url => /^\/onslaught(?:\/general)?\/?$/.test(url.pathname),
  contexts: { onslaughtSeasons },
  name: 'Натиск · Общая статистика',
  summary: 'Игроки, собранные бои и Легенда выбранного региона и сезона.',
  examples: [
    { name: 'RU · Огненный сокол', url: 'https://wotstat.info/onslaught?region=RU&season=comp7_6_1' },
    { name: 'EU · Azure Phoenix', url: 'https://wotstat.info/onslaught/general?region=EU&season=comp7_6_1' },
    { name: 'RU · Специальный выпуск', url: 'https://wotstat.info/onslaught?region=RU&season=comp7_5_4' },
    { name: 'Текущий сезон', url: 'https://wotstat.info/onslaught' },
  ],
  meta: (url, { onslaughtSeasons }) => onslaughtMetaTags(url, onslaughtSeasons, 'Общая статистика'),
  revisionKey: () => everyMinutes(15),
  cache: { htmlSeconds: 10, imageSeconds: 900 },
})
