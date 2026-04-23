<template>
  <section>
    <Qualification :battles="qualification.battles" :rating="qualification.rating" />
  </section>
</template>


<script setup lang="ts">
import Qualification from './qualification/Qualification.vue'

const props = defineProps<{
  qualification: {
    battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
    rating: number
  }
}>()
</script>


<style lang="scss" scoped>
section {
  margin-top: 45px;
}
</style>