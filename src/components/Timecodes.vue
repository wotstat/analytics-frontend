<template>
  <div class="popup-container without-shadow" v-if="params.player">
    <p>
      Вычисляет таймкоды для записи стрима. <a href="https://www.youtube.com/watch?v=zoDMW87S_kc" target="_blank"
        rel="noopener noreferrer">Видео туториал</a> как пользоваться.
    </p>

    <h3 class="text-effect green">Шаг 1</h3>
    <p>
      Укажите таймкод любого боя. Если стрим прерывался по техническим причинам,
      вы можете указать таймкод до и после прерывания.
    </p>
    <br>
    <div class="battles-table">
      <table class="hover-highlight" width="100%">
        <thead>
          <tr>
            <th>Таймкод</th>
            <!-- <th>Время, мск</th>  -->
            <th>Карта</th>
            <th>Танк</th>
            <th>Урон</th>
            <th>Очки</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(battle, i) in result.data">
            <td class="timecode">
              <input type="text" :placeholder="getTimecode(processedTimings[i])" v-model="timings[i]">
            </td>
            <!-- <td>{{ getDate(battle.dateTime) }}</td> -->
            <td>{{ nameFromTag(battle.arenaTag).value }}</td>
            <td>{{ getTankName(battle.tankTag, true) }}</td>
            <td>{{ battle.pDmg }}</td>
            <td>{{ battle.chuck }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-effect green">Шаг 2</h3>
    <div class="flex">
      <p class="flex-1">Укажите формат сообщения</p>
      <a v-if="formatTemplate != defaultTemplate" @click.prevent="formatTemplate = defaultTemplate">Сбросить</a>
    </div>
    <div class="flex">
      <input type="text" class="format flex-1" v-model="formatTemplate">
    </div>
    <ul>
      <li>{time} – таймкод</li>
      <li>{tank} – название танка</li>
      <li>{map} – название карты</li>
      <li>{dmg} – урон</li>
      <li>{radio} – насвет</li>
      <li>{xp} – чистый опыт</li>
      <li>{frags} – фраги</li>
      <li>{gm} – сумма для отметки</li>
      <li>{chuck} – сумма очков Чака</li>
      <li>{rank} – место в Стальном Охотнике</li>
      <li>{comment} – подпись хорошего и наилучшего боя (по очкам Чака)</li>
    </ul>

    <h3 class="text-effect green">Шаг 3</h3>
    <p>
      Скопируйте таймкоды и вставьте в описание записи стрима
    </p>
    <br>
    <div class="result">
      {{ resultTimecodes }}
    </div>
    <br>
    <div class="flex">
      <button @click="copy">Скопировать</button>
    </div>
  </div>
  <div class="popup-container" v-else>
    <b>Необходимо в фильтрах указать ник игрока (шестерёнка рядом с заголовком)</b>
  </div>
</template>


<script setup lang="ts">
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryComputed } from '@/db';
import { getArenaName, getTankName } from '@/utils/i18n';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const defaultTemplate = '{time} {tank} | {map} | {chuck} {comment}'
const formatTemplate = useLocalStorage('timecodesFormatTemplate', defaultTemplate)
const timings = ref<string[]>([])

const params = useQueryStatParams()

function nameFromTag(tag: string) {
  const key = tag.split('spaces/')[1] + '/name'
  return getArenaName(key)
}

function getDate(dateString: string) {
  return new Date(dateString).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimecode(time: number) {
  if (time < 0) return 'До начала'
  const seconds = time % 60
  const minutes = Math.floor(time / 60) % 60
  const hours = Math.floor(time / 60 / 60)

  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const processedTimings = computed(() => {
  const res = new Array<number>(timings.value.length).fill(0)
  if (result.value.data.length === 0) return res

  let lastTime = 0
  let lastDate = new Date(result.value.data[0].dateTime)

  const firstIndex = timings.value.findIndex(t => t)
  if (firstIndex > 0) {
    const [seconds, minutes, hours] = timings.value[firstIndex].split(':').map(Number).reverse()
    if (seconds) lastTime += seconds
    if (minutes) lastTime += minutes * 60
    if (hours) lastTime += hours * 60 * 60

    lastDate = new Date(result.value.data[firstIndex].dateTime)
  }

  for (let i = 0; i < timings.value.length; i++) {
    const time = timings.value[i]
    const date = new Date(result.value.data[i].dateTime)
    if (time) {
      const [seconds, minutes, hours] = time.split(':').map(Number).reverse()
      lastTime = 0
      if (seconds) lastTime += seconds
      if (minutes) lastTime += minutes * 60
      if (hours) lastTime += hours * 60 * 60

      lastDate = new Date(result.value.data[i].dateTime)
    }

    const dateDelta = date.getTime() - lastDate.getTime()
    res[i] = (lastTime + Math.round(dateDelta / 1000))
  }

  return res
})

const resultTimecodes = computed(() => {

  const prepared = processedTimings.value
    .map((t, i) => ({ time: t, res: result.value.data[i] }))
    .filter(t => t.time > 0)

  const chuckAvg = prepared.reduce((acc, t) => acc + t.res.chuck, 0) / prepared.length
  const chuckMax = Math.max(...prepared.map(t => t.res.chuck))

  function getComment(t: typeof prepared[number]) {
    if (t.res.chuck === chuckMax) return '*Лучший бой*'
    if (t.res.chuck > chuckAvg * 1.25) return '*Хороший бой*'
    return ''
  }

  return prepared
    .map((t, i) => formatTemplate.value
      .replaceAll('{n}', (i + 1).toString())
      .replaceAll('{time}', getTimecode(t.time))
      .replaceAll('{tank}', getTankName(t.res.tankTag))
      .replaceAll('{map}', nameFromTag(t.res.arenaTag).value)
      .replaceAll('{dmg}', t.res.pDmg.toString())
      .replaceAll('{radio}', t.res.pAssistRadio.toString())
      .replaceAll('{xp}', t.res.pXp.toString())
      .replaceAll('{frags}', t.res.pKills.toString())
      .replaceAll('{gm}', t.res.gunMarkSum.toString())
      .replaceAll('{chuck}', t.res.chuck.toString())
      .replaceAll('{rank}', t.res.playerRank.toString())
      .replaceAll('{comment}', getComment(t))
    )
    .map(t => t
      .replace(/\\t(\d+)/g, (match, p1, offset, wholeString) => {
        let targetColumn = Number(p1);
        let currentLength = wholeString.substring(0, offset).length;
        let spacesToAdd = targetColumn - currentLength;

        if (spacesToAdd > 0) {
          return ' '.repeat(spacesToAdd) + '\t';
        } else {
          return ''; // If target column is already passed, no spaces needed
        }
      })
      .replaceAll('\\t', '\t')
    )
    .join('\n')
})

function copy() {
  navigator.clipboard.writeText(resultTimecodes.value)
}

const result = queryComputed<{
  dateTime: string,
  arenaTag: string,
  tankTag: string,
  result: string,
  gunMarkSum: number,
  pDmg: number,
  pAssistRadio: number,
  pXp: number,
  pKills: number,
  chuck: number,
  playerRank: number
}>(() => params.value.player === null ? null : `
select dateTime, arenaTag, tankTag, result, pAssistRadio, pDmg, pXp, pKills, gunMarkSum, playerRank,
       toUInt32(pDmg + arraySum(squadmateDamage) + (pKills + arraySum(squadmateKills)) * 300 + if(result = 'win', 3000, 0)) as chuck
from
(
    select id, dateTime, tankTag
    from Event_OnBattleStart
    ${whereClause(params.value)}
) as T1
join
(
    with
        arrayZip(playersResults.squadID, playersResults.name, playersResults.damageDealt, playersResults.kills) as squadResults,
        arrayFilter(x -> x.1 = personal.squadID and x.1 != 0 and x.2 != playerName, squadResults) as squadmateResults,
        squadmateResults.3 as squadmateDamage, squadmateResults.4 as squadmateKills
    select onBattleStartId, arenaTag, result, personal.damageDealt as pDmg, personal.damageAssistedRadio as pAssistRadio,
           personal.xp as pXp, personal.kills as pKills, squadmateDamage, squadmateKills, gunMarkSum, personal.playerRank as playerRank
    from Event_OnBattleResult
    ${whereClause(params.value)}
) as T2
on T1.id = T2.onBattleStartId
order by dateTime
`)

watch(result, () => {
  timings.value = result.value.data.map(() => '')
})

</script>

<style lang="scss" scoped>
@use '/src/styles/table.scss' as *;
@use '/src/styles/textColors.scss';
@use '/src/styles/variables.scss' as *;

.popup-container {
  max-width: 700px;

  a {
    cursor: pointer;
  }

  h3 {
    margin-top: 2em;
    margin-bottom: 0;
  }

  .battles-table {
    max-height: 200px;
    overflow-y: scroll;
  }

  input {
    margin-top: 10px
  }

  .result {
    border-radius: 10px;
    max-height: 150px;
    overflow-y: auto;
    background-color: #1a1a1a;
    padding: 10px;
    white-space: pre;
  }

  table {
    border-collapse: separate;
    border-spacing: 0;


    thead {
      th {
        position: sticky;
        top: 0;
        background-color: $background-secondary;
        border-bottom: $border;
      }
    }

    td {
      width: 16%;

      &.timecode {
        padding: 0;

        input {
          width: 100%;
          height: 24.5px;
          border: none;
          background-color: transparent;
          text-align: center;
          margin: 0;
          padding: 0;
          font-size: 16px;
        }

        max-width: 80px;
      }

      text-align: center;
      white-space: nowrap;
    }
  }

  .format {
    // height: 40px;
    padding: 10px;
    font-size: 16px;
    border: none;
    border-radius: 10px;
    background-color: #1a1a1a;
  }
}
</style>