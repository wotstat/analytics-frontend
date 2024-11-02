<template>
  <ServerStatusWrapper :status v-slot="{ showError, status }">
    <div class="container" ref="container" v-if="status != 'error'">
      <table class="hover-highlight">

        <thead>
          <tr>
            <th colspan="9" class="title">Распределение карт</th>
          </tr>
          <tr>
            <td colspan="9" class="title">
              <div class="flex center">
                <div class="flex selector">
                  <p>Режим:</p>
                  <select v-model="battleMode">
                    <option value="any">Любой</option>
                    <option v-for="mode in customBattleModesKeys" :value="mode">{{ customBattleModes[mode].title }}
                    </option>
                  </select>
                </div>
                <div class="flex selector">
                  <p>Результат:</p>
                  <select v-model="battleResult">
                    <option value="any">Любой</option>
                    <option value="win">Победа</option>
                    <option value="lose">Поражение</option>
                  </select>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th ref="firstColumn">Карта</th>
            <td>
              <img src="@/assets/efficiency-icon/percent.png" @click="click('count')"
                :class="hightlight == 'count' ? 'selected' : ''">
              <span class="tooltiptext">Количество</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/dmg.png" @click="click('damage')"
                :class="hightlight == 'damage' ? 'selected' : ''">
              <span class="tooltiptext">Урон</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/spot.png" @click="click('radio')"
                :class="hightlight == 'radio' ? 'selected' : ''">
              <span class="tooltiptext">Насвечено</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/mgsum.png" @click="click('mgSum')"
                :class="hightlight == 'mgSum' ? 'selected' : ''">
              <span class="tooltiptext">Сумма отметки</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/block.png" @click="click('block')"
                :class="hightlight == 'block' ? 'selected' : ''">
              <span class="tooltiptext">Натанковано</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/kill.png" @click="click('kills')"
                :class="hightlight == 'kills' ? 'selected' : ''">
              <span class="tooltiptext">Фрагов</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/duration.png" @click="click('duration')"
                :class="hightlight == 'duration' ? 'selected' : ''">
              <span class="tooltiptext">Продолжительность</span>
            </td>
            <td>
              <img src="@/assets/efficiency-icon/lifetime.png" @click="click('lifeTime')"
                :class="hightlight == 'lifeTime' ? 'selected' : ''">
              <span class="tooltiptext">Время жизни</span>
            </td>
          </tr>
        </thead>

        <!-- <TransitionGroup name="list" tag="tbody"> -->
        <tbody>
          <tr class="skeleton" v-for="i in new Array(5)" v-if="status == 'loading'">
            <td colspan="9"></td>
          </tr>
          <tr v-for="(item, index) in ordered" :key="item.arenaTag">
            <td>{{ nameFromTag(item.arenaTag).value }}
              <div v-if="hightlighted[index]" class="bar-box right" :style="{ width: hightlighted[index] + 'px' }">
              </div>
            </td>
            <td class="text-effect gold">{{ item.percent }}</td>
            <td class="text-effect orange">{{ item.damage.toFixed() }}</td>
            <td class="text-effect green">{{ item.radio.toFixed() }}</td>
            <td class="text-effect light-blue">{{ item.mgSum.toFixed() }}</td>
            <td class="text-effect blue">{{ item.block.toFixed() }}</td>
            <td class="text-effect red"> {{ item.kills.toFixed(1) }}</td>
            <td class="text-effect yellow">
              <div class="time-align">
                <div class="left">{{ timeProcessor(item.duration)[0] }}</div>
                <div>:</div>
                <div class="right">{{ timeProcessor(item.duration)[1] }}</div>
              </div>
            </td>
            <td class="text-effect light-blue">
              <div class="time-align">
                <div class="left">{{ timeProcessor(item.lifeTime)[0] }}</div>
                <div>:</div>
                <div class="right">{{ timeProcessor(item.lifeTime)[1] }}</div>
              </div>
            </td>
          </tr>
        </tbody>
        <!-- </TransitionGroup> -->
      </table>
    </div>

    <template v-else>
      <div class="flex flex-1 center pointer" @click="showError">
        <p class="card-main-info error">!</p>
      </div>
      <p class="card-main-info description">Распределение карт</p>
    </template>
  </ServerStatusWrapper>
</template>

<script setup lang="ts">
import { StatParams, getQueryStatParamsCache, useQueryStatParamsCache, whereClause } from '@/composition/useQueryStatParams';
import { Status, queryAsync } from '@/db';
import { timeProcessor, whereSum } from '@/utils';
import { getArenaName } from '@/utils/i18n';
import { customBattleModesKeys, customBattleModes } from '@/utils/wot';
import { useElementVisibility, useElementSize, useLocalStorage } from '@vueuse/core';
import { ShallowRef, computed, ref, shallowRef, watch, watchEffect } from 'vue';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';

const { params } = defineProps<{
  params: StatParams
}>()

const container = ref<HTMLElement | null>(null);
const firstColumn = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const { width } = useElementSize(container);
const { width: firstWidth } = useElementSize(firstColumn);


const battleResult = ref<'any' | 'win' | 'lose'>('any')
const battleMode = ref<keyof typeof customBattleModes | 'any'>('any')

type Selected = 'count' | 'damage' | 'radio' | 'block' | 'kills' | 'duration' | 'lifeTime' | 'mgSum'
function click(name: Selected) {
  hightlight.value = name;
}

const hightlight = useLocalStorage<Selected>('MapsTableColumnSelected', 'count');

function nameFromTag(tag: string) {
  const key = tag.split('spaces/')[1] + '/name'
  return getArenaName(key)
}

const expressions = computed(() => {
  let result = []

  if (battleMode.value != 'any') {
    const t = customBattleModes[battleMode.value]
    if ('gameplay' in t) result.push(`battleGameplay = '${t.gameplay}'`)
    if ('mode' in t) result.push(`battleMode = '${t.mode}'`)
  }

  return result
})


function generateQuery() {
  return `
  select arenaTag,
       toUInt32(count(*))                                    as count,
       toUInt32(countIf(result = 'lose'))                    as loseCount,
       toUInt32(countIf(result = 'win'))                     as winCount,

       avg(duration)                                         as avgDuration,
       avgIf(duration, result = 'lose')                      as loseDuration,
       avgIf(duration, result = 'win')                       as winDuration,

       avg(personal.damageDealt)                             as damage,
       avgIf(personal.damageDealt, result = 'lose')          as loseDamage,
       avgIf(personal.damageDealt, result = 'win')           as winDamage,

       avg(gunMarkSum)                     as mgSum,
       avgIf(gunMarkSum, result = 'lose')  as loseMgSum,
       avgIf(gunMarkSum, result = 'win')   as winMgSum,

       avg(personal.damageBlockedByArmor)                    as block,
       avgIf(personal.damageBlockedByArmor, result = 'lose') as loseBlock,
       avgIf(personal.damageBlockedByArmor, result = 'win')  as winBlock,

       avg(personal.lifeTime)                                as lifeTime,
       avgIf(personal.lifeTime, result = 'lose')             as loseLifeTime,
       avgIf(personal.lifeTime, result = 'win')              as winLifeTime,

       avg(personal.damageAssistedRadio)                     as radio,
       avgIf(personal.damageAssistedRadio, result = 'lose')  as loseRadio,
       avgIf(personal.damageAssistedRadio, result = 'win')   as winRadio,

       avg(personal.kills)                                   as kills,
       avgIf(personal.kills, result = 'lose')                as loseKills,
       avgIf(personal.kills, result = 'win')                 as winKills
from Event_OnBattleResult
${whereSum(expressions.value)}
${params ? whereClause(params, { withWhere: expressions.value.length == 0 }) : ''}
group by arenaTag
order by count desc;
  `
}

type ResultRow = {
  arenaTag: string,
  count: number, loseCount: number, winCount: number,
  avgDuration: number, loseDuration: number, winDuration: number,
  damage: number, loseDamage: number, winDamage: number,
  block: number, loseBlock: number, winBlock: number,
  lifeTime: number, loseLifeTime: number, winLifeTime: number,
  radio: number, loseRadio: number, winRadio: number,
  kills: number, loseKills: number, winKills: number,
  loseMgSum: number, winMgSum: number, mgSum: number,
}

const resultCache = shallowRef<{ [key in string]?: ShallowRef<{ status: Status, data: ResultRow[] }> }>({})
const cacheKey = computed(() => battleMode.value + '_' + battleMode.value)

watch(cacheKey, (value) => {
  if (resultCache.value[value]) return

  resultCache.value = {
    ...resultCache.value,
    [value]: queryAsync<ResultRow>(generateQuery(), { enabled: visible, settings: getQueryStatParamsCache(params) })
  };
}, { immediate: true })

const result = computed(() => resultCache.value[cacheKey.value]?.value?.data ?? [])
const status = computed(() => resultCache.value[cacheKey.value]?.value?.status)


const resultProcessed = computed(() => {
  const m = battleResult.value;
  const r = result.value

  return r.map(t => ({
    count: m == 'any' ? t.count : m == 'win' ? t.winCount : t.loseCount,
    duration: m == 'any' ? t.avgDuration : m == 'win' ? t.winDuration : t.loseDuration,
    damage: m == 'any' ? t.damage : m == 'win' ? t.winDamage : t.loseDamage,
    block: m == 'any' ? t.block : m == 'win' ? t.winBlock : t.loseBlock,
    lifeTime: m == 'any' ? t.lifeTime : m == 'win' ? t.winLifeTime : t.loseLifeTime,
    radio: m == 'any' ? t.radio : m == 'win' ? t.winRadio : t.loseRadio,
    kills: m == 'any' ? t.kills : m == 'win' ? t.winKills : t.loseKills,
    mgSum: m == 'any' ? t.mgSum : m == 'win' ? t.winMgSum : t.loseMgSum,
    arenaTag: t.arenaTag,
  }))
    .filter(t => t.count > 0)
})

const ordered = computed(() => {
  const percentSum = resultProcessed.value.reduce((acc, item) => acc + item.count, 0) ?? 1;
  const maxBattleCount = Math.max(...resultProcessed.value.map(item => item.count) ?? [0]);

  return resultProcessed.value.sort((a, b) => b[hightlight.value] - a[hightlight.value])
    .map(item => ({
      ...item,
      percent: maxBattleCount < 20 ? `${item.count} - ${(item.count / percentSum * 100).toFixed(1)}%` : (item.count / percentSum * 100).toFixed(1) + '%',
    }))
})

const hightlighted = computed(() => {
  const hightlightValue = hightlight.value
  const max = Math.max(...resultProcessed.value.map(item => item[hightlight.value]) ?? [0]);
  return resultProcessed.value.map(t => t[hightlightValue] / max * (width.value - firstWidth.value) * 0.9)
})

</script>


<style lang="scss" scoped>
@use '/src/styles/table.scss' as *;

.container {
  overflow-x: auto;
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

a {
  color: inherit;
  font-weight: 400;
  transition: all 0.1s;

  &:hover {
    color: #eff3ff;
    filter: drop-shadow(0 0 0.5em #5249c6);
  }
}

td {

  white-space: nowrap;

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

    img {
      width: 35px;
      border-radius: 10px;
      cursor: pointer;

      &.selected {
        background-color: $bar-color;
      }
    }
  }

  td {
    text-align: center;
    width: 10%;
    position: relative;
    padding: 0 4px;
    text-wrap: nowrap;
  }

  td:first-child:not(.title) {
    border-right: $border;
  }

  th:first-child:not(.title) {
    border-right: $border;
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

  // transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  // will-change: width;

}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease-out;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}

.flex.selector {
  gap: 3px;
  align-items: center;
}
</style>