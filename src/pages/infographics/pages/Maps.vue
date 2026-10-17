<template>
  <h2 class="page-title">Карты</h2>
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
import { useTemplateRef } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import MapsTable from '@/pages/infographics/shared/widgets/MapsTable.vue'
import { useQueryStatParams } from '@/shared/legacyStatQuery/useQueryStatParams'

const container = useTemplateRef<HTMLElement>('container')
const visible = useElementVisibility(container)
const params = useQueryStatParams()


</script>