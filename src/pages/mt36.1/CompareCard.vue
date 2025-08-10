<template>
  <div class="card compare nowrap mono-num">
    <div class="data">
      <p class="left n-mono">
        <SimpleTweenValue :options="{ minStep }" :value="left" :processor="processor" />
      </p>
      <div class="sep"></div>
      <p class="right n-mono">
        <SimpleTweenValue :options="{ minStep }" :value="right" :processor="processor" />
      </p>
    </div>
    <p class="card-main-info description bottom">{{ title }}</p>
  </div>
</template>


<script setup lang="ts">
import SimpleTweenValue from '@/components/tween/SimpleTweenValue.vue'

const props = defineProps<{
  left: number,
  right: number,
  minStep: number,
  title: string,
  processor?: (value: number) => string
}>()
</script>


<style lang="scss" scoped>
.card.compare {
  .data {
    display: flex;
    justify-content: center;
    font-weight: var(--bold-weight);


    p {
      margin: 0;
      font-size: 2.5em;
    }

    .left {
      color: var(--color-left, #6eb2ff);
    }

    .right {
      color: var(--color-right, #50e3c2);
    }

    .sep {
      width: 1px;
      margin: 0 1em;
      background: rgba(255, 255, 255, 0.2);
    }
  }
}
</style>