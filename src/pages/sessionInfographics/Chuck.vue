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

    <div>
      <button class="light" @click="showWidget = true">Виджет для OBS</button>
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
    </div>

    <div :class="classSettings" class="flex ver">
      <ServerStatusWrapper :status="response.status" v-if="allow">
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
          <ChuckTable :part="part" />
          <template v-slot:full>
            <div :class="classSettings" class="fullscreen">
              <ChuckTable :part="part" />
            </div>
          </template>
        </FullScreenCard>
      </ServerStatusWrapper>

      <div v-else class="card flex center">
        <b>Необходимо в фильтрах указать ник игрока (шестерёнка рядом с заголовком)</b>
      </div>
    </div>


    <PopupWindow title="Виджет для OBS" v-if="showWidget" @close="showWidget = false">
      <div class="popup-container">
        <p>Виджет отображает среднее количество очков за серию для всех совзводных, а так же персональные результаты за
          прошлый бой</p>
        <p>Игровые ники загрузятся после завершения первого боя</p>
        <div class="preview">
          <img src="/screenPart.png" alt="">
          <div class="widget-container">
            <ChuckNorris class="widget" />
          </div>
        </div>

        <template v-if="params.player">
          <p>Добавьте источник <b>"браузер"</b> в OBS и вставьте туда следующую ссылку:</p>
          <br>
          <div class="url">
            {{ getWidgetUrl() }}
          </div>
          <br>
          <button @click="copyWidgetLink">Скопировать</button>
          <br>
          <br>
          <i>Ссылку можно показывать кому угодно, ничего секретного в ней нет</i>
        </template>
        <p v-else><b>Необходимо в фильтрах указать ник игрока (шестерёнка рядом с заголовком)</b></p>
      </div>

    </PopupWindow>
  </div>
</template>

<script lang="ts" setup>
import FullScreenCard from '@/components/FullScreenCard.vue';
import PopupWindow from '@/components/PopupWindow.vue';
import ServerStatusWrapper from '@/components/ServerStatusWrapper.vue';
import ChuckTable from '@/components/widgets/ChuckTable.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { loading, queryAsync, success } from '@/db';
import { ChuckResult } from '@/db/schema';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import ChuckNorris from '../obs/ChuckNorris.vue';
import { useRoute } from 'vue-router';
const colorDecoration = useLocalStorage('chuckColorDecoration', true)
const contrastDecoration = useLocalStorage('chuckHightContrast', true)

const showWidget = ref(false)

function getWidgetUrl() {
  return window.location.origin + '/widget/chuck-norris' + window.location.search
}

function copyWidgetLink() {
  navigator.clipboard.writeText(getWidgetUrl())
}

const route = useRoute()
const classSettings = computed(() => {
  return [
    !colorDecoration.value ? 'disable-effect' : '',
    colorDecoration.value && contrastDecoration.value ? 'without-shadow' : ''
  ].join(' ')
})

const params = useQueryStatParams()

const allow = computed(() => params.value.player != null)

const response = queryAsync<ChuckResult>(`
with
   groupArray(pname) as name,
   groupArray(ptag) as tag,
   groupArray(pdmg) as dmg,
   groupArray(pkill) as kill,
   groupArray(toUInt32(pdmg + pkill * 300)) as score
select
       id,
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
             spgCount,
             enemyTeamMaxHealth,
             personal.squadID as playerSquad,
             playersResults.squadID as squads,
             playerName as playerName,
             playersResults.name as names,
             playersResults.damageDealt as damages,
             playersResults.kills as kills,
             playersResults.tankTag as tankTags
      from Event_OnBattleResult
      ${whereClause(params)}
      order by id desc)
array join squads as psquad,
           names as pname,
           damages as pdmg,
           kills as pkill,
           tankTags as ptag
where psquad = playerSquad and playerSquad != 0 or pname = playerName
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

    const playerCount = t[1][0].players.length


    const sum = t[1]
      .map(t => t.players)
      .reduce((a, v) => {
        for (let i = 0; i < playerCount; i++) {
          a[i][0] += v[i][2]
          a[i][1] += v[i][3]
          a[i][2] += v[i][4]
        }
        return a
      }, new Array(playerCount).fill(0).map(() => [0, 0, 0]))


    const battleCount = t[1].length


    const avg = sum.map(s => s.map(v => v / battleCount))

    const winrate = t[1].filter(t => t.result == 'win').length / battleCount
    const winScoreSum = t[1].reduce((acc, t) => acc + (t.result == 'win' ? 3000 : 0), 0)
    const winScoreAvg = winScoreSum / battleCount

    const healthSum = t[1].reduce((acc, t) => acc + t.enemyTeamMaxHealth, 0)
    const healthAvg = healthSum / battleCount

    const spgSum = t[1].reduce((acc, t) => acc + t.spgCount, 0)
    const spgAvg = spgSum / battleCount

    const timeSum = t[1].reduce((acc, t) => acc + t.duration, 0)
    const timeAvg = timeSum / battleCount

    const dmgSum = t[1].reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[2], 0), 0)
    const dmgAvg = dmgSum / battleCount

    const killSum = t[1].reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[3], 0), 0)
    const killAvg = killSum / battleCount

    const scoreSum = t[1].reduce((acc, t) => acc + t.totalScore, 0)
    const scoreAvg = scoreSum / battleCount

    t[1].reverse()

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


</script>

<style lang="scss" scoped>
@import '/src/styles/table.scss';

.container {
  overflow-x: auto;
}

.popup-container {
  max-width: 700px;

  .preview {
    position: relative;
    width: 100%;
    overflow: hidden;
    margin: 20px 0;

    img {
      width: 100%;
      border-radius: 10px;
    }

    .widget-container {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;

      display: flex;
      justify-content: center;
      align-items: center;

      .widget {
        font-size: 5.2px;

        &.solo {
          font-size: 8px;
        }

        max-width: 400px;
        box-sizing: border-box;
      }
    }
  }

  .url {
    background-color: #1a1a1a;
    border-radius: 10px;
    padding: 10px;
    overflow: auto;
    // white-space: nowrap;
  }
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