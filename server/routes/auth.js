const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { auth } = require('../middleware/auth')
const clientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '')
const serverUrl = (process.env.SERVER_URL || '').replace(/\/+$/, '')

const isPlaceholder = (value = '') =>
  !value || value.startsWith('your_') || value.includes('replace_me')

const normalizeRedirectTo = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/submit-resource'
  if (value.startsWith('//')) return '/submit-resource'
  return value
}

const ensureGoogleOAuthConfigured = (req, res, next) => {
  const missing = []
  if (isPlaceholder(process.env.GOOGLE_CLIENT_ID)) missing.push('GOOGLE_CLIENT_ID')
  if (isPlaceholder(process.env.GOOGLE_CLIENT_SECRET)) missing.push('GOOGLE_CLIENT_SECRET')
  if (isPlaceholder(process.env.CLIENT_URL)) missing.push('CLIENT_URL')
  if (isPlaceholder(process.env.SERVER_URL)) missing.push('SERVER_URL')

  if (missing.length) {
    return res.status(500).json({
      message: `Google OAuth is not configured. Missing/placeholder env vars: ${missing.join(', ')}`,
    })
  }

  next()
}

const makeToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })

const buildGoogleAuthUrl = (redirectTo) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${serverUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: redirectTo,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Initiate Google OAuth
router.get('/google', ensureGoogleOAuthConfigured, (req, res) => {
  const redirectTo = normalizeRedirectTo(req.query.redirectTo)
  res.redirect(buildGoogleAuthUrl(redirectTo))
})

// Google OAuth callback
router.get(
  '/google/callback',
  ensureGoogleOAuthConfigured,
  passport.authenticate('google', { session: false, failureRedirect: `${clientUrl}/?auth=failed` }),
  (req, res) => {
    const token = makeToken(req.user)
    const user = {
      _id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      isAdmin: req.user.isAdmin,
    }
    const encoded = encodeURIComponent(JSON.stringify(user))
    const redirectTo = normalizeRedirectTo(req.query.state)
    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${encoded}&redirectTo=${encodeURIComponent(redirectTo)}`)
  }
)

// Get current user
router.get('/me', auth, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    avatar: req.user.avatar,
    isAdmin: req.user.isAdmin,
  })
})

module.exports = router
