/**
 * Public user profile routes — no auth required.
 *
 * GET /api/users/:id/public          look up by MongoDB ObjectId
 * GET /api/users/by-username/:uname  look up by unique username
 */
const router   = require('express').Router()
const User     = require('../models/User')
const Badge    = require('../models/Badge')
const Resource = require('../models/Resource')

async function buildPublicProfile(user) {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [badges, monthlyCount, totalCount, leaderboardRank] = await Promise.all([
    Badge.find({ userId: user._id }).sort({ year: -1, month: -1 }),

    Resource.countDocuments({
      submittedBy: user._id,
      createdAt: {
        $gte: new Date(year, month - 1, 1),
        $lt:  new Date(year, month, 1),
      },
    }),

    Resource.countDocuments({ submittedBy: user._id }),

    // Rank among current-month contributors
    Resource.aggregate([
      { $match: { createdAt: { $gte: new Date(year, month-1, 1), $lt: new Date(year, month, 1) } } },
      { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).then(rows => {
      const idx = rows.findIndex(r => String(r._id) === String(user._id))
      return idx >= 0 ? idx + 1 : null
    }),
  ])

  return {
    user: {
      _id:         user._id,
      name:        user.name,
      username:    user.username,
      avatar:      user.avatar,
      memberSince: user.createdAt,
    },
    badges,
    stats: {
      totalResources:   totalCount,
      monthlyResources: monthlyCount,
      rank:             leaderboardRank,
    },
  }
}

// GET /api/users/by-username/:uname
router.get('/by-username/:uname', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.uname.toLowerCase() })
      .select('name username avatar createdAt')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(await buildPublicProfile(user))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/:id/public
router.get('/:id/public', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name username avatar createdAt')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(await buildPublicProfile(user))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
