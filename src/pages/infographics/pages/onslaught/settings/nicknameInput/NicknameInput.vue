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

const props = defineProps<{
  syncToRoute?: boolean
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

watch(nickname, (newNickname) => {
  if (!props.syncToRoute) return

  const query = { ...route.query }
  if (newNickname) query.nickname = newNickname
  else delete query.nickname

  router.replace({ ...route, query })

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