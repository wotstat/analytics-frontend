<template>
  <div class="debug-stage">
    <Nickname caption="Вложенный никнейм" />
    <label class="debug-control">Выбор ребёнка <input type="text" v-model="selection" /></label>
    <p>При скрытии исчезает child, при возвращении восстанавливается значение.</p>
  </div>
</template>

<script setup lang="ts">
import { useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'
import Nickname from './Nickname.vue'

const { params: { selection } } = useQueryStorage({
  selection: { type: String, label: 'child', key: 'debug.child', default: '' }
})
</script>
