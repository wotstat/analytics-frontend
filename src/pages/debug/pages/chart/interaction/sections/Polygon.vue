<template>
  <DebugSection title="Polygon: contains() через native isPointInFill()" id="polygon"
    description="polygon.interaction.contains() — единственный запрос плота: 0..1 hit, distance всегда 0. Hit-testing целиком на SVGPathElement.isPointInFill() — вогнутые контуры, несколько подпутей, дырки, nonzero/evenodd и culling движок не переизобретает, а берёт как есть из браузера. clip-path и mask в hit-testing не участвуют — на практике это не расходится с видимым, потому что interactiveZone совпадает с layout."
    source="src/shared/uiKit/chart/universalChart/plot/area/PolygonAreaInteractionSource.ts">

    <h4>Вогнутый контур, дырка, nonzero/evenodd, culling</h4>

    <div class="debug-row">
      <label class="debug-control wide">
        <span class="debug-label">сдвиг X фигуры</span>
        <input type="range" min="-100" max="100" step="1" v-model.number="offsetX">
        <span class="debug-value">{{ offsetX }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">дырка того же направления, что outer</span>
        <input type="checkbox" v-model="holeSameWinding">
      </label>

      <label class="debug-control">
        <span class="debug-label">CSS fill-rule: evenodd</span>
        <input type="checkbox" v-model="evenodd">
      </label>

      <label class="debug-control">
        <span class="debug-label">Highlight</span>
        <input type="checkbox" v-model="shapeHighlight">
      </label>

      <label class="debug-control">
        <span class="debug-label">VerticalArea</span>
        <input type="checkbox" v-model="verticalArea">
      </label>

      <label class="debug-control">
        <span class="debug-label">HorizontalArea</span>
        <input type="checkbox" v-model="horizontalArea">
      </label>
    </div>

    <DemoChartView :chart="shapeChart" :height="280" />

    <div class="debug-row current">
      <span class="debug-label">d пути</span>
      <span class="debug-value" :class="pathInfo.empty ? 'bad' : 'ok'">
        {{ pathInfo.empty ? 'пусто (culling отсёк целиком)' : `${pathInfo.length} симв.` }}
      </span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>contains()</th>
          <th>distance, px</th>
          <th>targets</th>
          <th>anchor (bounds center)</th>
          <th>xRange</th>
          <th>yRange</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(hit, index) in shapeHits" :key="index">
          <td class="ok">да</td>
          <td>{{ fmt(hit.distance) }}</td>
          <td>{{ hit.targets.length }}</td>
          <td>{{ fmt(hit.geometry.anchor.x) }}, {{ fmt(hit.geometry.anchor.y) }}</td>
          <td>{{ range(hit.geometry.xRange) }}</td>
          <td>{{ range(hit.geometry.yRange) }}</td>
        </tr>
        <tr v-if="shapeHits.length === 0">
          <td colspan="6" class="empty">selection пуст — курсор вне заливки (снаружи фигуры, в дырке или в вогнутом вырезе)</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>Три прицела на графике</b> — маркеры для точного наведения курсора: <span class="debug-value">зелёный (solid)</span>
      лежит внутри заливки вне дырки, <span class="debug-value">красный (notch)</span> — внутри bbox контура, но в
      вогнутом вырезе снаружи заливки, <span class="debug-value">оранжевый (hole)</span> — в центре прямоугольной дырки.
      Наведи курсор точно на центр каждого — таблица выше должна показать hit на зелёном и пустую selection на красном
      и оранжевом (при выключенной галке «дырка того же направления»).
    </p>

    <p class="debug-note">
      <b>Reversed hole под nonzero.</b> По умолчанию дырка передана в направлении, обратном outer — стандартный
      <span class="debug-value">fill-rule: nonzero</span> оставляет её прозрачной, и оранжевый прицел даёт пустую
      selection. Включи <span class="debug-value">«дырка того же направления»</span>: те же координаты, тот же
      nonzero, но оба контура теперь однонаправленные — nonzero их складывает, дырка закрашивается сплошным, и на
      оранжевом прицеле появляется hit (<span class="debug-value">contains: true</span>). Это не баг, а сама семантика
      nonzero — winding решает, а не расположение точки.
    </p>

    <p class="debug-note">
      <b>CSS evenodd.</b> Включи <span class="debug-value">evenodd</span> при включённой «дырка того же направления»:
      результат на оранжевом прицеле возвращается к пустой selection — evenodd считает по чётности пересечений луча
      с контурами и не зависит от winding вообще, в отличие от nonzero. <span class="debug-value">isPointInFill()</span>
      следует текущему вычисленному <span class="debug-value">fill-rule</span> элемента, поэтому переключение CSS
      меняет результат hit-теста, а не только картинку.
    </p>

    <p class="debug-note">
      <b>Частично видимый bbox и полный culling.</b> Двигай ползунок «сдвиг X»: около ±40 фигура уже наполовину
      выходит за renderBounds <span class="debug-value">[0, 100]</span>, но <span class="debug-value">d</span>
      остаётся непустым — culling не обрезает рёбра, пока общий bbox фигуры пересекает layout, и заливка внутри
      видимой части по-прежнему hit-testable. После примерно ±95 bbox полностью выходит за пределы — строка
      «d пути» переключается на «пусто», и selection в любой точке экрана, включая прицелы, пуста: hitAt() даже не
      вызывает isPointInFill(), раз вызывать его не на чем.
    </p>

    <h4>Перекрывающиеся полигоны: union order против paint order</h4>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">поменять порядок отрисовки (сверху B)</span>
        <input type="checkbox" v-model="swapPaintOrder">
      </label>

      <label class="debug-control">
        <span class="debug-label">Highlight (topmost)</span>
        <input type="checkbox" v-model="overlapHighlight">
      </label>
    </div>

    <DemoChartView :chart="overlapChart" :height="260" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>union(A, B) — состав</th>
          <th>из правой (B)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(hit, index) in snapshot.hits" :key="index">
          <td>{{ polygonLabel(hit) }}</td>
          <td :class="snapshot.fromRight[index] ? 'ok' : ''">{{ snapshot.fromRight[index] ? 'да' : 'нет' }}</td>
        </tr>
        <tr v-if="snapshot.hits.length === 0">
          <td colspan="2" class="empty">selection пуст — курсор вне обоих полигонов</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row current">
      <span class="debug-label">topmost()</span>
      <span class="debug-value">{{ snapshot.topmost ? polygonLabel(snapshot.topmost) : '—' }}</span>

      <span class="debug-label">nearest()</span>
      <span class="debug-value">{{ snapshot.nearest ? polygonLabel(snapshot.nearest) : '—' }}</span>

      <span class="debug-label">визуально сверху сейчас</span>
      <span class="debug-value">{{ swapPaintOrder ? 'B' : 'A' }}</span>
    </div>

    <p class="debug-note">
      <b>Composition order зафиксирован в коде</b> как <span class="debug-value">polygonA.interaction.contains()
        .union(polygonB.interaction.contains())</span> — B всегда правый операнд и всегда побеждает в
      <span class="debug-value">topmost()</span>, независимо от чекбокса выше. По умолчанию сверху нарисован A
      (обычный DOM-порядок), а чекбокс двигает только DOM-порядок (SVG paint order) вызовом
      <span class="debug-value">appendChild</span> — composition order в коде он не трогает. Наведи курсор в область
      пересечения (центр графика) и переключай чекбокс: строки <span class="debug-value">topmost()</span> и
      «визуально сверху сейчас» независимо ходят порознь — topmost всегда «B», а визуальный верх переключается между
      A и B. Именно это и значит «topmost() не читает paint order SVG».
    </p>

    <p class="debug-note">
      <b>nearest() совпадает с topmost() здесь не случайно, но и не специально.</b> У area-хита
      <span class="debug-value">distance</span> всегда 0, поэтому оба кандидата в зоне пересечения
      делят точное равенство — при tie оба <span class="debug-value">nearest()</span> и
      <span class="debug-value">topmost()</span> берут последний по selection order, то есть один и тот же B.
    </p>

    <p class="debug-note">
      <b>VerticalArea/HorizontalArea без geometry-опции.</b> Включи любую из галок выше: пунктирный прямоугольник
      обводит ровно <span class="debug-value">xRange</span>/<span class="debug-value">yRange</span> из таблицы —
      bounding box контуров этого кадра, ту же default geometry hit'а. У полигона нет именованных geometry scopes:
      <span class="debug-value">geometryFor</span> типизирован параметром <span class="debug-value">never</span> и не
      может быть вызван с реальным именем скоупа — <span class="debug-value">VerticalArea</span>/
      <span class="debug-value">HorizontalArea</span> здесь этой опцией физически не типизируются, и передать её
      было бы ошибкой сборки. Обе области сами не считают bounds — их вычисляет
      <span class="debug-value">PolygonArea</span>, а эффект только выбирает scope.
      Подвинь «сдвиг X» ближе к границе culling — прямоугольник обязан пропасть в тот же кадр, что и
      <span class="debug-value">d</span> пути, потому что оба читают один и тот же projected bounds кеш плота.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { PolygonHit } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonAreaInteractionSource'
import DemoChartView from '../shared/DemoChartView.vue'
import { CompositionSnapshot, emptySnapshot } from '../shared/CompositionProbe'
import { fmt, range } from '../shared/format'
import { defaultPolygonOverlapConfig, PolygonOverlapChart } from '../shared/PolygonOverlapChart'
import { defaultPolygonShapeConfig, PolygonShapeChart } from '../shared/PolygonShapeChart'

const shapeDefaults = defaultPolygonShapeConfig()
const overlapDefaults = defaultPolygonOverlapConfig()

const offsetX = ref(shapeDefaults.offsetX)
const holeSameWinding = ref(shapeDefaults.holeSameWinding)
const evenodd = ref(shapeDefaults.evenodd)
const shapeHighlight = ref(shapeDefaults.highlight)
const verticalArea = ref(shapeDefaults.verticalArea)
const horizontalArea = ref(shapeDefaults.horizontalArea)

const swapPaintOrder = ref(overlapDefaults.swapPaintOrder)
const overlapHighlight = ref(overlapDefaults.highlight)

const shapeHits = shallowRef<readonly PolygonHit[]>([])
const pathInfo = ref({ empty: true, length: 0 })
const snapshot = shallowRef<CompositionSnapshot<PolygonHit>>(emptySnapshot())

const shapeChart = markRaw(new PolygonShapeChart())
const overlapChart = markRaw(new PolygonOverlapChart())

const stopHit = shapeChart.onHit.on(next => shapeHits.value = next)
const stopAfterRender = shapeChart.onAfterRender.on(() => pathInfo.value = shapeChart.pathInfo())
const stopSnapshot = overlapChart.onSnapshot.on(next => snapshot.value = next)

watchEffect(() => shapeChart.setConfig({
  offsetX: offsetX.value,
  holeSameWinding: holeSameWinding.value,
  evenodd: evenodd.value,
  highlight: shapeHighlight.value,
  verticalArea: verticalArea.value,
  horizontalArea: horizontalArea.value,
}))

watchEffect(() => overlapChart.setConfig({
  swapPaintOrder: swapPaintOrder.value,
  highlight: overlapHighlight.value,
}))

onUnmounted(() => {
  stopHit()
  stopAfterRender()
  stopSnapshot()
})

function polygonLabel(hit: PolygonHit) {
  return hit.source === overlapChart.interactionA ? 'A' : 'B'
}

</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;

.debug-control.wide {
  flex: 1 1 260px;
}

h4 {
  margin: 24px 0 4px;
  color: #ffffffcc;
}
</style>
