/**
 * GET /api/users/:id/public
 * Returns a user's public profile — name, avatar, badges, monthly resource count, and leaderboard rank.
 * This endpoint is public (no auth required).
 */
const router = require('express').Router()
const User     = require('../models/User')
const Badge    = require('../models/Badge')
const Resource = require('../models/Resource')

router.get('/:id/public', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar createdAt')
    if (!user) return res.status(404).json({ error: 'User not found' })

    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [badges, monthlyCount, totalCount, leaderboard] = await Promise.all([
      Badge.find({ userId: user._id }).sort({ year: -1, month: -1 }),
      Resource.countDocuments({
        submittedBy: user._id,
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt:  new Date(year, month, 1),
        },
      }),
      Resource.countDocuments({ submittedBy: user._id }),
      // Rank: count users with more monthly resources
      Resource.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(year, month - 1, 1),
              $lt:  new Date(year, month, 1),
            },
          },
        },
        { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).then(rows => {
        const idx = rows.findIndex(r => String(r._id) === String(user._id))
        return idx >= 0 ? idx + 1 : null
      }),
    ])

    res.json({
      user: { _id: user._id, name: user.name, avatar: user.avatar, memberSince: user.createdAt },
      badges,
      stats: { totalResources: totalCount, monthlyResources: monthlyCount, rank: leaderboard },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
