<template>
  <div>
    <div class="flex hor">
      <div class="flex ver">
        <svg class="shot-circle">
          <circle v-if="possibleMin && possibleMin < 0.99" class="possible-min" cx="50%" cy="50%"
            :r="(possibleMin * 49.5) + '%'" />
          <circle class="main" cx="50%" cy="50%" r="49.5%" />
          <line x1="45%" y1="50%" x2="55%" y2="50%" />
          <line x1="50%" y1="45%" x2="50%" y2="55%" />
          <circle v-if="hitPoint" class="hit-point" :class="hitPoint.hit ? 'hit' : ''" :cx="hitPoint.x * 99 + '%'"
            :cy="hitPoint.y * 99 + '%'" r="1%" />
        </svg>
        <div class="minimap">
          <div class="map-container">
            <img class="map" v-if="arenaMinimapUrl" :src="arenaMinimapUrl">
          </div>
          <img class="border" src="/minimap_b4.png" alt="">

          <div class="overlay-container">
            <svg v-if="playerTank && mapHitPoint" class="full">
              <line class="trajectory" :x1="absoluteStyleMapPosition(playerTank.x, playerTank.y).left"
                :y1="absoluteStyleMapPosition(playerTank.x, playerTank.y).top"
                :x2="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z).left"
                :y2="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z).top" />
            </svg>

            <img v-if="playerTank" class="tank-icon" :style="absoluteStyleMapPosition(playerTank.x, playerTank.y)"
              src="/mediumTank_ally_green.png">

            <svg v-if="serverMakerPoint" class="marker"
              :style="absoluteStyleMapPosition(serverMakerPoint.x, serverMakerPoint.z)">
              <line x1="0%" y1="50%" x2="100%" y2="50%" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" />
            </svg>

            <svg v-if="mapHitPoint" class="hit-point" :style="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z)">
              <circle :class="mapHitPoint.hit ? 'hit' : ''" cx="50%" cy="50%" r="10%" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <!-- {{ shotID }}
    {{ res }}
    <button @click="openInWotInspector">WotIspector</button>
    <br>
    {{ wotInspectorUrl }} -->
  </div>
</template>

<script lang="ts" setup>
import { queryAsync, queryAsyncFirst } from '@/db';
import { computed } from 'vue';
import { wotinspectorURL } from '@/utils/wot';
import { aranaMinimapUrl, getArenaID } from '@/utils/arenas';
import { computedAsync } from '@vueuse/core';

type UInt128 = string;
type DateTime64 = string;
type UInt32 = number;
type Int32 = number;
type UInt16 = number;
type UInt64 = number;
type UInt8 = number;
type Float32 = number;
type Decimal = number;
type Bool = boolean;
type Nullable<T> = T | null;

type Shot = {
  id: UInt128
  onBattleStartId: UInt128
  localtime: DateTime64
  dateTime: DateTime64
  shotId: UInt32
  health: UInt32
  arenaTag: string
  playerName: string
  playerClan: string
  accountDBID: UInt64
  battleMode: string
  battleGameplay: string
  serverName: string
  region: string
  gameVersion: string
  modVersion: string
  team: UInt8
  tankTag: string
  tankType: string
  tankLevel: UInt8
  gunTag: string
  battleTime: Int32
  shellTag: string
  shellName: string
  shellDamage: Decimal
  damageRandomization: Decimal
  shellPiercingPower: UInt32
  shellCaliber: Float32
  shellSpeed: Decimal
  shellMaxDistance: UInt16
  gunDispersion: Float32
  battleDispersion: Float32
  serverShotDispersion: Float32
  clientShotDispersion: Float32
  ballisticResultServer_r: Float32
  ballisticResultServer_theta: Float32
  ballisticResultClient_r: Float32
  ballisticResultClient_theta: Float32
  gravity: Float32
  serverAim: Bool
  autoAim: Bool
  ping: Float32
  fps: UInt16
  hitVehicleDescr: Nullable<UInt32>
  hitChassisDescr: Nullable<UInt32>
  hitTurretDescr: Nullable<UInt32>
  hitGunDescr: Nullable<UInt32>
  hitTurretYaw: Nullable<Float32>
  hitTurretPitch: Nullable<Float32>
  vehicleDescr: UInt32
  chassisDescr: UInt32
  turretDescr: UInt32
  gunDescr: UInt32
  turretYaw: Float32
  turretPitch: Float32
  shellDescr: UInt32
  hitSegment: Nullable<string>
  vehicleSpeed: Float32
  vehicleRotationSpeed: Float32
  turretSpeed: Float32
  gunPoint_x: Float32
  gunPoint_y: Float32
  gunPoint_z: Float32
  clientMarkerPoint_x: Float32
  clientMarkerPoint_y: Float32
  clientMarkerPoint_z: Float32
  serverMarkerPoint_x: Float32
  serverMarkerPoint_y: Float32
  serverMarkerPoint_z: Float32
  tracerStart_x: Float32
  tracerStart_y: Float32
  tracerStart_z: Float32
  tracerEnd_x: Float32
  tracerEnd_y: Float32
  tracerEnd_z: Float32
  tracerVel_x: Float32
  tracerVel_y: Float32
  tracerVel_z: Float32
  hitReason: 'tank' | 'terrain' | 'other' | 'none'
  hitPoint_x: Nullable<Float32>
  hitPoint_y: Nullable<Float32>
  hitPoint_z: Nullable<Float32>
  'results.order': UInt16[]
  'results.tankTag': string[]
  'results.shotDamage': UInt16[]
  'results.fireDamage': UInt16[]
  'results.shotHealth': Nullable<UInt16>[]
  'results.fireHealth': Nullable<UInt16>[]
  'results.ammoBayDestroyed': Bool[]
  'results.flags': UInt16[]
}


const props = defineProps<{
  shotID: string;
}>();

const res = queryAsyncFirst<Shot | null>(`SELECT * FROM Event_OnShot WHERE id = '${props.shotID}'`, null);

function openInWotInspector() {
  if (wotInspectorUrl.value != null) {
    window.open(wotInspectorUrl.value, '_blank');
  }
}

const wotInspectorUrl = computed(() => {
  if (res.value == null) return null;

  const r = res.value
  if (r.hitPoint_x == null || r.hitPoint_y == null || r.hitPoint_z == null) return null;
  if (r.hitVehicleDescr == null || r.hitChassisDescr == null || r.hitTurretDescr == null ||
    r.hitGunDescr == null || r.hitTurretPitch == null || r.hitTurretYaw == null || r.hitSegment == null) return null;

  const gunPoint = { x: r.gunPoint_x, y: r.gunPoint_y, z: r.gunPoint_z, }
  const hitPoint = { x: r.hitPoint_x, y: r.hitPoint_y, z: r.hitPoint_z, };

  const distance = Math.sqrt(
    Math.pow(gunPoint.x - hitPoint.x, 2) +
    Math.pow(gunPoint.y - hitPoint.y, 2) +
    Math.pow(gunPoint.z - hitPoint.z, 2)
  );

  return wotinspectorURL({
    vehicle: r.vehicleDescr,
    chassis: r.chassisDescr,
    turret: r.turretDescr,
    gun: r.gunDescr,
    shell: r.shellDescr,
  }, {
    vehicle: r.hitVehicleDescr,
    chassis: r.hitChassisDescr,
    turret: r.hitTurretDescr,
    gun: r.hitGunDescr,
    turretYaw: -r.hitTurretPitch,
    turretPitch: r.hitTurretYaw,
    segment: r.hitSegment,
  }, distance);
})

const hitPoint = computed(() => {
  if (res.value == null) return null;
  console.log(res.value);


  const r = res.value.ballisticResultServer_r
  const theta = res.value.ballisticResultServer_theta

  const x = (r * Math.cos(theta) + 1) / 2
  const y = (r * Math.sin(theta) + 1) / 2

  return { x, y, hit: res.value['results.order'].length > 0 }
})

const mapHitPoint = computed(() => {
  if (res.value == null) return null;
  return {
    x: res.value.hitPoint_x ?? res.value.tracerEnd_x,
    z: res.value.hitPoint_z ?? res.value.tracerEnd_z,
    hit: res.value['results.order'].length > 0
  }
})

const possibleMin = computed(() => {
  if (res.value == null) return null;

  return res.value.gunDispersion / res.value.serverShotDispersion
})

const arenaMinimapUrl = computedAsync(() => {
  if (res.value == null) return null;
  return aranaMinimapUrl(res.value.arenaTag);
})

const playerTank = computed(() => {
  if (res.value == null) return null;
  return { tag: res.value.tankTag, type: res.value.tankType, x: res.value.gunPoint_x, y: res.value.gunPoint_z };
})

const serverMakerPoint = computed(() => {
  if (res.value == null) return null;
  return { x: res.value.serverMarkerPoint_x, y: res.value.serverMarkerPoint_y, z: res.value.serverMarkerPoint_z };
})

function mapNormalizedPosition(x: number, z: number) {
  return { x: (x + 500) / 1000, y: (z + 500) / 1000 };
}

function absoluteStyleMapPosition(x: number, z: number) {
  const { x: nx, y: ny } = mapNormalizedPosition(x, z);
  return {
    left: (nx * 100) + '%',
    top: (ny * 100) + '%',
  }
}

</script>

<style lang="scss" scoped>
.shot-circle {
  width: 250px;
  height: 250px;

  circle.main {
    fill: none;
    stroke: #78d63a;
    stroke-width: 1;
    stroke-dasharray: 10 10;
  }

  circle.hit-point {
    fill: #e7ffde;
    filter: drop-shadow(0 0 3px #639e31);

    &.hit {
      fill: #ffdd9c;
      filter: drop-shadow(0 0 3px #f73c08);
    }
  }

  circle.possible-min {
    fill: none;
    stroke: #a1a1a1;
    stroke-width: 0.5;
    stroke-opacity: 0.8;
    stroke-dasharray: 3 3;
  }

  line {
    stroke: #ffffff;
    stroke-width: 0.5;
    stroke-opacity: 0.8;
  }
}

.minimap {
  width: 250px;
  height: 250px;
  position: relative;

  .tank-icon {
    width: 20px;
    transform: translate(-50%, -50%);
  }

  img {
    position: absolute;
    pointer-events: none;
    user-select: none;

    &.border {
      width: 100%;
      height: 100%;
      z-index: 2;
    }
  }

  .map-container,
  .overlay-container {
    position: absolute;
    margin-left: 12px;
    margin-top: 12px;
    width: 94%;
    height: 94%;
  }

  .map-container {
    .map {
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  }

  .overlay-container {
    z-index: 3;

    >* {
      position: absolute;
    }

    .full {
      width: 100%;
      height: 100%;
    }

    .marker {
      width: 20px;
      height: 20px;
      transform: translate(-50%, -50%);
      stroke: #ffffff;
      stroke-width: 0.5;
      stroke-opacity: 0.8;

      line {
        filter: drop-shadow(0 0 2px #000000);
      }
    }

    .hit-point {
      width: 20px;
      height: 20px;
      transform: translate(-50%, -50%);

      circle {
        fill: #e7ffde;
        filter: drop-shadow(0 0 3px #639e31);

        &.hit {
          fill: #ffdd9c;
          filter: drop-shadow(0 0 3px #f73c08);
        }
      }


    }

    .trajectory {
      stroke: #78d63a;
      filter: drop-shadow(0 0 2px #000000);
      // stroke-width: 1;
      // stroke-dasharray: 5 3;
    }
  }
}
</style>