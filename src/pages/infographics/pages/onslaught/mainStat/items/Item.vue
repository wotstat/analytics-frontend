<template>
  <div class="item mt-font" ref="item">
    <div class="normal">
      <div class="icon" ref="icon">
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

    <PopoverAutoClose :target="item" v-model="hover" :placement="['bottom-float']"
      :viewport-offset="{ top: headerOffset, bottom: 10, left: 10, right: 10 }" :arrow-size="5"
      :offset="{ top: tooltipTopOffset }" v-if="slots.tooltip">
      <div class="tooltip">
        <slot name="tooltip"></slot>
      </div>
    </PopoverAutoClose>

  </div>
</template>


<script setup lang="ts">
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { useElementHover, useElementSize } from '@vueuse/core'
import { computed, ref, useSlots } from 'vue'

const props = defineProps<{
}>()

const item = ref<HTMLElement | null>(null)

const { width } = useElementSize(item)
const tooltipTopOffset = computed(() => width.value <= 160 ? 7 : 0)

const slots = useSlots()
const hover = useElementHover(item)
const t = ref<boolean>(true)

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