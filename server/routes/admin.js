const path    = require('path')
const router  = require('express').Router()
const User        = require('../models/User')
const Resource    = require('../models/Resource')
const Badge       = require('../models/Badge')
const Certificate = require('../models/Certificate')
const { auth, adminOnly } = require('../middleware/auth')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const QRCode = require('qrcode')
const clientUrl = (process.env.CLIENT_URL || 'https://codecircle.online').replace(/\/+$/, '')

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  { min: 10, tier: 'codeelite', badgeName: 'Titan', color: '#FFD700', emoji: '👑' },
  { min: 5,  tier: 'codeflame', badgeName: 'Catalyst',  color: '#FF6B35', emoji: '🔥' },
  { min: 1,  tier: 'codespark', badgeName: 'Spark',  color: '#7B61FF', emoji: '⚡' },
]
const resolveTier = (count) => TIERS.find(t => count >= t.min) || null

// Founder signature path
const SIGNATURE_PATH = path.join(__dirname, '../assets/founder_signature.png')

// ─── Certificate canvas generator ────────────────────────────────────────────
async function generateCertificateImage({
  userName, username, badgeName, tier, month, year,
  resourceCount, themeColor, customMessage,
  isCustom, platforms, contribution, certId,
}) {
  const W = 1200, H = 850
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  const color = themeColor ||
    (tier === 'codeelite' ? '#FFD700' :
     tier === 'codeflame' ? '#FF6B35' :
     tier === 'codespark' ? '#7B61FF' : '#5B8CFF')

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // ── Background ─────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0,   '#08080F')
  bg.addColorStop(0.5, '#0E0E1C')
  bg.addColorStop(1,   '#08080F')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Corner decorations
  const cornerSize = 60
  const corners = [[0,0],[W,0],[0,H],[W,H]]
  corners.forEach(([cx, cy]) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerSize * 2)
    grad.addColorStop(0, `${color}22`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  })

  // ── Outer border ───────────────────────────────────────────────────────────
  ctx.strokeStyle = color
  ctx.lineWidth   = 5
  ctx.strokeRect(20, 20, W - 40, H - 40)

  // Inner border
  ctx.strokeStyle = `${color}44`
  ctx.lineWidth   = 1
  ctx.strokeRect(32, 32, W - 64, H - 64)

  // ── Header strip ───────────────────────────────────────────────────────────
  ctx.fillStyle = `${color}18`
  ctx.fillRect(32, 32, W - 64, 90)

  // ── Logo / Title ───────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.font      = 'bold 22px sans-serif'
  ctx.fillText('⭕  C O D E C I R C L E', W / 2, 72)

  ctx.fillStyle = `${color}AA`
  ctx.font      = '11px sans-serif'
  ctx.fillText('Community · Learning · Growth', W / 2, 96)

  // Subtitle
  ctx.fillStyle = '#FFFFFF'
  ctx.font      = '13px sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText('CERTIFICATE  OF  ACHIEVEMENT', W / 2, 152)
  ctx.letterSpacing = '0px'

  // Thin divider
  ctx.strokeStyle = `${color}66`
  ctx.lineWidth   = 0.8
  ctx.beginPath(); ctx.moveTo(W/2 - 220, 168); ctx.lineTo(W/2 + 220, 168); ctx.stroke()

  // ── Congratulations ────────────────────────────────────────────────────────
  ctx.fillStyle = `${color}CC`
  ctx.font      = 'italic 15px sans-serif'
  ctx.fillText('Congratulations!', W / 2, 205)

  // "This certifies that"
  ctx.fillStyle = '#8888AA'
  ctx.font      = '14px sans-serif'
  ctx.fillText('This certificate is proudly presented to', W / 2, 238)

  // ── Recipient Name ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF'
  ctx.font      = 'bold 54px sans-serif'
  ctx.fillText(userName, W / 2, 308)

  if (username) {
    ctx.fillStyle = `${color}AA`
    ctx.font      = '15px sans-serif'
    ctx.fillText(`@${username}`, W / 2, 336)
  }

  // Name underline
  const nameW = ctx.measureText(userName).width
  ctx.strokeStyle = `${color}88`
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.moveTo(W/2 - nameW/2, 320)
  ctx.lineTo(W/2 + nameW/2, 320)
  ctx.stroke()

  // ── Contribution text ──────────────────────────────────────────────────────
  ctx.fillStyle = '#9999BB'
  ctx.font      = '15px sans-serif'

  if (isCustom) {
    const platformStr = (platforms || []).join(', ') || 'multiple platforms'
    ctx.fillText(
      `for outstanding contributions to the CodeCircle community through ${platformStr}`,
      W / 2, 358
    )
    if (contribution) {
      ctx.fillStyle = '#7777AA'
      ctx.font = '13px sans-serif'
      // word-wrap the contribution text
      const words = contribution.split(' ')
      let line = '', lineY = 384
      words.forEach(word => {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > W - 200) {
          ctx.fillText(line, W / 2, lineY)
          line  = word
          lineY += 20
        } else { line = test }
      })
      if (line) ctx.fillText(line, W / 2, lineY)
    }
  } else {
    ctx.fillText(
      `for sharing ${resourceCount} resource${resourceCount !== 1 ? 's' : ''} with the CodeCircle community in ${monthName} ${year}`,
      W / 2, 358
    )
    ctx.fillStyle = '#7777AA'
    ctx.font      = '13px sans-serif'
    ctx.fillText('Congratulations and thank you for your valuable contribution to student learning.', W / 2, 384)
    ctx.fillText('Your shared knowledge helps the CodeCircle community grow stronger together.', W / 2, 406)
  }

  // ── Badge pill ─────────────────────────────────────────────────────────────
  const pillW = 280, pillH = 60, pillX = W/2 - pillW/2, pillY = 420
  ctx.fillStyle = `${color}22`
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 30)
  ctx.fill()
  ctx.strokeStyle = `${color}88`
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font      = 'bold 26px sans-serif'
  ctx.fillText(badgeName, W / 2, pillY + 39)

  ctx.fillStyle = `${color}AA`
  ctx.font      = '11px sans-serif'
  ctx.fillText('Achievement Badge', W / 2, pillY + 56)

  // ── Custom message (if any) ────────────────────────────────────────────────
  if (customMessage) {
    ctx.fillStyle = `${color}BB`
    ctx.font      = 'italic 13px sans-serif'
    ctx.fillText(`"${customMessage}"`, W / 2, 510)
  }

  // ── Divider ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = `${color}33`
  ctx.lineWidth   = 1
  ctx.beginPath(); ctx.moveTo(60, 540); ctx.lineTo(W - 60, 540); ctx.stroke()

  // ── Signature section (left) ───────────────────────────────────────────────
  const sigX = 120, sigY = 560

  // Load and draw signature
  try {
    const sig = await loadImage(SIGNATURE_PATH)
    
    // Create offscreen canvas to process signature image
    const sW = sig.width
    const sH = sig.height
    const offscreen = createCanvas(sW, sH)
    const octx = offscreen.getContext('2d')
    octx.drawImage(sig, 0, 0)
    
    const imgData = octx.getImageData(0, 0, sW, sH)
    const data = imgData.data
    
    // Convert themeColor hex to RGB
    let rTheme = 255, gTheme = 255, bTheme = 255
    const match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (match) {
      rTheme = parseInt(match[1], 16)
      gTheme = parseInt(match[2], 16)
      bTheme = parseInt(match[3], 16)
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i+1]
      const b = data[i+2]
      
      const brightness = (r + g + b) / 3
      if (brightness > 200) {
        // Light background -> fully transparent
        data[i+3] = 0
      } else {
        // Dark stroke -> change to theme color or white
        data[i] = rTheme
        data[i+1] = gTheme
        data[i+2] = bTheme
        // Map stroke opacity based on darkness
        const opacity = Math.round((255 - brightness) * 1.5)
        data[i+3] = Math.min(255, opacity)
      }
    }
    octx.putImageData(imgData, 0, 0)
    // Calculate aspect ratio to avoid stretching
    const maxW = 200
    const maxH = 80
    const ratio = sW / sH
    let drawW = maxW
    let drawH = maxW / ratio
    
    if (drawH > maxH) {
      drawH = maxH
      drawW = maxH * ratio
    }
    
    // Center signature horizontally, bottom-align vertically in the signature space
    const drawX = sigX + (maxW - drawW) / 2
    const drawY = sigY + (maxH - drawH) - 10
    
    ctx.drawImage(offscreen, drawX, drawY, drawW, drawH)
  } catch (err) {
    console.error('Error drawing signature:', err)
    // Fallback text signature
    ctx.fillStyle = '#DDDDEE'
    ctx.font      = 'italic 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('DEVIDAS CHINNARATHOD', sigX, sigY + 40)
  }

  // Signature line
  ctx.strokeStyle = `${color}66`
  ctx.lineWidth   = 0.8
  ctx.beginPath(); ctx.moveTo(sigX - 20, sigY + 72); ctx.lineTo(sigX + 200, sigY + 72); ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#888'
  ctx.font      = '11px sans-serif'
  ctx.fillText('DEVIDAS CHINNARATHOD', sigX - 20, sigY + 90)
  ctx.fillStyle = `${color}99`
  ctx.font      = '10px sans-serif'
  ctx.fillText('Founder, CodeCircle Community', sigX - 20, sigY + 104)

  // ── QR Code (right) ────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  const qrVerifyUrl = `${clientUrl}/verify/${certId || 'preview'}`
  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerifyUrl, {
      width: 90, margin: 1,
      color: { dark: '#FFFFFF', light: '#00000000' },
    })
    const qrImg = await loadImage(qrDataUrl)
    const qrX = W - 160, qrY = 558
    ctx.drawImage(qrImg, qrX, qrY, 90, 90)
    ctx.fillStyle = '#555577'
    ctx.font      = '9px sans-serif'
    ctx.fillText('Scan to verify', qrX + 45, qrY + 104)
  } catch { /* QR optional */ }

  // ── Issue date (center bottom) ─────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = '#555577'
  ctx.font      = '11px sans-serif'
  ctx.fillText(`Issued: ${monthName} ${year}  ·  ${clientUrl.replace(/^https?:\/\//, '')}`, W / 2, 670)

  // Certificate ID
  ctx.fillStyle = '#333355'
  ctx.font      = '9px sans-serif'
  ctx.fillText(`Certificate ID: ${certId || 'PREVIEW'}`, W / 2, 690)

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
