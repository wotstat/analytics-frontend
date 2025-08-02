

const prefix = (() => {
  const match = location.host.match(/^(.*)\.wotstat\.info$/i)
  return match ? `${match[1]}.` : ''
})()

export const CLICKHOUSE_URL = `https://${prefix}db.wotstat.info`;
export const ANALYTICS_REALTIME_URL = `https://${prefix}realtime.wotstat.info`;
export const STATIC_URL = `https://${prefix}static.wotstat.info`;
export const WIDGETS_URL = `https://${prefix}widgets.wotstat.info`;
export const POSITIONS_URL = `https://${prefix}positions.wotstat.info`;
export const INSTALL_URL = `https://${prefix}install.wotstat.info`;
export const DISCORD_URL = 'https://discord.gg/7K8W9JE6xU';

export const CURRENT_URL_PREFIX = prefix;