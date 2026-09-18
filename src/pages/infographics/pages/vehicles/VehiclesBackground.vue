<template>
  <div class="vehicles-background"></div>
</template>

<style scoped lang="scss">
.vehicles-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 85% 125% at 110% 0%, #0e1319 8%, #13191f99 40%, transparent 88%),
    radial-gradient(ellipse 85% 60% at -10% 105%, #0f131880, transparent 85%),
    #1b1f23;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, transparent 30%, #0b0f1440 51%, transparent 72%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url('./graphite-grain.svg') repeat;
    filter: brightness(0);
    opacity: 0.25;
  }
}
</style>
