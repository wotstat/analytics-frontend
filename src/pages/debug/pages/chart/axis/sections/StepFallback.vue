<template>
  <DebugSection title="Перебор шагов: как подписи схлопываются" id="step-fallback"
    description="Главный механизм AutoLabels. Движок идёт по values от мелкого шага к крупному и берёт первый, на котором подписи не пересеклись. Тяни ширину — и смотри, как выбранный шаг растёт 1 → 2 → 5 → 10, а под графиком меняется номер сработавшего кандидата."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/utils.ts → calculateClassic">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="160" max="1400" step="10" v-model.number="width" :disabled="stretch">
        <span class="debug-value">{{ stretch ? 'по сцене' : `${width}px` }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">во всю сцену</span>
        <input type="checkbox" v-model="stretch">
      </label>

      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="source">
          <option v-for="item in dataSources" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control" v-if="source === 'synthetic'">
        <span class="debug-label">формат</span>
        <select v-model="format">
          <option v-for="item in labelFormats" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">values</span>
        <select v-model="mode">
          <option value="list">список шагов</option>
          <option value="overrides">steppedOverrides (+10 удвоений)</option>
          <option value="single">один шаг (force)</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">шаги</span>
        <input type="text" v-model="rawSteps" size="20">
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="60" step="1" v-model.number="padding">
        <span class="debug-value">{{ padding }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">стратегия</span>
        <select v-model="strategy">
          <option value="classic">classic</option>
          <option value="classic-flow">classic-flow</option>
        </select>
      </label>
    </div>

    <p class="debug-hint" v-if="source === 'real'">{{ realStatus }}</p>

    <div class="steps">
      <span class="step-chip" v-for="(step, index) in candidates" :key="index"
        :class="{ active: index === chosenIndex, tail: index >= steps.length }">
        <b>{{ index }}</b> · {{ step }}
      </span>
    </div>

    <p class="debug-hint">
      выбранный кандидат: <span class="debug-value">{{ chosenLabel }}</span> · шаг
      <span class="debug-value">{{ chosenStep ?? '—' }}</span> · подписей
      <span class="debug-value">{{ state?.x.length ?? 0 }}</span>
    </p>

    <ChartStage :chart="chart" :width="stretch ? null : width" :height="190" />

    <ProbeReadout :state="state" />

    <p class="debug-note">
      <b>Откуда взят номер кандидата.</b> Из второго аргумента
      <span class="debug-value">labelForValue(value, stepIndex)</span> — движок зовёт форматтер на каждом
      примеряемом кандидате, и последний вызов за проход принадлежит победившему шагу. Отдельного геттера у
      <span class="debug-value">AutoLabels</span> нет, и он не нужен: индекс уже приходит в колбэк, который
      передаём мы сами. Отсюда следствие: если подписей получилось <b>ноль</b>, номер остаётся от предыдущего
      расчёта — это ограничение зонда, а не движка.
    </p>

    <p class="debug-note">
      Проверка на пересечение — в <span class="debug-value">calculateClassic</span>:
      <span class="debug-value">p − half &lt; lastMaxX + padding</span>. То есть <b>padding</b> — это минимальный
      зазор в пикселях между соседними подписями, а не отступ от края. Выкрути его в 60 на узкой сцене: шаг убежит
      в самый конец списка.
    </p>

    <p class="debug-note">
      Режим <b>один шаг (force)</b> показывает, что происходит с последним кандидатом в списке: он всегда
      «принудительный» (<span class="debug-value">force = i == values.length − 1</span>). Вместо отказа и перехода к
      следующему шагу лишние подписи просто выбрасываются по ходу обхода. Сетка становится неравномерной — особенно
      заметно на формате «Скачущая ширина», где широкая подпись съедает место у следующей. Это же правило работает
      и в обычном режиме, просто последним обычно стоит заведомо огромный шаг.
    </p>

    <p class="debug-note">
      Режим <b>steppedOverrides</b> дописывает к твоему списку 10 удвоений последнего шага, начиная с ×1 — то есть
      кандидат № {{ steps.length }} дублирует № {{ steps.length - 1 }} и всегда проваливается вслед за ним. В доках
      этого нет, а на индексы шага это влияет: серые чипсы справа — как раз дописанный хвост.
    </p>

    <p class="debug-note">
      Переключи данные на реальные: подписи-даты вдвое шире чисел, и тот же график схлопывается на два-три шага
      раньше. Ширина меряется <span class="debug-value">canvas.measureText</span> по шрифту
      <span class="debug-value">.probe-label</span>, а не через getBBox — если шрифт подъедет после первого кадра,
      замер останется старым до следующего <span class="debug-value">didMount</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { useRealDailySeries } from '@/pages/debug/shared/fixtures/realSeries'
import { dataSources, type DataSource } from '@/pages/debug/shared/fixtures/types'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedGenerator, steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { StepProbe, useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'
import { statusText } from '../shared/status'
import { formatLabel, labelFormats, type LabelFormat } from '../shared/formats'

const width = ref(760)
const stretch = ref(false)
const source = ref<DataSource>('synthetic')
const format = ref<LabelFormat>('plain')
const mode = ref<'list' | 'overrides' | 'single'>('overrides')
const rawSteps = ref('1, 2, 5, 10, 25')
const padding = ref(10)
const strategy = ref<'classic' | 'classic-flow'>('classic-flow')

const realEnabled = ref(false)
watchEffect(() => {
  if (source.value === 'real') realEnabled.value = true
})

const real = useRealDailySeries(realEnabled)
const synthetic = syntheticSeries('smooth', 7, 60)

const probe = new StepProbe()
const { state, onRender } = useProbe()

const steps = computed(() => {
  const parsed = rawSteps.value
    .split(',')
    .map(item => Number(item.trim()))
    .filter(item => Number.isFinite(item) && item !== 0)

  return parsed.length > 0 ? parsed : [1]
})

const candidates = computed(() => {
  if (mode.value === 'single') return [steps.value[0]]
  if (mode.value === 'list') return steps.value

  const last = steps.value[steps.value.length - 1]
  return [...steps.value, ...Array.from({ length: 10 }, (_, index) => last * Math.pow(2, index))]
})

const points = computed(() => source.value === 'real' ? real.battles.value : synthetic)
const realStatus = computed(() => statusText(real.status.value, real.battles.value.length))
const chosenIndex = computed(() => state.value?.step ?? -1)
const chosenLabel = computed(() => chosenIndex.value >= 0 ? `${chosenIndex.value}` : '—')
const chosenStep = computed(() => candidates.value[chosenIndex.value] ?? null)

const xLabels = computed<LabelsOptions>(() => {
  // Снимок реактивных значений: labelForValue зовётся уже из рендера чарта, и всё,
  // что он прочитает там, зависимостью computed не станет.
  const isReal = source.value === 'real'
  const dates = real.labels.value
  const currentFormat = format.value

  const labelForValue = probe.wrap(value => isReal
    ? (dates[value] ?? `${value}`)
    : formatLabel(currentFormat, value))

  const values = mode.value === 'overrides'
    ? steppedOverrides({ step: steps.value, labelForValue })
    : (mode.value === 'single' ? [steps.value[0]] : steps.value)
      .map(step => ({ gen: steppedGenerator({ step }), labelForValue }))

  return {
    values,
    padding: padding.value,
    labelOffset: 5,
    strategy: strategy.value,
  }
})

const chart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels', y: 'labels' },
  stepProbe: probe,
  onRender,
}))

watchEffect(() => {
  chart.setPoints(points.value)
  chart.setXLabels(xLabels.value)
})
</script>


<style scoped lang="scss">
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35em;
}

.step-chip {
  border: 1px solid var(--debug-border);
  border-radius: 4px;
  padding: 0.15em 0.5em;
  font-family: var(--debug-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--debug-dim);

  &.tail {
    border-style: dashed;
  }

  &.active {
    border-color: var(--blue-color);
    color: var(--blue-thin-color);
  }
}
</style>
