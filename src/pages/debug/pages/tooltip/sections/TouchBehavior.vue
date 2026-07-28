<template>
  <DebugSection title="Тач: тап переключает, свайп не мешает" id="touch"
    description="Проверяется только пальцем или с эмуляцией тача в devtools. Тап по цели открывает и закрывает, тап вне цели и вне карточки закрывает, а свайп для прокрутки не делает ни того, ни другого."
    source="src/shared/uiKit/tooltip/tooltip.ts, src/shared/uiKit/tooltip/TooltipRoot.vue">

    <p class="debug-note">
      Что проверять пальцем, по порядку:
      <br>1. тап по цели — открылся; тап по той же цели — закрылся;
      <br>2. тап по другой цели — предыдущий закрылся, открылся новый;
      <br>3. тап по пустому месту сцены — закрылся;
      <br>4. свайп, начатый <b>на цели</b> — тултип не открылся, страница прокрутилась;
      <br>5. свайп, начатый <b>вне цели</b> при открытом тултипе — тултип остался;
      <br>6. порог — 8 px: сдвиг меньше считается тапом, больше — свайпом.
    </p>

    <div class="debug-row">
      <span class="debug-hint">кликов по цели с @click: <span class="debug-value">{{ clicks }}</span></span>
    </div>

    <div class="debug-stage short">
      <div class="debug-row">
        <button class="debug-btn" v-text-tooltip="'Обычная цель: тап переключает'">обычная</button>

        <button class="debug-btn" v-text-tooltip.interactive="'Интерактивная: тап по самой карточке её не закрывает'">
          .interactive
        </button>

        <button class="debug-btn" @click="clicks++" v-text-tooltip="'У цели ещё и @click — сработает и он, и тултип'">
          с обработчиком клика
        </button>

        <button class="debug-btn" v-no-touch-tooltip="{ title: 'touchBehavior: disabled', lines: ['пальцем не открыть вовсе'] }">
          touchBehavior: 'disabled'
        </button>
      </div>
    </div>

    <p class="debug-note">
      <b>touchBehavior: 'disabled'</b> в docs не описан. Тач-ветка выходит из
      <span class="debug-value">pointerdown</span> сразу, то есть на телефоне такой тултип недоступен совсем — годится
      только для подсказок, дублирующих видимый текст.
    </p>

    <p class="debug-note">
      У цели с <span class="debug-value">@click</span> тап делает и то, и другое: директива не зовёт
      <span class="debug-value">preventDefault</span> и не отменяет клик. Именно так ведут себя дни в календаре
      онслота — тап выбирает день и попутно показывает подсказку.
    </p>

    <p class="debug-note">
      Неинтерактивная карточка не ловит указатель, поэтому тап «по ней» попадает в то, что под ней, и считается тапом
      <i>вне</i> — тултип закроется. С <span class="debug-value">.interactive</span> карточка тап съедает и остаётся
      открытой.
    </p>

    <div class="debug-col">
      <span class="debug-label">Прокручиваемый список: свайп по целям</span>

      <div class="debug-stage scroll">
        <div class="debug-col">
          <button class="debug-btn" v-for="index in 14" :key="index" v-text-tooltip="`строка ${index}`">
            строка {{ index }}
          </button>
        </div>
      </div>
    </div>

    <EventLog :entries="entries" @clear="clear" title="Показы"
      empty="Пока пусто: свайп по списку не должен добавить ни одной записи" />

    <p class="debug-note">
      Свайп по списку не должен ни открыть, ни закрыть ничего — лог остаётся пустым. Порог сдвига считается дважды и
      независимо: в директиве (открытие тапом по цели) и в
      <span class="debug-value">TooltipRoot</span> (закрытие тапом вне), оба по 8 px.
    </p>

    <p class="debug-note">
      Отдельная проверка на том же списке, уже мышью: открой тултип у нижней строки и прокрути список так, чтобы цель
      ушла за край контейнера. Тултип продолжит висеть у невидимой цели — границы считаются по окну, про прокручиваемый
      контейнер-предок поповер ничего не знает. Закроется он только когда перестанет помещаться в сам viewport.
    </p>

    <p class="debug-note">
      С мышью тач-путь не проверяется вообще: <span class="debug-value">pointerenter/leave</span> с
      <span class="debug-value">pointerType === 'touch'</span> игнорируются на всех уровнях (иначе мобильный Safari
      залипал бы в hover). Включи эмуляцию тача в devtools или открой страницу с телефона.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { vTextTooltip } from '@/shared/ui/tooltip/textTooltip'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import DemoTooltip from '../shared/DemoTooltip.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useDisplayedTooltipsLog } from '../shared/useDisplayedTooltipsLog'

const vNoTouchTooltip = useTooltip(DemoTooltip, {
  arrowSize: 7,
  offset: 8,
  placement: ['top-float', 'bottom-float'],
  viewportOffset: popoverViewportOffset,
  touchBehavior: 'disabled',
})

const clicks = ref(0)

const { entries, clear } = useDisplayedTooltipsLog()

</script>
