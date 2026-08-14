<template>
  <div class="debug-row">
    <label class="debug-control">
      <span class="debug-label">данные</span>
      <select v-model="preset">
        <option v-for="item in presets" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </label>

    <label class="debug-control">
      <span class="debug-label">gaps</span>
      <select v-model="gaps">
        <option value="miss">miss</option>
        <option value="nearest">nearest</option>
      </select>
    </label>

    <label class="debug-control">
      <span class="debug-label">groupGaps</span>
      <select v-model="groupGaps">
        <option value="miss">miss</option>
        <option value="nearest">nearest</option>
      </select>
    </label>

    <label class="debug-control">
      <span class="debug-label">hitArea</span>
      <select v-model="hitArea">
        <option value="geometry">geometry</option>
        <option value="vertical">vertical</option>
      </select>
    </label>

    <label class="debug-control">
      <span class="debug-label">padding группы</span>
      <input type="number" v-model.number="padding" min="0" max="0.9" step="0.05">
    </label>

    <label class="debug-control">
      <span class="debug-label">innerPadding, px</span>
      <input type="number" v-model.number="innerPadding" min="0" max="40" step="1">
    </label>

    <label class="debug-control">
      <span class="debug-label">radius, px</span>
      <input type="number" v-model.number="radius" min="0" max="40" step="1">
    </label>

    <label class="debug-control" v-if="strategy === 'stacked'">
      <span class="debug-label">innerRadius, px</span>
      <input type="number" v-model.number="innerRadius" min="0" max="40" step="1">
    </label>
  </div>

  <div class="debug-row">
    <label class="debug-control">
      <span class="debug-label">подсветка item</span>
      <input type="checkbox" v-model="itemHighlight">
    </label>

    <label class="debug-control">
      <span class="debug-label">подсветка группы</span>
      <input type="checkbox" v-model="groupHighlight">
    </label>

    <label class="debug-control">
      <span class="debug-label">подсветка датасета</span>
      <input type="checkbox" v-model="datasetHighlight">
    </label>

    <label class="debug-control">
      <span class="debug-label">подсветка группы (containsGroup)</span>
      <input type="checkbox" v-model="groupContainsHighlight">
    </label>

    <label class="debug-control">
      <span class="debug-label">обрезать область (culling)</span>
      <input type="checkbox" v-model="cropped">
    </label>

    <label class="debug-control">
      <span class="debug-label">категория замера</span>
      <select v-model.number="probeCategory">
        <option v-for="index in categoryCount" :key="index - 1" :value="index - 1">{{ index - 1 }}</option>
      </select>
    </label>

    <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    <button class="debug-btn" @click="chart.refreshDatasets()">setData заново</button>
  </div>

  <div class="debug-row">
    <label class="debug-control">
      <span class="debug-label">VerticalArea geometry: item</span>
      <input type="checkbox" v-model="itemArea">
    </label>

    <label class="debug-control">
      <span class="debug-label">VerticalArea geometry: group</span>
      <input type="checkbox" v-model="groupArea">
    </label>

    <label class="debug-control">
      <span class="debug-label">VerticalArea related(dataset), geometry: group</span>
      <input type="checkbox" v-model="datasetAreas">
    </label>

    <label class="debug-control">
      <span class="debug-label">HorizontalArea geometry: item</span>
      <input type="checkbox" v-model="itemHorizontalArea">
    </label>
  </div>

  <div ref="stage">
    <DemoChartView :chart="chart" :height="320" />
  </div>

  <div class="debug-row current">
    <span class="debug-label">rect.hover-area: item / group / dataset / item (horizontal)</span>
    <span class="debug-value count">{{ areas.item }} / {{ areas.group }} / {{ areas.dataset }} / {{
      areas.itemHorizontal }}</span>
  </div>

  <p class="debug-note">
    <b>item vs group.</b> «geometry: item» и «geometry: group» читают один и тот же
    <span class="debug-value">itemSelection</span> — единственная разница в опции
    <span class="debug-value">geometry</span> у <span class="debug-value">VerticalArea</span>: первая обводит сам
    hovered bar, вторая — весь visual range его группы. <span class="debug-value">related()</span> здесь не участвует
    вовсе.
  </p>

  <p class="debug-note">
    <b>Дедуп и несколько областей одновременно.</b> «related(dataset), geometry: group» получает по item hit'у на
    каждую категорию датасета — у каждой свой <span class="debug-value">groupRect</span>, поэтому колонка «dataset»
    выше обычно больше 1 сразу: разные ranges не схлопываются. Колонка «group» тем временем всегда 0 или 1: сколько
    бы item hits ни вернул <span class="debug-value">related('group')</span> для одной категории — у них общий
    <span class="debug-value">groupRect</span>, и normalized range у всех совпадает.
  </p>

  <table class="debug-table">
    <thead>
      <tr>
        <th>selection</th>
        <th>dataset</th>
        <th>category index / datum</th>
        <th>datum</th>
        <th>contains</th>
        <th>distance, px</th>
        <th>targets</th>
        <th>geometry item</th>
        <th>geometry group</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in hitRows" :key="row.key" :class="row.kind">
        <td>{{ row.label }}</td>
        <td>{{ row.hit.datasetIndex }}</td>
        <td>{{ row.hit.categoryIndex }} / {{ row.hit.category }}</td>
        <td>{{ row.hit.datum }}</td>
        <td>{{ row.hit.contains ? 'да' : 'нет' }}</td>
        <td>{{ fmt(row.hit.distance) }}</td>
        <td>{{ row.hit.targets.length }}</td>
        <td>{{ range(row.hit.geometry.xRange) }} × {{ range(row.hit.geometry.yRange) }}</td>
        <td>{{ groupRange(row.hit) }}</td>
      </tr>
      <tr v-if="hitRows.length === 0">
        <td colspan="9" class="empty">selection пуст</td>
      </tr>
    </tbody>
  </table>

  <p class="debug-note">
    <b>containsGroup() рядом с contains().</b> Тот же указатель, тот же <span class="debug-value">hitArea</span>, но
    отдельный запрос уровня группы: <span class="debug-value">geometry</span> совпадает с попаданием в
    <span class="debug-value">groupRect</span>, а <span class="debug-value">vertical</span> растягивает и hit-зону, и
    саму geometry (столбец «geometry») на всю высоту layout. Переключи <span class="debug-value">hitArea</span> и
    поводи курсором выше/ниже столбцов: у grouped строка появляется в обоих режимах у самих столбцов, но только в
    <span class="debug-value">vertical</span> — над и под ними; у stacked это единственное место, где вертикаль вообще
    что-то меняет (сами сегменты стека — см. заметку ниже).
  </p>

  <table class="debug-table">
    <thead>
      <tr>
        <th>selection</th>
        <th>category index / datum</th>
        <th>datum по датасетам</th>
        <th>contains</th>
        <th>distance, px</th>
        <th>targets</th>
        <th>geometry</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="hit in groupContains" :key="`gc${hit.categoryIndex}`">
        <td>containsGroup()</td>
        <td>{{ hit.categoryIndex }} / {{ hit.category }}</td>
        <td>{{ datumText(hit) }}</td>
        <td>{{ hit.contains ? 'да' : 'нет' }}</td>
        <td>{{ fmt(hit.distance) }}</td>
        <td>{{ hit.targets.length }}</td>
        <td>{{ range(hit.geometry.xRange) }} × {{ range(hit.geometry.yRange) }}</td>
      </tr>
      <tr v-if="groupContains.length === 0">
        <td colspan="7" class="empty">selection пуст</td>
      </tr>
    </tbody>
  </table>

  <div class="debug-row current">
    <span class="debug-label">классы на hovered bar</span>
    <span class="debug-value">{{ dom.classes || '—' }}</span>
  </div>

  <div class="debug-row current">
    <span class="debug-label">path.bar с классом item / group / dataset</span>
    <span class="debug-value count">{{ dom.counts.item }} / {{ dom.counts.group }} / {{ dom.counts.dataset }}</span>
    <span class="debug-label">из</span>
    <span class="debug-value count">{{ dom.counts.bars }}</span>
    <span class="debug-label">классов подсветки на g.dataset</span>
    <span class="debug-value" :class="dom.counts.datasetGroups === 0 ? 'ok' : 'bad'">{{ dom.counts.datasetGroups }}</span>
  </div>

  <table class="debug-table">
    <thead>
      <tr>
        <th>dataset</th>
        <th>значение</th>
        <th>item</th>
        <th>rect X</th>
        <th>slot X</th>
        <th>rect Y</th>
        <th>slot Y</th>
        <th>d непустой</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in zoneRows" :key="row.datasetIndex">
        <td>{{ row.datasetIndex }}</td>
        <td>{{ row.value === undefined ? 'нет значения' : String(row.value) }}</td>
        <td>{{ row.zone ? 'есть' : 'нет' }}</td>
        <td>{{ row.zone ? range([row.zone.rect.minX, row.zone.rect.maxX]) : '—' }}</td>
        <td>{{ row.zone ? range([row.zone.slotRect.minX, row.zone.slotRect.maxX]) : '—' }}</td>
        <td>{{ row.zone ? range([row.zone.rect.minY, row.zone.rect.maxY]) : '—' }}</td>
        <td>{{ row.zone ? range([row.zone.slotRect.minY, row.zone.slotRect.maxY]) : '—' }}</td>
        <td>{{ row.zone ? (row.zone.drawn ? 'да' : 'нет') : '—' }}</td>
      </tr>
    </tbody>
  </table>

  <div class="debug-row current">
    <span class="debug-label">ячейка категории {{ zones?.categoryIndex ?? 0 }} по X</span>
    <span class="debug-value">{{ zones ? range([zones.cell.minX, zones.cell.maxX]) : '—' }}</span>
    <span class="debug-label">visual group</span>
    <span class="debug-value">{{ groupZone }}</span>
  </div>

  <table class="debug-table">
    <thead>
      <tr>
        <th>стык</th>
        <th>конец rect</th>
        <th>начало следующего rect</th>
        <th>середина gap</th>
        <th>граница слотов</th>
        <th>совпадает с серединой</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(junction, index) in junctions" :key="index">
        <td>{{ junction.from }} → {{ junction.to }}</td>
        <td>{{ fmt(junction.gapStart) }}</td>
        <td>{{ fmt(junction.gapEnd) }}</td>
        <td>{{ fmt(junction.gapMid) }}</td>
        <td>{{ fmt(junction.boundary) }} / {{ fmt(junction.nextBoundary) }}</td>
        <td :class="matches(junction) ? 'ok' : 'bad'">{{ matches(junction) ? 'да' : 'НЕТ' }}</td>
      </tr>
      <tr v-if="junctions.length === 0">
        <td colspan="6" class="empty">в этой категории меньше двух ненулевых сегментов</td>
      </tr>
    </tbody>
  </table>
</template>


<script setup lang="ts">
import { useMutationObserver } from '@vueuse/core'
import { computed, markRaw, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch, watchEffect } from 'vue'
import { BarGroupHit, BarItemHit } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource'
import DemoChartView from '../../shared/DemoChartView.vue'
import { BarAreaCounts, BarChart, BarClassCounts, barPresets, BarStrategyKind, BarZones, defaultBarConfig, ZoneJunction, zoneJunctions } from '../../shared/BarChart'
import { fmt, range } from '../../shared/format'

const props = defineProps<{
  strategy: BarStrategyKind
}>()

const categoryCount = 5

const defaults = defaultBarConfig(props.strategy)
const presets = barPresets(props.strategy)

const preset = ref(defaults.preset)
const gaps = ref(defaults.gaps)
const groupGaps = ref(defaults.groupGaps)
const hitArea = ref(defaults.hitArea)
const padding = ref(defaults.padding)
const innerPadding = ref(defaults.innerPadding)
const radius = ref(defaults.radius)
const innerRadius = ref(defaults.innerRadius)
const itemHighlight = ref(defaults.itemHighlight)
const groupHighlight = ref(defaults.groupHighlight)
const datasetHighlight = ref(defaults.datasetHighlight)
const groupContainsHighlight = ref(defaults.groupContainsHighlight)
const cropped = ref(defaults.cropped)
const probeCategory = ref(defaults.probeCategory)
const itemArea = ref(defaults.itemArea)
const groupArea = ref(defaults.groupArea)
const datasetAreas = ref(defaults.datasetAreas)
const itemHorizontalArea = ref(defaults.itemHorizontalArea)

const item = shallowRef<readonly BarItemHit[]>([])
const group = shallowRef<readonly BarItemHit[]>([])
const dataset = shallowRef<readonly BarItemHit[]>([])
const groupContains = shallowRef<readonly BarGroupHit[]>([])
const zones = shallowRef<BarZones | null>(null)
const dom = ref<{ counts: BarClassCounts, classes: string }>({
  counts: { item: 0, group: 0, dataset: 0, bars: 0, datasetGroups: 0 },
  classes: '',
})
const areas = ref<BarAreaCounts>({ item: 0, group: 0, dataset: 0, itemHorizontal: 0 })

const stage = useTemplateRef<HTMLElement>('stage')

const chart = markRaw(new BarChart({ strategy: props.strategy }))

const stops = [
  chart.onItem.on(hits => item.value = hits),
  chart.onGroup.on(hits => group.value = hits),
  chart.onDataset.on(hits => dataset.value = hits),
  chart.onGroupContains.on(hits => groupContains.value = hits),
  chart.onZones.on(next => zones.value = next),
]

watchEffect(() => chart.setConfig({
  preset: preset.value,
  gaps: gaps.value,
  groupGaps: groupGaps.value,
  hitArea: hitArea.value,
  padding: padding.value,
  innerPadding: innerPadding.value,
  radius: radius.value,
  innerRadius: innerRadius.value,
  itemHighlight: itemHighlight.value,
  groupHighlight: groupHighlight.value,
  datasetHighlight: datasetHighlight.value,
  groupContainsHighlight: groupContainsHighlight.value,
  cropped: cropped.value,
  probeCategory: probeCategory.value,
  itemArea: itemArea.value,
  groupArea: groupArea.value,
  datasetAreas: datasetAreas.value,
  itemHorizontalArea: itemHorizontalArea.value,
}))

// Классы вешает Highlight в своей render-фазе, поэтому считаем их по факту мутации DOM, а не в колбэке хитов
useMutationObserver(stage, refreshDom, { attributes: true, attributeFilter: ['class'], subtree: true })
// rect area создаётся/удаляется в renderInteraction, а не через class — отдельный наблюдатель за childList
useMutationObserver(stage, refreshAreas, { childList: true, subtree: true })
watch(item, refreshDom)
onMounted(() => {
  refreshDom()
  refreshAreas()
})
onUnmounted(() => stops.forEach(stop => stop()))

function refreshAreas() {
  areas.value = chart.areaCounts()
}

const hitRows = computed(() => [
  ...item.value.map(hit => ({ key: `i${hit.datasetIndex}`, kind: 'item', label: 'contains()', hit })),
  ...group.value.map(hit => ({ key: `g${hit.datasetIndex}`, kind: 'group', label: 'related(group)', hit })),
  ...dataset.value.map(hit => ({ key: `d${hit.categoryIndex}`, kind: 'dataset', label: 'related(dataset)', hit })),
])

const zoneRows = computed(() => {
  const snapshot = zones.value
  if (!snapshot) return []

  return chart.rawValues(snapshot.categoryIndex).map((value, datasetIndex) => ({
    datasetIndex,
    value,
    zone: snapshot.items.find(zone => zone.datasetIndex === datasetIndex) ?? null,
  }))
})

const junctions = computed<ZoneJunction[]>(() => {
  const snapshot = zones.value
  if (!snapshot) return []

  return zoneJunctions(snapshot.items, props.strategy === 'grouped' ? 'x' : 'y')
})

const groupZone = computed(() => {
  const first = zones.value?.items[0]
  return first ? range([first.groupRect.minX, first.groupRect.maxX]) : '—'
})

function refreshDom() {
  const hit = item.value[0]
  dom.value = {
    counts: chart.classCounts(),
    classes: hit ? chart.barClasses(hit.datasetIndex, hit.categoryIndex) : '',
  }
}

function groupRange(hit: BarItemHit) {
  const geometry = hit.geometryFor('group')
  return geometry ? range(geometry.xRange) : '—'
}

// datum группы — сырые значения категории по датасетам, а не одного бара: пропуск виден как «—»
function datumText(hit: BarGroupHit) {
  return hit.datum.map(value => value === undefined ? '—' : fmt(value)).join(', ')
}

// Допуск на float: стык слотов и середина gap считаются разными выражениями от одних и тех же координат
function matches(junction: ZoneJunction) {
  return Math.abs(junction.boundary - junction.gapMid) < 0.01 && Math.abs(junction.boundary - junction.nextBoundary) < 0.01
}
</script>


<style scoped lang="scss">
@use '../../shared/statusStyles.scss' as *;

tr.item td {
  font-weight: bold;
  color: white;
}
</style>
