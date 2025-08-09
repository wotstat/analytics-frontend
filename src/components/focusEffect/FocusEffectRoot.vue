<template>
  <Teleport to="body">
    <div id="focus-effect-root" ref="focusEffectRoot">
      <RectEffect v-for="element of activeShowEffects" :key="element.id" :element="element.element" />
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { activeShowEffects } from './focusEffect'
import RectEffect from './RectEffect.vue'


</script>


<style lang="scss" scoped>
#focus-effect-root {
  position: relative;
  z-index: 5000;
}
</style>
