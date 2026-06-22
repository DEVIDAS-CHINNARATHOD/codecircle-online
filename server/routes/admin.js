const path    = require('path')
const router  = require('express').Router()
const User        = require('../models/User')
const Resource    = require('../models/Resource')
const Badge       = require('../models/Badge')
const Certificate = require('../models/Certificate')
const { auth, adminOnly } = require('../middleware/auth')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const QRCode = require('qrcode')
const clientUrl = (process.env.CLIENT_URL || 'https://www.codecircle.online').replace(/\/+$/, '')

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  { min: 10, tier: 'codeelite', badgeName: 'Titan', color: '#FFD700', emoji: '👑' },
  { min: 5,  tier: 'codeflame', badgeName: 'Catalyst',  color: '#FF6B35', emoji: '🔥' },
  { min: 1,  tier: 'codespark', badgeName: 'Spark',  color: '#7B61FF', emoji: '⚡' },
]
const resolveTier = (count) => TIERS.find(t => count >= t.min) || null

// Founder signature path
const SIGNATURE_PATH = path.join(__dirname, '../assets/founder_signature1.png')

function wrapCenteredText(ctx, text, x, startY, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  let line = ''
  let y = startY

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = testLine
    }
  }

  if (line) ctx.fillText(line, x, y)
  return y
}

// ─── Certificate canvas generator ────────────────────────────────────────────
async function generateCertificateImage({
  userName, username, badgeName, tier, month, year,
  resourceCount, themeColor, customMessage,
  isCustom, platforms, contribution, certId,
}) {
  const W = 1280
  const H = 900
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  const palettes = {
    codeelite: { accent: '#8C6B2E', soft: '#E7D8B1' },
    codeflame: { accent: '#7A5C43', soft: '#E8D8C7' },
    codespark: { accent: '#486581', soft: '#D8E2EA' },
    custom: { accent: '#5F6C7B', soft: '#DCE2E8' },
  }
  const palette = palettes[tier] || palettes.custom
  const accent = themeColor || palette.accent
  const softAccent = palette.soft
  const ink = '#1F2933'
  const mutedInk = '#52606D'
  const paper = '#F5F1E8'
  const paperShade = '#EDE4D3'

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })
  const qrVerifyUrl = `${clientUrl}/verify/${certId || 'preview'}`

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, paper)
  bg.addColorStop(1, paperShade)
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(40, 40, W - 80, H - 80)

  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.strokeStyle = '#C7B79A'
  ctx.lineWidth = 1
  ctx.strokeRect(56, 56, W - 112, H - 112)

  ctx.fillStyle = softAccent
  ctx.fillRect(56, 56, W - 112, 92)

  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  ctx.font = 'bold 24px serif'
  ctx.fillText('CODECIRCLE COMMUNITY', W / 2, 96)

  ctx.fillStyle = mutedInk
  ctx.font = '13px serif'
  ctx.fillText('Learning  •  Sharing  •  Growth', W / 2, 122)

  ctx.fillStyle = accent
  ctx.font = 'bold 15px serif'
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 204)

  ctx.strokeStyle = '#CDBD9E'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 210, 220)
  ctx.lineTo(W / 2 + 210, 220)
  ctx.stroke()

  ctx.fillStyle = mutedInk
  ctx.font = 'italic 20px serif'
  ctx.fillText('Presented with appreciation to', W / 2, 274)

  ctx.fillStyle = ink
  ctx.font = 'bold 54px serif'
  ctx.fillText(userName, W / 2, 348)

  if (username) {
    ctx.fillStyle = mutedInk
    ctx.font = '16px sans-serif'
    ctx.fillText(`@${username}`, W / 2, 378)
  }

  const nameW = ctx.measureText(userName).width
  ctx.strokeStyle = accent
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - nameW / 2, 392)
  ctx.lineTo(W / 2 + nameW / 2, 392)
  ctx.stroke()

  ctx.fillStyle = mutedInk
  ctx.font = '18px serif'

  if (isCustom) {
    const platformStr = (platforms || []).join(', ') || 'multiple platforms'
    let bodyY = wrapCenteredText(
      ctx,
      `For outstanding contributions to the CodeCircle community through ${platformStr}.`,
      W / 2,
      450,
      W - 280,
      28
    )
    if (contribution) {
      ctx.fillStyle = ink
      ctx.font = '15px sans-serif'
      bodyY = wrapCenteredText(ctx, contribution, W / 2, bodyY + 34, W - 320, 24)
      if (customMessage) bodyY += 10
    }
  } else {
    wrapCenteredText(
      ctx,
      `For sharing ${resourceCount} resource${resourceCount !== 1 ? 's' : ''} with the CodeCircle community in ${monthName} ${year},`,
      W / 2,
      450,
      W - 280,
      28
    )
    ctx.fillStyle = ink
    ctx.font = '15px sans-serif'
    ctx.fillText('Congratulations and thank you for helping student learning grow stronger together.', W / 2, 510)
  }

  const pillW = 320
  const pillH = 68
  const pillX = W / 2 - pillW / 2
  const pillY = 560
  ctx.fillStyle = softAccent
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 18)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.font = 'bold 28px serif'
  ctx.fillText(badgeName, W / 2, pillY + 36)

  ctx.fillStyle = mutedInk
  ctx.font = '12px sans-serif'
  ctx.fillText('Achievement Badge', W / 2, pillY + 56)

  if (customMessage) {
    ctx.fillStyle = mutedInk
    ctx.font = 'italic 15px serif'
    wrapCenteredText(ctx, `"${customMessage}"`, W / 2, 670, W - 320, 24)
  }

  const sigBaseX = 150
  const sigBaseY = 720
  try {
    const sig = await loadImage(SIGNATURE_PATH)
    const sW = sig.width
    const sH = sig.height
    const offscreen = createCanvas(sW, sH)
    const octx = offscreen.getContext('2d')
    octx.drawImage(sig, 0, 0)

    const imgData = octx.getImageData(0, 0, sW, sH)
    const data = imgData.data
    const match = ink.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    const rInk = parseInt(match[1], 16)
    const gInk = parseInt(match[2], 16)
    const bInk = parseInt(match[3], 16)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      if (brightness > 245) {
        data[i + 3] = 0
      } else {
        data[i] = rInk
        data[i + 1] = gInk
        data[i + 2] = bInk
        data[i + 3] = Math.max(data[i + 3], 220)
      }
    }

    octx.putImageData(imgData, 0, 0)
    const maxW = 280
    const maxH = 88
    const ratio = sW / sH
    let drawW = maxW
    let drawH = maxW / ratio

    if (drawH > maxH) {
      drawH = maxH
      drawW = maxH * ratio
    }

    const drawX = sigBaseX
    const drawY = sigBaseY - drawH
    ctx.drawImage(offscreen, drawX, drawY, drawW, drawH)
  } catch (err) {
    console.error('Error drawing signature:', err)
    ctx.fillStyle = ink
    ctx.font = 'italic 24px serif'
    ctx.textAlign = 'left'
    ctx.fillText('Devidas C. R.', sigBaseX, sigBaseY - 20)
  }

  ctx.strokeStyle = '#C7B79A'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sigBaseX - 10, sigBaseY + 12)
  ctx.lineTo(sigBaseX + 250, sigBaseY + 12)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('DEVIDAS CHINNARATHOD', sigBaseX - 10, sigBaseY + 34)
  ctx.fillStyle = mutedInk
  ctx.font = '11px sans-serif'
  ctx.fillText('Founder, CodeCircle Community', sigBaseX - 10, sigBaseY + 54)

  ctx.textAlign = 'center'
  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerifyUrl, {
      width: 110,
      margin: 1,
      color: { dark: ink, light: '#FFFFFF' },
    })
    const qrImg = await loadImage(qrDataUrl)
    const qrX = W - 260
    const qrY = 690
    ctx.drawImage(qrImg, qrX, qrY, 110, 110)
    ctx.fillStyle = mutedInk
    ctx.font = '11px sans-serif'
    ctx.fillText('Scan to verify certificate', qrX + 55, qrY + 128)
  } catch { /* QR optional */ }

  ctx.textAlign = 'center'
  ctx.fillStyle = mutedInk
  ctx.font = '12px sans-serif'
  ctx.fillText(`Issued in ${monthName} ${year}`, W / 2, 790)
  ctx.fillText(clientUrl.replace(/^https?:\/\//, ''), W / 2, 812)
  ctx.font = '10px monospace'
  ctx.fillText(`Certificate ID: ${certId || 'PREVIEW'}`, W / 2, 836)

  return canvas.toDataURL('image/png')
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/users/:id/toggle-admin', auth, adminOnly, (_req, res) => {
  res.status(403).json({ error: 'Only one admin is allowed.' })
})

// ─── GET /api/admin/badge-candidates ─────────────────────────────────────────
router.get('/badge-candidates', auth, adminOnly, async (req, res) => {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [counts, existingCerts] = await Promise.all([
      Resource.aggregate([
        { $match: { createdAt: { $gte: new Date(year, month-1, 1), $lt: new Date(year, month, 1) } } },
        { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { count: -1 } },
        { $project: { _id: 0, userId: '$_id', count: 1, name: '$user.name', email: '$user.email', avatar: '$user.avatar', username: '$user.username' } },
      ]),
      Certificate.find({ month, year, isCustom: { $ne: true } }).select('userId tier'),
    ])

    const certMap = new Set(existingCerts.map(c => `${c.userId}-${c.tier}`))
    const candidates = counts.map(entry => {
      const tier = resolveTier(entry.count)
      return { ...entry, tier, hasCert: tier ? certMap.has(`${entry.userId}-${tier.tier}`) : false }
    })

    res.json({ month, year, candidates })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/admin/certificates ─────────────────────────────────────────────
router.get('/certificates', auth, adminOnly, async (req, res) => {
  try {
    const certs = await Certificate.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email avatar username')
      .select('-imageData')
    res.json(certs)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST /api/admin/certificates/generate ───────────────────────────────────
router.post('/certificates/generate', auth, adminOnly, async (req, res) => {
  try {
    const { userId, tier: requestedTier, themeColor, customMessage } = req.body
    if (!userId || !requestedTier) return res.status(400).json({ error: 'userId and tier are required' })

    const tierDef = TIERS.find(t => t.tier === requestedTier)
    if (!tierDef) return res.status(400).json({ error: 'Invalid tier' })

    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [user, resourceCount] = await Promise.all([
      User.findById(userId),
      Resource.countDocuments({
        submittedBy: userId,
        createdAt: { $gte: new Date(year, month-1, 1), $lt: new Date(year, month, 1) },
      }),
    ])
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Generate placeholder cert first to get _id for QR
    const placeholderCert = await Certificate.findOneAndUpdate(
      { userId, tier: tierDef.tier, month, year },
      { userId, tier: tierDef.tier, badgeName: tierDef.badgeName, month, year, resourceCount, issuedByAdmin: req.user._id, imageData: 'pending', themeColor: themeColor || null, customMessage: customMessage || null, downloaded: false },
      { upsert: true, new: true }
    )

    const imageData = await generateCertificateImage({
      userName: user.name,
      username: user.username,
      badgeName: tierDef.badgeName,
      tier: tierDef.tier,
      month, year, resourceCount,
      themeColor: themeColor || tierDef.color,
      customMessage: customMessage || null,
      isCustom: false,
      certId: String(placeholderCert._id),
    })

    placeholderCert.imageData = imageData
    await placeholderCert.save()

    // Upsert badge
    await Badge.findOneAndUpdate(
      { userId, tier: tierDef.tier, month, year },
      { userId, tier: tierDef.tier, badgeName: tierDef.badgeName, month, year, resourceCount },
      { upsert: true, new: true }
    )

    res.json({ ok: true, certificateId: placeholderCert._id, userName: user.name, tier: tierDef.tier, badgeName: tierDef.badgeName, month, year })
  } catch (err) {
    console.error('[cert generate]', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/admin/certificates/:id/edit ────────────────────────────────────
// Edit: badge name, theme color, custom message — then re-render canvas.
router.put('/certificates/:id/edit', auth, adminOnly, async (req, res) => {
  try {
    const { badgeName, themeColor, customMessage } = req.body
    const cert = await Certificate.findById(req.params.id).populate('userId', 'name username')
    if (!cert) return res.status(404).json({ error: 'Not found' })

    if (badgeName)     cert.badgeName     = badgeName
    if (themeColor)    cert.themeColor    = themeColor
    if (customMessage !== undefined) cert.customMessage = customMessage

    // Re-render certificate image
    const imageData = await generateCertificateImage({
      userName:      cert.userId.name,
      username:      cert.userId.username,
      badgeName:     cert.badgeName,
      tier:          cert.tier,
      month:         cert.month,
      year:          cert.year,
      resourceCount: cert.resourceCount,
      themeColor:    cert.themeColor,
      customMessage: cert.customMessage,
      isCustom:      cert.isCustom,
      platforms:     cert.platforms,
      contribution:  cert.contribution,
      certId:        String(cert._id),
    })
    cert.imageData  = imageData
    cert.downloaded = false // reset download state after edit
    await cert.save()

    res.json({ ok: true, certificateId: cert._id, badgeName: cert.badgeName })
  } catch (err) {
    console.error('[cert edit]', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/admin/certificates/custom ─────────────────────────────────────
// Generate a custom certificate for users who contributed on external platforms.
// Body: { userId, badgeName, platforms[], contribution, themeColor, customMessage }
router.post('/certificates/custom', auth, adminOnly, async (req, res) => {
  try {
    const { userId, badgeName, platforms, contribution, themeColor, customMessage } = req.body
    if (!userId || !badgeName) return res.status(400).json({ error: 'userId and badgeName are required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    // Create cert without unique constraint (isCustom: true)
    const cert = await Certificate.create({
      userId, tier: 'custom', badgeName, month, year,
      resourceCount: 0, issuedByAdmin: req.user._id,
      imageData: 'pending', isCustom: true,
      platforms: platforms || [], contribution: contribution || null,
      themeColor: themeColor || '#5B8CFF', customMessage: customMessage || null,
    })

    const imageData = await generateCertificateImage({
      userName: user.name, username: user.username, badgeName, tier: 'custom',
      month, year, resourceCount: 0,
      themeColor: themeColor || '#5B8CFF',
      customMessage: customMessage || null,
      isCustom: true, platforms: platforms || [],
      contribution: contribution || null,
      certId: String(cert._id),
    })

    cert.imageData = imageData
    await cert.save()

    res.json({ ok: true, certificateId: cert._id, userName: user.name, badgeName })
  } catch (err) {
    console.error('[cert custom]', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/admin/certificates/:id/download ────────────────────────────────
router.get('/certificates/:id/download', auth, adminOnly, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
    if (!cert) return res.status(404).json({ error: 'Not found' })
    res.json({ imageData: cert.imageData, badgeName: cert.badgeName })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/admin/all-users ─────────────────────────────────────────────────
// Returns all users — used by custom cert modal user picker
router.get('/all-users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 }).select('name email avatar username')
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.generateCertificateImage = generateCertificateImage
module.exports = router
