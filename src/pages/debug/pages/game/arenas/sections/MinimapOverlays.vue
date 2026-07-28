<template>
  <DebugSection title="Миникарта с наложениями: базы, спавны, точки интереса" id="minimap-overlays"
    description="Minimap.vue = фон + MinimapBases поверх. team определяет, какие базы/спавны красятся зелёным (свои), какие — красным (чужие)."
    source="src/shared/game/arenas/minimap/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">арена</span>
        <select v-model="selectedKey">
          <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`" :value="`${arena.game}:${arena.tag}`">
            {{ arena.name }} ({{ arena.tag }})
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">gameplay</span>
        <select v-model="gameplay">
          <option v-for="g in gameplays" :key="g" :value="g">{{ g }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">team</span>
        <select v-model.number="team">
          <option :value="1">1 (свои — team 1)</option>
          <option :value="2">2 (свои — team 2)</option>
          <option :value="0">0</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">showBases</span>
        <input type="checkbox" v-model="showBases">
      </label>
    </div>

    <div class="debug-stage center short">
      <div class="box">
        <Minimap :tag="tag" :game="game" :gameplay="gameplay" :team="team" :show-bases="showBases" />
      </div>
    </div>

    <p class="debug-note">
      team=0 — не опечатка в контролах, а намеренная поломка: MinimapBases фильтрует базы/спавны условием
      <span class="debug-value">if (!meta.value || !props.team) return []</span>, а 0 — falsy. При team=0 не
      рисуется вообще ничего, хотя meta с базами есть. Баг это или нет — team в реальных данных 1/2 и никогда не 0,
      но проп типизирован как обычный <span class="debug-value">number</span>, ничего не мешает передать 0 снаружи.
    </p>

    <h3 class="legend-title">Все ассеты minimapBases/assets/</h3>
    <div class="debug-grid" style="--debug-grid-min: 110px">
      <div class="asset" v-for="(src, name) in images" :key="name">
        <img :src="src" :alt="name">
        <span class="debug-value">{{ name }}</span>
      </div>
    </div>

    <p class="debug-hint">
      Индексация в шаблоне MinimapBases.vue: если своя база одна — берётся файл <span class="debug-value">_0</span>,
      если баз несколько — со второй по счёту используется <span class="debug-value">_1</span>, <span
        class="debug-value">_2</span>… Спавны индексируются с <span class="debug-value">_1</span> всегда, файла
      <span class="debug-value">_0</span> для спавнов не существует. Файлов на каждую категорию максимум 4 —
      если у арены окажется 5+ точек одного типа на одну команду, картинка для «лишних» будет не найдена
      (в текущих данных БД такого не встречается, максимум — 3 спавна на команду у ctf30x30).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { useArenaOptions } from '../shared/useArenaOptions'
import { usePickedArena } from '../shared/usePickedArena'

const { arenaList } = useArenaOptions()
const { selectedKey, game, tag, gameplays, gameplay } = usePickedArena(arenaList)

const team = ref(1)
const showBases = ref(true)

const images = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: string }>('../../../../../../shared/game/arenas/minimap/minimapBases/assets/*', { eager: true }))
    .map(([key, value]) => [key.replace(/^.*\/assets\//, '').replace('.png', ''), value.default])
)
</script>


<style scoped lang="scss">
.box {
  width: 280px;
  height: 280px;
}

.legend-title {
  font-size: 0.95em;
  margin: 0.2em 0 0;
}

.asset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .debug-value {
    font-size: 10px;
    text-align: center;
    word-break: break-all;
  }
}
</style>
