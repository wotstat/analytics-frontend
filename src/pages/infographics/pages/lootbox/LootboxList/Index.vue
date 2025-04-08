<template>
  <div>
    <ServerStatusWrapper :status="containersTag.status" v-slot="{ status }">
      <HorizontalScrollItems v-if="status != 'loading'" :items="containersVariants"
        v-model:selected="selectedContainers" selectable>
        <template #default="{ item }">
          <div class="container-info">
            <div class="isOpenedToday" v-if="isOpenedToday(item.end)"></div>
            <p class="title">{{ item.name.replaceAll('\\n', '') }}</p>
            <FallbackImg :src="containersImages[`./containers/${item.tag}.png`]?.default ?? NoImageLB" class="img" />
            <table cellspacing="0" cellpadding="0">
              <tbody>
                <tr>
                  <th>Открыто</th>
                  <td>{{ logProcessor(item.count) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="flex date-line gap-0">
              <p>{{ toDate(item.start) }}</p>
              <span class="secondary flex-1">–</span>
              <p>{{ toDate(item.end) }}</p>
            </div>
          </div>
        </template>
      </HorizontalScrollItems>

      <HorizontalScrollItems v-else :items="new Array(8).fill(0).map(i => ({ key: `${i}` }))">
        <div class="container-info loading">
          <p class="title skeleton"></p>
          <div class="img skeleton"></div>
          <table cellspacing="0" cellpadding="0">
            <tbody>
              <tr class="skeleton">
                <th class="ignore-skeleton">Открыто</th>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="flex date-line gap-0">
            <p class="skeleton"></p>
            <span class="secondary flex-1">–</span>
            <p class="skeleton"></p>
          </div>
        </div>
      </HorizontalScrollItems>
    </ServerStatusWrapper>
  </div>
</template>

<script lang="ts" setup>
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryComputed } from '@/db';
import { computed, ref, watch } from 'vue';
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { getBestLocalization } from '@/utils/i18n';
import { objectEntries, pausableWatch } from '@vueuse/core';
import FallbackImg from '@/components/fallbackImg/FallbackImg.vue';
import HorizontalScrollItems from '@/components/shared/HorizontalScrollItems.vue';
import ServerStatusWrapper from '@/components/ServerStatusWrapper.vue';
import { useQueryParamStorage } from '@/composition/useQueryParamStorage';

import NoImageLB from "./noImageLB.png";

const customOrderKeys = new Map<string, number>(objectEntries({
  'mtl_1_24': 1000,
  'rp_2024_tanks_6': -902,
  'rp_2024_tanks_7': -903,
  'rp_2024_tanks_8': -904,
  'rp_2024_large': -905,
  'rp_2024_medium': -910,
  'rp_2024_small': -915,

  'tanks_birthday_2023_VI': -1000,
  'tanks_birthday_2023_premium': -1000,
  'tanks_birthday_2023_X': -1000,
}));

const containersImages = import.meta.glob<{ default: string }>('./containers/*.png', { eager: true });

const props = defineProps<{
  withoutTest: boolean
}>()

const staticUrl = import.meta.env.VITE_STATIC_URL;
const stats = useQueryStatParams()
const selectedContainers = ref<string[]>([]);
const selectedContainersQuery = useQueryParamStorage<string | null>('selectedLootbox', null, true)

const selectedToStats = pausableWatch(() => selectedContainers.value, (containers) => {
  statsToSelected.pause();
  selectedContainersQuery.value = containers.length != 0 ? containers.join(',') : null;
  statsToSelected.resume();
});

const statsToSelected = pausableWatch(() => selectedContainersQuery.value, (containers) => {
  selectedToStats.pause();
  selectedContainers.value = containers?.split(',') || [];
  selectedToStats.resume();
}, { immediate: true });

const model = defineModel<string[]>()
watch(selectedContainers, (value) => model.value = value, { immediate: true })

const fixedSpaceProcessor = useFixedSpaceProcessor(0)
function logProcessor(value: number) {
  if (value < 1e6) return fixedSpaceProcessor(value);
  if (value < 1e9) return (value / 1e6).toFixed(1) + 'M';
}

function toDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', { month: '2-digit', year: '2-digit', day: '2-digit' });
}

function isOpenedToday(date: string) {
  return (new Date().getTime() - new Date(date).getTime()) < 2 * 24 * 60 * 60 * 1000;
}

const containersTag = queryComputed<{
  locale: [name: string, region: string][],
  tag: string,
  count: number,
  start: string,
  end: string
}>(() => `
with containers as (
    select containerTag as tag,
      toUInt32(count()) as count,
      toStartOfDay(min(dateTime)) as start,
      toStartOfDay(max(dateTime)) as end
      from Event_OnLootboxOpen
    ${whereClause(stats.value, {
  ignore: ['tanks', 'level', 'types', 'battleMode'],
  additional: props.withoutTest ? `region not in ('CT')` : ''
})}
    group by containerTag
    order by start desc, end desc
    ),
    locales as (
        select tag,
               arrayZip(groupArray(name), groupArray(region)) as locale
        from (
            select tag, region, argMax(name, gameVersion) as name
            from Lootboxes
            group by tag, region
            order by region
        )
        group by tag
    )
select * from containers
left join locales using tag
`)

const containersVariants = computed(() => containersTag.value.data
  .map((x) => ({
    tag: x.tag,
    key: x.tag,
    name: getBestLocalization(x.locale) ?? x.tag,
    count: x.count,
    start: x.start,
    end: x.end
  }))
  .sort((a, b) => {
    const aKey = customOrderKeys.get(a.tag) ?? null;
    const bKey = customOrderKeys.get(b.tag) ?? null;
    if (aKey != null && bKey != null) return bKey - aKey;
    if (aKey != null) return aKey > 0 ? -1 : 1;
    if (bKey != null) return bKey > 0 ? 1 : -1;

    if (a.start > b.start) return -1;
    if (a.start < b.start) return 1;

    if (a.end > b.end) return -1;
    if (a.end < b.end) return 1;

    return a.name.localeCompare(b.name);
  })
)

</script>

<style lang="scss" scoped>
@use '/src/styles/textColors.scss' as *;
@use '/src/styles/table.scss' as *;
@use '/src/styles/variables.scss' as *;

.skeleton {
  td {
    min-width: 40px;
  }
}

.container-info {
  position: relative;

  .isOpenedToday {
    position: absolute;
    top: 2px;
    right: -8px;
    width: 10px;
    height: 10px;
    background-color: #34C759;
    border-radius: 50%;
  }

  table {
    width: 100%;

    th {
      text-align: left;
      font-weight: 300;
      margin-left: 5px;
      color: #bababa;
    }

    td {
      text-align: right;
    }
  }

  .secondary {
    color: #bababa;
    text-align: center;
    font-weight: 300;
  }

  .date-line {
    justify-content: center;
    align-items: center;

    .skeleton {
      width: 50px;
      height: 19.2px;
      border-radius: 5px;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }
  }

  .title {
    font-weight: bold;
    text-align: center;
    height: 2.4em;
    line-height: 1.1;
    overflow: visible;
    margin-top: -10px;
    margin-bottom: 5px;
    width: 150px;
    position: relative;
    z-index: 1;

    filter: drop-shadow(0px 0px 5px #353535) drop-shadow(0px 0px 5px #353535) drop-shadow(0px 0px 5px #353535);

    &.skeleton {
      width: 100%;
      height: 25px;
      margin-top: 0;
      border-radius: 5px;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }
  }


  img,
  .img,
  .img.skeleton {
    width: 150px;
    aspect-ratio: 600/450;
    margin: -15px 0;
    pointer-events: none;
    user-select: none;

    text-align: center;
    line-height: 100%;
    font-size: 3em;
    color: #bababa97;
    font-size: 10px;

    &.flex {
      justify-content: center;
      align-items: center;
    }

    span {
      filter: drop-shadow(0px 4px 6px black);
    }

    &:not(.skeleton) {
      filter: drop-shadow(0px 5px 15px rgba(0, 0, 0, 0.5));
    }


    &.skeleton {
      border-radius: 5px;
      margin: 0px 0 10px 0;
      aspect-ratio: unset;
      height: 81.9px;
      border: none;
      outline: none;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }
  }
}
</style>