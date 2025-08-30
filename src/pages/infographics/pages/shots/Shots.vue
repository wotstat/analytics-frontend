<template>
  <h2 class="page-title">Стрельба</h2>

  <div class="flex ver shots" ref="container">
    <div class="card long">
      <GenericInfo :status="shotsCount.status" :value="shotsCount.data.count" :processor="createFixedSpaceProcessor(0)"
        description="Выстрелов всего" color="green" />
    </div>
    <div class="flex hor main">
      <div class="card circle">
        <ShotsCircle :params="params" :limit-shot="30000" :mask-radius="maskRadius" @on-click-shot="onClickShot"
          :allow-hover="true" />
        <div class="legend">
          <p><span class="mini-circle green">•</span> – промахи</p>
          <p><span class="mini-circle red">•</span> – попадания</p>
        </div>
      </div>
      <div class="flex ver flex-1 right">
        <div class="grid mincards">
          <div class="card">
            <GenericInfo :status="dataResult.status" :value="dataResult.data.hit" description="Попало по танкам"
              color="yellow" :processor="createPercentProcessor()" />
          </div>
          <div class="card">
            <GenericInfo :status="dataResult.status" :value="dataResult.data.damaged" description="С уроном"
              color="orange" :processor="createPercentProcessor()" />
          </div>
          <div class="card hide-less-medium" ref="percent50">
            <GenericInfo :status="dataResult.status" :value="dataResult.data.first50"
              description="Попали в первую половину" color="red" :processor="createPercentProcessor()" />
          </div>
          <div class="card hide-less-medium" ref="percent30">
            <GenericInfo :status="dataResult.status" :value="dataResult.data.first30"
              description="Попали в первую треть" color="blue" :processor="createPercentProcessor()" />
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
        <GenericInfo :status="dataResult.status" :value="dataResult.data.first50" description="Попали в первую половину"
          color="red" :processor="createPercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="dataResult.status" :value="dataResult.data.first30" description="Попали в первую треть"
          color="blue" :processor="createPercentProcessor()" />
      </div>
    </div>
    <div class="flex hor-ver-x-small">
      <div class="card flex-1">
        <GenericInfo :status="dataResult.status" :value="dataResult.data.dist300" description="С расстояния 300м+"
          color="yellow" :processor="createPercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="dataResult.status" :value="dataResult.data.full" description="С полным сведением"
          color="blue" :processor="createPercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="dataResult.status" :value="dataResult.data.stopped" description="Неподвижно" color="green"
          :processor="createPercentProcessor()" />
      </div>
    </div>

    <PopupWindow v-if="selectedShot" @close="closeShotInfo" :title="'Информация о выстреле'">
      <ShotInfo :shotID="selectedShot" />
    </PopupWindow>
  </div>
</template>

<script setup lang="ts">
import ShotsCircle from '@/pages/infographics/shared/widgets/ShotsCircle.vue'
import GenericInfo from '@/pages/infographics/shared/widgets/GenericInfo.vue'
import ShotDistribution from '@/pages/infographics/shared/widgets/ShotDistribution.vue'
import { createFixedSpaceProcessor, createPercentProcessor } from '@/shared/processors/processors'
import { SHORT_CACHE_SETTINGS, queryAsyncFirst } from '@/db'
import { computed, ref } from 'vue'
import { useElementVisibility, useMouseInElement } from '@vueuse/core'
import { getQueryStatParamsCache, useQueryStatParams, whereClause } from '@/shared/query/useQueryStatParams'
import PopupWindow from '@/shared/ui/components/PopupWindow.vue'
import ShotInfo from './shotInfo/Index.vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from '@/shared/composition/useMeta'

useMeta({
  title: 'Статистика стрельбы',
  description: 'Статистика стрельбы в боях',
  keywords: 'статистика стрельбы, статистика стрельбы в боях, статистика стрельбы в игре, статистика стрельбы в world of tanks'
})


const route = useRoute()
const router = useRouter()

const container = ref<HTMLElement | null>(null)
const visible = useElementVisibility(container)
const params = useQueryStatParams()

const percent50 = ref<HTMLElement | null>(null)
const { isOutside: isOutside50 } = useMouseInElement(percent50)

const percent30 = ref<HTMLElement | null>(null)
const { isOutside: isOutside30 } = useMouseInElement(percent30)

const shotDistribution = ref<HTMLElement | null>(null)
const { isOutside } = useMouseInElement(shotDistribution)

const chartHoverProgress = ref(1)
const hoverProgress = (progress: number) => {
  chartHoverProgress.value = progress
}

const maskRadius = computed(() => {
  if (selectedShot.value) return 1
  if (!isOutside.value) return chartHoverProgress.value
  if (!isOutside50.value) return 0.5
  if (!isOutside30.value) return 0.3333
  return 1
})

const shotsCount = queryAsyncFirst(`
select toUInt32(count()) as count 
from Event_OnShot
${whereClause(params)}
`, { count: 0 }, { enabled: visible, settings: params.value.player ? {} : SHORT_CACHE_SETTINGS })

const dataResult = queryAsyncFirst(`
select toUInt32(count())                                                                             as count,
       countIf(length(results.shotDamage) > 0) / count                                               as hit,
       countIf(arrayMax(results.shotDamage) > 0) / count                                             as damaged,
       countIf(ballisticResultClient_r <= 0.5) / count                                               as first50,
       countIf(ballisticResultClient_r <= 0.3333) / count                                            as first30,
       countIf(abs(serverShotDispersion / gunDispersion) between 0.999 and 1.001 or
               abs(clientShotDispersion / gunDispersion) between 0.999 and 1.001) / count            as full,
       countIf(abs(turretSpeed) + abs(vehicleRotationSpeed) < 1 and abs(vehicleSpeed) < 0.5) / count as stopped,
       countIf(clientMarkerDistance > 300) / count                                                   as dist300
from Event_OnShot
${whereClause(params)}
`, { count: 0, hit: 0, damaged: 0, first50: 0, first30: 0, full: 0, stopped: 0, dist300: 0 }, { enabled: visible, settings: getQueryStatParamsCache(params.value) })

const selectedShot = computed(() => route.query.shot as string | undefined)

function onClickShot(shot: string) {
  router.push({ query: { ...route.query, shot } })
}

function closeShotInfo() {
  router.push({ query: { ...route.query, shot: undefined } })
}

</script>


<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

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