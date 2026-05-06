<template>
  <div class="onslaught-leaderboard-page">

    <input type="number" v-model="page" />

    <table>
      <thead>
        <tr>
          <th>№</th>
          <th>Игрок</th>
          <th>Бои</th>
          <th>Очки</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="line in dataResult.data" :key="line.name">
          <td>{{ line.lastRank }}</td>
          <td>{{ line.name }}</td>
          <td>{{ line.lastBattlesCount }}</td>
          <td>{{ line.lastRating }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { loading, query, queryComputed } from '@/db'
import { watchWithAbortSignal } from '@/shared/utils/core'
import { refDebouncedCheck } from '@/shared/utils/refDebouncedCheck'
import { refThrottledCheck } from '@/shared/utils/refThrottledCheck'
import { refDebounced, refThrottled } from '@vueuse/core'
import { ref, watchEffect } from 'vue'

const props = defineProps<{}>()

const page = ref(1)

const data = queryComputed<{
  lastRank: number,
  firstRank: number,
  lastRating: number,
  firstRating: number,
  name: string,
  clan: string,
  clanColor: string,
  lastBattlesCount: number,
}>(() => `
  select lastRank, firstRank, lastRating, firstRating, name, clan, clanColor, lastBattlesCount
  from Comp7LeaderboardDailyByRank
  where region = 'RU' and day = '2026-04-28' and lastRank between ${(page.value - 1) * 100 + 1} and ${page.value * 100}
  order by lastRank
`)

const dataResult = refDebouncedCheck(data, v => v.status == loading ? 500 : 0)


</script>


<style lang="scss" scoped></style>