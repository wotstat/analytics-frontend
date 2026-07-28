<template>
  <DebugSection title="Вложенные подменю и края экрана" id="nested"
    description="Подменю раскрывается по наведению с задержкой. Крути глубину и открывай меню у краёв сетки: подменю обязано открыться в другую сторону, а не уехать за экран. Флипнувшаяся ветка должна остаться в той же стороне до самого низа."
    source="src/shared/uiKit/contextMenu/ContextMenuPanel.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">глубина</span>
        <input type="range" min="1" max="6" v-model.number="depth">
        <span class="debug-value">{{ depth }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">строк в подменю</span>
        <input type="range" min="1" max="12" v-model.number="rows">
        <span class="debug-value">{{ rows }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">широкие подписи</span>
        <input type="checkbox" v-model="wide">
      </label>

      <label class="debug-control">
        <span class="debug-label">пустое подменю</span>
        <input type="checkbox" v-model="withEmpty">
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="openInfinite($event)">бесконечная вложенность</button>
      <button class="debug-btn" @click="openRawEmptyChild($event)">пустое подменю (raw API)</button>
      <span class="debug-hint">
        у бесконечного меню подменю ссылается на собственный список — items() ленивая, уровни считаются при открытии
      </span>
    </div>

    <div class="debug-stage center short" @contextmenu.prevent="openAtPoint">
      <span class="debug-hint">правый клик по сцене — спокойная проверка раскрытия</span>
    </div>

    <p class="debug-hint">Сетка целей: правый клик или тап по любой из девяти — проверка флипа у границ.</p>
    <EdgeTargets @open="({ event }) => openAtPoint(event)" />

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Дойди по подменю до кнопки" />

    <p class="debug-note">
      <b>Задержки.</b> Подменю открывается через 150 мс после наведения и не закрывается сразу: если курсор
      двинулся в сторону уже открытой панели, закрытие откладывается на 500 мс (направление проверяется лучом по её
      прямоугольнику, расширенному на 10 px). Поэтому диагональный ход мыши к подменю через соседние строки не должен
      его схлопывать. Если курсор замер на 200 мс — подменю переключается на строку под курсором. Проверять надо
      именно движением: быстрый проезд вдоль меню не должен открывать ничего лишнего.
    </p>

    <p class="debug-note">
      <b>Направление наследуется.</b> Флип решается в каждой панели отдельно, но <span class="debug-value">direction
      </span> передаётся вниз: как только ветка ушла влево, её дети тоже идут влево. Родительская строка при открытом
      подменю остаётся подсвеченной синим, а подсветка гаснет до серой, когда указатель ушёл в подменю
      (<span class="debug-value">isActive</span>).
    </p>

    <p class="debug-note">
      <b>Пустое подменю.</b> В <span class="debug-value">simpleContextMenu</span> ветка с пустым
      <span class="debug-value">items</span> вырождается в обычную кнопку без стрелки (проверка
      <span class="debug-value">items.length !== 0</span>), а тот же случай в raw API оставляет стрелку и открывает
      пустую панель — сравни тумблер «пустое подменю» с кнопкой «пустое подменю (raw API)». Отключённая ветка
      (<span class="debug-value">disabled</span>) не раскрывается вообще; у хелпера
      <span class="debug-value">childs()</span> параметра disabled нет, поэтому она задана объектным литералом.
    </p>

    <p class="debug-note">
      <b>Пальцем.</b> Наведения нет, поэтому подменю открывается по тапу на строку (браузер присылает
      <span class="debug-value">mouseenter</span> перед тапом), но закрыть его тапом по родительской строке нельзя —
      только выбрать другую ветку или закрыть меню целиком. Луч-проверка на тач-устройстве не работает вовсе:
      указатель прыгает, а не движется.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { createContextMenu, ContextMenuItemVariant, type ContextMenuItem } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, button, childs, header, separator, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import EdgeTargets from '../shared/EdgeTargets.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const WIDE_SUFFIX = ' — подпись пошире, чтобы панель не влезала в край'

const log = useEventLog({ max: 80 })
const depth = ref(3)
const rows = ref(3)
const wide = ref(false)
const withEmpty = ref(false)

function label(text: string) {
  return wide.value ? text + WIDE_SUFFIX : text
}

function level(current: number): SimpleContextMenuItem[] {
  const items: SimpleContextMenuItem[] = [
    header(`Уровень ${current}`),
    ...Array.from({ length: rows.value }, (_, index) => {
      const name = `${current}.${index + 1}`
      return button(label(`Строка ${name}`), () => log.push(`выбрано: ${name}`))
    }),
  ]

  if (withEmpty.value) {
    items.push(separator)
    items.push(childs('Пустое подменю (simple)', []))
    items.push({
      label: 'Отключённое подменю',
      disabled: true,
      items: [button('Не должно открыться', () => log.push('открылось отключённое подменю'))],
    })
  }

  if (current < depth.value) {
    items.push(separator)
    items.push(childs(label(`Уровень ${current + 1}`), level(current + 1)))
  }

  return items
}

function openAtPoint(event: MouseEvent) {
  simpleContextMenu({ position: { x: event.clientX, y: event.clientY } }, level(1))
}

function openRawEmptyChild(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  createContextMenu({ position: element.getBoundingClientRect(), alignY: 'bottom' }, [
    { type: ContextMenuItemVariant.Header, label: 'raw API' },
    { type: ContextMenuItemVariant.Child, label: 'Пустое подменю', items: () => [] },
  ])
}

function infiniteItems(): ContextMenuItem[] {
  return [
    { type: ContextMenuItemVariant.Header, label: 'Дальше только вниз' },
    { type: ContextMenuItemVariant.Button, label: 'Кнопка', action: () => log.push('бесконечное: кнопка') },
    { type: ContextMenuItemVariant.Child, label: 'Ещё уровень', items: infiniteItems },
  ]
}

function openInfinite(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  createContextMenu({ position: element.getBoundingClientRect(), alignY: 'bottom' }, infiniteItems())
}

</script>
