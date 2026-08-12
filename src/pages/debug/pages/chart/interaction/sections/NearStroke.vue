<template>
  <DebugSection title="Линия цепляется к stroke" id="near-stroke"
    description="line.interaction.nearStroke({ maxDistance }) ищет ближайшую точку на фактически отрисованной centerline — сглаженной, decimated, обрезанной по render bounds — а не на исходной полилинии. Результат отдельный line-stroke hit, не ближайшая исходная точка."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">сценарий</span>
        <select v-model="preset">
          <option v-for="item in strokePresets" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">maxDistance, px</span>
        <input type="number" v-model.number="maxDistance" min="0" max="60" step="1">
      </label>

      <label class="debug-control">
        <span class="debug-label">толстый stroke (14px)</span>
        <input type="checkbox" v-model="thickStroke">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <DemoChartView :chart="chart" :height="300" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>серия</th>
          <th>distance, px</th>
          <th>contains</th>
          <th>meta.subpathIndex</th>
          <th>targets</th>
          <th>выбор</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(hit, index) in snapshot.hits" :key="index">
          <td>{{ seriesLabel(hit) }}</td>
          <td>{{ hit.distance.toFixed(2) }}</td>
          <td>{{ hit.contains ? 'да' : 'нет' }}</td>
          <td>{{ hit.meta.subpathIndex }}</td>
          <td>{{ hit.targets.length }}</td>
          <td>{{ choiceLabel(hit) }}</td>
        </tr>
        <tr v-if="snapshot.hits.length === 0">
          <td colspan="6" class="empty">selection пуст</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <span class="debug-value">datum</span> hit'а — это <span class="debug-value">{{ '{ points }' }}</span>, весь
      массив серии целиком, а не координата какой-то одной исходной точки: stroke — series-level сущность,
      не конкретная исходная точка. <span class="debug-value">identity.kind</span> равен
      <span class="debug-value">'series'</span>, и он же — единственная membership точек этой линии
      (<span class="debug-value">line-point</span> hit из соседней секции), поэтому подсветка серии по stroke
      дотягивается до точек через membership, а не через совпадение DOM-таргетов.
    </p>

    <p class="debug-note">
      <b>Разреженный сегмент</b> и <b>разрыв null</b> — не одно и то же. В «разреженном сегменте» между двумя
      исходными точками нет промежуточных данных, но рендерер всё равно тянет между ними centerline, и
      <span class="debug-value">nearStroke</span> находит его прямо посередине пустоты. В «разрыве null» между
      подпутями рендерер ничего не рисует — курсор в самом разрыве не даёт ни одного hit ни от одной, ни от другой
      стороны, а <span class="debug-value">meta.subpathIndex</span> меняется ровно на границе подпути.
    </p>

    <p class="debug-note">
      <b>Пересечение линий</b> — одновременно демонстрирует tie-order <span class="debug-value">nearest()</span>:
      у самого пересечения distance обеих линий почти равны, и колонка «выбор» показывает, что при таком сближении
      побеждает <b>линия B</b> — она правее по selection order
      (<span class="debug-value">lineA.interaction.union(lineB.interaction)</span>), а при точном равенстве
      побеждает последний хит.
    </p>

    <p class="debug-note">
      <b>Толстый stroke.</b> Включи чекбокс и выставь <span class="debug-value">maxDistance</span> меньше 7 (половина
      14px): наведи курсор в толщину линии дальше от centerline, чем maxDistance, но всё ещё внутри видимого stroke —
      hit остаётся, потому что eligibility — <span class="debug-value">contains || distance ≤ maxDistance</span>, а
      <span class="debug-value">contains</span> считается по фактической CSS-толщине
      (<span class="debug-value">getComputedStyle</span>), а не по числу из опций. В таблице такие маркеры
      тусклее — класс <span class="debug-value">reach-only</span> у промаха мимо contains, но попадания в
      maxDistance быть не может при contains: false и distance больше него, поэтому тусклый маркер здесь означает
      именно «внутри contains, но это не centerline» — сравни с обычным 2px stroke на других сценариях, где
      промахнуться мимо contains почти всегда означает быть в пределах maxDistance от центра тонкой линии.
    </p>

    <div class="debug-row">
      <button class="debug-btn" @click="measure">Замерить hover на «{{ densePresetLabel }}»</button>
      <span class="debug-hint" v-if="measuring">считаю…</span>
      <span class="debug-hint" v-else-if="measurement">
        первый resolve (кеш ещё не построен): <span class="debug-value">{{ measurement.cold.toFixed(2) }} мс</span> ·
        тёплый resolve, среднее по {{ measurement.steps }}: <span class="debug-value">{{
          measurement.warmAvg.toFixed(3) }} мс</span>
      </span>
    </div>

    <p class="debug-note">
      Замер переключает сценарий на 20 000 точек monotone, ждёт кадр рендера (строка <span class="debug-value">d</span>
      готова) и гоняет <span class="debug-value">nearStroke</span> через фиктивные <span class="debug-value">
        InteractionFrame</span> по многим X без реальных DOM-событий.
      <span class="debug-value">getTotalLength</span>/<span class="debug-value">getPointAtLength</span> форсируют
      layout и линеаризуют путь — это цена только первого resolve, пока строка d не менялась. Тёплые resolve уже не
      трогают DOM: сравнение point-to-segment по закешированным сэмплам, поэтому кадр во время ховера не должен
      проседать даже на длинном monotone-пути.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import { CompositionSnapshot, emptySnapshot } from '../shared/CompositionProbe'
import { HoverCostMeasurement, NearStrokeChart, StrokeChartHit, strokePresets, StrokePreset } from '../shared/NearStrokeChart'

const preset = ref<StrokePreset>('straight')
const maxDistance = ref(12)
const thickStroke = ref(false)

const snapshot = shallowRef<CompositionSnapshot<StrokeChartHit>>(emptySnapshot())
const measuring = ref(false)
const measurement = shallowRef<HoverCostMeasurement | null>(null)

const densePresetLabel = strokePresets.find(item => item.value === 'dense')!.label

const chart = markRaw(new NearStrokeChart({ zoom: true }))

const stopSnapshot = chart.onSnapshot.on(next => snapshot.value = next)

watchEffect(() => chart.setConfig({
  preset: preset.value,
  maxDistance: maxDistance.value,
  thickStroke: thickStroke.value,
}))

onUnmounted(stopSnapshot)

function seriesLabel(hit: StrokeChartHit) {
  return hit.source === chart.seriesASource ? 'A' : 'B'
}

function choiceLabel(hit: StrokeChartHit) {
  const labels: string[] = []
  if (snapshot.value.nearest === hit) labels.push('nearest()')
  if (snapshot.value.topmost === hit) labels.push('topmost()')
  return labels.join(' + ') || '—'
}

function measure() {
  measuring.value = true
  measurement.value = null
  preset.value = 'dense'

  // Прямой вызов, а не ожидание watchEffect: если сценарий уже был 'dense', реактивность не сработает
  // повторно и onAfterRender от повторного клика никогда бы не пришёл
  chart.setConfig({ preset: 'dense', maxDistance: maxDistance.value, thickStroke: thickStroke.value })

  chart.onAfterRender.once(() => {
    measurement.value = chart.measureHoverCost(400)
    measuring.value = false
  })
}
</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
