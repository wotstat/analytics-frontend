<template>
  <DebugPage title="Анимация чисел"
    description="TweenValue и SimpleTweenValue, кривые easing, процессоры форматирования." source="src/shared/ui/tween/">

    <ComponentsCompare />
    <EasingCurves />
    <FormattingProcessors />
    <TweenRefVariants />
    <EdgeCases />
    <Performance />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import ComponentsCompare from './sections/ComponentsCompare.vue'
import EasingCurves from './sections/EasingCurves.vue'
import FormattingProcessors from './sections/FormattingProcessors.vue'
import TweenRefVariants from './sections/TweenRefVariants.vue'
import EdgeCases from './sections/EdgeCases.vue'
import Performance from './sections/Performance.vue'
</script>
