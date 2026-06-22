require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const passport = require('passport')

require('./middleware/passport')

const app = express()
let dbConnected = false
const normalizeOrigin = (value = '') => value.replace(/\/+$/, '')
const clientOrigin = normalizeOrigin(process.env.CLIENT_URL)

if (!clientOrigin) {
  throw new Error('CLIENT_URL is required')
}

// CORS — in production lock this to your Vercel domain
app.use(cors({
  origin: clientOrigin,
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(passport.initialize())

app.get('/', (_req, res) => {
  res.json({
    service: 'codecircle-api',
    status: dbConnected ? 'ok' : 'degraded',
    dbConnected,
    health: '/api/health',
  })
})

app.use('/api', (req, res, next) => {
  if (!dbConnected && req.path !== '/health') {
    return res.status(503).json({
      error: 'Database is not connected. Please check MONGODB_URI credentials and Atlas network access.',
    })
  }
  next()
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/posts', require('./routes/posts'))
app.use('/api/resources', require('./routes/resources'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/badges', require('./routes/badges'))
app.use('/api/certificates', require('./routes/certificates'))
app.use('/api/users', require('./routes/users'))

// Health
app.get('/api/health', (_req, res) => {
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    dbConnected,
  })
})

// Listen first so API is reachable even if DB is misconfigured.
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// MongoDB connection status
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    dbConnected = true
    console.log('MongoDB connected')
  })
  .catch(err => {
    dbConnected = false
    console.error('MongoDB connection failed:', err)
  })
