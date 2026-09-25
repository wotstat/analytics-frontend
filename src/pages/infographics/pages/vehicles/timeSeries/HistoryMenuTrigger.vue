<template>
  <button class="history-menu-trigger" type="button" title="Настройки аннотаций">
    <span class="dots"></span>
  </button>
</template>

<style scoped lang="scss">
.history-menu-trigger {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-left: -2px;
  border-radius: 5px;
  padding: 0;
  color: rgba(197, 197, 197, 0.6);

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
  }

  .dots {
    position: relative;

    &,
    &::before,
    &::after {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: currentColor;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
    }

    &::before {
      right: 6px;
    }

    &::after {
      left: 6px;
    }
  }
}
</style>
