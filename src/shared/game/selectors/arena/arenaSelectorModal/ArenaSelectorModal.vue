<template>
  <div class="modal-content">
    <div class="section" v-for="group in groups">
      <h2 class="header">{{ group.header }}</h2>
      <div class="arena" v-for="arena in group.items" :key="arena">
        {{ arena }}
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, watchEffect } from 'vue'

const props = defineProps<{
  game: 'mt' | 'wot'
  arenas: { region: string, battleMode: string, arenaTag: string }[]
}>()


const currentGameArenas = computed(() =>
  props.arenas.filter(arena => arena.region === (props.game === 'mt' ? 'RU' : 'EU')))

const groups = computed(() => {

  const regular: string[] = []
  const battleRoyale: string[] = []
  const comp7: string[] = []

  for (const arena of currentGameArenas.value) {
    if (arena.battleMode === 'REGULAR') regular.push(arena.arenaTag)
    else if (arena.battleMode === 'BATTLE_ROYALE_SQUAD' || arena.battleMode == 'BATTLE_ROYALE_SOLO') battleRoyale.push(arena.arenaTag)
    else if (arena.battleMode === 'COMP7') comp7.push(arena.arenaTag)
  }

  return [
    { header: 'Доступные в рандоме', items: regular },
    { header: 'Стальной Охотник', items: battleRoyale },
    { header: 'Натиск', items: comp7 }
  ]
})

watchEffect(() => {
  console.log(currentGameArenas.value)
  console.log(props.arenas, props.game)
})
</script>


<style lang="scss" scoped>
h2 {
  margin: 10px 0;
  font-size: 1em;
}
</style>