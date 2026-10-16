import { defineMetaDefinition, everyMinutes } from '@/meta/utils'
import { onslaughtSeasons } from '../../../meta/utils/seasons'
import { hasOnslaughtPlayer, isOnslaughtPersonal, onslaughtMetaTags } from '../../../meta/utils/params'
import PersonalMetaCard from '../PersonalMetaCard.vue'

export default defineMetaDefinition({
  id: 'onslaught-personal-player',
  component: PersonalMetaCard,
  priority: 100,
  match: url => isOnslaughtPersonal(url) && hasOnslaughtPlayer(url),
  contexts: { onslaughtSeasons },
  name: 'Натиск · Статистика игрока',
  summary: 'Ник, ранг, рейтинг и результаты боёв за сезон.',
  examples: [
    { name: 'RU · Игрок', url: 'https://wotstat.info/onslaught/personal?region=RU&season=comp7_6_1&nickname=Tolstoi_2024' },
    { name: 'RU · Другой игрок', url: 'https://wotstat.info/onslaught/personal?region=RU&season=comp7_6_1&nickname=1234554321_4' },
    { name: 'Без данных', url: 'https://wotstat.info/onslaught/personal?region=EU&season=comp7_6_1&nickname=WotStat_NoData' },
  ],
  meta: (url, { onslaughtSeasons }) => onslaughtMetaTags(url, onslaughtSeasons, 'Личная статистика', true),
  revisionKey: () => everyMinutes(15),
  cache: { htmlSeconds: 10, imageSeconds: 900 },
})
