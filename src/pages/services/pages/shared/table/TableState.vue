<template>
  <div class="table-state">
    <Loader v-if="status === loading" class="loader" />
    <span>{{ message }}</span>
    <span v-if="status === loading && progress && progress.total > 0" class="progress">
      {{ Math.min(progress.completed + 1, progress.total) }} из {{ progress.total }}
    </span>
    <button v-if="retry && isErrorStatus(status)" type="button" @click="retry">Попробовать ещё раз</button>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { isErrorStatus, loading, type Status } from '@/db'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'

defineProps<{
  status: Status
  message: string
  progress?: { completed: number, total: number }
  retry?: () => void
}>()
</script>

<style scoped lang="scss">
.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 220px;
  text-align: center;

  .loader {
    margin-bottom: 20px;
    font-size: 4px;
  }

  .progress {
    color: rgba(255, 255, 255, 0.55);
    font-variant-numeric: tabular-nums;
  }

  button {
    color: var(--blue-thin-color);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: var(--blue-thin-color-hover);
      }
    }
  }
}
</style>
