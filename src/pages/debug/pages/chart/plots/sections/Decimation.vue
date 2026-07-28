<template>
  <DebugSection title="Децимация и wasm: сто тысяч точек" id="decimation"
    description="Слева весь ряд целиком, справа каждая N-я точка того же ряда при тех же bounds. Формы обязаны совпасть: децимация выкидывает точки, неразличимые в пикселях, а не сглаживает данные. Смотри на экстремумы — срезанный пик здесь был бы багом."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/MonotoneXPath.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">точек</span>
        <select v-model.number="count">
          <option v-for="item in counts" :key="item" :value="item">{{ item.toLocaleString('ru-RU') }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">smoothingMethod</span>
        <select v-model="method">
          <option v-for="item in methods" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">сид</span>
        <input type="number" min="1" max="99" v-model.number="seed">
      </label>

      <button class="debug-btn" @click="redraw">перерисовать и замерить кадр</button>
      <button class="debug-btn" @click="measurePath">замерить getPath</button>

      <span class="debug-hint">wasm: <span class="debug-value">{{ wasmState }}</span></span>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 360px">
      <ChartStage :chart="instance.chart" :height="220" />
      <ChartStage :chart="instance.referenceChart" :height="220" />
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>линия</th>
          <th>точек на входе</th>
          <th>узлов в пути</th>
          <th>сжатие</th>
          <th>длина d</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>весь ряд</th>
          <td>{{ full.length }}</td>
          <td>{{ nodes(fullPath) }}</td>
          <td>{{ compression(full.length, nodes(fullPath)) }}</td>
          <td>{{ fullPath.length }}</td>
        </tr>
        <tr>
          <th>каждая {{ step }}-я</th>
          <td>{{ reference.length }}</td>
          <td>{{ nodes(referencePath) }}</td>
          <td>{{ compression(reference.length, nodes(referencePath)) }}</td>
          <td>{{ referencePath.length }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row">
      <span class="debug-hint">от setPoints до готового кадра: <span class="debug-value">{{ frame }}</span></span>
      <span class="debug-hint">getPath, первый вызов: <span class="debug-value">{{ firstCall }}</span></span>
      <span class="debug-hint">getPath, повторный: <span class="debug-value">{{ warmCall }}</span></span>
    </div>

    <p class="debug-note">
      «Узлов в пути» — это <span class="debug-value">C</span>-команд плюс одна: на monotone видно, во сколько раз
      децимация сократила ряд. На <span class="debug-value">smooth</span> и на ломаной сокращения нет вообще: узлов
      столько же, сколько точек, длина d уезжает в мегабайты, и сотня тысяч точек кладёт вкладку на секунды.
      Это не поломка страницы, а цена отсутствия децимации вне monotone.
    </p>

    <p class="debug-note">
      Замер <b>getPath</b> считает только построение пути: тот же ряд, те же bounds и layout, что у графика слева,
      без ожидания кадра. Первый вызов дороже — в нём копирование массива в память wasm
      (<span class="debug-value">allocF64</span> + set), дальше буфер переиспользуется. Кадр меряется от
      <span class="debug-value">setPoints</span> до конца отрисовки и включает ожидание ближайшего кадра, так что
      меньше ~16 мс он не покажет никогда.
    </p>

    <p class="debug-note">
      <b>Переключателя реализации нет.</b> Zig→wasm и TS-фоллбек живут в одном файле, выбор молчаливый: модуль
      грузится один раз при импорте, и если инициализация упала — путь строит TS. Состояние загрузки движок отдаёт:
      «wasm» в шапке — это <span class="debug-value">monotoneXPathWasmReady()</span>, синхронный вариант —
      <span class="debug-value">getMonotoneXPathWasmStatus()</span>. Счётчика вызовов по реализациям нет: статус
      говорит, что доступно, а не сколько раз чем воспользовались. Обе реализации обязаны давать одинаковый путь;
      расхождение ищется сравнением d, а не глазами.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { ChartPoint } from '@/pages/debug/shared/fixtures/types'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { MonotoneXPath, monotoneXPathWasmReady } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/MonotoneXPath'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { afterRender, pathInfo, type PathInfo } from '../shared/afterRender'

const counts = [1000, 10000, 50000, 100000] as const

const methods = [
  { value: 'monotone', label: 'monotone' },
  { value: 'smooth', label: 'smooth' },
  { value: 'none', label: 'нет (ломаная)' },
] as const

const count = ref<number>(10000)
const method = ref<typeof methods[number]['value']>('monotone')
const seed = ref(1)

const wasmState = ref('проверяется…')
const frame = ref('—')
const firstCall = ref('—')
const warmCall = ref('—')

const emptyPath: PathInfo = { length: 0, curves: 0, lines: 0, moves: 0 }
const fullPath = ref<PathInfo>(emptyPath)
const referencePath = ref<PathInfo>(emptyPath)

const full = computed<ChartPoint[]>(() => {
  const source = syntheticSeries('huge', seed.value)
  const points: ChartPoint[] = []
  for (let i = 0; i < count.value && i < source.length; i++) {
    const point = source[i]
    if (point) points.push(point)
  }
  return points
})

const step = computed(() => Math.max(1, Math.ceil(full.value.length / 1000)))
const reference = computed(() => full.value.filter((_, index) => index % step.value === 0))

const bounds = computed(() => {
  let minY = Infinity
  let maxY = -Infinity
  for (const point of full.value) {
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  }
  return { minX: 0, maxX: Math.max(1, full.value.length - 1), minY, maxY }
})

const { instance } = useChartInstance(build)

function build() {
  const fullLine = new AutoLine({ classes: ['main-line', 'series-a'], smoothingMethod: 'monotone' })
  const referenceLine = new AutoLine({ classes: ['main-line', 'series-c'], smoothingMethod: 'monotone' })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: 4,
  }).addPlot(fullLine, 'plot')

  const referenceChart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: 4,
  }).addPlot(referenceLine, 'plot')

  return { chart, fullLine, referenceChart, referenceLine }
}

watchEffect(() => redraw())

onMounted(() => {
  monotoneXPathWasmReady().then(status => wasmState.value = status === 'ready'
    ? 'загружен, путь строит wasm'
    : 'не загрузился, работает TS-фоллбек')
})

function redraw() {
  const { chart, fullLine, referenceChart, referenceLine } = instance.value
  const smoothingMethod = method.value === 'none' ? undefined : method.value

  Object.assign(fullLine.options, { smoothingMethod })
  Object.assign(referenceLine.options, { smoothingMethod })

  chart.setRenderBounds(bounds.value)
  referenceChart.setRenderBounds(bounds.value)

  const start = performance.now()
  fullLine.setPoints(full.value)
  referenceLine.setPoints(reference.value)

  afterRender(chart, () => {
    frame.value = `${(performance.now() - start).toFixed(1)} мс`
    fullPath.value = pathInfo(fullLine.getRootElement())
    referencePath.value = pathInfo(referenceLine.getRootElement())
  })
}

function measurePath() {
  const space = instance.value.chart.space
  const layout = {
    minX: space.layout.x,
    maxX: space.layout.x + space.layout.width,
    minY: space.layout.y,
    maxY: space.layout.y + space.layout.height,
  }

  const path = new MonotoneXPath(full.value)

  const start = performance.now()
  path.getPath(1, space.bounds, layout, layout)
  const afterFirst = performance.now()

  const runs = 5
  for (let i = 0; i < runs; i++) path.getPath(1, space.bounds, layout, layout)
  const afterWarm = performance.now()

  path.dispose()

  firstCall.value = `${(afterFirst - start).toFixed(2)} мс`
  warmCall.value = `${((afterWarm - afterFirst) / runs).toFixed(2)} мс`
}

function nodes(info: PathInfo) {
  if (info.curves > 0) return info.curves + 1
  return info.lines + info.moves
}

function compression(input: number, output: number) {
  if (output === 0) return '—'
  return `×${(input / output).toFixed(1)}`
}

</script>
