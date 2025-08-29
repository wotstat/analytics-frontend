<template>
  <div class="sidebar-layout-container">

    <div class="sidebar">
      <slot name="sidebar">
        <div class="sticky-sidebar router-links">
          <template v-for="link in links">
            <QueryPreserveRouterLink :to="link.to" v-if="link != 'separator'">
              {{ link.labels }}
            </QueryPreserveRouterLink>
            <hr v-else>
          </template>
        </div>
      </slot>
    </div>

    <div class="content">
      <slot name="content-top"></slot>

      <div class="menu-bar" ref="menuBar" :class="menuTop <= headerOffset && menuY != 0 ? 'top' : ''">
        <slot name="menu-bar">
          <div class="router-links">
            <template v-for="link in links">
              <QueryPreserveRouterLink :to="link.to" v-if="link != 'separator'">
                {{ link.shortLabel ?? link.labels }}
              </QueryPreserveRouterLink>
            </template>
          </div>
        </slot>
      </div>

      <slot></slot>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useElementBounding } from '@vueuse/core'
import QueryPreserveRouterLink from '@/components/QueryPreserveRouterLink.vue'
import { computed, ref, watchEffect } from 'vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight'
import { type SidebarLink } from './utils.ts'

const menuBar = ref<HTMLElement | null>(null)
const { top: menuTop, y: menuY, height: menuH } = useElementBounding(menuBar)
const headerOffset = computed(() => headerHeight.value)

const props = defineProps<{
  links?: SidebarLink[]
}>()

const { additionalHeaderHeight } = useAdditionalHeaderHeight()
watchEffect(() => {
  if (menuY.value == 0) return additionalHeaderHeight.value = 0
  if (menuTop.value > headerOffset.value) return additionalHeaderHeight.value = 0
  additionalHeaderHeight.value = menuH.value - 18
})

</script>

<style lang="scss" scoped>
$sidebar-width: 170px;
$mobile-layout: 1100px;

.sidebar-layout-container {
  display: flex;
  justify-content: center;

  @media screen and (max-width: $mobile-layout) {
    flex-direction: column;
  }

  .sidebar {
    width: $sidebar-width;
    margin: 1rem;

    @media screen and (max-width: $mobile-layout) {
      display: none;
    }

    :deep(.sticky-sidebar) {
      position: sticky;
      margin-top: 24px;
      top: calc(var(--header-height) + 40px);
    }

    .router-links {
      display: flex;
      flex-direction: column;
    }
  }

  .menu-bar {
    margin: 20px -1rem;
    padding: 5px 1rem;
    position: sticky;
    top: calc(var(--header-height) - 15px);
    z-index: 10;

    @media screen and (min-width: calc($mobile-layout + 1px)) {
      display: none;
    }

    .router-links {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .router-links>a:hover:not(.router-link-exact-active) {
      background-color: unset;
    }

    &.top {
      .router-links {
        a {
          &.router-link-exact-active {
            color: #d6fbff;
            filter: drop-shadow(0 0 0.5em #4a7697bc);
            background-color: unset;
          }
        }
      }
    }
  }

  .content {
    margin: 1rem;
    flex: 1;
    min-width: 0;

    @media screen and (min-width: 1500px) {
      max-width: calc(1200px - 3rem);
      margin-right: $sidebar-width;
    }

    @media screen and (max-width: $mobile-layout) {
      :deep(.page-title) {
        display: none;
      }
    }
  }


  :deep(.router-links) {
    a {
      color: inherit;
      line-height: 1.2;
      padding: 6.5px 8px;
      border-radius: 10px;
      cursor: pointer;

      &.router-link-exact-active {
        background-color: #353535;
      }

      &:hover {
        background-color: #353535;
      }
    }
  }
}
</style>