import { defineMetaDefinition, everyMinutes } from '@/meta/utils'
import { onslaughtSeasons } from '../../meta/utils/seasons'
import { hasOnslaughtPlayer, isOnslaughtPersonal, onslaughtMetaTags } from '../../meta/utils/params'
import PersonalMetaCard from './PersonalMetaCard.vue'

export default defineMetaDefinition({
  id: 'onslaught-personal',
  component: PersonalMetaCard,
  priority: 100,
  match: url => isOnslaughtPersonal(url) && !hasOnslaughtPlayer(url),
  contexts: { onslaughtSeasons },
  name: 'Натиск · Личная статистика',
  summary: 'Карточка раздела без выбранного игрока.',
  examples: [
    { name: 'RU · Огненный сокол', url: 'https://wotstat.info/onslaught/personal?region=RU&season=comp7_6_1' },
    { name: 'EU · Azure Phoenix', url: 'https://wotstat.info/onslaught/personal?region=EU&season=comp7_6_1' },
    { name: 'RU · Специальный выпуск', url: 'https://wotstat.info/onslaught/personal?region=RU&season=comp7_5_4' },
  ],
  meta: (url, { onslaughtSeasons }) => onslaughtMetaTags(url, onslaughtSeasons, 'Личная статистика'),
  revisionKey: () => everyMinutes(15),
  cache: { htmlSeconds: 10, imageSeconds: 900 },
})
