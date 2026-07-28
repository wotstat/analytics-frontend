<template>
  <DebugSection title="Готовое окно: DebugTipWindow" id="debug-tip-window"
    description="Пять тестовых баблов в общей группе плюс таблица счётчиков/флагов по каждому баблу и таблица активных групп. Включи «Show Debug Tips» и потыкай карточки — таблица ниже общая на весь useTipBubble, поэтому в ней заодно видны баблы из остальных секций этой страницы, пока они смонтированы."
    source="src/shared/uiKit/tipBubble/DebugTipWindow.vue">

    <DebugTipWindow />

    <p class="debug-note">
      Кнопка «Clear bubbles storage» внутри окна вызывает
      <span class="debug-value">window.wotstat.resetTipBubbles()</span> и перезагружает страницу — это стирает
      localStorage вообще всех баблов сайта, не только демок этой страницы. Для точечного сброса одного бабла без
      перезагрузки в остальных секциях есть свои кнопки рядом с примером.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DebugTipWindow from '@/shared/uiKit/tipBubble/DebugTipWindow.vue'
</script>
