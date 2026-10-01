<template>
  <component :is="icons[angle][weight]" class="dropdown-arrow"
    :class="{ 'is-expanded': expanded, 'is-horizontal': horizontal }" />
</template>

<script setup lang="ts">
import SmallBoldArrow from './assets/small-bold.svg'
import SmallThinArrow from './assets/small-thin.svg'
import LargeBoldArrow from './assets/large-bold.svg'
import LargeThinArrow from './assets/large-thin.svg'

const icons = {
  small: { bold: SmallBoldArrow, thin: SmallThinArrow },
  large: { bold: LargeBoldArrow, thin: LargeThinArrow },
}

withDefaults(defineProps<{
  expanded?: boolean
  horizontal?: boolean
  weight?: 'thin' | 'bold'
  angle?: 'small' | 'large'
}>(), {
  expanded: false,
  horizontal: false,
  weight: 'bold',
  angle: 'small',
})
</script>

<style scoped lang="scss">
.dropdown-arrow {
  display: inline-block;
  flex: none;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  transition: transform 0.15s;
  transform: rotate(0deg);

  &.is-expanded {
    transform: rotate(180deg);
  }

  &.is-horizontal {
    transform: rotate(-90deg);

    &.is-expanded {
      transform: rotate(0deg);
    }
  }
}
</style>
