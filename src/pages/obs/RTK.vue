<template>
  <RTK ref="widget" :place="place" v-if="!hasError" />
  <p class="error-text" v-else>Никнейм не найден. Если вы уверены в нём, возможно баг, напишите на почту
    soprachev@mail.ru</p>
</template>


<script setup lang="ts">
import RTK from '@/components/obs/RTK.vue';
import { useQueryStatParams } from '@/composition/useQueryStatParams';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
let enabled = true

const place = ref(0)
const best = ref(0)
const id = ref(0)
const hasError = ref(false)
const widget = ref<InstanceType<typeof RTK> | null>(null)

async function load() {
  if (!allow.value) return
  if (!enabled) return

  try {

    const data = await fetch(`https://challenge.tanki.su/api/v1/tournaments/585/player/${id.value}?sortby=rating`)
    const parsed = await data.json()
    place.value = Number.parseInt(parsed.data)
    console.log('place', place.value);



  } catch (error) {
    console.error(error);
  }

  setTimeout(() => load(), 5000);
}

onMounted(() => {
  const nickname = params.value.player
  if (!nickname) return

  fetch(`https://challenge.tanki.su/api/v1/tournaments/585/autocomplete?search=${nickname}`)
    .then(res => res.json())
    .then(data => {
      try {
        id.value = data.data.search_results[0].spa_id
        load()
      } catch (error) {
        hasError.value = true
      }
    })
})

onUnmounted(() => {
  enabled = false
})

watch(place, (value) => {
  if (best.value == 0) {
    best.value = value
    return
  }

  if (value < best.value) {
    best.value = value
    widget.value?.showRecordScreen()
  }
})


</script>


<style lang="scss" scoped>
.error-text {
  background-color: #6e303086;
  color: white;
  border-radius: 20px;
  padding: 1em;
  font-size: 24px;
  font-weight: bold;
}
</style>