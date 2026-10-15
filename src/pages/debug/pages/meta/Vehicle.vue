<template>
  <DebugSection
    title="Meta: название танка"
    description="Название загружается из ClickHouse по параметру tag в URL. Карточка готова после получения ответа."
    source="src/pages/debug/pages/meta/cards/vehicle/VehicleMetaCard.vue">
    <RouterLink to="/meta/cards/debug-vehicle">Открыть в Meta Studio →</RouterLink>
    <div class="preview-panel">
      <RenderPreview :url :meta format="og" />
    </div>
  </DebugSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DebugSection from '../../shared/DebugSection.vue'
import RenderPreview from '@/pages/metaStudio/RenderPreview.vue'
import { getBrowserMetaResolver } from '@/meta/context/browser'

const route = useRoute()
const url = computed(() => new URL(route.fullPath, window.location.origin).href)
const meta = computed(() => getBrowserMetaResolver().readMeta(new URL(url.value)))
</script>

<style scoped lang="scss">
.preview-panel {
  width: 100%;
  max-width: 1200px;
  padding-top: 18px;
  border: 1px solid #343a43;
  border-radius: 11px;
  overflow: hidden;
  background: #1b1e23;
}
</style>
