<template>
  <DebugPage title="Иконки эффективности" description="Галерея всех иконок метрик с их подписями." source="src/shared/game/efficiencyIcon/">
    <Gallery />
    <Families />
    <SizesAndColors />
    <UnknownKey />
    <Discrepancies />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import Gallery from './sections/Gallery.vue'
import Families from './sections/Families.vue'
import SizesAndColors from './sections/SizesAndColors.vue'
import UnknownKey from './sections/UnknownKey.vue'
import Discrepancies from './sections/Discrepancies.vue'
</script>
