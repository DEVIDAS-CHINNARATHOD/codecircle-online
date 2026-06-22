const router = require('express').Router()
const User        = require('../models/User')
const Resource    = require('../models/Resource')
const Badge       = require('../models/Badge')
const Certificate = require('../models/Certificate')
const { auth, adminOnly } = require('../middleware/auth')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const TIERS = [
  { min: 10, tier: 'codeelite',  badgeName: 'CodeElite',  color: '#FFD700' },
  { min: 5,  tier: 'codeflame',  badgeName: 'CodeFlame',  color: '#FF6B35' },
  { min: 1,  tier: 'codespark',  badgeName: 'CodeSpark',  color: '#7B61FF' },
]

const resolveTier = (count) => TIERS.find(t => count >= t.min) || null

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin role is fixed — contributors cannot be promoted.
router.patch('/users/:id/toggle-admin', auth, adminOnly, async (_req, res) => {
  res.status(403).json({ error: 'Only one admin is allowed. Contributors cannot be promoted.' })
})

// ─── GET /api/admin/badge-candidates ─────────────────────────────────────────
// List all users with their current-month resource share count + auto-suggested tier.
router.get('/badge-candidates', auth, adminOnly, async (req, res) => {
  try {
    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [counts, existingCerts] = await Promise.all([
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
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            count: 1,
            name:   '$user.name',
            email:  '$user.email',
            avatar: '$user.avatar',
          },
        },
      ]),
      Certificate.find({ month, year }).select('userId tier'),
    ])

    const certMap = new Set(existingCerts.map(c => `${c.userId}-${c.tier}`))

    const candidates = counts.map(entry => {
      const tier = resolveTier(entry.count)
      const hasCert = tier ? certMap.has(`${entry.userId}-${tier.tier}`) : false
      return { ...entry, tier, hasCert }
    })

    res.json({ month, year, candidates })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/admin/certificates ─────────────────────────────────────────────
router.get('/certificates', auth, adminOnly, async (req, res) => {
  try {
    const certs = await Certificate.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email avatar')
      .select('-imageData') // don't return the heavy base64 in the list
    res.json(certs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/admin/certificates/generate ───────────────────────────────────
// Body: { userId, tier }  — generates a certificate image and saves to DB.
router.post('/certificates/generate', auth, adminOnly, async (req, res) => {
  try {
    const { userId, tier: requestedTier } = req.body
    if (!userId || !requestedTier) {
      return res.status(400).json({ error: 'userId and tier are required' })
    }

    const tierDef = TIERS.find(t => t.tier === requestedTier)
    if (!tierDef) return res.status(400).json({ error: 'Invalid tier' })

    const [user, resourceCount] = await Promise.all([
      User.findById(userId),
      Resource.countDocuments({
        submittedBy: userId,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt:  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      }),
    ])

    if (!user) return res.status(404).json({ error: 'User not found' })

    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    // ── Generate certificate canvas image ────────────────────────────────────
    const W = 1200, H = 848
    const canvas = createCanvas(W, H)
    const ctx    = canvas.getContext('2d')

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0,   '#0D0D1A')
    bg.addColorStop(0.5, '#111128')
    bg.addColorStop(1,   '#0D0D1A')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Decorative border
    ctx.strokeStyle = tierDef.color
    ctx.lineWidth   = 6
    ctx.strokeRect(24, 24, W - 48, H - 48)

    // Inner border (thin)
    ctx.strokeStyle = `${tierDef.color}55`
    ctx.lineWidth   = 1.5
    ctx.strokeRect(36, 36, W - 72, H - 72)

    // Title — CodeCircle
    ctx.fillStyle   = tierDef.color
    ctx.font        = 'bold 28px sans-serif'
    ctx.textAlign   = 'center'
    ctx.fillText('CodeCircle', W / 2, 110)

    // Certificate of Achievement
    ctx.fillStyle = '#FFFFFF'
    ctx.font      = '18px sans-serif'
    ctx.fillText('Certificate of Achievement', W / 2, 148)

    // Divider
    ctx.strokeStyle = `${tierDef.color}88`
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(W / 2 - 200, 172)
    ctx.lineTo(W / 2 + 200, 172)
    ctx.stroke()

    // "This certifies that"
    ctx.fillStyle = '#9999BB'
    ctx.font      = '16px sans-serif'
    ctx.fillText('This certifies that', W / 2, 218)

    // Recipient name
    ctx.fillStyle = '#FFFFFF'
    ctx.font      = 'bold 52px sans-serif'
    ctx.fillText(user.name, W / 2, 296)

    // Description
    ctx.fillStyle = '#9999BB'
    ctx.font      = '17px sans-serif'
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })
    ctx.fillText(`has shared ${resourceCount} resource${resourceCount !== 1 ? 's' : ''} on CodeCircle in ${monthName} ${year}`, W / 2, 348)

    // Badge tier label
    const badgeY = 460
    ctx.fillStyle = tierDef.color
    ctx.font      = 'bold 42px sans-serif'
    ctx.fillText(tierDef.badgeName, W / 2, badgeY)

    // Tier badge subtitle
    ctx.fillStyle = '#7777AA'
    ctx.font      = '15px sans-serif'
    ctx.fillText('Achievement Tier', W / 2, badgeY + 34)

    // Bottom bar
    ctx.fillStyle = `${tierDef.color}22`
    ctx.fillRect(36, H - 120, W - 72, 1)

    ctx.fillStyle = '#666699'
    ctx.font      = '13px sans-serif'
    ctx.fillText(`Issued by CodeCircle Admin  ·  ${monthName} ${year}`, W / 2, H - 72)
    ctx.fillText('codecircle.online', W / 2, H - 48)

    // Encode to base64
    const imageData = canvas.toDataURL('image/png')

    // Upsert certificate (re-generate if already exists)
    const cert = await Certificate.findOneAndUpdate(
      { userId, tier: tierDef.tier, month, year },
      {
        userId,
        tier: tierDef.tier,
        badgeName: tierDef.badgeName,
        month,
        year,
        resourceCount,
        issuedByAdmin: req.user._id,
        imageData,
        downloaded: false,
      },
      { upsert: true, new: true }
    )

    // Also upsert the corresponding badge
    await Badge.findOneAndUpdate(
      { userId, tier: tierDef.tier, month, year },
      {
        userId,
        tier: tierDef.tier,
        badgeName: tierDef.badgeName,
        month,
        year,
        resourceCount,
      },
      { upsert: true, new: true }
    )

    // Return without the heavy imageData
    res.json({
      ok: true,
      certificateId: cert._id,
      userName: user.name,
      tier: tierDef.tier,
      badgeName: tierDef.badgeName,
      month,
      year,
    })
  } catch (err) {
    console.error('[Certificate generate]', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/admin/certificates/:id/download ────────────────────────────────
// Returns the full base64 PNG for download (admin only in this route).
router.get('/certificates/:id/download', auth, adminOnly, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
    if (!cert) return res.status(404).json({ error: 'Not found' })
    res.json({ imageData: cert.imageData, badgeName: cert.badgeName })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
