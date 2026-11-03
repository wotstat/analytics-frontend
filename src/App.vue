<template>
  <div class="app" :style="{ '--header-height': headerHeight + 'px' }">
    <BackgroundRoot :controller="backgroundController" />
    <template v-if="!route.meta.clearPage">
      <Header v-if="!route.meta.hideHeader" />
      <div class="content">
        <HeaderSpacer />
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </div>
    </template>

    <template v-else>
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </template>

    <FocusEffectRoot />
    <ContextMenuRoot />
    <TooltipRoot />
  </div>
</template>


<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { pageReadyRoute } from './routes'
import Header from './pages/shared/header/Header.vue'
import HeaderSpacer from './pages/shared/header/HeaderSpacer.vue'
import { headerHeight } from './pages/shared/header/useAdditionalHeaderHeight'
import ContextMenuRoot from '@/shared/uiKit/contextMenu/ContextMenuRoot.vue'
import FocusEffectRoot from './shared/uiKit/focusEffect/FocusEffectRoot.vue'
import TooltipRoot from './shared/uiKit/tooltip/TooltipRoot.vue'
import BackgroundRoot from './shared/uiKit/pageBackground/BackgroundRoot.vue'
import { useBackgroundRoot } from './shared/uiKit/pageBackground/useBackgroundRoot'


const isWindows = navigator.platform.indexOf('Win') > -1
const boldWeight = isWindows ? 700 : 800
const mediumBoldWeight = isWindows ? 500 : 600

const route = useRoute()
const backgroundController = useBackgroundRoot(pageReadyRoute)

if (import.meta.env.MODE == 'development' && import.meta.env.VITE_MODE_DEV_LOCAL === 'true') {
  window.addEventListener('keydown', e => {
    if (e.key === 'F19') debugger
  })
}

</script>


<style lang="scss">
.app {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  --bold-weight: v-bind(boldWeight);
  --medium-bold-weight: v-bind(mediumBoldWeight);
}
</style>
