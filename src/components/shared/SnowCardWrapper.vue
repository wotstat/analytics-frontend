<template>
  <div class="snow-effect">
    <div class="snowflakes" aria-hidden="true">
      <div class="snowflake" v-for="i in new Array(11).fill(0)">
        <div class="inner">❅</div>
      </div>
    </div>
    <slot></slot>
  </div>
</template>


<script setup lang="ts">

</script>


<style lang="scss" scoped>
.snow-effect {
  position: relative;
  overflow: hidden;

  :deep(.card) {
    background: linear-gradient(180deg, rgb(20 61 113 / 70%) 0%, rgb(59 100 153 / 70%) 100%);
  }

  .snowflake,
  .snowflake .inner {
    animation-iteration-count: infinite;
    animation-play-state: running
  }

  @keyframes snowflakes-fall {
    0% {
      top: 0;
    }

    100% {
      top: 100%;
    }
  }

  @keyframes snowflakes-shake {

    0%,
    100% {
      transform: translateX(0)
    }

    50% {
      transform: translateX(80px)
    }
  }

  .snowflake {
    position: absolute;
    top: -20px;
    bottom: -20px;
    width: 10px;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
    animation-name: snowflakes-shake;
    animation-duration: 3s;
    animation-timing-function: ease-in-out;

    .inner {
      position: absolute;
      animation-duration: 5s;
      animation-name: snowflakes-fall;
      animation-timing-function: linear
    }
  }

  .snowflake:nth-of-type(0) {
    left: 1%;
    animation-delay: 0s;

    .inner {
      animation-delay: 0s;
    }
  }

  .snowflake:nth-of-type(0) .snowflake:first-of-type {
    left: 10%;
    animation-delay: 1s
  }

  .snowflake:first-of-type .inner,
  .snowflake:nth-of-type(8) .inner {
    animation-delay: 1s
  }

  .snowflake:nth-of-type(2) {
    left: 20%;
    animation-delay: .5s
  }

  .snowflake:nth-of-type(2) .inner,
  .snowflake:nth-of-type(6) .inner {
    animation-delay: 6s
  }

  .snowflake:nth-of-type(3) {
    left: 30%;
    animation-delay: 2s
  }

  .snowflake:nth-of-type(11) .inner,
  .snowflake:nth-of-type(3) .inner {
    animation-delay: 4s
  }

  .snowflake:nth-of-type(4) {
    left: 40%;
    animation-delay: 2s
  }

  .snowflake:nth-of-type(10) .inner,
  .snowflake:nth-of-type(4) .inner {
    animation-delay: 2s
  }

  .snowflake:nth-of-type(5) {
    left: 50%;
    animation-delay: 3s
  }

  .snowflake:nth-of-type(5) .inner {
    animation-delay: 8s
  }

  .snowflake:nth-of-type(6) {
    left: 60%;
    animation-delay: 2s
  }

  .snowflake:nth-of-type(7) {
    left: 70%;
    animation-delay: 1s
  }

  .snowflake:nth-of-type(7) .inner {
    animation-delay: 2.5s
  }

  .snowflake:nth-of-type(8) {
    left: 80%;
    animation-delay: 0s
  }

  .snowflake:nth-of-type(9) {
    left: 90%;
    animation-delay: 1.5s
  }

  .snowflake:nth-of-type(9) .inner {
    animation-delay: 3s
  }

  .snowflake:nth-of-type(10) {
    left: 25%;
    animation-delay: 0s
  }

  .snowflake:nth-of-type(11) {
    left: 65%;
    animation-delay: 2.5s
  }

}
</style>