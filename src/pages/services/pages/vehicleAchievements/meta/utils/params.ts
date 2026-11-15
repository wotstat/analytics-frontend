import { firstQueryRegion } from '@/shared/game/domain/region/regionQueryParam'
import { mtNations, wotNations, type Nation } from '@/shared/game/domain/vehicles/nations'
import { regionToGame } from '@/shared/game/domain/wot'
import { readQueryParams } from '@/shared/uiKit/queryStorage/utils/queryParamUtils'
import { createAchievementQueryParams } from '../../utils/achievementQueryParams'
import { achievements, type AchievementKind } from '../../utils/achievements'

const achievementQueryParams = {
  marks: createAchievementQueryParams('marks'),
  mastery: createAchievementQueryParams('mastery'),
}

export function readAchievementMetaParams(kind: AchievementKind, url: URL) {
  const params = readQueryParams(achievementQueryParams[kind], url)
  const region = firstQueryRegion(params.regions)
  const nations: readonly Nation[] = regionToGame(region) === 'mt' ? mtNations : wotNations

  const filters = {
    levels: [...params.levels],
    types: [...params.types],
    nations: [...params.nations].filter(nation => nations.includes(nation)),
    search: params.search,
    onlyActual: params.onlyActual,
    deltaPeriod: params.deltaPeriod,
    sortByDelta: params.sortByDelta,
  }
  const metrics = achievements[kind].slots.filter(slot => params.metrics.has(slot))
  return { ...params, region, filters, metrics }
}
