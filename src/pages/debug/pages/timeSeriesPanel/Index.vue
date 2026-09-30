<template>
  <DebugPage title="Панель временного графика" description="Две независимые панели без БД и игрового домена."
    source="src/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue">
    <DebugSection title="Обычная панель" id="standard"
      description="Плавающий tooltip, цвета, удаление и сообщения отдельных источников.">
      <label class="debug-control"><input v-model="showStandard" type="checkbox">Показывать панель</label>
      <PanelExample v-if="showStandard" density="standard" />
    </DebugSection>
    <DebugSection title="Компактная панель" id="compact"
      description="Значение в шапке; включение нескольких рядов возвращает плавающий tooltip.">
      <label class="debug-control"><input v-model="showCompact" type="checkbox">Показывать панель</label>
      <PanelExample v-if="showCompact" density="compact" />
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PanelExample from './PanelExample.vue'

const showStandard = ref(true)
const showCompact = ref(true)
</script>
