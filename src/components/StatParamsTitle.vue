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
    бой.</span>
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
import { countLocalize } from "@/utils/i18n";
import { customBattleModes } from '@/utils/wot';


const stat = useQueryStatParams()

function tankName(tag: string) {
  return tag.split('_').slice(1).join('_')
}

function levelToString(): string {
  // Sort the array to ensure it's in ascending order
  if (!stat.level) return ''

  const arr = stat.level.sort((a, b) => a - b);

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
  if (!stat.types) return ''

  if (stat.types.length == 1) return tankTypes[stat.types[0]]
  if (stat.types.length == 2) return stat.types.map(t => tankTypes[t]).join(' и ')

  if (stat.types.length == 3) return 'без ' + tanksKeys
    .filter(t => !stat.types?.includes(t))
    .map(t => tankTypes[t])
    .join(' и ')

  return 'без ' + tanksKeys
    .filter(t => !stat.types?.includes(t))
    .map(t => tankTypes[t])[0]

}

</script>