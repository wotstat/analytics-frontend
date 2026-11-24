<template>
  <button v-if="target === undefined && maxSlots !== undefined"
    ref="trigger"
    class="column-trigger"
    :class="{ 'double-digit-limit': maxSlots >= 10 }"
    type="button"
    @click="open = !open">
    Столбцы · {{ selectedCount }}/{{ maxSlots }}
  </button>

  <ResponsivePanelPopover
    v-model="open"
    :target="target === undefined ? trigger : target"
    :placement
    :title
    :width="900"
    :breakpoint="900"
    :scrollbar-offsets="[40, 14]"
    @content-scroll="emit('dismissOptions')"
    @mode-change="emit('dismissOptions')">
    <template v-if="maxSlots !== undefined" #toolbar="{ isModal }">
      <div class="selection-controls" :class="{ 'modal-mode': isModal }">
        <div class="limit-tip">
          <TipBubbleText
            ref="limitTip"
            :bubble-key="limitTipKey"
            :display="open && selectedCount >= maxSlots"
            auto-extend="always"
            direction="right"
            :page-padding="16"
            text="Максимум столбцов. Чтобы добавить новый, снимите выбор с существующего." />
        </div>

        <ColumnSelectionLimit ref="columnLimit" :selected-count :max-slots>
          <ToolbarButton
            :variant="isModal ? 'surface' : 'plain'"
            size="small"
            :icon="isModal ? undefined : actionIcon"
            :class="{ 'selection-action': isModal }"
            v-tooltip.instant="{ text: actionLabel, disabled: isModal, placement: ['top-float', 'bottom-float'], viewportOffset: 5 }"
            @click="clearOrResetSelection">
            <component :is="actionIcon" />
            <span>{{ actionLabel }}</span>
          </ToolbarButton>
        </ColumnSelectionLimit>
      </div>
    </template>

    <template #content="{ isModal }">
      <slot :is-modal="isModal" />
    </template>
  </ResponsivePanelPopover>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import ClearIcon from '@/assets/icons/x.svg'
import ResetIcon from '@/assets/icons/reset.svg'
import ResponsivePanelPopover from '@/shared/ui/popover/ResponsivePanelPopover.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import ColumnSelectionLimit from './ColumnSelectionLimit.vue'

const props = withDefaults(defineProps<{
  selectedCount: number
  maxSlots?: number
  title?: string
  target?: PopoverTarget | null
  placement?: PlacementParam
  limitTipKey?: string
}>(), {
  title: 'Выбор столбцов',
  placement: () => ['bottom-end', 'bottom-float', 'top-end', 'left-float', 'top-end'],
  limitTipKey: 'column-selection-limit',
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ clear: [], reset: [], dismissOptions: [] }>()

const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const columnLimit = useTemplateRef('columnLimit')
const limitTip = useTemplateRef('limitTip')
const actionIcon = computed(() => props.selectedCount ? ClearIcon : ResetIcon)
const actionLabel = computed(() => props.selectedCount ? 'Очистить' : 'По умолчанию')

watch(open, value => {
  if (!value) emit('dismissOptions')
})

function clearOrResetSelection() {
  emit('dismissOptions')
  if (!props.selectedCount) return emit('reset')
  acceptLimitTip()
  emit('clear')
}

function acceptLimitTip() {
  limitTip.value?.accept()
}

function setLimitHovered(hovered: boolean) {
  columnLimit.value?.setBackgroundHovered(hovered)
}

function showLimitFeedback() {
  columnLimit.value?.showLimitFeedback()
}

defineExpose({ acceptLimitTip, setLimitHovered, showLimitFeedback })
</script>

<style scoped lang="scss">
.column-trigger {
  box-sizing: border-box;
  flex: none;
  width: 120px;
  height: 30px;
  margin-left: auto;
  padding: 0 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;
  white-space: nowrap;

  &.double-digit-limit {
    width: 136px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.selection-controls {
  position: relative;
  display: flex;
  align-items: center;
  width: max-content;
  min-height: 20px;
  margin-left: auto;

  .limit-tip {
    position: absolute;
    top: 50%;
    right: calc(100% + 8px);
    width: 18px;
    transform: translateY(-50%);
  }

  &.modal-mode {
    .limit-tip {
      :deep(.content-container) {
        top: 50%;
        translate: 0 -50%;
      }

      :deep(.tip-content) {
        padding-inline-end: 16px;
      }

      :deep(.spacer) {
        display: none;
      }
    }

    .column-limit {
      --column-limit-background-extra-end: 3px;

      font-size: 14px;
    }
  }

  .selection-action {
    --toolbar-button-width: auto;
    --toolbar-button-height: 30px;

    display: flex;
    flex: none;
    gap: 6px;
    padding: 0 12px 0 8px;
    font-size: 14px;
    white-space: nowrap;
  }

  @media (max-width: 460px) {
    .selection-action {
      --toolbar-button-width: 30px;

      justify-content: center;
      padding: 0;

      span {
        display: none;
      }
    }
  }
}
</style>
