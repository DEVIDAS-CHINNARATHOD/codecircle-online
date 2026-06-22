const router = require('express').Router()
const Certificate = require('../models/Certificate')
const { auth } = require('../middleware/auth')

// ─── GET /api/certificates/mine ───────────────────────────────────────────────
// Returns all certificates issued to the logged-in user (without heavy imageData).
router.get('/mine', auth, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id })
      .sort({ year: -1, month: -1 })
      .select('-imageData')
    res.json({ certificates: certs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/certificates/:id/download ──────────────────────────────────────
// Returns imageData for download. Only the certificate owner can access it.
router.get('/:id/download', auth, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
    if (!cert) return res.status(404).json({ error: 'Not found' })
    if (String(cert.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Mark as downloaded
    if (!cert.downloaded) {
      cert.downloaded = true
      await cert.save()
    }

    res.json({ imageData: cert.imageData, badgeName: cert.badgeName })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
