<template>
  <div class="player-nickname">
    <SearchLine v-model="nickname" name="nickname" :placeholder="'Никнейм'" @clear="emit('clear')">
      <template #icon>
        <PlayerIcon />
      </template>
    </SearchLine>
  </div>
</template>


<script setup lang="ts">
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import PlayerIcon from './player.svg'

const nickname = defineModel<string>({ default: '' })
const emit = defineEmits<{ clear: [] }>()

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
