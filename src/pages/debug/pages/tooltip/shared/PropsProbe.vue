<template>
  <div class="props-probe">
    <div class="title">{{ title }}</div>
    <div class="row">
      <span>props.placement</span>
      <span class="value">{{ placement ?? '—' }}</span>
    </div>
    <div class="hint">без valueAdapter значение целиком уходит в props содержимого, поповер его не видит</div>
  </div>
</template>


<script setup lang="ts">
defineProps<{
  title: string
  placement?: string
}>()

</script>


<style scoped lang="scss">
.props-probe {
  padding: 6px 9px;
  font-size: 13px;
  max-width: 260px;

  .title {
    font-weight: var(--bold-weight);
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 1em;

    .value {
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 11px;
      color: var(--blue-thin-color);
    }
  }

  .hint {
    margin-top: 3px;
    font-size: 11px;
    line-height: 1.3;
    color: #ffffff80;
  }
}
</style>
