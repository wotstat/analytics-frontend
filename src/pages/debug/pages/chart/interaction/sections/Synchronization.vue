<template>
  <DebugSection title="Синхронизация нескольких графиков" id="sync"
    description="Два независимых хаба: HoverSynchronizer (ховер зажигается на всех в той же точке фрейма) и BoundsSynchronizer (окно ведущей оси повторяется остальными). Включаются по отдельности."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/sync/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">hover-sync</span>
        <input type="checkbox" v-model="hoverSync">
      </label>

      <label class="debug-control">
        <span class="debug-label">bounds-sync</span>
        <select v-model="boundsMode">
          <option v-for="item in boundsModes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">направление</span>
        <select v-model="direction">
          <option v-for="item in directions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="source">
          <option v-for="item in dataSources" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <button class="debug-btn" @click="resetAll">Сбросить область</button>

      <span class="debug-hint" v-if="source === 'real' && realStatus !== success">Данные ещё грузятся.</span>
    </div>

    <div class="charts">
      <div class="chart" v-for="(item, index) in charts" :key="index">
        <div class="chart-head">
          <span class="title">{{ titles[index] }}</span>
          <span class="debug-value readout">
            x {{ readout(index)?.x ?? '—' }} · y {{ readout(index)?.y ?? '—' }}
          </span>
          <span class="debug-value dim">
            окно {{ formatBound(boundsOf(index).minX) }} … {{ formatBound(boundsOf(index).maxX) }}
          </span>
        </div>

        <DemoChartView :chart="item" :height="180" />
      </div>
    </div>

    <p class="debug-hint">
      Совпадение <span class="debug-value">x</span> в трёх строках — и есть проверка hover-sync: примитив синка живёт
      в координатах данных, а не в пикселях, поэтому работает и при разном зуме. Значения
      <span class="debug-value">y</span> у графиков разного масштаба по построению — ось Y всегда локальная.
    </p>

    <p class="debug-note">
      Hover-sync: наведись на любой график — линия и маркер зажгутся на всех трёх в той же точке. Уведи курсор — гаснут
      все. Локальный ховер приоритетнее внешнего: наводись на второй график, пока к первому «прилетает» внешний, —
      побеждает свой курсор. Выключи тумблер, не трогая bounds-sync: связка ховера должна пропасть, а зум остаться
      общим (и наоборот) — хабы независимы.
    </p>

    <p class="debug-note">
      Bounds-sync <span class="debug-value">через ZoomChartComponent</span>: зумь или пань любой график — остальные
      повторяют окно ведущей оси, при этом каждый анимирует свою ось Y под свои данные. Ведомый применяет кадр
      синхронно, в кадре источника, поэтому ховер на ведомых не должен дребезжать во время зума: наведись на второй
      график и зумь колесом первый — маркеры обязаны стоять на точках.
    </p>

    <p class="debug-note">
      Ломающий режим <span class="debug-value">напрямую через setRenderBounds</span>: то же окно X, но проставленное в
      обход компонента. Пань первый график и смотри на Y ведомых — она пересчитывается синхронно и снапится на каждом
      кадре вместо плавного доезда. Ровно поэтому синк идёт через компонент, а не в обход; в этом режиме ещё и
      <span class="debug-value">onSetRenderBounds</span> у ведомых сбрасывает состояние хаба.
    </p>

    <p class="debug-note">
      Пальцем: пинч на одном графике должен вести остальные без отставания; ховер удержанием — зажигать метки на всех.
      Проверь смену ведущего: пропань первый, не дожидаясь остановки инерции, начни пан второго — источник обязан
      переключиться, а инерция первого погаснуть.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { success } from '@/db'
import { dataSources } from '@/pages/debug/shared/fixtures/types'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { syntheticMultiSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { useRealDailySeries } from '@/pages/debug/shared/fixtures/realSeries'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { BoundsSynchronizer, type BoundsSyncDirection } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/BoundsSynchronizer'
import DemoChartView from '../shared/DemoChartView.vue'
import { DemoChart } from '../shared/DemoChart'
import { GatedHoverSync } from '../shared/GatedHoverSync'
import { seriesExtent } from '../shared/series'
import { formatBound, useChartBounds } from '../shared/useChartBounds'

const boundsModes = [
  { value: 'off', label: 'выключен' },
  { value: 'component', label: 'через ZoomChartComponent' },
  { value: 'direct', label: 'напрямую через setRenderBounds (ломает)' },
] as const

const directions = ['horizontal', 'vertical', 'all'] as const satisfies readonly BoundsSyncDirection[]

const titles = ['Ряд 1 — бои', 'Ряд 2 — урон', 'Ряд 3 — накопленным итогом']

const hoverSync = ref(true)
const boundsMode = ref<typeof boundsModes[number]['value']>('component')
const direction = ref<BoundsSyncDirection>('horizontal')
const source = ref<'synthetic' | 'real'>('synthetic')

const realEnabled = ref(false)
watchEffect(() => {
  if (source.value === 'real') realEnabled.value = true
})

const real = useRealDailySeries(realEnabled)
const realStatus = computed(() => real.status.value)

const hoverGate = markRaw(new GatedHoverSync(markRaw(new HoverSynchronizer())))
// Направление задаётся в конструкторе, поэтому его смена — это новый хаб для всех.
const boundsHub = shallowRef(markRaw(new BoundsSynchronizer(direction.value)))

const charts = [0, 1, 2].map(() => markRaw(new DemoChart({
  hoverSync: hoverGate,
  hover: { tooltip: true, markerSize: 4 },
})))

const chartBounds = charts.map(chart => useChartBounds(chart))

const series = computed<ChartSeries[]>(() => {
  if (source.value === 'real') {
    let total = 0
    const cumulative = real.battles.value.map(point => point ? { x: point.x, y: (total += point.y) } : null)
    return [real.battles.value, real.damage.value, cumulative]
  }

  // Разводим ряды по масштабу Y: иначе разницу в авто-подгонке оси не разглядеть.
  const base = syntheticMultiSeries(3, 17, 120)
  return base.map((points, index) => points.map(point => point ? { x: point.x, y: point.y * (index + 1) ** 3 } : null))
})

const extent = computed(() => seriesExtent([series.value[0] ?? []]))

watch(direction, value => boundsHub.value = markRaw(new BoundsSynchronizer(value)))

watch(hoverSync, value => {
  hoverGate.enabled = value
  for (const chart of charts) chart.scheduleRender()
}, { immediate: true })

watchEffect(() => {
  for (let i = 0; i < charts.length; i++) charts[i].setSeries([series.value[i] ?? []])
  resetAll()
})

watchEffect(() => {
  const width = extent.value.maxX - extent.value.minX

  for (const chart of charts) chart.setZoom({
    zoom: true,
    panDirection: direction.value,
    autoFitFollow: true,
    boundsSync: boundsMode.value === 'component' ? boundsHub.value : undefined,
    limits: {
      minX: extent.value.minX,
      maxX: extent.value.maxX,
      minDeltaX: Math.max(1, width / 30),
      maxDeltaX: width,
      elastic: true,
    },
  })
})

// Наивный синк в обход компонента — специально, чтобы увидеть снап авто-подгоняемой оси.
let applyingDirect = false
const stops = charts.map((chart, index) => chart.onSetRenderBounds.on(bounds => {
  if (boundsMode.value !== 'direct' || applyingDirect) return

  const { minX, maxX } = bounds
  if (minX == null || maxX == null) return

  applyingDirect = true
  try {
    for (let i = 0; i < charts.length; i++) {
      if (i !== index) charts[i].setRenderBounds({ minX, maxX })
    }
  } finally {
    applyingDirect = false
  }
}))

function readout(index: number) {
  const point = charts[index].tooltipCtx.value?.nearestDataPoints[0]
  if (!point) return null
  return { x: point.xValue.toFixed(0), y: point.yValue.toFixed(0) }
}

function boundsOf(index: number) {
  return chartBounds[index].value
}

function resetAll() {
  for (const chart of charts) chart.resetView()
}

onUnmounted(() => {
  for (const stop of stops) stop()
})

</script>


<style scoped lang="scss">
.charts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-bottom: 2px;

  .title {
    font-size: 13px;
    font-weight: bold;
  }

  .readout {
    color: var(--blue-thin-color);
  }

  .dim {
    color: #ffffff80;
  }
}
</style>
