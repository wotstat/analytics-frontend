<template>
  <DebugPage title="Натиск" description="Иконки рангов и навыков." source="src/shared/game/comp7/">
    <AllRanks />
    <RankBoundaries />
    <AllSkills />
    <RegionHelpers />
    <RankProgressionHelpers />
    <SizesAndBackground />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import AllRanks from './sections/AllRanks.vue'
import RankBoundaries from './sections/RankBoundaries.vue'
import AllSkills from './sections/AllSkills.vue'
import RegionHelpers from './sections/RegionHelpers.vue'
import RankProgressionHelpers from './sections/RankProgressionHelpers.vue'
import SizesAndBackground from './sections/SizesAndBackground.vue'
</script>
