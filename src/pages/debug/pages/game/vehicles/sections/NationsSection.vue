<template>
  <DebugSection title="Нации (флаги)" id="nations" source="src/shared/game/vehicles/nations/Nation.vue"
    description="Все флаги наций, размер, поведение при неизвестной нации и пустой строке.">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">размер</span>
        <input type="range" min="20" max="160" v-model.number="size">
        <span class="debug-value">{{ size }}px</span>
      </label>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 110px">
      <div class="cell" v-for="nation in nations" :key="nation">
        <Nation :nation :style="{ width: size + 'px' }" />
        <p class="debug-value">{{ nation }}</p>
      </div>
    </div>

    <p class="debug-note">
      Флаги — растровые PNG 60×40 (папка <span class="debug-value">60x40/</span>), тянутся через
      <span class="debug-value">width</span> без <span class="debug-value">image-rendering</span>. На большом размере
      заметно смазывание — векторной версии нет.
    </p>

    <div class="debug-col">
      <p class="debug-label">mt (12 наций) vs wot (11 — без intunion)</p>
      <div class="debug-row">
        <div class="cell" v-for="nation in mtNations" :key="nation"
          :class="{ dim: !(wotNations as readonly string[]).includes(nation) }">
          <Nation :nation :style="{ width: '48px' }" />
          <p class="debug-value">{{ nation }}</p>
        </div>
      </div>
      <p class="debug-hint">
        Затемнённая — <span class="debug-value">intunion</span>: коллекционная «интернациональная» нация, в
        <span class="debug-value">wotNations</span> её нет, но сам компонент нацию не валидирует и нарисует флаг в
        любом случае.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">сломать нарочно</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">nation</span>
          <input type="text" v-model="customNation">
        </label>
        <button class="debug-btn" @click="customNation = ''">поставить пустую строку</button>
        <button class="debug-btn" @click="customNation = 'atlantis'">несуществующая нация</button>
      </div>

      <div class="debug-stage center short">
        <Nation :nation="customNation" style="width: 80px" />
      </div>

      <p class="debug-note">
        Проп типизирован как <span class="debug-value">AllowedIcon | string</span> — TypeScript не мешает передать
        что угодно. Внутри <span class="debug-value">icons[`./60x40/${nation}.png`]?.default ?? ''</span>: для
        неизвестной нации получаем <span class="debug-value">src=""</span>, а не фолбэк-картинку — в отличие от
        <span class="debug-value">VehicleImage</span>, здесь <span class="debug-value">FallbackImg</span> не
        используется. Пустой <span class="debug-value">src</span> у &lt;img&gt; — известная ловушка браузеров: он
        трактуется как ссылка на текущий документ и уходит лишний запрос.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Nation from '@/shared/game/vehicles/nations/Nation.vue'
import { nations, mtNations, wotNations } from '@/shared/game/vehicles/nations/nations'

const size = ref(60)
const customNation = ref('atlantis')
</script>


<style scoped lang="scss">
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3em;

  &.dim {
    opacity: 0.4;
  }
}
</style>
