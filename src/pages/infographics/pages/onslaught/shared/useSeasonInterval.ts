import { getSeasonDuration } from '@/shared/game/comp7/utils'
import { computed, Ref } from 'vue'


const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

export function useSeasonInterval(
  seasons: Ref<{ region: string, season: string, start: string }[]>,
  selectedSeason: Ref<string | null>,
  selectedRegion: Ref<string | null>,) {

  return computed(() => {
    if (!selectedSeason.value) return null
    if (!seasons.value) return null
    const season = seasons.value.find(s => s.season === selectedSeason.value && s.region === selectedRegion.value)
    if (!season) return null

    const start = new Date(season.start + 'Z')

    if (isNaN(start.getTime())) return null
    const seasonLength = getSeasonDuration(season.season, season.region)
    return { start, end: new Date(start.getTime() + seasonLength), length: seasonLength / ONE_DAY }
  })
}