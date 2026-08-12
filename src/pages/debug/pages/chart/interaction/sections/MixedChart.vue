<template>
  <DebugSection title="Финальный сборный график" id="mixed-chart"
    description="Bar, две линии, scatter и PolygonArea на одном контроллере: все relevant highlights, VerticalLine/HorizontalLine, VerticalArea/HorizontalArea, MarkerOverlay и ChartTooltip с isHighlighted(). Это не изолированный тест одного механизма, а приёмка того, что вся архитектура работает вместе."
    source="src/pages/debug/pages/chart/interaction/shared/MixedChart.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="chart.changeBarData()">Изменить данные Bar</button>
      <button class="debug-btn" @click="chart.changeLineData()">Изменить данные линий</button>
      <button class="debug-btn" @click="chart.changeScatterData()">Изменить данные Scatter</button>
      <button class="debug-btn" @click="chart.changePolygonData()">Изменить данные Polygon</button>
      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
      <span class="debug-hint">Курсор не двигаем — все четыре кнопки меняют данные plot'ов на месте.</span>
    </div>

    <DemoChartView :chart="chart" :height="420" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>kind</th>
          <th>что</th>
          <th>distance, px</th>
          <th>contains</th>
          <th>highlighted</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index">
          <td>{{ row.kind }}</td>
          <td>{{ row.what }}</td>
          <td>{{ fmt(row.distance) }}</td>
          <td>{{ row.contains ? 'да' : 'нет' }}</td>
          <td :class="row.highlighted ? 'ok' : ''">{{ row.highlighted || '—' }}</td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="5" class="empty">tooltipSelection пуст</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row current">
      <span class="debug-label">VerticalLine (linePointsByX)</span>
      <span class="debug-value count">{{ counts.verticalLine }}</span>

      <span class="debug-label">line markers</span>
      <span class="debug-value count">{{ counts.lineMarker }}</span>

      <span class="debug-label">line-highlighted</span>
      <span class="debug-value count">{{ counts.lineHighlighted }}</span>

      <span class="debug-label">bar group area</span>
      <span class="debug-value count">{{ counts.barGroupArea }}</span>

      <span class="debug-label">polygon area rects</span>
      <span class="debug-value count">{{ counts.polygonArea }}</span>

      <span class="debug-label">scatter guides</span>
      <span class="debug-value count">{{ counts.scatterGuide }}</span>
    </div>

    <table class="debug-table checklist">
      <thead>
        <tr>
          <th>ожидаемое поведение</th>
          <th>как проверить здесь</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tooltip получает points обеих lines только в winning common X</td>
          <td>Наведи между категориями — строк <span class="debug-value">line-point</span> в таблице выше ровно 2, с
            одинаковым X-соседством</td>
        </tr>
        <tr>
          <td>Gap у линии в winning X — её hit отсутствует, соседняя точка не подставляется</td>
          <td>Наведи на категорию 3 (0-based) — у lineB там намеренный <span class="debug-value">null</span>, строка
            line-point только одна (lineA)</td>
        </tr>
        <tr>
          <td>Одна VerticalLine дедуплицирует одинаковый X нескольких line points</td>
          <td>«VerticalLine (linePointsByX)» выше всегда 0 или 1, даже когда line-point строк две</td>
        </tr>
        <tr>
          <td>MarkerOverlay рисует point каждой line в этом X</td>
          <td>«line markers» выше равно числу line-point строк в таблице (1 или 2)</td>
        </tr>
        <tr>
          <td>Только ближайший qualifying stroke получает line highlight</td>
          <td>«line-highlighted» выше — 0 или 1 независимо от того, сколько line-point строк в тултипе</td>
        </tr>
        <tr>
          <td>Tooltip line datum — highlighted через series membership</td>
          <td>Колонка «highlighted» у line-point строки, ближайшей по stroke, показывает «line»</td>
        </tr>
        <tr>
          <td>Bar activation — mathematical rectangle и gap policy (miss)</td>
          <td>Наведи на реальный padding между барами группы — bar-item строки в тултипе нет</td>
        </tr>
        <tr>
          <td>Tooltip bar group — item hit каждого finite value, включая zero</td>
          <td>Наведи на любой бар — bar-item строк в тултипе ровно 2 (по числу датасетов)</td>
        </tr>
        <tr>
          <td>Hovered bar получает item и dataset classes; остальные items dataset — только dataset</td>
          <td>«classes hovered / соседний bar» ниже: у первого оба класса, у второго только dataset</td>
        </tr>
        <tr>
          <td>VerticalArea geometry: group покрывает visual X-range bar группы</td>
          <td>«bar group area» выше — 1 при наведении на бар, прямоугольник шире одного bar на глаз</td>
        </tr>
        <tr>
          <td>Scatter — одна activation policy для highlight, tooltip и guides</td>
          <td>Highlight, строка scatter-point в тултипе и обе scatter guides появляются и пропадают синхронно</td>
        </tr>
        <tr>
          <td>Polygon — только fill contains, holes/culling</td>
          <td>Изолированно проверено в секции <a href="#polygon">Polygon</a>; здесь — hit только внутри заливки</td>
        </tr>
        <tr>
          <td>Polygon highlight target — existing path; обе areas используют bounds</td>
          <td>«polygon area rects» выше — 2 при наведении на полигон (Vertical + Horizontal)</td>
        </tr>
        <tr>
          <td>Tooltip публикует mixed hits в composition order</td>
          <td>Порядок строк выше: line-point → bar-item → scatter-point → polygon, как в коде selection</td>
        </tr>
        <tr>
          <td>ctx.isHighlighted() — snapshot того же кадра независимо от порядка addComponent()</td>
          <td>Изолированно проверено в секции <a href="#highlight">Highlight</a>; здесь колонка «highlighted» просто
            согласована с реальной подсветкой на графике</td>
        </tr>
        <tr>
          <td>Смена данных любого плота при неподвижном курсоре обновляет highlight/overlays/tooltip в том же кадре
          </td>
          <td>Наведи и жми кнопки «Изменить данные…» — таблица выше и подсветки обновляются без движения мыши</td>
        </tr>
        <tr>
          <td>Увод курсора снимает все classes и overlays, вызывает onHide()</td>
          <td>Убери курсор с графика — все счётчики выше уходят в 0, таблица показывает «tooltipSelection пуст»</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row current">
      <span class="debug-label">classes hovered / соседний bar (dataset 0)</span>
      <span class="debug-value">{{ hoveredBarClasses || '—' }}</span>
      <span class="debug-value">{{ neighborBarClasses || '—' }}</span>
    </div>

    <p class="debug-note">
      Композиция: <span class="debug-value">linePointsByX.union(barGroup).
        union(scatterPoint).union(hoveredPolygon)</span> — union только после query, между уже разными типами hits,
      то есть это selection union, а не source union. Line source union (<span class="debug-value">lineA.interaction.
        union(lineB.interaction)</span>) — единственный source union здесь, и он между двумя совместимыми line
      sources, не между разнородными плотами.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref, shallowRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../shared/DemoChartView.vue'
import { fmt } from '../shared/format'
import { MixedChart, MixedHit } from '../shared/MixedChart'

const ctx = shallowRef<TooltipCtx<MixedHit> | null>(null)
const counts = ref(emptyCounts())

const chart = markRaw(new MixedChart())

const stopTooltip = chart.onTooltip.on(next => ctx.value = next)
const stopRender = chart.onAfterRender.on(() => {
  counts.value = chart.domCounts()
})

onUnmounted(() => {
  stopTooltip()
  stopRender()
})

function emptyCounts() {
  return { verticalLine: 0, lineMarker: 0, lineHighlighted: 0, barGroupArea: 0, polygonArea: 0, scatterGuide: 0 }
}

type Row = { kind: string, what: string, distance: number, contains: boolean, highlighted: string }

const rows = computed<Row[]>(() => (ctx.value?.hits ?? []).map(hit => {
  if (hit.kind === 'line-point') {
    const flags: string[] = []
    if (ctx.value!.isHighlighted(hit, chart.lineHighlight)) flags.push('line')
    return { kind: hit.kind, what: `${hit.datum.label} (y=${hit.datum.y.toFixed(1)})`, distance: hit.distance, contains: hit.contains, highlighted: flags.join(', ') }
  }

  if (hit.kind === 'bar-item') {
    const flags: string[] = []
    if (ctx.value!.isHighlighted(hit, chart.barItemHighlight)) flags.push('item')
    if (ctx.value!.isHighlighted(hit, chart.barDatasetHighlight)) flags.push('dataset')
    return { kind: hit.kind, what: `dataset ${hit.datasetIndex}, значение ${hit.datum}`, distance: hit.distance, contains: hit.contains, highlighted: flags.join(', ') }
  }

  if (hit.kind === 'scatter-point') {
    const flags: string[] = []
    if (ctx.value!.isHighlighted(hit, chart.scatterHighlight)) flags.push('scatter')
    return { kind: hit.kind, what: hit.datum.label, distance: hit.distance, contains: hit.contains, highlighted: flags.join(', ') }
  }

  const flags: string[] = []
  if (ctx.value!.isHighlighted(hit, chart.polygonHighlight)) flags.push('polygon')
  return { kind: hit.kind, what: 'polygon', distance: hit.distance, contains: hit.contains, highlighted: flags.join(', ') }
}))

const hoveredBarClasses = computed(() => {
  const hit = ctx.value?.hits.find((h): h is Extract<MixedHit, { kind: 'bar-item' }> => h.kind === 'bar-item' && h.datasetIndex === 0)
  return hit ? chart.barClasses(0, hit.categoryIndex) : ''
})

const neighborBarClasses = computed(() => {
  const hit = ctx.value?.hits.find((h): h is Extract<MixedHit, { kind: 'bar-item' }> => h.kind === 'bar-item' && h.datasetIndex === 0)
  if (!hit) return ''
  const neighbor = (hit.categoryIndex + 1) % 6
  return chart.barClasses(0, neighbor)
})
</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;

.checklist td:first-child {
  text-align: left;
}

.checklist td:last-child {
  text-align: left;
  color: var(--debug-dim, #ffffff8e);
}
</style>
