<template>
  <DebugSection title="Что открывает и что закрывает" id="open-close"
    description="Открывают только наведение указателя и касание. Фокус — не открывает: проверь Tab и программный focus(), в логе не должно появиться ни одной записи. Плюс здесь же вёрстка длинного текста."
    source="src/shared/uiKit/tooltip/tooltip.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="focusTarget">Поставить фокус на цель (el.focus())</button>
      <button class="debug-btn" @click="openByPointer(focusable)">Открыть указателем (для сравнения)</button>
      <button class="debug-btn" @click="closeByPointer(focusable)">Закрыть</button>

      <span class="debug-hint">
        document.activeElement: <span class="debug-value">{{ activeDescription }}</span>
      </span>
    </div>

    <div class="debug-stage short">
      <div class="debug-row">
        <input type="text" placeholder="поле для старта Tab-обхода">

        <button class="debug-btn" ref="focusable" v-text-tooltip.instant="'Фокус меня не открывает — только наведение или тап'">
          цель с tabindex по умолчанию
        </button>

        <a class="debug-btn" href="#open-close" v-text-tooltip.instant="'Ссылка тоже фокусируется без тултипа'">
          ссылка-цель
        </a>
      </div>
    </div>

    <p class="debug-note">
      Поставь курсор в поле и жми Tab: фокус пройдёт по цели и по ссылке, обводка появится, тултип — нет. То же с
      кнопкой <span class="debug-value">el.focus()</span>. Это осознанно: директива слушает
      <span class="debug-value">pointerenter/leave</span> и тач, а <span class="debug-value">focusin</span> — только
      внутри самой карточки, чтобы она не закрылась, пока фокус в ней (это работает лишь при
      <span class="debug-value">interactive</span>). Обратная сторона — клавиатурой подсказку не прочитать вообще,
      и <span class="debug-value">aria-describedby</span> тултип тоже не выставляет.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">убрать цель из DOM</span>
        <input type="checkbox" v-model="targetRemoved">
      </label>

      <button class="debug-btn" @click="openByPointer(removable)">Открыть программно</button>

      <span class="debug-hint">кликов мышью по цели: <span class="debug-value">{{ clicks }}</span></span>
    </div>

    <div class="debug-stage center short">
      <button class="debug-btn" v-if="!targetRemoved" ref="removable" @click="clicks++"
        v-text-tooltip.instant="'Клик мышью по цели ничего не делает с тултипом'">
        цель, которую можно снести
      </button>

      <span class="debug-hint" v-else>цели нет в дереве</span>
    </div>

    <p class="debug-note">
      Клик мышью по цели тултип не закрывает и не открывает — счётчик растёт, карточка не мигает. А вот снос цели с
      дерева её закрывает: хук <span class="debug-value">unmounted</span> зовёт cleanup для своей группы. Открой
      программно и поставь галочку.
    </p>

    <EventLog :entries="entries" @clear="clear" title="Показы"
      empty="Пока пусто — с этого и начинай проверку фокуса" />

    <div class="debug-col">
      <span class="debug-label">Длинный текст, переносы, слово без пробелов</span>

      <div class="debug-stage short">
        <div class="debug-row">
          <button class="debug-btn" v-for="preset in textPresets" :key="preset.value"
            v-text-tooltip.instant.bottom-float="preset.text">
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>

    <p class="debug-note">
      У <span class="debug-value">TextTooltip.vue</span> ровно три правила вёрстки:
      <span class="debug-value">max-width: 320px</span>, <span class="debug-value">white-space: pre-wrap</span>,
      <span class="debug-value">font-size: 14px</span>. Поэтому <span class="debug-value">\n</span> в строке —
      настоящий перенос, а пустая строка остаётся пустой строкой.
    </p>

    <p class="debug-note">
      <b>«Одно длинное слово» — сломано.</b> Переносить слово нечем
      (<span class="debug-value">overflow-wrap</span> не задан), а <span class="debug-value">.popover-content</span> у
      карточки — <span class="debug-value">overflow: hidden</span>. В итоге слово не переносится и не растягивает
      карточку, а обрезается: часть текста просто не видна, и добраться до неё нельзя даже с
      <span class="debug-value">interactive</span>. Лечится одной строкой
      <span class="debug-value">overflow-wrap: anywhere</span> в TextTooltip, но компонент трогать нельзя — вынесено
      в отчёт. Вариант «длинное слово в тексте» — тот же дефект на реалистичных данных: id боя, длинный ник, ссылка.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useActiveElement } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { vTextTooltip } from '@/shared/ui/tooltip/textTooltip'
import EventLog from '../shared/EventLog.vue'
import { closeByPointer, openByPointer } from '../shared/pointerSimulation'
import { textPresets } from '../shared/texts'
import { useDisplayedTooltipsLog } from '../shared/useDisplayedTooltipsLog'

const clicks = ref(0)
const targetRemoved = ref(false)

const focusable = useTemplateRef<HTMLElement>('focusable')
const removable = useTemplateRef<HTMLElement>('removable')

const activeElement = useActiveElement()
const { entries, clear } = useDisplayedTooltipsLog()

const activeDescription = computed(() => {
  const el = activeElement.value
  if (!el || el === document.body) return 'body'

  const label = el.textContent?.trim().slice(0, 22)
  return label ? `${el.tagName.toLowerCase()} «${label}»` : el.tagName.toLowerCase()
})

function focusTarget() {
  focusable.value?.focus()
}

</script>
