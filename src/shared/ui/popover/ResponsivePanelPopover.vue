<template>
  <PanelPopover v-if="!isModal" v-bind="panelProps" v-model="panelOpen" @content-scroll="emit('contentScroll', $event)">
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" :is-modal="isModal" /></template>
  </PanelPopover>

  <ModalWindow v-else :display="open" :title="title ?? ''" class="responsive-panel-popup"
    :class="{ compact: density === 'compact', 'child-scroll': scrollMode === 'child' }"
    :style="{ '--panel-popup-width': `${width ?? 360}px` }" @close="close">
    <template v-if="$slots.header" #header>
      <div class="popup-header">
        <div class="custom-header"><slot name="header" :is-modal="isModal" /></div>
        <CloseButton @click="open = false" />
      </div>
    </template>
    <template v-else-if="$slots.toolbar" #controls><slot name="toolbar" :is-modal="isModal" /></template>
    <template v-if="$slots['header-content']" #header-content>
      <div class="popup-header-content"><slot name="header-content" :is-modal="isModal" /></div>
    </template>
    <PanelContent :density :scroll-mode="scrollMode" :scrollbar-offsets="scrollbarOffsets"
      @scroll="emit('contentScroll', $event)">
      <slot name="content" :is-modal="isModal"><slot :is-modal="isModal" /></slot>
    </PanelContent>
    <template v-if="$slots.footer" #footer-content>
      <div class="popup-footer"><slot name="footer" :is-modal="isModal" /></div>
    </template>
  </ModalWindow>
</template>

<script setup lang="ts">
import { computed, inject, onScopeDispose, provide, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import CloseButton from '@/shared/ui/modalWindow/buttons/closeButton/CloseButton.vue'
import PanelPopover from './PanelPopover.vue'
import PanelContent from './PanelContent.vue'
import { openChildPanelsKey, type PanelPopoverProps } from './utils/panelPopover'

const props = withDefaults(defineProps<PanelPopoverProps & { breakpoint?: number }>(), { breakpoint: 700 })
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  contentScroll: [event: Event]
  modeChange: [isModal: boolean]
}>()

const isModal = useMediaQuery(() => `(max-width: ${props.breakpoint}px)`)
const panelProps = computed(() => {
  const { breakpoint, ...panel } = props
  return panel
})

const parentChildren = inject(openChildPanelsKey, null)
const openChildren = ref(0)
provide(openChildPanelsKey, openChildren)

const panelOpen = computed({
  get: () => open.value,
  set: value => {
    if (value || !openChildren.value) open.value = value
  },
})

let registered = false
watch(open, value => {
  if (!parentChildren || registered === value) return
  parentChildren.value += value ? 1 : -1
  registered = value
}, { immediate: true })

onScopeDispose(() => {
  if (parentChildren && registered) parentChildren.value--
})

watch(isModal, value => emit('modeChange', value))

function close() {
  panelOpen.value = false
}
</script>

<style lang="scss">
// Корень ModalWindow телепортируется; стили ограничены классом адаптивной панели.
.modal-window.responsive-panel-popup {
  --panel-padding: 14px;

  font-size: 14px;
  line-height: 1.3;

  .modal {
    width: var(--panel-popup-width);
    height: auto;
    max-height: calc(100dvh - 30px);
    overflow: hidden;

    > main.nice-scrollbar {
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      scrollbar-gutter: auto;
    }

    > header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    > footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    > header .title-line {
      min-height: 50px;
      max-height: none;

      h1 {
        min-width: 0;
        padding-block: 12px;
        overflow-wrap: anywhere;
      }

      .controls {
        white-space: nowrap;
        flex: none;
        align-items: center;
        gap: 10px;

        .toolbar-button.variant-round {
          --toolbar-button-size: 30px;
          --toolbar-icon-size: 16px;
        }
      }
    }
  }

  .popup-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: var(--panel-padding);

    .custom-header {
      flex: 1;
      min-width: 0;

      .panel-header-title {
        margin: 0;
        font-size: 18px;
      }
    }
  }

  .popup-header-content {
    padding: 0 var(--panel-padding) var(--panel-padding);
  }

  .popup-footer {
    padding: var(--panel-padding);
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
  }

  &.compact {
    --panel-padding: 10px;
    font-size: 12px;
  }

  &.child-scroll .modal > main.nice-scrollbar {
    flex: 1;
  }

  @media (max-width: 700px) {
    .modal {
      width: 100%;
    }
  }
}
</style>
