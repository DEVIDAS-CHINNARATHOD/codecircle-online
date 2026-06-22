/**
 * Redis client singleton using the official `redis` npm package.
 *
 * Credentials are read from the REDIS_* environment variables.
 * If they are not set, the module exports a no-op stub so the app
 * runs fine without Redis — it just won't cache anything.
 *
 * Connection is lazy: we call connect() once and reuse the same client.
 */
const { createClient } = require('redis')

let client = null
let connected = false

if (
  process.env.REDIS_HOST &&
  process.env.REDIS_PORT &&
  process.env.REDIS_PASSWORD
) {
  client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  })

  client.on('error', (err) => console.warn('[Redis] Client Error:', err.message))
  client.on('ready', () => { connected = true;  console.log('[Redis] ready') })
  client.on('end',   () => { connected = false; console.warn('[Redis] disconnected') })

  // Connect once at startup (non-blocking — errors handled above)
  client.connect().catch((err) => console.warn('[Redis] connect failed:', err.message))
} else {
  console.warn('[Redis] Credentials not set — caching disabled.')
}

/**
 * Safe wrapper — every method silently swallows errors when Redis is down.
 */
const cache = {
  /** @param {string} key */
  async get(key) {
    if (!client || !connected) return null
    try { return await client.get(key) } catch { return null }
  },

  /** @param {string} key  @param {string} value  @param {number} ttlSeconds */
  async set(key, value, ttlSeconds = 300) {
    if (!client || !connected) return
    try { await client.set(key, value, { EX: ttlSeconds }) } catch { /* silent */ }
  },

  /** @param {string|string[]} keys */
  async del(keys) {
    if (!client || !connected) return
    const arr = Array.isArray(keys) ? keys : [keys]
    try { if (arr.length) await client.del(arr) } catch { /* silent */ }
  },

  /**
   * Delete all keys matching a glob pattern.
   * @param {string} pattern  e.g. '/api/resources*'
   */
  async delPattern(pattern) {
    if (!client || !connected) return
    try {
      const keys = await client.keys(pattern)
      if (keys.length) await client.del(keys)
    } catch { /* silent */ }
  },

  isEnabled: () => Boolean(client && connected),
}

module.exports = cache
