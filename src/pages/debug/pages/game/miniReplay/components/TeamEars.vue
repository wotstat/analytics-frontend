<template>
  <aside class="team-ear" :class="side">
    <header>
      <span>{{ title }}</span>
      <span class="count">{{ entries.length }}</span>
    </header>

    <div class="ear-list" :style="{ '--ear-rows': rowCount }">
      <div class="ear-entry" v-for="entry in entries" :key="entry.participant.participantId"
        :class="{ dead: !entry.alive, reporter: entry.participant.participantId === replay.raw.battle.reporterParticipantId }"
        :title="`${entry.participant.name} · ${getTankName(entry.vehicleTag, true)}`">
        <div class="tank-line">
          <span class="tank-name">{{ getTankName(entry.vehicleTag, true) }}</span>
          <span class="player-name">{{ entry.participant.name }}</span>
        </div>
        <div class="hp-track">
          <span :style="{ width: `${entry.healthPercent}%` }"></span>
        </div>
      </div>
    </div>
  </aside>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { getTankName } from '@/shared/i18n/i18n'
import { lifeFrameAt } from '../model'
import type { PreparedLife, PreparedReplay } from '../types'

const props = defineProps<{
  replay: PreparedReplay
  tick: number
  team: number
  title: string
  side: 'left' | 'right'
}>()

const entries = computed(() => {
  const result = []
  for (const participant of props.replay.raw.participants.filter(item => item.team === props.team)) {
    const lives = props.replay.livesByParticipant.get(participant.participantId) ?? []
    const observed = lives.filter(life => life.raw.firstObservedTick <= props.tick)
    if (!observed.length) continue

    const frames = observed
      .map(life => ({ life, frame: lifeFrameAt(life, props.tick, props.replay.raw.battle.reporterTeam) }))
      .filter(item => item.frame)
    const active = frames.find(item => item.frame?.alive) ?? frames.at(-1)
    const fallbackLife = observed.at(-1) as PreparedLife
    const life = active?.life ?? fallbackLife
    const frame = active?.frame
    const maxHealth = frame?.maxHealth ?? life.info.maxHealth ?? 1
    const health = frame?.health ?? 0

    result.push({
      participant,
      vehicleTag: life.info.vehicleTag ?? 'unknown:vehicle',
      alive: frame?.alive ?? false,
      healthPercent: Math.max(0, Math.min(100, health / maxHealth * 100)),
    })
  }
  return result
})

const rowCount = computed(() => Math.min(15, Math.max(1, entries.value.length)))
</script>


<style scoped lang="scss">
.team-ear {
  min-width: 0;
  padding: 0.55em;
  border: 1px solid #ffffff17;
  border-radius: 8px;
  background: #07090ccc;

  >header {
    display: flex;
    justify-content: space-between;
    gap: 0.5em;
    padding: 0 0.2em 0.45em;
    font-size: 11px;
    font-weight: var(--medium-bold-weight);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #ffffffa8;

    .count {
      font-family: var(--debug-mono);
    }
  }
}

.ear-list {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(var(--ear-rows), 25px);
  grid-auto-columns: minmax(76px, 1fr);
  gap: 3px 5px;
}

.ear-entry {
  position: relative;
  min-width: 0;
  border-radius: 3px;
  padding: 2px 4px 4px;
  background: #ffffff0b;
  overflow: hidden;

  &.reporter {
    background: #52b8ff22;
    box-shadow: inset 0 0 0 1px #52b8ff77;
  }

  &.dead {
    opacity: 0.42;
  }
}

.tank-line {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  min-width: 0;
  font-size: 9px;
  line-height: 16px;

  .tank-name {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #ffffffe8;
  }

  .player-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #ffffff67;
  }
}

.hp-track {
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 2px;
  height: 2px;
  background: #ffffff18;

  span {
    display: block;
    height: 100%;
    background: #5dcc83;
    transition: width 80ms linear;
  }
}

.right .hp-track span {
  background: #e45d62;
}

@media (max-width: 1000px) {
  .team-ear {
    display: none;
  }
}
</style>
