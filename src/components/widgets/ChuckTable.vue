<template>
  <div class="container">
    <table class="hover-highlight">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th colspan="4" class="l-b" v-for="name in part.lines[0].split(',')">{{ name }}</th>
          <th colspan="2" class="l-b">Результат боя</th>
          <th colspan="6" class="l-b">Командный результат</th>
        </tr>
        <tr>
          <th>№</th>
          <th class="l-b">Карта</th>
          <template v-for="name in part.lines[0].split(',')">
            <th class="l-b">Танк</th>
            <th>Урон</th>
            <th>Фраги</th>
            <th>Очки</th>
          </template>
          <th class="l-b">Бой</th>
          <th>Очки</th>
          <th class="l-b">ХП</th>
          <th>Арта</th>
          <th>Время</th>
          <th>Урон</th>
          <th>Фраги</th>
          <th>Очки</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(item, i) in part.lines[1]">
          <!-- <td>{{ item }}</td> -->
          <td>{{ i + 1 }}</td>
          <td class="l-b">{{ nameFromTag(item.arena).value }}</td>

          <template v-for="player in item.players">
            <td class="l-b">{{ getTankName(player[1]) }}</td>
            <td>{{ player[2] }}</td>
            <td>{{ player[3] }}</td>
            <td>{{ player[4] }}</td>
          </template>

          <td class="l-b">{{ item.result }}</td>
          <td>{{ item.result == 'win' ? '3000' : '0' }}</td>
          <td class="l-b">{{ item.enemyTeamMaxHealth }}</td>
          <td>{{ item.spgCount }}</td>

          <td>
            <div class="time-align">
              <div class="left">{{ timeProcessor(item.duration)[0] }}</div>
              <div>:</div>
              <div class="right">{{ timeProcessor(item.duration)[1] }}</div>
            </div>
          </td>
          <td>{{ item.players.reduce((acc, t) => acc + t[2], 0) }}</td>
          <td>{{ item.players.reduce((acc, t) => acc + t[3], 0) }}</td>
          <td>{{ item.totalScore }}</td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <th colspan="2">Результат</th>
          <template v-for="player in part.sum">
            <th class="l-b"></th>
            <th>{{ player[0] }}</th>
            <th>{{ player[1] }}</th>
            <th>{{ player[2] }}</th>
          </template>
          <th rowspan="2" class="l-b">{{ usePercentProcessor(1)(part.winrate) }}</th>
          <th>{{ part.winScoreSum }}</th>
          <th class="l-b">{{ part.healthSum }}</th>
          <th>{{ part.spgSum }}</th>
          <th>{{ part.timeSum }}</th>
          <th>{{ part.dmgSum }}</th>
          <th>{{ part.killSum }}</th>
          <th>{{ part.scoreSum }}</th>
        </tr>

        <tr>
          <th colspan="2">Среднее</th>
          <template v-for="player in part.avg">
            <th class="l-b"></th>
            <th>{{ roundProcessor(player[0]) }}</th>
            <th>{{ roundProcessor(player[1], 10) }}</th>
            <th>{{ roundProcessor(player[2]) }}</th>
          </template>

          <th>{{ roundProcessor(part.winScoreAvg) }}</th>

          <th class="l-b"> {{ roundProcessor(part.healthAvg) }}</th>
          <th>{{ roundProcessor(part.spgAvg) }}</th>
          <th>
            <div class="time-align">
              <div class="left">{{ timeProcessor(part.timeAvg)[0] }}</div>
              <div>:</div>
              <div class="right">{{ timeProcessor(part.timeAvg)[1] }}</div>
            </div>
          </th>
          <th>{{ roundProcessor(part.dmgAvg) }}</th>
          <th>{{ roundProcessor(part.killAvg) }}</th>
          <th>{{ roundProcessor(part.scoreAvg) }}</th>
        </tr>

        <tr>
          <th colspan="2"></th>
          <template v-for="player in part.lines[1][0].players">
            <th class="l-b"></th>
            <th>Урон</th>
            <th>Фраги</th>
            <th>Очки</th>
          </template>

          <th class="l-b"></th>
          <th>Очки</th>
          <th class="l-b">ХП</th>
          <th>Арта</th>
          <th>Время</th>
          <th>Урон</th>
          <th>Фраги</th>
          <th>Очки</th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { roundProcessor, usePercentProcessor } from '@/composition/usePercentProcessor';
import { ChuckResult } from '@/db/schema';
import { timeProcessor } from '@/utils';
import { getArenaName, getTankName } from '@/utils/i18n';

const props = defineProps<{
  part: {
    lines: [string, ChuckResult[]];
    sum: number[][],
    avg: number[][],
    winrate: number,
    winScoreSum: number,
    winScoreAvg: number,
    healthSum: number,
    healthAvg: number,
    spgSum: number,
    spgAvg: number,
    timeSum: number,
    timeAvg: number,
    dmgSum: number,
    dmgAvg: number,
    killSum: number,
    killAvg: number,
    scoreSum: number,
    scoreAvg: number
  },
}>();

function nameFromTag(tag: string) {
  const key = tag.split('spaces/')[1] + '/name'
  return getArenaName(key)
}


</script>

<style lang="scss" scoped>
@import '/src/styles/table.scss';

.container {
  overflow-x: auto;
  // max-width: 1500px;
}

ul {
  margin-top: 0;
}

td {
  white-space: nowrap;
}

.time-align {
  display: flex;
  justify-content: center;

  .left {
    width: 50%;
    text-align: right;
  }

  .right {
    width: 50%;
    text-align: left;
  }
}


table {
  width: 100%;


  td,
  th {
    vertical-align: middle;
    text-align: center;
    font-size: 13px;
  }

  .r-b {
    border-right: $border;
  }

  .l-b {
    border-left: $border;
  }

  .b-t {
    border-top: $border;
  }

  thead {
    border-bottom: $border;
  }

  tfoot {
    border-top: $border;

    tr:last-child {
      border-top: $border;
    }
  }
}
</style>