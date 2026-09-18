<template>
  <div class="background">
    <div class="blue-gradient"></div>
    <div class="green-gradient"></div>
  </div>
</template>

<style scoped lang="scss">
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 250vh;
  overflow: hidden;

  .blue-gradient {
    position: absolute;
    top: -100vw;
    right: -100vw;
    width: 200vw;
    height: 200vw;
    opacity: 0.05;
    background: radial-gradient(closest-side,
        rgba(0, 115, 255, 1) 0%,
        rgba(0, 115, 255, 0) 100%);
  }

  .green-gradient {
    position: absolute;
    top: 50vw;
    left: -130vw;
    width: 200vw;
    height: 200vw;
    opacity: 0.02;
    background: radial-gradient(closest-side,
        rgb(0, 255, 132) 0%,
        rgba(0, 255, 132, 0) 100%);
  }
}
</style>
