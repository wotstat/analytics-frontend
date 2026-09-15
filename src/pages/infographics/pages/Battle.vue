<template>
  <h2 class="page-title">Бои</h2>
  <div class="flex ver battle" ref="container">
    <div class="card long">
      <GenericInfo :status="dataStart.status" :value="dataStart.data.battleCount"
        :processor="createFixedSpaceProcessor(0)" description="Боёв проведено" color="green" />
    </div>
    <div class="flex ver main">
      <div class="grid">
        <div class="card avg-queue">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.avgInQueue"
            description="Среднее время в очереди" color="green" :processor="ms2sec" :mini-processor="ms2secLabel" />
        </div>

        <div class="card avg-battle">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.duration" description="Среднее время боя"
            color="yellow" :processor="sec2minsec" />
        </div>

        <div class="card winrate pie chart">
          <ServerStatusWrapper :status="winrateResult.status" v-slot="{ showError, status }">
            <div v-if="status != 'error'" class="winrate-pie-container" :class="status">
              <svg class="winrate-pie" viewBox="0 0 180 130" role="img" :aria-label="winrateAriaLabel">
                <circle class="winrate-pie-track" cx="90" cy="55" r="42" />
                <circle v-for="segment in winrateRenderSegments" v-show="segment.value > 0" :key="segment.result"
                  class="winrate-pie-segment" cx="90" cy="55"
                  r="42" pathLength="100" :stroke-dasharray="`${segment.value} ${100 - segment.value}`"
                  :stroke-dashoffset="-segment.displayOffset" :style="segment.style" />

                <g v-for="segment in winrateSegments" v-show="segment.value > 0" :key="`callout-${segment.result}`"
                  class="winrate-pie-callout" :data-result="segment.result" :style="segment.style" aria-hidden="true">
                  <polyline class="winrate-pie-callout-line" :points="segment.callout.points" />
                  <text class="winrate-pie-callout-value" :x="segment.callout.x" :y="segment.callout.y"
                    :text-anchor="segment.callout.textAnchor">{{ segment.valueLabel }}</text>
                </g>

                <text class="winrate-pie-value" x="90" y="55">{{ winrateLabel }}</text>
              </svg>
            </div>

            <div v-else class="flex flex-1 center pointer" @click="showError">
              <p class="card-main-info error">!</p>
            </div>
          </ServerStatusWrapper>
          <p class="card-main-info description">Винрейт</p>
        </div>

        <div class="card avg-prebattle">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.avgWaitTime"
            description="Среднее время в ожидании боя" color="blue" :processor="ms2sec" :mini-processor="ms2secLabel" />
        </div>

        <div class="card avg-lifetime">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.lifetime" description="Среднее время жизни"
            color="orange" :processor="sec2minsec" />
        </div>

        <div class="card total-wait">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.waitTime"
            description="Потрачено в ожидании боя" color="red" :processor="t => hourDayExp(t).value"
            :mini-processor="t => hourDayExp(t).suffix" />
        </div>

        <div class="card total-play">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.inBattle" description="Потрачено в бою"
            color="red" :processor="t => hourDayExp(t).value" :mini-processor="t => hourDayExp(t).suffix" />
        </div>


        <div class="card u1 chart bar">
          <MiniBarNew :status="durationResult.status" :labels="durationData.labels" :data="durationData.p"
            :color="'green'" :blur-radius="4" :tooltip="{
              title: (t) => `Было ${Math.round(t.hit.datum * 100)}% боёв ${t.hit.categoryIndex}-${t.hit.categoryIndex + 1} минут`,
            }" />
          <p class="card-main-info description">Продолжительность боя</p>
        </div>

        <div class="card chart bar tank-type">

          <MiniBarNew :status="avgTypeResult.status" :labels="tankLabels" :data="avgChart" :color="'blue'"
            :blur-radius="8" :tooltip="{
              title: (t) => `В среднем в команде было ${t.hit.datum} ${t.hit.category}`,
            }" />
          <p class="card-main-info description">Классов танков в командах</p>
        </div>

        <div class="card u2 chart bar">
          <MiniBarNew :status="durationResult.status" :labels="durationData.labels" :data="durationData.l"
            :color="'yellow'" :blur-radius="4" :tooltip="{
              title: (t) => `В боях ${t.hit.categoryIndex}-${t.hit.categoryIndex + 1} минут вы жили ${Math.round(t.hit.datum * 10) / 10} мин `,
            }" />
          <p class="card-main-info description">Время жизни по длине боя</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/pages/infographics/shared/widgets/GenericInfo.vue'
import MiniBarNew from '@/pages/infographics/shared/widgets/charts/MiniBarNew.vue'
import ServerStatusWrapper from '@/pages/infographics/shared/ServerStatusWrapper.vue'
import { getColor } from '@/pages/infographics/shared/bloomColors'
import { useQueryStatParams, useQueryStatParamsCache, whereClause } from '@/shared/query/useQueryStatParams'
import { queryAsync, queryAsyncFirst } from '@/db'
import { useElementVisibility } from '@vueuse/core'
import { computed, useTemplateRef, watchEffect } from 'vue'

import { ms2sec, sec2minsec, ms2secLabel } from '@/shared/utils/time'
import { createFixedSpaceProcessor } from '@/shared/utils/processors/processors'
import { useMeta } from '@/shared/composition/useMeta'

useMeta({
  title: 'Сессионная инфографика',
  description: 'Серверная статистика по сессии игрока в Мир Танков и World of Tanks',
  keywords: 'инфографика, сессия, игрок, статистика, World of Tanks'
})


const container = useTemplateRef<HTMLElement>('container')
const visible = useElementVisibility(container)
const params = useQueryStatParams()
const settings = useQueryStatParamsCache(params)

const tankLabels = ['СТ', 'ТТ', 'ПТ', 'ЛТ', 'САУ']
const percentageFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const winrateSegmentDefinitions = [
  { result: 'win', label: 'Победы', color: 'green' },
  { result: 'lose', label: 'Поражения', color: 'red' },
  { result: 'tie', label: 'Ничьи', color: 'orange' },
] as const

type BattleResult = typeof winrateSegmentDefinitions[number]['result']
const winrateSegmentPaintOrder: Record<BattleResult, number> = { lose: 0, tie: 1, win: 2 }

const dataStart = queryAsyncFirst(`
select sum(inQueueWaitTime + loadTime + preBattleWaitTime) / 1000 / 60 / 60 as waitTime,
       count(*)                                                             as battleCount,        
       avg(preBattleWaitTime + 
          if(battleTime < 0 and preBattleWaitTime + battleTime < 0, -battleTime, 0)) as avgWaitTime,
       avgIf(inQueueWaitTime, inQueueWaitTime < 300000)                              as avgInQueue
from Event_OnBattleStart
${whereClause(params, { isBattleStart: true })}
`, { waitTime: 0, avgWaitTime: 0, avgInQueue: 0, battleCount: 0 }, { enabled: visible, settings: settings.value })

const dataResult = queryAsyncFirst(`
select round(avg(personal.lifeTime))    as lifetime,
       round(avg(duration))             as duration,
       sum(personal.lifeTime) / 60 / 60 as inBattle
from Event_OnBattleResult
${whereClause(params)};`, { lifetime: 0, duration: 0, inBattle: 0 }, { enabled: visible, settings: settings.value })

const durationResult = queryAsync<{ percent: number, duration: number, lifetime: number }>(`
select duration, lifetime, count / sum(count) over () as percent
from (select ceil(duration / 60)         as duration,
             count(*)                    as count,
             avg(personal.lifeTime) / 60 as lifetime
      from Event_OnBattleResult
      ${whereClause(params)}
      group by duration
      order by duration)`, { enabled: visible, settings: settings.value })

const avgTypeResult = queryAsyncFirst(`
select avg(ltCount / playersCount) as LT,
      avg(htCount / playersCount) as HT,
      avg(mtCount / playersCount) as MT,
      avg(atCount / playersCount) as AT,
      avg(spgCount / playersCount) as SPG
from Event_OnBattleResult
${whereClause(params)};
`, { LT: 0, HT: 0, MT: 0, AT: 0, SPG: 0 }, { enabled: visible, settings: settings.value })

const winrateResult = queryAsync<{ count: number, result: BattleResult }>(
  `select count(*) as count, result from Event_OnBattleResult ${whereClause(params)} group by result`,
  { enabled: visible, settings: settings.value }
)

const winrateSegments = computed(() => {
  const counts: Record<BattleResult, number> = {
    win: 0,
    tie: 0,
    lose: 0,
  }

  const { data } = winrateResult.value

  for (const item of data) counts[item.result] = item.count

  const total = counts.win + counts.tie + counts.lose
  let offset = 0

  const segments = winrateSegmentDefinitions.map(definition => {
    const value = total === 0 ? 0 : counts[definition.result] / total * 100
    const colors = getColor(definition.color)
    const segment = {
      ...definition,
      value,
      offset,
      valueLabel: `${formatPercentage(value)}%`,
      style: {
        '--segment-color': colors.darken,
        '--segment-hover-color': colors.main,
        '--segment-bloom-color': colors.bloom,
      }
    }

    offset += value
    return segment
  })

  const tieSegment = segments.find(segment => segment.result === 'tie')
  const rotation = tieSegment?.value
    ? 50 - tieSegment.offset - tieSegment.value / 2
    : 0

  return segments.map(segment => {
    const displayOffset = segment.offset + rotation
    const midpoint = (displayOffset + segment.value / 2) / 100 * Math.PI * 2 - Math.PI / 2
    const directionX = Math.cos(midpoint)
    const directionY = Math.sin(midpoint)
    const anchorX = 90 + directionX * 50
    const anchorY = 55 + directionY * 50
    const bendX = 90 + directionX * 56
    const bendY = 55 + directionY * 56
    const isRight = directionX >= 0
    const calloutY = Math.min(100, Math.max(12, bendY))

    return {
      ...segment,
      displayOffset,
      callout: segment.result === 'tie'
        ? { points: '90,105 90,113', x: 90, y: 122, textAnchor: 'middle' as const }
        : {
          points: `${anchorX},${anchorY} ${bendX},${bendY} ${isRight ? 154 : 26},${calloutY}`,
          x: isRight ? 158 : 22,
          y: calloutY,
          textAnchor: isRight ? 'start' as const : 'end' as const,
        }
    }
  })
})

const winrateLabel = computed(() => `${formatPercentage(winrateSegments.value[0]?.value ?? 0)}%`)
const winrateRenderSegments = computed(() => [...winrateSegments.value]
  .sort((left, right) => winrateSegmentPaintOrder[left.result] - winrateSegmentPaintOrder[right.result]))
const winrateAriaLabel = computed(() => `Винрейт: ${winrateSegments.value
  .map(segment => `${segment.label.toLowerCase()} ${segment.valueLabel}`)
  .join(', ')}`)

function formatPercentage(value: number) {
  return percentageFormatter.format(value)
}

const avgChart = computed(() => {
  const { data: r } = avgTypeResult.value
  return [r.MT, r.HT, r.AT, r.LT, r.SPG].map(t => t * 30 / 2).map(t => Math.round(t * 100) / 100)
})

const durationData = computed(() => {
  const { data: durations } = durationResult.value

  const keyed = durations.reduce((prev, curr) => {
    prev[curr.duration] = { p: curr.percent, l: curr.lifetime }
    return prev
  }, {} as any)

  for (let i = 1; i <= 16; i++) {
    if (!(i in keyed)) {
      keyed[i] = { p: 0, l: 0 }
    }
  }

  return {
    labels: Object.keys(keyed),
    p: Object.values(keyed).map((t: any) => t.p),
    l: Object.values(keyed).map((t: any) => t.l),
  }
})

function hourDayExp(hour: number) {
  if (hour < 1000) return { value: hour.toFixed(1), suffix: 'часа' }
  const day = hour / 24
  if (day < 1000) return { value: day.toFixed(1), suffix: 'дня' }
  return { value: (day / 365).toFixed(1), suffix: 'лет' }
}

</script>


<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

.battle {
  .grid {
    display: grid;
    grid-template-columns: 1fr repeat(2, 0.5fr) 1fr;
    grid-gap: 15px;


    .winrate {
      grid-column: 2 / 4;
      grid-row: 1 / 3;
    }

    .total-wait {
      grid-column: 1 / 3;
    }

    .total-play {
      grid-column: 3 / 5;
    }

    .tank-type {
      grid-column: 2 / 4;
    }

    @include less-medium {
      grid-template-columns: repeat(6, minmax(0, 1fr));

      .winrate {
        grid-column: 1 / 3;
        grid-row: 1 / 3;
      }

      .avg-battle {
        grid-column: 3 / 5;
      }

      .avg-lifetime {
        grid-column: 5 / 7;
      }

      .avg-prebattle {
        grid-column: 5 / 7;
        grid-row: 1;
      }

      .avg-queue {
        grid-column: 3 / 5;
      }

      .total-wait {
        grid-column: 1 / 4;
      }

      .total-play {
        grid-column: 4 / 7;
      }

      .tank-type {
        grid-column: 3 / 5;
      }

      .u1 {
        grid-column: 1 / 3;
      }

      .u2 {
        grid-column: 5 / 7;
      }
    }

    @include less-small {
      grid-template-columns: 1fr;

      .winrate,
      .avg-battle,
      .avg-lifetime,
      .avg-prebattle,
      .avg-queue,
      .total-wait,
      .total-play,
      .tank-type,
      .u1,
      .u2 {
        grid-column: auto;
        grid-row: auto;
      }

      .winrate {
        grid-row: 1;
      }

      .avg-prebattle {
        grid-row: 3;
      }

      .u1 {
        grid-row: 9;
      }
    }
  }

  .chart {
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 15px;

    &.bar {
      height: 200px;
      padding: 10px 15px 15px 15px;
    }

    &.pie {
      @include less-small {
        height: 250px;
      }
    }

    &.winrate {
      padding: 0 0 15px 0;

      .description {
        margin-top: -10px;
      }
    }

  }
}

.winrate-pie-container {
  position: relative;
  flex: 1;
  min-height: 0;

  &.loading {
    opacity: 0.55;
  }
}

.winrate-pie {
  position: absolute;
  inset: 0;
  width: calc(100% - 24px);
  height: calc(100% - 24px);
  max-width: 280px;
  max-height: 220px;
  margin: auto;
  overflow: visible;
}

.winrate-pie-track,
.winrate-pie-segment {
  fill: none;
  stroke-width: 16;
  transform: rotate(-90deg);
  transform-origin: 90px 55px;
}

.winrate-pie-track {
  stroke: rgb(255 255 255 / 8%);
}

.winrate-pie-segment {
  stroke: var(--segment-color);
  filter: drop-shadow(0 0 5px var(--segment-bloom-color));
  transition: stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease;

  &:hover {
    stroke: var(--segment-hover-color);
    stroke-width: 18;
    filter: drop-shadow(0 0 8px var(--segment-bloom-color));
  }
}

.winrate-pie-callout {
  pointer-events: none;
}

.winrate-pie-callout-line {
  fill: none;
  stroke: var(--segment-color);
  stroke-width: 1.25;
  opacity: 0.8;
  vector-effect: non-scaling-stroke;
}

.winrate-pie-callout-value {
  fill: var(--segment-hover-color);
  font-size: 8px;
  font-weight: var(--bold-weight);
  font-variant-numeric: tabular-nums;
  dominant-baseline: central;
  filter: drop-shadow(0 0 3px var(--segment-bloom-color));
}

.winrate-pie-value {
  fill: v-bind("getColor('green').main");
  font-size: 14px;
  font-weight: var(--bold-weight);
  font-variant-numeric: tabular-nums;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
  filter: drop-shadow(0 0 5px v-bind("getColor('green').bloom"));
}
</style>
