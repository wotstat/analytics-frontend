<template>
  <div class="mode-options">
    <SelectionTile v-for="option in options" :key="option.key" v-bind="battleAttributes(option.key)"
      :selected="selected.includes(option.key) || selectedChildCount(option) > 0" :class="{ archived: option.archived }"
      :accent-color="option.archived || hasArchivedSelection(option) ? archiveAccent : undefined"
      :action="option.children.length > 0" :action-open="active?.key === option.key"
      :action-active="selectedChildCount(option) > 0" @select="emit('select', option.key, $event)"
      @action="openChildren(option, $event)">
      <HighlightString :text="highlight(option.label, search)" class="option-label" />
      <span v-if="option.archived" class="archive-label main-archive-label">архив</span>
      <template #action>
        <span class="dots"></span>
        <span v-if="selectedChildCount(option)" class="selection-badge"
          :class="{ 'archive-badge': option.archived || hasArchivedSelection(option) }">{{ selectedChildCount(option)
          }}</span>
      </template>
    </SelectionTile>
  </div>

  <PanelPopover v-if="active" v-model="submenuOpen" :target="target" :width="280" density="compact" scroll-mode="child"
    :offset="4" :placement="['bottom-end', 'top-end', 'right-start-float', 'left-start-float']">
    <template #content>
      <div class="mode-submenu" @pointerdown.stop @pointerup.stop @click.stop
        @keydown.esc.stop.prevent="closeChildren()">
        <header class="panel-header panel-header--row">
          <h2 class="panel-header-title">{{ active.label }}</h2>
          <SelectionTile density="compact" class="any-variant" v-bind="battleAttributes(active.key)"
            :selected="selected.includes(active.key)" :class="{ archived: active.archived }"
            :accent-color="active.archived ? archiveAccent : undefined" @select="emit('select', active.key, $event)">
            Любой</SelectionTile>
        </header>
        <div class="submenu-content nice-scrollbar">
          <section v-for="(group, index) in submenuGroups" :key="index" class="submenu-group">
            <h3 v-if="group.title && showGroupTitles">{{ group.title }}</h3>
            <div class="mode-options">
              <SelectionTile v-for="option in group.options" :key="option.key" density="compact"
                v-bind="battleAttributes(option.key)" :selected="selected.includes(option.key)"
                :class="{ archived: option.archived }" :accent-color="option.archived ? archiveAccent : undefined"
                @select="emit('select', option.key, $event)">
                <HighlightString :text="highlight(option.label, search)" class="option-label" />
                <span v-if="option.archived" class="archive-label">архив</span>
              </SelectionTile>
            </div>
          </section>
        </div>
      </div>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { highlight } from '@/shared/uiKit/highlightString/highlightUtils'
import { battleModeSelection, selectionContains, type BattleModeOption, type BattleModeSelectionKey, type BattleModeVariant } from './catalog'

const props = defineProps<{
  options: BattleModeOption[]
  selected: BattleModeSelectionKey[]
  archivedSelected: BattleModeSelectionKey[]
  search: string
}>()
const activeKey = defineModel<string | null>('activeKey', { required: true })
const emit = defineEmits<{ select: [key: BattleModeSelectionKey, event: MouseEvent] }>()
const archiveAccent = '#eea650'
const target = shallowRef<HTMLButtonElement | null>(null)
const active = computed(() => props.options.find(option => option.key === activeKey.value))
const submenuOpen = computed({
  get: () => !!active.value,
  set: value => { if (!value) closeChildren() },
})
const submenuGroups = computed(() => {
  const groups: { title?: string, options: BattleModeVariant[] }[] = []
  for (const option of active.value?.children ?? []) {
    const previous = groups.at(-1)
    if (previous && previous.title === option.group) previous.options.push(option)
    else groups.push({ title: option.group, options: [option] })
  }
  return groups
})
const showGroupTitles = computed(() => submenuGroups.value.length > 1)

function battleAttributes(key: BattleModeSelectionKey) {
  const { targets } = battleModeSelection(key)
  return {
    'data-battle-mode': [...new Set(targets.map(target => target.mode))].join(', '),
    'data-battle-gameplay': [...new Set(targets.map(target => target.gameplay ?? '*'))].join(', '),
  }
}

function selectedChildCount(option: BattleModeOption) {
  return props.selected.filter(key => key !== option.key && selectionContains(option.key, key)).length
}

function hasArchivedSelection(option: BattleModeOption) {
  return props.archivedSelected.some(key => selectionContains(option.key, key))
}

function openChildren(option: BattleModeOption, event: MouseEvent) {
  target.value = event.currentTarget as HTMLButtonElement
  activeKey.value = active.value?.key === option.key ? null : option.key
}

function closeChildren() {
  if (active.value) activeKey.value = null
}
</script>

<style scoped lang="scss">
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  margin: 0;
  overflow-wrap: anywhere;

  :deep(.highlight) {
    color: var(--blue-thin-color);
  }
}

.archived {
  color: #d8b28a;
}

.archive-label {
  margin-left: auto;
  padding-left: 8px;
  font-size: 11px;
  opacity: 0.7;
}

.main-archive-label {
  margin-right: -6px;
}

.dots {
  position: relative;

  &,
  &::before,
  &::after {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
  }

  &::before {
    right: 6px;
  }

  &::after {
    left: 6px;
  }
}

.selection-badge {
  position: absolute;
  top: calc(50% - 14px);
  right: 1px;
  display: grid;
  place-items: center;
  min-width: 12px;
  height: 12px;
  padding: 0 2px;
  box-sizing: border-box;
  border-radius: 6px;
  background: var(--selection-tile-accent, var(--blue-thin-color));
  color: #fff;
  font-size: 9px;
  line-height: 1;

  &.archive-badge {
    color: rgba(0, 0, 0, 0.8);
  }
}

.mode-submenu {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: inherit;
}

.any-variant.selection-tile.compact {
  --selection-tile-min-height: 20px;
  --selection-tile-main-padding: 2px 8px;

  flex: none;
  margin-left: auto;
}

.submenu-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
}

.submenu-group h3 {
  margin: 6px 0;
  color: var(--panel-heading-color, #fff);
  font-size: 11px;
  font-weight: 500;
}
</style>
