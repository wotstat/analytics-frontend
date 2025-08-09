<template>
  <a @click.prevent="onClick" :class="classes">
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


function onClick(e: MouseEvent) {
  router.push({
    path: props.to,
    query: route.query
  })
}
</script>
