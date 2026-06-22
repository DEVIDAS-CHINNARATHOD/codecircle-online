import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Trophy, BookOpen, CalendarDays, Copy, Check, ExternalLink } from 'lucide-react'
import { getApiBase } from '../lib/utils'
import BadgeCard, { TIER_META } from '../components/BadgeCard'
import Seo from '../components/Seo'

const API = getApiBase()

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError(null)
    // Try username first, fall back to ID-based lookup
    axios.get(`${API}/users/by-username/${username}`)
      .then(res => setProfile(res.data))
      .catch(() =>
        // Could be an old ObjectId link — try that too
        axios.get(`${API}/users/${username}/public`)
          .then(res => setProfile(res.data))
          .catch(() => setError('Profile not found.'))
      )
      .finally(() => setLoading(false))
  }, [username])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">🔍</div>
        <div className="text-neutral-400 text-lg">{error || 'Profile not found.'}</div>
        <Link to="/" className="btn-ghost text-sm">← Back to home</Link>
      </div>
    )
  }

  const { user, badges, stats } = profile
  const topBadge  = badges[0]
  const topMeta   = topBadge ? TIER_META[topBadge.tier] : null
  const memberYear = new Date(user.memberSince).getFullYear()

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title={`${user.name} (@${user.username || 'user'}) — CodeCircle`}
        description={`${user.name} has shared ${stats.totalResources} resources on CodeCircle.${topBadge ? ` Earned the ${topBadge.badgeName} badge.` : ''}`}
        path={`/u/${user.username || user._id}`}
      />

      <div className="container-width max-w-2xl mx-auto space-y-8">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 flex flex-col items-center text-center gap-5"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full border-2 border-white/20 shadow-2xl"
            />
            {topMeta && (
              <div className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-lg ${topMeta.bg}`}>
                {topMeta.icon}
              </div>
            )}
          </div>

          {/* Name + username */}
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            {user.username && (
              <p className="text-sm text-neutral-500 mt-0.5 font-mono">@{user.username}</p>
            )}
            <p className="text-xs text-neutral-600 mt-2 flex items-center justify-center gap-1.5">
              <CalendarDays size={12} /> CodeCircle contributor since {memberYear}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalResources}</div>
              <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1 justify-center"><BookOpen size={11} /> Total shared</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.monthlyResources}</div>
              <div className="text-xs text-neutral-500 mt-0.5">This month</div>
            </div>
            {stats.rank && (
              <>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white flex items-center gap-1 justify-center">
                    <Trophy size={18} className="text-yellow-400" />#{stats.rank}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">Leaderboard</div>
                </div>
              </>
            )}
          </div>

          {/* Share / copy */}
          <button onClick={copyLink} className="btn-ghost text-xs flex items-center gap-2">
            {copied
              ? <><Check size={13} className="text-green-400" /> Link copied!</>
              : <><Copy size={13} /> Copy profile link</>
            }
          </button>
        </motion.div>

        {/* ── Badges ───────────────────────────────────────────────────── */}
        {badges.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Badges Earned</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map(badge => (
                <BadgeCard
                  key={badge._id}
                  tier={badge.tier}
                  month={badge.month}
                  year={badge.year}
                  count={badge.resourceCount}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-center text-sm text-neutral-500">
            No badges yet — check back next month!
          </div>
        )}

        {/* ── Back ─────────────────────────────────────────────────────── */}
        <div className="text-center">
          <Link to="/" className="text-xs text-neutral-600 hover:text-white transition-colors inline-flex items-center gap-1.5">
            <ExternalLink size={12} /> Explore CodeCircle
          </Link>
        </div>
      </div>
    </div>
  )
}
