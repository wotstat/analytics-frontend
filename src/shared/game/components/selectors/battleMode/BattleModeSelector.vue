<template>
  <button ref="trigger" class="mode-trigger" :class="{ open }" type="button" @click="open = !open">
    <span class="mode-label">{{ triggerLabel }}</span>
    <DropdownArrow class="mode-arrow" :expanded="open" />
  </button>

  <ResponsivePanelPopover v-model="open" :target="trigger" :width="380" title="Выбор режимов боя" modal-full-height
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']" @content-scroll="activeKey = null"
    :scrollbar-offsets="[14, 14]" @mode-change="activeKey = null">
    <template #header-content="{ isModal }">
      <div class="header-filters" :class="{ 'modal-mode': isModal }">
        <div class="search-header-line">
          <SearchLine v-model="search" class="mode-search" placeholder="Поиск режима" />
          <div v-if="!game && regions === undefined" class="game-select">
            <div class="vr"></div>
            <button v-for="variant in gameOptions" :key="variant.key" type="button" class="variant mt-font selectable"
              :class="{ active: selectedGame === variant.key }" @click="selectedGame = variant.key">
              {{ variant.label }}
            </button>
          </div>
        </div>
        <label class="archive-toggle"><input v-model="showArchived" type="checkbox">Отображать архивные</label>
      </div>
    </template>

    <template #content="{ isModal }">
      <div class="mode-list" :class="{ 'modal-mode': isModal }">
        <SelectionTile :selected="model.length === 0" data-battle-mode="*" data-battle-gameplay="*" @select="selectAll">
          Все режимы</SelectionTile>
        <section v-for="category in visibleCategories" :key="category.title" class="mode-category">
          <h3>{{ category.title }}</h3>
          <BattleModeOptions v-model:active-key="activeKey" :options="category.options" :selected="model"
            :archived-selected="archivedSelected" :search @select="select" />
        </section>
        <p v-if="!visibleCategories.length" class="mode-notice">Ничего не найдено</p>
        <p v-if="loading" class="mode-notice">Проверка дополнительных режимов…</p>
        <p v-else-if="failed" class="mode-notice">
          Не удалось загрузить дополнительные режимы. <button type="button" @click="load">Повторить</button>
        </p>
      </div>
    </template>

    <template v-if="multiple && selectionPriority === 'single'" #footer>
      Ctrl + клик — выбрать несколько
    </template>
  </ResponsivePanelPopover>
</template>

<script setup lang="ts">
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import { usePopoverCloseDelay } from '@/shared/uiKit/popover/usePopoverCloseDelay'
import ResponsivePanelPopover from '@/shared/ui/popover/ResponsivePanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { highlight } from '@/shared/uiKit/highlightString/highlightUtils'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { buildBattleModeCategories, type BattleModeOption } from './catalog'
import { battleModeSelection, selectionContains, toggleBattleMode, type BattleModeSelectionKey } from '@/shared/game/domain/battleModes/battleModeSelection'
import { regionToGame, type GameRegion, type GameVendor } from '@/shared/game/domain/wot'
import SearchLine from '../components/searchLine/SearchLine.vue'
import BattleModeOptions from './BattleModeOptions.vue'
import { useObservedBattleModes } from './useObservedBattleModes'

const props = withDefaults(defineProps<{
  game?: GameVendor
  regions?: GameRegion[]
  multiple?: boolean
  selectionPriority?: 'single' | 'multiple'
}>(), { multiple: true, selectionPriority: 'single' })

const model = defineModel<BattleModeSelectionKey[]>({ required: true })
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const open = ref(false)
const { closeAfterSelection, cancelClose } = usePopoverCloseDelay(open)
const search = ref('')
const showArchived = ref(false)
const selectedGame = ref<GameVendor>(props.game ?? preferredGameOrDefault.value)
const activeKey = ref<string | null>(null)
const gameOptions = [{ key: 'mt', label: 'Lesta' }, { key: 'wot', label: 'WG' }] as const
const games = computed<GameVendor[]>(() => {
  if (props.game) return [props.game]
  if (props.regions !== undefined) return props.regions.length ? [...new Set(props.regions.map(regionToGame))] : ['mt', 'wot']
  return [selectedGame.value]
})
const { rows, loading, failed, load } = useObservedBattleModes()
const categories = computed(() => buildBattleModeCategories(games.value, rows.value, showArchived.value))
const archivedOptions = computed(() => buildBattleModeCategories(games.value, rows.value, true)
  .flatMap(category => category.options.flatMap(option => [option, ...option.children]))
  .filter(option => option.archived))
const archivedSelected = computed(() => model.value.filter(key =>
  archivedOptions.value.some(option => selectionContains(option.key, key))))
const triggerLabel = computed(() => {
  if (!model.value.length) return 'Все режимы'
  if (model.value.length > 1) return `Режимы · ${model.value.length}`
  return battleModeSelection(model.value[0]).title
})

function matches(text: string) {
  return highlight(text, search.value).highlight.length > 0
}

function filterOptions(options: BattleModeOption[]): BattleModeOption[] {
  return options.flatMap(option => {
    if (matches(option.label) || matches(option.key)) return [option]
    const children = option.children.filter(child => matches(child.label) || matches(child.key) || (child.group && matches(child.group)))
    return children.length ? [{ ...option, children }] : []
  })
}

const visibleCategories = computed(() => {
  if (!search.value.trim()) return categories.value
  return categories.value.map(category => ({
    ...category, options: matches(category.title) ? category.options : filterOptions(category.options),
  })).filter(category => category.options.length)
})

watch(open, isOpen => {
  activeKey.value = null
  if (isOpen) void load()
})
watch([games, search, showArchived], () => { activeKey.value = null })


function isMultiple(event: MouseEvent) {
  return props.multiple && (props.selectionPriority === 'multiple' || event.ctrlKey || event.metaKey || event.shiftKey)
}

function select(key: BattleModeSelectionKey, event: MouseEvent) {
  cancelClose()
  if (isMultiple(event)) model.value = toggleBattleMode(model.value, key)
  else {
    model.value = [key]
    closeAfterSelection()
  }
}

function selectAll(event: MouseEvent) {
  cancelClose()
  model.value = []
  if (!isMultiple(event)) closeAfterSelection()
  activeKey.value = null
}
</script>

<style lang="scss" scoped>
.mode-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;
  transition: background 0.15s;

  &.open,
  &:active {
    background: rgba(255, 255, 255, 0.1);
  }

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
    width: 10px;
    height: 10px;
    margin-left: auto;
    opacity: 0.7;
  }
}

.header-filters {
  .search-header-line {
    display: flex;
    gap: 5px;
    align-items: center;

    .game-select {
      display: contents;

      .variant {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        padding: 0 7px;
        line-height: 1;
        font-size: 12px;
      }

      .selectable {
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 5px;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.07s;
        border: none;

        &:active {
          background-color: rgba(255, 255, 255, 0.2);
        }

        @media (hover: hover) and (pointer: fine) {
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }
        }

        &.active {
          background-color: var(--blue-color);
        }
      }

      .vr {
        width: 1px;
        height: 30px;
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }

  &.modal-mode {
    .search-header-line {
      gap: 8px;

      .mode-search {
        flex: 1;
        min-width: 0;
        height: 40px;

        :deep(input) {
          font-size: 16px;
        }

        :deep(.clear-input) {
          padding: 10px;
        }
      }

      .game-select .variant {
        height: 34px;
        padding-inline: 10px;
        font-size: 14px;
      }
    }

    .archive-toggle {
      min-height: 34px;
      gap: 8px;
      font-size: 16px;

      input {
        flex: none;
        width: 16px;
        height: 16px;
      }
    }
  }
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #c5c5c5;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: var(--blue-thin-color);
  }
}

.mode-category {
  margin-top: 14px;

  h3 {
    margin: 0 0 6px;
    color: var(--panel-heading-color, #fff);
    font-size: 14px;
    font-weight: 500;
  }
}

.mode-notice {
  margin: 8px 0 0;
  font-size: 11px;
  color: #c5c5c5;

  button {
    background: transparent;
    color: var(--blue-thin-color);
    padding: 0;
  }
}

.mode-list.modal-mode {
  --selection-tile-action-width: 35px;
  --battle-mode-archive-font-size: 13px;

  :deep(.selection-tile) {
    --selection-tile-font-size: 16px;
    --selection-tile-min-height: 42px;
  }

  .mode-category h3 {
    font-size: 16px;
  }

  .mode-notice {
    font-size: 13px;
  }
}
</style>
