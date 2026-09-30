<template>
  <div class="toolbar-group">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.toolbar-group {
  display: flex;
  align-items: center;
  flex-wrap: var(--toolbar-group-wrap, wrap);
  gap: 8px;
  min-width: 0;
}
</style>
