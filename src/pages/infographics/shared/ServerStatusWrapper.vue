<template>

  <slot :show-error="showError" :status="slotStatus"></slot>
  <PopupWindow :title="'Ошибка запроса'" v-if="showErrorPopup" @close="showErrorPopup = false">
    <p>Ошибка запроса данных</p>
    <template v-if="status && isErrorStatus(status)">
      <p class="error-text">{{ status.reason }}</p>
    </template>
  </PopupWindow>

</template>

<script lang="ts" setup>
import { Status, loading, error, success, isErrorStatus } from '@/db'
import { computed, ref } from 'vue'
import PopupWindow from '@/components/PopupWindow.vue'

const showErrorPopup = ref(false)


const props = defineProps<{
  status?: Status
}>()


const hasError = computed(() => {
  return props.status && isErrorStatus(props.status)
})

const slotStatus = computed(() => {
  if (props.status === undefined || props.status == success) return 'success'
  if (props.status === loading) return 'loading'
  return 'error'
})

function showError() {
  if (hasError.value) {
    showErrorPopup.value = true
  }
}

</script>

<style lang="scss" scoped>
.card-main-info.error {
  cursor: pointer;
}

.error-text {
  max-width: 800px;
}
</style>