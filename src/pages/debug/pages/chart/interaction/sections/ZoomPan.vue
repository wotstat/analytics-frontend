<template>
  <DebugSection title="Зум и пан под курсорными линиями" id="zoom-pan"
    description="Пан, тач-жесты, адаптивный зум колёсиком и управление тачпадом. Линии обязаны оставаться под курсором и не отставать на кадр. Тачпад определяется по двум ненулевым дельтам в одном wheel или нативному pinch Safari на macOS."
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

      <label class="debug-control">
        <span class="debug-label">лимиты по X</span>
        <input type="checkbox" v-model="limited">
      </label>

      <label class="debug-control">
        <span class="debug-label">elastic</span>
        <input type="checkbox" v-model="elastic" :disabled="!limited">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <p class="debug-note">
      Ввод: <span class="debug-value">{{ wheelModes[wheelSnapshot.mode] }}</span>.
      Устройство: <span class="debug-value">{{ wheelDevices[wheelSnapshot.device] }}</span>.
      Действие: <span class="debug-value">{{ wheelActions[wheelSnapshot.action] }}</span>.
      Поток: {{ wheelModes[wheelSnapshot.eventMode] }}.
      Причина: {{ wheelReasons[wheelSnapshot.reason] }}.
      ΔX: {{ wheelSnapshot.deltaX }}, ΔY: {{ wheelSnapshot.deltaY }},
      единицы: {{ wheelUnits[wheelSnapshot.deltaMode] ?? wheelSnapshot.deltaMode }},
      интервал: {{ wheelSnapshot.interval === null ? '—' : `${wheelSnapshot.interval.toFixed(1)} мс` }}.
      Одноосевых серий: {{ wheelSnapshot.singleAxisGestures }} / {{ WHEEL_RETURN_GESTURES }}.
      <button class="debug-btn" @click="wheelInput.reset()">Сбросить анализатор</button>
    </p>

    <DemoChartView :chart="chart" :height="280" />

    <p class="debug-note">
      Горизонтальное колесо панорамирует активную ось X во всех режимах, включая auto до определения
      тачпада. Вертикальное колесо по умолчанию масштабирует график. Плавность колеса определяет
      только сглаживание зума: шаги анимируются, плавный поток применяется напрямую.
      Две ненулевые дельты X и Y в одном wheel или нативный pinch в Safari на macOS включают режим
      тачпада для всей страницы. После трёх завершённых строго одноосевых серий следующая серия
      возвращает режим колёсика. Серии разделяются паузой более 80 мс; переключения внутри серии нет.
      Диагональ и pinch сбрасывают счётчик возврата, нативная инерция продолжает текущую серию.
      После определения тачпада pinch меняет масштаб, а прокрутка двумя пальцами
      панорамирует график с сохранением hover. Каждое направление двигает только свою активную ось.
      Начальное преобладающее направление определяет владельца жеста: график или страницу.
      Если жест захвачен графиком, поперечные дельты блокируются во время потока событий, включая инерцию.
      Если жест начался по выключенной оси, он целиком остаётся у страницы, даже при смене направления.
      Захват снимается после 80 мс тишины. Если браузер передаёт признак инерции, первое движение нового
      физического жеста после неё снимает захват сразу.
      Инерцию прокрутки даёт система.
      Пан и пинч на сенсорном экране сохраняют прежнее поведение. Ctrl + колесо всегда масштабирует,
      но не включает режим тачпада. Опция библиотеки wheelInput: auto / wheel / trackpad
      позволяет задать режим явно; этот стенд использует auto.
    </p>

    <table class="debug-table">
      <thead>
        <tr>
          <th>ось</th>
          <th>min</th>
          <th>max</th>
          <th>окно</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>X (renderBounds)</th>
          <td>{{ formatBound(bounds.minX) }}</td>
          <td>{{ formatBound(bounds.maxX) }}</td>
          <td>{{ formatBound(bounds.maxX - bounds.minX) }}</td>
        </tr>
        <tr>
          <th>Y (renderBounds)</th>
          <td>{{ formatBound(bounds.minY) }}</td>
          <td>{{ formatBound(bounds.maxY) }}</td>
          <td>{{ formatBound(bounds.maxY - bounds.minY) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Что здесь ловится: контроллер добавлен в чарт последним, поэтому на его
      <span class="debug-value">render()</span> зум уже применил границы этого кадра. Веди мышь с зажатой кнопкой —
      линия обязана стоять ровно под курсором всё время пана. Если она дрожит или отстаёт, порядок компонентов или
      порядок плотов нарушен.
    </p>

    <p class="debug-note">
      Второе: смена данных плота не помечает контроллер грязным, поэтому
      <span class="debug-value">InteractionController</span> переопределяет
      <span class="debug-value">render()</span> и не наследует ранний выход по space-hash. Колесо и пан меняют
      <span class="debug-value">ChartSpace</span>, так что здесь ранний выход всё равно бы не сработал — цена этого
      решения видна как раз на неподвижном графике: кадры идут, но prepare-фаза выходит на первом же пустом resolve.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import DemoChartView from '../shared/DemoChartView.vue'
import { CursorChart, type ZoomConfig } from '../shared/CursorChart'
import { panDirections } from '../shared/panDirections'
import { seriesExtent } from '../shared/series'
import { formatBound, useChartBounds } from '../shared/useChartBounds'
import { wheelInput, WHEEL_RETURN_GESTURES } from '@/shared/uiKit/chart/universalChart/interaction/wheelInput/wheelInput'

const wheelSnapshot = shallowRef(wheelInput.snapshot)
const wheelModes = { unknown: 'ещё не определён', smooth: 'плавный', discrete: 'шаговый' }
const wheelDevices = { wheel: 'колёсико', trackpad: 'тачпад' }
const wheelActions = { pending: 'ввода ещё не было', zoom: 'зум', pan: 'панорамирование', 'zoom-pan': 'зум и панорамирование' }
const wheelReasons = {
  pending: 'ожидание ввода / выборки', fine: 'мелкая пиксельная дельта', units: 'строки / страницы',
  cadence: 'частые меняющиеся дельты', isolated: 'отдельный шаг', gesture: 'продолжение потока',
  pinch: 'Ctrl / пинч', momentum: 'нативная инерция', 'native-pinch': 'нативный pinch тачпада',
  diagonal: 'дельты X и Y в одном wheel', 'wheel-return': 'возврат после трёх одноосевых серий'
}
const wheelUnits: Record<number, string> = { 0: 'пиксели', 1: 'строки', 2: 'страницы' }
onUnmounted(wheelInput.onChange.on(snapshot => wheelSnapshot.value = snapshot))

const autoFitVariants = [
  { value: true, label: 'true (по умолчанию)' },
  { value: 6, label: '6 (вязко)' },
  { value: false, label: 'false (снап)' },
] as const

const panDirection = ref<InteractionDirection>('horizontal')
const zoom = ref(true)
const autoFitFollow = ref<boolean | number>(true)
const limited = ref(true)
const elastic = ref(true)

const series = [syntheticSeries('smooth', 7, 240)]
const extent = seriesExtent(series)

const chart = markRaw(new CursorChart({ cursor: { horizontalLine: true } }))
chart.setSeries(series)

const bounds = useChartBounds(chart)

const limits = computed<ZoomConfig['limits']>(() => {
  if (!limited.value) return undefined

  return {
    minX: extent.minX,
    maxX: extent.maxX,
    minDeltaX: Math.min(10, extent.maxX - extent.minX),
    maxDeltaX: extent.maxX - extent.minX,
    elastic: elastic.value,
  }
})

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: panDirection.value,
  autoFitFollow: autoFitFollow.value,
  limits: limits.value,
}))

</script>
