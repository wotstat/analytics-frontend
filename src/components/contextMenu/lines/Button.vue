<template>
  <div class="context-menu-child-button" :class="classes" @click="onClick" @pointerup="onPointerUp">
    <CheckmarkComponent class="chekmark" v-if="showCheckbox" :visibility="visibleCheckbox ? '' : 'hidden'" />
    <component v-if="item.icon" :is="item.icon" class="icon" />
    <p class="label">{{ item.label }} </p>
  </div>
</template>


<script setup lang="ts">
import { computed, toValue, onRenderTriggered } from 'vue';
import type { ContextMenuItemButton } from '../createContextMenu';
import CheckmarkComponent from '../assets/checkmark.bold.svg'


const props = defineProps<{
  item: ContextMenuItemButton
  options: {
    actionOnPointerUp?: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

const classes = computed(() => {
  return {
    'hover-highlight': !props.item.disabled,
    'disabled': props.item.disabled
  }
})

const showCheckbox = computed(() => toValue(props.item.checkbox) !== undefined)
const visibleCheckbox = computed(() => toValue(props.item.checkbox) === true)

function action() {
  if (props.item.disabled) return
  props.item.action?.()
  emit('onAction')
}

function onClick(e: MouseEvent) {
  if (!props.options.actionOnPointerUp) action()
}

function onPointerUp(e: PointerEvent) {
  if (props.options.actionOnPointerUp) {
    e.stopPropagation()
    action()
  }
}

</script>

<style lang="scss" scoped>
@use './shared.scss';

.context-menu-child-button {
  @extend %icon-line;

  .chekmark {
    fill: var(--color-label, #fff);
    height: 0.65em;
    margin-right: 5px;
    margin-top: 1px;
    margin-left: -5px;
  }

  &.disabled {
    p {
      color: var(--color-label-tertiary, #EBEBF54D);
    }

    .chekmark {
      fill: var(--color-label-tertiary, #EBEBF54D);
    }
  }
}
</style>