<template>
  <DebugSection title="Крайние случаи" id="edge-cases"
    description="Тумблеры и кнопки, которые ломают меню нарочно: меню выше экрана, быстрое переоткрытие, второе меню поверх первого, устаревший close(). Смотри в лог — часть поломок видна только там."
    source="src/shared/uiKit/contextMenu/ContextMenuPanel.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">строк</span>
        <input type="range" min="10" max="300" step="10" v-model.number="count">
        <span class="debug-value">{{ count }}</span>
      </label>

      <button class="debug-btn" @click="openHuge($event)">меню на {{ count }} строк</button>
      <button class="debug-btn" @click="openWide($event)">меню шире экрана</button>
      <button class="debug-btn" @click="openHugeNested($event)">то же в подменю</button>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="reopenFast">быстрое переоткрытие ×10</button>
      <button class="debug-btn" @click="openSecondOverFirst">второе меню поверх первого</button>
    </div>

    <div class="debug-row">
      <span class="debug-hint">устаревший close():</span>
      <button class="debug-btn" @click="openA($event)">открыть A</button>
      <button class="debug-btn" @click="openB($event)">открыть B</button>
      <button class="debug-btn" @click="closeA">вызвать close() от A</button>
      <button class="debug-btn" @click="closeByIdA">closeContextMenu(idA)</button>
    </div>

    <div class="debug-row">
      <span class="debug-hint">меню из строки меню:</span>
      <button class="debug-btn" @click="openNesting($event)">открыть</button>

      <label class="debug-control">
        <span class="debug-label">closeOnAction</span>
        <input type="checkbox" v-model="nestingCloseOnAction">
      </label>
    </div>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Понажимай кнопки выше" />

    <p class="debug-note">
      <b>Меню выше экрана не скроллится.</b> У панели нет ни <span class="debug-value">max-height</span>, ни
      <span class="debug-value">overflow</span>: вертикальная подгонка — это одна строка
      <span class="debug-value">pos.y = высота вьюпорта − высота панели − 10</span>. Если панель выше экрана,
      значение уходит в минус, и верхние строки оказываются выше края экрана без всякой возможности до них
      добраться. Ожидалось бы либо поджатие с внутренним скроллом, либо разбиение на колонки. То же в подменю —
      кнопка «то же в подменю».
    </p>

    <p class="debug-note">
      <b>Устаревший close().</b> <span class="debug-value">closeContextMenu(id)</span> сверяет id и чужое меню не
      тронет, а <span class="debug-value">close()</span> из результата
      <span class="debug-value">createContextMenu</span> — нет: он просто обнуляет
      <span class="debug-value">currentContextMenu</span>. Открой A, потом B, потом нажми «close() от A» — закроется
      B. Кнопка <span class="debug-value">closeContextMenu(idA)</span> на том же состоянии не делает ничего, как и
      должна.
    </p>

    <p class="debug-note">
      <b>Меню из строки меню не выживает.</b> При <span class="debug-value">closeOnAction: true</span> Root ставит
      закрытие на 150 мс после действия и не проверяет, что меню за это время сменилось: новое меню, открытое прямо из
      <span class="debug-value">action</span>, закроется само примерно через 240 мс. Проверь с тумблером в двух
      положениях — с <span class="debug-value">false</span> второе меню остаётся. Обходной путь для боевого кода:
      открывать вложенное меню в <span class="debug-value">setTimeout</span> длиннее 240 мс либо отключать
      closeOnAction.
    </p>

    <p class="debug-note">
      <b>Одно меню на приложение.</b> <span class="debug-value">currentContextMenu</span> — единственный shallowRef,
      поэтому «второе поверх первого» невозможно: второе просто заменяет первое, стека нет. Быстрое переоткрытие тоже
      проверяется здесь — панель пересоздаётся по <span class="debug-value">:key="id"</span>, ховер и открытое подменю
      сбрасываются, зависших панелей после серии не должно остаться.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { closeContextMenu, createContextMenu, ContextMenuItemVariant, type ContextMenuItem } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, button, childs, header } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const WIDE_LABEL = 'Строка с подписью, которая заведомо шире любого экрана: '.repeat(4)

const log = useEventLog({ max: 80 })
const count = ref(120)
const nestingCloseOnAction = ref(true)

let closeHandleA: (() => void) | null = null
let idA = -1
const timers: ReturnType<typeof setTimeout>[] = []

onUnmounted(() => timers.forEach(timer => clearTimeout(timer)))

function rows(total: number): ContextMenuItem[] {
  return Array.from({ length: total }, (_, index): ContextMenuItem => ({
    type: ContextMenuItemVariant.Button,
    label: `Строка ${index + 1}`,
    action: () => log.push(`выбрано: строка ${index + 1}`),
  }))
}

function rectOf(event: MouseEvent) {
  return (event.currentTarget as HTMLElement).getBoundingClientRect()
}

function openHuge(event: MouseEvent) {
  log.push(`меню на ${count.value} строк`)
  createContextMenu({ position: rectOf(event), alignY: 'bottom' }, rows(count.value))
}

function openHugeNested(event: MouseEvent) {
  log.push(`подменю на ${count.value} строк`)
  createContextMenu({ position: rectOf(event), alignY: 'bottom' }, [
    { type: ContextMenuItemVariant.Header, label: 'Снаружи всё нормально' },
    { type: ContextMenuItemVariant.Child, label: 'Огромное подменю', items: () => rows(count.value) },
  ])
}

function openWide(event: MouseEvent) {
  log.push('меню шире экрана')
  createContextMenu({ position: rectOf(event), alignY: 'bottom', minWidth: 3000 }, [
    { type: ContextMenuItemVariant.Header, label: 'minWidth: 3000' },
    { type: ContextMenuItemVariant.Button, label: WIDE_LABEL, action: () => log.push('выбрана широкая строка') },
  ])
}

function reopenFast() {
  log.push('серия из 10 открытий по 60 мс')

  for (let index = 0; index < 10; index++) {
    timers.push(setTimeout(() => {
      const x = 120 + index * 40
      createContextMenu({ position: { x, y: 200 + index * 20 } }, [
        { type: ContextMenuItemVariant.Header, label: `Открытие ${index + 1}` },
        { type: ContextMenuItemVariant.Child, label: 'Подменю', items: () => rows(3) },
      ])
    }, index * 60))
  }
}

function openSecondOverFirst() {
  log.push('первое меню')
  createContextMenu({ position: { x: 160, y: 260 } }, [
    { type: ContextMenuItemVariant.Header, label: 'Первое' },
    ...rows(3),
  ])

  timers.push(setTimeout(() => {
    log.push('второе меню через 600 мс')
    createContextMenu({ position: { x: 360, y: 340 } }, [
      { type: ContextMenuItemVariant.Header, label: 'Второе' },
      ...rows(3),
    ])
  }, 600))
}

function openA(event: MouseEvent) {
  const handle = createContextMenu({ position: rectOf(event), alignY: 'bottom' }, [
    { type: ContextMenuItemVariant.Header, label: 'Меню A' },
    ...rows(2),
  ])

  closeHandleA = handle.close
  idA = handle.id
  log.push(`открыто A, id=${handle.id}`)
}

function openB(event: MouseEvent) {
  const handle = createContextMenu({ position: rectOf(event), alignY: 'bottom' }, [
    { type: ContextMenuItemVariant.Header, label: 'Меню B' },
    ...rows(2),
  ])

  log.push(`открыто B, id=${handle.id}`)
}

function closeA() {
  log.push('close() от A — закроет любое открытое меню')
  closeHandleA?.()
}

function closeByIdA() {
  log.push(`closeContextMenu(${idA}) — сработает только если открыто именно A`)
  closeContextMenu(idA)
}

function openNesting(event: MouseEvent) {
  simpleContextMenu({ position: rectOf(event), alignY: 'bottom', closeOnAction: nestingCloseOnAction.value }, [
    header('Строка откроет второе меню'),
    button('Открыть меню из action', openFromAction),
    childs('Обычное подменю', [button('Ничего не делает', () => log.push('вложенная строка'))]),
  ])
}

function openFromAction() {
  log.push('action открывает второе меню')
  simpleContextMenu({ position: { x: 300, y: 300 }, closeOnAction: false }, [
    header('Второе меню'),
    button('Я ещё жив?', () => log.push('второе меню живо')),
  ])
}

</script>
