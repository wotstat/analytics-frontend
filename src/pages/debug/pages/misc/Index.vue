<template>
  <DebugPage title="Мелкие компоненты"
    description="DropDown, подсветка поиска, картинка с фолбэком, бейдж «новое», спрайт-атлас, лоадеры."
    source="src/shared/uiKit/dropdown/, highlightString/, fallbackImg/, newFeatureBadge/, spriteAtlas/, src/shared/ui/loaders/">

    <DropDownSection />
    <HighlightStringSection />
    <FallbackImgSection />
    <NewFeatureBadgeSection />
    <SpriteAtlasSection />
    <LoadersSection />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DropDownSection from './sections/DropDownSection.vue'
import HighlightStringSection from './sections/HighlightStringSection.vue'
import FallbackImgSection from './sections/FallbackImgSection.vue'
import NewFeatureBadgeSection from './sections/NewFeatureBadgeSection.vue'
import SpriteAtlasSection from './sections/SpriteAtlasSection.vue'
import LoadersSection from './sections/LoadersSection.vue'

</script>
