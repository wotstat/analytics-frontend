<template>
  <DebugSection title="Крайние случаи выбора точки" id="line-point-edges"
    description="Четыре сценария, на которых поиск по исходным точкам расходится с наивным «найти ближайшую вершину пути»: разрыв, обрезанная область, децимация и совпадающие X."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource.ts">

    <div class="stages">
      <EdgeStage :chart="gapChart" title="Разрыв null"
        note="maxAxisDistance = 25 px. Веди курсор по разрыву: как только ближайшая по X точка окажется дальше порога, bucket отсекается целиком и не остаётся ни линии, ни маркера." />

      <EdgeStage :chart="boundsChart" title="Точки за render bounds"
        note="Область задана вручную уже данных: X 6…22, Y 380…700. Точки снаружи не участвуют в поиске вовсе — по обеим осям, поэтому «выпавшая» по Y точка не выигрывает и при поиске по X." />

      <EdgeStage :chart="denseChart" title="Точка, выброшенная децимацией" vertices :points-count="DENSE_COUNT"
        note="20 000 точек и монотонное сглаживание: в пути остаются считаные вершины. Поиск идёт по исходному массиву, поэтому pointIndex спокойно попадает в точку, которой в d нет." />

      <EdgeStage :chart="duplicateChart" title="Несколько одинаковых X"
        note="У точек 4, 5 и 6 одинаковый x = 4. Победивший bucket отдаёт их все: маркеров три, а вертикальная линия одна — она дедуплицирует одинаковую координату." />
    </div>

    <p class="debug-note">
      Разрыв и порог связаны: без <span class="debug-value">maxAxisDistance</span> одиночная линия всегда что-нибудь
      вернёт — ближайшая по X точка найдётся и через весь разрыв. Правило «линия с
      <span class="debug-value">null</span> в победившем X не подставляет соседнюю» на нескольких линиях сразу
      наблюдается в секции «Тултип и несколько линий» (пресет «null в победившем X»).
    </p>

    <p class="debug-note">
      Границы области — это <span class="debug-value">space.bounds</span> текущего кадра, а не данные плота. Значит
      зум и пан меняют набор точек-кандидатов прямо во время ховера, и точка, уехавшая за край, перестаёт
      выигрывать. Проверять это удобно в секции выше: там зум и пан включены.
    </p>

    <p class="debug-note">
      Децимация — главная причина, по которой поиск не должен идти по вершинам отрисованного пути. Сглаживание и
      выброс вершин меняют картинку, но не меняют набор значений, доступных тултипу. Обратное решение дало бы
      «прыгающий» тултип, который на плотных данных показывает не то, что лежит в массиве.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import EdgeStage from './EdgeStage.vue'
import { LinePointsChart } from '../../shared/LinePointsChart'
import { densePoints, duplicateXPoints, gapPoints, wavePoints } from '../../shared/linePoints'

const DENSE_COUNT = 20_000

const gapChart = markRaw(new LinePointsChart({
  points: gapPoints(),
  config: { maxAxisDistance: 25 },
}))

const boundsChart = markRaw(new LinePointsChart({ points: wavePoints(28) }))
boundsChart.setRenderBounds({ minX: 6, maxX: 22, minY: 380, maxY: 700 })

const denseChart = markRaw(new LinePointsChart({ points: densePoints(DENSE_COUNT) }))

const duplicateChart = markRaw(new LinePointsChart({
  points: duplicateXPoints(),
  smoothingMethod: 'smooth',
}))

</script>


<style scoped lang="scss">
.stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5em;
}
</style>
