<template>
  <DebugSection title="Композиция selections" id="selection-composition"
    description="Операции композиции selections на живой композиции: union с дубликатом, within по общей метрике, orElse с курсорным fallback и heterogeneous union с курсором. Таблица показывает результат целиком плюс то, что выбирают nearest() и topmost()."
    source="src/shared/uiKit/chart/universalChart/interaction/core/Selection.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">union дубликата линии B</span>
        <input type="checkbox" v-model="duplicateUnion">
      </label>

      <label class="debug-control">
        <span class="debug-label">within</span>
        <input type="checkbox" v-model="limitedDistance">
      </label>

      <label class="debug-control">
        <span class="debug-label">maxDistance, px</span>
        <input type="number" v-model.number="maxDistance" min="0" max="300" step="5" :disabled="!limitedDistance">
      </label>

      <label class="debug-control">
        <span class="debug-label">maxAxisDistance</span>
        <input type="checkbox" v-model="limitedAxis">
      </label>

      <label class="debug-control">
        <span class="debug-label">px</span>
        <input type="number" v-model.number="maxAxisDistance" min="0" max="200" step="5" :disabled="!limitedAxis">
      </label>

      <label class="debug-control">
        <span class="debug-label">union с курсором</span>
        <input type="checkbox" v-model="cursorUnion">
      </label>

      <label class="debug-control">
        <span class="debug-label">orElse курсор</span>
        <input type="checkbox" v-model="cursorFallback">
      </label>
    </div>

    <p class="debug-path">{{ pipeline }}</p>

    <DemoChartView :chart="chart" :height="280" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>позиция</th>
          <th>kind</th>
          <th>точка</th>
          <th>pointIndex</th>
          <th>distance, px</th>
          <th>ветка union</th>
          <th>выбор</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(hit, index) in snapshot.hits" :key="index">
          <td>{{ index }}</td>
          <td>{{ hit.kind }}</td>
          <td>{{ hit.kind === 'cursor' ? '—' : hit.datum.label }}</td>
          <td>{{ hit.kind === 'cursor' ? '—' : hit.pointIndex }}</td>
          <td>{{ hit.distance === Infinity ? '∞' : hit.distance.toFixed(1) }}</td>
          <td>{{ snapshot.fromRight[index] ? 'правая' : 'левая' }}</td>
          <td>{{ choiceLabel(hit) }}</td>
        </tr>
        <tr v-if="snapshot.hits.length === 0">
          <td colspan="7" class="empty">selection пуст</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>Дубликат.</b> Включи <span class="debug-value">union дубликата линии B</span>: справа приезжает тот же bucket
      линии B, то есть те же semantic identity. Строка B остаётся <b>второй</b> — позиция берётся из места первого
      вхождения, из левой стороны. А колонка «ветка union» у неё становится
      <span class="debug-value">правая</span>: сравнение идёт по ссылке на объект hit, и выживает тот, что вернула
      правая сторона. Если бы выживший переезжал в конец, добавление ещё одного
      <span class="debug-value">union()</span> молча меняло бы порядок строк в тултипе.
    </p>

    <p class="debug-note">
      <b>within.</b> Фильтр по общей двумерной метрике: <span class="debug-value">contains || distance ≤
        maxDistance</span>. Граница включительна. Уводи курсор по вертикали от линии — точки уходят по одной, начиная с
      самой дальней, а <span class="debug-value">maxAxisDistance</span> так не умеет: он отсекает bucket
      <b>целиком</b>, потому что работает по axis-метрике внутри запроса, где она ещё существует. Снаружи её уже не
      восстановить — <span class="debug-value">hit.distance</span> двумерный. Проверить легко: включи только
      <span class="debug-value">maxAxisDistance</span> и уводи курсор вбок между точками — таблица опустеет разом, а
      не по строке. <span class="debug-value">contains</span> у точек линии всегда false: собственного видимого тела у
      неё нет, поэтому вторая половина правила проявится на scatter и bar.
    </p>

    <p class="debug-note">
      <b>orElse.</b> Не union: правая сторона резолвится только при пустой левой, и обе одновременно не показываются.
      Включи <span class="debug-value">orElse курсор</span> вместе с
      <span class="debug-value">maxAxisDistance</span> и уводи курсор в промежуток — вертикальная линия и маркер
      перескочат на курсор, а как только точка найдётся, курсорный hit исчезнет. Если бы здесь стоял
      <span class="debug-value">union</span>, курсорная и линейная линии рисовались бы одновременно в тот момент,
      когда точка находится, — <span class="debug-value">orElse</span> устроен так, чтобы этого не происходило.
    </p>

    <p class="debug-note">
      <b>Курсор в heterogeneous union.</b> Включи <span class="debug-value">union с курсором</span>: курсорный hit
      попадает в композицию последним, но колонка «выбор» показывает, что <span class="debug-value">nearest()</span>
      всё равно берёт точку линии. Его <span class="debug-value">distance: Infinity</span> сделан именно для этого — с
      нулём он выигрывал бы любой nearest и перетягивал бы на себя
      <span class="debug-value">tooltipPivot: 'nearest'</span>. А <span class="debug-value">topmost()</span> смотрит не
      на расстояние, а на порядок композиции, поэтому берёт как раз курсор — он добавлен последним.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import { CompositionSnapshot, emptySnapshot } from '../shared/CompositionProbe'
import { ComposedHit, MultiLineChart } from '../shared/MultiLineChart'

const duplicateUnion = ref(false)
const limitedDistance = ref(false)
const maxDistance = ref(60)
const limitedAxis = ref(false)
const maxAxisDistance = ref(20)
const cursorUnion = ref(false)
const cursorFallback = ref(false)

const snapshot = shallowRef<CompositionSnapshot<ComposedHit>>(emptySnapshot())

const chart = markRaw(new MultiLineChart({ config: { tooltip: false } }))

const stopSnapshot = chart.onSnapshot.on(next => snapshot.value = next)

watchEffect(() => chart.setConfig({
  duplicateUnion: duplicateUnion.value,
  maxDistance: limitedDistance.value ? maxDistance.value : null,
  maxAxisDistance: limitedAxis.value ? maxAxisDistance.value : null,
  cursorUnion: cursorUnion.value,
  cursorFallback: cursorFallback.value,
}))

const pipeline = computed(() => {
  const steps = [`lines.nearestByAxis('x'${limitedAxis.value ? `, { maxAxisDistance: ${maxAxisDistance.value} }` : ''})`]
  if (duplicateUnion.value) steps.push('.union(lineB.interaction.nearestByAxis(\'x\'))')
  if (limitedDistance.value) steps.push(`.within({ maxDistance: ${maxDistance.value} })`)
  if (cursorUnion.value) steps.push('.union(cursorSelection())')
  if (cursorFallback.value) steps.push('.orElse(cursorSelection())')
  return steps.join('')
})

onUnmounted(stopSnapshot)

function choiceLabel(hit: ComposedHit) {
  const labels: string[] = []
  if (snapshot.value.nearest === hit) labels.push('nearest()')
  if (snapshot.value.topmost === hit) labels.push('topmost()')
  return labels.join(' + ') || '—'
}

</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
