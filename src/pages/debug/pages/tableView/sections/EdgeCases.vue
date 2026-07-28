<template>
  <DebugSection title="Крайние случаи" id="edge-cases"
    description="Шесть мелких таблиц, каждая — свой край. Ни одна не должна падать; две последние показывают, что бывает, когда объявленная высота расходится с реальной."
    source="src/pages/debug/pages/tableView/shared/MiniTable.vue">

    <div class="cases">
      <div class="debug-col case">
        <span class="debug-label">0 секций: numberOfSections → 0</span>
        <div class="debug-stage box">
          <MiniTable :rows="[]" noSections />
        </div>
        <p class="debug-hint">Пусто и без ошибок в консоли. Интервал секций приходит как
          <span class="debug-value">[-1, -1]</span>, отступ обёртки при этом ноль (раньше в стиль уезжало
          <span class="debug-value">undefinedpx</span>).
        </p>
      </div>

      <div class="debug-col case">
        <span class="debug-label">Секция есть, строк нет</span>
        <div class="debug-stage box">
          <MiniTable :rows="[]" header="Заголовок без строк" />
        </div>
        <p class="debug-hint">Заголовок рисуется, строк нет. Высоты «первой» и «последней» строки для пустой секции
          считаются нулевыми — иначе они брались бы по чужим индексам (см. <a href="#sections">секции</a>).</p>
      </div>

      <div class="debug-col case">
        <span class="debug-label">Одна строка</span>
        <div class="debug-stage box">
          <MiniTable :rows="oneRow" header="Одна строка" />
        </div>
        <p class="debug-hint">Прокрутки нет, класс <span class="debug-value">has-scroll</span> не выставляется.</p>
      </div>

      <div class="debug-col case">
        <span class="debug-label">Очень длинный текст без обрезки</span>
        <div class="debug-stage box">
          <MiniTable :rows="longRows" header="clip: false" :clip="false" />
        </div>
        <p class="debug-hint">Текст переносится и вылезает за высоту, объявленную делегатом: строки наезжают друг на
          друга. Обрезку решает только ячейка.</p>
      </div>

      <div class="debug-col case">
        <span class="debug-label">Строки разной высоты — поддерживаются</span>
        <div class="debug-stage box">
          <MiniTable :rows="rows" header="26 / 38 / 50 / 62 px" vary />
        </div>
        <p class="debug-hint"><span class="debug-value">heightForCellByIndex</span> получает
          <span class="debug-value">IndexPath</span>, смещения считаются по каждой строке — разная высота законна.
        </p>
      </div>

      <div class="debug-col case">
        <span class="debug-label">Заявленная высота ≠ реальная</span>
        <div class="debug-stage box">
          <MiniTable :rows="rows" header="делегат врёт: всегда 30 px" vary lie />
        </div>
        <p class="debug-hint">Реальные высоты те же 26–62 px, но делегат сообщает 30. Строки уезжают за границу
          секции, а нижние становятся недостижимыми прокруткой.</p>
      </div>
    </div>

    <p class="debug-note">
      Высота — единственная вещь, которую таблица берёт на веру:
      <span class="debug-value">getBoundingClientRect</span> она не зовёт нигде. Поэтому объявленное число обязано
      совпадать с реальной CSS-высотой корня строки, включая паддинги и рамки (у дефолтных строк —
      <span class="debug-value">border-box</span> не задан, считать надо самому). Ошибка в один пиксель на строку
      превращается в тысячу пикселей расхождения на тысяче строк.
    </p>

    <p class="debug-note">
      Ещё один край, который видно только в чужом коде: если не передать
      <span class="debug-value">backgroundColor</span> и не задать <span class="debug-value">--background-color</span>
      снаружи, фон строк и секций возьмётся из фолбэка в стилях — пурпурного
      <span class="debug-value">#900071</span>. Это отладочный цвет, оставленный в
      <span class="debug-path">reusableTable.scss</span>; на страницах он не виден только потому, что переменная
      объявлена глобально в <span class="debug-path">styles/index.scss</span>.
    </p>

    <p class="debug-note">
      Пальцем: у <span class="debug-value">.scroll</span> выставлен
      <span class="debug-value">overscroll-behavior: contain</span>, поэтому докрутив таблицу до края, страница за ней
      тянуться не должна — ни на iOS, ни на Android. Проверять на всех шести таблицах, включая пустые: у пустой
      прокрутки нет вовсе, и жест должен уходить странице.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import MiniTable from '../shared/MiniTable.vue'

const rows = syntheticTableRows(40, 37)
const oneRow = rows.slice(0, 1)

// Длинный текст собираем из тех же фикстур, чтобы не заводить отдельные данные.
const longRows = rows.slice(0, 6).map(row => ({ ...row, name: `${row.name} `.repeat(12).trim() }))

</script>


<style scoped lang="scss">
.cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.75em 1em;
  align-items: start;
}

.case {
  gap: 0.4em;
}

.box {
  padding: 0.4em;
  height: 170px;
  box-sizing: border-box;
}
</style>
