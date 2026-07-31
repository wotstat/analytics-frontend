<template>
  <div class="summary-grid">
    <div class="summary-main">
      <div class="map-name">{{ getArenaName(replay.raw.battle.map.geometry) }}</div>
      <div class="mode">{{ modeTitle }}</div>
      <div class="result" :class="{ win: isWin, loss: !isWin }">
        {{ winnerText }}
      </div>
    </div>

    <dl class="facts">
      <div>
        <dt>Бой</dt>
        <dd>#{{ replay.raw.battle.arenaUniqueID }}</dd>
      </div>
      <div>
        <dt>Захвачено</dt>
        <dd>{{ captureDuration }}</dd>
      </div>
      <div>
        <dt>Результат боя</dt>
        <dd>{{ resultDuration }}</dd>
      </div>
      <div>
        <dt>Команды</dt>
        <dd>{{ teamCounts }}</dd>
      </div>
      <div>
        <dt>Техника / жизни</dt>
        <dd>{{ replay.raw.vehicleInfos.length }} / {{ replay.raw.vehicleLives.length }}</dd>
      </div>
      <div>
        <dt>События снарядов</dt>
        <dd>{{ replay.raw.projectileEvents.length }}</dd>
      </div>
    </dl>

    <div class="technical">
      <span>schema v{{ replay.raw.schemaVersion }}</span>
      <span>tick {{ replay.raw.battle.tickLength }} с</span>
      <span>client {{ replay.raw.battle.clientVersion }}</span>
      <span>mod {{ replay.raw.battle.modVersion }}</span>
      <span>{{ replay.raw.battle.captureEndReason }}</span>
      <span :class="{ warning: !replay.raw.battle.captureReachedArenaEnd }">
        {{ replay.raw.battle.captureReachedArenaEnd ? 'полный захват' : 'захват завершён до arena end' }}
      </span>
    </div>

    <div class="source-controls">
      <label class="debug-btn file-button">
        Открыть JSON
        <input type="file" accept=".json,application/json" @change="selectFile">
      </label>
      <button class="debug-btn" type="button" @click="$emit('reset')" :disabled="isDefault">
        Вернуть пример
      </button>
      <span class="debug-value">{{ sourceName }}</span>
      <span class="debug-hint" v-if="loading">Читаю и разбираю файл…</span>
      <span class="load-error" v-if="error">{{ error }}</span>
    </div>

    <p class="debug-note">
      Колонки опыта в текущей <span class="debug-value">schemaVersion: 1</span> нет — в таблице выводится «—».
      Неизвестные поля и события при загрузке игнорируются.
    </p>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { getArenaName } from '@/shared/i18n/i18n'
import { formatDuration } from '../model'
import type { PreparedReplay } from '../types'

const props = defineProps<{
  replay: PreparedReplay
  sourceName: string
  loading: boolean
  error: string
  isDefault: boolean
}>()

const emit = defineEmits<{
  load: [file: File]
  reset: []
}>()

const modeTitle = computed(() => ({
  REGULAR: 'Случайный бой',
  EPIC_BATTLE: 'Линия фронта',
  BATTLE_ROYALE_SOLO: 'Стальной охотник',
}[props.replay.raw.battle.mode.bonusTypeName] ?? props.replay.raw.battle.mode.bonusTypeName))

const isWin = computed(() => props.replay.raw.result?.common.winnerTeam === props.replay.raw.battle.reporterTeam)
const winnerText = computed(() => {
  const winner = props.replay.raw.result?.common.winnerTeam
  if (!winner) return 'Результат неизвестен'
  return isWin.value ? 'Победа команды репортера' : `Победа команды ${winner}`
})

const captureDuration = computed(() => formatDuration(
  props.replay.maxTick * props.replay.raw.battle.tickLength
))
const resultDuration = computed(() => props.replay.raw.result?.common.duration
  ? formatDuration(props.replay.raw.result.common.duration)
  : '—'
)
const teamCounts = computed(() => {
  const counts = new Map<number, number>()
  props.replay.raw.participants.forEach(participant => counts.set(
    participant.team,
    (counts.get(participant.team) ?? 0) + 1,
  ))
  return [...counts.entries()].map(([team, count]) => `${team}: ${count}`).join(' · ')
})

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('load', file)
  input.value = ''
}
</script>


<style scoped lang="scss">
.summary-grid {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(420px, 1.3fr);
  gap: 0.8em 1.2em;
  padding: 1em;
  border: 1px solid #ffffff17;
  border-radius: 9px;
  background:
    radial-gradient(circle at 0 0, #2987c81c, transparent 42%),
    #ffffff08;
}

.summary-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  .map-name {
    font-size: clamp(22px, 3vw, 36px);
    font-weight: 700;
    line-height: 1.05;
  }

  .mode {
    margin-top: 0.25em;
    color: #ffffff97;
    font-size: 13px;
  }

  .result {
    margin-top: 0.8em;
    font-size: 12px;
    font-weight: var(--medium-bold-weight);

    &.win {
      color: #69db91;
    }

    &.loss {
      color: #ef777c;
    }
  }
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 0.7em;
  margin: 0;

  >div {
    min-width: 0;
    padding: 0.65em;
    border-radius: 6px;
    background: #00000024;
  }

  dt {
    color: #ffffff72;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  dd {
    margin: 0.25em 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #ffffffe6;
    font-family: var(--debug-mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.technical {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35em;

  span {
    padding: 0.2em 0.5em;
    border: 1px solid #ffffff14;
    border-radius: 999px;
    color: #ffffff82;
    font-family: var(--debug-mono);
    font-size: 10px;
  }

  .warning {
    border-color: #d9973855;
    color: #f0bd74;
  }
}

.source-controls {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5em;

  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
}

.file-button {
  cursor: pointer;

  input {
    display: none;
  }
}

.load-error {
  color: #ff777d;
  font-size: 12px;
}

.debug-note {
  grid-column: 1 / -1;
}

@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .facts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
