<template>
  <label class="onslaught-checkbox" :class="{ 'is-checked': model }">
    <input v-model="model" type="checkbox">
    <span class="box" aria-hidden="true"></span>
    <span class="label"><slot /></span>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<style lang="scss" scoped>
.onslaught-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  padding: 4px 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;

  input {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;

    &:focus-visible + .box {
      outline: 2px solid rgba(48, 172, 255, 0.45);
      outline-offset: 2px;
    }
  }

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }

  &.is-checked {
    color: rgba(255, 255, 255, 0.92);
  }
}

.box {
  position: relative;
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.16);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 5px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    filter: blur(1.5px);
    opacity: 0;
    transform: rotate(45deg) scale(0.65);
    transition: filter 0.12s ease, opacity 0.12s ease, transform 0.12s ease;
  }

  .is-checked & {
    border-color: var(--blue-thin-color, #09f);
    background: linear-gradient(145deg, var(--blue-thin-color-hover, #30acff), var(--blue-color, #0a84ff));
    box-shadow: 0 0 0 1px rgba(10, 132, 255, 0.12), 0 2px 6px rgba(10, 132, 255, 0.28);

    &::after {
      filter: blur(0);
      opacity: 1;
      transform: rotate(45deg) scale(1);
    }
  }
}

.label {
  line-height: 1;
}
</style>
