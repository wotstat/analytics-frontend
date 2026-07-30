<template>
  <DebugSection title="Форматирование подписей" id="formatting"
    description="Текст подписи — это labelForValue, и он же определяет ширину. Ни поворота, ни обрезки, ни переноса движок не умеет: длинная подпись либо занимает место, либо схлопывает шаг, либо режется клипом."
    source="src/shared/uiKit/chart/universalChart/labels/BaseLabels.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">формат X</span>
        <select v-model="formatX">
          <option v-for="item in labelFormats" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">формат Y</span>
        <select v-model="formatY">
          <option v-for="item in labelFormats" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="source">
          <option v-for="item in dataSources" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">масштаб Y</span>
        <select v-model.number="scale">
          <option :value="1">×1</option>
          <option :value="1000">×1 000</option>
          <option :value="1000000">×1 000 000</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">labelOffset</span>
        <input type="range" min="0" max="40" step="1" v-model.number="labelOffset">
        <span class="debug-value">{{ labelOffset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">slotSize</span>
        <select v-model="slotSize">
          <option value="auto">auto</option>
          <option value="stable">stable</option>
          <option value="60">60px</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">клип подписей</span>
        <input type="checkbox" v-model="clipLabels">
      </label>

      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="240" max="1000" step="10" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <button class="debug-btn" @click="width += 1">толкнуть layout (+1px)</button>
    </div>

    <p class="debug-hint" v-if="source === 'real'">{{ realStatus }}</p>

    <ChartStage :chart="chart" :width="width" :height="220" />

    <ProbeReadout :state="state" axis="both" />

    <p class="debug-note">
      <b>Смена опций сбрасывает layout.</b> Поставь формат Y «Длинный текст»: вызов
      <span class="debug-value">AutoLabels.updateOptions()</span> сообщает чарту, что размер слота мог измениться,
      поэтому место под новый текст пересчитывается сразу. Кнопка «толкнуть layout» оставлена только для ручной
      проверки внешнего изменения размера сцены.
    </p>

    <p class="debug-note">
      <b>slotSize</b> — поперечный размер слота: ширина для Y и высота для X.
      <span class="debug-value">stable</span> запоминает максимум за всё время и <b>никогда не уменьшает</b>
      его обратно: сходи в «×1 000 000» и вернись в «×1» — слот останется широким до пересоздания графика.
      Числом задаётся фиксированный размер, и тогда getSize вообще не считает подписи.
    </p>

    <p class="debug-note">
      <b>Поворота и обрезки нет.</b> Подписи рисуются как <span class="debug-value">&lt;text&gt;</span> без transform;
      «Длинный текст» на горизонтальной оси просто уводит перебор шагов до одной-двух подписей на весь график.
      Единственный ограничитель — <span class="debug-value">clipBy(new ChartClip(side))</span>, и он режет текст ровно
      по границе выбранного слота, без многоточия. Включи «клип подписей» и сравни, что торчит за пределы области.
    </p>

    <p class="debug-note">
      Ширина текста меряется <span class="debug-value">canvas.measureText</span> со шрифтом, снятым через
      <span class="debug-value">computedStyleMap()</span> со скрытой probe-подписи, и кэшируется. Пересчёт шрифта
      происходит только на <span class="debug-value">didMount</span> и при смене
      <span class="debug-value">labelOffset / slotSize</span> — если шрифт догрузится позже, замеры останутся от
      старого, и подписи начнут пересекаться, хотя движок уверен, что зазор есть.
    </p>

    <p class="debug-note">
      У вертикальной оси размер подписи — это <span class="debug-value">getTextHeight()</span>, а он игнорирует
      переданный текст и всегда отдаёт высоту строки. Поэтому <b>формат Y на выбор шага не влияет вообще</b>: меняй
      формат сколько угодно — количество подписей по вертикали не изменится, в отличие от горизонтальной оси.
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
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { Y_STEPS } from '../shared/options'
import { statusText } from '../shared/status'
import { formatLabel, labelFormats, type LabelFormat } from '../shared/formats'

const formatX = ref<LabelFormat>('plain')
const formatY = ref<LabelFormat>('plain')
const source = ref<DataSource>('synthetic')
const scale = ref(1)
const labelOffset = ref(5)
const slotSize = ref<'auto' | 'stable' | '60'>('auto')
const clipLabels = ref(false)
const width = ref(620)

const realEnabled = ref(false)
watchEffect(() => {
  if (source.value === 'real') realEnabled.value = true
})

const real = useRealDailySeries(realEnabled)
const synthetic = syntheticSeries('smooth', 23, 60)

const { state, onRender } = useProbe()

const realStatus = computed(() => statusText(real.status.value, real.battles.value.length))

const points = computed(() => {
  const series = source.value === 'real' ? real.battles.value : synthetic
  if (scale.value === 1) return series
  return series.map(point => point && { x: point.x, y: point.y * scale.value })
})

const slotSizeValue = computed(() => {
  if (slotSize.value === 'auto' || slotSize.value === 'stable') return slotSize.value
  return Number(slotSize.value)
})

const xLabels = computed<LabelsOptions>(() => {
  const isReal = source.value === 'real'
  const dates = real.labels.value
  const kind = formatX.value

  return {
    values: steppedOverrides({ step: [1, 2, 5, 10, 25] }),
    labelForValue: value => isReal ? (dates[value] ?? `${value}`) : formatLabel(kind, value),
    padding: 10,
    labelOffset: labelOffset.value,
    strategy: 'classic-flow',
  }
})

const yLabels = computed<LabelsOptions>(() => {
  const kind = formatY.value

  return {
    values: steppedOverrides({ step: Y_STEPS.map(step => step * scale.value), offset: 0 }),
    labelForValue: value => formatLabel(kind, value),
    padding: { clip: 10, flow: 5 },
    labelOffset: labelOffset.value,
    slotSize: slotSizeValue.value,
    onlyFitted: true,
    strategy: 'classic-flow',
  }
})

const chart = computed(() => markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: { values: [] },
  y: { values: [] },
  ticks: { x: 'labels', y: 'labels' },
  clipLabels: clipLabels.value,
  onRender,
})))

watchEffect(() => {
  chart.value.setPoints(points.value)
  chart.value.setXLabels(xLabels.value)
  chart.value.setYLabels(yLabels.value)
})
</script>
