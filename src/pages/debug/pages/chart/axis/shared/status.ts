import { isErrorStatus, loading, type Status } from '@/db'

export function statusText(status: Status, count: number) {
  if (status === loading) return 'запрос выполняется…'
  if (isErrorStatus(status)) return `ошибка запроса: ${status.reason}`
  return `данные получены, точек: ${count}`
}
