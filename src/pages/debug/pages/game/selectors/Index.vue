<template>
  <DebugPage title="Селекторы" description="Выбор техники, карт, игры и версии игры; бейджи выбранного и строка поиска."
    source="src/shared/game/selectors/">

    <Overview />
    <VehicleSelectorSection />
    <ArenaSelectorSection />
    <GameSelectorSection />
    <VersionSelectorSection />
    <SearchLineSection />
    <BadgesSection />
    <DataStates />
    <EdgeCases />
    <FiltersRow />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import Overview from './sections/Overview.vue'
import VehicleSelectorSection from './sections/VehicleSelectorSection.vue'
import ArenaSelectorSection from './sections/ArenaSelectorSection.vue'
import GameSelectorSection from './sections/GameSelectorSection.vue'
import VersionSelectorSection from './sections/VersionSelectorSection.vue'
import SearchLineSection from './sections/SearchLineSection.vue'
import BadgesSection from './sections/BadgesSection.vue'
import DataStates from './sections/DataStates.vue'
import EdgeCases from './sections/EdgeCases.vue'
import FiltersRow from './sections/FiltersRow.vue'

</script>
