<template>
  <DebugSection title="Выборочная синхронизация ховера" id="synchronization"
    description="withInput(hoverSync): (1) активный local hover на этом контроллере побеждает; (2) иначе берётся synced chart-frame координата хаба и проецируется в локальный ChartSpace; (3) local plot query выполняется заново против локальных данных графика. Хиты между графиками не передаются — синхронизируется только координата."
    source="src/shared/uiKit/chart/universalChart/interaction/core/Selection.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">VerticalLine synced</span>
        <input type="checkbox" v-model="verticalLineSynced">
      </label>

      <label class="debug-control">
        <span class="debug-label">MarkerOverlay synced</span>
        <input type="checkbox" v-model="markerSynced">
      </label>

      <label class="debug-control">
        <span class="debug-label">ChartTooltip synced</span>
        <input type="checkbox" v-model="tooltipSynced">
      </label>

      <label class="debug-control">
        <span class="debug-label">tooltipPivot</span>
        <select v-model="tooltipPivot">
          <option v-for="item in pivots" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">zoom (source)</span>
        <input type="checkbox" v-model="zoom">
      </label>

      <button class="debug-btn" @click="resetBoth">Сбросить область</button>
    </div>

    <div class="stages">
      <SyncStage :chart="chartA" title="График A — разрыв в X 8…14, Y ~500" />
      <SyncStage :chart="chartB" title="График B — разрыв в X 2…7, Y ~6000 (другой масштаб)" />
    </div>

    <p class="debug-note">
      Наведи курсор на <b>график A</b>: если <span class="debug-value">VerticalLine synced</span> включён, на графике
      B тоже появляется вертикальная линия — на той же координате X, спроецированной в его собственный
      <span class="debug-value">ChartSpace</span>. Маркер и тултип при выключенных тумблерах на B не показываются:
      их selection остаётся local, а local hover на B нет.
    </p>

    <p class="debug-note">
      <b>Gap на source, datum на follower.</b> Веди курсор по графику A в районе X 8…14 — там у A разрыв. Хаб всё
      равно публикует raw-координату; local selection графика A пуст (маркер/тултип на A погашены, если они не
      synced), а на графике B в этом X есть точка — если включить synced-тумблер у маркера/тултипа, они покажутся
      именно на B. Обратный случай — веди курсор по графику B в районе X 2…7: там разрыв уже у B, а datum — на A.
    </p>

    <p class="debug-note">
      <b>Разные Y-масштабы.</b> Y графика B на порядок больше, чем у A (~6000 против ~500), и это не мешает
      синхронизации: <span class="debug-value">HoverSynchronizer</span> публикует chart-frame координату, а
      <span class="debug-value">nearestByAxis('x')</span> внутри synced-запроса использует только X — Y каждый график
      достаёт из своих собственных bounds.
    </p>

    <p class="debug-note">
      <b>Один resolver — два результата в одном кадре.</b> Таблицы под каждым графиком читают
      <i>один и тот же</i> <span class="debug-value">line.interaction.nearestByAxis('x')</span> дважды за кадр: строка
      <span class="debug-value">local</span> — прямой resolve, строка <span class="debug-value">synced</span> — тот же
      resolver под <span class="debug-value">withInput(hoverSync)</span>. Наведи курсор на один график — на нём обе
      строки совпадут (local приоритетнее), а на втором local останется пустым, пока synced покажет то, что нашлось
      по проекции координаты. Кеш кадра по паре <span class="debug-value">(resolver, input)</span> не даёт им
      перепутаться: если бы ключом был один только resolver, synced-ветка отравила бы local или наоборот.
    </p>

    <p class="debug-note">
      <b>Pivot и isTouch на synced-кадре.</b> Включи <span class="debug-value">ChartTooltip synced</span> и оставь
      <span class="debug-value">tooltipPivot: cursor</span>. У графика-фолловера своего курсора нет, поэтому «курсором»
      для него служит координата хаба, спроецированная в его собственный layout — карточка следует за ней плавно, а не
      прыгает по точкам. Переключи на <span class="debug-value">nearest</span>, чтобы увидеть разницу: там pivot встаёт
      на anchor ближайшего хита. Строка <span class="debug-value">ввод</span> в карточке берёт
      <span class="debug-value">ctx.isTouch</span> — на synced-кадре он приходит от хаба, а не зашит в false, поэтому
      при касании источника фолловер тоже показывает «палец».
    </p>

    <p class="debug-note">
      <b>Zoom source без jitter.</b> Включи <span class="debug-value">zoom (source)</span> на обоих графиках, наведи
      курсор на A и покрути колесо, не двигая курсор. Линия на A обязана остаться под курсором — это существующий
      <span class="debug-value">HoverSynchronizer.onBeforeLayout()</span>, который каждый кадр перепроецирует raw
      pixel по уже обновлённым zoom-границам (порядок компонентов: <span class="debug-value">ZoomChartComponent</span>
      добавлен в controller раньше hub'а). Synced-линия на B обязана следовать за ней плавно, без дрожи: withInput()
      читает ту же перепроецированную координату на каждом кадре.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { SyncChart, type SyncConfig } from '../../shared/SyncChart'
import { syncSeriesA, syncSeriesB } from '../../shared/syncSeries'
import SyncStage from './SyncStage.vue'

const pivots = ['cursor', 'nearest', 'avg'] as const satisfies readonly SyncConfig['tooltipPivot'][]

const verticalLineSynced = ref(true)
const markerSynced = ref(false)
const tooltipSynced = ref(false)
const tooltipPivot = ref<SyncConfig['tooltipPivot']>('cursor')
const zoom = ref(false)

const hoverSync = new HoverSynchronizer()

const chartA = markRaw(new SyncChart({ points: syncSeriesA(), hoverSync }))
const chartB = markRaw(new SyncChart({ points: syncSeriesB(), hoverSync }))

watchEffect(() => {
  const config = {
    verticalLineSynced: verticalLineSynced.value,
    markerSynced: markerSynced.value,
    tooltipSynced: tooltipSynced.value,
    tooltipPivot: tooltipPivot.value,
    zoom: zoom.value,
  }
  chartA.setConfig(config)
  chartB.setConfig(config)
})

function resetBoth() {
  chartA.resetView()
  chartB.resetView()
}

</script>


<style scoped lang="scss">
.stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5em;
}
</style>
