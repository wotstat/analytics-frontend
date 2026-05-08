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
          <tr @click="click(line.name)" :class="{
            'selected': selectedName == line.name,
          }">
            <td class="rank">
              <span class="value">{{ spaceProcessor(line.lastRank) }}</span>
              <span v-if="line.lastDayRank == 0" class="new">NEW</span>
              <span v-else-if="line.lastDayRank - line.lastRank != 0" class="delta" :class="{
                'up': line.lastDayRank - line.lastRank > 0,
                'down': line.lastDayRank - line.lastRank < 0,
              }">
                <TriangleUp class="triangle" /> {{ Math.abs(line.lastDayRank - line.lastRank) }}
              </span>
              <span v-else class="no-change">–</span>
            </td>

            <td class="player-name">
              <span class="name">{{ line.name }}</span>
              <span class="clan-tag" :style="{
                color: `#${line.clanColor.toString(16).padStart(6, '0')}`,
              }" v-if="line.clan"> [{{ line.clan }}]</span>
            </td>

            <td class="battles-today">
              <span v-if="line.lastDayRank != 0 && line.lastBattlesCount - line.lastDayBattlesCount != 0"
                class="battles-delta">
                {{ line.lastBattlesCount - line.lastDayBattlesCount }}
              </span>
              <span v-else>–</span>
            </td>

            <td class="battles-total">
              <span>{{ line.lastBattlesCount }}</span>
            </td>

            <td class="rating">
              <span class="value">{{ spaceProcessor(line.lastRating) }}</span>
              <span v-if="line.lastDayRank == 0" class="new">NEW</span>
              <span v-else-if="line.lastRating - line.lastDayRating != 0" class="delta" :class="{
                'up': line.lastRating - line.lastDayRating > 0,
                'down': line.lastRating - line.lastDayRating < 0,
              }">
                <TriangleUp class="triangle" /> {{ Math.abs(line.lastRating - line.lastDayRating) }}
              </span>
              <span v-else class="no-change">–</span>
            </td>
          </tr>
          <tr v-if="selectedName == line.name" class="details">
            <td colspan="6">
              <!-- Additional details for the selected player -->
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
import { ref } from 'vue'

import TriangleUp from './assets/triangle-up.svg'
import { spaceProcessor } from '@/shared/utils/processors/useSpaceProcessor'

const props = defineProps<{}>()

const page = ref(1)
const selectedName = ref<string | null>(null)

const data = queryComputed<{
  lastRank: number,
  lastDayRank: number,
  lastRating: number,
  firstRating: number,
  name: string,
  clan: string,
  clanColor: number,
  lastBattlesCount: number,
  lastDayBattlesCount: number,
  lastDayRating: number
}>(() => `
  select lastRank, lastDayRank, lastRating, firstRating, name, clan, clanColor,
    lastBattlesCount, lastDayBattlesCount, lastDayRating
  from Comp7LeaderboardDailyByRank
  where region = 'RU' and day = '2026-04-28' and lastRank between ${(page.value - 1) * 100 + 1} and ${page.value * 100}
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
        &:nth-child(4) {
          text-align: center;
          padding: 0px 5px;
        }
      }
    }

    .battles-total-single {
      display: none;
    }
  }


  tbody {
    tr {
      position: relative;
      cursor: pointer;
      -ms-touch-action: manipulation;
      touch-action: manipulation;

      // &:nth-child(odd) {
      //   background: rgba(255, 255, 255, 0.025);
      // }

      &:not(.selected) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      &.selected {
        background: rgba(255, 255, 255, 0.03);
      }


      &:hover {
        background: rgba(255, 255, 255, 0.03);

        // &::after {
        //   content: '';
        //   position: absolute;
        //   left: -4px;
        //   top: 0;
        //   bottom: 0;
        //   background: var(--blue-color);
        //   width: 4px;
        //   border-top-left-radius: 3px;
        //   border-bottom-left-radius: 3px;
        // }
      }


      td {
        padding: 20px 15px;
        line-height: 1.2;
        white-space: nowrap;
        color: white;
      }

      .rank {
        font-variant-numeric: tabular-nums;

        .value {
          display: inline-block;
          min-width: 3ch;
          text-align: right;
        }
      }

      .player-name {
        white-space: wrap;
      }

      .rating {
        font-variant-numeric: tabular-nums;
        text-align: center;

        .value {
          display: inline-block;
          min-width: 5ch;
          text-align: right;
          font-weight: bold;
        }

        .delta,
        .new,
        .no-change {
          display: inline-block;
          min-width: 5ch;
          text-align: left;
        }

        .new {
          min-width: calc(5ch / 0.75);
        }
      }

      .battles-today {
        text-align: center;
        color: #c8c8c8;
      }

      .battles-total {
        text-align: center;
        color: #c8c8c8;
      }
    }

    .delta {

      .triangle {
        display: inline-block;
        height: 0.6em;
      }

      &.down {
        color: #ff6060;

        .triangle {
          transform: rotate(180deg);
        }
      }

      &.up {
        color: #57ff6e;
      }
    }

    .new {
      font-size: 0.75em;
      color: #ffd557;
      font-weight: bold;
    }

    .no-change {
      color: #717171;
      font-weight: bold;
    }

    .delta,
    .new,
    .no-change {
      margin-left: 10px;
    }


    .details {
      background-color: rgba(255, 255, 255, 0.03);
    }
  }

  @container (max-width: 700px) {

    tbody {
      tr {
        td {
          font-size: 14px;
        }
      }

      .rank,
      .rating {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10px 15px;
        gap: 5px;
        text-align: center;

        .value {
          min-width: auto;
        }

        .delta,
        .new,
        .no-change {
          margin-left: 0;
        }
      }

      .rating {

        .delta,
        .new,
        .no-change {
          min-width: auto;
        }
      }
    }
  }

  @container (max-width: 500px) {
    .player-name {
      padding: 10px 5px;
      word-break: break-all;

      .clan-tag {
        display: none;
      }
    }

    .battles-today-col,
    .battles-today,
    .battles-total-multi {
      display: none;
    }

    thead {
      tr {
        .battles-total-single {
          display: table-cell;
        }
      }
    }
  }

  @container (max-width: 400px) {

    .battles-total {
      display: none;
    }

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