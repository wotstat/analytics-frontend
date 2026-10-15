export const LEADERBOARD_QUERY_OPTIONS = {
  cache: { ttl: 60 * 60 },
  proxyCache: true,
  // SQL-комментарий меняет ключ прокси, но не AST-ключ кеша ClickHouse.
  settings: { use_query_cache: 0 },
} as const
