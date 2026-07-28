<template>
  <DebugSection title="Зум, пан, инерция и лимиты" id="zoom-pan"
    description="ZoomChartComponent: колесо, перетаскивание, пинч, инерция после броска и «резиновые» лимиты. Компонент завершён — здесь он показан как есть, крутить можно только его опции."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">panDirection</span>
        <select v-model="panDirection">
          <option v-for="item in panDirections" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">zoom</span>
        <input type="checkbox" v-model="zoom">
      </label>

      <label class="debug-control">
        <span class="debug-label">autoFitFollow</span>
        <select v-model="autoFitFollow">
          <option v-for="item in autoFitVariants" :key="String(item.value)" :value="item.value">{{ item.label }}
          </option>
        </select>
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">лимиты</span>
        <select v-model="limitsMode">
          <option v-for="item in limitsModes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">elastic</span>
        <input type="checkbox" v-model="elastic" :disabled="limitsMode === 'off'">
      </label>

      <label class="debug-control">
        <span class="debug-label">minDelta (минимальное окно)</span>
        <input type="number" v-model.number="minDelta" min="1" step="5" :disabled="limitsMode === 'off'">
      </label>

      <label class="debug-control">
        <span class="debug-label">maxDelta = весь набор</span>
        <input type="checkbox" v-model="clampMaxDelta" :disabled="limitsMode === 'off'">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">инерция мыши</span>
        <select v-model.number="mousePan">
          <option v-for="item in decelerations" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">инерция пальца</span>
        <select v-model.number="touchPan">
          <option v-for="item in decelerations" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">инерция пинча</span>
        <select v-model.number="touchZoom">
          <option v-for="item in decelerations" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="source">
          <option v-for="item in dataSources" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control" v-if="source === 'synthetic'">
        <span class="debug-label">набор</span>
        <select v-model="kind">
          <option v-for="item in kinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <span class="debug-hint" v-if="source === 'real' && realStatus !== success">
        Данные ещё грузятся из ClickHouse.
      </span>
    </div>

    <DemoChartView :chart="chart" :height="300" />

    <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot">
      <template #default="{ ctx }">
        <TooltipCard :ctx="ctx" compact />
      </template>
    </FloatingTooltip>

    <table class="debug-table">
      <thead>
        <tr>
          <th>ось</th>
          <th>min</th>
          <th>max</th>
          <th>окно</th>
          <th>в лимитах</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>X (renderBounds)</th>
          <td>{{ formatBound(bounds.minX) }}</td>
          <td>{{ formatBound(bounds.maxX) }}</td>
          <td>{{ formatBound(bounds.maxX - bounds.minX) }}</td>
          <td :class="withinX ? 'true' : 'false'">{{ withinX ? 'да' : 'нет' }}</td>
        </tr>
        <tr>
          <th>Y (renderBounds)</th>
          <td>{{ formatBound(bounds.minY) }}</td>
          <td>{{ formatBound(bounds.maxY) }}</td>
          <td>{{ formatBound(bounds.maxY - bounds.minY) }}</td>
          <td>{{ limitsMode === 'xy' ? (withinY ? 'да' : 'нет') : '—' }}</td>
        </tr>
        <tr>
          <th>лимит X</th>
          <td>{{ limits?.minX === undefined ? '—' : formatBound(limits.minX) }}</td>
          <td>{{ limits?.maxX === undefined ? '—' : formatBound(limits.maxX) }}</td>
          <td>{{ limits?.minDeltaX ?? '—' }} … {{ limits?.maxDeltaX ?? '—' }}</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-hint">
      Строка «в лимитах» гаснет ровно на время резинки: во время оверскролла и на отскоке окно снаружи, а пружина
      возвращает его обратно. С <span class="debug-value">elastic: false</span> она не должна краснеть никогда.
    </p>

    <p class="debug-note">
      Мышью: колесо зумит к курсору — события копятся в батч и применяются одним кадром, поэтому пружина возврата
      стартует только через паузу после последнего щелчка. Перетаскивание — пан; отпусти на скорости, чтобы поймать
      инерцию; выставь инерции <span class="debug-value">0</span> — движение обязано вставать колом на отпускании.
      Загони окно за лимит колесом и держи: с <span class="debug-value">elastic</span> сопротивление растёт и окно
      возвращается пружиной, без него — жёсткий упор без выезда.
    </p>

    <p class="debug-note">
      Пальцем — тут всё главное: пинч двумя пальцами зумит вокруг середины между ними; отпусти на скорости — зум
      продолжится по инерции. Сними один палец, не убирая второй — начнётся пан, и его собственная инерция первые
      8 px подавлена, чтобы дрожь при отрыве не убивала инерцию пинча. Тач-пан сохраняет зум-инерцию (в отличие от
      мышиного, который гасит всё). Резкие короткие рывки: скорость считается по «нормальным» интервалам, всплески
      событий отбрасываются, а пауза дольше порога обнуляет скорость — останови палец перед отпусканием, инерции быть
      не должно.
    </p>

    <p class="debug-note">
      Ломающий режим <span class="debug-value">мусорные лимиты</span>: minX &gt; maxX и minDelta &gt; maxDelta.
      <span class="debug-value">normalizeLimits</span> отбрасывает такие пары с
      <span class="debug-value">console.warn</span> — открой консоль, а на графике проверь, что зум и пан стали
      безлимитными, а не поломанными.
    </p>

    <p class="debug-note">
      <span class="debug-value">autoFitFollow</span> отвечает за противоположную ось: при
      <span class="debug-value">panDirection: horizontal</span> Y авто-подгоняется под видимые данные. Со значением
      <span class="debug-value">false</span> она снапится покадрово и «дёргается» на пане — это и есть та разница,
      ради которой в компоненте живёт CriticalFollower. При <span class="debug-value">all</span> авто-подгонки нет
      вовсе — двигаются обе оси.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { success } from '@/db'
import { dataSources } from '@/pages/debug/shared/fixtures/types'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { useRealDailySeries } from '@/pages/debug/shared/fixtures/realSeries'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import DemoChartView from '../shared/DemoChartView.vue'
import TooltipCard from '../shared/TooltipCard.vue'
import { DemoChart, type ZoomConfig } from '../shared/DemoChart'
import { seriesExtent } from '../shared/series'
import { formatBound, useChartBounds } from '../shared/useChartBounds'

const panDirections = [
  { value: 'horizontal', label: 'horizontal' },
  { value: 'vertical', label: 'vertical' },
  { value: 'all', label: 'all' },
  { value: false, label: 'false' },
] as const satisfies readonly { value: InteractionDirection, label: string }[]

const autoFitVariants = [
  { value: true, label: 'true (по умолчанию)' },
  { value: 6, label: '6 (вязко)' },
  { value: 80, label: '80 (резко)' },
  { value: false, label: 'false (снап)' },
] as const

const limitsModes = [
  { value: 'x', label: 'по X' },
  { value: 'xy', label: 'по X и Y' },
  { value: 'off', label: 'без лимитов' },
  { value: 'broken', label: 'мусорные лимиты (ломает)' },
] as const

const decelerations = [
  { value: 0.99, label: '0.99 (по умолчанию)' },
  { value: 0.95, label: '0.95 (короткая)' },
  { value: 0.999, label: '0.999 (длинная)' },
  { value: 0, label: '0 (выключена)' },
] as const

const kinds = [
  { value: 'smooth', label: 'Гладкая' },
  { value: 'noisy', label: 'Шумная' },
  { value: 'huge', label: '100k точек' },
] as const

const panDirection = ref<InteractionDirection>('horizontal')
const zoom = ref(true)
const autoFitFollow = ref<boolean | number>(true)
const limitsMode = ref<typeof limitsModes[number]['value']>('x')
const elastic = ref(true)
const minDelta = ref(10)
const clampMaxDelta = ref(true)
const mousePan = ref(0.99)
const touchPan = ref(0.99)
const touchZoom = ref(0.95)
const source = ref<'synthetic' | 'real'>('synthetic')
const kind = ref<typeof kinds[number]['value']>('smooth')

// Запрос стартует на первом переключении на реальные данные и дальше живёт из кеша.
const realEnabled = ref(false)
watchEffect(() => {
  if (source.value === 'real') realEnabled.value = true
})

const real = useRealDailySeries(realEnabled)
const realStatus = computed(() => real.status.value)

const series = computed(() => {
  if (source.value === 'real') return [real.battles.value]
  return [syntheticSeries(kind.value, 7, 240)]
})

const extent = computed(() => seriesExtent(series.value))

const limits = computed<ZoomConfig['limits']>(() => {
  if (limitsMode.value === 'off') return undefined

  // Нарочно противоречивая пара: normalizeLimits обязана отбросить обе границы с warn.
  if (limitsMode.value === 'broken') {
    return { minX: 100, maxX: 50, minDeltaX: 500, maxDeltaX: 10, elastic: elastic.value }
  }

  const value = extent.value
  const width = value.maxX - value.minX
  const height = value.maxY - value.minY

  const base = {
    minX: value.minX,
    maxX: value.maxX,
    minDeltaX: Math.min(minDelta.value, width),
    maxDeltaX: clampMaxDelta.value ? width : undefined,
    elastic: elastic.value,
  }

  if (limitsMode.value === 'xy') return {
    ...base,
    minY: value.minY - height * 0.1,
    maxY: value.maxY + height * 0.1,
    minDeltaY: height / 20,
    maxDeltaY: height * 1.2,
  }

  return base
})

const chart = markRaw(new DemoChart({ hover: { pointPosition: 'data-point-x' } }))
const bounds = useChartBounds(chart)

const withinX = computed(() => {
  const value = limits.value
  if (!value || value.minX === undefined || value.maxX === undefined) return true
  return bounds.value.minX >= value.minX - 1e-6 && bounds.value.maxX <= value.maxX + 1e-6
})

const withinY = computed(() => {
  const value = limits.value
  if (!value || value.minY === undefined || value.maxY === undefined) return true
  return bounds.value.minY >= value.minY - 1e-6 && bounds.value.maxY <= value.maxY + 1e-6
})

watchEffect(() => {
  chart.setSeries(series.value)
  chart.resetView()
})

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: panDirection.value,
  autoFitFollow: autoFitFollow.value,
  deceleration: { mousePan: mousePan.value, touchPan: touchPan.value, touchZoom: touchZoom.value },
  limits: limits.value,
}))

</script>
