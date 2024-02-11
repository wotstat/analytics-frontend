<template>
  <div class="flex ver shots" ref="container">
    <div class="card long">
      <GenericInfo :value="dataResult.count" description="Выстрелов всего" color="green" />
    </div>
    <div class="flex hor main">
      <div class="card circle">
        <ShotsCircle :params="params" :mask-radius="maskRadius" @on-click-shot="onClickShot" :allow-hover="true" />
        <div class="legend">
          <p><span class="mini-circle green">•</span> – промахи</p>
          <p><span class="mini-circle red">•</span> – попадания</p>
        </div>
      </div>
      <div class="flex ver flex-1 right">
        <div class="grid mincards">
          <div class="card">
            <GenericInfo :value="dataResult.hit" description="Попало по танкам" color="yellow"
              :processor="usePercentProcessor()" />
          </div>
          <div class="card">
            <GenericInfo :value="dataResult.damaged" description="С уроном" color="orange"
              :processor="usePercentProcessor()" />
          </div>
          <div class="card hide-less-medium" ref="percent50">
            <GenericInfo :value="dataResult.first50" description="Попали в первую половину" color="red"
              :processor="usePercentProcessor()" />
          </div>
          <div class="card hide-less-medium" ref="percent30">
            <GenericInfo :value="dataResult.first30" description="Попали в первую треть" color="blue"
              :processor="usePercentProcessor()" />
          </div>
        </div>
        <div class="card chart" ref="shotDistribution">
          <ShotDistribution :params="params" @hover:progress="hoverProgress" />
          <p class="card-main-info description">Распределение выстрелов в круге сведения</p>
        </div>
      </div>
    </div>

    <div class="flex hor-ver-x-small show-less-medium">
      <div class="card flex-1">
        <GenericInfo :value="dataResult.first50" description="Попали в первую половину" color="red"
          :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="dataResult.first30" description="Попали в первую треть" color="blue"
          :processor="usePercentProcessor()" />
      </div>
    </div>
    <div class="flex hor-ver-x-small">
      <div class="card flex-1">
        <GenericInfo :value="dataResult.dist300" description="С расстояния 300м+" color="yellow"
          :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="dataResult.full" description="С полным сведением" color="blue"
          :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="dataResult.stopped" description="Неподвижно" color="green"
          :processor="usePercentProcessor()" />
      </div>
    </div>

    <PopupWindow v-if="selectedShot" @close="closeShotInfo" :title="'Информация о выстреле'">
      <ShotInfo :shotID="selectedShot" />
    </PopupWindow>
  </div>
</template>

<script setup lang="ts">
import ShotsCircle from "@/components/widgets/ShotsCircle.vue";
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import ShotDistribution from '@/components/widgets/ShotDistribution.vue';
import { usePercentProcessor } from '@/composition/usePercentProcessor';
import { queryAsyncFirst } from "@/db";
import { computed, ref, watch, watchEffect } from "vue";
import { useElementVisibility, useMouseInElement } from "@vueuse/core";
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import PopupWindow from "@/components/PopupWindow.vue";
import ShotInfo from "@/components/widgets/ShotInfo.vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();

const percent50 = ref<HTMLElement | null>(null);
const { isOutside: isOutside50 } = useMouseInElement(percent50)

const percent30 = ref<HTMLElement | null>(null);
const { isOutside: isOutside30 } = useMouseInElement(percent30)

const shotDistribution = ref<HTMLElement | null>(null);
const { isOutside } = useMouseInElement(shotDistribution)

const chartHoverProgress = ref(1);
const hoverProgress = (progress: number) => {
  chartHoverProgress.value = progress;
}

const maskRadius = computed(() => {
  if (selectedShot.value) return 1
  if (!isOutside.value) return chartHoverProgress.value;
  if (!isOutside50.value) return 0.5;
  if (!isOutside30.value) return 0.3333;
  return 1;
})

const dataResult = queryAsyncFirst(`
select toUInt32(count())                                                                                as count,
       countIf(length(results.order) > 0) / count()                                                     as hit,
       countIf(arraySum(results.shotDamage) > 0 or arraySum(results.fireDamage) > 0) / count()          as damaged,
       countIf(ballisticResultServer_r <= 0.5) / count()                                                as first50,
       countIf(ballisticResultServer_r <= 0.3333) / count()                                             as first30,
       countIf(abs(serverShotDispersion - gunDispersion) < 0.001 or
               abs(clientShotDispersion - gunDispersion) < 0.001) / count()                             as full,
       countIf(abs(turretSpeed) + abs(vehicleRotationSpeed) < 0.02 and abs(vehicleSpeed) < 1) / count() as stopped,
       countIf(sqrt(pow(serverMarkerPoint_x - gunPoint_x, 2) +
                    pow(serverMarkerPoint_y - gunPoint_y, 2) +
                    pow(serverMarkerPoint_z - gunPoint_z, 2)) > 300) / count()                          as dist300
from Event_OnShot
${whereClause(params)}
`, { count: 0, hit: 0, damaged: 0, first50: 0, first30: 0, full: 0, stopped: 0, dist300: 0 }, visible)

const selectedShot = computed(() => route.query.shot as string | undefined);

function onClickShot(shot: string) {
  router.push({ query: { ...route.query, shot } });
}

function closeShotInfo() {
  router.push({ query: { ...route.query, shot: undefined } });
}

</script>


<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.shots {
  .card.circle {
    @include small {
      min-width: 300px;
    }

    @include medium {
      min-width: 400px;
    }

    @include large {
      min-width: 500px;
    }

    .legend {
      margin-top: 40px;

      .mini-circle {
        font-weight: 900;

        &.green {
          color: #e7ffde;
          filter: drop-shadow(0 0 8px #639e31);
        }

        &.red {
          color: #ffdd9c;
          filter: drop-shadow(0 0 8px #f73c08);
        }
      }
    }
  }

  .main {
    @include less-small {
      flex-direction: column;
    }

    .right {
      @include less-small {
        flex-direction: column-reverse;

        .chart {
          min-height: 250px;
        }
      }
    }
  }

  .mincards {
    @include small {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .chart {
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 0 15px 15px 15px;

    @include small {
      flex: 1;
    }
  }
}
</style>