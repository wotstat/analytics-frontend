<template>
  <ResponsivePanelPopover
    v-model="open"
    :target
    :title="label"
    :width="width ?? 250"
    density="compact"
    :placement="['bottom-end', 'top-end', 'right-start-float', 'left-start-float']"
    :offset="4">

    <template v-if="$slots.toolbar" #toolbar="{ isModal }">
      <slot name="toolbar" :is-modal="isModal" />
    </template>

    <template #content="{ isModal }">
      <div
        class="metric-options-menu"
        :class="{ 'is-modal': isModal }"
        @pointerdown.stop
        @pointerup.stop
        @click.stop>
        <div class="sections">
          <section v-for="(section, index) in sections" :key="index">
            <h3 v-if="section.title">
              {{ section.title }}
              <span v-if="section.help"
                class="help"
                v-help-tooltip="{ content: helpComponents[section.help], disabled: !open }">?</span>
            </h3>
            <div class="options" :style="{ gridTemplateColumns: `repeat(${section.columns ?? 1}, minmax(0, 1fr))` }">
              <SelectionTile v-for="option in section.options"
                :key="option.value"
                :density="isModal ? 'standard' : 'compact'"
                :class="{ wide: option.wide }"
                :accent-color="color"
                :selected="selected.includes(option.value)"
                :disabled="isOptionDisabled(option.value)"
                report-disabled-click
                @pointerenter="hoverOption(option.value, $event)"
                @pointerleave="emit('limitHover', false)"
                @select="emit('select', option.value)"
                @disabled-click="emit('disabledClick')">
                {{ option.label }}
              </SelectionTile>
            </div>
          </section>
        </div>
      </div>
    </template>
  </ResponsivePanelPopover>
</template>

<script setup lang="ts" generic="Key extends string">
import { h, markRaw, watch, type Component } from 'vue'
import ResponsivePanelPopover from '@/shared/ui/popover/ResponsivePanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import QuantileTooltip from './QuantileTooltip.vue'
import type { MetricOptionSection } from './utils/aggregations'

const helpComponents = { quantiles: markRaw(QuantileTooltip) }

const vHelpTooltip = useTooltip<{ content: Component, disabled: boolean }>(
  (props: { content: Component }) => h(props.content), {
  interactive: true, interactiveDelay: 450, interactiveHideDelay: 300,
  arrowSize: 6, offset: 8,
  placement: ['right-float', 'left-float', 'top-float', 'bottom-float'],
  viewportOffset: popoverViewportOffset,
  valueAdapter: value => ({ contentProps: { content: value.content }, tooltipProps: { disabled: value.disabled } }),
})

const props = defineProps<{
  label: string
  sections?: readonly MetricOptionSection<Key>[]
  color?: string
  width?: number
  target: HTMLButtonElement | null
  selected: readonly Key[]
  canSelect: (value: Key) => boolean
}>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  select: [slot: Key]
  limitHover: [hovered: boolean]
  disabledClick: []
}>()

watch(open, isOpen => {
  if (!isOpen) emit('limitHover', false)
})

function isOptionDisabled(slot: Key) {
  return !props.canSelect(slot)
}

function hoverOption(slot: Key, event: PointerEvent) {
  const hovered = event.pointerType === 'mouse' && isOptionDisabled(slot)
  emit('limitHover', hovered)
}
</script>

<style scoped lang="scss">
.metric-options-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  line-height: 1.3;

  .sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 11px;
    font-weight: 500;
  }

  .options {
    display: grid;
    gap: 4px;
    font-variant-numeric: tabular-nums;
    --selection-tile-justify-content: center;
    --selection-tile-main-padding: 5px 4px;

    .wide {
      grid-column: 1 / -1;
    }
  }

  .help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: bold;
    border-radius: 50%;
    cursor: help;
  }

  &.is-modal {
    h3 {
      font-size: 14px;
    }

    .help {
      width: 16px;
      height: 16px;
      font-size: 12px;
    }
  }
}
</style>
