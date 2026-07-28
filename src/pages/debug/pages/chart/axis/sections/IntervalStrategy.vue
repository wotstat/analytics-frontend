<template>
  <DebugSection title="interval: подпись внутри отрезка" id="interval"
    description="Стратегия для осей-периодов: подпись принадлежит не точке, а отрезку между соседними значениями. Данные — 12 недель по дням, кандидаты повторяют боевой график Натиска: сначала три варианта одного и того же шага с всё более коротким текстом, потом шаг вдвое больше."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/utils.ts → calculateInterval">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="200" max="1200" step="10" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">placement</span>
        <select v-model="placement">
          <option value="start">start</option>
          <option value="middle">middle</option>
          <option value="end">end</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">fit</span>
        <input type="checkbox" v-model="fit">
      </label>

      <label class="debug-control">
        <span class="debug-label">direction</span>
        <select v-model="direction">
          <option value="forward">forward</option>
          <option value="backward">backward</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="range" min="0" max="40" step="1" v-model.number="offset">
        <span class="debug-value">{{ offset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="40" step="1" v-model.number="padding">
        <span class="debug-value">{{ padding }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">ограничить from/to</span>
        <input type="checkbox" v-model="limited">
      </label>

      <label class="debug-control" v-if="limited">
        <span class="debug-label">to</span>
        <input type="number" min="7" max="120" step="7" v-model.number="to">
      </label>

      <label class="debug-control">
        <span class="debug-label">дырка в подписи</span>
        <input type="checkbox" v-model="emptyLabel">
      </label>
    </div>

    <ChartStage :chart="chart" :width="width" :height="190" />

    <ProbeReadout :state="state" ticks />

    <p class="debug-note">
      <b>to у interval — правый край последнего отрезка</b>, а не индекс последней подписи. При
      <span class="debug-value">to = {{ to }}</span> последняя подпись описывает отрезок
      <span class="debug-value">[{{ to - 7 }}, {{ to }}]</span>. Уменьши to на 7 — исчезнет именно последняя подпись,
      а не сдвинутся все.
    </p>

    <p class="debug-note">
      <b>fit</b> подтягивает подпись к видимой части отрезка: без него подпись крайнего, наполовину уехавшего отрезка
      считается от его настоящих границ и уезжает за край вместе с ним; с ним — прижимается к границе области, но не
      ближе чем на <span class="debug-value">offset</span> от краёв самого отрезка. <b>offset</b> при
      <span class="debug-value">placement: 'middle'</span> без fit не участвует вообще — середина есть середина.
    </p>

    <p class="debug-note">
      Кандидаты в <span class="debug-value">values</span> могут отличаться <b>только текстом при одинаковом шаге</b>:
      «1 неделя» → «1 нед.» → «1 н.». Перебор идёт по списку сверху вниз, поэтому сначала пробуется полный текст, а
      уже потом более крупный шаг. В docs этот приём не описан, хотя в боевых графиках используется именно он.
    </p>

    <p class="debug-note">
      Галочка «дырка в подписи» возвращает пустую строку для третьей недели. Подпись не просто исчезает —
      <span class="debug-value">intervalFit</span> отбрасывает элементы с пустым ключом
      (<span class="debug-value">res.filter(t =&gt; t.key != '')</span>), потому что этим же признаком помечен
      служебный элемент-граница. Соседний отрезок при этом не расширяется: в списке подписей появляется провал.
      Для данных, где имя периода может не найтись, это ловушка — возвращай пробел или прочерк.
    </p>

    <p class="debug-note">
      В <span class="debug-value">calculateForward</span> висит авторский TODO: «есть баг у левого края, если широкое
      значение отстаёт больше чем на один элемент». Ловится сужением сцены при
      <span class="debug-value">direction: forward</span>: обход идёт справа налево, и крайняя левая подпись иногда
      остаётся в неподходящем по ширине отрезке.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const WEEK = 7
const DAYS = 84

const width = ref(700)
const placement = ref<'start' | 'middle' | 'end'>('start')
const fit = ref(true)
const direction = ref<'forward' | 'backward'>('forward')
const offset = ref(3)
const padding = ref(10)
const limited = ref(true)
const to = ref(DAYS)
const emptyLabel = ref(false)

const points = syntheticSeries('smooth', 13, DAYS)

const { state, onRender } = useProbe()

const xLabels = computed<LabelsOptions>(() => {
  const hole = emptyLabel.value

  const weekLabel = (value: number, suffix: string) => {
    const index = 1 + Math.round(value / WEEK)
    if (hole && index === 3) return ''
    return `${index}${suffix}`
  }

  return {
    values: steppedOverrides({
      step: [
        { step: WEEK, labelForValue: value => weekLabel(value, ' неделя') },
        { step: WEEK, labelForValue: value => weekLabel(value, ' нед.') },
        { step: WEEK, labelForValue: value => weekLabel(value, ' н.') },
        { step: 2 * WEEK, labelForValue: value => `${1 + Math.round(value / WEEK)}–${2 + Math.round(value / WEEK)} нед.` },
      ],
    }),
    padding: padding.value,
    labelOffset: 5,
    strategy: {
      type: 'interval',
      placement: placement.value,
      fit: fit.value,
      offset: offset.value,
      direction: direction.value,
    },
    from: limited.value ? 0 : undefined,
    to: limited.value ? to.value : undefined,
  }
})

const chart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels' },
  onRender,
}))

watchEffect(() => {
  chart.setPoints(points)
  chart.setXLabels(xLabels.value)
})
</script>
