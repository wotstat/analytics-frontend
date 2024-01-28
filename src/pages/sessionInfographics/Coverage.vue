<template>
  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfo :value="coverageData.data" mini-data="игроков" description="Вы повстречали" color="green" />
    </div>

    <div class="card">
      <PlayerCoverageTable />
    </div>
  </div>
</template>



<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { queryAsync, queryAsyncFirst } from "@/db";
import { computed, ref } from "vue";
import { useElementVisibility } from "@vueuse/core";
import MiniBar from "@/components/widgets/MiniBar.vue";
import GenericInfoQuery from "@/components/widgets/GenericInfoQuery.vue";
import PlayerCoverageTable from "@/components/widgets/PlayerCoverageTable.vue";
import { toRelative, toPercent } from "@/utils";

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const coverageData = queryAsyncFirst(`
select count(distinct name) as data
from Event_OnBattleResult
    array join playersResults.name as name
where name != playerName;
`, { data: 0 }, visible)


</script>