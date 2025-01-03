<template>
  <div class="tooltip-parent" :class="{
    highlight: props.highlight,
    [props.pos ?? 'top']: true
  }" :style="{
    '--offset': (props.offset ?? 3) + 'px'
  }">
    <slot></slot>
    <div class="tooltip">
      <slot name="tooltip"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>

const props = defineProps<{
  pos?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
  highlight?: boolean
}>()

</script>

<style lang="scss" scoped>
.tooltip-parent {
  position: relative;
  padding: var(--offset);
  margin: calc(var(--offset) * -1 - 1px);
  border-radius: 5px;
  border: 1px solid transparent;
  transition: border .2s ease;

  &:hover {
    .tooltip {
      opacity: 1;
      display: block;

      @starting-style {
        opacity: 0;
      }
    }
  }

  &.highlight {
    &:hover {
      border: 1px solid #ffffff28;
    }
  }

  .tooltip {
    position: absolute;

    box-shadow: 0px 0px 10px 0px #242424;
    border: 1px solid rgba(93, 93, 93, 0.737254902);
    background-color: #353535;
    border-radius: 10px;
    padding: 8px;

    display: none;
    opacity: 0;
    transition: opacity .3s ease, display .3s ease allow-discrete;

    z-index: 3;
  }

  &.top .tooltip {
    top: 0%;
    left: 50%;
    transform: translate(-50%, calc(-100% - 5px));
  }

  &.bottom .tooltip {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

}
</style>