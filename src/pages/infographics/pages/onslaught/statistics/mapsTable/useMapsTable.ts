import { computed } from 'vue'
import { Ref, watchEffect } from 'vue'

export type MapsRes = {
  day: string,
  arenaTag: string,
  totalResults: number,
  wins: number,
  damage: number,
  assist: number,
  prestigePoints: number,
  kills: number
}


export function useMapsTable(data: Ref<MapsRes[]>, selectedDay: Ref<string | null>) {

  return computed(() => {

    let groupedByMap: MapsRes[] = []

    if (selectedDay.value) {
      groupedByMap = data.value.filter(d => d.day === selectedDay.value)
    } else {
      groupedByMap = Object.values(data.value.reduce((acc, curr) => {
        const key = curr.arenaTag
        if (!acc[key]) {
          acc[key] = { ...curr }
        } else {
          const prev = acc[key]
          prev.totalResults += curr.totalResults
          prev.wins += curr.wins
          prev.damage += curr.damage
          prev.assist += curr.assist
          prev.prestigePoints += curr.prestigePoints
          prev.kills += curr.kills
        }
        return acc
      }, {} as Record<string, MapsRes>))
    }

    return groupedByMap.map(v => {

      function avg(value: number) {
        if (v.totalResults === 0) return 0
        return value / v.totalResults
      }

      return {
        tag: v.arenaTag,
        battles: v.totalResults,
        winrate: avg(v.wins),
        damage: avg(v.damage),
        assist: avg(v.assist),
        prestigePoints: avg(v.prestigePoints),
        kills: avg(v.kills)
      }
    })

  })
}