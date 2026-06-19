import { computed } from 'vue'
import { Ref, watchEffect } from 'vue'

export type BattleRes = {
  day: string,
  tankTag: string,
  tankType: string,
  tankLevel: number,
  arena: string,
  team: number,
  ratingDelta: number,
  damage: number,
  assist: number,
  kills: number,
  prestigePoints: number,
  result: 'win' | 'loss' | 'draw',
}

export function useBattleResultTable(data: Ref<BattleRes[]>, selectedDay: Ref<string | null>) {

  return computed(() => {

    if (selectedDay.value) {
      return data.value.filter(d => d.day === selectedDay.value)
    }

    return data.value
  })
}