<template>
  <div class="center-container">
    <SettingsTitle :reload="true">
      Распределение урона
    </SettingsTitle>
    <h3>
      <StatParamsTitle />
    </h3>
    <Content />
    <hr>
  </div>
</template>


<script lang="ts" setup>
import SettingsTitle from '@/pages/infographics/settings/SettingsTitle.vue'
import StatParamsTitle from '@/pages/infographics/settings/StatParamsTitle.vue'

import Content from './Content.vue'

</script>