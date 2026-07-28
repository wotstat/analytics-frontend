<template>
  <DebugSection title="Размеры и пропорции контейнера" id="sizing"
    description="Minimap.vue сам не квадратный: .background тянется на width:100% с aspect-ratio 1/1 у img, а оверлей MinimapBases — отдельный position:absolute; inset:0 с собственным aspect-ratio 1/1. В неквадратном контейнере это два независимых расчёта размера — сверяй визуально, что база на фоне не съезжает."
    source="src/shared/game/arenas/minimap/Minimap.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">арена</span>
        <select v-model="selectedKey">
          <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`" :value="`${arena.game}:${arena.tag}`">
            {{ arena.name }} ({{ arena.tag }})
          </option>
        </select>
      </label>
      <select v-model="gameplay">
        <option v-for="g in gameplays" :key="g" :value="g">{{ g }}</option>
      </select>
    </div>

    <div class="debug-row sizes">
      <div class="sample">
        <span class="debug-label">крошечный, 40×40</span>
        <div class="debug-stage center">
          <div class="box tiny">
            <Minimap :tag="tag" :game="game" :gameplay="gameplay" />
          </div>
        </div>
      </div>

      <div class="sample">
        <span class="debug-label">огромный, 480×480</span>
        <div class="debug-stage center">
          <div class="box huge">
            <Minimap :tag="tag" :game="game" :gameplay="gameplay" />
          </div>
        </div>
      </div>

      <div class="sample">
        <span class="debug-label">широкий неквадратный, 420×140</span>
        <div class="debug-stage center">
          <div class="box wide">
            <Minimap :tag="tag" :game="game" :gameplay="gameplay" />
          </div>
        </div>
      </div>

      <div class="sample">
        <span class="debug-label">узкий неквадратный, 140×420</span>
        <div class="debug-stage center">
          <div class="box tall">
            <Minimap :tag="tag" :game="game" :gameplay="gameplay" />
          </div>
        </div>
      </div>
    </div>

    <p class="debug-note">
      Ни .minimap, ни .background, ни оверлей MinimapBases не имеют overflow:hidden на верхнем уровне — в узком/широком
      контейнере квадратная картинка фона (width:100% + aspect-ratio) и квадратный оверлей (position:absolute;
      inset:0 + свой aspect-ratio) могут получить разный «квадрат» и вылезти за пределы box по одной из осей.
      Смотри глазами: базы должны стоять на тех же клетках фона, что и в квадратном контейнере, а не съезжать и не
      обрезаться неодинаково с картинкой.
    </p>

    <p class="debug-note">
      Неочевидная деталь устройства: MinimapBases позиционируется абсолютно не своим кодом, а потому что её корневой
      элемент называется тем же классом <span class="debug-value">overlay</span>, что и div со слотом в Minimap.vue —
      scoped-стили родителя (<span class="debug-value">position: absolute; inset: 0</span>) достают до корня дочернего
      компонента через общий data-v-атрибут. Переименование класса в любом из двух файлов молча сломает
      позиционирование.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { useArenaOptions } from '../shared/useArenaOptions'
import { usePickedArena } from '../shared/usePickedArena'

const { arenaList } = useArenaOptions()
const { selectedKey, game, tag, gameplays, gameplay } = usePickedArena(arenaList)
</script>


<style scoped lang="scss">
.sizes {
  align-items: flex-start;
}

.sample {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
}

.box {
  &.tiny {
    width: 40px;
    height: 40px;
  }

  &.huge {
    width: 480px;
    height: 480px;
  }

  &.wide {
    width: 420px;
    height: 140px;
  }

  &.tall {
    width: 140px;
    height: 420px;
  }
}
</style>
