<template>
  <div class="debug-page">
    <header class="head">
      <h1>{{ title }}</h1>
      <p class="description" v-if="description">{{ description }}</p>
      <p class="debug-path" v-if="source">{{ source }}</p>
    </header>

    <div class="sections">
      <slot></slot>
    </div>
  </div>
</template>


<script setup lang="ts">

defineProps<{
  title: string
  description?: string
  source?: string
}>()

</script>


<style scoped lang="scss">
.debug-page {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.4em;

  h1 {
    font-size: 1.8em;
    line-height: 1.2;
    margin: 0;
  }

  .description {
    font-size: 14px;
    color: #ffffffb5;
    max-width: 80ch;
    line-height: 1.5;
  }
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 2em;
}
</style>
