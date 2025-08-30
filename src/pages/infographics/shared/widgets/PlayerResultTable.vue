<template>
  <ServerStatusWrapper :status="loadingStatus" v-slot="{ showError, status }">
    <div class="container" ref="container" v-if="status != 'error'">
      <table class="hover-highlight">
        <thead>
          <tr>
            <th colspan="9" class="title" ref="categoryContainer">Среднее распределение показателей по топу команд</th>
          </tr>

          <tr>
            <th colspan="4" class="title" ref="categoryContainer">Ваша команда</th>
            <th></th>
            <th colspan="4" class="title">Команда противников</th>
          </tr>

          <tr>
            <th colspan="4">
              <select v-model="youTeamResult">
                <option value="win">Победила</option>
                <option value="lose">Проиграла</option>
              </select>
            </th>

            <th></th>

            <th colspan="4">
              <select v-model="opponentTeamResult">
                <option value="win">Победила</option>
                <option value="lose">Проиграла</option>
              </select>
            </th>
          </tr>

          <tr>
            <td>
              <img src="@/assets/efficiency-icon/kill.png" @click="click('kill')"
                :class="hightlight == 'kill' ? 'selected' : ''">
              <span class="tooltiptext">Фрагов</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/block.png" @click="click('block')"
                :class="hightlight == 'block' ? 'selected' : ''" />
              <span class="tooltiptext">Натанковано</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/spot.png" @click="click('radio')"
                :class="hightlight == 'radio' ? 'selected' : ''" />
              <span class="tooltiptext">Насвет</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/dmg.png" @click="click('dmg')"
                :class="hightlight == 'dmg' ? 'selected' : ''" />
              <span class="tooltiptext">Урон</span>
            </td>

            <td class="center">ТОП</td>

            <td>
              <img src="@/assets/efficiency-icon/dmg.png" @click="click('dmg')"
                :class="hightlight == 'dmg' ? 'selected' : ''" />
              <span class="tooltiptext">Урон</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/spot.png" @click="click('radio')"
                :class="hightlight == 'radio' ? 'selected' : ''" />
              <span class="tooltiptext">Насвет</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/block.png" @click="click('block')"
                :class="hightlight == 'block' ? 'selected' : ''" />
              <span class="tooltiptext">Натанковано</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/kill.png" @click="click('kill')"
                :class="hightlight == 'kill' ? 'selected' : ''">
              <span class="tooltiptext">Фрагов</span>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr class="skeleton" v-for="i in new Array(5)" v-if="status == 'loading'">
            <td colspan="4"></td>
            <td></td>
            <td colspan="4"></td>
          </tr>
          <tr v-for="(item, index) in roundedTable" v-else>
            <td class="text-effect red">{{ item.youTeam.kill }}</td>
            <td class="text-effect blue">{{ item.youTeam.block }}</td>
            <td class="text-effect green">{{ item.youTeam.radio }}</td>
            <td class="text-effect orange">{{ item.youTeam.dmg }}</td>

            <td class="center">
              {{ item.place + 1 }}
              <div v-if="highlighted[index]" class="bar-box left" :style="{ width: highlighted[index].you + 'px' }">
              </div>
              <div v-if="highlighted[index]" class="bar-box right"
                :style="{ width: highlighted[index].opponent + 'px' }">
              </div>
            </td>

            <td class="text-effect orange">{{ item.opponentTeam.dmg }}</td>
            <td class="text-effect green">{{ item.opponentTeam.radio }}</td>
            <td class="text-effect blue">{{ item.opponentTeam.block }}</td>
            <td class="text-effect red">{{ item.opponentTeam.kill }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">
import { StatParams, getQueryStatParamsCache, useQueryStatParams, whereClause } from '@/shared/query/useQueryStatParams'
import { mergeStatuses, queryAsync } from '@/db'
import { modeCount } from '@/utils/wot'
import { useElementVisibility, useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import ServerStatusWrapper from '../ServerStatusWrapper.vue'
import { fixedSpaceProcessor } from '@/shared/processors/processors'
import { bestMV } from '@/db/schema'

const { params } = defineProps<{
  params: StatParams
}>()


const container = ref<HTMLElement | null>(null)
const enabled = useElementVisibility(container)

const categoryContainer = ref<HTMLElement | null>(null)
const { width } = useElementSize(categoryContainer)

const youTeamResult = ref<'win' | 'lose'>('win')
const opponentTeamResult = ref<'win' | 'lose'>('win')
const hightlight = ref<'none' | 'dmg' | 'radio' | 'block' | 'kill'>('dmg')

function click(on: 'dmg' | 'radio' | 'block' | 'kill') {
  if (hightlight.value == on) hightlight.value = 'none'
  else hightlight.value = on
}

const stat = useQueryStatParams()
const playersCount = computed(() => {
  const mode = stat.value.battleMode
  if (mode == 'any') return 15
  return mode in modeCount ? (modeCount as any)[mode] : 15
})

function getQuery(result: 'win' | 'lose') {

  const best = bestMV('team_results', params)

  const query = best ? `
  with
    avgForEachMerge(allyDamages) as allyDamagesA,
    avgForEachMerge(allyBlocks) as allyBlocksA,
    avgForEachMerge(allyRadios) as allyRadiosA,
    avgForEachMerge(allyKills) as allyKillsA,
    avgForEachMerge(enemyDamages) as enemyDamagesA,
    avgForEachMerge(enemyBlocks) as enemyBlocksA,
    avgForEachMerge(enemyRadios) as enemyRadiosA,
    avgForEachMerge(enemyKills) as enemyKillsA,
    arrayJoin(arrayZip(range(${playersCount.value}), allyDamagesA, allyBlocksA, allyRadiosA, allyKillsA, enemyDamagesA, enemyBlocksA, enemyRadiosA, enemyKillsA)) as arr
  select arr.1 as place, 
        arr.2 as allyDamage,
        arr.3 as allyBlock,
        arr.4 as allyRadio,
        arr.5 as allyKill,
        arr.6 as enemyDamage,
        arr.7 as enemyBlock,
        arr.8 as enemyRadio,
        arr.9 as enemyKill
  from ${best}
  where result = '${result}'
  and playersCount = ${playersCount.value * 2}
  ${whereClause(params, { withWhere: false })};
  ` : `
  with
      arrayZip(playersResults.team, playersResults.damageDealt, playersResults.damageBlockedByArmor, playersResults.damageAssistedRadio, playersResults.kills) as teamValues,
      arrayFilter(t -> t.1 = playerTeam, teamValues) as allyTeam,
      arrayFilter(t -> t.1 != playerTeam, teamValues) as enemyTeam,
      length(playersResults.team) as playersCount,
      avgForEach(arrayReverseSort(allyTeam.2))  as allyDamages,
      avgForEach(arrayReverseSort(allyTeam.3))  as allyBlocks,
      avgForEach(arrayReverseSort(allyTeam.4))  as allyRadios,
      avgForEach(arrayReverseSort(allyTeam.5))  as allyKills,
      avgForEach(arrayReverseSort(enemyTeam.2)) as enemyDamages,
      avgForEach(arrayReverseSort(enemyTeam.3)) as enemyBlocks,
      avgForEach(arrayReverseSort(enemyTeam.4)) as enemyRadios,
      avgForEach(arrayReverseSort(enemyTeam.5)) as enemyKills,
      arrayJoin(arrayZip(range(${playersCount.value}), allyDamages, allyBlocks, allyRadios, allyKills, enemyDamages, enemyBlocks, enemyRadios, enemyKills)) as arr
    select arr.1 as place, 
        arr.2 as allyDamage,
        arr.3 as allyBlock,
        arr.4 as allyRadio,
        arr.5 as allyKill,
        arr.6 as enemyDamage,
        arr.7 as enemyBlock,
        arr.8 as enemyRadio,
        arr.9 as enemyKill
  from Event_OnBattleResult
  where result = '${result}'
  and playersCount = ${playersCount.value * 2}
  ${whereClause(params, { withWhere: false })};
  `

  return query
}

const shouldLoadLose = computed(() => enabled.value && youTeamResult.value == 'lose' || opponentTeamResult.value == 'win')

type TableItem = {
  place: number,
  allyDamage: number,
  allyBlock: number,
  allyRadio: number,
  allyKill: number,
  enemyDamage: number,
  enemyBlock: number,
  enemyRadio: number,
  enemyKill: number,
}

const teamResultWin = queryAsync<TableItem>(getQuery('win'), { enabled, settings: { ...getQueryStatParamsCache(params), query_cache_nondeterministic_function_handling: 'save' } })
const teamResultLose = queryAsync<TableItem>(getQuery('lose'), { enabled: shouldLoadLose, settings: { ...getQueryStatParamsCache(params), query_cache_nondeterministic_function_handling: 'save' } })

const loadingStatus = computed(() => {
  if (youTeamResult.value == 'lose' || opponentTeamResult.value == 'lose') return teamResultLose.value.status
  return teamResultWin.value.status
})

const table = computed(() => {

  const youTeam = youTeamResult.value == 'win' ? teamResultWin.value.data : teamResultLose.value.data
  const opponentTeam = opponentTeamResult.value == 'win' ? teamResultLose.value.data : teamResultWin.value.data

  const count = Math.max(youTeam.length, opponentTeam.length)

  return new Array(count).fill(0)
    .map((_, i) => {
      const place = i
      const youTeamItem = youTeam.find(item => item.place == place)
      const opponentTeamItem = opponentTeam.find(item => item.place == place)

      return {
        place,
        youTeam: {
          dmg: youTeamItem?.allyDamage ?? 0,
          radio: youTeamItem?.allyRadio ?? 0,
          block: youTeamItem?.allyBlock ?? 0,
          kill: youTeamItem?.allyKill ?? 0,
        },
        opponentTeam: {
          dmg: opponentTeamItem?.enemyDamage ?? 0,
          radio: opponentTeamItem?.enemyRadio ?? 0,
          block: opponentTeamItem?.enemyBlock ?? 0,
          kill: opponentTeamItem?.enemyKill ?? 0,
        },
      }
    })
})

const roundedTable = computed(() => {
  const processor = fixedSpaceProcessor(0)

  const round = (t: { dmg: number, radio: number, block: number, kill: number }) => ({
    dmg: processor(Math.round(t.dmg)),
    radio: processor(Math.round(t.radio)),
    block: processor(Math.round(t.block)),
    kill: Math.round(t.kill * 10) / 10,
  })

  return table.value.map(t => ({
    place: t.place,
    opponentTeam: round(t.opponentTeam),
    youTeam: round(t.youTeam)
  }))
})

const highlighted = computed(() => {
  const hightlightValue = hightlight.value
  const t = table.value

  if (hightlightValue === 'none') return new Array(t.length).fill(false)

  const max = Math.max(...t.map(i => i.youTeam[hightlightValue]), ...t.map(i => i.opponentTeam[hightlightValue]))

  const res = t.map(t => ({
    you: t.youTeam[hightlightValue] / max * width.value * 0.95,
    opponent: t.opponentTeam[hightlightValue] / max * width.value * 0.95
  }))

  return res
})

</script>


<style lang="scss" scoped>
@use '/src/styles/table.scss' as *;

.container {
  overflow-x: auto;
}

td {

  &:hover {
    .tooltiptext {
      animation-duration: 1.5s;
      animation-name: showTooltip;
      animation-iteration-count: 1;
      animation-fill-mode: forwards;

      @keyframes showTooltip {
        from {
          opacity: 0;
        }

        90% {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }
    }
  }

  .tooltiptext {
    position: absolute;
    top: -18px;
    background-color: #474747;
    border-radius: 5px;
    text-align: center;
    left: 0;
    right: 0;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
    box-shadow: 0px 1px 15px 0 #00000014;
    pointer-events: none;
  }
}

thead {
  border-bottom: $border;

  img {
    width: 35px;
    border-radius: 10px;
    cursor: pointer;

    &.selected {
      background-color: $bar-color;
    }
  }
}

.center {
  border-left: $border;
  border-right: $border;
}

table {
  border-collapse: collapse;
  width: 100%;
  position: relative;
  z-index: 5;

  .title {
    width: 50%;
  }

  .center {
    width: 0.5%;
    padding: 0 5px;
  }

  tr {
    td {
      text-align: center;
      width: 10%;
      position: relative;
      padding: 0 4px;
      white-space: nowrap;
    }
  }
}

.bar-box {
  $radius: 5px;

  background-color: $bar-color;
  top: 2px;
  bottom: 2px;
  position: absolute;
  z-index: -1;

  &.left {
    right: 100%;
    border-top-left-radius: $radius;
    border-bottom-left-radius: $radius;
  }

  &.right {
    left: 100%;
    border-top-right-radius: $radius;
    border-bottom-right-radius: $radius;
  }

  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);

}
</style>