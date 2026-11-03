<template>
  <div class="toolbar-group">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.toolbar-group {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}
</style>
