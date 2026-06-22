/**
 * Express caching middleware using Redis.
 *
 * Usage (apply to public GET routes):
 *   router.get('/', cacheMiddleware(300), handler)   // 300 s TTL
 *
 * Cache busting (apply to POST/PUT/DELETE routes):
 *   router.post('/', auth, bustCache('/api/resources*'), handler)
 *
 * Cache key = mounted request path + sorted query string, so
 *   /api/resources?limit=12 and /api/posts?limit=12 are stored separately.
 */
const cache = require('../lib/redis')

/**
 * Build a stable, sorted cache key from the request.
 * @param {import('express').Request} req
 */
const buildKey = (req) => {
  const mountedPath = `${req.baseUrl}${req.path}`.replace(/\/+$/, '') || '/'
  const sorted = new URLSearchParams(
    Object.entries(req.query).sort(([a], [b]) => a.localeCompare(b))
  ).toString()
  return sorted ? `${mountedPath}?${sorted}` : mountedPath
}

/**
 * Cache middleware factory.
 * @param {number} [ttl=300]  TTL in seconds
 */
const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
  // Skip if Redis is not ready yet (graceful degradation)
  if (!cache.isEnabled()) return next()

  const key = buildKey(req)

  try {
    const cached = await cache.get(key)
    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('Content-Type', 'application/json')
      return res.send(cached)
    }
  } catch {
    // If Redis.get fails, just proceed normally
    return next()
  }

  // Monkey-patch res.json to intercept and cache the response
  const originalJson = res.json.bind(res)
  res.json = (body) => {
    res.setHeader('X-Cache', 'MISS')
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const serialised = JSON.stringify(body)
      cache.set(key, serialised, ttl) // fire-and-forget
    }
    return originalJson(body)
  }

  next()
}

/**
 * Cache-bust middleware — deletes all Redis keys matching each pattern.
 * Attach this as middleware on mutating routes (POST, PUT, DELETE).
 *
 * @param {...string} patterns  glob pattern(s) e.g. '/api/resources*'
 */
const bustCache = (...patterns) => async (_req, _res, next) => {
  if (cache.isEnabled()) {
    await Promise.all(patterns.map(p => cache.delPattern(p))).catch(() => {})
  }
  next()
}

module.exports = { cacheMiddleware, bustCache }
