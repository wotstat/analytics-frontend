<template>
  <DebugSection title="Галерея всех арен" id="arena-gallery"
    description="Все арены из ArenasLatest (регионы RU/EU) — по одной карточке на game+tag. Главная проверка: не пропала ли картинка миникарты хоть у одной арены."
    source="src/shared/game/arenas/arenas.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">игра</span>
        <select v-model="gameFilter">
          <option value="all">обе</option>
          <option value="mt">mt (Мир танков)</option>
          <option value="wot">wot (World of Tanks)</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">поиск</span>
        <input type="text" v-model="search" placeholder="тег или название">
      </label>

      <span class="debug-hint">найдено: <span class="debug-value">{{ filtered.length }}</span> из {{ arenaList.length
        }}</span>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 160px">
      <div class="card" v-for="arena in filtered" :key="`${arena.game}:${arena.tag}`">
        <MinimapBackground :tag="arena.tag" :game="arena.game" class="thumb" />
        <div class="caption">
          <span class="name">{{ arena.name }}</span>
          <span class="debug-value tag">{{ arena.tag }}</span>
          <span class="debug-hint">{{ arena.game }} · {{ arena.gameplays.join(', ') }}</span>
        </div>
      </div>
    </div>

    <p class="debug-hint" v-if="arenaList.length === 0">Список арен ещё не загружен из ClickHouse — см. секцию
      «Состояния загрузки».</p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import MinimapBackground from '@/shared/game/arenas/minimap/minimapBackground/MinimapBackground.vue'
import { useArenaOptions } from '../shared/useArenaOptions'

const { arenaList } = useArenaOptions()

const gameFilter = ref<'all' | 'mt' | 'wot'>('all')
const search = ref('')

const filtered = computed(() => arenaList.value.filter(arena => {
  if (gameFilter.value !== 'all' && arena.game !== gameFilter.value) return false
  const q = search.value.trim().toLowerCase()
  if (!q) return true
  return arena.tag.toLowerCase().includes(q) || arena.name.toLowerCase().includes(q)
}))
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

.thumb {
  border-radius: 4px;
  overflow: hidden;
}

.caption {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  font-size: 12px;

  .name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag {
    word-break: break-all;
  }
}
</style>
