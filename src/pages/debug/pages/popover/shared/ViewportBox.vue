<template>
  <Teleport to="body">
    <div class="viewport-box" v-if="display" :style="style">
      <span class="caption">viewportOffset {{ captionOffset }}</span>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { generateOffset, OffsetValue } from '@/shared/uiKit/popover/utils'

const props = defineProps<{
  display: boolean
  offset: OffsetValue
}>()

const style = computed(() => {
  const offset = generateOffset(props.offset)

  return {
    top: `${offset.top}px`,
    left: `${offset.left}px`,
    right: `${offset.right}px`,
    bottom: `${offset.bottom}px`,
  }
})

const captionOffset = computed(() => {
  const offset = generateOffset(props.offset)
  return `${offset.top}/${offset.right}/${offset.bottom}/${offset.left}`
})

</script>


<style scoped lang="scss">
.viewport-box {
  position: fixed;
  z-index: 900;
  pointer-events: none;
  border: 1px dashed var(--blue-color);
  border-radius: 4px;

  .caption {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 10px;
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    color: var(--blue-thin-color);
    white-space: nowrap;
  }
}
</style>
