<template>
  <DebugSection title="Селектор игры" id="game"
    description="Три состояния: «Мир танков», обе игры, World of Tanks. Логотипы — локальные svg, поповера нет вовсе."
    source="src/shared/game/selectors/gameSelector/GameSelector.vue">

    <div class="debug-row">
      <span class="debug-label">модель</span>
      <span class="debug-value">{{ game }}</span>

      <button class="debug-btn" v-for="variant in variants" :key="variant" :class="{ active: game === variant }"
        @click="game = variant">
        {{ variant }}
      </button>

      <label class="debug-control">
        <span class="debug-label">ширина контейнера</span>
        <input type="range" min="140" max="600" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>
    </div>

    <div class="debug-stage">
      <div class="box" :style="{ width: `${width}px` }">
        <GameSelector v-model="game" />
      </div>
    </div>

    <p class="debug-note">
      Кнопки жёстко 150 + 40 + 150 px и не сжимаются: селектор целиком занимает 340 px и на узком экране просто
      выезжает за контейнер. Подвинь ползунок ниже 340 — увидишь, что именно происходит (в боевом фильтре его спасает
      только то, что рядом ничего нет).
    </p>

    <p class="debug-note">
      Среднее состояние — это кнопка-разделитель «/», то есть <span class="debug-value">'any'</span>. Тип модели —
      <span class="debug-value">GameVendor | 'any'</span> с дефолтом <span class="debug-value">'wot'</span>: в
      <span class="debug-value">pages/replays/search</span> компонент вставлен <b>без</b>
      <span class="debug-value">v-model</span>, поэтому там он декоративный — состояние есть, но прочитать его снаружи
      нечем.
    </p>

    <div class="debug-col">
      <span class="debug-label">Тот же селектор, но привязанный к глобальному preferredGame</span>

      <div class="debug-stage">
        <GameSelector v-model="preferredProxy" />
      </div>

      <div class="debug-row">
        <span class="debug-hint">preferredGame: <span class="debug-value">{{ preferredGame }}</span></span>
      </div>

      <p class="debug-note">
        Так себя ведут кнопки «Lesta / WG» внутри попапов техники, карт и версий — они пишут в глобальный
        <span class="debug-value">preferredGame</span>. Сам <span class="debug-value">GameSelector</span> к нему не
        подключён: два селектора на этой странице живут независимо, и верхний глобальную настройку не двигает. Крути
        нижний и смотри, как у соседних секций меняются регион версий и список техники.
      </p>

      <p class="debug-note">
        Значение <span class="debug-value">unknown</span> (стартовое для нового пользователя) селектору не известно —
        здесь оно показано как <span class="debug-value">any</span>. Сам компонент такое состояние отрисовать не может:
        любое нажатие сразу перезаписывает его на одно из трёх.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import GameSelector from '@/shared/game/selectors/gameSelector/GameSelector.vue'
import { preferredGame } from '@/shared/global/globalPreferred'
import type { GameVendor } from '@/shared/game/wot'

const variants = ['mt', 'any', 'wot'] as const

const game = ref<GameVendor | 'any'>('mt')
const width = ref(420)

const preferredProxy = computed<GameVendor | 'any'>({
  get: () => preferredGame.value === 'unknown' ? 'any' : preferredGame.value,
  set: value => preferredGame.value = value,
})

</script>


<style scoped lang="scss">
.box {
  border: 1px solid var(--debug-border-strong);
  border-radius: 4px;
  max-width: 100%;
  overflow: auto;
}
</style>
