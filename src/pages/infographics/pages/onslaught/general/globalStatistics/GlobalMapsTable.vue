<template>
  <section class="statistics-section">
    <div class="header">
      <h3>Статистика карт</h3>
      <button class="more" type="button" :disabled="!canShowMore" @click="showMore = !showMore">
        {{ showMore ? 'Меньше' : 'Больше' }}
      </button>
    </div>
    <hr class="separator">

    <TableState v-if="state.status !== 'success'" :state />

    <div v-else class="table-container nice-scrollbar-transparent mt-font">
      <SortableTable v-model:order-by="orderBy" v-model:order-direction="orderDirection" :data :cols="9"
        :limit="displayLimit" :is-orderable="index => index !== 0" :default-order-by="1"
        :column-labels="headers.map(header => header.title)">
        <template #head-cell="{ col }">
          <div class="column-title">
            <Icon :icon="headers[col].icon" />
          </div>
        </template>

        <template #data-cell="{ value, index, col }">
          <th v-if="col === 0" class="minimap">
            <TooltipedMinimap :tag="state.data[index].arenaTag" class="image" :game />
            <p>{{ getArenaName(state.data[index].arenaTag) }}</p>
          </th>
          <td v-else-if="col === 1 || col === 2">
            <span>{{ logProcessor(Number(value)) }}</span>
            <span class="column-share">({{ formatColumnShare(Number(value), col === 1 ? 'battles' : 'players') }})</span>
          </td>
          <td v-else-if="col === 3 || col === 4">{{ percentFormatter.format(Number(value)) }}</td>
          <td v-else-if="col === 5">{{ formatDuration(Number(value)) }}</td>
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
import type { GameRegion, GameVendor } from '@/shared/game/wot'
import { getArenaName } from '@/shared/i18n/i18n'
import { createFixedSpaceProcessor, createLogProcessor, createPercentProcessor } from '@/shared/utils/processors/processors'
import { sec2minsec } from '@/shared/utils/time'
import TooltipedMinimap from '../../statistics/mapsTable/TooltipedMinimap.vue'
import SortableTable from '../../statistics/sortableTable/SortableTable.vue'
import TableState from './TableState.vue'
import type { GlobalArenaStatistic, StatisticsLoadState } from './types'

const SHOW_MORE_THRESHOLD = 6

const props = defineProps<{
  state: StatisticsLoadState<GlobalArenaStatistic>
  game: GameVendor
  region: GameRegion
}>()

const showMore = ref(false)
const orderBy = ref(1)
const orderDirection = ref<'asc' | 'desc'>('desc')
const canShowMore = computed(() => props.state.status === 'success'
  && props.state.data.length > SHOW_MORE_THRESHOLD
)

const headers = computed<{ title: string, icon: IconType }[]>(() => [
  { title: '', icon: 'arena' },
  { title: 'Бои', icon: 'battles' },
  { title: 'Уникальные игроки', icon: 'player' },
  { title: props.region === 'RU' ? 'Винрейт обороны' : 'Винрейт команды 1', icon: 'winrate' },
  { title: 'Побед захватом базы', icon: 'base-capture' },
  { title: 'Продолжительность боя', icon: 'duration' },
  { title: 'Средний урон', icon: 'dmg' },
  { title: 'Среднее содействие', icon: 'assist' },
  { title: 'Средние уничтожения', icon: 'kill' },
])

const data = computed(() => props.state.data.map(item => [
  item.arenaTag,
  item.battles,
  item.players,
  item.defenseWinrate,
  item.baseCaptureRate,
  item.duration,
  item.damage,
  item.assist,
  item.kills,
]))

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
const sharePercentFormatter = createPercentProcessor(1)
const logProcessor = createLogProcessor()

function formatColumnShare(value: number, column: 'players' | 'battles') {
  const total = columnTotals.value[column]
  return sharePercentFormatter(total > 0 ? value / total : 0)
}

function formatDuration(value: number) {
  return sec2minsec(Math.max(0, Math.floor(value)))
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

.minimap {
  display: flex;
  align-items: center;
  margin-left: 10px;
  font-weight: normal;

  .image {
    width: 40px;
    height: 40px;
    margin: 5px 10px 5px 5px;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
    user-select: none;
  }

  p {
    font-size: 15px;
    line-height: 16px;
    white-space: nowrap;
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
</style>
