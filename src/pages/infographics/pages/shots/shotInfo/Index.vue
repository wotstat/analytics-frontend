<template>
  <div class="container">
    <div class="flex ver-less-medium">
      <div class="flex ver shot-minimap-parent">
        <svg class="shot-circle">
          <circle v-if="possibleMin && possibleMin < 0.99" class="possible-min" cx="50%" cy="50%"
            :r="(possibleMin * 49.5) + '%'" />
          <circle class="main" cx="50%" cy="50%" r="49.5%" />
          <line x1="45%" y1="50%" x2="55%" y2="50%" />
          <line x1="50%" y1="45%" x2="50%" y2="55%" />
          <circle v-if="hitPointClient" class="hit-point" :class="hitPointClient.hit ? 'hit' : ''"
            :cx="hitPointClient.x * 99 + '%'" :cy="hitPointClient.y * 99 + '%'" r="1%" />
          <!-- <circle v-if="hitPointServer" class="hit-point client" :class="hitPointServer.hit ? 'hit' : ''"
            :cx="hitPointServer.x * 99 + '%'" :cy="hitPointServer.y * 99 + '%'" r="1%" /> -->
        </svg>
        <div class="minimap">
          <div class="map-container">
            <img class="map" v-if="arenaMinimapUrl" :src="arenaMinimapUrl">
          </div>
          <img class="border" src="./minimap_b4.png" alt="">

          <div class="overlay-container" v-if="arenaMeta">

            <MinimapOverlays v-if="arenaTag && selectedShoot" :arenaTag="arenaTag"
              :gameplay="selectedShoot.battleGameplay" :allyTeam="selectedShoot.team" />

            <svg v-if="playerTank && mapHitPoint" class="full">
              <line class="trajectory" :x1="absoluteStyleMapPosition(playerTank.x, playerTank.y).left"
                :y1="absoluteStyleMapPosition(playerTank.x, playerTank.y).top"
                :x2="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z).left"
                :y2="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z).top" />
            </svg>

            <img v-if="playerTank" class="tank-icon" :style="absoluteStyleMapPosition(playerTank.x, playerTank.y)"
              :src="getTankImg(playerTank.type, true, false)">

            <svg v-if="serverMakerPoint" class="marker"
              :style="absoluteStyleMapPosition(serverMakerPoint.x, serverMakerPoint.z)">
              <line x1="0%" y1="50%" x2="100%" y2="50%" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" />
            </svg>

            <!-- <svg v-if="clientMakerPoint" class="marker client"
              :style="absoluteStyleMapPosition(clientMakerPoint.x, clientMakerPoint.z)">
              <line x1="0%" y1="50%" x2="100%" y2="50%" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" />
            </svg> -->

            <svg v-if="mapHitPoint" class="hit-point" :style="absoluteStyleMapPosition(mapHitPoint.x, mapHitPoint.z)">
              <circle :class="mapHitPoint.hit ? 'hit' : ''" cx="50%" cy="50%" r="10%" />
            </svg>
          </div>
        </div>
      </div>
      <div class="flex-1">
        <div class="mini-header flex hor">
          <div class="perv" @click="prev">
            <svg viewBox="0 0 64 64">
              <path
                d="M42.723 6.073a5 5 0 0 1 .852 7.02L28.752 32.009l14.823 18.916a5 5 0 0 1-7.872 6.168l-17.239-22a5 5 0 0 1 0-6.168l17.24-22a5 5 0 0 1 7.019-.852Z" />
            </svg>
          </div>
          <div class="progress flex-1" @wheel="onScroll" ref="barProgress">
            <p v-if="allShots">Выстрел {{ shotIndex + 1 }} из {{ allShots?.length }} в бою</p>
            <p v-else>Загрузка</p>
            <div v-if="allShots" class="bar" :class="isBarDragging || scrolling ? 'transition-disable' : ''"
              :style="{ width: (isBarDragging ? dragProgress : (shotIndex / (allShots.length - 1))) * 100 + '%' }">
            </div>
          </div>
          <div class="next" @click="next">
            <svg viewBox="0 0 64 64">
              <path
                d="M19.316 57.944a5 5 0 0 1-.852-7.02L33.287 32.01 18.464 13.093a5 5 0 1 1 7.872-6.168l17.239 22a5 5 0 0 1 0 6.168l-17.24 22a5 5 0 0 1-7.019.851Z" />
            </svg>
          </div>
        </div>
        <div v-if="selectedShoot" class="flex ver gap-0 ">
          <p>Время от начала боя: {{ sec2minsec(selectedShoot.battleTime / 1000) }}</p>

          <hr>

          <div class="flex table-parent">
            <InfoTable :data="firstTable(selectedShoot)" class="flex-1" />
            <div class="flex ver flex-1 gap-0">
              <InfoTable :data="secondTable(selectedShoot)" />
              <InfoTable :data="[
                ['ФПС', selectedShoot.fps],
                ['Пинг', (selectedShoot.ping).toFixed() + 'мс'],
                ['Попал в', { 'tank': 'танк', 'terrain': 'землю', 'none': 'небо', 'other': '-' }[selectedShoot.hitReason] ?? '-'],
              ]" />
            </div>
          </div>

          <hr>

          <div class="flex table-parent">
            <InfoTable class="flex-1" :data="thirdTable(selectedShoot)" />
            <InfoTable class="flex-1" :data="[
              ['Скорость танка', selectedShoot.vehicleSpeed.toFixed()],
              ['Скрость поворота танка', selectedShoot.vehicleRotationSpeed.toFixed() + ' °/c'],
              ['Скорость повоорта башни', selectedShoot.turretSpeed.toFixed() + ' °/c'],
              ['Ваше ХП', selectedShoot.health],
            ]" />
          </div>

          <template v-if="shotResult.length > 0">
            <hr>

            <table class="flex-table" v-if="shouldBeVerticalResult">
              <tbody>
                <tr class="table-title">
                  <td>Танк</td>
                  <td>Урон выстрелом</td>
                  <td>ХП осталось</td>
                  <template v-if="shotResult.some(t => t.fireDamage)">
                    <td>Урон пожаром</td>
                    <td>ХП после пожара</td>
                  </template>
                  <td v-if="shotResult.some(t => t.ammoBayDestroyed)">Взрыв БК</td>
                </tr>

                <tr v-for="result in shotResult">
                  <td>{{ result.tankTag }}</td>
                  <td>{{ result.shotDamage || '-' }}</td>
                  <td>{{ result.shotHealth ?? '-' }}</td>
                  <template v-if="shotResult.some(t => t.fireDamage)">
                    <td>{{ result.fireDamage || '-' }}</td>
                    <td>{{ result.fireHealth ?? '-' }}</td>
                  </template>
                  <td v-if="shotResult.some(t => t.ammoBayDestroyed)">{{ result.ammoBayDestroyed ? 'Да' : '-'
                    }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex ver gap-0" v-else>
              <hr>
              <template v-for="result in shotResult">
                <InfoTable class="flex-1" :data="([
                  ['Танк', result.tankTag],
                  ['Урон выстрелом', result.shotDamage],
                  result.shotHealth ? ['ХП осталось', result.shotHealth] : undefined,
                  result.fireDamage ? ['Урон пожаром', result.fireDamage] : undefined,
                  result.fireHealth ? ['ХП после пожара', result.fireHealth] : undefined,
                  result.ammoBayDestroyed ? ['Взрыв БК', 'Да'] : undefined,
                ].filter(t => t) as string[][])" />
                <hr>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
    <hr>
    <div>
      <p :class="getWotinspectorParams() ? '' : 'inactive'">
        <a v-if="getWotinspectorParams()" @click="wotinspectorClick()" class="pointer">Посмотреть</a>
        <span v-else>Посмотреть</span>
        прямое попадание на сервисе WotInspector.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { dbIndexToDate, query } from '@/db'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { aranaMinimapUrl, convertCoordinate, loadArenaMeta } from '@/shared/game/arenas/arenas'
import { computedAsync, useDraggable, useMediaQuery } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import InfoTable from './InfoTable.vue'
import { getArenaName } from '@/shared/i18n/i18n'
import MinimapOverlays from '@/shared/game/arenas/minimapOverlay/Index.vue'
import { sec2minsec } from '@/shared/utils/time'
import { wotinspectorLog, wotinspectorURLNew } from '@/shared/theirdParty/wotInspector/wotInspector'
import { shellNames } from '@/shared/game/wot'

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
  // onBattleStartId: UInt128
  // localtime: DateTime64
  // dateTime: DateTime64
  // shotId: UInt32
  health: UInt32
  arenaTag: string
  playerName: string
  // playerClan: string
  // accountDBID: UInt64
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
  // shellName: string
  shellDamage: Decimal
  // damageRandomization: Decimal
  shellPiercingPower: UInt32
  shellCaliber: Float32
  shellSpeed: Decimal
  // shellMaxDistance: UInt16
  gunDispersion: Float32
  battleDispersion: Float32
  serverShotDispersion: Float32
  clientShotDispersion: Float32
  ballisticResultServer_r: Float32
  ballisticResultServer_theta: Float32
  ballisticResultClient_r: Float32
  ballisticResultClient_theta: Float32
  gravity: Float32
  // serverAim: Bool
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
}>()

const shotIndex = ref(0)
const allShots = shallowRef<Shot[] | null>(null)
const selectedShoot = computed(() => allShots.value?.[shotIndex.value] ?? null)
const arenaTag = computed(() => selectedShoot.value?.arenaTag.split('spaces/')[1] ?? null)

watch(selectedShoot, shot => {
  console.log(JSON.stringify({
    clientShotDispersion: shot?.clientShotDispersion,
    serverShotDispersion: shot?.serverShotDispersion,
    gravity: shot?.gravity,
    gunDispersion: shot?.gunDispersion,
    shellSpeed: shot?.shellSpeed,
    gunPoint: { x: shot?.gunPoint_x, y: shot?.gunPoint_y, z: shot?.gunPoint_z },
    serverMarkerPoint: { x: shot?.serverMarkerPoint_x, y: shot?.serverMarkerPoint_y, z: shot?.serverMarkerPoint_z },
    clientMarkerPoint: { x: shot?.clientMarkerPoint_x, y: shot?.clientMarkerPoint_y, z: shot?.clientMarkerPoint_z },
    tracerStart: { x: shot?.tracerStart_x, y: shot?.tracerStart_y, z: shot?.tracerStart_z },
    tracerVel: { x: shot?.tracerVel_x, y: shot?.tracerVel_y, z: shot?.tracerVel_z },
  }))
})

const firstTable = (s: Shot) => [
  ['Игрок', s.playerName],
  ['Танк', s.tankTag],
  ['Карта', getArenaName(arenaTag.value ?? '').value],
  ['Пушка', s.gunTag],
  ['Калибр', s.shellCaliber],
  ['Разброс орудия', (s.battleDispersion * 100).toFixed(2)],
  ['Версия мода', s.modVersion],
  ['Версия игры', s.gameVersion],
  // ['Сервер', s.serverName],
]

const secondTable = (s: Shot) => [
  ['Тип снаряда', (shellNames as any)[s.shellTag][1]],
  ['Урон', s.shellDamage],
  ['Пробитие', s.shellPiercingPower],
  ['Скорость снаряда', s.shellSpeed],
  ['Гравитация', s.gravity.toFixed(2)],
]

const thirdTable = (s: Shot) => [
  ['Разброс:', (s.gunDispersion * 100).toFixed(2)],
  ['Сведение (серверное)', (s.serverShotDispersion * 100).toFixed(2)],
  ['Сведение (клиентское)', (s.clientShotDispersion * 100).toFixed(2)],
  ['Автоприцел', s.autoAim ? 'Да' : 'Нет']
]

const router = useRouter()
const route = useRoute()

const barProgress = ref<HTMLElement | null>(null)
const dragProgress = ref(0)

function updateProgress(t: PointerEvent, shoudReplace = true) {
  if (!barProgress.value) return

  const bbox = barProgress.value.getBoundingClientRect()
  dragProgress.value = Math.max(0, Math.min(1, (t.clientX - bbox.left) / bbox.width))

  updateDisplayIndex(shoudReplace)
}

function updateDisplayIndex(shoudReplace: boolean) {
  const max = Math.max(0, (allShots.value?.length ?? 0) - 1)
  const index = Math.round(dragProgress.value * max)
  if (index < 0 || index >= (allShots.value?.length ?? 0)) return
  if (index === shotIndex.value) return

  if (shoudReplace) router.replace({ query: { ...route.query, shot: allShots.value?.[index].id } })
  else router.push({ query: { ...route.query, shot: allShots.value?.[index].id } })

}

const { isDragging: isBarDragging } = useDraggable(barProgress, {
  axis: 'x',
  onStart: (e, t) => updateProgress(t),
  onMove: (e, t) => updateProgress(t),
  onEnd: (e, t) => updateProgress(t, false),
  preventDefault: true,
  stopPropagation: true,
})

onMounted(async () => {
  console.log('OnMounted')

  const shotTime = dbIndexToDate(props.shotID)
  const currentID = await query<{ onBattleStartId: string }>(`
  SELECT onBattleStartId FROM Event_OnShot
  WHERE id = '${props.shotID}'
  and dateTime > toDateTime(${shotTime}) and dateTime < toDateTime(${shotTime + 1})`)

  const onBattleStartId = currentID.data[0].onBattleStartId

  const shots = await query<Shot>(`
  SELECT * FROM Event_OnShot
  WHERE onBattleStartId = '${onBattleStartId}'
  and dateTime > toDateTime(${dbIndexToDate(onBattleStartId)})
  and dateTime < toDateTime(${dbIndexToDate(onBattleStartId)}) + interval 1 hour
  order by battleTime`)
  allShots.value = shots.data
  console.log('AllShots', allShots.value)

  shotIndex.value = shots.data.findIndex(s => s.id === props.shotID)
})

const arenaMeta = computedAsync(async () => arenaTag.value ? await loadArenaMeta(arenaTag.value) : null)

function getWotinspectorParams() {
  if (selectedShoot.value == null) return null

  const r = selectedShoot.value
  if (r.hitPoint_x == null || r.hitPoint_y == null || r.hitPoint_z == null) return null
  if (r.hitVehicleDescr == null || r.hitChassisDescr == null || r.hitTurretDescr == null ||
    r.hitGunDescr == null || r.hitTurretPitch == null || r.hitTurretYaw == null || r.hitSegment == null) return null

  const gunPoint = { x: r.gunPoint_x, y: r.gunPoint_y, z: r.gunPoint_z, }
  const hitPoint = { x: r.hitPoint_x, y: r.hitPoint_y, z: r.hitPoint_z, }

  const distance = Math.sqrt(
    Math.pow(gunPoint.x - hitPoint.x, 2) +
    Math.pow(gunPoint.y - hitPoint.y, 2) +
    Math.pow(gunPoint.z - hitPoint.z, 2)
  )

  return {
    tank: {
      vehicle: r.vehicleDescr,
      chassis: r.chassisDescr,
      turret: r.turretDescr,
      gun: r.gunDescr,
      shell: r.shellDescr,
    }, target: {
      vehicle: r.hitVehicleDescr,
      chassis: r.hitChassisDescr,
      turret: r.hitTurretDescr,
      gun: r.hitGunDescr,
      turretYaw: -r.hitTurretPitch,
      turretPitch: r.hitTurretYaw,
      segment: r.hitSegment,
    }, distance, isWOT: r.region != 'RU'
  }
}

async function wotinspectorClick() {
  const params = getWotinspectorParams()
  if (!params) return
  wotinspectorLog(params.tank, params.target, params.distance, params.isWOT)

  const url = wotinspectorURLNew(params.tank, params.target, params.distance, params.isWOT)
  const data = await fetch(url)
  const json = await data.json()

  if ('url' in json) {
    window.open(json.url, '_blank')
  } else {
    console.error('Error', json)
    alert('Ошибка при получении данных от WotInspector')
  }
}

function getHitPointServer(isServer: boolean) {
  if (selectedShoot.value == null) return null

  const r = isServer ? selectedShoot.value.ballisticResultServer_r : selectedShoot.value.ballisticResultClient_r
  const theta = isServer ? selectedShoot.value.ballisticResultServer_theta : selectedShoot.value.ballisticResultClient_theta

  const x = (r * Math.cos(theta) + 1) / 2
  const y = (1 - r * Math.sin(theta)) / 2

  return { x, y, hit: selectedShoot.value['results.order'].length > 0 }
}

const hitPointServer = computed(() => getHitPointServer(true))
const hitPointClient = computed(() => getHitPointServer(false))

const mapHitPoint = computed(() => {
  if (selectedShoot.value == null) return null
  return {
    x: selectedShoot.value.hitPoint_x ?? selectedShoot.value.tracerEnd_x,
    z: selectedShoot.value.hitPoint_z ?? selectedShoot.value.tracerEnd_z,
    hit: selectedShoot.value['results.order'].length > 0
  }
})

const possibleMin = computed(() => {
  if (selectedShoot.value == null) return null

  return selectedShoot.value.gunDispersion / selectedShoot.value.serverShotDispersion
})

const arenaMinimapUrl = computedAsync(() => {
  if (selectedShoot.value == null) return null
  return aranaMinimapUrl(selectedShoot.value.arenaTag)
})

const playerTank = computed(() => {
  if (selectedShoot.value == null) return null
  return { tag: selectedShoot.value.tankTag, type: selectedShoot.value.tankType, x: selectedShoot.value.gunPoint_x, y: selectedShoot.value.gunPoint_z }
})

const shotResult = computed(() => {
  if (!selectedShoot.value) return []

  const shot = selectedShoot.value
  return shot['results.order'].map((t, i) => {
    return {
      tankTag: shot['results.tankTag'][i],
      shotDamage: shot['results.shotDamage'][i],
      fireDamage: shot['results.fireDamage'][i],
      shotHealth: shot['results.shotHealth'][i],
      fireHealth: shot['results.fireHealth'][i],
      ammoBayDestroyed: shot['results.ammoBayDestroyed'][i],
      flags: shot['results.flags'][i],
    }
  })
})

const images = import.meta.glob<{ default: string }>('./tank-markers/*.png', { eager: true })
function getTankImg(tankType: string, ally: boolean, dead: boolean) {
  const tag = {
    'HT': 'heavyTank',
    'MT': 'mediumTank',
    'LT': 'lightTank',
    'SPG': 'SPG',
    'AT': 'AT-SPG',
  }[tankType] ?? 'heavyTank'

  return images[`./tank-markers/${tag}_${ally ? 'ally' : 'enemy'}_${dead ? 'dead_' : ''}${ally ? 'green' : 'red'}.png`].default
}

const serverMakerPoint = computed(() => {
  if (selectedShoot.value == null) return null
  return { x: selectedShoot.value.serverMarkerPoint_x, y: selectedShoot.value.serverMarkerPoint_y, z: selectedShoot.value.serverMarkerPoint_z }
})

const clientMakerPoint = computed(() => {
  if (selectedShoot.value == null) return null
  return { x: selectedShoot.value.clientMarkerPoint_x, y: selectedShoot.value.clientMarkerPoint_y, z: selectedShoot.value.clientMarkerPoint_z }
})

function absoluteStyleMapPosition(x: number, y: number) {
  if (!arenaMeta.value) return { left: '0%', top: '0%' }

  const { x: nx, y: ny } = convertCoordinate({ x, y }, arenaMeta.value.boundingBox)
  return {
    left: (nx * 100) + '%',
    top: (ny * 100) + '%',
  }
}

function changeShot(delta: number) {
  if (shotIndex.value == null || allShots.value == null) return

  const nextIndex = shotIndex.value + delta
  if (nextIndex >= allShots.value.length || nextIndex < 0) return

  const nextShot = allShots.value[nextIndex]
  router.push({ query: { ...route.query, shot: nextShot.id } })
}

watch(() => props.shotID, () => {
  if (allShots.value == null) return
  const index = allShots.value.findIndex(s => s.id === props.shotID)
  shotIndex.value = index
})

function next() {
  changeShot(1)
}

function prev() {
  changeShot(-1)
}

const scrolling = ref(false)
const currentX = ref(0)
let timerHandler: ReturnType<typeof setTimeout> | null = null
function onScroll(e: WheelEvent) {
  currentX.value += e.deltaY

  scrolling.value = true

  if (timerHandler != null) clearTimeout(timerHandler)
  timerHandler = setTimeout(() => { scrolling.value = false; currentX.value = 0 }, 200)

  if (Math.abs(currentX.value) > 50) {
    currentX.value < 0 ? next() : prev()
    currentX.value = 0
  }
}

const shouldBeVerticalResult = useMediaQuery('(min-width: 768px)')

</script>

<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

.ver-less-medium {
  flex-direction: row;

  @include less-medium {
    flex-direction: column;
    gap: 0;
  }
}

.shot-minimap-parent {

  flex-direction: column;
  justify-content: space-evenly;

  @include less-medium {
    flex-direction: row;
  }

  @include less-x-small {
    align-items: center;
    flex-direction: column;
  }
}

.table-parent {
  gap: 40px;
  flex-direction: row;

  @include less-small {
    flex-direction: column;
    gap: 0px;
  }

}


.container {
  overflow-y: auto;
  margin-top: 20px;
  margin-right: -20px;
  padding-right: 20px;

  @include medium {
    width: 950px;
  }

  @include large {
    width: 1120px;
  }

  @include x-large {
    width: 1300px;
  }

  >.flex {
    gap: 30px;
  }
}

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

    &.client {
      stroke: #ffb300;
      stroke-opacity: 1;
      stroke-width: 5;
    }

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

      &.client {
        stroke: #ffb300;
        stroke-opacity: 1;
        stroke-width: 0.7;
      }

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

hr {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #535353;
}

.mini-header {
  margin-bottom: 10px;
  gap: 0;
  user-select: none;

  .progress {
    font-weight: 600;
    text-align: center;
    padding: 5px 0;
    position: relative;

    border: 1px solid #535353;
    border-radius: 10px;
    cursor: ew-resize;
    overflow: hidden;
    touch-action: none;

    .bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: #8080806c;
      border-end-end-radius: 9px;
      border-start-end-radius: 9px;
      transition: width 0.2s;
      pointer-events: none;

      &.transition-disable {
        transition: none;
      }
    }

    p {
      position: relative;
      pointer-events: none;
      z-index: 2;
    }
  }

  .perv,
  .next {
    // height: 36px;
    width: 32px;
    box-sizing: border-box;
    fill: var(--font-color);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    svg {
      width: 32px;
    }
  }
}

.table-title {
  color: #bababa;
  font-weight: 300;
}

p.inactive {
  color: #989898;
}

.flex-table {
  tr {
    display: flex;

    &:hover:not(.table-title) {
      background-color: #8787870d;
    }

    td,
    th {
      flex: 1;
    }
  }
}
</style>