<template>
  <span v-if="stat.player">Для игрока <span class="text-effect light-blue">{{ stat.player }}</span>. </span>

  <template v-if="stat.tanks">
    <span v-if="stat.tanks.length == 1">На танке <span class="text-effect light-blue">{{ tankName(stat.tanks[0])
        }}</span>. </span>
    <span v-else>На танках <span class="text-effect light-blue">{{ stat.tanks.map(tankName).join(', ') }}</span>.
    </span>
  </template>
  <template v-else>

    <template v-if="stat.level && stat.types">
      <span v-if="stat.level">На танках <span class="text-effect light-blue">{{ levelToString() }} </span>
        уровня, </span>

      <span v-if="stat.types && stat.types.length"><span class="text-effect light-blue">{{
    currentTankTypes()
  }}</span>. </span>
    </template>
    <template v-else>
      <span v-if="stat.level">На танках <span class="text-effect light-blue">{{ levelToString() }} </span> уровня.
      </span>
      <span v-if="stat.types">На классах <span class="text-effect light-blue">{{ currentTankTypes() }} </span>.
      </span>
    </template>

  </template>

  <span v-if="stat.period == 'allTime'"></span>
  <span v-else-if="stat.period.type == 'fromTo'">С <span class="text-effect light-blue">{{
    stat.period.from.toLocaleDateString() }}</span> по <span class="text-effect light-blue">{{
    stat.period.to.toLocaleDateString() }}</span>.
  </span>
  <span v-else-if="stat.period.type == 'fromToNow'">С <span class="text-effect light-blue">{{
    stat.period.from.toLocaleDateString() }}</span> по настоящий момент.
  </span>
  <span v-if="stat.period != 'allTime' && stat.period.type == 'lastX' && stat.period.count == 1">За <span
      class="text-effect light-blue">последний</span>
    бой. </span>
  <span v-else-if="stat.period != 'allTime' && stat.period.type == 'lastX'">За последние <span
      class="text-effect light-blue">{{
    stat.period.count }}</span> {{ countLocalize(stat.period.count, 'бой', 'боя', 'боёв') }}.
  </span>

  <span v-if="stat.battleMode != 'any'">
    <span class="text-effect light-blue">{{ customBattleModes[stat.battleMode].title }}</span>.
  </span>
</template>

<script lang="ts" setup>
import { useQueryStatParams } from '@/composition/useQueryStatParams';
import { queryAsync } from '@/db';
import { countLocalize } from "@/utils/i18n";
import { customBattleModes } from '@/utils/wot';
import { computed } from 'vue';


const stat = useQueryStatParams()

const tankNames = queryAsync<{ tag: string, shortNameRU: string, nameRU: string }>(`select tag, shortNameRU, nameRU from TankList;`);
const tankNamesMap = computed(() => {
  const map = new Map<string, { short: string, full: string }>();
  for (const tank of tankNames.value.data) {
    map.set(tank.tag, { short: tank.shortNameRU, full: tank.nameRU });
  }
  return map;
});

function tankName(tag: string) {
  return tankNamesMap.value.get(tag)?.full ?? tag.split('_').slice(1).join('_')
}

function levelToString(): string {
  // Sort the array to ensure it's in ascending order
  if (!stat.value.level) return ''

  const arr = stat.value.level.sort((a, b) => a - b);

  let result: string[] = [];
  let start = arr[0];
  let end = start;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === end + 1) {
      end = arr[i];
    } else {
      if (start === end) {
        result.push(`${start}`);
      } else {
        result.push(`${start}-${end}`);
      }
      start = arr[i];
      end = start;
    }
  }

  // Handle the last group or single number
  if (start === end) {
    result.push(`${start}`);
  } else {
    result.push(`${start}-${end}`);
  }

  return result.join(', ');
}

const tankTypes = {
  LT: 'ЛТ',
  MT: 'СТ',
  HT: 'ТТ',
  AT: 'ПТ',
  SPG: 'САУ'
} as const;

const tanksKeys = Object.keys(tankTypes) as (keyof typeof tankTypes)[];

function currentTankTypes() {
  if (!stat.value.types) return ''

  if (stat.value.types.length == 1) return tankTypes[stat.value.types[0]]
  if (stat.value.types.length == 2) return stat.value.types.map(t => tankTypes[t]).join(' и ')

  if (stat.value.types.length == 3) return 'без ' + tanksKeys
    .filter(t => !stat.value.types?.includes(t))
    .map(t => tankTypes[t])
    .join(' и ')

  return 'без ' + tanksKeys
    .filter(t => !stat.value.types?.includes(t))
    .map(t => tankTypes[t])[0]

}

</script>