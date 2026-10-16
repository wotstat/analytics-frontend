import { ref, shallowRef } from 'vue'
import { query } from '@/db'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import type { RenderContext } from '@/meta/utils'
import { getRegionIsoHourOffset, getSeasonDuration } from '@/shared/game/domain/comp7/utils'
import { readOnslaughtParams, type OnslaughtMetaPeriod } from './params'
import { onslaughtSeasons } from './seasons'

export function useOnslaughtMeta(context: RenderContext,
  load?: (params: OnslaughtMetaPeriod, signal: AbortSignal) => Promise<void>) {
  const url = new URL(context.url)
  const params = shallowRef(readOnslaughtParams(url))
  const state = ref<'loading' | 'ready' | 'empty' | 'error'>('loading')

  useMetaReady(async ({ signal }) => {
    try {
      const seasons = await onslaughtSeasons.load({ query, signal })
      params.value = readOnslaughtParams(url, seasons)

      const season = seasons.find(item => item.region === params.value.region && item.season === params.value.season)
      if (!season) {
        state.value = 'empty'
        return
      }

      const shiftedStart = new Date(new Date(`${season.start}Z`).getTime() + getRegionIsoHourOffset(season.region) * 3_600_000)
      const startDate = shiftedStart.toISOString().slice(0, 10)
      const endDate = new Date(new Date(startDate).getTime() + getSeasonDuration(season.season, season.region))
        .toISOString().slice(0, 10)

      await load?.({ ...params.value, startDate, endDate }, signal)
      state.value = 'ready'
    } catch (error) {
      state.value = 'error'
      throw error
    }
  })

  return { params, state }
}
