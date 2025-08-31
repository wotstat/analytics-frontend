import { onMounted, onUnmounted, ref, watch } from 'vue'
import './styles.scss'

const scrollRequested = ref(0)

export function requestNoScroll() {
  scrollRequested.value++
}

export function releaseNoScroll() {
  if (scrollRequested.value > 0) scrollRequested.value--
}

export function useNoScroll() {
  onMounted(() => requestNoScroll())
  onUnmounted(() => releaseNoScroll())
}


function enableNoScroll() {
  document.documentElement.classList.add('no-scroll')
  if (document.documentElement.scrollHeight > window.innerHeight) document.documentElement.classList.add('scrollbar-gutter')
}

function disableNoScroll() {
  document.documentElement.classList.remove('no-scroll', 'scrollbar-gutter')
}

watch(scrollRequested, (val, old) => {
  if (old == 0 && val !== 0) enableNoScroll()
  else if (old !== 0 && val === 0) disableNoScroll()
})
