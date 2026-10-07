<template>
  <div class="debug-row">
    <label class="debug-control">{{ caption }} <input type="text" v-model="nickname" /></label>
    <button class="debug-btn" @click="clear">Очистить никнейм</button>
  </div>
</template>

<script setup lang="ts">
import { useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'

defineProps<{ caption: string }>()
const storage = useQueryStorage({ nickname: { type: String, default: '' } }, { debounce: 500 })
const { nickname } = storage.params

function clear() {
  nickname.value = ''
  void storage.flush('nickname')
}
</script>
