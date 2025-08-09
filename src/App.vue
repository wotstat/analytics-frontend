<template>
  <div class="app" :style="{ '--header-height': headerHeight + 'px' }">
    <template v-if="!route.meta.clearPage">
      <Header v-if="!route.meta.hideHeader" />
      <div class="content">
        <HeaderSpacer />
        <RouterView />
      </div>
    </template>

    <template v-else>
      <RouterView />
    </template>

    <FocusEffectRoot />
    <ContextMenuRoot />
  </div>
</template>


<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Header from './components/header/Header.vue'
import HeaderSpacer from './components/header/HeaderSpacer.vue'
import { headerHeight } from './composition/useAdditionalHeaderHeight'
import ContextMenuRoot from './components/contextMenu/ContextMenuRoot.vue'
import FocusEffectRoot from './components/focusEffect/FocusEffectRoot.vue'

const isWindows = navigator.platform.indexOf('Win') > -1
const boldWeight = isWindows ? 700 : 800
const mediumBoldWeight = isWindows ? 500 : 600

const route = useRoute()

</script>


<style lang="scss">
.app {
  --bold-weight: v-bind(boldWeight);
  --medium-bold-weight: v-bind(mediumBoldWeight);
}
</style>