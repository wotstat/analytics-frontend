
const base = (() => {
  if (typeof location === 'undefined') return { prefix: '', domain: 'wotstat.info' }
  if (import.meta.env.MODE === 'development') return { prefix: '', domain: 'mtstat.info' }

  const matchWot = location.host.match(/^(.*)\.wotstat\.info$/i)
  if (matchWot) return { prefix: `${matchWot[1]}.`, domain: 'wotstat.info' }

  const matchMt = location.host.match(/^(.*)\.mtstat\.info$/i)
  if (matchMt) return { prefix: `${matchMt[1]}.`, domain: 'mtstat.info' }

  return { prefix: '', domain: 'wotstat.info' }
})()

export const CLICKHOUSE_URL = `https://${base.prefix}db.${base.domain}`
export const CLICKHOUSE_WEB_PROXY_URL = import.meta.env.VITE_META_RENDERER ? location.origin : `https://${base.prefix}${base.domain}`
export const ANALYTICS_REALTIME_URL = `https://${base.prefix}realtime.${base.domain}`
export const STATIC_URL = `https://${base.prefix}static.${base.domain}`
export const WIDGETS_URL = `https://${base.prefix}widgets.${base.domain}`
export const POSITIONS_URL = `https://${base.prefix}positions.${base.domain}`
export const INSTALL_URL = `https://${base.prefix}install.${base.domain}`
export const DISCORD_URL = 'https://discord.gg/7K8W9JE6xU'

export const CURRENT_URL_PREFIX = base.prefix
