<template>
  <DebugSection title="Stacked Bar: сегменты, знаки и inner gap" id="stacked-bar"
    description="У стека все сегменты категории делят один X-диапазон, а gap policy работает по вертикали. Положительная и отрицательная части — независимые стеки от одной нулевой оси, поэтому проверять их нужно и по отдельности, и вместе."
    source="src/shared/uiKit/chart/universalChart/plot/bar/Bar.ts">

    <BarStage strategy="stacked" />

    <p class="debug-note">
      <b>Почему у стека обязательно два прямоугольника.</b> Рендер режет сегмент под inner gap и рисует уже урезанный
      диапазон, поэтому <span class="debug-value">gaps: 'miss'</span> обязан работать по
      <span class="debug-value">rect</span> — иначе попадал бы внутрь промежутка, где ничего не нарисовано.
      <span class="debug-value">slotRect</span> — полный математический слот сегмента до вычета gap; соседние слоты
      стыкуются в точке, где стек переходит от одного значения к следующему, то есть ровно посередине gap. Таблица
      стыков считает это по Y.
    </p>

    <p class="debug-note">
      <b>Положительные, отрицательные и смешанные.</b> Переключай пресеты: отрицательный стек растёт вниз от нулевой
      оси теми же формулами, знаки не смешиваются в один стек. В смешанном пресете у одной категории есть обе части,
      и стык на baseline виден отдельной строкой с нулевым промежутком — там сегменты соприкасаются без gap.
    </p>

    <p class="debug-note">
      <b>Ноль в стеке.</b> Нулевой сегмент не входит ни в положительный, ни в отрицательный стек, но item существует:
      вырожденная геометрия на baseline, полный X-диапазон группы, пустой <span class="debug-value">d</span> у target.
      Он приходит в <span class="debug-value">related('group')</span> вместе с остальными и не находится через
      <span class="debug-value">contains()</span>.
    </p>

    <p class="debug-note">
      <b>Радиусы.</b> <span class="debug-value">radius</span> применяется к внешним углам стека,
      <span class="debug-value">innerRadius</span> — к стыкам сегментов внутри него. На hit-геометрию ни то, ни другое
      не влияет: contains считается по прямоугольнику целиком, поэтому крупные скругления мёртвых зон не создают.
    </p>

    <p class="debug-note">
      <b>hitArea: vertical у стека работает только на уровне группы.</b> Сегменты стека делят один X-диапазон, поэтому
      вертикальная полоса на отдельный сегмент неотличима бы от полосы на всю категорию — у stacked
      <span class="debug-value">hitArea: 'vertical'</span> не меняет <span class="debug-value">contains()</span>
      вовсе, сегменты по-прежнему отвечают только по реальной геометрии. Расширяется только
      <span class="debug-value">containsGroup()</span>: её зона и geometry растягиваются на всю высоту layout, и
      таблица ниже основной показывает строку даже над самым верхним сегментом или под самым нижним, пока
      <span class="debug-value">contains()</span> above молчит.
    </p>

    <p class="debug-note">
      <b>Точный target сегмента.</b> Подсветка датасета вешает класс на каждый сегмент этого датасета во всех
      категориях, подсветка группы — на все сегменты наведённой категории. Счётчик «из N» показывает, что классы
      лежат на самих <span class="debug-value">path</span>, а не на общем
      <span class="debug-value">&lt;g class="dataset"&gt;</span>, а строка «классы на hovered bar» — что item- и
      dataset-класс уживаются на одном элементе.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import BarStage from './BarStage.vue'

</script>
