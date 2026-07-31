<template>
  <div class="details-panel">
    <header class="details-head">
      <button type="button" class="back" @click="$emit('close')" title="Закрыть подробности">←</button>
      <div>
        <div class="nickname">
          {{ player.participant.name }}
          <span v-if="player.participant.clanTag">[{{ player.participant.clanTag }}]</span>
        </div>
        <div class="account debug-value">{{ player.participant.participantId }}</div>
      </div>
    </header>

    <div class="vehicle-tabs" v-if="player.vehicleResults.length > 1">
      <button type="button" v-for="(vehicle, index) in player.vehicleResults" :key="`${vehicle.vehicleId}:${vehicle.aggregateIndex}`"
        :class="{ active: index === selectedIndex }" @click="selectedIndex = index">
        {{ getTankName(vehicle.vehicleTag, true) }}
      </button>
    </div>

    <div class="vehicle-title">
      <VehicleImage :tag="selected.vehicleTag" size="small" />
      <div>
        <strong>{{ getTankName(selected.vehicleTag, true) }}</strong>
        <span>vehicleId {{ selected.vehicleId }} · aggregate {{ selected.aggregateIndex }}</span>
      </div>
    </div>

    <dl class="stats">
      <div v-for="item in stats" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ formatNumber(item.value) }}</dd>
      </div>
    </dl>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { getTankName } from '@/shared/i18n/i18n'
import type { PlayerResultRow } from '../types'

const props = defineProps<{
  player: PlayerResultRow
}>()

defineEmits<{
  close: []
}>()

const selectedIndex = ref(0)
watch(() => props.player.participant.participantId, () => selectedIndex.value = 0)

const selected = computed(() => props.player.vehicleResults[selectedIndex.value] ?? {
  aggregateIndex: 0,
  vehicleId: 0,
  vehicleTag: 'unknown:vehicle',
})

const stats = computed(() => [
  { label: 'Урон', value: selected.value.damageDealt },
  { label: 'Фраги', value: selected.value.kills },
  { label: 'Получено урона', value: selected.value.damageReceived },
  { label: 'Заблокировано', value: selected.value.damageBlockedByArmor },
  { label: 'Ассист по засвету', value: selected.value.damageAssistedRadio },
  { label: 'Ассист по гусенице', value: selected.value.damageAssistedTrack },
  { label: 'Выстрелы', value: selected.value.shots },
  { label: 'Попадания', value: selected.value.directEnemyHits },
  { label: 'Пробития', value: selected.value.piercingEnemyHits },
  { label: 'Обнаружено', value: selected.value.spotted },
  { label: 'Время жизни', value: selected.value.lifeTime },
  { label: 'Пробег, м', value: selected.value.mileage },
])

function formatNumber(value: unknown) {
  return typeof value === 'number'
    ? Math.round(value).toLocaleString('ru-RU')
    : '—'
}
</script>


<style scoped lang="scss">
.details-panel {
  min-width: 0;
  min-height: 100%;
  padding: 0.75em;
  border: 1px solid #4ea9e144;
  border-radius: 8px;
  background:
    radial-gradient(circle at 100% 0, #2d91c51e, transparent 45%),
    #ffffff08;
}

.details-head {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding-bottom: 0.65em;
  border-bottom: 1px solid #ffffff15;

  .back {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    background: #ffffff0d;
    font-size: 18px;

    &:hover {
      background: #ffffff1c;
    }
  }

  .nickname {
    font-weight: var(--medium-bold-weight);

    span {
      color: #74bcea;
    }
  }

  .account {
    margin-top: 0.15em;
    color: #ffffff6e;
    font-size: 9px;
  }
}

.vehicle-tabs {
  display: flex;
  gap: 0.35em;
  overflow-x: auto;
  margin-top: 0.7em;
  padding-bottom: 0.2em;

  button {
    flex: 0 0 auto;
    padding: 0.35em 0.6em;
    border: 1px solid #ffffff1b;
    border-radius: 4px;
    background: #ffffff08;
    color: #ffffff9d;
    font-size: 11px;

    &:hover {
      background: #ffffff13;
    }

    &.active {
      border-color: #4ea9e188;
      color: white;
      background: #4ea9e11c;
    }
  }
}

.vehicle-title {
  display: flex;
  align-items: center;
  min-height: 60px;
  margin-top: 0.6em;

  img {
    width: 105px;
  }

  >div {
    display: flex;
    flex-direction: column;

    span {
      color: #ffffff6b;
      font-family: var(--debug-mono);
      font-size: 9px;
    }
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45em;
  margin: 0.55em 0 0;

  >div {
    padding: 0.5em;
    border-radius: 5px;
    background: #00000026;
  }

  dt {
    color: #ffffff70;
    font-size: 9px;
  }

  dd {
    margin: 0.2em 0 0;
    font-family: var(--debug-mono);
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
