const passport   = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User       = require('../models/User')

const serverUrl = process.env.SERVER_URL
if (!serverUrl) throw new Error('SERVER_URL is required')

/**
 * Generate a URL-safe username from a display name.
 * e.g. "Devidas Chinnarathod" → "devidas_chinnarathod"
 * If it collides, append a short random suffix.
 */
async function generateUsername(displayName) {
  const base = (displayName || 'codecircle_user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'codecircle_user'

  let candidate = base
  let attempt   = 0

  while (attempt < 10) {
    const exists = await User.findOne({ username: candidate })
    if (!exists) return candidate
    candidate = `${base}_${Math.random().toString(36).slice(2, 6)}`
    attempt++
  }

  // Last-resort: timestamp suffix
  return `${base}_${Date.now().toString(36)}`
}

const isDuplicateUsernameError = (err) =>
  err?.code === 11000 && (err.keyPattern?.username || err.keyValue?.username)

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${serverUrl}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id })

        if (!user) {
          const count    = await User.countDocuments()
          for (let attempt = 0; attempt < 5; attempt++) {
            const username = await generateUsername(profile.displayName)
            try {
              user = await User.create({
                googleId: profile.id,
                name:     profile.displayName,
                username,
                email:    profile.emails[0].value,
                avatar:   profile.photos[0]?.value,
                isAdmin:  count === 0,
              })
              break
            } catch (err) {
              if (!isDuplicateUsernameError(err) || attempt === 4) throw err
            }
          }
        } else if (!user.username) {
          // Back-fill username for existing users who signed up before this feature
          user.username = await generateUsername(user.name)
          await user.save()
        }

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)
