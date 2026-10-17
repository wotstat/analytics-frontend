<template>
  <DebugPage title="Компактеры и кодек" description="Региональные ID, реактивное разрешение и бинарный формат compare."
    source="src/shared/game/encoding/ · src/shared/utils/encoding/ · src/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec/">
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
    <DebugSection title="Сравнения" id="comparisons"
      description="Длина одних и тех же байтов в Base62 и Base64url; меняется после загрузки каталогов.">
      <label class="debug-control"><input type="checkbox" v-model="withContext" />Контекст страницы RU/random</label>
      <table class="debug-table">
        <thead>
          <tr>
            <th>Пример</th>
            <th>compare</th>
            <th>Параметры графика</th>
            <th>Base62</th>
            <th>Base64url</th>
            <th>Δ символов</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="example in comparisonExamples" :key="example.name">
            <th>{{ example.name }}</th>
            <td class="debug-value">{{ example.encoded }}</td>
            <td class="debug-value">{{ example.query || '—' }}</td>
            <td>{{ example.encoded.length }}</td>
            <td>{{ example.base64Length }}</td>
            <td>{{ example.encoded.length - example.base64Length }}</td>
          </tr>
        </tbody>
      </table>
      <label class="debug-control">Модель примера
        <select v-model="selectedExample">
          <option v-for="(example, index) in comparisonExamples" :key="example.name" :value="index">{{ example.name }}
          </option>
        </select>
      </label>
      <label class="debug-control">Своя строка compare<input v-model="rawComparison"
          placeholder="Пусто — выбранный пример" /></label>
      <label class="debug-control">Своя строка annotations<input v-model="rawAnnotations"
          placeholder="Пусто — выбранный пример" /></label>
      <pre class="decoded">{{ JSON.stringify(decodedExample, null, 2) }}</pre>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { stringifyQuery } from 'vue-router'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { loading, success, type Status } from '@/db'
import { gameRegions } from '@/shared/game/domain/regions'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { battleModeCompactor } from '@/shared/game/encoding/battleModes/battleModes'
import type { SavedComparisonSource } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/state'
import { deserializeComparison } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec/codec'
import { serializeComparison } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec/serialize'
import { comparisonAnnotationsParam, comparisonAnnotationState } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/annotations'
import { comparisonSettingsParams, type ComparisonSettings } from '@/pages/infographics/pages/vehicles/timeSeriesCompare/query/settings'
import { createVehicleFilters } from '@/pages/infographics/pages/vehicles/filters/types'
import { decodeBase62 } from '@/shared/utils/encoding/base62'

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
const rawComparison = ref('')
const rawAnnotations = ref('')
const withContext = ref(true)

const comparisonContext = computed(() => withContext.value ? createVehicleFilters() : undefined)
const comparisonExamples = computed(() => {
  const filters = createVehicleFilters()
  const tank = (tag: string, index = 0): SavedComparisonSource => ({ target: { tank: tag }, filters, color: index, enabled: true })
  const examples: { name: string, sources: SavedComparisonSource[], settings?: Partial<ComparisonSettings>, annotations?: string }[] = [
    { name: 'Один танк', sources: [tank('ussr:R45_IS-7')] },
    { name: 'Два танка', sources: [tank('ussr:R45_IS-7'), tank('ussr:R52_Object_261', 1)] },
    { name: 'Танк на Прохоровке', sources: [{ ...tank('ussr:R45_IS-7'), filters: { ...filters, arenas: ['05_prohorovka'] } }] },
    { name: 'Один ID в RU и EU', sources: [tank('china:Ch62_ZZT_58'), { ...tank('china:Ch62_BZ_75_M', 1), filters: { ...filters, regions: ['EU'] } }] },
    { name: 'Смешанные регионы', sources: [{ ...tank('china:Ch62_ZZT_58'), filters: { ...filters, regions: ['RU', 'EU'] } }] },
    { name: 'Случайные и Натиск одной линией', sources: [{ ...tank('ussr:R45_IS-7'), filters: { ...filters, battleModes: ['random', 'onslaught'] } }] },
    { name: 'Случайные и Натиск разными линиями', sources: [tank('ussr:R45_IS-7'), { ...tank('ussr:R45_IS-7', 1), filters: { ...filters, battleModes: ['onslaught'] } }] },
    { name: 'Режимы вне маски и полный ключ', sources: [{ ...tank('ussr:R45_IS-7'), filters: { ...filters, battleModes: ['training-all', 'mode-future-event'] } }] },
    { name: 'Цвет палитры, выбранный строкой', sources: [{ ...tank('ussr:R45_IS-7'), color: '#0a84ff' }] },
    { name: 'Цвет по умолчанию с альфой ff', sources: [{ ...tank('ussr:R45_IS-7'), color: '#0A84FFFF' }] },
    { name: 'Другой цвет палитры, выбранный строкой', sources: [{ ...tank('ussr:R45_IS-7'), color: '#ff9f0a' }] },
    { name: 'Кастомный RGB', sources: [{ ...tank('ussr:R45_IS-7'), color: '#123456' }] },
    { name: 'Кастомный RGBA', sources: [{ ...tank('ussr:R45_IS-7'), color: '#12345680' }] },
  ]

  examples.push({
    name: 'X уровень, тяжёлые', sources: [{
      target: { category: { level: 10, type: 'HT' }, selection: { levels: [10], types: ['HT'], nations: [] } },
      filters, color: 0, enabled: true,
    }]
  })

  examples.push({
    name: 'Категория с переопределённой выборкой', sources: [{
      target: { category: { level: 10, type: 'HT' }, selection: { levels: [], types: ['HT', 'MT'], nations: ['ussr', 'usa'] } },
      filters: { ...filters, regions: [], battleModes: [], platoon: 'solo', result: 'win', battleLevel: 'top' },
      color: '#12345680', enabled: false,
    }]
  })

  examples.push({
    name: 'Общие фильтры и выключенные линии 1, 3 и 10', sources: Array.from({ length: 10 }, (_, index) => ({
      target: { category: { level: index + 1 }, selection: { levels: [index + 1], types: [], nations: [] } },
      filters: { ...filters, arenas: ['05_prohorovka'], result: 'win' }, color: index, enabled: index !== 0 && index !== 2 && index !== 9,
    }))
  })

  examples.push({
    name: 'Третья линия выключена', sources: [8, 9, 10].map((level, index) => ({
      target: { category: { level }, selection: { levels: [level], types: [], nations: [] } },
      filters, color: index, enabled: index !== 2,
    }))
  })

  examples.push({
    name: 'Четвёртая линия выключена', sources: [7, 8, 9, 10].map((level, index) => ({
      target: { category: { level }, selection: { levels: [level], types: [], nations: [] } },
      filters, color: index, enabled: index !== 3,
    }))
  })

  examples.push({
    name: 'Неразрешённые ID и полный тег', sources: [
      { ...tank('ussr:R45_IS-7'), target: { tank: 536870880 }, filters: { ...filters, arenas: [16777214] } },
      tank('ussr:unknown_vehicle', 1),
    ]
  })

  examples.push({ name: 'Много полных тегов (DEFLATE)', sources: Array.from({ length: 20 }, (_, index) => tank(`ussr:unknown_vehicle_${index}`, index)) })
  const settings: ComparisonSettings = { slot: 'winrate', step: 'week', averageWindow: 3 }
  const annotations = comparisonAnnotationsParam.serialize(new Set(['versions', 'razvorot']))

  examples.push(
    ...(['winrate', 'blocked', 'damage_q50', 'damagePerLifeMinute', 'damagePerLifeMinute_q50', 'maxAssist', 'assist_max', 'maxAssist_max'] as const).map(slot => ({
      name: `Только метрика: ${slot}`, settings: { slot }, sources: [tank('ussr:R45_IS-7')],
    })),
    ...(['week', 'month'] as const).map(step => ({
      name: `Только шаг: ${step}`, settings: { step }, sources: [tank('ussr:R45_IS-7')],
    })),
    ...([3, 5, 7] as const).map(averageWindow => ({
      name: `Только усреднение: avg${averageWindow}`, settings: { averageWindow }, sources: [tank('ussr:R45_IS-7')],
    })),
    { name: 'Только аннотации', annotations, sources: [tank('ussr:R45_IS-7')] },
    {
      name: 'Все аннотации', annotations: comparisonAnnotationsParam.serialize(new Set(['versions', 'patches', 'micropatches', 'wotstat-outages', 'razvorot', 'stun-removal', 'bops-removal'])),
      sources: [tank('ussr:R45_IS-7')]
    },
    {
      name: 'Настройки, цвет и выключенная линия', settings, annotations,
      sources: [{ ...tank('ussr:R45_IS-7'), color: '#123456', enabled: false }, tank('ussr:R52_Object_261', 1)]
    },
    { name: 'Настройки без источников', settings, annotations, sources: [] },
  )

  const params = comparisonSettingsParams
  return examples.map(example => {
    const settings: ComparisonSettings = {
      slot: params.slot.default, step: params.step.default, averageWindow: params.averageWindow.default,
      ...example.settings,
    }
    const encoded = serializeComparison(example.sources, comparisonContext.value)
    const query = stringifyQuery({
      metric: settings.slot === params.slot.default ? undefined : params.slot.serialize(settings.slot),
      step: settings.step === params.step.default ? undefined : params.step.serialize(settings.step),
      avg: settings.averageWindow === null ? undefined : params.averageWindow.serialize(settings.averageWindow),
      annotations: example.annotations || undefined,
    })
    return { ...example, settings, encoded, query, base64Length: Math.ceil(decodeBase62(encoded).length * 4 / 3) }
  })
})

const decodedExample = computed(() => {
  try {
    const example = comparisonExamples.value[selectedExample.value]
    return {
      sources: deserializeComparison(rawComparison.value || example.encoded, comparisonContext.value),
      settings: example.settings,
      annotations: comparisonAnnotationState(comparisonAnnotationsParam.deserialize(rawAnnotations.value || example.annotations || '')),
    }
  } catch {
    return 'Некорректное значение compare или annotations'
  }
})
</script>

<style scoped>
.decoded {
  max-height: 22em;
  overflow: auto;
}
</style>
