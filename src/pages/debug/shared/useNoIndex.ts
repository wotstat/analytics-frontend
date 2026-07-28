import { onMounted, onUnmounted } from 'vue'


export function useNoIndex() {
  let tag: HTMLMetaElement | null = null
  let createdByUs = false
  let previousContent: string | null = null

  onMounted(() => {
    tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]')

    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      document.head.appendChild(tag)
      createdByUs = true
    } else {
      previousContent = tag.getAttribute('content')
    }

    tag.setAttribute('content', 'noindex')
  })

  onUnmounted(() => {
    if (!tag) return

    if (createdByUs) tag.remove()
    else if (previousContent !== null) tag.setAttribute('content', previousContent)
    else tag.removeAttribute('content')

    tag = null
  })
}
