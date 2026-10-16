import i18n from '@/shared/game/domain/comp7/i18n.json'
import { regions, type OnslaughtRegion } from '../../shared/regions'
import type { OnslaughtSeason } from './seasons'

export type OnslaughtMetaParams = {
  region: OnslaughtRegion
  season: string | null
  seasonName: string
  nickname: string
}

export type OnslaughtMetaPeriod = OnslaughtMetaParams & { startDate: string, endDate: string }

function resolveSeason(region: OnslaughtRegion, requestedSeason: string | null, seasons?: readonly OnslaughtSeason[]) {
  if (!seasons) return requestedSeason
  const regionalSeasons = seasons.filter(item => item.region === region)
  return regionalSeasons.find(item => item.season === requestedSeason)?.season ?? regionalSeasons[0]?.season ?? null
}

export function readOnslaughtParams(url: URL, seasons?: readonly OnslaughtSeason[]): OnslaughtMetaParams {
  const rawRegion = url.searchParams.get('region') ?? 'RU'
  const region = [...regions, 'CT'].includes(rawRegion) ? rawRegion as OnslaughtRegion : 'RU'

  const requestedSeason = url.searchParams.get('season')?.trim() || null
  const season = resolveSeason(region, requestedSeason, seasons)
  const translations: Record<string, string> = i18n.ru
  let seasonName = 'Текущий сезон'
  if (season) seasonName = translations[`season:${region.toLowerCase()}:${season}`] ?? season

  return { region, season, seasonName, nickname: url.searchParams.get('nickname')?.trim() ?? '' }
}

export function onslaughtMetaTags(url: URL, seasons: readonly OnslaughtSeason[] | undefined,
  section: string, personal = false) {
  const { region, seasonName, nickname } = readOnslaughtParams(url, seasons)
  const subject = personal && nickname ? `${nickname} — ${section.toLowerCase()}` : section
  const title = `${subject} Натиска · ${region} · ${seasonName} — WotStat`
  return {
    title,
    description: `${subject} в режиме «Натиск». Регион ${region}, сезон «${seasonName}». Рейтинг, бои и статистика на WotStat.`,
    imageAlt: title,
  }
}

export const hasOnslaughtPlayer = (url: URL) => Boolean(url.searchParams.get('nickname')?.trim())
export const isOnslaughtPersonal = (url: URL) => /^\/onslaught\/personal\/?$/.test(url.pathname)
export const isOnslaughtLeaderboard = (url: URL) => /^\/onslaught\/leaderboard\/?$/.test(url.pathname)
