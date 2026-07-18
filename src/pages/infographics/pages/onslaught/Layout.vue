<template>
  <SidebarLayout :links>

    <template #sidebar>
      <div class="sticky-sidebar router-links">
        <!-- <QueryPreserveRouterLink to="/onslaught/general">Общее</QueryPreserveRouterLink> -->
        <QueryPreserveRouterLink to="/onslaught/personal">Статистика</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/onslaught/leaderboard">Таблица лидеров</QueryPreserveRouterLink>
      </div>
    </template>

    <template #content-top></template>

    <template #default>
      <img src="./assets/bg-1.jpg" alt="background" class="background">
      <RouterView></RouterView>
      <hr class="footer">
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/pages/shared/sidebarLayout/QueryPreserveRouterLink.vue'
import SidebarLayout from '@/pages/shared/sidebarLayout/SidebarLayout.vue'
import { SidebarLink } from '@/pages/shared/sidebarLayout/utils'
import { setFeatureVisit } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'
import { RouterView } from 'vue-router'

const links: SidebarLink[] = [
  // { to: '/onslaught/general', labels: 'Общее' },
  { to: '/onslaught/personal', labels: 'Персональная' },
  { to: '/onslaught/leaderboard', labels: 'Таблица лидеров' },
]

setFeatureVisit('onslaught')

</script>


<style lang="scss">
.comp7-tooltip {
  --popover-background-color: rgba(16, 29, 51, 1);
  --popover-border-color: rgb(40, 57, 85);
}
</style>

<style scoped lang="scss">
.router-links {
  display: flex;
  flex-direction: column;
}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  z-index: -1;

  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAASCAYAAAA6yNxSAAADNklEQVR4nG1WC3bjIAwcAW7aK+xR9v5n2thYEvtGAtt5r2kVMLaZ0ehD5PvP31FqQWsbtu2F7fXC1+sHX1/f2F4/aF8vtO2F2l4odYOUCkiFD6T5gLlj+MAAIAIUkTDOAYep4jw7jn3Hvv/D/n6j9wOqhsZH4s3B//gCRm42xrrOtZzkC4IC4bUQlF95J6YELzKXSGTZvPe4bmvTBc4xVgJ8BIkw/s218Cx2F8igx4CXXOLGvL4UGIJRUpHyGPM5Qcs9b/AAdYePAR+OMTh3iDuk5P2lBn1MmROUH+pC75MAny0YfoMv7zknsYYAkQAKYMYy5gbntRmkTDMLgNSdQ17l5RR8KRCKMEie0pNwKDPCSI5vNIKFTNPbALZlCmPSlQqREv5l9AnEZIy0m3kx4ztX8tZSzKfZNReOcDR6yQ3dJUGrwr3BTCF6A3PbOhNzjAYpPkkkJAcqGSPlDV581jCce2o4dJkrhila3KSwBriQRIHpOTM7vaMTzIMgW2mGUluQC4KPDKfjjHemdoaV+9l5pOk0zs3Q3E6IZ0m5AKaZJOuTeeEoMzSlaYCXQqsQBnsqcJfaDMwMKQmc/cDZd+jxhvY37OxQpQLaMQoJOGwmyvXycNQ6gelF21B0SwJBIkP0UeerF0RFkfyDwLHjPN459p4KQHukrA27SCS4pddVIeVMwA9wjk8CdxIy+RYBKqB6QntHP3Z0KnBQjZ45AD2inOAV9szWAGf5KaTWAJQAfXhfuH4rcHXCqJVPBfTsoYIeDMOOcZ5AKjAJjBo1a/CLeXEFhMAJRgIBOgmsHHjKnyQ+FWBFkYCSQM8ExEUAR3QraL3i7lcj0llqsxcE6CTxC4HZk24FogpmP4lK6PAA74CeoXID+qzzChgPF+rAtmsQb6nOIiAFfqlQURj/3whcCtDsCoMz4a0DTiMBJwFDGjvTnM6DJ7pkKMCc4EhA5kXF8IoRpB6n2zodQwGOdziHEfDECGAN7wmWx/GFHG2MHelejp5KFZLMOh1Xi/2ogun9/d6dBwSMMdrx7fSDwPphsCqBicnx2e4XuWy10c55Ql4nwPz9ENP1+2GeMbP3yzza1w+N/yUBtryd+wn4AAAAAElFTkSuQmCC");
  background-size: cover;

  filter: brightness(0.7);
  user-select: none;
  pointer-events: none;
}
</style>
