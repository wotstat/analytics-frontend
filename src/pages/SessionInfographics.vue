<template>
  <div class="center-container">
    <h1>Сессионная инфографика</h1>
    <h2>Стрельба</h2>
    <div class="flex ver shots">
      <div class="card long">
        <TotalShots />
      </div>
      <div class="flex hor main">
        <div class="card circle">
          <ShotsCircle />
          <p>- попали</p>
          <p>- не попали</p>
        </div>
        <div class="flex ver flex-1 right">
          <div class="grid mincards">
            <div class="card">
              <p>Попали</p>
            </div>
            <div class="card">
              <p>С уроном</p>
            </div>
            <div class="card">
              <p>В первую половину</p>
            </div>
            <div class="card">
              <p>В первую треть</p>
            </div>
          </div>
          <div class="card chart">
            <p>ГРАФИК</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ShotsCircle from "@/components/widgets/ShotsCircle.vue";
import TotalShots from "@/components/widgets/TotalShots.vue";

</script>

<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.card {
  padding: 15px;
}

.shots {
  .card.circle {
    @include small {
      width: 300px;
    }

    @include medium {
      width: 400px;
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
    @include small {
      flex: 1;
    }
  }
}
</style>