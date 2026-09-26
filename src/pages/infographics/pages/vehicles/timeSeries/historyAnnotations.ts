export type VersionHistoryAnnotation = {
  timestamp: number
  label: string
  kind: 'version' | 'patch' | 'micropatch'
}

export type HistoryEventAnnotation = {
  id: string
  timestamp: number
  endTimestamp?: number
  label: string
  kind: 'event'
  color: string
}

export type HistoryAnnotation = VersionHistoryAnnotation | HistoryEventAnnotation

export const versionAnnotationColors = {
  version: '#f1c578ff',
  patch: '#b6cde6ff',
  micropatch: '#ffffff80',
}

export const outageAnnotationColor = '#eb6759'
