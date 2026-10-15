<template>
  <DebugSection
    title="Meta: задержка 5 секунд"
    description="Карточка сообщает о готовности через useMetaReady. prepare должен завершиться только после пятисекундной задержки."
    source="src/pages/debug/pages/meta/cards/delayed/DelayedMetaCard.vue">
    <RouterLink to="/meta/cards/debug-delayed">Открыть в Meta Studio →</RouterLink>
    <div class="preview-panel">
      <RenderPreview :url :meta format="og" />
    </div>
  </DebugSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import DebugSection from '../../shared/DebugSection.vue'
import RenderPreview from '@/pages/metaStudio/RenderPreview.vue'
import { getBrowserMetaResolver } from '@/meta/context/browser'

const url = new URL('/debug/meta/delayed', window.location.origin).href
const meta = computed(() => getBrowserMetaResolver().readMeta(new URL(url)))
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
