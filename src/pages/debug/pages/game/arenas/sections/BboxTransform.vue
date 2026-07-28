<template>
  <DebugSection title="bbox: игровые координаты → позиция на миникарте" id="bbox-transform"
    description="relativeMapPosition(position, meta) переводит игровые метры в долю [0..1] по каждой оси картинки, отдельно по x и y — своим bbox на каждую арену. Введи координаты и посмотри, куда попадёт точка; сравни две арены — одни и те же метры оказываются в разных местах."
    source="src/shared/game/arenas/arenas.ts">

    <div class="formula">
      <code>x = (px - bbox.bottomLeft.x) / (bbox.upperRight.x - bbox.bottomLeft.x)</code>
      <code>y = 1 - (py - bbox.bottomLeft.y) / (bbox.upperRight.y - bbox.bottomLeft.y)</code>
    </div>
    <p class="debug-hint">
      y инвертирован: в игровом мире y растёт «на север», а в CSS 0% — верхний край картинки. bbox по x и y считается
      независимо, поэтому даже неквадратная игровая область (например 108_normandy_nom: ширина 500 м, высота 1050 м —
      выбери её в списке) ложится на квадратную картинку без искажений формулы, просто с разным масштабом по осям.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">game X</span>
        <input type="number" v-model.number="pointX" step="10">
      </label>
      <label class="debug-control">
        <span class="debug-label">game Y</span>
        <input type="number" v-model.number="pointY" step="10">
      </label>

      <button class="debug-btn" @click="setPoint(0, 0)">(0, 0)</button>
      <button class="debug-btn" @click="setToCorner('bottomLeft', 'A')">bottomLeft A</button>
      <button class="debug-btn" @click="setToCorner('upperRight', 'A')">upperRight A</button>
      <button class="debug-btn" @click="setToCenter('A')">центр A</button>
      <button class="debug-btn" @click="setOutside('A')">за пределами bbox A (×1.5)</button>
    </div>

    <div class="pair">
      <div class="side">
        <h3>Арена A</h3>
        <div class="debug-row">
          <select v-model="aSelectedKey">
            <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`"
              :value="`${arena.game}:${arena.tag}`">
              {{ arena.name }} ({{ arena.tag }})
            </option>
          </select>
          <select v-model="aGameplay">
            <option v-for="g in aGameplays" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <BboxSide :tag="aTag" :game="aGame" :gameplay="aGameplay" :point-x="pointX" :point-y="pointY" />
      </div>

      <div class="side">
        <h3>Арена B</h3>
        <div class="debug-row">
          <select v-model="bSelectedKey">
            <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`"
              :value="`${arena.game}:${arena.tag}`">
              {{ arena.name }} ({{ arena.tag }})
            </option>
          </select>
          <select v-model="bGameplay">
            <option v-for="g in bGameplays" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <BboxSide :tag="bTag" :game="bGame" :gameplay="bGameplay" :point-x="pointX" :point-y="pointY" />
      </div>
    </div>

    <p class="debug-note">
      По умолчанию A — 01_karelia (bbox симметричный, (-500,-500)..(500,500), центр карты = (0,0)), B — 04_himmelsdorf
      (bbox (-300,-300)..(400,400) — центр смещён, (0,0) уже не середина). Одна и та же точка (0,0) на A попадает точно
      в центр миникарты, а на B — заметно левее и ниже центра. Преобразование не универсальное: одни и те же игровые
      координаты без bbox конкретной арены ничего не значат.
    </p>

    <p class="debug-note">
      Кнопка «за пределами bbox» намеренно ставит точку вне [0..1] по обеим осям. relativeMapPosition это никак не
      клампит — маркер (слот Minimap, без overflow:hidden) честно вылезает за рамку картинки. MinimapBases же для
      своих иконок сидит в контейнере с overflow:hidden, так что настоящие базы/спавны в таком случае просто
      обрезались бы по краю, а не улетели — увидеть их «вылет» так, как это делает наш маркер, нельзя.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { getArenaMeta } from '@/shared/game/arenas/arenas'
import { useArenaOptions } from '../shared/useArenaOptions'
import { usePickedArena } from '../shared/usePickedArena'
import BboxSide from './bboxTransform/BboxSide.vue'

const { arenaList } = useArenaOptions()

const {
  selectedKey: aSelectedKey, game: aGame, tag: aTag, gameplays: aGameplays, gameplay: aGameplay,
} = usePickedArena(arenaList, '01_karelia')

const {
  selectedKey: bSelectedKey, game: bGame, tag: bTag, gameplays: bGameplays, gameplay: bGameplay,
} = usePickedArena(arenaList, '04_himmelsdorf')

const pointX = ref(0)
const pointY = ref(0)

function setPoint(x: number, y: number) {
  pointX.value = x
  pointY.value = y
}

function metaOf(side: 'A' | 'B') {
  return side === 'A'
    ? getArenaMeta(aGame.value, aTag.value, aGameplay.value)
    : getArenaMeta(bGame.value, bTag.value, bGameplay.value)
}

function setToCorner(corner: 'bottomLeft' | 'upperRight', side: 'A' | 'B') {
  const meta = metaOf(side)
  if (!meta) return
  setPoint(meta.bbox[corner].x, meta.bbox[corner].y)
}

function setToCenter(side: 'A' | 'B') {
  const meta = metaOf(side)
  if (!meta) return
  setPoint(
    (meta.bbox.bottomLeft.x + meta.bbox.upperRight.x) / 2,
    (meta.bbox.bottomLeft.y + meta.bbox.upperRight.y) / 2,
  )
}

function setOutside(side: 'A' | 'B') {
  const meta = metaOf(side)
  if (!meta) return
  setPoint(meta.bbox.upperRight.x * 1.5, meta.bbox.upperRight.y * 1.5)
}
</script>


<style scoped lang="scss">
.formula {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  font-family: var(--debug-mono);
  font-size: 12px;
  background: #00000030;
  border-radius: 4px;
  padding: 0.6em 0.8em;
}

.pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1em;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 0.5em;

  h3 {
    font-size: 0.95em;
    margin: 0;
  }
}
</style>
