<template>
  <div class="onslaught-leaderboard-page">

    <input type="number" v-model="page" />

    <table>

      <thead>
        <tr>
          <th>№</th>
          <th>Игрок</th>
          <th class="battles-today-col">Бои за день</th>
          <th class="battles-total-multi">Бои всего</th>
          <th class="battles-total-single">Бои</th>
          <th>Очки</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="line in dataResult.data" :key="line.name">
          <LeaderboardLine :line="line" :game="game" @click="click(line.name)" :class="{
            'selected': selectedName == line.name,
          }" />
          <tr v-if="selectedName == line.name" class="details">
            <td colspan="6">
              <Detail />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { loading, queryComputed } from '@/db'
import { refDebouncedCheck } from '@/shared/utils/refDebouncedCheck'
import { computed, ref } from 'vue'
import LeaderboardLine from './LeaderboardLine.vue'
import { regionToGame } from '@/shared/game/wot'
import Detail from './Detail.vue'

const props = defineProps<{}>()

const page = ref(1)
const selectedName = ref<string | null>(null)
const region = ref<'RU' | 'NA' | 'EU' | 'ASIA'>('RU')
const game = computed(() => regionToGame(region.value))

const data = queryComputed<{
  name: string
  bdid: number
  clan: string | null
  clanColor: number
  lastRank: number
  lastDayRank: number
  lastBattlesCount: number
  lastDayBattlesCount: number
  lastRating: number
  lastDayRating: number
}>(() => `
  select name, bdid, clan, clanColor, lastRank, lastDayRank, lastBattlesCount, lastDayBattlesCount, lastRating, lastDayRating
  from Comp7LeaderboardDailyByRank
  where region = '${region.value}' and day = '2026-04-28' and lastRank between ${(page.value - 1) * 100 + 1} and ${page.value * 100}
  order by lastRank
`)

const dataResult = refDebouncedCheck(data, v => v.status == loading ? 500 : 0)

function click(name: string) {
  selectedName.value = selectedName.value == name ? null : name
}

</script>


<style lang="scss" scoped>
table {
  border-collapse: collapse;
  width: 100%;

  thead {
    tr {
      th {
        color: #c8c8c8;
        font-weight: normal;
        padding: 0px 15px;
        padding: 0px 15px;

        &:nth-child(1) {
          width: 60px;
        }

        &:nth-child(2) {
          text-align: left;
        }

        &:nth-child(3),
        &:nth-child(4),
        &:nth-child(5) {
          text-align: center;
          padding: 0px 5px;
          width: 100px;
        }

        &:nth-child(6) {
          width: 150px;
        }
      }
    }

    .battles-total-single {
      display: none;
    }
  }


  tbody {
    tr {
      // position: relative;
      cursor: pointer;
      -ms-touch-action: manipulation;
      touch-action: manipulation;

      &:not(.selected) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      &.selected {
        background: rgba(255, 255, 255, 0.03);
      }

      @media (hover: hover) {

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      }

    }


    .details {
      background-color: rgba(255, 255, 255, 0.03);

    }
  }

  @container (max-width: 700px) {
    thead {
      tr {
        th {
          &:nth-child(6) {
            width: 50px;
          }
        }
      }
    }
  }

  @container (max-width: 500px) {

    thead {
      tr {

        .battles-today-col,
        .battles-total-multi {
          display: none;
        }

        .battles-total-single {
          display: table-cell;
        }

        th {

          &:nth-child(1),
          &:nth-child(3),
          &:nth-child(4),
          &:nth-child(5),
          &:nth-child(6) {
            width: 55px;
          }
        }
      }
    }
  }

  @container (max-width: 400px) {

    thead {
      tr {
        .battles-total-single {
          display: none;
        }
      }
    }
  }
}
</style>