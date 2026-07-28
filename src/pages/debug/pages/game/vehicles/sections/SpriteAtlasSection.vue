<template>
  <DebugSection title="Спрайт-атлас" id="sprite-atlas" source="src/shared/uiKit/spriteAtlas/SpriteAtlas.ts"
    description="Как задаётся кадр (getSprite → x/y/atlasClass) и что происходит при выходе за границы атласа.">

    <div class="debug-col">
      <p class="debug-label">nationFlagAtlas — атлас, собранный локально (LocalOptions: json + картинка импортом)</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">ключ</span>
          <select v-model="flagKey">
            <option v-for="k in flagKeys" :key="k" :value="k">{{ k }}</option>
            <option value="doesnotexist">doesnotexist (нет в атласе)</option>
          </select>
        </label>
      </div>

      <div class="debug-row">
        <div class="debug-stage center short">
          <div v-if="flagSprite" class="sprite-frame" :class="flagSprite.atlasClass"
            :style="{ backgroundPosition: flagSprite.backgroundPosition, width: flagSprite.width + 'px', height: flagSprite.height + 'px' }" />
          <p v-else class="debug-hint">getSprite('{{ flagKey }}') → null</p>
        </div>

        <table class="debug-table" v-if="flagSprite">
          <tbody>
            <tr v-for="(value, key) in flagSprite" :key="key">
              <th>{{ key }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="debug-note">
        Кадр — это класс с <span class="debug-value">background-image</span> (инжектится в &lt;head&gt; один раз на
        <span class="debug-value">classPrefix</span>) плюс инлайновый <span
          class="debug-value">background-position</span>
        из x/y конкретного элемента. Ключа нет в <span class="debug-value">atlasInfo</span> — <span
          class="debug-value">getSprite</span>
        возвращает <span class="debug-value">null</span>, а не заглушку: фолбэк на <span
          class="debug-value">'no-image'</span>
        — забота вызывающего кода (см. <span class="debug-value">VehicleLine.ts</span>: <span
          class="debug-value">getSprite(nation) ?? getSprite('no-image')</span>),
        сам класс его не делает.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">smallVehiclesAtlasMt — атлас с картинки/json по сети (RootOptions: atlasRoot)</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">тег</span>
          <select v-model="vehicleTag">
            <option v-for="v in sampleVehicles" :key="v.tag" :value="v.tag">{{ v.short || v.tag }}</option>
          </select>
        </label>
      </div>
      <div class="debug-stage center short">
        <div v-if="vehicleSprite" class="sprite-frame" :class="vehicleSprite.atlasClass"
          :style="{ backgroundPosition: vehicleSprite.backgroundPosition, width: vehicleSprite.width + 'px', height: vehicleSprite.height + 'px' }" />
        <p v-else class="debug-hint">атлас ещё не загрузился (fetch json+картинки асинхронный) или кадра нет</p>
      </div>
      <p class="debug-note">
        Конструктор <span class="debug-value">SpriteAtlas</span> не ждёт свою же загрузку (<span
          class="debug-value">this.load()</span>
        вызывается без <span class="debug-value">await</span>, наружу не отдано ни промиса, ни события «готов») —
        если дёрнуть <span class="debug-value">getSprite</span> сразу после <span class="debug-value">new
          SpriteAtlas(...)</span>, до того как <span class="debug-value">fetch('atlases.json')</span> отработает,
        честно получим <span class="debug-value">null</span> для абсолютно любого ключа, включая существующие. На
        этой странице атлас уже используется в бою (тот же синглтон, что и в поповере выбора техники), поэтому здесь
        это обычно не поймать — но при первом обращении к нему на сайте гонка реальна.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { nationFlagAtlas } from '@/shared/game/vehicles/nations/utils'
import { nations } from '@/shared/game/vehicles/nations/nations'
import { smallVehiclesAtlasMt, tagToImageName } from '@/shared/game/vehicles/vehicle/utils'
import { vehicleList } from '../store'

const flagKeys = [...nations, 'no-image']
const flagKey = ref<string>(nations[0])
const flagSprite = computed(() => nationFlagAtlas.getSprite(flagKey.value))

const sampleVehicles = computed(() => vehicleList.value.filter(v => v.game === 'mt').slice(0, 20))
const vehicleTag = ref('')
const vehicleSprite = computed(() => {
  const tag = vehicleTag.value || sampleVehicles.value[0]?.tag
  if (!tag) return null
  return smallVehiclesAtlasMt.getSprite(tagToImageName(tag))
})
</script>


<style scoped lang="scss">
.sprite-frame {
  background-repeat: no-repeat;
}
</style>
