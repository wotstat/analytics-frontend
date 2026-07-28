<template>
  <Teleport to="body">
    <div class="viewport-box" v-if="display" :style="style">
      <span class="caption">{{ label ?? 'viewportOffset' }} {{ caption }}</span>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { generateOffset, OffsetValue } from '@/shared/uiKit/popover/utils'

const props = defineProps<{
  display: boolean
  offset: OffsetValue
  label?: string
}>()

const sides = computed(() => generateOffset(props.offset))

const style = computed(() => ({
  top: `${sides.value.top}px`,
  left: `${sides.value.left}px`,
  right: `${sides.value.right}px`,
  bottom: `${sides.value.bottom}px`,
}))

const caption = computed(() => {
  const { top, right, bottom, left } = sides.value
  return `${Math.round(top)}/${Math.round(right)}/${Math.round(bottom)}/${Math.round(left)}`
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
