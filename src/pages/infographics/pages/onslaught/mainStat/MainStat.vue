<template>
  <div class="stats">
    <SimpleItem :icon="'battles'" :value="342" :text="'Боёв проведено'" />
    <SimpleItem :icon="'win'" :value="'75%'" :text="'Процент побед'" />
    <SimpleItem :icon="'winrate'" :value="'75%'" :text="'Процент побед'" />
    <SimpleItem :icon="'dmg'" :value="3342" :text="'Средний урон'" />
    <SimpleItem :icon="'assist'" :value="444" :text="'Среднее содействие'" />
    <SimpleItem :icon="'prestige-points'" :value="444" :text="'Очков престижа'" />
  </div>
</template>


<script setup lang="ts">
import SimpleItem from './items/SimpleItem.vue'


const props = defineProps<{}>()
</script>


<style lang="scss" scoped>
.stats {
  display: flex;
  gap: 20px;
  height: 80px;

  color: #fffef7;
}
</style>