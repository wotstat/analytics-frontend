<template>
  <div class="context-menu-child-header">
    <p>{{ item.label }} </p>
  </div>
</template>


<script setup lang="ts">
import type { ContextMenuItemHeader } from '../createContextMenu';

defineProps<{
  item: ContextMenuItemHeader
}>()


</script>

<style lang="scss" scoped>
@use './shared.scss';

.context-menu-child-header {
  padding: 2px 13px;

  p {
    font-weight: 600;
    font-size: 12.5px;
    color: var(--color-label-tertiary, #EBEBF54D);
    margin: 0;
  }
}
</style>