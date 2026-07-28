<template>
  <DebugSection title="useTooltip(Component, options)" id="use-tooltip"
    description="Одна директива на весь модуль, содержимое — компонент, значение биндинга = его пропы. Наведись на любую цель: заголовок и строки приходят из значения. «Жив N мс» в карточке показывает, пересоздалось содержимое или нет."
    source="src/shared/uiKit/tooltip/useTooltip.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">title</span>
        <input type="text" v-model="title">
      </label>

      <label class="debug-control">
        <span class="debug-label">тикать каждые 500 мс</span>
        <input type="checkbox" v-model="ticking">
      </label>

      <label class="debug-control">
        <span class="debug-label">тик в значение</span>
        <input type="checkbox" v-model="tickInValue">
      </label>

      <span class="debug-hint">тик: <span class="debug-value">{{ tick }}</span></span>

      <button class="debug-btn" @click="openByPointer(firstTarget)">Открыть первую программно</button>
      <button class="debug-btn" @click="closeByPointer(firstTarget)">Закрыть</button>
    </div>

    <div class="debug-stage short">
      <div class="debug-row">
        <button class="debug-btn" ref="firstTarget" v-demo-tooltip.instant="items[0]!">цель 1</button>

        <button class="debug-btn" v-for="(item, index) in items.slice(1)" :key="index" v-demo-tooltip.instant="item">
          цель {{ index + 2 }}
        </button>
      </div>
    </div>

    <p class="debug-note">
      Значение типизировано пропами компонента: лишнее поле в объекте — ошибка
      <span class="debug-value">vue-tsc</span>, а не тихо проигнорированный параметр. Одна директива обслуживает
      сколько угодно целей, каждая со своим значением.
    </p>

    <p class="debug-note">
      <b>Включи «тикать» и подержи указатель на цели.</b> В значении при этом ничего не меняется (галочка «тик в
      значение» снята), но счётчик «жив N мс» всё равно сбрасывается: директива вызывает
      <span class="debug-value">update()</span> на <i>каждой</i> перерисовке родителя, а тот, если указатель на
      цели, пересоздаёт карточку целиком — новый экземпляр компонента, сброшенное состояние, заново запущенные
      таймеры. Сравнения с прошлым значением в <span class="debug-value">updated</span> нет. Для живой таблицы,
      которая перерисовывается раз в секунду, это означает, что тултип под указателем не может хранить состояние.
    </p>

    <p class="debug-note">
      Галочка «тик в значение» — тот же эффект, но по честной причине: значение действительно новое.
    </p>

    <div class="debug-col">
      <span class="debug-label">Без valueAdapter параметры поповера из значения не берутся</span>

      <div class="debug-stage center short">
        <button class="debug-btn" v-probe-tooltip.instant="{ title: 'placement лежит в значении', placement: 'left' }">
          в значении placement: 'left'
        </button>
      </div>
    </div>

    <p class="debug-note">
      Карточка печатает <span class="debug-value">props.placement = left</span>, но стоит справа — как задано в
      опциях директивы. Без <span class="debug-value">valueAdapter</span> значение целиком уходит в пропы
      содержимого, и <span class="debug-value">target</span>, <span class="debug-value">placement</span>,
      <span class="debug-value">disabled</span> из него не читаются вообще. Единственный динамический канал в этом
      режиме — модификаторы placement в шаблоне. Хочешь параметры из значения — нужен valueAdapter, следующая
      секция.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { closeByPointer, openByPointer } from '../../shared/pointerSimulation'
import { vDemoTooltip, vProbeTooltip } from './demoTooltip'

const title = ref('Значение из биндинга')
const ticking = ref(false)
const tickInValue = ref(false)
const tick = ref(0)

const firstTarget = useTemplateRef<HTMLElement>('firstTarget')

useIntervalFn(() => {
  if (ticking.value) tick.value++
}, 500)

const items = computed(() => Array.from({ length: 5 }, (_, index) => ({
  title: `${title.value} · ${index + 1}`,
  lines: tickInValue.value ? ['строка значения', `тик ${tick.value}`] : ['строка значения'],
})))

</script>
