<template>
  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfo :value="coverageData.data" mini-data="игроков" description="Вы повстречали" color="green" />
    </div>

    <div class="card">
      <PlayerCoverageTable :params="params" />
    </div>
  </div>
</template>



<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { queryAsyncFirst } from "@/db";
import { ref } from "vue";
import { useElementVisibility } from "@vueuse/core";
import PlayerCoverageTable from "@/components/widgets/PlayerCoverageTable.vue";
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();

const coverageData = queryAsyncFirst(`
select count(distinct name) as data
from Event_OnBattleResult
    array join playersResults.name as name
where name != playerName
${whereClause(params, { withWhere: false })};
`, { data: 0 }, visible)


</script>