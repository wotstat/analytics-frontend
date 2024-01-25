<template>
  <div class="center-container">
    <h1>Сессионная инфографика</h1>
    <h2>Стрельба</h2>
    <div class="flex ver shots">
      <div class="card long">
        <GenericInfo query="select count(*) as data from Event_OnShot" description="Выстрелов всего" color="green" />
      </div>
      <div class="flex hor main">
        <div class="card circle">
          <ShotsCircle />
          <div class="legend">
            <p><span class="mini-circle green">•</span> – промахи</p>
            <p><span class="mini-circle red">•</span> – попадания</p>
          </div>
        </div>
        <div class="flex ver flex-1 right">
          <div class="grid mincards">
            <div class="card">
              <GenericInfo
                query="SELECT count(if(length(results.order) > 0, 1, null)) / count() as data FROM Event_OnShot;"
                description="Попало по танкам" color="yellow" :processor="usePercentProcessor()" />
            </div>
            <div class="card">
              <GenericInfo
                query="SELECT count(if(arraySum(results.shotDamage) > 0 or arraySum(results.fireDamage) > 0, 1, null)) / count() as data FROM Event_OnShot;"
                description="С уроном" color="orange" :processor="usePercentProcessor()" />
            </div>
            <div class="card">
              <GenericInfo
                query="SELECT count(if(ballisticResultServer_r < 0.5, 1, null)) / count() as data FROM Event_OnShot;"
                description="Попали в первую половину" color="red" :processor="usePercentProcessor()" />
            </div>
            <div class="card">
              <GenericInfo
                query="SELECT count(if(ballisticResultServer_r < 0.333, 1, null)) / count() as data FROM Event_OnShot;"
                description="Попали в первую треть" color="blue" :processor="usePercentProcessor()" />
            </div>
          </div>
          <div class="card chart">
            <ShotDistribution />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ShotsCircle from "@/components/widgets/ShotsCircle.vue";
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import ShotDistribution from '@/components/widgets/ShotDistribution.vue';
import { usePercentProcessor } from '@/composition/usePercentProcessor';

</script>

<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.card {
  padding: 15px;
}

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
    padding: 0 15px 5px 15px;

    @include small {
      flex: 1;
    }
  }
}
</style>