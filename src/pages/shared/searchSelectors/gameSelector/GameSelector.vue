<template>
  <div class="gameSelector">
    <button class="mt" :class="{ active: game === 'mt' }" @click="game = 'mt'">
      <MTName class="logo-name" />
      <MTLogo class="logo" />
    </button>
    <button class="divider" :class="{ active: game === 'any' }" @click="game = 'any'">/</button>
    <button class="wot" :class="{ active: game === 'wot' }" @click="game = 'wot'">
      <WOTLogo class="logo" />
      <WOTName class="logo-name" />
    </button>
  </div>

</template>


<script setup lang="ts">
import MTName from './assets/mt-name.svg'
import MTLogo from './assets/mt-logo.svg'
import WOTName from './assets/wot-name.svg'
import WOTLogo from './assets/wot-logo.svg'

const game = defineModel<'mt' | 'wot' | 'any'>({ default: 'wot' })

</script>


<style lang="scss" scoped>
.gameSelector {
  display: flex;

  button {
    display: flex;
    gap: 0.5em;
    align-items: center;
    padding: 10px;
    border-radius: 0;
    border: none;
    width: 150px;

    .logo {
      height: 20px;
      display: block;
    }

    .logo-name {
      height: 15px;
      display: block;
    }

    &.mt {
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
      justify-content: right;
    }

    &.wot {
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;

      .logo-name {
        height: 17px;
      }
    }

    &.divider {
      width: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
    }

    &.active {
      background: #4a90e2;
    }

  }
}
</style>