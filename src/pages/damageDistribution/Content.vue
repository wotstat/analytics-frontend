<template>
  <h2 class="small-bottom-margin page-title">Расширенное распределение урона</h2>


  <p class="section-description">Выберите один вид урона
    <br>
    <i>Учитываются выстрелы ББ, БП и КС снарядами по танкам с ХП, превышающим максимальный урон снаряда</i>
  </p>

  <div class="card long">
    <ServerStatusWrapper :status="damageCount.status" v-slot="{ showError, status }">
      <div class="container" v-if="status != 'error'">
        <table class="hover-highlight">
          <thead>
            <tr>
              <th></th>
              <th>Урон</th>
              <th>Мин</th>
              <th>Макс</th>
              <th>Разброс</th>
              <th>Выстрелов</th>
            </tr>
          </thead>

          <tbody>
            <tr class="skeleton" v-for="i in new Array(5)" v-if="status == 'loading'">
              <td colspan="6"></td>
            </tr>

            <tr v-for="item in table">
              <td class="checkbox">
                <input type="radio" name="shell-damage" :value="item.shellDamage" v-model="selectedDamage">
              </td>
              <th class="text-effect gold">{{ item.shellDamage }}</th>
              <td class="text-effect red">{{ item.min }} (-{{ item.shellDamage - item.min }})</td>
              <td class="text-effect green">{{ item.max }} (+{{ item.max - item.shellDamage }})</td>
              <td class="text-effect blue">{{ item.spread }}</td>
              <td class="text-effect orange">{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-1 center pointer" v-else @click="showError">
        <p class="card-main-info error">!</p>
      </div>
    </ServerStatusWrapper>
  </div>

  <h3>Параметры</h3>
  <p>Выберите число уронов на один столбик графика</p>
  <div class="steps-count">
    <button v-for="item in allowedSteps" :class="item == selectedStep ? 'selected' : ''" @click="selectedStep = item">{{
      item }}</button>
  </div>

  <div class="card">
    <div class="chart-container">
      <ShadowBar :data="chartData" :options="options" />
    </div>
  </div>


  <h3>Погрешность</h3>
  <p>Границы допустимой погрешности рассчитываются индивидуально для <b>выбранного</b> значения урона ({{
      selectedDamage
    }}) и числа подходящих выстрелов ({{ selectedTotal }})</p>

  <template v-if="distribution.labels.length">
    <div v-if="readyToCalculate">
      <p>После нажатия кнопки "Рассчитать" будет проведено <input type="number" min="100" max="1000000"
          v-model="experimentsCount"> экспериментов с серией по {{ selectedTotal }} выстрелов
      </p>

      <br>
      <div class="flex">
        <button class="flex-1" @click="calculate">Рассчитать</button>
      </div>
    </div>
    <div v-else-if="!errorResult">
      <progress :value="progress">70%</progress>
    </div>
    <div v-else>
      <h4>Настройте доверительный интервал</h4>
      <div class="steps-count">
        <button v-for="item in confidenceLevels" :class="item == selectedConfidence ? 'selected' : ''"
          @click="selectedConfidence = item">{{ item }}</button>
      </div>
      <div class="flex">
        <input class="flex-1" type="range" min="0" max="0.9999999" :step="errorConfidenceStep"
          v-model="selectedConfidence">
        <input type="number" min="0" max="0.9999999" :step="errorConfidenceStep" v-model="selectedConfidence">
      </div>
      <p>Были просимулированы {{ errorResult[0].length }} сессий по {{ selectedTotal }} выстрелов, в <span
          class="text-effect gold">{{
      (selectedConfidence * 100).toFixed(errorConfidenceStep.toString().length - 4) }}%</span> сессий
        распределение
        урона находилось МЕЖДУ границами.</p>
      <!-- <p>Если любой из столбиков вашего распределения выходит за пределы интервала</p> -->
      <!-- <hr> -->
      <br>
      <div class="flex">
        <button class="flex-1" @click="reset">Сбросить</button>
      </div>
    </div>
  </template>
  <hr>
  <div class="info-cards flex">
    <div class="card flex-1">
      <GenericInfo :status="infoCardsResult.status" :value="infoCards.avg" description="Средний урон"
        :processor="useFixedProcessor(2)" :color="infoCards.avg < selectedDamage ? 'red' : 'green'" />
    </div>
    <div class="card flex-1">
      <GenericInfo :status="infoCardsResult.status" :value="infoCards.median" description="Медианный урон"
        :color="infoCards.median < selectedDamage ? 'red' : 'green'" />
    </div>
    <div class="card flex-1">
      <GenericInfo :status="infoCardsResult.status" :value="infoCards.belowDamage"
        description="Выстрелов с уроном ниже среднего" :processor="usePercentProcessor(2)"
        :color="infoCards.belowDamage > 0.5 ? 'red' : 'green'" />
    </div>
  </div>
  <Description />
</template>


<script lang="ts" setup>

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { Status, loading, query, queryAsync, queryAsyncFirst, queryComputed } from '@/db';
import { computed, ref, shallowRef, watch, watchEffect } from 'vue';
import { VueComponent as Description } from './description.md'

import { type ChartProps } from 'vue-chartjs';
import { type TooltipCallbacks } from 'chart.js';
import { ShadowBar } from "@/components/ShadowBarController";
import { ShadowLineController } from "@/components/ShadowLineController";
import { getColor } from '@/components/bloomColors';
import { useErrorCalculation } from './errorCalculation';
import { useFixedProcessor, usePercentProcessor } from '@/composition/usePercentProcessor';
import ServerStatusWrapper from '@/components/ServerStatusWrapper.vue';


// Нужно чтоб выполнились функции внутри модуля и зарегистрировались компоненты
ShadowLineController

const confidenceLevels = [0.9, 0.95, 0.99, 0.999]
const damageSteps = [3, 5, 7, 9, 11, 13, 15, 17]

const stats = useQueryStatParams()

const experimentsCount = ref<number>(5000)
const selectedDamage = ref<number>(0)
const selectedStep = ref<number>(0)
const selectedConfidence = ref<number>(0.95)
const distribution = shallowRef({
  labels: [] as string[],
  values: [] as number[],
  percents: [] as number[],
  from: [] as number[],
  to: [] as number[],
})

const damageCount = queryAsync<{ shellDamage: number, count: number }>(`
select shellDamage, toUInt32(count()) as count
from Event_OnShot
    array join
     results.shotDamage as dmg,
     results.shotHealth as health
where dmg > 0
  and health > 0
  and shellTag != 'HIGH_EXPLOSIVE'
  and shellTag != 'FLAME'
  and (dmg + health) > round(shellDamage * 1.250001) // 1.250001 чтоб округляло в большую сторону
  ${whereClause(stats, { withWhere: false })}
group by shellDamage
order by count desc;
`)

const total = computed(() => damageCount.value.data.reduce((acc, { count }) => acc + count, 0))
const selectedTotal = computed(() => damageCount.value.data.find(({ shellDamage }) => shellDamage == selectedDamage.value)?.count ?? 0)
const errorConfidenceStep = computed(() => {
  const num = 1 / experimentsCount.value
  const magnitude = Math.floor(Math.log10(num));
  const nearestLowerPowerOf10 = Math.pow(10, magnitude);
  return +nearestLowerPowerOf10.toFixed(Math.abs(magnitude));
})

const table = computed(() => {
  if (!damageCount.value.data.length) return []

  return damageCount.value.data.map(({ shellDamage, count }) => {
    const min = Math.round(shellDamage * 0.75)
    const max = Math.round(shellDamage * 1.25)

    return {
      shellDamage,
      min,
      max,
      spread: max - min + 1,
      count
    }
  })
})

const allowedSteps = computed(() => {
  if (!selectedDamage.value) return []

  const currentDamage = selectedDamage.value

  const max = Math.ceil(currentDamage * 1.25)
  const min = Math.ceil(currentDamage * 0.75)
  const delta = max - min + 1

  return [1, ...damageSteps.filter(step => delta / step > 15)]
})

watch(allowedSteps, val => {
  if (val.includes(selectedStep.value)) return

  const priority = [5, 7, 3, 9]
  if (priority.some(step => {
    if (val.includes(step)) {
      selectedStep.value = step
      return true
    }
  })) return

  selectedStep.value = val[0]
})

watchEffect(() => selectedDamage.value = damageCount.value.data[0]?.shellDamage ?? 0)

const infoCardsResult = queryComputed<{ avg: number, median: number, belowDamage: number }>(() => `
select avg(dmg) as avg, median(dmg) as median, 
  countIf(dmg < ${selectedDamage.value}) as less, 
  countIf(dmg > ${selectedDamage.value}) as more, 
  less / (less + more) as belowDamage
from Event_OnShot
    array join
     results.shotDamage as dmg,
     results.shotHealth as health
where dmg > 0
  and health > 0
  and shellTag != 'HIGH_EXPLOSIVE'
  and shellTag != 'FLAME'
  and shellDamage = ${selectedDamage.value}
  and (dmg + health) > ${Math.round(selectedDamage.value * 1.25)}
  ${whereClause(stats.value, { withWhere: false })}
`)

const infoCards = computed(() => {
  const { data } = infoCardsResult.value

  if (data.length == 0) return { avg: 0, median: 0, belowDamage: 0 }

  return data[0]
})

watch([selectedDamage, selectedStep], async ([damage, step]) => {
  if (!damage || !step) return

  distribution.value = {
    labels: [],
    values: [],
    percents: [],
    from: [],
    to: []
  }

  const max = Math.round(damage * 1.25)
  const min = Math.round(damage * 0.75)
  const delta = max - min

  let barCount = 0
  let leftBorder = damage - Math.floor(step / 2)
  let rightBorder = damage + Math.floor(step / 2)

  while (leftBorder - step >= min) {
    leftBorder -= step
    rightBorder += step
    barCount++
  }

  const leftEnough = leftBorder - min
  const rightEnough = max - rightBorder

  const limit = delta + 1

  console.log(`${leftEnough} + ${barCount * 2 + 1}*${step} + ${rightEnough}; Limit: ${limit}`);

  const group = `floor((nDmg + ${step - leftEnough}) / ${step})`

  const res = await query<{ r: number, from: number, to: number, value: number, percent: number }>(`
select ${group} as r,
       toUInt32(to - barCount + 1) as from,
       toUInt32(sum(barCount) over (order by r) - 1 + ${min}) as to,
       sum(c) as value,
       value / sum(value) over () * 100 as percent,
       count(c) as barCount
from (select filled as nDmg, c
      from (select (dmg - ${min}) as zDmg, count() as c
            from Event_OnShot array join results.shotDamage as dmg, results.shotHealth as health
            where dmg > 0 and health > 0
              and shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
              and shellDamage = ${damage}
              and (dmg + health) > ${max}
              ${whereClause(stats.value, { withWhere: false })}
            group by zDmg) as T1
      right join (select toInt32(number) as filled from numbers(${limit})) as T2 on filled = zDmg
      order by nDmg
      limit ${limit})
group by r
order by r
  `)

  distribution.value = {
    labels: res.data.map(({ from, to }) => `${(from + to) / 2}`),
    values: res.data.map(({ value }) => value),
    percents: res.data.map(({ percent }) => percent),
    from: res.data.map(({ from }) => from),
    to: res.data.map(({ to }) => to),
  }
})

const intervals = computed(() => {
  if (!distribution.value) return []

  return Array.from({ length: distribution.value.labels.length }, (_, i) => {
    const from = distribution.value.from[i]
    const to = distribution.value.to[i]

    return [from, to] as [number, number]
  })
})

const { readyToCalculate, calculate, reset, progress, result: errorResult } = useErrorCalculation(selectedDamage, selectedTotal, intervals, experimentsCount)

const lowHight = computed(() => {
  if (!errorResult.value) return [[], []]

  const count = errorResult.value[0].length - 1

  const t = 1 - selectedConfidence.value;

  const low = Math.round(t / 2 * count)
  const high = Math.round((1 - t / 2) * count)

  return [errorResult.value.map(t => t[low] * 100), errorResult.value.map(t => t[high] * 100)]
})

const chartData = computed<ChartProps<'bar' | 'line'>['data']>(() => {

  const datasets: ChartProps<'bar' | 'line'>['data']['datasets'] = [{
    data: distribution.value.percents ?? [],
    borderColor: getColor('green').bloom,
    backgroundColor: getColor('green').main,
    order: 10,
    animation: false
  }]

  if (errorResult.value) {
    const [low, high] = lowHight.value
    datasets.push({
      data: low,
      type: 'ShadowLine' as any,
      borderColor: getColor('red').bloom,
      backgroundColor: getColor('red').main,
      animation: false
    }, {
      data: high,
      type: 'ShadowLine' as any,
      borderColor: getColor('red').bloom,
      backgroundColor: getColor('red').main,
      animation: false
    })

    datasets[0].borderColor = datasets[0].data.map((v, i) => v as number > high[i] || v as number < low[i] ? getColor('gold').bloom : getColor('green').bloom)
    datasets[0].backgroundColor = datasets[0].data.map((v, i) => v as number > high[i] || v as number < low[i] ? getColor('gold').main : getColor('green').main)
  } else {
    datasets[0].borderColor = datasets[0].data.map(() => getColor('green').bloom)
    datasets[0].backgroundColor = datasets[0].data.map(() => getColor('green').main)
  }

  return {
    labels: distribution.value.labels ?? [],
    datasets: datasets
  }
})

const max = computed(() => Math.max(...distribution.value.percents, ...lowHight.value[1], ...lowHight.value[0]))

const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  // animation: false,
  scales: {
    y: { display: false, max: max.value == 0 ? undefined : max.value * 1.1 },
    x: {
      grid: { display: false },
      min: 0,
      // ticks: { display: true },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  labels: {
    enabled: false,
  },
  elements: {
    point: {
      pointStyle: false
    },
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: (item) => {
          const from = distribution.value.from[item[0].dataIndex]
          const to = distribution.value.to[item[0].dataIndex]
          return from == to ? `Урон ${from}` : `Урон от ${from} до ${to} включая границы` + `\n${(from + to) / 2} +- ${(to - from) / 2}`
        },
        beforeBody: (item) => {
          const value = distribution.value.values[item[0].dataIndex]
          const percent = distribution.value.percents[item[0].dataIndex]
          return `Количество: ${value} (${percent.toFixed(2)}%)`
        },
        afterBody: (item) => {
          const from = distribution.value.from[item[0].dataIndex]
          const to = distribution.value.to[item[0].dataIndex]

          return from == to ? `` : `${to - from + 1} значений на столбик`
        },
        label: (i) => ''
      },
      // enabled: !props.tooltipDisabled,
    },
    legend: {
      display: false,
    },
    // @ts-ignore
    centerLine: distribution.value.labels.indexOf(`${selectedDamage.value}`),
  },
}))



</script>

<style lang="scss" scoped>
@import '@/styles/table.scss';
@import '@/styles/textColors.scss';

.info-cards {
  flex-wrap: wrap;

  .card {
    min-width: 200px;
  }
}

.chart-container {
  aspect-ratio: 2;
}

progress {
  width: 100%;

  -webkit-appearance: none;
  appearance: none;
  height: 20px;
  margin: 10px 0;

  &::-webkit-progress-bar {
    background-color: #1a1a1a;
    border-radius: 5px;
  }

  &::-webkit-progress-value {
    background-color: #65f0ff;

    border-radius: 5px;
  }
}

.spacer {
  margin-bottom: 300px;
}

input[type='radio'] {
  cursor: pointer;
}

.steps-count {
  display: flex;
  flex-wrap: wrap;

  margin: 10px 0;
  gap: 10px;
  user-select: none;

  .selected {
    color: #353535;
    font-weight: 800;
    background-color: #fffbe7;
    filter: drop-shadow(0 0 4px #d66d08);

    &:hover {
      border-color: #0000;
    }
  }
}

h3 {
  margin: 0;
  margin-top: 20px;
}

.container {
  overflow-x: auto;
  overflow-y: auto;

  max-height: 300px;

  table {
    width: 100%;

    border-collapse: separate;
    border-spacing: 0;

    td {
      width: 19%;

      &.checkbox {
        width: 5%;
      }
    }

    thead {
      tr {

        th {
          position: sticky;
          top: 0;
          padding: 0 10px;
          border-bottom: $border;
          background-color: $background-secondary;
          z-index: 5;
        }
      }
    }

    td {
      text-align: center;
      text-wrap: nowrap;
      padding: 0 5px;
    }
  }
}
</style>