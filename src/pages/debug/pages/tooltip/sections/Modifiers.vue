<template>
  <DebugSection title="Модификаторы и группа (arg)" id="modifiers"
    description="Модификаторы задаются статически в шаблоне, поэтому на каждый вариант — своя цель. Проведи указателем по ряду и сравни задержки; в группе одновременно живёт ровно один тултип и подмена мгновенная."
    source="src/shared/uiKit/tooltip/tooltip.ts">

    <div class="debug-stage short">
      <div class="debug-row">
        <button class="debug-btn" v-text-tooltip="'Дефолт: показ через 300 мс, скрытие через 100 мс'">
          без модификаторов
        </button>

        <button class="debug-btn" v-text-tooltip.instant="'instant: delay и hideDelay обнулены'">
          .instant
        </button>

        <button class="debug-btn"
          v-text-tooltip.interactive="'interactive: карточка ловит указатель — переведи мышь сюда и выдели текст'">
          .interactive
        </button>

        <button class="debug-btn" v-text-tooltip.left.instant="'placement из модификатора — left'">
          .left.instant
        </button>

        <button class="debug-btn"
          v-text-tooltip.left.instant="{ text: 'В значении placement: bottom, в модификаторе left — победил модификатор', placement: 'bottom' }">
          .left + placement в значении
        </button>
      </div>
    </div>

    <p class="debug-note">
      Приоритет placement: <b>модификатор → значение → опции директивы</b>. Последняя кнопка ряда это и проверяет:
      карточка обязана оказаться слева, а не снизу. В docs/05-ui-kit.md ни модификаторы, ни этот приоритет не
      описаны — список модификаторов есть только в типе <span class="debug-value">TooltipModifier</span>:
      <span class="debug-value">instant</span>, <span class="debug-value">interactive</span> и все 24 варианта
      placement, включая <span class="debug-value">-float</span>.
    </p>

    <p class="debug-note">
      <b>.interactive</b> включает <span class="debug-value">interactive</span> у карточки: без него у неё
      <span class="debug-value">pointer-events: none</span> и текст даже не выделить. Уход с цели даёт
      <span class="debug-value">interactiveDelay</span> = 300 мс на то, чтобы довести указатель до карточки, а уход
      с карточки — ещё <span class="debug-value">interactiveHideDelay</span> = 300 мс.
    </p>

    <div class="debug-col">
      <span class="debug-label">Без arg: у каждого элемента своя группа</span>

      <div class="debug-stage short">
        <div class="debug-row">
          <button class="debug-btn" v-for="index in 4" :key="index"
            v-text-tooltip.instant="`своя группа, цель ${index}`">
            цель {{ index }}
          </button>
        </div>
      </div>
    </div>

    <div class="debug-col">
      <span class="debug-label">arg = группа «demo»: одна карточка на всех</span>

      <div class="debug-stage short">
        <div class="debug-row">
          <button class="debug-btn" v-for="index in 4" :key="index"
            v-text-tooltip:demo.instant="`группа demo, цель ${index}`">
            цель {{ index }}
          </button>
        </div>
      </div>
    </div>

    <OpenTooltips />

    <EventLog :entries="entries" @clear="clear" title="Показы (ключ = группа)"
      empty="Наведись на любую цель — в лог попадут все тултипы страницы" />

    <p class="debug-note">
      Проведи указателем по ряду без arg: группы называются <span class="debug-value">default-N</span>, номер
      выдаётся при монтировании элемента. На стыке двух целей в таблице выше на 100 мс видно <b>два</b> открытых
      тултипа — это не баг и не <span class="debug-value">hideDelay</span> (у целей этого ряда он обнулён
      модификатором <span class="debug-value">.instant</span>), а фиксированная длительность exit-анимации:
      <span class="debug-value">HIDE_ANIMATION_DURATION</span> = 100 мс в <span class="debug-value">TooltipRoot</span>
      держит старую карточку в DOM после того, как она уже логически скрыта.
    </p>

    <p class="debug-note">
      В группе <span class="debug-value">demo</span> открытый тултип всегда один, и подмена идёт <b>без</b>
      задержки показа: если в группе уже кто-то показан, <span class="debug-value">delay</span> пропускается.
      Именно так сделан календарь в селекторе дней — <span class="debug-value">v-tooltip:calendar.instant</span>.
      Побочный эффект: <span class="debug-value">closeTooltip(group)</span> — единственный публичный способ
      закрыть тултип из кода, и он требует знать имя группы, то есть без arg программно закрыть нечего.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { vTextTooltip } from '@/shared/ui/tooltip/textTooltip'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import OpenTooltips from '../shared/OpenTooltips.vue'
import { useDisplayedTooltipsLog } from '../shared/useDisplayedTooltipsLog'

const { entries, clear } = useDisplayedTooltipsLog()

</script>
