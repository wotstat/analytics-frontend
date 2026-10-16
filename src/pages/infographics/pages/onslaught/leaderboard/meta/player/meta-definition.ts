import { defineMetaDefinition, everyMinutes } from '@/meta/utils'
import { onslaughtSeasons } from '../../../meta/utils/seasons'
import { hasOnslaughtPlayer, isOnslaughtLeaderboard, onslaughtMetaTags } from '../../../meta/utils/params'
import LeaderboardMetaCard from '../LeaderboardMetaCard.vue'

export default defineMetaDefinition({
  id: 'onslaught-leaderboard-player',
  component: LeaderboardMetaCard,
  priority: 100,
  match: url => isOnslaughtLeaderboard(url) && hasOnslaughtPlayer(url),
  contexts: { onslaughtSeasons },
  name: 'Натиск/Игрок в рейтинге',
  summary: 'Место игрока, очки и количество боёв в таблице лидеров.',
  examples: [
    { name: 'RU · Лидер', url: 'https://wotstat.info/onslaught/leaderboard?region=RU&season=comp7_6_1&nickname=UnLucKy_LLIKoJIbHuK' },
    { name: 'RU · Игрок', url: 'https://wotstat.info/onslaught/leaderboard?region=RU&season=comp7_6_1&nickname=GIog' },
    { name: 'Игрок вне таблицы', url: 'https://wotstat.info/onslaught/leaderboard?region=EU&season=comp7_6_1&nickname=WotStat_NoData' },
  ],
  meta: (url, { onslaughtSeasons }) => onslaughtMetaTags(url, onslaughtSeasons, 'Таблица лидеров', true),
  revisionKey: () => everyMinutes(15),
  cache: { htmlSeconds: 10, imageSeconds: 900 },
})
