const router = require('express').Router()
const Resource = require('../models/Resource')
const { auth, adminOnly } = require('../middleware/auth')
const { cacheMiddleware, bustCache } = require('../middleware/cache')

const RESOURCES_PATTERN = '/api/resources*'

const canManageResource = (resource, user) =>
  resource && (user?.isAdmin || String(resource.submittedBy) === String(user?._id))

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// GET /api/resources — public (cached 5 min)
router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const { limit = 6, category, page = 1 } = req.query
    const query = {}
    if (category) query.category = category

    const showAll = limit === 'all'
    const pageNum = parsePositiveInt(page, 1)
    const lim     = showAll ? 0 : Math.min(parsePositiveInt(limit, 6), 200) // max 200 per page

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ createdAt: -1 })
        .skip(showAll ? 0 : (pageNum - 1) * lim)
        .limit(lim)
        .populate('submittedBy', 'name avatar'),
      Resource.countDocuments(query),
    ])

    res.json({ resources, total, hasMore: showAll ? false : total > pageNum * lim })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/resources — authenticated users can submit resources
router.post('/', auth, bustCache(RESOURCES_PATTERN), async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, submittedBy: req.user._id })
    res.status(201).json(resource)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/resources/mine — authenticated users can view their own uploads
router.get('/mine', auth, async (req, res) => {
  try {
    const resources = await Resource.find({ submittedBy: req.user._id }).sort({ createdAt: -1 })
    res.json({ resources })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/resources/:id - public resource detail
router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('submittedBy', 'name avatar username')

    if (!resource) return res.status(404).json({ error: 'Not found' })

    res.json(resource)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/resources/:id — owner or admin
router.put('/:id', auth, bustCache(RESOURCES_PATTERN), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ error: 'Not found' })

    if (!canManageResource(resource, req.user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    Object.assign(resource, req.body)
    await resource.save()
    res.json(resource)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/resources/:id — owner or admin
router.delete('/:id', auth, bustCache(RESOURCES_PATTERN), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ error: 'Not found' })

    if (!canManageResource(resource, req.user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await Resource.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
