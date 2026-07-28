<template>
  <DebugPage title="Карты" description="Список арен и миникарта с базами, спавнами и точками интереса." source="src/shared/game/arenas/">
    <ArenaGallery />
    <MinimapUrlBuilder />
    <MinimapOverlays />
    <BboxTransform />
    <GameplayModes />
    <FallbackDemo />
    <SizingDemo />
    <LoadingState />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import ArenaGallery from './sections/ArenaGallery.vue'
import MinimapUrlBuilder from './sections/MinimapUrlBuilder.vue'
import MinimapOverlays from './sections/MinimapOverlays.vue'
import BboxTransform from './sections/BboxTransform.vue'
import GameplayModes from './sections/GameplayModes.vue'
import FallbackDemo from './sections/FallbackDemo.vue'
import SizingDemo from './sections/SizingDemo.vue'
import LoadingState from './sections/LoadingState.vue'
</script>
