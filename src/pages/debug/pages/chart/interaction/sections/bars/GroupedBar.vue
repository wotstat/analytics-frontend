<template>
  <DebugSection title="Grouped Bar: contains, gap policy и related" id="grouped-bar"
    description="bar.interaction.contains() считает попадание математически, по layout-прямоугольникам плота, а не по SVG-пути. Категория берётся прямо из X-координаты, поэтому перебора категорий на кадр нет: layout считается только для той, где стоит курсор, и для тех, что попросил related()."
    source="src/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource.ts">

    <BarStage strategy="grouped" />

    <p class="debug-note">
      <b>Два прямоугольника на сегмент.</b> <span class="debug-value">rect</span> — то, что реально нарисовано,
      <span class="debug-value">slotRect</span> — полный слот вместе с половинами соседних inner gap. При
      <span class="debug-value">gaps: 'miss'</span> зоной служит <span class="debug-value">rect</span>, поэтому
      промежуток между столбцами не интерактивен; при <span class="debug-value">gaps: 'nearest'</span> — слот, и
      соседние зоны встречаются ровно в середине gap. Нижняя таблица считает это числами: «граница слотов» обязана
      совпадать с «серединой gap» с точностью до float.
    </p>

    <p class="debug-note">
      <b>Внешний padding управляется отдельно.</b> Слоты тайлят visual group и наружу неё не выходят:
      сравни «ячейка категории по X» с «visual group» — разница и есть padding, где
      <span class="debug-value">contains()</span> по умолчанию ничего не находит. Увеличь
      <span class="debug-value">padding группы</span> и води курсором у краёв ячейки: строка selection пустеет.
      Галочка «nearest между группами» превращает всю ячейку в hit zone ближайшей группы независимо от
      внутренней настройки <span class="debug-value">gaps</span>.
    </p>

    <p class="debug-note">
      <b>Скругления не создают мёртвых зон.</b> Поставь <span class="debug-value">radius</span> в 20–40 px и наведи
      курсор точно в угол столбца, за дугу: <span class="debug-value">contains</span> всё равно «да». Hit-геометрия —
      весь прямоугольник, вырезы скруглений в ней не участвуют, и SVG-путь для этого не опрашивается.
    </p>

    <p class="debug-note">
      <b>Ноль, пропуск, NaN и ±Infinity.</b> В пресете со сбоями таблица зон показывает исходное значение каждого
      датасета рядом с наличием item. Нулевой bar item имеет: он лежит в layout с вырожденной геометрией на baseline,
      приходит в <span class="debug-value">related('group')</span>, но <span class="debug-value">contains()</span> его
      не находит — навести курсор на нулевую высоту нельзя. У пропущенного индекса, NaN и ±Infinity item нет вовсе.
    </p>

    <p class="debug-note">
      <b>Подсветка item и датасета одновременно.</b> Включи обе: наведённый столбец получает оба класса сразу, и это
      видно в строке «классы на hovered bar». <span class="debug-value">related('dataset')</span> отдаёт item hits, а не
      родительский <span class="debug-value">&lt;g class="dataset"&gt;</span>, поэтому класс стоит на каждом
      <span class="debug-value">path</span> датасета — счётчик показывает, сколько именно, и отдельно проверяет, что на
      <span class="debug-value">g.dataset</span> классов подсветки ноль.
    </p>

    <p class="debug-note">
      <b>Culling — не источник истины.</b> Включи «обрезать область»: часть категорий уходит за render bounds и
      <span class="debug-value">renderImpl</span> их пропускает, у их path пустой <span class="debug-value">d</span>.
      <span class="debug-value">related('dataset')</span> при этом продолжает возвращать все категории датасета — у них
      валидная математическая геометрия и существующий target. Отсутствие layout-записи означало бы «не отрисовано», а
      не «item не существует».
    </p>

    <p class="debug-note">
      <b>Geometry scope.</b> Колонка «geometry group» — это <span class="debug-value">geometryFor('group')</span> того же
      item hit: полный visual X-range группы против диапазона самого столбца в «geometry item».
      <span class="debug-value">related()</span> geometry scope не меняет — это независимые операции: одна отвечает,
      какие данные вернуть, вторая — какой диапазон рисовать.
    </p>

    <p class="debug-note">
      <b>hitArea: geometry vs vertical.</b> По умолчанию <span class="debug-value">hitArea: 'geometry'</span> —
      попадание считается только по факту прямоугольника, как раньше. У grouped переключение на
      <span class="debug-value">'vertical'</span> растягивает и <span class="debug-value">contains()</span>, и
      <span class="debug-value">containsGroup()</span> на всю высоту layout: наводить можно выше и ниже столбца, а X
      остаётся прежним (<span class="debug-value">rect</span> при <span class="debug-value">miss</span>,
      <span class="debug-value">slotRect</span> при <span class="debug-value">nearest</span>). Переключи режим и води
      курсором над пустым местом над самым высоким столбцом — строка селекции появляется только в
      <span class="debug-value">vertical</span>.
    </p>

    <p class="debug-note">
      <b>setData поверх ховера.</b> Кнопка «setData заново» переустанавливает те же данные, не уводя курсор.
      Классы <span class="debug-value">bar</span> и классы датасета выставляются через
      <span class="debug-value">classList</span> адресно, поэтому классы, наложенные
      <span class="debug-value">Highlight</span>, остаются на месте: строка «классы на hovered bar» не теряет
      <span class="debug-value">bar-item-highlighted</span>. С прежним <span class="debug-value">setAttribute('class')</span>
      класс исчезал бы, а diff подсветки продолжал считать его наложенным.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import BarStage from './BarStage.vue'

</script>
