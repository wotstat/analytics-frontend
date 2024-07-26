<template>
  <SumDmg ref="widget" v-bind="targetProps" :color="color" :backgroundColor="backgroundColor" v-if="!hasError" />
  <p class="error-text" v-else>Никнейм не найден. Если вы уверены в нём, возможно баг, напишите на почту
    soprachev@mail.ru</p>
</template>


<script setup lang="ts">
import SumDmg from '@/components/obs/SumDmg.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { query } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

let enabled = true

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
const hasError = ref(false)

const route = useRoute()

const color = computed(() => route.query.color?.toString())
const backgroundColor = computed(() => route.query.backgroundColor?.toString())

const targetProps = shallowRef({
  sumDamage: 0,
  lastDamage: 0,
  battleCount: 0
})

async function load() {
  if (!allow.value) return
  if (!enabled) return

  try {
    const res = await query<{ total: number, last: number, battles: number }>(`
        select toUInt32(sum(personal.damageAssistedRadio)) as total, argMax(personal.damageAssistedRadio, onBattleStartId) as last, toUInt32(count()) as battles
        from Event_OnBattleResult ${whereClause(params)}
      `, { allowCache: false })

    targetProps.value = {
      sumDamage: res.data[0].total,
      lastDamage: res.data[0].last,
      battleCount: res.data[0].battles
    }
  } catch (error) {
    console.error(error);
  }

  setTimeout(() => load(), 5000);
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  enabled = false
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