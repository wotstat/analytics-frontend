<template>
  <DebugSection title="Чекмарки и взаимоисключающие группы" id="checkmarks"
    description="Выключи closeOnAction и щёлкай отметки в открытом меню: галочки обязаны переключаться на месте, а таблица снизу — сходиться с ними. Одна строка сделана нарочно неправильно и не обновляется, пока меню не переоткрыть."
    source="src/shared/uiKit/contextMenu/composition.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="openMenu($event)">открыть меню</button>

      <label class="debug-control">
        <span class="debug-label">closeOnAction</span>
        <input type="checkbox" v-model="closeOnAction">
      </label>

      <label class="debug-control">
        <span class="debug-label">иконки у группы</span>
        <input type="checkbox" v-model="withIcon">
      </label>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>источник значения</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>useCheckbox — «Сетка»</th>
          <td :class="String(gridValue)">{{ gridValue }}</td>
        </tr>
        <tr>
          <th>useCheckbox — «Подписи»</th>
          <td :class="String(labelsValue)">{{ labelsValue }}</td>
        </tr>
        <tr>
          <th>обычный ref</th>
          <td :class="String(smooth)">{{ smooth }}</td>
        </tr>
        <tr>
          <th>статический boolean (сломано нарочно)</th>
          <td :class="String(broken)">{{ broken }}</td>
        </tr>
        <tr>
          <th>группа: mode</th>
          <td>{{ mode }}</td>
        </tr>
      </tbody>
    </table>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Пощёлкай отметки" />

    <p class="debug-note">
      <b>Живое обновление.</b> Строка «Статический boolean» получает
      <span class="debug-value">checkbox: broken.value</span> — то есть уже развёрнутое значение. Панель читает его
      через <span class="debug-value">toValue</span> один раз, реактивной связи нет: в таблице значение меняется, а
      галочка в открытом меню — нет. Все остальные строки получают ref или computed и переключаются на месте.
    </p>

    <p class="debug-note">
      <b>undefined ≠ false.</b> <span class="debug-value">checkbox: undefined</span> убирает галочку вместе с местом
      под неё, <span class="debug-value">false</span> рисует её скрытой и место сохраняет. Поэтому в меню со
      смешанными строками отметки выравниваются только если у всех строк поле checkbox задано.
    </p>

    <p class="debug-note">
      <b>Взаимоисключающая группа — это просто чекбоксы.</b> Никакой radio-семантики в API нет:
      <span class="debug-value">options()</span> и <span class="debug-value">childOptions()</span> делают строки с
      <span class="debug-value">computed(() =&gt; value === key)</span> и действием, которое ставит своё значение.
      Ничто не мешает получить две отметки сразу, если писать такие строки руками. Обрати внимание: у
      <span class="debug-value">childOptions</span> иконка ставится на родительскую строку подменю, а у
      <span class="debug-value">options</span> — на каждый вариант; тумблер «иконки у группы» это показывает.
    </p>

    <p class="debug-note">
      <b>Как передавать useCheckbox.</b> В <span class="debug-value">checkboxItem</span> нужно отдавать весь объект
      <span class="debug-value">{ value, toggle }</span>. Если передать только <span class="debug-value">.value</span>,
      хелпер уйдёт в ветку для <span class="debug-value">Ref&lt;boolean&gt;</span> и попытается писать в него, а
      <span class="debug-value">useCheckbox</span> возвращает <span class="debug-value">readonly</span> — получишь
      предупреждение Vue и молча неработающую галочку.
    </p>

    <p class="debug-note">
      <b>closeOnAction.</b> По умолчанию <span class="debug-value">true</span>: после выбора меню закрывается с
      задержкой 150 мс, чтобы успела мигнуть подсветка строки. Для меню-настроек, где щёлкают несколько галочек
      подряд, нужен <span class="debug-value">false</span> — так сделано в единственном боевом вызове
      (<span class="debug-path">src/pages/install/components/cardIntaractionControl.ts</span>).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { simpleContextMenu, button, checkboxItem, childOptions, header, options, separator, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import { useCheckbox } from '@/shared/uiKit/contextMenu/composition'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import DotIcon from '../shared/assets/dot.svg?component'

const modes = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
] as const

type Mode = typeof modes[number]['key']

const log = useEventLog({ max: 80 })
const grid = useCheckbox(true)
const labels = useCheckbox(false)
const gridValue = grid.value
const labelsValue = labels.value
const smooth = ref(false)
const broken = ref(false)
const mode = ref<Mode>('week')
const closeOnAction = ref(false)
const withIcon = ref(false)

function items(): SimpleContextMenuItem[] {
  const icon = withIcon.value ? DotIcon : undefined

  return [
    header('useCheckbox'),
    checkboxItem('Сетка', grid),
    checkboxItem('Подписи', labels),
    separator,
    header('обычный ref'),
    checkboxItem('Сглаживание', smooth),
    separator,
    header('нарочно сломано'),
    {
      label: 'Статический boolean',
      checkbox: broken.value,
      action: () => {
        broken.value = !broken.value
        log.push(`статический boolean → ${broken.value}`)
      },
    },
    separator,
    header('группа: options()'),
    ...options(mode, modes.map(m => ({ key: m.key, label: m.label })), icon),
    separator,
    childOptions('та же группа в подменю', mode, modes.map(m => ({ key: m.key, value: m.label })), icon),
    separator,
    button('Строка вообще без отметки', () => log.push('строка без отметки')),
  ]
}

function openMenu(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  simpleContextMenu({
    position: element.getBoundingClientRect(),
    alignY: 'bottom',
    closeOnAction: closeOnAction.value,
  }, items())
}

</script>
