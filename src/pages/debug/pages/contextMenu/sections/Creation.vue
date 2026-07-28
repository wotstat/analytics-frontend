<template>
  <DebugSection title="Три способа создать меню" id="creation"
    description="Одно и то же меню, собранное тремя API. Состояние (чекбокс и период) общее — переключи в одном меню и открой другое: отметки должны совпасть. Меню открываются под кнопкой и не закрываются по выбору (closeOnAction: false), чтобы галочки можно было щёлкать."
    source="src/shared/uiKit/contextMenu/simpleContextMenu.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="openRaw($event)">createContextMenu</button>
      <button class="debug-btn" @click="openSimple($event)">simpleContextMenu + массив</button>
      <button class="debug-btn" @click="openBuilder($event)">simpleContextMenu + билдер</button>

      <label class="debug-control">
        <span class="debug-label">билдер: вызвать .childs()</span>
        <input type="checkbox" v-model="builderWithChilds">
      </label>
    </div>

    <div class="debug-row">
      <span class="debug-hint">
        чекбокс: <span class="debug-value">{{ checkbox.value }}</span>
        период: <span class="debug-value">{{ mode }}</span>
      </span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>способ</th>
          <th>что даёт</th>
          <th>чего нет</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>createContextMenu</th>
          <td>полный контроль: каждый item — объект с <span class="debug-value">type</span> из
            ContextMenuItemVariant, подменю задаётся ленивой функцией <span class="debug-value">items()</span></td>
          <td>многословно, легко забыть <span class="debug-value">type</span></td>
        </tr>
        <tr>
          <th>simpleContextMenu + массив</th>
          <td>хелперы button / header / separator / checkboxItem / childs / options / childOptions / childButtons;
            вложенные массивы разворачиваются через flatMap, поэтому <span class="debug-value">...options()</span>
            вставляется прямо в список</td>
          <td>у хелперов нет параметра disabled — нужен объектный литерал</td>
        </tr>
        <tr>
          <th>simpleContextMenu + билдер</th>
          <td>та же цепочка методами: <span class="debug-value">ctx.button(...).separator()...</span></td>
          <td><b>.childs() сломан</b> — см. заметку ниже</td>
        </tr>
        <tr>
          <th>composition.useCheckbox</th>
          <td>пара <span class="debug-value">{ value, toggle }</span>, которую checkboxItem принимает целиком</td>
          <td>больше в composition.ts ничего нет</td>
        </tr>
      </tbody>
    </table>

    <EventLog :entries="log.entries.value" @clear="log.clear" empty="Выбери строку в любом меню" />

    <p class="debug-note">
      Включи тумблер и открой билдер-меню: строки <span class="debug-value">Подменю через .childs</span> и
      <span class="debug-value">Кнопка после .childs</span> не появятся, хотя в коде они есть. В
      <span class="debug-value">createSimpleContextMenuContext</span> метод <span class="debug-value">childs</span>
      создаёт вложенный контекст и кладёт подменю в его же массив, а наружу возвращает вложенный ctx — item теряется,
      и вся цепочка после него уходит в никуда. В массивной форме тот же <span class="debug-value">childs()</span>
      работает: сравни с соседним меню.
    </p>

    <p class="debug-note">
      Вариантные списки в двух хелперах описываются по-разному: <span class="debug-value">childOptions</span> ждёт
      <span class="debug-value">{ key, value }</span>, а <span class="debug-value">options</span> —
      <span class="debug-value">{ key, label }</span>. В меню «simpleContextMenu + массив» оба варианта стоят рядом
      (подменю «Период (childOptions)» и плоская группа снизу) и должны показывать одну и ту же отметку.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { createContextMenu, ContextMenuItemVariant, type ContextMenuItem } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu, button, header, separator, checkboxItem, childs, childOptions, options, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import { useCheckbox } from '@/shared/uiKit/contextMenu/composition'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'
import StarIcon from '../shared/assets/star.svg?component'

const modes = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
] as const

type Mode = typeof modes[number]['key']

const log = useEventLog()
const checkbox = useCheckbox(false)
const mode = ref<Mode>('day')
const builderWithChilds = ref(false)

// childOptions ждёт { key, value }, а options — { key, label }: списки вариантов приходится готовить по-разному.
const childVariants = modes.map(m => ({ key: m.key, value: m.label }))
const optionVariants = modes.map(m => ({ key: m.key, label: m.label }))

function rawItems(): ContextMenuItem[] {
  return [
    { type: ContextMenuItemVariant.Header, label: 'createContextMenu' },
    { type: ContextMenuItemVariant.Button, label: 'Кнопка', icon: StarIcon, action: () => log.push('raw: Кнопка') },
    { type: ContextMenuItemVariant.Button, label: 'Отключённая', disabled: true, action: () => log.push('raw: этого быть не должно') },
    { type: ContextMenuItemVariant.Separator },
    { type: ContextMenuItemVariant.Button, label: 'Чекбокс', checkbox: checkbox.value, action: checkbox.toggle },
    {
      type: ContextMenuItemVariant.Child,
      label: 'Период',
      items: () => modes.map(m => ({
        type: ContextMenuItemVariant.Button,
        label: m.label,
        checkbox: computed(() => mode.value === m.key),
        action: () => setMode(m.key),
      })),
    },
  ]
}

function simpleItems(): SimpleContextMenuItem[] {
  return [
    header('simpleContextMenu + массив'),
    button('Кнопка', () => log.push('simple: Кнопка'), { icon: StarIcon }),
    { label: 'Отключённая', disabled: true, action: () => log.push('simple: этого быть не должно') },
    separator,
    checkboxItem('Чекбокс', checkbox),
    childOptions('Период (childOptions)', mode, childVariants),
    separator,
    header('те же варианты через options'),
    ...options(mode, optionVariants),
  ]
}

function optionsFor(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement
  return { position: element.getBoundingClientRect(), alignY: 'bottom', closeOnAction: false } as const
}

function setMode(value: Mode) {
  mode.value = value
  log.push(`период: ${value}`)
}

function openRaw(event: MouseEvent) {
  log.push('открыто: createContextMenu')
  createContextMenu(optionsFor(event), rawItems())
}

function openSimple(event: MouseEvent) {
  log.push('открыто: simpleContextMenu + массив')
  simpleContextMenu(optionsFor(event), simpleItems())
}

function openBuilder(event: MouseEvent) {
  log.push('открыто: simpleContextMenu + билдер')

  simpleContextMenu(optionsFor(event), ctx => {
    ctx
      .header('simpleContextMenu + билдер')
      .button('Кнопка', () => log.push('builder: Кнопка'))
      .separator()
      .checkboxItem('Чекбокс', checkbox)
      .childButtons('Подменю из кнопок', ['Раз', 'Два', 'Три'], key => log.push(`builder: ${key}`))
      .childOptions('Период', mode, childVariants)

    // Тумблер оставлен нарочно: так видно, что .childs() съедает и себя, и всю цепочку после.
    if (builderWithChilds.value) ctx
      .childs('Подменю через .childs', inner => inner.button('Внутренняя кнопка', () => log.push('builder: внутренняя')))
      .button('Кнопка после .childs', () => log.push('builder: после .childs'))
  })
}

</script>
