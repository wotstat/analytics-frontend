<template>

  <h2 class="page-title">Охват</h2>

  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfo :status="coverageData.status" :value="coverageData.data.data" :processor="useFixedSpaceProcessor(0)"
        mini-data="игроков" description="Вы повстречали" color="green" />
    </div>

    <div class="card">
      <PlayerCoverageTable :params="params" v-if="params.player" />
      <template v-else>
        <p class="card-main-info description">Игроки с которыми вы попадали чаще всего</p>
        <p class="cent">Этот блок доступен только при выбранном фильтре игрока</p>
      </template>
    </div>
  </div>
</template>



<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { queryAsyncFirst } from "@/db";
import { ref } from "vue";
import { useElementVisibility } from "@vueuse/core";
import PlayerCoverageTable from "@/components/widgets/PlayerCoverageTable.vue";
import { useQueryStatParams, useQueryStatParamsCache, whereClause, whereClauseColumns } from '@/composition/useQueryStatParams';
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { bestMV } from '@/db/schema';
import { useMeta } from '@/composition/useMeta';

useMeta({
  title: 'Охват игроков',
  description: 'Статистика охвата игроков в боях',
  keywords: 'охват игроков, статистика охвата игроков, статистика игроков, статистика игроков в боях'
})

const container = ref<HTMLElement | null>(null);
const enabled = useElementVisibility(container);
const params = useQueryStatParams();
const settings = useQueryStatParamsCache(params)


const mv = bestMV('player_coverage', params)

const query = mv ? `
  select uniqMerge(uniq) as data
  from ${mv}
  ${whereClause(params)}`
  : `
  select uniq(arrayJoin(playersResults.name)) as data
  from Event_OnBattleResult
  ${whereClause(params)}`

const coverageData = queryAsyncFirst(query, { data: 0 }, { enabled, settings: { ...settings.value, query_cache_nondeterministic_function_handling: 'save' } })

console.log(bestMV('player_coverage', params));



</script>

<style lang="scss" scoped>
.cent {
  text-align: center;
  margin-top: 20px;
  font-style: italic;
}
</style>