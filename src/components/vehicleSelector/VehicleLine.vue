<template>
  <div class="line">
    <Nation :nation="nation" class="flag" />
    <div class="type">
      <VehicleType :type="type" class="icon" />
    </div>
    <VehicleLevel :level="level" class="level" />
    <p class="name">

      <!-- <img class="tank"
        :src="`https://static.wotstat.info/mt/latest/vehicles/small/${tag.split(':')[1].toLowerCase()}.png`"> -->
      <VehicleImage :tag="tag" :size="'small'" class="tank" />
      <Highlight :text="highlightStrings" />
    </p>
  </div>
</template>


<script setup lang="ts" vapor>
import Nation from '../vehicles/nation/Nation.vue'
import VehicleType from '../vehicles/type/VehicleType.vue'
import VehicleLevel from '../vehicles/VehicleLevel.vue'
import VehicleImage from '../vehicles/VehicleImage.vue'
import Highlight from '../highlightString/index.vue'
import { HighlightedString } from '../highlightString/highlightUtils'

const props = defineProps<{
  level: number;
  nation: string;
  type: "MT" | "LT" | "HT" | "AT" | "SPG";
  tag: string;
  highlightStrings: HighlightedString;
}>()
</script>


<style lang="scss" scoped>
.line {
  .flag {
    width: 30px;
    min-width: 30px;
    margin-right: 7px;
  }

  .type {
    width: 40px;
    min-width: 40px;
  }

  .level {
    width: 30px;
    min-width: 30px;
  }
}

.line {
  display: flex;
  white-space: nowrap;
  height: 34px;
  align-items: center;
  border-top: 1px solid #d0d0d008;
  position: relative;
  cursor: pointer;
  margin: 0 3px;
  padding-left: 7px;
  padding-right: 3px;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0px 0 0px;
    border-radius: 6px;
    z-index: -1;
  }

  &:hover {
    &::before {
      background-color: rgba(255, 255, 255, 0.1)
    }
  }


  &.selected {
    &::before {
      background-color: var(--blue-color);
      background: linear-gradient(90deg, #0182fada, #0182fa44 20%, #0182fa2c 50%, transparent);
    }
  }


  .type {
    display: flex;
    justify-content: center;

    color: white;
    fill: currentColor;

    .icon {
      width: 14px;
    }
  }

  .flag {
    user-select: none;
    pointer-events: none;
  }

  .level {
    text-align: center;
  }

  .name {
    display: flex;
    align-items: center;
    justify-content: left;
    overflow: hidden;
    flex: 1;

    .tank {
      width: 120px;
      min-width: 120px;
      user-select: none;
      pointer-events: none;
    }

    p {
      width: 100%;
      margin-left: -60px;
      text-overflow: ellipsis;
      overflow: hidden;
      font-weight: bold;
      font-size: 0.8em;
    }
  }
}

.name {
  :deep(.highlight) {
    color: var(--blue-thin-color);
  }
}
</style>