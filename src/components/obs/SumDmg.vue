<template>
  <div class="flex">
    <div class="card flex-1" :style="{ backgroundColor: `#${props.backgroundColor}` }">
      <div class="main flex gap-0">
        <div class="sum flex-1">
          <p class="header center grey">Сумма ({{ battleCount }})</p>
          <p class="num green bold center" :style="{ color: `#${props.color}` }">{{ processor(sumDamageTween) }}</p>
        </div>
        <div class="last flex-1 ">
          <p class="header center grey">Посл. бой</p>
          <p class="num center white">{{ processor(lastDamageTween) }}</p>
        </div>
        <!-- <p>Местоf: <span class="green bold num" :style="style">{{ processor(placeTween) }}</span></p> -->
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  sumDamage: number;
  lastDamage: number;
  battleCount: number;
  color?: string;
  backgroundColor?: string;
}>();

const processor = useFixedSpaceProcessor(0)

const sumDamage = computed(() => props.sumDamage);
const lastDamage = computed(() => props.lastDamage);

const sumDamageTween = useTweenCounter(sumDamage, { duration: 1 });
const lastDamageTween = useTweenCounter(lastDamage, { duration: 1 });


const route = useRoute();

onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';
})

</script>

<style lang="scss" scoped>
.card {
  font-size: 1.3vw;
  padding: 1em 4em;
  border-radius: 3em;
  background-color: #292929;
  position: relative;


  .main {
    p {
      font-size: 8em;
    }

    .header {
      font-size: 4em;
      color: #c4c4c4;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .num {
      font-variant-numeric: tabular-nums;
      text-wrap: nowrap;
    }

    .num {
      line-height: 1.2;
    }

    .white {
      color: white;
    }

    .grey {
      color: #c4c4c4;
    }
  }

  $grey: #c4c4c4;

  .green {
    color: #7ee927;
  }
}
</style>
