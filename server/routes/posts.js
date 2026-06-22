const router = require('express').Router()
const Post = require('../models/Post')
const { auth, adminOnly } = require('../middleware/auth')
const { cacheMiddleware, bustCache } = require('../middleware/cache')

const POSTS_PATTERN = '/api/posts*'

// GET /api/posts — public (cached 5 min)
router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const { page = 1, limit = 9, search, category } = req.query
    const query = {}
    if (search) query.$text = { $search: search }
    if (category) query.category = category
    const skip = (Number(page) - 1) * Number(limit)
    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('author', 'name avatar'),
      Post.countDocuments(query),
    ])
    res.json({ posts, total, totalPages: Math.ceil(total / Number(limit)), page: Number(page) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/:id — public (cached 10 min — individual posts change rarely)
router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name avatar')
    if (!post) return res.status(404).json({ error: 'Not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/posts — admin only
router.post('/', auth, adminOnly, bustCache(POSTS_PATTERN), async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, author: req.user._id })
    res.status(201).json(post)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/posts/:id — admin only
router.put('/:id', auth, adminOnly, bustCache(POSTS_PATTERN), async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!post) return res.status(404).json({ error: 'Not found' })
    res.json(post)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/posts/:id — admin only
router.delete('/:id', auth, adminOnly, bustCache(POSTS_PATTERN), async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
