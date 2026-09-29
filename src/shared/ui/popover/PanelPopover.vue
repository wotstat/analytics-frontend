<template>
  <PopoverAutoClose v-model="open" :target :placement="panelPlacement" :offset :arrow-size="arrowSize"
    :viewport-offset="popoverViewportOffset" :close-on-outside-window="closeOnOutsideWindow">
    <div class="panel-popover" :class="{ compact: density === 'compact', 'child-scroll': scrollMode === 'child' }"
      :style="panelStyle">
      <slot v-if="$slots.header" name="header" />
      <header v-else-if="title || $slots.toolbar" class="panel-header panel-header--row">
        <h2 v-if="title" class="panel-header-title">{{ title }}</h2>
        <div v-if="$slots.toolbar" class="panel-toolbar"><slot name="toolbar" /></div>
      </header>

      <template v-if="scrollMode === 'child'">
        <slot name="content"><slot /></slot>
      </template>
      <div v-else class="panel-content nice-scrollbar" @scroll="$emit('contentScroll', $event)">
        <slot name="content"><slot /></slot>
      </div>

      <footer v-if="$slots.footer" class="panel-footer"><slot name="footer" /></footer>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRafFn } from '@vueuse/core'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { getViewportRect, type CloseOnOutsideWindow, type OffsetValue, type PlacementParam, type PlacementWithModifiers, type PopoverTarget } from '@/shared/uiKit/popover/utils'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'

const props = withDefaults(defineProps<{
  target: PopoverTarget | null
  title?: string
  density?: 'standard' | 'compact'
  scrollMode?: 'panel' | 'child'
  width?: number
  placement?: PlacementParam
  offset?: OffsetValue
  arrowSize?: number
  closeOnOutsideWindow?: CloseOnOutsideWindow
}>(), {
  density: 'standard',
  scrollMode: 'panel',
  width: 360,
  arrowSize: 0,
})

const open = defineModel<boolean>({ default: false })
defineEmits<{ contentScroll: [event: Event] }>()

const availableHeight = ref(700)
const availableWidth = ref(360)
const panelPlacement = computed<PlacementParam>(() => {
  const preferred = Array.isArray(props.placement) ? props.placement : [props.placement ?? 'bottom-float']
  return preferred.map(value => value.endsWith('-float') ? value : `${value}-float` as PlacementWithModifiers)
})

function updateAvailableHeight() {
  const viewport = getViewportRect()
  availableWidth.value = Math.max(0, Math.floor(viewport.right - viewport.left - 24))
  if (!props.target) return
  const target = props.target.getBoundingClientRect()
  const spaceAbove = target.y - viewport.top - popoverViewportOffset.value.top - 9
  const spaceBelow = viewport.bottom - popoverViewportOffset.value.bottom - target.y - target.height - 9
  availableHeight.value = Math.max(0, Math.floor(Math.max(spaceAbove, spaceBelow)))
}

const { pause, resume } = useRafFn(updateAvailableHeight, { immediate: false })
watch(open, isOpen => {
  if (isOpen) {
    updateAvailableHeight()
    resume()
  } else pause()
}, { immediate: true, flush: 'sync' })

const panelStyle = computed(() => ({
  '--panel-width': `${props.width}px`,
  '--panel-viewport-top': `${popoverViewportOffset.value.top}px`,
  '--panel-available-height': `${availableHeight.value}px`,
  '--panel-available-width': `${availableWidth.value}px`,
}))
</script>

<style scoped lang="scss">
.panel-popover {
  --panel-padding: 14px;
  --panel-height-limit: min(700px, var(--panel-viewport-height-limit, 70dvh), var(--panel-available-height), calc(100dvh - var(--panel-viewport-top) - 10px));

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(var(--panel-width), var(--panel-available-width));
  max-height: var(--panel-height-limit);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.3;

  :deep(.panel-header) {
    box-sizing: border-box;
    flex: none;
    width: 100%;
    min-width: 0;
    padding: var(--panel-header-padding, var(--panel-padding));
    border-bottom: var(--panel-header-border, 1px solid rgba(255, 255, 255, 0.1));
  }

  :deep(.panel-header--row) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }

  :deep(.panel-header-title) {
    min-width: 0;
    margin: var(--panel-header-title-margin, 0);
    overflow-wrap: anywhere;
    font-size: var(--panel-header-title-font-size, 16px);
    font-weight: 600;
    line-height: var(--panel-header-title-line-height, 20px);
  }

  :deep(.panel-header--row > .panel-header-title) {
    flex: 1 1 140px;
  }

  .panel-toolbar {
    display: flex;
    flex: none;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }

  .panel-content {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin-right: 3px;
    padding: var(--panel-padding);

    &::-webkit-scrollbar-track {
      margin-block-start: var(--panel-scrollbar-track-start, 10px);
      margin-block-end: var(--panel-scrollbar-track-end, 10px);
    }

    :deep(.panel-section + .panel-section) {
      margin-top: 20px;
    }

    :deep(.panel-divider) {
      height: 0;
      margin: 12px 0;
      border: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    :deep(.panel-section > :is(h3, h4, h5)) {
      margin: 0 0 8px;
      color: var(--panel-heading-color, #fff);
      font-size: 14px;
      font-weight: 500;
    }

    :deep(.panel-section > h4) {
      font-size: 13px;
    }

    :deep(.panel-section > h5) {
      font-size: 12px;
    }

    :deep(.panel-note) {
      margin: 0;
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
    }
  }

  .panel-footer {
    flex: none;
    padding: var(--panel-padding);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
  }

  &.compact {
    --panel-padding: 10px;
    --panel-header-title-font-size: 14px;
    --panel-header-title-line-height: 18px;

    font-size: 12px;

    .panel-content :deep(.panel-section > :is(h3, h4, h5)) {
      margin-bottom: 6px;
      font-size: 12px;
    }

    .panel-content :deep(.panel-section > h4) {
      font-size: 11px;
    }

    .panel-content :deep(.panel-section > h5) {
      font-size: 10px;
    }
  }

  @media (max-width: 500px) {
    &.child-scroll {
      width: var(--panel-available-width);
    }
  }
}
</style>
