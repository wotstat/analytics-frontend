<template>
  <div>
    <VehicleSelector v-model:display-popup="displayPopup" v-model="vehicles" :targetElement :singleSelect="true">
      <div class="badges">
        <Badge :text="getTankName(vehicle, true)" closable v-for="vehicle in [...vehicles]"
          @close="onRemove(vehicle)" />
        <button class="select" @click="openSelect" ref="targetElement">выбрать</button>
      </div>
    </VehicleSelector>
  </div>
</template>


<script setup lang="ts">
import Badge from '@/components/Badge.vue'
import VehicleSelector from './VehicleSelector.vue'
import { ref } from 'vue'
import { getTankName } from '@/utils/i18n'

const vehicles = defineModel<Set<string>>({ default: new Set() })
const displayPopup = ref<boolean>(false)
const targetElement = ref<HTMLElement | null>(null)

function openSelect() {
  displayPopup.value = !displayPopup.value
}

function onRemove(tag: string) {
  vehicles.value.delete(tag)
}

</script>


<style lang="scss" scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em;


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

}
</style>
