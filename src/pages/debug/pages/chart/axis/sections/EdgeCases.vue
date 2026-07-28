<template>
  <DebugSection title="Крайние случаи и заведомые поломки" id="edge-cases"
    description="Вырожденные данные, невозможные размеры и конфликтующие опции. Тумблеры здесь нужны, чтобы сломать отрисовку нарочно и посмотреть, чем именно движок отвечает: пустотой, мусором или молчаливым обрезанием."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/utils.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="kind">
          <option v-for="item in seriesKinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">масштаб Y</span>
        <select v-model.number="scale">
          <option :value="1">×1</option>
          <option :value="1000000">×10⁶</option>
          <option :value="1000000000">×10⁹</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="40" max="1600" step="10" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">высота</span>
        <input type="range" min="60" max="420" step="10" v-model.number="height">
        <span class="debug-value">{{ height }}px</span>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">поломка</span>
        <select v-model="breaker">
          <option v-for="item in breakers" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <span class="debug-hint">{{ breakerHint }}</span>
    </div>

    <p class="debug-hint">Сцену можно тянуть за правый нижний угол — ResizeObserver чарта подхватит любой размер.</p>

    <ChartStage :chart="chart" :width="width" :height="height" resizable />

    <ProbeReadout :state="state" axis="both" ticks />

    <p class="debug-note">
      <b>Пустой ряд.</b> <span class="debug-value">bounds.isEmpty()</span> — и
      <span class="debug-value">calculateLabelPositions</span> выходит первой же строкой. Ни подписей, ни тиков, но ось
      и слоты на месте: ширина левого слота схлопывается до одного <span class="debug-value">labelOffset</span>.
      Отдельного «пустого» состояния у движка нет — рисовать заглушку должна обёртка.
    </p>

    <p class="debug-note">
      <b>Одна точка и константа.</b> Вырожденные bounds чарт раздвигает сам, на ±1
      (<span class="debug-value">calculateActualDataBounds</span>), поэтому вместо деления на ноль получаются честные
      подписи вокруг значения. Это происходит до подписей и никак не настраивается.
    </p>

    <p class="debug-note">
      <b>Масштаб ×10⁹.</b> Список шагов кончился: даже с хвостом удвоений
      (<span class="debug-value">steppedOverrides</span> добирает всего ×512 к последнему шагу) до миллиардов не
      дотянуться. Последний кандидат принудительный, поэтому подписи не схлопываются, а прореживаются — и на оси
      появляются некруглые числа вроде 46 080 000 000. Лечится только добавлением крупных шагов в
      <span class="debug-value">values</span>.
    </p>

    <p class="debug-note">
      <b>Очень узкий контейнер.</b> Утяни ширину в 40px: подписи по X исчезнут полностью, но левый слот всё равно
      займёт своё, и область данных может стать нулевой или отрицательной по ширине — движок это не проверяет.
      На узкой мобилке график получает ровно ту же ширину, что сцена здесь: отдельного тач-поведения у осей нет,
      но именно этот режим и ловит все схлопывания.
    </p>

    <p class="debug-note">
      <b>from &gt; to.</b> Ни одной подписи и ни одной ошибки: генератор сразу выходит за
      <span class="debug-value">to</span>, кандидат возвращает пустой список — а пустой список считается успехом,
      перебор останавливается на первом же шаге. Отличить «не поместилось» от «нечего рисовать» снаружи нельзя.
    </p>

    <p class="debug-note">
      <b>step = 0</b> прокручивает по тысяче витков цикла в каждую сторону (проверено: 2000 значений
      <span class="debug-value">NaN</span> в результате) — все сравнения с NaN ложны, поэтому ни одно условие выхода не
      срабатывает. Ключ у всех витков одинаковый, поэтому DOM не разбухает: остаётся одна подпись-мусор «NaN» с
      невалидной координатой, а тики отсекаются как невидимые. <b>Отрицательный шаг</b> убивает почти все подписи: значения идут вниз, а проверка
      пересечения написана в расчёте на возрастание. Ни того, ни другого движок не валидирует.
    </p>

    <p class="debug-note">
      <b>Дробный шаг</b> вылезает мусором в тексте: генератор идёт накоплением
      (<span class="debug-value">current += step</span>), поэтому при step = 0.001 в подписях появляются
      «0.007000000000000001». Округлять обязан <span class="debug-value">labelForValue</span> — движок этого за тебя
      не делает.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { seriesKinds, syntheticSeries, type SeriesKind } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedGenerator, steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { Y_STEPS } from '../shared/options'

const breakers = [
  { value: 'none', label: 'нет', hint: 'обычные подписи с перебором шагов' },
  { value: 'from-gt-to', label: 'from > to', hint: 'from: 40, to: 10 — ни одной подписи и ни одной жалобы' },
  { value: 'zero-step', label: 'step = 0', hint: 'генератор выдаёт NaN тысячу раз подряд' },
  { value: 'negative-step', label: 'step = −5', hint: 'значения идут вниз, проверка пересечения ждёт роста' },
  { value: 'tiny-step', label: 'step = 0.001', hint: 'предел в 1000 значений кончается на первой сотой оси' },
  { value: 'huge-padding', label: 'padding = 200', hint: 'зазор больше графика: выживает одна подпись' },
] as const

type Breaker = typeof breakers[number]['value']

const kind = ref<SeriesKind>('single')
const scale = ref(1)
const width = ref(520)
const height = ref(200)
const breaker = ref<Breaker>('none')

const { state, onRender } = useProbe()

const breakerHint = computed(() => breakers.find(item => item.value === breaker.value)?.hint ?? '')

const points = computed(() => {
  const series = syntheticSeries(kind.value, 29, 60)
  if (scale.value === 1) return series
  return series.map(point => point && { x: point.x, y: point.y * scale.value })
})

const xLabels = computed<LabelsOptions>(() => {
  const base: LabelsOptions = {
    values: steppedOverrides({ step: [1, 2, 5, 10, 25] }),
    labelForValue: value => `${value}`,
    padding: 10,
    labelOffset: 5,
    strategy: 'classic-flow',
  }

  switch (breaker.value) {
    case 'from-gt-to': return { ...base, from: 40, to: 10 }
    case 'zero-step': return { ...base, values: [steppedGenerator({ step: 0 })] }
    case 'negative-step': return { ...base, values: [steppedGenerator({ step: -5 })] }
    case 'tiny-step': return { ...base, values: [steppedGenerator({ step: 0.001 })] }
    case 'huge-padding': return { ...base, padding: 200 }
    default: return base
  }
})

const yLabels = computed<LabelsOptions>(() => ({
  values: steppedOverrides({ step: Y_STEPS, offset: 0 }),
  labelForValue: value => `${value}`,
  padding: { clip: 10, flow: 5 },
  labelOffset: 5,
  onlyFitted: true,
  strategy: 'classic-flow',
}))

const chart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: { values: [] },
  y: { values: [] },
  ticks: { x: 'labels', y: 'labels' },
  onRender,
}))

watchEffect(() => {
  chart.setPoints(points.value)
  chart.setXLabels(xLabels.value)
  chart.setYLabels(yLabels.value)
})
</script>
