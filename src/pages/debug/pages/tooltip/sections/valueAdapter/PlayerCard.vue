<template>
  <div class="player-card">
    <div class="nick">{{ nick }}</div>
    <div class="battles">боёв: <span class="mono">{{ battles }}</span></div>
  </div>
</template>


<script setup lang="ts">
defineProps<{
  nick: string
  battles: number
}>()

</script>


<style scoped lang="scss">
.player-card {
  padding: 6px 9px;
  font-size: 13px;
  line-height: 1.35;

  .nick {
    font-weight: var(--bold-weight);
  }

  .battles {
    color: #ffffffb0;

    .mono {
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      font-variant-numeric: tabular-nums;
      color: var(--font-color);
    }
  }
}
</style>
