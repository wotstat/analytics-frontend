<template>
  <section class="statistics-section">
    <div class="header">
      <h3>Статистика танков</h3>
      <div class="actions">
        <label class="skill-toggle">
          <input v-model="groupBySkill" type="checkbox">
          <span>Учитывать навык</span>
        </label>
        <button v-if="state.data.length > SHOW_MORE_THRESHOLD" class="more" type="button" @click="showMore = !showMore">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
    </div>
    <hr class="separator">

    <TableState v-if="state.status !== 'success'" :state />

    <div v-else class="table-container nice-scrollbar-transparent mt-font">
      <SortableTable :data :cols="9" :limit="displayLimit" :is-orderable="index => index !== 0" :default-order-by="3"
        :column-labels="headers.map(header => header.title)">
        <template #head-cell="{ col }">
          <div class="column-title">
            <Icon v-if="headers[col].icon" :icon="headers[col].icon!" />
            <span v-else class="skill-heading">Навык</span>
          </div>
        </template>

        <template #data-cell="{ value, index, col }">
          <th v-if="col === 0" class="vehicle">
            <VehicleImage :tag="state.data[index].tankTag" class="image" size="preview" :game />
            <VehicleLevel :level="state.data[index].tankLevel" />
            <VehicleType :type="isVehicleType(state.data[index].tankType) ? state.data[index].tankType : 'any'"
              class="type" />
            <p>{{ getTankName(state.data[index].tankTag, true) }}</p>
          </th>
          <td v-else-if="col === 1">
            <div class="skill">
              <SkillIcon :skill="String(value)" />
              <span>{{ getComp7SkillName(String(value)) || '—' }}</span>
            </div>
          </td>
          <td v-else-if="col === 2 || col === 3">{{ logProcessor(Number(value)) }}</td>
          <td v-else-if="col === 4">{{ percentFormatter.format(Number(value)) }}</td>
          <td v-else-if="col === 8">{{ decimalFormatter.format(Number(value)) }}</td>
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
import { getComp7SkillName } from '@/shared/game/comp7/skill/skills.ts'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'
import type { GameVendor } from '@/shared/game/wot'
import { getTankName } from '@/shared/i18n/i18n'
import { createFixedSpaceProcessor, createLogProcessor, createPercentProcessor } from '@/shared/utils/processors/processors'
import SortableTable from '../../statistics/sortableTable/SortableTable.vue'
import TableState from './TableState.vue'
import type { GlobalVehicleStatistic, StatisticsLoadState } from './types'

const SHOW_MORE_THRESHOLD = 5

const props = defineProps<{
  state: StatisticsLoadState<GlobalVehicleStatistic>
  game: GameVendor
}>()

const groupBySkill = defineModel<boolean>('groupBySkill', { default: false })
const showMore = ref(false)

const headers: { title: string, icon?: IconType }[] = [
  { title: '', icon: 'tank' },
  { title: 'Навык Натиска' },
  { title: 'Уникальные игроки', icon: 'player' },
  { title: 'Бои', icon: 'battles' },
  { title: 'Винрейт', icon: 'winrate' },
  { title: 'Средний урон', icon: 'dmg' },
  { title: 'Среднее содействие', icon: 'assist' },
  { title: 'Средние очки престижа', icon: 'prestige-points' },
  { title: 'Средние уничтожения', icon: 'kill' },
]

const data = computed(() => props.state.data.map(item => [
  item.tankTag,
  item.skillTag,
  item.players,
  item.battles,
  item.winrate,
  item.damage,
  item.assist,
  item.prestigePoints,
  item.kills,
]))

const displayLimit = computed(() => props.state.data.length > SHOW_MORE_THRESHOLD && !showMore.value
  ? SHOW_MORE_THRESHOLD - 2
  : undefined
)

const integerFormatter = { format: createFixedSpaceProcessor(0) }
const decimalFormatter = { format: createFixedSpaceProcessor(2) }
const percentFormatter = { format: createPercentProcessor(2) }
const logProcessor = createLogProcessor()
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

.skill-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;

  input {
    accent-color: var(--blue-color);
  }
}

.more {
  padding: 0;
  border: none;
  background: none;
  color: var(--blue-thin-color, #fff);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    color: var(--blue-thin-color-hover, #fff);
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

  :deep(table) {
    min-width: 1080px;
  }

  :deep(thead th:first-child) {
    width: 24%;
  }

  :deep(thead th:nth-child(2)) {
    width: 18%;
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
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  text-transform: uppercase;
}

.vehicle {
  display: flex;
  align-items: center;
  margin-left: 10px;
  font-weight: normal;

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
}

.skill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  text-align: left;
  white-space: nowrap;
}

td {
  text-align: center;
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
