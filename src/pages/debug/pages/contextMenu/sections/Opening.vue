<template>
  <DebugSection title="Открытие: правый клик, программно, в точке" id="opening"
    description="Меню умеет цепляться либо к прямоугольнику элемента, либо к голой точке — и ведёт себя в этих случаях по-разному. Смотри, куда встаёт панель при разных alignX/alignY и что происходит у самых границ экрана."
    source="src/shared/uiKit/contextMenu/createContextMenu.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">alignX</span>
        <select v-model="alignX">
          <option v-for="value in alignXVariants" :key="value" :value="value">{{ value }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">alignY</span>
        <select v-model="alignY">
          <option v-for="value in alignYVariants" :key="value" :value="value">{{ value }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">minWidth</span>
        <input type="range" min="0" max="900" step="30" v-model.number="minWidth">
        <span class="debug-value">{{ minWidth || 'не задан' }}</span>
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="openByRect($event)">по DOMRect кнопки</button>
      <button class="debug-btn" :class="{ active: toggleOpen }" @click="openToggle($event)">тоггл (как в
        /install)</button>
      <button class="debug-btn" @click="openWithoutToggle($event)">без тоггла: кликни дважды</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">x</span>
        <input type="number" v-model.number="pointX">
      </label>

      <label class="debug-control">
        <span class="debug-label">y</span>
        <input type="number" v-model.number="pointY">
      </label>

      <button class="debug-btn" @click="openAtPoint({ x: pointX, y: pointY })">открыть в точке</button>
      <button class="debug-btn" @click="openAtPoint({ x: 0, y: 0 })">(0, 0)</button>
      <button class="debug-btn" @click="openAtPoint(cornerPoint())">правый нижний угол</button>
      <button class="debug-btn" @click="openAtPoint(centerPoint())">центр экрана</button>
    </div>

    <div class="debug-stage center short" @contextmenu.prevent="openAtEvent">
      <span class="debug-hint">правый клик по сцене — position: { x, y } из события</span>
    </div>

    <p class="debug-hint">Сетка целей: открытие по DOMRect с текущим alignX / alignY, клик или тап.</p>
    <EdgeTargets @open="({ element }) => openByElement(element)" />

    <p class="debug-hint">Скроллируемая сцена: открой меню на цели и покрути колесом внутри рамки.</p>
    <div class="debug-stage scroll">
      <div class="scroll-inner">
        <button class="debug-btn" @click="openByRect($event)" @contextmenu.prevent="openByRect($event)">
          цель внутри скролла
        </button>
      </div>
    </div>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Открой меню любым способом" />

    <p class="debug-note">
      <b>alignX и alignY работают только для DOMRect.</b> В панели выравнивание считается под условием
      <span class="debug-value">rect.width != 0</span>, а у точки ширина нулевая — меню уходит в ту же ветку, что и
      подменю: встаёт справа от точки и само переворачивается влево, если справа не хватает места. Так что для
      <span class="debug-value">position: { x, y }</span> оба align молча игнорируются. Проверяется парой «правый
      нижний угол» / «(0, 0)».
    </p>

    <p class="debug-note">
      <b>alignX: 'left' не прижимается к левому краю.</b> Для него есть только ограничение справа
      (<span class="debug-value">Math.min</span>), а <span class="debug-value">Math.max(PADDING, ...)</span> — как у
      'right' и 'center' — отсутствует. Поставь minWidth около 900 и открой меню на левой цели сетки (или сузь окно):
      панель уедет за левый край экрана, и часть строк станет недостижима. С alignX 'right' и 'center' на тех же
      настройках она остаётся в экране.
    </p>

    <p class="debug-note">
      <b>Позиция фиксируется один раз.</b> В отличие от Popover, меню не следит за целью: DOMRect снимается в момент
      вызова, поэтому при скролле страницы или сцены панель остаётся на месте в координатах вьюпорта и отрывается от
      цели. По вертикали она только прижимается к границе экрана с отступом 10 px.
    </p>

    <p class="debug-note">
      <b>Тоггл.</b> Кнопка повторяет боевой приём из /install: <span class="debug-value">isContextMenuOpen(id)</span>
      → <span class="debug-value">closeContextMenu(id)</span>. Работает он на тонкости: клик мимо и повторный клик по
      кнопке сначала запускают закрытие по <span class="debug-value">pointerdown</span>, но
      <span class="debug-value">currentContextMenu</span> обнуляется только через 90 мс (анимация исчезновения),
      поэтому в обработчике <span class="debug-value">click</span> меню ещё считается открытым. Кнопка
      «без тоггла» показывает вариант без этой проверки — меню мигает и открывается заново.
    </p>

    <p class="debug-note">
      <b>Пальцем.</b> Кнопки и сетка целей открывают меню по обычному тапу. Правый клик по сцене заменяется системным
      долгим тапом. Тоггл пальцем тоже надо проверить: на тач-устройстве между
      <span class="debug-value">pointerdown</span> и <span class="debug-value">click</span> проходит больше времени,
      и если закрытие успеет доиграть, повторный тап откроет меню заново вместо закрытия.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { closeContextMenu, currentContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, button, header, separator, childs, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import EdgeTargets from '../shared/EdgeTargets.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const alignXVariants = ['left', 'right', 'center'] as const
const alignYVariants = ['normal', 'bottom'] as const

const log = useEventLog({ max: 80 })
const alignX = ref<typeof alignXVariants[number]>('left')
const alignY = ref<typeof alignYVariants[number]>('bottom')
const minWidth = ref(0)
const pointX = ref(200)
const pointY = ref(300)

let toggleId = -1
const toggleOpen = computed(() => currentContextMenu.value?.id === toggleId)

function items(): SimpleContextMenuItem[] {
  return [
    header('Открытие'),
    button('Первая строка', () => log.push('выбрано: первая строка')),
    button('Вторая строка', () => log.push('выбрано: вторая строка')),
    separator,
    childs('Подменю', [button('Вложенная строка', () => log.push('выбрано: вложенная строка'))]),
  ]
}

function menuOptions(position: { x: number, y: number } | DOMRect) {
  return {
    position,
    alignX: alignX.value,
    alignY: alignY.value,
    minWidth: minWidth.value || undefined,
  }
}

function openByElement(element: HTMLElement) {
  log.push(`DOMRect: alignX=${alignX.value} alignY=${alignY.value}`)
  simpleContextMenu(menuOptions(element.getBoundingClientRect()), items())
}

function openByRect(event: MouseEvent) {
  openByElement(event.currentTarget as HTMLElement)
}

function openAtEvent(event: MouseEvent) {
  openAtPoint({ x: event.clientX, y: event.clientY })
}

function openAtPoint(point: { x: number, y: number }) {
  log.push(`точка: ${Math.round(point.x)}, ${Math.round(point.y)}`)
  simpleContextMenu(menuOptions(point), items())
}

function cornerPoint() {
  return { x: window.innerWidth - 2, y: window.innerHeight - 2 }
}

function centerPoint() {
  return { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) }
}

function openToggle(event: MouseEvent) {
  if (isContextMenuOpen(toggleId)) {
    log.push('тоггл: закрыто')
    closeContextMenu(toggleId)
    return
  }

  const element = event.currentTarget as HTMLElement
  const { id } = simpleContextMenu({ ...menuOptions(element.getBoundingClientRect()), closeOnAction: false }, items())
  toggleId = id
  log.push(`тоггл: открыто, id=${id}`)
}

function openWithoutToggle(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  log.push('открытие без тоггла')
  simpleContextMenu(menuOptions(element.getBoundingClientRect()), items())
}

</script>


<style scoped lang="scss">
.scroll-inner {
  height: 700px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
