<template>
  <div class="container" ref="container">
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
            <img src="/kill.png" @click="click('kill')" :class="hightlight == 'kill' ? 'selected' : ''">
            <span class="tooltiptext">Фрагов</span>
          </td>
          <td>
            <img src="/block.png" @click="click('block')" :class="hightlight == 'block' ? 'selected' : ''" />
            <span class="tooltiptext">Натанковано</span>
          </td>
          <td>
            <img src="/spot.png" @click="click('radio')" :class="hightlight == 'radio' ? 'selected' : ''" />
            <span class="tooltiptext">Насвет</span>
          </td>
          <td>
            <img src="/dmg.png" @click="click('dmg')" :class="hightlight == 'dmg' ? 'selected' : ''" />
            <span class="tooltiptext">Урон</span>
          </td>

          <td class="center">ТОП</td>

          <td>
            <img src="/dmg.png" @click="click('dmg')" :class="hightlight == 'dmg' ? 'selected' : ''" />
            <span class="tooltiptext">Урон</span>
          </td>
          <td>
            <img src="/spot.png" @click="click('radio')" :class="hightlight == 'radio' ? 'selected' : ''" />
            <span class="tooltiptext">Насвет</span>
          </td>
          <td>
            <img src="/block.png" @click="click('block')" :class="hightlight == 'block' ? 'selected' : ''" />
            <span class="tooltiptext">Натанковано</span>
          </td>
          <td>
            <img src="/kill.png" @click="click('kill')" :class="hightlight == 'kill' ? 'selected' : ''">
            <span class="tooltiptext">Фрагов</span>
          </td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(item, index) in roundedTable">
          <td class="text-effect red">{{ item.youTeam.kill }}</td>
          <td class="text-effect blue">{{ item.youTeam.block }}</td>
          <td class="text-effect green">{{ item.youTeam.radio }}</td>
          <td class="text-effect orange">{{ item.youTeam.dmg }}</td>

          <td class="center">
            {{ item.place + 1 }}
            <div v-if="hightlighted[index]" class="bar-box left" :style="{ width: hightlighted[index].you + 'px' }"></div>
            <div v-if="hightlighted[index]" class="bar-box right" :style="{ width: hightlighted[index].opponent + 'px' }">
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
</template>


<script setup lang="ts">
import { StatParams, useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryAsync } from '@/db';
import { modeCount } from '@/utils/wot';
import { useElementVisibility, useElementSize } from '@vueuse/core';
import { computed, ref } from 'vue';

const { params } = defineProps<{
  params?: StatParams
}>()


const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const categoryContainer = ref<HTMLElement | null>(null);
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
  const mode = stat.battleMode
  if (mode == 'any') return 15
  return mode in modeCount ? (modeCount as any)[mode] : 15
})

function getQuery(result: 'win' | 'lose', team: 'you' | 'opponent') {

  const youResult = team == 'you' ? result : result == 'win' ? 'lose' : 'win'

  return `
  select place,
       avg(arrayJoin(placed).2) as avgDamage,
       avg(arrayJoin(placed).3) as avgBlacks,
       avg(arrayJoin(placed).4) as avgRadios,
       avg(arrayJoin(placed).5) as avgKills
from (select arrayFilter(t -> t.1 ${team == 'you' ? '=' : '!='} playerTeam,
                         arrayZip(
                                 playersResults.team,
                                 playersResults.damageDealt,
                                 playersResults.damageBlockedByArmor,
                                 playersResults.damageAssistedRadio,
                                 playersResults.kills))          as team,
             arrayReverseSort(team.2)                            as damages,
             arrayReverseSort(team.3)                            as blocks,
             arrayReverseSort(team.4)                            as radios,
             arrayReverseSort(team.5)                            as kills,
             arrayZip(range(${playersCount.value}), damages, blocks, radios, kills) as placed
      from Event_OnBattleResult
      where result = '${youResult}'
        and length(playersResults.team) = ${playersCount.value * 2}
        ${params ? whereClause(params, { withWhere: false }) : ''}
        )
group by arrayJoin(placed).1 as place;`
}

const shouldLoadOpponentLose = computed(() => visible.value && opponentTeamResult.value == 'lose')
const shouldLoadYouLose = computed(() => visible.value && youTeamResult.value == 'lose')

type TableItem = {
  place: number,
  avgDamage: number,
  avgBlacks: number,
  avgRadios: number,
  avgKills: number,
}

const youTramResultWin = queryAsync<TableItem>(getQuery('win', 'you'), visible)
const youTramResultLose = queryAsync<TableItem>(getQuery('lose', 'you'), shouldLoadYouLose)
const opponentTramResultWin = queryAsync<TableItem>(getQuery('win', 'opponent'), visible)
const opponentTramResultLose = queryAsync<TableItem>(getQuery('lose', 'opponent'), shouldLoadOpponentLose)

const table = computed(() => {

  const youTeam = youTeamResult.value == 'win' ? youTramResultWin.value : youTramResultLose.value
  const opponentTeam = opponentTeamResult.value == 'win' ? opponentTramResultWin.value : opponentTramResultLose.value

  const count = Math.max(youTeam.length, opponentTeam.length)

  return new Array(count).fill(0)
    .map((_, i) => {
      const place = i
      const youTeamItem = youTeam.find(item => item.place == place)
      const opponentTeamItem = opponentTeam.find(item => item.place == place)

      const team = (t: TableItem | undefined) => ({
        dmg: t?.avgDamage ?? 0,
        radio: t?.avgRadios ?? 0,
        block: t?.avgBlacks ?? 0,
        kill: t?.avgKills ?? 0,
      })

      return {
        place,
        youTeam: team(youTeamItem),
        opponentTeam: team(opponentTeamItem),
      }
    })
})

const roundedTable = computed(() => {
  const splitByThousent = (t: number) => {
    if (t < 1000) return t
    return `${Math.floor(t / 1000)} ${t.toString().slice(1)}`
  }

  const round = (t: { dmg: number, radio: number, block: number, kill: number }) => ({
    dmg: splitByThousent(Math.round(t.dmg)),
    radio: splitByThousent(Math.round(t.radio)),
    block: splitByThousent(Math.round(t.block)),
    kill: Math.round(t.kill * 10) / 10,
  })

  return table.value.map(t => ({
    place: t.place,
    opponentTeam: round(t.opponentTeam),
    youTeam: round(t.youTeam)
  }))
})

const hightlighted = computed(() => {
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
$bar-color: #8181813e;

.container {
  overflow-x: auto;
}

td,
th {
  // border: 1px solid rgba(190, 190, 190, 0.231);
}

$border: 1px solid rgba(240, 240, 240, 0.327);

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