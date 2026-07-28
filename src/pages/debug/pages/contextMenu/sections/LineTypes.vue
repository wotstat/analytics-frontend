<template>
  <DebugSection title="Типы строк: Button, Header, Separator, Child" id="line-types"
    description="Правый клик (или тап) по сцене открывает меню из всех четырёх типов строк. Крути тумблеры и смотри на выравнивание подписей, на подсветку под курсором и на то, во что превращается меню без строк."
    source="src/shared/uiKit/contextMenu/lines/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">иконка</span>
        <select v-model="icon">
          <option v-for="variant in iconVariants" :key="variant.value" :value="variant.value">{{ variant.label }}
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">чекмарки у части строк</span>
        <input type="checkbox" v-model="withCheckmarks">
      </label>

      <label class="debug-control">
        <span class="debug-label">disabled у части строк</span>
        <input type="checkbox" v-model="withDisabled">
      </label>

      <label class="debug-control">
        <span class="debug-label">длинная подпись</span>
        <input type="checkbox" v-model="withLongLabel">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">кнопок</span>
        <input type="range" min="0" max="40" v-model.number="count">
        <span class="debug-value">{{ count }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">заголовки</span>
        <input type="checkbox" v-model="withHeaders">
      </label>

      <label class="debug-control">
        <span class="debug-label">closeOnAction</span>
        <input type="checkbox" v-model="closeOnAction">
      </label>
    </div>

    <div class="debug-row">
      <span class="debug-hint">вырожденные меню:</span>
      <button class="debug-btn" @click="openDegenerate($event, [])">пустое (items: [])</button>
      <button class="debug-btn" @click="openDegenerate($event, onlySeparators())">только разделители</button>
      <button class="debug-btn" @click="openDegenerate($event, onlyHeaders())">только заголовки</button>
      <button class="debug-btn" @click="openDegenerate($event, emptyLabels())">пустые подписи</button>
      <button class="debug-btn" @click="openEmptyHeader($event)">header('') в simpleContextMenu</button>
    </div>

    <div class="debug-stage center short" @contextmenu.prevent="openMenu">
      <span class="debug-hint">правый клик по сцене</span>
    </div>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Выбери строку" />

    <p class="debug-note">
      <b>Выравнивание.</b> Место под галочку резервируется только у строк, где
      <span class="debug-value">checkbox</span> не <span class="debug-value">undefined</span>: при
      <span class="debug-value">false</span> галочка рисуется скрытой и место занимает. Строки-подменю получают
      компенсирующий отступ через класс <span class="debug-value">.some-element-has-checkbox</span> на панели, а
      обычные кнопки <b>без</b> checkbox — нет. Включи «чекмарки у части строк»: подписи кнопок без отметки окажутся
      левее остальных.
    </p>

    <p class="debug-note">
      <b>Header и Separator не интерактивны.</b> Класс <span class="debug-value">.hover</span> ставится на обёртку
      строки, но красит только вложенный <span class="debug-value">.hover-highlight</span>, которого у заголовка и
      разделителя нет — под курсором они не подсвечиваются и на клик не реагируют. Так и задумано, но проверить стоит:
      подсветка не должна «проскакивать» через них при движении мышью вдоль меню.
    </p>

    <p class="debug-note">
      <b>Вырожденные меню.</b> Пустой <span class="debug-value">items: []</span> не отменяет открытие — панель
      всё равно рендерится, просто схлопывается почти в точку (~2×12px, размер считается по содержимому) и
      встаёт под кнопкой-триггером по её левому краю — не улетает в угол экрана, её там просто почти не видно.
      Проверять «есть ли что показывать» должен вызывающий код. У «пустых подписей» видно, что
      <span class="debug-value">label</span> ничем не подстрахован — строки остаются высотой в
      <span class="debug-value">1.2em</span>, но пустые. В последнем меню второй заголовок задан как
      <span class="debug-value">header('')</span>: наведи на него курсор — строка подсвечивается, то есть это уже
      кнопка, а не заголовок. Тип в simpleContextMenu выбирается по truthiness поля
      <span class="debug-value">header</span>, и пустая строка проваливается в ветку кнопки.
    </p>

    <p class="debug-note">
      <b>Размеры.</b> Иконка ограничена только по высоте (<span class="debug-value">1em + 6px</span>) — широкая svg
      растянет строку на всю свою ширину, обрезки нет. Длинная подпись тоже не обрезается: панель тянется, пока
      влезает в вьюпорт, дальше текст переносится на несколько строк.
    </p>

    <p class="debug-note">
      <b>Иконки и типы.</b> Поле <span class="debug-value">icon</span> объявлено как
      <span class="debug-value">Component</span>, а принятый в проекте импорт
      <span class="debug-value">import Icon from './icon.svg'</span> типизируется как
      <span class="debug-value">string</span>: vite-svg-loader описывает компонент только для формы
      <span class="debug-value">./icon.svg?component</span>. В шаблонах это не всплывает, а тут ловится проверкой
      типов — иконки на этой странице импортированы с суффиксом.
    </p>

    <p class="debug-note">
      <b>Пальцем:</b> правого клика на тач-устройстве нет — меню тут вызывается системным долгим тапом (браузер
      присылает <span class="debug-value">contextmenu</span>). На iOS поверх может вылезти системное меню выделения:
      если оно мешает, цели нужен <span class="debug-value">user-select: none</span>. Кнопки «вырожденные меню»
      открываются обычным тапом и работают везде.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { createContextMenu, ContextMenuItemVariant, type ContextMenuItem } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, header, button } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import StarIcon from '../shared/assets/star.svg?component'
import WideIcon from '../shared/assets/wide.svg?component'

const LONG_LABEL = 'Очень длинная подпись строки меню, которая заведомо не влезает в разумную ширину панели и проверяет, что с ней происходит'

const iconVariants = [
  { value: 'none', label: 'нет' },
  { value: 'star', label: 'звезда' },
  { value: 'wide', label: 'широкая (64×16)' },
] as const

const log = useEventLog({ max: 80 })
const icon = ref<typeof iconVariants[number]['value']>('none')
const withCheckmarks = ref(false)
const withDisabled = ref(false)
const withLongLabel = ref(false)
const withHeaders = ref(true)
const closeOnAction = ref(true)
const count = ref(4)

function iconComponent() {
  if (icon.value === 'star') return StarIcon
  if (icon.value === 'wide') return WideIcon
  return undefined
}

function buttonLine(index: number): ContextMenuItem {
  return {
    type: ContextMenuItemVariant.Button,
    label: `Строка ${index + 1}`,
    icon: iconComponent(),
    checkbox: withCheckmarks.value && index % 2 === 0 ? index % 4 === 0 : undefined,
    disabled: withDisabled.value && index % 3 === 2,
    action: () => log.push(`Строка ${index + 1}`),
  }
}

function items(): ContextMenuItem[] {
  const list: ContextMenuItem[] = []

  if (withHeaders.value) list.push({ type: ContextMenuItemVariant.Header, label: 'Header' })

  for (let index = 0; index < count.value; index++) list.push(buttonLine(index))

  list.push({ type: ContextMenuItemVariant.Separator })

  if (withHeaders.value) list.push({ type: ContextMenuItemVariant.Header, label: 'Child' })

  list.push({
    type: ContextMenuItemVariant.Child,
    label: 'Подменю',
    icon: iconComponent(),
    items: () => [
      { type: ContextMenuItemVariant.Header, label: 'Вложенный header' },
      { type: ContextMenuItemVariant.Button, label: 'Вложенная кнопка', action: () => log.push('Вложенная кнопка') },
    ],
  })

  list.push({
    type: ContextMenuItemVariant.Child,
    label: 'Отключённое подменю',
    disabled: true,
    items: () => [{ type: ContextMenuItemVariant.Button, label: 'Не должно открыться' }],
  })

  if (withLongLabel.value) {
    list.push({ type: ContextMenuItemVariant.Separator })
    list.push({ type: ContextMenuItemVariant.Button, label: LONG_LABEL, action: () => log.push('длинная подпись') })
  }

  return list
}

function onlySeparators(): ContextMenuItem[] {
  return Array.from({ length: 4 }, (): ContextMenuItem => ({ type: ContextMenuItemVariant.Separator }))
}

function onlyHeaders(): ContextMenuItem[] {
  return Array.from({ length: 3 }, (_, index): ContextMenuItem => ({
    type: ContextMenuItemVariant.Header,
    label: `Заголовок ${index + 1}`,
  }))
}

function emptyLabels(): ContextMenuItem[] {
  return [
    { type: ContextMenuItemVariant.Header, label: '' },
    { type: ContextMenuItemVariant.Button, label: '', action: () => log.push('кнопка без подписи') },
    { type: ContextMenuItemVariant.Child, label: '', items: () => [{ type: ContextMenuItemVariant.Button, label: '' }] },
  ]
}

function openMenu(event: MouseEvent) {
  createContextMenu({ position: { x: event.clientX, y: event.clientY }, closeOnAction: closeOnAction.value }, items())
}

function openDegenerate(event: MouseEvent, list: ContextMenuItem[]) {
  const element = event.currentTarget as HTMLElement
  createContextMenu({ position: element.getBoundingClientRect(), alignY: 'bottom' }, list)
}

function openEmptyHeader(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  simpleContextMenu({ position: element.getBoundingClientRect(), alignY: 'bottom' }, [
    header('Настоящий заголовок'),
    header(''),
    button('Обычная кнопка', () => log.push('обычная кнопка')),
  ])
}

</script>
