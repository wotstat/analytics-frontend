import { computed } from 'vue'
import { Ref, watchEffect } from 'vue'

export type VehicleRes = {
  day: string,
  tankTag: string,
  tankType: string,
  tankLevel: number,
  totalResults: number,
  wins: number,
  damage: number,
  assist: number,
  prestigePoints: number,
  kills: number
}


export function useVehicleTable(data: Ref<VehicleRes[]>, selectedDay: Ref<string | null>) {

  return computed(() => {

    let groupedByTank: VehicleRes[] = []

    if (selectedDay.value) {
      groupedByTank = data.value.filter(d => d.day === selectedDay.value)
    } else {
      groupedByTank = Object.values(data.value.reduce((acc, curr) => {
        const key = curr.tankTag
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
      }, {} as Record<string, VehicleRes>))
    }

    return groupedByTank.map(v => {

      function avg(value: number) {
        if (v.totalResults === 0) return 0
        return value / v.totalResults
      }

      return {
        tag: v.tankTag,
        type: v.tankType,
        level: v.tankLevel,
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