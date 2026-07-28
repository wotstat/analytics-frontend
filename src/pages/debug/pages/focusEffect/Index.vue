<template>
  <DebugPage title="FocusEffect" description="Подсветка элемента поверх затемнённой страницы."
    source="src/shared/uiKit/focusEffect/">

    <ApiOverview />
    <Geometry />
    <FollowTarget />
    <LifetimeAndEdges />
    <BreakingCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import ApiOverview from './sections/ApiOverview.vue'
import BreakingCases from './sections/BreakingCases.vue'
import FollowTarget from './sections/FollowTarget.vue'
import Geometry from './sections/Geometry.vue'
import LifetimeAndEdges from './sections/LifetimeAndEdges.vue'

</script>
