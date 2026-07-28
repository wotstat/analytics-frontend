<template>
  <DebugPage title="TipBubble"
    description="Обучающие подсказки: очередь внутри группы, autoExtend, запоминание показов."
    source="src/shared/ui/tipBubble/, src/shared/uiKit/tipBubble/">

    <DebugSection title="С чего начать" id="intro"
      description="Два слоя: uiKit/tipBubble — база с useTipBubble, shared/ui/tipBubble — проектная обёртка с дефолтами сайта. На страницах используется обёртка.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>файл</th>
            <th>что делает</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>uiKit/tipBubble/useTipBubble.ts</th>
            <td>состояние, счётчики, очередь групп, localStorage</td>
            <td>опции, очередь, autoExtend</td>
          </tr>
          <tr>
            <th>ui/tipBubble/TipBubbleText.vue</th>
            <td>обёртка с проектными дефолтами и готовым текстом</td>
            <td>позиционирование, isAlwaysHidden</td>
          </tr>
          <tr>
            <th>uiKit/tipBubble/DebugTipWindow.vue</th>
            <td>готовое окно со счётчиками всех баблов</td>
            <td>готовое окно</td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Состояние баблов живёт в localStorage и переживает перезагрузку, поэтому в каждой секции рядом с примером есть
        своя кнопка сброса. Без неё страницей нельзя пользоваться второй раз: принятый бабл больше не покажется.
      </p>
    </DebugSection>

    <DebugWindowSection />
    <OptionsPlayground />
    <GroupQueue />
    <ImperativeApi />
    <LocalStorageMemory />
    <AutoExtendPolicies />
    <Positioning />
    <AlwaysHidden />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import AlwaysHidden from './sections/AlwaysHidden.vue'
import AutoExtendPolicies from './sections/AutoExtendPolicies.vue'
import DebugWindowSection from './sections/DebugWindowSection.vue'
import GroupQueue from './sections/GroupQueue.vue'
import ImperativeApi from './sections/ImperativeApi.vue'
import LocalStorageMemory from './sections/LocalStorageMemory.vue'
import OptionsPlayground from './sections/OptionsPlayground.vue'
import Positioning from './sections/Positioning.vue'

</script>
