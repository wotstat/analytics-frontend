<template>
  <div class="replay-layout">
    <TeamEars :replay :tick :team="allyTeam" title="Союзники" side="left" />

    <div class="map-column">
      <div class="map-shell">
        <Minimap :tag="replay.raw.battle.map.geometry" :gameplay="replay.raw.battle.mode.gameplayName" :team="allyTeam"
          :show-bases="true">
          <ProjectileCanvas :replay :tick />

          <div class="tank-marker" v-for="frame in visibleTanks" :key="frame.life.raw.lifeId" :class="[
            frame.life.participant.team === allyTeam ? 'ally' : 'enemy',
            { reporter: frame.life.raw.participantId === replay.raw.battle.reporterParticipantId },
          ]" :style="markerStyle(frame)"
            :title="`${frame.life.participant.name} · ${getTankName(frame.life.info.vehicleTag ?? '', true)} · ${Math.round(frame.health)} HP`">
            <svg class="hp-ring" viewBox="0 0 32 32" aria-hidden="true">
              <circle class="hp-track" cx="16" cy="16" r="14" pathLength="100"></circle>
              <circle class="hp-value" cx="16" cy="16" r="14" pathLength="100"
                :style="{ strokeDasharray: `${healthPercent(frame)} 100` }"></circle>
            </svg>
            <svg v-if="frame.turretYaw !== null" class="turret-sector" viewBox="0 0 32 32" aria-hidden="true"
              :style="{ transform: `rotate(${frame.turretYaw}rad)` }">
              <path d="M16 16 L11.6 4.7 A12 12 0 0 1 20.4 4.7 Z"></path>
            </svg>
            <VehicleType class="type-icon" :type="markerVehicleType(frame.life.info.classTag)" />
            <p class="tank-name mt-font">{{ getTankName(frame.life.info.vehicleTag || '', true) }}</p>
          </div>

          <div class="map-readout">
            tick {{ Math.floor(tick) }} · {{ visibleTanks.length }} объектов ·
            {{ activeShotCount }} трассеров
          </div>
        </Minimap>
      </div>

      <div class="playback">
        <div class="transport">
          <button class="debug-btn icon" type="button" @click="$emit('play')" :disabled="playing"
            title="Воспроизвести">▶</button>
          <button class="debug-btn icon" type="button" @click="$emit('pause')" :disabled="!playing"
            title="Пауза">Ⅱ</button>
          <span class="time debug-value">{{ currentTime }} / {{ totalTime }}</span>
          <label class="debug-control speed">
            <span class="debug-label">скорость</span>
            <select :value="speed" @change="$emit('update:speed', Number(($event.target as HTMLSelectElement).value))">
              <option v-for="value in speeds" :key="value" :value="value">{{ value }}×</option>
            </select>
          </label>
        </div>

        <input class="timeline" type="range" min="0" :max="replay.maxTick" step="1" :value="tick"
          @input="$emit('seek', Number(($event.target as HTMLInputElement).value))">
      </div>
    </div>

    <TeamEars :replay :tick :team="enemyTeam" title="Противники" side="right" />
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { getTankName } from '@/shared/i18n/i18n'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import type { VehicleType as VehicleTypeName } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { formatDuration, lifeFrameAt, worldToRelative } from '../model'
import type { LifeFrame, PreparedReplay } from '../types'
import ProjectileCanvas from './ProjectileCanvas.vue'
import TeamEars from './TeamEars.vue'

const props = defineProps<{
  replay: PreparedReplay
  tick: number
  playing: boolean
  speed: number
}>()

defineEmits<{
  play: []
  pause: []
  seek: [tick: number]
  'update:speed': [speed: number]
}>()

const speeds = [0.25, 0.5, 1, 2, 4]
const allyTeam = computed(() => props.replay.raw.battle.reporterTeam)
const enemyTeam = computed(() => {
  const teams = [...new Set(props.replay.raw.participants.map(participant => participant.team))]
  return teams.find(team => team !== allyTeam.value) ?? 2
})

const visibleTanks = computed(() => props.replay.lives
  .map(life => lifeFrameAt(life, props.tick, allyTeam.value))
  .filter((frame): frame is LifeFrame => Boolean(frame?.alive && frame.spotted))
)

const activeShotCount = computed(() => props.replay.shots.filter(shot =>
  shot.startTick <= props.tick && shot.endTick + 12 >= props.tick
).length)

const currentTime = computed(() => formatDuration(props.tick * props.replay.raw.battle.tickLength))
const totalTime = computed(() => formatDuration(props.replay.maxTick * props.replay.raw.battle.tickLength))

function markerStyle(frame: LifeFrame) {
  const point = worldToRelative(frame, props.replay)
  return {
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
  }
}

function healthPercent(frame: LifeFrame) {
  return Math.max(0, Math.min(100, frame.health / frame.maxHealth * 100))
}

function markerVehicleType(classTag?: string): VehicleTypeName {
  return {
    lightTank: 'lighttank',
    mediumTank: 'mediumtank',
    heavyTank: 'heavytank',
    'AT-SPG': 'at-spg',
    SPG: 'spg',
  }[classTag ?? ''] as VehicleTypeName ?? 'any'
}
</script>


<style scoped lang="scss">
.replay-layout {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) minmax(420px, 720px) minmax(170px, 1fr);
  align-items: start;
  gap: 0.65em;
}

.map-column {
  min-width: 0;
}

.map-shell {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid #ffffff25;
  border-radius: 8px;
  background: #0a0d11;
  box-shadow: 0 8px 32px #00000055;

  :deep(.minimap),
  :deep(.overlay) {
    width: 100%;
    height: 100%;
  }
}

.tank-marker {
  position: absolute;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: auto;

  .hp-ring,
  .turret-sector {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .turret-sector {
    scale: 2;
  }

  .hp-ring {
    transform: rotate(-90deg);

    circle {
      fill: none;
      stroke-width: 2.3;
    }

    .hp-track {
      stroke: #080a0d1f;
    }

    .hp-value {
      stroke: currentColor;
      stroke-linecap: round;
      transition: stroke-dasharray 80ms linear;
    }
  }

  .turret-sector {
    transform-origin: center;

    path {
      fill: currentColor;
      opacity: 0.38;
      stroke: #ffffffba;
      stroke-width: 0.5;
    }
  }

  .type-icon {
    position: absolute;
    inset: 0;
    width: 14px;
    height: 14px;
    margin: auto;
    padding: 2px;
    border-radius: 50%;
    color: inherit;
    filter: drop-shadow(0 0 3px #000) drop-shadow(0 0 3px #000) drop-shadow(0 0 3px #000);
    pointer-events: none;
  }

  .tank-name {
    position: absolute;
    left: 0.5em;
    bottom: -1em;
    max-width: 120px;
    padding: 0 2px;
    text-align: left;
    font-size: 12px;
    line-height: 1.2;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    filter: drop-shadow(0 0 1px #000);
  }

  &.ally {
    color: #56e18c;
  }

  &.enemy {
    color: #ff656b;
  }

  &.reporter {
    z-index: 5;

    .hp-ring {
      filter: drop-shadow(0 0 3px #37b8ff);
    }

    .type-icon {
      box-shadow: 0 0 0 1px #a7e4ff;
    }
  }
}

.map-readout {
  position: absolute;
  left: 7px;
  bottom: 7px;
  z-index: 5;
  padding: 3px 6px;
  border-radius: 4px;
  background: #05070abc;
  color: #ffffffa6;
  font-family: var(--debug-mono);
  font-size: 9px;
  pointer-events: none;
}

.playback {
  display: flex;
  flex-direction: column;
  gap: 0.45em;
  margin-top: 0.65em;
  padding: 0.65em;
  border: 1px solid #ffffff17;
  border-radius: 8px;
  background: #ffffff08;
}

.transport {
  display: flex;
  align-items: center;
  gap: 0.45em;

  .icon {
    min-width: 30px;
    height: 28px;
    padding: 0;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  .time {
    min-width: 95px;
    margin-right: auto;
  }

  .speed {
    margin-left: auto;
  }
}

.timeline {
  width: 100% !important;
  margin: 0;
}

@media (max-width: 1000px) {
  .replay-layout {
    grid-template-columns: minmax(0, 720px);
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .replay-layout {
    grid-template-columns: 1fr;
  }

  .transport {
    flex-wrap: wrap;
  }
}
</style>
