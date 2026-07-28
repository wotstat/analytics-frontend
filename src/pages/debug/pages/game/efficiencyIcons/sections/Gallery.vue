<template>
  <DebugSection title="Галерея всех иконок" id="gallery"
    description="Сетка построена по фактическому списку файлов assets/ (import.meta.glob), а не по типу IconType — сразу видно и неподхватившуюся иконку, и подпись, которой нет в i18n.ts."
    source="src/shared/game/efficiencyIcon/assets/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">поиск</span>
        <input type="text" v-model="query" placeholder="ключ или подпись">
      </label>
      <label class="debug-control">
        <span class="debug-label">направляющие</span>
        <input type="checkbox" v-model="guides">
      </label>
      <span class="debug-hint">найдено: <span class="debug-value">{{ filtered.length }}</span> из {{
        iconFileKeys.length }}</span>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 130px">
      <div class="card" v-for="key in filtered" :key="key">
        <div class="debug-stage center">
          <div class="icon-cell">
            <IconGuides v-if="guides" :size="96" />
            <Icon :icon="asIconType(key)" class="icon" />
          </div>
        </div>
        <div class="caption">
          <span class="debug-hint" :class="{ missing: !hasLabel(key) }">{{ label(key) }}</span>
          <span class="debug-value">{{ key }}</span>
        </div>
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { IconType } from '@/shared/game/efficiencyIcon/utils'
import { i18n } from '@/shared/game/efficiencyIcon/i18n'
import { iconFileKeys } from '../useIconFiles'
import IconGuides from '../shared/IconGuides.vue'

const query = ref('')
const guides = ref(false)

function hasLabel(key: string) {
  return key in i18n.ru
}

function label(key: string) {
  return i18n.ru[key as IconType] ?? '— нет подписи —'
}

// Ключ взят из реального списка файлов, поэтому Icon резолвит его независимо от того, входит ли он в тип IconType.
function asIconType(key: string) {
  return key as IconType
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return iconFileKeys
  return iconFileKeys.filter(key => key.toLowerCase().includes(q) || label(key).toLowerCase().includes(q))
})
</script>


<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);
}

.caption {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  font-size: 12px;
}

.icon-cell {
  position: relative;
  width: 96px;
  height: 96px;
}

.icon {
  position: relative;
  width: 96px;
  height: 96px;
}

.missing {
  color: #ff6b6b;
}
</style>
