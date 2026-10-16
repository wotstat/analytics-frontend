import { defineMetaDefinition, everyMinutes } from '@/meta/utils'
import { onslaughtSeasons } from '../../meta/utils/seasons'
import { hasOnslaughtPlayer, isOnslaughtLeaderboard, onslaughtMetaTags } from '../../meta/utils/params'
import LeaderboardMetaCard from './LeaderboardMetaCard.vue'

export default defineMetaDefinition({
  id: 'onslaught-leaderboard',
  component: LeaderboardMetaCard,
  priority: 100,
  match: url => isOnslaughtLeaderboard(url) && !hasOnslaughtPlayer(url),
  contexts: { onslaughtSeasons },
  name: 'Натиск/Таблица лидеров',
  summary: 'Порог Легенды, число игроков в ней и пятёрка лидеров.',
  examples: [
    { name: 'RU · Огненный сокол', url: 'https://wotstat.info/onslaught/leaderboard?region=RU&season=comp7_6_1' },
    { name: 'EU · Azure Phoenix', url: 'https://wotstat.info/onslaught/leaderboard?region=EU&season=comp7_6_1' },
    { name: 'RU · Специальный выпуск', url: 'https://wotstat.info/onslaught/leaderboard?region=RU&season=comp7_5_4' },
  ],
  meta: (url, { onslaughtSeasons }) => onslaughtMetaTags(url, onslaughtSeasons, 'Таблица лидеров'),
  revisionKey: () => everyMinutes(15),
  cache: { htmlSeconds: 10, imageSeconds: 900 },
})
