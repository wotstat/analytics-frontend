<template>
  <div class="sidebar-layout-container" :class="{ 'wide-sidebar': wideSidebar }">

    <div class="sidebar">
      <slot name="sidebar">
        <div class="sticky-sidebar router-links">
          <template v-for="link in links">
            <RouterLink :to="link.to" v-if="link != 'separator'">
              {{ link.labels }}
            </RouterLink>
            <hr v-else>
          </template>
        </div>
      </slot>
    </div>

    <div class="content">
      <template v-if="$slots['mobile-content-top']">
        <div class="desktop-content-top">
          <slot name="content-top" />
        </div>
        <div class="mobile-content-top">
          <slot name="mobile-content-top" />
        </div>
      </template>
      <slot v-else name="content-top" />

      <div v-if="$slots['menu-bar'] || links?.length" class="menu-bar" ref="menuBar" :class="{ top: menuPinned }">
        <slot name="menu-bar">
          <div class="router-links">
            <template v-for="link in links">
              <RouterLink :to="link.to" v-if="link != 'separator'">
                {{ link.shortLabel ?? link.labels }}
              </RouterLink>
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
import { RouterLink } from 'vue-router'
import { computed, useTemplateRef, watchEffect } from 'vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/pages/shared/header/useAdditionalHeaderHeight.ts'
import { type SidebarLink } from './utils.ts'

defineProps<{
  links?: SidebarLink[]
  wideSidebar?: boolean
}>()

const menuBar = useTemplateRef<HTMLElement>('menuBar')
const { top: menuTop, height: menuHeight } = useElementBounding(menuBar)
const menuPinned = computed(() => menuHeight.value > 0 && menuTop.value <= headerHeight.value)

const { additionalHeaderHeight } = useAdditionalHeaderHeight()
watchEffect(() => {
  additionalHeaderHeight.value = menuPinned.value ? menuHeight.value - 18 : 0
})
</script>

<style lang="scss" scoped>
$mobile-layout: 1100px;
$content-width: 1200px;
$page-margin: 1rem;
$wide-sidebar-width: 210px;

@mixin desktop-layout($sidebar-width, $centering-breakpoint) {
  --sidebar-width: #{$sidebar-width};

  @media screen and (min-width: $centering-breakpoint) {
    .content {
      max-width: calc($content-width - 3 * $page-margin);
      margin-right: $sidebar-width;
    }
  }
}

.sidebar-layout-container {
  display: flex;
  justify-content: center;

  &:not(.wide-sidebar) {
    @include desktop-layout(170px, 1500px);
  }

  &.wide-sidebar {
    @include desktop-layout($wide-sidebar-width, calc($content-width + 2 * ($wide-sidebar-width + $page-margin)));
  }

  @media screen and (max-width: $mobile-layout) {
    flex-direction: column;
  }

  .sidebar {
    width: var(--sidebar-width);
    margin: $page-margin;

    @media screen and (max-width: $mobile-layout) {
      display: none;
    }

    :deep(.sticky-sidebar) {
      --sidebar-sticky-top: calc(var(--header-height) + 40px);

      position: sticky;
      margin-top: 24px;
      top: var(--sidebar-sticky-top);
    }

    .router-links {
      display: flex;
      flex-direction: column;
    }
  }

  .menu-bar,
  .mobile-content-top {
    @media screen and (width > $mobile-layout) {
      display: none;
    }
  }

  .desktop-content-top {
    @media screen and (max-width: $mobile-layout) {
      display: none;
    }
  }

  .menu-bar {
    margin: 20px -1rem;
    padding: 5px 1rem;
    position: sticky;
    top: calc(var(--header-height) - 15px);
    z-index: 10;

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
    flex: 1;
    min-width: 0;
    --content-page-margin: #{$page-margin};
    margin: var(--content-page-margin);
    container-name: content;
    container-type: inline-size;

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
        background-color: #ffffff14;
      }

      &:hover {
        background-color: #ffffff14;
      }
    }
  }
}
</style>
