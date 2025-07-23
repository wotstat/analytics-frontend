<template>
  <hr class="separator">
</template>


<script setup lang="ts">
import type { ContextMenuItemSeparator } from '../createContextMenu';

defineProps<{
  item: ContextMenuItemSeparator
}>()


</script>

<style lang="scss" scoped>
.separator {
  margin: 5px 13px;

  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);

}
</style>