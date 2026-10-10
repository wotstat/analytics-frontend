<template>
  <DebugPage title="Компактеры и кодек" description="Региональные ID, реактивное разрешение и бинарный формат compare."
    source="src/shared/game/encoding/ · src/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec.ts">
    <DebugSection title="Игровые значения" id="compact">
      <div class="debug-row">
        <label class="debug-control">Сущность
          <select v-model="kind">
            <option value="vehicle">Танк</option>
            <option value="arena">Карта</option>
            <option value="battleMode">Режим боя</option>
          </select>
        </label>
        <label v-if="kind !== 'battleMode'" class="debug-control">Регион
          <select v-model="region">
            <option value="">Регион не задан в контексте</option>
            <option v-for="value in gameRegions" :key="value" :value="value">{{ value }}</option>
          </select>
        </label>
        <label class="debug-control">Полное значение<input v-model="full" /></label>
        <button class="debug-btn" @click="capture">Взять компактное значение</button>
      </div>
      <p>compact: <span class="debug-value">{{ JSON.stringify(compact) }}</span></p>
      <div class="debug-row">
        <label class="debug-control">Сохранённое значение<input v-model="saved" /></label>
        <label class="debug-control"><input type="checkbox" v-model="numeric" />Числовой ID</label>
      </div>
      <p>expand: <span class="debug-value">{{ JSON.stringify(expanded) }}</span></p>
      <p>Техника: {{ statusLabel(vehicleCatalog.status) }} · Карты: {{ statusLabel(arenaCatalog.status) }}</p>
    </DebugSection>
    <DebugSection title="Сравнения" id="comparisons" description="Текущая длина ссылок на типовых примерах; меняется после загрузки каталогов.">
      <table class="debug-table">
        <thead><tr><th>Пример</th><th>compare</th><th>Символов</th></tr></thead>
        <tbody>
          <tr v-for="example in comparisonExamples" :key="example.name">
            <th>{{ example.name }}</th><td class="debug-value">{{ example.encoded }}</td><td>{{ example.encoded.length }}</td>
          </tr>
        </tbody>
      </table>
      <label class="debug-control">Модель примера
        <select v-model="selectedExample">
          <option v-for="(example, index) in comparisonExamples" :key="example.name" :value="index">{{ example.name }}</option>
        </select>
      </label>
      <pre class="decoded">{{ JSON.stringify(decodedExample, null, 2) }}</pre>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { loading, success, type Status } from '@/db'
import { gameRegions } from '@/shared/game/domain/regions'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { battleModeCompactor } from '@/shared/game/encoding/battleModes/battleModes'
import { createComparisonState, type SavedComparisonSource } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/state'
import { serializeComparison, deserializeComparison } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec'
import { createVehicleFilters } from '@/pages/infographics/pages/vehicles/filters/types'

const compactors = { vehicle: vehicleCompactor, arena: arenaCompactor, battleMode: battleModeCompactor }
type Kind = keyof typeof compactors
const defaults: Record<Kind, string> = { vehicle: 'ussr:R45_IS-7', arena: '05_prohorovka', battleMode: 'random-domination' }
const kind = ref<Kind>('vehicle')
const region = ref('RU')
const full = ref(defaults.vehicle)
const saved = ref('1440')
const numeric = ref(true)
const input = computed(() => numeric.value ? Number(saved.value) : saved.value)
const currentRegion = () => kind.value === 'battleMode' ? undefined : region.value || undefined
const compact = computed(() => kind.value === 'battleMode' ? battleModeCompactor.compact(full.value)
  : compactors[kind.value].compact(full.value, currentRegion()))
const expansions = {
  vehicle: computed(() => vehicleCompactor.expand(input.value, currentRegion())),
  arena: computed(() => arenaCompactor.expand(input.value, currentRegion())),
  battleMode: computed(() => battleModeCompactor.expand(input.value)),
}
const expanded = computed(() => expansions[kind.value].value)
watch(kind, value => { full.value = defaults[value]; capture() })
function capture() { saved.value = String(compact.value); numeric.value = typeof compact.value === 'number' }
function statusLabel(status: Status) { return status === loading ? 'loading' : status === success ? 'ready' : 'error' }

const selectedExample = ref(0)
const comparisonExamples = computed(() => {
  const filters = createVehicleFilters()
  const tank = (tag: string, index = 0): SavedComparisonSource => ({ target: { tank: tag }, filters, color: index, enabled: true })
  const examples: { name: string, sources: SavedComparisonSource[] }[] = [
    { name: 'Один танк', sources: [tank('ussr:R45_IS-7')] },
    { name: 'Два танка', sources: [tank('ussr:R45_IS-7'), tank('ussr:R52_Object_261', 1)] },
    { name: 'Танк на Прохоровке', sources: [{ ...tank('ussr:R45_IS-7'), filters: { ...filters, arenas: ['05_prohorovka'] } }] },
    { name: 'Один ID в RU и EU', sources: [tank('china:Ch62_ZZT_58'), { ...tank('china:Ch62_BZ_75_M', 1), filters: { ...filters, regions: ['EU'] } }] },
    { name: 'Смешанные регионы', sources: [{ ...tank('china:Ch62_ZZT_58'), filters: { ...filters, regions: ['RU', 'EU'] } }] },
  ]
  examples.push({ name: 'X уровень, тяжёлые', sources: [{
    target: { rowKey: 'classesByLevel:10:HT', selection: { levels: [10], types: ['HT'], nations: [] } },
    filters, color: 0, enabled: true,
  }] })
  const settings = createComparisonState()
  settings.slot = 'winrate'
  settings.step = 'week'
  settings.averageWindow = 3
  settings.annotations.showVersions = true
  settings.annotations.enabledEvents = ['razvorot']
  return [
    ...examples.map(example => ({ name: example.name, encoded: serializeComparison({ ...createComparisonState(), sources: example.sources }, filters) })),
    { name: 'Настройки, цвет и выключенная линия', encoded: serializeComparison({ ...settings,
      sources: [{ ...tank('ussr:R45_IS-7'), color: '#123456', enabled: false }, tank('ussr:R52_Object_261', 1)] }, filters) },
  ]
})
const decodedExample = computed(() => deserializeComparison(comparisonExamples.value[selectedExample.value].encoded, createVehicleFilters()))
</script>

<style scoped>
.decoded {
  max-height: 22em;
  overflow: auto;
}
</style>
