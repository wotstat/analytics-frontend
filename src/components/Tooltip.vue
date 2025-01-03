<template>
  <div class="tooltip-parent" :class="{
    'highlight': props.highlight,
    'interactive': props.interactive,
    [props.pos ?? 'top']: true
  }" :style="{
    '--offset': (props.offset ?? 3) + 'px',
    '--delay': (props.delay ?? 0.2) + 's'
  }">
    <slot></slot>
    <div class="tooltip-container">
      <div class="tooltip">
        <slot name="tooltip"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

const props = defineProps<{
  pos?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
  highlight?: boolean
  interactive?: boolean
  delay?: number
}>()

</script>

<style lang="scss" scoped>
.tooltip-parent {
  position: relative;
  padding: var(--offset);
  margin: calc(var(--offset) * -1 - 1px);
  border-radius: 5px;
  border: 1px solid transparent;
  transition: border .4s ease;

  &:hover {
    .tooltip-container {
      opacity: 1;
      display: block;
      transition-delay: var(--delay);

      @starting-style {
        opacity: 0;
      }
    }
  }

  &.highlight {
    &:hover {
      transition-delay: var(--delay);
      border: 1px solid #ffffff28;
    }
  }

  &.interactive {
    .tooltip-container {
      pointer-events: all;
    }
  }

  .tooltip-container {
    position: absolute;

    display: none;
    opacity: 0;
    transition: opacity .3s ease, display .3s ease allow-discrete;
    padding: 3px;

    z-index: 3;

    pointer-events: none;

    .tooltip {
      box-shadow: 0px 0px 10px 0px #242424;
      border: 1px solid rgba(93, 93, 93, 0.737254902);
      background-color: #353535;
      border-radius: 10px;
      padding: 8px;
    }
  }

  &.top .tooltip-container {
    top: 0%;
    left: 50%;
    padding-bottom: 5px;
    transform: translate(-50%, -100%);
  }

  &.bottom .tooltip-container {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

}
</style>