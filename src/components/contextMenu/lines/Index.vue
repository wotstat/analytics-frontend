<template>
  <component :is="componentByVariant[item.type]" :item="item" @on-action="emit('onAction')" :options="options" />
</template>

<script setup lang="ts">
import { ContextMenuItemVariant, type ContextMenuItem } from '../createContextMenu';
import ChildLine from './Child.vue'
import ButtonLine from './Button.vue'
import SeparatorLine from './Separator.vue'
import HeaderLine from './Header.vue'

const componentByVariant: Record<ContextMenuItemVariant, any> = {
  [ContextMenuItemVariant.Child]: ChildLine,
  [ContextMenuItemVariant.Separator]: SeparatorLine,
  [ContextMenuItemVariant.Button]: ButtonLine,
  [ContextMenuItemVariant.Header]: HeaderLine
}

const props = defineProps<{
  item: ContextMenuItem,
  options: {
    actionOnPointerUp?: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

</script>