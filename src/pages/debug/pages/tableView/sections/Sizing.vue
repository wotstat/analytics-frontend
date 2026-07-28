<template>
  <DebugSection title="Размеры контейнера и ресайз" id="sizing"
    description="Таблица занимает 100% родителя и следит за его размерами через ResizeObserver. Меняй высоту и ширину: строки должны досоздаваться сами, без прокрутки и dataDidUpdate."
    source="src/shared/uiKit/tableView/TableView.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">высота</span>
        <input type="range" v-model.number="height" min="0" max="420" step="10">
        <span class="debug-value">{{ height }} px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" v-model.number="width" min="90" max="900" step="10">
        <span class="debug-value">{{ full ? '100%' : `${width} px` }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">на всю ширину</span>
        <input type="checkbox" v-model="full">
      </label>

      <button class="debug-btn" @click="update">dataDidUpdate</button>
      <span class="debug-hint">строк в DOM: <span class="debug-value">{{ stats.scrollCells }} +
          {{ stats.fallbackCells }}</span></span>
    </div>

    <div class="debug-stage" ref="stage">
      <div class="box" :style="{ height: `${height}px`, width: full ? '100%' : `${width}px` }">
        <MiniTable ref="mini" :rows header="Секция" :height="28" />
      </div>
    </div>

    <p class="debug-note">
      Что должно произойти: увеличь высоту — строки досоздаются сами, полосы фона снизу не остаётся. За этим следит
      <span class="debug-value">ResizeObserver</span> на слое прокрутки: высоты строк от размеров контейнера не
      зависят, поэтому по ресайзу пересчитываются только видимый интервал и наличие прокрутки, без обхода набора и без
      вызовов делегата. Раньше наблюдателя не было вовсе, и до первой прокрутки или
      <span class="debug-value">dataDidUpdate</span> снизу висела пустота.
    </p>

    <p class="debug-note">
      Нулевая высота — рабочий случай, но особый: интервал считается для
      <span class="debug-value">top = bottom = 0</span>, и если первая строка начинается ниже нуля (то есть у секции
      есть заголовок), видимых строк нет вовсе — интервал возвращается пустым
      (<span class="debug-value">from > to</span>), в DOM не остаётся ни одной строки, а
      <span class="debug-value">scrollHeight</span> контента остаётся прежним. Отдельный случай тут не роскошь: те же
      <span class="debug-value">0 × 0</span> <span class="debug-value">ResizeObserver</span> сообщает и про
      <span class="debug-value">display: none</span>, а до правки на таком интервале материализовался
      <b>весь</b> набор строк. От высоты зависит и класс
      <span class="debug-value">has-scroll</span>: он включает <span class="debug-value">scrollbar-gutter: stable</span>
      у фолбэк-слоя, чтобы тот отступил от края ровно на ширину настоящего скроллбара. Теперь он переставляется и по
      ресайзу тоже — иначе слои разъезжались по горизонтали, пока не случится пересчёт.
    </p>

    <p class="debug-note">
      По ширине: <span class="debug-value">overflow-x: hidden</span> зашит в стили, горизонтальной прокрутки не будет
      никогда — узкий контейнер просто обрежет содержимое строки. Разбираться с этим должна сама ячейка
      (<span class="debug-value">min-width: 0</span> и многоточие), таблица тут не помогает. Проверь на 90 px.
    </p>

    <p class="debug-note">
      Родителю нужны явные размеры: у самой таблицы <span class="debug-value">height: 100%</span>, и в родителе с
      авто-высотой она схлопнется в ноль. <span class="debug-value">position: relative</span> компонент ставит себе
      сам, отдельного обёртывающего блока для этого не нужно.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import MiniTable from '../shared/MiniTable.vue'
import { useTableDomStats } from '../shared/useTableDomStats'

const rows = syntheticTableRows(300, 31)

const stage = useTemplateRef<HTMLElement>('stage')
const mini = useTemplateRef<InstanceType<typeof MiniTable>>('mini')

const height = ref(220)
const width = ref(420)
const full = ref(false)

const { stats } = useTableDomStats(stage)

function update() {
  mini.value?.dataDidUpdate()
}

</script>


<style scoped lang="scss">
.box {
  border: 1px solid var(--blue-color);
  box-sizing: border-box;
  max-width: 100%;
  transition: none;
}
</style>
