

const prefix = (() => {
  const match = location.host.match(/^(.*)\.widgets\.wotstat\.info$/i)
  return match ? `${match[1]}.` : ''
})()

export const CLICKHOUSE_URL = import.meta.env.VITE_CLICKHOUSE_URL || `https://${prefix}db.wotstat.info`;
export const ANALYTICS_REALTIME_URL = import.meta.env.VITE_ANALYTICS_REALTIME_URL || `https://${prefix}realtime.wotstat.info`;
export const STATIC_URL = import.meta.env.VITE_STATIC_URL || `https://${prefix}static.wotstat.info`;
export const WIDGETS_URL = import.meta.env.VITE_WIDGETS_URL || `https://${prefix}widgets.wotstat.info`;