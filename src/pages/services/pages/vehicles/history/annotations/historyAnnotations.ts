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
}

export type HistoryAnnotation = VersionHistoryAnnotation | HistoryEventAnnotation
