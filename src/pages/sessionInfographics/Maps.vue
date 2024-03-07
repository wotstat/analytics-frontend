<template>
  <h2>Карты</h2>
  <div class="flex ver damage" ref="container">
    <div class="card">
      <MapsTable :params="params" />
    </div>
    <!-- <div class="card">
      <p>Наиболее дисбалансные по респам</p>
    </div>
    <div class="card">
      <p>Время боя по карте</p>
    </div> -->
  </div>
</template>



<script setup lang="ts">
import { ref } from "vue";
import { useElementVisibility } from "@vueuse/core";
import MapsTable from "@/components/widgets/MapsTable.vue";
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();


</script>