<template>
  <div class="center-container">
    <h4><i>Сервис в очень ранней разработке. Прототип</i></h4>
    <SettingsTitle :reload="true">
      Карты позиций
    </SettingsTitle>
    <h3>
      <StatParamsTitle />
    </h3>

    <div class="flex settings-line">
      <p>Карта</p>
      <select v-model="selectedMap">
        <option v-for="item in arenas.data" :value="item.tag">
          {{ getArenaName(item.tag) }} – {{ item.count }}
        </option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Команда</p>
      <select v-model="selectedTeam">
        <option :value="1">1</option>
        <option :value="2">2</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Тип боя</p>
      <select v-model="selectedGameplay">
        <option v-if="availableGameplayTypes" :value="item" v-for="item in availableGameplayTypes">
          {{ item in gameplayTypes ? (gameplayTypes as any)[item] : item }}</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Время боя в секундах</p>
      От:
      <input type="number" v-model="selectedFrom">
      До:
      <input type="number" v-model="selectedTo">
    </div>

    <div class="flex settings-line">
      <p>Метрика эффективности</p>
      <select v-model="selectedEfficiencyVariant">
        <option value="hits">Попадания</option>
        <option value="dmg">Пробития</option>
        <option value="custom">Своя</option>
      </select>
    </div>

    <div class="flex settings-line hor-ver-small gap-0" v-if="selectedEfficiencyVariant == 'custom'">
      <p>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="settings-icon"
          @click="efficiencyPopup = true">
          <path
            d="M 10.490234 2 C 10.011234 2 9.6017656 2.3385938 9.5097656 2.8085938 L 9.1757812 4.5234375 C 8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531 L 5.2851562 5.2480469 C 4.8321563 5.0920469 4.33375 5.2793594 4.09375 5.6933594 L 2.5859375 8.3066406 C 2.3469375 8.7216406 2.4339219 9.2485 2.7949219 9.5625 L 4.1132812 10.708984 C 4.0447181 11.130337 4 11.559284 4 12 C 4 12.440716 4.0447181 12.869663 4.1132812 13.291016 L 2.7949219 14.4375 C 2.4339219 14.7515 2.3469375 15.278359 2.5859375 15.693359 L 4.09375 18.306641 C 4.33275 18.721641 4.8321562 18.908906 5.2851562 18.753906 L 6.9296875 18.1875 C 7.5958842 18.734206 8.3553934 19.166339 9.1757812 19.476562 L 9.5097656 21.191406 C 9.6017656 21.661406 10.011234 22 10.490234 22 L 13.509766 22 C 13.988766 22 14.398234 21.661406 14.490234 21.191406 L 14.824219 19.476562 C 15.644978 19.166199 16.403896 18.732596 17.070312 18.185547 L 18.714844 18.751953 C 19.167844 18.907953 19.66625 18.721641 19.90625 18.306641 L 21.414062 15.691406 C 21.653063 15.276406 21.566078 14.7515 21.205078 14.4375 L 19.886719 13.291016 C 19.955282 12.869663 20 12.440716 20 12 C 20 11.559284 19.955282 11.130337 19.886719 10.708984 L 21.205078 9.5625 C 21.566078 9.2485 21.653063 8.7216406 21.414062 8.3066406 L 19.90625 5.6933594 C 19.66725 5.2783594 19.167844 5.0910937 18.714844 5.2460938 L 17.070312 5.8125 C 16.404116 5.2657937 15.644607 4.8336609 14.824219 4.5234375 L 14.490234 2.8085938 C 14.398234 2.3385937 13.988766 2 13.509766 2 L 10.490234 2 z M 12 8 C 14.209 8 16 9.791 16 12 C 16 14.209 14.209 16 12 16 C 9.791 16 8 14.209 8 12 C 8 9.791 9.791 8 12 8 z" />
        </svg>
        <code @click="efficiencyPopup = true"
          class="clickable">{{ selectedEfficiency.expression }}; [{{ selectedEfficiency.from }}; {{ selectedEfficiency.to }}]</code>
      </p>
    </div>

    <hr>

    <div class="flex settings-line">
      <p>Отображение</p>
      <select v-model="selectedDisplay">
        <option value="shots">Все выстрелы</option>
        <option value="group">Кластеризация</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Отмечать</p>
      <select v-model="selectedPointVariant">
        <option value="target">Куда стреляли</option>
        <option value="gun">Откуда стреляли</option>
        <option value="all">Куда и откуда</option>
      </select>
    </div>

    <template v-if="selectedDisplay == 'shots'">

      <div class="flex settings-line">
        <p>Завершение выстрела</p>
        <select v-model="selectedTracerEnd">
          <option value="clientMarkerPoint">Клиентский прицел</option>
          <option value="serverMarkerPoint">Серверный прицел</option>
          <option value="tracerEnd">Исчезновение трассера</option>
          <option value="hitPoint">Точка попадания</option>
        </select>
      </div>

      <hr>

      <div class="flex settings-line">
        <p>Показывать трассеры</p>
        <input type="checkbox" v-model="showTracers">
      </div>

      <div class="flex settings-line">
        <p>Подсвечивать при наведение</p>
        <input type="checkbox" v-model="highlightTracers">
      </div>

    </template>


    <div class="flex settings-line">
      <p>cellsCount</p>
      <input type="number" v-model="cellsCount">
    </div>

    <div class="flex settings-line">
      <p>blurRadius</p>
      <input type="number" v-model="blurRadius">
    </div>

    <div class="flex settings-line">
      <p>clusterCount</p>
      <input type="number" v-model="clusterPercentile">
    </div>

    <div class="minimap">
      <div class="map-container">
        <img class="map" v-if="arenaMinimapUrl" :src="arenaMinimapUrl">
      </div>

      <div class="overlay-container" ref="containerRef" @click="onClickShot">
        <MinimapOverlays v-if="arenaTag" :arenaTag="arenaTag" :gameplay="selectedGameplay" :allyTeam="selectedTeam" />
        <CanvasVue ref="tracerCanvasRef" :style="{
          visibility: showTracers ? 'visible' : 'hidden',
        }" />
        <!-- <Clustering v-bind="clusteringParams" /> -->
        <CanvasVue :redrawGenerator="redrawGeneratorPrepared" ref="canvasRef" class="tracers-canvas" />
        <CanvasVue class="hover-canvas" @redraw="hoverRender" ref="hoverCanvasRef" />
        <!-- <Heatmap v-bind="heatmapParams" /> -->
      </div>
    </div>
    <p>Выстрелов: {{ totalDraw }}</p>
  </div>

  <PopupWindow v-if="selectedShot" @close="closeShotInfo" :title="'Информация о выстреле'">
    <ShotInfo :shotID="selectedShot" />
  </PopupWindow>

  <EfficiencyPopup v-if="efficiencyPopup" @close="efficiencyPopup = false" @select="t => selectedEfficiency = t"
    :value="selectedEfficiency" />
</template>

<script setup lang="ts">

import SettingsTitle from '@/pages/infographics/settings/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import MinimapOverlays from '@/components/minimapOverlay/Index.vue';
import PopupWindow from '@/components/PopupWindow.vue';
import ShotInfo from "@/pages/infographics/pages/shots/shotInfo/Index.vue";
import CanvasVue from "@/components/Canvas.vue";
import EfficiencyPopup from "./Efficiency.vue";
import Heatmap from "./Heatmap.vue";
import Clustering from "./Clustering.vue";

import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { query, queryComputed } from '@/db';
import { aranaMinimapUrl, convertCoordinate, loadArenaMeta } from '@/utils/arenas';
import { getArenaName } from '@/utils/i18n';
import { computedAsync, useDebounce, useLocalStorage, useMouseInElement } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { BloomColor } from '@/components/bloomColors';
import { Quadtree, Circle } from '@timohausmann/quadtree-ts';
import { useRoute, useRouter } from 'vue-router';

import Color from 'colorjs.io';
import { useQueryParamStorage } from '@/composition/useQueryParamStorage';
import { gameplayTypes } from '@/utils/wot';

const LOAD_COUNT = 2000;
const HOVER_RADIUS = 0.05;
const CLICK_RADIUS = 0.005;

const MAIN_COLOR_RANGE = new Color(BloomColor.green.main).range(new Color(BloomColor.gold.main), {
  space: 'lch',
  outputSpace: 'srgb',
});

const BLOOM_COLOR_RANGE = new Color(BloomColor.green.bloom).range(new Color(BloomColor.gold.bloom), {
  space: 'lch',
  outputSpace: 'srgb',
});


const params = useQueryStatParams();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const hoverCanvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCanvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCtx = computed(() => tracerCanvasRef.value?.context());

const selectedMap = useQueryParamStorage<string>('map', '');
const selectedTeam = useQueryParamStorage<1 | 2>('team', 1);
const selectedGameplay = useQueryParamStorage<string>('gameplay', 'ctf');
const selectedDisplay = ref<'shots' | 'group'>('shots');
const selectedPointVariant = ref<'gun' | 'target' | 'all'>('all');
const selectedTracerEnd = ref<'clientMarkerPoint' | 'serverMarkerPoint' | 'tracerEnd' | 'hitPoint'>('tracerEnd');
const selectedFrom = ref(0);
const showTracers = useLocalStorage('mapShowTracers', true);
const highlightTracers = useLocalStorage('mapHighlightTracers', false);
const selectedTo = ref(180);

const selectedEfficiencyVariant = ref<'hits' | 'dmg' | 'custom'>('hits');
const selectedEfficiency = ref({
  expression: 'length(results.order) > 0',
  from: 0,
  to: 1,
});

const heatmapParams = computed(() => {
  return {
    colorRange: BLOOM_COLOR_RANGE,
    efficiency: selectedEfficiency.value,
    map: {
      meta: arenaMeta.value,
      arena: selectedMap.value ?? '',
      team: selectedTeam.value,
      gameplay: selectedGameplay.value,
    },
    period: {
      from: selectedFrom.value,
      to: selectedTo.value,
    },
  }
})

const cellsCount = ref(200)
const blurRadius = ref(2)
const clusterPercentile = ref(0.8)
const clusteringParams = computed(() => {
  return {
    ...heatmapParams.value,
    cellsCount: cellsCount.value,
    blurRadius: blurRadius.value,
    clusterPercentile: clusterPercentile.value
  }
})

const efficiencyPopup = ref(false)

const arenaTag = computed(() => selectedMap.value?.split('/')[1]);
const arenaMeta = computedAsync(async () => arenaTag.value ? await loadArenaMeta(arenaTag.value) : null);

const totalDraw = ref(0);
const nearestShotId = ref<string | null>(null)

const { elementX, elementY, isOutside } = useMouseInElement(containerRef)
watch(() => [elementX.value, elementY.value, isOutside.value], () => hoverCanvasRef.value?.redraw())

const bloomCache = new Map<number, string>();
function bloomColor(efficiency: number) {
  if (bloomCache.has(efficiency)) return bloomCache.get(efficiency)!;
  const color = BLOOM_COLOR_RANGE((efficiency - selectedEfficiency.value.from) / (selectedEfficiency.value.to - selectedEfficiency.value.from)).toString();
  bloomCache.set(efficiency, color);
  return color;
}

const mainCache = new Map<number, string>();
function mainColor(efficiency: number) {
  if (mainCache.has(efficiency)) return mainCache.get(efficiency)!;
  const color = MAIN_COLOR_RANGE((efficiency - selectedEfficiency.value.from) / (selectedEfficiency.value.to - selectedEfficiency.value.from)).toString();
  mainCache.set(efficiency, color);
  return color;
}

const quadTree = new Quadtree({
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  maxLevels: 5,
});


const arenas = queryComputed<{ tag: string, count: number }>(() => `
select arenaTag as tag, count() as count from Event_OnShot
${whereClause(params)}
group by arenaTag
order by count desc
`);

const dbGameplayTypes = queryComputed<{ gameplay: string }>(() => `
select distinct battleGameplay as gameplay from Event_OnShot
where arenaTag = '${selectedMap.value}'
${whereClause(params, { withWhere: false })}
`);

const availableGameplayTypes = computed(() => {
  if (!dbGameplayTypes.value) return []
  return dbGameplayTypes.value.data.map(t => t.gameplay);
})

// watch(arenas, (value) => {
//   if (value.data.length > 0 && !selectedMap.value) {
//     selectedMap.value = value.data[0].tag;
//   }
// });

// watch(availableGameplayTypes, types => {
//   if (!types) return
//   if (selectedGameplay.value in types) return
//   selectedGameplay.value = types[0]
// })

const arenaMinimapUrl = computedAsync(() => {
  if (selectedMap.value == null) return null;
  return aranaMinimapUrl(selectedMap.value);
})

function hoverRender(ctx: CanvasRenderingContext2D, width: number, height: number) {
  nearestShotId.value = null;
  if (isOutside.value) return;

  const x = elementX.value / width;
  const y = elementY.value / height;

  const shots = quadTree.retrieve(new Circle({
    x, y, r: HOVER_RADIUS * 2,
  })) as Circle<Point>[];

  if (shots.length == 0) return;

  const r = width / 500;
  const tracerWidth = width / 1000;


  let nearest = shots[0]
  let distance = (nearest.x - x) ** 2 + (nearest.y - y) ** 2
  for (const shot of shots) {
    if (!shot.data) continue;

    const d = (shot.x - x) ** 2 + (shot.y - y) ** 2
    if (d < distance) {
      distance = d;
      nearest = shot;
    }

    if (distance > HOVER_RADIUS ** 2) continue;
    const alpha = Math.max(0, Math.min(1, 1 - d / HOVER_RADIUS ** 2))
    if (alpha == 0) continue;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = mainColor(shot.data.efficiency);
    ctx.beginPath();
    ctx.arc(shot.x * width, shot.y * width, r, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = bloomColor(shot.data.efficiency);
    ctx.beginPath();
    ctx.moveTo(shot.data.tankPos.x * width, shot.data.tankPos.y * height);
    ctx.lineTo(shot.data.hitPos.x * width, shot.data.hitPos.y * height);
    ctx.lineWidth = tracerWidth;
    ctx.stroke();

  }

  if (distance < CLICK_RADIUS ** 2) {
    ctx.globalAlpha = 1;
    ctx.shadowBlur = width / 200;

    if (nearest.data && highlightTracers.value) {
      ctx.beginPath();
      ctx.strokeStyle = BloomColor.blue.main;
      ctx.shadowColor = BloomColor.blue.bloom;
      ctx.moveTo(nearest.data.tankPos.x * width, nearest.data.tankPos.y * height);
      ctx.lineTo(nearest.data.hitPos.x * width, nearest.data.hitPos.y * height);
      ctx.lineWidth = tracerWidth * 2;
      ctx.stroke();
    }

    ctx.fillStyle = BloomColor.blue.main;
    ctx.shadowColor = BloomColor.blue.bloom;
    ctx.beginPath();
    ctx.arc(nearest.x * width, nearest.y * width, r * 2, 0, 2 * Math.PI);
    ctx.fill();

    nearestShotId.value = nearest.data?.id ?? null;
  }

}


let shotsData: { id: string, x: number, z: number, hitX: number, hitZ: number, efficiency: number }[] = []
type Coord = NonNullable<ReturnType<typeof relativeCoordinate>>
type Point = typeof shotsData[number] & { tankPos: Coord, hitPos: Coord }
let loading = false;
let loadingFinished = false;

async function loadNextBatch() {
  if (loading) return;
  if (loadingFinished) return;
  if (!selectedMap.value) return;

  loading = true;

  console.log(`load ${LOAD_COUNT} shots offset ${shotsData.length}`);

  const result = await query<{ id: string, x: number, z: number, hitX: number, hitZ: number, efficiency: number }>(`
      select
            id as id,
            gunPoint_x                      as x,
            gunPoint_z                      as z,
            ${selectedTracerEnd.value}_x    as hitX,
            ${selectedTracerEnd.value}_z    as hitZ,
            length(results.order) > 0       as hit,
            toFloat64(${selectedEfficiency.value.expression}) as efficiency
      from Event_OnShot
      where arenaTag = '${selectedMap.value}'
      and team = ${selectedTeam.value}
      and battleGameplay = '${selectedGameplay.value}'
      and battleTime >= ${selectedFrom.value * 1000}
      and battleTime <= ${selectedTo.value * 1000}
      and efficiency >= ${selectedEfficiency.value.from}
      and efficiency <= ${selectedEfficiency.value.to}
      ${selectedTracerEnd.value == 'hitPoint' ? 'and hitPoint_x is not NULL' : ''}
      ${whereClause(params, { withWhere: false })}
      and playerName in (
        select playerName
        from
        (
            select playerName, avg(personal.damageDealt) as dmg, quantile(0.95)(dmg) over () as qDmg
            from Event_OnBattleResult
            ${whereClause(params, { ignore: ['player', 'types', 'level'] })}
            group by playerName
            having count() > 10
        )
        where dmg > qDmg


        union all


        select playerName
        from
        (
            select playerName, avg(personal.damageDealt) as dmg, quantile(0.95)(dmg) over () as qDmg
            from Event_OnBattleResult
            ${whereClause(params, { ignore: ['player', 'types', 'level', 'tanks'] })}
            group by playerName
            having count() > 50
        )
        where dmg > qDmg
      )
      limit ${LOAD_COUNT}
      offset ${shotsData.length};`)

  shotsData.push(...result.data.map(row => ({
    id: row.id,
    x: row.x,
    z: row.z,
    hitX: row.hitX,
    hitZ: row.hitZ,
    efficiency: row.efficiency,
  })));

  loadingFinished = result.data.length < LOAD_COUNT;
  loading = false;
}

function relativeCoordinate(x: number, y: number) {
  if (!arenaMeta.value) return null
  const p = convertCoordinate({ x, y }, arenaMeta.value.boundingBox)
  return { x: p.x, y: p.y }
}

function* redrawGenerator(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const DRAW_COUNT = 500;
  const r = width / 500;
  const tracerWidth = width / 5000;
  tracerCtx.value?.clearRect(0, 0, width, height);
  quadTree.clear();

  yield 100

  function drawShot(shot: typeof shotsData[number]) {
    const tankPos = relativeCoordinate(shot.x, shot.z)
    const hitPos = relativeCoordinate(shot.hitX, shot.hitZ)

    if (!tankPos || !hitPos) return;
    if (!tracerCtx.value) return
    const variant = selectedPointVariant.value

    quadTree.insert(new Circle<Point>({
      x: variant == 'target' ? hitPos.x : tankPos.x,
      y: variant == 'target' ? hitPos.y : tankPos.y,
      r: 0.001,
      data: {
        ...shot,
        tankPos,
        hitPos,
      }
    }))

    ctx.shadowBlur = width / 200;
    const bloomColorValue = bloomColor(shot.efficiency)
    const mainColorValue = mainColor(shot.efficiency)
    // HIT 
    {
      if (variant == 'all' || variant == 'target') {
        ctx.fillStyle = mainColorValue
        ctx.shadowColor = bloomColorValue
        ctx.strokeStyle = bloomColorValue

        ctx.beginPath();
        ctx.arc(hitPos.x * width, hitPos.y * width, r / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
    }

    // TANK
    {
      if (variant != 'target') {
        if (variant == 'gun') {
          ctx.fillStyle = mainColorValue
          ctx.shadowColor = bloomColorValue
          ctx.strokeStyle = bloomColorValue
        } else {
          ctx.fillStyle = BloomColor.blue.main
          ctx.shadowColor = BloomColor.blue.bloom
        }


        ctx.beginPath();
        ctx.arc(tankPos.x * width, tankPos.y * width, r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
    }

    // TRACER
    {
      const ctx = tracerCtx.value;

      ctx.shadowColor = bloomColorValue
      ctx.strokeStyle = bloomColorValue
      ctx.shadowBlur = 5;

      ctx.beginPath();
      ctx.moveTo(tankPos.x * width, tankPos.y * width);
      ctx.lineTo(hitPos.x * width, hitPos.y * width);
      ctx.lineWidth = tracerWidth;
      ctx.stroke();
    }

    drawCount += 1
  }


  let drawCount = 0
  while (drawCount < 500) {
    if (drawCount == shotsData.length) {
      if (loadingFinished) return console.log('FINISHED')
      loadNextBatch()
      yield 10
      continue
    }

    for (let i = 0; i < DRAW_COUNT && drawCount < shotsData.length; i++) {
      const shot = shotsData[drawCount]
      drawShot(shot)
    }

    console.log(`Draw ${drawCount} / ${shotsData.length} shots`);

    totalDraw.value = drawCount;
    yield 10
  }
}


let shotsDataPrepared: { tankType: string, x: number, z: number, hitX: number, hitZ: number, efficiency: number, count: number }[] = []
async function loadPreparedHeatmap() {
  /*
    const response = await fetch('https://db.wotstat.info/?database=WOT', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: `
      with 2 as STEP
    select toFixedString(tankType, 4) as type,
          toInt16(round(gunPoint_x / STEP) * STEP) as x,
          toInt16(round(gunPoint_z / STEP) * STEP) as z,
          toInt16(round(tracerEnd_x / STEP) * STEP) as hitX,
          toInt16(round(tracerEnd_z / STEP) * STEP) as hitZ,
          toFloat32(count() / sum(count()) over ()) as efficiency,
          toUInt32(count()) as count
      from Event_OnShot
      where region = 'RU'
          and battleMode = 'REGULAR'
          and battleGameplay = '${selectedGameplay.value}'
          and arenaTag = '${selectedMap.value}'
          and tankLevel > 5
          and length(results.order) > 0
          and tankType != 'SPG'
      group by x, z, hitX, hitZ, tankType
      having count() > 3
      order by efficiency desc
      format RowBinary;
      `
    })
  
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const dataView = new DataView(buffer);
  
    const size = buffer.byteLength / 20
  
    for (let i = 0; i < size; i++) {
      const offset = i * 20
  
      const fixedString = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3)
      ).replaceAll('\x00', '');
  
      const x = dataView.getInt16(offset + 4, true)
      const z = dataView.getInt16(offset + 6, true)
      const hitX = dataView.getInt16(offset + 8, true)
      const hitZ = dataView.getInt16(offset + 10, true)
      const efficiency = dataView.getFloat32(offset + 12, true)
      const count = dataView.getUint32(offset + 16, true)
  
      shotsDataPrepared.push({ tankType: fixedString, x, z, hitX, hitZ, efficiency, count });
    }
  */



  const result = await query<{ tankType: string, x: number, z: number, hitX: number, hitZ: number, efficiency: number, count: number }>(`
  with 2 as STEP
  select tankType,
        toInt16(round(gunPoint_x / STEP) * STEP) as x,
        toInt16(round(gunPoint_z / STEP) * STEP) as z,
        toInt16(round(tracerEnd_x / STEP) * STEP) as hitX,
        toInt16(round(tracerEnd_z / STEP) * STEP) as hitZ,
        toFloat32(count() / sum(count()) over ()) as efficiency,
        toUInt32(count()) as count
  from Event_OnShot
  where region = 'RU'
      and battleMode = 'REGULAR'
      and battleGameplay = '${selectedGameplay.value}'
      and arenaTag = '${selectedMap.value}'
      and tankLevel > 5
      and length(results.order) > 0
      and tankType != 'SPG'
  group by x, z, hitX, hitZ, tankType
  having count() > 3
  order by efficiency desc
  `)

  // console.log('Loaded2', result.data);

  shotsDataPrepared = result.data;

}

const colorByType = {
  'AT': [70, 82, 255],
  'MT': [252, 200, 100],
  'HT': [255, 70, 70],
  'LT': [84, 255, 83],
  'SPG': [255, 83, 200]
}

function* redrawGeneratorPrepared(ctx: CanvasRenderingContext2D, width: number, height: number) {
  yield 100
  console.log('redraw');
  if (shotsDataPrepared.length == 0)
    loadPreparedHeatmap()

  let drawCount = 0
  while (drawCount < 500) {
    if (shotsDataPrepared.length == 0) {
      yield 10
      continue
    }

    const targetToDraw = shotsDataPrepared.length - drawCount;

    if (targetToDraw == 0) {
      console.log("DONE")
      break
    }

    console.log(shotsDataPrepared);

    while (shotsDataPrepared.length - drawCount != 0) {

      for (drawCount; drawCount < shotsDataPrepared.length; drawCount++) {
        const shot = shotsDataPrepared[drawCount];

        for (let i = 0; i < 1; i++) {
          const tankPos = relativeCoordinate(shot.x + Math.random() * 2 - 1, shot.z + Math.random() * 2 - 1)
          const hitPos = relativeCoordinate(shot.hitX + Math.random() * 2 - 1, shot.hitZ + Math.random() * 2 - 1)

          if (!tankPos || !hitPos) continue;

          ctx.lineWidth = 1;
          const colorType = colorByType[shot.tankType as keyof typeof colorByType]
          ctx.strokeStyle = `rgba(${colorType[0]}, ${colorType[1]}, ${colorType[2]}, ${shot.efficiency * 1000})`

          ctx.beginPath();
          ctx.moveTo(tankPos.x * width, tankPos.y * width);
          ctx.lineTo(hitPos.x * width, hitPos.y * width);
          ctx.stroke();
        }

        if (drawCount % 100000 == 0) {
          console.log(`Drawed ${drawCount}`);

          yield 1
        }
      }


      yield 10
    }

    console.log('draw');
    break



    yield 100
  }
}

const debouncedFrom = useDebounce(selectedFrom, 500);
const debouncedTo = useDebounce(selectedTo, 500);

watch(() => [
  selectedTeam.value,
  selectedGameplay.value,
  debouncedFrom.value,
  debouncedTo.value,
  selectedPointVariant.value,
  selectedTracerEnd.value,
  selectedEfficiency.value,
  availableGameplayTypes.value], () => {
    shotsData = []
    shotsDataPrepared = []
    loading = false;
    loadingFinished = false;
    canvasRef.value?.redraw()
  }, { immediate: true })



const route = useRoute();
const router = useRouter();
const selectedShot = computed(() => route.query.shot as string | undefined);

function onClickShot() {
  if (nearestShotId.value) {
    router.push({ query: { ...route.query, shot: nearestShotId.value } });
  }
}

function closeShotInfo() {
  router.push({ query: { ...route.query, shot: undefined } });
}

</script>

<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

.settings-line {
  margin-bottom: 5px;
  align-items: baseline;

  &.hor-ver-small {
    @include small {
      gap: 1rem;
    }
  }
}

.settings-icon {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-bottom: 0.1em;
  fill: #808080;
  cursor: pointer;

  &:hover {
    fill: var(--font-color);
  }
}

.clickable {
  cursor: pointer;
}

code {
  text-wrap: wrap;
}

textarea {
  resize: vertical;
  min-height: 1rem;
}

.minimap {
  margin: 20px auto;
  user-select: none;
  position: relative;
  width: auto;
  max-width: 800px;
  aspect-ratio: 1;

  .map-container,
  .overlay-container {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .map-container {
    img.map {
      width: 100%;
      pointer-events: none;
      filter: brightness(0.3);
    }
  }

  .tracers-canvas {
    filter: drop-shadow(0 0 0px rgb(0, 0, 0)) brightness(2.1) saturate(1.3);

    :deep(canvas) {}
  }

  .overlay-container {
    >* {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    &:hover {
      *:not(.hover-canvas) {
        :deep(canvas) {
          // filter: brightness(0.8) opacity(0.6);
        }
      }
    }

    :deep(canvas) {
      // transition: filter 0.1s;
    }
  }
}
</style>