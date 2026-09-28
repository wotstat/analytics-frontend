<template>
  <DebugPage title="PanelPopover"
    description="Обычная и компактная панели сайта, слоты шапки и прокрутка содержимого без данных из БД."
    source="src/shared/ui/popover/PanelPopover.vue">
    <PanelPopoverSection />
  </DebugPage>
</template>

<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import PanelPopoverSection from './PanelPopoverSection.vue'
</script>
