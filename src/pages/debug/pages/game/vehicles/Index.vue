<template>
  <DebugPage title="Танки" description="Иконки техники, флаги наций, типы и уровни." source="src/shared/game/vehicles/">
    <NationsSection />
    <TypesSection />
    <LevelsSection />
    <VehicleGallerySection />
    <FallbackSection />
    <LocalizationSection />
    <LoadingStatesSection />
    <SpriteAtlasSection />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import NationsSection from './sections/NationsSection.vue'
import TypesSection from './sections/TypesSection.vue'
import LevelsSection from './sections/LevelsSection.vue'
import VehicleGallerySection from './sections/VehicleGallerySection.vue'
import FallbackSection from './sections/FallbackSection.vue'
import LocalizationSection from './sections/LocalizationSection.vue'
import LoadingStatesSection from './sections/LoadingStatesSection.vue'
import SpriteAtlasSection from './sections/SpriteAtlasSection.vue'
</script>
