<template>
  <DebugSection title="Иконки техники (реальные данные)" id="gallery"
    source="src/shared/game/vehicles/vehicle/VehicleImage.vue"
    description="Список техники — LatestBattleVehicleInfo + VehiclesLocalization, картинки — со STATIC_URL. Проверь обе игры и все размеры.">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">size</span>
        <select v-model="size">
          <option value="small">small</option>
          <option value="preview">preview</option>
          <option value="shop">shop</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">game</span>
        <select v-model="game">
          <option value="all">все</option>
          <option value="mt">mt (Мир танков)</option>
          <option value="wot">wot (World of Tanks)</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">показать</span>
        <input type="range" min="12" max="120" step="12" v-model.number="limit">
        <span class="debug-value">{{ limit }} из {{ filteredByGame.length }}</span>
      </label>
    </div>

    <p class="debug-hint">Сортировка — по <span class="debug-value">count</span> (сколько раз танк реально замечен в
      боях), сначала самые массовые.</p>

    <div class="debug-grid" style="--debug-grid-min: 150px">
      <div class="tank-cell" v-for="v in visible" :key="v.tag + v.region">
        <VehicleImage :tag="v.tag" :size :game="v.game" class="image" />
        <div class="tank-row">
          <Nation :nation="v.nation" class="flag" />
          <VehicleType :type="isVehicleType(v.type) ? v.type : 'any'" class="type" />
          <VehicleLevel :level="v.level" />
        </div>
        <p class="debug-value name">{{ v.short || v.name || v.tag }}</p>
        <p class="debug-hint">{{ v.game }} / {{ v.region }} / {{ v.count.toLocaleString('ru') }} боёв</p>
      </div>
    </div>

    <div class="debug-col">
      <p class="debug-label">спецсмещение мелких иконок (VehicleImage/utils.ts → getOffset)</p>
      <p class="debug-hint">
        У восьми коллекционных тегов (суффикс <span class="debug-value">_SH</span>) картинка в атласе сдвинута, и
        <span class="debug-value">getOffset</span> компенсирует это <span class="debug-value">translateX</span> —
        но только для <span class="debug-value">size="small"</span>. На preview/shop сдвига нет и не нужно.
      </p>
      <div class="debug-row">
        <div class="offset-cell" v-for="tag in specialOffsetTags" :key="tag">
          <div class="debug-stage short">
            <VehicleImage :tag size="small" class="offset-image" />
          </div>
          <VehicleImage :tag size="preview" class="offset-image" />
          <p class="debug-path">{{ tag }}</p>
        </div>
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import Nation from '@/shared/game/vehicles/nations/Nation.vue'
import { vehicleList } from '../store'

const size = ref<'small' | 'preview' | 'shop'>('preview')
const game = ref<'all' | 'mt' | 'wot'>('all')
const limit = ref(48)

const specialOffsetTags = [
  'ussr:R46_KV-13_SH',
  'usa:A72_T25_2_SH',
  'uk:GB107_Cavalier_SH',
  'sweden:S14_Ikv_103_SH',
  'poland:Pl17_DS_PZlnz_SH',
  'germany:G24_VK3002DB_SH',
  'france:F43_AMC_35_SH',
  'china:Ch24_Type64_SH',
]

const filteredByGame = computed(() =>
  game.value === 'all' ? vehicleList.value : vehicleList.value.filter(v => v.game === game.value)
)
const visible = computed(() => filteredByGame.value.slice(0, limit.value))
</script>


<style scoped lang="scss">
.tank-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3em;

  .image {
    width: 100%;
    border-radius: 4px;
  }

  .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tank-row {
  display: flex;
  align-items: center;
  gap: 0.4em;

  .flag {
    width: 20px;
  }

  .type {
    width: 14px;
    height: 14px;
  }
}

.offset-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  width: 130px;

  .offset-image {
    width: 100%;
  }
}
</style>
