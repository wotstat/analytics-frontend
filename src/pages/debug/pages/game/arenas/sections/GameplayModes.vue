<template>
  <DebugSection title="gameplay: одна арена в разных режимах" id="gameplay-modes"
    description="Каждая комбинация game+tag+gameplay — своя строка в ArenasLatest со своим minimap/bbox/базами. getArenaMeta ищет точное совпадение всех трёх — если для режима меты нет, возвращает undefined."
    source="src/shared/game/arenas/arenas.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">арена</span>
        <select v-model="selectedKey">
          <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`" :value="`${arena.game}:${arena.tag}`">
            {{ arena.name }} ({{ arena.tag }})
          </option>
        </select>
      </label>
      <span class="debug-hint">
        в БД у этой арены+игры есть gameplay: <span class="debug-value">{{ gameplays.join(', ') }}</span>
      </span>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 200px">
      <div class="mode-card" v-for="g in gameplays" :key="g">
        <div class="box">
          <Minimap :tag="tag" :game="game" :gameplay="g" />
        </div>
        <div class="caption">
          <span class="debug-value">{{ g }}</span>
          <span class="debug-hint minimap-file">{{ metaFor(g)?.minimap }}</span>
          <span class="debug-hint" v-if="metaFor(g)?.minimap !== ctfMinimap && ctfMinimap">
            отличается от ctf
          </span>
        </div>
      </div>
    </div>

    <p class="debug-hint">
      gameplayTypes из wot.ts знает только про ctf/domination/assault/maps_training/assault2/ctf30x30/epic — значения
      вроде <span class="debug-value">comp7</span>, <span class="debug-value">bob</span>, <span
        class="debug-value">bootcamp</span>, <span class="debug-value">domination3</span>, которые реально есть в
      ArenasLatest, в этом словаре не расшифрованы. Для минимапы это не мешает — она берёт gameplay как есть, а вот
      для человекочитаемого названия режима в UI сайта таких строк не хватит.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">свой gameplay (заведомо отсутствующий)</span>
        <input type="text" v-model="customGameplay" placeholder="nonsense-mode">
      </label>
    </div>

    <div class="debug-stage center short" v-if="customGameplay">
      <div class="box">
        <Minimap :tag="tag" :game="game" :gameplay="customGameplay" />
      </div>
    </div>

    <p class="debug-note" v-if="customGameplay">
      getArenaMeta(game, tag, '{{ customGameplay }}') → {{ customMeta ? 'найдено' : 'undefined' }}. Когда меты нет,
      MinimapBackground всё равно рисует фон (minimapUrl падает обратно в defaultUrl без папки comp7), а MinimapBases
      просто не рисует ничего — ни ошибки, ни намёка, что запрошенный режим не существует.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { getArenaMeta } from '@/shared/game/arenas/arenas'
import { useArenaOptions } from '../shared/useArenaOptions'
import { usePickedArena } from '../shared/usePickedArena'

const { arenaList } = useArenaOptions()
const { selectedKey, game, tag, gameplays } = usePickedArena(arenaList)

function metaFor(gameplay: string) {
  return getArenaMeta(game.value, tag.value, gameplay)
}

const ctfMinimap = computed(() => metaFor('ctf')?.minimap)

const customGameplay = ref('')
const customMeta = computed(() => customGameplay.value ? metaFor(customGameplay.value) : undefined)
</script>


<style scoped lang="scss">
.mode-card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);
}

.box {
  width: 100%;
  aspect-ratio: 1 / 1;
}

.caption {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}

.minimap-file {
  word-break: break-all;
}
</style>
