import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit2, Plus, Save, Sparkles, UploadCloud, X,
  Award, Download, Share2, Trophy, ChevronRight,
  Zap, Flame, Crown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../components/CategoriesSection'
import { fileToDataUrl, getApiBase } from '../lib/utils'
import Seo from '../components/Seo'
import BadgeCard, { TIER_META } from '../components/BadgeCard'
import ShareCard from '../components/ShareCard'

const API = getApiBase()

const emptyForm = { title: '', description: '', category: '', link: '', image: '' }

const TIER_ORDER = ['codespark', 'codeflame', 'codeelite']
const TIER_THRESHOLDS = { codespark: 1, codeflame: 5, codeelite: 10 }

export default function Dashboard() {
  const { user, loading, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  // Resource form
  const [resources, setResources]           = useState([])
  const [form, setForm]                     = useState(emptyForm)
  const [editingId, setEditingId]           = useState(null)
  const [submitting, setSubmitting]         = useState(false)
  const [message, setMessage]               = useState('')
  const [loadingResources, setLoadingResources] = useState(true)

  // Badges & certificates
  const [badgeData, setBadgeData]           = useState(null)  // { badges, currentMonth }
  const [certificates, setCertificates]     = useState([])
  const [loadingBadges, setLoadingBadges]   = useState(true)

  // Leaderboard (for rank)
  const [leaderboard, setLeaderboard]       = useState([])

  // UI
  const [showShare, setShowShare]           = useState(false)
  const [downloading, setDownloading]       = useState(null) // cert._id

  useEffect(() => {
    if (!loading && !user) loginWithGoogle('/dashboard')
  }, [loading, user, loginWithGoogle])

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoadingResources(true)
    setLoadingBadges(true)

    try {
      const [resRes, badgeRes, certRes, lbRes] = await Promise.allSettled([
        axios.get(`${API}/resources/mine`),
        axios.get(`${API}/badges/mine`),
        axios.get(`${API}/certificates/mine`),
        axios.get(`${API}/badges/leaderboard`),
      ])
      if (resRes.status === 'fulfilled')   setResources(resRes.value.data.resources || [])
      if (badgeRes.status === 'fulfilled') setBadgeData(badgeRes.value.data)
      if (certRes.status === 'fulfilled')  setCertificates(certRes.value.data.certificates || [])
      if (lbRes.status === 'fulfilled')    setLeaderboard(lbRes.value.data.leaderboard || [])
    } catch {
      setMessage('Could not load some data.')
    } finally {
      setLoadingResources(false)
      setLoadingBadges(false)
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Resource form helpers ──────────────────────────────────────────────────
  const startEdit = (resource) => {
    setEditingId(resource._id)
    setForm({ title: resource.title || '', description: resource.description || '', category: resource.category || '', link: resource.link || '', image: resource.image || '' })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => { setEditingId(null); setForm(emptyForm) }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setForm(cur => ({ ...cur, image: dataUrl }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      if (editingId) {
        await axios.put(`${API}/resources/${editingId}`, form)
        setMessage('Resource updated successfully.')
      } else {
        await axios.post(`${API}/resources`, form)
        setMessage('Resource uploaded successfully.')
      }
      resetForm()
      await fetchAll()
    } catch (err) {
      setMessage(!err.response ? 'Could not reach server.' : err.response?.data?.error || 'Could not save resource.')
    } finally {
      setSubmitting(false)
    }
  }

  const removeResource = async (id) => {
    if (!confirm('Delete this resource?')) return
    try {
      await axios.delete(`${API}/resources/${id}`)
      setResources(items => items.filter(r => r._id !== id))
      setMessage('Resource deleted.')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not delete resource.')
    }
  }

  // ── Certificate download ──────────────────────────────────────────────────
  const downloadCertificate = async (cert) => {
    setDownloading(cert._id)
    try {
      const res = await axios.get(`${API}/certificates/${cert._id}/download`)
      const { imageData, badgeName } = res.data
      const link = document.createElement('a')
      link.href     = imageData
      link.download = `CodeCircle_${badgeName}_Certificate.png`
      link.click()
      // Mark downloaded in local state
      setCertificates(prev => prev.map(c => c._id === cert._id ? { ...c, downloaded: true } : c))
    } catch {
      setMessage('Could not download certificate.')
    } finally {
      setDownloading(null)
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const currentMonth = badgeData?.currentMonth
  const myRank       = leaderboard.findIndex(e => String(e.userId) === String(user?._id)) + 1 || null
  const profileUrl   = user ? `${window.location.origin}/u/${user.username || user._id}` : ''

  // Progress bar toward next badge
  const count        = currentMonth?.resourceCount || 0
  const nextTier     = currentMonth?.nextTier
  const nextTarget   = nextTier ? TIER_THRESHOLDS[nextTier.tier] : 10
  const progress     = nextTier ? Math.min((count / nextTarget) * 100, 100) : 100

  // Latest (highest tier) badge this month
  const latestBadge = badgeData?.badges?.find(b => {
    const now = new Date()
    return b.month === now.getMonth() + 1 && b.year === now.getFullYear()
  }) || null

  if (loading || !user) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo title="Dashboard" description="Manage your uploaded resources and contributions on CodeCircle." path="/dashboard" noindex />

      <div className="container-width space-y-10">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-text mb-3">Contributor Dashboard</p>
            <h1 className="heading-lg text-white">Hi, {user.name.split(' ')[0]} 👋</h1>
            <p className="body-muted mt-3 max-w-xl">
              Manage your resources, track your badge progress, and download your certificates.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowShare(true)} className="btn-ghost text-sm flex items-center gap-2">
              <Share2 size={14} /> Share Profile
            </button>
            <button onClick={() => navigate('/submit-resource')} className="btn-ghost text-sm flex items-center gap-2">
              <UploadCloud size={14} /> Upload resource
            </button>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total uploads', value: resources.length, icon: <Sparkles size={16} /> },
            { label: 'This month',    value: count,             icon: <Zap size={16} /> },
            { label: 'Leaderboard',   value: myRank ? `#${myRank}` : '—', icon: <Trophy size={16} /> },
            { label: 'Certificates',  value: certificates.length, icon: <Award size={16} /> },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-4 flex flex-col gap-2">
              <div className="text-neutral-600">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Badges & Certificates ─────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-medium text-lg flex items-center gap-2"><Award size={18} /> Badges & Certificates</h2>
              <p className="text-sm text-neutral-500 mt-1">Share 1, 5, or 10 resources per month to unlock badges.</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{count} resource{count !== 1 ? 's' : ''} shared this month</span>
              {nextTier && <span>Next: {nextTier.badgeName} at {nextTarget}</span>}
              {!nextTier && count >= 10 && <span className="text-yellow-400">👑 Max tier reached!</span>}
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  currentMonth?.currentTier?.tier === 'codeelite' ? 'bg-yellow-400' :
                  currentMonth?.currentTier?.tier === 'codeflame' ? 'bg-orange-400' :
                  'bg-violet-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-700">
              <span className="flex items-center gap-1"><Zap size={10} /> 1 Spark</span>
              <span className="flex items-center gap-1"><Flame size={10} /> 5 Catalyst</span>
              <span className="flex items-center gap-1"><Crown size={10} /> 10 Titan</span>
            </div>
          </div>

          {/* Badge grid — current month (if any) + all past */}
          {loadingBadges ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : badgeData?.badges?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badgeData.badges.map(badge => (
                <BadgeCard key={badge._id} tier={badge.tier} month={badge.month} year={badge.year} count={badge.resourceCount} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500 py-2">
              No badges yet. Share your first resource to earn the <span className="text-violet-400">⚡ Spark</span> badge!
            </div>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-neutral-600">Your certificates</div>
              {certificates.map(cert => {
                const meta = TIER_META[cert.tier]
                const monthName = new Date(cert.year, cert.month - 1).toLocaleString('default', { month: 'long' })
                return (
                  <motion.div
                    key={cert._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${meta?.bg} ${meta?.border}`}
                  >
                    {meta?.iconUrl ? (
                      <img src={meta.iconUrl} className="w-8 h-8 object-contain" alt={cert.badgeName} />
                    ) : (
                      <span className="text-2xl">{meta?.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${meta?.color}`}>{cert.badgeName}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{monthName} {cert.year} · {cert.resourceCount} resource{cert.resourceCount !== 1 ? 's' : ''}</div>
                      {cert.downloaded && <div className="text-xs text-green-500 mt-0.5">Already downloaded</div>}
                    </div>
                    <button
                      onClick={() => downloadCertificate(cert)}
                      disabled={downloading === cert._id}
                      className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Download size={12} />
                      {downloading === cert._id ? 'Downloading...' : 'Download'}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}

          {certificates.length === 0 && !loadingBadges && (
            <div className="text-xs text-neutral-600">
              Certificates are generated by the admin and will appear here once issued.
            </div>
          )}
        </div>

        {/* ── Resource Form + Uploads Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="glass rounded-2xl p-6 md:p-8 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-white font-medium text-lg">{editingId ? 'Edit your resource' : 'Upload a resource'}</h2>
                <p className="text-sm text-neutral-500 mt-1">{editingId ? 'Update the selected upload.' : 'Add a new contribution for the community.'}</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-ghost text-sm"><X size={14} /> Cancel</button>
              )}
            </div>

            <input required value={form.title} onChange={e => setForm(cur => ({ ...cur, title: e.target.value }))} placeholder="Title" className="input-base" />
            <textarea required value={form.description} onChange={e => setForm(cur => ({ ...cur, description: e.target.value }))} placeholder="Description" rows={4} className="input-base" />
            <select value={form.category} onChange={e => setForm(cur => ({ ...cur, category: e.target.value }))} className="input-base">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
            <input required value={form.link} onChange={e => setForm(cur => ({ ...cur, link: e.target.value }))} placeholder="Resource URL" className="input-base" />
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-600">Image upload</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="input-base file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-black hover:file:bg-neutral-100" />
              {form.image && <p className="text-xs text-neutral-500">Image selected.</p>}
            </div>

            {message && <div className="text-sm text-neutral-300">{message}</div>}

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                <Save size={14} /> {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Publish resource'}
              </button>
              <button type="button" onClick={resetForm} className="btn-ghost"><Plus size={14} /> New upload</button>
            </div>
          </motion.form>

          {/* Uploads list */}
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-medium text-lg">Your uploads</h2>
                <p className="text-sm text-neutral-500 mt-1">Everything you've shared so far.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Sparkles size={12} /> {resources.length} total
              </div>
            </div>

            {loadingResources ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : resources.length === 0 ? (
              <div className="text-sm text-neutral-500">You haven't uploaded any resources yet.</div>
            ) : (
              <div className="space-y-3 max-h-[680px] overflow-auto pr-1">
                {resources.map(resource => (
                  <div key={resource._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      {resource.image
                        ? <img src={resource.image} alt={resource.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        : <div className="w-14 h-14 rounded-lg bg-white/5 shrink-0" />
                      }
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{resource.title}</div>
                        <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{resource.description}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                          <span className="font-mono truncate">{resource.link}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => startEdit(resource)} className="btn-ghost text-xs"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => removeResource(resource._id)} className="btn-ghost text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Share Modal ───────────────────────────────────────────────────── */}
      {showShare && (
        <ShareCard
          user={user}
          badge={latestBadge}
          resourceCount={count}
          rank={myRank || null}
          profileUrl={profileUrl}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
