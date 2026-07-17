<template>
  <div class="item mt-font" v-tooltip-target.instant>
    <div class="normal">
      <div class="icon">
        <slot name="icon"></slot>
      </div>
      <div class="right">
        <div class="value">
          <slot name="value"></slot>
        </div>
        <div class="subline">
          <slot name="subline"></slot>
        </div>
      </div>
    </div>
    <div class="small">
      <div class="value-line">
        <div class="icon">
          <slot name="icon"></slot>
        </div>
        <div class="value">
          <slot name="value"></slot>
        </div>
      </div>
      <div class="subline">
        <slot name="subline"></slot>
      </div>
    </div>

    <DefineTooltip :placement="['bottom-float']" :arrow-size="7" :viewport-offset="popoverViewportOffset"
      :class="'comp7-tooltip'" :offset="{ top: tooltipTopOffset }">
      <div class="tooltip" v-if="slots.tooltip">
        <slot name="tooltip"></slot>
      </div>
    </DefineTooltip>

  </div>
</template>

<script setup lang="ts">
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { defineTooltip } from '@/shared/uiKit/tooltip/tooltip'
import { useElementSize } from '@vueuse/core'
import { computed, useSlots, useTemplateRef } from 'vue'


const { DefineTooltip, vTooltipTarget } = defineTooltip()

const props = defineProps<{
}>()

const item = useTemplateRef<HTMLElement>('item')

const { width } = useElementSize(item)
const tooltipTopOffset = computed(() => width.value <= 160 ? 7 : 0)

const slots = useSlots()

</script>

<style lang="scss" scoped>
.item {
  display: flex;
  container: item / inline-size;

  .icon {
    display: flex;
    align-items: center;
    user-select: none;
    pointer-events: none;
  }

  .value {
    font-size: 24px;
    font-weight: bold;
    line-height: 1;
  }

  .normal {
    display: none;

    @container item (width > 160px) {
      display: contents;
    }

    .icon {
      width: 55px;
      height: 55px;
    }

    .value {
      font-size: 24px;
      font-weight: bold;
      line-height: 1;
    }

    .right {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  .small {
    display: none;
    flex-direction: column;

    @container item (width <=160px) {
      display: flex;
    }

    .value-line {
      display: flex;
      align-items: center;

      .icon {
        height: 35px;
        display: flex;
        align-items: center;
      }
    }
  }
}

.tooltip {
  padding: 11px 15px;
}
</style>