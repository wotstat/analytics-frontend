<template>
  <button ref="trigger" class="mode-trigger" type="button" @click="open = !open">
    <span class="mode-label">{{ triggerLabel }}</span>
    <ArrowDown class="mode-arrow" />
  </button>

  <PanelPopover v-model="open" :target="trigger" title="Выбор режимов боя" :width="560" class="battle-mode-panel"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']">
    <template #toolbar>
      <span class="selected-count">{{ model.length ? `Выбрано ${model.length}` : 'Все режимы' }}</span>
    </template>

    <template #content>
      <div class="options">
        <SelectionTile class="option all" :selected="model.length === 0" @select="selectAll">
          Все режимы
        </SelectionTile>

        <section v-for="group in groups" :key="group.title" class="category panel-section">
          <h3>{{ group.title }}</h3>
          <div class="tiles">
            <SelectionTile v-for="option in group.options" :key="option.value" class="option"
              :selected="model.includes(option.value)" @select="selectMode(option.value, $event)"
              @contextmenu="onOptionContextMenu(option.value, $event)">
              {{ option.label }}
            </SelectionTile>
          </div>
        </section>
      </div>
    </template>

    <template #footer>Ctrl + клик — выбрать несколько</template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
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

.selected-count {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  white-space: nowrap;
}

.options {
  .all {
    width: 100%;
  }

  .category {
    &.panel-section:first-of-type {
      margin-top: 16px;
    }

    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
      gap: 6px;
    }
  }
}

@media (max-width: 550px) {
  :global(.battle-mode-panel .panel-popover) {
    --panel-viewport-height-limit: 50dvh;
  }
}
</style>
