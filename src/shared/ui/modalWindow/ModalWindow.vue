<template>
  <Teleport to="body">
    <Transition @before-enter="emit('before-open')" @after-leave="emit('after-close')">
      <ModalWindowContent :title="title" v-if="display" @close="emit('close')"
        :style="{ '--margin-block-start': marginBlockStart }">
        <template #controls>
          <slot name="controls"></slot>
        </template>

        <template #header-content>
          <slot name="header-content"></slot>
        </template>

        <slot></slot>
      </ModalWindowContent>
    </Transition>
  </Teleport>
</template>


<script setup lang="ts">
import ModalWindowContent from './ModalWindowContent.vue'

const props = defineProps<{
  title: string
  display: boolean
  marginBlockStart: string
}>()

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'before-open'): void
  (e: 'after-close'): void
}>()

</script>


<style lang="scss" scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;

  :deep(.background) {
    transition: opacity 0.3s ease;
  }

  :deep(.modal) {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

}

.v-enter-from,
.v-leave-to {

  :deep(.background) {
    opacity: 0;
  }

  :deep(.modal) {
    transform: translateY(20px);
    opacity: 0;
  }
}
</style>