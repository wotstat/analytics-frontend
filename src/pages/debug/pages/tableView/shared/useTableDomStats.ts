import { onUnmounted, ref, type Ref } from 'vue'

// Таблица не реактивная и о Vue не знает, поэтому единственный честный способ
// показать её состояние — периодически смотреть в настоящий DOM.

export type TableDomStats = {
  scrollCells: number
  fallbackCells: number
  sections: number
  tableNodes: number
  documentNodes: number
  declaredHeight: number
  scrollHeight: number
}

const empty: TableDomStats = {
  scrollCells: 0,
  fallbackCells: 0,
  sections: 0,
  tableNodes: 0,
  documentNodes: 0,
  declaredHeight: 0,
  scrollHeight: 0,
}

export function useTableDomStats(container: Ref<HTMLElement | null>, intervalMs = 300) {
  const stats = ref<TableDomStats>({ ...empty })

  function refresh() {
    const root = container.value?.querySelector('.reusable-table-root')
    if (!root) {
      stats.value = { ...empty, documentNodes: document.getElementsByTagName('*').length }
      return
    }

    const scroll = root.querySelector<HTMLElement>('.scroll')
    const content = root.querySelector<HTMLElement>('.scroll > .content')

    stats.value = {
      scrollCells: root.querySelectorAll('.scroll .content-container > *').length,
      fallbackCells: root.querySelectorAll('.fallback-scroll .content-container > *').length,
      sections: root.querySelectorAll('.scroll .section').length,
      tableNodes: root.getElementsByTagName('*').length,
      documentNodes: document.getElementsByTagName('*').length,
      declaredHeight: content ? Math.round(parseFloat(content.style.height) || 0) : 0,
      scrollHeight: scroll?.scrollHeight ?? 0,
    }
  }

  const timer = setInterval(refresh, intervalMs)
  onUnmounted(() => clearInterval(timer))

  return { stats, refresh }
}
