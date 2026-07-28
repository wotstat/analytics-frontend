<template>
  <button class="debug-btn" v-shared-target="label">{{ label }}</button>

  <SharedDefineTooltip :placement="['top-float', 'bottom-float']" :arrow-size="7" :offset="7"
    :viewport-offset="popoverViewportOffset" v-slot="value">
    <div class="shared-content">
      <div>значение биндинга: <b>{{ value }}</b></div>
      <div>шаблон объявлен в: <b>{{ label }}</b></div>
    </div>
  </SharedDefineTooltip>
</template>


<script setup lang="ts">
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { SharedDefineTooltip, vSharedTarget } from './sharedDefinition'

defineProps<{
  label: string
}>()

</script>


<style scoped lang="scss">
.shared-content {
  padding: 6px 9px;
  font-size: 13px;
  line-height: 1.4;
}
</style>
