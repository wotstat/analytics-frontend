<template>
  <div class="prestige-tooltip">
    <div class="top">
      <div class="prestige">
        <p>За победу: <span class="value green mt-font">{{ win }}</span></p>
        <p>За поражение: <span class="value red mt-font">{{ lose }}</span></p>
      </div>
      <div class="vr"></div>
      <div class="rating mt-font">
        <p><span class="value green">+{{ (Math.round(ratingWin * 100) / 100).toFixed(2) }}</span></p>
        <p><span class="value red">{{ (Math.round(ratingLose * 100) / 100).toFixed(2) }}</span></p>
      </div>
    </div>
    <hr>
    <p>Максимум: <span class="value mt-font">{{ max }}</span></p>
  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  lose: number
  win: number
  max: number
  ratingWin: number
  ratingLose: number
}>()
</script>


<style lang="scss" scoped>
.prestige-tooltip {
  width: 200px;
}

.top {
  display: flex;
  margin-bottom: 5px;

  .prestige {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
  }

  .rating {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: right;
    max-width: 50px;
    width: 50px;
  }

  .vr {
    width: 1px;
    background-color: var(--color-separator, #54545899);
    margin: 0 10px;
  }
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.3;
}

.value {
  font-weight: bold;
  font-size: 15px;
  line-height: 1;
}

.green {
  color: #4aff62;
}

.red {
  color: #ff6262;
}

hr {
  margin: 5px 0;

  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);
}
</style>