<template>
  <Settings v-if="showSettings" @close="showSettings = false" :reload="reload" />
  <h1 class="params">
    <SettingsIcon class="settings-icon" @click="showSettings = true" />
    <slot></slot>
  </h1>
</template>

<script lang="ts" setup>
import Settings from './Settings.vue'
import { ref } from 'vue'
import SettingsIcon from '@/assets/icons/settings.svg'

const props = defineProps<{
  reload?: boolean
}>()

const showSettings = ref(false)


</script>

<style scoped lang="scss">
@use '/src/styles/mixins.scss' as *;

h1 {
  margin: 0;
  // margin-top: 0.3em;
}


.settings-icon {
  width: 1em;
  height: 1em;
  vertical-align: middle;
  margin-bottom: 0.1em;
  fill: #808080;
  cursor: pointer;

  &:hover {
    fill: var(--font-color);
  }
}


@include less-x-small {
  h1 {
    font-size: 1.8rem;
  }
}
</style>