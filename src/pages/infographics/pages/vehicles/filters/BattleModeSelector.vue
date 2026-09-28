<template>
  <button ref="trigger" class="mode-trigger" type="button" :aria-expanded="open" @click="open = !open">
    <span class="mode-label">{{ triggerLabel }}</span>
    <ArrowDown class="mode-arrow" aria-hidden="true" />
  </button>

  <PopoverAutoClose v-model="open" :target="trigger"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="filter-popover">
      <header class="popover-heading">
        <h2>Выбор режимов боя</h2>
        <span class="selected-count">{{ model.length ? `Выбрано ${model.length}` : 'Все режимы' }}</span>
      </header>

      <div class="options nice-scrollbar">
        <button class="option all" type="button" :class="{ selected: model.length === 0 }"
          :aria-pressed="model.length === 0" @click="selectAll">
          Все режимы
        </button>

        <section v-for="group in groups" :key="group.title" class="category">
          <h3>{{ group.title }}</h3>
          <div class="tiles">
            <button v-for="option in group.options" :key="option.value" class="option" type="button"
              :class="{ selected: model.includes(option.value) }" :aria-pressed="model.includes(option.value)"
              @click="selectMode(option.value, $event)" @contextmenu="onOptionContextMenu(option.value, $event)">
              {{ option.label }}
            </button>
          </div>
        </section>
      </div>

      <p class="selection-hint">Ctrl + клик — выбрать несколько</p>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import type { VehicleBattleMode } from './types'

const props = defineProps<{
  groups: readonly { title: string, options: readonly { value: VehicleBattleMode, label: string }[] }[]
}>()

const model = defineModel<VehicleBattleMode[]>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

const labels = computed(() => new Map(props.groups.flatMap(group => group.options)
  .map(option => [option.value, option.label])))
const triggerLabel = computed(() => {
  if (!model.value.length) return 'Все режимы'
  const first = labels.value.get(model.value[0]) ?? model.value[0]
  return model.value.length === 1 ? first : `${first} и ещё ${model.value.length - 1}`
})

function selectMode(value: VehicleBattleMode, event: MouseEvent) {
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    model.value = model.value.includes(value)
      ? model.value.filter(mode => mode !== value)
      : [...model.value, value]
    return
  }

  model.value = [value]
  open.value = false
}

function onOptionContextMenu(value: VehicleBattleMode, event: MouseEvent) {
  if (!event.ctrlKey) return
  event.preventDefault()
  selectMode(value, event)
}

function selectAll() {
  model.value = []
  open.value = false
}
</script>

<style scoped lang="scss">
.mode-trigger {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .mode-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode-arrow {
    flex: none;
    width: 10px;
    height: 10px;
    margin-left: 5px;
    fill: currentColor;
    opacity: 0.6;
  }
}

.filter-popover {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(560px, calc(100vw - 24px));
  max-height: min(640px, 70dvh);

  @media (max-width: 550px) {
    max-height: 50dvh;
  }

  .popover-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .selected-count {
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
      white-space: nowrap;
    }
  }

  .options {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin-right: 3px;
    padding: 16px 13px 16px 16px;

    &::-webkit-scrollbar-track {
      margin-block: 10px;
    }

    .option {
      position: relative;
      min-width: 0;
      min-height: 34px;
      padding: 8px 12px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.05);
      color: inherit;
      text-align: left;
      font-size: 14px;
      line-height: 1.2;
      user-select: none;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      }

      &.selected {
        background: rgba(255, 255, 255, 0.1);

        &::before {
          content: '';
          position: absolute;
          top: 7px;
          bottom: 7px;
          left: 0;
          width: 3px;
          border-radius: 3px;
          background: var(--blue-thin-color);
        }
      }

      &.all {
        width: 100%;
      }
    }

    .category {
      margin-top: 16px;

      &+.category {
        margin-top: 20px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
        gap: 6px;
      }
    }
  }

  .selection-hint {
    margin: 0;
    padding: 10px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
  }
}
</style>
