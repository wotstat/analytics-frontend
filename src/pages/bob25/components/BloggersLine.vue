<template>
  <div class="line">
    <h3 v-if="title">{{ title }}</h3>
    <div class="card multi-value mono-num">
      <div class="flex">
        <BloggersValues :values="values" space colorize />
      </div>
      <div class="flex subline" v-if="withPercent">
        <BloggersValues :values="percents" colorize :processor="t => `${t.toFixed(2)}%`" />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed } from "vue";
import BloggersValues from "./BloggersValues.vue";

const props = defineProps<{
  values: number[]
  withPercent?: boolean
  title?: string
}>()

const percents = computed(() => props.values.map(v => 100 * v / props.values.reduce((a, v) => a + v, 0)));
</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.multi-value {
  font-size: 1.5rem;
  color: white;
  font-size: 28px;
  text-align: center;
  font-weight: bold;
  line-height: 1;

  .subline {
    margin-top: 8px;
    font-size: 15px;
    opacity: 0.8;
  }

  @media screen and (max-width: 900px) {
    font-size: 25px;
  }

  @media screen and (max-width: 800px) {
    font-size: 18px;

    .subline {
      font-size: 13px;
    }
  }

  @media screen and (max-width: 500px) {
    font-size: 12px;

    .subline {
      font-size: 11px;
    }
  }

  :deep(p) {
    flex: 1;
  }
}
</style>