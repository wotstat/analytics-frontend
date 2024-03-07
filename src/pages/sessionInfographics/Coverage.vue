<template>

  <h2>Охват</h2>

  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfo :value="coverageData.data" mini-data="игроков" description="Вы повстречали" color="green" />
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

<style lang="scss" scoped>
.cent {
  text-align: center;
  margin-top: 20px;
  font-style: italic;
}
</style>