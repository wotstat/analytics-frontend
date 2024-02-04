<template>
  <div class="hidden-x">
    <div class="main center-container">
      <h1>Сессионная аналитика для игр «Мир&nbsp;танков» и «World&nbsp;of&nbsp;Tanks»</h1>

      <section class="intro">
        <div class="main-count">
          <div class="flex center">
            <div class="card">

              <p class="card-main-info green hidden">
                {{ ''.padStart(eventCount.data.toString().length, '0').replace(/\B(?=(\d{3})+(?!\d))/g, " ") }}
                <span class="green animated">
                  {{ totalEventCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") }}
                </span>
              </p>
              <p class="card-main-info description">Событий уже собрано</p>
            </div>
          </div>
        </div>

        <div class="flex center">
          <p class="text-center mod-description">
            Откройте новые горизонты анализа вашей игры с нашей <b>бесплатной</b> и полностью
            <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank">открытой</a> пользовательской модификацией для
            игр
            <a href="https://tanki.su/ru/game/" target="_blank">«Мир&nbsp;танков»</a> и <a
              href="https://worldoftanks.eu/en/game/" target="_blank">«World&nbsp;of&nbsp;Tanks»</a>. <br>Модификация
            работает в фоне, фиксируя различные игровые события, что позволяет вам анализировать свои действия и
            сравнивать их с результатами других игроков.
          </p>
        </div>
      </section>
    </div>

    <section class="install fluid">
      <div class="center-container">
        <h2>Установка</h2>

        <p><a :href="latestRelease.browser_download_url" target="_blank">Скачайте</a> последнюю версию мода и поместите
          файл в каталог: <code>{{ targetModPath }}</code></p>
        <p class="warning">ВАЖНО: НЕ переименовывайте файл с модом. Он должен называться
          <code v-if="latestRelease.actual">"{{ latestRelease.name }}"</code>
          <span v-else>так же как и скачался. Например "{{ latestRelease.name }}"</span>
        </p>
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
                description="Среднее время в очереди" :processor="ms2sec" :mini-processor="secProcessor" color="green" />
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
              <ShotsCircle :limit-shot="10000" :draw-delay="1" :draw-count="2" />
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
              <GenericInfo :value="[scoreData['win']?.medianTeam ?? 0, scoreData['win']?.medianOpponent ?? 0]"
                description="Средний счёт при победе" color="green"
                :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
            </div>
            <div class="card">
              <GenericInfo :value="[scoreData['lose']?.medianTeam ?? 0, scoreData['lose']?.medianOpponent ?? 0]"
                description="Средний счёт при поражении" color="red"
                :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
            </div>
          </div>
        </div>

        <div class="feature left">
          <div class="feature-description">
            <h3>Анализ турбобоёв</h3>
            <p>Выделите и анализируйте турбобои - быстрые сражения длительностью менее 5 минут с разницей во фрагах более
              10.</p>
            <p>Сравнивайте свои показатели с другими игроками на различных уровнях и в разное время</p>
          </div>
          <div class="image">
            <div class="card">
              <GenericInfo :value="turboResult.avgTurbo" :processor="t => t.toFixed(2)" mini-data="турбы"
                description="В среднем из серии в 100 боёв" color="blue" />
            </div>
            <div class="card">
              <GenericInfo :value="turboResult.maxTurbo" :processor="t => t.toFixed()" mini-data="турбы"
                description="Худшая серия из 100 боёв" color="blue" />
            </div>
          </div>
        </div>

        <div class="feature">
          <div class="feature-description">
            <h3>Анализ стримснайперов</h3>
            <p>Особенно полезно для стримеров</p>
            <p>Мод запоминает ники всех игроков после каждого боя, позволяя выявить тех, кто слишком часто попадается в
              боях с вами. Инфографика показывает наиболее частых "спутников" ваших боёв, их средний урон за вашу команду
              и против вас</p>
          </div>
          <div class="image">
            <div class="card strimsniper">
              <table>
                <thead>
                  <tr>
                    <th>Ник</th>
                    <th>Боёв</th>
                    <th>За</th>
                    <th>Против</th>
                  </tr>
                </thead>
                <tr v-for="item in strimsniper">
                  <td>{{ item[0] }}</td>
                  <td class="text-effect orange">{{ item[1] }}</td>
                  <td class="text-effect green">{{ item[2] }}</td>
                  <td class="text-effect red">{{ item[3] }}</td>
                </tr>
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
          отправлть любые аналитичесие запросы</p>
        <p>В качесте СУБД используется <a href="https://clickhouse.com/docs" target="_blank"
            rel="noopener noreferrer">clickhouse</a></p>
        <br>
        Для доступа используйте следующие данные:
        <ul>
          <li>Пользлватель: <code>public</code></li>
          <li>Пароль: <code>без пароля</code></li>
          <li>Хост: <code>{{ DBUrl.replace('https://', '') }}</code></li>
          <li>Порт: <code>8123</code></li>
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
          <li>Каждую минуту: 240 запросов, время выполненни: 60c</li>
          <li>Каждый час: 2000 запросов, время выполненни: 600c</li>
          <li>Каждый день: 5000 запросов, время выполненни: 2000c</li>
        </ul>
      </div>
    </section>


    <div class="center-container">
      <hr>
      <i>Тут наверное надо написать что то типа: WotStat не является официальным и никак не аффилирован с компанией
        Wargaming.net или Lesta Games</i>
      <br>
      <br>
      <p>Связаться со мной вы можете по почте <a href="mailto:soprachev@mail.ru">soprachev@mail.ru</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfoQuery from '@/components/widgets/GenericInfoQuery.vue';
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import ShotsCircle from '@/components/widgets/ShotsCircle.vue';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { queryAsync, queryAsyncFirst } from '@/db';
import { toPercent, toRelative } from '@/utils';
import { computedAsync } from '@vueuse/core';
import { Ref, computed, toRef, watchEffect } from 'vue';
import { countLocalize } from '@/utils/i18n';

const ms2sec = (ms: number) => (ms / 1000).toFixed();
const sec2minsec = (sec: number) => `${(sec / 60).toFixed()}:${(sec % 60).toFixed().padStart(2, '0')}`;
const secProcessor = (count: number) => countLocalize(count, 'секунда', 'секунды', 'секунд');

const DBUrl = import.meta.env.VITE_CLICKHOUSE_HOST as string

const gameVersion = computedAsync(async () => {
  const response = await fetch("https://raw.githubusercontent.com/IzeBerg/wot-src/RU/sources/paths.xml")
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  return doc.documentElement.querySelector("Path[mask='*.wotmod']")?.textContent ?? './mods/GAME_VERSION';
}, './mods/1.20.0.0');

const targetModPath = computed(() => {
  return "World_Of_Tanks" + gameVersion.value.slice(1);
})

const latestRelease = computedAsync(async () => {
  const response = await fetch("https://api.github.com/repos/WOT-STAT/WOTMOD/releases/latest")
  const text = await response.text();
  const json = JSON.parse(text);

  const asset = (json.assets as Record<string, string>[]).find(t => t.name.startsWith('mod.wotStat')) as {
    browser_download_url: string,
    name: string,
  };

  return {
    browser_download_url: asset.browser_download_url,
    name: asset.name,
    actual: true,
  }

}, { browser_download_url: 'https://github.com/WOT-STAT/WOTMOD/releases/latest', name: 'mod.wotStat_1.0.0.1-a.3.wotmod', actual: false });

function download() {
  window.open(latestRelease.value.browser_download_url, "_blank");
}


// TOTAL
const eventCount = queryAsyncFirst(`
select (select count() from Event_OnBattleResult) +
       (select count() from Event_OnShot) +
       (select count() from Event_OnBattleResult) as count,
       toUInt32(count)                            as data;
`, { data: 845 });

const totalEventCount = useTweenCounter(computed(() => eventCount.value.data), { duration: 1 });


// DAMAGE
const damageLabels = new Array(21).fill(0)
const damageDistributionResult = queryAsync<{ k: number, count: number }>(`
select if(round(normK, 1) = -0, 0, round(normK, 1)) * 10 as k, toUInt32(count()) as count
from (select arrayZip(results.shotDamage, results.shotHealth) as shotHealth,
             arrayFilter(x -> x.2 != 0, shotHealth)           as notKill,
             arrayMax(x -> x.1, notKill)                      as maxNotKillDamage,
             shellDamage,
             damageRandomization,
             1.0 * maxNotKillDamage / shellDamage             as k,
             (k - 1.0) / damageRandomization                  as normK
      from Event_OnShot
      where length(results.order) > 0
        and maxNotKillDamage > 0
        and shellTag != 'HIGH_EXPLOSIVE')
group by k
order by k;
`)
const damageDistributionData = computed(() => {

  const res = damageDistributionResult.value.reduce((prev, cur) => {
    prev[cur.k] = cur.count
    return prev
  }, {} as any)

  const absolute = new Array(21).fill(0).map((v, i) => res[i - 10] ?? 0)

  return toRelative(absolute)
})

// RESULTS
const scoreResult = queryAsync<{
  result: 'win' | 'lose' | 'tie',
  medianTeam: number,
  medianOpponent: number,
  avgTeam: number,
  avgOpponent: number,
  turbo: number,
}>(`
select result,
       median(playerTeamFrags)   as medianTeam,
       median(opponentTeamFrags) as medianOpponent,
       avg(playerTeamFrags)      as avgTeam,
       avg(opponentTeamFrags)    as avgOpponent,
       toUInt32(countIf(duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10)) as turbo
from (select arrayZip(playersResults.isAlive, playersResults.team)          as aliveTeam,
             arrayFilter(t -> t.2 = playerTeam, aliveTeam)                  as playerTeamAliveList,
             arrayFilter(t -> t.2 != playerTeam, aliveTeam)                 as opponentTeamAliveList,
             length(arrayFilter(t -> t = playerTeam, playersResults.team))  as playerTeamCount,
             length(arrayFilter(t -> t != playerTeam, playersResults.team)) as opponentTeamCount,
             playerTeamCount - arrayCount(t -> t.1, playerTeamAliveList)             as opponentTeamFrags,
             opponentTeamCount - arrayCount(t -> t.1, opponentTeamAliveList)         as playerTeamFrags,
             result                                                                  as result,
             duration                                                                as duration     
      from Event_OnBattleResult)
group by result;
`);
const scoreData = computed(() => Object.fromEntries(scoreResult.value.map(r => [r.result, r])));


// TURBO
const turboResult = queryAsyncFirst(`
select max(countTurbo)    as maxTurbo,
       min(countTurbo)    as minTurbo,
       avg(countTurbo)    as avgTurbo,
       median(countTurbo) as medTurbo,
       sum(isTurbo)       as count
from (select arrayZip(playersResults.isAlive, playersResults.team)                        as aliveTeam,
             arrayFilter(t -> t.2 = playerTeam, aliveTeam)                                as playerTeamAliveList,
             arrayFilter(t -> t.2 != playerTeam, aliveTeam)                               as opponentTeamAliveList,
             length(arrayFilter(t -> t = playerTeam, playersResults.team))                as playerTeamCount,
             length(arrayFilter(t -> t != playerTeam, playersResults.team))               as opponentTeamCount,
             playerTeamCount - arrayCount(t -> t.1, playerTeamAliveList)                  as opponentTeamFrags,
             opponentTeamCount - arrayCount(t -> t.1, opponentTeamAliveList)              as playerTeamFrags,
             duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10          as isTurbo,
             countIf(isTurbo) over (order by id rows between 99 preceding and current row) as countTurbo
      from Event_OnBattleResult);`, { count: 0, maxTurbo: 0, avgTurbo: 0, medTurbo: 0, minTurbo: 0 });

// STRIMSNIPER
const strimsniper = [
  ['JOVE', 9, 3542, 2344],
  ['Lebwa', 8, 4547, 4667],
  ['Korben', 7, 3545, 4524],
  ['Kitya', 5, 1245, 2436],
  ['Viktor', 4, 1247, 3344],
  ['Nidin', 2, 6752, 6718],
]


</script>

<style scoped lang="scss">
@import '@/styles/mixins.scss';
@import '@/styles/textColors.scss';

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
  margin: 20px 0;
}

.mod-description {
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

    .hidden {
      visibility: hidden;
      position: relative;
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

      &.strimsniper {

        $border: 1px solid rgba(240, 240, 240, 0.327);

        table {
          border-collapse: collapse;
          width: 100%;
          position: relative;
          z-index: 5;

          .title {
            padding: 0 0 15px 0;
          }

          thead {
            border-bottom: $border;
          }

          tbody {
            tr {
              &:hover {
                background-color: #8787870d;
              }
            }
          }

          td,
          th {
            text-align: center;
            width: 50%;
            position: relative;
            padding: 0 4px;
            text-wrap: nowrap;
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
