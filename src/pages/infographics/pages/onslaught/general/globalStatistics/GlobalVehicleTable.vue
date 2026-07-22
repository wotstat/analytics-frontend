<template>
  <section class="statistics-section">
    <div class="header">
      <h3>Статистика танков</h3>
      <div class="actions">
        <OnslaughtCheckbox v-if="props.allowSkillToggle" v-model="groupBySkill">Учитывать навык</OnslaughtCheckbox>
        <button class="more" type="button" :disabled="!canShowMore" @click="showMore = !showMore">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
    </div>
    <hr class="separator">

    <TableState v-if="state.status !== 'success'" :state />

    <div v-else class="table-container nice-scrollbar-transparent mt-font"
      :class="{ 'with-skill-column': !groupBySkill }">
      <SortableTable v-model:order-by="vehicleOrderBy" v-model:order-direction="orderDirection" :data
        :cols="headers.length" :limit="displayLimit" :is-orderable="index => index !== 0"
        :default-order-by="defaultOrderBy" :column-labels="headers.map(header => header.title)">
        <template #head-cell="{ col }">
          <div class="column-title">
            <Icon v-if="headers[col].icon" :icon="headers[col].icon!" />
            <span v-else class="skill-heading">Навык</span>
          </div>
        </template>

        <template #data-cell="{ value, index, col }">
          <th v-if="headers[col].key === 'vehicle'" class="vehicle">
            <VehicleImage :tag="state.data[index].tankTag" class="image" size="preview" :game />
            <VehicleLevel :level="state.data[index].tankLevel" />
            <VehicleType :type="isVehicleType(state.data[index].tankType) ? state.data[index].tankType : 'any'"
              class="type" />

            <p>{{ getTankName(state.data[index].tankTag, true) }}</p>
            <div v-if="groupBySkill && state.data[index].skillTag" class="vehicle-skill"
              v-tooltip.top-float="{ text: getComp7SkillName(state.data[index].skillTag), class: 'comp7-tooltip' }">
              <SkillIcon :skill="state.data[index].skillTag" :game :season class="skill-icon" />
            </div>
          </th>
          <td v-else-if="headers[col].key === 'skill'">
            <div v-if="state.data[index].skillTag" class="skill" v-skill-distribution-tooltip.instant.top-float="{
              skills: state.data[index].skills,
              game,
              season,
            }">
              <SkillIcon :skill="state.data[index].skillTag" :game :season class="skill-icon" />
              <span>{{ skillPercentFormatter(state.data[index].skillShare) }}</span>
            </div>
          </td>
          <td v-else-if="headers[col].key === 'players' || headers[col].key === 'battles'">
            <span>{{ logProcessor(Number(value)) }}</span>
            <span class="column-share">({{ formatColumnShare(Number(value), headers[col].key) }})</span>
          </td>
          <td v-else-if="headers[col].key === 'winrate'">{{ percentFormatter.format(Number(value)) }}</td>
          <td v-else-if="headers[col].key === 'kills'">{{ decimalFormatter.format(Number(value)) }}</td>
          <td v-else>{{ integerFormatter.format(Number(value)) }}</td>
        </template>
      </SortableTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import type { IconType } from '@/shared/game/efficiencyIcon/utils'
import SkillIcon from '@/shared/game/comp7/skill/SkillIcon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'
import type { GameVendor } from '@/shared/game/wot'
import { getTankName } from '@/shared/i18n/i18n'
import { createFixedSpaceProcessor, createLogProcessor, createPercentProcessor } from '@/shared/utils/processors/processors'
import OnslaughtCheckbox from '../../shared/Checkbox.vue'
import SortableTable from '../../statistics/sortableTable/SortableTable.vue'
import TableState from './TableState.vue'
import type { GlobalVehicleStatistic, StatisticsLoadState } from './types'
import { getComp7SkillName } from '@/shared/game/comp7/utils.ts'
import { vSkillDistributionTooltip } from './skillDistributionTooltip/useSkillDistributionTooltip'

const SHOW_MORE_THRESHOLD = 7

const props = defineProps<{
  state: StatisticsLoadState<GlobalVehicleStatistic>
  game: GameVendor
  season?: string
  allowSkillToggle?: boolean
}>()

const groupBySkill = defineModel<boolean>('groupBySkill', { default: false })
const showMore = ref(false)
const selectedOrderKey = ref<ColumnKey>('battles')
const orderDirection = ref<'asc' | 'desc'>('desc')
const canShowMore = computed(() => props.state.status === 'success'
  && props.state.data.length > SHOW_MORE_THRESHOLD
)

type ColumnKey = 'vehicle' | 'skill' | 'players' | 'battles' | 'winrate' | 'damage' | 'assist' | 'prestigePoints' | 'kills'
type Column = { key: ColumnKey, title: string, icon?: IconType }

const allHeaders: Column[] = [
  { key: 'vehicle', title: '', icon: 'tank' },
  { key: 'skill', title: 'Самый популярный навык' },
  { key: 'battles', title: 'Бои', icon: 'battles' },
  { key: 'players', title: 'Уникальные игроки', icon: 'player' },
  { key: 'winrate', title: 'Винрейт', icon: 'winrate' },
  { key: 'damage', title: 'Средний урон', icon: 'dmg' },
  { key: 'assist', title: 'Среднее содействие', icon: 'assist' },
  { key: 'prestigePoints', title: 'Средние очки престижа', icon: 'prestige-points' },
  { key: 'kills', title: 'Средние уничтожения', icon: 'kill' },
]

const headers = computed(() => groupBySkill.value
  ? allHeaders.filter(header => header.key !== 'skill')
  : allHeaders
)

const defaultOrderBy = computed(() => headers.value.findIndex(header => header.key === 'battles'))
const vehicleOrderBy = computed({
  get: () => {
    const selectedIndex = headers.value.findIndex(header => header.key === selectedOrderKey.value)
    return selectedIndex === -1 ? defaultOrderBy.value : selectedIndex
  },
  set: index => {
    const header = headers.value[index]
    if (header) selectedOrderKey.value = header.key
  },
})

const data = computed(() => props.state.data.map(item => headers.value.map(header => {
  if (header.key === 'vehicle') return item.tankTag
  if (header.key === 'skill') return { sortKey: item.skillShare }
  return item[header.key]
})))

const displayLimit = computed(() => props.state.data.length > SHOW_MORE_THRESHOLD && !showMore.value
  ? SHOW_MORE_THRESHOLD - 2
  : undefined
)

const columnTotals = computed(() => props.state.data.reduce((totals, item) => ({
  players: totals.players + item.players,
  battles: totals.battles + item.battles,
}), { players: 0, battles: 0 }))

const integerFormatter = { format: createFixedSpaceProcessor(0) }
const decimalFormatter = { format: createFixedSpaceProcessor(2) }
const percentFormatter = { format: createPercentProcessor(2) }
const skillPercentFormatter = createPercentProcessor(1)
const logProcessor = createLogProcessor()

function formatColumnShare(value: number, column: 'players' | 'battles') {
  const total = columnTotals.value[column]
  return skillPercentFormatter(total > 0 ? value / total : 0)
}

</script>

<style scoped lang="scss">
.statistics-section {
  margin-top: 35px;
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 15px;

  h3 {
    margin: 0;
    color: rgba(255, 255, 255, 0.87);
    font-size: 22px;
    text-transform: uppercase;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.more {
  width: 62px;
  padding: 0;
  border: none;
  background: none;
  color: var(--blue-thin-color, #fff);
  font-size: 14px;
  text-align: right;
  cursor: pointer;

  &:not(:disabled):hover {
    color: var(--blue-thin-color-hover, #fff);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: default;
  }
}

.separator {
  margin: 5px 0;
  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);
}

.table-container {
  overflow-x: auto;
  padding-bottom: 5px;
  font-size: 14px;

  :deep(thead th:first-child) {
    width: 24%;
  }
}

.column-title {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    display: block;
    width: 40px;
  }
}

.skill-heading {
  color: rgba(255, 255, 255, 0.87);
  font-size: 14px;
  text-transform: uppercase;
}

.vehicle {
  display: flex;
  align-items: center;
  margin-left: 10px;
  font-weight: normal;
  position: relative;

  .skill-icon {
    display: block;
    position: relative;
    width: 40px;
    z-index: 1;
    pointer-events: none;
  }

  .image {
    height: 50px;
    user-select: none;
    pointer-events: none;
  }

  .type {
    height: 16px;
    margin: 0 3px;
  }

  p {
    font-size: 14px;
    line-height: 16px;
    white-space: nowrap;
  }

  .vehicle-skill {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    margin-left: auto;
  }
}

.skill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: max-content;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  white-space: nowrap;

  .skill-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    pointer-events: none;
  }
}

td {
  text-align: center;
}

.column-share {
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  white-space: nowrap;
}

@media screen and (max-width: 600px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
