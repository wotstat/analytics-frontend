<template>
  <div class="results-layout">
    <template v-if="selectedPlayer?.team === enemyTeam">
      <PlayerDetails :player="selectedPlayer" @close="selectedPlayer = null" />
    </template>
    <TeamTable v-else title="Союзники" :team="allyTeam" :players="allyPlayers" :selected-id="selectedPlayer?.participant.participantId"
      @select="selectedPlayer = $event" />

    <template v-if="selectedPlayer?.team === allyTeam">
      <PlayerDetails :player="selectedPlayer" @close="selectedPlayer = null" />
    </template>
    <TeamTable v-else title="Противники" :team="enemyTeam" :players="enemyPlayers" :selected-id="selectedPlayer?.participant.participantId"
      @select="selectedPlayer = $event" />
  </div>
</template>


<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { getTankName } from '@/shared/i18n/i18n'
import type { PlayerResultRow, PreparedReplay } from '../types'
import PlayerDetails from './PlayerDetails.vue'

const props = defineProps<{
  replay: PreparedReplay
}>()

const selectedPlayer = ref<PlayerResultRow | null>(null)
const allyTeam = computed(() => props.replay.raw.battle.reporterTeam)
const enemyTeam = computed(() => {
  const teams = [...new Set(props.replay.resultRows.map(player => player.team))]
  return teams.find(team => team !== allyTeam.value) ?? 2
})
const allyPlayers = computed(() => props.replay.resultRows.filter(player => player.team === allyTeam.value))
const enemyPlayers = computed(() => props.replay.resultRows.filter(player => player.team === enemyTeam.value))

const TeamTable = defineComponent({
  props: {
    title: { type: String, required: true },
    team: { type: Number, required: true },
    players: { type: Array as () => PlayerResultRow[], required: true },
    selectedId: { type: String, default: undefined },
  },
  emits: {
    select: (_player: PlayerResultRow) => true,
  },
  setup(tableProps, { emit }) {
    const format = (value: number | null) => value === null ? '—' : value.toLocaleString('ru-RU')
    return () => h('div', { class: ['team-table', `team-${tableProps.team}`] }, [
      h('header', [
        h('span', tableProps.title),
        h('span', { class: 'team-total' }, `${tableProps.players.reduce((sum, player) => sum + player.damage, 0).toLocaleString('ru-RU')} урона`),
      ]),
      h('div', { class: 'table-head' }, [
        h('span', 'Игрок'),
        h('span', 'Танк'),
        h('span', 'Урон'),
        h('span', 'Фраги'),
        h('span', { title: 'В schemaVersion 1 опыт отсутствует' }, 'Опыт'),
      ]),
      h('div', { class: 'table-body' }, tableProps.players.map(player => h('button', {
        type: 'button',
        class: ['player-row', { selected: player.participant.participantId === tableProps.selectedId }],
        onClick: () => emit('select', player),
      }, [
        h('span', { class: 'nickname', title: player.participant.participantId }, [
          h('span', player.participant.name),
          player.participant.clanTag ? h('small', `[${player.participant.clanTag}]`) : null,
        ]),
        h('span', { class: ['vehicle', { multiple: player.vehicleResults.length > 1 }] },
          player.vehicleResults.length === 1
            ? getTankName(player.vehicleResults[0].vehicleTag, true)
            : player.vehicleResults.length
              ? `${player.vehicleResults.length} танка`
              : '—'
        ),
        h('span', { class: 'number damage' }, format(player.damage)),
        h('span', { class: 'number' }, format(player.kills)),
        h('span', { class: 'number missing', title: 'Поле опыта отсутствует в mini replay schemaVersion 1' }, format(player.experience)),
      ]))),
    ])
  },
})
</script>


<style scoped lang="scss">
.results-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 0.75em;
}

:deep(.team-table) {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #ffffff17;
  border-radius: 8px;
  background: #ffffff07;

  >header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5em;
    padding: 0.65em 0.75em;
    border-bottom: 1px solid #ffffff17;
    font-size: 13px;
    font-weight: var(--medium-bold-weight);

    .team-total {
      color: #ffffff68;
      font-family: var(--debug-mono);
      font-size: 9px;
      font-weight: normal;
    }
  }

  &.team-1>header {
    box-shadow: inset 3px 0 #52c47a;
  }

  &.team-2>header {
    box-shadow: inset 3px 0 #dc5b61;
  }
}

:deep(.table-head),
:deep(.player-row) {
  display: grid;
  grid-template-columns: minmax(100px, 1.4fr) minmax(76px, 1fr) 70px 48px 54px;
  align-items: center;
  gap: 0.4em;
}

:deep(.table-head) {
  padding: 0.4em 0.7em;
  color: #ffffff65;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  span:nth-child(n + 3) {
    text-align: right;
  }
}

:deep(.table-body) {
  max-height: 590px;
  overflow-y: auto;
}

:deep(.player-row) {
  width: 100%;
  min-height: 34px;
  padding: 0.35em 0.7em;
  border-top: 1px solid #ffffff0d;
  text-align: left;
  font-size: 11px;

  &:hover,
  &.selected {
    background: #ffffff10;
  }

  .nickname,
  .vehicle {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nickname {
    display: flex;
    gap: 0.3em;

    small {
      color: #69a8d2;
      font-size: inherit;
    }
  }

  .vehicle {
    color: #ffffff9c;

    &.multiple {
      color: #e7b56e;
    }
  }

  .number {
    text-align: right;
    font-family: var(--debug-mono);
    font-variant-numeric: tabular-nums;

    &.damage {
      color: #f3d68a;
    }

    &.missing {
      color: #ffffff4b;
    }
  }
}

@media (max-width: 850px) {
  .results-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  :deep(.table-head),
  :deep(.player-row) {
    grid-template-columns: minmax(90px, 1fr) minmax(66px, 0.8fr) 60px 42px 42px;
    gap: 0.25em;
  }
}
</style>
