<template>

  <div class="vehicle-selector">
    <div class="badges" v-if="vehicles.length">
      <Badge :text="vehicle" closable v-for="vehicle in vehicles" @close="onRemove(vehicle)" />
    </div>
    <button class="select" @click="openSelect">выбрать</button>
  </div>
</template>

<script setup lang="ts">

import Badge from '@/components/Badge.vue'

const vehicles = defineModel<string[]>({ default: [] })

function openSelect() {
  vehicles.value = [...vehicles.value, 'T-34']
}

function onRemove(tag: string) {
  vehicles.value = vehicles.value.filter(vehicle => vehicle !== tag)
}

</script>

<style scoped lang="scss">
.vehicle-selector {
  display: flex;
  align-items: baseline;
  gap: 0.2em;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em;
}

.select {
  padding: 2px 8px;
  line-height: 1;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  transition: background-color 0.2s;
  font-size: 0.9em;
  border-radius: 1em;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style>