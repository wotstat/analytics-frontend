<template>
  <div class="player-nickname">
    <SearchLine v-model="nickname" :placeholder="'Никнейм'">
      <template #icon>
        <PlayerIcon />
      </template>
    </SearchLine>
  </div>
</template>


<script setup lang="ts">
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayerIcon from './player.svg'
import { refDebounced } from '@vueuse/core'

const props = defineProps<{
  syncToRoute?: boolean
  syncDebounceTime?: number
}>()

const nickname = defineModel({
  type: String,
  required: false,
  default: '',
})


const route = useRoute()
const router = useRouter()
onMounted(() => {
  if (props.syncToRoute) {
    nickname.value = route.query.nickname as string || ''
  }
})

watch(route, (newRoute) => {
  if (!props.syncToRoute) return

  const newNickname = newRoute.query.nickname as string || ''
  if (newNickname !== nickname.value) nickname.value = newNickname
})

const debouncedNickname = refDebounced(nickname, props.syncDebounceTime ?? 1000)

watch(debouncedNickname, (newNickname) => {
  if (!props.syncToRoute) return

  const query = { ...route.query }
  if (newNickname) query.nickname = newNickname
  else delete query.nickname

  router.push({ ...route, query })
})
</script>


<style lang="scss" scoped>
.player-nickname {
  input {
    padding: 0.5em 1em;
    width: 100%;
    max-width: 400px;
    border-radius: 4px;
    border: 1px solid #ccc;
    text-align: center;
  }
}
</style>