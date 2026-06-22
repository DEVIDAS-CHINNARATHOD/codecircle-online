const router = require('express').Router()
const Resource = require('../models/Resource')
const Badge = require('../models/Badge')
const { auth } = require('../middleware/auth')

const TIERS = [
  { min: 10, tier: 'codeelite',  badgeName: 'Titan'  },
  { min: 5,  tier: 'codeflame',  badgeName: 'Catalyst'  },
  { min: 1,  tier: 'codespark',  badgeName: 'Spark'  },
]

/** Determine the highest badge tier for a resource count */
const resolveTier = (count) => TIERS.find(t => count >= t.min) || null

// ─── GET /api/badges/mine ─────────────────────────────────────────────────────
// Returns all badges earned by the current user + current month progress.
router.get('/mine', auth, async (req, res) => {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [badges, currentMonthCount] = await Promise.all([
      Badge.find({ userId: req.user._id }).sort({ year: -1, month: -1 }),
      Resource.countDocuments({
        submittedBy: req.user._id,
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt:  new Date(year, month, 1),
        },
      }),
    ])

    const currentTier = resolveTier(currentMonthCount)

    res.json({
      badges,
      currentMonth: {
        month,
        year,
        resourceCount: currentMonthCount,
        currentTier,
        nextTier: currentMonthCount < 1  ? TIERS[2] :
                  currentMonthCount < 5  ? TIERS[1] :
                  currentMonthCount < 10 ? TIERS[0] : null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/badges/leaderboard ─────────────────────────────────────────────
// Top contributors for the current calendar month, ranked by resource count.
router.get('/leaderboard', async (req, res) => {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const leaders = await Resource.aggregate([
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
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          count: 1,
          name:   '$user.name',
          avatar: '$user.avatar',
        },
      },
    ])

    const ranked = leaders.map((entry, i) => ({
      ...entry,
      rank: i + 1,
      tier: resolveTier(entry.count),
    }))

    res.json({ month, year, leaderboard: ranked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
