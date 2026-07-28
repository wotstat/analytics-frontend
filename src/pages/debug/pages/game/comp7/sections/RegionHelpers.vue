<template>
  <DebugSection title="Хелперы: регионы и сезоны" id="region-helpers"
    description="getRegionIsoHourOffset и getRegionDayChangeHourOffset используются в графиках для группировки по игровым суткам (см. RankDistributionChart/Settings); getSeasonDuration/getSeasonQualificationCount — в расчёте интервала сезона."
    source="src/shared/game/comp7/utils.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th>регион</th>
          <th>getRegionIsoHourOffset</th>
          <th>getRegionDayChangeHourOffset, мс</th>
          <th>то же, часы</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="region in regionsWithUnknown" :key="region">
          <th>{{ region }}</th>
          <td>{{ getRegionIsoHourOffset(region) }}</td>
          <td>{{ getRegionDayChangeHourOffset(region) }}</td>
          <td>{{ getRegionDayChangeHourOffset(region) / 3_600_000 }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-hint">
      Строка <span class="debug-value">XX</span> — незнакомый регион: обе функции откатываются на значения по
      умолчанию (-3 и 0 соответственно).
    </p>

    <div class="debug-row">
      <SeasonSelect v-model="season" label="сезон" />
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>регион</th>
          <th>getSeasonDuration, дней</th>
          <th>getSeasonQualificationCount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="region in regions" :key="region">
          <th>{{ region }}</th>
          <td>{{ getSeasonDuration(season, region) / DAY_MS }}</td>
          <td>{{ getSeasonQualificationCount(season, region) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      getSeasonQualificationCount фактически не смотрит на season, несмотря на параметр в сигнатуре — результат
      зависит только от региона (7 для RU, 10 для EU, 0 для остальных). Поменяй season выше и убедись, что колонка не
      меняется.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import {
  getRegionIsoHourOffset, getRegionDayChangeHourOffset,
  getSeasonDuration, getSeasonQualificationCount
} from '@/shared/game/comp7/utils'
import SeasonSelect from '../shared/SeasonSelect.vue'

const DAY_MS = 24 * 3_600_000

const regions = ['RU', 'EU', 'ASIA', 'NA', 'CN']
const regionsWithUnknown = [...regions, 'XX']
const season = ref('comp7_5_4')
</script>
