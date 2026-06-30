<template>
  <a @click.prevent="onClick" :href="href" :class="classes">
    <slot></slot>
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'


const props = defineProps<{
  to: string;
}>()

const route = useRoute()
const router = useRouter()

const classes = computed(() => {
  const res = []

  if (route.path.startsWith(props.to)) {
    res.push('router-link-active')
  }

  if (props.to === route.path) {
    res.push('router-link-exact-active')
  }

  return res
})

const href = computed(() => {
  const url = new URL(props.to, window.location.origin)
  url.search = new URLSearchParams(route.query as Record<string, string>).toString()

  return url.pathname + url.search
})

function onClick(e: MouseEvent) {
  router.push({
    path: props.to,
    query: route.query
  })
}
</script>

<style lang="scss" scoped>
a {
  cursor: pointer;
}
</style>
