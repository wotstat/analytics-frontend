<template>
  <div class="hidden-x">
    <div class="main center-container">
      <h1>Сессионная аналитика для игр «Мир&nbsp;танков» и «World&nbsp;of&nbsp;Tanks»</h1>

      <section class="intro">
        <div class="main-count">
          <div class="flex center">
            <div class="card">
              <p class="hidden">
                <span class="card-main-info green hidden counter">
                  {{ ''.padStart(Math.max(7, totalCount.toString().length),
                    '0').replace(/\B(?=(\d{3})+(?!\d))/g, " ") }}
                </span>

                <span class="card-main-info green animated counter" :class="totalCountFirstLoading ? 'loading' : ''">
                  {{ useFixedSpaceProcessor(0)(totalEventCount) }}
                </span>
              </p>
              <p class="card-main-info description">Событий уже собрано</p>
            </div>
          </div>
        </div>

        <div class="flex center">
          <h2 class="text-center mod-description">
            Откройте новые горизонты анализа вашей игры с <b>бесплатным</b> и полностью
            <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank">открытым</a> модом WotStat для игр
            <a href="https://tanki.su/ru/game/" target="_blank">«Мир&nbsp;танков»</a> и <a
              href="https://worldoftanks.eu/en/game/" target="_blank">«World&nbsp;of&nbsp;Tanks»</a>. <br>Модификация
            работает в фоне, фиксируя различные игровые события, что позволяет вам анализировать свои действия и
            сравнивать их с результатами других игроков.
          </h2>
        </div>
      </section>
    </div>

    <section class="install fluid">
      <div class="center-container">
        <h2>Установка</h2>

        <p>
          <a :href="latestWotstat.browser_download_url" target="_blank">Скачайте</a> последнюю версию мода и поместите
          файл в каталог:
        </p>
        <ul>
          <li>Леста:
            <CurrentLestaVersion>Tanki/mods/</CurrentLestaVersion>
          </li>
          <li>Wargaming:
            <CurrentWgVersion>World_Of_Tanks/mods/</CurrentWgVersion>
          </li>
        </ul>

        <i>Версии игры актуальны на {{ new Date().toLocaleDateString() }}</i>

        <!-- <i>Проверка на вирусы VirusTotal: <a
            href="https://www.virustotal.com/gui/file/d2c21e8fbb360e4309f40d459014c40cb80307712fe452e967fc70ae7159b0fa?nocache=1"
            target="_blank">посмотреть</a>
        </i> -->

        <p class="warning">ВАЖНО: НЕ переименовывайте файл с модом. Он должен называться
          <code v-if="latestWotstat.actual">"{{ latestWotstat.name }}"</code>
          <span v-else>так же как и скачался. Например "{{ latestWotstat.name }}"</span>
        </p>

        <h3 class="streamer-header" @click="streamerOpen = !streamerOpen">
          <ArrowDownIcon :style="{
            transform: streamerOpen ? 'rotateZ(0)' : 'rotateZ(-90deg)'
          }" />
          Для стримеров
        </h3>
        <div class="collapsable-body" ref="collapsableBody" :style="{
          maxHeight: streamerOpen ? collapsableBody?.scrollHeight + 'px' : '0'
        }">
          <p>Если вы хотите скрыть игровой сервер из собираемой статистики, поместите файл <a :href="ConfigUrl"
              target="_blank" download="config.cfg">config.cfg</a> в папку
            <code>WOT/mods/configs/wot_stat</code>
          </p>
        </div>

        <div class="flex center">
          <button @click="download">СКАЧАТЬ</button>
        </div>
      </div>

    </section>

    <div class="main center-container">
      <h2 class="text-center">Возможности</h2>

      <div class="features">
        <div class="feature left">
          <div class="feature-description">
            <h3>Анализ боёв</h3>
            <p>Освежите свой игровой опыт, получив детальную информацию о каждом бое: время ожидания, классы техники,
              карты, продолжительность боя и многое другое.</p>
            <p>Вы сможете просматривать и анализировать информацию как персонально для себя, так и в среднем по
              серверу/уровню/танку
            </p>
          </div>
          <div class="image">
            <div class="card">
              <GenericInfoQuery query="select round(avg(duration)) as data from Event_OnBattleResult;"
                description="Среднее время боя" :processor="sec2minsec" color="green" />
            </div>
            <div class="card">
              <GenericInfoQuery
                query="select avgIf(inQueueWaitTime, inQueueWaitTime < 300000) as data from Event_OnBattleStart;"
                description="Среднее время в очереди" :processor="ms2sec" :mini-processor="ms2secLabel" color="green" />
            </div>
          </div>
        </div>

        <div class="feature">
          <div class="feature-description">
            <h3>Анализ выстрелов</h3>
            <p>Углубитесь в анализ КАЖДОГО выстрела: куда полетел относительно прицела, цель попадания, нанесённый
              урон. </p>
            <p>Скорость собственного танка, FPS и Ping в момент выстрела</p>
          </div>
          <div class="image">
            <div class="card shots">
              <ShotsCircle :limit-shot="1000" :draw-delay="1" :draw-count="2" />
            </div>
          </div>
        </div>

        <div class="feature left">
          <div class="feature-description">
            <h3>Анализ урона</h3>
            <p>Изучите детали нанесённого урона, включая пожары, взрывы боекомплекта, ХП противника и фраги. </p>
            <p>Наша инфографика отображает распределение урона и выделяет моменты "нечестного" уничтожения и спасения
              танков (добивающий урон выше/ниже среднего и его распределение)</p>
          </div>
          <div class="image">
            <div class="card damage chart bar big flex ver gap-0">
              <MiniBar tooltipDisabled ticksXDisabled :data="damageDistributionData" color="orange"
                :labels="damageLabels" />
              <p class="card-main-info description">Распределение урона +- 25</p>
            </div>
          </div>
        </div>

        <div class="feature">
          <div class="feature-description">
            <h3>Анализ результатов</h3>
            <p>Мод собирает практически всю информацию о результатах боя</p>
            <p>Получите всесторонний анализ результатов каждого боя: урон, насвет, натанкованный урон, потраченное ХП,
              количество выстрелов, пройденное расстояние, время жизни и многое другое
            </p>
          </div>
          <div class="image">
            <div class="card">
              <GenericInfo :value="[scoreResult.data[0]?.allyFragsWin ?? 0, scoreResult.data[0]?.enemyFragsWin ?? 0]"
                description="Средний счёт при победе" color="green"
                :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
            </div>
            <div class="card">
              <GenericInfo :value="[scoreResult.data[0]?.allyFragsLose ?? 0, scoreResult.data[0]?.enemyFragsLose ?? 0]"
                description="Средний счёт при поражении" color="red"
                :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
            </div>
          </div>
        </div>

        <!-- <div class="feature left">
          <div class="feature-description">
            <h3>Анализ турбобоёв</h3>
            <p>Выделите и анализируйте турбобои - быстрые сражения длительностью менее 5 минут с разницей во фрагах
              более
              10.</p>
            <p>Сравнивайте свои показатели с другими игроками на различных уровнях и в разное время</p>
          </div>
          <div class="image">
            <div class="card">
              <GenericInfo :value="turboResult.data.avgTurbo" :processor="t => t.toFixed(2)" mini-data="турбы"
                description="В среднем из серии в 100 боёв" color="blue" />
            </div>
            <div class="card">
              <GenericInfo :value="turboResult.data.maxTurbo" :processor="t => t.toFixed()" mini-data="турбы"
                description="Худшая серия из 100 боёв" color="blue" />
            </div>
          </div>
        </div> -->

        <div class="feature left">
          <div class="feature-description">
            <h3>Анализ карт</h3>
            <p>Анализируйте результаты боёв в разбивке по картам. Изучайте где вы играете хуже, а где лучше.</p>
            <p>Сравнивайте показатели урона, насвета, фрагов, времени жизни на разных картах</p>
          </div>
          <div class="image">
            <div class="card map">
              <table class="hover-highlight">
                <thead>
                  <tr>
                    <th>Карта</th>
                    <th>Боёв</th>
                    <th>Урон</th>
                    <th>Насвет</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in mapsResults.data">
                    <td>{{ nameFromTag(item.arenaTag).value }}</td>
                    <td class="text-effect orange">{{ item.count }}</td>
                    <td class="text-effect green">{{ item.damage }}</td>
                    <td class="text-effect blue">{{ item.assist }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="feature right">
          <div class="feature-description">
            <h3>Анализ сетапа</h3>
            <p>Просматривайте как часто вы попадаете в топ команды, а как часто в низ</p>
            <p>Показывает выше расположение в сетапе по одноуровневым, двухуровневым и трёхуровым боям</p>
          </div>
          <div class="image">
            <div class="card map">
              <table class="hover-highlight">
                <thead>
                  <tr>
                    <th>Место</th>
                    <th>Процент боёв</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Топ</td>
                    <td class="text-effect green">63.3%</td>
                  </tr>
                  <tr>
                    <td>Середина</td>
                    <td class="text-effect orange">26.2%</td>
                  </tr>
                  <tr>
                    <td>Дно</td>
                    <td class="text-effect red">10.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="feature left">
          <div class="feature-description">
            <h3>Медианные показатели</h3>
            <p>Медианные, средние, максимальные, 30% и 70% <a href="https://ru.wikipedia.org/wiki/Квантиль"
                target="_blank" rel="noopener noreferrer">квантиль</a> по 10 метрикам. Урон, насвет, выстрелов,
              попаданий
              и другие</p>
            <p>На примере справа <b>медианные показаители</b> на 10 уровнях, это означает, что в <b>половине боёв</b>
              результаты были
              хуже указанных</p>
          </div>

          <div class="image">
            <div class="card">
              <GenericInfo :status="medianResults.status" :value="medianResults.data.medDamage"
                description="Медианный урон" color="green" />
            </div>
            <div class="card">
              <GenericInfo :status="medianResults.status" :value="medianResults.data.medMileage"
                description="Медианная дистанция" color="orange" />
            </div>
          </div>
        </div>

        <div class="feature right">
          <div class="feature-description">
            <h3>Анализ стримснайперов</h3>
            <p>Особенно полезно для стримеров</p>
            <p>Мод запоминает ники всех игроков после каждого боя, позволяя выявить тех, кто слишком часто попадается в
              боях с вами. Инфографика показывает наиболее частых "спутников" ваших боёв, их средний урон за вашу
              команду
              и против вас</p>
          </div>
          <div class="image">
            <div class="card strimsniper">
              <table class="hover-highlight">
                <thead>
                  <tr>
                    <th>Ник</th>
                    <th>Боёв</th>
                    <th>За</th>
                    <th>Против</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in strimsniper">
                    <td>{{ item[0] }}</td>
                    <td class="text-effect orange">{{ item[1] }}</td>
                    <td class="text-effect green">{{ item[2] }}</td>
                    <td class="text-effect red">{{ item[3] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    <section class="sql fluid">
      <div class="center-container">
        <h2>SQL</h2>
        <p>К базе данных со ВСЕМИ исходными данными есть доступ черз SQL. Если вы разбираетесь, то можете самостоятельно
          отправлять любые аналитичесие запросы</p>
        <p>В качесте СУБД используется <a href="https://clickhouse.com/docs" target="_blank"
            rel="noopener noreferrer">clickhouse</a></p>
        <br>
        Для доступа используйте следующие данные:
        <ul>
          <li>Пользователь: <code>public</code></li>
          <li>Пароль: <code>без пароля</code></li>
          <li>Хост: <code>{{ DBUrl.replace('https://', '') }}</code></li>
          <li>Порт: <code>80</code></li>
        </ul>

        <p>Поиграться с базой можно тут: <a
            :href="DBUrl + '/play?user=public#c2VsZWN0IHRhYmxlLCBuYW1lLCBjb21tZW50LCB0eXBlIGZyb20gZGVzY3JpcHRpb247'"
            target="_blank" rel="noopener noreferrer">{{ DBUrl.replace('https://', '') }}/play</a></p>

        <br>
        Список доступных таблиц с описанием столбцов можно получить командой:
        <code>select * from description</code>
        <hr>
        <p>На доступ к базе есть следующие ограничения:</p>
        <ul>
          <li>Каждую минуту: 240 запросов, время выполнения: 20c</li>
          <li>Каждый час: 2000 запросов, время выполнения: 600c</li>
          <li>Каждый день: 5000 запросов, время выполнения: 2000c</li>
        </ul>
      </div>
    </section>


    <div class="center-container">
      <hr>
      <i>WotStat не является официальным продуктом и никак не аффилирован с компанией Wargaming.net или Lesta Games</i>
      <br>
      <br>
      <p>Связаться со мной вы можете по почте <a href="mailto:support@wotstat.info">support@wotstat.info</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfoQuery from '@/components/widgets/GenericInfoQuery.vue';
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import ShotsCircle from '@/components/widgets/ShotsCircle.vue';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { LONG_CACHE_SETTINGS, query, queryAsync, queryAsyncFirst } from '@/db';
import { toRelative, ms2sec, sec2minsec, ms2secLabel } from '@/utils';
import { computedAsync } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getArenaName } from '@/utils/i18n';
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useDocumentVisibility } from '@vueuse/core'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg'
import CurrentLestaVersion from '@/components/mdUtils/CurrentLestaVersion.vue';
import CurrentWgVersion from '@/components/mdUtils/CurrentWgVersion.vue';
import { githubRelease } from '@/components/mdUtils/ghRelease';
import ConfigUrl from '@/assets/config.cfg?url';


const collapsableBody = ref<HTMLElement | null>(null);

const DBUrl = import.meta.env.VITE_CLICKHOUSE_URL

const latestWotstat = computedAsync(async () => {
  const asset = await githubRelease("https://api.github.com/repos/WOT-STAT/WOTMOD/releases/latest", t => t.endsWith('.wotmod'))
  return {
    browser_download_url: asset.browser_download_url,
    name: asset.name,
    actual: true,
  }
}, { browser_download_url: 'https://github.com/WOT-STAT/WOTMOD/releases/latest', name: 'mod.wotStat_1.0.0.1-a.3.wotmod', actual: false });


function download() {
  window.open(latestWotstat.value.browser_download_url, "_blank");
}

const streamerOpen = ref(false);


// TOTAL

const totalCount = ref(0);
const totalCountFirstLoading = ref(true);
const totalEventCount = useTweenCounter(computed(() => totalCount.value), { duration: 1 });

const documentVisibility = useDocumentVisibility()
let timer: ReturnType<typeof setTimeout> | null = null;
async function loadLoop() {
  timer = setTimeout(() => loadLoop(), 1000);

  if (documentVisibility.value == 'visible') {
    const result = await query<{ data: number }>(`select (select count() from Event_OnBattleResult) + 
      (select count() from Event_OnShot) + 
      (select count() from Event_OnBattleResult) +
      (select count() from Event_OnLootboxOpen) as count,
      toUInt32(count) as data;`, { allowCache: false })

    totalCount.value = result.data[0].data;
    totalCountFirstLoading.value = false;
  }
}

onMounted(() => loadLoop())
onUnmounted(() => timer && clearTimeout(timer))


// DAMAGE
const damageLabels = new Array(21).fill(0)
const damageDistributionResult = queryAsync<{ k: number, count: number }>(`
with arrayMax(results.shotDamage) as dmg,
     indexOf(results.shotDamage, dmg) as idx,
     results.shotHealth[idx] as health,
     dmg > 0 and health > 0 and idx > 0 and (dmg + health) > round(shellDamage * 1.250001) as representative,
     ((toFloat32(dmg) / shellDamage) - 1) / damageRandomization AS dmgRelativeShell,
     length(results.shotDamage) as hits,
     max2(-1, min2(1, round(dmgRelativeShell, 1))) as rounded,
     if(rounded = -0, 0, rounded) as trueRounded
select trueRounded * 10 as k,
       toUInt32(countIf(representative and hits > 0)) as count
from Event_OnShot
where shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME' and battleMode = 'REGULAR'
group by k
having k between -10 and 10
order by k`, { settings: LONG_CACHE_SETTINGS })
const damageDistributionData = computed(() => {

  const res = damageDistributionResult.value.data.reduce((prev, cur) => {
    prev[cur.k] = cur.count
    return prev
  }, {} as any)

  const absolute = new Array(21).fill(0).map((v, i) => res[i - 10] ?? 0)

  return toRelative(absolute)
})

// RESULTS
const scoreResult = queryAsync<{
  enemyFragsWin: number,
  allyFragsWin: number,
  enemyFragsLose: number,
  allyFragsLose: number
}>(`
select 
  avgIf(allyTeamCount - allyTeamSurvivedCount, result = 'win') as enemyFragsWin,
  avgIf(enemyTeamCount - enemyTeamSurvivedCount, result = 'win') as allyFragsWin,
  avgIf(allyTeamCount - allyTeamSurvivedCount, result = 'lose') as enemyFragsLose,
  avgIf(enemyTeamCount - enemyTeamSurvivedCount, result = 'lose') as allyFragsLose
  from Event_OnBattleResult where battleMode = 'REGULAR'
`, { settings: LONG_CACHE_SETTINGS });

// TURBO
const turboResult = queryAsyncFirst(`
select max(countTurbo)    as maxTurbo,
       min(countTurbo)    as minTurbo,
       avg(countTurbo)    as avgTurbo,
       median(countTurbo) as medTurbo,
       sum(isTurbo)       as count
from (select allyTeamCount - allyTeamSurvivedCount                               as opponentTeamFrags,
             enemyTeamCount - enemyTeamSurvivedCount                             as playerTeamFrags,
             duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10 as isTurbo,
             countIf(isTurbo) over (order by id rows between 99 preceding and current row) as countTurbo
      from Event_OnBattleResult
      where battleMode = 'REGULAR')
`, { count: 0, maxTurbo: 0, avgTurbo: 0, medTurbo: 0, minTurbo: 0 }, { settings: { ...LONG_CACHE_SETTINGS, query_cache_ttl: 86400 } });

// STRIMSNIPER
const strimsniper = [
  ['JOVE', 9, 3542, 2344],
  ['Lebwa', 8, 4547, 4667],
  ['Korben', 7, 3545, 4524],
  ['G1deon', 5, 6541, 1401],
  ['Viktor', 4, 1247, 3344],
  ['Nidin', 2, 6752, 6718],
]

// MAPS
const mapsResults = queryAsync<{ arenaTag: string, count: number, damage: number, assist: number, kills: number }>(`
select arenaTag,
       count() as count,
       round(avg(personal.damageDealt)) as damage,
       round(avg(personal.damageAssistedRadio)) as assist,
       round(avg(personal.kills), 1) as kills
from Event_OnBattleResult
where tankLevel = 10
and battleMode = 'REGULAR'
group by arenaTag
order by count desc
limit 5;
`, { settings: LONG_CACHE_SETTINGS })

function nameFromTag(tag: string) {
  const key = tag.split('spaces/')[1] + '/name'
  return getArenaName(key)
}


const maps = [
  ['Перевал', 9, 4230, 2344],
  ['Минск', 8, 1741, 4667],
  ['Руинберг', 7, 2353, 4524],
  ['Тихий берег', 5, 2762, 2436],
  ['Студзянки', 4, 2589, 3344],
  ['Линия Зигфрида', 2, 2411, 6718],
]

// MEDIAN

const medianResults = queryAsyncFirst(`select median(personal.damageDealt) as medDamage, median(personal.mileage) as medMileage from Event_OnBattleResult where tankLevel = 10`,
  { medDamage: 0, medMileage: 0 },
  { settings: LONG_CACHE_SETTINGS }
);


</script>

<style scoped lang="scss">
@use '/src/styles/textColors.scss' as *;
@use '/src/styles/table.scss' as *;
@use '/src/styles/variables.scss' as *;
@use '/src/styles/mixins.scss' as *;
@import 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&display=swap';

.counter {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.streamer-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0;
  user-select: none;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
    fill: var(--font-color);
    transform: rotateZ(-90deg);
    transition: transform 0.3s;
  }

}

.collapsable-body {
  transition: all 0.3s;
  margin-bottom: 20px;
  overflow: hidden;
}

.hidden-x {
  overflow-x: hidden;
}

section {
  margin: 80px 0;

  @include less-small {
    margin: 40px 0;
  }

  &.intro {
    margin-top: 0;
  }

  &.fluid {
    background-color: $background-secondary;

    hr {
      border-top: 1px solid #ffffff1f;
    }
  }
}

p.warning {
  background-color: #544e43;
  margin: 20px 0;
  padding: 20px;
  border-radius: 10px;
}


h1 {
  text-align: center;
  margin-top: 100px;
  margin-bottom: 0;
  padding: 20px;
  padding-bottom: 0;

  // color: #e7ffde;
  // filter: drop-shadow(0 0 0.5em #639e31);

  @include less-small {
    font-size: 2em;
    margin-top: 40px;
  }
}

h2 {
  margin: 0 0 20px 0;
}

.mod-description {
  font-size: 1em;
  font-weight: 400;
  line-height: 1.4;
  max-width: 80%;
  // max-width: 60%;

  @include large {
    max-width: 60%;
  }

  @include less-small {
    max-width: 100%;
    padding: 0 10px;
  }
}

.main-count {
  margin: 40px 0;

  .card {
    padding: 15px 30px;
    text-align: center;
    min-width: fit-content;

    .card-main-info:not(.description) {
      font-size: 5em;

      @include less-small {
        font-size: 4rem;
      }

      @include less-x-small {
        font-size: 3rem;
      }
    }

    @include less-x-small {
      padding: 15px;
    }

    .hidden {
      visibility: hidden;
      position: relative;
      text-wrap: nowrap;
    }

    .animated {
      visibility: visible;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      white-space: nowrap;
    }
  }
}

.features {
  display: flex;
  flex-direction: column;
  margin-top: 60px;
  gap: 120px;

  @include less-small {
    gap: 60px;
  }

  .feature {
    display: flex;
    gap: 40px;

    justify-content: center;

    @include less-small {
      flex-direction: column;
      gap: 10px;
    }

    div {
      flex: 1
    }

    .image {
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      @include less-small {
        max-width: 100%;
      }
    }

    .feature-description {
      h3 {
        margin: 0;
      }

      max-width: 400px;

      @include less-small {
        max-width: 100%;
      }
    }

    .card {
      padding: 15px;

      &.shots {
        padding: 25px;
      }

      &.damage {
        min-height: 180px;
      }

      &.strimsniper,
      &.map {

        table {
          width: 100%;
          position: relative;
          z-index: 5;

          .title {
            padding: 0 0 15px 0;
          }

          thead {
            border-bottom: $border;
          }

          td,
          th {
            text-align: center;
            width: 25%;
            position: relative;
            padding: 0 4px;
            // text-wrap: nowrap;
          }

          td:first-child {
            border-right: $border;
          }

          th:first-child:not(.title) {
            border-right: $border;
          }
        }
      }
    }

    @include small {
      &.left {
        .feature-description {
          order: 2;
        }
      }
    }
  }
}
</style>
