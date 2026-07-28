<template>
  <DebugSection title="defs: градиенты и паттерны" id="gradients"
    description="Заливка живёт в defs отдельно от графика. Крути направление и стопы: картинка меняется, а счётчик проходов рендера стоит на месте — движок об этом даже не узнаёт."
    source="src/shared/uiKit/chart/universalChart/defs/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">заливка area</span>
        <select v-model="fill">
          <option v-for="item in fills" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <span class="debug-hint">проходов рендера графика: <span class="debug-value">{{ renders }}</span></span>
    </div>

    <template v-if="fill === 'gradient'">
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">direction</span>
          <select v-model="direction">
            <option v-for="item in directions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="debug-control" v-if="direction === 'угол'">
          <span class="debug-label">угол</span>
          <input type="range" min="0" max="360" step="5" v-model.number="angle">
          <span class="debug-value">{{ angle }}°</span>
        </label>

        <label class="debug-control">
          <span class="debug-label">стопов</span>
          <input type="number" min="2" max="5" v-model.number="stops">
        </label>

        <label class="debug-control">
          <span class="debug-label">цвета</span>
          <select v-model="colorMode">
            <option value="css">классы .stop-N в CSS</option>
            <option value="inline">color прямо в Step</option>
          </select>
        </label>

        <label class="debug-control" v-if="stops === 3">
          <span class="debug-label">offset среднего</span>
          <input type="range" min="0" max="1" step="0.05" v-model.number="middle">
          <span class="debug-value">{{ middle.toFixed(2) }}</span>
        </label>
      </div>
    </template>

    <div class="debug-row" v-if="fill === 'pattern'">
      <label class="debug-control">
        <span class="debug-label">содержимое</span>
        <select v-model="patternKind">
          <option v-for="item in patterns" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">размер плитки</span>
        <input type="range" min="2" max="20" step="1" v-model.number="tile">
        <span class="debug-value">{{ tile }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">patternTransform scale</span>
        <input type="range" min="0.5" max="4" step="0.1" v-model.number="scale">
        <span class="debug-value">{{ scale.toFixed(1) }}</span>
      </label>
    </div>

    <ChartStage :chart="instance.chart" :height="260" :class="colorMode === 'css' ? 'scheme-css' : ''" />

    <p class="debug-note">
      <b>Градиент и паттерн не требуют перерисовки графика.</b> setSteps, setDirection, setContent и
      patternTransform меняют элементы в defs напрямую — браузер перерисует сам. Счётчик выше растёт только когда
      график действительно проходит рендер (смена заливки пересоздаёт его целиком, потому что fill прибивается к
      элементу один раз).
    </p>

    <p class="debug-note">
      <b>Направление задаётся углом, а не парой точек.</b> Именованные значения — синонимы:
      <span class="debug-value">vertical</span> = <span class="debug-value">to top</span> (270°),
      <span class="debug-value">horizontal</span> = <span class="debug-value">to right</span> (0°). Координаты
      считаются в процентах бокса элемента, поэтому градиент растягивается по фигуре заливки и «плывёт» вместе с
      данными.
    </p>

    <p class="debug-note">
      <b>Цвет стопа: CSS или атрибут.</b> Стопы получают классы <span class="debug-value">.stop-1…N</span> при
      создании, а <span class="debug-value">color</span> в Step пишется атрибутом
      <span class="debug-value">stop-color</span>. Если задать и то и другое — победит CSS, атрибут проиграет.
      Переключи режим цвета и убедись. Ещё: уменьшение числа стопов удаляет лишние элементы, а вот ранее
      выставленный <span class="debug-value">stop-color</span> у оставшихся не сбрасывается.
    </p>

    <p class="debug-note">
      <b>Паттерну не хватает точки входа.</b> Из рендереров данных его умеет принимать только RectangleArea
      (<span class="debug-value">fillByPattern</span>); у AutoLine такого метода нет, поэтому здесь паттерн
      навешивается прямо на отрисованный path заливки. Если бы не CSS-правило с
      <span class="debug-value">fill</span> для сплошного варианта, разницы бы не было — но CSS перебивает атрибут
      паттерна, поэтому классы у режимов разные.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartRawPattern } from '@/shared/uiKit/chart/universalChart/defs/ChartRawPattern'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { afterRender } from '../shared/afterRender'

const fills = [
  { value: 'gradient', label: 'градиент' },
  { value: 'pattern', label: 'паттерн' },
  { value: 'solid', label: 'сплошная по классу' },
] as const

const directions = ['vertical', 'horizontal', 'to top', 'to right', 'to bottom', 'to left', 'угол'] as const

const patterns = [
  { value: 'diagonal', label: 'диагонали' },
  { value: 'dots', label: 'точки' },
  { value: 'grid', label: 'сетка' },
] as const

const patternContent: Record<typeof patterns[number]['value'], (tile: number) => string> = {
  diagonal: tile => `<path d="M-1,1 l2,-2 M0,${tile} l${tile},-${tile} M${tile - 1},${tile + 1} l2,-2" class="pattern-stroke" />`,
  dots: tile => `<circle cx="${tile / 2}" cy="${tile / 2}" r="${Math.max(1, tile / 6)}" class="pattern-dot" />`,
  grid: tile => `<path d="M0,0 H${tile} M0,0 V${tile}" class="pattern-stroke" />`,
}

const series = syntheticSeries('smooth', 5, 90)

const fill = ref<typeof fills[number]['value']>('gradient')
const direction = ref<typeof directions[number]>('vertical')
const angle = ref(45)
const stops = ref(2)
const middle = ref(0.5)
const colorMode = ref<'css' | 'inline'>('css')
const patternKind = ref<typeof patterns[number]['value']>('diagonal')
const tile = ref(6)
const scale = ref(1.5)

const renders = ref(0)

const inlineColors = ['#ff7a7a', '#ffb02e', '#6ee7a0', '#38b6ff', '#c58cff']

const steps = computed(() => {
  const count = Math.max(2, stops.value)
  const offsets = count === 3
    ? [0, middle.value, 1]
    : Array.from({ length: count }, (_, index) => index / (count - 1))

  if (colorMode.value === 'css') return offsets
  return offsets.map((offset, index) => ({ offset, color: inlineColors[index % inlineColors.length] }))
})

const { instance, rebuild } = useChartInstance(build)

function build() {
  const gradient = new ChartGradient({ classes: 'area-gradient' })
  const pattern = new ChartRawPattern()

  const line = new AutoLine({
    classes: ['main-line', 'series-a', ...(fill.value === 'solid' ? ['solid-area'] : [])],
    area: fill.value === 'gradient' ? gradient : true,
    smoothingMethod: 'monotone',
  })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 4,
  })
    .addPlot(line, 'plot')
    .addDefs(gradient, pattern)

  chart.onAfterRender.on(() => renders.value++)

  line.setPoints(series)

  return { chart, line, gradient, pattern }
}

watch(fill, () => rebuild())

watchEffect(() => {
  const { chart, gradient, pattern } = instance.value

  gradient.setDirection(direction.value === 'угол' ? angle.value : direction.value)
  gradient.setSteps(steps.value)

  pattern.setContent(patternContent[patternKind.value](tile.value), { width: tile.value, height: tile.value })
  pattern.addAttribute('patternTransform', `scale(${scale.value})`)

  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function sample() {
  const { line, pattern } = instance.value

  if (fill.value !== 'pattern') return

  // У AutoLine нет своего способа залить area паттерном — вешаем на готовый path.
  const area = line.getRootElement().querySelector('path.area')
  if (area) pattern.fill(area as SVGGElement)
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .pattern-stroke {
    stroke: #38b6ffcc;
    stroke-width: 1;
    fill: none;
  }

  .pattern-dot {
    fill: #38b6ffcc;
  }
}

// Схема цветов стопов для режима «классы в CSS»: в режиме inline правил нет,
// и видны атрибуты stop-color.
.scheme-css :deep(.universal-chart-root) {
  .area-gradient {
    .stop-1 {
      stop-color: #38b6ffcc;
    }

    .stop-2 {
      stop-color: #38b6ff33;
    }

    .stop-3 {
      stop-color: #c58cff33;
    }

    .stop-4 {
      stop-color: #ff7a7a33;
    }

    .stop-5 {
      stop-color: #ff7a7a00;
    }
  }
}
</style>
