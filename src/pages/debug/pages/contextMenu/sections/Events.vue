<template>
  <DebugSection title="Лог событий и состояние" id="events"
    description="В API меню нет ни колбэка выбора, ни колбэка закрытия. Тут собрано всё, что можно узнать снаружи: action у строк и watch на currentContextMenu. Таблица показывает глобальное состояние — в неё попадает любое меню, открытое с этой страницы."
    source="src/shared/uiKit/contextMenu/ContextMenuRoot.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">closeOnAction</span>
        <input type="checkbox" v-model="closeOnAction">
      </label>

      <label class="debug-control">
        <span class="debug-label">actionOnPointerUp</span>
        <input type="checkbox" v-model="actionOnPointerUp">
      </label>

      <button class="debug-btn" @click="openMenu($event)">открыть меню</button>
      <button class="debug-btn" @click="closeFromHandle">close() из результата</button>
      <button class="debug-btn" @click="closeGlobal">closeContextMenu()</button>
    </div>

    <div class="debug-stage center short" @contextmenu.prevent="openAtPoint">
      <span class="debug-hint">
        правый клик по сцене; для press-drag-release зажми правую кнопку, уведи курсор на строку и отпусти
      </span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>состояние</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>isContextMenuOpen()</th>
          <td :class="String(isOpen)">{{ isOpen }}</td>
        </tr>
        <tr>
          <th>currentContextMenu.id</th>
          <td>{{ menu?.id ?? '—' }}</td>
        </tr>
        <tr>
          <th>строк в меню</th>
          <td>{{ menu?.items.length ?? '—' }}</td>
        </tr>
        <tr>
          <th>options.position</th>
          <td>{{ positionText }}</td>
        </tr>
        <tr>
          <th>options.closeOnAction</th>
          <td :class="String(menu?.options.closeOnAction)">{{ menu?.options.closeOnAction ?? '—' }}</td>
        </tr>
        <tr>
          <th>options.actionOnPointerUp</th>
          <td :class="String(menu?.options.actionOnPointerUp)">{{ menu?.options.actionOnPointerUp ?? '—' }}</td>
        </tr>
        <tr>
          <th>options.alignX / alignY</th>
          <td>{{ menu?.options.alignX ?? '—' }} / {{ menu?.options.alignY ?? '—' }}</td>
        </tr>
      </tbody>
    </table>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Открой меню и выбери строку" />

    <p class="debug-note">
      <b>Закрытие наблюдается только через watch.</b> Причину закрытия узнать нельзя: Escape, клик мимо, выбор строки
      и <span class="debug-value">closeContextMenu()</span> дают ровно одно и то же — обнуление
      <span class="debug-value">currentContextMenu</span>. В логе видно, что при выборе строки сначала приходит
      действие, а закрытие — на 150 мс позже (пауза на подсветку). Ещё 90 мс уходит на анимацию исчезновения, то есть
      от клика до реального обнуления проходит ~240 мс.
    </p>

    <p class="debug-note">
      <b>actionOnPointerUp — это press-drag-release.</b> При открытии меню Root смотрит, нажат ли указатель. Если да
      (обычный случай для <span class="debug-value">contextmenu</span>), выбор по отпусканию включается либо через
      400 мс, либо раньше — как только указатель сместится на 10 px. Поэтому: зажать правую кнопку, увести курсор на
      строку и отпустить — строка выберется; отпустить сразу и не двигаясь — меню просто останется открытым, и дальше
      работает обычный клик. С выключенным <span class="debug-value">actionOnPointerUp</span> выбор всегда по
      <span class="debug-value">click</span>. Разница видна только по логу.
    </p>

    <p class="debug-note">
      <b>Escape и клик мимо</b> закрывают меню, но в docs это не описано: Escape ловится слушателем на
      <span class="debug-value">document</span> в фазе всплытия и гасится через
      <span class="debug-value">stopPropagation</span> — до слушателей на <span class="debug-value">window</span> он
      не дойдёт, а вот другие слушатели на самом document его всё равно получат. Клик мимо — это
      <span class="debug-value">pointerdown</span> вне <span class="debug-value">#context-menu-root</span>, то есть
      меню закрывается ещё до отпускания кнопки.
    </p>

    <p class="debug-note">
      <b>Пальцем.</b> Тапом мимо меню закрывается так же. Escape проверить нечем, а press-drag-release на тач-экране
      превращается в «долгий тап → провести пальцем до строки → отпустить»: этот жест стоит прогнать отдельно, он
      самый хрупкий.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { closeContextMenu, currentContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, button, checkboxItem, childs, header, separator, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import { useCheckbox } from '@/shared/uiKit/contextMenu/composition'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'

const log = useEventLog()
const flag = useCheckbox(false)
const closeOnAction = ref(true)
const actionOnPointerUp = ref(true)

const menu = computed(() => currentContextMenu.value)
const isOpen = computed(() => isContextMenuOpen())

let handleClose: (() => void) | null = null

const positionText = computed(() => {
  const position = menu.value?.options.position
  if (!position) return '—'

  if (position instanceof DOMRect)
    return `DOMRect(${Math.round(position.x)}, ${Math.round(position.y)}, ${Math.round(position.width)}, ${Math.round(position.height)})`

  return `{ x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }`
})

watch(currentContextMenu, (value, previous) => {
  if (value) log.push(`меню открыто: id=${value.id}, строк ${value.items.length}`)
  else log.push(`меню закрыто${previous ? `: id=${previous.id}` : ''}`)
})

function items(): SimpleContextMenuItem[] {
  return [
    header('События'),
    button('Первая строка', () => log.push('action: первая строка')),
    button('Вторая строка', () => log.push('action: вторая строка')),
    { label: 'Отключённая строка', disabled: true, action: () => log.push('action: этого быть не должно') },
    separator,
    checkboxItem('Чекбокс', flag),
    childs('Подменю', [button('Вложенная строка', () => log.push('action: вложенная строка'))]),
  ]
}

function menuOptions(position: { x: number, y: number } | DOMRect) {
  return {
    position,
    closeOnAction: closeOnAction.value,
    actionOnPointerUp: actionOnPointerUp.value,
  }
}

function openMenu(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  const handle = simpleContextMenu({ ...menuOptions(element.getBoundingClientRect()), alignY: 'bottom' }, items())
  handleClose = handle.close
}

function openAtPoint(event: MouseEvent) {
  const handle = simpleContextMenu(menuOptions({ x: event.clientX, y: event.clientY }), items())
  handleClose = handle.close
}

function closeFromHandle() {
  log.push('close() из результата последнего открытия')
  handleClose?.()
}

function closeGlobal() {
  log.push('closeContextMenu() без id')
  closeContextMenu()
}

</script>
