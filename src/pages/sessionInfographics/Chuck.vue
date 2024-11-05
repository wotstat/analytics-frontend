<template>

  <h2 class="page-title">Очки Чака</h2>
  <div class="flex ver chuck">
    <p>
      Подсчитывает очки по правилам <a href="https://lebwa.tv/landing/chuck-norris-tournament-vk-play-live-2023"
        target="_blank">Турнира Чака</a>. Работает для любых боёв, ничего дополнительно настраивать не нужно.
      Работает и <b>взводом</b> и <b>соло</b>. Таблицы результатов эквивалентны турнирным таблицам.
    </p>
    <p>Используются правила 2023 года:</p>
    <ul>
      <li>Победа – 3000 очков</li>
      <li>Фраг – 300 очков</li>
      <li>1 урон – 1 очко</li>
    </ul>

    <template v-if="allow">
      <div class="flex">
        <button class="light" @click="showWidget = true">Виджет для OBS</button>
        <button class="light" @click="showTimecodes = true">Таймкоды для стрима</button>
      </div>

      <div :class="classSettings">
        <div>
          <input type="checkbox" name="color" id="color" v-model="colorDecoration">
          <label for="color ">Цветовая разметка.
            <span class="text-effect red">Плохой</span>;
            <span class="text-effect yellow">Средний +- 25%</span>;
            <span class="text-effect green">Хороший</span>
          </label>
        </div>

        <div v-if="colorDecoration">
          <input type="checkbox" name="contrast" id="contrast" v-model="contrastDecoration">
          <label for="contrast">Повышенная контрастность</label>
        </div>

        <div>
          <input type="checkbox" name="without-observers" id="without-observers" v-model="withoutObservers">
          <label for="without-observers">Исключить наблюдателей</label>
        </div>
      </div>

      <div :class="classSettings" class="flex ver">
        <ServerStatusWrapper :status="response.status">
          <div v-if="response.status == loading" class="card">
            <table class="hover-highlight" width="100%">
              <tbody>
                <tr class="skeleton" v-for="i in new Array(5)">
                  <td colspan="4"></td>
                  <td></td>
                  <td colspan="4"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <FullScreenCard v-for="part in totalResult">
            <ChuckTable :part="part" :show-date="false" />
            <template v-slot:full>
              <div :class="classSettings" class="fullscreen">
                <ChuckTable :part="part" :show-date="true" />
              </div>
            </template>
            <template v-slot:control>
              <div class="icon" @click="downloadCsv(part)">
                <DownloadIcon />
              </div>
              <div class="icon" @click="copy(part)">
                <CopyIcon />
              </div>
            </template>
          </FullScreenCard>
        </ServerStatusWrapper>


      </div>
    </template>
    <div v-else class="card flex center">
      <b>Необходимо в фильтрах указать ник игрока (шестерёнка рядом с заголовком)</b>
    </div>

    <PopupWindow title="Виджет для OBS" v-if="showWidget" @close="showWidget = false">
      <ChuckInfo />
    </PopupWindow>

    <PopupWindow title="Таймкоды для стрима" v-if="showTimecodes" @close="showTimecodes = false">
      <Timecodes />
    </PopupWindow>
  </div>
</template>

<script lang="ts" setup>
import FullScreenCard from '@/components/FullScreenCard.vue';
import PopupWindow from '@/components/PopupWindow.vue';
import ServerStatusWrapper from '@/components/ServerStatusWrapper.vue';
import ChuckTable from '@/components/widgets/ChuckTable.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { dbIndexToDate, loading, queryAsync, queryComputed, success } from '@/db';
import { ChuckResult } from '@/db/schema';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import ChuckInfo from '../obs/ChuckInfo.vue';
import Timecodes from '@/components/Timecodes.vue'

import CopyIcon from '@/assets/icons/copy.svg'

import DownloadIcon from '@/assets/icons/download.svg'

const colorDecoration = useLocalStorage('chuckColorDecoration', true)
const contrastDecoration = useLocalStorage('chuckHightContrast', true)
const withoutObservers = useLocalStorage('withoutObservers', true)

const showWidget = ref(false)
const showTimecodes = ref(false)

const classSettings = computed(() => {
  return [
    !colorDecoration.value ? 'disable-effect' : '',
    colorDecoration.value && contrastDecoration.value ? 'without-shadow' : ''
  ].join(' ')
})

const params = useQueryStatParams()

const allow = computed(() => params.value.player != null)

const response = queryComputed<ChuckResult>(() => `
with
   groupArray(pname) as name,
   groupArray(ptag) as tag,
   groupArray(pdmg) as dmg,
   groupArray(pkill) as kill,
   groupArray(toUInt32(pdmg + pkill * 300)) as score
select
       id,
       onBattleStartId,
       dateTime,
       arena,
       result,
       duration,
       spgCount,
       enemyTeamMaxHealth,
       arraySort(t -> t.1, arrayZip(name, tag, dmg, kill, score)) as players,
       toUInt32(arraySum(players.5) + if(result = 'win', 3000, 0)) as totalScore
from (select arenaTag as arena,
             id,
             dateTime,
             result,
             duration,
             onBattleStartId,
             spgCount / 2 as spgCount,
             enemyTeamMaxHealth,
             team as playerTeam,
             personal.squadID as playerSquad,
             playersResults.squadID as squads,
             playerName as playerName,
             playersResults.name as names,
             playersResults.damageDealt as damages,
             playersResults.kills as kills,
             playersResults.tankTag as tankTags,
             playersResults.team as teams
      from Event_OnBattleResult
      ${whereClause(params)}
      order by id desc)
array join squads as psquad,
           names as pname,
           damages as pdmg,
           kills as pkill,
           tankTags as ptag,
           teams as pteam
where psquad = playerSquad and pteam = playerTeam ${withoutObservers.value ? `and ptag != 'ussr:Observer'` : ''} and playerSquad != 0 or pname = playerName 
group by onBattleStartId, arena, result, duration, id, dateTime, spgCount, enemyTeamMaxHealth
order by id desc
`, { enabled: allow })

const splittedResult = computed(() => {
  let parts = new Map<string, ChuckResult[]>()

  for (const item of response.value.data) {
    const key = item.players.map(t => t[0]).join(',')
    if (!parts.has(key)) parts.set(key, [])
    parts.get(key)?.push(item)
  }

  return [...parts.entries()]
})

const totalResult = computed(() => {
  return splittedResult.value.map(t => {

    const results = t[1]

    const playerCount = results[0].players.length


    const sum = results
      .map(t => t.players)
      .reduce((a, v) => {
        for (let i = 0; i < playerCount; i++) {
          a[i][0] += v[i][2]
          a[i][1] += v[i][3]
          a[i][2] += v[i][4]
        }
        return a
      }, new Array(playerCount).fill(0).map(() => [0, 0, 0]))


    const battleCount = results.length


    const avg = sum.map(s => s.map(v => v / battleCount))

    const winrate = results.filter(t => t.result == 'win').length / battleCount
    const winScoreSum = results.reduce((acc, t) => acc + (t.result == 'win' ? 3000 : 0), 0)
    const winScoreAvg = winScoreSum / battleCount

    const healthSum = results.reduce((acc, t) => acc + t.enemyTeamMaxHealth, 0)
    const healthAvg = healthSum / battleCount

    const spgSum = results.reduce((acc, t) => acc + t.spgCount, 0)
    const spgAvg = spgSum / battleCount

    const timeSum = results.reduce((acc, t) => acc + t.duration, 0)
    const timeAvg = timeSum / battleCount

    const dmgSum = results.reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[2], 0), 0)
    const dmgAvg = dmgSum / battleCount

    const killSum = results.reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[3], 0), 0)
    const killAvg = killSum / battleCount

    const scoreSum = results.reduce((acc, t) => acc + t.totalScore, 0)
    const scoreAvg = scoreSum / battleCount

    results.reverse()

    return {
      lines: t,
      sum,
      avg,
      winrate,
      winScoreSum,
      winScoreAvg,
      healthSum,
      healthAvg,
      spgSum,
      spgAvg,
      timeSum,
      timeAvg,
      dmgSum,
      dmgAvg,
      killSum,
      killAvg,
      scoreSum,
      scoreAvg

    }
  })
})

function getTable(part: typeof totalResult.value[number]) {
  const players = [
    '', '',
    ...part.lines[0].split(',').flatMap(t => [t, '', '', '']),
  ]

  const header =
    ['date', 'map', ...new Array(part.avg.length).fill(0).flatMap(t => ['tank', 'dmg', 'kill', 'score']), 'result', 'total', 'duration']

  return [
    players,
    header,
    ...part.lines[1].map(t => ([
      new Date(dbIndexToDate(t.onBattleStartId) * 1000).toISOString(),
      t.arena,
      ...t.players.flatMap(t => [
        t[1],
        t[2],
        t[3],
        t[4]
      ]),
      t.result,
      t.totalScore,
      t.duration
    ]))
  ]
}


function copy(part: typeof totalResult.value[number]) {
  const res = getTable(part).map(t => t.join('\t')).join('\n')
  navigator.clipboard.writeText(res)
  alert('Скопировано в буфер обмена')
}

function downloadCsv(part: typeof totalResult.value[number]) {

  const res = getTable(part).map(t => t.join(',')).join('\n')

  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=UTF-8,' + encodeURIComponent(res));
  element.setAttribute('download', 'chuck.csv');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

</script>

<style lang="scss" scoped>
@use '/src/styles/table.scss' as *;

.container {
  overflow-x: auto;
}

ul {
  margin-top: 0;
}

td {
  white-space: nowrap;
}

.fullscreen {
  :deep(th) {
    width: 60px;
  }
}
</style>